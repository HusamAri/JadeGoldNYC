import assert from "node:assert/strict";
import test from "node:test";

import type { EtsyClient } from "./client";
import {
  pushAndVerifyListingContent,
  updateListingText,
  upsertListingTranslation,
} from "./listing";

test("updates the English listing title and description together", async () => {
  const calls: unknown[][] = [];
  const client = {
    resolveShopId: async () => 61324215,
    requestForm: async (...args: unknown[]) => calls.push(args),
  } as unknown as EtsyClient;

  await updateListingText(client, 4554024684, {
    title: "Updated title",
    description: "Updated description",
  });

  assert.deepEqual(calls, [
    [
      "PATCH",
      "/shops/61324215/listings/4554024684",
      { title: "Updated title", description: "Updated description" },
    ],
  ]);
});

test("updates an existing Spanish translation", async () => {
  const calls: unknown[][] = [];
  const client = {
    requireShopId: async () => 61324215,
    requestForm: async (...args: unknown[]) => calls.push(args),
  } as unknown as EtsyClient;

  await upsertListingTranslation(client, 4554024684, "es", {
    title: "Título",
    description: "Descripción",
  });

  assert.deepEqual(calls, [
    [
      "PUT",
      "/shops/61324215/listings/4554024684/translations/es",
      { title: "Título", description: "Descripción" },
    ],
  ]);
});

test("creates the Spanish translation when Etsy returns 404", async () => {
  const methods: string[] = [];
  const client = {
    requireShopId: async () => 61324215,
    requestForm: async (method: string) => {
      methods.push(method);
      if (method === "PUT") {
        throw new Error("Etsy API hatası (404) PUT translation");
      }
    },
  } as unknown as EtsyClient;

  await upsertListingTranslation(client, 4554024684, "es", {
    title: "Título",
    description: "Descripción",
  });

  assert.deepEqual(methods, ["PUT", "POST"]);
});

test("writes and reads back English and Spanish listing content", async () => {
  const english = { title: "English title", description: "English description" };
  const spanish = { title: "Título", description: "Descripción" };
  const client = {
    resolveShopId: async () => 61324215,
    requireShopId: async () => 61324215,
    requestForm: async () => undefined,
    get: async (path: string) =>
      path.endsWith("/translations/es")
        ? { listing_id: 4554024684, language: "es", ...spanish }
        : { listing_id: 4554024684, ...english },
  } as unknown as EtsyClient;

  await assert.doesNotReject(() =>
    pushAndVerifyListingContent(client, 4554024684, {
      english,
      translations: { es: spanish },
    }),
  );
});

test("rejects a listing title readback mismatch", async () => {
  const client = {
    resolveShopId: async () => 61324215,
    requireShopId: async () => 61324215,
    requestForm: async () => undefined,
    get: async () => ({
      listing_id: 4554024684,
      title: "Stale title",
      description: "English description",
    }),
  } as unknown as EtsyClient;

  await assert.rejects(
    () =>
      pushAndVerifyListingContent(client, 4554024684, {
        english: {
          title: "English title",
          description: "English description",
        },
        translations: {},
      }),
    /English listing content readback mismatch/,
  );
});
