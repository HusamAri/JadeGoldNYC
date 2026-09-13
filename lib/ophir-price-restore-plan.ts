import { createHash } from "node:crypto";

export const OPHIR_PRICE_RESTORE_WINDOW = {
  since: "2026-08-29T18:45:00Z",
  until: "2026-08-29T19:05:00Z",
} as const;

export interface OphirPriceAuditIdentity {
  id: string | null;
  sku: string | null;
  product_id: string | null;
  etsy_listing_id: number | null;
  currency: string | null;
  price_cents: number | null;
}

export interface OphirPriceAuditRecord {
  audit_id: string;
  created_at: string;
  entity_id: string;
  before: OphirPriceAuditIdentity;
  after: OphirPriceAuditIdentity;
}

export interface OphirVariantRestoreTarget {
  auditIds: string[];
  variantId: string;
  productId: string;
  listingId: number;
  sku: string;
  currency: "USD";
  beforeCents: number;
  afterCents: number;
}

export interface OphirProductRestoreAnchor {
  auditIds: string[];
  productId: string;
  listingId: number;
  sku: string | null;
  currency: "USD";
  beforeCents: number;
  afterCents: number;
}

export interface OphirPriceRestorePlan {
  manifest: OphirVariantRestoreTarget[];
  productAnchors: OphirProductRestoreAnchor[];
  listingGroups: {
    listingId: number;
    productId: string;
    variants: OphirVariantRestoreTarget[];
    productAnchor: OphirProductRestoreAnchor | null;
  }[];
  totalChangedTargets: number;
  totalChangedProductAnchors: number;
  minAuditTimestamp: string;
  maxAuditTimestamp: string;
  manifestHash: string;
}

export interface OphirPriceRestoreCasBatch {
  table: "product_variants" | "products";
  beforeCents: number;
  afterCents: number;
  patch: { price_cents: number };
  where: { org_id: string; price_cents: number; id_in: string[] };
}

type Entity = "product_variants" | "products";
type Event = {
  auditId: string;
  entityId: string;
  productId: string;
  listingId: number;
  sku: string | null;
  currency: "USD";
  beforeCents: number;
  afterCents: number;
  micros: bigint;
  timestamp: string;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(message: string): never {
  throw new Error(`Ophir price restore plan: ${message}`);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function uuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID.test(value)) fail(`${label} must be a UUID`);
  return value.toLowerCase();
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) fail(`${label} must be a positive integer`);
  return value;
}

function sku(value: unknown, required: boolean): string | null {
  if (!required && value === null) return null;
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) fail("SKU must be a nonempty exact string");
  return value;
}

function timestamp(value: unknown): { micros: bigint; timestamp: string } {
  if (typeof value !== "string") fail("audit timestamp must be an ISO string");
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) fail("audit timestamp must include a timezone and at most six fractional digits");
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const offsetHours = Number(match[9] ?? 0);
  const offsetMinutes = Number(match[10] ?? 0);
  if (
    year < 1970 || month < 1 || month > 12 || day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    hour > 23 || minute > 59 || second > 59 ||
    offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)
  ) fail("audit timestamp is not a valid calendar timestamp");
  const milliseconds = Date.parse(`${value.slice(0, 19)}${match[8]}`);
  if (!Number.isFinite(milliseconds)) fail("audit timestamp is invalid");
  const fraction = (match[7] ?? "").padEnd(6, "0");
  return {
    micros: BigInt(milliseconds) * BigInt(1000) + BigInt(fraction),
    timestamp: `${new Date(milliseconds).toISOString().slice(0, 19)}.${fraction}Z`,
  };
}

const WINDOW_START = timestamp(OPHIR_PRICE_RESTORE_WINDOW.since).micros;
const WINDOW_END = timestamp(OPHIR_PRICE_RESTORE_WINDOW.until).micros;

