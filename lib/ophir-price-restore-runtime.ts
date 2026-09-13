import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  buildOphirPriceRestore,
  canonicalOphirInventory,
  canonicalOphirInventoryNonPrice,
} from "@/lib/etsy/ophir-price-restore";
import {
  buildOphirPriceRestorePlan,
  classifyOphirPriceRestoreCurrentValue,
  OPHIR_PRICE_RESTORE_WINDOW,
  type OphirPriceAuditIdentity,
  type OphirPriceAuditRecord,
  type OphirPriceRestorePlan,
  type OphirProductRestoreAnchor,
  type OphirVariantRestoreTarget,
} from "@/lib/ophir-price-restore-plan";

export const OPHIR_RESTORE_SHOP_ID = 66_983_205;
// Pin the hash recovered from the complete authenticated audit export before enabling POST.
export const EXPECTED_OPHIR_RESTORE_MANIFEST_HASH = "97ff79e7959c85d19ac322962bc565b6f4304d84ff7b189aafa9994f372e1494";
const PAGE_SIZE = 1_000;
const MAX_AUDIT_ROWS = 100_000;
const MAX_CAS_PAIRS = 50;
const AUDIT_IDENTITY_FIELDS = ["id", "sku", "product_id", "etsy_listing_id", "currency", "price_cents"] as const;
// JSON -> preserves numeric/null values; no unrelated full-row diff is transferred.
const AUDIT_FIELDS = "id, created_at, entity_type, entity_id, " + ["before", "after"]
  .flatMap((side) => AUDIT_IDENTITY_FIELDS.map((field) => `${side}_${field}:diff->${side}->${field}`)).join(", ");
const READ_ATTEMPTS = 3;
const TRANSIENT_DATABASE_CODES = new Set([
  "40001", "40P01", "53300", "55P03", "57014", "57P01", "57P02", "57P03",
  "PGRST001", "PGRST002", "PGRST003",
]);
const CURRENT_FIELDS = "id, sku, product_id, etsy_listing_id, currency, price_cents";

type Entity = "product_variants" | "products";
type Row = Record<string, unknown>;
type AuditRow = Row & {
  id: string;
  created_at: string;
  entity_type: Entity;
  entity_id: string;
};
export type OphirRestoreListing = OphirPriceRestorePlan["listingGroups"][number];
export interface OphirRestorePreviewProof {
  currentInventoryHash: string;
  expectedInventoryHash: string;
  nonPriceHash: string;
  currentDbHash: string;
}

