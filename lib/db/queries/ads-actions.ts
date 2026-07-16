import { createClient } from "@/lib/supabase/server";

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

/** Metriklerin dönem filtresi — pencere etiketi UI'da aynen gösterilir. */
export const ADS_PERIOD_LABEL = "son 30";
const ADS_PERIOD_MATCH = "%son 30%";

// ── Aksiyon türleri + meta — META KAYNAĞINDA TAŞINIR (dışarıda string-key
// eşleme haritası kurulmaz; yeni tür = yalnız burası). ──────────────────────

export const ADS_ACTION_KINDS = ["kapat", "azalt", "artir", "incele"] as const;
export type AdsActionKind = (typeof ADS_ACTION_KINDS)[number];

export const ADS_ACTION_KIND_META: Record<AdsActionKind, { label: string }> = {
  kapat: { label: "Reklamı kapat" },
  azalt: { label: "Bütçeyi azalt" },
  artir: { label: "Bütçeyi artır" },
  incele: { label: "İncele" },
};

export type AdsActionStatus = "beklemede" | "yapildi" | "yok_sayildi";

export const ADS_ACTION_STATUS_META: Record<
  AdsActionStatus,
  { label: string; badgeVariant: "outline" | "success" | "secondary" }
> = {
  beklemede: { label: "Beklemede", badgeVariant: "outline" },
  yapildi: { label: "Yapıldı", badgeVariant: "success" },
  yok_sayildi: { label: "Yok sayıldı", badgeVariant: "secondary" },
};

// ── Sinyal eşikleri — TEK sabit blok; sayfa VE alerts.ts buradan okur,
// eşik sapması yaşanmaz. ────────────────────────────────────────────────────

export const ADS_THRESHOLDS = {
  /** BÜTÇE YİYEN: tek ürünün toplam harcamadaki payı bu orana ulaşır… */
  BUDGET_EATER_MIN_SHARE: 0.35,
  /** …VE ROAS bunun altında kalırsa (getiri harcamayı karşılamıyor). */
  BUDGET_EATER_MAX_ROAS: 1.5,
  /** FIRSAT: ROAS en az bu değer… */
  OPPORTUNITY_MIN_ROAS: 3,
  /** …ama harcama payı hâlâ bunun altındaysa (büyütme alanı var). */
  OPPORTUNITY_MAX_SHARE: 0.15,
} as const;

export type AdsSignalKind = "bosa" | "butce_yiyen" | "firsat";

/** Sinyal meta'sı da kaynakta: başlık, insancıl anlatım (ne oldu → bedel →
 *  ne yap) ve önerilen aksiyon türleri. */
export const ADS_SIGNAL_META: Record<
  AdsSignalKind,
  {
    title: string;
    hint: string;
    suggestedKinds: AdsActionKind[];
    badgeVariant: "destructive" | "warning" | "success";
  }
> = {
  bosa: {
    title: "Boşa harcama",
    hint: "Son 30 günde reklama para gitti ama tek kuruş getiri yok — bütçe her gün eriyor. Reklamı Etsy panosunda kapat ya da listing'i (görsel/fiyat/başlık) düzeltip yeniden dene.",
    suggestedKinds: ["kapat"],
    badgeVariant: "destructive",
  },
  butce_yiyen: {
    title: "Bütçe yiyen",
    hint: "Bu ürün reklam bütçesinin büyük payını tek başına çekiyor ama getirisi harcamayı karşılamıyor — diğer ürünler görünmüyor, para verimsiz akıyor. Bütçesini azalt ya da listing'i inceleyip sorunu bul.",
    suggestedKinds: ["azalt", "incele"],
    badgeVariant: "warning",
  },
  firsat: {
    title: "Fırsat",
    hint: "Getirisi güçlü (ROAS yüksek) ama bütçeden aldığı pay küçük — büyütme alanı var. Etsy panosunda bütçesini artır, kazanan ürüne yatırım yap.",
    suggestedKinds: ["artir"],
    badgeVariant: "success",
  },
};

// ── SAF sinyal üretimi — DB'siz, yan etkisiz; sayfa ve Uyarı Merkezi aynı
// fonksiyonu kullanır. ──────────────────────────────────────────────────────

export interface AdsSignalInput {
  productId: string;
  spendCents: number;
  adsRevenueCents: number;
}

export interface AdsSignal<T extends AdsSignalInput = AdsSignalInput> {
  row: T;
  signal: AdsSignalKind;
  /** ads_revenue / spend — spend>0 olan satırlarda tanımlı. */
  roas: number;
  /** Ürünün toplam reklam harcamasındaki payı (0..1). */
  share: number;
  totalSpendCents: number;
}

