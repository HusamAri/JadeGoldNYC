import { createClient } from "@/lib/supabase/server";

export interface MissingWeightRow {
  sku: string;
  name: string | null;
  productId: string | null;
  productTitle: string | null;
  etsyListingId: number | null;
}

/** Bir listing (ürün) altında gruplanmış eksik-ağırlık varyantları. */
export interface MissingWeightGroup {
  productId: string | null;
  productTitle: string | null;
  etsyListingId: number | null;
  variants: MissingWeightRow[];
}

type VariantJoinRow = {
  sku: string;
  name: string | null;
  product_id: string | null;
  products: { title: string | null; etsy_listing_id: number | null } | null;
};

/**
 * Ağırlığı (gram) boş varyantları LISTING (ürün) altında gruplayarak listeler.
 * Arama + sayfalama. Aynı ürünün varyantları bitişik gelsin diye product_id'ye
 * göre sıralanır; bir ürün sayfa sınırına denk gelirse başlığı bir sonraki
 * sayfada tekrar eder (kabul edilebilir).
 */
export async function listVariantsMissingWeight(
  orgId: string,
  opts: { search?: string; limit?: number; offset?: number } = {},
): Promise<{
  groups: MissingWeightGroup[];
  count: number;
  limit: number;
  offset: number;
}> {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("product_variants")
    .select("sku, name, product_id, products(title, etsy_listing_id)", {
      count: "exact",
    })
    .eq("org_id", orgId)
    .is("weight_grams", null)
    // Aynı listing'in varyantları bitişik olsun; sonra SKU'ya göre düzen.
    .order("product_id", { ascending: true, nullsFirst: false })
    .order("sku", { ascending: true })
    .range(offset, offset + limit - 1);

  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) query = query.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
  }

  const { data, count } = await query;
  const rows = (data ?? []) as unknown as VariantJoinRow[];

  // Bitişik satırları listing'e (product_id) göre grupla.
  const groups: MissingWeightGroup[] = [];
  for (const r of rows) {
    const variant: MissingWeightRow = {
      sku: r.sku,
      name: r.name,
      productId: r.product_id,
      productTitle: r.products?.title ?? null,
      etsyListingId: r.products?.etsy_listing_id ?? null,
    };
    const last = groups[groups.length - 1];
    if (last && last.productId === r.product_id) {
      last.variants.push(variant);
    } else {
      groups.push({
        productId: r.product_id,
        productTitle: r.products?.title ?? null,
        etsyListingId: r.products?.etsy_listing_id ?? null,
        variants: [variant],
      });
    }
  }

  return { groups, count: count ?? 0, limit, offset };
}
