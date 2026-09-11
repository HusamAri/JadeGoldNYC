#!/usr/bin/env node
/**
 * EON "Meridian" two-tone band — listing paketi ureticisi.
 *
 * NEDEN BU SCRIPT VAR
 * -------------------
 * Son eklenen listing ailesi (2026-09-06 Flat Milgrain) Drive'da yasayan bir
 * `build-listing-package.mjs` ile uretilmisti; repoda izi yoktu. Ikinci-beyin
 * dersi acik: "Teslimat repo'ya inmeden is bitmis sayilmaz". Bu dosya o
 * akisin repo-yerlisi: tek kaynaktan (weight-source.json) fiyat tablosunu,
 * listing manifest'ini, EN/ES metnini ve panel seed SQL'ini uretir.
 *
 * FIYAT MOTORU KENDINDEN DEGIL, KANITLI
 * ------------------------------------
 * Formul uydurulmadi; 2026-09-06 pricing-readback.json'daki `pricingMethod`
 * birebir kodlandi ve CANLI panelde duran 252 Flat Milgrain satirina karsi
 * regresyona sokuldu (ayni geometri sinifi, ayni 1.5 mm profil, ayni 55 USD
 * iscilik kademesi). 252/252 cent birebir tutmazsa script HATA verir ve
 * hicbir cikti yazilmaz — "kod dogru gorunuyor" ile bitirmeme dersi.
 *
 * Kullanim:
 *   node scripts/eon/gen_meridian_package.mjs          # dogrula + yaz
 *   node scripts/eon/gen_meridian_package.mjs --check  # yalniz dogrula
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const packageDir = path.join(
  repoRoot,
  "docs/eon/listings/2026-09-11-eon-meridian-two-tone-band",
);
const checkOnly = process.argv.includes("--check");

/* ------------------------------------------------------------------ model */

const MODEL = {
  workingName: "Meridian Two-Tone Band",
  skuStem: "EON-MERID",
  metalCode: "TT",
  thicknessMm: 1.5,
  widthsMm: [4, 5, 6, 7],
  ringSizesUs: Array.from({ length: 21 }, (_, i) => 3 + i * 0.5),
  karats: ["10K", "14K", "18K"],
};

/**
 * Fiyat tabani: 2026-09-06 Kitco bid okumasi.
 *
 * Bu tarih BILEREK tazelenmedi. 2026-09-11 canli spot 4356.60 USD/ozt
 * (api.gold-api.com/price/XAU, 16:30Z) — 4429.10'a gore %1.64 asagida, yani
 * motorun kendi DEADBAND_PCT/MAX_STEP_PCT kapilarinin (lib/pricing/gold-index)
 * %1 gurultu esigiyle %10 onay esigi arasinda ve ayni hafta canliya cikan
 * Flat Milgrain / Crossgrain aileleriyle fiyat tutarliligini koruyor. Spot
 * %5'i asarak ayrisirsa bu blok tazelenmeli ve regresyon fikstur'u
 * (weight-source.json sourceListPriceCents) yeniden uretilmelidir.
 */
const PRICING = {
  currency: "USD",
  goldSpotUsdPerOzt: 4429.1,
  goldSpotSource: "https://www.kitco.com/charts/gold",
  goldQuoteTimestamp: "2026-09-06T13:21:00-04:00",
  goldQuoteType: "bid",
  fineness: { "10K": 0.417, "14K": 0.585, "18K": 0.75 },
  metalPremiumRate: 0.08,
  castingLossGrams: 1,
  laborUsd: 55,
  laborAuthority:
    "2026-09-06 | EON Flat Milgrain family | handfinished labor profile. Meridian carries two-tone joining plus dual surface finishing, so it sits in the same handfinished tier, never the flat tier.",
  packingUsd: 8,
  shippingAllowanceUsd: 22,
  standardMultiplier: 2.05,
  wideMultiplier: 2.2,
  wideMultiplierStartsAtMm: 8,
  storePromotionRate: 0.25,
  listPriceRoundingUsd: 5,
  quantityPerVariant: 20,
};

const TROY_OZ_GRAMS = 31.1034768;

