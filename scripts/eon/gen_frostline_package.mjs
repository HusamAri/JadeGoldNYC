#!/usr/bin/env node
/**
 * EON "Frostline" band — listing paketi ureticisi.
 *
 * Referans: sahibin demo metal numunesi (2026-09-27, uc fotograf) — duz profilli
 * bant, kare kenarlar, parlak ic yuzey. Dis yuz TEK surekli parlak olukla iki
 * bolgeye ayrilir; oluk kenarlara PARALEL DEGIL, egik bir duzlemde durur
 * ("tilted circle"): bir yanda kenara yakin, karsi yanda ortayi gecer. Duz
 * paralel oluk (hero v1) ve S dalgasi (hero v2) sahip tarafindan reddedildi.
 * Bir bolge ince fircalanmis satin, oteki florentine / "ice" (rastgele
 * acilarda kesisen ince duz cizikler). Tas yok, milgrain yok.
 *
 * YAPI (sahip: "yeni model ayni sartlar", 2026-09-27)
 * ----------------------------------------------------
 * Willow/Cadence ile ayni: Karat (10/14/18K) x Width (3-8 mm) x Ring Size
 * (US 3-13, yarim bedenler) = 378 (Etsy siniri 400). Renk basina ayri listing
 * (Y/W/R), her birinde 10 gorsel.
 *
 * FIYAT MOTORU KENDINDEN DEGIL, KANITLI
 * ------------------------------------
 * Fikstur canli Ridge Wedding Band (4569517712), Cadence ile ayni: ayni yapi
 * (378), dokulu yuzey + parlak detay sinifi, $110 iscilik. Satirlar Ridge'in
 * CANLI DB muhrunu (integrity.ridgeLiveSealMd5) birebir yeniden uretiyor ve
 * motor 378/378 cent birebir; tutmazsa script hata verir, cikti yazmaz.
 *
 * ISCILIK KADEMESI: Comet ile ayni sinif (duz bant + tek oluk, burada egik), $110 Ridge
 * kademesi. Iki farkli yuzey (satin + florentine) elle ayri islenir; alt kademe
 * gerekcesi yok.
 *
 * INDIRIM (EK-6/EK-7): canli magaza %30 ve surecek. Motor katalogla tutarlilik
 * icin BILEREK 0,25'te (altin endeksi 0,25 formulunu taniyor). Sahip karari
 * (EK-7): yalniz %30'da ZARAR eden varyant tabana cekilir. Bu aile icin her
 * varyantin %30 zarar tabaninin ustunde oldugu asagida assert'le kanitlanir.
 *
 * Kullanim:
 *   node scripts/eon/gen_frostline_package.mjs          # dogrula + yaz
 *   node scripts/eon/gen_frostline_package.mjs --check  # yalniz dogrula
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
  "docs/eon/listings/2026-09-27-eon-frostline-band",
);
const checkOnly = process.argv.includes("--check");

/* ------------------------------------------------------------------ model */

const MODEL = {
  workingName: "Frostline Band",
  skuStem: "EON-FROST",
  widthsMm: [3, 4, 5, 6, 7, 8],
  ringSizesUs: Array.from({ length: 21 }, (_, i) => 3 + i * 0.5),
  karats: ["10K", "14K", "18K"],
  metals: [
    { code: "Y", color: "Yellow", material: "Yellow gold" },
    { code: "W", color: "White", material: "White gold" },
    { code: "R", color: "Rose", material: "Rose gold" },
  ],
};

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
    "Ridge Wedding Band (4569517712) fixture: 378/378 cent-exact at USD 110 and the live DB seal reproduced exactly. Same class as Comet (flat band, one polished groove, here on a tilt); two hand-applied finishes (satin + florentine) on either side of the groove.",
  packingUsd: 8,
  shippingAllowanceUsd: 22,
  standardMultiplier: 2.05,
  wideMultiplier: 2.2,
  wideMultiplierStartsAtMm: 8,
  storePromotionRate: 0.25,
  storePromotionRateKnownStale:
    "Live EON store sale is 30% and stays (owner, 2026-09-27). Engine left at 0.25 on purpose (gold-index recognises the 0.25 formula); owner policy EK-7 raises only variants that lose money at 30%. Every variant here clears that floor (asserted below).",
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

// Transkripsiyon kapisi: satirlar dosyanin kendi muhruyle ayni mi?
const joined = source.rows.join("\n");
assert.equal(
  createHash("md5").update(joined).digest("hex"),
  source.integrity.md5OfJoinedRowsInSkuOrder,
  "weight-source satirlari dosya muhruyle uyusmuyor",
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

// REGRESYON: motor canli Ridge fiyatlarini cent birebir uretmeli.
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
    title: `Florentine Wedding Band, Solid ${c} Gold Satin and Ice Finish Ring, Diagonal Polished Groove, 10K 14K 18K, 3mm to 8mm`,
    description: `A flat solid gold band with two finishes side by side. One polished groove circles the band on a gentle tilt, so the two finishes trade width as the ring turns. On one side the gold is softly brushed to a satin finish; on the other it carries a florentine finish, fine lines crossing at random angles that catch the light like frost on glass. The band is 1.5 mm thick, the edges are cut square and clean, and the inside is polished smooth with a comfort fit.

YOUR RING
Solid ${lc} gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: the glints come from the florentine texture of the gold itself. Both finishes are applied by hand, so the pattern of lines varies slightly from ring to ring.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The satin and florentine finishes soften gradually with wear and can be refreshed by a jeweler; the polished groove can be re-polished.

ABOUT THE IMAGES
The gallery uses AI-assisted visualizations guided by photographs of the physical design. ${metal.code === "W" ? "The main image was recolored from the visualization made for another metal color, so the shape matches it exactly." : "The main image was created for this metal color."} Metal color and reflections vary with lighting and screens. Props are not included.`,
    tags: [
      "florentine band",
      "ice finish ring",
      "satin wedding band",
      "diagonal groove band",
      "brushed gold band",
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
  // Kalinlik sahip beyani (2026-09-27: "1.5mm"); gram tablosu da 1,5 mm'ye uyuyor (asagida).
  assert(content.description.includes("1.5 mm thick"), "1,5 mm kalinlik metinde yok");
  assert.equal((content.description.match(/mm thick/g) || []).length, 1, "tek kalinlik beyani olmali");
  return { metal, content, variants };
});

