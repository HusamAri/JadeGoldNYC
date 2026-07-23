import { createClient } from "@/lib/supabase/server";

export interface VariantStockRow {
  sku: string;
  name: string | null;
  etsyListingId: number | null;
  quantity: number | null; // Etsy'den okunan güncel adet
  targetQuantity: number | null; // panelde girilen hedef
}

export interface VariantStockGroup {
  productId: string;
  productTitle: string;
  etsyListingId: number | null;
  variants: VariantStockRow[];
}

type Row = {
  sku: string;
  name: string | null;
  quantity: number | null;
  target_quantity: number | null;
  etsy_listing_id: number | null;
  product_id: string;
  products: { title: string | null } | null;
};

/**
 * Varyant-başına stok girişi için: ürüne (listing) bağlı, Etsy liste kimliği
 * olan varyantları LISTING altında gruplayarak listeler. Yalnız gönderilebilir
 * (product_id + etsy_listing_id dolu) varyantlar. product_id'ye göre sıralanır
 * ki aynı listing'in varyantları bitişik gelsin.
 */
export async function listVariantStock(
  orgId: string,
  opts: { search?: string } = {},
): Promise<VariantStockGroup[]> {
  const supabase = await createClient();
  let query = supabase
    .from("product_variants")
    .select(
      "sku, name, quantity, target_quantity, etsy_listing_id, product_id, products!inner(title)",
    )
    .eq("org_id", orgId)
    .not("product_id", "is", null)
    .not("etsy_listing_id", "is", null)
    .eq("active", true)
    .order("product_id", { ascending: true })
    .order("sku", { ascending: true });

  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) query = query.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) console.error("[stok] variant-stock sorgusu:", error.message);
  const rows = (data ?? []) as unknown as Row[];

  const groups: VariantStockGroup[] = [];
  for (const r of rows) {
    const variant: VariantStockRow = {
      sku: r.sku,
      name: r.name,
      etsyListingId: r.etsy_listing_id,
      quantity: r.quantity,
      targetQuantity: r.target_quantity,
    };
    const last = groups[groups.length - 1];
    if (last && last.productId === r.product_id) {
      last.variants.push(variant);
    } else {
      groups.push({
        productId: r.product_id,
        productTitle: r.products?.title ?? "—",
        etsyListingId: r.etsy_listing_id,
        variants: [variant],
      });
    }
  }
  return groups;
}
