import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

export interface EtsyListingDetail {
  listing_id: number;
  title?: string;
  description?: string;
}

/** Tek listing'i (güncel açıklamasıyla) okur. */
export async function getListing(
  client: EtsyClient,
  listingId: number,
): Promise<EtsyListingDetail> {
  return client.get<EtsyListingDetail>(etsyPaths.listing(listingId));
}

/**
 * Listing açıklamasını günceller (updateListing PATCH, form-encoded).
 * `listings_w` kapsamı + shop_id gerektirir. Yalnız `description` alanına
 * dokunur; diğer alanlar Etsy tarafında korunur.
 */
export async function updateListingDescription(
  client: EtsyClient,
  listingId: number,
  description: string,
): Promise<void> {
  const shopId = await client.resolveShopId();
  if (!shopId) throw new Error("Etsy shop_id çözülemedi.");
  await client.requestForm<unknown>(
    "PATCH",
    etsyPaths.shopListing(shopId, listingId),
    { description },
  );
}
