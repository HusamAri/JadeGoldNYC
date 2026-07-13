import { createClient } from "@/lib/supabase/server";

/** Pazar konumu uyarısı — `market_price_alerts` görünümünden (en güncel araştırma). */
export interface MarketPriceAlert {
  product_id: string;
  etsy_listing_id: number | null;
  title: string;
  researched_at: string;
  keyword: string;
  result_count: number;
  our_per_gram_cents: number | null;
  market_low_per_gram_cents: number | null;
  market_avg_per_gram_cents: number | null;
  market_high_per_gram_cents: number | null;
  /** 'pahali' | 'ucuz' — bant dışı konum. */
  price_position: "pahali" | "ucuz";
  /** Banda göre sapma (ör. 0.23 = %23 pahalı). */
  deviation_pct: number | null;
  confidence: "yuksek" | "orta" | "dusuk" | null;
  recommendation: string | null;
}

/**
 * Ana panel uyarıları: son pazar araştırmasında bant DIŞI kalan aktif
 * listingler (pahalı ya da çok ucuz). Günlük pazar araştırması rutini
 * `keyword_research`e yazar; bu sorgu ürün başına en güncel kaydı okur.
 * En büyük sapma önce gelir.
 */
export async function getMarketPriceAlerts(
  orgId: string,
  limit = 8,
): Promise<MarketPriceAlert[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("market_price_alerts")
    .select(
      "product_id, etsy_listing_id, title, researched_at, keyword, result_count, our_per_gram_cents, market_low_per_gram_cents, market_avg_per_gram_cents, market_high_per_gram_cents, price_position, deviation_pct, confidence, recommendation",
    )
    .eq("org_id", orgId)
    .eq("status", "active")
    .in("price_position", ["pahali", "ucuz"])
    .order("deviation_pct", { ascending: false })
    .limit(limit);
  return (data as MarketPriceAlert[] | null) ?? [];
}
