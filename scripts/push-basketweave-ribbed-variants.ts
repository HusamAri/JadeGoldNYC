#!/usr/bin/env npx ts-node
/**
 * Push basketweave (1006) and ribbed (1007) newly-added 2-5mm variants to Etsy.
 * These variants were added via migration to bring parity with hammered milgrain pricing.
 */

import { createClient } from "@supabase/supabase-js";

const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!PROJECT_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(PROJECT_URL, SERVICE_ROLE);

const PRODUCT_IDS = [
  "9a17db53-8028-40c1-b051-aeb0b2688a32", // basketweave
  "9add2f08-3115-4d0f-ab89-3a892a1bb649", // ribbed
];

const ETSY_LISTING_IDS: Record<string, number> = {
  "9a17db53-8028-40c1-b051-aeb0b2688a32": 4548151075,
  "9add2f08-3115-4d0f-ab89-3a892a1bb649": 4548164284,
};

async function pushVariantsForProduct(productId: string) {
  console.log(
    `\n📤 Pushing variants for product ${productId} (Etsy ${ETSY_LISTING_IDS[productId]})...`,
  );

  // Fetch product with variants
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select(
      `
      id, title, etsy_listing_id,
      product_variants (sku, price_cents, quantity, weight_grams, properties)
    `,
    )
    .eq("id", productId)
    .single();

  if (prodErr || !product) {
    console.error(`Error fetching product: ${prodErr?.message}`);
    return false;
  }

  const variants = (product.product_variants as any[]) || [];
  console.log(`  Found ${variants.length} variants`);

  // Group by width to see coverage
  const widthMap: Record<number, number> = {};
  variants.forEach((v) => {
    const match = v.sku?.match(/-(\d+)MM-/);
    if (match) {
      const width = parseInt(match[1]);
      widthMap[width] = (widthMap[width] || 0) + 1;
    }
  });

  console.log(
    `  Widths coverage:`,
    Object.entries(widthMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([w, count]) => `${w}mm (${count})`)
      .join(", "),
  );

  // Import pushPanelVariantsToListing
  const { pushPanelVariantsToListing } = await import(
    "@/lib/etsy/inventory"
  );
  const { EtsyClient } = await import("@/lib/etsy/client");

  try {
    // Get Etsy client
    const org = await supabase
      .from("products")
      .select("org_id")
      .eq("id", productId)
      .single();

    if (!org.data) {
      console.error("Cannot find org_id for product");
      return false;
    }

    const client = await EtsyClient.forOrg(org.data.org_id);

    // Transform variants to camelCase
    const panelVariants = variants.map((v) => ({
      sku: v.sku,
      priceCents: v.price_cents,
      quantity: v.quantity || 20,
      properties: v.properties,
    }));

    const outcome = await pushPanelVariantsToListing(
      client,
      product.etsy_listing_id,
      panelVariants,
    );

    if (outcome.status === "updated") {
      console.log(
        `  ✅ Updated ${outcome.updated} variants, ${outcome.missing.length} missing`,
      );
      if (outcome.missing.length > 0) {
        console.log(`     Missing SKUs: ${outcome.missing.join(", ")}`);
      }
    } else {
      console.log(`  ⚠️  Status: ${outcome.status}`);
      if (outcome.missing.length > 0) {
        console.log(`     Missing SKUs: ${outcome.missing.join(", ")}`);
      }
    }

    return true;
  } catch (err) {
    console.error(`  Error pushing variants:`, err);
    return false;
  }
}

async function main() {
  console.log("🎯 Pushing basketweave & ribbed 2-5mm variants to Etsy...\n");

  let success = 0;
  for (const productId of PRODUCT_IDS) {
    if (await pushVariantsForProduct(productId)) {
      success++;
    }
  }

  console.log(
    `\n✨ Done: ${success}/${PRODUCT_IDS.length} products pushed successfully`,
  );
  process.exit(success === PRODUCT_IDS.length ? 0 : 1);
}

main();
