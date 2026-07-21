import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";
import {
  ADS_PERIOD_MATCH,
  type AdsActionKind,
  type AdsActionStatus,
  type AdsSignalInput,
} from "@/lib/ads/meta";

/**
 * REKLAM KARAR MOTORU — Etsy Open API v3 reklam (Etsy Ads) kontrolü/verisi
 * SUNMADIĞI için panel reklamı doğrudan yönetemez. "API sınırını kabul et,
 * vekilini kur" deseni: "son 30" etiketli product_metrics anlık
 * görüntülerinden KARAR + TAKİP yüzeyi kurulur; aksiyonun kendisi Etsy
 * Reklam panosunda elle yapılır, ads_actions tablosu yapıldı/yapılmadı
 * ölçüm döngüsünü tutar.
 *
 * Veri kuralları (second-brain):
 *  - aynı period_label'da ürün başına EN GÜNCEL kayıt (dedupe, çift sayım yok)
 *  - toplam/sayı display-limit'li sorgudan türetilmez (tam çekim, dar kolon)
 *  - her toplamın veri penceresi (kayıt tarihi aralığı) ekranda yazılır
 */

// ── Saf meta + motor İSTEMCİ-GÜVENLİ modüle taşındı (lib/ads/meta.ts) —
// "use client" bileşenler oradan import eder; sunucu tüketicileri için
// buradan aynen re-export edilir (geriye uyum, import yolları değişmez).
export * from "@/lib/ads/meta";

// ── Genel bakış ─────────────────────────────────────────────────────────────

export interface AdsOverviewRow extends AdsSignalInput {
  title: string;
  /** products.image_url — Etsy senkronundan; yoksa null */
  imageUrl: string | null;
  createdAt: string;
  views: number;
  orders: number;
  adsClicks: number;
  /** Karar bağlamı: canlı ürün alanları (products join'inden). */
  etsyListingId: number | null;
  priceCents: number | null;
  quantity: number | null;
}

export interface AdsOverview {
  /** Ürün başına EN GÜNCEL "son 30" kaydı — harcamaya göre azalan. */
  rows: AdsOverviewRow[];
  totals: {
    spendCents: number;
    adsRevenueCents: number;
    adsClicks: number;
    /** Toplam ROAS — harcama yoksa null (0'a bölme yok). */
    roas: number | null;
  };
  /** Dedupe sonrası kayıtların created_at min–max aralığı (pencere etiketi). */
  window: { from: string | null; to: string | null };
  /** costCents/harcama alanlarının para birimi — org varsayılanı (metrik
   *  satırında currency alanı yok; etikette belirtilir). */
  currency: string;
  /** Reklam harcaması olan ürün sayısı (tam kümeden, display limitsiz). */
  spendingProductCount: number;
}

export async function getAdsOverview(orgId: string): Promise<AdsOverview> {
  const supabase = await createClient();
  const [metricRowsRaw, orgRes] = await Promise.all([
    // GERÇEKTEN tam çekim: sayfasız sorgu PostgREST'in örtük 1000-satır
    // sınırına takılır — toplamlar sessizce eksilirdi (denetim R2 #1).
    // Aktif ürünler: aksiyon alınabilecek (yayında olan) listingler.
    fetchAllPages<Record<string, unknown>>((from, to) =>
      supabase
        .from("product_metrics")
        .select(
          "product_id, product_title, created_at, views, orders, ads_clicks, ads_spend_cents, ads_revenue_cents, products!inner(status, title, image_url, etsy_listing_id, price_cents, quantity)",
        )
        .eq("org_id", orgId)
        .eq("products.status", "active")
        .ilike("period_label", ADS_PERIOD_MATCH)
        .order("id", { ascending: true })
        .range(from, to),
    ).catch((e: unknown) => {
      console.error(
        "[reklamlar] metrics sorgusu:",
        e instanceof Error ? e.message : e,
      );
      return [] as Record<string, unknown>[];
    }),
    supabase
      .from("organizations")
      .select("default_currency")
      .eq("id", orgId)
      .maybeSingle(),
  ]);
  // Hata sessizce "veri yok"a dönüşmesin — yüzeye çıkar.
  if (orgRes.error) console.error("[reklamlar] org sorgusu:", orgRes.error.message);

  const currency =
    (orgRes.data as { default_currency: string | null } | null)
      ?.default_currency ?? "USD";

  type ProductJoin =
    | {
        status: string;
        title: string | null;
        image_url: string | null;
        etsy_listing_id: number | null;
        price_cents: number | null;
        quantity: number | null;
      }
    | {
        status: string;
        title: string | null;
        image_url: string | null;
        etsy_listing_id: number | null;
        price_cents: number | null;
        quantity: number | null;
      }[]
    | null;

  type MetricRow = {
    product_id: string | null;
    product_title: string;
    created_at: string;
    views: number | null;
    orders: number | null;
    ads_clicks: number | null;
    ads_spend_cents: number | null;
    ads_revenue_cents: number | null;
    products: ProductJoin;
  };
  // Aynı dönem etiketi birden çok anlık görüntü taşıyabilir — ürün başına
  // EN GÜNCEL kayıt seçilir (snapshot dedupe dersi; çift sayım yok).
  const latestByProduct = new Map<string, MetricRow>();
  for (const m of (metricRowsRaw as unknown as MetricRow[]).sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  )) {
    if (m.product_id && !latestByProduct.has(m.product_id))
      latestByProduct.set(m.product_id, m);
  }

  const rows: AdsOverviewRow[] = [...latestByProduct.entries()]
    .map(([productId, m]) => {
      const prod = Array.isArray(m.products) ? m.products[0] : m.products;
      const liveTitle = prod?.title?.trim();
      return {
        productId,
        title: liveTitle || m.product_title || "Listing",
        imageUrl: prod?.image_url?.trim() || null,
        createdAt: m.created_at,
        views: m.views ?? 0,
        orders: m.orders ?? 0,
        adsClicks: m.ads_clicks ?? 0,
        spendCents: m.ads_spend_cents ?? 0,
        adsRevenueCents: m.ads_revenue_cents ?? 0,
        etsyListingId: prod?.etsy_listing_id ?? null,
        priceCents: prod?.price_cents ?? null,
        quantity: prod?.quantity ?? null,
      };
    })
    .sort((a, b) => b.spendCents - a.spendCents);

  let spendCents = 0;
  let adsRevenueCents = 0;
  let adsClicks = 0;
  let spendingProductCount = 0;
  let from: string | null = null;
  let to: string | null = null;
  for (const r of rows) {
    spendCents += r.spendCents;
    adsRevenueCents += r.adsRevenueCents;
    adsClicks += r.adsClicks;
    if (r.spendCents > 0) spendingProductCount += 1;
    if (from == null || r.createdAt < from) from = r.createdAt;
    if (to == null || r.createdAt > to) to = r.createdAt;
  }

  return {
    rows,
    totals: {
      spendCents,
      adsRevenueCents,
      adsClicks,
      roas: spendCents > 0 ? adsRevenueCents / spendCents : null,
    },
    window: { from, to },
    currency,
    spendingProductCount,
  };
}

