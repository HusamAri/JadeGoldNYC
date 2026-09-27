import raw from "./catalog.json";

export const SOURCE = "artifact-2027-enamel-v1";
export const BRAND = "by Artifact Studio Jewelry";
export const catalog = raw;
export type CatalogItem = typeof catalog[number];

export function assertImportAccess(name: string | undefined, role: string) {
  if (name !== BRAND || !["owner", "admin"].includes(role)) {
    throw new Error("Bu paket yalnız by Artifact Studio Jewelry sahibi/yöneticisi içindir.");
  }
}

export function validateCatalog(items: CatalogItem[]) {
  if (items.length !== 20 || new Set(items.map(d => d.sku)).size !== 20) throw new Error("20 benzersiz model gerekli.");
  for (const [prefix, type] of Object.entries({ R: "ring", N: "necklace", B: "bracelet", E: "earring" })) {
    if (items.filter(d => d.id.startsWith(prefix) && d.productType === type).length !== 5) throw new Error("Kategori matrisi yanlış.");
  }
  for (const d of items) {
    if (d.tags.length !== 13 || new Set(d.tags).size !== 13 || d.tags.some(t => t.length > 20)) throw new Error(`${d.id}: etiket sınırı.`);
    if (d.title.length > 140 || !d.description.includes("AI-generated") || !d.description.includes("NOT READY FOR SALE")) throw new Error(`${d.id}: açıklama/başlık.`);
    if (d.imageUrl !== `https://amuletta.artifactstudio.info/artifact/2027-enamel/${d.id}.png` || !/^[a-f0-9]{64}$/.test(d.imageSha256)) throw new Error(`${d.id}: görsel kaynağı.`);
    if (d.imageDimensions.join("x") !== "1254x1254") throw new Error(`${d.id}: çözünürlük.`);
  }
}

export function productRow(d: CatalogItem, org: string) {
  return {
    id: d.productId, org_id: org, sku: d.sku, title: d.title,
    description: d.description, tags: d.tags, materials: d.materials,
    // Legacy products constraint has no earring category. Preserve the exact type
    // in listing_metadata; leave the legacy classifier unset instead of mislabeling.
    product_type: d.productType === "earring" ? null : d.productType, status: "draft", currency: "USD",
    price_cents: null, weight_grams: null, quantity: 0, has_variations: false,
    image_url: d.imageUrl, num_images: 1, research_keyword: d.tags[0],
    listing_metadata: {
      sourcePackage: SOURCE, productType: d.productType, listingProtocol: d.listingProtocol,
      fixedMetal: { karat: "14K", color: "Yellow Gold", enamel: "kiln-fired vitreous enamel", status: "proposed" },
      offersPersonalization: false, dimensions: { proposed: d.geometry },
      production: { status: "sample_required", weightVerified: false, priceVerified: false },
      imagePlan: [{ url: d.imageUrl, sha256: d.imageSha256, kind: "ai_concept", dimensions: d.imageDimensions, enamelVisualReview: "passed_concept_only" }],
      approval: { status: "review", panelCreationAuthorized: true, imageReviewCompleted: true,
        etsyDraftCreationAuthorized: false, livePublicationAuthorized: false, priceReadyForEtsy: false,
        blockers: ["Physical sample and alloy/enamel firing qualification", "CAD dimensions and final sizes", "Verified weight, cost, price and production time", "Real product photo and separate Etsy authorization", ...(d.productType === "earring" ? ["Qualify stud earring Etsy protocol"] : [])] },
    },
  };
}
