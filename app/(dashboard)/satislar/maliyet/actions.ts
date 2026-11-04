"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { parseMoneyToCents } from "@/lib/money";
import { COST_KIND_META, type ItemCostKind } from "@/lib/pnl";
import {
  saleItemCostBatchSchema,
  saleItemCostSchema,
  saleItemReturnSchema,
  type SaleItemCostBatchValues,
  type SaleItemCostValues,
  type SaleItemReturnValues,
} from "@/lib/validations/sale-item-cost";
import { EtsyClient } from "@/lib/etsy/client";
import { refreshRefundedReceipts } from "@/lib/etsy/refunds";
import { logAudit } from "@/lib/audit";

export interface ItemCostResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function revalidateAll(saleId?: string | null, productId?: string | null) {
  revalidatePath("/satislar/maliyet");
  revalidatePath("/maliyetler");
  revalidatePath("/panel");
  if (saleId) revalidatePath(`/satislar/${saleId}`);
  if (productId) revalidatePath(`/tasarimlar/listing/${productId}`);
}

interface ItemCtx {
  id: string;
  sale_id: string;
  product_id: string | null;
  title: string | null;
  quantity: number;
  currency: string;
  order_date: string;
}

async function loadItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  saleItemId: string,
): Promise<ItemCtx | null> {
  const { data, error } = await supabase
    .from("sale_items")
    .select("id, sale_id, product_id, title, quantity, currency, sales!inner(order_date)")
    .eq("id", saleItemId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    sale_id: string;
    product_id: string | null;
    title: string | null;
    quantity: number;
    currency: string;
    sales: { order_date: string };
  };
  return {
    id: row.id,
    sale_id: row.sale_id,
    product_id: row.product_id,
    title: row.title,
    quantity: row.quantity,
    currency: row.currency,
    order_date: row.sales.order_date,
  };
}

/**
 * Tek kalem × tek tür elle maliyet: upsert (var → güncelle, yok → ekle);
 * tutar boş/0 → elle giriş SİLİNİR (otomatik motor satırı varsa yeniden okunur).
 * Kısmi unique index PostgREST upsert'iyle eşleşmediğinden seç-sonra-yaz.
 */
async function writeKind(
  supabase: Awaited<ReturnType<typeof createClient>>,
  m: { org_id: string; user_id: string },
  item: ItemCtx,
  kind: ItemCostKind,
  amountCents: number,
  costDate: string,
  note: string | null,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("costs")
    .select("id")
    .eq("sale_item_id", item.id)
    .eq("cost_kind", kind)
    .eq("source", "manual")
    .maybeSingle();
  const existingId = (existing as { id: string } | null)?.id ?? null;

  if (amountCents <= 0) {
    if (existingId) {
      const { error } = await supabase.from("costs").delete().eq("id", existingId);
      if (error) return error.message;
    }
    return null;
  }

  const meta = COST_KIND_META[kind];
  const { data: cat } = await supabase
    .from("cost_categories")
    .select("id")
    .eq("org_id", m.org_id)
    .eq("key", meta.categoryKey)
    .maybeSingle();
  const categoryId = (cat as { id: string } | null)?.id ?? null;
  const description = `${meta.label} — ${(item.title ?? "kalem").slice(0, 60)}${
    item.quantity > 1 ? ` × ${item.quantity}` : ""
  }`;

  if (existingId) {
    const { error } = await supabase
      .from("costs")
      .update({
        amount_cents: amountCents,
        cost_date: costDate,
        notes: note,
        description,
        category_id: categoryId,
      })
      .eq("id", existingId);
    return error ? error.message : null;
  }
  const { error } = await supabase.from("costs").insert({
    org_id: m.org_id,
    category_id: categoryId,
    description,
    amount_cents: amountCents,
    currency: item.currency || "USD",
    cost_date: costDate,
    vendor: null,
    sale_id: item.sale_id,
    sale_item_id: item.id,
    source: "manual",
    cost_kind: kind,
    notes: note,
    created_by: m.user_id,
  });
  return error ? error.message : null;
}

export async function upsertSaleItemCost(
  values: SaleItemCostValues,
): Promise<ItemCostResult> {
  const parsed = saleItemCostSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const item = await loadItem(supabase, m.org_id, parsed.data.sale_item_id);
  if (!item) return { error: "Satış kalemi bulunamadı." };
  const cents = parseMoneyToCents(parsed.data.amount);
  const costDate = parsed.data.cost_date || item.order_date.slice(0, 10);
  const err = await writeKind(
    supabase,
    m,
    item,
    parsed.data.kind,
    cents,
    costDate,
    parsed.data.note || null,
  );
  if (err) return { error: err };
  revalidateAll(item.sale_id, item.product_id);
  return { ok: true };
}

