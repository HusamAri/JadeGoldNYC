import { createClient } from "@/lib/supabase/server";

/**
 * Varyant matrisi (genişlik × beden) sorgusu — 0100.
 *
 * EON alyanslarında varyantlar iki eksene yayılır: Width (2–8mm) ve
 * "Ring Size" bandı (4 sabit band). Bu sorgu `product_variants`'i 2-D matris
 * için gruplar: satırlar = Width (mm'ye göre artan), sütunlar = sabit sıralı
 * beden bandları. Her hücre fiyat + gram + para birimi taşır. Org kapsamı
 * kardeş sorgularla (getListingDetail) aynı desen: RLS istemcisi + product_id.
 */

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

export interface ProductVariantMatrix {
  bands: readonly string[];
  rows: VariantMatrixRow[];
  /** Baskın para birimi (ilk hücreden); UI başlıkları için — hücreler kendi kurunu taşır. */
  currency: string;
  /** En az bir gramaj dolu mu (kolonu tümden boşsa üst-not için). */
  hasWeights: boolean;
}

interface VariantMatrixDbRow {
  sku: string;
  properties: Record<string, string> | null;
  price_cents: number | null;
  weight_grams: number | string | null; // numeric — sürücü string döndürebilir
  currency: string | null;
}

/** "6mm", "8 mm", "3" → 6 / 8 / 3; çözülemezse NaN. */
function widthToMm(raw: string): number {
  const m = /([\d.]+)/.exec(raw);
  return m ? parseFloat(m[1]) : NaN;
}

/**
 * Ürünün aktif varyantlarını genişlik × beden matrisine gruplar (RLS: org
 * üyesi). Satırlar genişliğe göre artan; sütunlar RING_SIZE_BANDS sırasında.
 */
export async function getProductVariantMatrix(
  productId: string,
): Promise<ProductVariantMatrix> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("sku, properties, price_cents, weight_grams, currency")
    .eq("product_id", productId)
    .eq("active", true);
  if (error) {
    console.error("variant-matrix sorgusu hatası:", error.message);
    return { bands: RING_SIZE_BANDS, rows: [], currency: "USD", hasWeights: false };
  }

  const rows = (data ?? []) as VariantMatrixDbRow[];
  const bandIndex = new Map<string, number>(
    RING_SIZE_BANDS.map((b, i) => [b, i]),
  );

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
        cells: RING_SIZE_BANDS.map(() => null),
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
    return am - bm;
  });

  return {
    bands: RING_SIZE_BANDS,
    rows: sortedRows,
    currency,
    hasWeights,
  };
}