/** pricingMethod'un birebir kodu. Tek yuvarlama noktasi burasi. */
function priceFor(karat, widthMm, grams) {
  const fineness = PRICING.fineness[karat];
  assert(fineness, `bilinmeyen ayar: ${karat}`);
  const perGram = PRICING.goldSpotUsdPerOzt / TROY_OZ_GRAMS;
  const materialUsd =
    (grams + PRICING.castingLossGrams) *
    perGram *
    fineness *
    (1 + PRICING.metalPremiumRate);
  const landedUsd =
    materialUsd +
    PRICING.laborUsd +
    PRICING.packingUsd +
    PRICING.shippingAllowanceUsd;
  const multiplier =
    widthMm >= PRICING.wideMultiplierStartsAtMm
      ? PRICING.wideMultiplier
      : PRICING.standardMultiplier;
  const engineUsd = landedUsd * multiplier;
  const promoted = engineUsd / (1 - PRICING.storePromotionRate);
  const listUsd =
    Math.ceil(promoted / PRICING.listPriceRoundingUsd) *
    PRICING.listPriceRoundingUsd;
  return {
    materialUsd,
    landedUsd,
    multiplier,
    listCents: Math.round(listUsd * 100),
    saleCents: Math.round(listUsd * (1 - PRICING.storePromotionRate) * 100),
  };
}

/* ------------------------------------------------------- weight + regresyon */

const source = JSON.parse(
  await readFile(path.join(packageDir, "weight-source.json"), "utf8"),
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

assert.equal(rows.length, 252, `weight-source 252 satir olmali, ${rows.length}`);
assert.equal(
  new Set(rows.map((r) => `${r.karat}|${r.widthMm}|${r.ringSizeUs}`)).size,
  252,
  "weight-source'ta tekrarli (karat,genislik,beden) var",
);
assert.deepEqual(
  [...new Set(rows.map((r) => r.widthMm))].sort((a, b) => a - b),
  MODEL.widthsMm,
  "genislik ekseni model ile uyusmuyor",
);
assert.deepEqual(
  [...new Set(rows.map((r) => r.ringSizeUs))].sort((a, b) => a - b),
  MODEL.ringSizesUs,
  "beden ekseni model ile uyusmuyor",
);
assert(rows.every((r) => r.grams > 0), "sifir/negatif gram var");

// REGRESYON: motor, canli panelde duran 252 fiyati cent birebir uretmeli.
const mismatches = rows.filter(
  (r) => priceFor(r.karat, r.widthMm, r.grams).listCents !== r.fixtureCents,
);
assert.equal(
  mismatches.length,
  0,
  `fiyat motoru ${mismatches.length} satirda canli veriden sapti; ilki: ${JSON.stringify(mismatches[0])}`,
);

// Monotonluk: ayni bedende genislikle, ayni genislikte bedenle fiyat artmali.
for (const karat of MODEL.karats) {
  for (const size of MODEL.ringSizesUs) {
    const byWidth = rows
      .filter((r) => r.karat === karat && r.ringSizeUs === size)
      .sort((a, b) => a.widthMm - b.widthMm)
      .map((r) => r.fixtureCents);
    assert(
      byWidth.every((v, i) => i === 0 || byWidth[i - 1] <= v),
      `${karat} US ${size}: genislikle fiyat artmiyor`,
    );
  }
  for (const width of MODEL.widthsMm) {
    const bySize = rows
      .filter((r) => r.karat === karat && r.widthMm === width)
      .sort((a, b) => a.ringSizeUs - b.ringSizeUs)
      .map((r) => r.grams);
    assert(
      bySize.every((v, i) => i === 0 || bySize[i - 1] <= v),
      `${karat} ${width}mm: bedenle gram artmiyor`,
    );
  }
}

/* ---------------------------------------------------------------- varyantlar */

const sizeToken = (size) => String(Math.round(size * 10)).padStart(3, "0");
const widthToken = (width) => String(width).padStart(2, "0");
const listingSku = `${MODEL.skuStem}-${MODEL.metalCode}`;

const variants = rows
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
      name: `${row.widthMm} mm / US ${row.ringSizeUs} / ${row.karat}`,
      properties: {
        Width: `${row.widthMm} mm`,
        "Ring Size": `US ${row.ringSizeUs}`,
        Karat: row.karat,
      },
      priceUsd: price.listCents / 100,
      salePriceUsd: price.saleCents / 100,
      quantity: PRICING.quantityPerVariant,
      quantityMeaning:
        "Made-to-order production capacity per active Width, Ring Size and Karat combination.",
      estimatedTotalWeightGrams: row.grams,
      weightSource: source.provenance,
      weightStatus: "owner_approved_uniform_profile_estimate",
      sizeExtrapolated: row.ringSizeUs < 4,
      costStatus: "approved_estimate_with_dated_gold_readback",
      materialCostUsd: Math.round(price.materialUsd * 100) / 100,
      landedCostUsd: Math.round(price.landedUsd * 100) / 100,
      laborUsd: PRICING.laborUsd,
      priceMultiplier: price.multiplier,
      baseThicknessMm: MODEL.thicknessMm,
      peakThicknessMm: MODEL.thicknessMm,
      effectiveThicknessMm: MODEL.thicknessMm,
      karat: row.karat,
      fineness: PRICING.fineness[row.karat],
      metalColor: "Two-tone yellow and white gold",
    };
  });

