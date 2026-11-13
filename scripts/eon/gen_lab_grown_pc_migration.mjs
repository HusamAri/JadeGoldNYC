#!/usr/bin/env node
/**
 * EON lab-grown 06 Princess Channel (EON-PC9) → panel taslağı: supabase/migrations/0189_eon_lab_grown_pc9.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/06-princess-channel/listing.json. Referans: sahibin linki 25karats.com WB9262
 * "Classic 9 Stone Princes Cut Diamond Anniversary Band (1/2 ct.t.w.)": 14K, 9 × 2 mm prenses (0,05 ct), kanal yuva,
 * ~2,9 g, doğal GH/VS $1.669. Tasarım 3,0 × 1,8 mm, sıra yalnız ön üstte (~18 mm), iki ucu düz duvar, 9 taş her bedende.
 *
 * Üretici teklifi YOK: gram üreticinin 14K bant listesinden (maker_cost.list_g14, tam dikdörtgen kesit; kanal boşluğu
 * ~0,68 g tampon, `weight_source = 'estimated'`), maliyet gram × $100 + dokuz taş + dokuz kanal takma
 * (price_model.py pc). Satırlar, mühür ve SQL gövdesi ortak modülden (scripts/eon/lab_grown_band.mjs).
 *
 * Kapılar: ortak metin kapıları (lab_grown_gates.mjs) + yapı-metin bağı (beden aralığı, tek fiyat, ölçüler, kanal ve
 * dokuz prenses taş tarifi, karat yok, konfor kesim iddiası yok, kardeş listing metni yok) + listing.json'daki kâr
 * tablosunun bu hesapla aynı olması + seçilen tek fiyatın %25 vitrinde ve en kötü Offsite ücretinde HER bedende
 * ≥ $50 kalması. Sahip onayı (approval.authority) yazılmadan migration dosyası yazılmaz: kuru koşu yalnız özeti ve
 * mührü basar.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_pc_migration.mjs
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
const pkgRel = "docs/eon/lab-grown/06-princess-channel";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const fileName = "0189_eon_lab_grown_pc9.sql";
const outFile = path.join(repoRoot, "supabase/migrations", fileName);

// ---- metin kapıları
checkListingText(L);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size"), "tek fiyat açıklamada");
assert(!/\bcarats?\b|\bct\b|\bctw\b|\bt\.?w\b|0\.0[0-9]|0\.45/i.test(L.description), "karat üretici teyidi olmadan yazılmaz");
assert(/\b3mm\b/.test(L.title) && L.description.includes("3 mm wide") && L.description.includes("1.8 mm thick"));
assert(/\bNine Princess Cut Stones\b/.test(L.title) && /\bChannel Set\b/.test(L.title), "başlık dokuz prenses taşı ve kanalı söylemeli");
for (const w of ["Nine princess cut lab grown diamonds", "about 2 mm square each", "channel set", "edge to edge",
  "between two slim polished rails", "about 18 mm long", "flat polished wall", "all nine lab grown diamonds are included",
  "There are no prongs", "plain gold at the back, away from the stones"]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
const all = L.title + "\n" + L.description + "\n" + L.tags.join(" ");
assert(!/\b(half eternity|micro pave|pav[eé]|star|hammer(ed)?|baguette|flush|gypsy|shared prong|groove|brushed|bevel(ed)?)\b/i.test(all),
  "kardeş listing'in (DSP/VB6/FR6/HS5/HEP) metni sızmış");
assert(!/personali[sz]|choose your stone|stone choice/i.test(all), "bu modelde taş seçimi yok (HEP metni sızmış)");
assert(!/comfort[- ]fit/i.test(all), "konfor kesim üretici teyidi olmadan yazılmaz");
assert(!/\bby hand\b|\bhand[- ]?(set|made|finished)\b|no two (rings|bands)/i.test(all), "el işi iddiası üretici teyidi olmadan yazılmaz");
assert(!/anniversary/i.test(L.title + L.tags.join(" ")), "vesile sözcüğü başlıkta/tag'de yok (03-seo 2026-11-02)");
assert.equal(L.personalizationQuestions, undefined);
assert.equal(L.band.widthMm, 3);
assert.equal(L.band.thicknessMm, 1.8);
assert.equal(L.stone.shape, "princess");
assert.equal(L.stone.count, 9);
assert.equal(L.stone.totalCarat, 0.45);
assert.equal(L.stone.stoneCostCentsEstimate, L.stone.count * 1400, "taş başı $14 ($280/ct × 0,05 ct)");
assert.equal(L.stone.settingFeeCents, 1000, "kanal takma taş başı $10");
assert.equal(L.listingProtocol, "ring_band");
assert.equal(L.priceCents, L.pricing.listUsd * 100);
assert.equal(L.pricing.buyerUsd, Math.round(L.pricing.listUsd * (1 - L.pricing.storePromotionRate)));

// ---- gram: üreticinin 14K bant listesi, tam kesit (kanal boşluğu tampon)
const gramAt = (us) => L.band.widthMm * (0.836 + 0.0515 * us) * L.band.thicknessMm / 1.5;
const cells = bandCells(L, gramAt);
assert.equal(cells.length, 25);
assert.equal(cells.find((c) => c.size === L.gram.anchorUs).grams, L.gram.anchorGrams);
assert(cells[0].grams > 3.5 && cells[24].grams < 6.5, "gram aralığı makul değil");

// ---- kâr: %25 vitrin, en kötü Offsite (%15, tavan $100), sabit $0,45; listing.json tablosu bu hesapla aynı
const s = L.stone;
const extrasUsd = (s.stoneCostCentsEstimate + s.count * s.settingFeeCents) / 100;
assert.equal(extrasUsd, 216, "ekler price_model.py pc ile aynı olmalı ($126 taş + $90 kanal takma)");
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

console.log(`EON-PC9: 75 variants, list ${L.pricing.listUsd} buyer ${L.pricing.buyerUsd}; worst-Offsite profit min ${minProfit.toFixed(0)} (US ${cells[24].label}); every-size floor ${floor}`);
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
    "EON lab-grown 06 (EON-PC9): 14K, 3,0 × 1,8 mm bant, üstte iki ince cilalı ray arasında tek kanal, içinde dokuz 2 mm",
    "prenses lab-grown taş kenar kenara (~18 mm sıra, iki ucu düz duvar, her bedende 9 taş). Metal Color × Ring Size US 4-16",
    `yarım bedenler (75 varyant), ring_band. Tek fiyat ${usd(L.pricing.listUsd)} (alıcı %25 vitrinle ${usd(L.pricing.buyerUsd)}), her beden.`,
    `Maliyet US 8½ $674,55 (4,59 g × $100 + taş $126 + kanal takma $90); en kötü Offsite kârı en düşük US 16 +$${Math.round(minProfit)}.`,
    "Referans 25karats.com WB9262 (doğal GH/VS, 0,45 ct, ~2,9 g, $1.669). Kanıt: docs/eon/lab-grown/2026-11-13-princess-channel-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_pc_migration.mjs",
  cells,
  seal,
});
// 0189 canlıya uygulandı (2026-11-13, 20261113171517, mühür ve metin md5'leri doğrulandı): gövde donuk. Paket değişirse
// düzeltme yeni bir koşullu UPDATE migration'ıdır (HS5 0182 → 0183 deseni, lab_grown_band.mjs bandUpdateSql).
const APPLIED_0189_MD5 = "701a7b1e0515400087b3c17ae7734df6";
assert.equal(createHash("md5").update(sql).digest("hex"), APPLIED_0189_MD5,
  "0189 canlıya uygulandı; gövdesi değişmez, düzeltme yeni migration'dır");
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)} (byte-identical to the applied body)`);
