import assert from "node:assert/strict";
import test from "node:test";

import { widthOfSku } from "../lib/etsy/sku-width";
import { V4, eonListCents } from "../lib/pricing/gold-index";

test("widthOfSku: v4/TTG şeması", () => {
  assert.equal(widthOfSku("TTG-R-1006-10MM-10"), 10);
  assert.equal(widthOfSku("TTG-R-1406-6MM-9.5"), 6);
  assert.equal(widthOfSku("GLD-R-1404-12MM-13"), 12);
});

test("widthOfSku: EON-R panel şeması (2026-09-29'a kadar tanınmıyordu)", () => {
  assert.equal(widthOfSku("EON-R-1015-18-03-030"), 3);
  assert.equal(widthOfSku("EON-R-1015-10-08-135"), 8);
});

test("widthOfSku: tanınmayan SKU'ya dokunulmaz", () => {
  assert.equal(widthOfSku("EON-FROST-Y-10-03-030"), null);
  assert.equal(widthOfSku("EON-R-15-18-03-030"), null);
  assert.equal(widthOfSku(""), null);
});

test("altın endeksi: $250 iki tonlu kademesi diğer kademelerle karışmaz", () => {
  const tiers = [
    V4.laborTwoToneUsd,
    V4.laborHandfinishedTargetUsd,
    V4.laborMilgrainUsd,
    V4.laborStandardTargetUsd,
    V4.laborStandardUsd,
  ];
  assert.equal(V4.laborTwoToneUsd, 250);
  for (const karat of [10, 14, 18]) {
    for (const w of [4, 5, 6, 7, 8]) {
      for (const g of [2.5, 4.2, 6.9, 9.8]) {
        const cents = eonListCents(karat, w, g, 250, 4399.9);
        const found = tiers.find((l) => eonListCents(karat, w, g, l, 4399.9) === cents);
        assert.equal(found, 250, `${karat}K ${w}mm ${g}g`);
      }
    }
  }
});
