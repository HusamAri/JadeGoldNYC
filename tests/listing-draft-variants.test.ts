import { strict as assert } from "node:assert";
import test from "node:test";

import {
  parseBulkDraftVariants,
  prepareDraftVariants,
  type DraftVariantInput,
} from "@/lib/listing-draft-variants";
import { distributePriceByWeight, inferWeightsBySize } from "@/lib/etsy/distribute";

const row = (sku: string, a: string, b = "", c = ""): DraftVariantInput => ({
  sku, axisValue: a, axisValue2: b, axisValue3: c, weight: "", price: "",
});

test("legacy five-column CSV and TAB preserve their original money mapping", () => {
  for (const separator of [",", "\t"]) {
    const parsed = parseBulkDraftVariants([
      ["SKU", "Ring Size", "Metal Color", "gram", "price"].join(separator),
      ["R-7", "7", "Yellow Gold", "2.4", "129.00"].join(separator),
    ].join("\r\n"));
    assert.deepEqual(parsed.rows, [{ sku: "R-7", axisValue: "7", axisValue2: "Yellow Gold", axisValue3: "", weight: "2.4", price: "129.00" }]);
  }
});

test("six-column TAB keeps unknown trailing weight and price plus empty lines", () => {
  const parsed = parseBulkDraftVariants("\r\nSKU,karat,width,size,gram,price\r\nR-7\t14K\t4mm\t7\t\t\r\n\r\n");
  assert.deepEqual(parsed.rows, [{ sku: "R-7", axisValue: "14K", axisValue2: "4mm", axisValue3: "7", weight: "", price: "" }]);
  assert.deepEqual(parseBulkDraftVariants("R-7,14K,4mm,7,2.4,129").rows?.[0], {
    sku: "R-7", axisValue: "14K", axisValue2: "4mm", axisValue3: "7", weight: "2.4", price: "129",
  });
});

test("SKU-prefixed data row is not mistaken for a header; decimal commas survive TAB", () => {
  const parsed = parseBulkDraftVariants("SKU-001\t7\tYellow Gold\t2,4\t129,00");
  assert.equal(parsed.rows?.length, 1);
  assert.equal(parsed.rows?.[0].sku, "SKU-001");
  assert.equal(parsed.rows?.[0].weight, "2,4");
  assert.equal(parsed.rows?.[0].price, "129,00");
});

test("mixed or invalid column counts and missing SKU fail rather than shift fields", () => {
  for (const input of ["", "SKU,size,color,gram,price", "R-7,7,Yellow,2,129\nR-8,8,White,14K,3,150", ",7,Yellow,2,129", "R-7,7,2,129"]) {
    assert.ok(parseBulkDraftVariants(input).error, input);
  }
});

test("one-axis, two-axis and unconfigured legacy drafts remain supported", () => {
  assert.equal(prepareDraftVariants([row("R-7", "7"), row("R-8", "8")], ["Ring Size", undefined, undefined]).error, undefined);
  assert.equal(prepareDraftVariants([row("R-7", "7", "Yellow"), row("R-8", "8", "White")], ["Ring Size", "Metal Color", undefined]).error, undefined);
  assert.equal(prepareDraftVariants([row("single", "")], [undefined, undefined, undefined]).error, undefined);
});

test("all 315 three-axis combinations are kept without collapsing shared first two axes", () => {
  const rows = [10, 14, 18].flatMap((karat) => [4, 5, 6, 7, 8].flatMap((width) =>
    Array.from({ length: 21 }, (_, index) => row(`EON-${karat}-${width}-${30 + index * 5}`, `${karat}K`, `${width}mm`, String(3 + index / 2))),
  ));
  const prepared = prepareDraftVariants(rows, ["Karat", "Width", "Ring Size"]);
  assert.equal(prepared.error, undefined);
  assert.equal(prepared.rows?.length, 315);
  assert.equal(prepared.propertiesBySku?.size, 315);
  assert.deepEqual(prepared.propertiesBySku?.get("EON-18-8-130"), { Karat: "18K", Width: "8mm", "Ring Size": "13" });
});

test("third axis requires both previous axes and all normalized names must differ", () => {
  const rows = [row("R", "7", "4mm", "14K")];
  for (const names of [["", "", "Karat"], ["Ring Size", "", "Karat"], ["", "Width", "Karat"], ["Width", " width ", "Karat"], ["Ring Size", "ring  size", "Karat"], ["Width", "Ｗｉｄｔｈ", "Karat"]] as const) {
    assert.ok(prepareDraftVariants(rows, names).error, JSON.stringify(names));
  }
});

test("missing named values and unnamed third values cannot be silently discarded", () => {
  assert.match(prepareDraftVariants([row("R", "7", "4mm")], ["Ring Size", "Width", "Karat"]).error ?? "", /değer yok/);
  assert.match(prepareDraftVariants([row("R", "7", "4mm", "14K")], ["Ring Size", "Width", ""]).error ?? "", /adını girin/);
});

test("duplicate trimmed SKU or triple is rejected", () => {
  assert.match(prepareDraftVariants([row(" R ", "7"), row("R", "8")], ["Ring Size", "", ""]).error ?? "", /SKU/);
  assert.match(prepareDraftVariants([row("R-1", "7", "4mm", "14K"), row("R-2", " 7 ", " 4mm ", " 14K ")], ["Ring Size", "Width", "Karat"]).error ?? "", /kombinasyonu/);
});

test("constant named axes retain their prior validation and tuple encoding is unambiguous", () => {
  assert.match(prepareDraftVariants([row("R-1", "7", "Yellow"), row("R-2", "8", "Yellow")], ["Ring Size", "Metal Color", ""]).error ?? "", /değişmiyor/);
  assert.equal(prepareDraftVariants([row("R-1", "a|b", "c"), row("R-2", "a", "b|c")], ["A", "B", ""]).error, undefined);
});

test("both parser and server validation accept 400 rows and reject 401", () => {
  const rows = Array.from({ length: 401 }, (_, index) => row(`R-${index}`, String(index)));
  assert.equal(prepareDraftVariants(rows.slice(0, 400), ["Size", "", ""]).error, undefined);
  assert.match(prepareDraftVariants(rows, ["Size", "", ""]).error ?? "", /400/);
  const lines = rows.map((item) => `${item.sku},${item.axisValue},,,`);
  assert.equal(parseBulkDraftVariants(lines.slice(0, 400).join("\n")).rows?.length, 400);
  assert.match(parseBulkDraftVariants(lines.join("\n")).error ?? "", /400/);
});

test("unknown cost/weight text is preserved and the existing engines infer nothing without anchors", () => {
  const input = [row("R-7", "7"), row("R-8", "8")];
  const before = JSON.stringify(input);
  const prepared = prepareDraftVariants(input, ["Ring Size", "", ""]);
  assert.equal(JSON.stringify(input), before);
  assert.ok(prepared.rows?.every((item) => item.weight === "" && item.price === ""));
  const base = prepared.rows!.map((item) => ({ sku: item.sku, weightGrams: null, priceCents: null }));
  assert.deepEqual(inferWeightsBySize(base), []);
  assert.deepEqual(distributePriceByWeight(base, {}), []);
});
