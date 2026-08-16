/**
 * EON maliyet motoru — SAF hesaplama katmanı.
 *
 * ## Bu dosya NE DEĞİLDİR
 *
 * EON'da `externalPricing` KALICI olarak açıktır: canlı Etsy fiyatının kaynağı
 * EON'un kendi motorudur, panel değil. Buradaki fonksiyonlar bir fiyat ÖNERİSİ
 * ya da itiş girdisi üretmez — EON'un ürettiği ızgarayı **yeniden türeterek
 * doğrulamak** (kolon kayması / birim hatası / bayat gram yakalamak) ve
 * "bu fiyat neden bu?" sorusunu satır satır açıklamak içindir.
 * Kardeş modül `parse.ts` ızgarayı OKUR; bu modül aynı ızgarayı TÜRETİR.
 *
 * DB yazmaz, UI bilmez, Etsy'ye dokunmaz, ağ çağrısı yapmaz. Bilerek
 * bağımlılıksızdır (tek import: kardeş `parse.ts`'in tam-sayı yuvarlama
 * yardımcıları) → tek başına derleyip çalıştırarak kanıtlanabilir
 * (second-brain: "saf motoru bağımsız derle-çalıştır ile kanıtla").
 *
 * ## Formülün kaynak satırları (her rakam izlenebilir)
 *
 * - Varsayımlar (spot 4090 $/ozt · fire %7 · işçilik 30 / milgrain 40 ·
 *   paket 8 · kargo 22 · çarpan 1,55):
 *   `docs/eon/pricing/1.5mm-karar-ve-fiyat-duzeltmesi-2026-07-29.md`
 *   ("Varsayımlar canlı grid'le AYNI (spot $4.090/ozt, çarpan 1,55, fire %7,
 *   işçilik 30 / milgrain 40, paket 8, kargo 22 …)").
 * - Geniş bandın (8–12mm) 2,00 çarpanı: v4 grid'i `ASM!B17 "Carpan 8-12mm"`
 *   → `parse.ts` `PricingAssumptions.multiplierWide` (bilinçli mens-wide primi).
 * - Kalınlık 1.5mm nihai kararı: aynı doküman ("Ürünün nihai kararı 1.5mm").
 * - Gramlar: `docs/eon/eon-weight-tables.json` → `weights_grams[karat][genişlik]["1.5"]`
 *   (aşağıdaki `EON_GRAMS_1_5MM` o dosyadan PROGRAMATİK üretildi; harness 429
 *   hücrenin tamamını kaynak JSON ile karşılaştırır).
 * - Altın değer: aynı doküman "10K standart 5mm US7 → $600" liste fiyatını
 *   birebir verir; motor bu satırı yeniden üretir.
 *
 * Bilinmeyen hiçbir maliyet UYDURULMAZ: gram tabloda yoksa fonksiyon `null`
 * gram ile hata fırlatır, tahmini bir değere düşmez.
 */

import { expectedListUsd, expectedSaleCents } from "./parse";

export type EonKarat = "10K" | "14K" | "18K";

/**
 * Bant profili. Fiyata etkisi YALNIZ işçilik kalemindedir — gramlar tüm
 * profiller için dome tablosundan gelir (EON kararı: kesit farkı gramajı
 * ölçülebilir biçimde değiştirmiyor, işçilik ise değiştiriyor).
 */
export type EonProfile =
  | "dome"
  | "flat"
  | "beveled"
  | "knife"
  | "milgrain"
  | "hammered"
  // Elde bitirilen yeni desenler (2026-08): dokuma ve çapraz yiv. İşçilik
  // sınıfı milgrain/hammered ile aynı — bu yüzden ayrı bir sabit YOK.
  | "basketweave"
  | "ribbed"
  /** Greek key, Maeander ve diamond-cut desenli Frieze bantları. */
  | "frieze";

/** 1 troy ons = 31.1034768 gram, fiyat ızgarasının tam hassasiyeti. */
export const TROY_OUNCE_GRAMS = 31.1034768;