assert.equal(variants.length, 252);
assert.equal(new Set(variants.map((v) => v.sku)).size, 252, "SKU tekilligi bozuk");
assert(variants.length <= 400, "Etsy kombinasyon limiti 400 asildi");
assert(
  variants.every((v) => v.quantity === PRICING.quantityPerVariant),
  "her varyant quantity 20 olmali",
);

/* -------------------------------------------------------------------- metin */

const CONTENT = {
  title:
    "Two Tone Wedding Band, Solid Gold Brushed White and Sandblasted Yellow, Comfort Fit, 10K 14K 18K, 4mm to 7mm",
  description: `Two metals meet along a single polished line. The Meridian Band is built from solid gold in two tones: one half finished in soft brushed white gold, the other in finely sandblasted yellow gold, divided by one narrow polished yellow groove that runs the full circumference. The polished interior is shaped for a comfortable fit. The ring reads as one continuous piece, not a plated or inlaid band, and the contrast comes entirely from surface finishing rather than from any coating.

YOUR RING
Solid gold in two tones, available in 10K, 14K or 18K. Both tones are solid gold in your selected karat. There is no plating, no filled metal and no metal-color choice to make: every ring in this listing is the same two-tone yellow and white combination. The price is for one ring in your selected karat, width and size, not a set. No gemstones. Each surface is finished by hand, so minute tool character may vary naturally from ring to ring while the brushed, sandblasted and polished zones stay in the same layout.

CHOOSE YOUR FIT
Width: 4, 5, 6 or 7 mm.
Thickness: approximately 1.5 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Width, Ring Size and Karat from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in Inside Engraving Text, up to 30 characters, and select Engraving Font: 1 | Prata, 2 | Cinzel, 3 | Cinzel Decorative or 4 | Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. Remove the ring before activities that may polish out the sandblasted texture or burnish the brushed half, since both finishes are matte by design.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by photographs of the physical design. Every scene was created independently, not recolored from another metal. Metal color and reflections vary with lighting and screens. Glass objects and other props are not included.`,
  tags: [
    "two tone band",
    "mixed metal ring",
    "two tone wedding",
    "mens gold band",
    "solid gold ring",
    "10k wedding band",
    "14k wedding band",
    "18k wedding band",
    "comfort fit ring",
    "brushed gold band",
    "sandblasted band",
    "unisex gold ring",
    "custom width ring",
  ],
  materials: ["Yellow gold", "White gold"],
  materialTags: [
    "Solid 10K yellow and white gold",
    "Solid 14K yellow and white gold",
    "Solid 18K yellow and white gold",
  ],
  goldSolidity: "Solid gold",
  translations: {
    es: {
      title:
        "Alianza bicolor de oro macizo, mitad satinada en oro blanco y mitad arenada en oro amarillo, ajuste cómodo, 10K 14K 18K, 4 a 7 mm",
      description: `Dos metales se encuentran a lo largo de una única línea pulida. La alianza Meridian está realizada en oro macizo en dos tonos: una mitad con acabado satinado suave en oro blanco y la otra finamente arenada en oro amarillo, separadas por una estrecha ranura pulida de oro amarillo que recorre toda la circunferencia. El interior pulido está perfilado para un ajuste cómodo. El anillo se percibe como una sola pieza continua, no como un anillo chapado ni con incrustaciones, y el contraste proviene únicamente del acabado de la superficie, no de ningún recubrimiento.

TU ANILLO
Oro macizo en dos tonos, disponible en 10K, 14K o 18K. Ambos tonos son oro macizo en el quilataje que elijas. Sin chapado, sin metal relleno y sin elección de color de metal: todos los anillos de este anuncio son la misma combinación bicolor de oro amarillo y blanco. El precio es por un anillo del quilataje, ancho y talla seleccionados, no por un conjunto. Sin piedras preciosas. Cada superficie se termina a mano, por lo que puede haber variaciones mínimas propias de la herramienta mientras las zonas satinada, arenada y pulida conservan la misma disposición.

ELIGE TUS MEDIDAS
Ancho: 4, 5, 6 o 7 mm.
Grosor: aproximadamente 1,5 mm.
Talla: US 3 a US 13, incluidas medias tallas.
Selecciona Width, Ring Size y Karat en los tres menús de variación. Los anillos anchos pueden sentirse más ajustados que los estrechos, así que confirma la talla con el ancho que prefieras.

GRABADO INTERIOR OPCIONAL
Introduce el texto exacto, hasta 30 caracteres, en Texto del grabado interior. Elige Fuente del grabado: 1 | Prata, 2 | Cinzel, 3 | Cinzel Decorative o 4 | Great Vibes. Deja el texto en blanco si no deseas grabado. Estos campos no modifican las variaciones de inventario.

HECHO PARA TI
Fabricado bajo pedido a partir de materias primas de metal precioso con herramientas guiadas a mano. La preparación tarda entre 4 y 5 días laborables antes del envío. El tiempo de transporte es adicional.

CUIDADOS
Limpia suavemente con jabón neutro, agua tibia y un paño suave. Evita productos químicos y limpiadores abrasivos. Quítate el anillo antes de actividades que puedan pulir la textura arenada o bruñir la mitad satinada, ya que ambos acabados son mates por diseño.

SOBRE LAS IMÁGENES
La galería incluye visualizaciones asistidas por IA de Higgsfield basadas en fotografías del diseño físico. Cada escena se creó de forma independiente, sin recolorear imágenes de otro metal. El color y los reflejos varían según la luz y la pantalla. Los elementos decorativos no están incluidos.`,
      tags: [
        "alianza bicolor",
        "anillo dos oros",
        "alianza hombre",
        "oro macizo",
        "anillo oro 10k",
        "anillo oro 14k",
        "anillo oro 18k",
        "ajuste comodo",
        "oro satinado",
        "oro arenado",
        "alianza unisex",
        "ancho a medida",
        "alianza boda",
      ],
    },
  },
};

