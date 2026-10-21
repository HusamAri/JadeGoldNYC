/** Beden bandları — sabit sütun sırası (üründen bağımsız kanonik sıra). */
export const RING_SIZE_BANDS = [
  "US 4-6.5",
  "US 7-9.5",
  "US 10-11.5",
  "US 12-13",
] as const;

export type RingSizeBand = (typeof RING_SIZE_BANDS)[number];

export interface VariantMatrixCell {
  sku: string;
  price_cents: number | null;
  weight_grams: number | null;
  currency: string;
}

export interface VariantMatrixRow {
  /** Ham genişlik etiketi (ör. "6mm"). */
  width: string;
  /** Sıralama için sayısal mm (ör. 6). */
  widthMm: number;
  /** RING_SIZE_BANDS ile aynı indeksli hücreler; eşleşme yoksa null. */
  cells: (VariantMatrixCell | null)[];
}

export interface RingVariantMatrix {
  kind: "ring";
  bands: readonly string[];
  rows: VariantMatrixRow[];
  /** Baskın para birimi (ilk hücreden); UI başlıkları için — hücreler kendi kurunu taşır. */
  currency: string;
  /** En az bir gramaj dolu mu (kolonu tümden boşsa üst-not için). */
  hasWeights: boolean;
}

export interface VariantMatrixDbRow {
  sku: string;
  properties: Record<string, string> | null;
  price_cents: number | null;
  weight_grams: number | string | null; // numeric — sürücü string döndürebilir
  currency: string | null;
}

export interface NecklaceMatrixRow {
  karat: string;
  /** Several SKUs at the same coordinate remain visible, never overwritten. */
  cells: VariantMatrixCell[][];
}

export interface NecklaceVariantMatrix {
  kind: "necklace";
  lengths: string[];
  groups: { metalColor: string; rows: NecklaceMatrixRow[] }[];
  variantCount: number;
  unmappedCount: number;
  hasWeights: boolean;
}

export type ProductVariantMatrix = RingVariantMatrix | NecklaceVariantMatrix;

const METAL_COLOR_ORDER = ["Yellow Gold", "White Gold", "Rose Gold"];

/** Sort labels such as 10K / 14K and 16 in / 18 in by their numeric value. */
function compareMeasurement(a: string, b: string): number {
  const am = widthToMm(a);
  const bm = widthToMm(b);
  return (
    (Number.isNaN(am) ? Infinity : am) -
      (Number.isNaN(bm) ? Infinity : bm) || a.localeCompare(b)
  );
}

function hasNecklaceAxes(row: VariantMatrixDbRow): boolean {
  const props = row.properties ?? {};
  return Boolean(props.Karat && props["Chain Length"] && props["Metal Color"]);
}

function buildNecklaceMatrix(
  variants: readonly VariantMatrixDbRow[],
): NecklaceVariantMatrix {
  const mapped = variants.filter(hasNecklaceAxes);
  const lengths = [...new Set(mapped.map((v) => v.properties!["Chain Length"]))]
    .sort(compareMeasurement);
  const karats = [...new Set(mapped.map((v) => v.properties!.Karat))]
    .sort(compareMeasurement);
  const colors = [...new Set(mapped.map((v) => v.properties!["Metal Color"]))]
    .sort((a, b) => {
      const ai = METAL_COLOR_ORDER.indexOf(a);
      const bi = METAL_COLOR_ORDER.indexOf(b);
      return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi) || a.localeCompare(b);
    });
  let hasWeights = false;
  const groups = colors.map((metalColor) => ({
    metalColor,
    rows: karats.map((karat) => ({
      karat,
      cells: lengths.map((length) => mapped
        .filter((v) => v.properties!["Metal Color"] === metalColor &&
          v.properties!.Karat === karat && v.properties!["Chain Length"] === length)
        .sort((a, b) => a.sku.localeCompare(b.sku))
        .map((v): VariantMatrixCell => {
          const weight = v.weight_grams == null ? null : Number(v.weight_grams);
          const finiteWeight = weight != null && Number.isFinite(weight) ? weight : null;
          if (finiteWeight != null && finiteWeight > 0) hasWeights = true;
          return {
            sku: v.sku,
            price_cents: v.price_cents,
            weight_grams: finiteWeight,
            currency: v.currency ?? "USD",
          };
        })),
    })),
  }));
  return {
    kind: "necklace",
    lengths,
    groups,
    variantCount: mapped.length,
    unmappedCount: variants.length - mapped.length,
    hasWeights,
  };
}