/** Varsayılan spot altın fiyatı, USD/troy ons (v4 grid ASM!B2). */
export const EON_SPOT_USD_PER_OZT = 4090;

/** Tüm genişlik ve profiller için sabit kalınlık (2026-07-29 nihai kararı). */
export const EON_THICKNESS_MM = 1.5;

/** Karat saflık oranları. */
export const EON_PURITY: Record<EonKarat, number> = {
  "10K": 0.417,
  "14K": 0.583,
  "18K": 0.75,
};

/** Döküm/işleme fire payı: %7 → 1.07 çarpanı. */
export const EON_FIRE_FACTOR = 1.07;

/** İşçilik, USD. Frieze & Textured ailesi elde bitirilir. */
export const EON_LABOR_USD = 30;
export const EON_LABOR_HANDFINISHED_USD = 55;
const HANDFINISHED_PROFILES: ReadonlySet<EonProfile> = new Set<EonProfile>([
  "milgrain",
  "hammered",
  "basketweave",
  "ribbed",
  "frieze",
]);

/** Paketleme ve kargo payı, USD. */
export const EON_PACKAGING_USD = 8;
export const EON_SHIPPING_USD = 22;

/** Motor çarpanı: dar bant 2-7mm, geniş bant 8-12mm (mens-wide primi). */
export const EON_MULTIPLIER_NARROW = 1.55;
/** Frieze & Textured 2-7mm: özel üretim ve offsite reklam güvenlik payı. */
export const EON_MULTIPLIER_HANDFINISHED_NARROW = 1.75;
export const EON_MULTIPLIER_WIDE = 2.0;
const WIDE_BAND_MIN_MM = 8;

/** Kalıcı vitrin indirimi: görünen sale = liste × 0,75. */
export const EON_SALE_RATE = 0.75;

/** Gram tablosundaki beden ekseni (US). */
export const EON_SIZES_US: readonly number[] = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
];

/** Gram tablosundaki genişlik ekseni (mm). */
export const EON_WIDTHS_MM: readonly number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

/**
 * 1.5mm dome gram tablosu — `docs/eon/eon-weight-tables.json` içinden
 * programatik olarak üretildi (elle yazılmadı). Dizin sırası `EON_SIZES_US`.
 * Kaynak JSON, satır-doğrusallık anomali düzeltmelerini zaten içerir
 * (bkz. JSON `corrections` alanı).
 */
export const EON_GRAMS_1_5MM: Record<
  EonKarat,
  Record<number, readonly number[]>
