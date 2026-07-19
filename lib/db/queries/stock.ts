import { createClient } from "@/lib/supabase/server";
import { sortListingsBySkuDesc } from "@/lib/variant-sort";

export interface StockProduct {
  id: string;
  etsy_listing_id: number | null;
  sku: string | null;
  title: string;
  quantity: number | null; // Etsy'den okunan güncel adet
  target_quantity: number | null; // panelde doldurulan hedef adet
  has_variations: boolean | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
}

/**
 * Stok çalışma sayfası için aktif ürünler. Kategori panelde başlıktan türetilir
 * (products tablosunda kategori kolonu yok). Etsy'den senkronlanan ürünler
 * üzerinden çalışır. Sıra: genel SKU ↓ (yeni üstte).
 */
export async function listStockProducts(orgId: string): Promise<StockProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, etsy_listing_id, sku, title, quantity, target_quantity, has_variations, image_url, price_cents, currency, url",
    )
    .eq("org_id", orgId)
    .eq("status", "active")
    .is("archived_at", null)
    .not("sku", "is", null)
    .neq("sku", "")
    .order("sku", { ascending: false });
  return sortListingsBySkuDesc(
    (data ?? []) as unknown as StockProduct[],
  );
}
