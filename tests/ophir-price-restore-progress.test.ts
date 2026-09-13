import assert from "node:assert/strict";
import test from "node:test";
import {
  OPHIR_PROGRESS_PLAN_HASH, OphirProgressRequestFailure, OphirRestoreProgressController,
  validateOphirProgressResponse, validateOphirProgressSummary,
  type OphirProgressSummary, type OphirProgressRequest,
} from "@/lib/ophir-price-restore-progress";

function summary(): OphirProgressSummary {
  return validateOphirProgressSummary({ manifest_hash: OPHIR_PROGRESS_PLAN_HASH, expected_manifest_pinned: true,
    affected_listings: 92, target_variants: 32_707, changed_variants: 32_707, changed_product_anchors: 81, shop_id: 66_983_205,
    audit_window: { since: "2026-08-29T18:45:00Z", until: "2026-08-29T19:05:00Z" },
    listings: Array.from({ length: 92 }, (_, index) => {
      const id = 4_549_712_730 + index;
      const product = `22222222-2222-4222-8222-${String(index + 1).padStart(12, "0")}`;
      return { listing_id: id, product_id: product, target_variants: index < 47 ? 356 : 355,
        product_anchor: index < 81 ? { productId: product, listingId: id, currency: "USD", beforeCents: 100, afterCents: 200 } : null };
    }) });
}
function response(s: OphirProgressSummary, ids: number[], mode: "dry-run" | "apply", already = false) {
  return { mode, plan_hash: OPHIR_PROGRESS_PLAN_HASH, selected_listing_ids: ids.slice(), completed_listing_ids: ids.slice(),
    unprocessed_listing_ids: [] as number[], all_selected_verified: true, stopped_on_failure: false,
    results: ids.map((id) => {
      const listing = s.listings.find((listing) => listing.listing_id === id)!;
      const count = listing.target_variants;
      return { listingId: id, productId: listing.product_id, mode, status: "verified",
        stage: mode === "dry-run" ? "preview-complete" : "completed-readback", targetVariants: count,
        nonPriceFieldsPreserved: true, etsyPricesChanged: already ? 0 : count, etsyAlreadyRestored: already ? count : 0,
        dbVariantsChanged: mode === "apply" && !already ? count : 0,
        dbAnchorChanged: mode === "apply" && !already && listing.product_anchor !== null,
        etsyWriteAttempted: mode === "apply" && !already, auditWritten: mode === "apply",
        proof: { currentInventoryHash: "a".repeat(64), expectedInventoryHash: "b".repeat(64), nonPriceHash: "c".repeat(64), currentDbHash: "d".repeat(64) },
        prices: Array.from({ length: count }, (_, index) => ({ sku: `OPH-${id}-10R-${index + 3}`, currentCents: already ? 100 : 200,
          targetCents: 100, status: already ? "already-restored" : "restore" })) };
    }) };
}

test("restoration is forbidden before complete initial coverage and Preview never auto-applies", async () => {
  const s = summary();
  const calls: OphirProgressRequest[] = [];
  const controller = new OphirRestoreProgressController(async (request) => {
    calls.push(request);
    return response(s, request.listing_ids.split(",").map(Number), request.mode);
  });
  controller.initialize(s);
  await assert.rejects(controller.restoreAll(), /All 92 listings must pass/);
  assert.equal(calls.length, 0);
  await controller.previewAll();
  assert.equal(controller.getSnapshot().previewedListings, 92);
  assert.equal(controller.getSnapshot().previewedVariants, 32_707);
  assert.equal(controller.getSnapshot().canRestore, true);
  assert.equal(controller.getSnapshot().restoredListings, 0);
  assert.equal(calls.length, 19);
  assert.ok(calls.every((request) => request.mode === "dry-run" && request.listing_ids.split(",").length <= 5));
});

for (const variant of ["missing", "duplicate", "wrong-hash", "unexpected-write", "wrong-sku", "wrong-count"] as const) {
  test(`unsafe ${variant} initial preview stops progress without enabling restoration`, async () => {
    const s = summary();
    const controller = new OphirRestoreProgressController(async (request) => {
      const result = response(s, request.listing_ids.split(",").map(Number), request.mode);
      if (variant === "missing") result.results.pop();
      if (variant === "duplicate") result.results[1] = result.results[0];
      if (variant === "wrong-hash") result.plan_hash = "0".repeat(64);
      if (variant === "unexpected-write") result.results[0].etsyWriteAttempted = true;
      if (variant === "wrong-sku") result.results[0].prices[0].sku = "OPH-9999999999-10R-3";
      if (variant === "wrong-count") result.results[0].targetVariants--;
      return result;
    });
    controller.initialize(s); await controller.previewAll();
    assert.equal(controller.getSnapshot().phase, "preview-paused");
    assert.equal(controller.getSnapshot().previewedListings, 0);
    assert.equal(controller.getSnapshot().canRestore, false);
    await assert.rejects(controller.restoreAll(), /All 92 listings must pass/);
  });
}

