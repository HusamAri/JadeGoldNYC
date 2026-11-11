#!/usr/bin/env node
/**
 * EON lab-grown 05 Half Eternity Pavé, stone of your choice (EON-HEP) → panel taslağı:
 * supabase/migrations/0185_eon_lab_grown_hep.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/05-half-eternity-pave/listing.json. Referans: sahibin Etsy linki 685259244
 * (NyFineJewelry, yarım tur, 1,35 mm, ~0,184 ctw) ve aynı listing'in 20 taşlık "Stone Available" tablosu.
 * Sahip 2026-11-11: "new model all stone choices as specialization option".
 *
 * Taş seçimi VARYASYON DEĞİL, listing düzeyinde kişiselleştirme açılır listesi (listing_metadata.personalizationQuestions;
 * lib/etsy/create-listing.ts personalizationFor onu Etsy'ye yazar). Etsy sınırları (canlı OpenAPI + personalization
 * migration rehberi, 2026-11-11): soru metni 1-45 kr, açılır listede 1-30 seçenek, seçenek ≤20 kr, `instructions`
 * yasak; add_on_price yalnız isteğe bağlı text_input'ta, yani taş fiyatı DEĞİŞTİREMEZ: tek fiyat en pahalı taşı da
 * karşılar. 20 taş × 75 varyant = 1.500 > Etsy'nin 400 ürün sınırı, varyasyon olamazdı.
 *
 * Taş sayısı bedenle değişir (üst yarı / 1,45 mm adım: US 4 19, US 8½ 23, US 16 30), bu yüzden varyant başına taş
 * karatı ve taş + takma maliyeti beden hücresinden yazılır; products.setting_fee_cents 0 (ortak modül: stoneAt).
 *
 * Kapılar: ortak metin kapıları (lab_grown_gates.mjs, `allowNatural`: doğal salt and pepper ve siyah pırlanta
 * açıklamada "natural" niteleyicisiyle) + kişiselleştirme sözleşmesi (Etsy sınırları, etiket = taş listesi, FTC
 * etiket kuralı: lab taş "Lab Grown"/"Lab Created"/"Created" ile, inci "Cultured" ile) + her seçeneğin kökeni ve
 * işlemi açıklamada + yapı-metin bağı (beden aralığı, tek fiyat, ölçüler, karat yok) + kâr tablosu bu hesapla aynı
 * ve seçilen tek fiyat %25 vitrinde, en kötü Offsite ücretinde, EN PAHALI taşla HER bedende zarar etmez.
 * Sahip onayı (approval.authority) yazılmadan migration dosyası yazılmaz: kuru koşu yalnız özeti ve mührü basar.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_hep_migration.mjs
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bandCells, bandMigrationSql, bandRows, fmtSize } from "./lab_grown_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/05-half-eternity-pave";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const fileName = "0185_eon_lab_grown_hep.sql";
const outFile = path.join(repoRoot, "supabase/migrations", fileName);

// ---- metin kapıları
checkListingText(L, { allowNatural: true });
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert.equal(L.pricing.onePriceAllStones, true);
assert(L.description.includes("One price for every size and every stone."), "tek fiyat açıklamada");
assert(!/\bcarats?\b|\bct\b|\bctw\b|0\.[0-9]{2,3}\s?ct/i.test(L.description), "karat üretici teyidi olmadan yazılmaz");
assert(/\b1\.5mm\b/.test(L.title) && L.description.includes("1.5 mm wide") && L.description.includes("1.5 mm thick"));
assert(/\bHalf Eternity\b/.test(L.title) && /\bChoose Your Stone\b/.test(L.title));
for (const w of ["one row of small round stones across the top half", "tiny shared prongs", "about 23 round stones of about 1.3 mm in US 8.5",
  "a few more in larger sizes and a few fewer in smaller ones", "The lower half is plain polished gold", "all stones are included",
  `About ${L.gram.publicGrams} grams in US 8.5`]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
const all = L.title + "\n" + L.description + "\n" + L.tags.join(" ");
assert(!/\b(baguette|groove|bevel(ed)?|brushed|hammer(ed)?|star set|eight-point|flush set|gypsy|single stone|double shared)\b/i.test(all),
  "kardeş listing'in (DSP/VB6/FR6/HS5) metni sızmış");
assert(!/\bby hand\b|\bhand[- ]?(set|made|crafted)\b|\bhandmade\b|no two (rings|bands)/i.test(all), "el işi iddiası üretici teyidi olmadan yazılmaz");
assert(!/\bbirthstone\b/i.test(all), "20 seçenek her ayın taşını kapsamıyor (garnet, peridot, citrine yok)");

// ---- kişiselleştirme: Etsy sözleşmesi + taş listesiyle birebir
const C = L.stoneChoices;
assert.equal(C.length, 20, "sahibin tablosu 20 taş");
assert.equal(L.personalizationQuestions.length, 1);
const Q = L.personalizationQuestions[0];
assert.equal(Q.question_type, "dropdown");
assert(Q.question_text.length >= 1 && Q.question_text.length <= 45);
assert.equal(Q.required, true, "taş seçimi zorunlu, yoksa sipariş taşsız gelir");
assert(!("instructions" in Q), "dropdown'da instructions yasak (Etsy 400)");
assert(Q.options.length >= 1 && Q.options.length <= 30);
assert.deepEqual(Q.options.map((o) => o.label), C.map((c) => c.label), "dropdown = taş listesi, aynı sıra");
assert.equal(new Set(C.map((c) => c.label.toLowerCase())).size, 20, "etiket tekil değil");
assert.equal(new Set(C.map((c) => c.chartName.toLowerCase())).size, 20, "tablodaki her taş bir kez");
assert.equal(C[0].label, "Lab Grown Diamond", "varsayılan ve fotoğraftaki taş ilk sırada");
const lower = L.description.toLowerCase();
for (const c of C) {
  assert(c.label.length <= 20 && /^[A-Za-z ]+$/.test(c.label), `etiket biçimi: ${c.label}`);
  assert(["lab", "natural", "cultured"].includes(c.origin), c.label);
  if (c.origin === "lab") {
    assert(/^(Lab Grown|Lab Created|Created) /.test(c.label) || c.label === "Moissanite", `lab taş niteleyicisiz: ${c.label}`);
  } else {
    assert(!/^(Lab|Created)\b/.test(c.label), `doğal/kültür taş lab gibi adlanmış: ${c.label}`);
  }
  if (c.origin === "cultured") assert(c.label.startsWith("Cultured "), c.label);
  if (/Diamond/.test(c.label)) assert(c.label === "Lab Grown Diamond" || c.origin === "natural", `pırlanta etiketi: ${c.label}`);
  assert(Number.isInteger(c.centsEach) && c.centsEach > 0 && c.centsEach <= L.stone.capStoneCentsEach,
    `${c.label} tavanı aşıyor: fiyat en pahalı taşı karşılamaz`);
  // her seçenek açıklamada adıyla (doğal pırlantalar "natural ..." başlığıyla)
  const named = { "Salt Pepper Diamond": "natural salt and pepper diamonds", "Black Diamond": "natural black diamonds" }[c.label]
    ?? c.label.toLowerCase();
  assert(lower.includes(named), `açıklamada seçenek yok: ${c.label}`);
}
for (const w of ["laboratory-grown diamonds", "laboratory-created gem of silicon carbide", "laboratory-created gems",
  "the color treatment is permanent", "routinely heated", "blue topaz is irradiated", "natural turquoise, stabilized",
  "dyed black (permanent)", "cultured freshwater seed pearls", "softer than the other choices"]) {
  assert(lower.includes(w), `köken/işlem beyanı yok: ${w}`);
}
for (const c of C.filter((x) => x.treatment)) {
  const k = c.treatment.split(/[ ,]/)[0].replace("color-treated", "color treatment");
  assert(lower.includes(k.replace("-", " ")) || lower.includes(k), `işlem açıklamada yok: ${c.label} (${c.treatment})`);
}
for (const c of C.filter((x) => x.soft)) assert(lower.includes(c.label.toLowerCase().replace("cultured ", "")), c.label);

// ---- gram, taş sayısı, maliyet (price_model.py hep ile aynı)
const W = L.band.widthMm;
const T = L.band.thicknessMm;
assert.equal(W, 1.5);
assert.equal(T, 1.5);
const gramAt = (us) => W * (0.836 + 0.0515 * us) * T / 1.5;
const stonesAt = (us) => Math.round((Math.PI * (11.63 + 0.8128 * us + 2 * T)) / 2 / 1.45);
const S = L.stone;
const perStoneDefault = S.defaultStoneCentsEach + S.settingPerStoneCents;
const cells = bandCells(L, gramAt, (us) => ({
  stoneCarat: stonesAt(us) * S.caratEach,
  stoneCostCents: stonesAt(us) * perStoneDefault,
}));
assert.equal(cells.length, 25);
const anchor = cells.find((c) => c.size === L.gram.anchorUs);
assert.equal(anchor.grams, L.gram.anchorGrams);
assert.equal(stonesAt(L.gram.anchorUs), S.count, "products.stone_count = US 8½ taş sayısı");
assert.equal(anchor.stoneCarat, S.totalCarat);
assert.equal(anchor.stoneCostCents, S.stoneCostCentsEstimate);
assert.equal(S.settingFeeCents, 0, "takma varyant taş maliyetinde; ürün düzeyinde ikinci kez sayılmaz");
assert.deepEqual([4, 6, 8.5, 12, 16].map(stonesAt), [19, 21, 23, 26, 30], "countBySize metniyle aynı");
assert(cells[0].grams > 1.4 && cells[24].grams < 2.6, "gram aralığı makul değil");

const landed = (us, centsEach) =>
  gramAt(us) * 100 + stonesAt(us) * (centsEach + S.settingPerStoneCents) / 100 + L.pricing.packagingUsd + L.pricing.shippingUsd;
const profit = (buyer, us, centsEach) => 0.905 * buyer - Math.min(0.15 * buyer, 100) - 0.45 - landed(us, centsEach);
const buyer = L.pricing.listUsd * (1 - L.pricing.storePromotionRate);
assert.equal(L.priceCents, L.pricing.listUsd * 100);
assert.equal(L.pricing.buyerUsd, Math.round(buyer));
assert.equal(Math.round(landed(8.5, S.defaultStoneCentsEach) * 100) / 100, L.pricing.landedUsdAtAnchor);
const tiers = { labGrownDiamond: S.defaultStoneCentsEach, costliestStone: S.capStoneCentsEach };
for (const [tier, cents] of Object.entries(tiers)) {
  for (const [k, v] of Object.entries(L.pricing.worstOffsiteProfitBySizeUsd[tier])) {
    assert.equal(Math.round(profit(buyer, Number(k.slice(2)), cents)), v, `kâr tablosu bayat: ${tier} ${k}`);
  }
}
const minBy = (cents) => Math.min(...cells.map((c) => profit(buyer, c.size, cents)));
const minLab = minBy(S.defaultStoneCentsEach);
const minCap = minBy(S.capStoneCentsEach);
assert(minCap >= 0, `tek fiyat en pahalı taşla bir bedende zarar ediyor (min ${minCap.toFixed(0)})`);
assert(minLab >= 50, `lab-grown pırlantayla bir bedende kâr $50'nin altında (min ${minLab.toFixed(0)})`);

// ---- varyant satırları + mühür
const { rows, seal } = bandRows(L, cells);
assert.equal(rows.length, 75);

console.log(`EON-HEP: 75 variants, list ${L.pricing.listUsd} buyer ${buyer.toFixed(2)}; worst-Offsite profit min lab ${minLab.toFixed(0)} / costliest stone ${minCap.toFixed(0)} (US ${cells[24].label})`);
console.log(`stones US4 ${stonesAt(4)} / US8.5 ${stonesAt(8.5)} / US16 ${stonesAt(16)}; dropdown ${C.length} options; variantSeal ${seal}`);

if (!L.approval?.authority) {
  console.log(`DRY RUN: approval.authority boş, ${fileName} yazılmadı (sahip kartı bekleniyor)`);
  process.exit(0);
}
assert.equal(L.approval.panelDraftAuthorized, true);

const usd = (n) => `$${n.toLocaleString("de-DE")}`;
const sql = bandMigrationSql({
  fileName,
  header: [
    "EON lab-grown 05 (EON-HEP): 14K, 1,5 × 1,5 mm bant, üst yarıda tek sıra ~1,3 mm round taş, paylaşımlı mikro tırnak",
    "(US 4 19 → US 8½ 23 → US 16 30 taş). Taş seçimi Etsy kişiselleştirme açılır listesi: 20 taş (sahibin tablosu),",
    "varsayılan Lab Grown Diamond; listing_metadata.personalizationQuestions. Metal Color × Ring Size US 4-16 yarım",
    `bedenler (75 varyant), ring_band. Tek fiyat ${usd(L.pricing.listUsd)} (alıcı %25 vitrinle $${buyer.toLocaleString("de-DE", { minimumFractionDigits: 2 })}), her beden ve her taş.`,
    `Maliyet US 8½ $341 (1,91 g × $100 + 23 × (lab $2,52 + takma $4)); en kötü Offsite kârı en düşük US 16: lab +$${Math.round(minLab)},`,
    `en pahalı taş ($5/taş) +$${Math.round(minCap)}. Takma beden başına varyant taş maliyetinde, products.setting_fee_cents 0.`,
    "Kanıt: docs/eon/lab-grown/2026-11-11-half-eternity-pave-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_hep_migration.mjs",
  cells,
  seal,
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}`);
