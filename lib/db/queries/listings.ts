import { createClient } from "@/lib/supabase/server";
import {
  variantPropertyParts,
  type RawVariantProperties,
} from "@/lib/variant-properties";
import {
  sortListingsBySkuDesc,
  sortVariantsByWidthThenSize,
} from "@/lib/variant-sort";

/**
 * Listing Komuta Merkezi — veri katmanı.
 * Yalnız sunucu tarafında kullanılır (createClient = RLS'li istemci; org
 * kapsamı RLS politikalarıyla sağlanır). Kontratlar LCC brief G1 ile birebirdir;
 * G2 (indeks sayfası) ve G3 (detay sayfası) bu tiplere kodlar.
 */

// ── Kontrat tipleri ──────────────────────────────────────────────────

export interface ListingIndexRow {
  id: string;
  etsy_listing_id: number | null;
  /** Ürün-seviye (aile) SKU — liste sırası buna göre (büyük/yeni üstte). */
  sku: string | null;
  title: string;
  status: string | null; // 'active' | 'draft' | ...
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  quantity: number | null;
  num_images: number | null;
  variant_count: number;
  missing_weight_count: number; // weight_grams null olan varyant sayısı
  research_keyword: string | null;
  has_research: boolean; // keyword_research kaydı var mı
  ads30_spend_cents: number | null; // period_label ilike '%son 30%' toplamı
  ads30_orders: number | null;
}

export interface ListingVariantRow {
  sku: string;
  name: string | null;
  /** properties values join(' · ') || name || sku */
  label: string;
  price_cents: number | null;
  quantity: number | null;
  weight_grams: number | null;
  weight_source: string | null;
  active: boolean | null;
}

export interface ListingAds {
  son30: {
    spend_cents: number;
    revenue_cents: number;
    clicks: number;
    orders: number;
    views: number;
  } | null;
  lifetime_metrics: {
    spend_cents: number;
    revenue_cents: number;
    clicks: number;
    orders: number;
    views: number;
    periods: number;
  };
  periods: {
    period_label: string;
    views: number | null;
    orders: number | null;
    revenue_cents: number | null;
    ads_spend_cents: number | null;
    ads_revenue_cents: number | null;
  }[];
}

export interface ListingLifetimeSales {
  orders: number;
  units: number;
  revenue_cents: number;
}

export interface ListingGaps {
  missing_weights: number;
  total_variants: number;
  /**
   * Varyantı OLMAYAN listing'de ürün gramajı (products.weight_grams) da yoksa
   * true. Varyantlı listing'de gram bütünlüğü `missing_weights` ile ölçülür;
   * bu bayrak yalnız tek-parça (varyantsız) listing'in gram boşluğunu yakalar —
   * yoksa gramsız listing sessizce "künye tam" görünürdü.
   */
  no_weight: boolean;
  no_research_keyword: boolean;
  no_description: boolean;
  no_tags: boolean;
  no_materials: boolean;
  no_image: boolean;
  unpriced_variants: number;
}

export interface ListingDetail {
  product: {
    id: string;
    etsy_listing_id: number | null;
    title: string;
    status: string | null;
    description: string | null;
    tags: string[] | null;
    materials: string[] | null;
    price_cents: number | null;
    currency: string;
    quantity: number | null;
    url: string | null;
    image_url: string | null;
    num_images: number | null;
    research_keyword: string | null;
    sku: string | null;
    weight_grams: number | null;
  };
  variants: ListingVariantRow[];
  ads: ListingAds;
  /** sale_items (etsy_listing_id VEYA product_id eşleşen; sales.status <> 'cancelled') */
  lifetimeSales: ListingLifetimeSales;
  gaps: ListingGaps;
}

// ── Yardımcılar ──────────────────────────────────────────────────────

/** PostgREST `.or()` filtresine güvenli giriş için temizler. */
function sanitize(term: string): string {
  return term.replace(/[,()%*]/g, " ").trim();
}

const PAGE_SIZE = 1000;