function event(input: unknown, entity: Entity, seenAuditIds: Set<string>): Event {
  const row = object(input, "audit record");
  const before = object(row.before, "before identity");
  const after = object(row.after, "after identity");
  const auditId = uuid(row.audit_id, "audit ID");
  if (seenAuditIds.has(auditId)) fail(`duplicate audit ID ${auditId}`);
  seenAuditIds.add(auditId);
  const entityId = uuid(row.entity_id, "entity ID");
  if (uuid(before.id, "before ID") !== entityId || uuid(after.id, "after ID") !== entityId) fail("audit identity IDs do not match the entity");
  const requiredSku = entity === "product_variants";
  const beforeSku = sku(before.sku, requiredSku);
  const afterSku = sku(after.sku, requiredSku);
  const productId = entity === "product_variants" ? uuid(before.product_id, "before product ID") : entityId;
  if (entity === "product_variants") {
    if (uuid(after.product_id, "after product ID") !== productId) fail("product identity changed inside the operation");
  } else if (before.product_id !== null || after.product_id !== null) {
    fail("product audit identities must have null product_id");
  }
  const listingId = positiveInteger(before.etsy_listing_id, "before listing ID");
  if (positiveInteger(after.etsy_listing_id, "after listing ID") !== listingId || beforeSku !== afterSku || before.currency !== after.currency) {
    fail("SKU, currency, or listing identity changed inside the operation");
  }
  if (before.currency !== "USD") fail("Ophir prices must use USD");
  const beforeCents = positiveInteger(before.price_cents, "before cents");
  const afterCents = positiveInteger(after.price_cents, "after cents");
  if (beforeCents === afterCents) fail("audit record is not a price change");
  const time = timestamp(row.created_at);
  if (time.micros < WINDOW_START || time.micros >= WINDOW_END) {
    fail("audit record is outside the pinned August 29 operation window");
  }
  return { auditId, entityId, productId, listingId, sku: beforeSku, currency: "USD", beforeCents, afterCents, ...time };
}

function compare(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function collapse(events: Event[]): Event[] {
  const first = events[0];
  for (const row of events) {
    if (row.productId !== first.productId || row.listingId !== first.listingId || row.sku !== first.sku || row.currency !== first.currency) {
      fail("entity identity changed between audit records");
    }
  }
  const sorted = events.slice().sort((a, b) => a.micros < b.micros ? -1 : a.micros > b.micros ? 1 : compare(a.auditId, b.auditId));
  const ordered: Event[] = [];
  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].micros === sorted[start].micros) end++;
    const remaining = sorted.slice(start, end);
    let expected = ordered.length ? ordered[ordered.length - 1].afterCents : undefined;
    while (remaining.length) {
      // UUIDs do not establish time ordering. Equal-time records require a unique price continuation.
      const candidates = remaining.filter((row) => expected === undefined
        ? !remaining.some((other) => other.afterCents === row.beforeCents)
        : row.beforeCents === expected);
      if (candidates.length !== 1) fail(candidates.length === 0 && expected !== undefined
        ? "discontinuous price chain" : "ambiguous equal-timestamp price chain");
      const next = candidates[0];
      ordered.push(next);
      remaining.splice(remaining.indexOf(next), 1);
      expected = next.afterCents;
    }
    start = end;
  }
  return ordered;
}