// Etsy sozlesmesi: 13 etiket, her biri <= 20 karakter; baslik <= 140.
for (const [lang, tags] of [
  ["en", CONTENT.tags],
  ["es", CONTENT.translations.es.tags],
]) {
  assert.equal(tags.length, 13, `${lang}: 13 etiket olmali, ${tags.length}`);
  assert.equal(new Set(tags).size, 13, `${lang}: etiket tekrari var`);
  const tooLong = tags.filter((t) => t.length > 20);
  assert.equal(tooLong.length, 0, `${lang}: 20 karakteri asan etiket ${tooLong}`);
}
for (const [lang, title] of [
  ["en", CONTENT.title],
  ["es", CONTENT.translations.es.title],
]) {
  assert(title.length <= 140, `${lang}: baslik ${title.length} karakter (max 140)`);
}
/*
 * Iki-tonlu urunun metni OLMAYAN bir metal-renk secimi VAAT ETMEMELI.
 * Tehlike, "metal color" ifadesinin gecmesi degil (galeri uyarisi mesru olarak
 * "metal color ... vary with lighting" der); tehlike alicidan bir metal SECMESINI
 * istemek ya da secenek listesi saymaktir. Kapi bu yuzden fiil/menu kaliplarina
 * bakar, ciplak kelimeye degil.
 */
