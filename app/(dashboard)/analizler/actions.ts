"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { metricFormSchema, type MetricFormValues } from "@/lib/validations/metric";
import { parseMoneyToCents } from "@/lib/money";

export interface MetricActionResult {
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

function ratingOrNull(s: string): number | null {
  const v = s.trim();
  if (!v) return null;
  const n = parseFloat(v.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
}

function dateOrNull(s: string): string | null {
  return s.trim() ? s : null;
}

function trafficOrNull(v: MetricFormValues): Record<string, number> | null {
  const entries: [string, number | null][] = [
    ["etsy_app", intOrNull(v.src_etsy_app)],
    ["etsy_marketing", intOrNull(v.src_etsy_marketing)],
    ["etsy_ads", intOrNull(v.src_etsy_ads)],
    ["direct", intOrNull(v.src_direct)],
    ["etsy_search", intOrNull(v.src_etsy_search)],
    ["social", intOrNull(v.src_social)],
  ];
  const obj: Record<string, number> = {};
  for (const [k, n] of entries) if (n != null) obj[k] = n;
  return Object.keys(obj).length ? obj : null;
}

function toRow(v: MetricFormValues) {
  return {
    period_label: v.period_label,
    period_start: dateOrNull(v.period_start),
    period_end: dateOrNull(v.period_end),
    visits: intOrNull(v.visits),
    orders: intOrNull(v.orders),
    revenue_cents: moneyOrNull(v.revenue),
    cart_abandon_amount_cents: moneyOrNull(v.cart_abandon_amount),
    cart_abandon_count: intOrNull(v.cart_abandon_count),
    rating: ratingOrNull(v.rating),
    ads_spend_cents: moneyOrNull(v.ads_spend),
    ads_revenue_cents: moneyOrNull(v.ads_revenue),
    traffic_sources: trafficOrNull(v),
    notes: v.notes || null,
  };
}

export async function createMetric(
  values: MetricFormValues,
): Promise<MetricActionResult> {
  const parsed = metricFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_metrics")
    .insert({ ...toRow(parsed.data), org_id: m.org_id, created_by: m.user_id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/analizler");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateMetric(
  id: string,
  values: MetricFormValues,
): Promise<MetricActionResult> {
  const parsed = metricFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("shop_metrics")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/analizler");
  return { ok: true, id };
}

export async function deleteMetric(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("shop_metrics").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/analizler");
  return {};
}
