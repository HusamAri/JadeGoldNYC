/**
 * Altın maliyet hesaplama yardımcıları.
 *
 * Ürün başlığından ayar (10K/14K) ve ağırlık tespit edilir, güncel
 * altın ons fiyatına göre malzeme maliyeti, işçilik ve marj hesaplanır.
 */

// ── Sabitler ──────────────────────────────────────────────────────────
export const KARAT_PURITY: Record<KaratType, number> = {
  "10K": 0.416,
  "14K": 0.585,
  "18K": 0.75,
};

/** Tedarikçi alım fiyatı (USD cent / gram).
 *  18K: gerçek tedarik verisi yok — bu statik değer yalnız canlı spot
 *  OLMADIĞINDA kullanılan kaba yedektir. Spot varken 18K alımı
 *  `derivePurchase18kCentsPerGram` ile türetilir (aşağıda): metal payı
 *  saflıkla ölçeklenir, işçilik payı sabit kalır. Eski ×(0.75/0.585)
 *  ölçeklemesi işçiliği de büyüttüğünden 18K'yı ~$6-7/g ŞİŞİRİYORDU.
 *  Gerçek tedarikçi fiyatı gelince gold_settings.purchase_price_18k_cents
 *  girilir ve her türlü türetimi ezer. */
export const PURCHASE_PRICE_CENTS_PER_GRAM: Record<KaratType, number> = {
  "10K": 65_00,
  "14K": 101_00,
  "18K": 129_00,
};

/** 1 troy ons = 31.1035 gram. */
export const TROY_OUNCE_GRAMS = 31.1035;

// ── Tedarikçi işçilik kalibrasyonu (Creations By Tamsan) ──────────────
//
// Kaynak: 4 gerçek fatura / 9 satır (no. 17794, 17834, 17863, 17953;
// 2026-07-22 → 2026-08-08, hepsi Gold $4372.40/ozt damgalı). Gerçek yapı
// "metal (spot × ayar) + PARÇA BAŞINA işçilik"dir — eski gram-başına model
// küçük yüzükleri %38'e kadar eksik maliyetliyordu (2mm 1.34g: pane $97.50,
// fatura $148.00). Kalibrasyon medyan-uyum: düz profiller (dome/flat/beveled/
// knife) ≈ $54/parça; süslü profiller (milgrain, hammered, diamond cut,
// basketweave, ribbed, two-tone; kazıma dahil) ≈ $74/parça. 9 satırda toplam
// sapma −%2.2; satır bazında ±%15 (fatura fiyatlaması birebir formül değil).
export const SUPPLIER_LABOR_PER_PIECE_CENTS: Record<
  "standard" | "decorated",
  number
> = {
  standard: 5400,
  decorated: 7400,
};

/**
 * İşçilik sınıfı tespiti: süslü yüzeyler (elmas kesim ailesi) Tamsan'da
 * belirgin daha pahalı. Metin başlık + varyant adı + SKU birleşimidir.
 */
export function detectLaborClass(text: string): "standard" | "decorated" {
  return /milgrain|hammered|diamond\s*cut|basketweave|ribbed|two[\s-]*tone|beaded|-R-\d\d0[467]-|TTG-/i.test(
    text,
  )
    ? "decorated"
    : "standard";
}

export type KaratType = "10K" | "14K" | "18K";

// ── Ayar tespiti ──────────────────────────────────────────────────────

const KARAT_PATTERNS: { re: RegExp; karat: KaratType }[] = [
  { re: /\b18\s*[kK](?:arat|t)?\b/i, karat: "18K" },
  { re: /\b14\s*[kK](?:arat|t)?\b/i, karat: "14K" },
  { re: /\b10\s*[kK](?:arat|t)?\b/i, karat: "10K" },
];

export function detectKarat(
  title: string,
  tags?: string[] | null,
  materials?: string[] | null,
): KaratType | null {
  const haystack = [title, ...(tags ?? []), ...(materials ?? [])]
    .join(" ")
    .toLowerCase();

  for (const { re, karat } of KARAT_PATTERNS) {
    if (re.test(haystack)) return karat;
  }
  return null;
}

// ── Ağırlık tespiti ───────────────────────────────────────────────────

/**
 * Başlık / açıklamadan gram cinsinden ağırlığı çıkarır.
 *
 * Desteklenen kalıplar:
 *   "8.5g", "8,5g", "8.5 g", "8.5gr", "8.5 gram", "8.5 grams"
 */
const WEIGHT_RE =
  /(\d+(?:[.,]\d+)?)\s*(?:gr(?:ams?)?|g\b)/i;

export function extractWeightGrams(
  title: string,
  description?: string | null,
): number | null {
  for (const text of [title, description ?? ""]) {
    const m = WEIGHT_RE.exec(text);
    if (m) {
      const v = parseFloat(m[1].replace(",", "."));
      if (Number.isFinite(v) && v > 0) return v;
    }
  }
  return null;
}

// ── Maliyet hesaplaması ───────────────────────────────────────────────

