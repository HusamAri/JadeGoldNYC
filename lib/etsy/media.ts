import { EtsyClient } from "@/lib/etsy/client";

/**
 * Arşiv için listing medyası (görsel + video) — tam çözünürlük URL'i ve Etsy
 * medya kimliğiyle. `lib/etsy/images.ts` UI şeridi için hafif/tek-denemelik
 * çeker; bu ise KALICI arşiv için id + boyut + video da döndürür (retry açık).
 * Salt okuma (listings_r); shop_id gerekmez, listing_id yeterli.
 */

export interface ArchiveImage {
  imageId: number | null;
  url: string; // url_fullxfull (tam çözünürlük)
  rank: number;
  width: number | null;
  height: number | null;
}

export interface ArchiveVideo {
  videoId: number | null;
  url: string; // video_url (mp4)
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
}

interface EtsyImageRaw {
  listing_image_id?: number;
  rank?: number;
  url_fullxfull?: string;
  full_height?: number;
  full_width?: number;
}

interface EtsyVideoRaw {
  video_id?: number;
  height?: number;
  width?: number;
  thumbnail_url?: string;
  video_url?: string;
}

/** Bir listing'in tüm görsellerini (tam çözünürlük) rank sırasıyla döndürür. */
export async function getListingArchiveImages(
  orgId: string,
  etsyListingId: number,
): Promise<ArchiveImage[]> {
  const client = await EtsyClient.forOrg(orgId);
  const res = await client.get<{ results?: EtsyImageRaw[] }>(
    `/listings/${etsyListingId}/images`,
  );
  return (res.results ?? [])
    .map((img, i) => ({
      imageId: img.listing_image_id ?? null,
      url: img.url_fullxfull ?? "",
      rank: img.rank ?? i + 1,
      width: img.full_width ?? null,
      height: img.full_height ?? null,
    }))
    .filter((m) => m.url)
    .sort((a, b) => a.rank - b.rank);
}

/**
 * Bir listing'in videolarını döndürür. Çoğu listingde 0 ya da 1 video olur;
 * yoksa [] döner (Etsy videosu olmayan listing 404/boş verebilir).
 */
export async function getListingArchiveVideos(
  orgId: string,
  etsyListingId: number,
): Promise<ArchiveVideo[]> {
  const client = await EtsyClient.forOrg(orgId);
  let res: { results?: EtsyVideoRaw[] } | null = null;
  try {
    res = await client.get<{ results?: EtsyVideoRaw[] }>(
      `/listings/${etsyListingId}/videos`,
    );
  } catch {
    // Videosu olmayan listing bazı durumlarda hata verir — video yok say.
    return [];
  }
  return (res?.results ?? [])
    .map((v) => ({
      videoId: v.video_id ?? null,
      url: v.video_url ?? "",
      thumbnailUrl: v.thumbnail_url ?? null,
      width: v.width ?? null,
      height: v.height ?? null,
    }))
    .filter((m) => m.url);
}
