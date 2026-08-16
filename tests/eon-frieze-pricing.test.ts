import assert from "node:assert/strict";
import test from "node:test";

import {
  computeEonCost,
  EON_LABOR_HANDFINISHED_USD,
  EON_MULTIPLIER_HANDFINISHED_NARROW,
} from "@/lib/pricing-engine/eon-cost";
import { detectProfile } from "@/lib/pricing-engine/run";
import {
  eonListCents,
  isEonFriezeProduct,
  V4,
} from "@/lib/pricing/gold-index";

const ACTIVE_BASIS = 4399.9;

test("Frieze titles map to the handfinished profile", () => {
  assert.equal(
    detectProfile("14K Solid Yellow Gold Greek Key Wedding Band, Maeander Rope Edge"),
    "frieze",
  );
  assert.equal(
    detectProfile("10K Solid Gold Two Tone Diamond-Cut Wedding Band"),
    "frieze",
  );
});

test("Frieze SKU and title coverage includes every patterned family", () => {
  assert.equal(isEonFriezeProduct("GLD-R-1404-6MM-7", "Milgrain"), true);
  assert.equal(isEonFriezeProduct("GLD-R-1006-6MM-7", "Basketweave"), true);
  assert.equal(isEonFriezeProduct("GLD-R-1007-6MM-7", "Diagonal Ribbed"), true);
  assert.equal(isEonFriezeProduct("TTG-R-1806-8MM-7", "Two Tone"), true);
  assert.equal(isEonFriezeProduct("WHG-R-1408-6MM-7", "Greek Key"), true);
  assert.equal(isEonFriezeProduct("GLD-R-1401-6MM-7", "Dome"), false);
});

test("Frieze cost uses 55 USD labor and the 1.75 narrow multiplier", () => {
  const result = computeEonCost({
    karat: "14K",
    widthMm: 6,
    sizeUs: 7,
    profile: "frieze",
    spotUsdPerOzt: ACTIVE_BASIS,
  });

  assert.equal(EON_LABOR_HANDFINISHED_USD, 55);
  assert.equal(EON_MULTIPLIER_HANDFINISHED_NARROW, 1.75);
  assert.equal(result.laborUsd, 55);
  assert.equal(result.multiplier, 1.75);
  assert.equal(result.listCents, 130_000);
  assert.equal(result.saleCents, 97_500);
});

test("Gold reprice formula matches the Frieze cost engine", () => {
  assert.equal(V4.laborMilgrainUsd, 55);
  assert.equal(V4.multHandfinishedNarrow, 1.75);
  assert.equal(
    eonListCents(14, 6, 5.34, 55, ACTIVE_BASIS, { narrow: 1.75 }),
    130_000,
  );
});

test("All 390 whole-size Frieze cells match both pricing engines", () => {
  for (const karat of ["10K", "14K", "18K"] as const) {
    for (let widthMm = 3; widthMm <= 12; widthMm += 1) {
      for (let sizeUs = 4; sizeUs <= 16; sizeUs += 1) {
        const result = computeEonCost({
          karat,
          widthMm,
          sizeUs,
          profile: "frieze",
          spotUsdPerOzt: ACTIVE_BASIS,
        });
        assert.equal(
          result.listCents,
          eonListCents(
            Number(karat.slice(0, -1)),
            widthMm,
            result.grams,
            55,
            ACTIVE_BASIS,
            { narrow: 1.75 },
          ),
          `${karat} ${widthMm}mm US${sizeUs}`,
        );
      }
    }
  }
});
