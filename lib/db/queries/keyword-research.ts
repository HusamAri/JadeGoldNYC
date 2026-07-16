import { createClient } from "@/lib/supabase/server";
import type {
  BandSource,
  CompetitorRow,
  VariantComparison,
} from "@/lib/etsy/keyword-research";

/** Bir listing için son rekabet araştırması anlık görüntüsü. */
export interface KeywordResearchSnapshot {
  id: string;
  product_id: string;
  keyword: string;
  researched_at: string;
  our_price_cents: number | null;
  currency: string;
  result_count: number;
  min_cents: number | null;
  max_cents: number | null;
  avg_cents: number | null;
  median_cents: number | null;
  our_rank_pct: number | null;
  results: CompetitorRow[];
  variant_comparison: VariantComparison[] | null;
  // Gram-normalize pazar konumu (0076) — günlük rutin doldurur.
  our_per_gram_cents: number | null;
  market_low_per_gram_cents: number | null;
  market_avg_per_gram_cents: number | null;
  market_high_per_gram_cents: number | null;
  melt_per_gram_cents: number | null;
  price_position: "pahali" | "ucuz" | "bantta" | "belirsiz" | null;
  deviation_pct: number | null;
  confidence: "yuksek" | "orta" | "dusuk" | null;
  recommendation: string | null;
  // Yapılandırılmış hüküm + veri temeli (0091) — eski kayıtlarda null.
  verdict_what: string | null;
  verdict_why: string | null;
  verdict_action: string | null;
  basis_note: string | null;
  data_suspect: boolean | null;
  band_source: BandSource | null;
  /** 0095: bandın kurulduğu rakip sayısı (rakip setiyle organikten ayrışır);
   *  eski kayıtlarda null → result_count'a düşülür. */
  band_result_count: number | null;
}

/** Listing'in araştırma kelimesi meta bilgisi (editör önizlemesi için). */
export interface ProductResearchMeta {
  research_keyword: string | null;
  tags: string[] | null;
  price_cents: number | null;
}

export async function getProductResearchMeta(
  productId: string,
): Promise<ProductResearchMeta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("research_keyword, tags, price_cents")
    .eq("id", productId)
    .maybeSingle();
  if (error)
    console.error("keyword-research: ürün meta sorgusu hatası:", error.message);
  return (data as ProductResearchMeta | null) ?? null;
}

/** Verilen ürünün EN GÜNCEL araştırma anlık görüntüsü (RLS: org üyesi). */
export async function getLatestKeywordResearch(
  productId: string,
): Promise<KeywordResearchSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("keyword_research")
    .select("*")
    .eq("product_id", productId)
    .order("researched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    console.error("keyword-research: snapshot sorgusu hatası:", error.message);
  return (data as KeywordResearchSnapshot | null) ?? null;
}

// ── "Ucuzsa neden satamıyoruz" teşhisi (0091 · 1d) ──────────────────────
// Ürünün görüntülenme/satış gerçeği: fiyat uygunken satış yoksa sorun fiyat
// değildir — ya dönüşüm (görsel/başlık) ya görünürlük (SEO/reklam) sorunudur.

/** "Görüntülenme yüksek" eşiği — ömür boyu Etsy görüntülenme toplamı. */
const HIGH_VIEWS_THRESHOLD = 200;

export interface ProductDemandSignal {
  /** products.views — Etsy ömür boyu görüntülenme (senkron doldurur). */
  views: number | null;
  /** İptal hariç ömürlük satılan kalem sayısı (sale_items). */
  lifetime_units: number;
}

/**
 * Hafif talep sinyali sorgusu: products.views + sale_items tam sayımı
 * (head+count — satır çekilmez). Kalem eşleşmesi listing detayındaki desenle
 * aynı: product_id VEYA etsy_listing_id; iptal edilen siparişler hariç.
 */
export async function getProductDemandSignal(
  productId: string,
): Promise<ProductDemandSignal | null> {
  const supabase = await createClient();
  const { data: p, error: pError } = await supabase
    .from("products")
    .select("views, etsy_listing_id")
    .eq("id", productId)
    .maybeSingle();
  if (pError) {
    console.error("keyword-research: talep sinyali (ürün) hatası:", pError.message);
    return null;
  }
  if (!p) return null;
  const row = p as { views: number | null; etsy_listing_id: number | null };

  let q = supabase
    .from("sale_items")
    .select("id, sales!inner(status)", { count: "exact", head: true })
    .neq("sales.status", "cancelled");
  q =
    row.etsy_listing_id != null
      ? q.or(
          `product_id.eq.${productId},etsy_listing_id.eq.${row.etsy_listing_id}`,
        )
      : q.eq("product_id", productId);
  const { count, error: cError } = await q;
  if (cError)
    console.error("keyword-research: talep sinyali (satış) hatası:", cError.message);

  return { views: row.views, lifetime_units: count ?? 0 };
}