export interface GoldCostBreakdown {
  karat: KaratType;
  weightGrams: number;
  /** Has altın gram fiyatı (USD). */
  pureGoldPerGramUsd: number;
  /** Ayara göre altın gram değeri (USD). */
  karatGoldPerGramUsd: number;
  /** Alım fiyatı (USD / gram). */
  purchasePerGramUsd: number;
  /** Gram başına işçilik (USD). */
  laborPerGramUsd: number;
  /** İşçilik oranı (maliyet üzeri, 0..1). */
  laborMarkup: number;
  /** Toplam altın malzeme değeri (cent). */
  totalGoldCostCents: number;
  /** Toplam işçilik tutarı (cent). */
  totalLaborCostCents: number;
  /** Toplam alım maliyeti (cent). */
  totalPurchaseCostCents: number;
}

/**
 * 18K alım fiyatı türetimi (cent/gram) — gerçek tedarik verisi yalnız 14K'da
 * olduğundan 18K, canlı spot + 14K'nın GÖZLENEN işçilik primiyle kurulur:
 *
 *   işçilik/g  = 14K alım − 14K melt(spot)     (tedarikçinin gerçek primi)
 *   18K alım/g = 18K melt(spot) + işçilik/g    (metal saflıkla ölçeklenir,
 *                                               işçilik ölçeklenMEZ)
 *
 * Spot geçersizse (≤0) statik yedek döner. Gerçek 18K tedarik fiyatı
 * (gold_settings) her zaman bu türetimi ezer — çağıran taraf halleder.
 */
export function derivePurchase18kCentsPerGram(
  goldPricePerOunceUsd: number,
  purchase14kCentsPerGram: number = PURCHASE_PRICE_CENTS_PER_GRAM["14K"],
): number {
  if (!(goldPricePerOunceUsd > 0)) return PURCHASE_PRICE_CENTS_PER_GRAM["18K"];
  const pureCentsPerGram = (goldPricePerOunceUsd * 100) / TROY_OUNCE_GRAMS;
  const melt14 = pureCentsPerGram * KARAT_PURITY["14K"];
  const melt18 = pureCentsPerGram * KARAT_PURITY["18K"];
  // Kriz senaryosu: spot, 14K alımını aşarsa prim negatife düşer — işçilik
  // tabanı 0'da tutulur (negatif işçilik anlamsız; calculateGoldCost ile aynı kural).
  const laborPremium = Math.max(0, purchase14kCentsPerGram - melt14);
  return Math.round(melt18 + laborPremium);
}

export function calculateGoldCost(
  goldPricePerOunceUsd: number,
  karat: KaratType,
  weightGrams: number,
  customPurchasePrices?: Partial<Record<KaratType, number>>,
): GoldCostBreakdown {
  const pureGoldPerGramUsd = goldPricePerOunceUsd / TROY_OUNCE_GRAMS;
  const purity = KARAT_PURITY[karat];
  const karatGoldPerGramUsd = pureGoldPerGramUsd * purity;

  // 18K: org özel fiyat girmediyse statik varsayım yerine canlı türetim —
  // metal payı spottan, işçilik payı 14K'nın gözlenen priminden.
  const purchaseCentsPerGram =
    customPurchasePrices?.[karat] ??
    (karat === "18K"
      ? derivePurchase18kCentsPerGram(
          goldPricePerOunceUsd,
          customPurchasePrices?.["14K"],
        )
      : PURCHASE_PRICE_CENTS_PER_GRAM[karat]);
  const purchasePerGramUsd = purchaseCentsPerGram / 100;

  // Altın ons fiyatı tedarik alım fiyatını aşarsa işçilik negatife düşebilir
  // (kriz senaryosu); tabanı 0'da tut — negatif işçilik/marj gösterme.
  const laborPerGramUsd = Math.max(0, purchasePerGramUsd - karatGoldPerGramUsd);
  const laborMarkup =
    karatGoldPerGramUsd > 0 ? laborPerGramUsd / karatGoldPerGramUsd : 0;

  const totalGoldCostCents = Math.round(karatGoldPerGramUsd * weightGrams * 100);
  const totalLaborCostCents = Math.round(laborPerGramUsd * weightGrams * 100);
  const totalPurchaseCostCents = Math.round(purchasePerGramUsd * weightGrams * 100);

  return {
    karat,
    weightGrams,
    pureGoldPerGramUsd,
    karatGoldPerGramUsd,
    purchasePerGramUsd,
    laborPerGramUsd,
    laborMarkup,
    totalGoldCostCents,
    totalLaborCostCents,
    totalPurchaseCostCents,
  };
}

/**
 * Gram × tedarik alım fiyatı → toplam maliyet (cent). Spot ons gerekmez;
 * satış fiyatı yanında hızlı maliyet göstermek için.
 */
export function purchaseCostCentsForGrams(
  weightGrams: number,
  karat: KaratType,
  customPurchasePrices?: Partial<Record<KaratType, number>>,
): number | null {
  if (!(weightGrams > 0)) return null;
  const perGram =
    customPurchasePrices?.[karat] ?? PURCHASE_PRICE_CENTS_PER_GRAM[karat];
  if (!(perGram > 0)) return null;
  return Math.round(perGram * weightGrams);
}