const METAL_CHOICE_PROMISES = [
  /\b(?:choose|select|pick)\b[^.]{0,40}\bmetal\b/i,
  /\bmetal\b[^.]{0,20}\b(?:menu|dropdown|option|variation)s?\b/i,
  /\bavailable in\b[^.]{0,40}\brose gold\b/i,
];
for (const [lang, text] of [
  ["en", CONTENT.description],
  ["es", CONTENT.translations.es.description],
]) {
  for (const pattern of METAL_CHOICE_PROMISES) {
    assert(
      !pattern.test(text),
      `${lang}: aciklama var olmayan metal-renk secimi vaat ediyor (${pattern})`,
    );
  }
}
// Buna karsilik metin, secimin OLMADIGINI acikca soylemeli.
assert(
  /no metal-color choice/i.test(CONTENT.description),
  "en: aciklama metal-renk secimi olmadigini acikca soylemeli",
);
assert(
  /sin elecci[oó]n de color de metal/i.test(CONTENT.translations.es.description),
  "es: aciklama metal-renk secimi olmadigini acikca soylemeli",
);
// Uc varyasyon menusu adiyla anilmali (Etsy'de alici bunlari gorur).
for (const [lang, text] of [
  ["en", CONTENT.description],
  ["es", CONTENT.translations.es.description],
]) {
  for (const axis of ["Width", "Ring Size", "Karat"]) {
    assert(text.includes(axis), `${lang}: aciklamada "${axis}" menusu anilmiyor`);
  }
}

/* ----------------------------------------------------------------- taksonomi */

const TAXONOMY = {
  sourceUrl: "https://openapi.etsy.com/v3/application/seller-taxonomy/nodes",
  sellerTaxonomyId: 1247,
  sellerPath: ["Jewelry", "Rings", "Wedding & Engagement", "Wedding Bands"],
  verificationStatus: "verified_live_seller_taxonomy_api",
  liveTaxonomyReadbackAt: "2026-09-04T06:50:22.397Z",
  sourceReuse: {
    status: "reused_from_verified_live_seller_taxonomy_api_readback",
    manifest: "2026-09-06-eon-flat-milgrain-band (panel: EON-FMLGRN-Y/W/R)",
    checkedAt: "2026-09-04T06:50:22.397Z",
    note: "Material multi is the only attribute that differs from the single-metal family: Meridian carries BOTH Yellow gold (139) and White gold (285) because the physical ring contains both.",
  },
  variationNote:
    "Two-tone listing: metal combination is fixed at listing level and has no variation axis. Inventory axes are Width, Ring Size and Karat.",
  attributes: {
    style: "Minimalist",
    styleRationale:
      "Closest verified Etsy style for a clean straight comfort-fit band whose definition comes from finish contrast rather than ornament.",
    cutType: null,
    setting: null,
    cutTypeStatus: "not_applicable_stone_free",
    settingStatus: "not_applicable_stone_free",
    shankType: "Straight",
    occasion: ["Wedding"],
    recipient: ["Men", "Unisex adults", "Women"],
  },
  resolvedAttributes: [
    {
      property_id: 148789511893,
      property_name: "Material multi",
      values: ["Yellow gold", "White gold"],
      value_ids: [139, 285],
    },
    {
      property_id: 570246213608,
      property_name: "Gold solidity",
      values: ["Solid gold"],
      value_ids: [5105],
    },
    {
      property_id: 570246213609,
      property_name: "Gold purity",
      values: ["10k", "14k", "18k"],
      value_ids: [5103, 5111, 5109],
    },
    {
      property_id: 570246213531,
      property_name: "Shank type",
      values: ["Straight"],
      value_ids: [4465],
    },
    {
      property_id: 168246862721,
      property_name: "Jewelry style",
      values: ["Minimalist"],
      value_ids: [2393],
    },
    {
      property_id: 46803063641,
      property_name: "Occasion",
      values: ["Wedding"],
      value_ids: [32],
    },
    {
      property_id: 145330288530,
      property_name: "Recipient",
      values: ["Men", "Unisex adults", "Women"],
      value_ids: [2311, 2450, 2310],
    },
  ],
};

