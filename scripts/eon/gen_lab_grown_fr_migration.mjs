#!/usr/bin/env node
/**
 * EON lab-grown 03 Flush Round (EON-FR6) → panel taslağı:
 * supabase/migrations/0179_eon_lab_grown_fr6.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/03-flush-round/listing.json. Fiyat ve sahip onayı orada; onay
 * (`approval`) boşsa migration üretilmez. Referans: sahibin Etsy linki 4512052520 (AarsanJewels,
 * moissanite): 6 × 1,5 mm fırçalanmış bant, iki cilalı faset kenar, merkez dışı tek cilalı kanal,
 * kanalın üstüne flush oturan tek round taş (fotoğrafta ~2 mm).
 *
 * Üretici teklifi YOK: gram üreticinin 14K bant listesinden (maker_cost.list_g14, tam dikdörtgen kesit,
 * `weight_source = 'estimated'`), maliyet gram × $100 + taş + takma (price_model.py fr). Satırlar, mühür ve
 * SQL gövdesi ortak modülden (scripts/eon/lab_grown_band.mjs); üç renk aynı fiyat ve gramı taşır.
 *
 * Kapılar: ortak metin kapıları (lab_grown_gates.mjs) + yapı-metin bağı (beden aralığı, tek fiyat, ölçüler,
 * flush/kanal/faset tarifi, karat yok) + listing.json'daki kâr tablosunun bu hesapla aynı olması + seçilen
 * tek fiyatın %25 vitrinde ve en kötü Offsite ücretinde HER bedende zarar etmemesi.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_fr_migration.mjs
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bandCells, bandMigrationSql, bandRows, fmtSize } from "./lab_grown_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/03-flush-round";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0179_eon_lab_grown_fr6.sql");

assert(L.approval && L.approval.authority, "sahip onayı listing.json'a yazılmadan panel taslağı üretilmez");

// ---- metin kapıları
checkListingText(L);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size"), "tek fiyat açıklamada");
assert(!/\bcarats?\b|\bct\b|0\.0[0-9]|0\.10/i.test(L.description), "karat üretici teyidi olmadan yazılmaz");
assert(/\b6mm\b/.test(L.title) && L.description.includes("6 mm wide") && L.description.includes("1.5 mm thick"));
for (const w of ["set flush", "groove", "bevel", "about 2 mm", "round brilliant lab grown diamond"]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
assert(!/\bbaguette\b/i.test(L.title + L.description + L.tags.join(" ")), "kardeş listing'in (VB6) metni sızmış");
assert.equal(L.band.widthMm, 6);
assert.equal(L.band.thicknessMm, 1.5);
assert.equal(L.listingProtocol, "ring_band");
assert.equal(L.priceCents, L.pricing.listUsd * 100);
assert.equal(L.pricing.buyerUsd, Math.round(L.pricing.listUsd * (1 - L.pricing.storePromotionRate)));

// ---- gram: üreticinin 14K bant listesi, tam kesit
const gramAt = (us) => L.band.widthMm * (0.836 + 0.0515 * us) * L.band.thicknessMm / 1.5;
const cells = bandCells(L, gramAt);
assert.equal(cells.length, 25);
assert.equal(cells.find((c) => c.size === L.gram.anchorUs).grams, L.gram.anchorGrams);
assert(cells[0].grams > 6 && cells[24].grams < 10.5, "gram aralığı makul değil");

// ---- kâr: %25 vitrin, en kötü Offsite (%15, tavan $100), sabit $0,45; listing.json tablosu bu hesapla aynı
const extrasUsd = (L.stone.stoneCostCentsEstimate + L.stone.settingFeeCents) / 100;
const landed = (g) => g * 100 + extrasUsd + L.pricing.packagingUsd + L.pricing.shippingUsd;
const buyer = L.pricing.listUsd * (1 - L.pricing.storePromotionRate);
const profit = (g) => 0.905 * buyer - Math.min(0.15 * buyer, 100) - 0.45 - landed(g);
const exactGram = (us) => gramAt(us);   // tablo yuvarlanmamış gramla (price_model.py ile aynı)
for (const [k, v] of Object.entries(L.pricing.worstOffsiteProfitBySizeUsd)) {
  const us = Number(k.slice(2));
  assert.equal(Math.round(profit(exactGram(us))), v, `kâr tablosu bayat: ${k}`);
}
const minProfit = Math.min(...cells.map((c) => profit(exactGram(c.size))));
assert(minProfit >= 0, `tek fiyat bir bedende zarar ediyor (min ${minProfit.toFixed(0)})`);
assert.equal(Math.round(landed(exactGram(L.gram.anchorUs)) * 100) / 100, L.pricing.landedUsdAtAnchor);

// ---- varyant satırları + mühür
const { rows, seal } = bandRows(L, cells);
assert.equal(rows.length, 75);

const usd = (n) => `$${n.toLocaleString("de-DE")}`;
const sql = bandMigrationSql({
  fileName: "0179_eon_lab_grown_fr6.sql",
  header: [
    "EON lab-grown 03: 14K Flush Round band, 6 mm × 1,5 mm, fırçalanmış yüz, iki cilalı faset kenar, tek cilalı",
    "kanal (merkez dışı, ~3:2) ve kanalın üstüne flush (gypsy) oturan ~2,0 mm round lab-grown taş.",
    `Metal Color (3) × Ring Size (US 4-16, yarım bedenler, 25) = 75 varyant, her beden tek fiyat ${usd(L.pricing.listUsd)}`,
    `(sahip kararı 2026-11-08; alıcı %25 vitrinle ${usd(L.pricing.buyerUsd)}). Üretici teklifi YOK: liste gramı 6 × 1,5 mm`,
    "(US 8½ 7,64 g) × $100 + taş $20 + takma $10 = $794; kanıt: docs/eon/lab-grown/2026-11-08-flush-round-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_fr_migration.mjs",
  cells,
  seal,
});

await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 1 product, ${rows.length} variants, grams US${cells[0].label} ${cells[0].grams} → US${cells[24].label} ${cells[24].grams}`);
console.log(`list ${L.pricing.listUsd} buyer ${L.pricing.buyerUsd}; worst-Offsite profit min ${minProfit.toFixed(0)} (US ${cells[24].label})`);
console.log(`variantSeal ${seal}`);
