import assert from "node:assert/strict";
import test from "node:test";

import {
  configuredWeddingBandsTaxonomyId,
  DEFAULT_WEDDING_BANDS_TAXONOMY_ID,
} from "../lib/etsy/create-listing";

test("uses the verified Wedding Bands taxonomy id by default", () => {
  assert.equal(
    configuredWeddingBandsTaxonomyId(undefined),
    DEFAULT_WEDDING_BANDS_TAXONOMY_ID,
  );
});

test("accepts a positive integer override", () => {
  assert.equal(configuredWeddingBandsTaxonomyId("4321"), 4321);
});

test("rejects invalid overrides before any Etsy request", () => {
  assert.throws(
    () => configuredWeddingBandsTaxonomyId("invalid"),
    /pozitif bir tam sayı/,
  );
  assert.throws(
    () => configuredWeddingBandsTaxonomyId("0"),
    /pozitif bir tam sayı/,
  );
});
