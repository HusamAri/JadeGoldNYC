/**
 * Build provisional Jade Gold NYC Fall 2026 panel-draft manifests and real-source image crops.
 *
 * This script never calls Etsy or Supabase. It writes reversible Drive artifacts that are
 * subsequently validated and imported with import-etsy-listing-draft.mjs.
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const FALL_ROOT =
  "/Users/husamari/Library/CloudStorage/GoogleDrive-husam.ari@artifact-studio.com/Drive'ım/" +
  "Visionary Partners/oo5 | Jade Gold NYC/2026_FALL";
const OBSERVED_AT = "2026-08-25";

const necklaceResearch = [
  ["MinimalGoldAtelier", "https://www.etsy.com/listing/4351208479/14k-solid-gold-disc-lariat-necklace"],
  ["gemsinvogue", "https://www.etsy.com/listing/255004069/14k-solid-gold-lariat-necklace-double"],
  ["FezaJewel", "https://www.etsy.com/listing/1904639425/14k-solid-gold-y-necklace-long-lariat"],
  ["NarcissusFineJewelry", "https://www.etsy.com/listing/4297773960/14k-solid-gold-lariat-necklace-dainty-y"],
  ["WhisperGold", "https://www.etsy.com/listing/665541414/14k-gold-lariat-necklace-solid-gold-y"],
  ["MadanoFineJewels", "https://www.etsy.com/listing/4382884912/14k-solid-gold-diamond-lariat-necklace"],
  ["AlexisJaeJewelry", "https://www.etsy.com/listing/883955314/moon-and-star-lariat-necklace-14k-gold"],
  ["SarahEliseJewelry", "https://www.etsy.com/listing/1750185995/solid-gold-beaded-lariat-necklace-beaded"],
  ["ohannescorlu", "https://www.etsy.com/listing/4425233877/14k-solid-gold-geometric-triangle"],
  ["LouiseLeder", "https://www.etsy.com/listing/463723687/14k-solid-gold-organic-pendant-necklace"],
].map(([seller, url]) => ({ seller, url, confidence: "medium" }));

const braceletResearch = [
  ["SashJewelry", "https://www.etsy.com/listing/738978430/minimalist-14k-solid-gold-chain-bracelet"],
  ["NarcissusFineJewelry", "https://www.etsy.com/listing/4389762335/14k-solid-gold-chain-bracelet-minimalist"],
  ["AtelierKheops", "https://www.etsy.com/listing/1468951135/delicate-14k-gold-ball-chain-bracelet"],
  ["Laondrim", "https://www.etsy.com/listing/1750633308/14k-solid-gold-paris-chain-bracelet"],
  ["SioroJewelry", "https://www.etsy.com/listing/4478346991/14k-solid-gold-hand-chain-bracelet"],
  ["EtsyListing4325381799", "https://www.etsy.com/listing/4325381799/14k-solid-gold-minimalist-chain-bracelet"],
  ["matildagold", "https://www.etsy.com/listing/4397898853/14k-solid-gold-bar-chain-bracelet-14k"],
  ["EtsyListing1132345710", "https://www.etsy.com/listing/1132345710/14k-solid-gold-box-chain-bracelet-thin"],
  ["adaylike", "https://www.etsy.com/listing/1102838313/14k-solid-gold-thin-chain-bracelet"],
  ["goldengesture", "https://www.etsy.com/listing/468796399/14k-solid-gold-delicate-bracelet-14k"],
].map(([seller, url]) => ({ seller, url, confidence: "medium" }));

const earringResearch = [
  ["SigalGerson", "https://www.etsy.com/listing/254342855/gold-hexagon-earrings-14k-stud-earrings"],
  ["gemsinvogue", "https://www.etsy.com/listing/245301813/14k-solid-gold-tiny-triangle-stud"],
  ["OliesCollection", "https://www.etsy.com/listing/1292773894/14k-solid-yellow-gold-dainty-triangle"],
  ["DIAstudia", "https://www.etsy.com/listing/111326852/14k-solid-gold-bar-stud-earrings"],
  ["meltemsem", "https://www.etsy.com/listing/846605527/cube-stud-earrings-14k-solid-gold"],
  ["FerkosFineJewelry", "https://www.etsy.com/listing/4392100983/14k-gold-geometric-beaded-stud-earrings"],
  ["StudioBALADI", "https://www.etsy.com/listing/925682186/triangle-stud-earrings-geometric-studs"],
  ["VioletGoldJewelry", "https://www.etsy.com/listing/1794864574/14k-solid-gold-double-chain-drop"],
  ["CharlotteLouisJW", "https://www.etsy.com/listing/1788674352/14k-solid-gold-rectangle-drop-earrings"],
  ["Ateser", "https://www.etsy.com/listing/4406544497/14k-solid-gold-hoop-earrings-30mm-two"],
].map(([seller, url]) => ({ seller, url, confidence: "medium" }));

const configs = [
  {
    id: "VECSTUD",
    slug: "vector-hex-stud-earrings",
    sku: "JGN-F26-VECSTUD",
    source: "hf_20260822_152100_71fca564-ba17-436b-aef2-bfb1d01e7749.png",
    productType: "earrings",
    taxonomy: ["Jewelry", "Earrings", "Stud Earrings"],
    title: "14K Solid Gold Hexagon Stud Earrings, Vector Geometric Pair",
    name: "Vector Hex Stud Earrings",
    story: "A compact hexagonal form turns an industrial fastening detail into a precise everyday gold stud.",
    details: [
      "Proposed solid 14K yellow, white or rose gold, never plated or filled",
      "Hexagonal face with a raised three-line geometric detail",
      "Sold as one pair with post backs, closure type pending supplier confirmation",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending"],
    tags: ["14k gold earrings", "hexagon studs", "geometric studs", "solid gold studs", "bolt stud earrings", "minimalist earrings", "yellow gold studs", "white gold studs", "rose gold studs", "modern gold earrings", "fall 2026 jewelry", "nyc fine jewelry", "gift for her"],
    research: earringResearch,
    cost: [200, 300],
    price: 495,
    metalColorVariants: true,
  },
  {
    id: "MERLARIAT",
    slug: "meridian-triangle-lariat-necklace",
    sku: "JGN-F26-MERLARIAT",
    source: "hf_20260822_152100_8a7f3b62-79a3-42f7-b050-ab9ec78cca2a.png",
    productType: "necklace",
    taxonomy: ["Jewelry", "Necklaces", "Lariat & Y Necklaces"],
    title: "14K Solid Gold Lariat Necklace, Meridian Geometric Y Drop",
    name: "Meridian Lariat Necklace",
    story: "Two clean diagonal lines meet at the collarbone and continue into a quiet vertical drop.",
    details: [
      "Proposed solid 14K yellow, white or rose gold, never plated or filled",
      "Open geometric Y silhouette with a long center drop",
      "Small pale terminal bead, exact material pending supplier confirmation",
      "Choose an approximately 18 or 20 inch neckline length",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending", "Pale terminal bead, material pending"],
    tags: ["14k gold necklace", "lariat necklace", "y drop necklace", "triangle necklace", "geometric necklace", "solid gold lariat", "yellow gold chain", "white gold chain", "rose gold necklace", "modern gold jewelry", "fall 2026 jewelry", "nyc fine jewelry", "quiet luxury gold"],
    research: necklaceResearch,
    cost: [280, 420],
    price: 695,
    lengthVariants: true,
    metalColorVariants: true,
  },
  {
    id: "LINEDROP",
    slug: "line-teardrop-chain-earrings",
    sku: "JGN-F26-LINEDROP",
    source: "hf_20260822_154757_8fb41198-00fb-402a-9cf1-f6969dc4f073.png",
    productType: "earrings",
    taxonomy: ["Jewelry", "Earrings", "Dangle & Drop Earrings"],
    title: "14K Solid Gold Chain Drop Earrings, Line Teardrop Dangles",
    name: "Line Drop Earrings",
    story: "A fine line of gold finishes in a softly weighted teardrop, creating movement without visual noise.",
    details: [
      "Proposed solid 14K yellow, white or rose gold, never plated or filled",
      "Long fine-chain drops with polished round tops and teardrop terminals",
      "Sold as one pair, exact drop length and closure pending supplier confirmation",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending"],
    tags: ["14k gold earrings", "chain drop earrings", "teardrop earrings", "long gold earrings", "solid gold drops", "yellow gold dangle", "white gold dangle", "rose gold earrings", "modern drop earring", "fine gold earrings", "fall 2026 jewelry", "nyc fine jewelry", "quiet luxury gold"],
    research: earringResearch,
    cost: [260, 400],
    price: 695,
    metalColorVariants: true,
  },
  {
    id: "ORBITSPH",
    slug: "orbit-graduated-sphere-necklace",
    sku: "JGN-F26-ORBITSPH",
    source: "hf_20260822_154757_f27393fd-f63b-4bf8-897b-429cb936759b.png",
    productType: "necklace",
    taxonomy: ["Jewelry", "Necklaces", "Beaded Necklaces"],
    title: "14K Solid Gold Bead Necklace, Orbit Graduated Sphere Collar",
    name: "Orbit Sphere Necklace",
    story: "Graduated gold spheres create a continuous rhythm that feels substantial, calm and architectural.",
    details: [
      "Proposed solid 14K yellow, white or rose gold, never plated or filled",
      "Graduated polished sphere stations on a close collar-length chain",
      "Choose an approximately 18 or 20 inch finished length",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending"],
    tags: ["14k gold necklace", "gold bead necklace", "sphere necklace", "graduated necklace", "solid gold collar", "yellow gold beads", "white gold necklace", "rose gold necklace", "modern gold jewelry", "sculptural necklace", "fall 2026 jewelry", "nyc fine jewelry", "statement necklace"],
    research: necklaceResearch,
    cost: [420, 650],
    price: 995,
    lengthVariants: true,
    metalColorVariants: true,
  },
  {
    id: "LEGACY94",
    slug: "legacy-1994-tritone-disc-necklace",
    sku: "JGN-F26-LEGACY94",
    source: "hf_20260822_162628_639fbdbd-ec4d-4e6c-9d8b-f6743be2c3a8.png",
    productType: "necklace",
    taxonomy: ["Jewelry", "Necklaces", "Pendant Necklaces"],
    title: "14K Tri Color Gold Disc Necklace, Legacy 1994 Layered Pendant",
    name: "Legacy 1994 Tri-Tone Disc Necklace",
    story: "Three overlapping gold tones hold one visible year as a compact marker of memory and legacy.",
    details: [
      "Proposed solid 14K yellow, white and rose gold, supplier confirmation pending",
      "Three stacked circular discs with the photographed 1994 engraving",
      "Personalization is not enabled in this provisional listing",
      "Choose an approximately 18 or 20 inch chain",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending", "14K solid white gold, supplier confirmation pending", "14K solid rose gold, supplier confirmation pending"],
    tags: ["14k gold necklace", "tricolor necklace", "disc pendant", "1994 necklace", "solid gold pendant", "mixed gold necklace", "yellow white rose", "engraved disc", "legacy jewelry", "modern gold jewelry", "fall 2026 jewelry", "nyc fine jewelry", "quiet luxury gold"],
    research: necklaceResearch,
    cost: [500, 800],
    price: 1195,
    lengthVariants: true,
  },
  {
    id: "FOLDLINE",
    slug: "fold-line-rectangular-pendant-necklace",
    sku: "JGN-F26-FOLDLINE",
    source: "hf_20260822_161108_3cf158cc-11d7-40f2-b287-6e10cbedc954.png",
    productType: "necklace",
    taxonomy: ["Jewelry", "Necklaces", "Pendant Necklaces"],
    title: "14K Solid Gold Rectangle Pendant Necklace, Fold Line Bar",
    name: "Fold Line Pendant Necklace",
    story: "A single recessed line divides a polished rectangle, turning restraint into the defining detail.",
    details: [
      "Proposed solid 14K yellow, white or rose gold, never plated or filled",
      "Horizontal rectangular pendant with one centered recessed line",
      "Choose an approximately 18 or 20 inch fine gold chain",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending"],
    tags: ["14k gold necklace", "rectangle pendant", "bar pendant", "geometric necklace", "solid gold pendant", "yellow gold chain", "white gold pendant", "rose gold pendant", "modern gold jewelry", "architectural gold", "fall 2026 jewelry", "nyc fine jewelry", "everyday gold"],
    research: necklaceResearch,
    cost: [350, 550],
    price: 895,
    lengthVariants: true,
    metalColorVariants: true,
  },
  {
    id: "HALOHOOP",
    slug: "halo-two-tone-hoop-earrings",
    sku: "JGN-F26-HALOHOOP",
    source: "hf_20260822_161108_441969d6-921d-441b-aa67-9a1e56e800dc.png",
    productType: "earrings",
    taxonomy: ["Jewelry", "Earrings", "Hoop Earrings"],
    title: "14K Two Tone Gold Hoop Earrings, Halo Yellow and White Gold Pair",
    name: "Halo Two-Tone Hoop Earrings",
    story: "A bright white-gold arc interrupts warm yellow gold, giving the classic hoop a precise graphic split.",
    details: [
      "Proposed solid 14K yellow and white gold, never plated or filled",
      "Rounded chunky hoop silhouette with a contrasting white-gold section",
      "Sold as one pair, exact diameter and closure pending supplier confirmation",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending", "14K solid white gold, supplier confirmation pending"],
    tags: ["14k hoop earrings", "two tone hoops", "chunky gold hoops", "yellow white gold", "solid gold hoops", "modern hoop earrings", "minimalist hoops", "mixed metal hoops", "everyday gold hoops", "quiet luxury gold", "fall 2026 jewelry", "nyc fine jewelry", "gift for her"],
    research: earringResearch,
    cost: [600, 900],
    price: 1295,
  },
  {
    id: "ANCHOR",
    slug: "anchor-carabiner-chain-necklace",
    sku: "JGN-F26-ANCHOR",
    source: "hf_20260822_162533_04ab182b-b6a1-4b75-956b-23b474510a68.png",
    productType: "necklace",
    taxonomy: ["Jewelry", "Necklaces", "Chain Necklaces"],
    title: "14K Solid Gold Carabiner Necklace, Anchor Screw Lock Chain",
    name: "Anchor Carabiner Necklace",
    story: "The working closure becomes the center of the piece, framed as a confident elongated gold link.",
    details: [
      "Proposed solid 14K yellow, white or rose gold, never plated or filled",
      "Elongated screw-lock carabiner centerpiece on a textured chain",
      "Choose an approximately 18 or 20 inch finished length",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending"],
    tags: ["14k gold necklace", "carabiner necklace", "oval link necklace", "screw lock necklace", "solid gold chain", "wheat chain necklace", "yellow gold chain", "white gold chain", "rose gold necklace", "sculptural necklace", "fall 2026 jewelry", "nyc fine jewelry", "statement necklace"],
    research: necklaceResearch,
    cost: [600, 900],
    price: 1195,
    lengthVariants: true,
    metalColorVariants: true,
  },
  {
    id: "APERTURE",
    slug: "aperture-two-tone-eye-bracelet",
    sku: "JGN-F26-APERTURE",
    source: "hf_20260822_162533_13941be9-f432-4853-8e8e-08afc058c0b7.png",
    productType: "bracelet",
    taxonomy: ["Jewelry", "Bracelets", "Chain & Link Bracelets"],
    title: "14K Two Tone Gold Bracelet, Aperture Eye Link Curb Chain",
    name: "Aperture Two-Tone Bracelet",
    story: "An open white-gold eye sits inside a warm curb chain as a small symbol of attention and protection.",
    details: [
      "Proposed solid 14K yellow and white gold, never plated or filled",
      "Yellow-gold curb chain with an open marquise-shaped white-gold center link",
      "Provisional 7.5 inch fit, final wearable length pending supplier confirmation",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending", "14K solid white gold, supplier confirmation pending"],
    tags: ["14k gold bracelet", "two tone bracelet", "eye link bracelet", "marquise bracelet", "curb chain bracelet", "yellow white gold", "solid gold bracelet", "modern gold bracelet", "minimalist bracelet", "quiet luxury gold", "fall 2026 jewelry", "nyc fine jewelry", "unique gold bracelet"],
    research: braceletResearch,
    cost: [300, 500],
    price: 695,
    braceletSizes: true,
  },
  {
    id: "THREADNUT",
    slug: "threaded-nut-station-bracelet",
    sku: "JGN-F26-THREADNUT",
    source: "hf_20260822_162533_5eba2bd6-243c-4c6e-a79c-0112c51c1b91.png",
    productType: "bracelet",
    taxonomy: ["Jewelry", "Bracelets", "Chain & Link Bracelets"],
    title: "14K Solid Gold Station Bracelet, Threaded Hex Nut Chain",
    name: "Threaded Nut Station Bracelet",
    story: "Three small hexagonal forms translate workshop hardware into an understated line of solid gold.",
    details: [
      "Proposed solid 14K yellow, white or rose gold, never plated or filled",
      "Fine chain with three spaced hexagonal threaded-nut stations",
      "Provisional 7.5 inch fit, final wearable length pending supplier confirmation",
    ],
    materials: ["14K solid yellow gold, supplier confirmation pending"],
    tags: ["14k gold bracelet", "hex nut bracelet", "station bracelet", "geometric bracelet", "solid gold bracelet", "yellow gold chain", "white gold bracelet", "rose gold bracelet", "modern gold bracelet", "quiet luxury gold", "fall 2026 jewelry", "nyc fine jewelry", "unique gold bracelet"],
    research: braceletResearch,
    cost: [280, 450],
    price: 695,
    metalColorVariants: true,
    braceletSizes: true,
  },
];

function buildDescription(config) {
  const details = config.details.map((detail) => `• ${detail}`).join("\n");
  return `${config.story}\n\nDETAILS\n${details}\n• Made to order and ships in 1 to 3 business days\n• No personalization unless explicitly stated\n\nSIZE AND SPECIFICATION STATUS\nThis is a provisional Fall 2026 panel proposal built from the approved reference image. Exact gram weight, dimensions, hallmark, closure construction and final supplier cost will be added after production readback. No unverified measurement is presented as final.\n\nMADE TO ORDER\nThe item is made to order and ships in 1 to 3 business days. Transit time begins after dispatch and is not included in this handling window.\n\nSOLID GOLD CARE\nStore separately and clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners.\n\nDesigned for Jade Gold NYC Fall 2026. This listing is for one ${config.productType === "earrings" ? "pair of earrings" : config.productType}.`;
}

function buildVariants(config) {
  const colors = config.metalColorVariants
    ? [
        { code: "YG", name: "Yellow Gold" },
        { code: "WG", name: "White Gold" },
        { code: "RG", name: "Rose Gold" },
      ]
    : [{ code: null, name: null }];
  const lengths = config.lengthVariants
    ? [18, 20]
    : config.braceletSizes
      ? [6.5, 7, 7.5, 8]
      : [null];
  return colors.flatMap((color) => lengths.map((length, lengthIndex) => {
    const lengthCode = length == null ? null : `L${String(length).replace(".", "")}`;
    const suffix = [color.code, lengthCode].filter(Boolean).join("-");
    const properties = {};
    if (color.name) properties["Gold Color"] = color.name;
    if (length != null) {
      properties[config.productType === "bracelet" ? "Bracelet Length" : "Chain Length"] = `${length} inches`;
    }
    const priceUsd = config.price + lengthIndex * 25;
    return {
      sku: suffix ? `${config.sku}-${suffix}` : config.sku,
      name: [color.name, length == null ? null : `${length} inches`].filter(Boolean).join(" / ") || "One pair",
      properties,
      supplierCostUsd: Math.round((config.cost[0] + config.cost[1]) / 2) + lengthIndex * 15,
      costStatus: "estimated-low-confidence",
      priceUsd,
      maximumPromotionPriceUsd: Number((priceUsd * 0.9).toFixed(2)),
      quantity: 1,
      estimatedTotalWeightGrams: null,
    };
  }));
}

async function makeImages(sourcePath, outputDir, config) {
  const background = { r: 242, g: 236, b: 227, alpha: 1 };
  const plans = [
    { filename: "01-primary-hero.png", role: "primary-hero", fit: "contain", position: "centre", zoom: 0.82 },
    { filename: "02-full-reference.png", role: "full-reference-view", fit: "contain", position: "centre", zoom: 0.94 },
    { filename: "03-center-macro.png", role: "center-macro-detail", fit: "cover", position: "centre" },
    { filename: "04-upper-detail.png", role: "upper-construction-detail", fit: "cover", position: "north" },
    { filename: "05-lower-detail.png", role: "lower-construction-detail", fit: "cover", position: "south" },
  ];
  const records = [];
  for (const [position, plan] of plans.entries()) {
    const outputPath = path.join(outputDir, plan.filename);
    if (process.argv.includes("--manifest-only")) {
      // Existing deterministic crops are reused when only listing data changes.
    } else if (plan.fit === "contain") {
      await sharp(sourcePath)
        .rotate()
        .resize(2400, 2400, { fit: "contain", background, withoutEnlargement: false })
        .png({ compressionLevel: 9, palette: true, quality: 92, colours: 256 })
        .toFile(outputPath);
    } else {
      await sharp(sourcePath)
        .rotate()
        .resize(2400, 2400, { fit: "cover", position: plan.position })
        .png({ compressionLevel: 9, palette: true, quality: 92, colours: 256 })
        .toFile(outputPath);
    }
    records.push({
      filename: plan.filename,
      position,
      role: plan.role,
      alt: `${config.name}, ${plan.role.replaceAll("-", " ")}`,
      width: 2400,
      height: 2400,
      cropSafe: position === 0,
      provenance: "deterministic crop from user-supplied Fall 2026 source image",
      geometryReference: `../01-source/${config.source}`,
    });
  }
  return records;
}

function manifestFor(config, images) {
  const midpoint = Math.round((config.cost[0] + config.cost[1]) / 2);
  return {
    protocolVersion: "etsy-listing-v1",
    generatedAt: "2026-08-25T21:00:00+03:00",
    shop: {
      organizationSlug: "jade-gold-nyc",
      brandName: "Jade Gold NYC",
      currency: "USD",
      visualSystemFile: "../../etsy-visual-system-2026-fall.json",
    },
    publishingMode: "panel-draft-only",
    products: [{
      id: config.id,
      sku: config.sku,
      productType: config.productType,
      taxonomy: {
        sellerPath: config.taxonomy,
        verifiedAt: OBSERVED_AT,
        verificationStatus: "panel-draft-path-check, Etsy node readback required before publish",
      },
      production: {
        whoMade: "someone_else",
        whenMade: "made_to_order",
        readinessState: "made_to_order",
        processingDays: { min: 1, max: 3 },
        personalization: { enabled: false },
        parcel: { weight: 4, weightUnit: "oz", length: 6, width: 4, height: 2, dimensionsUnit: "in" },
      },
      content: {
        title: config.title,
        description: buildDescription(config),
        tags: config.tags,
        materials: config.metalColorVariants
          ? [
              "14K solid yellow gold, supplier confirmation pending",
              "14K solid white gold, supplier confirmation pending",
              "14K solid rose gold, supplier confirmation pending",
            ]
          : config.materials,
      },
      pricing: {
        costSource: `Visual category estimate only, USD ${config.cost[0]} to ${config.cost[1]}; gram weight and supplier quote pending`,
        costConfidence: "low",
        estimatedCostRangeUsd: { min: config.cost[0], midpoint, max: config.cost[1] },
        maximumPromotionRate: 0.1,
        methodology: "Provisional price benchmarked against current Etsy 14K solid-gold category observations. Price is blocked until gram weight, supplier quote, inbound shipping and contribution margin are confirmed.",
      },
      variants: buildVariants(config),
      images,
      research: {
        observedAt: OBSERVED_AT,
        sourceFile: `../02-research/market-research-${OBSERVED_AT}.json`,
        competitors: config.research,
      },
      approval: {
        status: "review",
        ownerApprovalRequiredForEtsy: true,
        priceReadyForEtsy: false,
        galleryReadyForEtsy: false,
        followUpPlan: "Create a separate 18K listing family after the 14K draft is approved. Do not add a third Etsy variation axis.",
        blockers: [
          "Exact gram weight and supplier quote",
          "Supplier confirmation of solid 14K materials, dimensions, hallmark and closure",
          "Independent on-body scale image and truthful back, clasp or hallmark views",
          "Metal-color-specific images for every offered Yellow Gold, White Gold and Rose Gold option",
          "Final Etsy taxonomy node readback",
          "Owner approval of final price and Etsy publication",
        ],
      },
    }],
  };
}

async function main() {
  for (const config of configs) {
    const productRoot = path.join(FALL_ROOT, `${OBSERVED_AT}-${config.slug}`);
    const sourceDir = path.join(productRoot, "01-source");
    const researchDir = path.join(productRoot, "02-research");
    const imageDir = path.join(productRoot, "03-listing-images");
    const listingDir = path.join(productRoot, "04-listing");
    await Promise.all([sourceDir, researchDir, imageDir, listingDir].map((dir) => mkdir(dir, { recursive: true })));

    const sourcePath = path.join(FALL_ROOT, config.source);
    await copyFile(sourcePath, path.join(sourceDir, config.source));
    const images = await makeImages(sourcePath, imageDir, config);
    const research = {
      observedAt: OBSERVED_AT,
      channel: "Etsy",
      queryFamily: config.productType,
      purpose: "Directional 14K solid-gold category benchmark, not an exact like-for-like valuation",
      confidence: "low",
      observations: config.research,
      pricingNote: `Provisional supplier-cost range USD ${config.cost[0]} to ${config.cost[1]}; exact grams and quote pending.`,
    };
    await writeFile(
      path.join(researchDir, `market-research-${OBSERVED_AT}.json`),
      `${JSON.stringify(research, null, 2)}\n`,
    );
    await writeFile(
      path.join(listingDir, "listing-manifest.json"),
      `${JSON.stringify(manifestFor(config, images), null, 2)}\n`,
    );
    console.log(`${config.sku}: ${config.name}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