> = {
  "10K": {
    2: [1.37, 1.43, 1.5, 1.57, 1.63, 1.7, 1.77, 1.83, 1.9, 1.97, 2.03, 2.1, 2.16],
    3: [2.05, 2.15, 2.25, 2.35, 2.45, 2.55, 2.65, 2.75, 2.85, 2.95, 3.05, 3.15, 3.25],
    4: [2.74, 2.87, 3.0, 3.14, 3.27, 3.4, 3.53, 3.67, 3.8, 3.93, 4.06, 4.2, 4.33],
    5: [3.42, 3.59, 3.75, 3.92, 4.08, 4.25, 4.42, 4.58, 4.75, 4.91, 5.08, 5.29, 5.42],
    6: [4.11, 4.3, 4.5, 4.7, 4.9, 5.1, 5.3, 5.5, 5.7, 5.9, 6.1, 6.29, 6.49],
    7: [4.79, 5.02, 5.25, 5.49, 5.72, 5.95, 6.18, 6.42, 6.65, 6.88, 7.11, 7.34, 7.58],
    8: [5.47, 5.74, 6.0, 6.27, 6.54, 6.8, 7.07, 7.33, 7.6, 7.86, 8.13, 8.39, 8.66],
    9: [6.16, 6.46, 6.76, 7.05, 7.35, 7.65, 7.95, 8.25, 8.55, 8.85, 9.14, 9.44, 9.74],
    10: [6.84, 7.17, 7.51, 7.84, 8.17, 8.5, 8.83, 9.16, 9.5, 9.83, 10.16, 10.49, 10.82],
    11: [7.53, 7.89, 8.26, 8.62, 8.99, 9.35, 9.72, 10.08, 10.45, 10.81, 11.18, 11.53, 11.91],
    12: [8.21, 8.61, 9.01, 9.41, 9.8, 10.2, 10.6, 11.0, 11.4, 11.79, 12.19, 12.59, 12.99],
  },
  "14K": {
    2: [1.56, 1.63, 1.71, 1.78, 1.86, 1.93, 2.01, 2.08, 2.16, 2.23, 2.31, 2.38, 2.4],
    3: [2.33, 2.45, 2.56, 2.67, 2.79, 2.9, 3.01, 3.12, 3.24, 3.35, 3.46, 3.58, 3.69],
    4: [3.11, 3.26, 3.41, 3.56, 3.71, 3.86, 4.01, 4.17, 4.32, 4.47, 4.62, 4.77, 4.92],
    5: [3.89, 4.06, 4.26, 4.45, 4.64, 4.83, 5.02, 5.21, 5.4, 5.58, 5.77, 5.96, 6.15],
    6: [4.67, 4.89, 5.12, 5.34, 5.57, 5.8, 6.02, 6.25, 6.47, 6.7, 6.93, 7.15, 7.38],
    7: [5.44, 5.71, 5.97, 6.23, 6.5, 6.76, 7.03, 7.29, 7.55, 7.82, 8.08, 8.35, 8.61],
    8: [6.22, 6.52, 6.82, 7.13, 7.43, 7.73, 8.03, 8.33, 8.63, 8.93, 9.24, 9.54, 9.84],
    9: [7.0, 7.34, 7.68, 8.02, 8.36, 8.69, 9.03, 9.37, 9.71, 10.05, 10.39, 10.73, 11.07],
    10: [7.78, 8.15, 8.53, 8.91, 9.28, 9.66, 10.04, 10.41, 10.79, 11.17, 11.55, 11.92, 12.3],
    11: [8.55, 8.97, 9.38, 9.8, 10.21, 10.63, 11.04, 11.46, 11.87, 12.29, 12.7, 13.11, 13.53],
    12: [9.33, 9.78, 10.24, 10.69, 11.14, 11.59, 12.04, 12.5, 12.95, 13.4, 13.85, 14.31, 14.76],
  },
  "18K": {
    2: [2.04, 2.15, 2.26, 2.36, 2.47, 2.57, 2.68, 2.78, 2.89, 3.0, 3.13, 3.26, 3.36],
    3: [2.64, 2.76, 2.88, 3.0, 3.12, 3.24, 3.36, 3.48, 3.6, 3.72, 3.85, 4.01, 4.08],
    4: [3.6, 3.74, 3.89, 4.04, 4.19, 4.33, 4.48, 4.63, 4.78, 4.92, 5.04, 5.17, 5.4],
    5: [4.56, 4.75, 4.93, 5.12, 5.3, 5.5, 5.68, 5.87, 6.05, 6.24, 6.37, 6.5, 7.01],
    6: [5.4, 5.63, 5.86, 6.08, 6.31, 6.53, 6.76, 6.98, 7.21, 7.44, 7.57, 7.93, 8.16],
    7: [5.88, 6.14, 6.41, 6.68, 6.95, 7.21, 7.48, 7.75, 8.02, 8.28, 8.4, 8.64, 9.12],
    8: [6.48, 6.77, 7.07, 7.36, 7.66, 7.94, 8.24, 8.53, 8.83, 9.12, 9.36, 9.6, 9.96],
    9: [7.98, 8.36, 8.75, 9.14, 9.52, 9.91, 10.3, 10.69, 11.07, 11.46, 11.85, 12.23, 12.62],
    10: [8.86, 9.29, 9.72, 10.15, 10.58, 11.01, 11.44, 11.58, 12.3, 12.73, 13.16, 13.59, 14.02],
    11: [9.75, 10.22, 10.7, 11.17, 11.64, 12.11, 12.59, 13.06, 13.53, 14.01, 14.48, 14.95, 15.42],
    12: [10.64, 11.15, 11.67, 12.18, 12.7, 13.22, 13.73, 14.24, 14.76, 15.28, 15.79, 16.31, 16.83],
  },
};

