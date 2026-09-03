import assert from "node:assert/strict";
import test from "node:test";

import {
  BEVELED_MILGRAIN_FAMILY,
  BEVELED_MILGRAIN_RING_SIZES,
  BEVELED_MILGRAIN_WIDTHS,
  buildBeveledMilgrainContent,
  buildBeveledMilgrainRepairVariants,
  selectCanonicalBeveledMilgrainVariants,
} from "./beveled-milgrain-maintenance";

test("defines all nine fixed-karat and fixed-color family members", () => {
  assert.equal(BEVELED_MILGRAIN_FAMILY.length, 9);
  assert.deepEqual(
    BEVELED_MILGRAIN_FAMILY.map((member) => member.code),
    [
      "MG10R",
      "MG10W",
      "MG10Y",
      "MG14R",
      "MG14W",
      "MG14Y",
      "MG18R",
      "MG18W",
      "MG18Y",
    ],
  );
  assert.equal(new Set(BEVELED_MILGRAIN_FAMILY.map((x) => x.listingId)).size, 9);
  assert.equal(
    new Set(BEVELED_MILGRAIN_FAMILY.map((x) => x.sourceListingId)).size,
    9,
  );
});

test("locks the 4mm to 12mm width range and US 4 to US 16 sizes", () => {
  assert.deepEqual(BEVELED_MILGRAIN_WIDTHS, [4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(BEVELED_MILGRAIN_RING_SIZES.length, 25);
  assert.equal(BEVELED_MILGRAIN_RING_SIZES[0], 4);
  assert.equal(BEVELED_MILGRAIN_RING_SIZES.at(-1), 16);
});

test("builds complete English and Spanish listing content", () => {
  const content = buildBeveledMilgrainContent({ karat: "14K", color: "Rose" });

  assert.equal(
    content.en.title,
    "14K Solid Rose Gold Beveled Milgrain Wedding Band, Satin Center Ring, 4mm to 12mm",
  );
  assert.match(content.en.description, /Widths: 4mm through 12mm/);
  assert.match(content.en.description, /Sizes: US 4 through 16/);
  assert.match(content.en.description, /Thickness: 1\.5mm/);
  assert.match(content.en.description, /Inside Engraving Text/);
  assert.match(content.en.description, /Engraving Font/);

  assert.equal(
    content.es.title,
    "Alianza de Oro Rosa Macizo de 14K con Milgrain y Bordes Biselados, 4mm a 12mm",
  );
  assert.match(content.es.description, /Anchos: 4mm a 12mm/);
  assert.match(content.es.description, /Tallas: US 4 a US 16/);
  assert.match(content.es.description, /Grosor: 1\.5mm/);
  assert.match(content.es.description, /Texto de Grabado Interior/);
  assert.match(content.es.description, /Fuente de Grabado/);
});

test("builds 225 variants from the target 5mm base and source width deltas", () => {
  const targetRows = [];
  const sourceRows = [];
  for (let doubledSize = 8; doubledSize <= 32; doubledSize += 1) {
    const size = doubledSize / 2;
    targetRows.push({
      sku: `LEGACY-${size}`,
      properties: { Width: "5mm", "Ring Size": String(size) },
      price_cents: 90_000 + doubledSize * 100,
      quantity: 7,
      weight_grams: 5 + doubledSize / 100,
      active: true,
    });
    for (const width of BEVELED_MILGRAIN_WIDTHS) {
      sourceRows.push({
        sku: `SOURCE-${width}-${size}`,
        properties: { Width: `${width}mm`, "Ring Size": String(size) },
        price_cents: 70_000 + doubledSize * 100 + (width - 5) * 8_000,
        quantity: 1,
        weight_grams: 5 + doubledSize / 100 + (width - 5) * 0.8,
        active: true,
      });
    }
  }

  const generated = buildBeveledMilgrainRepairVariants({
    targetRows,
    sourceRows,
    code: "MG14R",
    orgId: "org",
    productId: "product",
  });

  assert.equal(generated.length, 225);
  assert.equal(new Set(generated.map((row) => row.sku)).size, 225);
  assert.equal(
    generated.find((row) => row.sku === "MG14R-W4-S08")?.price_cents,
    targetRows[0].price_cents - 8_000,
  );
  assert.equal(
    generated.find((row) => row.sku === "MG14R-W12-S32")?.price_cents,
    targetRows.at(-1)!.price_cents + 56_000,
  );
  assert.deepEqual(generated[0].properties, {
    Width: "4mm",
    "Ring Size": "4",
  });
});

test("selects only the canonical 225 prepared variants", () => {
  const rows = [];
  for (const width of BEVELED_MILGRAIN_WIDTHS) {
    for (let doubledSize = 8; doubledSize <= 32; doubledSize += 1) {
      const size = doubledSize / 2;
      rows.push({
        id: `${width}-${size}`,
        sku: `MG18W-W${width}-S${String(doubledSize).padStart(2, "0")}`,
        properties: { Width: `${width}mm`, "Ring Size": String(size) },
        price_cents: 120_000 + width * 1_000 + doubledSize,
        quantity: 1,
        weight_grams: 4,
        active: true,
      });
    }
  }
  rows.push({
    id: "legacy",
    sku: "LEGACY-18W-5MM-8",
    properties: { Width: "5mm", "Ring Size": "8" },
    price_cents: 100_000,
    quantity: 1,
    weight_grams: 4,
    active: true,
  });

  const canonical = selectCanonicalBeveledMilgrainVariants(rows, "MG18W");

  assert.equal(canonical.length, 225);
  assert.equal(canonical.some((row) => row.id === "legacy"), false);
});

test("rejects an incomplete prepared matrix", () => {
  assert.throws(
    () =>
      selectCanonicalBeveledMilgrainVariants(
        [
          {
            sku: "MG10Y-W4-S08",
            properties: { Width: "4mm", "Ring Size": "4" },
            price_cents: 80_000,
            quantity: 1,
            weight_grams: 3,
            active: true,
          },
        ],
        "MG10Y",
      ),
    /expected 225 prepared variants/i,
  );
});
