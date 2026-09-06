import assert from "node:assert/strict";
import test from "node:test";

import type { EtsyClient } from "./client";
import { syncEtsyListingGallery } from "./gallery-sync";

function panelImages(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    url: `https://images.example.test/${index + 1}.jpg`,
    position: index,
  }));
}

function imageResponse() {
  return Promise.resolve(
    new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    }),
  );
}

test("resumes a one-image Etsy draft and verifies all ten ranks", async () => {
  const remote = [{ listing_image_id: 101, rank: 1 }];
  const uploadedRanks: number[] = [];
  const client = {
    get: async () => ({ results: remote }),
    requestMultipart: async (_method: string, _path: string, form: FormData) => {
      const rank = Number(form.get("rank"));
      uploadedRanks.push(rank);
      remote.push({ listing_image_id: 100 + rank, rank });
    },
  } as unknown as EtsyClient;

  const result = await syncEtsyListingGallery(
    client,
    61324215,
    4569890361,
    panelImages(10),
    imageResponse,
  );

  assert.deepEqual(uploadedRanks, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(result.uploadedCount, 9);
  assert.equal(result.finalCount, 10);
  assert.deepEqual(result.ranks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("does not upload duplicates when the remote gallery is complete", async () => {
  const remote = panelImages(10).map((_, index) => ({
    listing_image_id: 201 + index,
    rank: index + 1,
  }));
  let uploadCount = 0;
  const client = {
    get: async () => ({ results: remote }),
    requestMultipart: async () => {
      uploadCount += 1;
    },
  } as unknown as EtsyClient;

  const result = await syncEtsyListingGallery(
    client,
    61324215,
    4569902788,
    panelImages(10),
    imageResponse,
  );

  assert.equal(uploadCount, 0);
  assert.equal(result.uploadedCount, 0);
  assert.equal(result.finalCount, 10);
});

test("fails closed when Etsy readback does not contain every image", async () => {
  const remote = [{ listing_image_id: 301, rank: 1 }];
  const client = {
    get: async () => ({ results: remote }),
    requestMultipart: async () => undefined,
  } as unknown as EtsyClient;

  await assert.rejects(
    () =>
      syncEtsyListingGallery(
        client,
        61324215,
        4569902988,
        panelImages(3),
        imageResponse,
      ),
    /1\/3 görsel/,
  );
});
