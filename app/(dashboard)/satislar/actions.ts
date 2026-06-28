"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { saleFormSchema, type SaleFormValues } from "@/lib/validations/sale";
import { parseMoneyToCents } from "@/lib/money";
import { createGoldCostForSale } from "@/lib/gold-cost-entry";

export interface SaleActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function toRow(values: SaleFormValues) {
  const row = {
    order_no: values.order_no || null,
    buyer_name: values.buyer_name || null,
    buyer_email: values.buyer_email || null,
    status: values.status,
    order_date: new Date(values.order_date).toISOString(),
    ship_country: values.ship_country || null,
    item_total_cents: parseMoneyToCents(values.item_total),
    shipping_cents: parseMoneyToCents(values.shipping),
    tax_cents: parseMoneyToCents(values.tax),
    discount_cents: parseMoneyToCents(values.discount),
    etsy_fees_cents: parseMoneyToCents(values.etsy_fees),
    grand_total_cents: parseMoneyToCents(values.grand_total),
    currency: (values.currency || "USD").toUpperCase(),
    notes: values.notes || null,
  };
  if (!row.grand_total_cents) {
    row.grand_total_cents =
      row.item_total_cents +
      row.shipping_cents +
      row.tax_cents -
      row.discount_cents;
  }
  return row;
}

export async function createSale(
  values: SaleFormValues,
): Promise<SaleActionResult> {
  const parsed = saleFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .insert({
      ...toRow(parsed.data),
      org_id: m.org_id,
      source: "manual",
      created_by: m.user_id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const saleId = (data as { id: string }).id;

  // Altın maliyet kalemlerini otomatik oluştur (arka planda, hatayı yut)
  createGoldCostForSale(supabase, saleId, m.org_id).catch(() => {});

  revalidatePath("/satislar");
  revalidatePath("/maliyetler");
  revalidatePath("/panel");
  return { ok: true, id: saleId };
}

export async function updateSale(
  id: string,
  values: SaleFormValues,
): Promise<SaleActionResult> {
  const parsed = saleFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sales")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/satislar");
  revalidatePath(`/satislar/${id}`);
  revalidatePath("/panel");
  return { ok: true, id };
}

export async function deleteSale(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/satislar");
  revalidatePath("/panel");
  return {};
}
