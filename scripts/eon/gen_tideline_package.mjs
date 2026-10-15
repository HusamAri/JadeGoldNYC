#!/usr/bin/env node
/**
 * EON "Tideline" band — listing paketi ureticisi.
 *
 * Referans: sahibin demo numunesi (2026-10-15, iki fotograf, sari). Yakin
 * kirpimlardan okundu: duz profilli bant, ust yuz ince satin (fircalanmis mat);
 * YALNIZ BIR kenarda satin yuz bir basamakla asagi iner ve o kenar boyunca
 * aralarinda ince bir oluk olan IKI parlak, yuvarlak serit (cift rib) uzanir.
 * Karsi kenar kare ve satin. Ic yuzey parlak comfort fit. Tas yok.
 *
 * YAPI (sahip, 2026-10-15)
 * ------------------------
 * "4mm - 7mm width 1.5 thickness. 3 metal icin 3 listing, 10k/14k/18k, width,
 * us tam ve half sizelarin tamami" -> Karat (10/14/18K) x Width (4-7 mm) x
 * Ring Size (US 3-13, yarim bedenler; EON katalog araligi) = 252 (Etsy siniri
 * 400). Renk basina ayri listing (Y/W/R), her birinde 12 gorsel.
 *
 * FIYAT MOTORU KENDINDEN DEGIL, KANITLI
 * ------------------------------------
 * Fikstur canli Ridge Wedding Band (4569517712): ayni sinif (basamakli kenar +
 * dokulu yuz, $110 iscilik). Regresyon Ridge'in 378 aktif satirinin TAMAMINDA
 * kosar ve canli DB muhrunu (integrity.ridgeLiveSealMd5) birebir yeniden
 * uretir; 2026-10-15'te canli DB'den yeniden dogrulandi. Tideline yalniz
 * 4-7 mm satirlarini kullanir.
 *
 * INDIRIM: canli magaza %30. Motor katalogla tutarlilik icin BILEREK 0,25'te
 * (altin endeksi 0,25 formulunu taniyor). Her varyantin %30 zarar tabaninin
 * ustunde oldugu asagida assert'le kanitlanir (EK-7 kurali).
 *
 * Kullanim:
 *   node scripts/eon/gen_tideline_package.mjs          # dogrula + yaz
 *   node scripts/eon/gen_tideline_package.mjs --check  # yalniz dogrula
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const packageDir = path.join(repoRoot, "docs/eon/listings/2026-10-15-eon-tideline-band");
const checkOnly = process.argv.includes("--check");

/* ------------------------------------------------------------------ model */

const MODEL = {
  workingName: "Tideline Band",
  skuStem: "EON-TIDE",
  widthsMm: [4, 5, 6, 7],
  ringSizesUs: Array.from({ length: 21 }, (_, i) => 3 + i * 0.5),
  karats: ["10K", "14K", "18K"],
  metals: [
    { code: "Y", color: "Yellow", material: "Yellow gold" },
    { code: "W", color: "White", material: "White gold" },
    { code: "R", color: "Rose", material: "Rose gold" },
  ],
};
const PER_LISTING = MODEL.karats.length * MODEL.widthsMm.length * MODEL.ringSizesUs.length; // 252

/** Ridge'in kanitli motoru. Spot tabani 2026-09-06 (katalog tutarliligi). */
const PRICING = {
  currency: "USD",
  goldSpotUsdPerOzt: 4429.1,
  goldSpotSource: "https://www.kitco.com/charts/gold",
  goldQuoteTimestamp: "2026-09-06T13:21:00-04:00",
  fineness: { "10K": 0.417, "14K": 0.585, "18K": 0.75 },
  metalPremiumRate: 0.08,
  castingLossGrams: 1,
  laborUsd: 110,
  laborAuthority:
    "Ridge Wedding Band (4569517712) fixture: 378/378 cent-exact at USD 110 and the live DB seal reproduced exactly (re-verified 2026-10-15). Same class: flat band, textured face, polished stepped edge.",
  packingUsd: 8,
  shippingAllowanceUsd: 22,
  standardMultiplier: 2.05,
  wideMultiplier: 2.2,
  wideMultiplierStartsAtMm: 8,
  storePromotionRate: 0.25,
  storePromotionRateKnownStale:
    "Live EON store sale is 30%. Engine left at 0.25 on purpose (gold-index recognises the 0.25 formula); owner policy EK-7 raises only variants that lose money at 30%. Every variant here clears that floor (asserted below).",
  listPriceRoundingUsd: 5,
  quantityPerVariant: 20,
};

