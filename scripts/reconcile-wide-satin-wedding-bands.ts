#!/usr/bin/env npx tsx

import { readFileSync } from "node:fs";

import {
  WIDE_SATIN_RING_SIZES,
  WIDE_SATIN_WIDTHS,
  buildWideSatinDescription,
  buildWideSatinRepairVariants,
  buildWideSatinSpanishContent,
  selectCanonicalWideSatinVariants,
  type WideSatinVariantRow,
} from "../lib/etsy/wide-satin-maintenance";

const ORG_ID = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";
const REPAIRS = [
  { listingId: 4554024684, code: "WS10R", karat: "10K", color: "Rose" },
  { listingId: 4554024474, code: "WS10W", karat: "10K", color: "White" },
  { listingId: 4554014095, code: "WS10Y", karat: "10K", color: "Yellow" },
  { listingId: 4554025524, code: "WS14R", karat: "14K", color: "Rose" },
  { listingId: 4554025048, code: "WS14W", karat: "14K", color: "White" },
  {
    listingId: 4554025310,
    code: "WS14Y",
    karat: "14K",
    color: "Yellow",
    sourceListingId: 4562945910,
  },
  { listingId: 4554017181, code: "WS18R", karat: "18K", color: "Rose" },
  { listingId: 4554027532, code: "WS18W", karat: "18K", color: "White" },
  { listingId: 4554017323, code: "WS18Y", karat: "18K", color: "Yellow" },
] as const;

interface ProductRow {
  id: string;
  etsy_listing_id: number;
  title: string;
  description: string | null;
  listing_metadata: Record<string, unknown> | null;
}

interface ProductVariantRow extends WideSatinVariantRow {
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
  const env = loadEnv(new URL("../.env.local", import.meta.url));
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

  for (const repair of REPAIRS) {
    const products = await request<ProductRow[]>("products", {
      select: "id,etsy_listing_id,title,description,listing_metadata",
      org_id: `eq.${ORG_ID}`,
      etsy_listing_id: `eq.${repair.listingId}`,
    });
    assert(products.length === 1, `Product #${repair.listingId} was not resolved.`);
    const product = products[0];
    let rows = await fetchAll<ProductVariantRow>("product_variants", {
      select: "id,product_id,sku,properties,price_cents,quantity,weight_grams,active",
      org_id: `eq.${ORG_ID}`,
      product_id: `eq.${product.id}`,
      order: "sku.asc",
    });
    let canonical: WideSatinVariantRow[];
    let generated: ReturnType<typeof buildWideSatinRepairVariants> = [];
    try {
      canonical = selectCanonicalWideSatinVariants(rows, repair.code);
    } catch (error) {
      if (!("sourceListingId" in repair)) throw error;
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
        select: "id,product_id,sku,properties,price_cents,quantity,weight_grams,active",
        org_id: `eq.${ORG_ID}`,
        product_id: `eq.${sourceProducts[0].id}`,
        active: "eq.true",
        order: "sku.asc",
      });
      generated = buildWideSatinRepairVariants({
        targetRows: rows,
        sourceRows,
        code: repair.code,
        orgId: ORG_ID,
        productId: product.id,
      });
      canonical = generated;
    }
    const canonicalIds = new Set(canonical.map((row) => row.id));
    const activeRows = rows.filter((row) => row.active !== false);
    const staleActive = activeRows.filter((row) => !canonicalIds.has(row.id));
    const inactiveCanonical = canonical.filter((row) => row.active === false);
    const title =
      `${repair.karat} Solid ${repair.color} Gold Wedding Band, ` +
      "Wide Satin Center with Polished Edges, 4mm to 8mm";
    const description = buildWideSatinDescription(product.description ?? "");
    const spanish = buildWideSatinSpanishContent({
      karat: repair.karat,
      color: repair.color,
    });

    console.log(
      `${apply ? "APPLY" : "DRY"} #${repair.listingId} ${repair.code}: ` +
        `${rows.length} total, ${activeRows.length} active, ${canonical.length} canonical, ` +
        `${staleActive.length} stale active, ${inactiveCanonical.length} canonical inactive, ` +
        `${generated.length} generated`,
    );
    console.log(`TITLE #${repair.listingId}: ${title}`);
    if (!apply) continue;

    if (generated.length) {
      await request("product_variants", { on_conflict: "org_id,sku" }, {
        method: "POST",
        body: generated,
        prefer: "resolution=merge-duplicates,return=minimal",
      });
      rows = await fetchAll<ProductVariantRow>("product_variants", {
        select: "id,product_id,sku,properties,price_cents,quantity,weight_grams,active",
        org_id: `eq.${ORG_ID}`,
        product_id: `eq.${product.id}`,
        order: "sku.asc",
      });
      canonical = selectCanonicalWideSatinVariants(rows, repair.code);
      canonicalIds.clear();
      for (const row of canonical) canonicalIds.add(row.id);
      activeRows.splice(0, activeRows.length, ...rows.filter((row) => row.active !== false));
      staleActive.splice(
        0,
        staleActive.length,
        ...activeRows.filter((row) => !canonicalIds.has(row.id)),
      );
      inactiveCanonical.splice(
        0,
        inactiveCanonical.length,
        ...canonical.filter((row) => row.active === false),
      );
    }

    for (const batch of chunks(inactiveCanonical.map((row) => row.id), 50)) {
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
    await request("products", { id: `eq.${product.id}`, org_id: `eq.${ORG_ID}` }, {
      method: "PATCH",
      body: {
        title,
        description,
        has_variations: true,
        listing_metadata: {
          ...metadata,
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
            ...(metadata.translations && typeof metadata.translations === "object"
              ? metadata.translations
              : {}),
            es: spanish,
          },
          variationRepair: {
            ...previousRepair,
            status: "ready",
            reconciledAt: new Date().toISOString(),
            expectedVariantCount: canonical.length,
            widthCount: WIDE_SATIN_WIDTHS.length,
            ringSizeCount: WIDE_SATIN_RING_SIZES.length,
            targetWidths: [...WIDE_SATIN_WIDTHS],
            targetRingSizes: [...WIDE_SATIN_RING_SIZES],
          },
        },
      },
    });

    const readbackRows = await fetchAll<ProductVariantRow>("product_variants", {
      select: "id,product_id,sku,properties,price_cents,quantity,active",
      org_id: `eq.${ORG_ID}`,
      product_id: `eq.${product.id}`,
      active: "eq.true",
      order: "sku.asc",
    });
    const readbackCanonical = selectCanonicalWideSatinVariants(
      readbackRows,
      repair.code,
    );
    assert(
      readbackRows.length === readbackCanonical.length,
      `#${repair.listingId} has stale active variants after reconciliation.`,
    );
    const readbackProduct = await request<ProductRow[]>("products", {
      select: "id,etsy_listing_id,title,description,listing_metadata",
      id: `eq.${product.id}`,
      org_id: `eq.${ORG_ID}`,
    });
    assert(readbackProduct[0]?.title === title, `#${repair.listingId} title readback failed.`);
    assert(
      readbackProduct[0]?.description === description,
      `#${repair.listingId} description readback failed.`,
    );
    console.log(
      `VERIFIED #${repair.listingId}: ${readbackRows.length} active panel variants, title and description`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
