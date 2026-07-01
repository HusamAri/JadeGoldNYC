"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { metricFormSchema, type MetricFormValues } from "@/lib/validations/metric";
import { parseMoneyToCents } from "@/lib/money";
import { getPeriodSalesStats, type PeriodSalesStats } from "@/lib/db/queries/metrics";

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

function dateOrNull(s: string): string | null {
  return s.trim() ? s : null;
}

function roundRating(n: number | null): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
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

function toRow(v: MetricFormValues, stats: PeriodSalesStats) {
  return {
    period_label: v.period_label,
    period_start: dateOrNull(v.period_start),
    period_end: dateOrNull(v.period_end),
    visits: intOrNull(v.visits),
    orders: stats.orders,
    revenue_cents: stats.revenueCents,
    cart_abandon_amount_cents: moneyOrNull(v.cart_abandon_amount),
    cart_abandon_count: intOrNull(v.cart_abandon_count),
    rating: roundRating(stats.avgRating),
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
  const periodStart = dateOrNull(parsed.data.period_start);
  const periodEnd = dateOrNull(parsed.data.period_end);
  const stats = await getPeriodSalesStats(periodStart, periodEnd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_metrics")
    .insert({
      ...toRow(parsed.data, stats),
      org_id: m.org_id,
      created_by: m.user_id,
    })
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
  const periodStart = dateOrNull(parsed.data.period_start);
  const periodEnd = dateOrNull(parsed.data.period_end);
  const stats = await getPeriodSalesStats(periodStart, periodEnd);
  const supabase = await createClient();
  const { error } = await supabase
    .from("shop_metrics")
    .update(toRow(parsed.data, stats))
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/analizler");
  return { ok: true, id };
}

export interface PeriodStatsPreview {
  orders: number;
  revenueCents: number;
  avgRating: number | null;
  ratedCount: number;
}

/**
 * Dönem tarihleri girildiğinde formda canlı önizleme göstermek için — kayıt
 * yazmaz, yalnızca sales/reviews'ten otomatik hesaplanacak değerleri döner.
 */
export async function previewPeriodStats(
  periodStart: string,
  periodEnd: string,
): Promise<PeriodStatsPreview> {
  await requireMembership();
  const stats = await getPeriodSalesStats(dateOrNull(periodStart), dateOrNull(periodEnd));
  return {
    orders: stats.orders,
    revenueCents: stats.revenueCents,
    avgRating: stats.avgRating,
    ratedCount: stats.ratedCount,
  };
}

export async function deleteMetric(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("shop_metrics").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/analizler");
  return {};
}
