/**
 * Validate and import an etsy-listing-v1 manifest into Listing Suggestions.
 *
 * Safe defaults:
 * - Dry run unless --apply is present.
 * - Never calls Etsy.
 * - Never changes a product that already has an Etsy listing id.
 * - Never deletes stale variants, images or files.
 *
 * Usage:
 *   node scripts/import-etsy-listing-draft.mjs --manifest=/absolute/path/listing-manifest.json
 *   node scripts/import-etsy-listing-draft.mjs --manifest=/absolute/path/listing-manifest.json --apply
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
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

function validateManifest(manifest, manifestPath) {
  assert(manifest.protocolVersion === "etsy-listing-v1", "Unsupported protocolVersion.");
  assert(manifest.publishingMode === "panel-draft-only", "publishingMode must be panel-draft-only.");
  assert(manifest.shop?.organizationSlug, "shop.organizationSlug is required.");
  assert(manifest.shop?.currency === "USD", "Only USD manifests are supported.");
  assert(manifest.shop?.visualSystemFile, "shop.visualSystemFile is required.");

  const visualSystemPath = path.resolve(
    path.dirname(manifestPath),
    manifest.shop.visualSystemFile,
  );
  assert(existsSync(visualSystemPath), `Visual system not found: ${visualSystemPath}`);
  assert(Array.isArray(manifest.products) && manifest.products.length > 0, "products are required.");
}

function imageRecords(product, imageRoot) {
  return product.images.map((image) => ({
    ...image,
    localPath: path.join(imageRoot, image.filename),
  }));
}

function validateProduct(product, images) {
  assert(product.id && product.sku, "Product id and sku are required.");
  assert(product.sku.length <= 32, `${product.id}: family SKU exceeds 32 characters.`);
  assert(product.productType, `${product.id}: productType is required.`);
  assert(
    Array.isArray(product.taxonomy?.sellerPath) && product.taxonomy.sellerPath.length >= 2,
    `${product.id}: exact seller taxonomy path is required.`,
  );
  assert(product.production?.whoMade, `${product.id}: whoMade is required.`);
  assert(
    ["made_to_order", "2020_2026"].includes(product.production?.whenMade),
    `${product.id}: whenMade is invalid.`,
  );
  const readinessState =
    product.production?.readinessState ??
    (product.production?.whenMade === "made_to_order" ? "made_to_order" : null);
  assert(
    ["made_to_order", "ready_to_ship"].includes(readinessState),
    `${product.id}: readinessState is invalid.`,
  );
  assert(
    product.production.whenMade !== "made_to_order" ||
      readinessState === "made_to_order",
    `${product.id}: made_to_order production requires made_to_order readiness.`,
  );
  assert(
    product.production?.processingDays?.min >= 1 &&
      product.production.processingDays.max >= product.production.processingDays.min,
    `${product.id}: processing days are invalid.`,
  );
  assert(
    typeof product.production?.personalization?.enabled === "boolean",
    `${product.id}: personalization must be explicit.`,
  );
  for (const key of ["weight", "length", "width", "height"]) {
    assert(product.production?.parcel?.[key] > 0, `${product.id}: parcel ${key} is invalid.`);
  }

  const content = product.content;
  assert(content?.title && content.title.length <= 140, `${product.id}: title is invalid.`);
  assert(content?.description, `${product.id}: description is required.`);
  assert(content?.tags?.length === 13, `${product.id}: exactly 13 tags are required.`);
  assert(content.tags.every((tag) => tag.length <= 20), `${product.id}: tag exceeds 20 characters.`);
  assert(
    new Set(content.tags.map((tag) => tag.toLocaleLowerCase("en-US"))).size === 13,
    `${product.id}: tags must be unique.`,
  );
  assert(content.materials?.length > 0, `${product.id}: verified materials are required.`);

  assert(product.approval?.ownerApprovalRequiredForEtsy === true, `${product.id}: owner gate is required.`);
  assert(
    typeof product.approval?.priceReadyForEtsy === "boolean",
    `${product.id}: priceReadyForEtsy must be explicit.`,
  );
  assert(product.pricing?.maximumPromotionRate <= 0.1, `${product.id}: promotion exceeds 10 percent.`);
  assert(
    product.research?.competitors?.length >= 10,
    `${product.id}: at least 10 research observations are required.`,
  );

  assert(Array.isArray(product.variants) && product.variants.length > 0, `${product.id}: variants are required.`);
  const axes = new Set();
  const skus = new Set();
  const combinations = new Set();
  for (const variant of product.variants) {
    assert(variant.sku && variant.sku.length <= 32, `${product.id}: invalid variant SKU.`);
    assert(!skus.has(variant.sku), `${variant.sku}: duplicate SKU.`);
    skus.add(variant.sku);
    assert(variant.priceUsd > 0, `${variant.sku}: price must be positive.`);
    assert(Number.isInteger(variant.quantity) && variant.quantity >= 0, `${variant.sku}: quantity is invalid.`);
    assert(variant.estimatedTotalWeightGrams === null, `${variant.sku}: unverified total weight is forbidden.`);
    const properties = variant.properties ?? {};
    Object.keys(properties).forEach((axis) => axes.add(axis));
    const key = propertyKey(properties);
    assert(!combinations.has(key), `${variant.sku}: duplicate property combination.`);
    combinations.add(key);
  }
  assert(axes.size <= 2, `${product.id}: Etsy supports at most two variation axes.`);

  assert(images.length >= 5, `${product.id}: at least five useful listing images are required.`);
  const positions = new Set();
  for (const image of images) {
    assert(existsSync(image.localPath), `${product.id}: missing image ${image.localPath}`);
    assert(!positions.has(image.position), `${product.id}: duplicate image position.`);
    positions.add(image.position);
    assert(image.role && image.alt && image.provenance, `${product.id}: image metadata is incomplete.`);
    const dimensions = pngDimensions(image.localPath);
    assert(
      dimensions.width === image.width && dimensions.height === image.height,
      `${product.id}: ${image.filename} dimension readback mismatch.`,
    );
  }
  const primary = images.find((image) => image.position === 0);
  assert(primary?.role.toLowerCase().includes("hero"), `${product.id}: position 0 must be a hero.`);
  assert(primary?.cropSafe === true, `${product.id}: primary hero must be crop safe.`);
  assert(primary.width >= 2000 && primary.height >= 2000, `${product.id}: primary hero must be at least 2000 px.`);
}

function safeListingMetadata(manifest, product) {
  return {
    protocolVersion: manifest.protocolVersion,
    productType: product.productType,
    taxonomy: product.taxonomy,
    production: product.production,
    pricing: {
      costSource: product.pricing.costSource,
      costConfidence: product.pricing.costConfidence,
      maximumPromotionRate: product.pricing.maximumPromotionRate,
      methodology: product.pricing.methodology,
    },
    research: {
      observedAt: product.research.observedAt,
      competitorCount: product.research.competitors.length,
      sourceFile: product.research.sourceFile ?? null,
    },
    imagePlan: product.images.map(({ filename, position, role, provenance, variationValue }) => ({
      filename,
      position,
      role,
      provenance,
      variationValue: variationValue ?? null,
    })),
    approval: product.approval,
  };
}

async function uploadImages(db, organizationId, product, images, apply) {
  const records = [];
  for (const image of images) {
    const storagePath =
      `${organizationId}/etsy-listing-v1/${product.sku}/${image.filename}`;
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

async function findExistingProduct(db, organizationId, product) {
  const { data, error } = await db
    .from("products")
    .select("id, status, etsy_listing_id")
    .eq("org_id", organizationId)
    .eq("sku", product.sku)
    .maybeSingle();
  if (error) throw new Error(`${product.id}: product lookup failed, ${error.message}`);
  return data;
}

async function validateSkuCollisions(db, organizationId, product, existingId) {
  const { data, error } = await db
    .from("product_variants")
    .select("sku, product_id")
    .eq("org_id", organizationId)
    .in("sku", product.variants.map((variant) => variant.sku));
  if (error) throw new Error(`${product.id}: SKU lookup failed, ${error.message}`);
  const collision = (data ?? []).find((row) => row.product_id !== existingId);
  assert(!collision, `${product.id}: SKU belongs to another product, ${collision?.sku}`);
}

async function upsertPanelDraft(db, organizationId, manifest, product, images, apply) {
  const existing = await findExistingProduct(db, organizationId, product);
  await validateSkuCollisions(db, organizationId, product, existing?.id);
  assert(
    existing?.etsy_listing_id == null,
    `${product.id}: linked Etsy listing #${existing?.etsy_listing_id} cannot be changed by this importer.`,
  );

  const minimumPriceCents = Math.min(...product.variants.map((variant) => variant.priceUsd * 100));
  if (!apply) {
    console.log(
      `[dry] ${product.id}: ${existing ? "update" : "create"}, ` +
        `${product.variants.length} variants, ${images.length} images, ` +
        `$${(minimumPriceCents / 100).toFixed(2)} minimum`,
    );
    return existing?.id ?? null;
  }

  const payload = {
    org_id: organizationId,
    sku: product.sku,
    title: product.content.title,
    description: product.content.description,
    tags: product.content.tags,
    materials: product.content.materials,
    status: "draft",
    currency: manifest.shop.currency,
    price_cents: minimumPriceCents,
    image_url: images[0].publicUrl,
    num_images: images.length,
    quantity: 1,
    has_variations: product.variants.length > 1,
    research_keyword: product.content.tags[0],
    product_type: product.productType,
    listing_metadata: safeListingMetadata(manifest, product),
    archived_at: null,
  };

  let productId = existing?.id;
  if (productId) {
    const { error } = await db
      .from("products")
      .update(payload)
      .eq("id", productId)
      .eq("org_id", organizationId)
      .is("etsy_listing_id", null);
    if (error) throw new Error(`${product.id}: product update failed, ${error.message}`);
  } else {
    const { data, error } = await db.from("products").insert(payload).select("id").single();
    if (error || !data) throw new Error(`${product.id}: product insert failed, ${error?.message}`);
    productId = data.id;
  }

  const { data: savedVariants, error: lookupError } = await db
    .from("product_variants")
    .select("id, properties")
    .eq("org_id", organizationId)
    .eq("product_id", productId);
  if (lookupError) throw new Error(`${product.id}: variant lookup failed, ${lookupError.message}`);
  const savedByProperties = new Map(
    (savedVariants ?? []).map((variant) => [propertyKey(variant.properties), variant]),
  );
  const variantRows = product.variants.map((variant) => {
    const saved = savedByProperties.get(propertyKey(variant.properties));
    return {
      ...(saved ? { id: saved.id } : {}),
      org_id: organizationId,
      product_id: productId,
      sku: variant.sku,
      name: variant.name,
      properties: variant.properties,
      price_cents: variant.priceUsd * 100,
      currency: manifest.shop.currency,
      quantity: variant.quantity,
      weight_grams: null,
      weight_source: null,
      active: true,
    };
  });
  const { error: variantError } = await db
    .from("product_variants")
    .upsert(variantRows, { onConflict: "id" });
  if (variantError) throw new Error(`${product.id}: variant upsert failed, ${variantError.message}`);

  const { data: savedImages, error: imageLookupError } = await db
    .from("listing_images")
    .select("id, storage_path")
    .eq("org_id", organizationId)
    .eq("product_id", productId);
  if (imageLookupError) throw new Error(`${product.id}: image lookup failed, ${imageLookupError.message}`);
  for (const image of images) {
    const imagePayload = {
      org_id: organizationId,
      product_id: productId,
      url: image.publicUrl,
      storage_path: image.storagePath,
      source: image.provenance,
      alt: image.alt,
      position: image.position,
    };
    const saved = (savedImages ?? []).find((row) => row.storage_path === image.storagePath);
    const query = saved
      ? db.from("listing_images").update(imagePayload).eq("id", saved.id)
      : db.from("listing_images").insert(imagePayload);
    const { error } = await query;
    if (error) throw new Error(`${product.id}: image record failed, ${error.message}`);
  }

  return productId;
}

async function verifyPanelDraft(db, organizationId, product, productId, images) {
  const { data: savedProduct, error: productError } = await db
    .from("products")
    .select("id, sku, title, status, etsy_listing_id, num_images, price_cents, product_type, listing_metadata")
    .eq("id", productId)
    .eq("org_id", organizationId)
    .single();
  if (productError || !savedProduct) throw new Error(`${product.id}: readback failed, ${productError?.message}`);

  const { data: savedVariants, error: variantError } = await db
    .from("product_variants")
    .select("sku, properties, price_cents, weight_grams, active")
    .eq("org_id", organizationId)
    .eq("product_id", productId)
    .eq("active", true);
  if (variantError) throw new Error(`${product.id}: variant readback failed, ${variantError.message}`);

  const storagePaths = images.map((image) => image.storagePath);
  const { data: savedImages, error: imageError } = await db
    .from("listing_images")
    .select("position, url, storage_path, alt, source")
    .eq("org_id", organizationId)
    .eq("product_id", productId)
    .in("storage_path", storagePaths)
    .order("position", { ascending: true });
  if (imageError) throw new Error(`${product.id}: image readback failed, ${imageError.message}`);

  assert(savedProduct.status === "draft", `${product.id}: saved product is not a draft.`);
  assert(savedProduct.etsy_listing_id === null, `${product.id}: Etsy id must remain empty.`);
  assert(savedProduct.product_type === product.productType, `${product.id}: product type mismatch.`);
  assert(savedProduct.listing_metadata?.protocolVersion === "etsy-listing-v1", `${product.id}: protocol metadata missing.`);
  assert(savedProduct.title === product.content.title, `${product.id}: title mismatch.`);
  assert(savedVariants?.length === product.variants.length, `${product.id}: variant count mismatch.`);
  assert(savedImages?.length === images.length, `${product.id}: image count mismatch.`);
  assert(savedVariants.every((variant) => variant.weight_grams === null), `${product.id}: unverified weight introduced.`);
  console.log(
    `verified ${product.id}: panel draft, Etsy unlinked, ` +
      `${savedVariants.length} variants, ${savedImages.length} images`,
  );
}

async function main() {
  loadEnvFile();
  const manifestArgument = argumentValue("manifest");
  assert(manifestArgument, "--manifest=/absolute/path/listing-manifest.json is required.");
  const manifestPath = path.resolve(manifestArgument);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  validateManifest(manifest, manifestPath);

  const imageRoot = path.resolve(
    argumentValue("image-root") ?? path.join(path.dirname(manifestPath), "..", "03-listing-images"),
  );
  const selected = argumentValue("product")?.toUpperCase();
  const products = selected
    ? manifest.products.filter((product) => product.id.toUpperCase() === selected)
    : manifest.products;
  assert(products.length > 0, `No matching product: ${selected ?? "all"}`);
  const prepared = products.map((product) => {
    const images = imageRecords(product, imageRoot);
    validateProduct(product, images);
    return { product, images };
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert(url && key, "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: organization, error: organizationError } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", manifest.shop.organizationSlug)
    .single();
  if (organizationError || !organization) {
    throw new Error(`Organization not found: ${organizationError?.message}`);
  }

  const apply = process.argv.includes("--apply");
  console.log(`${apply ? "APPLY" : "DRY RUN"}: ${prepared.length} product(s), org ${organization.slug}`);
  for (const { product, images } of prepared) {
    const uploaded = await uploadImages(db, organization.id, product, images, apply);
    const productId = await upsertPanelDraft(
      db,
      organization.id,
      manifest,
      product,
      uploaded,
      apply,
    );
    if (apply) await verifyPanelDraft(db, organization.id, product, productId, uploaded);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
