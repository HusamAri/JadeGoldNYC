#!/usr/bin/env node
/**
 * EON lab-grown 09 Satin Diamond Edge (EON-SDE6) → panel taslağı: supabase/migrations/0195_eon_lab_grown_sde6.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/09-satin-diamond-edge/listing.json. Kaynak: sahibin 4 gerçek fotoğrafı + 6,8 sn
 * video (2026-11-19, repoya alınmadı) + "this model do not accept resizing due to its diamonds are whole circle ...
 * 3karat, all us and half sizes, 3 gold color". Tasarım 6,0 × 1,8 mm düz bant, fırçalı saten yüz, BİR kenarda 45°
 * cilalı pah ve pahta tam tur tek sıra ~1,3 mm round lab-grown taş (taşlar arası boncuk), öbür kenar dar cilalı pah.
 *
 * Eksen Karat × Metal Color × Ring Size (225 varyant, Etsy üç eksen ≤ 400). Fiyat ayara göre, her renk ve bedende tek.
 * Maliyet ayar ve beden başına: üretici konvansiyonu 14K gram × $100, 10K/18K $/g panelin KENDİ kuralı
 * (lib/gold-cost.ts derivePurchaseCentsPerGram, doğrudan içe aktarılır) + bedene göre taş sayısı × (taş $2,52 + boncuk
 * takma $4). Satırlar ve SQL ortak modülden (scripts/eon/lab_grown_karat_color_band.mjs).
 *
 * Kapılar: ortak metin kapıları (ayar seçeneğiyle: başlıkta "10K 14K 18K Gold") + yapı-metin bağı (resize olmaz cümlesi,
 * tek kenar, tam tur) + listing.json'daki kâr tablosunun ve tabanların bu hesapla (Python price_model.py sde ile
 * bağımsız) aynı olması + her ayarın tek fiyatının %25 vitrinde ve en kötü Offsite ücretinde HER bedende ≥ $50 kalması.
 * Sahip onayı (approval.authority) yazılmadan migration dosyası yazılmaz: kuru koşu yalnız özeti ve mührü basar.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_sde_migration.mjs
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { derivePurchaseCentsPerGram } from "../../lib/gold-cost.ts";
import { fmtSize } from "./lab_grown_band.mjs";
import { KARATS, kcCells, kcMigrationSql, kcRows } from "./lab_grown_karat_color_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/09-satin-diamond-edge";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const fileName = "0195_eon_lab_grown_sde6.sql";
const outFile = path.join(repoRoot, "supabase/migrations", fileName);

// ---- metin kapıları
checkListingText(L, { karats: KARATS });
assert.deepEqual(L.karats.map((k) => k.karat), KARATS, "ayarlar 10K/14K/18K sırasıyla");
assert.deepEqual(L.variationAxes, ["Karat", "Metal Color", "Ring Size"]);
assert.deepEqual(L.colors, [["YG", "Yellow Gold"], ["WG", "White Gold"], ["RG", "Rose Gold"]]);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size and color in each karat"), "ayar başına tek fiyat açıklamada");
for (const opt of ["1. Karat: 10K, 14K or 18K gold.", "2. Ring Size: US 4 to US 16", "3. Metal Color: yellow, white or rose gold."]) {
  assert(L.description.includes(opt), `seçenek satırı yok: ${opt}`);
}
// Resize: sahibin ilk cümlesi. Başlık bölümü + gerekçe + beden ölçtürme önerisi; "resize edilebilir" iması yok.
assert.equal(L.resizable, false);
assert(L.description.includes("SIZING: THIS BAND CANNOT BE RESIZED"), "resize olmaz bölümü");
assert(L.description.includes("so there is no plain section a jeweler could cut or stretch"), "resize gerekçesi");
assert(L.description.includes("Please have your finger measured by a jeweler before ordering"), "beden ölçtürme önerisi");
assert(!/can (usually )?be resized|resize(d)? by|resizing (is )?(available|possible)|half a size through/i.test(L.description),
  "resize edilebilir iması (TMC9'un resize cümlesi sızmış olabilir)");
assert(!/\bcarats?\b|\bct\b|\bctw\b|\bt\.?w\b|0\.\d{2,3}\s*ct|0\.40|0\.009/i.test(L.description),
  "karat üretici teyidi olmadan yazılmaz");
assert(/\bEternity Band\b/.test(L.title) && /\bBeveled Edge\b/.test(L.title) && /\bBrushed\b/.test(L.title) && /\b6mm\b/.test(L.title));
assert(L.description.includes("6 mm wide") && L.description.includes("about 1.8 mm thick"));
for (const w of ["brushed satin face", "one beveled edge set with round lab grown diamonds all the way around",
  "The other edge is a plain polished bevel", "about 1.3 mm each", "small gold beads between them",
  "all the way around the band", "The other edge has no stones", "the row always closes the full circle",
  "all the lab grown diamonds are included", "in yellow, white or rose gold"]) {
  assert(L.description.includes(w), `açıklamada tasarım öğesi yok: ${w}`);
}
const all = L.title + "\n" + L.description + "\n" + L.tags.join(" ");
assert(!/\b(half eternity|micro pave|pav[eé]|star|hammer(ed)?|baguette|princess|flush|gypsy|shared prong|channel|milgrain|two tone|pear|toi et moi|domed?|groove)\b/i.test(all),
  "kardeş listing'in (DSP/VB6/FR6/HS5/HEP/PC9/TMC9/PEAR2) metni sızmış");
assert(!/personali[sz]|choose your stone|stone choice|engrav/i.test(all), "bu modelde kişiselleştirme/gravür yok");
assert(!/comfort[- ]fit/i.test(all), "konfor kesim üretici teyidi olmadan yazılmaz");
assert(!/\bby hand\b|\bhand[- ]?(set|made|finished)\b|no two (rings|bands)|rhodium|plated/i.test(all),
  "el işi / kaplama iddiası üretici teyidi olmadan yazılmaz");
assert(!/anniversary|wedding/i.test(L.title + L.tags.join(" ")), "vesile/alyans sözcüğü başlıkta/tag'de yok (ring_band, 03-seo)");
assert.equal(L.band.widthMm, 6);
assert.equal(L.band.thicknessMm, 1.8);
assert.equal(L.stone.shape, "round");
assert.equal(L.stone.origin, "lab");
assert.equal(L.stone.settingFeeCents, 0, "taş sayısı bedenle değişir: takma varyant başına (HEP deseni)");
assert.equal(L.listingProtocol, "ring_band");

// ---- taş: tam tur, bedene göre (price_model.py sde ile aynı kural)
const PITCH = 1.5, ROW_OFFSET = 2.0;
const STONE_CT = L.stone.caratEach, STONE_USD = L.stone.stoneUsdEach, SET_USD = L.stone.settingUsdEach;
assert.equal(STONE_USD, Math.round(STONE_CT * 280 * 100) / 100, "taş $280/ct × 0,009 ct");
const stonesAt = (us) => Math.ceil(Math.PI * (11.63 + 0.8128 * us + ROW_OFFSET) / PITCH - 1e-9);
const stoneAt = (us) => {
  const n = stonesAt(us);
  return { stoneCarat: n * STONE_CT, stoneCostCents: Math.round(n * (STONE_USD + SET_USD) * 100) };
};
assert.equal(L.stone.count, stonesAt(8.5), "products.stone_count = US 8½ sayısı");
assert.equal(stonesAt(4), 36);
assert.equal(stonesAt(16), 56);

// ---- gram: üreticinin 14K bant listesi, tam kesit × alaşım yoğunluğu (pah ve yuvalar tampon)
const DENS = { "10K": 0.892, "14K": 1.0, "18K": 1.137 };
assert.deepEqual(L.gram.densityRatio, DENS);
const g14 = (us) => L.band.widthMm * (0.836 + 0.0515 * us) * L.band.thicknessMm / 1.5;
const gramAt = (us, k) => g14(us) * DENS[k];
const cells = kcCells(L, gramAt, stoneAt);
assert.equal(cells.length, 75);
for (const k of KARATS) {
  assert.equal(cells.find((c) => c.karat === k && c.size === L.gram.anchorUs).grams, L.gram.anchorGrams[k], `gram ${k}`);
}

// ---- maliyet (panelin kendi ayar kuralı içe aktarıldı)
const spot = L.pricing.spotUsdPerOzt;
const rateUsd = (k) => derivePurchaseCentsPerGram(k, spot, 10000) / 100;
const goldUsd = (us, k) => gramAt(us, k) * rateUsd(k);
const extrasUsd = (us) => stonesAt(us) * (STONE_USD + SET_USD);
const landed = (us, k) => goldUsd(us, k) + extrasUsd(us) + L.pricing.packagingUsd + L.pricing.shippingUsd;
const sale = 1 - L.pricing.storePromotionRate;
const profitAt = (list, us, k) => {
  const b = list * sale;
  return 0.905 * b - Math.min(0.15 * b, 100) - 0.45 - landed(us, k);
};
const sizes = [...new Set(cells.map((c) => c.size))];
assert.equal(sizes.length, 25);
const r2 = (x) => Math.round(x * 100) / 100;
for (const k of KARATS) {
  const P = L.pricing.byKarat[k];
  const list = L.karats.find((x) => x.karat === k).priceCents / 100;
  assert.equal(P.listUsd, list, `${k} liste`);
  assert.equal(P.buyerUsd, Math.round(list * sale), `${k} alıcı`);
  assert.equal(P.ratePerGramUsd, rateUsd(k), `${k} $/g`);
  assert.equal(P.gramsAtAnchor, L.gram.anchorGrams[k]);
  assert.equal(r2(goldUsd(L.gram.anchorUs, k)), P.goldUsdAtAnchor, `${k} altın`);
  assert.equal(r2(extrasUsd(L.gram.anchorUs)), P.extrasUsdAtAnchor, `${k} ekler`);
  assert.equal(r2(landed(L.gram.anchorUs, k)), P.landedUsdAtAnchor, `${k} landed`);
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
  console.log(`EON-SDE6 ${k}: list ${list} buyer ${Math.round(list * sale)}; landed US8.5 ${landed(8.5, k).toFixed(2)}; `
    + `worst-Offsite profit min ${minProfit.toFixed(0)} (US 16); every-size floor ${floor}; engine list ${P.engineListUsdAtAnchor}`);
}
assert(L.karats[0].priceCents < L.karats[1].priceCents && L.karats[1].priceCents < L.karats[2].priceCents, "10K < 14K < 18K");

// ---- varyant satırları + mühür
const { rows, seal } = kcRows(L, cells);
assert.equal(rows.length, 225);
const gr = (k, us) => cells.find((c) => c.karat === k && c.size === us).grams;
console.log(`grams 14K US4 ${gr("14K", 4)} / US8.5 ${gr("14K", 8.5)} / US16 ${gr("14K", 16)}; 10K US8.5 ${gr("10K", 8.5)}; `
  + `18K US8.5 ${gr("18K", 8.5)}; stones US4 ${stonesAt(4)} / US8.5 ${stonesAt(8.5)} / US16 ${stonesAt(16)}; `
  + `variants ${rows.length}; variantSeal ${seal}`);

if (!L.approval?.authority) {
  console.log(`DRY RUN: approval.authority boş, ${fileName} yazılmadı (sahip kartı bekleniyor)`);
  process.exit(0);
}
assert.equal(L.approval.panelDraftAuthorized, true);

const usd = (n) => `$${n.toLocaleString("de-DE")}`;
const B = L.pricing.byKarat;
const sql = kcMigrationSql({
  fileName,
  header: [
    "EON lab-grown 09 (EON-SDE6): 6,0 × 1,8 mm düz bant, fırçalı saten yüz; BİR kenarda 45° cilalı pah ve pahta tam",
    "tur tek sıra ~1,3 mm round lab-grown taş (taşlar arası küçük boncuk), sıranın içinde ince cilalı dudak; öbür kenar",
    "taşsız dar cilalı pah, iç yüzey cilalı. Resize OLMAZ (taşlar tam tur). Karat × Metal Color × Ring Size US 4-16",
    `yarım bedenler (225 varyant), ring_band. Ayar başına tek fiyat: 10K ${usd(B["10K"].listUsd)} / 14K ${usd(B["14K"].listUsd)} / `
      + `18K ${usd(B["18K"].listUsd)} (alıcı %25 vitrinle ${usd(B["10K"].buyerUsd)} / ${usd(B["14K"].buyerUsd)} / ${usd(B["18K"].buyerUsd)}).`,
    "Maliyet: üretici konvansiyonu (14K gram × $100; 10K/18K ayar kuralı) + bedene göre taş × ($2,52 + boncuk takma $4).",
    "Kaynak: sahibin 4 gerçek fotoğrafı + video (2026-11-19). Kanıt: docs/eon/lab-grown/2026-11-21-satin-diamond-edge-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_sde_migration.mjs",
  cells,
  seal,
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}`);
