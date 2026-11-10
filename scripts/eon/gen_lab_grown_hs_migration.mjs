#!/usr/bin/env node
/**
 * EON lab-grown 04 Hammered Star (EON-HS5) → panel taslağı:
 * supabase/migrations/0182_eon_lab_grown_hs5.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/04-hammered-star/listing.json. Fiyat ve sahip onayı orada; onay
 * (`approval`) boşsa migration üretilmez. Referans: sahibin Etsy linki 4581494716 (BRIARLORE, 925 gümüş +
 * moissanite): 5 mm dövme bant, önde ~79° arayla iki yıldız yuvalı round taş (fotoğrafta ~1,5 mm).
 *
 * Üretici teklifi YOK: gram üreticinin 14K bant listesinden (maker_cost.list_g14, tam dikdörtgen kesit,
 * `weight_source = 'estimated'`), maliyet gram × $100 + iki taş + iki yıldız takma (flush ücreti + ışın)
 * + dövme (price_model.py hs). Satırlar, mühür ve SQL gövdesi ortak modülden (scripts/eon/lab_grown_band.mjs);
 * üç renk aynı fiyat ve gramı taşır.
 *
 * Kapılar: ortak metin kapıları (lab_grown_gates.mjs) + yapı-metin bağı (beden aralığı, tek fiyat, ölçüler,
 * dövme/yıldız/iki taş tarifi, karat yok, kardeş listing metni yok) + listing.json'daki kâr tablosunun bu
 * hesapla aynı olması + seçilen tek fiyatın %25 vitrinde ve en kötü Offsite ücretinde HER bedende zarar
 * etmemesi.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_hs_migration.mjs
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bandCells, bandMigrationSql, bandRows, fmtSize } from "./lab_grown_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/04-hammered-star";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0182_eon_lab_grown_hs5.sql");

assert(L.approval && L.approval.authority, "sahip onayı listing.json'a yazılmadan panel taslağı üretilmez");

// ---- metin kapıları
checkListingText(L);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size"), "tek fiyat açıklamada");
assert(!/\bcarats?\b|\bct\b|\bctw\b|0\.0[0-9]|2\.3 mm/i.test(L.description), "karat / referansın 2,3 mm'si üretici teyidi olmadan yazılmaz");
assert(/\b5mm\b/.test(L.title) && L.description.includes("5 mm wide") && L.description.includes("1.5 mm thick"));
for (const w of ["star set", "eight-point star", "four long rays and four short ones", "hammer marks", "about 1.5 mm each",
  "Two round brilliant lab grown diamonds", "both lab grown diamonds are included"]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
const all = L.title + "\n" + L.description + "\n" + L.tags.join(" ");
assert(!/\b(baguette|groove|bevel(ed)?|brushed|flush set round|gypsy|single stone)\b/i.test(all), "kardeş listing'in (VB6/FR6) metni sızmış");
assert(!/\bby hand\b|\bhand[- ]?(hammered|engraved|made)\b|no two (rings|bands)/i.test(all), "el işi iddiası üretici teyidi olmadan yazılmaz");
assert.equal(L.band.widthMm, 5);
assert.equal(L.band.thicknessMm, 1.5);
assert.equal(L.stone.count, 2);
assert.equal(L.listingProtocol, "ring_band");
assert.equal(L.priceCents, L.pricing.listUsd * 100);
assert.equal(L.pricing.buyerUsd, Math.round(L.pricing.listUsd * (1 - L.pricing.storePromotionRate)));

// ---- gram: üreticinin 14K bant listesi, tam kesit
const gramAt = (us) => L.band.widthMm * (0.836 + 0.0515 * us) * L.band.thicknessMm / 1.5;
const cells = bandCells(L, gramAt);
assert.equal(cells.length, 25);
assert.equal(cells.find((c) => c.size === L.gram.anchorUs).grams, L.gram.anchorGrams);
assert(cells[0].grams > 5 && cells[24].grams < 9, "gram aralığı makul değil");

// ---- kâr: %25 vitrin, en kötü Offsite (%15, tavan $100), sabit $0,45; listing.json tablosu bu hesapla aynı
const s = L.stone;
const extrasUsd = (s.stoneCostCentsEstimate + s.count * (s.settingFeeCents + s.engravingFeeCentsEach) + s.textureFeeCents) / 100;
assert.equal(extrasUsd, 90, "ekler price_model.py hs ile aynı olmalı ($90)");
const landed = (g) => g * 100 + extrasUsd + L.pricing.packagingUsd + L.pricing.shippingUsd;
const buyer = L.pricing.listUsd * (1 - L.pricing.storePromotionRate);
const profit = (g) => 0.905 * buyer - Math.min(0.15 * buyer, 100) - 0.45 - landed(g);
for (const [k, v] of Object.entries(L.pricing.worstOffsiteProfitBySizeUsd)) {
  const us = Number(k.slice(2));
  assert.equal(Math.round(profit(gramAt(us))), v, `kâr tablosu bayat: ${k}`);
}
const minProfit = Math.min(...cells.map((c) => profit(gramAt(c.size))));
assert(minProfit >= 0, `tek fiyat bir bedende zarar ediyor (min ${minProfit.toFixed(0)})`);
assert.equal(Math.round(landed(gramAt(L.gram.anchorUs)) * 100) / 100, L.pricing.landedUsdAtAnchor);

// ---- varyant satırları + mühür
const { rows, seal } = bandRows(L, cells);
assert.equal(rows.length, 75);

const usd = (n) => `$${n.toLocaleString("de-DE")}`;
const sql = bandMigrationSql({
  fileName: "0182_eon_lab_grown_hs5.sql",
  header: [
    "EON lab-grown 04: 14K Hammered Star band, 5 mm × 1,5 mm, bütün dış yüz iç içe yuvarlak dövme izleri, iki kenarda",
    "dar cilalı kenar; önde ~79° arayla iki ~1,5 mm round lab-grown taş, her biri sekiz uçlu oyma yıldızın ortasında.",
    `Metal Color (3) × Ring Size (US 4-16, yarım bedenler, 25) = 75 varyant, her beden tek fiyat ${usd(L.pricing.listUsd)}`,
    `(sahip kararı ${L.approval.authority.match(/\d{4}-\d{2}-\d{2}/)[0]}; alıcı %25 vitrinle ${usd(L.pricing.buyerUsd)}). Üretici teklifi YOK: liste gramı`,
    "5 × 1,5 mm (US 8½ 6,37 g) × $100 + taş $20 + takma $20 + ışın $20 + dövme $30 = $727;",
    "kanıt: docs/eon/lab-grown/2026-11-10-hammered-star-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_hs_migration.mjs",
  cells,
  seal,
});

await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 1 product, ${rows.length} variants, grams US${cells[0].label} ${cells[0].grams} → US${cells[24].label} ${cells[24].grams}`);
console.log(`list ${L.pricing.listUsd} buyer ${L.pricing.buyerUsd}; worst-Offsite profit min ${minProfit.toFixed(0)} (US ${cells[24].label})`);
console.log(`variantSeal ${seal}`);