/** Compact, exact historical values. These are audit values, not current Etsy observations. */
export function ophirRestorePricesCsv(plan: OphirPriceRestorePlan, selectedListingIds?: readonly number[]): string {
  const selected = selectedListingIds ? new Set(selectedListingIds) : null;
  const cell = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const rows: (string | number | null)[][] = [["record_type", "entity_id", "listing_id", "sku", "currency", "prior_cents", "last_change_cents"]];
  for (const target of plan.manifest) {
    if (!selected || selected.has(target.listingId)) rows.push(["variant", target.variantId, target.listingId, target.sku, target.currency, target.beforeCents, target.afterCents]);
  }
  for (const anchor of plan.productAnchors) {
    if (!selected || selected.has(anchor.listingId)) rows.push(["product_anchor", anchor.productId, anchor.listingId, anchor.sku, anchor.currency, anchor.beforeCents, anchor.afterCents]);
  }
  return rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Reconcile the workbook's color-collapsed rows without exporting verbose before/after JSON. */
export function ophirRestoreGridSummary(plan: OphirPriceRestorePlan) {
  const groups = new Map<string, { listing_id: number; karat: string; size: string; variants: OphirVariantRestoreTarget[] }>();
  const unparsed: string[] = [];
  for (const target of plan.manifest) {
    const match = /^OPH-(\d+)-(10|14|18)[RYW]-(\d{1,2}(?:\.\d{1,2})?)$/.exec(target.sku);
    if (!match || Number(match[1]) !== target.listingId) { unparsed.push(target.sku); continue; }
    const karat = `${match[2]}K`;
    const size = String(Number(match[3]));
    const key = `${target.listingId}:${karat}:${size}`;
    const group = groups.get(key) ?? { listing_id: target.listingId, karat, size, variants: [] };
    group.variants.push(target);
    groups.set(key, group);
  }
  const mixed = Array.from(groups.values()).filter((group) => new Set(group.variants.map((v) => v.beforeCents)).size > 1);
  return { grouping: "Listing, karat, and US size parsed from audited SKU", audited_price_groups: groups.size,
    unparsed_audited_sku_count: unparsed.length, unparsed_audited_skus: unparsed,
    groups_with_different_prior_color_prices: mixed.length,
    variants_in_groups_with_different_prior_color_prices: mixed.reduce((count, group) => count + group.variants.length, 0),
    different_prior_color_price_groups: mixed.map((group) => ({ listing_id: group.listing_id, karat: group.karat, size: group.size,
      prior_min_cents: Math.min(...group.variants.map((v) => v.beforeCents)), prior_max_cents: Math.max(...group.variants.map((v) => v.beforeCents)),
      last_change_min_cents: Math.min(...group.variants.map((v) => v.afterCents)), last_change_max_cents: Math.max(...group.variants.map((v) => v.afterCents)),
      variants: group.variants.map((v) => ({ variant_id: v.variantId, sku: v.sku, prior_cents: v.beforeCents, last_change_cents: v.afterCents })) })),
    note: "This summary contains audited offerings only. Offerings unchanged by the last operation are absent; compare total changed offerings and the differing prior color groups with the workbook." };
}
export interface OphirRestoreListingResult {
  listingId: number;
  productId: string;
  mode: "dry-run" | "apply";
  status: "verified" | "failed";
  stage: string;
  targetVariants: number;
  etsyPricesChanged: number;
  etsyAlreadyRestored: number;
  dbVariantsChanged: number;
  dbAnchorChanged: boolean;
  etsyWriteAttempted: boolean;
  nonPriceFieldsPreserved: boolean;
  auditWritten: boolean;
  proof?: OphirRestorePreviewProof;
  error?: string;
  prices?: { sku: string; currentCents: number; targetCents: number; status: string }[];
}

export class OphirRestoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OphirRestoreError";
  }
}

