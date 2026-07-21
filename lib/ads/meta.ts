/**
 * REKLAM META + SAF MOTOR — İSTEMCİ-GÜVENLİ modül.
 *
 * Bu dosyada supabase/server importu YOKTUR (bkz. Vercel build hatası:
 * "use client" bileşeni lib/db/queries/ads-actions'tan import edince
 * next/headers istemci paketine sürükleniyordu). Aksiyon türleri, sinyal
 * eşik/meta'ları, TRİYAJ karar ağacı ve saf computeAdsSignals burada yaşar;
 * lib/db/queries/ads-actions.ts geriye-uyum için aynen re-export eder —
 * sunucu tüketicileri (sayfa, alerts, digest) eski yoldan importa devam eder.
 */

/** Metriklerin dönem filtresi — pencere etiketi UI'da aynen gösterilir. */
export const ADS_PERIOD_LABEL = "son 30";
export const ADS_PERIOD_MATCH = "%son 30%";

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
