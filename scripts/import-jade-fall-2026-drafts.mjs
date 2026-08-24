/**
 * Import Jade Gold NYC Fall 2026 products as panel-only draft listings.
 *
 * Safe by default. Without --apply, the script only validates the manifest,
 * local images, organization scope and SKU collisions. It never calls Etsy.
 *
 * Usage:
 *   node scripts/import-jade-fall-2026-drafts.mjs --product=THR01
 *   node scripts/import-jade-fall-2026-drafts.mjs --product=THR01 --apply
 *   node scripts/import-jade-fall-2026-drafts.mjs --product=THR01 --apply --allow-linked-draft
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_PRODUCT_ROOT =
  "/Users/husamari/Library/CloudStorage/GoogleDrive-husam.ari@artifact-studio.com/Drive'ım/Visionary Partners/oo5 | Jade Gold NYC/2026_FALL/2026-08-24-threshold-necklace";
const DEFAULT_MANIFEST = path.join(DEFAULT_PRODUCT_ROOT, "04-listing/listing-manifest.json");
const DEFAULT_IMAGE_ROOT = path.join(DEFAULT_PRODUCT_ROOT, "03-listing-images");
const EXPECTED_ORGANIZATION_SLUG = "jade-gold-nyc";

function loadEnvFile() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pngDimensions(filePath) {
  const bytes = readFileSync(filePath);
  assert(bytes.length >= 24, `Invalid PNG: ${filePath}`);
  assert(bytes.subarray(1, 4).toString("ascii") === "PNG", `Not a PNG: ${filePath}`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bytes,
  };
}

function propertyKey(properties) {
  return JSON.stringify(
    Object.entries(properties ?? {}).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function imageRecords(product, imageRoot) {
  return product.images.map((image) => ({
    ...image,
    localPath: path.join(imageRoot, image.filename),
  }));
}

function validateManifest(manifest) {
  assert(
    manifest.organizationSlug === EXPECTED_ORGANIZATION_SLUG,
    `Manifest organization must be ${EXPECTED_ORGANIZATION_SLUG}.`,
  );
  assert(
    manifest.publishingMode === "panel-draft-only",
    "Manifest publishingMode must remain panel-draft-only.",
  );
  assert(manifest.pricing.currency === "USD", "Fall 2026 draft currency must be USD.");
  assert(
    manifest.pricing.maximumPlannedPromotionRate <= 0.1,
    "Planned promotion may not exceed 10 percent.",
  );
}

function validateProduct(product, images, pricing) {
  assert(product.score === 10, `${product.id}: only approved 10/10 candidates may be imported.`);
  assert(product.fixedKarat === "14K", `${product.id}: karat must remain fixed at 14K.`);
  assert(
    product.upperBarMetal === "14K solid white gold",
    `${product.id}: upper bar must remain 14K solid white gold.`,
  );
  assert(
    product.lowerPendantMetal === "14K solid yellow gold",
    `${product.id}: lower pendant must remain 14K solid yellow gold.`,
  );
  assert(
    product.chainMetal === "14K solid yellow gold",
    `${product.id}: chain must remain 14K solid yellow gold.`,
  );
  assert(product.title.length <= 140, `${product.id}: title exceeds 140 characters.`);
  assert(product.tags.length === 13, `${product.id}: exactly 13 tags are required.`);
  assert(
    product.tags.every((tag) => tag.length <= 20),
    `${product.id}: a tag exceeds 20 characters.`,
  );
  assert(new Set(product.tags).size === 13, `${product.id}: tags must be unique.`);
  assert(product.madeToOrderBusinessDays === "3-5", `${product.id}: processing must be 3-5 days.`);
  assert(product.personalization === false, `${product.id}: personalization must stay disabled.`);
  assert(product.pendantWeightGrams === 2.5, `${product.id}: supplier pendant weight must remain 2.5 g.`);
  assert(product.variantCount === product.variants.length, `${product.id}: variant count mismatch.`);
  assert(product.variantCount === 4, `${product.id}: four chain-length variants are required.`);
  assert(images.length === 6, `${product.id}: five generated images plus the original are required.`);
  assert(
    images.filter((image) => image.aiGenerated).length === 5,
    `${product.id}: exactly five images must be marked AI-generated.`,
  );
  assert(
    images.filter((image) => !image.aiGenerated).length === 1,
    `${product.id}: exactly one original image is required.`,
  );

  images.forEach((image, index) => {
    assert(image.position === index, `${product.id}: image positions must be sequential.`);
    assert(existsSync(image.localPath), `${product.id}: missing image ${image.localPath}`);
    const { width, height } = pngDimensions(image.localPath);
    assert(
      width === image.width && height === image.height,
      `${product.id}: ${image.filename} is ${width} x ${height}, expected ${image.width} x ${image.height}.`,
    );
  });

  const expectedLengths = ["16 inches", "18 inches", "20 inches", "22 inches"];
  const actualLengths = product.variants.map((variant) => variant.properties["Chain Length"]);
  assert(
    JSON.stringify(actualLengths) === JSON.stringify(expectedLengths),
    `${product.id}: chain-length architecture changed.`,
  );

  for (const variant of product.variants) {
    assert(variant.priceUsd % 5 === 0, `${variant.sku}: price must be rounded to USD 5.`);
    assert(variant.quantity === 1, `${variant.sku}: made-to-order quantity must be 1.`);
    assert(variant.supplierCostUsd > 0, `${variant.sku}: supplier cost is required.`);
    assert(variant.priceUsd > variant.supplierCostUsd, `${variant.sku}: price must exceed cost.`);
    const expectedPromotionPrice = Number(
      (variant.priceUsd * (1 - pricing.maximumPlannedPromotionRate)).toFixed(2),
    );
    assert(
      variant.maximumPromotionPriceUsd === expectedPromotionPrice,
      `${variant.sku}: maximum promotion price is inconsistent.`,
    );
    assert(
      variant.estimatedTotalWeightGrams === null,
      `${variant.sku}: do not invent a total weight before production readback.`,
    );
  }
}

async function uploadImages(db, organizationId, product, images, apply) {
  const records = [];
  for (const image of images) {
    const storagePath =
      `${organizationId}/jade-fall-2026/${product.id}/${image.filename}`;
    const publicUrl =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/` +
      `listing-images/${storagePath}`;
    if (apply) {
      const { bytes } = pngDimensions(image.localPath);
      const { error } = await db.storage.from("listing-images").upload(storagePath, bytes, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw new Error(`${product.id}: image upload failed, ${error.message}`);
    }
    records.push({ ...image, storagePath, publicUrl });
  }
  return records;
}

async function upsertListing(
  db,
  organizationId,
  product,
  images,
  apply,
  allowLinkedDraft,
) {
  let existingQuery = db
    .from("products")
    .select("id, status, etsy_listing_id")
    .eq("org_id", organizationId)
    .eq("sku", product.sku);
  if (!allowLinkedDraft) existingQuery = existingQuery.is("etsy_listing_id", null);
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) {
    throw new Error(`${product.id}: draft lookup failed, ${existingError.message}`);
  }
  if (existing?.etsy_listing_id != null) {
    assert(allowLinkedDraft, `${product.id}: linked Etsy draft requires --allow-linked-draft.`);
    assert(existing.status === "draft", `${product.id}: linked listing is not a panel draft.`);
  }

  const variantSkus = product.variants.map((variant) => variant.sku);
  const { data: collisions, error: collisionError } = await db
    .from("product_variants")
    .select("sku, product_id")
    .eq("org_id", organizationId)
    .in("sku", variantSkus);
  if (collisionError) {
    throw new Error(`${product.id}: SKU validation failed, ${collisionError.message}`);
  }
  const foreignCollision = (collisions ?? []).find(
    (row) => !existing || row.product_id !== existing.id,
  );
  if (foreignCollision) {
    throw new Error(`${product.id}: SKU already belongs to another listing, ${foreignCollision.sku}`);
  }

  const minimumPriceCents = Math.min(
    ...product.variants.map((variant) => variant.priceUsd * 100),
  );
  if (!apply) {
    console.log(
      `[dry] ${product.id} ${product.name}: ${existing ? "update" : "create"}, ` +
        `${product.variantCount} variants, ${images.length} images, ` +
        `$${(minimumPriceCents / 100).toFixed(2)} minimum`,
    );
    return existing?.id ?? null;
  }

  const productPayload = {
    org_id: organizationId,
    sku: product.sku,
    title: product.title,
    description: product.description,
    tags: product.tags,
    materials: product.materials,
    status: "draft",
    currency: "USD",
    price_cents: minimumPriceCents,
    image_url: images[0].publicUrl,
    num_images: images.length,
    quantity: 1,
    has_variations: true,
    research_keyword: product.tags[0],
    archived_at: null,
  };

  let productId = existing?.id;
  if (productId) {
    let updateQuery = db
      .from("products")
      .update(productPayload)
      .eq("id", productId)
      .eq("org_id", organizationId);
    if (!allowLinkedDraft) updateQuery = updateQuery.is("etsy_listing_id", null);
    const { error } = await updateQuery;
    if (error) throw new Error(`${product.id}: product update failed, ${error.message}`);
  } else {
    const { data, error } = await db.from("products").insert(productPayload).select("id").single();
    if (error || !data) {
      throw new Error(`${product.id}: product insert failed, ${error?.message}`);
    }
    productId = data.id;
  }

  const { data: savedVariants, error: savedVariantError } = await db
    .from("product_variants")
    .select("id, sku, properties")
    .eq("org_id", organizationId)
    .eq("product_id", productId);
  if (savedVariantError) {
    throw new Error(`${product.id}: existing variant lookup failed, ${savedVariantError.message}`);
  }
  const savedVariantByProperties = new Map();
  for (const savedVariant of savedVariants ?? []) {
    const key = propertyKey(savedVariant.properties);
    assert(!savedVariantByProperties.has(key), `${product.id}: duplicate saved variant properties.`);
    savedVariantByProperties.set(key, savedVariant);
  }

  const variantRows = product.variants.map((variant) => {
    const savedVariant = savedVariantByProperties.get(propertyKey(variant.properties));
    return {
      ...(savedVariant ? { id: savedVariant.id } : {}),
      org_id: organizationId,
      product_id: productId,
      sku: variant.sku,
      name: variant.name,
      properties: variant.properties,
      price_cents: variant.priceUsd * 100,
      currency: "USD",
      quantity: variant.quantity,
      weight_grams: null,
      weight_source: null,
      active: true,
    };
  });
  const { error: variantError } = await db
    .from("product_variants")
    .upsert(variantRows, { onConflict: "id" });
  if (variantError) {
    throw new Error(`${product.id}: variant upsert failed, ${variantError.message}`);
  }

  const { data: existingImages, error: imageLookupError } = await db
    .from("listing_images")
    .select("id, storage_path")
    .eq("org_id", organizationId)
    .eq("product_id", productId);
  if (imageLookupError) {
    throw new Error(`${product.id}: image lookup failed, ${imageLookupError.message}`);
  }

  for (const image of images) {
    const payload = {
      org_id: organizationId,
      product_id: productId,
      url: image.publicUrl,
      storage_path: image.storagePath,
      source: "upload",
      alt: image.alt,
      position: image.position,
    };
    const existingImage = (existingImages ?? []).find(
      (row) => row.storage_path === image.storagePath,
    );
    const query = existingImage
      ? db.from("listing_images").update(payload).eq("id", existingImage.id)
      : db.from("listing_images").insert(payload);
    const { error } = await query;
    if (error) throw new Error(`${product.id}: image record failed, ${error.message}`);
  }

  console.log(`created panel draft ${product.id}: ${productId}`);
  return productId;
}

async function verifyListing(
  db,
  organizationId,
  product,
  productId,
  images,
  allowLinkedDraft,
) {
  const { data: savedProduct, error: productError } = await db
    .from("products")
    .select("id, sku, title, status, etsy_listing_id, num_images, price_cents")
    .eq("id", productId)
    .eq("org_id", organizationId)
    .single();
  if (productError || !savedProduct) {
    throw new Error(`${product.id}: product verification failed, ${productError?.message}`);
  }

  const { data: savedVariants, error: variantError } = await db
    .from("product_variants")
    .select("sku, properties, price_cents, weight_grams, active")
    .eq("org_id", organizationId)
    .eq("product_id", productId)
    .eq("active", true);
  if (variantError) {
    throw new Error(`${product.id}: variant verification failed, ${variantError.message}`);
  }

  const { data: savedImages, error: imageError } = await db
    .from("listing_images")
    .select("position, url, storage_path, alt")
    .eq("org_id", organizationId)
    .eq("product_id", productId)
    .order("position", { ascending: true });
  if (imageError) {
    throw new Error(`${product.id}: image verification failed, ${imageError.message}`);
  }

  assert(savedProduct.status === "draft", `${product.id}: saved product is not a draft.`);
  if (allowLinkedDraft) {
    assert(savedProduct.etsy_listing_id != null, `${product.id}: linked draft lost its Etsy ID.`);
  } else {
    assert(savedProduct.etsy_listing_id === null, `${product.id}: Etsy ID must remain empty.`);
  }
  assert(savedProduct.title === product.title, `${product.id}: title readback mismatch.`);
  assert(savedProduct.num_images === images.length, `${product.id}: image count readback mismatch.`);
  assert(savedVariants?.length === product.variantCount, `${product.id}: variant count mismatch.`);
  assert(savedImages?.length === images.length, `${product.id}: image record count mismatch.`);

  const expectedVariants = new Map(product.variants.map((variant) => [variant.sku, variant]));
  for (const variant of savedVariants) {
    const expected = expectedVariants.get(variant.sku);
    assert(expected, `${product.id}: unexpected variant ${variant.sku}.`);
    assert(
      variant.price_cents === expected.priceUsd * 100,
      `${variant.sku}: price readback mismatch.`,
    );
    assert(variant.weight_grams === null, `${variant.sku}: unverified weight was introduced.`);
    assert(
      propertyKey(variant.properties) === propertyKey(expected.properties),
      `${variant.sku}: properties readback mismatch.`,
    );
  }
  assert(
    savedImages.every(
      (image, index) =>
        image.position === index && image.url && image.storage_path && image.alt,
    ),
    `${product.id}: image order or metadata is invalid.`,
  );

  console.log(
    `verified ${product.id}: panel draft, Etsy ${allowLinkedDraft ? "linked" : "unlinked"}, ` +
      `${savedVariants.length} variants, ${savedImages.length} images`,
  );
}

async function main() {
  loadEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert(url && key, "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

  const apply = process.argv.includes("--apply");
  const allowLinkedDraft = process.argv.includes("--allow-linked-draft");
  const selected = argumentValue("product")?.toUpperCase();
  const manifestPath = argumentValue("manifest") ?? DEFAULT_MANIFEST;
  const imageRoot = argumentValue("image-root") ?? DEFAULT_IMAGE_ROOT;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  validateManifest(manifest);

  const products = selected
    ? manifest.products.filter((product) => product.id === selected)
    : manifest.products;
  assert(products.length > 0, `No matching products in manifest: ${selected ?? "all"}`);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: organization, error: organizationError } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", EXPECTED_ORGANIZATION_SLUG)
    .single();
  if (organizationError || !organization) {
    throw new Error(`Jade Gold NYC organization not found: ${organizationError?.message}`);
  }

  console.log(
    `${apply ? "APPLY" : "DRY RUN"}: ${products.length} product(s), ` +
      `org ${organization.slug}`,
  );
  for (const product of products) {
    const records = imageRecords(product, imageRoot);
    validateProduct(product, records, manifest.pricing);
    const uploaded = await uploadImages(db, organization.id, product, records, apply);
    const productId = await upsertListing(
      db,
      organization.id,
      product,
      uploaded,
      apply,
      allowLinkedDraft,
    );
    if (apply) {
      await verifyListing(
        db,
        organization.id,
        product,
        productId,
        uploaded,
        allowLinkedDraft,
      );
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
