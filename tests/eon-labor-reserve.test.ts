import { strict as assert } from "node:assert";
import test from "node:test";

import {
  calculateEonLaborReserve,
  classifyEonLaborProcess,
  EON_LABOR_RESERVE_SOURCE,
  type EonLaborProcess,
} from "@/lib/pricing-engine/eon-labor-reserve";

test("forward reserve covers all 14 matched observations without changing historical labor", () => {
  // Minimal anonymous regression evidence: grams, historical labor cents, class.
  const observations: readonly (readonly [number, number, EonLaborProcess])[] = [
    [14.3, 21581, "decorated"],
    [6.44, 13530, "decorated"],
    [5.2, 10741, "decorated"],
    [4.23, 11141, "handmade"],
    [5, 7541, "standard"],
    [4.4, 9976, "decorated"],
    [2.14, 4491, "standard"],
    [4.6, 9013, "decorated"],
    [5.22, 8823, "standard"],
    [6.42, 13646, "decorated"],
    [4.93, 7667, "standard"],
    [5.14, 10107, "decorated"],
    [5.1, 11704, "decorated"],
    [4.12, 7368, "standard"],
  ];
  const before = JSON.stringify(observations);
  assert.equal(observations.length, EON_LABOR_RESERVE_SOURCE.sampleSize);
  for (const [weightGrams, recordedLaborCents, process] of observations) {
    const result = calculateEonLaborReserve({ isGoldRing: true, weightGrams, process });
    assert.ok(result.reserveCents >= recordedLaborCents, `${process}, ${weightGrams} g`);
    assert.ok(result.reserveCents >= 10000);
  }
  assert.equal(JSON.stringify(observations), before);
});

test("$100 floor and a higher verified quote both survive the gram calculation", () => {
  assert.equal(calculateEonLaborReserve({ isGoldRing: true, process: "standard", weightGrams: 1 }).reserveCents, 10000);
  const result = calculateEonLaborReserve({
    isGoldRing: true, process: "standard", weightGrams: 5, verifiedLaborQuoteUsd: 180.01,
  });
  assert.equal(result.weightReserveCents, 10500);
  assert.equal(result.verifiedQuoteCents, 18001);
  assert.equal(result.reserveCents, 18001);
  assert.equal(calculateEonLaborReserve({
    isGoldRing: true, process: "standard", weightGrams: 5, verifiedLaborQuoteUsd: 0,
  }).reserveCents, 10500);
});

test("milligram normalization and final cents round upward without float artifacts", () => {
  const input = { isGoldRing: true, process: "decorated" as const, weightGrams: "5.001" };
  const result = calculateEonLaborReserve(input);
  assert.equal(result.normalizedWeightMilligrams, 5001);
  assert.equal(result.weightReserveCents, 11503);
  assert.equal(result.reserveCents, 11503);
  assert.equal(calculateEonLaborReserve({ ...input, weightGrams: "5.001000" }).reserveCents, 11503);
  assert.equal(calculateEonLaborReserve({ ...input, weightGrams: 4.4 }).reserveCents, 10120);
  assert.equal(calculateEonLaborReserve({ ...input, verifiedLaborQuoteUsd: 150.001 }).reserveCents, 15001);
  assert.equal(calculateEonLaborReserve({ ...input, verifiedLaborQuoteUsd: 150.01 }).reserveCents, 15001);
  assert.equal(calculateEonLaborReserve({ ...input, verifiedLaborQuoteUsd: 1e-7 }).verifiedQuoteCents, 1);
});

test("invalid, missing, zero, excessive-precision and unsafe weights fail closed", () => {
  for (const weightGrams of [undefined, null, NaN, Infinity, -Infinity, 0, -1, "", " ", "abc", "1,5", "-1", "0.000", "5.0001", 5.0001, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => calculateEonLaborReserve({ isGoldRing: true, weightGrams }), /[Ww]eight/);
  }
  assert.throws(() => calculateEonLaborReserve({
    isGoldRing: true, weightGrams: 5, verifiedLaborQuoteUsd: NaN,
  }), /quote/);
  for (const verifiedLaborQuoteUsd of [Infinity, -Infinity, -1, Number.MAX_VALUE, null, "100"]) {
    assert.throws(() => calculateEonLaborReserve({
      isGoldRing: true, weightGrams: 5, verifiedLaborQuoteUsd: verifiedLaborQuoteUsd as number,
    }), /quote/);
  }
});

test("title classification prioritizes complex work over decoration over basic profiles", () => {
  for (const title of ["Handmade Satin Gold Band", "Hand-hammered Diamond Cut Ring", "Handhammered Gold Ring", "Hammered Bevel Ring", "Hand-finished Satin Gold Ring", "Basketweave Flat Band", "Greek Key Milgrain Ring", "Two-tone Satin Ring", "TwoTone Flat Ring"]) {
    assert.equal(classifyEonLaborProcess({ isGoldRing: true, title }).process, "handmade", title);
  }
  for (const title of ["Milgrain Flat Ring", "Diamond-cut Satin Ring", "Diamondcut Gold Ring", "Ribbed Gold Ring", "Fluted Flat Band", "CNC Dome Ring", "Engraving Satin Band", "Engraved Knife Edge Ring"]) {
    assert.equal(classifyEonLaborProcess({ isGoldRing: true, title }).process, "decorated", title);
  }
  for (const title of ["Dome Gold Ring", "Flat Gold Band", "Beveled Gold Ring", "Knife Edge Gold Ring", "Satin Gold Ring"]) {
    assert.equal(classifyEonLaborProcess({ isGoldRing: true, title }).process, "standard", title);
  }
  const explicit = classifyEonLaborProcess({ isGoldRing: true, title: "Handmade gold ring", process: "standard" });
  assert.equal(explicit.process, "standard");
  assert.equal(explicit.source, "explicit");
  assert.throws(() => classifyEonLaborProcess({ isGoldRing: true, process: "typo" as EonLaborProcess }), /process/);
});

test("unknown process has the highest provisional reserve; unrelated inventory cannot be priced", () => {
  const unknown = calculateEonLaborReserve({ isGoldRing: true, title: "Aurora Gold Ring", weightGrams: 5 });
  assert.equal(unknown.process, "unknown");
  assert.equal(unknown.provisional, true);
  assert.equal(unknown.rateCentsPerGram, 2700);
  assert.equal(unknown.reserveCents, 13500);
  assert.equal(classifyEonLaborProcess({ isGoldRing: true, title: "Flatware" }).process, "unknown");
  assert.equal(classifyEonLaborProcess({ isGoldRing: true, process: "unknown" }).provisional, true);
  const unrelated = classifyEonLaborProcess({ isGoldRing: false, title: "Handmade Satin Gold Necklace", process: "standard" });
  assert.equal(unrelated.eligible, false);
  assert.equal(unrelated.process, "unknown");
  assert.equal(unrelated.provisional, true);
  assert.equal(unrelated.source, "out-of-scope");
  assert.throws(() => calculateEonLaborReserve({ isGoldRing: false, weightGrams: 5 }), /gold rings/);
  assert.throws(() => calculateEonLaborReserve({ weightGrams: 5 } as never), /gold rings/);
});