export interface DemandDiagnosis {
  kind: "donusum" | "gorunurluk";
  text: string;
}

/**
 * Teşhis (yalnız position 'ucuz'/'bantta' iken anlamlı): görüntülenme yüksek +
 * satış yoksa sorun fiyat değil DÖNÜŞÜM; görüntülenme de düşükse GÖRÜNÜRLÜK.
 * Satış varsa ya da views senkronlanmamışsa teşhis üretilmez (null).
 */
export function diagnoseDemand(
  signal: ProductDemandSignal | null,
): DemandDiagnosis | null {
  if (!signal || signal.views == null) return null;
  if (signal.lifetime_units > 0) return null; // satış var — fiyat-dışı teşhis gerekmez
  if (signal.views >= HIGH_VIEWS_THRESHOLD) {
    return {
      kind: "donusum",
      text: `${signal.views} görüntülenmeye rağmen hiç satış yok — sorun fiyat değil, DÖNÜŞÜM: ilk fotoğrafı, başlığı ve görselleri gözden geçir.`,
    };
  }
  return {
    kind: "gorunurluk",
    text: `Görüntülenme de düşük (${signal.views}) — fiyattan önce GÖRÜNÜRLÜK sorunu: SEO (etiket/başlık) ya da reklamla trafik gerekiyor.`,
  };
}

// ── Rakip seti görünümü (0091) — kart için son fiyat + önceki kayda göre değişim ──

export interface CompetitorWatchItem {
  id: string;
  competitor_listing_id: number;
  shop_name: string | null;
  title: string | null;
  url: string | null;
  /** Rakibin kimlik rengi (kart + matris örtüsünde nokta); null → paletten türetilir. */
  color: string | null;
  last_price_cents: number | null;
  last_currency: string | null;
  /** Etsy listing durumu ('active', ...) | 'gone' (listing kalkmış). */
  last_state: string | null;
  last_captured_at: string | null;
  /** Son kayıttan ÖNCEKİ fiyatlı kayıt — "değişim neye oranla" sorusunun cevabı. */
  prev_price_cents: number | null;
  prev_captured_at: string | null;
}

interface WatchDbRow {
  id: string;
  competitor_listing_id: number;
  shop_name: string | null;
  title: string | null;
  url: string | null;
  color: string | null;
}

interface WatchPriceDbRow {
  watch_id: string;
  price_cents: number | null;
  currency: string;
  state: string | null;
  captured_at: string;
}

/** Ürünün aktif rakip seti — izleme başına son fiyat + önceki fiyat (RLS). */
export async function listCompetitorWatch(
  productId: string,
): Promise<CompetitorWatchItem[]> {
  const supabase = await createClient();
  const { data: wData, error: wError } = await supabase
    .from("competitor_watch")
    .select("id, competitor_listing_id, shop_name, title, url, color")
    .eq("product_id", productId)
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (wError) {
    console.error("competitor_watch sorgusu hatası:", wError.message);
    return [];
  }
  const watches = (wData ?? []) as WatchDbRow[];
  if (watches.length === 0) return [];

  const { data: pData, error: pError } = await supabase
    .from("competitor_prices")
    .select("watch_id, price_cents, currency, state, captured_at")
    .in(
      "watch_id",
      watches.map((w) => w.id),
    )
    .order("captured_at", { ascending: false })
    .limit(400);
  if (pError)
    console.error("competitor_prices sorgusu hatası:", pError.message);

  // İzleme başına en yeni birkaç kayıt yeter (son + önceki fiyatlı).
  const byWatch = new Map<string, WatchPriceDbRow[]>();
  for (const p of (pData ?? []) as WatchPriceDbRow[]) {
    const arr = byWatch.get(p.watch_id) ?? [];
    if (arr.length < 10) arr.push(p);
    byWatch.set(p.watch_id, arr);
  }

  return watches.map((w) => {
    const rows = byWatch.get(w.id) ?? [];
    const last = rows[0] ?? null;
    const prev = rows.slice(1).find((r) => r.price_cents != null) ?? null;
    return {
      id: w.id,
      competitor_listing_id: w.competitor_listing_id,
      shop_name: w.shop_name,
      title: w.title,
      url: w.url,
      color: w.color,
      last_price_cents: last?.price_cents ?? null,
      last_currency: last?.currency ?? null,
      last_state: last?.state ?? null,
      last_captured_at: last?.captured_at ?? null,
      prev_price_cents: prev?.price_cents ?? null,
      prev_captured_at: prev?.captured_at ?? null,
    };
  });
}
