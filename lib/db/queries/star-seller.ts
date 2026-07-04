import { createClient } from "@/lib/supabase/server";
import type { StarSellerSnapshot } from "@/lib/types";

export async function listStarSellerSnapshots(): Promise<StarSellerSnapshot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("star_seller_snapshots")
    .select("*")
    .order("period_end", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as StarSellerSnapshot[];
}

export async function getStarSellerSnapshot(
  id: string,
): Promise<StarSellerSnapshot | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("star_seller_snapshots")
    .select("*")
    .eq("id", id)
    .maybeSingle();
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
  if (periodEnd) query = query.lte("review_date", `${periodEnd}T23:59:59`);
  const { data } = await query;
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
