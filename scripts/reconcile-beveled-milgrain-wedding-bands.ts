#!/usr/bin/env npx tsx

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  BEVELED_MILGRAIN_FAMILY,
  BEVELED_MILGRAIN_RING_SIZES,
  BEVELED_MILGRAIN_WIDTHS,
  buildBeveledMilgrainContent,
  buildBeveledMilgrainRepairVariants,
  selectCanonicalBeveledMilgrainVariants,
  type BeveledMilgrainVariantRow,
} from "../lib/etsy/beveled-milgrain-maintenance";

const ORG_ID = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";

interface ProductRow {
  id: string;
  etsy_listing_id: number;
  title: string;
  description: string | null;
  listing_metadata: Record<string, unknown> | null;
}

interface ProductVariantRow extends BeveledMilgrainVariantRow {
  id: string;
  product_id: string;
}

function loadEnv(path: URL): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply-panel");
  const configuredEnvPath = process.env.EON_ENV_FILE;
  const envPath = configuredEnvPath
    ? pathToFileURL(configuredEnvPath)
    : new URL("../.env.local", import.meta.url);
  const env = loadEnv(envPath);
  const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  assert(apiUrl && serviceKey, "Supabase service configuration is missing.");

  async function request<T>(
    table: string,
    query: Record<string, string>,
    options: { method?: string; body?: unknown; prefer?: string } = {},
  ): Promise<T> {
    const endpoint = new URL(`/rest/v1/${table}`, apiUrl);
    for (const [name, value] of Object.entries(query)) {
      endpoint.searchParams.set(name, value);
    }
    const response = await fetch(endpoint, {
      method: options.method ?? "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.prefer ? { Prefer: options.prefer } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`${table} ${response.status}: ${await response.text()}`);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  async function fetchAll<T>(
    table: string,
    query: Record<string, string>,
  ): Promise<T[]> {
    const pageSize = 500;
    const all: T[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const page = await request<T[]>(table, {
        ...query,
        limit: String(pageSize),
        offset: String(offset),
      });
      all.push(...page);
      if (page.length < pageSize) return all;
    }
  }

  for (const repair of BEVELED_MILGRAIN_FAMILY) {
    const products = await request<ProductRow[]>("products", {
      select: "id,etsy_listing_id,title,description,listing_metadata",
      org_id: `eq.${ORG_ID}`,
      etsy_listing_id: `eq.${repair.listingId}`,
    });
    assert(products.length === 1, `Product #${repair.listingId} was not resolved.`);
    const product = products[0];
    let rows = await fetchAll<ProductVariantRow>("product_variants", {
      select:
        "id,product_id,sku,properties,price_cents,quantity,weight_grams,active",
      org_id: `eq.${ORG_ID}`,
      product_id: `eq.${product.id}`,
      order: "sku.asc",
    });

    let canonical: BeveledMilgrainVariantRow[];
    let generated: ReturnType<typeof buildBeveledMilgrainRepairVariants> = [];
    try {
      canonical = selectCanonicalBeveledMilgrainVariants(rows, repair.code);
    } catch {
      const sourceProducts = await request<ProductRow[]>("products", {
        select: "id,etsy_listing_id,title,description,listing_metadata",
        org_id: `eq.${ORG_ID}`,
        etsy_listing_id: `eq.${repair.sourceListingId}`,
      });
      assert(
        sourceProducts.length === 1,
        `Pricing source #${repair.sourceListingId} was not resolved.`,
      );
      const sourceRows = await fetchAll<ProductVariantRow>("product_variants", {
        select:
          "id,product_id,sku,properties,price_cents,quantity,weight_grams,active",
        org_id: `eq.${ORG_ID}`,
        product_id: `eq.${sourceProducts[0].id}`,
        active: "eq.true",
        order: "sku.asc",
      });
      generated = buildBeveledMilgrainRepairVariants({
        targetRows: rows,
        sourceRows,
        code: repair.code,
        orgId: ORG_ID,
        productId: product.id,
      });
      canonical = generated;
    }

    let canonicalIds = new Set(canonical.map((row) => row.id).filter(Boolean));
    let activeRows = rows.filter((row) => row.active !== false);
    let staleActive = activeRows.filter((row) => !canonicalIds.has(row.id));
    let inactiveCanonical = canonical.filter((row) => row.active === false);
    const content = buildBeveledMilgrainContent({
      karat: repair.karat,
      color: repair.color,
    });

    console.log(
      `${apply ? "APPLY" : "DRY"} #${repair.listingId} ${repair.code}: ` +
        `${rows.length} total, ${activeRows.length} active, ` +
        `${canonical.length} canonical, ${staleActive.length} stale active, ` +
        `${inactiveCanonical.length} canonical inactive, ${generated.length} generated`,
    );
    console.log(`TITLE #${repair.listingId}: ${content.en.title}`);
    if (!apply) continue;

    if (generated.length > 0) {
      await request("product_variants", { on_conflict: "org_id,sku" }, {
        method: "POST",
        body: generated,
        prefer: "resolution=merge-duplicates,return=minimal",
      });
      rows = await fetchAll<ProductVariantRow>("product_variants", {
        select:
          "id,product_id,sku,properties,price_cents,quantity,weight_grams,active",
        org_id: `eq.${ORG_ID}`,
        product_id: `eq.${product.id}`,
        order: "sku.asc",
      });
      canonical = selectCanonicalBeveledMilgrainVariants(rows, repair.code);
      canonicalIds = new Set(canonical.map((row) => row.id).filter(Boolean));
      activeRows = rows.filter((row) => row.active !== false);
      staleActive = activeRows.filter((row) => !canonicalIds.has(row.id));
      inactiveCanonical = canonical.filter((row) => row.active === false);
    }

    for (const batch of chunks(
      inactiveCanonical.map((row) => row.id).filter((id): id is string => Boolean(id)),
      50,
    )) {
      await request("product_variants", { id: `in.(${batch.join(",")})` }, {
        method: "PATCH",
        body: { active: true },
      });
    }
    for (const batch of chunks(staleActive.map((row) => row.id), 50)) {
      await request("product_variants", { id: `in.(${batch.join(",")})` }, {
        method: "PATCH",
        body: { active: false },
      });
    }

    const metadata = product.listing_metadata ?? {};
    const previousRepair =
      metadata.variationRepair && typeof metadata.variationRepair === "object"
        ? metadata.variationRepair
        : {};
    const previousTranslations =
      metadata.translations && typeof metadata.translations === "object"
        ? metadata.translations
        : {};
    await request("products", { id: `eq.${product.id}`, org_id: `eq.${ORG_ID}` }, {
      method: "PATCH",
      body: {
        title: content.en.title,
        description: content.en.description,
        has_variations: true,
        listing_metadata: {
          ...metadata,
          listingProtocol: "wedding_band",
          taxonomy: {
            sellerPath: [
              "Jewelry",
              "Rings",
              "Wedding & Engagement",
              "Wedding Bands",
            ],
            source:
              "https://www.etsy.com/c/jewelry/rings/wedding-and-engagement/wedding-bands",
            verifiedAt: "2026-09-03",
            liveSellerTaxonomyReadbackRequired: true,
          },
          translations: {
            ...previousTranslations,
            es: content.es,
          },
          variationRepair: {
            ...previousRepair,
            status: "ready",
            family: "beveled-milgrain",
            reconciledAt: new Date().toISOString(),
            expectedVariantCount: canonical.length,
            widthCount: BEVELED_MILGRAIN_WIDTHS.length,
            ringSizeCount: BEVELED_MILGRAIN_RING_SIZES.length,
            targetWidths: [...BEVELED_MILGRAIN_WIDTHS],
            targetRingSizes: [...BEVELED_MILGRAIN_RING_SIZES],
          },
        },
      },
    });

    const readbackRows = await fetchAll<ProductVariantRow>("product_variants", {
      select:
        "id,product_id,sku,properties,price_cents,quantity,weight_grams,active",
      org_id: `eq.${ORG_ID}`,
      product_id: `eq.${product.id}`,
      active: "eq.true",
      order: "sku.asc",
    });
    const readbackCanonical = selectCanonicalBeveledMilgrainVariants(
      readbackRows,
      repair.code,
    );
    assert(
      readbackRows.length === readbackCanonical.length,
      `#${repair.listingId} has stale active variants after reconciliation.`,
    );
    const readbackProducts = await request<ProductRow[]>("products", {
      select: "id,etsy_listing_id,title,description,listing_metadata",
      id: `eq.${product.id}`,
      org_id: `eq.${ORG_ID}`,
    });
    const readback = readbackProducts[0];
    assert(readback?.title === content.en.title, `#${repair.listingId} title failed.`);
    assert(
      readback?.description === content.en.description,
      `#${repair.listingId} description failed.`,
    );
    const readbackSpanish = (
      readback?.listing_metadata?.translations as
        | Record<string, { title?: string; description?: string }>
        | undefined
    )?.es;
    assert(
      readbackSpanish?.title === content.es.title &&
        readbackSpanish.description === content.es.description,
      `#${repair.listingId} Spanish translation failed.`,
    );
    console.log(
      `VERIFIED #${repair.listingId}: ${readbackRows.length} active panel variants, English and Spanish content`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
