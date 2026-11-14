#!/usr/bin/env node
/**
 * EON lab-grown 08 Double Pear Toi et Moi (EON-PEAR2) → panel taslağı: supabase/migrations/0193_eon_lab_grown_pear2.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/08-double-pear/listing.json. Referans: sahibin linki Etsy 1522527544 "1.55 TC Double
 * Pear Cut Two Stone Ring" (moissanite 8×6 + 5×3,5 mm armut, bant altta 1,8 mm, 14K satış $537). Tasarım: ince düz
 * bant, üstte yan yana iki armut taş, uçları zıt yönde, her biri üç tırnaklı alçak sepette. Bizde lab-grown elmas.
 *
 * Üretici teklifi YOK: bant gramı üreticinin 14K bant listesinden (maker_cost.list_g14, 1,8 × 1,6 mm tam dikdörtgen
 * kesit) + iki sepet 1,0 g (`weight_source = 'estimated'`); maliyet gram × $100 + taşlar (1 ct $200 üreticinin tek taş
 * ölçeği, 0,22 ct $280/ct) + iki tırnak takma (price_model.py dp). Satırlar, mühür ve SQL gövdesi ortak modülden
 * (scripts/eon/lab_grown_band.mjs).
 *
 * Kapılar: ortak metin kapıları (lab_grown_gates.mjs) + yapı-metin bağı (beden aralığı, tek fiyat, ölçüler, iki armut
 * taşın tarifi, karat yok, moissanite yok, konfor kesim ve el işi iddiası yok, kardeş listing metni yok) + listing.json
 * kâr tablosunun bu hesapla aynı olması + seçilen tek fiyatın %25 vitrinde ve en kötü Offsite ücretinde HER bedende
 * ≥ $50 kalması. Sahip onayı (approval.authority) yazılmadan migration dosyası yazılmaz: kuru koşu yalnız özeti ve
 * mührü basar.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_pear_migration.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bandCells, bandMigrationSql, bandRows, fmtSize } from "./lab_grown_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/08-double-pear";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const fileName = "0193_eon_lab_grown_pear2.sql";
const outFile = path.join(repoRoot, "supabase/migrations", fileName);

// ---- metin kapıları
checkListingText(L);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size"), "tek fiyat açıklamada");
assert(!/\bcarats?\b|\bct\b|\bctw\b|\bt\.?w\b|\bTC\b|1\.55|1\.25|0\.30|0\.22|1\.22/i.test(L.title + "\n" + L.description),
  "karat üretici teyidi olmadan yazılmaz");
assert(/\bToi et Moi Ring\b/.test(L.title) && /\bTwo Pear Cut Stones\b/.test(L.title), "başlık toi et moi ve iki armut taşı söylemeli");
for (const w of ["two pear cut lab grown diamonds", "about 8 x 6 mm", "about 5 x 3.5 mm", "points facing opposite ways",
  "about 1.8 mm wide and 1.6 mm thick", "three claw prongs", "one guarding its point and two at its rounded end",
  "both lab grown diamonds are included", "plain gold at the back, away from the stones", "About 3.5 grams in US 8.5"]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
const all = L.title + "\n" + L.description + "\n" + L.tags.join(" ") + "\n" + L.materials.join(" ");
assert(!/moissanite|simulant(?!s;)|cubic zirconia|\bcz\b/i.test(all.replace("they are not simulants", "")),
  "referansın taşı moissanite; bizim listing lab-grown elmas, başka taş adı yazılmaz");
assert(!/\b(half eternity|eternity|micro pave|pav[eé]|star|hammer(ed)?|baguette|flush|channel|princess|milgrain|two[- ]tone|nine|groove|brushed|bevel(ed)?|halo)\b/i.test(all),
  "kardeş listing'in (DSP/VB6/FR6/HS5/HEP/PC9/TMC9) metni sızmış");
assert(!/personali[sz]|choose your stone|stone choice|engrav/i.test(all), "bu modelde taş seçimi ya da gravür yok");
assert(!/comfort[- ]fit/i.test(all), "konfor kesim üretici teyidi olmadan yazılmaz");
assert(!/\bby hand\b|\bhand[- ]?(set|made|finished)\b|no two (rings|bands)/i.test(all), "el işi iddiası üretici teyidi olmadan yazılmaz");
assert(!/anniversary|wedding/i.test(L.title + L.tags.join(" ")), "vesile sözcüğü başlıkta/tag'de yok (03-seo 2026-11-02)");
assert.equal(L.personalizationQuestions, undefined);
assert.equal(L.band.widthMm, 1.8);
assert.equal(L.band.thicknessMm, 1.6);
assert.equal(L.stone.shape, "pear");
assert.equal(L.stone.count, 2);
assert.equal(L.stone.totalCarat, 1.22);
assert.equal(L.stone.stoneCostCentsEstimate, 20000 + Math.round(0.22 * 280 * 100), "1 ct $200 + 0,22 ct × $280");
assert.equal(L.stone.settingFeeCents, 2000, "tırnak takma taş başı $20");
assert.equal(L.listingProtocol, "sculptural_ring");
assert.equal(L.priceCents, L.pricing.listUsd * 100);
assert.equal(L.pricing.buyerUsd, Math.round(L.pricing.listUsd * (1 - L.pricing.storePromotionRate)));

// ---- gram: üreticinin 14K bant listesi, tam kesit + iki sepet 1,0 g
const HEADS_G = 1.0;
const gramAt = (us) => L.band.widthMm * (0.836 + 0.0515 * us) * L.band.thicknessMm / 1.5 + HEADS_G;
const cells = bandCells(L, gramAt);
assert.equal(cells.length, 25);
assert.equal(cells.find((c) => c.size === L.gram.anchorUs).grams, L.gram.anchorGrams);
assert(cells[0].grams > 2.5 && cells[24].grams < 5, "gram aralığı makul değil");

// ---- kâr: %25 vitrin, en kötü Offsite (%15, tavan $100), sabit $0,45; listing.json tablosu bu hesapla aynı
const s = L.stone;
const extrasUsd = (s.stoneCostCentsEstimate + s.count * s.settingFeeCents) / 100;
assert.equal(extrasUsd, 301.6, "ekler price_model.py dp ile aynı olmalı ($261,60 taş + $40 tırnak takma)");
const landed = (g) => g * 100 + extrasUsd + L.pricing.packagingUsd + L.pricing.shippingUsd;
const profitAt = (list, g) => {
  const b = list * (1 - L.pricing.storePromotionRate);
  return 0.905 * b - Math.min(0.15 * b, 100) - 0.45 - landed(g);
};
const profit = (g) => profitAt(L.pricing.listUsd, g);
for (const [k, v] of Object.entries(L.pricing.worstOffsiteProfitBySizeUsd)) {
  const us = Number(k.slice(2));
  assert.equal(Math.round(profit(gramAt(us))), v, `kâr tablosu bayat: ${k}`);
}
const minProfit = Math.min(...cells.map((c) => profit(gramAt(c.size))));
assert(minProfit >= 50, `tek fiyat bir bedende en kötü Offsite'ta $50'ın altında (min ${minProfit.toFixed(0)})`);
assert.equal(Math.round(landed(gramAt(L.gram.anchorUs)) * 100) / 100, L.pricing.landedUsdAtAnchor);
// motor (lib/pricing-engine/eon-cost.ts): engine = round(landed × 1,55), liste = ceil(engine / vitrin, 5)
const engine = Math.round(landed(gramAt(L.gram.anchorUs)) * L.pricing.multiplier);
assert.equal(engine, L.pricing.engineUsd);
assert.equal(Math.ceil(engine / (1 - L.pricing.storePromotionRate) / 5 - 1e-12) * 5, L.pricing.engineListUsdAtAnchor);
let floor = 5;
while (Math.min(...cells.map((c) => profitAt(floor, gramAt(c.size)))) < 50) floor += 5;
assert.equal(floor, L.pricing.everySizeFloorListUsd, "her beden ≥ $50 taban listesi bayat");
assert(L.pricing.listUsd >= floor);

// ---- varyant satırları + mühür
const { rows, seal } = bandRows(L, cells);
assert.equal(rows.length, 75);

console.log(`EON-PEAR2: 75 variants, list ${L.pricing.listUsd} buyer ${L.pricing.buyerUsd}; worst-Offsite profit min ${minProfit.toFixed(0)} (US ${cells[24].label}); every-size floor ${floor}`);
console.log(`grams US${cells[0].label} ${cells[0].grams} / US8.5 ${L.gram.anchorGrams} / US${cells[24].label} ${cells[24].grams}; extras $${extrasUsd}; variantSeal ${seal}`);

if (!L.approval?.authority) {
  console.log(`DRY RUN: approval.authority boş, ${fileName} yazılmadı (sahip kartı bekleniyor)`);
  process.exit(0);
}
assert.equal(L.approval.panelDraftAuthorized, true);

const usd = (n) => `$${n.toLocaleString("de-DE")}`;
const sql = bandMigrationSql({
  fileName,
  header: [
    "EON lab-grown 08 (EON-PEAR2): 14K toi et moi, 1,8 × 1,6 mm ince bant, üstte yan yana iki armut lab-grown taş (8 × 6 mm",
    "ve 5 × 3,5 mm), uçları zıt yönde, her biri üç tırnaklı alçak sepette. Metal Color × Ring Size US 4-16 yarım bedenler",
    `(75 varyant), sculptural_ring (Jewelry > Rings). Tek fiyat ${usd(L.pricing.listUsd)} (alıcı %25 vitrinle ${usd(L.pricing.buyerUsd)}), her beden.`,
    `Maliyet US 8½ $646,16 (3,45 g × $100 + taşlar $261,60 + iki tırnak takma $40); en kötü Offsite kârı en düşük US 16 +$${Math.round(minProfit)}.`,
    "Referans Etsy 1522527544 (moissanite, 14K satış $537). Kanıt: docs/eon/lab-grown/2026-11-14-double-pear-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_pear_migration.mjs",
  cells,
  seal,
});
// 0193 canlıya uygulandı (2026-11-14, 20261114175218; mühür, başlık/açıklama/tag/malzeme/onay md5'leri, 75 varyant ve
// 76 audit satırı doğrulandı): gövde donuk. Paket değişirse düzeltme yeni bir koşullu UPDATE migration'ıdır.
const APPLIED_0193_MD5 = "85007f779a846cc3375d068af4c74929";
assert.equal(createHash("md5").update(sql).digest("hex"), APPLIED_0193_MD5,
  "0193 canlıya uygulandı; gövdesi değişmez, düzeltme yeni migration'dır");
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)} (byte-identical to the applied body)`);
