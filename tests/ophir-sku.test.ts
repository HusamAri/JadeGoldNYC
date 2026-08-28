import { strict as assert } from "node:assert";
import { test } from "node:test";

import { SKU_MAX, skuParcalari, skuUret } from "../lib/etsy/ophir-sku";

/** Etsy GET envanterindeki property_values şeklini taklit eder. */
function props(...values: string[]) {
  return { property_values: values.map((v) => ({ values: [v] })) };
}

const KARATLAR = ["10K", "14K", "18K"];
const RENKLER = ["Yellow Gold", "White Gold", "Rose Gold"];
const BEDENLER = [
  "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5",
  "10", "10.5", "11", "11.5", "12", "12.5", "13", "13.5", "14", "14.5",
  "15", "15.5", "16",
];

test("tam kombinatorik süpürme: 3 karat × 3 renk × 25 beden", () => {
  const listingId = 4543147022;
  const uretilen = new Set<string>();
  let i = 0;
  for (const k of KARATLAR) {
    for (const r of RENKLER) {
      for (const b of BEDENLER) {
        const sku = skuUret(listingId, props(k, r, b), i++);
        // 1) tekil
        assert.ok(!uretilen.has(sku), `çakışma: ${sku}`);
        uretilen.add(sku);
        // 2) uzunluk sınırı
        assert.ok(sku.length <= SKU_MAX, `çok uzun (${sku.length}): ${sku}`);
        // 3) beklenen desen
        assert.match(sku, /^OPH-\d+-(10|14|18)[YWR]-\d{1,2}(\.\d)?$/);
        // 4) hepsi çözülebilir olduğu için sıra-numarası yedeğine düşmemeli:
        //    son parça beden, ondan önceki karat+renk olmalı (desen zaten
        //    bunu doğruluyor; burada sıra numarasının beden yerine geçmediğini
        //    ayrıca teyit ediyoruz).
        assert.equal(sku.split("-").at(-1), b);
      }
    }
  }
  assert.equal(uretilen.size, 3 * 3 * 25);
});

test("karat/renk/beden ayrıştırma", () => {
  assert.deepEqual(skuParcalari(props("14K Yellow Gold", "7.5")), {
    karat: "14",
    renk: "Y",
    beden: "7.5",
  });
  assert.deepEqual(skuParcalari(props("18k white gold", "US 9")), {
    karat: "18",
    renk: "W",
    beden: "9",
  });
  assert.deepEqual(skuParcalari(props("10K Rose Gold", "6")), {
    karat: "10",
    renk: "R",
    beden: "6",
  });
});

test("çözülemeyen offering sıra numarasına düşer", () => {
  assert.equal(skuUret(123, { property_values: [] }, 0), "OPH-123-1");
  assert.equal(skuUret(123, {}, 4), "OPH-123-5");
  // karat var, beden yok → sıra ile tamamlanır
  assert.equal(skuUret(123, props("14K Yellow Gold"), 2), "OPH-123-14Y-3");
});

test("farklı listing aynı varyantta ÇAKIŞMAZ (kopya-listing koruması)", () => {
  const a = skuUret(4543147022, props("14K Yellow Gold", "7"), 0);
  const b = skuUret(4544906099, props("14K Yellow Gold", "7"), 0);
  assert.notEqual(a, b);
});

test("boş/bozuk değer sıra numarasına düşer, patlamaz", () => {
  assert.equal(skuUret(9, { property_values: [{ values: [] }] }, 0), "OPH-9-1");
  assert.equal(skuUret(9, { property_values: [{ values: null }] }, 1), "OPH-9-2");
  assert.equal(skuUret(9, { property_values: null }, 2), "OPH-9-3");
});

test("beden yalnız sayı biçiminde kabul edilir (yanlış eşleşme yok)", () => {
  // "1.5mm" bir ölçü, beden DEĞİL — beden alanına sızmamalı
  assert.equal(skuParcalari(props("1.5mm")).beden, undefined);
  assert.equal(skuParcalari(props("Width 4mm")).beden, undefined);
});

test("en uzun gerçekçi SKU sınırın altında", () => {
  const sku = skuUret(9999999999, props("18K Yellow Gold", "15.5"), 0);
  assert.ok(sku.length <= SKU_MAX, `${sku} = ${sku.length} kr`);
});
