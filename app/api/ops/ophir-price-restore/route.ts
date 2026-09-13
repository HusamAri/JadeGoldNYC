import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient } from "@/lib/etsy/client";
import {
  EXPECTED_OPHIR_RESTORE_MANIFEST_HASH,
  loadOphirRestorePlan,
  OphirRestoreError,
  OPHIR_RESTORE_SHOP_ID,
  ophirRestorePricesCsv,
  ophirRestoreGridSummary,
  processOphirRestoreListing,
  type OphirRestoreListingResult,
  type OphirRestorePreviewProof,
} from "@/lib/ophir-price-restore-runtime";
import { OPHIR_PRICE_RESTORE_WINDOW, type OphirPriceRestorePlan } from "@/lib/ophir-price-restore-plan";
import { PinnedMemoryCache } from "@/lib/pinned-memory-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PATH = "/api/ops/ophir-price-restore";
const MAX_LISTINGS = 5;
const MAX_BODY_BYTES = 32_000;
const HASH = /^[0-9a-f]{64}$/;
const CACHEABLE_PLAN_HASH = "97ff79e7959c85d19ac322962bc565b6f4304d84ff7b189aafa9994f372e1494";
const historicalPlanCache = new PinnedMemoryCache<OphirPriceRestorePlan>({
  ttlMs: 5 * 60_000, maxKeys: 2,
  accept: (plan) => plan.manifestHash === CACHEABLE_PLAN_HASH && plan.manifest.length === 32_707 &&
    plan.productAnchors.length === 81 && plan.listingGroups.length === 92,
});
function historicalPlan(client: SupabaseClient, orgId: string) {
  // Only the already reviewed immutable August29 plan is cached; current prices are never cached.
  if (EXPECTED_OPHIR_RESTORE_MANIFEST_HASH !== CACHEABLE_PLAN_HASH) return loadOphirRestorePlan(client, orgId);
  return historicalPlanCache.get(orgId, () => loadOphirRestorePlan(client, orgId));
}
const HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