/** Call only after collecting every audit export page for both scoped entities. */
export function buildOphirPriceRestorePlan(input: {
  variantRecords: readonly unknown[];
  productRecords: readonly unknown[];
}): OphirPriceRestorePlan {
  if (!Array.isArray(input.variantRecords) || !Array.isArray(input.productRecords)) fail("both audit record collections must be arrays");
  if (input.variantRecords.length + input.productRecords.length === 0) fail("audit evidence is empty");
  if (input.variantRecords.length > 100_000 || input.productRecords.length > 100_000) fail("audit evidence exceeds the safety bound");
  const seen = new Set<string>();
  const variantEvents = input.variantRecords.map((row) => event(row, "product_variants", seen));
  const productEvents = input.productRecords.map((row) => event(row, "products", seen));
  const chains = (rows: Event[]) => {
    const byId = new Map<string, Event[]>();
    for (const row of rows) {
      const group = byId.get(row.entityId) ?? [];
      group.push(row);
      byId.set(row.entityId, group);
    }
    return Array.from(byId.values(), collapse);
  };
  const manifest: OphirVariantRestoreTarget[] = chains(variantEvents).map((chain) => {
    const first = chain[0];
    return { auditIds: chain.map((row) => row.auditId), variantId: first.entityId,
      productId: first.productId, listingId: first.listingId, sku: first.sku!, currency: first.currency,
      beforeCents: first.beforeCents, afterCents: chain[chain.length - 1].afterCents };
  }).sort((a, b) => a.listingId - b.listingId || compare(a.sku, b.sku) || compare(a.variantId, b.variantId));
  const productAnchors: OphirProductRestoreAnchor[] = chains(productEvents).map((chain) => {
    const first = chain[0];
    return { auditIds: chain.map((row) => row.auditId), productId: first.productId,
      listingId: first.listingId, sku: first.sku, currency: first.currency,
      beforeCents: first.beforeCents, afterCents: chain[chain.length - 1].afterCents };
  }).sort((a, b) => a.listingId - b.listingId || compare(a.productId, b.productId));
  const skus = new Set<string>();
  const listingGroups = new Map<number, OphirPriceRestorePlan["listingGroups"][number]>();
  const listingByProduct = new Map<string, number>();
  for (const target of [...manifest, ...productAnchors]) {
    const existing = listingGroups.get(target.listingId);
    if (existing && existing.productId !== target.productId) fail("listing has conflicting product identities");
    const listing = listingByProduct.get(target.productId);
    if (listing !== undefined && listing !== target.listingId) fail("product has conflicting listing identities");
    listingByProduct.set(target.productId, target.listingId);
    if (!existing) listingGroups.set(target.listingId, { listingId: target.listingId, productId: target.productId, variants: [], productAnchor: null });
  }
  for (const target of manifest) {
    if (skus.has(target.sku)) fail(`SKU belongs to multiple variants: ${target.sku}`);
    skus.add(target.sku);
    listingGroups.get(target.listingId)!.variants.push(target);
  }
  for (const anchor of productAnchors) listingGroups.get(anchor.listingId)!.productAnchor = anchor;
  const times = [...variantEvents, ...productEvents].sort((a, b) => a.micros < b.micros ? -1 : a.micros > b.micros ? 1 : 0);
  return { manifest, productAnchors, listingGroups: Array.from(listingGroups.values()).sort((a, b) => a.listingId - b.listingId),
    totalChangedTargets: manifest.filter((row) => row.beforeCents !== row.afterCents).length,
    totalChangedProductAnchors: productAnchors.filter((row) => row.beforeCents !== row.afterCents).length,
    minAuditTimestamp: times[0].timestamp, maxAuditTimestamp: times[times.length - 1].timestamp,
    manifestHash: createHash("sha256").update(JSON.stringify({ manifest, productAnchors })).digest("hex") };
}

export function classifyOphirPriceRestoreCurrentValue(currentCents: unknown, target: { beforeCents: number; afterCents: number }): "restore" | "already-restored" | "conflict" {
  positiveInteger(target.beforeCents, "target before cents");
  positiveInteger(target.afterCents, "target after cents");
  if (currentCents === target.beforeCents) return "already-restored";
  if (currentCents === target.afterCents) return "restore";
  return "conflict";
}

/** Descriptions only. Consumers must enforce every predicate and verify affected IDs. */
export function buildOphirPriceRestoreCasBatches(plan: OphirPriceRestorePlan, orgId: string): OphirPriceRestoreCasBatch[] {
  const organizationId = uuid(orgId, "organization ID");
  const grouped = new Map<string, { table: Entity; beforeCents: number; afterCents: number; ids: string[] }>();
  const seenIds = new Set<string>();
  for (const [table, targets] of [["product_variants", plan.manifest], ["products", plan.productAnchors]] as const) {
    for (const target of targets) {
      if (target.beforeCents === target.afterCents) continue;
      positiveInteger(target.beforeCents, "batch before cents");
      positiveInteger(target.afterCents, "batch after cents");
      const key = `${table}:${target.beforeCents}:${target.afterCents}`;
      const group = grouped.get(key) ?? { table, beforeCents: target.beforeCents, afterCents: target.afterCents, ids: [] };
      const id = uuid("variantId" in target ? target.variantId : target.productId, "batch entity ID");
      if (seenIds.has(`${table}:${id}`)) fail("CAS plan contains duplicate entity IDs");
      seenIds.add(`${table}:${id}`);
      group.ids.push(id);
      grouped.set(key, group);
    }
  }
  const batches: OphirPriceRestoreCasBatch[] = [];
  for (const group of Array.from(grouped.values()).sort((a, b) => compare(a.table, b.table) || a.beforeCents - b.beforeCents || a.afterCents - b.afterCents)) {
    const ids = group.ids.sort(compare);
    if (new Set(ids).size !== ids.length) fail("CAS group contains duplicate entity IDs");
    for (let start = 0; start < ids.length; start += 100) batches.push({
      table: group.table, beforeCents: group.beforeCents, afterCents: group.afterCents,
      patch: { price_cents: group.beforeCents },
      where: { org_id: organizationId, price_cents: group.afterCents, id_in: ids.slice(start, start + 100) },
    });
  }
  return batches;
}
