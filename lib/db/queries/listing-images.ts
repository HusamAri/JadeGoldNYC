import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListingImage } from "@/lib/types";

/**
 * Bir ürünün galeri görselleri, sıraya göre (position artan, sonra created_at).
 * RLS yalnız çağıranın org'unu döndürür.
 */
export async function listListingImages(
  supabase: SupabaseClient,
  productId: string,
): Promise<ListingImage[]> {
  const { data, error } = await supabase
    .from("listing_images")
    .select(
      "id, org_id, product_id, url, storage_path, source, drive_file_id, alt, position, created_by, created_at",
    )
    .eq("product_id", productId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listListingImages hatası:", error.message);
    return [];
  }
  return (data ?? []) as ListingImage[];
}
