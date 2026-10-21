import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { VariantMatrixView } from "../components/listing/variant-matrix-view";
import {
  buildProductVariantMatrix,
  RING_SIZE_BANDS,
  type VariantMatrixDbRow,
} from "../lib/variant-matrix";
import { formatMoney } from "../lib/money";

function variant(
  sku: string,
  properties: Record<string, string>,
  overrides: Partial<VariantMatrixDbRow> = {},
): VariantMatrixDbRow {
  return { sku, properties, price_cents: 26400, weight_grams: null, currency: "USD", ...overrides };
}

function necklaceVariants(): VariantMatrixDbRow[] {
  // Deliberately shuffled; database row order must not determine matrix axes.
  return ["Rose Gold", "Yellow Gold", "White Gold"].flatMap((metalColor) =>
    ["18K", "10K", "14K"].flatMap((karat) =>
      ["20 in", "16 in", "18 in"].map((length) =>
        variant([metalColor, karat, length].join("-"), {
          "Metal Color": metalColor,
          Karat: karat,
          "Chain Length": length,
          Material: "Solid Gold",
          Birthstone: "Chosen in personalization",
        }),
      ),
    ),
  );
}

describe("necklace variant matrix", () => {
  it("keeps all 27 SKUs in three ordered metal-color matrices", () => {
    const variants = necklaceVariants();
    const matrix = buildProductVariantMatrix(variants);
    assert.equal(matrix.kind, "necklace");
    if (matrix.kind !== "necklace") return;
    assert.deepEqual(matrix.groups.map((g) => g.metalColor), ["Yellow Gold", "White Gold", "Rose Gold"]);
    assert.deepEqual(matrix.lengths, ["16 in", "18 in", "20 in"]);
    assert.equal(matrix.variantCount, 27);
    assert.equal(matrix.unmappedCount, 0);
    assert.equal(matrix.hasWeights, false);
    const skus: string[] = [];
    for (const group of matrix.groups) {
      assert.deepEqual(group.rows.map((r) => r.karat), ["10K", "14K", "18K"]);
      for (const row of group.rows) {
        assert.equal(row.cells.length, 3);
        row.cells.forEach((cells, index) => {
          assert.equal(cells.length, 1);
          assert.equal(cells[0].sku, [group.metalColor, row.karat, matrix.lengths[index]].join("-"));
          skus.push(cells[0].sku);
        });
      }
    }
    assert.deepEqual(skus.sort(), variants.map((v) => v.sku).sort());
  });

  it("renders three named tables, 27 prices, and the 25% discount", () => {
    const variants = necklaceVariants();
    const html = renderToStaticMarkup(
      <VariantMatrixView matrix={buildProductVariantMatrix(variants)} discountPct={25} />,
    );
    assert.equal((html.match(/<table /g) ?? []).length, 3);
    assert.equal((html.match(/<td /g) ?? []).length, 27);
    for (const color of ["Yellow Gold", "White Gold", "Rose Gold"]) {
      assert.ok(html.includes(`>${color}</caption>`));
    }
    for (const row of variants) {
      assert.equal(html.split(`title="${row.sku}"`).length - 1, 1);
    }
    assert.equal(html.split(formatMoney(19800, "USD")).length - 1, 27);
    assert.equal(html.split(formatMoney(26400, "USD")).length - 1, 27);
    assert.ok(html.includes("%25 indirim uygulandı"));
    assert.ok(html.includes("(yalnız panel; Etsy fiyatı değişmez)"));
    assert.ok(!html.includes("Genişlik"));
  });

  it("retains sparse coordinates and reports missing required axes", () => {
    const variants = necklaceVariants().filter((v) => v.sku !== "White Gold-14K-18 in");
    variants.push(variant("incomplete", { Karat: "14K", "Metal Color": "White Gold" }));
    const matrix = buildProductVariantMatrix(variants);
    assert.equal(matrix.kind, "necklace");
    if (matrix.kind !== "necklace") return;
    assert.equal(matrix.variantCount, 26);
    assert.equal(matrix.unmappedCount, 1);
    assert.deepEqual(matrix.groups[1].rows[1].cells[1], []);
    const html = renderToStaticMarkup(<VariantMatrixView matrix={matrix} />);
    assert.ok(html.includes("1 varyantın ayar"));
  });

  it("keeps duplicate coordinates and any additional varying property visible by SKU", () => {
    const first = necklaceVariants()[0];
    const second = {
      ...first,
      sku: "another-stone",
      properties: { ...first.properties, Birthstone: "Ruby" },
    };
    const matrix = buildProductVariantMatrix([first, second]);
    assert.equal(matrix.kind, "necklace");
    if (matrix.kind !== "necklace") return;
    assert.equal(matrix.variantCount, 2);
    assert.equal(matrix.groups[0].rows[0].cells[0].length, 2);
    const html = renderToStaticMarkup(<VariantMatrixView matrix={matrix} />);
    assert.ok(html.includes(`>${first.sku}</p>`));
    assert.ok(html.includes(">another-stone</p>"));
    assert.equal(html.split(formatMoney(26400)).length - 1, 2);
  });

  it("preserves null and zero prices, per-cell currencies, and numeric weights", () => {
    const variants = necklaceVariants().slice(0, 3);
    variants[0] = { ...variants[0], price_cents: null, currency: null };
    variants[1] = { ...variants[1], price_cents: 0, currency: "EUR", weight_grams: "2.75" };
    variants[2] = { ...variants[2], weight_grams: "invalid" };
    const matrix = buildProductVariantMatrix(variants);
    assert.equal(matrix.kind, "necklace");
    if (matrix.kind !== "necklace") return;
    const cells = matrix.groups[0].rows[0].cells.flat();
    assert.equal(cells[0].price_cents, 0);
    assert.equal(cells[0].currency, "EUR");
    assert.equal(cells[0].weight_grams, 2.75);
    assert.equal(cells[1].weight_grams, null);
    assert.equal(cells[2].price_cents, null);
    assert.equal(cells[2].currency, "USD");
    assert.equal(matrix.hasWeights, true);
  });
});