test("paused preview resumes its failed batch and retains ordered failure evidence", async () => {
  const s = summary(); let calls = 0;
  const controller = new OphirRestoreProgressController(async (request) => {
    calls++;
    if (calls === 1) throw new OphirProgressRequestFailure("Temporary read failure", { error: "Database code: 57014." });
    return response(s, request.listing_ids.split(",").map(Number), request.mode);
  });
  controller.initialize(s); await controller.previewAll();
  assert.equal(controller.getSnapshot().phase, "preview-paused");
  assert.equal(calls, 1);
  await controller.previewAll();
  assert.equal(controller.getSnapshot().phase, "preview-complete");
  assert.equal(calls, 20);
  const entries = controller.report().entries;
  assert.deepEqual(entries[0].listingIds, entries[1].listingIds);
  assert.deepEqual(entries[0].response, { error: "Database code: 57014." });
  assert.equal(entries[0].error, "Temporary read failure");
  assert.ok(entries.every((entry, index) => entry.sequence === index + 1 && entry.phase === "initial-preview"));
});

test("fresh preview with changed historical target prevents the singleton apply", async () => {
  const s = summary(); let applies = 0;
  const controller = new OphirRestoreProgressController(async (request) => {
    if (request.mode === "apply") applies++;
    const ids = request.listing_ids.split(",").map(Number);
    const r = response(s, ids, request.mode);
    if (ids.length === 1) r.results[0].prices[0].targetCents = 99;
    return r;
  });
  controller.initialize(s); await controller.previewAll(); await controller.restoreAll();
  assert.equal(controller.getSnapshot().phase, "restore-paused");
  assert.match(controller.getSnapshot().error!, /exact prior prices changed/);
  assert.equal(applies, 0);
});

test("uncertain apply stops without retry; resumption begins with a new already-restored preview", async () => {
  const s = summary(); const calls: OphirProgressRequest[] = []; let uncertain = true; let already = false;
  const controller = new OphirRestoreProgressController(async (request) => {
    calls.push(request);
    const ids = request.listing_ids.split(",").map(Number);
    if (request.mode === "apply" && uncertain) { uncertain = false; already = true; throw new Error("Uncertain apply response"); }
    if (ids.length === 1 && ids[0] === s.listings[1].listing_id) controller.requestPause();
    return response(s, ids, request.mode, already);
  });
  controller.initialize(s); await controller.previewAll(); await controller.restoreAll();
  assert.equal(controller.getSnapshot().phase, "restore-paused");
  assert.equal(calls.filter((request) => request.mode === "apply").length, 1);
  assert.equal(controller.getSnapshot().restoredListings, 0);
  const beforeResume = calls.length;
  await controller.restoreAll();
  assert.equal(calls[beforeResume].mode, "dry-run");
  assert.equal(calls[beforeResume].listing_ids, s.listings[0].listing_id.toString());
  assert.equal(calls[beforeResume + 1].mode, "apply");
  assert.equal(controller.getSnapshot().restoredListings, 1);
  assert.equal(controller.getSnapshot().etsyPricesChanged, 0);
  assert.equal(controller.getSnapshot().etsyAlreadyRestored, s.listings[0].target_variants);
  assert.equal(controller.getSnapshot().phase, "restore-paused");
  const entries = controller.report().entries;
  const failedApply = entries.find((entry) => entry.phase === "apply" && entry.error)!;
  assert.equal(failedApply.error, "Uncertain apply response");
  assert.equal(entries[failedApply.sequence].phase, "fresh-preview");
});

test("full run is sequential and each apply carries its immediately preceding singleton proof", async () => {
  const s = summary(); const calls: OphirProgressRequest[] = []; let active = 0; let maxActive = 0;
  const controller = new OphirRestoreProgressController(async (request) => {
    active++; maxActive = Math.max(maxActive, active); calls.push(request); await Promise.resolve();
    active--; return response(s, request.listing_ids.split(",").map(Number), request.mode);
  });
  controller.initialize(s); await controller.previewAll(); await controller.restoreAll();
  assert.equal(maxActive, 1);
  assert.equal(controller.getSnapshot().phase, "complete");
  assert.equal(controller.getSnapshot().restoredListings, 92);
  assert.equal(controller.getSnapshot().restoredVariants, 32_707);
  assert.equal(controller.getSnapshot().dbAnchorsChanged, 81);
  const applies = calls.filter((request) => request.mode === "apply");
  assert.equal(applies.length, 92);
  for (const request of applies) {
    const index = calls.indexOf(request);
    assert.equal(calls[index - 1].mode, "dry-run");
    assert.equal(calls[index - 1].listing_ids, request.listing_ids);
    assert.equal(request.listing_ids.split(",").length, 1);
    assert.deepEqual(request.preview_proofs?.[request.listing_ids], response(s, [Number(request.listing_ids)], "dry-run").results[0].proof);
  }
  const report = controller.report();
  assert.equal(report.entries.length, 203);
  assert.ok(Buffer.byteLength(JSON.stringify(report)) < 10_000_000);
  const firstResponse = report.entries[0].response as { results: { prices: unknown[][] }[] };
  assert.deepEqual(firstResponse.results[0].prices[0], [`OPH-${s.listings[0].listing_id}-10R-3`, 200, 100, "restore"]);
});

test("wrong plan summary and apply without a fresh proof are rejected", () => {
  const s = summary();
  assert.throws(() => validateOphirProgressSummary({ ...s, manifest_hash: "0".repeat(64) }), /does not match/);
  const id = s.listings[0].listing_id;
  assert.throws(() => validateOphirProgressResponse({ summary: s, listingIds: [id], mode: "apply", response: response(s, [id], "apply") }), /immediately preceding fresh preview/);
});
