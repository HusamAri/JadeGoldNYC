import type { SupabaseClient } from "@supabase/supabase-js";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const EON_ORG_ID = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";
const EON_SHOP_ID = 61324215;
const PAGE_SIZE = 1_000;
// Supabase/PostgREST may cap an individual response at 1,000 rows.
const MAX_PAGE_SIZE = 1_000;
const MAX_ROWS = 100_000;
const MAX_RESPONSE_BYTES = 4_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRODUCTS_FIELDS = [
  "id", "org_id", "etsy_listing_id", "sku", "title", "status", "price_cents", "currency",
  "weight_grams", "quantity", "has_variations", "product_type", "listing_metadata",
  "materials", "discount_pct", "discount_start_at", "discount_end_at", "discount_min_order_cents",
  "stone_shape", "stone_color", "stone_clarity", "stone_origin", "stone_count",
  "setting_fee_cents", "casting_fee_cents", "archived_at", "etsy_deleted_at",
  "created_at", "updated_at",
].join(",");
const VARIANTS_FIELDS = [
  "id", "org_id", "product_id", "etsy_listing_id", "etsy_product_id", "sku", "name",
  "properties", "price_cents", "currency", "quantity", "weight_grams", "weight_source",
  "active", "stone_carat", "stone_cost_cents", "stone_cost_source", "created_at", "updated_at",
].join(",");
const CONFIG_FIELDS = [
  "org_id", "spot_usd_per_ozt", "fire_factor", "labor_usd", "labor_handfinished_usd",
  "packaging_usd", "shipping_usd", "multiplier_narrow", "multiplier_wide",
  "wide_band_min_mm", "sale_rate", "updated_at",
].join(",");

type CatalogTable = "products" | "product_variants";
type CatalogRow = Record<string, unknown> & { id: string };
type OutputFormat = "html" | "json";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const SENSITIVE_KEY = /(?:^|[_-])(?:access[_-]?token|refresh[_-]?token|api[_-]?key|client[_-]?secret|password|credential|authorization|secret|token)(?:$|[_-])/i;

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) =>
      [key, SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactSensitive(nested)]));
  }
  return value;
}