const TROY_OZ_GRAMS = 31.1034768;

function priceFor(karat, widthMm, grams) {
  const fineness = PRICING.fineness[karat];
  assert(fineness, `bilinmeyen ayar: ${karat}`);
  const perGram = PRICING.goldSpotUsdPerOzt / TROY_OZ_GRAMS;
  const materialUsd =
    (grams + PRICING.castingLossGrams) * perGram * fineness * (1 + PRICING.metalPremiumRate);
  const landedUsd =
    materialUsd + PRICING.laborUsd + PRICING.packingUsd + PRICING.shippingAllowanceUsd;
  const multiplier =
    widthMm >= PRICING.wideMultiplierStartsAtMm
      ? PRICING.wideMultiplier
      : PRICING.standardMultiplier;
  const promoted = (landedUsd * multiplier) / (1 - PRICING.storePromotionRate);
  const listUsd =
    Math.ceil(promoted / PRICING.listPriceRoundingUsd) * PRICING.listPriceRoundingUsd;
  return {
    materialUsd,
    landedUsd,
    multiplier,
    listCents: Math.round(listUsd * 100),
    saleCents: Math.round(listUsd * (1 - PRICING.storePromotionRate) * 100),
  };
}

/* ------------------------------------------------ girdi butunlugu + regresyon */

const source = JSON.parse(await readFile(path.join(packageDir, "weight-source.json"), "utf8"));

assert.equal(
  createHash("md5").update(source.rows.join("\n")).digest("hex"),
  source.integrity.md5OfJoinedRowsInSkuOrder,
  "weight-source satirlari dosya muhruyle uyusmuyor",
);

const fixture = source.rows.map((line) => {
  const [karat, width, size, grams, fixtureCents] = line.split("|");
  return {
    karat,
    widthMm: Number(width),
    ringSizeUs: Number(size),
    grams: Number(grams),
    fixtureCents: Number(fixtureCents),
  };
});
assert.equal(fixture.length, 378, `fikstur 378 satir olmali, ${fixture.length}`);
assert.equal(
  fixture.reduce((s, r) => s + r.fixtureCents, 0),
  source.integrity.sumFixtureListCents,
  "fikstur fiyat toplami uyusmuyor",
);

// Fikstur canli DB'ye bagli mi? Ridge'in muhur bicimiyle yeniden uret.
{
  const ridgeFmt = source.rows
    .map((l) => l.split("|"))
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1] || a[2] - b[2])
    .map(([k, w, s, g, p]) => [k, `${w} mm`, `US ${s}`, Number(g).toFixed(2), p].join("|"))
    .join("\n");
  assert.equal(
    createHash("md5").update(ridgeFmt).digest("hex"),
    source.integrity.ridgeLiveSealMd5,
    "fikstur Ridge'in canli DB muhruyle uyusmuyor",
  );
}

// REGRESYON: motor canli Ridge fiyatlarini 378 satirin TAMAMINDA cent birebir uretmeli.
const mismatches = fixture.filter(
  (r) => priceFor(r.karat, r.widthMm, r.grams).listCents !== r.fixtureCents,
);
assert.equal(
  mismatches.length,
  0,
  `motor ${mismatches.length} satirda fiksturden sapti; ilki: ${JSON.stringify(mismatches[0])}`,
);

// Tideline yalniz 4-7 mm.
const rows = fixture.filter((r) => MODEL.widthsMm.includes(r.widthMm));
assert.equal(rows.length, PER_LISTING, `${PER_LISTING} satir olmali, ${rows.length}`);
assert.deepEqual([...new Set(rows.map((r) => r.widthMm))].sort((a, b) => a - b), MODEL.widthsMm);
assert.deepEqual([...new Set(rows.map((r) => r.ringSizeUs))].sort((a, b) => a - b), MODEL.ringSizesUs);

