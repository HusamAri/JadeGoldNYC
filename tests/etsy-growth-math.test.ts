/**
 * Growth-surface formula smoke tests — money cents, gold cost, LQS, ads signals.
 * Keeps the etsy-growth-tools-audit spot-check from regressing silently.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseMoneyToCents, centsToDecimal } from "../lib/money";
import {
  calculateGoldCost,
  derivePurchase18kCentsPerGram,
  PURCHASE_PRICE_CENTS_PER_GRAM,
  KARAT_PURITY,
  TROY_OUNCE_GRAMS,
} from "../lib/gold-cost";
import {
  scoreListing,
  averageListingScore,
  auditProduct,
  ETSY_TAG_LIMIT,
} from "../lib/etsy/listing-audit";
import { computeAdsSignals } from "../lib/ads/meta";
import { generateSeo } from "../lib/seo/keyword-engine";
import { summarizeSeo } from "../lib/db/queries/seo-tags";

describe("money cents", () => {
  it("parses TR and US money strings to integer cents", () => {
    assert.equal(parseMoneyToCents("12,34"), 1234);
    assert.equal(parseMoneyToCents("$12.34"), 1234);
    assert.equal(parseMoneyToCents("1.234,56"), 123456);
    assert.equal(parseMoneyToCents("1,234.56"), 123456);
    assert.equal(parseMoneyToCents(12.34), 1234);
    assert.equal(parseMoneyToCents(""), 0);
    assert.equal(centsToDecimal(1234), 12.34);
  });
});

describe("gold cost", () => {
  it("splits 14K purchase into melt + non-negative labor in cents", () => {
    const spot = 2650;
    const grams = 5;
    const c = calculateGoldCost(spot, "14K", grams);
    const meltPerG = (spot / TROY_OUNCE_GRAMS) * KARAT_PURITY["14K"];
    const purchasePerG = PURCHASE_PRICE_CENTS_PER_GRAM["14K"] / 100;
    assert.equal(c.totalGoldCostCents, Math.round(meltPerG * grams * 100));
    assert.equal(
      c.totalLaborCostCents,
      Math.round(Math.max(0, purchasePerG - meltPerG) * grams * 100),
    );
    assert.equal(
      c.totalPurchaseCostCents,
      Math.round(purchasePerG * grams * 100),
    );
  });

  it("derives 18K purchase as melt18 + 14K labor premium", () => {
    const spot = 2650;
    const got = derivePurchase18kCentsPerGram(spot);
    const melt14 = ((spot * 100) / TROY_OUNCE_GRAMS) * KARAT_PURITY["14K"];
    const melt18 = ((spot * 100) / TROY_OUNCE_GRAMS) * KARAT_PURITY["18K"];
    const labor = Math.max(0, PURCHASE_PRICE_CENTS_PER_GRAM["14K"] - melt14);
    assert.equal(got, Math.round(melt18 + labor));
  });
});

describe("listing quality score", () => {
  it("applies handbook penalties and reports tag counts against 13", () => {
    const bad = scoreListing({
      id: "2",
      etsyListingId: 2,
      title: "Gold",
      description: null,
      tags: ["gold", "golds", "ring"],
      numImages: 2,
    });
    const penalties: Record<string, number> = {
      tags_missing: 15,
      tags_duplicate: 5,
      tags_single_word: 5,
      title_rules: 15,
      title_repeat: 5,
      title_short: 5,
      title_long: 5,
      title_entities: 3,
      description_missing: 15,
      description_copies_title: 5,
      images_low: 10,
    };
    let expected = 100;
    for (const f of bad.findings) expected -= penalties[f.key] ?? 5;
    expected = Math.max(1, Math.min(100, expected));
    assert.equal(bad.score, expected);
    assert.ok(bad.findings.some((f) => f.key === "tags_duplicate"));
    assert.equal(averageListingScore([100, 50]), 75);

    const missing = auditProduct({
      id: "3",
      etsyListingId: 3,
      title: "x".repeat(120),
      description: "y".repeat(200),
      tags: ["a b", "c d"],
      numImages: 10,
    });
    assert.equal(
      missing.find((f) => f.key === "tags_missing")?.detail,
      `2/${ETSY_TAG_LIMIT} tag`,
    );
  });
});

describe("ads signals", () => {
  it("classifies bosa / budget-eater / opportunity without double labels", () => {
    const signals = computeAdsSignals([
      { productId: "a", spendCents: 10000, adsRevenueCents: 0 },
      { productId: "b", spendCents: 40000, adsRevenueCents: 50000 },
      { productId: "c", spendCents: 5000, adsRevenueCents: 20000 },
      { productId: "d", spendCents: 0, adsRevenueCents: 0 },
    ]);
    const byId = Object.fromEntries(
      signals.map((s) => [s.row.productId, s.signal]),
    );
    assert.equal(byId.a, "bosa");
    assert.equal(byId.b, "butce_yiyen");
    assert.equal(byId.c, "firsat");
    assert.equal(byId.d, undefined);
  });
});

describe("seo helper + summarize", () => {
  it("emits 13 compliant tags and a full honesty score", () => {
    const seo = generateSeo({
      productType: "necklace",
      chainStyle: "herringbone",
      material: "14k-solid",
      focus: "classic",
      market: "US",
      audience: "women",
    });
    assert.equal(seo.tags.length, 13);
    assert.equal(seo.score.value, seo.score.max);
    assert.ok(seo.tags.every((t) => t.chars <= 20 && t.text.includes(" ")));
  });

  it("counts approved with pending for the push queue", () => {
    const sum = summarizeSeo([
      { status: "pending", archetype: "leak" } as never,
      { status: "approved", archetype: "bestseller" } as never,
      { status: "pushed", archetype: "leak" } as never,
      { status: "rejected" } as never,
      { status: "failed" } as never,
    ]);
    assert.equal(sum.pending, 2);
    assert.equal(sum.pushed, 1);
    assert.equal(sum.rejected, 1);
    assert.equal(sum.failed, 1);
    assert.equal(sum.byArchetype.leak, 2);
  });
});
