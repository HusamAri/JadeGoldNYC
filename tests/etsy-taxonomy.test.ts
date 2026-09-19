import assert from "node:assert/strict";
import test from "node:test";

import {
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