/**
 * Kurallar birbirini DIŞLAR (öncelik sırasıyla):
 *  (a) BOŞA:        spend>0 && getiri==0                        → kapat
 *  (b) BÜTÇE YİYEN: pay ≥ %35 && ROAS < 1,5                     → azalt/incele
 *  (c) FIRSAT:      ROAS ≥ 3 && pay < %15                       → artır
 * Sıralama: sorunlar önce (harcamaya göre), fırsatlar sonra.
 */
export function computeAdsSignals<T extends AdsSignalInput>(
  rows: T[],
): AdsSignal<T>[] {
  const total = rows.reduce((s, r) => s + Math.max(0, r.spendCents), 0);
  const out: AdsSignal<T>[] = [];
  for (const r of rows) {
    if (r.spendCents <= 0) continue;
    const roas = r.adsRevenueCents / r.spendCents;
    const share = total > 0 ? r.spendCents / total : 0;
    let signal: AdsSignalKind | null = null;
    if (r.adsRevenueCents === 0) {
      signal = "bosa";
    } else if (
      share >= ADS_THRESHOLDS.BUDGET_EATER_MIN_SHARE &&
      roas < ADS_THRESHOLDS.BUDGET_EATER_MAX_ROAS
    ) {
      signal = "butce_yiyen";
    } else if (
      roas >= ADS_THRESHOLDS.OPPORTUNITY_MIN_ROAS &&
      share < ADS_THRESHOLDS.OPPORTUNITY_MAX_SHARE
    ) {
      signal = "firsat";
    }
    if (signal) out.push({ row: r, signal, roas, share, totalSpendCents: total });
  }
  const rank: Record<AdsSignalKind, number> = { bosa: 0, butce_yiyen: 0, firsat: 1 };
  out.sort(
    (a, b) => rank[a.signal] - rank[b.signal] || b.row.spendCents - a.row.spendCents,
  );
  return out;
}

// ── Genel bakış ─────────────────────────────────────────────────────────────

export interface AdsOverviewRow extends AdsSignalInput {
  title: string;
  createdAt: string;
  views: number;
  orders: number;
  adsClicks: number;
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
  const [metricsRes, orgRes] = await Promise.all([
    // Tam çekim, dar kolon — sayılar display-limit'li sorgudan türetilmez.
    // Aktif ürünler: aksiyon alınabilecek (yayında olan) listingler.
    supabase
      .from("product_metrics")
      .select(
        "product_id, product_title, created_at, views, orders, ads_clicks, ads_spend_cents, ads_revenue_cents, products!inner(status)",
      )
      .eq("org_id", orgId)
      .eq("products.status", "active")
      .ilike("period_label", ADS_PERIOD_MATCH),
    supabase
      .from("organizations")
      .select("default_currency")
      .eq("id", orgId)
      .maybeSingle(),
  ]);
  // Hata sessizce "veri yok"a dönüşmesin — yüzeye çıkar.
  if (metricsRes.error)
    console.error("[reklamlar] metrics sorgusu:", metricsRes.error.message);
  if (orgRes.error) console.error("[reklamlar] org sorgusu:", orgRes.error.message);

  const currency =
    (orgRes.data as { default_currency: string | null } | null)
      ?.default_currency ?? "USD";

  type MetricRow = {
    product_id: string | null;
    product_title: string;
    created_at: string;
    views: number | null;
    orders: number | null;
    ads_clicks: number | null;
    ads_spend_cents: number | null;
    ads_revenue_cents: number | null;
  };
  // Aynı dönem etiketi birden çok anlık görüntü taşıyabilir — ürün başına
  // EN GÜNCEL kayıt seçilir (snapshot dedupe dersi; çift sayım yok).
  const latestByProduct = new Map<string, MetricRow>();
  for (const m of ((metricsRes.data ?? []) as unknown as MetricRow[]).sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  )) {
    if (m.product_id && !latestByProduct.has(m.product_id))
      latestByProduct.set(m.product_id, m);
  }

  const rows: AdsOverviewRow[] = [...latestByProduct.entries()]
    .map(([productId, m]) => ({
      productId,
      title: m.product_title,
      createdAt: m.created_at,
      views: m.views ?? 0,
      orders: m.orders ?? 0,
      adsClicks: m.ads_clicks ?? 0,
      spendCents: m.ads_spend_cents ?? 0,
      adsRevenueCents: m.ads_revenue_cents ?? 0,
    }))
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
  product: { title: string } | null;
}

export async function listAdsActions(orgId: string): Promise<AdsActionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads_actions")
    .select(
      "id, product_id, kind, reason, metric_snapshot, status, decided_at, created_at, product:products(title)",
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
