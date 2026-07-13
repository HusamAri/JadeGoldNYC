import { EtsyClient } from "@/lib/etsy/client";

/**
 * Canlı Etsy listing görselleri (getListingImages — salt okuma, shop_id
 * gerektirmez). Komuta merkezi detay sayfası görsel şeridi için.
 */

export interface ListingImage {
  url_fullxfull: string | null;
  url_570xN: string | null;
  url_75x75: string | null;
  rank: number;
}

interface EtsyListingImageRaw {
  listing_image_id?: number;
  rank?: number;
  url_75x75?: string;
  url_570xN?: string;
  url_fullxfull?: string;
}

const TIMEOUT_MS = 5_000;

/**
 * Bir listing'in Etsy'deki görsellerini rank sırasıyla döndürür.
 * Graceful: Etsy bağlı değilse ya da istek hata verirse [] döner; sayfayı
 * bekletmemek için TEK deneme (429 retry yok) + 5 sn zaman aşımı uygulanır.
 */
export async function getListingImages(
  orgId: string,
  etsyListingId: number,
): Promise<ListingImage[]> {
  try {
    const client = await EtsyClient.forOrg(orgId);
    // retry=0 → tek deneme; hata olursa null'a düşür (zaman aşımından sonra
    // gelen ret, unhandled rejection üretmesin).
    const request = client
      .get<{ results?: EtsyListingImageRaw[] }>(
        `/listings/${etsyListingId}/images`,
        undefined,
        0,
      )
      .catch(() => null);
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), TIMEOUT_MS);
    });
    const res = await Promise.race([request, timeout]);
    if (!res) return [];
    return (res.results ?? [])
      .map((img, i) => ({
        url_fullxfull: img.url_fullxfull ?? null,
        url_570xN: img.url_570xN ?? null,
        url_75x75: img.url_75x75 ?? null,
        rank: img.rank ?? i + 1,
      }))
      .sort((a, b) => a.rank - b.rank);
  } catch {
    // EtsyNotConnectedError / env eksik vb. — görsel şeridi boş kalır.
    return [];
  }
}
