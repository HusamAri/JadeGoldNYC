"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { MappedSale } from "@/lib/csv/types";

export interface CommitImportResult {
  ok?: boolean;
  imported?: number;
  skipped?: number;
  error?: string;
}

export async function commitSalesImport(input: {
  filename: string;
  template: string;
  sales: MappedSale[];
}): Promise<CommitImportResult> {
  const m = await requireMembership();
  const supabase = await createClient();

  if (!input.sales.length) {
    return { error: "İçe aktarılacak satır bulunamadı." };
  }

  const { data: batch, error: be } = await supabase
    .from("csv_imports")
    .insert({
      org_id: m.org_id,
      module: "sales",
      filename: input.filename,
      mapping_template: input.template,
      status: "previewed",
      row_count: input.sales.length,
      created_by: m.user_id,
      raw_preview: input.sales.slice(0, 20),
    })
    .select("id")
    .single();
  if (be) return { error: be.message };
  const importId = (batch as { id: string }).id;

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of input.sales) {
    const saleRow = {
      org_id: m.org_id,
      source: "csv",
      etsy_receipt_id: s.etsy_receipt_id,
      order_no: s.order_no,
      buyer_name: s.buyer_name,
      buyer_email: s.buyer_email,
      status: s.status,
      order_date: s.order_date,
      ship_country: s.ship_country,
      item_total_cents: s.item_total_cents,
      shipping_cents: s.shipping_cents,
      tax_cents: s.tax_cents,
      discount_cents: s.discount_cents,
      etsy_fees_cents: s.etsy_fees_cents,
      grand_total_cents: s.grand_total_cents,
      currency: s.currency,
      csv_import_id: importId,
      created_by: m.user_id,
    };

    let saleId: string | null = null;
    if (s.etsy_receipt_id != null) {
      const { data, error } = await supabase
        .from("sales")
        .upsert(saleRow, { onConflict: "org_id,etsy_receipt_id" })
        .select("id")
        .single();
      if (error) {
        errors.push(error.message);
        skipped++;
        continue;
      }
      saleId = (data as { id: string }).id;
    } else {
      const { data, error } = await supabase
        .from("sales")
        .insert(saleRow)
        .select("id")
        .single();
      if (error) {
        errors.push(error.message);
        skipped++;
        continue;
      }
      saleId = (data as { id: string }).id;
    }
    imported++;

    if (saleId && s.items.length) {
      // Yeniden içe aktarmada çift kalem olmaması için önce mevcut kalemleri sil.
      await supabase.from("sale_items").delete().eq("sale_id", saleId);
      const itemRows = s.items.map((it) => ({
        org_id: m.org_id,
        sale_id: saleId,
        etsy_transaction_id: it.etsy_transaction_id,
        title: it.title,
        sku: it.sku,
        quantity: it.quantity,
        unit_price_cents: it.unit_price_cents,
        line_total_cents: it.line_total_cents,
        currency: it.currency,
      }));
      const { error: ie } = await supabase.from("sale_items").insert(itemRows);
      if (ie) errors.push(ie.message);
    }
  }

  await supabase
    .from("csv_imports")
    .update({
      status: "committed",
      imported_count: imported,
      skipped_count: skipped,
      error_log: errors.length ? errors.slice(0, 50) : null,
      committed_at: new Date().toISOString(),
    })
    .eq("id", importId);

  await logAudit(supabase, {
    orgId: m.org_id,
    action: "csv.import",
    entityType: "csv_import",
    entityId: importId,
    summary: `CSV içe aktarma: ${imported} satış eklendi/güncellendi${
      skipped ? `, ${skipped} atlandı` : ""
    }`,
    source: "csv",
    diff: { imported, skipped, filename: input.filename, template: input.template },
  });

  revalidatePath("/satislar");
  revalidatePath("/panel");
  return { ok: true, imported, skipped };
}