function fail(message: string): never { throw new OphirRestoreError(message); }
function object(value: unknown): Row | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
}
function text(value: unknown) { return typeof value === "string" ? value : null; }
function integer(value: unknown) { return typeof value === "number" && Number.isSafeInteger(value) ? value : null; }
function identity(value: Row): OphirPriceAuditIdentity {
  return {
    id: text(value.id), sku: text(value.sku), product_id: text(value.product_id),
    etsy_listing_id: integer(value.etsy_listing_id), currency: text(value.currency),
    price_cents: integer(value.price_cents),
  };
}
function priceChange(row: AuditRow): OphirPriceAuditRecord | null {
  const projected = (side: string): Row => Object.fromEntries(AUDIT_IDENTITY_FIELDS.map((field) => [field, row[`${side}_${field}`]]));
  const before = projected("before");
  const after = projected("after");
  if (before.price_cents === after.price_cents) return null;
  return { audit_id: row.id, created_at: row.created_at, entity_id: row.entity_id,
    before: identity(before), after: identity(after) };
}
function databaseCode(error: unknown): string {
  const code = object(error)?.code;
  return typeof code === "string" && /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(code) ? code : "UNKNOWN";
}
function transientRead(error: unknown, status?: number): boolean {
  const code = databaseCode(error);
  if (code !== "UNKNOWN") return code.startsWith("08") || TRANSIENT_DATABASE_CODES.has(code);
  return [0, 408, 429, 502, 503, 504].includes(status ?? -1);
}
function transientThrownRead(error: unknown): boolean {
  const causeCode = object(object(error)?.cause)?.code;
  return ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET"].includes(String(causeCode ?? "")) ||
    (error instanceof TypeError && /^(?:fetch failed|Failed to fetch|Network request failed)$/i.test(error.message));
}
/** Each retry reconstructs only an audit SELECT; no write is ever retried here. */
async function auditRead<T extends { error: unknown; status?: number }>(factory: () => PromiseLike<T>, message: string): Promise<T> {
  for (let attempt = 0; attempt < READ_ATTEMPTS; attempt++) {
    let result: T;
    try { result = await factory(); }
    catch (error) {
      if (!transientThrownRead(error) || attempt === READ_ATTEMPTS - 1) fail(`${message} Database code: ${databaseCode(error)}.`);
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
      continue;
    }
    if (!result.error) return result;
    if (!transientRead(result.error, result.status) || attempt === READ_ATTEMPTS - 1) fail(`${message} Database code: ${databaseCode(result.error)}.`);
    await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
  }
  fail(`${message} Database code: UNKNOWN.`);
}
function hash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function pairedIdentityFilter(targets: readonly OphirVariantRestoreTarget[]): string {
  return targets.map((target) => {
    // PostgREST quoted filter values escape literal backslashes and quotes.
    if (/[\u0000-\u001f\u007f]/.test(target.sku)) fail("An audited SKU contains unsupported control characters.");
    const quotedSku = `"${target.sku.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
    return `and(id.eq.${target.variantId},sku.eq.${quotedSku})`;
  }).join(",");
}

/** Complete, deterministic keyset scan, with a bound checked before and after scanning. */
export async function loadOphirRestorePlan(client: SupabaseClient, orgId: string): Promise<OphirPriceRestorePlan> {
  const { since, until } = OPHIR_PRICE_RESTORE_WINDOW;
  const base = () => client.from("audit_log").select(AUDIT_FIELDS)
    .eq("org_id", orgId).eq("action", "update").in("entity_type", ["product_variants", "products"])
    .gte("created_at", since).lt("created_at", until);
  const { count } = await auditRead(() => client.from("audit_log").select("id", { count: "exact", head: true })
    .eq("org_id", orgId).eq("action", "update").in("entity_type", ["product_variants", "products"])
    .gte("created_at", since).lt("created_at", until), "The pinned audit window count could not be read.");
  if (count === null || count > MAX_AUDIT_ROWS) fail("The complete pinned audit window could not be verified within its safety bound.");
  const variantRecords: OphirPriceAuditRecord[] = [];
  const productRecords: OphirPriceAuditRecord[] = [];
  let cursor: string | null = null;
  let scanned = 0;
  while (true) {
    const { data } = await auditRead(() => {
      let query = base().order("id", { ascending: true }).limit(PAGE_SIZE);
      if (cursor) query = query.gt("id", cursor);
      return query;
    }, "The pinned pricing audit window could not be read.");
    const rows = (data ?? []) as unknown as AuditRow[];
    if (!rows.length) break;
    scanned += rows.length;
    if (scanned > MAX_AUDIT_ROWS) fail("The pricing audit window exceeds its safety bound.");
    for (const row of rows) {
      const change = priceChange(row);
      if (change) (row.entity_type === "product_variants" ? variantRecords : productRecords).push(change);
    }
    cursor = rows[rows.length - 1].id;
  }
  if (scanned !== count) fail("The audit window changed while it was being collected. Retry the preview.");
  return buildOphirPriceRestorePlan({ variantRecords, productRecords });
}

function matchesVariant(row: OphirPriceAuditIdentity, target: OphirVariantRestoreTarget): boolean {
  return row.id === target.variantId && row.sku === target.sku && row.product_id === target.productId &&
    row.etsy_listing_id === target.listingId && row.currency === target.currency;
}
function isVariantTarget(target: OphirVariantRestoreTarget | OphirProductRestoreAnchor): target is OphirVariantRestoreTarget {
  return "variantId" in target && typeof target.variantId === "string";
}

async function readDbListing(client: SupabaseClient, orgId: string, listing: OphirRestoreListing, requireBefore = false) {
  const rows = new Map<string, OphirPriceAuditIdentity>();
  for (let start = 0; start < listing.variants.length; start += 100) {
    const { data, error } = await client.from("product_variants").select(CURRENT_FIELDS)
      .eq("org_id", orgId).in("id", listing.variants.slice(start, start + 100).map((v) => v.variantId))
      .order("id", { ascending: true });
    if (error) fail(`Current DB variant prices could not be read for listing ${listing.listingId}.`);
    for (const row of (data ?? []) as unknown as Row[]) {
      if (typeof row.id === "string") rows.set(row.id, identity(row));
    }
  }
  for (const target of listing.variants) {
    const row = rows.get(target.variantId);
    if (!row || !matchesVariant(row, target)) fail(`Current DB identity conflicts with the pinned audit for ${target.sku}.`);
    const status = classifyOphirPriceRestoreCurrentValue(row.price_cents, target);
    if (status === "conflict" || (requireBefore && status !== "already-restored")) fail(`Current DB price conflicts with the pinned restoration for ${target.sku}.`);
  }
  const { data: product, error: productError } = await client.from("products")
    .select("id, sku, etsy_listing_id, currency, price_cents").eq("org_id", orgId).eq("id", listing.productId).maybeSingle();
  if (productError || !product || product.etsy_listing_id !== listing.listingId || product.currency !== "USD") {
    fail(`Current product identity could not be verified for listing ${listing.listingId}.`);
  }
  const anchor = identity(product as Row);
  if (listing.productAnchor) {
    const target = listing.productAnchor;
    if (anchor.id !== target.productId || anchor.sku !== target.sku || anchor.currency !== target.currency) {
      fail(`Current product anchor identity conflicts for listing ${listing.listingId}.`);
    }
    const status = classifyOphirPriceRestoreCurrentValue(anchor.price_cents, target);
    if (status === "conflict" || (requireBefore && status !== "already-restored")) fail(`Current product anchor price conflicts for listing ${listing.listingId}.`);
  }
  const fingerprint = hash(JSON.stringify({ variants: listing.variants.map((v) => rows.get(v.variantId)), anchor }));
  return { rows, anchor, fingerprint };
}

/** Reject any later price change except the exact reverse already performed by this restoration. */
async function ensureNoLaterPriceChange(client: SupabaseClient, orgId: string, listing: OphirRestoreListing) {
  for (const entity of ["product_variants", "products"] as const) {
    const targets = entity === "product_variants" ? listing.variants : listing.productAnchor ? [listing.productAnchor] : [];
    const targetById = new Map(targets.map((target) => ["variantId" in target ? target.variantId : target.productId, target]));
    const ids = Array.from(targetById.keys());
    for (let start = 0; start < ids.length; start += 100) {
      let cursor: string | null = null;
      let scanned = 0;
      while (true) {
        const { data } = await auditRead(() => {
          let query = client.from("audit_log").select(AUDIT_FIELDS).eq("org_id", orgId)
            .eq("entity_type", entity).eq("action", "update").gte("created_at", OPHIR_PRICE_RESTORE_WINDOW.until)
            .in("entity_id", ids.slice(start, start + 100)).order("id", { ascending: true }).limit(PAGE_SIZE);
          if (cursor) query = query.gt("id", cursor);
          return query;
        }, `Later price history could not be verified for listing ${listing.listingId}.`);
        const rows = (data ?? []) as unknown as AuditRow[];
        if (!rows.length) break;
        scanned += rows.length;
        if (scanned > MAX_AUDIT_ROWS) fail("Later price history exceeds the safety bound.");
        for (const row of rows) {
          const change = priceChange(row);
          if (!change) continue;
          const target = targetById.get(change.entity_id);
          if (!target) fail("Later price history contains an unrecognized target.");
          const reverse = change.before.price_cents === target.afterCents && change.after.price_cents === target.beforeCents;
          const stableIdentity = entity === "product_variants" && isVariantTarget(target)
            ? matchesVariant(change.before, target) && matchesVariant(change.after, target)
            : change.before.id === target.productId && change.after.id === target.productId &&
              change.before.sku === target.sku && change.after.sku === target.sku &&
              change.before.currency === target.currency && change.after.currency === target.currency &&
              change.before.etsy_listing_id === target.listingId && change.after.etsy_listing_id === target.listingId;
          if (!reverse || !stableIdentity) fail(`A later price change prevents restoration of listing ${listing.listingId}.`);
        }
        cursor = rows[rows.length - 1].id;
      }
    }
  }
}

async function inventory(client: EtsyClient, listingId: number): Promise<unknown> {
  try { return await client.get(etsyPaths.listingInventory(listingId), { legacy: "false", max_variations_supported: "3" }); }
  catch { fail(`Live Etsy inventory could not be read for listing ${listingId}.`); }
}

async function restoreDbListing(client: SupabaseClient, orgId: string, listing: OphirRestoreListing, result: OphirRestoreListingResult) {
  const current = await readDbListing(client, orgId, listing);
  await ensureNoLaterPriceChange(client, orgId, listing);
  const groups = new Map<string, OphirVariantRestoreTarget[]>();
  for (const target of listing.variants) {
    if (current.rows.get(target.variantId)!.price_cents === target.beforeCents) continue;
    const key = `${target.beforeCents}:${target.afterCents}`;
    groups.set(key, [...(groups.get(key) ?? []), target]);
  }
  let changed = 0;
  for (const targets of groups.values()) {
    for (let start = 0; start < targets.length; start += MAX_CAS_PAIRS) {
      const batch = targets.slice(start, start + MAX_CAS_PAIRS);
      const target = batch[0];
      const ids = batch.map((v) => v.variantId);
      const { data, error } = await client.from("product_variants").update({ price_cents: target.beforeCents })
        .eq("org_id", orgId).eq("price_cents", target.afterCents).eq("product_id", listing.productId)
        .eq("etsy_listing_id", listing.listingId).eq("currency", "USD")
        .or(pairedIdentityFilter(batch)).select("id");
      if (!error && data) result.dbVariantsChanged += data.length;
      if (error || !data || data.length !== ids.length || new Set(data.map((row) => row.id)).size !== ids.length ||
        data.some((row) => !ids.includes(row.id))) fail(`DB price comparison failed for listing ${listing.listingId}; inspect partial progress and preview again.`);
      changed += data.length;
    }
  }
  let anchorChanged = false;
  const anchor = listing.productAnchor;
  if (anchor && current.anchor.price_cents !== anchor.beforeCents) {
    let query = client.from("products").update({ price_cents: anchor.beforeCents }).eq("org_id", orgId)
      .eq("id", anchor.productId).eq("etsy_listing_id", anchor.listingId).eq("currency", anchor.currency)
      .eq("price_cents", anchor.afterCents);
    query = anchor.sku === null ? query.is("sku", null) : query.eq("sku", anchor.sku);
    const { data, error } = await query.select("id");
    if (error || data?.length !== 1 || data[0].id !== anchor.productId) fail(`DB anchor comparison failed for listing ${listing.listingId}; inspect partial progress and preview again.`);
    anchorChanged = true;
    result.dbAnchorChanged = true;
  }
  await readDbListing(client, orgId, listing, true);
  return { changed, anchorChanged };
}

async function auditResult(client: SupabaseClient, orgId: string, plan: OphirPriceRestorePlan, listing: OphirRestoreListing, result: OphirRestoreListingResult) {
  const { error } = await client.rpc("log_audit", {
    p_org_id: orgId, p_action: "etsy.reprice", p_entity_type: "products", p_entity_id: listing.productId,
    p_summary: `Ophir last price change restoration: listing ${listing.listingId}, ${result.status}, ${result.stage}.`,
    p_diff: { plan_hash: plan.manifestHash, listing_id: listing.listingId,
      audit_ids: [...listing.variants.flatMap((v) => v.auditIds), ...(listing.productAnchor?.auditIds ?? [])],
      target_variants: result.targetVariants, etsy_prices_changed: result.etsyPricesChanged,
      db_variants_changed: result.dbVariantsChanged, db_anchor_changed: result.dbAnchorChanged,
      result: result.status, stage: result.stage, etsy_write_attempted: result.etsyWriteAttempted,
      non_price_fields_preserved: result.nonPriceFieldsPreserved, proof: result.proof ?? null },
    p_source: "app:ophir-price-restore", p_actor_label: null,
  });
  return !error;
}

export async function processOphirRestoreListing(input: {
  client: SupabaseClient; etsy: EtsyClient; orgId: string; plan: OphirPriceRestorePlan;
  listing: OphirRestoreListing; mode: "dry-run" | "apply"; previewProof?: OphirRestorePreviewProof;
}): Promise<OphirRestoreListingResult> {
  const { client, etsy, orgId, plan, listing, mode } = input;
  const result: OphirRestoreListingResult = { listingId: listing.listingId, productId: listing.productId, mode,
    status: "failed", stage: "identity-check", targetVariants: listing.variants.length,
    etsyPricesChanged: 0, etsyAlreadyRestored: 0, dbVariantsChanged: 0, dbAnchorChanged: false,
    etsyWriteAttempted: false, nonPriceFieldsPreserved: false, auditWritten: false };
  try {
    // Validate every quoted CAS literal before a live price write can be attempted.
    for (let start = 0; start < listing.variants.length; start += MAX_CAS_PAIRS) {
      pairedIdentityFilter(listing.variants.slice(start, start + MAX_CAS_PAIRS));
    }
    if (await etsy.requireShopId() !== OPHIR_RESTORE_SHOP_ID) fail("The connected Etsy shop is not Ophir Gold USA.");
    let liveListing: { shop_id?: number };
    try { liveListing = await etsy.get(etsyPaths.listing(listing.listingId)); }
    catch { fail(`Live Etsy listing ownership could not be verified for ${listing.listingId}.`); }
    if (liveListing.shop_id !== OPHIR_RESTORE_SHOP_ID) fail(`Listing ${listing.listingId} does not belong to the Ophir Etsy shop.`);
    const db = await readDbListing(client, orgId, listing);
    await ensureNoLaterPriceChange(client, orgId, listing);
    result.stage = "live-preview";
    let currentInventory = await inventory(etsy, listing.listingId);
    let built = buildOphirPriceRestore(currentInventory, listing.variants);
    let proof: OphirRestorePreviewProof = {
      currentInventoryHash: hash(built.currentFingerprint), expectedInventoryHash: hash(built.expectedFingerprint),
      nonPriceHash: hash(built.nonPriceFingerprint), currentDbHash: db.fingerprint,
    };
    if (mode === "apply") {
      if (!input.previewProof || JSON.stringify(input.previewProof) !== JSON.stringify(proof)) {
        fail(`Listing ${listing.listingId} changed since its preview. Preview it again before applying.`);
      }
      // Revalidate immediately before writing; never reuse a preview's inventory payload.
      const freshDb = await readDbListing(client, orgId, listing);
      await ensureNoLaterPriceChange(client, orgId, listing);
      currentInventory = await inventory(etsy, listing.listingId);
      built = buildOphirPriceRestore(currentInventory, listing.variants);
      proof = { currentInventoryHash: hash(built.currentFingerprint), expectedInventoryHash: hash(built.expectedFingerprint),
        nonPriceHash: hash(built.nonPriceFingerprint), currentDbHash: freshDb.fingerprint };
      if (JSON.stringify(input.previewProof) !== JSON.stringify(proof)) fail(`Listing ${listing.listingId} changed immediately before applying. Preview it again.`);
      result.proof = proof;
      result.stage = "etsy-write";
      let writeReturnedSuccess = true;
      if (built.changed > 0) {
        result.etsyWriteAttempted = true;
        const qs = new URLSearchParams(built.query);
        try { await etsy.request("PUT", `${etsyPaths.listingInventory(listing.listingId)}?${qs}`, built.update, 0); }
        catch { writeReturnedSuccess = false; }
      }
      result.stage = "etsy-readback";
      const readback = await inventory(etsy, listing.listingId);
      if (canonicalOphirInventory(readback) !== built.expectedFingerprint ||
        canonicalOphirInventoryNonPrice(readback) !== built.nonPriceFingerprint) {
        fail(`${writeReturnedSuccess ? "Full Etsy price and non-price readback differs" : "The Etsy write returned an error and its readback does not confirm the exact target"} for listing ${listing.listingId}; no DB restoration was attempted.`);
      }
      result.nonPriceFieldsPreserved = true;
      result.etsyPricesChanged = built.changed;
      result.etsyAlreadyRestored = built.alreadyRestored;
      result.stage = "db-restore";
      const dbResult = await restoreDbListing(client, orgId, listing, result);
      result.dbVariantsChanged = dbResult.changed;
      result.dbAnchorChanged = dbResult.anchorChanged;
    } else {
      result.etsyPricesChanged = built.changed;
      result.etsyAlreadyRestored = built.alreadyRestored;
      result.nonPriceFieldsPreserved = canonicalOphirInventoryNonPrice(currentInventory) === built.nonPriceFingerprint;
    }
    result.proof = proof;
    result.prices = built.prices;
    result.stage = mode === "apply" ? "completed-readback" : "preview-complete";
    result.status = "verified";
    if (mode === "apply") {
      result.auditWritten = await auditResult(client, orgId, plan, listing, result);
      if (!result.auditWritten) fail(`Restoration was verified for listing ${listing.listingId}, but its summary audit could not be saved. Stop and inspect before continuing.`);
    }
    return result;
  } catch (error) {
    result.status = "failed";
    result.error = error instanceof OphirRestoreError || (error instanceof Error && error.message.startsWith("Ophir price restore"))
      ? error.message : "The restoration stopped before the next listing. Inspect this listing and preview again.";
    if (mode === "apply") result.auditWritten = await auditResult(client, orgId, plan, listing, result).catch(() => false);
    return result;
  }
}