describe("existing ring matrix", () => {
  it("retains legacy bands, numeric sizes, and width/thickness ordering", () => {
    const bands = ["custom", "10", "7.5", ...RING_SIZE_BANDS.slice().reverse()];
    const widths = ["8mm", "6mm · 2.0mm thick", "6mm · 1.5mm thick"];
    const matrix = buildProductVariantMatrix(widths.flatMap((width) =>
      bands.map((band) => variant(`${width}-${band}`, { Width: width, "Ring Size": band })),
    ));
    assert.equal(matrix.kind, "ring");
    if (matrix.kind !== "ring") return;
    assert.deepEqual(matrix.bands, [...RING_SIZE_BANDS, "7.5", "10", "custom"]);
    assert.deepEqual(matrix.rows.map((r) => r.width), ["6mm · 1.5mm thick", "6mm · 2.0mm thick", "8mm"]);
    assert.equal(matrix.rows.flatMap((r) => r.cells).length, 21);
  });

  it("keeps the ring price, discount, and competitor overlay in one table", () => {
    const matrix = buildProductVariantMatrix([
      variant("ring", { Width: "6mm", "Ring Size": "7" }, { weight_grams: "4.25" }),
    ]);
    const html = renderToStaticMarkup(
      <VariantMatrixView
        matrix={matrix}
        discountPct={25}
        competitors={[{ width: "6mm", band: "7", color: "red", price_cents: 20000, currency: "USD" }]}
      />,
    );
    assert.equal((html.match(/<table /g) ?? []).length, 1);
    assert.ok(html.includes("Varyant matrisi · genişlik × beden"));
    assert.ok(html.includes(formatMoney(19800)));
    assert.ok(html.includes(formatMoney(20000)));
    assert.ok(html.includes("4.25 g"));
  });

  it("renders no matrix for empty or unrelated properties", () => {
    for (const variants of [[], [variant("other", { Color: "Blue" })]]) {
      const matrix = buildProductVariantMatrix(variants);
      assert.equal(matrix.kind, "ring");
      assert.equal(renderToStaticMarkup(<VariantMatrixView matrix={matrix} />), "");
    }
  });
});
