import { createClient } from "@/lib/supabase/server";

/**
 * Görsel Üretim Kiti'nde "üretildi" işaretlenmiş listing kimliklerini döndürür.
 * İstemci bir Set kurup kartları buna göre işaretler. Yalnız done=true satırlar.
 */
export async function listProducedListingIds(orgId: string): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photo_production")
    .select("etsy_listing_id")
    .eq("org_id", orgId)
    .eq("done", true);

  const rows = (data ?? []) as unknown as { etsy_listing_id: number }[];
  return rows.map((r) => Number(r.etsy_listing_id));
}
