import { createClient } from "@/lib/supabase/server";
import type { StarSellerSnapshot } from "@/lib/types";

export async function listStarSellerSnapshots(): Promise<StarSellerSnapshot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("star_seller_snapshots")
    .select("*")
    .order("period_end", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  // Hata sessizce "veri yok"a dönüşmesin — en azından yüzeye çıkar.
  if (error) console.error("[star-seller] snapshot listesi:", error.message);
  return (data ?? []) as StarSellerSnapshot[];
}

export async function getStarSellerSnapshot(
  id: string,
): Promise<StarSellerSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("star_seller_snapshots")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[star-seller] snapshot kaydı:", error.message);
  return (data as StarSellerSnapshot) ?? null;
}

export interface ReviewRatingStats {
  avgRating: number | null;
  lowReviewCount: number;
  ratedCount: number;
}

/**
 * Yorumlardan ortalama puan + düşük puan (≤3) sayısını hesaplar. Verilen
 * tarih aralığı (dönem) varsa ona göre; yoksa tüm yorumlar. Etsy'den elle
 * girilen değerle çapraz kontrol için otomatik öneri.
 */
export async function getReviewRatingStats(
  periodStart?: string | null,
  periodEnd?: string | null,
): Promise<ReviewRatingStats> {
  const supabase = await createClient();
  let query = supabase.from("reviews").select("rating, review_date");
  if (periodStart) query = query.gte("review_date", periodStart);
  if (periodEnd) {
    // review_date timestamptz; bitiş gününün TAMAMINI dahil etmek için
    // ertesi günün başlangıcından küçük (exclusive) sınır kullan — sabit
    // "T23:59:59" eki yerine (saat/saniye ve zaman dilimi belirsizliği olmadan).
    const next = new Date(`${periodEnd}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    query = query.lt("review_date", next.toISOString());
  }
  const { data, error } = await query;
  if (error) console.error("[star-seller] reviews sorgusu:", error.message);
  const rows = (data ?? []) as { rating: number | null }[];
  const rated = rows.filter((r) => r.rating != null) as { rating: number }[];
  const ratedCount = rated.length;
  const avgRating = ratedCount
    ? Math.round((rated.reduce((a, r) => a + r.rating, 0) / ratedCount) * 10) /
      10
    : null;
  const lowReviewCount = rated.filter((r) => r.rating <= 3).length;
  return { avgRating, lowReviewCount, ratedCount };
}
