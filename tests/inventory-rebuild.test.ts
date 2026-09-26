import { test } from "node:test";
import assert from "node:assert/strict";

import { buildRebuildInventory, type RebuildVariant } from "../lib/etsy/inventory-rebuild";

const AXES = ["Karat", "Metal Color", "Ring Size"];
const KARATS = ["10K", "14K", "18K"];
const COLORS = ["Yellow Gold", "White Gold", "Rose Gold"];
const SIZES = Array.from({ length: 27 }, (_, i) => String(3 + i / 2));

function grid(): RebuildVariant[] {
  const out: RebuildVariant[] = [];
  for (const k of KARATS)
    for (const c of COLORS)
      for (const s of SIZES)
        out.push({
          sku: `BAS-S01-CRT-${k}${c[0]}-US${s.replace(".", "_")}`,
          price_cents: 100000 + out.length,
          quantity: 20,
          properties: { Karat: k, "Metal Color": c, "Ring Size": `US ${s}` },
        });
  return out;
}

test("Cartouche 3 eksen: 243 ürün, create yolunun slot sözleşmesi", () => {
  const r = buildRebuildInventory(grid(), AXES, 1234, 1);
  assert.ok(r.ok, r.ok ? "" : r.error);
  if (!r.ok) return;
  assert.equal(r.update.products.length, 243);
  assert.deepEqual(r.update.price_on_property, [516, 513, 514]);
  assert.deepEqual(r.update.sku_on_property, [516, 513, 514]);
  assert.deepEqual(r.update.readiness_state_on_property, []);
  const p = r.update.products[0];
  assert.deepEqual(p.property_values.map((x) => [x.property_id, x.property_name, x.values[0]]), [
    [516, "Karat", "10K"],
    [513, "Metal Color", "Yellow Gold"],
    [514, "Ring Size", "US 3"],
  ]);
  assert.equal(p.offerings[0].readiness_state_id, 1234);
  assert.equal(r.axisValues["Ring Size"].length, 27);
});

test("eksik kombinasyon (18K beyaz yok) reddedilir: ızgara tam olmalı", () => {
  const v = grid().filter((x) => !(x.sku ?? "").includes("-18KW-"));
  const r = buildRebuildInventory(v, AXES, 1, 1);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /ızgara eksik/);
});

test("tekrarlı SKU, eksik eksen, eksen dışı özellik, fiyatsız varyant reddedilir", () => {
  const dup = grid();
  dup[1] = { ...dup[1], sku: dup[0].sku };
  assert.equal(buildRebuildInventory(dup, AXES, 1, 1).ok, false);

  const missing = grid();
  missing[0] = { ...missing[0], properties: { Karat: "10K", "Ring Size": "US 3" } };
  assert.equal(buildRebuildInventory(missing, AXES, 1, 1).ok, false);

  const extra = grid();
  extra[0] = { ...extra[0], properties: { ...(extra[0].properties as object), Width: "4mm" } };
  assert.equal(buildRebuildInventory(extra, AXES, 1, 1).ok, false);

  const free = grid();
  free[0] = { ...free[0], price_cents: 0 };
  assert.equal(buildRebuildInventory(free, AXES, 1, 1).ok, false);
});

test("3 eksende 400 üstü ızgara Etsy'ye gitmeden durur", () => {
  const v: RebuildVariant[] = [];
  for (const k of ["10K", "14K", "18K"])
    for (const c of ["A", "B", "C", "D", "E"])
      for (let s = 0; s < 27; s++)
        v.push({ sku: `X-${k}${c}-${s}`, price_cents: 100, quantity: 1, properties: { Karat: k, "Metal Color": c, "Ring Size": String(s) } });
  const r = buildRebuildInventory(v, AXES, 1, 1);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /400/);
});

test("2 eksen 513/514 kullanır", () => {
  const v = grid()
    .filter((x) => (x.properties as Record<string, string>).Karat === "14K")
    .map((x) => {
      const { Karat: _k, ...rest } = x.properties as Record<string, string>;
      void _k;
      return { ...x, properties: rest };
    });
  const r = buildRebuildInventory(v, ["Metal Color", "Ring Size"], 1, 1);
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.update.price_on_property, [513, 514]);
});
