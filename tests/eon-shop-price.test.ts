import assert from "node:assert/strict";
import test from "node:test";

import { eonListCents, eonSaleCents } from "@/lib/pricing/gold-index";
import {
  capShopPrice,
  competitiveShopPrice,
  MAX_SHOP_DISCOUNT,
} from "@/lib/pricing/eon-shop-price";

const BASIS = 4399.9;
const SPOT = 4198.4;

test("a list price follows the new gold list and stays inside a 35 percent cut", () => {
  const decision = competitiveShopPrice({
    sku: "GLD-R-1002-6MM-7",
    title: "Flat Wedding Band, Solid 10k Yellow Gold Comfort Fit",
    grams: 4.7,
    oldCents: 74745,
    basisPerOzt: BASIS,
    spotPerOzt: SPOT,
  });
  assert.equal(decision.action, "reprice");
  if (decision.action !== "reprice") return;
  const list = eonListCents(10, 6, 4.7, 30, SPOT, { narrow: 1.55, wide: 2 });
  assert.equal(decision.newCents, list);
  assert.equal(decision.matched, "list");
  assert.equal(decision.capped, false);
  assert.ok(decision.cutPct > 0);
  assert.ok(decision.cutPct < 0.1);
  assert.ok(decision.cutPct <= MAX_SHOP_DISCOUNT + 1e-9);
});

test("a price already on the sale only follows the lower gold spot", () => {
  const oldSale = eonSaleCents(10, 6, 4.7, 30, BASIS, {
    narrow: 1.55,
    wide: 2,
  });
  const decision = competitiveShopPrice({
    sku: "GLD-R-1002-6MM-7",
    title: "Flat Wedding Band, Solid 10k Yellow Gold",
    grams: 4.7,
    oldCents: oldSale,
    basisPerOzt: BASIS,
    spotPerOzt: SPOT,
  });
  assert.equal(decision.action, "reprice");
  if (decision.action !== "reprice") return;
  assert.equal(decision.matched, "sale");
  assert.equal(
    decision.newCents,
    eonSaleCents(10, 6, 4.7, 30, SPOT, { narrow: 1.55, wide: 2 }),
  );
  assert.ok(decision.cutPct < 0.1);
});

test("the 35 percent cap stops a deeper cut", () => {
  const capped = capShopPrice(100000, 40000, 10000);
  assert.ok(capped);
  assert.equal(capped?.newCents, 65000);
  assert.equal(capped?.capped, true);
  assert.equal(capped?.heldAtFloor, false);
});

test("the cost floor outranks the 35 percent cap", () => {
  const capped = capShopPrice(100000, 40000, 70000);
  assert.equal(capped?.newCents, 70000);
  assert.equal(capped?.heldAtFloor, true);
  assert.equal(capped?.capped, false);
});

test("a target at or above the current price is left alone", () => {
  assert.equal(capShopPrice(50000, 52000, 10000), null);
  assert.equal(capShopPrice(50000, 50000, 10000), null);
});

test("a price that is not on the formula is not rewritten", () => {
  const decision = competitiveShopPrice({
    sku: "GLD-R-1002-6MM-7",
    title: "Flat Wedding Band",
    grams: 4.7,
    oldCents: 20000,
    basisPerOzt: BASIS,
    spotPerOzt: SPOT,
  });
  assert.deepEqual(decision, { action: "skip", reason: "taban-uyumsuz" });
});

test("the ring sizer sku is outside the gold formula", () => {
  const decision = competitiveShopPrice({
    sku: "SIZER-1",
    title: "Ring Sizer Tool",
    grams: 5,
    oldCents: 1100,
    basisPerOzt: BASIS,
    spotPerOzt: SPOT,
  });
  assert.equal(decision.action, "skip");
});