const PRODUCTION = {
  whoMade: "i_did",
  whenMade: "made_to_order",
  howProduced: "made_from_scratch",
  readinessState: "made_to_order",
  tools: ["handheld_or_hand_guided_tools"],
  processingDays: { min: 4, max: 5 },
  parcel: {
    length: 4,
    width: 4,
    height: 2,
    weight: 3,
    weightUnit: "oz",
    dimensionsUnit: "in",
  },
  defaultsSource: {
    note: "Verified EON wedding-band production, personalization and parcel defaults reused from the Flat Milgrain family. Parcel was not independently measured for this model.",
    checkedAt: "2026-09-04T06:50:22.397Z",
    sourceSku: "EON-FMLGRN-Y",
  },
  personalization: {
    enabled: true,
    question: "Inside Engraving Text",
    instructions:
      "Choose a numbered engraving font and enter the exact inside engraving text. Leave blank for no engraving.",
    questions: [
      {
        questionType: "text_input",
        questionText: "Inside Engraving Text",
        instructions:
          "Choose a numbered engraving font and enter the exact inside engraving text. Leave blank for no engraving.",
        required: false,
        maxAllowedCharacters: 30,
      },
      {
        questionType: "dropdown",
        questionText: "Engraving Font",
        required: false,
        options: ["1 | Prata", "2 | Cinzel", "3 | Cinzel Decorative", "4 | Great Vibes"],
      },
    ],
    translations: {
      es: {
        questions: [
          {
            questionType: "text_input",
            questionText: "Texto del grabado interior",
            instructions:
              "Elige una fuente de grabado numerada e introduce el texto exacto para el interior. Déjalo en blanco si no deseas grabado.",
          },
          { questionType: "dropdown", questionText: "Fuente del grabado" },
        ],
      },
    },
  },
};

assert.equal(
  PRODUCTION.personalization.questions.length,
  2,
  "kural dosyasi tam 2 ozel alan istiyor",
);

/* ------------------------------------------------------------------- cikti */

const priceCsvHeader =
  "listing_sku,variant_sku,karat,width_mm,ring_size_us,estimated_grams,material_usd,landed_cost_usd,margin_multiplier,list_usd,sale_25pct_usd,quantity,base_thickness_mm,peak_thickness_mm,effective_thickness_mm";
const priceCsv = [
  priceCsvHeader,
  ...variants.map((v) =>
    [
      listingSku,
      v.sku,
      v.karat,
      v.properties.Width.replace(" mm", ""),
      v.properties["Ring Size"].replace("US ", ""),
      v.estimatedTotalWeightGrams,
      v.materialCostUsd,
      v.landedCostUsd,
      v.priceMultiplier,
      v.priceUsd,
      v.salePriceUsd,
      v.quantity,
      v.baseThicknessMm,
      v.peakThicknessMm,
      v.effectiveThicknessMm,
    ].join(","),
  ),
].join("\n");

const matrixSha256 = createHash("sha256").update(priceCsv).digest("hex");

const listPrices = variants.map((v) => v.priceUsd);
const pricingReadback = {
  schemaVersion: "eon-meridian-pricing-readback-v1",
  generatedFor: "2026-09-11-eon-meridian-two-tone-band",
  model: {
    workingName: MODEL.workingName,
    skuStem: MODEL.skuStem,
    baseThicknessMm: MODEL.thicknessMm,
    peakThicknessMm: MODEL.thicknessMm,
    effectiveThicknessMm: MODEL.thicknessMm,
    reliefVolumeMethod:
      "Uniform 1.5 mm profile. Brushing, sandblasting and the single polished groove are surface finishes with negligible net volume effect.",
    widthsMm: MODEL.widthsMm,
    ringSizesUs: MODEL.ringSizesUs,
    karats: MODEL.karats,
    metal: {
      code: MODEL.metalCode,
      label: "Two-tone yellow and white gold",
      fixedAtListingLevel: true,
      variationAxis: false,
    },
  },
  pricing: PRICING,
  pricingMethod:
    "(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 55 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05, divide by 0.75 for the store promotion and round list price upward to USD 5.",
  weightMethod: source.provenance,
  spotDriftAtGeneration: {
    basisUsdPerOzt: 4429.1,
    observedUsdPerOzt: 4356.6,
    observedAt: "2026-09-11T16:30:57Z",
    observedSource: "https://api.gold-api.com/price/XAU",
    driftPct: -1.64,
    decision:
      "Reuse the 2026-09-06 basis. Drift is inside the engine deadband band and keeps Meridian price-coherent with the Flat Milgrain and Crossgrain families that went live the same week.",
  },
  variationStructure: {
    listingGrouping: "fixed_two_tone",
    listingCount: 1,
    axes: ["Width", "Ring Size", "Karat"],
    variantsPerListing: variants.length,
    totalVariants: variants.length,
    quantityPerVariant: PRICING.quantityPerVariant,
  },
  summaryByKaratAndWidth: MODEL.karats.flatMap((karat) =>
    MODEL.widthsMm.map((widthMm) => {
      const cell = variants.filter(
        (v) => v.karat === karat && v.properties.Width === `${widthMm} mm`,
      );
      return {
        karat,
        widthMm,
        minimumWeightGrams: Math.min(...cell.map((v) => v.estimatedTotalWeightGrams)),
        maximumWeightGrams: Math.max(...cell.map((v) => v.estimatedTotalWeightGrams)),
        minimumListPriceUsd: Math.min(...cell.map((v) => v.priceUsd)),
        maximumListPriceUsd: Math.max(...cell.map((v) => v.priceUsd)),
        minimumSalePriceUsd: Math.min(...cell.map((v) => v.salePriceUsd)),
        maximumSalePriceUsd: Math.max(...cell.map((v) => v.salePriceUsd)),
      };
    }),
  ),
  matrixSha256,
  checks: {
    singleListing: true,
    variantsPerListing252: variants.length === 252,
    belowEtsyCombinationLimit400: variants.length <= 400,
    uniqueVariantSkus: new Set(variants.map((v) => v.sku)).size === variants.length,
    positiveWeights: variants.every((v) => v.estimatedTotalWeightGrams > 0),
    everyVariantQuantity20: variants.every((v) => v.quantity === 20),
    engineReproducesLiveFamilyPrices: mismatches.length === 0,
    noMetalColorVariationAxis: true,
  },
};