// Uc renk ayni fiyat kafesini tasimali (renk fiyati degistirmez).
for (let i = 0; i < 378; i++) {
  assert.equal(listings[0].variants[i].priceUsd, listings[1].variants[i].priceUsd);
  assert.equal(listings[0].variants[i].priceUsd, listings[2].variants[i].priceUsd);
}

// Kalinlik kapisi: sahip 1,5 mm dedi. Fikstur gramlari motorun 1,5 mm tablosuna
// (docs/eon/eon-weight-tables.json) karsi olculur; tam bedenlerde oran 1,00-1,10
// disina cikarsa gram tablosu baska kalinliga aittir ve fiyat yanlistir.
const weightTables = JSON.parse(
  await readFile(path.join(repoRoot, "docs/eon/eon-weight-tables.json"), "utf8"),
);
const thicknessRatios = [];
for (const row of source.rows) {
  const [karat, width, size, grams] = row.split("|");
  const idx = weightTables.sizes.indexOf(Number(size));
  const cell = weightTables.weights_grams[karat]?.[width]?.["1.5"];
  if (idx < 0 || !cell) continue;
  thicknessRatios.push(Number(grams) / cell[idx]);
}
assert(thicknessRatios.length >= 150, `1,5 mm karsilastirmasi az hucre: ${thicknessRatios.length}`);
assert(
  thicknessRatios.every((r) => r >= 1.0 && r <= 1.1),
  "fikstur gramlari 1,5 mm tablosuyla uyusmuyor",
);

// %30 zarar tabani (EK-7 ile ayni kural, docs/eon/pricing/2026-09-27-discount30-loss-floor.sql):
// landed = (gram+1) x spot x saflik x 1,08 + 130 (kotumser iscilik) + 30,
// taban = ceil5(((landed + 0,45) / 0,88) / 0,70), spot 4.286,20 (2026-09-27).
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

const all = listings.flatMap((l) => l.variants);
const prices = all.map((v) => v.priceUsd);
const summary = {
  listings: listings.length,
  variantsPerListing: 378,
  variantsTotal: all.length,
  priceRegressionAgainstRidge: "378/378 cent-exact + live DB seal",
  minListUsd: Math.min(...prices),
  maxListUsd: Math.max(...prices),
  laborUsd: PRICING.laborUsd,
  thicknessMm: 1.5,
  gramsVs1_5mmTable: `${thicknessRatios.length} whole-size cells, ratio ${Math.min(...thicknessRatios).toFixed(3)}-${Math.max(...thicknessRatios).toFixed(3)}`,
  lossFloorAt30pct: `all 1134 clear it; min headroom USD ${minFloorHeadroomUsd}`,
  panelDraftOnly: true,
  etsyWrites: false,
  galleryImagesPerListing: {},
};

// Galeri sayisi diskten okunur, elle yazilmaz. Ilk yayin renk basina 3 gorsel
// (sahip karari 2026-09-27: Higgsfield kredisi bitti, "simdi 3'er gorselle
// yayinla"): 01 hero, 03 yakin plan (hero'dan kirpma), 07 spec karti. Seri
// kareler kredi gelince eklenir; ara sayi (4-9) yarim kalmis is demektir.
const GALLERY_FIRST_RELEASE = ["01-hero.jpg", "03-closeup.jpg", "07-spec-card.jpg"];
for (const { code, color } of MODEL.metals) {
  const dir = path.join(packageDir, "images", color.toLowerCase());
  const files = (await readdir(dir).catch(() => [])).filter((f) => /^\d{2}-.+\.jpg$/.test(f)).sort();
  const firstRelease = JSON.stringify(files) === JSON.stringify(GALLERY_FIRST_RELEASE);
  assert(files.length === 0 || firstRelease || files.length === 10, `${color}: galeri ${files.length} gorsel (${files.join(", ")})`);
  summary.galleryImagesPerListing[`${MODEL.skuStem}-${code}`] = files.length;
}
const galleryComplete = Object.values(summary.galleryImagesPerListing).every((n) => n === 10);
const galleryFirstRelease = Object.values(summary.galleryImagesPerListing).every((n) => n === GALLERY_FIRST_RELEASE.length);

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
  generatedBy: "scripts/eon/gen_frostline_package.mjs",
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
    "(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.",
  approval: {
    etsyPushRequiresExplicitOwnerInstruction: true,
    blockers: [
      ...(galleryComplete
        ? []
        : galleryFirstRelease
          ? ["First release: 3 images per metal (hero, close-up crop, spec card); the 7 remaining series frames per metal wait for image-generation credits — see visual-plan.json"]
          : ["Gallery images not in place yet — see visual-plan.json"]),
      "Grams are estimated from the Ridge family (same table as Laurel Cross); the physical demo sample was not weighed",
      "Labor tier: USD 110 (Ridge fixture, same flat single-groove class as Comet; the tilted groove may take slightly more bench time)",
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