for (const karat of MODEL.karats) {
  for (const size of MODEL.ringSizesUs) {
    const byWidth = rows
      .filter((r) => r.karat === karat && r.ringSizeUs === size)
      .sort((a, b) => a.widthMm - b.widthMm);
    assert(byWidth.every((r, i) => i === 0 || byWidth[i - 1].fixtureCents <= r.fixtureCents));
  }
  for (const width of MODEL.widthsMm) {
    const bySize = rows
      .filter((r) => r.karat === karat && r.widthMm === width)
      .sort((a, b) => a.ringSizeUs - b.ringSizeUs);
    assert(bySize.every((r, i) => i === 0 || bySize[i - 1].grams <= r.grams));
  }
}

/* ---------------------------------------------------------------- varyantlar */

const sizeToken = (s) => String(Math.round(s * 10)).padStart(3, "0");
const widthToken = (w) => String(w).padStart(2, "0");

function variantsFor(metal) {
  const listingSku = `${MODEL.skuStem}-${metal.code}`;
  return rows
    .slice()
    .sort(
      (a, b) =>
        MODEL.karats.indexOf(a.karat) - MODEL.karats.indexOf(b.karat) ||
        a.widthMm - b.widthMm ||
        a.ringSizeUs - b.ringSizeUs,
    )
    .map((row) => {
      const price = priceFor(row.karat, row.widthMm, row.grams);
      return {
        sku: `${listingSku}-${row.karat.replace("K", "")}-${widthToken(row.widthMm)}-${sizeToken(row.ringSizeUs)}`,
        properties: {
          Karat: row.karat,
          Width: `${row.widthMm} mm`,
          "Ring Size": `US ${row.ringSizeUs}`,
        },
        priceUsd: price.listCents / 100,
        salePriceUsd: price.saleCents / 100,
        quantity: PRICING.quantityPerVariant,
        estimatedTotalWeightGrams: row.grams,
        weightSource: source.provenance,
        weightStatus: "estimated_from_live_sibling_family",
        materialCostUsd: Math.round(price.materialUsd * 100) / 100,
        landedCostUsd: Math.round(price.landedUsd * 100) / 100,
        laborUsd: PRICING.laborUsd,
        priceMultiplier: price.multiplier,
        karat: row.karat,
        fineness: PRICING.fineness[row.karat],
        metalColor: `${metal.color} gold`,
      };
    });
}

/* -------------------------------------------------------------------- metin */

function contentFor(metal) {
  const c = metal.color;
  const lc = c.toLowerCase();
  return {
    title: `Satin Wedding Band, Solid ${c} Gold Stepped Edge Ring, Polished Double Rib Detail, 10K 14K 18K, 4mm to 7mm`,
    description: `A flat solid gold band with a soft satin face and one finely worked edge. Along that edge the satin steps down to two slim polished ribs with a fine groove between them, so a line of bright light runs around the ring as it turns. The other edge is cut square and clean. The band is 1.5 mm thick and the inside is polished smooth with a comfort fit.

YOUR RING
Solid ${lc} gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: the shine comes from the polished ribs against the satin face. The satin finish is applied by hand, so its grain varies slightly from ring to ring.

CHOOSE YOUR FIT
Width: 4, 5, 6 or 7 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The satin face softens gradually with wear and can be refreshed by a jeweler; the polished ribs can be re-polished.

ABOUT THE IMAGES
The gallery uses AI-assisted visualizations guided by photographs of the physical design. The specification card and the engraving card are typeset, not generated. One image shows the three metal colors together; this listing is for the color named in the title. Metal color and reflections vary with lighting and screens. Props are not included.`,
    tags: [
      "satin wedding band",
      "stepped edge ring",
      "double rib band",
      "brushed gold band",
      "matte gold ring",
      "solid gold band",
      "10k wedding band",
      "14k wedding band",
      "18k wedding band",
      "comfort fit ring",
      "mens wedding band",
      "womens gold band",
      `${lc} gold ring`,
    ],
    materials: [metal.material],
    goldSolidity: "Solid gold",
  };
}

/* ------------------------------------------------------------- dogrulamalar */

