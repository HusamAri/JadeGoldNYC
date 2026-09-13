import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  buildOphirPriceRestore,
  canonicalOphirInventory,
  canonicalOphirInventoryNonPrice,
  type OphirRestoreInventoryUpdate,
} from "../lib/etsy/ophir-price-restore";

const target = { sku: "OPH-4538023253-10R-3", beforeCents: 39500, afterCents: 78000 };

function inventory() {
  return {
    products: [
      {
        product_id: 101,
        sku: target.sku,
        is_deleted: false,
        property_values: [
          { property_id: 513, property_name: "Metal", scale_id: null, scale_name: null, value_ids: [111], values: ["10K PINK"] },
          { property_id: 514, property_name: "Ring Size", scale_id: 30, scale_name: "US numeric", value_ids: [222], values: ["3"] },
        ],
        offerings: [{ offering_id: 301, is_deleted: false, price: { amount: 78000, divisor: 100, currency_code: "USD" }, quantity: 7, is_enabled: false, readiness_state_id: 444 }],
      },
      {
        product_id: 102,
        sku: "OPH-4538023253-14W-3.25",
        is_deleted: false,
        property_values: [
          { property_id: 513, property_name: "Metal", scale_id: null, scale_name: null, value_ids: [112], values: ["14K WHITE"] },
          { property_id: 514, property_name: "Ring Size", scale_id: 30, scale_name: "US numeric", value_ids: [223], values: ["3 1/4"] },
        ],
        offerings: [{ offering_id: 302, is_deleted: false, price: { amount: 1185, divisor: 1, currency_code: "USD" }, quantity: 0, is_enabled: true, readiness_state_id: 555 }],
      },
    ],
    price_on_property: [513, 514],
    quantity_on_property: [513, 514],
    sku_on_property: [513, 514],
    readiness_state_on_property: [513],
  };
}

function response(update: OphirRestoreInventoryUpdate) {
  return {
    ...structuredClone(update),
    products: update.products.map((product, index) => ({
      ...structuredClone(product),
      product_id: index + 10000,
      offerings: product.offerings.map((offering, offeringIndex) => ({
        ...offering,
        offering_id: index * 10 + offeringIndex + 20000,
        price: { amount: Math.round(offering.price * 100), divisor: 100, currency_code: "USD" },
      })),
    })),
  };
}

test("restores the last price while preserving changed stock, disabled state, properties and per-offering processing profiles", () => {
  const current = inventory();
  const original = structuredClone(current);
  const result = buildOphirPriceRestore(current, [target]);
  assert.deepEqual(current, original, "conversion must not modify its input");
  assert.equal(result.changed, 1);
  assert.equal(result.alreadyRestored, 0);
  assert.equal(result.update.products[0].offerings[0].price, 395);
  assert.equal(result.update.products[1].offerings[0].price, 1185);
  assert.deepEqual(result.update.products[0].offerings[0], { price: 395, quantity: 7, is_enabled: false, readiness_state_id: 444 });
  assert.deepEqual(result.update.products[1].offerings[0], { price: 1185, quantity: 0, is_enabled: true, readiness_state_id: 555 });
  assert.deepEqual(result.update.readiness_state_on_property, [513]);
  for (const key of ["price_on_property", "quantity_on_property", "sku_on_property", "readiness_state_on_property"] as const) {
    assert.deepEqual(result.update[key], current[key]);
    assert.notEqual(result.update[key], current[key], "outgoing arrays must be detached");
  }
  assert.equal(result.nonPriceFingerprint, canonicalOphirInventoryNonPrice(current));
  assert.equal(result.nonPriceFingerprint, canonicalOphirInventoryNonPrice(response(result.update)));
  assert.equal(result.expectedFingerprint, canonicalOphirInventory(response(result.update)));
  assert.notEqual(result.currentFingerprint, result.expectedFingerprint);
  assert.deepEqual(result.query, { legacy: "false" });
});

test("readback ignores generated product/offering IDs and ordering, but keeps semantic IDs and values", () => {
  const result = buildOphirPriceRestore(inventory(), [target]);
  const readback = response(result.update);
  readback.products.reverse();
  readback.products.forEach((p) => p.property_values.reverse());
  readback.price_on_property.reverse();
  assert.equal(canonicalOphirInventory(readback), result.expectedFingerprint);
  readback.products[0].property_values[0].value_ids[0] += 1;
  assert.notEqual(canonicalOphirInventory(readback), result.expectedFingerprint);
});

