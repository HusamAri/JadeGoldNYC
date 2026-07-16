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

/**
 * Listing etiketlerini (tags) günceller (updateListing PATCH, form-encoded).
 * `listings_w` kapsamı + shop_id gerektirir. Etsy `tags`'i virgülle ayrılmış
 * TEK string bekler; kelimeleri kendisi kombinler. Yalnız `tags` alanına
 * dokunur; diğer alanlar Etsy tarafında korunur. Etsy kuralı: ≤13 tag, her
 * biri ≤20 karakter (çağıran taraf doğrular).
 */
export async function updateListingTags(
  client: EtsyClient,
  listingId: number,
  tags: string[],
): Promise<void> {
  const shopId = await client.requireShopId();
  await client.requestForm<unknown>(
    "PATCH",
    etsyPaths.shopListing(shopId, listingId),
    { tags: tags.join(",") },
  );
}