const listings = MODEL.metals.map((metal) => {
  const variants = variantsFor(metal);
  const content = contentFor(metal);
  assert.equal(variants.length, PER_LISTING);
  assert(variants.length <= 400, "Etsy kombinasyon limiti 400 asildi");
  assert.equal(new Set(variants.map((v) => v.sku)).size, PER_LISTING, "SKU tekilligi bozuk");
  assert(variants.every((v) => v.sku.length <= 32), "SKU 32 karakteri asti");
  assert(content.title.length <= 140, `baslik ${content.title.length} kr`);
  assert.equal(content.tags.length, 13, "13 tag olmali");
  assert(content.tags.every((t) => t.length <= 20), "20 karakteri asan tag var");
  assert.equal(new Set(content.tags).size, 13, "tekrarli tag");
  // Yapi<->metin: metin var olmayan menu vaat edemez, yabanci renk gecemez.
  const others = MODEL.metals.filter((m) => m.code !== metal.code).map((m) => m.color.toLowerCase());
  for (const o of others) {
    assert(!content.title.toLowerCase().includes(`${o} gold`), `baslikta yabanci renk: ${o}`);
    assert(!content.description.toLowerCase().includes(`${o} gold`), `aciklamada yabanci renk: ${o}`);
  }
  assert(content.description.includes("Width: 4, 5, 6 or 7 mm."), "genislik metni yapiyla uyusmuyor");
  assert(content.title.includes("4mm to 7mm"), "baslik genisligi yapiyla uyusmuyor");
  assert(content.description.includes("1.5 mm thick"), "1,5 mm kalinlik metinde yok");
  assert.equal((content.description.match(/mm thick/g) || []).length, 1, "tek kalinlik beyani olmali");
  assert(!/\b(3|8) ?mm\b/.test(content.title + content.description), "kapsam disi genislik metinde");
  return { metal, content, variants };
});

for (let i = 0; i < PER_LISTING; i++) {
  assert.equal(listings[0].variants[i].priceUsd, listings[1].variants[i].priceUsd);
  assert.equal(listings[0].variants[i].priceUsd, listings[2].variants[i].priceUsd);
}

// Kalinlik kapisi: sahip 1,5 mm dedi; fikstur gramlari motorun 1,5 mm tablosuna
// (docs/eon/eon-weight-tables.json) karsi olculur, oran 1,00-1,10 disinda = hata.
const weightTables = JSON.parse(
  await readFile(path.join(repoRoot, "docs/eon/eon-weight-tables.json"), "utf8"),
);
const thicknessRatios = [];
for (const r of rows) {
  const idx = weightTables.sizes.indexOf(r.ringSizeUs);
  const cell = weightTables.weights_grams[r.karat]?.[String(r.widthMm)]?.["1.5"];
  if (idx < 0 || !cell) continue;
  thicknessRatios.push(r.grams / cell[idx]);
}
assert(thicknessRatios.length >= 100, `1,5 mm karsilastirmasi az hucre: ${thicknessRatios.length}`);
assert(thicknessRatios.every((x) => x >= 1.0 && x <= 1.1), "gramlar 1,5 mm tablosuyla uyusmuyor");

// %30 zarar tabani (EK-7, docs/eon/pricing/2026-09-27-discount30-loss-floor.sql).
const LOSS_FLOOR = { spot: 4286.2, labor: 130, fixed: 30, etsyNet: 0.88, sale: 0.7 };
let minFloorHeadroomUsd = Infinity;
for (const l of listings) {
  for (const v of l.variants) {
    const fin = PRICING.fineness[v.karat];
    const landed =
      (v.estimatedTotalWeightGrams + 1) * (LOSS_FLOOR.spot / TROY_OZ_GRAMS) * fin * 1.08 +
      LOSS_FLOOR.labor + LOSS_FLOOR.fixed;
    const floorUsd = Math.ceil((landed + 0.45) / LOSS_FLOOR.etsyNet / LOSS_FLOOR.sale / 5) * 5;
    assert(v.priceUsd >= floorUsd, `${v.sku}: $${v.priceUsd} < %30 zarar tabani $${floorUsd}`);
    minFloorHeadroomUsd = Math.min(minFloorHeadroomUsd, v.priceUsd - floorUsd);
  }
}

// Ridge (4-7 mm) ile ayni hucreler ayni fiyati tasimali: katalogda ayni sinif, ayni fiyat.
for (const v of listings[0].variants) {
  const f = rows.find(
    (r) => r.karat === v.karat && `${r.widthMm} mm` === v.properties.Width && `US ${r.ringSizeUs}` === v.properties["Ring Size"],
  );
  assert.equal(Math.round(v.priceUsd * 100), f.fixtureCents);
}

