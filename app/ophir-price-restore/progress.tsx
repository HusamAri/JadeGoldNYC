"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_OPHIR_PROGRESS, OPHIR_PROGRESS_PLAN_HASH, OphirRestoreProgressController, OphirProgressRequestFailure,
  type OphirProgressRequest,
} from "@/lib/ophir-price-restore-progress";

const API = "/api/ops/ophir-price-restore?format=json";
async function request(body?: OphirProgressRequest): Promise<unknown> {
  let response: Response;
  try { response = await fetch(API, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) }); }
  catch { throw new Error(body?.mode === "apply" ? "The restoration request did not finish. Stop and check this listing before resuming." : "The preview request did not finish. Resume preview to try this batch again."); }
  if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) throw new Error("The session response could not be verified. Sign in and return to this page.");
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new Error("The server response could not be read. Stop and preview this listing again."); }
  if (!response.ok) {
    const error = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>).error : null;
    throw new OphirProgressRequestFailure(typeof error === "string" ? error : "The server did not confirm the request. Stop and preview this listing again.", data);
  }
  return data;
}

export default function OphirRestoreProgress() {
  const [snapshot, setSnapshot] = useState(EMPTY_OPHIR_PROGRESS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const controller = useMemo(() => new OphirRestoreProgressController(request, setSnapshot), []);
  useEffect(() => {
    let active = true;
    request().then((summary) => { if (active) controller.initialize(summary); })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : "The plan could not be loaded."); });
    return () => { active = false; };
  }, [controller]);
  const busy = snapshot.phase === "previewing" || snapshot.phase === "restoring";
  const run = (mode: "preview" | "restore") => {
    setLoadError(null);
    const action = mode === "preview" ? controller.previewAll() : controller.restoreAll();
    action.catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "The operation stopped."));
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(controller.report())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `ophir-price-restoration-report-${OPHIR_PROGRESS_PLAN_HASH}.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3_000);
  };
  const labels = { idle: snapshot.initialized ? "Ready to preview" : "Loading the reviewed price plan…", previewing: "Previewing prices",
    "preview-paused": "Preview paused", "preview-complete": "All listings passed preview", restoring: "Restoring prices",
    "restore-paused": "Restoration paused", complete: "All prices restored and verified" };
  const button = "rounded border border-neutral-300 bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40";
  return <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
    <h1 className="text-2xl font-semibold">Restore Ophir’s last price change</h1>
    <p>Preview all 92 affected listings, then restore their exact earlier prices. Each restoration checks the current listing again and verifies that other listing details stay unchanged.</p>
    <div className="space-y-2 rounded border border-neutral-200 p-5" aria-live="polite" id="ophir-restore-status">
      <p className="font-medium">{labels[snapshot.phase]}</p>
      <p>Listings previewed: {snapshot.previewedListings} / 92 · Variant prices checked: {snapshot.previewedVariants.toLocaleString()} / 32,707</p>
      <p>Listings restored and verified: {snapshot.restoredListings} / 92 · Variant prices verified: {snapshot.restoredVariants.toLocaleString()} / 32,707</p>
      <p>Etsy price changes in verified results: {snapshot.etsyPricesChanged.toLocaleString()} · Already at prior prices: {snapshot.etsyAlreadyRestored.toLocaleString()}</p>
      <p>Panel price changes in verified results: {snapshot.dbVariantsChanged.toLocaleString()} · Product price anchors changed: {snapshot.dbAnchorsChanged} / 81</p>
      {snapshot.currentListingId && <p>Current listing: {snapshot.currentListingId}</p>}
      {snapshot.pauseRequested && busy && <p>Pause requested. The current request will finish first.</p>}
      {(snapshot.error || loadError) && <p role="alert" className="text-red-700">{snapshot.error || loadError}</p>}
    </div>
    <div className="flex flex-wrap gap-3">
      <button className={button} disabled={!snapshot.initialized || busy || !["idle", "preview-paused"].includes(snapshot.phase)} onClick={() => run("preview")}>{snapshot.phase === "preview-paused" ? "Resume preview" : "Preview all listings"}</button>
      <button className={button} disabled={!snapshot.canRestore || busy || snapshot.phase === "complete"} onClick={() => run("restore")}>{snapshot.phase === "restore-paused" ? "Resume restoration" : "Restore prices"}</button>
      {busy && <button className={button} disabled={snapshot.pauseRequested} onClick={() => controller.requestPause()}>Pause after current request</button>}
      <button className={button} disabled={!snapshot.initialized} onClick={download}>Download report</button>
      {!snapshot.initialized && loadError && <button className={button} onClick={() => {
        setLoadError(null); request().then((summary) => controller.initialize(summary)).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "The plan could not be loaded."));
      }}>Reload plan</button>}
    </div>
    <p className="text-sm text-neutral-600">Keep this page open while it runs. Progress stays in this page’s memory. Download the report before leaving.</p>
    <p className="text-sm text-neutral-600">Change counts include completed, verified results. Failed or uncertain attempts remain in the downloaded report.</p>
  </main>;
}