/**
 * Motorun AYARLANABİLİR girdileri (Faz 5). Değerler `pricing_config`'ten
 * gelir; verilmeyen alan yukarıdaki v4 sabitine düşer. Sabitler hâlâ tek
 * referans noktasıdır: üç altın değeri ve canlı siparişi üreten varsayım seti.
 *
 * `spot` bilerek BURADA DEĞİL — o arayüzdeki tek koldur ve
 * `EonCostInput.spotUsdPerOzt` ile taşınır.
 */
export interface EonPricingConfig {
  fireFactor: number;
  laborUsd: number;
  laborHandfinishedUsd: number;
  packagingUsd: number;
  shippingUsd: number;
  multiplierNarrow: number;
  multiplierWide: number;
  wideBandMinMm: number;
  saleRate: number;
}

export const DEFAULT_EON_PRICING_CONFIG: EonPricingConfig = {
  fireFactor: EON_FIRE_FACTOR,
  laborUsd: EON_LABOR_USD,
  laborHandfinishedUsd: EON_LABOR_HANDFINISHED_USD,
  packagingUsd: EON_PACKAGING_USD,
  shippingUsd: EON_SHIPPING_USD,
  multiplierNarrow: EON_MULTIPLIER_NARROW,
  multiplierWide: EON_MULTIPLIER_WIDE,
  wideBandMinMm: WIDE_BAND_MIN_MM,
  saleRate: EON_SALE_RATE,
};

/**
 * ZEMİN (floor) — bu fiyatın ALTINDA satış zarardır.
 *
 * `round((landed + 0.45) / 0.895)` · offsite reklamlı satışta
 * `round((landed + 0.45) / 0.745)`. 0,45 Etsy sabit işlem ücreti; bölen ise
 * satıştan geriye kalan orandır (standart kesintiler → 0,895; offsite reklam
 * komisyonu eklenince → 0,745). Formüller kullanıcı tarafından verildi ve
 * BİREBİR uygulanır — türetilmez, yaklaşık hesaplanmaz.
 */
export const ETSY_FIXED_FEE_USD = 0.45;
export const FLOOR_NET_RATE = 0.895;
export const FLOOR_NET_RATE_OFFSITE = 0.745;

export function floorUsd(landedUsd: number): number {
  return Math.round((landedUsd + ETSY_FIXED_FEE_USD) / FLOOR_NET_RATE);
}

export function offsiteFloorUsd(landedUsd: number): number {
  return Math.round((landedUsd + ETSY_FIXED_FEE_USD) / FLOOR_NET_RATE_OFFSITE);
}

export class EonCostError extends Error {}

/** Motor girdisi. `grams` verilirse tablo atlanır (dış gram doğrulaması için). */
export interface EonCostInput {
  karat: EonKarat;
  /** Bant genişliği, mm (2–12). */
  widthMm: number;
  /** ABD ölçüsü (4–16). `grams` verildiyse yok sayılır. */
  sizeUs?: number;
  profile: EonProfile;
  /** Tablo yerine kullanılacak gram. Bilinmiyorsa VERME — uydurma yapılmaz. */
  grams?: number;
  /** Spot USD/ozt override (senaryo analizi). Varsayılan 4090. */
  spotUsdPerOzt?: number;
  /** Ayar seti (pricing_config). Verilmezse v4 sabitleri kullanılır. */
  config?: Partial<EonPricingConfig>;
}

/**
 * Tek hücrenin tam dökümü. Para alanları hem tam sayı **cent** (CLAUDE.md
 * kuralı, DB/karşılaştırma için) hem okunur **USD** olarak taşınır.
 *
 * `landedUsd` bilerek YUVARLANMAMIŞ tutulur; `landedCents` yalnız gösterim
 * içindir ve motor zincirinde KULLANILMAZ (bkz. `engineCents` notu).
 */