test("non-price verification detects stock, enabled, processing profile, property and axis changes", () => {
  const initial = inventory();
  const fingerprint = canonicalOphirInventoryNonPrice(initial);
  const mutations = [
    (i: ReturnType<typeof inventory>) => { i.products[0].offerings[0].quantity++; },
    (i: ReturnType<typeof inventory>) => { i.products[0].offerings[0].is_enabled = true; },
    (i: ReturnType<typeof inventory>) => { i.products[0].offerings[0].readiness_state_id++; },
    (i: ReturnType<typeof inventory>) => { i.products[0].property_values[0].property_name = "Gold Color"; },
    (i: ReturnType<typeof inventory>) => { i.products[0].property_values[0].values[0] = "10K WHITE"; },
    (i: ReturnType<typeof inventory>) => { i.readiness_state_on_property = []; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(initial);
    mutate(changed);
    assert.notEqual(canonicalOphirInventoryNonPrice(changed), fingerprint);
  }
});

test("already restored prices are idempotent without a second change", () => {
  const initial = buildOphirPriceRestore(inventory(), [target]);
  const again = buildOphirPriceRestore(response(initial.update), [target]);
  assert.equal(again.changed, 0);
  assert.equal(again.alreadyRestored, 1);
  assert.equal(again.currentFingerprint, again.expectedFingerprint);
  assert.equal(again.prices[0].status, "already-restored");
});

test("rejects a later independent price change before making any payload", () => {
  const current = inventory();
  current.products[0].offerings[0].price.amount = 80000;
  const original = structuredClone(current);
  assert.throws(() => buildOphirPriceRestore(current, [target]), /price conflict/);
  assert.deepEqual(current, original);
});

test("unchanged historical entries do not count as restored changes", () => {
  const result = buildOphirPriceRestore(inventory(), [{ ...target, beforeCents: 78000 }]);
  assert.equal(result.changed, 0);
  assert.equal(result.alreadyRestored, 0);
  assert.equal(result.prices[0].status, "unchanged");
});

test("rejects missing, duplicated or multi-offering target identity", () => {
  assert.throws(() => buildOphirPriceRestore(inventory(), [target, target]), /duplicate target/);
  assert.throws(() => buildOphirPriceRestore(inventory(), [{ ...target, sku: "missing" }]), /exactly one/);
  const duplicate = inventory();
  duplicate.products.push(structuredClone(duplicate.products[0]));
  assert.throws(() => buildOphirPriceRestore(duplicate, [target]), /exactly one/);
  const multiple = inventory();
  multiple.products[0].offerings.push(structuredClone(multiple.products[0].offerings[0]));
  assert.throws(() => buildOphirPriceRestore(multiple, [target]), /exactly one/);
});

test("requires current non-price fields instead of fabricating defaults", () => {
  for (const field of ["quantity", "is_enabled", "readiness_state_id"] as const) {
    const current: unknown = inventory();
    const record = current as { products: { offerings: Record<string, unknown>[] }[] };
    delete record.products[0].offerings[0][field];
    assert.throws(() => buildOphirPriceRestore(current, [target]), new RegExp(field));
  }
  const current: unknown = inventory();
  delete (current as Record<string, unknown>).readiness_state_on_property;
  assert.throws(() => buildOphirPriceRestore(current, [target]), /readiness_state_on_property/);
  const withoutName: unknown = inventory();
  delete (withoutName as { products: { property_values: Record<string, unknown>[] }[] }).products[0].property_values[0].property_name;
  assert.throws(() => buildOphirPriceRestore(withoutName, [target]), /property_name/);
});

test("rejects wrong currency, sub-cent, zero and nonfinite money for unrelated offerings too", () => {
  for (const money of [
    { amount: 1000, divisor: 100, currency_code: "EUR" },
    { amount: 12345, divisor: 1000, currency_code: "USD" },
    { amount: 0, divisor: 100, currency_code: "USD" },
    { amount: Infinity, divisor: 100, currency_code: "USD" },
    { amount: 1000, divisor: 0, currency_code: "USD" },
  ]) {
    const current = inventory();
    current.products[1].offerings[0].price = money;
    assert.throws(() => buildOphirPriceRestore(current, [target]), /USD|precision|safe integer/);
  }
  assert.throws(() => buildOphirPriceRestore(inventory(), [{ ...target, beforeCents: 39500.5 }]), /safe integer/);
});

test("rejects malformed inventory and axis references before attempting any restoration", () => {
  assert.throws(() => buildOphirPriceRestore(null, [target]), /inventory must be an object/);
  const current = inventory();
  current.price_on_property = [999];
  assert.throws(() => buildOphirPriceRestore(current, [target]), /missing property axis/);
  const duplicate = inventory();
  duplicate.price_on_property = [513, 513];
  assert.throws(() => buildOphirPriceRestore(duplicate, [target]), /duplicate property IDs/);
});

test("excludes deleted entities without resurrecting them or reading their invalid prices", () => {
  const current = inventory();
  const deleted = structuredClone(current.products[0]);
  deleted.is_deleted = true;
  deleted.offerings[0].price.amount = 0;
  current.products.push(deleted);
  const deletedOffering = structuredClone(current.products[0].offerings[0]);
  deletedOffering.is_deleted = true;
  deletedOffering.price.amount = 0;
  current.products[0].offerings.push(deletedOffering);
  const result = buildOphirPriceRestore(current, [target]);
  assert.equal(result.update.products.length, 2);
  assert.equal(result.update.products[0].offerings.length, 1);
  assert.equal("product_id" in result.update.products[0], false);
  assert.equal("offering_id" in result.update.products[0].offerings[0], false);
  assert.equal("scale_name" in result.update.products[0].property_values[0], false);
});

test("preserves all three property axes and requires third-variation support in the caller query", () => {
  const current = inventory();
  current.products.forEach((p) => p.property_values.push({ property_id: 516, property_name: "Finish", scale_id: null, scale_name: null, value_ids: [777], values: ["Polished"] }));
  const result = buildOphirPriceRestore(current, [target]);
  assert.equal(result.update.products[0].property_values.length, 3);
  assert.deepEqual(result.query, { legacy: "false", max_variations_supported: "3" });
});

test("refuses to change axis definitions when previous prices conflict with the current price axis", () => {
  const current = inventory();
  current.price_on_property = [514];
  current.products[1].property_values[1] = structuredClone(current.products[0].property_values[1]);
  current.products[1].offerings[0].price = structuredClone(current.products[0].offerings[0].price);
  assert.throws(() => buildOphirPriceRestore(current, [target]), /conflict with current price_on_property/);
});