const product = {
  id: listingSku,
  sku: listingSku,
  productType: "ring",
  listingProtocol: "wedding_band",
  section: "Wedding Bands",
  fixedMetal: {
    code: MODEL.metalCode,
    label: "Two-tone yellow and white gold",
    es: "bicolor amarillo y blanco",
    material: "Yellow gold + White gold",
    imageColor: "two-tone yellow and white gold",
    materialIds: [139, 285],
    isTwoTone: true,
  },
  dimensions: {
    baseThicknessMm: MODEL.thicknessMm,
    peakThicknessMm: MODEL.thicknessMm,
    effectivePricingThicknessMm: MODEL.thicknessMm,
    widthsMm: MODEL.widthsMm,
    ringSizesUs: MODEL.ringSizesUs,
  },
  variationAxes: ["Width", "Ring Size", "Karat"],
  production: PRODUCTION,
  content: CONTENT,
  taxonomy: TAXONOMY,
  pricing: {
    costConfidence: "owner_approved_profile_estimate",
    costSource: source.provenance.upstreamWeightFile,
    pricingReadback:
      "docs/eon/listings/2026-09-11-eon-meridian-two-tone-band/pricing-readback.json",
    priceMatrixSha256: matrixSha256,
    maximumPromotionRate: PRICING.storePromotionRate,
    goldSpotUsdPerOzt: PRICING.goldSpotUsdPerOzt,
    goldSpotSource: PRICING.goldSpotSource,
    goldQuoteTimestamp: PRICING.goldQuoteTimestamp,
    goldQuoteType: PRICING.goldQuoteType,
    laborUsd: PRICING.laborUsd,
    packingUsd: PRICING.packingUsd,
    shippingAllowanceUsd: PRICING.shippingAllowanceUsd,
    castingLossGrams: PRICING.castingLossGrams,
    metalPremiumRate: PRICING.metalPremiumRate,
    methodology: pricingReadback.pricingMethod,
    inventoryQuantityPerVariant: PRICING.quantityPerVariant,
    priceStatus: "approved_for_panel_staging",
  },
  variants,
  images: [],
  approval: {
    ownerApprovalRequiredForEtsy: true,
    status: "panel_staged_pending_owner_visual_and_etsy_approval",
    panelCreationAuthorized: true,
    etsyDraftCreationAuthorized: false,
    livePublicationAuthorized: false,
    imageReviewCompleted: false,
    priceReadyForEtsy: true,
    cogsReadbackVerified: true,
    sourceWeightMethodApprovedByOwner: false,
    blockers: [
      "gallery_images_not_generated: 10 images required by the rules file; generation spends credits and every prompt needs owner approval first.",
      "physical_weight_not_measured: grams are the verified 1.5 mm profile estimate, not a measurement of this model.",
    ],
  },
};

