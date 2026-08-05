/**
 * Rakip varyant eşlemesinden $/g çıkarımı ve tüm varyantlara fiyat yansıtma.
 *
 * Çapa = bizim eşlenen SKU’nun gramı + rakip teklif fiyatı.
 * P_i = (rakip_fiyat / bizim_gram_çapa) · g_i
 *
 * Eşleşme kaydında rakip gramı yok; gram kaynağı bizim varyant tablosu
 * (ShipStation / elle / çıkarım). Gramı olmayan çapa ile projeksiyon yok.
 */

import {
  propagatePricesFromAnchor,
  unitPriceCentsPerGram,
  type DistVariant,
} from "@/lib/etsy/distribute";

export interface CompetitorMatchBasisInput {
  our_sku: string;
  price_cents: number | null;
  competitor_label?: string | null;
  competitor_listing_id?: number;
}

export interface CompetitorGramProjection {
  /** Çapa bizim SKU. */
  basisSku: string;
  basisGrams: number;
  basisPriceCents: number;
  competitorLabel: string | null;
  competitorListingId: number | null;
  /** cent / gram */
  unitCentsPerGram: number;
  /** sku → yansıtılan satış (cent) */
  projectedCentsBySku: Record<string, number>;
}

/**
 * Kayıtlı eşleşmelerden geçerli bir $/g çapası seçer (son geçerli eşleşme)
 * ve gramı olan tüm varyantlara fiyat yansıtır.
 */
export function projectPricesFromCompetitorMatches(
  matches: CompetitorMatchBasisInput[],
  variants: DistVariant[],
): CompetitorGramProjection | null {
  const weightBySku = new Map<string, number>();
  for (const v of variants) {
    if (v.weightGrams != null && v.weightGrams > 0) {
      weightBySku.set(v.sku, v.weightGrams);
    }
  }

  let basis: {
    sku: string;
    priceCents: number;
    grams: number;
    label: string | null;
    listingId: number | null;
  } | null = null;

  for (const m of matches) {
    const sku = (m.our_sku ?? "").trim();
    const price = m.price_cents;
    const grams = weightBySku.get(sku);
    if (!sku || price == null || !(price > 0) || grams == null) continue;
    basis = {
      sku,
      priceCents: price,
      grams,
      label: m.competitor_label ?? null,
      listingId: m.competitor_listing_id ?? null,
    };
  }

  if (!basis) return null;

  const unit = unitPriceCentsPerGram(basis.priceCents, basis.grams);
  if (unit == null) return null;

  const preds = propagatePricesFromAnchor(
    variants,
    basis.sku,
    basis.priceCents,
  );
  if (preds.length === 0) return null;

  const projectedCentsBySku: Record<string, number> = {};
  for (const p of preds) projectedCentsBySku[p.sku] = p.priceCents;

  return {
    basisSku: basis.sku,
    basisGrams: basis.grams,
    basisPriceCents: basis.priceCents,
    competitorLabel: basis.label,
    competitorListingId: basis.listingId,
    unitCentsPerGram: unit,
    projectedCentsBySku,
  };
}
