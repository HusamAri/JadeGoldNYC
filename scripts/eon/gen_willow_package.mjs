#!/usr/bin/env node
/**
 * EON "Willow" diamond-cut band — listing paketi ureticisi.
 *
 * Referans: sahibin demo metal (pirinc) numunesi — fircalanmis satin zemin
 * uzerinde tek sira elmas kesim mekik (marquise) faseler, yaprak dizisi gibi
 * donusumlu yonde; dusuk kubbeli comfort-fit profil.
 *
 * YAPI (sahibin talimati, 2026-09-26)
 * ----------------------------------
 * Varyant eksenleri: Karat (10/14/18K) x Width (3-8 mm) x Ring Size (US 3-13,
 * yarim bedenler) = 378 (Etsy siniri 400). Metal rengi varyant DEGIL: renk
 * basina ayri listing (Y/W/R), her birinde 10 gorsel.
 *
 * FIYAT MOTORU KENDINDEN DEGIL, KANITLI
 * ------------------------------------
 * Yapisi birebir ayni canli aile Laurel Cross (4569902988) fikstur: ayni
 * motor $130 iscilikle 378/378 cent birebir uretiyor; tutmazsa script hata
 * verir ve hicbir cikti yazmaz. Bitise en yakin kardes Diamond Cut Crosshatch
 * (4565352791/4565351341) bu motora birebir oturmuyor ama ima ettigi iscilik
 * $122-125 — yani elmas kesim de ayni suslu kademede. $55 el-isi kademesiyle
 * kurulsaydi her varyant ~$205 dusuk ve kardes aileyle tutarsiz kalirdi.
 *
 * BILINEN BORC — INDIRIM ORANI (EK-6, 2026-09-26)
 * -----------------------------------------------
 * Motor `storePromotionRate: 0.25` ile kurar (liste = motor / 0,75). EON'un
 * canli magaza indirimi 20 Eylul'den beri %30 — yani bu listing de, tum katalog
 * gibi, motorun hedefinin %6,67 altinda tahsil eder. Katalogla tutarli olmak
 * icin BILEREK 0,25 birakildi; sahip indirim kararini verince (0,25'e donus ya
 * da tabani x1,07143 kaydirma) bu aile de katalogla birlikte kayar.
 *
 * Kullanim:
 *   node scripts/eon/gen_willow_package.mjs          # dogrula + yaz
 *   node scripts/eon/gen_willow_package.mjs --check  # yalniz dogrula
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const packageDir = path.join(
  repoRoot,
  "docs/eon/listings/2026-09-26-eon-willow-diamond-cut-band",
);
const checkOnly = process.argv.includes("--check");

/* ------------------------------------------------------------------ model */

const MODEL = {
  workingName: "Willow Diamond-Cut Band",
  skuStem: "EON-WILLW",
  widthsMm: [3, 4, 5, 6, 7, 8],
  ringSizesUs: Array.from({ length: 21 }, (_, i) => 3 + i * 0.5),
  karats: ["10K", "14K", "18K"],
  metals: [
    { code: "Y", color: "Yellow", material: "Yellow gold" },
    { code: "W", color: "White", material: "White gold" },
    { code: "R", color: "Rose", material: "Rose gold" },
  ],
};