/** Aynı kalem için birden çok tür tek seferde (satır düzenleyici). */
export async function upsertSaleItemCosts(
  values: SaleItemCostBatchValues,
): Promise<ItemCostResult> {
  const parsed = saleItemCostBatchSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const item = await loadItem(supabase, m.org_id, parsed.data.sale_item_id);
  if (!item) return { error: "Satış kalemi bulunamadı." };
  const costDate = item.order_date.slice(0, 10);
  const note = parsed.data.note || null;
  const kinds: ItemCostKind[] = ["gold", "labor", "gem", "packaging", "other"];
  for (const kind of kinds) {
    const raw = parsed.data[kind];
    // undefined = bu alana dokunulmadı; "" veya "0" = sil.
    if (raw === undefined) continue;
    const err = await writeKind(
      supabase,
      m,
      item,
      kind,
      parseMoneyToCents(raw),
      costDate,
      note,
    );
    if (err) return { error: `${COST_KIND_META[kind].label}: ${err}` };
  }
  revalidateAll(item.sale_id, item.product_id);
  return { ok: true };
}

/** İade/geri kazanım: ürün stoğa döndü mü + geri kazanılan değer (COGS'tan düşer). */
export async function setSaleItemReturn(
  values: SaleItemReturnValues,
): Promise<ItemCostResult> {
  const parsed = saleItemReturnSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const item = await loadItem(supabase, m.org_id, parsed.data.sale_item_id);
  if (!item) return { error: "Satış kalemi bulunamadı." };
  const recovered = parsed.data.returned ? parseMoneyToCents(parsed.data.recovered) : 0;
  const { error } = await supabase
    .from("sale_items")
    .update({
      returned_at: parsed.data.returned ? new Date().toISOString() : null,
      recovered_cents: Math.max(0, recovered),
      return_note: parsed.data.note || null,
    })
    .eq("id", item.id)
    .eq("org_id", m.org_id);
  if (error) return { error: error.message };
  revalidateAll(item.sale_id, item.product_id);
  return { ok: true };
}

/** Bağlanmamış Etsy ledger etiket kaydını (iade etiketi vb.) siparişe bağla. */
export async function linkLedgerEntryToSale(
  entryId: number,
  saleId: string,
  kind: "shipping_label" | "return_label" | "other" = "return_label",
): Promise<ItemCostResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("link_ledger_entry_to_sale", {
    p_entry_id: entryId,
    p_sale_id: saleId,
    p_kind: kind,
  });
  if (error) return { error: error.message };
  // Aylık özet bağlanan kaydı düşsün (çift sayım yok) — admin istemci gerekmez,
  // fonksiyon authenticated'a açık ve idempotent.
  await supabase.rpc("rebuild_etsy_ledger_costs", { p_org_id: m.org_id });
  revalidateAll(saleId);
  return { ok: true };
}

/** Siparişe bağlı dış kaydı (etiket) çöz — satır silinir, aylık özete geri döner. */
export async function unlinkSaleCost(costId: string): Promise<ItemCostResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const supabase = await createClient();
  const { data } = await supabase
    .from("costs")
    .select("id, sale_id, external_key")
    .eq("id", costId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  const row = data as { id: string; sale_id: string | null; external_key: string | null } | null;
  if (!row) return { error: "Kayıt bulunamadı." };
  if (!row.external_key) return { error: "Bu satır dış kayıt değil; Maliyetler'den silin." };
  const { error } = await supabase.from("costs").delete().eq("id", costId);
  if (error) return { error: error.message };
  if (row.external_key.startsWith("ledger:"))
    await supabase.rpc("rebuild_etsy_ledger_costs", { p_org_id: m.org_id });
  else if (row.external_key.startsWith("ss:"))
    await supabase.rpc("rebuild_shipstation_costs", { p_org_id: m.org_id });
  revalidateAll(row.sale_id);
  return { ok: true };
}

export interface RefundRefreshActionResult extends ItemCostResult {
  refreshed?: number;
  errors?: number;
  remaining?: boolean;
}

/**
 * İade verisini Etsy'den çek (durumu iade olup receipt gövdesi okunmamış
 * siparişler). Bütçeli; "kalan var" dönerse buton tekrar basılır/cron sürdürür.
 */
export async function refreshRefundsAction(): Promise<RefundRefreshActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const admin = createAdminClient();
  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const shopId = await client.requireShopId();
    const r = await refreshRefundedReceipts(admin, client, m.org_id, shopId, {
      budgetMs: 40_000,
    });
    // Etiket bağlama + aylık özet (iade etiketleri zamanla bağlanmaz; yine de
    // gidiş etiketleri yeni shipped_at'lerle bağlanabilir).
    try {
      await admin.rpc("rebuild_sale_shipping_label_costs", { p_org_id: m.org_id });
      await admin.rpc("rebuild_etsy_ledger_costs", { p_org_id: m.org_id });
      await admin.rpc("rebuild_sales_etsy_fees", { p_org_id: m.org_id });
    } catch {
      // yok say
    }
    await logAudit(admin, {
      orgId: m.org_id,
      action: "etsy.sync",
      entityType: "sales",
      summary: `İade geri doldurma: ${r.refreshed} sipariş yenilendi${
        r.errors ? `, ${r.errors} hata` : ""
      }${r.remaining ? " (devam edecek)" : ""}`,
      source: "etsy",
      actorLabel: "Etsy Sync",
    });
    revalidateAll();
    return { ok: true, ...r };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Etsy bağlantısı yok." };
  }
}