function escape(value: unknown): string {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function json(value: unknown, status = 200): Response { return Response.json(value, { status, headers: HEADERS }); }
function wantsJson(request: Request): boolean {
  return new URL(request.url).searchParams.get("format") === "json" || request.headers.get("content-type")?.includes("application/json") === true;
}
function dollars(cents: number): string { return `$${(cents / 100).toFixed(2)}`; }
function listingIds(input: string, plan: OphirPriceRestorePlan): number[] {
  if (!/^\d+(?:\s*,\s*\d+)*$/.test(input)) throw new OphirRestoreError("Enter one to five listing IDs separated by commas.");
  const ids = input.split(",").map((value) => Number(value.trim()));
  if (ids.length < 1 || ids.length > MAX_LISTINGS || ids.some((id) => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    throw new OphirRestoreError("Choose one to five distinct listing IDs.");
  }
  if (ids.some((id) => !plan.listingGroups.some((listing) => listing.listingId === id))) throw new OphirRestoreError("Every selected listing must belong to the pinned last price change.");
  return ids;
}
function summary(plan: OphirPriceRestorePlan) {
  return { manifest_hash: plan.manifestHash,
    expected_manifest_pinned: HASH.test(EXPECTED_OPHIR_RESTORE_MANIFEST_HASH) && EXPECTED_OPHIR_RESTORE_MANIFEST_HASH === plan.manifestHash,
    audit_window: OPHIR_PRICE_RESTORE_WINDOW, actual_first_audit: plan.minAuditTimestamp, actual_last_audit: plan.maxAuditTimestamp,
    target_variants: plan.manifest.length, changed_variants: plan.totalChangedTargets,
    changed_product_anchors: plan.totalChangedProductAnchors, affected_listings: plan.listingGroups.length,
    shop_id: OPHIR_RESTORE_SHOP_ID, max_listings_per_request: MAX_LISTINGS,
    price_grid_summary: ophirRestoreGridSummary(plan),
    listings: plan.listingGroups.map((listing) => ({ listing_id: listing.listingId, product_id: listing.productId,
      target_variants: listing.variants.length, product_anchor: listing.productAnchor,
      prior_min_cents: listing.variants.length ? Math.min(...listing.variants.map((v) => v.beforeCents)) : null,
      prior_max_cents: listing.variants.length ? Math.max(...listing.variants.map((v) => v.beforeCents)) : null })) };
}

function completePlanHtml(request: Request, plan: OphirPriceRestorePlan): Response {
  const data = {
    export_format: "ophir-audit-plan-rows-v1", historical_only: true,
    metadata: summary(plan),
    manifest_columns: ["auditIds", "variantId", "productId", "listingId", "sku", "currency", "beforeCents", "afterCents"],
    manifest_rows: plan.manifest.map((v) => [v.auditIds, v.variantId, v.productId, v.listingId, v.sku, v.currency, v.beforeCents, v.afterCents]),
    product_anchor_columns: ["auditIds", "productId", "listingId", "sku", "currency", "beforeCents", "afterCents"],
    product_anchor_rows: plan.productAnchors.map((v) => [v.auditIds, v.productId, v.listingId, v.sku, v.currency, v.beforeCents, v.afterCents]),
    note: "Columns define each compact row exactly. The manifest hash covers the reconstructed manifest and productAnchors, in this order. No current live prices were checked or changed.",
  };
  // One compact visible DOM payload; no scripts, duplicated UI, or raw unrelated audit fields.
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Ophir complete historical price plan</title></head><body><h1>Ophir complete historical price plan</h1><p>Read-only audit export. Manifest: ${escape(plan.manifestHash)}</p><pre id="ophir-restore-plan">${escape(JSON.stringify(data))}</pre></body></html>`;
  const bytes = new TextEncoder().encode(body);
  if (bytes.length > 10_000_000) throw new OphirRestoreError("The complete plan exceeds the authenticated export bound.");
  // Compression keeps the full historical plan within the hosting response limit.
  const compressed = /\bgzip\b/.test(request.headers.get("accept-encoding") ?? "") ? gzipSync(bytes) : bytes;
  if (compressed.length > 4_000_000) throw new OphirRestoreError("Open the complete HTML plan in a browser supporting gzip compression.");
  return new Response(new Uint8Array(compressed), { headers: { ...HEADERS, "Content-Type": "text/html; charset=utf-8",
    Vary: "Cookie, Accept-Encoding", ...(compressed === bytes ? {} : { "Content-Encoding": "gzip" }) } });
}

function form(mode: "dry-run" | "apply", ids: string, manifestHash: string, proofs?: Record<string, OphirRestorePreviewProof>) {
  return `<form method="post" action="${PATH}">
    <input type="hidden" name="mode" value="${mode}">
    <input type="hidden" name="plan_hash" value="${escape(manifestHash)}">
    ${proofs ? `<input type="hidden" name="preview_proofs" value="${escape(JSON.stringify(proofs))}">` : ""}
    <label>Listing IDs (up to five, separated by commas)<input name="listing_ids" value="${escape(ids)}" required></label>
    <button type="submit">${mode === "dry-run" ? "Preview selected prices" : "Restore selected prices"}</button>
  </form>`;
}
function page(input: { plan?: OphirPriceRestorePlan; selected?: string; result?: unknown; applyProofs?: Record<string, OphirRestorePreviewProof>; status?: number }): Response {
  const { plan, result } = input;
  const ids = input.selected ?? plan?.listingGroups.slice(0, MAX_LISTINGS).map((listing) => listing.listingId).join(",") ?? "";
  let selectedPriceIds: number[] | undefined;
  if (plan && input.selected) {
    try { selectedPriceIds = listingIds(input.selected, plan); }
    catch { selectedPriceIds = undefined; }
  }
  const pinned = !!plan && HASH.test(EXPECTED_OPHIR_RESTORE_MANIFEST_HASH) && EXPECTED_OPHIR_RESTORE_MANIFEST_HASH === plan.manifestHash;
  const batches = plan ? Array.from({ length: Math.ceil(plan.listingGroups.length / MAX_LISTINGS) }, (_, index) => {
    const batch = plan.listingGroups.slice(index * MAX_LISTINGS, (index + 1) * MAX_LISTINGS);
    const batchIds = batch.map((listing) => listing.listingId).join(",");
    return `<a href="${PATH}?listing_ids=${encodeURIComponent(batchIds)}">Group ${index + 1}: ${escape(batchIds)}</a>`;
  }).join(" ") : "";
  const listingRows = plan?.listingGroups.map((listing) => {
    const prior = listing.variants.map((v) => v.beforeCents);
    return `<tr><td>${listing.listingId}</td><td>${listing.variants.length}</td><td>${prior.length ? `${dollars(Math.min(...prior))}–${dollars(Math.max(...prior))}` : "Product anchor only"}</td><td>${listing.productAnchor ? `${dollars(listing.productAnchor.afterCents)} → ${dollars(listing.productAnchor.beforeCents)}` : "Unchanged"}</td></tr>`;
  }).join("") ?? "";
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Restore Ophir’s last price change</title>
    <style>body{font:16px system-ui;margin:2rem auto;padding:0 1rem;max-width:1100px;color:#202020;background:#fafafa}h1{font-size:1.7rem}form{padding:1rem;background:#fff;border:1px solid #ddd;margin:1rem 0}label{display:block}input:not([type=hidden]){display:block;width:95%;padding:.65rem;margin:.5rem 0}button{padding:.75rem 1rem;cursor:pointer}pre{background:#fff;border:1px solid #ddd;padding:1rem;white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}table{border-collapse:collapse;width:100%;margin:1rem 0}td,th{border:1px solid #ddd;padding:.5rem;text-align:left}nav a{display:block;margin:.45rem 0}</style>
    </head><body><h1>Restore Ophir’s last price change</h1>
    <p>This operation restores the exact earlier USD prices recorded for August 29, 2026. Preview each affected listing before restoring prices.</p>
    ${plan ? `<p>${plan.listingGroups.length} listings, ${plan.totalChangedTargets} changed variant prices, and ${plan.totalChangedProductAnchors} changed product price anchors.</p><p>Verified audit plan: <code>${escape(plan.manifestHash)}</code></p>` : ""}
    ${plan && !pinned ? "<p>Price restoration is locked until the complete audit plan is reviewed and pinned.</p>" : ""}
    ${plan ? form("dry-run", ids, plan.manifestHash) : ""}
    ${plan && pinned && input.applyProofs ? `<p>The selected listings passed their live preview. Restore only after all affected listings have passed preview.</p>${form("apply", ids, plan.manifestHash, input.applyProofs)}` : ""}
    ${result !== undefined ? `<h2>Result</h2><pre id="ophir-restore-result">${escape(JSON.stringify(result, null, 2))}</pre>` : ""}
    ${plan ? `<p><a href="${PATH}?format=plan-html">Open the complete historical audit plan</a> · <a href="${PATH}?format=csv">Download every audited prior and final-run price (CSV)</a></p>
      ${selectedPriceIds ? `<details><summary>Exact audited prices for the selected listings</summary><p>These are historical prices from the last operation. Current live prices are checked by Preview.</p><pre id="ophir-restore-selected-prices">${escape(ophirRestorePricesCsv(plan, selectedPriceIds))}</pre><a href="${PATH}?format=csv&amp;listing_ids=${encodeURIComponent(input.selected!)}">Download selected audited prices (CSV)</a></details>` : ""}
      <details><summary>Audit plan summary</summary><pre id="ophir-restore-plan-summary">${escape(JSON.stringify(summary(plan), null, 2))}</pre></details><nav aria-label="Listing groups">${batches}</nav><table><thead><tr><th>Listing</th><th>Variant prices</th><th>Prior price range</th><th>Product price anchor</th></tr></thead><tbody>${listingRows}</tbody></table>` : ""}
    <p><a href="${PATH}">Open the current restoration plan</a></p></body></html>`;
  return new Response(body, { status: input.status ?? 200, headers: { ...HEADERS, "Content-Type": "text/html; charset=utf-8" } });
}
function respond(request: Request, value: unknown, status: number, plan?: OphirPriceRestorePlan, selected?: string, proofs?: Record<string, OphirRestorePreviewProof>) {
  return wantsJson(request) ? json(value, status) : page({ result: value, status, plan, selected, applyProofs: proofs });
}
function safeError(error: unknown): string {
  return error instanceof OphirRestoreError || (error instanceof Error && error.message.startsWith("Ophir price restore"))
    ? error.message : "The operation could not be completed. No further listings were processed.";
}
async function context(): Promise<{ client: SupabaseClient; orgId: string } | { error: string; status: number }> {
  const member = await requireMembership();
  if (!isManager(member.role)) return { error: MANAGER_ONLY_ERROR, status: 403 };
  const client = await createClient();
  const { data, error } = await client.from("organizations").select("id, slug").eq("id", member.org_id).maybeSingle();
  if (error || !data || data.slug !== "ophir-gold-usa") return { error: "The active organization must be Ophir Gold USA.", status: 409 };
  return { client, orgId: member.org_id };
}

export async function GET(request: Request) {
  const access = await context();
  if ("error" in access) return respond(request, { error: access.error }, access.status);
  const { client, orgId } = access;
  try {
    const plan = await historicalPlan(client, orgId);
    if (new URL(request.url).searchParams.get("format") === "plan-html") return completePlanHtml(request, plan);
    const selected = new URL(request.url).searchParams.get("listing_ids") ?? undefined;
    const selectedIds = selected ? listingIds(selected, plan) : undefined;
    if (new URL(request.url).searchParams.get("format") === "csv") {
      const csv = ophirRestorePricesCsv(plan, selectedIds);
      if (new TextEncoder().encode(csv).length > 4_000_000) throw new OphirRestoreError("The complete CSV exceeds the response bound. Select up to five listings and download each group.");
      return new Response(csv, { headers: { ...HEADERS, "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ophir-price-restore-${plan.manifestHash}${selectedIds ? "-selected" : ""}.csv"`,
        "X-Ophir-Restore-Manifest-Hash": plan.manifestHash } });
    }
    return wantsJson(request) ? json(summary(plan)) : page({ plan, selected });
  } catch (error) { return respond(request, { error: safeError(error) }, 409); }
}

export async function POST(request: Request) {
  // Explicit same-origin check is required even though the route already requires a manager session.
  if (request.headers.get("origin") !== new URL(request.url).origin) return respond(request, { error: "A same-origin browser request is required." }, 403);
  const access = await context();
  if ("error" in access) return respond(request, { error: access.error }, access.status);
  const { client, orgId } = access;
  let plan: OphirPriceRestorePlan | undefined;
  let selected: string | undefined;
  try {
    const declaredSize = Number(request.headers.get("content-length") ?? 0);
    if (!Number.isFinite(declaredSize) || declaredSize > MAX_BODY_BYTES) throw new OphirRestoreError("The restoration request is too large.");
    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) throw new OphirRestoreError("The restoration request is too large.");
    const contentType = request.headers.get("content-type") ?? "";
    const fields: Record<string, unknown> = contentType.includes("application/json") ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
    const mode = fields.mode;
    if (mode !== "dry-run" && mode !== "apply") throw new OphirRestoreError("Choose an explicit dry-run or apply operation.");
    if (typeof fields.listing_ids !== "string") throw new OphirRestoreError("Explicit listing IDs are required.");
    selected = fields.listing_ids;
    plan = await historicalPlan(client, orgId);
    if (!HASH.test(EXPECTED_OPHIR_RESTORE_MANIFEST_HASH) || plan.manifestHash !== EXPECTED_OPHIR_RESTORE_MANIFEST_HASH || fields.plan_hash !== plan.manifestHash) {
      throw new OphirRestoreError("The pinned audit plan does not match this request. Restoration is locked.");
    }
    const ids = listingIds(selected, plan);
    let previewProofs: Record<string, OphirRestorePreviewProof> | undefined;
    if (mode === "apply") {
      const access = await getEtsyWriteAccess(orgId);
      if (!access.writeEnabled) throw new OphirRestoreError("The existing Ophir Etsy connection does not permit price writes.");
      const rawProofs: unknown = typeof fields.preview_proofs === "string" ? JSON.parse(fields.preview_proofs) : fields.preview_proofs;
      if (!rawProofs || typeof rawProofs !== "object" || Array.isArray(rawProofs)) throw new OphirRestoreError("A successful preview is required for every selected listing.");
      previewProofs = {};
      for (const id of ids) {
        const proof = (rawProofs as Record<string, unknown>)[String(id)];
        if (!proof || typeof proof !== "object" || Array.isArray(proof)) throw new OphirRestoreError(`A successful preview is required for listing ${id}.`);
        const p = proof as Record<string, unknown>;
        const keys = ["currentInventoryHash", "expectedInventoryHash", "nonPriceHash", "currentDbHash"] as const;
        if (keys.some((key) => typeof p[key] !== "string" || !HASH.test(p[key] as string))) throw new OphirRestoreError(`Preview proof is invalid for listing ${id}.`);
        previewProofs[String(id)] = Object.fromEntries(keys.map((key) => [key, p[key]])) as unknown as OphirRestorePreviewProof;
      }
    }
    const etsy = await EtsyClient.forOrg(orgId);
    if (await etsy.requireShopId() !== OPHIR_RESTORE_SHOP_ID) throw new OphirRestoreError("The connected Etsy shop is not Ophir Gold USA.");
    const results: OphirRestoreListingResult[] = [];
    const successfulProofs: Record<string, OphirRestorePreviewProof> = {};
    for (const id of ids) {
      const listing = plan.listingGroups.find((group) => group.listingId === id)!;
      const result = await processOphirRestoreListing({ client, etsy, orgId, plan, listing, mode, previewProof: previewProofs?.[String(id)] });
      results.push(result);
      if (result.status === "failed") break;
      if (result.proof) successfulProofs[String(id)] = result.proof;
    }
    const complete = results.length === ids.length && results.every((result) => result.status === "verified");
    const report = { mode, plan_hash: plan.manifestHash, selected_listing_ids: ids,
      completed_listing_ids: results.filter((result) => result.status === "verified").map((result) => result.listingId),
      unprocessed_listing_ids: ids.filter((id) => !results.some((result) => result.listingId === id)),
      all_selected_verified: complete, stopped_on_failure: !complete, results,
      note: mode === "dry-run" ? "No listing prices or DB prices were changed. Preview every affected listing before applying."
        : "Only audited price_cents and Etsy offering prices were restored; timestamps and audit records update automatically. Re-preview a failed or partially completed listing before resuming." };
    return respond(request, report, complete ? 200 : 409, plan, selected, mode === "dry-run" && complete ? successfulProofs : undefined);
  } catch (error) { return respond(request, { error: safeError(error) }, 409, plan, selected); }
}
import type { SupabaseClient } from "@supabase/supabase-js";
import { gzipSync } from "node:zlib";
