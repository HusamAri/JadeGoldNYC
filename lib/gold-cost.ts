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
};

/** Tedarikçi alım fiyatı (USD cent / gram). */
export const PURCHASE_PRICE_CENTS_PER_GRAM: Record<KaratType, number> = {
  "10K": 65_00,
  "14K": 101_00,
};

/** 1 troy ons = 31.1035 gram. */
export const TROY_OUNCE_GRAMS = 31.1035;

export type KaratType = "10K" | "14K";

// ── Ayar tespiti ──────────────────────────────────────────────────────

const KARAT_PATTERNS: { re: RegExp; karat: KaratType }[] = [
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

export function calculateGoldCost(
  goldPricePerOunceUsd: number,
  karat: KaratType,
  weightGrams: number,
  customPurchasePrices?: Partial<Record<KaratType, number>>,
): GoldCostBreakdown {
  const pureGoldPerGramUsd = goldPricePerOunceUsd / TROY_OUNCE_GRAMS;
  const purity = KARAT_PURITY[karat];
  const karatGoldPerGramUsd = pureGoldPerGramUsd * purity;

  const purchaseCentsPerGram =
    customPurchasePrices?.[karat] ?? PURCHASE_PRICE_CENTS_PER_GRAM[karat];
  const purchasePerGramUsd = purchaseCentsPerGram / 100;

  const laborPerGramUsd = purchasePerGramUsd - karatGoldPerGramUsd;
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
