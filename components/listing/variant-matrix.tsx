import { getProductVariantMatrix } from "@/lib/db/queries/variants";
import {
  VariantMatrixView,
  type VariantCompetitorCell,
} from "@/components/listing/variant-matrix-view";

export type { VariantCompetitorCell } from "@/components/listing/variant-matrix-view";

/** Server component: product/organization access remains in the RLS query. */
export async function VariantMatrix({
  productId,
  competitors,
  discountPct = 0,
}: {
  productId: string;
  competitors?: VariantCompetitorCell[];
  discountPct?: number;
}) {
  const matrix = await getProductVariantMatrix(productId);
  return (
    <VariantMatrixView
      matrix={matrix}
      competitors={competitors}
      discountPct={discountPct}
    />
  );
}
