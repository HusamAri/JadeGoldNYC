import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("Generated 750-row matrix matches the TypeScript engine", () => {
  const csv = readFileSync(
    new URL(
      "../docs/eon/pricing/frieze-textured-2026-08-16/price-matrix.csv",
      import.meta.url,
    ),
    "utf8",
  ).trim();
  const [headerLine, ...lines] = csv.split("\n");
  const headers = headerLine.split(",");
  assert.equal(lines.length, 750);

  for (const line of lines) {
    const values = line.split(",");
    const row = Object.fromEntries(
      headers.map((header, index) => [header, values[index]]),
    );
    const result = computeEonCost({
      karat: row.karat as "10K" | "14K" | "18K",
      widthMm: Number(row.width_mm),
      sizeUs: Number(row.size_us),
      profile: "frieze",
      grams: Number(row.grams),
      spotUsdPerOzt: ACTIVE_BASIS,
    });
    assert.equal(result.listUsd, Number(row.list_price_usd));
    assert.equal(result.saleUsd, Number(row.sale_price_usd));
    assert.equal(result.laborUsd, Number(row.labor_usd));
    assert.equal(result.multiplier, Number(row.multiplier));
  }
});

test("Maeander listing package starts at 5mm and contains 1,800 variants", () => {
  const catalog = JSON.parse(
    readFileSync(
      new URL("../docs/eon/maeander-1008/catalog.json", import.meta.url),
      "utf8",
    ),
  ) as {
    listing_count: number;
    variants_per_listing: number;
    total_variants: number;
    listings: Array<{
      karat: "10K" | "14K" | "18K";
      title: string;
      description: string;
      widths_mm: number[];
      variants: Array<{
        width_mm: number;
        weight_grams: number;
        price_preview_cents_active_basis: number;
      }>;
    }>;
  };

  assert.equal(catalog.listing_count, 9);
  assert.equal(catalog.variants_per_listing, 200);
  assert.equal(catalog.total_variants, 1_800);
  for (const listing of catalog.listings) {
    assert.deepEqual(listing.widths_mm, [5, 6, 7, 8, 9, 10, 11, 12]);
    assert.equal(listing.variants.length, 200);
    assert.equal(listing.variants.every((variant) => variant.width_mm >= 5), true);
    for (const variant of listing.variants) {
      assert.equal(
        variant.price_preview_cents_active_basis,
        eonListCents(
          Number(listing.karat.slice(0, -1)),
          variant.width_mm,
          variant.weight_grams,
          55,
          ACTIVE_BASIS,
          { narrow: 1.75 },
        ),
      );
    }
    assert.match(listing.title, /5mm to 12mm/);
    assert.match(listing.description, /Widths: 5mm through 12mm/);
    assert.doesNotMatch(listing.description, /3mm/);
  }
});

test("Maeander production migration removes exactly the 3mm and 4mm variants", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/0133_eon_maeander_minimum_5mm.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /narrow_variants <> 450/);
  assert.match(migration, /remaining_variants <> 1800/);
  assert.match(migration, /minimum_width <> 5/);
  assert.match(migration, /remaining_narrow <> 0/);
  assert.match(migration, /delete from public\.product_variants/);
  assert.match(migration, /does not call Etsy/);
});