const manifest = {
  protocolVersion: "etsy-listing-v1",
  publishingMode: "panel-draft-only",
  generatedFor: "2026-09-11-eon-meridian-two-tone-band",
  shop: {
    organizationSlug: "eon-266055",
    brandName: "EONFineJewelry",
    currency: "USD",
  },
  ownerOverrides: {
    scope: "Meridian Two-Tone Band only",
    authority:
      "Owner requested on 2026-09-11: widths 4 mm through 7 mm, 1.5 mm thickness, US ring sizes, two metals in one ring and no metal-color variations. Per eon-etsy-listing-rules.v1 a fixed two-tone product carries no Band color axis, so the Flat Milgrain three-listing metal split collapses to a single listing and Karat stays an inventory axis.",
    listingGrouping: "fixed_two_tone",
    listingCount: 1,
    variationAxisCount: 3,
    variationAxes: ["Width", "Ring Size", "Karat"],
    karats: [10, 14, 18],
    widthsMm: MODEL.widthsMm,
    ringSizesUs: "US 3 to US 13 including half sizes",
    etsyCombinationLimit: 400,
    combinationsPerListing: variants.length,
    quantityPerActiveVariant: PRICING.quantityPerVariant,
    galleryCountPerListing: 10,
    allGalleryImagesPresent: false,
    uniqueSceneRule: "No scene recoloring. Every composition must be independent.",
    geometryRules:
      "Closed 360-degree loop, flat outer face, one half soft brushed white gold, the other half finely sandblasted yellow gold, a single narrow polished yellow gold groove on the boundary running the full circumference, polished comfort fit interior, slim 1.5 mm profile and no geometry-changing props.",
  },
  products: [product],
};

const copyDocument = `# ${product.sku}

## English

${CONTENT.title}

${CONTENT.description}

Tags: ${CONTENT.tags.join(", ")}

## Español

${CONTENT.translations.es.title}

${CONTENT.translations.es.description}

Etiquetas: ${CONTENT.translations.es.tags.join(", ")}
`;

const validationPlan = {
  expected: {
    products: 1,
    variationAxesPerProduct: ["Width", "Ring Size", "Karat"],
    variantsPerProduct: 252,
    maximumVariantsPerProduct: 400,
    quantityPerActiveVariant: 20,
    customFieldsPerProduct: 2,
    tagsPerLanguage: 13,
    englishAndSpanish: true,
    panelDraftOnly: true,
    etsyListingIdNull: true,
    imagesPerProduct: 10,
  },
  actual: {
    products: manifest.products.length,
    variationAxesPerProduct: product.variationAxes,
    variantsPerProduct: variants.length,
    quantityPerActiveVariant: PRICING.quantityPerVariant,
    customFieldsPerProduct: PRODUCTION.personalization.questions.length,
    tagsPerLanguage: {
      en: CONTENT.tags.length,
      es: CONTENT.translations.es.tags.length,
    },
    englishAndSpanish: true,
    panelDraftOnly: true,
    etsyListingIdNull: true,
    imagesPerProduct: product.images.length,
  },
  openBlockers: product.approval.blockers,
};

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        mode: "check",
        variants: variants.length,
        priceRegression: `${rows.length - mismatches.length}/${rows.length} cent-exact`,
        matrixSha256,
        minListUsd: Math.min(...listPrices),
        maxListUsd: Math.max(...listPrices),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

await Promise.all([
  writeFile(path.join(packageDir, "price-table.csv"), `${priceCsv}\n`),
  writeFile(
    path.join(packageDir, "pricing-readback.json"),
    `${JSON.stringify(pricingReadback, null, 2)}\n`,
  ),
  writeFile(
    path.join(packageDir, "listing-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  ),
  writeFile(path.join(packageDir, "listing-copy-en-es.md"), copyDocument),
  writeFile(
    path.join(packageDir, "validation-plan.json"),
    `${JSON.stringify(validationPlan, null, 2)}\n`,
  ),
]);

console.log(
  JSON.stringify(
    {
      listings: 1,
      variants: variants.length,
      priceRegressionAgainstLiveFamily: `${rows.length - mismatches.length}/${rows.length} cent-exact`,
      minListUsd: Math.min(...listPrices),
      maxListUsd: Math.max(...listPrices),
      matrixSha256,
      panelDraftOnly: true,
      etsyWrites: false,
      imagesGenerated: 0,
    },
    null,
    2,
  ),
);
