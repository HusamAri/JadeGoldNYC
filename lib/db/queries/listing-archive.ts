import { createClient } from "@/lib/supabase/server";

export interface ArchiveRow {
  listingId: number;
  productId: string;
  title: string | null;
  status: string | null;
  numImages: number | null;
  archivedImages: number;
  archivedVideos: number;
}

type ProductRow = {
  id: string;
  etsy_listing_id: number | null;
  title: string | null;
  status: string | null;
  num_images: number | null;
};

type MediaRow = { etsy_listing_id: number; kind: string };

/**
 * Org'un Etsy listinglerini, her biri için panele arşivlenmiş görsel/video
 * sayısıyla döndürür. Arşivlenmiş medya `listing_media`'dan sayılır; kaynak
 * listing sayıları `products`'tan gelir (listing METNİ zaten orada).
 */
export async function getArchiveOverview(orgId: string): Promise<ArchiveRow[]> {
  const supabase = await createClient();
  const [{ data: products }, { data: media }] = await Promise.all([
    supabase
      .from("products")
      .select("id, etsy_listing_id, title, status, num_images")
      .eq("org_id", orgId)
      .not("etsy_listing_id", "is", null)
      .order("status", { ascending: true })
      .order("title", { ascending: true })
      .limit(1000),
    supabase
      .from("listing_media")
      .select("etsy_listing_id, kind")
      .eq("org_id", orgId)
      .limit(10000),
  ]);

  const counts = new Map<number, { image: number; video: number }>();
  for (const r of (media ?? []) as MediaRow[]) {
    const c = counts.get(r.etsy_listing_id) ?? { image: 0, video: 0 };
    if (r.kind === "image") c.image += 1;
    else if (r.kind === "video") c.video += 1;
    counts.set(r.etsy_listing_id, c);
  }

  return ((products ?? []) as ProductRow[])
    .filter((p) => p.etsy_listing_id != null)
    .map((p) => {
      const c = counts.get(p.etsy_listing_id as number) ?? { image: 0, video: 0 };
      return {
        listingId: p.etsy_listing_id as number,
        productId: p.id,
        title: p.title,
        status: p.status,
        numImages: p.num_images,
        archivedImages: c.image,
        archivedVideos: c.video,
      };
    });
}
