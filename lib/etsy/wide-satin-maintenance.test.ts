import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWideSatinRepairVariants,
  buildWideSatinDescription,
  buildWideSatinSpanishContent,
  buildWideSatinTitle,
  selectCanonicalWideSatinVariants,
} from "./wide-satin-maintenance";

test("adds the approved 4mm to 8mm range to a Wide Satin title", () => {
  assert.equal(
    buildWideSatinTitle(
      "10K Solid Rose Gold Wedding Band: Wide Satin Center with Polished Edges",
    ),
    "10K Solid Rose Gold Wedding Band, Wide Satin Center with Polished Edges, 4mm to 8mm",
  );
});

test("normalizes the description range and remains idempotent", () => {
  const original = [
    "A comfort fit solid gold wedding band.",
    "Widths available: 4mm through 12mm wide, 1.5mm thick.",
  ].join("\n\n");

  const once = buildWideSatinDescription(original);
  const twice = buildWideSatinDescription(once);

  assert.match(once, /4mm through 8mm wide, 1\.5mm thick/);
  assert.match(once, /Widths: 4mm, 5mm, 6mm, 7mm and 8mm\./);
  assert.match(once, /Ring sizes: US 4 through US 16, including half sizes\./);
  assert.doesNotMatch(once, /OPCIONES DE ANCHO/);
  assert.equal(twice, once);
});

test("builds complete Spanish content for the listing translation", () => {
  const content = buildWideSatinSpanishContent({
    karat: "14K",
    color: "Yellow",
  });

  assert.equal(
    content.title,
    "Alianza de Oro Amarillo Macizo de 14K, Centro Satinado, Bordes Pulidos, 4mm a 8mm",
  );
  assert.match(content.description, /Oro amarillo macizo de 14K/);
  assert.match(content.description, /Anchos: 4mm, 5mm, 6mm, 7mm y 8mm\./);
  assert.match(content.description, /Tallas: US 4 a US 16/);
  assert.match(content.description, /ajuste cómodo/i);
});

test("selects exactly one prepared row for every width and ring size", () => {
  const rows = [];
  for (const width of [4, 5, 6, 7, 8]) {
    for (let doubledSize = 8; doubledSize <= 32; doubledSize += 1) {
      const size = doubledSize / 2;
      rows.push({
        id: `${width}-${size}`,
        sku: `WS10R-W${width}-S${String(doubledSize).padStart(2, "0")}`,
        properties: { Width: `${width}mm`, "Ring Size": String(size) },
        price_cents: 100_00 + width * 10 + doubledSize,
        quantity: 1,
        active: true,
      });
    }
  }
  rows.push({
    id: "stale-live-row",
    sku: "RSG-R-1808-12-0800",
    properties: { Width: "12mm", "Ring Size": "8" },
    price_cents: 999_00,
    quantity: 1,
    active: true,
  });

  const canonical = selectCanonicalWideSatinVariants(rows, "WS10R");

  assert.equal(canonical.length, 125);
  assert.equal(canonical.some((row) => row.id === "stale-live-row"), false);
});

test("rejects an incomplete prepared matrix", () => {
  assert.throws(
    () =>
      selectCanonicalWideSatinVariants(
        [
          {
            id: "only-one",
            sku: "WS10R-W4-S08",
            properties: { Width: "4mm", "Ring Size": "4" },
            price_cents: 100_00,
            quantity: 1,
            active: true,
          },
        ],
        "WS10R",
      ),
    /expected 125 prepared variants/i,
  );
});

test("uses a complete legacy matrix when prepared rows are absent", () => {
  const rows = [];
  for (const width of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    for (let doubledSize = 8; doubledSize <= 32; doubledSize += 1) {
      const size = doubledSize / 2;
      rows.push({
        id: `legacy-${width}-${size}`,
        sku: `RSG-R-1808-${width}MM-${size}`,
        properties: [
          { property_name: "Width", values: [`${width}mm`] },
          { property_name: "Ring Size", values: [String(size)] },
        ],
        price_cents: 200_00 + width * 10 + doubledSize,
        quantity: 1,
        active: true,
      });
    }
  }

  const canonical = selectCanonicalWideSatinVariants(rows, "WS18R");

  assert.equal(canonical.length, 125);
  assert.deepEqual(
    [...new Set(canonical.map((row) => row.properties[0].values[0]))],
    ["4mm", "5mm", "6mm", "7mm", "8mm"],
  );
});

test("builds missing widths from the target base price and source width delta", () => {
  const targetRows = [];
  for (let doubledSize = 8; doubledSize <= 32; doubledSize += 1) {
    const size = doubledSize / 2;
    targetRows.push({
      id: `target-${size}`,
      sku: `GLD-R-1408-4MM-${size}`,
      properties: { Width: "4mm", "Ring Size": String(size) },
      price_cents: 80_000 + doubledSize * 100,
      quantity: 18,
      weight_grams: 4,
      active: true,
    });
  }
  const sourceRows = [];
  for (const width of [4, 5, 6, 7, 8]) {
    for (let doubledSize = 10; doubledSize <= 30; doubledSize += 1) {
      const size = doubledSize / 2;
      sourceRows.push({
        id: `source-${width}-${size}`,
        sku: `SOURCE-${width}-${size}`,
        properties: { Width: `${width}mm`, "Ring Size": String(size) },
        price_cents: 60_000 + doubledSize * 100 + (width - 4) * 10_000,
        quantity: 1,
        weight_grams: 4 + (width - 4),
        active: true,
      });
    }
  }

  const generated = buildWideSatinRepairVariants({
    targetRows,
    sourceRows,
    code: "WS14Y",
    orgId: "org",
    productId: "product",
  });

  assert.equal(generated.length, 125);
  assert.equal(
    generated.find((row) => row.sku === "WS14Y-W5-S08")?.price_cents,
    targetRows[0].price_cents + 10_000,
  );
  assert.equal(
    generated.find((row) => row.sku === "WS14Y-W8-S32")?.price_cents,
    targetRows.at(-1)!.price_cents + 40_000,
  );
});
