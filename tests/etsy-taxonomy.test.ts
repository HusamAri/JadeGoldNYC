import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVariationPlan,
  buildDraftInventoryProducts,
  createDraftListingFromProduct,
  inferEtsyListingKind,
  prepareVariantsForEtsy,
  taxonomyNamesForListing,
} from "../lib/etsy/create-listing";

test("routes a bracelet to the Bracelet taxonomy, never Wedding Bands", () => {
  const kind = inferEtsyListingKind(
    "14K Sunray Arc Bracelet, Solid Yellow Gold Adjustable Chain Bracelet",
    ["14k bracelet", "gold bracelet"],
  );
  assert.equal(kind, "bracelet");
  assert.deepEqual(taxonomyNamesForListing(kind), ["Bracelets", "Bracelet"]);
});

test("keeps Wedding Bands exclusive to explicit wedding-band wording", () => {
  assert.equal(
    inferEtsyListingKind("14K Gold Wedding Band Ring", ["wedding band"]),
    "wedding_band",
  );
  assert.equal(
    inferEtsyListingKind("14K Sunray Arc Bracelet", ["gold jewelry"]),
    "bracelet",
  );
});

test("turns named bracelet sizes into a Bracelet Length variation", () => {
  const variants = prepareVariantsForEtsy(
    [
      {
        sku: "BAS-F26-SUNRAY-14K-065",
        name: "6.5 in",
        properties: null,
        price_cents: 39900,
        quantity: 1,
      },
      {
        sku: "BAS-F26-SUNRAY-14K-070",
        name: "7 in",
        properties: null,
        price_cents: 42500,
        quantity: 1,
      },
      {
        sku: "BAS-F26-SUNRAY-14K-075",
        name: "7.5 in",
        properties: null,
        price_cents: 44900,
        quantity: 1,
      },
    ],
    "bracelet",
  );
  assert.deepEqual(
    variants.map((variant) => variant.properties),
    [
      { "Bracelet Length": "6.5 in" },
      { "Bracelet Length": "7 in" },
      { "Bracelet Length": "7.5 in" },
    ],
  );
});

const ringVariants = ["10K", "14K", "18K"].flatMap((karat) =>
  Array.from({ length: 25 }, (_, i) => 3 + i / 2).flatMap((size) =>
    ["Yellow Gold", "White Gold", "Rose Gold"].map((color) => ({
      sku: `${karat}-${size}-${color}`,
      name: `${karat} / US ${size} / ${color}`,
      properties: { "Gold Karat": karat, "Ring Size": `US ${size}`, "Gold Color": color },
      price_cents: 90000 + size * 1000,
      quantity: 1,
    })),
  ),
);

test("keeps all 225 gold, size and color combinations distinct in Etsy inventory", () => {
  const plan = buildVariationPlan(ringVariants);
  assert.deepEqual(plan.varyingNames, ["Gold Karat", "Ring Size", "Gold Color"]);
  assert.deepEqual(plan.overflowNames, []);
  const products = buildDraftInventoryProducts(ringVariants, plan, 90000, 1, 42);
  assert.equal(products.length, 225);
  assert.equal(new Set(products.map((p) => JSON.stringify(p.property_values))).size, 225);
  for (const [i, product] of products.entries()) {
    assert.deepEqual(product.property_values.map((p) => p.property_id), [513, 514, 516]);
    assert.equal(product.sku, ringVariants[i].sku);
    assert.equal(product.offerings[0].price, ringVariants[i].price_cents / 100);
    assert.equal(product.offerings[0].is_enabled, true);
  }
});

test("rejects a fourth axis before any Etsy or database write", async () => {
  const variants = ringVariants.map((v, i) => ({
    ...v, properties: { ...v.properties, Finish: i % 2 ? "Satin" : "Polished" },
  }));
  const result = await createDraftListingFromProduct(
    null as never, null as never, "org", 1,
    {
      id: "ring", org_id: "org", etsy_listing_id: null,
      title: "Gold Ring", description: null, tags: null, materials: null,
      price_cents: 90000, quantity: 1, image_url: null, galleryUrls: [], variants,
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.step, "create");
  assert.match(result.error ?? "", /Fazladan eksenler: Finish/);
});