export interface PageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/**
 * PostgREST varsayılan satır limitini (1000) aşan kümeler için sayfalı toplu
 * okuma. Her sayfada TAZE builder kurulmalı (aynı builder'da range tekrar
 * çağrılamaz); deterministik sıra için sorguya `.order(...)` verilmelidir.
 * (Diğer sorgu modülleri de kullanır — ör. market-alerts sayımları.)
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

function sumField<T>(rows: T[], pick: (r: T) => number | null | undefined): number {
  let total = 0;
  for (const r of rows) total += pick(r) ?? 0;
  return total;
}

/** "Etsy Ads · son 30g" gibi son-30-gün dönem etiketi mi? (ilike '%son 30%') */
function isSon30(label: string): boolean {
  return label.toLowerCase().includes("son 30");
}

/**
 * property_values → okunur varyant etiketi; yoksa name, o da yoksa SKU.
 * `properties` iki şekilde gelebilir (Etsy dizisi VEYA EON düz nesnesi) —
 * `variantPropertyParts` ikisini de güvenle indirger (nesnede `.map` çökerdi).
 */
function variantLabel(v: {
  sku: string;
  name: string | null;
  properties: RawVariantProperties;
}): string {
  const parts = variantPropertyParts(v.properties);
  if (parts.length) return parts.join(" · ");
  return (v.name ?? "").trim() || v.sku;
}

// ── DB satır tipleri (dar cast'ler) ──────────────────────────────────

interface ProductIndexDbRow {
  id: string;
  etsy_listing_id: number | null;
  sku: string | null;
  title: string;
  status: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string | null;
  quantity: number | null;
  num_images: number | null;
  research_keyword: string | null;
}

interface VariantAggDbRow {
  product_id: string | null;
  weight_grams: number | null;
}

interface Ads30DbRow {
  product_id: string | null;
  ads_spend_cents: number | null;
  orders: number | null;
}

interface ResearchDbRow {
  product_id: string;
}

interface VariantDbRow {
  sku: string;
  name: string | null;
  // İki şekil: Etsy senkron dizisi VEYA EON düz nesnesi (bkz. variant-properties).
  properties: RawVariantProperties;
  price_cents: number | null;
  quantity: number | null;
  weight_grams: number | string | null; // numeric — bazı sürücüler string döndürür
  weight_source: string | null;
  active: boolean | null;
}

interface MetricDbRow {
  period_label: string;
  created_at: string;
  views: number | null;
  orders: number | null;
  revenue_cents: number | null;
  ads_clicks: number | null;
  ads_spend_cents: number | null;
  ads_revenue_cents: number | null;
}

interface SaleItemDbRow {
  sale_id: string;
  quantity: number | null;
  line_total_cents: number | null;
}

// ── İndeks: tüm listingler tek sorgu setiyle (N+1 yok) ───────────────

/**
 * Tüm listingler (sayfalama yok — tek sayfa; ~320 satır sorun değil).
 * Varyant/metrik/araştırma verileri TOPLU çekilir ve Map ile birleştirilir.
 * `search` başlık/SKU ilike; `status` eq. Panel arşivi (products.archived_at)
 * varsayılan olarak HARİÇTİR; `status === "arsiv"` özel değeriyle yalnız
 * arşivdekiler listelenir (Etsy durumu değil, panel yaşam-döngüsü filtresi).
 */
