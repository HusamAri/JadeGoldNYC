#!/usr/bin/env node
/**
 * EON lab-grown 07 Two-Tone Milgrain Channel (EON-TMC9) → panel taslağı: supabase/migrations/0191_eon_lab_grown_tmc9.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/07-two-tone-milgrain-channel/listing.json. Kaynak: sahibin 4 gerçek fotoğrafı
 * (2026-11-13, repoya alınmadı) + "10k 14k ve 18k 3 varyantlı". Tasarım 7,0 × 2,0 mm iki tonlu bant: beyaz raylar,
 * her rayın iç kenarında milgrain hattı, kubbeli sarı orta; önde sarı ortaya kesilmiş kanalda dokuz 2,75 mm round taş.
 *
 * Eksen Karat × Ring Size (renk sabit). Fiyat ayara göre, her bedende tek. Maliyet ayar ve beden başına iki okumanın
 * YÜKSEĞİ: (a) üretici konvansiyonu 14K gram × $100, 10K/18K $/g panelin KENDİ kuralı (lib/gold-cost.ts
 * derivePurchaseCentsPerGram, burada doğrudan içe aktarılır); (b) EON iki tonlu kuralı melt × 1,07 + $250
 * (lib/pricing/gold-index.ts V4, doğrudan içe aktarılır). + 9 taş ($280/ct × 0,08 ct) + 9 kanal takma ($10).
 * Satırlar ve SQL ortak modülden (scripts/eon/lab_grown_karat_band.mjs).
 *
 * Kapılar: ortak metin kapıları (ayar seçeneğiyle: başlıkta "10K 14K 18K Gold") + yapı-metin bağı + listing.json'daki
 * kâr tablosunun ve tabanların bu hesapla (Python price_model.py tmc ile bağımsız) aynı olması + her ayarın tek fiyatının
 * %25 vitrinde ve en kötü Offsite ücretinde HER bedende ≥ $50 kalması. Sahip onayı (approval.authority) yazılmadan
 * migration dosyası yazılmaz: kuru koşu yalnız özeti ve mührü basar.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_tmc_migration.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { derivePurchaseCentsPerGram, TROY_OUNCE_GRAMS } from "../../lib/gold-cost.ts";
import { V4 } from "../../lib/pricing/gold-index.ts";
import { fmtSize } from "./lab_grown_band.mjs";
import { KARATS, karatCells, karatMigrationSql, karatRows } from "./lab_grown_karat_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/07-two-tone-milgrain-channel";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const fileName = "0191_eon_lab_grown_tmc9.sql";
const outFile = path.join(repoRoot, "supabase/migrations", fileName);

// ---- metin kapıları
checkListingText(L, { karats: KARATS });
assert.deepEqual(L.karats.map((k) => k.karat), KARATS, "ayarlar 10K/14K/18K sırasıyla");
assert.deepEqual(L.variationAxes, ["Karat", "Ring Size"]);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size in each karat"), "ayar başına tek fiyat açıklamada");
assert(L.description.includes("1. Karat: 10K, 14K or 18K gold. Both tones are the karat you choose."), "ayar seçeneği");
assert(!/\bcarats?\b|\bct\b|\bctw\b|\bt\.?w\b|0\.0[0-9]|0\.72/i.test(L.description), "karat üretici teyidi olmadan yazılmaz");
assert(/\bTwo Tone\b/.test(L.title) && /\bChannel Set\b/.test(L.title) && /\bMilgrain\b/.test(L.title) && /\b7mm\b/.test(L.title));
assert(L.description.includes("7 mm wide") && L.description.includes("about 2 mm thick at the top of the dome"));
for (const w of ["nine round lab grown diamonds", "White gold rails edged with a fine milgrain bead line",
  "domed, polished yellow gold centre", "white gold rails and a yellow gold centre", "about 2.75 mm each",
  "channel set side by side in one row across the top", "closes in a rounded end",
  "runs all the way around the band along each side of the yellow centre", "all nine lab grown diamonds are included",
  "There are no prongs", "plain gold at the back, away from the stones"]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
const all = L.title + "\n" + L.description + "\n" + L.tags.join(" ");
assert(!/\b(half eternity|eternity|micro pave|pav[eé]|star|hammer(ed)?|baguette|princess|flush|gypsy|shared prong|groove|brushed|bevel(ed)?|square)\b/i.test(all),
  "kardeş listing'in (DSP/VB6/FR6/HS5/HEP/PC9) metni sızmış");
assert(!/\b(rose gold|rose)\b/i.test(all), "bu modelde rose yok");
assert(!/personali[sz]|choose your stone|stone choice|engrav/i.test(all), "bu modelde kişiselleştirme/gravür yok");
assert(!/comfort[- ]fit/i.test(all), "konfor kesim üretici teyidi olmadan yazılmaz");
assert(!/\bby hand\b|\bhand[- ]?(set|made|finished)\b|no two (rings|bands)|rhodium|plated/i.test(all),
  "el işi / kaplama iddiası üretici teyidi olmadan yazılmaz");
assert(!/anniversary|wedding/i.test(L.title + L.tags.join(" ")), "vesile/alyans sözcüğü başlıkta/tag'de yok (ring_band, 03-seo)");
assert.equal(L.band.widthMm, 7);
assert.equal(L.band.thicknessMm, 2.0);
assert.equal(L.stone.shape, "round");
assert.equal(L.stone.count, 9);
assert.equal(L.stone.totalCarat, 0.72);
assert.equal(L.stone.stoneCostCentsEstimate, L.stone.count * 2240, "taş başı $22,40 ($280/ct × 0,08 ct)");
assert.equal(L.stone.settingFeeCents, 1000, "kanal takma taş başı $10");
assert.equal(L.listingProtocol, "ring_band");
assert.equal(L.colorLabel, "Two Tone");

// ---- gram: üreticinin 14K bant listesi, tam kesit × alaşım yoğunluğu (kanal boşluğu tampon)
const DENS = { "10K": 0.892, "14K": 1.0, "18K": 1.137 };
assert.deepEqual(L.gram.densityRatio, DENS);
const g14 = (us) => L.band.widthMm * (0.836 + 0.0515 * us) * L.band.thicknessMm / 1.5;
const gramAt = (us, k) => g14(us) * DENS[k];
const cells = karatCells(L, gramAt);
assert.equal(cells.length, 75);
for (const k of KARATS) {
  assert.equal(cells.find((c) => c.karat === k && c.size === L.gram.anchorUs).grams, L.gram.anchorGrams[k], `gram ${k}`);
}

// ---- maliyet: iki okumanın yükseği (panelin kendi kuralları içe aktarıldı)
const spot = L.pricing.spotUsdPerOzt;
const rateUsd = (k) => derivePurchaseCentsPerGram(k, spot, 10000) / 100;
const V4_PURITY = { "10K": V4.purity[10], "14K": V4.purity[14], "18K": V4.purity[18] };
const goldUsd = (us, k) => {
  const g = gramAt(us, k);
  const conv = g * rateUsd(k);
  const twoTone = g * (spot / TROY_OUNCE_GRAMS) * V4_PURITY[k] * (1 + V4.fire) + V4.laborTwoToneUsd;
  return conv >= twoTone ? [conv, "maker convention"] : [twoTone, "two-tone rule"];
};
const s = L.stone;
const extrasUsd = (s.stoneCostCentsEstimate + s.count * s.settingFeeCents) / 100;
assert.equal(extrasUsd, 291.6, "ekler price_model.py tmc ile aynı olmalı ($201,60 taş + $90 kanal takma)");
const landed = (us, k) => goldUsd(us, k)[0] + extrasUsd + L.pricing.packagingUsd + L.pricing.shippingUsd;
const sale = 1 - L.pricing.storePromotionRate;
const profitAt = (list, us, k) => {
  const b = list * sale;
  return 0.905 * b - Math.min(0.15 * b, 100) - 0.45 - landed(us, k);
};
const sizes = [...new Set(cells.map((c) => c.size))];
assert.equal(sizes.length, 25);
for (const k of KARATS) {
  const P = L.pricing.byKarat[k];
  const list = L.karats.find((x) => x.karat === k).priceCents / 100;
  assert.equal(P.listUsd, list, `${k} liste`);
  assert.equal(P.buyerUsd, Math.round(list * sale), `${k} alıcı`);
  assert.equal(P.ratePerGramUsd, rateUsd(k), `${k} $/g`);
  assert.equal(P.gramsAtAnchor, L.gram.anchorGrams[k]);
  const [gold, reading] = goldUsd(L.gram.anchorUs, k);
  assert.equal(Math.round(gold * 100) / 100, P.goldUsdAtAnchor, `${k} altın`);
  assert.equal(reading, P.goldReadingAtAnchor, `${k} okuma`);
  assert.equal(Math.round(landed(L.gram.anchorUs, k) * 100) / 100, P.landedUsdAtAnchor, `${k} landed`);
  for (const [key, v] of Object.entries(P.worstOffsiteProfitBySizeUsd)) {
    assert.equal(Math.round(profitAt(list, Number(key.slice(2)), k)), v, `kâr tablosu bayat: ${k} ${key}`);
  }
  // motor (lib/pricing-engine/eon-cost.ts): engine = round(landed × 1,55), liste = ceil(engine / vitrin, 5)
  const engine = Math.round(landed(L.gram.anchorUs, k) * L.pricing.multiplier);
  assert.equal(engine, P.engineUsd, `${k} motor`);
  assert.equal(Math.ceil(engine / sale / 5 - 1e-12) * 5, P.engineListUsdAtAnchor, `${k} motor listesi`);
  let floor = 5;
  while (Math.min(...sizes.map((us) => profitAt(floor, us, k))) < 50) floor += 5;
  assert.equal(floor, P.everySizeFloorListUsd, `${k} her beden ≥ $50 taban listesi bayat`);
  assert(list >= floor, `${k}: tek fiyat bir bedende en kötü Offsite'ta $50'ın altında`);
  const minProfit = Math.min(...sizes.map((us) => profitAt(list, us, k)));
  console.log(`EON-TMC9 ${k}: list ${list} buyer ${Math.round(list * sale)}; landed US8.5 ${landed(8.5, k).toFixed(2)} (${reading}); `
    + `worst-Offsite profit min ${minProfit.toFixed(0)} (US 16); every-size floor ${floor}; engine list ${P.engineListUsdAtAnchor}`);
}
assert(L.karats[0].priceCents < L.karats[1].priceCents && L.karats[1].priceCents < L.karats[2].priceCents, "10K < 14K < 18K");

// ---- varyant satırları + mühür
const { rows, seal } = karatRows(L, cells);
assert.equal(rows.length, 75);
const gr = (k, us) => cells.find((c) => c.karat === k && c.size === us).grams;
console.log(`grams 14K US4 ${gr("14K", 4)} / US8.5 ${gr("14K", 8.5)} / US16 ${gr("14K", 16)}; 10K US8.5 ${gr("10K", 8.5)}; `
  + `18K US8.5 ${gr("18K", 8.5)}; extras $${extrasUsd}; variantSeal ${seal}`);

if (!L.approval?.authority) {
  console.log(`DRY RUN: approval.authority boş, ${fileName} yazılmadı (sahip kartı bekleniyor)`);
  process.exit(0);
}
assert.equal(L.approval.panelDraftAuthorized, true);

const usd = (n) => `$${n.toLocaleString("de-DE")}`;
const B = L.pricing.byKarat;
const sql = karatMigrationSql({
  fileName,
  header: [
    "EON lab-grown 07 (EON-TMC9): iki tonlu 7,0 × 2,0 mm bant: beyaz altın raylar, her rayın iç kenarında beyaz milgrain",
    "hattı (tam tur), kubbeli cilalı sarı altın orta; önde sarı ortaya kesilmiş tek kanalda dokuz 2,75 mm round lab-grown",
    "taş kenar kenara (çemberin ~üçte biri), kanal son taşın biraz ötesinde yuvarlak uçla biter. Karat × Ring Size US 4-16",
    `yarım bedenler (75 varyant), ring_band. Ayar başına tek fiyat: 10K ${usd(B["10K"].listUsd)} / 14K ${usd(B["14K"].listUsd)} / `
      + `18K ${usd(B["18K"].listUsd)} (alıcı %25 vitrinle ${usd(B["10K"].buyerUsd)} / ${usd(B["14K"].buyerUsd)} / ${usd(B["18K"].buyerUsd)}).`,
    "Maliyet: üretici konvansiyonu ile iki tonlu $250 kuralının yükseği + taş $201,60 + kanal takma $90. Kaynak: sahibin 4",
    "gerçek fotoğrafı (2026-11-13). Kanıt: docs/eon/lab-grown/2026-11-13-two-tone-milgrain-channel-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_tmc_migration.mjs",
  cells,
  seal,
});
// 0191 canlıya uygulandı (2026-11-14, 20261114075355; mühür, başlık/açıklama/tag/malzeme md5'leri, 75 varyant ve
// 76 audit satırı doğrulandı): gövde donuk. Paket değişirse düzeltme yeni bir koşullu UPDATE migration'ıdır.
const APPLIED_0191_MD5 = "dcc554ed0fce8df81f7faadee5770578";
assert.equal(createHash("md5").update(sql).digest("hex"), APPLIED_0191_MD5,
  "0191 canlıya uygulandı; gövdesi değişmez, düzeltme yeni migration'dır");
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)} (byte-identical to the applied body)`);
