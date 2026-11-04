/**
 * Satış & Maliyet Takibi — saf motor testleri (lib/pnl.ts).
 * Çalıştır: npm run test:sale-item-pnl
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCostHistory,
  isCostIncomplete,
  marginRatio,
  summarizePnl,
  variationLabel,
  type SaleItemPnlRow,
} from "../lib/pnl";

function row(partial: Partial<SaleItemPnlRow>): SaleItemPnlRow {
  return {
    sale_item_id: "i",
    sale_id: "s",
    org_id: "o",
    product_id: "p",
    etsy_listing_id: 1,
    etsy_transaction_id: 1,
    order_no: "1",
    etsy_receipt_id: 1,
    order_date: "2026-10-01T00:00:00Z",
    status: "completed",
    buyer_name: null,
    ship_country: "US",
    title: "Ring",
    sku: "SKU",
    variations: null,
    quantity: 1,
    unit_price_cents: 10000,
    line_total_cents: 10000,
    currency: "USD",
    shipped_at: null,
    returned_at: null,
    recovered_cents: 0,
    refunds_synced_at: "2026-10-01T00:00:00Z",
    refund_count: 0,
    share: 1,
    discount_alloc_cents: 0,
    shipping_income_alloc_cents: 0,
    tax_alloc_cents: 0,
    refund_alloc_cents: 0,
    gross_revenue_cents: 10000,
    net_revenue_cents: 10000,
    etsy_fees_alloc_cents: 1000,
    shipping_label_cents: 500,
    return_label_cents: 0,
    other_cost_cents: 0,
    gold_cents: 4000,
    labor_cents: 1000,
    gem_cents: 0,
    packaging_cents: 0,
    cogs_cents: 5000,
    total_cost_cents: 6500,
    net_profit_cents: 3500,
    has_gold: true,
    has_labor: true,
    has_gem: false,
    has_packaging: false,
    gold_manual: false,
    labor_manual: true,
    gem_manual: false,
    packaging_manual: false,
    refund_unknown: false,
    ...partial,
  };
}

describe("marginRatio", () => {
  it("returns null when net revenue is not positive (never a fake 0%)", () => {
    assert.equal(marginRatio(-500, 0), null);
    assert.equal(marginRatio(100, -1), null);
    assert.equal(marginRatio(3500, 10000), 0.35);
  });
});

describe("isCostIncomplete", () => {
  it("flags missing gold or labor, never for cancelled", () => {
    assert.equal(isCostIncomplete(row({})), false);
    assert.equal(isCostIncomplete(row({ has_gold: false })), true);
    assert.equal(isCostIncomplete(row({ has_labor: false })), true);
    assert.equal(
      isCostIncomplete(row({ has_gold: false, status: "cancelled" })),
      false,
    );
  });
});

describe("summarizePnl", () => {
  it("sums components, counts distinct orders and incomplete/unknown items", () => {
    const t = summarizePnl([
      row({ sale_id: "a" }),
      row({ sale_id: "a", sale_item_id: "j", quantity: 2, has_labor: false }),
      row({
        sale_id: "b",
        status: "refunded",
        refund_unknown: true,
        refund_alloc_cents: 10000,
        net_revenue_cents: 0,
        net_profit_cents: -6500,
      }),
    ]);
    assert.equal(t.items, 3);
    assert.equal(t.units, 4);
    assert.equal(t.orders, 2);
    assert.equal(t.gross_revenue_cents, 30000);
    assert.equal(t.refund_cents, 10000);
    assert.equal(t.net_revenue_cents, 20000);
    assert.equal(t.cogs_cents, 15000);
    assert.equal(t.net_profit_cents, 3500 + 3500 - 6500);
    assert.equal(t.incomplete_items, 1);
    assert.equal(t.refund_unknown_items, 1);
    assert.equal(t.margin, 500 / 20000);
  });
  it("empty set has null margin", () => {
    assert.equal(summarizePnl([]).margin, null);
  });
});

describe("buildCostHistory", () => {
  it("orders by date, computes per-unit values and last-vs-prev labor delta", () => {
    const h = buildCostHistory([
      row({
        sale_item_id: "late",
        order_date: "2026-10-20T00:00:00Z",
        quantity: 2,
        labor_cents: 2600, // 1300/birim
        gold_cents: 9000,
      }),
      row({
        sale_item_id: "early",
        order_date: "2026-09-01T00:00:00Z",
        labor_cents: 1000,
        gold_cents: 4000,
      }),
      // İşçilik hiç girilmemiş → noktası null, delta'ya girmez.
      row({
        sale_item_id: "nolabor",
        order_date: "2026-10-05T00:00:00Z",
        has_labor: false,
        labor_cents: 0,
      }),
      // İptal → tamamen dışarıda.
      row({ sale_item_id: "cancel", status: "cancelled", labor_cents: 99 }),
    ]);
    assert.deepEqual(
      h.points.map((p) => p.sale_item_id),
      ["early", "nolabor", "late"],
    );
    assert.equal(h.points[1].labor_unit_cents, null);
    assert.equal(h.points[2].labor_unit_cents, 1300);
    assert.equal(h.last_labor_unit_cents, 1300);
    assert.equal(h.prev_labor_unit_cents, 1000);
    assert.equal(h.labor_delta_cents, 300);
    assert.equal(h.labor_delta_ratio, 0.3);
    assert.equal(h.avg_labor_unit_cents, 1150);
    assert.equal(h.min_labor_unit_cents, 1000);
    assert.equal(h.max_labor_unit_cents, 1300);
    assert.equal(h.last_gold_unit_cents, 4500);
    assert.equal(h.units_sold, 4);
  });
  it("single sale → no delta (null), not 0", () => {
    const h = buildCostHistory([row({})]);
    assert.equal(h.labor_delta_cents, null);
    assert.equal(h.labor_delta_ratio, null);
  });
});

describe("variationLabel", () => {
  it("joins formatted values, null when empty", () => {
    assert.equal(variationLabel(null), null);
    assert.equal(variationLabel([]), null);
    assert.equal(
      variationLabel([
        { formatted_name: "Size", formatted_value: "7" },
        { formatted_name: "Color", formatted_value: "Rose" },
      ]),
      "7 · Rose",
    );
  });
});
