import { createClient } from "@/lib/supabase/server";
import {
  buildProductVariantMatrix,
  type ProductVariantMatrix,
  type VariantMatrixDbRow,
} from "@/lib/variant-matrix";

export {
  RING_SIZE_BANDS,
  type RingSizeBand,
  type VariantMatrixCell,
  type VariantMatrixRow,
  type ProductVariantMatrix,
} from "@/lib/variant-matrix";

/** Active variants only; the authenticated client retains organization RLS. */
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
    return buildProductVariantMatrix([]);
  }
  return buildProductVariantMatrix((data ?? []) as VariantMatrixDbRow[]);
}