export interface EonCostBreakdown {
  karat: EonKarat;
  profile: EonProfile;
  widthMm: number;
  sizeUs: number | null;
  thicknessMm: number;
  grams: number;
  /** Gramın kaynağı — "tablo" mu çağıran mı verdi (izlenebilirlik). */
  gramsSource: "weight-table" | "input";

  spotUsdPerOzt: number;
  gramPriceUsd: number;
  purity: number;
  fireFactor: number;

  materialUsd: number;
  laborUsd: number;
  packagingUsd: number;
  shippingUsd: number;
  /** material + labor + packaging + shipping — YUVARLANMAZ. */
  landedUsd: number;
  /** Zarar sınırı: round((landed + 0,45) / 0,895). Altına inilmez. */
  floorUsd: number;
  /** Offsite reklamlı satışta zarar sınırı: round((landed + 0,45) / 0,745). */
  offsiteFloorUsd: number;

  multiplier: number;
  /** round(landedUsd × multiplier) — tam sayı USD. */
  engineUsd: number;
  /** ceiling(engine / 0.75, 5) — 5'in katı, tam sayı USD. */
  listUsd: number;
  /** liste × 0,75. */
  saleUsd: number;

  landedCents: number;
  engineCents: number;
  listCents: number;
  saleCents: number;
  currency: "USD";
}

/** Spot ($/ozt) → gram fiyatı ($/g). */
export function gramPriceUsd(spotUsdPerOzt: number): number {
  return spotUsdPerOzt / TROY_OUNCE_GRAMS;
}

/** Profil → işçilik USD. */
export function laborUsdFor(
  profile: EonProfile,
  config: EonPricingConfig = DEFAULT_EON_PRICING_CONFIG,
): number {
  return HANDFINISHED_PROFILES.has(profile)
    ? config.laborHandfinishedUsd
    : config.laborUsd;
}

/** Genişlik ve profil → motor çarpanı. 8mm ve üstü geniş bant. */
export function multiplierFor(
  widthMm: number,
  config: EonPricingConfig = DEFAULT_EON_PRICING_CONFIG,
  profile?: EonProfile,
): number {
  return widthMm >= config.wideBandMinMm
    ? config.multiplierWide
    : profile != null && HANDFINISHED_PROFILES.has(profile)
      ? Math.max(config.multiplierNarrow, EON_MULTIPLIER_HANDFINISHED_NARROW)
      : config.multiplierNarrow;
}

/**
 * 1.5mm gram tablosundan gram çözer. Hücre yoksa `null` döner — çağıran
 * "bilinmiyor" diye raporlamalıdır; tahmini gram ÜRETİLMEZ.
 */
export function lookupGrams1_5mm(
  karat: EonKarat,
  widthMm: number,
  sizeUs: number,
): number | null {
  const row = EON_GRAMS_1_5MM[karat]?.[widthMm];
  if (!row) return null;
  const idx = EON_SIZES_US.indexOf(sizeUs);
  if (idx < 0) return null;
  return row[idx] ?? null;
}

/**
 * EON maliyet/fiyat zincirinin tamamı.
 *
 * ### Yuvarlama sözleşmesi (bire-bir hatanın kaynağı — DEĞİŞTİRME)
 *
 * `engineUsd` **yuvarlanmamış** `landedUsd`'den hesaplanır. Landed önce
 * yuvarlanırsa sınır hücrelerinde bire-bir sapma doğar; kanonik vaka:
 * 10K · 5mm · US7 → landed 289,995821 × 1,55 = 449,4935 → **449** (doğru).
 * Landed önce 290,00'a yuvarlanırsa 290 × 1,55 = 449,50 → Math.round yukarı
 * yuvarlar → **450** (yanlış).
 *
 * Ölçüldü (858 hücrelik 1.5mm ızgarası, dome + milgrain): tuzak **9 hücrede**
 * motor değerini, bunların **3'ünde** liste fiyatını da kaydırıyor —
 * 10K 10mm US13 milgrain 1725→1730, 10K 12mm US13 dome 2005→2010,
 * 14K 12mm US16 milgrain 3415→3420. Yani hata her zaman listeye yansımaz;
 * bu da onu sessiz kılar. Bu yüzden `landedCents` bu zincirde KULLANILMAZ,
 * yalnız raporlanır.
 */
