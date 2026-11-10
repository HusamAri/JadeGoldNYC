#!/usr/bin/env node
/**
 * EON lab-grown 04 Hammered Star (EON-HS5) → panel taslağı düzeltmesi:
 * supabase/migrations/0183_eon_lab_grown_hs5_four_stones.sql
 *
 * Tarihçe: 0182 (2026-11-10 18:38 UTC) iki taşlı taslağı açtı ve canlıya uygulandı. Hero v1'den sonra sahip
 * tasarımı düzeltti: "taşlar 4 adet eşit aralıkta konumlanmış olmalı" → dört taş, bant çevresinde çeyrek tur
 * (90°) arayla. Uygulanmış 0182'nin gövdesi DONUK kalır (md5 aşağıda kapıyla); bu üretici artık 0183'ü yazar:
 * canlı taslağı listing.json'a getiren koşullu UPDATE (metin, taş sayısı, takma ücreti, meta veri, varyant taş
 * alanları). Fiyat ve gram değişmez (sahip ikinci kartta $1.800'ü korudu), varyant mührü aynı kalır.
 *
 * Girdi YALNIZ docs/eon/lab-grown/04-hammered-star/listing.json. Referans: sahibin Etsy linki 4581494716
 * (BRIARLORE, 925 gümüş + moissanite): 5 mm dövme bant, yıldız yuvalı round taş (fotoğrafta ~1,5 mm).
 *
 * Üretici teklifi YOK: gram üreticinin 14K bant listesinden (maker_cost.list_g14, tam dikdörtgen kesit,
 * `weight_source = 'estimated'`), maliyet gram × $100 + dört taş + dört yıldız takma (flush ücreti + ışın)
 * + dövme (price_model.py hs). Satırlar, mühür ve SQL gövdesi ortak modülden (scripts/eon/lab_grown_band.mjs).
 *
 * Kapılar: ortak metin kapıları (lab_grown_gates.mjs) + yapı-metin bağı (beden aralığı, tek fiyat, ölçüler,
 * dövme/yıldız/dört taş eşit aralıklı tarifi, iki taşlı eski dil yok, karat yok, kardeş listing metni yok) +
 * listing.json'daki kâr tablosunun bu hesapla aynı olması + seçilen tek fiyatın %25 vitrinde ve en kötü
 * Offsite ücretinde HER bedende zarar etmemesi + 0182'nin donuk olması.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_hs_migration.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bandCells, bandRows, bandUpdateSql, fmtSize } from "./lab_grown_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/04-hammered-star";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0183_eon_lab_grown_hs5_four_stones.sql");

// ---- 0182 uygulandığı gibi donuk (iki taşlı taslak, canlıda 20261110183836)
const applied0182 = await readFile(path.join(repoRoot, "supabase/migrations/0182_eon_lab_grown_hs5.sql"));
assert.equal(createHash("md5").update(applied0182).digest("hex"), "15cec2b3c44a9272e3f45b56ef32db9f",
  "0182 canlıya uygulandı; gövdesi değişmez, düzeltme yeni migration'dır");

assert(L.approval && L.approval.authority, "sahip onayı listing.json'a yazılmadan panel taslağı üretilmez");
assert(/four stones at equal intervals/.test(L.approval.authority), "dört taş düzeltmesinin sahip onayı kayıtta olmalı");

// ---- metin kapıları
checkListingText(L);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size"), "tek fiyat açıklamada");
assert(!/\bcarats?\b|\bct\b|\bctw\b|0\.0[0-9]|2\.3 mm/i.test(L.description), "karat / referansın 2,3 mm'si üretici teyidi olmadan yazılmaz");
assert(/\b5mm\b/.test(L.title) && L.description.includes("5 mm wide") && L.description.includes("1.5 mm thick"));
assert(/\bFour Star Set Stones\b/.test(L.title), "başlık dört taşı söylemeli");
for (const w of ["star set", "eight-point star", "four long rays and four short ones", "hammer marks", "about 1.5 mm each",
  "Four round brilliant lab grown diamonds", "all four lab grown diamonds are included", "at equal intervals around the band",
  "a quarter turn apart", "four stars unevenly spaced"]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
const all = L.title + "\n" + L.description + "\n" + L.tags.join(" ");
assert(!/(?<!between )\btwo (small |round |brilliant |lab grown )*(stones|stars|diamonds)\b|\bboth (stones|stars|lab grown diamonds)\b|\bboth (stones )?on the front\b/i.test(all),
  "iki taşlı eski dil kalmış");
assert(!/\b(baguette|groove|bevel(ed)?|brushed|flush set round|gypsy|single stone)\b/i.test(all), "kardeş listing'in (VB6/FR6) metni sızmış");
assert(!/\bby hand\b|\bhand[- ]?(hammered|engraved|made)\b|no two (rings|bands)/i.test(all), "el işi iddiası üretici teyidi olmadan yazılmaz");
assert.equal(L.band.widthMm, 5);
assert.equal(L.band.thicknessMm, 1.5);
assert.equal(L.stone.count, 4);
assert.equal(L.stone.totalCarat, 0.052);
assert.equal(L.stone.stoneCostCentsEstimate, L.stone.count * 1000);
assert.equal(L.listingProtocol, "ring_band");
assert.equal(L.priceCents, L.pricing.listUsd * 100);
assert.equal(L.pricing.listUsd, 1800, "sahip ikinci kartta $1.800'ü korudu");
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
assert.equal(extrasUsd, 150, "ekler price_model.py hs ile aynı olmalı ($150, dört taş)");
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

// ---- varyant satırları + mühür: fiyat ve gram 0182 ile aynı, mühür değişmez
const { rows, seal } = bandRows(L, cells);
assert.equal(rows.length, 75);
assert.equal(seal, "84001e3e3e8310a04d5a86f7249c6fd3", "fiyat/gram değişti: bu bir UPDATE düzeltmesi değil, yeni karar");

const usd = (n) => `$${n.toLocaleString("de-DE")}`;
const settingPerStoneCents = s.settingFeeCents + s.engravingFeeCentsEach;   // yuva + sekiz ışın = yıldız takma
const sql = bandUpdateSql({
  fileName: "0183_eon_lab_grown_hs5_four_stones.sql",
  header: [
    "EON lab-grown 04 (EON-HS5) düzeltmesi. Sahip 2026-11-10, hero v1'den sonra: \"taşlar 4 adet eşit aralıkta",
    "konumlanmış olmalı\". İki taş yerine DÖRT ~1,5 mm round lab-grown taş, bant çevresinde çeyrek tur (90°) arayla,",
    "her biri sekiz uçlu oyma yıldızın ortasında. 0182 (iki taş) uygulandığı gibi donuk; bu migration canlı taslağı",
    `listing.json'a getirir: başlık, açıklama, stone_count ${s.count}, setting_fee_cents ${settingPerStoneCents} (taş başı: yuva + ışın),`,
    `meta veri; varyantlarda taş ${s.totalCarat} ct (kolon numeric(5,2) → 0,05) ve taş maliyeti ${usd(s.stoneCostCentsEstimate / 100)}.`,
    `Fiyat ve gram değişmez: ${usd(L.pricing.listUsd)} (alıcı %25 vitrinle ${usd(L.pricing.buyerUsd)}; sahip ikinci kartta korudu), mühür aynı.`,
    `Maliyet US 8½ $787 (6,37 g × $100 + taş $40 + takma $40 + ışın $40 + dövme $30); en kötü Offsite kârı en düşük`,
    `US 16 +$${Math.round(minProfit)}. Kanıt: docs/eon/lab-grown/2026-11-10-hammered-star-pricing.md.`,
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_hs_migration.mjs",
  seal,
  productSettingFeeCents: settingPerStoneCents,
});

await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: product update (stones ${s.count}, setting ${settingPerStoneCents}/stone), variants stone ${s.totalCarat} ct / ${s.stoneCostCentsEstimate} cents`);
console.log(`list ${L.pricing.listUsd} buyer ${L.pricing.buyerUsd}; worst-Offsite profit min ${minProfit.toFixed(0)} (US ${cells[24].label})`);
console.log(`variantSeal ${seal} (unchanged)`);
