import { createClient } from "@/lib/supabase/server";
import type { ShopMetric } from "@/lib/types";

export interface PeriodSalesStats {
  orders: number;
  revenueCents: number;
  avgRating: number | null;
  ratedCount: number;
}

/**
 * Verilen dönem için `sales` (sipariş sayısı + ciro) ve `reviews` (ortalama puan)
 * tablolarından zaten senkronize edilmiş veriyi özetler. Analizler formundaki
 * orders/revenue/rating alanları artık elle girilmez, buradan türetilir.
 * periodStart/periodEnd null veya boşsa o yönde tarih filtresi uygulanmaz —
 * period_start/period_end şemada opsiyonel olduğu için dateOrNull() ile eşleşir.
 */
export async function getPeriodSalesStats(
  periodStart: string | null,
  periodEnd: string | null,
): Promise<PeriodSalesStats> {
  const supabase = await createClient();
  // period_end tarih-only (gün) bazlı gelir; timestamptz kolonlarda bitiş
  // gününün TAMAMINI dahil etmek için ertesi günün başlangıcından küçük
  // (exclusive lt) sınır kullanılır — sabit "T23:59:59.999" eki yerine
  // (saat/saniye ve zaman dilimi belirsizliği olmadan; star-seller.ts deseni).
  let endBoundary: string | null = null;
  if (periodEnd) {
    const next = new Date(`${periodEnd}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    endBoundary = next.toISOString();
  }

  let salesQuery = supabase
    .from("sales")
    .select("grand_total_cents, item_total_cents")
    .neq("status", "cancelled");
  if (periodStart) salesQuery = salesQuery.gte("order_date", periodStart);
  if (endBoundary) salesQuery = salesQuery.lt("order_date", endBoundary);
  const { data: salesRows, error: salesErr } = await salesQuery;
  // Hata sessizce "veri yok"a dönüşmesin — en azından yüzeye çıkar.
  if (salesErr) console.error("[metrics] sales sorgusu:", salesErr.message);
  const sales = (salesRows ?? []) as {
    grand_total_cents: number | null;
    item_total_cents: number | null;
  }[];

  const orders = sales.length;
  const revenueCents = sales.reduce(
    (a, s) => a + (s.grand_total_cents || s.item_total_cents || 0),
    0,
  );

  let reviewsQuery = supabase
    .from("reviews")
    .select("rating")
    .not("rating", "is", null);
  if (periodStart) reviewsQuery = reviewsQuery.gte("review_date", periodStart);
  if (endBoundary) reviewsQuery = reviewsQuery.lt("review_date", endBoundary);
  const { data: reviewRows, error: reviewsErr } = await reviewsQuery;
  if (reviewsErr) console.error("[metrics] reviews sorgusu:", reviewsErr.message);
  const ratings = ((reviewRows ?? []) as { rating: number | null }[])
    .map((r) => r.rating)
    .filter((r): r is number => r != null);

  const ratedCount = ratings.length;
  const avgRating = ratedCount
    ? Math.round((ratings.reduce((a, r) => a + r, 0) / ratedCount) * 10) / 10
    : null;

  return { orders, revenueCents, avgRating, ratedCount };
}

export async function listMetrics(): Promise<ShopMetric[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_metrics")
    .select("*")
    .order("period_end", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) console.error("[metrics] shop_metrics listesi:", error.message);
  return (data ?? []) as ShopMetric[];
}

export async function getMetric(id: string): Promise<ShopMetric | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_metrics")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[metrics] shop_metrics kaydı:", error.message);
  return (data as ShopMetric) ?? null;
}
