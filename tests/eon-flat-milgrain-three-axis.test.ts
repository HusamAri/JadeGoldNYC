import { strict as assert } from "node:assert";
import test from "node:test";

import {
  FLAT_MILGRAIN_ORG_ID,
  FLAT_MILGRAIN_SHOP_ID,
  FLAT_MILGRAIN_TARGETS,
  buildFlatMilgrainThreeAxisInventory,
  getFlatMilgrainTarget,
  preflightFlatMilgrainInventory,
  validateFlatMilgrainPanelVariants,
  verifyFlatMilgrainReadback,
  type FlatMilgrainPanelVariant,
  type FlatMilgrainTarget,
} from "@/lib/etsy/eon-flat-milgrain-three-axis";

const target = FLAT_MILGRAIN_TARGETS[0];
const readinessStateId = 12345;

/** Synthetic prices only: the production helper must use live panel price_cents. */
function panelRows(item: FlatMilgrainTarget = target): FlatMilgrainPanelVariant[] {
  const rows: FlatMilgrainPanelVariant[] = [];
  for (const karat of [10, 14, 18]) {
    for (let width = 2; width <= 7; width += 1) {
      for (let sizeTenths = 30; sizeTenths <= 130; sizeTenths += 5) {
        const size = sizeTenths / 10;
        rows.push({
          sku: `${item.skuPrefix}-${karat}-${String(width).padStart(2, "0")}-${String(sizeTenths).padStart(3, "0")}`,
          active: true,
          properties: { Karat: `${karat}K`, Width: `${width} mm`, "Ring Size": `US ${size}` },
          price_cents: 64000 + ((karat - 10) / 4) * 20000 + (width - 2) * 1000 + ((sizeTenths - 30) / 5) * 575,
          quantity: 20,
        });
      }
    }
  }
  return rows;
}

function payload(item = target) {
  return buildFlatMilgrainThreeAxisInventory(item, panelRows(item), readinessStateId);
}

function fullReadback(item = target) {
  const update = payload(item);
  return {
    products: update.products.map((product) => ({
      sku: product.sku,
      property_values: structuredClone(product.property_values),
      offerings: [{
        price: { amount: Math.round(product.offerings[0].price * 100), divisor: 100, currency_code: "USD" },
        quantity: product.offerings[0].quantity,
        is_enabled: true,
        readiness_state_id: readinessStateId,
      }],
    })),
    price_on_property: [516, 513, 514],
    quantity_on_property: [],
    sku_on_property: [516, 513, 514],
    readiness_state_on_property: [],
  };
}

function oldReadback(item = target) {
  const update = payload(item);
  return {
    products: update.products
      .filter((product) => product.sku.endsWith("-130"))
      .map((product) => ({
        sku: product.sku,
        // Historical 18-cell inventory had Karat + Width but no Ring Size axis.
        property_values: structuredClone(product.property_values.slice(0, 2)).reverse(),
        offerings: [{
          price: { amount: Math.round(product.offerings[0].price * 100), divisor: 100, currency_code: "USD" },
          quantity: product.offerings[0].quantity,
          is_enabled: true,
        }],
      })),
    price_on_property: [516, 513],
    quantity_on_property: [],
    sku_on_property: [516, 513],
  };
}

test("allowlist binds exact org, shop, product, listing, metal, and SKU prefix", () => {
  assert.equal(FLAT_MILGRAIN_ORG_ID, "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0");
  assert.equal(FLAT_MILGRAIN_SHOP_ID, 61324215);
  assert.deepEqual(FLAT_MILGRAIN_TARGETS.map((item) => [item.productId, item.listingId, item.metal, item.skuPrefix]), [
    ["dd9febe7-9900-4d9d-8d07-88755a5279b8", 4570232103, "Y", "EON-FMLGRN-Y"],
    ["f4d4ef99-26a2-4295-a582-f35b90c78852", 4570232571, "W", "EON-FMLGRN-W"],
    ["e8533ce8-d497-4e9e-af10-6ee4253e6522", 4570233049, "R", "EON-FMLGRN-R"],
  ]);
  for (const item of FLAT_MILGRAIN_TARGETS) assert.equal(getFlatMilgrainTarget(item.productId), item);
  assert.equal(getFlatMilgrainTarget("not-an-eon-product"), undefined);
  assert.throws(() => validateFlatMilgrainPanelVariants({ ...target, listingId: 1 }, panelRows()), /izin verilen üç taslaktan/);
});

test("full 3 × 6 × 21 panel grid builds 378 deterministic three-axis Etsy products", () => {
  for (const item of FLAT_MILGRAIN_TARGETS) {
    const rows = panelRows(item).reverse();
    const checked = validateFlatMilgrainPanelVariants(item, rows);
    assert.equal(checked.length, 378);
    assert.equal(checked[0].sku, `${item.skuPrefix}-10-02-030`);
    assert.equal(checked.at(-1)?.sku, `${item.skuPrefix}-18-07-130`);
    const update = buildFlatMilgrainThreeAxisInventory(item, rows, readinessStateId);
    assert.equal(update.products.length, 378);
    assert.deepEqual(update.price_on_property, [516, 513, 514]);
    assert.deepEqual(update.sku_on_property, [516, 513, 514]);
    assert.deepEqual(update.quantity_on_property, []);
    assert.deepEqual(update.readiness_state_on_property, []);
    assert.deepEqual(update.products[0].property_values, [
      { property_id: 516, property_name: "Karat", value_ids: [], values: ["10K"] },
      { property_id: 513, property_name: "Width", value_ids: [], values: ["2 mm"] },
      { property_id: 514, property_name: "Ring Size", value_ids: [], values: ["US 3"] },
    ]);
    assert.deepEqual(update.products[0].offerings, [{
      price: 640,
      quantity: 20,
      is_enabled: true,
      readiness_state_id: readinessStateId,
    }]);
  }
});

