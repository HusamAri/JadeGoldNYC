import { createClient } from "@/lib/supabase/server";
import type { Product, ProductMetric } from "@/lib/types";

/** Liste satırı: eşlenen Etsy ürününün senkron görüntülenme toplamı iliştirilir. */
export type ProductMetricListRow = ProductMetric & {
  product: Pick<Product, "title" | "views"> | null;
};

export async function listProductPeriods(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_metrics")
    .select("period_label")
    .order("period_label", { ascending: false });
  if (error) console.error("[metrics] listProductPeriods:", error.message);
  const seen = new Set<string>();
  for (const r of (data ?? []) as { period_label: string }[]) seen.add(r.period_label);
  return [...seen];
}

export async function listProductMetrics(
  period?: string,
): Promise<ProductMetricListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("product_metrics")
    .select("*, product:products(title, views)");
  if (period) query = query.eq("period_label", period);
  query = query
    .order("revenue_cents", { ascending: false, nullsFirst: false })
    .order("views", { ascending: false, nullsFirst: false });
  const { data, error } = await query;
  if (error) console.error("[metrics] listProductMetrics:", error.message);
  return (data ?? []) as ProductMetricListRow[];
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
