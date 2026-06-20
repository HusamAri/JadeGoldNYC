import { createClient } from "@/lib/supabase/server";
import type { ProductMetric } from "@/lib/types";

export async function listProductPeriods(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_metrics")
    .select("period_label")
    .order("period_label", { ascending: false });
  const seen = new Set<string>();
  for (const r of (data ?? []) as { period_label: string }[]) seen.add(r.period_label);
  return [...seen];
}

export async function listProductMetrics(
  period?: string,
): Promise<ProductMetric[]> {
  const supabase = await createClient();
  let query = supabase.from("product_metrics").select("*");
  if (period) query = query.eq("period_label", period);
  query = query
    .order("revenue_cents", { ascending: false, nullsFirst: false })
    .order("views", { ascending: false, nullsFirst: false });
  const { data } = await query;
  return (data ?? []) as ProductMetric[];
}

export async function getProductMetric(
  id: string,
): Promise<ProductMetric | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_metrics")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as ProductMetric) ?? null;
}
