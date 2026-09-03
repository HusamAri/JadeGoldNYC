import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

export interface EtsyListingDetail {
  listing_id: number;
  title?: string;
  description?: string;
}

export interface EtsyListingTranslation {
  listing_id: number;
  language: string;
  title: string;
  description: string;
  tags?: string[];
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

export async function updateListingText(
  client: EtsyClient,
  listingId: number,
  content: { title: string; description: string },
): Promise<void> {
  const shopId = await client.resolveShopId();
  if (!shopId) throw new Error("Etsy shop_id çözülemedi.");
  await client.requestForm<unknown>(
    "PATCH",
    etsyPaths.shopListing(shopId, listingId),
    content,
  );
}

export async function getListingTranslation(
  client: EtsyClient,
  listingId: number,
  language: string,
): Promise<EtsyListingTranslation> {
  const shopId = await client.requireShopId();
  return client.get<EtsyListingTranslation>(
    etsyPaths.listingTranslation(shopId, listingId, language),
  );
}

export async function upsertListingTranslation(
  client: EtsyClient,
  listingId: number,
  language: string,
  content: { title: string; description: string },
): Promise<void> {
  const shopId = await client.requireShopId();
  const path = etsyPaths.listingTranslation(shopId, listingId, language);
  try {
    await client.requestForm<unknown>("PUT", path, content);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("(404)")) {
      throw error;
    }
    await client.requestForm<unknown>("POST", path, content);
  }
}

export async function pushAndVerifyListingContent(
  client: EtsyClient,
  listingId: number,
  content: {
    english: { title: string; description: string };
    translations: Record<
      string,
      { title: string; description: string }
    >;
  },
): Promise<void> {
  await updateListingText(client, listingId, content.english);
  for (const [language, translation] of Object.entries(content.translations)) {
    await upsertListingTranslation(client, listingId, language, translation);
  }

  const englishReadback = await getListing(client, listingId);
  if (
    englishReadback.title !== content.english.title ||
    englishReadback.description !== content.english.description
  ) {
    throw new Error("English listing content readback mismatch.");
  }
  for (const [language, translation] of Object.entries(content.translations)) {
    const translationReadback = await getListingTranslation(
      client,
      listingId,
      language,
    );
    if (
      translationReadback.title !== translation.title ||
      translationReadback.description !== translation.description
    ) {
      throw new Error(`${language} listing translation readback mismatch.`);
    }
  }
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
