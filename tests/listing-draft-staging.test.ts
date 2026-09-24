import { strict as assert } from "node:assert";
import test from "node:test";

import { parseDraftStagingJson } from "@/lib/listing-draft-staging";

const context = { listingProtocol: "wedding_band", productType: "ring", variationAxes: ["Karat", "Width", "Ring Size"] };
const parse = (input: unknown) => parseDraftStagingJson(JSON.stringify(input), context);

test("optional staging data does not alter legacy drafts", () => {
  assert.deepEqual(parseDraftStagingJson(undefined, context), { data: { metadata: {} } });
  assert.deepEqual(parseDraftStagingJson("  ", context), { data: { metadata: {} } });
  assert.deepEqual(parse({}), { data: { metadata: {} } });
});

test("source metadata, two engraving fields, translations and pending gates are retained", () => {
  const input = {
    sku: "EON-NEW-Y", quantity: 20, weightSource: "estimated",
    metadata: {
      protocolVersion: "1.0", productType: "ring", listingProtocol: "wedding_band",
      section: "Wedding Bands", fixedMetal: { code: "Y", material: "Yellow gold" },
      variationAxes: context.variationAxes,
      dimensions: { widthsMm: [4, 5, 6, 7, 8], baseThicknessMm: null },
      taxonomy: { sellerPath: ["Jewelry", "Rings"], verificationStatus: "pending" },
      production: { personalization: { questions: [
        { questionText: "Inside Engraving Text", questionType: "text_input", required: false },
        { questionText: "Engraving Font", questionType: "dropdown", options: ["1 | Prata"], required: false },
      ] } },
      contentTranslations: { es: { title: "Alianza de oro", description: "Descripción", tags: ["oro amarillo"] } },
      pricing: { priceStatus: "pending_weight", laborMinimumUsd: 100 },
      approval: { panelCreationAuthorized: true, etsyDraftCreationAuthorized: false, livePublicationAuthorized: false, priceReadyForEtsy: false, cogsReadbackVerified: false, status: "panel_only", blockers: ["weight pending"] },
      sourcePackage: "new-model", imagePlan: [{ position: 0, filename: "hero.jpg" }],
    },
  };
  const before = JSON.stringify(input);
  assert.deepEqual(parse(input).data, input);
  assert.equal(JSON.stringify(input), before);
});

test("unknown root or metadata keys cannot override organization, state or identifiers", () => {
  for (const key of ["org_id", "id", "status", "etsy_listing_id", "price_cents", "product_type", "active"]) {
    assert.ok(parse({ [key]: "injected" }).error, key);
    assert.ok(parse({ metadata: { [key]: "injected" } }).error, key);
  }
});

test("source product contract and axis ordering must match the form", () => {
  for (const metadata of [
    { productType: "necklace" }, { listingProtocol: "sculptural_ring" },
    { variationAxes: ["Width", "Karat", "Ring Size"] }, { variationAxes: "Karat" },
  ]) assert.ok(parse({ metadata }).error);
  assert.equal(parse({ metadata: { ...context } }).error, undefined);
});

test("Etsy/live authorization cannot be enabled by metadata, nor smuggled through truthy values", () => {
  for (const key of ["etsyDraftCreationAuthorized", "livePublicationAuthorized"]) {
    for (const value of [true, "true", 1]) {
      assert.ok(parse({ metadata: { approval: { [key]: value } } }).error);
    }
  }
  assert.ok(parse({ metadata: { approval: { publish: true } } }).error);
  assert.ok(parse({ metadata: { approval: { blockers: "pending" } } }).error);
});

test("parent SKU, quantity and provenance have bounded explicit formats", () => {
  for (const sku of ["", " with spaces ", "X".repeat(33), "../x"]) assert.ok(parse({ sku }).error);
  for (const quantity of [0, -1, 1000, 1.5, "20", null]) assert.ok(parse({ quantity }).error);
  for (const weightSource of ["measured", "inferred", null, true]) assert.ok(parse({ weightSource }).error);
  assert.equal(parse({ sku: "MODEL-14K-Y", quantity: 20, weightSource: "estimated" }).error, undefined);
  assert.equal(parse({ quantity: 999, weightSource: "manual" }).error, undefined);
});

test("malformed JSON and non-object structures fail closed", () => {
  assert.ok(parseDraftStagingJson("{", context).error);
  assert.ok(parseDraftStagingJson({} as string, context).error);
  for (const input of [null, [], "json", 1, { metadata: [] }, { metadata: { taxonomy: "pending" } }]) assert.ok(parse(input).error);
});

test("prototype keys, nonfinite numbers, deep trees and oversized payloads are rejected", () => {
  assert.ok(parseDraftStagingJson('{"metadata":{"research":{"__proto__":{"x":1}}}}', context).error);
  assert.ok(parseDraftStagingJson('{"metadata":{"research":{"value":1e999}}}', context).error);
  let nested: unknown = "value";
  for (let i = 0; i < 12; i += 1) nested = { level: nested };
  assert.ok(parse({ metadata: { research: nested } }).error);
  assert.ok(parse({ metadata: { research: { long: "x".repeat(30_001) } } }).error);
  assert.ok(parse({ metadata: { imagePlan: Array(1001).fill(null) } }).error);
  assert.match(parse({ metadata: { research: { oversized: "ü".repeat(140_000) } } }).error ?? "", /256 KB/);
});

test("parser never invents ready/verified flags absent from source", () => {
  const data = parse({ metadata: { pricing: { priceStatus: "pending" } } }).data;
  assert.deepEqual(data?.metadata, { pricing: { priceStatus: "pending" } });
  assert.equal(data?.weightSource, undefined);
});
