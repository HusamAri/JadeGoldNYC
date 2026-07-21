import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";

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

export const ADS_ACTION_KINDS = [
  "kapat",
  "azalt",
  "artir",
  "incele",
  "listing_duzelt",
  "daralt",
  "bekle",
] as const;
export type AdsActionKind = (typeof ADS_ACTION_KINDS)[number];

export const ADS_ACTION_KIND_META: Record<AdsActionKind, { label: string }> = {
  kapat: { label: "Reklamı kapat" },
  azalt: { label: "Bütçeyi azalt" },
  artir: { label: "Bütçeyi artır" },
  incele: { label: "İncele" },
  // Triyaj sonuçları (0112): reklam DOĞRU çalışıyorsa sorun listing'dedir.
  listing_duzelt: { label: "Listing'i düzelt (reklama dokunma)" },
  daralt: { label: "Hedefi daralt (etiket/negatif kelime)" },
  bekle: { label: "Bekle (veri az)" },
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
    hint: "Son 30 günde reklama para gitti ama tek kuruş getiri yok — bütçe her gün eriyor. Kapatmadan ÖNCE triyajı çalıştır: terimler hedefteyse sorun reklam değil listing'dir (kapatmak yanlış ilacı içmek olur).",
    suggestedKinds: ["kapat"],
    badgeVariant: "destructive",
  },
  butce_yiyen: {
    title: "Bütçe yiyen",
    hint: "Bu ürün reklam bütçesinin büyük payını tek başına çekiyor ama getirisi harcamayı karşılamıyor. Körlemesine kapatma/azaltma YOK — önce Etsy'de arama terimleri raporuna bak ve triyajı çalıştır: sorun reklamda mı, listing'de mi, hedeflemede mi ortaya çıkar.",
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

// ── TRİYAJ KARAR AĞACI — bütçe yiyen / boşa harcayan listing kuralı.
// Etsy API arama-terimi raporu SUNMAZ; panel bu yüzden raporu KULLANICIYA
// okutur ve cevaba göre DOĞRU aksiyonu önerir (karar günlüğü deseni).
// Meta kaynağında taşınır: UI bu ağacı aynen çizer, kendi metin/eşleme
// haritası kurmaz. ──────────────────────────────────────────────────────────

export interface AdsTriageOption {
  key: string;
  /** Kullanıcının rapora bakınca seçeceği durum. */
  answer: string;
  /** Teşhis — ne oluyor, sorun nerede yaşıyor. */
  verdict: string;
  /** Ne yapılır (kullanıcının kuralının kendisi). */
  action: string;
  /** Kuyruğa düşecek aksiyon türü. */
  kind: AdsActionKind;
  /** Ek uyarı (ör. az veriyle kapatma). */
  caution?: string;
}

export const ADS_TRIAGE: {
  /** Triyaj hangi sinyaller için önerilir. */
  appliesTo: AdsSignalKind[];
  intro: string;
  question: string;
  options: AdsTriageOption[];
} = {
  appliesTo: ["bosa", "butce_yiyen"],
  intro:
    "Önce Etsy Reklam panosunda bu listing'in ARAMA TERİMLERİ raporunu aç — reklam gerçekte hangi aramalarla eşleşiyor? Karar oradan çıkar, tahminden değil.",
  question: "Reklamın eşleştiği terimler ne söylüyor?",
  options: [
    {
      key: "hedefte",
      answer: "Terimler hedefte, yine de sipariş yok",
      verdict:
        "Reklam işini DOĞRU yapıyor (doğru arayan doğru sayfaya iniyor) — sorun reklamda değil, listing sayfasında: güven boşluğu (sıfır yorum), fotoğraflar, fiyat çerçevesi.",
      action:
        "Reklama DOKUNMA. Listing'i düzelt: fotoğraflar, fiyat sunumu, zamanla yorumlar. Reklamı kapatmak yanlış ilacı içmek olur.",
      kind: "listing_duzelt",
    },
    {
      key: "hedef_disi",
      answer: "Terimler hedef dışı (yanlış niyetli trafik)",
      verdict:
        'Reklam yanlış aramalarla eşleşiyor (ör. "gold ring" arayıp $50 fantezi yüzük isteyen, $445 som altın alyansa iniyor) — tıklayan asla bu alıcı değil.',
      action:
        "DARALT: uyumsuz etiketi listing'den çıkar; Etsy bu listing için negatif kelime sunuyorsa terimi hariç tut.",
      kind: "daralt",
    },
    {
      key: "hic_donusmez",
      answer: "Trafik hiç dönüşmez (yanlış kategori/fiyat aralığı/niyet)",
      verdict:
        "Listing kalitesinden bağımsız, gelen trafiğin bu ürünü alma niyeti yok — yanlış kategori, yanlış fiyat kademesi ya da yanlış niyet.",
      action: "Reklamı bu listing için kapat — bütçe hiç dönüşmeyecek trafiğe akıyor.",
      kind: "kapat",
      caution:
        "Bunu 3 günlük harcamayla BİLEMEZSİN — en az 7-14 günlük terim verisi olmadan kapatma kararı verme.",
    },
    {
      key: "veri_az",
      answer: "Emin değilim / veri çok taze (birkaç gün)",
      verdict:
        "Birkaç günlük harcama örüntü göstermez; erken karar hem yanlış kapatma hem yanlış büyütme riskidir.",
      action:
        "BEKLE — birkaç gün daha terim verisi biriksin, sonra triyajı tekrar çalıştır. Karar kuyruğa 'bekle' olarak düşer ki takipte kalsın.",
      kind: "bekle",
    },
  ],
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
