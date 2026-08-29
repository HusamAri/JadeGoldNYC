import { strict as assert } from "node:assert";
import { test } from "node:test";

import { SKU_MAX, skuParcalari, skuUret } from "../lib/etsy/ophir-sku";

/** Etsy GET envanterindeki property_values şeklini taklit eder. */
function props(...values: string[]) {
  return { property_values: values.map((v) => ({ values: [v] })) };
}

/* CANLI VERİ ŞEKLİ — kanarya koşusundan (2026-08-28, listing 4558671043,
 * 396 offering). Metal ve beden AYRI property; beden KESİRLİ yazılıyor
 * ("3 1/4"), ondalık DEĞİL. Testler bu gerçek şekle göre kurulur — uydurma
 * ondalık bedenle test etmek ilk turda hatayı kaçırmıştı. */
const METALLER = [
  "10K WHITE", "10K YELLOW", "10K ROSE",
  "14K WHITE", "14K YELLOW", "14K ROSE",
  "18K WHITE", "18K YELLOW", "18K ROSE",
];
/** 3 → 13 3/4 arası çeyrek adım = 44 beden (9 × 44 = 396, kanaryayla birebir). */
const BEDENLER: string[] = [];
for (let tam = 3; tam <= 13; tam++) {
  for (const kesir of ["", " 1/4", " 1/2", " 3/4"]) {
    BEDENLER.push(`${tam}${kesir}`);
  }
}

test("kanarya regresyonu: çakışan beş offering artık tekil", () => {
  // Kuru koşuda ÇAKIŞAN tam girdi: "3" ile "3 1/2" aynı SKU'yu üretmişti.
  const girdiler = ["3", "3 1/4", "3 1/2", "3 3/4", "4"];
  const uretilen = girdiler.map((b, i) =>
    skuUret(4558671043, props("10K WHITE", b), i),
  );
  assert.equal(new Set(uretilen).size, girdiler.length, `çakışma: ${uretilen}`);
  assert.deepEqual(uretilen, [
    "OPH-4558671043-10W-3",
    "OPH-4558671043-10W-3.25",
    "OPH-4558671043-10W-3.5",
    "OPH-4558671043-10W-3.75",
    "OPH-4558671043-10W-4",
  ]);
});

test("gerçek matris: 9 metal × 44 beden = 396 offering, hepsi tekil", () => {
  const listingId = 4558671043;
  const uretilen = new Set<string>();
  let i = 0;
  for (const m of METALLER) {
    for (const b of BEDENLER) {
      const sku = skuUret(listingId, props(m, b), i++);
      assert.ok(!uretilen.has(sku), `çakışma: ${sku} (${m} · ${b})`);
      uretilen.add(sku);
      assert.ok(sku.length <= SKU_MAX, `çok uzun (${sku.length}): ${sku}`);
      assert.match(sku, /^OPH-\d+-(10|14|18)[YWR]-\d{1,2}(\.\d{1,2})?$/);
      // Sıra-numarası yedeğine DÜŞMEMELİ — hepsi çözülebilir.
      assert.ok(!sku.includes("-x"), `yedeğe düştü: ${sku} (${m} · ${b})`);
    }
  }
  assert.equal(i, 396, "kanaryadaki offering sayısı");
  assert.equal(uretilen.size, 396);
});

test("kesirli beden ondalığa normalize edilir", () => {
  assert.equal(skuParcalari(props("10K WHITE", "3 1/4")).beden, "3.25");
  assert.equal(skuParcalari(props("10K WHITE", "7 1/2")).beden, "7.5");
  assert.equal(skuParcalari(props("10K WHITE", "13 3/4")).beden, "13.75");
  assert.equal(skuParcalari(props("10K WHITE", "9")).beden, "9");
});

test("ondalık ve US önekli biçimler de kabul edilir", () => {
  assert.equal(skuParcalari(props("14K YELLOW", "7.5")).beden, "7.5");
  assert.equal(skuParcalari(props("14K YELLOW", "US 9")).beden, "9");
  assert.equal(skuParcalari(props("14K YELLOW", "7.50")).beden, "7.5");
});

test("karat ve renk canlı biçimden ayrıştırılır", () => {
  assert.deepEqual(skuParcalari(props("10K WHITE", "3")), {
    karat: "10", renk: "W", beden: "3",
  });
  assert.deepEqual(skuParcalari(props("18K ROSE", "9 1/2")), {
    karat: "18", renk: "R", beden: "9.5",
  });
  assert.deepEqual(skuParcalari(props("14K YELLOW", "7")), {
    karat: "14", renk: "Y", beden: "7",
  });
});

test("yedek yol AYRI ad alanında — gerçek bedenle çakışamaz", () => {
  // Beden çözülemeyen offering sıra numarası alır ama "x" önekiyle.
  const yedek = skuUret(4558671043, props("10K WHITE", "Custom"), 2);
  assert.equal(yedek, "OPH-4558671043-10W-x3");
  const gercek = skuUret(4558671043, props("10K WHITE", "3"), 9);
  assert.notEqual(yedek, gercek);
  assert.equal(gercek, "OPH-4558671043-10W-3");
});

test("çözülemeyen offering ve boş/bozuk değerde patlamaz", () => {
  assert.equal(skuUret(123, { property_values: [] }, 0), "OPH-123-x1");
  assert.equal(skuUret(123, {}, 4), "OPH-123-x5");
  assert.equal(skuUret(9, { property_values: [{ values: null }] }, 1), "OPH-9-x2");
  assert.equal(skuUret(9, { property_values: null }, 2), "OPH-9-x3");
});

test("ölçüler beden alanına sızmaz", () => {
  assert.equal(skuParcalari(props("1.5mm")).beden, undefined);
  assert.equal(skuParcalari(props("Width 4mm")).beden, undefined);
});

test("farklı listing aynı varyantta ÇAKIŞMAZ (kopya-listing koruması)", () => {
  const a = skuUret(4543147022, props("14K YELLOW", "7"), 0);
  const b = skuUret(4544906099, props("14K YELLOW", "7"), 0);
  assert.notEqual(a, b);
});

test("en uzun gerçekçi SKU sınırın altında", () => {
  const sku = skuUret(9999999999, props("18K YELLOW", "13 3/4"), 0);
  assert.ok(sku.length <= SKU_MAX, `${sku} = ${sku.length} kr`);
});
