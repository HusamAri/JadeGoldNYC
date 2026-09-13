/** Browser-safe progress checks. Authorization and every price write remain in the existing API. */
export const OPHIR_PROGRESS_PLAN_HASH = "97ff79e7959c85d19ac322962bc565b6f4304d84ff7b189aafa9994f372e1494";
export const OPHIR_PROGRESS_PRICE_COLUMNS = ["sku", "currentCents", "targetCents", "status"] as const;
type Row = Record<string, unknown>;
type Mode = "dry-run" | "apply";
type Phase = "idle" | "previewing" | "preview-paused" | "preview-complete" | "restoring" | "restore-paused" | "complete";
export interface OphirProgressListing { listing_id: number; product_id: string; target_variants: number; product_anchor: Row | null }
export interface OphirProgressSummary extends Row {
  manifest_hash: string; affected_listings: number; target_variants: number; changed_product_anchors: number;
  listings: OphirProgressListing[];
}
export interface OphirProgressProof {
  currentInventoryHash: string; expectedInventoryHash: string; nonPriceHash: string; currentDbHash: string;
}
export interface OphirProgressPrice { sku: string; currentCents: number; targetCents: number; status: "restore" | "already-restored" }
export interface OphirProgressResult extends Row {
  listingId: number; productId: string; targetVariants: number; prices: OphirProgressPrice[]; proof: OphirProgressProof;
  etsyPricesChanged: number; etsyAlreadyRestored: number; dbVariantsChanged: number; dbAnchorChanged: boolean;
}
export interface OphirProgressRequest {
  mode: Mode; listing_ids: string; plan_hash: string; preview_proofs?: Record<string, OphirProgressProof>;
}
export interface OphirProgressEntry {
  sequence: number; phase: "initial-preview" | "fresh-preview" | "apply"; listingIds: number[]; response?: unknown; error?: string;
}
export class OphirProgressRequestFailure extends Error {
  constructor(message: string, readonly responseData: unknown) { super(message); }
}
export interface OphirProgressSnapshot {
  initialized: boolean; phase: Phase; currentListingId: number | null; error: string | null; pauseRequested: boolean;
  previewedListings: number; previewedVariants: number; restoredListings: number; restoredVariants: number;
  etsyPricesChanged: number; etsyAlreadyRestored: number; dbVariantsChanged: number; dbAnchorsChanged: number; canRestore: boolean;
}
export const EMPTY_OPHIR_PROGRESS: OphirProgressSnapshot = {
  initialized: false, phase: "idle", currentListingId: null, error: null, pauseRequested: false,
  previewedListings: 0, previewedVariants: 0, restoredListings: 0, restoredVariants: 0,
  etsyPricesChanged: 0, etsyAlreadyRestored: 0, dbVariantsChanged: 0, dbAnchorsChanged: 0, canRestore: false,
};
const HASH = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function fail(message: string): never { throw new Error(message); }
function row(value: unknown, label: string): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} could not be verified.`);
  return value as Row;
}
function integer(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) fail(`${label} could not be verified.`);
  return value;
}
function exactIds(value: unknown, expected: readonly number[], label: string) {
  if (!Array.isArray(value) || value.length !== expected.length || value.some((id, index) => id !== expected[index])) fail(`${label} did not contain the exact selected listings.`);
}
function proof(value: unknown): OphirProgressProof {
  const p = row(value, "Preview proof");
  const keys = ["currentInventoryHash", "expectedInventoryHash", "nonPriceHash", "currentDbHash"] as const;
  if (keys.some((key) => typeof p[key] !== "string" || !HASH.test(p[key] as string))) fail("The preview proof could not be verified.");
  return Object.fromEntries(keys.map((key) => [key, p[key]])) as unknown as OphirProgressProof;
}

export function validateOphirProgressSummary(value: unknown): OphirProgressSummary {
  const s = row(value, "Price plan");
  const window = row(s.audit_window, "Audit window");
  if (s.manifest_hash !== OPHIR_PROGRESS_PLAN_HASH || s.expected_manifest_pinned !== true || s.affected_listings !== 92 ||
    s.target_variants !== 32_707 || s.changed_variants !== 32_707 || s.changed_product_anchors !== 81 || s.shop_id !== 66_983_205 ||
    window.since !== "2026-08-29T18:45:00Z" || window.until !== "2026-08-29T19:05:00Z") fail("The price plan does not match the reviewed Ophir restoration.");
  if (!Array.isArray(s.listings) || s.listings.length !== 92) fail("The price plan is missing affected listings.");
  const ids = new Set<number>();
  const products = new Set<string>();
  let variants = 0;
  let anchors = 0;
  for (const value of s.listings) {
    const listing = row(value, "Listing");
    const id = integer(listing.listing_id, "Listing ID", 1);
    if (ids.has(id) || typeof listing.product_id !== "string" || !UUID.test(listing.product_id) || products.has(listing.product_id)) fail("The price plan contains duplicate or invalid listing identities.");
    ids.add(id); products.add(listing.product_id);
    variants += integer(listing.target_variants, "Listing variant count");
    if (listing.product_anchor !== null) {
      const anchor = row(listing.product_anchor, "Product price anchor");
      if (anchor.productId !== listing.product_id || anchor.listingId !== id || anchor.currency !== "USD" ||
        integer(anchor.beforeCents, "Prior anchor price", 1) === integer(anchor.afterCents, "Final anchor price", 1)) fail("A product price anchor does not match its listing.");
      anchors++;
    }
  }
  if (variants !== 32_707 || anchors !== 81) fail("The complete variant or product price totals could not be verified.");
  return s as unknown as OphirProgressSummary;
}

export function validateOphirProgressResponse(input: {
  summary: OphirProgressSummary; listingIds: readonly number[]; mode: Mode; response: unknown;
  initial?: ReadonlyMap<number, OphirProgressResult>; fresh?: OphirProgressResult;
}): OphirProgressResult[] {
  const { summary, listingIds, mode } = input;
  if (listingIds.length < 1 || listingIds.length > (mode === "apply" ? 1 : 5) || new Set(listingIds).size !== listingIds.length) fail("The selected listing scope is unsafe.");
  const r = row(input.response, "Price check result");
  if (typeof r.error === "string") fail(r.error);
  if (r.mode !== mode || r.plan_hash !== OPHIR_PROGRESS_PLAN_HASH || r.all_selected_verified !== true || r.stopped_on_failure !== false) fail("The selected listings did not finish verification. Stop and preview again.");
  exactIds(r.selected_listing_ids, listingIds, "Request result");
  exactIds(r.completed_listing_ids, listingIds, "Completed result");
  exactIds(r.unprocessed_listing_ids, [], "Unprocessed result");
  if (!Array.isArray(r.results) || r.results.length !== listingIds.length) fail("The result is missing a selected listing.");
  return r.results.map((value, index) => {
    const result = row(value, "Listing result");
    const expected = summary.listings.find((listing) => listing.listing_id === listingIds[index]);
    if (!expected || result.listingId !== expected.listing_id || result.productId !== expected.product_id || result.mode !== mode ||
      result.status !== "verified" || result.stage !== (mode === "dry-run" ? "preview-complete" : "completed-readback") ||
      result.targetVariants !== expected.target_variants || result.nonPriceFieldsPreserved !== true || result.error !== undefined) fail("The listing identity, prices, or unchanged fields did not finish verification.");
    const changed = integer(result.etsyPricesChanged, "Etsy changed price count");
    const already = integer(result.etsyAlreadyRestored, "Etsy prior price count");
    const dbChanged = integer(result.dbVariantsChanged, "Panel changed price count");
    if (changed + already !== expected.target_variants || dbChanged > expected.target_variants || typeof result.dbAnchorChanged !== "boolean") fail("The listing price counts did not reconcile.");
    if (mode === "dry-run" && (result.etsyWriteAttempted !== false || dbChanged !== 0 || result.dbAnchorChanged !== false || result.auditWritten !== false)) fail("The preview reported an unexpected write. Restoration is stopped.");
    if (mode === "apply" && (result.auditWritten !== true || result.etsyWriteAttempted !== (changed > 0) || (result.dbAnchorChanged && expected.product_anchor === null))) fail("The restoration write or audit could not be verified.");
    const p = proof(result.proof);
    if (!Array.isArray(result.prices) || result.prices.length !== expected.target_variants) fail("The result is missing exact variant price records.");
    const skus = new Set<string>();
    let restore = 0;
    const prices = result.prices.map((value): OphirProgressPrice => {
      const price = row(value, "Variant price");
      if (typeof price.sku !== "string" || !price.sku.startsWith(`OPH-${expected.listing_id}-`) || skus.has(price.sku)) fail("The price result contains a missing, duplicate, or wrong listing SKU.");
      skus.add(price.sku);
      const currentCents = integer(price.currentCents, "Current price", 1);
      const targetCents = integer(price.targetCents, "Prior price", 1);
      if (price.status !== "restore" && price.status !== "already-restored") fail("The variant price status is unsafe.");
      if ((price.status === "already-restored") !== (currentCents === targetCents)) fail("The current and prior variant prices did not reconcile.");
      if (price.status === "restore") restore++;
      return { sku: price.sku, currentCents, targetCents, status: price.status };
    });
    if (restore !== changed) fail("The exact variant rows did not match the price counts.");
    const initial = input.initial?.get(expected.listing_id);
    if (input.initial && !initial) fail("The listing is missing its complete initial preview.");
    if (initial) {
      const targets = new Map(initial.prices.map((price) => [price.sku, price.targetCents]));
      if (targets.size !== prices.length || prices.some((price) => targets.get(price.sku) !== price.targetCents)) fail("The exact prior prices changed since the reviewed initial preview.");
    }
    if (mode === "apply") {
      const fresh = input.fresh;
      if (!fresh || fresh.listingId !== expected.listing_id || JSON.stringify(fresh.proof) !== JSON.stringify(p) || JSON.stringify(fresh.prices) !== JSON.stringify(prices)) fail("The restoration does not match its immediately preceding fresh preview.");
    }
    return { ...result, proof: p, prices } as OphirProgressResult;
  });
}

export function hasCompleteOphirInitialPreviews(summary: OphirProgressSummary, previews: readonly OphirProgressResult[]): boolean {
  if (summary.manifest_hash !== OPHIR_PROGRESS_PLAN_HASH || summary.affected_listings !== 92 || summary.target_variants !== 32_707 ||
    previews.length !== 92 || new Set(previews.map((result) => result.listingId)).size !== 92) return false;
  return summary.listings.every((listing) => previews.some((result) => result.listingId === listing.listing_id && result.productId === listing.product_id &&
    result.targetVariants === listing.target_variants && result.mode === "dry-run" && result.status === "verified" && result.nonPriceFieldsPreserved === true &&
    result.stage === "preview-complete" && result.auditWritten === false && result.etsyWriteAttempted === false &&
    result.dbVariantsChanged === 0 && result.dbAnchorChanged === false && result.etsyPricesChanged + result.etsyAlreadyRestored === result.targetVariants)) &&
    previews.reduce((count, result) => count + result.targetVariants, 0) === 32_707;
}

export class OphirRestoreProgressController {
  private summary: OphirProgressSummary | null = null;
  private readonly initial = new Map<number, OphirProgressResult>();
  private readonly restored = new Map<number, OphirProgressResult>();
  private readonly entries: OphirProgressEntry[] = [];
  private phase: Phase = "idle";
  private currentListingId: number | null = null;
  private error: string | null = null;
  private pauseRequested = false;
  constructor(private readonly request: (body: OphirProgressRequest) => Promise<unknown>, private readonly notify: (value: OphirProgressSnapshot) => void = () => {}) {}
  initialize(value: unknown) {
    if (this.entries.length) fail("A running restoration plan cannot be replaced.");
    this.summary = validateOphirProgressSummary(value); this.emit();
  }
  getSnapshot(): OphirProgressSnapshot {
    const applied = Array.from(this.restored.values());
    return { initialized: this.summary !== null, phase: this.phase, currentListingId: this.currentListingId, error: this.error,
      pauseRequested: this.pauseRequested, previewedListings: this.initial.size,
      previewedVariants: Array.from(this.initial.values()).reduce((count, result) => count + result.targetVariants, 0),
      restoredListings: applied.length, restoredVariants: applied.reduce((count, result) => count + result.targetVariants, 0),
      etsyPricesChanged: applied.reduce((count, result) => count + result.etsyPricesChanged, 0),
      etsyAlreadyRestored: applied.reduce((count, result) => count + result.etsyAlreadyRestored, 0),
      dbVariantsChanged: applied.reduce((count, result) => count + result.dbVariantsChanged, 0),
      dbAnchorsChanged: applied.filter((result) => result.dbAnchorChanged).length,
      canRestore: !!this.summary && hasCompleteOphirInitialPreviews(this.summary, Array.from(this.initial.values())) };
  }
  private emit() { this.notify(this.getSnapshot()); }
  requestPause() { this.pauseRequested = true; this.emit(); }
  private async call(phase: OphirProgressEntry["phase"], ids: number[], mode: Mode, fresh?: OphirProgressResult) {
    const entry: OphirProgressEntry = { sequence: this.entries.length + 1, phase, listingIds: ids.slice() };
    this.entries.push(entry);
    try {
      entry.response = await this.request({ mode, listing_ids: ids.join(","), plan_hash: OPHIR_PROGRESS_PLAN_HASH,
        ...(fresh ? { preview_proofs: { [String(ids[0])]: fresh.proof } } : {}) });
      return entry.response;
    } catch (error) {
      if (error instanceof OphirProgressRequestFailure) entry.response = error.responseData;
      entry.error = error instanceof Error ? error.message : "The request did not finish.";
      throw error;
    }
  }
  async previewAll() {
    if (!this.summary || !["idle", "preview-paused"].includes(this.phase)) fail("Preview cannot start in the current state.");
    this.phase = "previewing"; this.error = null; this.pauseRequested = false; this.emit();
    try {
      const remaining = this.summary.listings.filter((listing) => !this.initial.has(listing.listing_id));
      for (let start = 0; start < remaining.length; start += 5) {
        if (this.pauseRequested) { this.phase = "preview-paused"; this.emit(); return; }
        const ids = remaining.slice(start, start + 5).map((listing) => listing.listing_id);
        this.currentListingId = ids[0]; this.emit();
        const response = await this.call("initial-preview", ids, "dry-run");
        const results = validateOphirProgressResponse({ summary: this.summary, listingIds: ids, mode: "dry-run", response });
        for (const result of results) this.initial.set(result.listingId, result);
        this.emit();
      }
      if (!this.getSnapshot().canRestore) fail("All affected listings must finish their initial preview.");
      this.phase = "preview-complete"; this.currentListingId = null; this.emit();
    } catch (error) { this.phase = "preview-paused"; this.error = error instanceof Error ? error.message : "Preview paused."; this.emit(); }
  }
  async restoreAll() {
    if (!this.summary || !this.getSnapshot().canRestore || !["preview-complete", "restore-paused"].includes(this.phase)) fail("All 92 listings must pass initial preview before restoring prices.");
    this.phase = "restoring"; this.error = null; this.pauseRequested = false; this.emit();
    try {
      for (const listing of this.summary.listings) {
        if (this.restored.has(listing.listing_id)) continue;
        if (this.pauseRequested) { this.phase = "restore-paused"; this.emit(); return; }
        const ids = [listing.listing_id]; this.currentListingId = listing.listing_id; this.emit();
        const preview = await this.call("fresh-preview", ids, "dry-run");
        const fresh = validateOphirProgressResponse({ summary: this.summary, listingIds: ids, mode: "dry-run", response: preview, initial: this.initial })[0];
        if (this.pauseRequested) { this.phase = "restore-paused"; this.emit(); return; }
        const response = await this.call("apply", ids, "apply", fresh);
        const restored = validateOphirProgressResponse({ summary: this.summary, listingIds: ids, mode: "apply", response, initial: this.initial, fresh })[0];
        this.restored.set(listing.listing_id, restored); this.emit();
      }
      this.phase = "complete"; this.currentListingId = null; this.emit();
    } catch (error) { this.phase = "restore-paused"; this.error = error instanceof Error ? error.message : "Restoration paused. Check the current listing before resuming."; this.emit(); }
  }
  report() {
    return { exportFormat: "ophir-price-restoration-progress-v1", version: 1, planHash: OPHIR_PROGRESS_PLAN_HASH,
      pricesColumns: OPHIR_PROGRESS_PRICE_COLUMNS, summary: this.summary, status: this.phase,
      previewedListingIds: Array.from(this.initial.keys()), restoredListingIds: Array.from(this.restored.keys()),
      currentListingId: this.currentListingId, error: this.error, totals: this.getSnapshot(),
      entries: this.entries.map((entry) => {
        const response = entry.response;
        if (!response || typeof response !== "object" || Array.isArray(response)) return { ...entry };
        const r = response as Row;
        if (!Array.isArray(r.results)) return { ...entry };
        return { ...entry, response: { ...r, results: r.results.map((value) => {
          if (!value || typeof value !== "object" || Array.isArray(value)) return value;
          const result = value as Row;
          return { ...result, ...(Array.isArray(result.prices) ? { prices: result.prices.map((value) => {
            if (!value || typeof value !== "object" || Array.isArray(value)) return value;
            const p = value as Row;
            return OPHIR_PROGRESS_PRICE_COLUMNS.map((column) => p[column]);
          }) } : {}) };
        }) } };
      }) };
  }
}