const all = listings.flatMap((l) => l.variants);
const prices = all.map((v) => v.priceUsd);
const summary = {
  listings: listings.length,
  variantsPerListing: PER_LISTING,
  variantsTotal: all.length,
  priceRegressionAgainstRidge: "378/378 cent-exact + live DB seal; 252 used (4-7 mm)",
  minListUsd: Math.min(...prices),
  maxListUsd: Math.max(...prices),
  laborUsd: PRICING.laborUsd,
  thicknessMm: 1.5,
  gramsVs1_5mmTable: `${thicknessRatios.length} whole-size cells, ratio ${Math.min(...thicknessRatios).toFixed(3)}-${Math.max(...thicknessRatios).toFixed(3)}`,
  lossFloorAt30pct: `all ${all.length} clear it; min headroom USD ${minFloorHeadroomUsd}`,
  panelDraftOnly: true,
  etsyWrites: false,
  galleryImagesPerListing: {},
};

// Galeri sayisi diskten okunur, elle yazilmaz: 0 (henuz yok) ya da 12 (tam set).
// Ara sayi yarim kalmis is demektir. 11-trio ayni dosya uc renkte de durur.
const GALLERY = [
  "01-hero.jpg",
  "02-worn.jpg",
  "03-edge-macro.jpg",
  "04-width-ladder.jpg",
  "05-profile.jpg",
  "06-everyday.jpg",
  "07-spec-card.jpg",
  "08-true-scale.jpg",
  "09-interior.jpg",
  "10-pair.jpg",
  "11-three-colors.jpg",
  "12-engraving-card.jpg",
];
for (const { code, color } of MODEL.metals) {
  const dir = path.join(packageDir, "images", color.toLowerCase());
  const files = (await readdir(dir).catch(() => [])).filter((f) => /^\d{2}-.+\.jpg$/.test(f)).sort();
  assert(
    files.length === 0 || JSON.stringify(files) === JSON.stringify(GALLERY),
    `${color}: galeri ${files.length} gorsel (${files.join(", ")})`,
  );
  summary.galleryImagesPerListing[`${MODEL.skuStem}-${code}`] = files.length;
}
const galleryComplete = Object.values(summary.galleryImagesPerListing).every((n) => n === GALLERY.length);

if (checkOnly) {
  console.log(JSON.stringify({ check: "ok", ...summary }, null, 2));
  process.exit(0);
}

/* --------------------------------------------------------------------- yaz */

const csv = [
  "listing_sku,sku,karat,width,ring_size,grams,list_usd,sale_usd_at_25pct,labor_usd,landed_usd",
  ...listings.flatMap(({ metal, variants }) =>
    variants.map((v) =>
      [
        `${MODEL.skuStem}-${metal.code}`,
        v.sku,
        v.properties.Karat,
        v.properties.Width,
        v.properties["Ring Size"],
        v.estimatedTotalWeightGrams,
        v.priceUsd,
        v.salePriceUsd,
        v.laborUsd,
        v.landedCostUsd,
      ].join(","),
    ),
  ),
].join("\n");

const manifest = {
  generatedBy: "scripts/eon/gen_tideline_package.mjs",
  workingName: MODEL.workingName,
  organization: "EON",
  structure: {
    axes: ["Karat", "Width", "Ring Size"],
    karats: MODEL.karats,
    widthsMm: MODEL.widthsMm,
    ringSizesUs: MODEL.ringSizesUs,
    combinationsPerListing: PER_LISTING,
    etsyLimit: 400,
    metalColorIsSeparateListing: true,
  },
  gallery: GALLERY,
  pricing: PRICING,
  pricingMethod:
    "(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05, divide by 0.75 for the store promotion and round list price upward to USD 5.",
  approval: {
    etsyPushRequiresExplicitOwnerInstruction: true,
    blockers: [
      ...(galleryComplete ? [] : ["Gallery images not in place yet — see visual-plan.json"]),
      "Grams are estimated from the Ridge family; the physical demo sample was not weighed",
    ],
  },
  summary,
  listings: listings.map(({ metal, content, variants }) => ({
    listingSku: `${MODEL.skuStem}-${metal.code}`,
    metalColor: `${metal.color} gold`,
    ...content,
    variants,
  })),
};

await writeFile(path.join(packageDir, "price-table.csv"), csv + "\n");
await writeFile(path.join(packageDir, "listing-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
