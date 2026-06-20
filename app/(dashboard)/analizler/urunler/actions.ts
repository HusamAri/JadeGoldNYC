"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import {
  productMetricFormSchema,
  type ProductMetricFormValues,
} from "@/lib/validations/product-metric";
import { parseMoneyToCents } from "@/lib/money";

export interface ProductMetricActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function intOrNull(s: string): number | null {
  const v = s.trim();
  if (!v) return null;
  const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}
function moneyOrNull(s: string): number | null {
  return s.trim() ? parseMoneyToCents(s) : null;
}

function toRow(v: ProductMetricFormValues) {
  return {
    period_label: v.period_label,
    product_title: v.product_title,
    sku: v.sku || null,
    views: intOrNull(v.views),
    orders: intOrNull(v.orders),
    revenue_cents: moneyOrNull(v.revenue),
    ads_clicks: intOrNull(v.ads_clicks),
    ads_spend_cents: moneyOrNull(v.ads_spend),
    ads_revenue_cents: moneyOrNull(v.ads_revenue),
    notes: v.notes || null,
  };
}

export async function createProductMetric(
  values: ProductMetricFormValues,
): Promise<ProductMetricActionResult> {
  const parsed = productMetricFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_metrics")
    .insert({ ...toRow(parsed.data), org_id: m.org_id, created_by: m.user_id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/analizler/urunler");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateProductMetric(
  id: string,
  values: ProductMetricFormValues,
): Promise<ProductMetricActionResult> {
  const parsed = productMetricFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_metrics")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/analizler/urunler");
  return { ok: true, id };
}

export async function deleteProductMetric(
  id: string,
): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("product_metrics").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/analizler/urunler");
  return {};
}