function response(value: unknown, status: number, format: OutputFormat): Response {
  const serialized = JSON.stringify(redactSensitive(value), null, format === "html" ? 2 : undefined) ?? "null";
  const nextPage = value !== null && typeof value === "object" && "next_page" in value &&
    typeof value.next_page === "string" && value.next_page.startsWith("/api/ops/eon-price-audit?")
    ? value.next_page : null;
  const navigation = format === "html"
    ? `<nav><a href="/api/ops/eon-price-audit?entity=products">Products</a> · <a href="/api/ops/eon-price-audit?entity=variants">Variants</a>${nextPage ? ` · <a rel="next" href="${escapeHtml(nextPage)}">Next page</a>` : ""}</nav>`
    : "";
  const body = format === "html"
    ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>EON price audit</title></head><body><main><h1>EON price audit</h1>${navigation}<pre id="price-audit-records">${escapeHtml(serialized)}</pre></main></body></html>`
    : serialized;
  if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
    // Never return a truncated catalog or silently omit costly variants.
    return response({
      error: "Export exceeds response size limit; use entity=products or entity=variants with cursor pagination.",
      complete: false,
      max_response_bytes: MAX_RESPONSE_BYTES,
    }, 413, format);
  }
  return new Response(body, {
    status,
    headers: {
      "Content-Type": format === "html" ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Vary: "Cookie",
      "Content-Security-Policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function isRow(value: unknown): value is CatalogRow {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    typeof (value as { id?: unknown }).id === "string" && UUID.test((value as { id: string }).id);
}

function tableFields(table: CatalogTable): string {
  return table === "products" ? PRODUCTS_FIELDS : VARIANTS_FIELDS;
}

async function exactCount(client: SupabaseClient, table: CatalogTable): Promise<number> {
  const { count, error } = await client.from(table).select("id", { count: "exact", head: true })
    .eq("org_id", EON_ORG_ID);
  if (error || count == null || !Number.isSafeInteger(count) || count < 0) {
    throw new Error(`${table} exact count could not be read`);
  }
  return count;
}

async function page(
  client: SupabaseClient,
  table: CatalogTable,
  cursor: string | null,
  size: number,
): Promise<{ rows: CatalogRow[]; remaining: number }> {
  let countQuery = client.from(table).select("id", { count: "exact", head: true })
    .eq("org_id", EON_ORG_ID);
  let rowsQuery = client.from(table).select(tableFields(table)).eq("org_id", EON_ORG_ID)
    .order("id", { ascending: true }).limit(size);
  if (cursor) {
    countQuery = countQuery.gt("id", cursor);
    rowsQuery = rowsQuery.gt("id", cursor);
  }
  const [countResult, rowsResult] = await Promise.all([countQuery, rowsQuery]);
  if (countResult.error || rowsResult.error || countResult.count == null) {
    throw new Error(`${table} page could not be read`);
  }
  const remaining = countResult.count;
  const rows = (rowsResult.data ?? []) as unknown[];
  if (!Number.isSafeInteger(remaining) || remaining < 0 || rows.length !== Math.min(size, remaining) ||
    !rows.every(isRow) || new Set(rows.map((row) => (row as CatalogRow).id)).size !== rows.length) {
    throw new Error(`${table} page is incomplete or malformed`);
  }
  return { rows: rows as CatalogRow[], remaining };
}

async function allRows(client: SupabaseClient, table: CatalogTable): Promise<CatalogRow[]> {
  const total = await exactCount(client, table);
  if (total > MAX_ROWS) throw new Error(`${table} exceeds full-export safety bound; use cursor pagination`);
  const rows: CatalogRow[] = [];
  const ids = new Set<string>();
  let cursor: string | null = null;
  while (rows.length < total) {
    const batch = await page(client, table, cursor, PAGE_SIZE);
    if (batch.rows.length === 0) throw new Error(`${table} ended before exact count`);
    for (const row of batch.rows) {
      if (ids.has(row.id)) throw new Error(`${table} duplicate id during export`);
      ids.add(row.id);
      rows.push(row);
    }
    cursor = batch.rows.at(-1)!.id;
    if (rows.length > total) throw new Error(`${table} exceeded exact count`);
  }
  if ((await exactCount(client, table)) !== total || (await page(client, table, cursor, 1)).remaining !== 0) {
    throw new Error(`${table} changed during export; retry`);
  }
  return rows;
}

async function pricingContext(client: SupabaseClient) {
  const [configResult, basisResult] = await Promise.all([
    client.from("pricing_config").select(CONFIG_FIELDS).eq("org_id", EON_ORG_ID).maybeSingle(),
    client.from("gold_reprice_basis").select("id,org_id,spot_per_ozt,source,note,created_at")
      .eq("org_id", EON_ORG_ID).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (configResult.error || basisResult.error) throw new Error("EON pricing context could not be read");
  return { config: configResult.data, latest_applied_gold_basis: basisResult.data };
}

function dataGaps(products: CatalogRow[], variants: CatalogRow[], context: Awaited<ReturnType<typeof pricingContext>>) {
  const productIds = new Set(products.map((product) => product.id));
  const examples: Array<{ kind: string; sku: unknown; id: string }> = [];
  const counts: Record<string, number> = {};
  const observations = { unverified_weight_source_count: 0, product_metadata_missing_count: 0 };
  const gap = (kind: string, row: CatalogRow) => {
    counts[kind] = (counts[kind] ?? 0) + 1;
    if (examples.length < 100) examples.push({ kind, sku: row.sku ?? null, id: row.id });
  };
  for (const variant of variants) {
    if (variant.product_id == null || !productIds.has(String(variant.product_id))) gap("variant_product_missing", variant);
    if (variant.active === true && !(typeof variant.price_cents === "number" && Number.isFinite(variant.price_cents) && variant.price_cents > 0)) gap("active_variant_price_missing", variant);
    if (variant.active === true && !(typeof variant.weight_grams === "number" && Number.isFinite(variant.weight_grams) && variant.weight_grams > 0)) gap("active_variant_weight_missing", variant);
    if (variant.currency !== "USD") gap("variant_non_usd_currency", variant);
    if (variant.stone_carat != null && !(typeof variant.stone_cost_cents === "number" && Number.isFinite(variant.stone_cost_cents) && variant.stone_cost_cents > 0)) gap("stone_cost_missing", variant);
    if (variant.active === true && (typeof variant.weight_source !== "string" || !variant.weight_source.trim())) observations.unverified_weight_source_count++;
  }
  for (const product of products) {
    if (product.currency !== "USD") gap("product_non_usd_currency", product);
    if (product.listing_metadata == null) observations.product_metadata_missing_count++;
  }
  if (!context.config) counts.pricing_config_missing = 1;
  if (!context.latest_applied_gold_basis) counts.latest_gold_basis_missing = 1;
  return { counts, examples, observations, basic_panel_fields_complete: Object.keys(counts).length === 0,
    not_a_profit_audit: true,
    note: "Cost, weight provenance, Etsy price freshness, 30% sale, 7-day timing, $50 net and $100 labor floors are not validated by this export." };
}

async function etsySnapshot(client: SupabaseClient, productId: string | null, listingId: number | null) {
  if (!productId && !listingId) throw new Error("Specify productId or listingId for a single Etsy snapshot");
  let query = client.from("products").select("id,org_id,etsy_listing_id,sku,title,status,price_cents,currency")
    .eq("org_id", EON_ORG_ID);
  if (productId) query = query.eq("id", productId);
  if (listingId) query = query.eq("etsy_listing_id", listingId);
  const { data: product, error } = await query.maybeSingle();
  if (error || !product || product.etsy_listing_id == null) throw new Error("Exact EON Etsy-linked product could not be verified");
  const etsy = await EtsyClient.forOrg(EON_ORG_ID);
  if ((await etsy.requireShopId()) !== EON_SHOP_ID) throw new Error("Connected Etsy shop does not match EON");
  const id = Number(product.etsy_listing_id);
  const [listing, inventory] = await Promise.all([
    etsy.get<Record<string, unknown>>(etsyPaths.listing(id)),
    etsy.get<Record<string, unknown>>(etsyPaths.listingInventory(id), {
      show_deleted: "false", max_variations_supported: 3,
    }),
  ]);
  if (listing.listing_id !== id || listing.shop_id !== EON_SHOP_ID || !Array.isArray(inventory.products)) {
    throw new Error("Etsy listing/shop/inventory readback does not match requested EON product");
  }
  return {
    product,
    observed_at: new Date().toISOString(),
    listing,
    inventory,
    note: "Etsy GET may refresh OAuth tokens and quota metadata; this endpoint never calls Etsy inventory/listing writes.",
  };
}

/** Cookie-authenticated, manager-only EON catalog evidence; no price or Etsy mutation. */
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const requestedFormat = params.get("format") ?? "html";
  const format: OutputFormat = requestedFormat === "json" ? "json" : "html";
  const respond = (value: unknown, status = 200) => response(value, status, format);
  const membership = await requireMembership();
  if (!isManager(membership.role)) return respond({ error: MANAGER_ONLY_ERROR }, 403);
  if (membership.org_id !== EON_ORG_ID) return respond({ error: "Active organization is not EON." }, 403);
  if (requestedFormat !== "html" && requestedFormat !== "json") return respond({ error: "format must be html or json." }, 400);

  const entity = params.get("entity") ?? "all";
  if (!["all", "products", "variants", "config", "etsy"].includes(entity)) {
    return respond({ error: "entity must be all, products, variants, config, or etsy." }, 400);
  }
  const productId = params.get("productId");
  if (productId && !UUID.test(productId)) return respond({ error: "productId must be a UUID." }, 400);
  const listingIdText = params.get("listingId");
  if (listingIdText && !/^\d+$/.test(listingIdText)) return respond({ error: "listingId must be a positive integer." }, 400);
  const listingId = listingIdText ? Number(listingIdText) : null;
  if (listingId !== null && (!Number.isSafeInteger(listingId) || listingId <= 0)) {
    return respond({ error: "listingId must be a positive safe integer." }, 400);
  }
  if ((productId || listingId) && entity !== "all" && entity !== "etsy") {
    return respond({ error: "productId/listingId are only valid for entity=all or entity=etsy." }, 400);
  }
  if (entity === "etsy" && !productId && !listingId) {
    return respond({ error: "entity=etsy requires an exact productId or listingId." }, 400);
  }
  const cursor = params.get("cursor");
  const pageSizeText = params.get("page_size") ?? String(PAGE_SIZE);
  const pageSize = Number(pageSizeText);
  if (entity === "products" || entity === "variants") {
    if ((params.has("cursor") && (!cursor || !UUID.test(cursor))) || !/^\d+$/.test(pageSizeText) ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      return respond({ error: `cursor must be a UUID and page_size must be 1..${MAX_PAGE_SIZE}.` }, 400);
    }
  } else if (params.has("cursor") || params.has("page_size")) {
    return respond({ error: "cursor/page_size require entity=products or entity=variants." }, 400);
  }

  try {
    const client = await createClient();
    const { data: organization, error: orgError } = await client.from("organizations")
      .select("id,name,slug,etsy_shop_id").eq("id", EON_ORG_ID).maybeSingle();
    if (orgError || !organization || organization.id !== EON_ORG_ID ||
      (organization.etsy_shop_id != null && organization.etsy_shop_id !== EON_SHOP_ID)) {
      return respond({ error: "EON organization identity could not be verified." }, 409);
    }
    if (entity === "etsy") {
      try {
        return respond({ mode: "etsy", organization, snapshot: await etsySnapshot(client, productId, listingId) });
      } catch {
        return respond({ error: "The requested EON Etsy snapshot could not be verified. Catalog export remains available without entity=etsy." }, 502);
      }
    }
    if (entity === "config") {
      const context = await pricingContext(client);
      return respond({ mode: "config", organization, observed_at: new Date().toISOString(), context,
        errors: [!context.config ? "pricing_config_missing" : null, !context.latest_applied_gold_basis ? "latest_gold_basis_missing" : null].filter(Boolean) },
      !context.config ? 422 : 200);
    }
    if (entity === "products" || entity === "variants") {
      const table = entity === "products" ? "products" : "product_variants";
      const total = await exactCount(client, table);
      const result = await page(client, table, cursor, pageSize);
      if ((await exactCount(client, table)) !== total) throw new Error("Catalog changed during page read");
      const complete = result.remaining <= result.rows.length;
      const nextCursor = complete ? null : result.rows.at(-1)?.id ?? null;
      if (!complete && !nextCursor) throw new Error("Page cursor missing for incomplete export");
      const next = new URLSearchParams({ entity, page_size: String(pageSize), format });
      if (nextCursor) next.set("cursor", nextCursor);
      return respond({ mode: "page", organization, entity, observed_at: new Date().toISOString(),
        total_records_at_read: total, page_records: result.rows.length, cursor, next_cursor: nextCursor,
        complete, next_page: nextCursor ? `/api/ops/eon-price-audit?${next}` : null,
        records: result.rows,
        note: "Each page is exact-count checked, but multiple HTTP pages are not a database transaction snapshot." });
    }

    const observedStart = new Date().toISOString();
    const [products, variants, context] = await Promise.all([
      allRows(client, "products"), allRows(client, "product_variants"), pricingContext(client),
    ]);
    if (products.length === 0 || variants.length === 0) {
      return respond({ error: "EON product/variant catalog is empty or unavailable; no pricing assessment is possible.",
        counts: { products: products.length, variants: variants.length }, complete: false }, 409);
    }
    const quality = dataGaps(products, variants, context);
    const snapshot = (productId || listingId) ? await etsySnapshot(client, productId, listingId) : null;
    return respond({
      mode: "all", organization, observed_from: observedStart, observed_until: new Date().toISOString(),
      complete_export: true, transaction_snapshot: false,
      counts: { products: products.length, variants: variants.length },
      pricing_context: context, data_quality: quality,
      products, variants, etsy_snapshot: snapshot,
      note: "Panel data is not necessarily current Etsy pricing. A single Etsy snapshot is included only when exact productId/listingId is supplied; no shop-wide Etsy fetch is performed.",
    }, quality.basic_panel_fields_complete ? 200 : 422);
  } catch {
    return respond({ error: "Complete EON price evidence could not be read or verified; no partial data returned.", complete: false }, 500);
  }
}
