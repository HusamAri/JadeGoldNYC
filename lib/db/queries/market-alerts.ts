import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";

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

  const undecided = await filterUndecided(supabase, alerts);
  return undecided.slice(0, limit);
}

/** Karar verilmiş uyarıları ele: en güncel karar bu araştırmadan SONRAYSA
 *  (yani uyarıya cevaben verildiyse) uyarı kapanmış sayılır. Karar sorgusu
 *  ürün-id listesini parçalara böler — büyük kümede .in() URL sınırına
 *  takılmasın. */
async function filterUndecided<
  T extends { product_id: string; researched_at: string },
>(supabase: Awaited<ReturnType<typeof createClient>>, alerts: T[]): Promise<T[]> {
  const ids = [...new Set(alerts.map((a) => a.product_id))];
  const decidedAt = new Map<string, string>();
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data: decisions } = await supabase
      .from("latest_market_decision")
      .select("product_id, created_at")
      .in("product_id", ids.slice(i, i + CHUNK));
    for (const d of (decisions as { product_id: string; created_at: string }[] | null) ??
      []) {
      decidedAt.set(d.product_id, d.created_at);
    }
  }
  return alerts.filter((a) => {
    const dec = decidedAt.get(a.product_id);
    return !dec || new Date(dec) < new Date(a.researched_at);
  });
}

export interface MarketAlertCounts {
  total: number;
  pahali: number;
  ucuz: number;
}

/**
 * Bant dışı listing SAYILARI — Uyarı Merkezi başlığı için. Görüntüleme
 * limitinden bağımsız TÜM açık uyarıları sayar (limit'li liste sorgusundan
 * türetilen sayı 50'de doyuyordu); dar kolon seçer, aynı karar filtresini
 * uygular.
 */
export async function getMarketAlertCounts(
  orgId: string,
): Promise<MarketAlertCounts> {
  const supabase = await createClient();
  // Sayfalı tam çekim — tek select PostgREST'in ilk sayfasında (1000) kalır,
  // sayaç yine sessizce doyardı; tüm satırlar karar filtresinden geçmeli.
  const rows = await fetchAllPages<{
    product_id: string;
    researched_at: string;
    price_position: "pahali" | "ucuz";
  }>((from, to) =>
    supabase
      .from("market_price_alerts")
      .select("product_id, researched_at, price_position")
      .eq("org_id", orgId)
      .eq("status", "active")
      .in("price_position", ["pahali", "ucuz"])
      .order("product_id", { ascending: true })
      .range(from, to),
  );
  if (rows.length === 0) return { total: 0, pahali: 0, ucuz: 0 };
  const open = await filterUndecided(supabase, rows);
  const pahali = open.filter((r) => r.price_position === "pahali").length;
  return { total: open.length, pahali, ucuz: open.length - pahali };
}
