import { strict as assert } from "node:assert";
import test from "node:test";

import {
  enabledQuantities,
  planQuantitySet,
  priceFingerprint,
} from "@/lib/etsy/quantity-set";
import { buildInventoryUpdate } from "@/lib/etsy/inventory";
import type { EtsyInventory, EtsyInventoryProduct } from "@/lib/etsy/types";

/**
 * ops/quantity-set planı. Şekil canlı Evil Eye envanterinden: üç eksen
 * (Karat x Metal Color x beden), adet varyasyona bağlı değil, her offering
 * aynı adedi taşıyor (Etsy'de adet 1, hedef 20).
 */

const usd = (amount: number) => ({ amount, divisor: 100, currency_code: "USD" });

function product(
  sku: string,
  values: string[],
  quantity: number,
  cents: number,
  enabled = true,
): EtsyInventoryProduct {
  return {
    product_id: 1,
    sku,
    is_deleted: false,
    property_values: values.map((v, i) => ({
      property_id: 500 + i,
      property_name: ["Karat", "Metal Color", "Ring Size"][i],
      values: [v],
      value_ids: [i + 1],
    })),
    offerings: [{ offering_id: 9, quantity, is_enabled: enabled, is_deleted: false, price: usd(cents) }],
  };
}

function grid(quantity: number): EtsyInventory {
  return {
    products: [
      product("BAS-EE-R01-10KYW-US7", ["10K", "Yellow/White Gold", "US 7"], quantity, 52000),
      product("BAS-EE-R01-14KYW-US7", ["14K", "Yellow/White Gold", "US 7"], quantity, 68000),
      product("BAS-EE-R01-18KYW-US7", ["18K", "Yellow/White Gold", "US 7"], quantity, 86000),
    ],
    price_on_property: [500, 502],
    quantity_on_property: [],
    sku_on_property: [500, 501, 502],
  };
}

test("adet 1 olan tam ızgara 20'ye çekilir", () => {
  const plan = planQuantitySet(grid(1), 20);
  assert.equal(plan.status, "would-set");
  assert.deepEqual(plan.before, [1]);
  assert.equal(plan.products, 3);
  assert.equal(plan.offerings, 3);
  assert.equal(plan.disabled, 0);
});

test("hedefteki listing yeniden yazılmaz", () => {
  const plan = planQuantitySet(grid(20), 20);
  assert.equal(plan.status, "already");
  assert.deepEqual(plan.before, [20]);
});

test("satıştan sonra 19'a düşen listing 20'ye döner", () => {
  assert.equal(planQuantitySet(grid(19), 20).status, "would-set");
});

test("adet varyasyona bağlıysa düz yazım reddedilir", () => {
  const inv = grid(1);
  inv.quantity_on_property = [502];
  const plan = planQuantitySet(inv, 20);
  assert.equal(plan.status, "refuse");
  assert.equal(plan.reason, "quantity-on-property");
});

test("satışa açık offering'ler farklı adet taşıyorsa reddedilir", () => {
  const inv = grid(1);
  inv.products[1].offerings![0].quantity = 5;
  const plan = planQuantitySet(inv, 20);
  assert.equal(plan.status, "refuse");
  assert.equal(plan.reason, "mixed-quantities");
  assert.deepEqual(plan.before, [1, 5]);
});

test("satışa kapalı offering adet kontrolüne girmez", () => {
  const inv = grid(1);
  inv.products.push(product("BAS-EE-R01-18KYW-US16", ["18K", "Yellow/White Gold", "US 16"], 0, 86000, false));
  const plan = planQuantitySet(inv, 20);
  assert.equal(plan.status, "would-set");
  assert.deepEqual(plan.before, [1]);
  assert.equal(plan.disabled, 1);
  assert.deepEqual(enabledQuantities(inv), [1]);
});

test("boş ya da tamamı kapalı envanter reddedilir", () => {
  assert.equal(planQuantitySet({ products: [] }, 20).reason, "empty");
  const inv = grid(1);
  for (const p of inv.products) p.offerings![0].is_enabled = false;
  assert.equal(planQuantitySet(inv, 20).reason, "empty");
});

test("silinmiş ürün ve offering sayılmaz", () => {
  const inv = grid(1);
  inv.products[0].is_deleted = true;
  inv.products[1].offerings!.push({ quantity: 7, is_enabled: true, is_deleted: true, price: usd(1) });
  const plan = planQuantitySet(inv, 20);
  assert.equal(plan.status, "would-set");
  assert.equal(plan.products, 2);
  assert.equal(plan.offerings, 2);
});

test("okunamayan fiyat kuru çalışmada görünür", () => {
  const inv = grid(1);
  inv.products[2].offerings![0].price = undefined;
  const plan = planQuantitySet(inv, 20);
  assert.equal(plan.status, "refuse");
  assert.equal(plan.reason, "unreadable-price");
});

test("iz adetten bağımsızdır, fiyat ya da açıklık değişince değişir", () => {
  const before = priceFingerprint(grid(1));
  assert.equal(priceFingerprint(grid(20)), before);

  const reordered = grid(20);
  reordered.products.reverse();
  assert.equal(priceFingerprint(reordered), before);

  const repriced = grid(20);
  repriced.products[0].offerings![0].price = usd(51900);
  assert.notEqual(priceFingerprint(repriced), before);

  const closed = grid(20);
  closed.products[0].offerings![0].is_enabled = false;
  assert.notEqual(priceFingerprint(closed), before);
});

test("gerçek yazım yükü fiyatı ve yapıyı korur, yalnız adedi değiştirir", () => {
  const inv = grid(1);
  const update = buildInventoryUpdate(inv, () => true, 20, 777);
  assert.equal(update.products.length, 3);
  for (const [i, p] of update.products.entries()) {
    assert.equal(p.sku, inv.products[i].sku);
    assert.equal(p.offerings.length, 1);
    assert.equal(p.offerings[0].quantity, 20);
    assert.equal(p.offerings[0].readiness_state_id, 777);
    assert.equal(Math.round(p.offerings[0].price * 100), inv.products[i].offerings![0].price!.amount);
    assert.deepEqual(
      p.property_values.map((v) => v.values[0]),
      inv.products[i].property_values!.map((v) => v.values![0]),
    );
  }
  assert.deepEqual(update.price_on_property, [500, 502]);
  assert.deepEqual(update.quantity_on_property, []);
  assert.deepEqual(update.sku_on_property, [500, 501, 502]);
  assert.deepEqual(update.readiness_state_on_property, []);
});