// ── Aksiyon kuyruğu yardımcıları ────────────────────────────────────────────

/** Karar anındaki metrik fotoğrafı (jsonb) — ölçüm döngüsünün "önce"si. */
export interface AdsMetricSnapshot {
  spend_cents?: number;
  ads_revenue_cents?: number;
  roas?: number | null;
  share?: number;
  /** Fotoğrafın veri penceresi (metrik kaydının created_at'i). */
  window_to?: string | null;
  /** Karar anındaki organik bağlam (fotoğraf farkı serisi) — önce/sonra
   *  kıyası reklam metriğiyle sınırlı kalmasın. */
  organic_views_delta?: number | null;
  organic_conversion?: number | null;
  price_cents?: number | null;
  quantity?: number | null;
}

export interface AdsActionRow {
  id: string;
  product_id: string;
  kind: AdsActionKind;
  reason: string | null;
  metric_snapshot: AdsMetricSnapshot | null;
  status: AdsActionStatus;
  decided_at: string | null;
  created_at: string;
  product: { title: string; image_url: string | null } | null;
}

export async function listAdsActions(orgId: string): Promise<AdsActionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads_actions")
    .select(
      "id, product_id, kind, reason, metric_snapshot, status, decided_at, created_at, product:products(title, image_url)",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[reklamlar] ads_actions sorgusu:", error.message);
    return [];
  }
  return (data ?? []) as unknown as AdsActionRow[];
}

export async function createAdsAction(input: {
  orgId: string;
  productId: string;
  kind: AdsActionKind;
  reason: string | null;
  snapshot: AdsMetricSnapshot | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  // Aynı ürün+tür için beklemede kayıt varsa ikinci kez kuyruğa yazma
  // (idempotent — çift tıklama/iki sekme kuyruğu şişirmesin).
  const { data: existing, error: existingError } = await supabase
    .from("ads_actions")
    .select("id")
    .eq("org_id", input.orgId)
    .eq("product_id", input.productId)
    .eq("kind", input.kind)
    .eq("status", "beklemede")
    .limit(1)
    .maybeSingle();
  if (existingError)
    console.error("[reklamlar] beklemede kontrolü:", existingError.message);
  if (existing) return {};

  const { error } = await supabase.from("ads_actions").insert({
    org_id: input.orgId,
    product_id: input.productId,
    kind: input.kind,
    reason: input.reason,
    metric_snapshot: input.snapshot,
  });
  // 0095 kısmi UNIQUE indeksi yarışın kaybedenini 23505 ile durdurur — kayıt
  // zaten kuyruktadır, kullanıcıya hata gösterme (gerçek idempotens).
  if (error && error.code === "23505") return {};
  if (error) return { error: error.message };
  return {};
}

export async function updateAdsActionStatus(input: {
  orgId: string;
  id: string;
  status: Exclude<AdsActionStatus, "beklemede">;
  userId: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ads_actions")
    .update({
      status: input.status,
      decided_by: input.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    // Multi-tenant kilidi: RLS'e ek olarak org_id sözleşmesi uygulanır.
    .eq("org_id", input.orgId);
  if (error) return { error: error.message };
  return {};
}