/** Three necklace axes are selected by their properties, never by brand. */
export function buildProductVariantMatrix(
  variants: readonly VariantMatrixDbRow[],
): ProductVariantMatrix {
  return variants.some(hasNecklaceAxes)
    ? buildNecklaceMatrix(variants)
    : buildRingMatrix(variants);
}

/** "6mm", "8 mm", "3" → 6 / 8 / 3; çözülemezse NaN. */
function widthToMm(raw: string): number {
  const m = /([\d.]+)/.exec(raw);
  return m ? parseFloat(m[1]) : NaN;
}

/** Pure ring builder; the legacy width/size ordering remains unchanged. */
function buildRingMatrix(rows: readonly VariantMatrixDbRow[]): RingVariantMatrix {
  // Sütunlar: veride ne varsa o — eski 4 sabit band VEYA yeni tek-sayı bedenler
  // (katalog v2: "4".."16"). Tek-sayı bedenler sayısal artan, bandlar kanonik
  // sırada; karışık/bilinmeyen değerler alfabetik sona düşer.
  const seen = new Set<string>();
  for (const v of rows) {
    const band = (v.properties ?? {})["Ring Size"];
    if (band != null && band !== "") seen.add(band);
  }
  const legacyOrder = new Map<string, number>(
    RING_SIZE_BANDS.map((b, i) => [b, i]),
  );
  const bands = [...seen].sort((a, b) => {
    const la = legacyOrder.get(a);
    const lb = legacyOrder.get(b);
    if (la != null && lb != null) return la - lb;
    if (la != null) return -1;
    if (lb != null) return 1;
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    if (!Number.isNaN(na)) return -1;
    if (!Number.isNaN(nb)) return 1;
    return a.localeCompare(b);
  });
  const bandIndex = new Map<string, number>(bands.map((b, i) => [b, i]));

  // Genişlik anahtarına göre grupla; her grup band-indeksli hücre dizisi tutar.
  const byWidth = new Map<string, VariantMatrixRow>();
  let currency = "USD";
  let currencySet = false;
  let hasWeights = false;

  for (const v of rows) {
    const props = v.properties ?? {};
    const width = props.Width;
    const band = props["Ring Size"];
    if (!width || band == null) continue;
    const col = bandIndex.get(band);
    if (col == null) continue; // bilinmeyen band — matris dışı

    const cur = v.currency ?? "USD";
    if (!currencySet) {
      currency = cur;
      currencySet = true;
    }
    const weight = v.weight_grams == null ? null : Number(v.weight_grams);
    if (weight != null && weight > 0) hasWeights = true;

    let row = byWidth.get(width);
    if (!row) {
      row = {
        width,
        widthMm: widthToMm(width),
        cells: bands.map(() => null),
      };
      byWidth.set(width, row);
    }
    row.cells[col] = {
      sku: v.sku,
      price_cents: v.price_cents,
      weight_grams: weight,
      currency: cur,
    };
  }

  const sortedRows = [...byWidth.values()].sort((a, b) => {
    const am = Number.isNaN(a.widthMm) ? Infinity : a.widthMm;
    const bm = Number.isNaN(b.widthMm) ? Infinity : b.widthMm;
    // Aynı mm'de kalınlık etiketi sıralar ("6mm · 1.5mm" < "6mm · 2.0mm").
    return am - bm || a.width.localeCompare(b.width);
  });

  return {
    kind: "ring",
    bands,
    rows: sortedRows,
    currency,
    hasWeights,
  };
}

