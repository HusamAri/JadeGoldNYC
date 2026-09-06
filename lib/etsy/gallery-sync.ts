import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

export interface OrderedListingImage {
  url: string;
  position: number;
}

interface EtsyImageReadback {
  listing_image_id?: number;
  rank?: number;
}

export interface GallerySyncResult {
  expectedCount: number;
  finalCount: number;
  uploadedCount: number;
  imageIds: number[];
  ranks: number[];
}

type GalleryClient = Pick<EtsyClient, "get" | "requestMultipart">;

function normalizedImages(images: OrderedListingImage[]): OrderedListingImage[] {
  const seen = new Set<string>();
  return images
    .map((image) => ({ ...image, url: image.url.trim() }))
    .filter((image) => image.url.length > 0)
    .sort((left, right) => left.position - right.position)
    .filter((image) => {
      if (seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    })
    .slice(0, 10);
}

function assertContiguousRanks(
  images: EtsyImageReadback[],
  expectedCount: number,
  stage: "before upload" | "after upload",
): number[] {
  const ranks = images
    .map((image) => image.rank)
    .filter((rank): rank is number => Number.isInteger(rank))
    .sort((left, right) => left - right);
  const expectedRanks = Array.from({ length: expectedCount }, (_, index) => index + 1);
  if (
    ranks.length !== expectedCount ||
    !expectedRanks.every((rank, index) => ranks[index] === rank)
  ) {
    throw new Error(
      `Etsy galeri sırası ${stage} doğrulanamadı: ${JSON.stringify(ranks)}.`,
    );
  }
  return ranks;
}

/**
 * Appends only the missing suffix of an Etsy draft gallery, then verifies the
 * complete remote image id and rank set. Existing images are never deleted or
 * overwritten, so a retry can safely continue after a partial upload.
 */
export async function syncEtsyListingGallery(
  client: GalleryClient,
  shopId: number,
  listingId: number,
  panelImages: OrderedListingImage[],
  fetchImage: typeof fetch = fetch,
): Promise<GallerySyncResult> {
  const expected = normalizedImages(panelImages);
  if (expected.length === 0) {
    throw new Error("Panel galerisi boş, Etsy görsel senkronu yapılamadı.");
  }

  const before = await client.get<{ results?: EtsyImageReadback[] }>(
    etsyPaths.listingImagesRead(listingId),
  );
  const remoteBefore = before.results ?? [];
  const remoteBeforeCount = remoteBefore.length;
  if (remoteBeforeCount > expected.length) {
    throw new Error(
      `Etsy galerisinde panelden fazla görsel var: ${remoteBeforeCount}/${expected.length}.`,
    );
  }
  assertContiguousRanks(remoteBefore, remoteBeforeCount, "before upload");

  for (let index = remoteBeforeCount; index < expected.length; index += 1) {
    const response = await fetchImage(expected[index].url);
    if (!response.ok) {
      throw new Error(
        `${index + 1}. panel görseli indirilemedi (HTTP ${response.status}).`,
      );
    }
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new Error(
        `${index + 1}. panel dosyası görsel değil (${contentType}).`,
      );
    }
    const form = new FormData();
    form.append(
      "image",
      new Blob([await response.arrayBuffer()], { type: contentType }),
      `listing-${String(index + 1).padStart(2, "0")}.jpg`,
    );
    form.append("rank", String(index + 1));
    await client.requestMultipart(
      "POST",
      etsyPaths.listingImages(shopId, listingId),
      form,
    );
  }

  const after = await client.get<{ results?: EtsyImageReadback[] }>(
    etsyPaths.listingImagesRead(listingId),
  );
  const remoteAfter = after.results ?? [];
  if (remoteAfter.length !== expected.length) {
    throw new Error(
      `Etsy görsel geri okuması doğrulanamadı: ${remoteAfter.length}/${expected.length} görsel.`,
    );
  }
  const ranks = assertContiguousRanks(remoteAfter, expected.length, "after upload");
  const imageIds = remoteAfter
    .map((image) => image.listing_image_id)
    .filter((id): id is number => Number.isInteger(id));
  if (imageIds.length !== expected.length || new Set(imageIds).size !== expected.length) {
    throw new Error(
      `Etsy görsel kimlikleri doğrulanamadı: ${imageIds.length}/${expected.length}.`,
    );
  }

  return {
    expectedCount: expected.length,
    finalCount: remoteAfter.length,
    uploadedCount: expected.length - remoteBeforeCount,
    imageIds,
    ranks,
  };
}
