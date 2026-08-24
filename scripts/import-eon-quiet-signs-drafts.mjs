/**
 * Import EON Quiet Signs candidates as panel-only draft listings.
 *
 * Safe by default. The script performs read-only validation unless --apply is
 * present. It never calls Etsy and only writes products, product_variants,
 * listing_images and the public listing-images Storage bucket.
 *
 * Usage:
 *   node scripts/import-eon-quiet-signs-drafts.mjs --product=G06
 *   node scripts/import-eon-quiet-signs-drafts.mjs --product=G06 --apply
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_MANIFEST =
  "/Users/husamari/Library/CloudStorage/GoogleDrive-husam.ari@artifact-studio.com/Drive'ım/Visionary Partners/oo6 | EON/03-design/2026-08-23-eon-quiet-signs-listing-wave-01/02-listings/listing-manifest.json";
const DEFAULT_IMAGE_ROOT =
  "/Users/husamari/Library/CloudStorage/GoogleDrive-husam.ari@artifact-studio.com/Drive'ım/Visionary Partners/oo6 | EON/03-design/2026-08-23-eon-quiet-signs-listing-wave-01/03-higgsfield-images";

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
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
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

function imageRecords(product, imageRoot) {
  const role = product.metalMode === "single" ? "metal-variations" : "stacking-synergy";
  return [
    {
      filename: "01-hero.png",
      alt: `${product.name} 14K solid gold ring, editorial hero view`,
    },
    {
      filename: "02-on-hand.png",
      alt: `${product.name} 14K solid gold ring worn on hand`,
    },
    {
      filename: `03-${role}.png`,
      alt:
        product.metalMode === "single"
          ? `${product.name} in yellow, white and rose 14K gold`
          : `${product.name} two-tone 14K gold stacking view`,
    },
  ].map((record, position) => ({
    ...record,
    position,
    localPath: path.join(imageRoot, product.id, record.filename),
  }));
}

function validateProduct(product, images) {
  assert(product.score === 10, `${product.id}: only 10/10 candidates are allowed in wave 01.`);
  assert(product.title.length <= 140, `${product.id}: title exceeds 140 characters.`);
  assert(product.tags.length <= 13, `${product.id}: more than 13 tags.`);
  assert(product.tags.every((tag) => tag.length <= 20), `${product.id}: a tag exceeds 20 characters.`);
  assert(product.imagePrompts.length === 3, `${product.id}: exactly 3 listing images are required.`);
  assert(product.personalization === false, `${product.id}: engraving or personalization must stay disabled.`);
  assert(product.madeToOrderBusinessDays === "4-5", `${product.id}: processing time must be 4-5 business days.`);
  assert(product.widthVariation === false, `${product.id}: width variation must stay disabled.`);
  assert(product.variantCount === product.variants.length, `${product.id}: variant count mismatch.`);
  assert(
    product.variantCount === (product.metalMode === "single" ? 63 : 21),
    `${product.id}: invalid variation architecture.`,
  );

  for (const image of images) {
    assert(existsSync(image.localPath), `${product.id}: missing image ${image.localPath}`);
    const { width, height } = pngDimensions(image.localPath);
    assert(width === 2048 && height === 2048, `${product.id}: ${image.filename} is not 2048 x 2048.`);
  }
}

async function uploadImages(db, orgId, product, images, apply) {
  const records = [];
  for (const image of images) {
    const storagePath = `${orgId}/quiet-signs-fall-2026/${product.id}/${image.filename}`;
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${storagePath}`;
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

async function upsertListing(db, orgId, product, images, apply) {
  const panelSku = `EON-QS26-${product.id}`;
  const minPriceCents = Math.min(...product.variants.map((variant) => variant.priceUsd * 100));
  const { data: existing, error: existingError } = await db
    .from("products")
    .select("id, title, status, etsy_listing_id")
    .eq("org_id", orgId)
    .eq("sku", panelSku)
    .is("etsy_listing_id", null)
    .maybeSingle();
  if (existingError) throw new Error(`${product.id}: draft lookup failed, ${existingError.message}`);

  const skus = product.variants.map((variant) => variant.sku);
  const { data: collisions, error: collisionError } = await db
    .from("product_variants")
    .select("sku, product_id")
    .eq("org_id", orgId)
    .in("sku", skus);
  if (collisionError) throw new Error(`${product.id}: SKU validation failed, ${collisionError.message}`);
  const foreignCollision = (collisions ?? []).find(
    (row) => !existing || row.product_id !== existing.id,
  );
  if (foreignCollision) {
    throw new Error(`${product.id}: SKU already belongs to another listing, ${foreignCollision.sku}`);
  }

  if (!apply) {
    console.log(
      `[dry] ${product.id} ${product.name}: ${existing ? "update" : "create"}, ` +
        `${product.variantCount} variants, ${images.length} images, ` +
        `$${(minPriceCents / 100).toFixed(2)} minimum`,
    );
    return existing?.id ?? null;
  }

  const productPayload = {
    org_id: orgId,
    sku: panelSku,
    title: product.title,
    description: product.description,
    tags: product.tags,
    materials: product.materials,
    status: "draft",
    currency: "USD",
    price_cents: minPriceCents,
    image_url: images[0].publicUrl,
    num_images: images.length,
    quantity: 1,
    has_variations: product.variantCount > 1,
    research_keyword: product.tags[1] ?? product.tags[0],
    archived_at: null,
  };

  let productId = existing?.id;
  if (productId) {
    const { error } = await db
      .from("products")
      .update(productPayload)
      .eq("id", productId)
      .eq("org_id", orgId)
      .is("etsy_listing_id", null);
    if (error) throw new Error(`${product.id}: product update failed, ${error.message}`);
  } else {
    const { data, error } = await db.from("products").insert(productPayload).select("id").single();
    if (error || !data) throw new Error(`${product.id}: product insert failed, ${error?.message}`);
    productId = data.id;
  }

  const variantRows = product.variants.map((variant) => ({
    org_id: orgId,
    product_id: productId,
    sku: variant.sku,
    name:
      product.metalMode === "single"
        ? `${variant.metal} / US ${variant.ringSizeUs}`
        : `US ${variant.ringSizeUs}`,
    properties: variant.properties,
    price_cents: variant.priceUsd * 100,
    currency: "USD",
    quantity: variant.quantity,
    weight_grams: variant.estimatedWeightGrams,
    weight_source: "manual",
    active: true,
  }));
  const { error: variantError } = await db
    .from("product_variants")
    .upsert(variantRows, { onConflict: "org_id,sku" });
  if (variantError) throw new Error(`${product.id}: variant upsert failed, ${variantError.message}`);

  const { data: existingImages, error: imageLookupError } = await db
    .from("listing_images")
    .select("id, storage_path")
    .eq("org_id", orgId)
    .eq("product_id", productId);
  if (imageLookupError) throw new Error(`${product.id}: image lookup failed, ${imageLookupError.message}`);

  for (const image of images) {
    const payload = {
      org_id: orgId,
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

  console.log(`✓ ${product.id} ${product.name}: ${productId}`);
  return productId;
}

async function verifyListing(db, orgId, product, productId) {
  const { data: savedProduct, error: productError } = await db
    .from("products")
    .select("id, sku, status, etsy_listing_id, num_images")
    .eq("id", productId)
    .eq("org_id", orgId)
    .single();
  if (productError || !savedProduct) {
    throw new Error(`${product.id}: product verification failed, ${productError?.message}`);
  }

  const { count: variantCount, error: variantError } = await db
    .from("product_variants")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("product_id", productId)
    .eq("active", true);
  if (variantError) {
    throw new Error(`${product.id}: variant verification failed, ${variantError.message}`);
  }

  const { data: savedImages, error: imageError } = await db
    .from("listing_images")
    .select("position, url, storage_path")
    .eq("org_id", orgId)
    .eq("product_id", productId)
    .order("position", { ascending: true });
  if (imageError) {
    throw new Error(`${product.id}: image verification failed, ${imageError.message}`);
  }

  assert(savedProduct.status === "draft", `${product.id}: saved product is not a draft.`);
  assert(savedProduct.etsy_listing_id === null, `${product.id}: Etsy listing link must stay empty.`);
  assert(savedProduct.num_images === 3, `${product.id}: product image count is not 3.`);
  assert(variantCount === product.variantCount, `${product.id}: saved variant count mismatch.`);
  assert(savedImages?.length === 3, `${product.id}: saved image record count mismatch.`);
  assert(
    savedImages.every((image, index) => image.position === index && image.url && image.storage_path),
    `${product.id}: saved image order or URL is invalid.`,
  );

  console.log(
    `verified ${product.id}: draft, Etsy unlinked, ${variantCount} variants, ${savedImages.length} images`,
  );
}

async function main() {
  loadEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert(url && key, "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

  const apply = process.argv.includes("--apply");
  const selected = argumentValue("product")?.toUpperCase();
  const manifestPath = argumentValue("manifest") ?? DEFAULT_MANIFEST;
  const imageRoot = argumentValue("image-root") ?? DEFAULT_IMAGE_ROOT;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const products = selected
    ? manifest.products.filter((product) => product.id === selected)
    : manifest.products;
  assert(products.length > 0, `No matching products in manifest: ${selected ?? "all"}`);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: org, error: orgError } = await db
    .from("organizations")
    .select("id, name")
    .eq("name", "EON")
    .single();
  if (orgError || !org) throw new Error(`EON organization not found: ${orgError?.message}`);

  console.log(`${apply ? "APPLY" : "DRY RUN"}: ${products.length} product(s), org ${org.id}`);
  for (const product of products) {
    const records = imageRecords(product, imageRoot);
    validateProduct(product, records);
    const uploaded = await uploadImages(db, org.id, product, records, apply);
    const productId = await upsertListing(db, org.id, product, uploaded, apply);
    if (apply) await verifyListing(db, org.id, product, productId);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