export async function listListingsIndex(opts?: {
  search?: string;
  status?: string;
  /**
   * Yaşam-döngüsü kapsamı (Etsy-ayna kuralı):
   *   "etsy"        → yalnız Etsy'de var olan listing'ler (etsy_listing_id dolu).
   *                   Ana "Listeler" ekranı — Etsy'de ne varsa o.
   *   "suggestions" → panel-kayıtlı taslaklar (etsy_listing_id boş, arşivsiz) —
   *                   henüz Etsy'de olmayan öneriler.
   *   "archived"    → arşivlenenler (archived_at dolu).
   * Varsayılan "etsy". Geriye uyum: eski `status==='arsiv'` → "archived".
   */
  scope?: "etsy" | "suggestions" | "archived";
}): Promise<ListingIndexRow[]> {
  const supabase = await createClient();
  const search = opts?.search ? sanitize(opts.search) : "";
  const scope: "etsy" | "suggestions" | "archived" =
    opts?.scope ?? (opts?.status === "arsiv" ? "archived" : "etsy");
  const status = opts?.status === "arsiv" ? undefined : opts?.status;

  // Varyant SKU'suyla da bulunabilsin (Codex P2): kullanıcı siparişte/varyantta
  // gördüğü SKU'yu arar; o SKU parent listing'de değil product_variants'ta olur.
  // Eşleşen varyantların product_id'lerini önce topla, products .or()'una ekle.
  let variantSkuIds: string[] = [];
  if (search) {
    const vids = await fetchAllPages<{ product_id: string | null }>((from, to) =>
      supabase
        .from("product_variants")
        .select("product_id")
        .ilike("sku", `%${search}%`)
        .not("product_id", "is", null)
        .order("id", { ascending: true })
        .range(from, to),
    );
    variantSkuIds = [
      ...new Set(
        vids.map((v) => v.product_id).filter((x): x is string => !!x),
      ),
    ].slice(0, 500);
  }

  const products = await fetchAllPages<ProductIndexDbRow>((from, to) => {
    let q = supabase
      .from("products")
      .select(
        "id, etsy_listing_id, sku, title, status, image_url, price_cents, currency, quantity, num_images, research_keyword",
      );
    if (scope === "archived") {
      q = q.not("archived_at", "is", null);
    } else {
      q = q.is("archived_at", null);
      // "etsy" → yalnız Etsy'de olanlar; "suggestions" → yalnız panel-taslakları.
      q =
        scope === "etsy"
          ? q.not("etsy_listing_id", "is", null)
          : q.is("etsy_listing_id", null);
    }
    if (status) q = q.eq("status", status);
    if (search) {
      const clauses = [`title.ilike.%${search}%`, `sku.ilike.%${search}%`];
      if (variantSkuIds.length) clauses.push(`id.in.(${variantSkuIds.join(",")})`);
      q = q.or(clauses.join(","));
    }
    // DB sırası yaklaşık; doğal SKU ↓ (yeni üstte) aşağıda JS ile kesinleşir.
    return q
      .order("sku", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range(from, to);
  });
  if (products.length === 0) return [];

  const ids = new Set(products.map((p) => p.id));

  // Toplu yan veriler — RLS org'a kısıtlar; ürün filtresi Map aşamasında.
  const [variants, adsRows, researchRows] = await Promise.all([
    fetchAllPages<VariantAggDbRow>((from, to) =>
      supabase
        .from("product_variants")
        .select("product_id, weight_grams")
        .not("product_id", "is", null)
        .order("id", { ascending: true })
        .range(from, to),
    ),
    fetchAllPages<Ads30DbRow>((from, to) =>
      supabase
        .from("product_metrics")
        .select("product_id, ads_spend_cents, orders")
        .ilike("period_label", "%son 30%")
        .not("product_id", "is", null)
        .order("id", { ascending: true })
        .range(from, to),
    ),
    fetchAllPages<ResearchDbRow>((from, to) =>
      supabase
        .from("keyword_research")
        .select("product_id")
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ]);

  const variantAgg = new Map<string, { total: number; missing: number }>();
  for (const v of variants) {
    if (!v.product_id || !ids.has(v.product_id)) continue;
    const agg = variantAgg.get(v.product_id) ?? { total: 0, missing: 0 };
    agg.total += 1;
    if (v.weight_grams == null) agg.missing += 1;
    variantAgg.set(v.product_id, agg);
  }

  const adsAgg = new Map<string, { spend: number; orders: number }>();
  for (const m of adsRows) {
    if (!m.product_id || !ids.has(m.product_id)) continue;
    const agg = adsAgg.get(m.product_id) ?? { spend: 0, orders: 0 };
    agg.spend += m.ads_spend_cents ?? 0;
    agg.orders += m.orders ?? 0;
    adsAgg.set(m.product_id, agg);
  }

  const researched = new Set(researchRows.map((r) => r.product_id));

  const mapped = products.map((p) => {
    const va = variantAgg.get(p.id);
    const ads = adsAgg.get(p.id);
    return {
      id: p.id,
      etsy_listing_id: p.etsy_listing_id,
      sku: p.sku,
      title: p.title,
      status: p.status,
      image_url: p.image_url,
      price_cents: p.price_cents,
      currency: p.currency ?? "USD",
      quantity: p.quantity,
      num_images: p.num_images,
      variant_count: va?.total ?? 0,
      missing_weight_count: va?.missing ?? 0,
      research_keyword: p.research_keyword,
      has_research: researched.has(p.id),
      ads30_spend_cents: ads ? ads.spend : null,
      ads30_orders: ads ? ads.orders : null,
    };
  });
  // Küçük SKU altta, büyük/yeni üstte (doğal sayı: 0009 < 0010).
  return sortListingsBySkuDesc(mapped);
}

// ── Detay: tek listing'in komuta-merkezi verisi ──────────────────────

export async function getListingDetail(
  id: string,
): Promise<ListingDetail | null> {
  const supabase = await createClient();

  const { data: pData, error: pError } = await supabase
    .from("products")
    .select(
      "id, etsy_listing_id, title, status, description, tags, materials, price_cents, currency, quantity, url, image_url, num_images, research_keyword, sku, weight_grams",
    )
    .eq("id", id)
    .maybeSingle();
  if (pError) throw new Error(pError.message);
  if (!pData) return null;
  const raw = pData as ListingDetail["product"] & { weight_grams: unknown };
  const product: ListingDetail["product"] = {
    ...raw,
    weight_grams: raw.weight_grams == null ? null : Number(raw.weight_grams),
  };

  const [variantRows, metricRows, saleItemRows] = await Promise.all([
    (async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(
          "sku, name, properties, price_cents, quantity, weight_grams, weight_source, active",
        )
        .eq("product_id", id)
        .order("sku", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as VariantDbRow[];
    })(),
    (async () => {
      const { data, error } = await supabase
        .from("product_metrics")
        .select(
          "period_label, created_at, views, orders, revenue_cents, ads_clicks, ads_spend_cents, ads_revenue_cents",
        )
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MetricDbRow[];
    })(),
    // Ömürlük gerçek satış: etsy_listing_id VEYA product_id eşleşen kalemler;
    // iptal edilen siparişler hariç (sales.status <> 'cancelled').
    fetchAllPages<SaleItemDbRow>((from, to) => {
      let q = supabase
        .from("sale_items")
        .select("sale_id, quantity, line_total_cents, sales!inner(status)")
        .neq("sales.status", "cancelled");
      q =
        product.etsy_listing_id != null
          ? q.or(
              `product_id.eq.${id},etsy_listing_id.eq.${product.etsy_listing_id}`,
            )
          : q.eq("product_id", id);
      return q.order("id", { ascending: true }).range(from, to);
    }),
  ]);

  const sorted = sortVariantsByWidthThenSize(
    variantRows.map((v) => ({
      sku: v.sku,
      name: v.name,
      label: variantLabel(v),
      properties: v.properties,
      price_cents: v.price_cents,
      quantity: v.quantity,
      weight_grams: v.weight_grams == null ? null : Number(v.weight_grams),
      weight_source: v.weight_source,
      active: v.active,
    })),
  );
  const variants: ListingVariantRow[] = sorted.map((v) => ({
    sku: v.sku,
    name: v.name,
    label: v.label,
    price_cents: v.price_cents,
    quantity: v.quantity,
    weight_grams: v.weight_grams,
    weight_source: v.weight_source,
    active: v.active,
  }));

  // Çift sayım koruması (Codex P2): aynı dönem etiketinin birden çok snapshot'ı
  // (ör. birden çok "son 30g" kaydı) toplama iki kez girmesin — etikete göre EN
  // GÜNCEL kaydı tut (metricRows created_at desc geldiğinden ilk gelen en yeni).
  // NOT: farklı etiketli ama örtüşen kümülatif bir import varsa bu tam çözmez;
  // o durumda dönemleri ayrı tutmak veri girişinin sorumluluğu.
  const latestByLabel = new Map<string, MetricDbRow>();
  for (const m of metricRows) {
    if (!latestByLabel.has(m.period_label)) latestByLabel.set(m.period_label, m);
  }
  const dedupedMetrics = [...latestByLabel.values()];

  const son30Rows = dedupedMetrics.filter((m) => isSon30(m.period_label));
  const ads: ListingAds = {
    son30: son30Rows.length
      ? {
          spend_cents: sumField(son30Rows, (m) => m.ads_spend_cents),
          revenue_cents: sumField(son30Rows, (m) => m.ads_revenue_cents),
          clicks: sumField(son30Rows, (m) => m.ads_clicks),
          orders: sumField(son30Rows, (m) => m.orders),
          views: sumField(son30Rows, (m) => m.views),
        }
      : null,
    lifetime_metrics: {
      spend_cents: sumField(dedupedMetrics, (m) => m.ads_spend_cents),
      revenue_cents: sumField(dedupedMetrics, (m) => m.ads_revenue_cents),
      clicks: sumField(dedupedMetrics, (m) => m.ads_clicks),
      orders: sumField(dedupedMetrics, (m) => m.orders),
      views: sumField(dedupedMetrics, (m) => m.views),
      periods: dedupedMetrics.length,
    },
    periods: dedupedMetrics.map((m) => ({
      period_label: m.period_label,
      views: m.views,
      orders: m.orders,
      revenue_cents: m.revenue_cents,
      ads_spend_cents: m.ads_spend_cents,
      ads_revenue_cents: m.ads_revenue_cents,
    })),
  };

  const saleIds = new Set<string>();
  let units = 0;
  let revenue = 0;
  for (const s of saleItemRows) {
    saleIds.add(s.sale_id);
    units += s.quantity ?? 0;
    revenue += s.line_total_cents ?? 0;
  }
  const lifetimeSales: ListingLifetimeSales = {
    orders: saleIds.size,
    units,
    revenue_cents: revenue,
  };

  const gaps: ListingGaps = {
    missing_weights: variants.filter((v) => v.weight_grams == null).length,
    total_variants: variants.length,
    // Varyantsız tek-parça listing'de gram, ürün gramajından gelir; o da yoksa
    // künye eksiktir. (Varyantlıda bütünlük missing_weights ile ölçülür.)
    no_weight: variants.length === 0 && product.weight_grams == null,
    no_research_keyword: !(product.research_keyword ?? "").trim(),
    no_description: !(product.description ?? "").trim(),
    no_tags: !product.tags || product.tags.length === 0,
    no_materials: !product.materials || product.materials.length === 0,
    no_image: !(product.image_url ?? "").trim(),
    unpriced_variants: variants.filter((v) => v.price_cents == null).length,
  };

  return { product, variants, ads, lifetimeSales, gaps };
}

// ── Pazar konumu (gram-bazlı) — #148 market_price_alerts görünümünden ────
// Günlük pazar araştırması rutini keyword_research'e $/gram konum yazınca dolar;
// yoksa null (kart görünmez — zarif). LCC detayında rakip bölümünü tamamlar.

export interface ListingMarketPosition {
  price_position: "pahali" | "ucuz" | "bantta" | "belirsiz";
  our_per_gram_cents: number | null;
  market_low_per_gram_cents: number | null;
  market_avg_per_gram_cents: number | null;
  market_high_per_gram_cents: number | null;
  melt_per_gram_cents: number | null;
  deviation_pct: number | null;
  confidence: "yuksek" | "orta" | "dusuk" | null;
  recommendation: string | null;
}

export async function getListingMarketPosition(
  productId: string,
): Promise<ListingMarketPosition | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("market_price_alerts")
    .select(
      "price_position, our_per_gram_cents, market_low_per_gram_cents, market_avg_per_gram_cents, market_high_per_gram_cents, melt_per_gram_cents, deviation_pct, confidence, recommendation",
    )
    .eq("product_id", productId)
    .maybeSingle();
  const row = data as ListingMarketPosition | null;
  if (!row || !row.price_position) return null;
  return row;
}
