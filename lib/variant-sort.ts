/**
 * Panel sıralama: varyantlar genişlik (mm) ↑ sonra beden ↑;
 * listingler genel SKU ↓ (küçük SKU altta ≈ yeni üstte).
 *
 * properties hem Etsy dizisi hem EON düz nesnesi olabilir.
 */

import {
  asEtsyProperties,
  type RawVariantProperties,
} from "@/lib/variant-properties";

const WIDTH_KEYS = ["Width", "Diameter", "Length", "Thickness"];
const SIZE_KEYS = ["Ring Size", "Size", "US Ring Size"];

/** Legacy EON beden bantları — lib/db/queries/variants.ts ile aynı sıra. */
const RING_SIZE_BANDS = [
  "US 4-6.5",
  "US 7-9.5",
  "US 10-11.5",
  "US 12-13",
] as const;

const BAND_ORDER = new Map<string, number>(
  RING_SIZE_BANDS.map((b, i) => [b, i]),
);

/** İlk sayısal parçayı çıkarır ("6mm · 1.5mm thick" → 6). */
export function firstNumber(raw: string | null | undefined): number {
  if (!raw) return Number.NaN;
  const m = /([\d.]+)/.exec(raw);
  return m ? parseFloat(m[1]) : Number.NaN;
}

/** İkinci sayı (kalınlık) — "6mm · 1.5mm" → 1.5; yoksa NaN. */
function secondNumber(raw: string | null | undefined): number {
  if (!raw) return Number.NaN;
  const all = [...raw.matchAll(/([\d.]+)/g)].map((m) => parseFloat(m[1]!));
  return all.length >= 2 ? all[1]! : Number.NaN;
}

function propMap(properties: RawVariantProperties): Map<string, string> {
  const out = new Map<string, string>();
  for (const p of asEtsyProperties(properties)) {
    const name = (p.property_name ?? "").trim();
    const val = (p.values ?? []).join(", ").trim();
    if (name && val) out.set(name, val);
  }
  return out;
}

function firstProp(
  map: Map<string, string>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = map.get(k);
    if (v) return v;
  }
  // Case-insensitive fallback
  const lower = new Map([...map.entries()].map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower.get(k.toLowerCase());
    if (v) return v;
  }
  return null;
}

export type VariantSortable = {
  sku: string;
  properties?: RawVariantProperties;
  name?: string | null;
  label?: string | null;
};

/**
 * Genişlik (mm) artan → aynı mm'de kalınlık artan → beden artan → SKU.
 * Beden: legacy US bantları kanonik sırada; tek sayı (4..16) sayısal.
 */
export function compareVariantsByWidthThenSize(
  a: VariantSortable,
  b: VariantSortable,
): number {
  const ma = propMap(a.properties);
  const mb = propMap(b.properties);
  const wa = firstProp(ma, WIDTH_KEYS);
  const wb = firstProp(mb, WIDTH_KEYS);

  const wNa = firstNumber(wa);
  const wNb = firstNumber(wb);
  const aHasW = Number.isFinite(wNa);
  const bHasW = Number.isFinite(wNb);
  if (aHasW && bHasW && wNa !== wNb) return wNa - wNb;
  if (aHasW !== bHasW) return aHasW ? -1 : 1;

  const tNa = secondNumber(wa);
  const tNb = secondNumber(wb);
  if (Number.isFinite(tNa) && Number.isFinite(tNb) && tNa !== tNb) {
    return tNa - tNb;
  }

  if (wa && wb) {
    const wCmp = wa.localeCompare(wb, undefined, { numeric: true });
    if (wCmp !== 0) return wCmp;
  }

  const sa = firstProp(ma, SIZE_KEYS);
  const sb = firstProp(mb, SIZE_KEYS);
  const sizeCmp = compareSizeLabels(sa, sb);
  if (sizeCmp !== 0) return sizeCmp;

  return compareSkuAsc(a.sku, b.sku);
}

function compareSizeLabels(
  a: string | null,
  b: string | null,
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const ba = BAND_ORDER.get(a);
  const bb = BAND_ORDER.get(b);
  if (ba != null && bb != null) return ba - bb;
  if (ba != null) return -1;
  if (bb != null) return 1;

  const na = firstNumber(a);
  const nb = firstNumber(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Doğal SKU karşılaştırması (0009 < 0010). SKU her zaman dolu beklenir. */
export function compareSkuAsc(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Listing sırası: büyük/yeni SKU üstte, küçük altta.
 * SKU zorunlu — boş/null satırlar listeye girmez (`hasProductSku`).
 */
export function compareListingSkuDesc(a: string, b: string): number {
  return b.localeCompare(a, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/** Ürün-seviye SKU dolu mu (Etsy aynası; boş SKU panelde yok sayılır). */
export function hasProductSku(sku: string | null | undefined): boolean {
  return (sku ?? "").trim().length > 0;
}

export function sortVariantsByWidthThenSize<T extends VariantSortable>(
  rows: T[],
): T[] {
  return [...rows].sort(compareVariantsByWidthThenSize);
}

export function sortListingsBySkuDesc<T extends { sku?: string | null }>(
  rows: T[],
): T[] {
  return rows
    .filter((r) => hasProductSku(r.sku))
    .sort((a, b) => compareListingSkuDesc(a.sku!.trim(), b.sku!.trim()));
}
