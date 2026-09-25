import { strict as assert } from "node:assert";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EtsyClient } from "@/lib/etsy/client";
import { createDraftListingFromProduct, type DraftProduct } from "@/lib/etsy/create-listing";

function fixture(): DraftProduct {
  return {
    id: "panel-draft-id", org_id: "org-id", etsy_listing_id: null,
    title: "Test wedding band", description: "Test", tags: [], materials: [],
    price_cents: 10000, quantity: 20, image_url: "https://example.invalid/hero.jpg",
    galleryUrls: [], product_type: "ring", listing_metadata: { listingProtocol: "wedding_band" },
    variants: [
      { sku: "TEST-4-7", properties: { Width: "4mm", "Ring Size": "7" }, price_cents: 10000, quantity: 20 },
      { sku: "TEST-5-8", properties: { Width: "5mm", "Ring Size": "8" }, price_cents: 12000, quantity: 20 },
    ],
  };
}

async function guardedCall(product: DraftProduct) {
  const calls: string[] = [];
  // Any DB access or Etsy request is a test failure signal, never a real API call.
  const admin = { from: () => { calls.push("DB"); throw new Error("unexpected DB access"); } } as unknown as SupabaseClient;
  const client = {
    get: async () => { calls.push("GET"); throw new Error("read-only test sentinel"); },
    request: async (method: string) => { calls.push(method); throw new Error("read-only test sentinel"); },
    requestForm: async (method: string) => { calls.push(method); throw new Error("unexpected Etsy write"); },
    requestMultipart: async (method: string) => { calls.push(method); throw new Error("unexpected Etsy image write"); },
  } as unknown as EtsyClient;
  const result = await createDraftListingFromProduct(admin, client, product.org_id, 1, product);
  return { result, calls };
}

test("panel-only approval flags never block the Etsy draft path", async () => {
  const product = fixture();
  product.listing_metadata!.approval = {
    etsyDraftCreationAuthorized: false, livePublicationAuthorized: false, priceReadyForEtsy: false,
  };
  const { result, calls } = await guardedCall(product);
  assert.equal(result.step, "create");
  assert.doesNotMatch(result.error ?? "", /yalnız panel taslağı/);
  assert.match(result.error ?? "", /read-only test sentinel/);
  assert.deepEqual(calls, ["GET"]);
});

test("third varying axis (Karat) reaches the read-only taxonomy step", async () => {
  const product = fixture();
  product.variants = product.variants.map((variant, index) => ({
    ...variant, properties: { ...variant.properties, Karat: index ? "18K" : "14K" },
  }));
  const { result, calls } = await guardedCall(product);
  assert.equal(result.step, "create");
  assert.match(result.error ?? "", /read-only test sentinel/);
  assert.deepEqual(calls, ["GET"]);
});

test("three-axis Etsy-array properties also reach the taxonomy step", async () => {
  const product = fixture();
  product.variants = product.variants.map((variant, index) => ({
    ...variant,
    properties: [
      { property_id: 516, property_name: "Karat", values: [index ? "18K" : "14K"] },
      { property_id: 513, property_name: "Width", values: [index ? "5mm" : "4mm"] },
      { property_id: 514, property_name: "Ring Size", values: [index ? "8" : "7"] },
    ],
  }));
  const { result, calls } = await guardedCall(product);
  assert.match(result.error ?? "", /read-only test sentinel/);
  assert.deepEqual(calls, ["GET"]);
});

test("three-axis grid over Etsy's 400-product cap fails before any call", async () => {
  const product = fixture();
  product.variants = [];
  for (const k of ["10K", "14K", "18K"]) for (let w = 4; w <= 8; w++) for (let s = 0; s < 27; s++) {
    product.variants.push({
      sku: `T-${k}-${w}-${s}`, properties: { Karat: k, Width: `${w}mm`, "Ring Size": String(4 + s / 2) },
      price_cents: 10000, quantity: 1,
    });
  }
  const { result, calls } = await guardedCall(product);
  assert.equal(result.step, "validation");
  assert.match(result.error ?? "", /en çok 400 varyant/);
  assert.deepEqual(calls, []);
});

test("a fourth varying axis fails closed before any call", async () => {
  const product = fixture();
  product.variants = product.variants.map((variant, index) => ({
    ...variant, properties: { ...variant.properties, Karat: index ? "18K" : "14K", Color: index ? "Rose" : "Yellow" },
  }));
  const { result, calls } = await guardedCall(product);
  assert.equal(result.step, "validation");
  assert.match(result.error ?? "", /üç varyasyon eksenini/);
  assert.deepEqual(calls, []);
});

test("legacy absent approval and valid two axes reach the existing read-only taxonomy step", async () => {
  for (const approval of [undefined, {}, { etsyDraftCreationAuthorized: true }]) {
    const product = fixture();
    if (approval !== undefined) product.listing_metadata!.approval = approval;
    const { result, calls } = await guardedCall(product);
    assert.equal(result.step, "create");
    assert.match(result.error ?? "", /read-only test sentinel/);
    assert.deepEqual(calls, ["GET"]);
  }
});

test("third constant property is not incorrectly treated as a third variation axis", async () => {
  const product = fixture();
  product.variants = product.variants.map((variant) => ({ ...variant, properties: { ...variant.properties, Karat: "14K" } }));
  const { result, calls } = await guardedCall(product);
  assert.match(result.error ?? "", /read-only test sentinel/);
  assert.deepEqual(calls, ["GET"]);
});

test("existing Etsy identity remains idempotent without any writes", async () => {
  const product = fixture();
  product.etsy_listing_id = 123;
  product.listing_metadata!.approval = { etsyDraftCreationAuthorized: false };
  const { result, calls } = await guardedCall(product);
  assert.equal(result.ok, true);
  assert.equal(result.skipped, true);
  assert.equal(result.step, "idempotency");
  assert.deepEqual(calls, []);
});