/** Laurel Cross'un kanitli motoru. Spot tabani 2026-09-06 (katalog tutarliligi). */
const PRICING = {
  currency: "USD",
  goldSpotUsdPerOzt: 4429.1,
  goldSpotSource: "https://www.kitco.com/charts/gold",
  goldQuoteTimestamp: "2026-09-06T13:21:00-04:00",
  fineness: { "10K": 0.417, "14K": 0.585, "18K": 0.75 },
  metalPremiumRate: 0.08,
  castingLossGrams: 1,
  laborUsd: 130,
  laborAuthority:
    "Laurel Cross (4569902988) fixture: 378/378 cent-exact at USD 130. Diamond Cut Crosshatch siblings imply USD 122-125, i.e. diamond-cut work sits in the ornamental tier, never the USD 55 handfinished tier.",
  packingUsd: 8,
  shippingAllowanceUsd: 22,
  standardMultiplier: 2.05,
  wideMultiplier: 2.2,
  wideMultiplierStartsAtMm: 8,
  storePromotionRate: 0.25,
  storePromotionRateKnownStale:
    "Live EON store sale is 30% since 2026-09-20 (docs/eon/strategy/2026-09-12-eon-satis-teshis.md EK-6). Left at 0.25 on purpose for catalog coherence; the owner decides the fix.",
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

// Transkripsiyon kapisi: satirlar canli DB'deki Laurel ile ayni mi?
const joined = source.rows.join("\n");
assert.equal(
  createHash("md5").update(joined).digest("hex"),
  source.integrity.md5OfJoinedRowsInSkuOrder,
  "weight-source satirlari DB muhruyle uyusmuyor (transkripsiyon hatasi)",
);

const rows = source.rows.map((line) => {
  const [karat, width, size, grams, fixtureCents] = line.split("|");
  return {
    karat,
    widthMm: Number(width),
    ringSizeUs: Number(size),
    grams: Number(grams),
    fixtureCents: Number(fixtureCents),
  };
});

assert.equal(rows.length, 378, `378 satir olmali, ${rows.length}`);
assert.equal(
  new Set(rows.map((r) => `${r.karat}|${r.widthMm}|${r.ringSizeUs}`)).size,
  378,
  "tekrarli (karat,genislik,beden) var",
);
assert.deepEqual([...new Set(rows.map((r) => r.widthMm))].sort((a, b) => a - b), MODEL.widthsMm);
assert.deepEqual(
  [...new Set(rows.map((r) => r.ringSizeUs))].sort((a, b) => a - b),
  MODEL.ringSizesUs,
);
assert.equal(
  rows.reduce((s, r) => s + r.fixtureCents, 0),
  source.integrity.sumFixtureListCents,
  "fikstur fiyat toplami uyusmuyor",
);

// REGRESYON: motor canli Laurel fiyatlarini cent birebir uretmeli.
const mismatches = rows.filter(
  (r) => priceFor(r.karat, r.widthMm, r.grams).listCents !== r.fixtureCents,
);
assert.equal(
  mismatches.length,
  0,
  `motor ${mismatches.length} satirda fiksturden sapti; ilki: ${JSON.stringify(mismatches[0])}`,
);

// Monotonluk: genislikle ve bedenle fiyat azalmamali.
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
    title: `Diamond Cut Wedding Band, Solid ${c} Gold Satin Leaf Pattern, Comfort Fit, 10K 14K 18K, 3mm to 8mm`,
    description: `A single row of hand-cut facets runs around a softly brushed band. Each facet is a slim marquise, cut at an angle and set in alternating directions like leaves along a branch, so the ring flashes with bright mirror cuts against a quiet satin surface. The profile is gently domed on the outside and polished smooth on the inside for a comfortable fit.

YOUR RING
Solid ${lc} gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: "diamond cut" is the jeweler's name for the faceting technique, not a stone. The facets are cut by hand, so their spacing and angle vary slightly from ring to ring while the leaf pattern stays the same.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The satin finish softens with wear over time and can be refreshed by a jeweler; the diamond-cut facets keep their shine.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design. Every scene was created independently for this metal color, not recolored from another. Metal color and reflections vary with lighting and screens. Props are not included.`,
    tags: [
      "diamond cut band",
      "satin wedding band",
      "leaf wedding band",
      "solid gold band",
      "10k wedding band",
      "14k wedding band",
      "18k wedding band",
      "comfort fit ring",
      "mens wedding band",
      "womens gold band",
      "textured gold ring",
      "unisex gold band",
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
  assert.equal(variants.length, 378);
  assert(variants.length <= 400, "Etsy kombinasyon limiti 400 asildi");
  assert.equal(new Set(variants.map((v) => v.sku)).size, 378, "SKU tekilligi bozuk");
  assert(variants.every((v) => v.sku.length <= 32), "SKU 32 karakteri asti");
  assert(content.title.length <= 140, `baslik ${content.title.length} kr`);
  assert.equal(content.tags.length, 13, "13 tag olmali");
  assert(content.tags.every((t) => t.length <= 20), "20 karakteri asan tag var");
  assert.equal(new Set(content.tags).size, 13, "tekrarli tag");
  // Yapi<->metin baglantisi: metin var olmayan menu vaat edemez, yabanci renk gecemez.
  const others = MODEL.metals.filter((m) => m.code !== metal.code).map((m) => m.color.toLowerCase());
  for (const o of others) {
    assert(!content.title.toLowerCase().includes(`${o} gold`), `baslikta yabanci renk: ${o}`);
    assert(!content.description.toLowerCase().includes(`${o} gold`), `aciklamada yabanci renk: ${o}`);
  }
  assert(content.description.includes("3, 4, 5, 6, 7 or 8 mm"), "genislik metni yapiyla uyusmuyor");
  assert(!/thickness|\d(\.\d)?\s?mm thick/i.test(content.description), "kalinlik beyani kaynaksiz");
  return { metal, content, variants };
});