export function computeEonCost(input: EonCostInput): EonCostBreakdown {
  const { karat, widthMm, profile } = input;
  const cfg: EonPricingConfig = {
    ...DEFAULT_EON_PRICING_CONFIG,
    ...(input.config ?? {}),
  };

  if (!(karat in EON_PURITY)) {
    throw new EonCostError(`Bilinmeyen karat: ${karat}`);
  }
  if (!Number.isFinite(widthMm) || widthMm <= 0) {
    throw new EonCostError(`Genislik pozitif olmali: ${widthMm}`);
  }

  const spot = input.spotUsdPerOzt ?? EON_SPOT_USD_PER_OZT;
  if (!Number.isFinite(spot) || spot <= 0) {
    throw new EonCostError(`Spot pozitif olmali: ${spot}`);
  }

  // Gram: girdi > tablo. İkisi de yoksa DUR — maliyet uydurulmaz.
  let grams: number;
  let gramsSource: EonCostBreakdown["gramsSource"];
  if (input.grams != null) {
    if (!Number.isFinite(input.grams) || input.grams <= 0) {
      throw new EonCostError(`Gram pozitif olmali: ${input.grams}`);
    }
    grams = input.grams;
    gramsSource = "input";
  } else {
    if (input.sizeUs == null) {
      throw new EonCostError(
        `Gram cozulemedi: ${karat} ${widthMm}mm — beden verilmedi ve gram girilmedi (BILINMIYOR).`,
      );
    }
    const found = lookupGrams1_5mm(karat, widthMm, input.sizeUs);
    if (found == null) {
      throw new EonCostError(
        `Gram tablosunda hucre yok: ${karat} ${widthMm}mm US${input.sizeUs} @${EON_THICKNESS_MM}mm (BILINMIYOR).`,
      );
    }
    grams = found;
    gramsSource = "weight-table";
  }

  const purity = EON_PURITY[karat];
  const gPrice = gramPriceUsd(spot);

  const materialUsd = grams * gPrice * purity * cfg.fireFactor;
  const laborUsd = laborUsdFor(profile, cfg);
  const landedUsd = materialUsd + laborUsd + cfg.packagingUsd + cfg.shippingUsd;

  const multiplier = multiplierFor(widthMm, cfg, profile);
  // KRİTİK: yuvarlanmamış landed. Bkz. yukarıdaki yuvarlama sözleşmesi.
  const engineUsd = Math.round(landedUsd * multiplier);

  // Tam sayı aritmetiğiyle ceiling(engine/0.75, 5) ve liste×0,75
  // (parse.ts ile TEK formül — ızgarayı okuyan ve türeten taraf ayrışmasın).
  const listUsd = expectedListUsd(engineUsd);
  const listCents = listUsd * 100;
  const saleCents = expectedSaleCents(listCents);

  return {
    karat,
    profile,
    widthMm,
    sizeUs: input.sizeUs ?? null,
    thicknessMm: EON_THICKNESS_MM,
    grams,
    gramsSource,

    spotUsdPerOzt: spot,
    gramPriceUsd: gPrice,
    purity,
    fireFactor: cfg.fireFactor,

    materialUsd,
    laborUsd,
    packagingUsd: cfg.packagingUsd,
    shippingUsd: cfg.shippingUsd,
    landedUsd,

    floorUsd: floorUsd(landedUsd),
    offsiteFloorUsd: offsiteFloorUsd(landedUsd),

    multiplier,
    engineUsd,
    listUsd,
    saleUsd: saleCents / 100,

    landedCents: Math.round(landedUsd * 100),
    engineCents: engineUsd * 100,
    listCents,
    saleCents,
    currency: "USD",
  };
}
