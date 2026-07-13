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
    .limit(limit + 20); // karar verilmişleri eleyeceğiz — biraz fazla çek
  const alerts = (data as (MarketPriceAlert & { researched_at: string })[] | null) ?? [];
  if (alerts.length === 0) return [];

  // Karar verilmiş uyarıları gizle: en güncel karar, bu araştırmadan SONRA
  // verilmişse (yani bu uyarıya cevaben) artık gösterme.
  const { data: decisions } = await supabase
    .from("latest_market_decision")
    .select("product_id, created_at")
    .in(
      "product_id",
      alerts.map((a) => a.product_id),
    );
  const decidedAt = new Map(
    ((decisions as { product_id: string; created_at: string }[] | null) ?? []).map(
      (d) => [d.product_id, d.created_at],
    ),
  );
  return alerts
    .filter((a) => {
      const dec = decidedAt.get(a.product_id);
      return !dec || new Date(dec) < new Date(a.researched_at);
    })
    .slice(0, limit);
}