// Uc renk ayni fiyat kafesini tasimali (renk fiyati degistirmez).
for (let i = 0; i < 378; i++) {
  assert.equal(listings[0].variants[i].priceUsd, listings[1].variants[i].priceUsd);
  assert.equal(listings[0].variants[i].priceUsd, listings[2].variants[i].priceUsd);
}

const all = listings.flatMap((l) => l.variants);
const prices = all.map((v) => v.priceUsd);
const summary = {
  listings: listings.length,
  variantsPerListing: 378,
  variantsTotal: all.length,
  priceRegressionAgainstLaurelCross: "378/378 cent-exact",
  minListUsd: Math.min(...prices),
  maxListUsd: Math.max(...prices),
  laborUsd: PRICING.laborUsd,
  panelDraftOnly: true,
  etsyWrites: false,
  galleryImagesPerListing: {},
};

// Galeri sayisi diskten okunur, elle yazilmaz: bayat "0 gorsel" blokeri
// bir kez manifest'te kalmisti. Her renk klasoru ya bos ya tam 10 olmali.
for (const { code, color } of MODEL.metals) {
  const dir = path.join(packageDir, "images", color.toLowerCase());
  const files = (await readdir(dir).catch(() => [])).filter((f) => /^\d{2}-.+\.jpg$/.test(f));
  assert(files.length === 0 || files.length === 10, `${color}: galeri ${files.length} gorsel, 10 olmali`);
  summary.galleryImagesPerListing[`${MODEL.skuStem}-${code}`] = files.length;
}
const galleryComplete = Object.values(summary.galleryImagesPerListing).every((n) => n === 10);

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
  generatedBy: "scripts/eon/gen_willow_package.mjs",
  workingName: MODEL.workingName,
  organization: "EON",
  structure: {
    axes: ["Karat", "Width", "Ring Size"],
    karats: MODEL.karats,
    widthsMm: MODEL.widthsMm,
    ringSizesUs: MODEL.ringSizesUs,
    combinationsPerListing: 378,
    etsyLimit: 400,
    metalColorIsSeparateListing: true,
  },
  pricing: PRICING,
  pricingMethod:
    "(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 130 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.",
  approval: {
    etsyPushRequiresExplicitOwnerInstruction: true,
    blockers: [
      ...(galleryComplete ? [] : ["30 gallery images (10 per metal) not complete yet — see visual-plan.json"]),
      "Grams are estimated from the Laurel Cross family; physical sample (demo brass) was not weighed",
      "Store discount is 30% live vs 25% assumed by the engine (EK-6) — owner decision pending",
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