test("panel validation rejects missing, duplicate, inactive, malformed, or unexpected cells", () => {
  const rows = panelRows();
  assert.throws(() => validateFlatMilgrainPanelVariants(target, rows.slice(1)), /tam 378/);
  assert.throws(() => validateFlatMilgrainPanelVariants(target, [...rows.slice(1), rows[1]]), /mükerrer SKU/);
  const changed = rows.map((row) => ({ ...row, properties: { ...row.properties } }));
  changed[0].active = false;
  assert.throws(() => validateFlatMilgrainPanelVariants(target, changed), /aktif değil/);
  changed[0].active = true;
  changed[0].properties = { ...changed[0].properties, Metal: "Yellow Gold" };
  assert.throws(() => validateFlatMilgrainPanelVariants(target, changed), /yalnız Karat, Width, Ring Size/);
  changed[0].properties = { Karat: "14K", Width: "2 mm", "Ring Size": "US 3" };
  assert.throws(() => validateFlatMilgrainPanelVariants(target, changed), /Karat değeri/);
  changed[0].properties = { Karat: "10K", Width: "2 mm", "Ring Size": "US 3" };
  changed[0].price_cents = 0;
  assert.throws(() => validateFlatMilgrainPanelVariants(target, changed), /price_cents/);
  changed[0].price_cents = 64000;
  changed[0].quantity = 19;
  assert.throws(() => validateFlatMilgrainPanelVariants(target, changed), /quantity 20/);
  changed[0].quantity = 20;
  changed[0].sku = "EON-FMLGRN-Y-10-02-031";
  assert.throws(() => validateFlatMilgrainPanelVariants(target, changed), /panel varyantı eksik/);
  assert.throws(() => buildFlatMilgrainThreeAxisInventory(target, rows, 0), /readiness_state_id/);
});

test("exact 18-cell US 13 baseline is upgradeable, but only at matching panel prices", () => {
  const update = payload();
  const old = oldReadback();
  assert.equal(preflightFlatMilgrainInventory(target, old, update, readinessStateId), "upgrade");
  old.products[0].offerings[0].price.amount += 100;
  assert.throws(() => preflightFlatMilgrainInventory(target, old, update, readinessStateId), /baseline fiyatı/);
  old.products[0].offerings[0].price.amount -= 100;
  old.products[0].property_values[0].values[0] = "8 mm";
  assert.throws(() => preflightFlatMilgrainInventory(target, old, update, readinessStateId), /baseline Width değeri/);
  old.products[0].property_values[0].values[0] = "2 mm";
  old.products[0].sku = "EON-FMLGRN-Y-10-02-125";
  assert.throws(() => preflightFlatMilgrainInventory(target, old, update, readinessStateId), /baseline US 13 SKU/);
});

test("complete matching readback is an unchanged no-op; all three axes and offerings are checked", () => {
  const update = payload();
  const current = fullReadback();
  verifyFlatMilgrainReadback(target, current, update, readinessStateId);
  assert.equal(preflightFlatMilgrainInventory(target, current, update, readinessStateId), "unchanged");

  const changedAxis = fullReadback();
  changedAxis.products[0].property_values[2].values[0] = "US 4";
  assert.throws(() => verifyFlatMilgrainReadback(target, changedAxis, update, readinessStateId), /Ring Size değeri/);
  const changedId = fullReadback();
  changedId.products[0].property_values[0].property_id = 513;
  assert.throws(() => verifyFlatMilgrainReadback(target, changedId, update, readinessStateId), /Karat property ID/);
  const changedPrice = fullReadback();
  changedPrice.products[0].offerings[0].price.amount += 100;
  assert.throws(() => verifyFlatMilgrainReadback(target, changedPrice, update, readinessStateId), /fiyatı farklı/);
  const changedQty = fullReadback();
  changedQty.products[0].offerings[0].quantity = 19;
  assert.throws(() => verifyFlatMilgrainReadback(target, changedQty, update, readinessStateId), /adedi farklı/);
  const changedReadiness = fullReadback();
  changedReadiness.products[0].offerings[0].readiness_state_id = 7;
  assert.throws(() => verifyFlatMilgrainReadback(target, changedReadiness, update, readinessStateId), /readiness state farklı/);
  const disabled = fullReadback();
  disabled.products[0].offerings[0].is_enabled = false;
  assert.throws(() => verifyFlatMilgrainReadback(target, disabled, update, readinessStateId), /etkin değil/);
  const wrongOnProperty = fullReadback();
  wrongOnProperty.price_on_property = [513, 516, 514];
  assert.throws(() => verifyFlatMilgrainReadback(target, wrongOnProperty, update, readinessStateId), /price_on_property/);
});
