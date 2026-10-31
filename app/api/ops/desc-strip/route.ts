import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { normText } from "@/lib/etsy/listing-rewrite";
import { stripPublicDescription } from "@/lib/etsy/strip-internal";
import type { EtsyListResponse } from "@/lib/etsy/types";
import { logAudit } from "@/lib/audit";

export const maxDuration = 120;

/**
 * DESC-STRIP: removes text that must not be public from listing descriptions.
 *  - image-provenance disclosure ("the images are design visualizations / AI-assisted"),
 *    owner 2026-10-27, `stripVisualizationDisclosure`;
 *  - internal workflow and status notes ("DESIGN PROPOSAL — NOT READY FOR SALE",
 *    "IMPORTANT PRODUCTION NOTE", "will be confirmed before this design is offered for
 *    sale", owner approval, supplier readback, design targets), owner 2026-10-31, every
 *    brand, `stripInternalNotes`.
 * The rules live in `stripPublicDescription`; this route only moves text.
 *
 *  - Auth: `ops_tokens` purpose='desc-strip' (SHA-256 CAS, one use) or CRON_SECRET.
 *  - `?org=` required.
 *  - `?scan=1`: read only. Pages through the shop's listings on Etsy in every state
 *    (active, draft, inactive, sold_out, expired) and reports each listing whose live
 *    description the rules would change, with its panel product id. Independent of the
 *    panel mirror; nothing is written.
 *  - Otherwise `?products=<uuid,...>` required (max 20): every write call names its targets.
 *    Source is the LIVE Etsy description, not the panel copy: the owner may have edited
 *    text in the Etsy editor and the panel mirror can be stale. A product with no Etsy
 *    listing is cleaned in the panel only.
 *  - Default is a dry run (edits, before/after length; `detail=1` adds the full before and
 *    after text). `apply=1` PATCHes the description only, reads it back in the same call
 *    and then writes the same text to products.description.
 *  - A cut that would leave less than 40% of the text is refused, never written.
 */

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "desc-strip")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

type Row = Record<string, unknown>;

const MIN_KEEP_RATIO = 0.4;
const SCAN_STATES = ["active", "draft", "inactive", "sold_out", "expired"] as const;
const PAGE = 100;

function plan(before: string) {
  const r = stripPublicDescription(before);
  const changed = r.text !== before;
  const tooLarge = changed && r.text.length < before.length * MIN_KEEP_RATIO;
  return { ...r, changed, tooLarge };
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const scan = url.searchParams.get("scan") === "1";
  const detail = url.searchParams.get("detail") === "1";
  const orgName = url.searchParams.get("org");
  const productIds = (url.searchParams.get("products") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s));
  if (!orgName) return NextResponse.json({ error: "org is required" }, { status: 400 });
  if (scan && apply) return NextResponse.json({ error: "scan is read only; apply needs products" }, { status: 400 });
  if (!scan && (productIds.length === 0 || productIds.length > 20)) {
    return NextResponse.json({ error: "products (1-20 uuids) are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("name", orgName).maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;

  if (scan) {
    let client: EtsyClient;
    try {
      client = await EtsyClient.forOrg(orgId);
    } catch (e) {
      return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
    }
    const shopId = await client.requireShopId();
    const byState: Record<string, number> = {};
    const hits: Row[] = [];
    let scanned = 0;
    for (const st of SCAN_STATES) {
      for (let offset = 0; ; offset += PAGE) {
        const page = await client.get<EtsyListResponse<{ listing_id: number; state?: string; title?: string; description?: string }>>(
          etsyPaths.shopListings(shopId),
          { limit: PAGE, offset, state: st },
        );
        const rows = page.results ?? [];
        for (const l of rows) {
          scanned++;
          const state = l.state ?? st;
          byState[state] = (byState[state] ?? 0) + 1;
          const before = decodeHtmlEntities(l.description ?? "");
          const p = plan(before);
          if (!p.changed) continue;
          hits.push({
            listing: l.listing_id,
            state,
            title: decodeHtmlEntities(l.title ?? "").slice(0, 90),
            tooLarge: p.tooLarge,
            removed: p.removed,
            edits: p.edits,
            from: before.length,
            to: p.text.length,
            ...(detail ? { before, after: p.text } : {}),
          });
        }
        if (rows.length < PAGE) break;
      }
    }
    // Panel product for each hit (apply works on product ids).
    const ids = hits.map((h) => h.listing as number);
    const { data: prods } = ids.length
      ? await admin.from("products").select("id, etsy_listing_id").eq("org_id", orgId).in("etsy_listing_id", ids)
      : { data: [] };
    const byListing = new Map(((prods ?? []) as { id: string; etsy_listing_id: number }[]).map((p) => [p.etsy_listing_id, p.id]));
    for (const h of hits) h.product = byListing.get(h.listing as number) ?? null;
    return NextResponse.json({
      ok: true,
      scan: true,
      org: orgName,
      scanned,
      byState,
      hits: hits.length,
      notInPanel: hits.filter((h) => !h.product).length,
      results: hits,
    });
  }

  const { data: prods } = await admin
    .from("products")
    .select("id, sku, etsy_listing_id, description")
    .eq("org_id", orgId)
    .in("id", productIds);
  const found = (prods ?? []) as { id: string; sku: string | null; etsy_listing_id: number | null; description: string | null }[];

  let client: EtsyClient | null = null;
  const needsEtsy = found.some((p) => p.etsy_listing_id);
  if (needsEtsy) {
    try {
      client = await EtsyClient.forOrg(orgId);
    } catch (e) {
      return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
    }
  }

  const results: Row[] = [];
  for (const id of productIds) {
    const p = found.find((x) => x.id === id);
    if (!p) {
      results.push({ product: id, status: "panelde-yok" });
      continue;
    }
    try {
      if (!p.etsy_listing_id || !client) {
        const before = p.description ?? "";
        const r = plan(before);
        if (!r.changed) {
          results.push({ product: id, sku: p.sku, status: "clean", where: "panel" });
          continue;
        }
        const base: Row = { product: id, sku: p.sku, where: "panel", removed: r.removed, edits: r.edits, from: before.length, to: r.text.length, ...(detail ? { before, after: r.text } : {}) };
        if (r.tooLarge) {
          results.push({ ...base, status: "refused-large-cut" });
          continue;
        }
        if (apply) {
          await admin.from("products").update({ description: r.text }).eq("id", id).eq("org_id", orgId);
        }
        results.push({ ...base, status: apply ? "stripped" : "would-strip" });
        continue;
      }

      const listingId = p.etsy_listing_id;
      const live = await client.get<{ description?: string; state?: string }>(etsyPaths.listing(listingId));
      const before = decodeHtmlEntities(live.description ?? "");
      const r = plan(before);
      const base: Row = { product: id, sku: p.sku, listing: listingId, state: live.state ?? null };
      if (!r.changed) {
        // Etsy is already clean; bring a stale panel copy in line so it cannot be pushed back later.
        const panelClean = !plan(p.description ?? "").changed;
        if (apply && !panelClean) {
          await admin.from("products").update({ description: before }).eq("id", id).eq("org_id", orgId);
        }
        results.push({ ...base, status: "clean", panelClean });
        continue;
      }
      const change: Row = { removed: r.removed, edits: r.edits, from: before.length, to: r.text.length, ...(detail ? { before, after: r.text } : {}) };
      if (r.tooLarge) {
        results.push({ ...base, ...change, status: "refused-large-cut" });
        continue;
      }
      if (!apply) {
        results.push({ ...base, ...change, status: "would-strip" });
        continue;
      }
      const shopId = await client.requireShopId();
      await client.requestForm("PATCH", etsyPaths.shopListing(shopId, listingId), { description: r.text });
      const after = await client.get<{ description?: string }>(etsyPaths.listing(listingId));
      const verified = normText(decodeHtmlEntities(after.description ?? "")) === normText(r.text);
      if (verified) {
        await admin.from("products").update({ description: r.text }).eq("id", id).eq("org_id", orgId);
      }
      await logAudit(admin, {
        orgId,
        action: "etsy.desc_strip",
        entityType: "product",
        entityId: id,
        summary:
          `Açıklamadan kamuya açık olmaması gereken metin kaldırıldı (ops desc-strip): listing ${listingId}, ` +
          `${r.removed.length} görselleştirme cümlesi, ${r.edits.length} iç not düzenlemesi, ` +
          `${before.length} -> ${r.text.length} kr; read-back ${verified ? "doğrulandı" : "BAŞARISIZ"}.`,
      });
      results.push({ ...base, ...change, status: verified ? "stripped" : "verify-failed" });
    } catch (e) {
      results.push({ product: id, sku: p.sku, status: "error", detail: String(e) });
    }
  }

  const count = (s: string) => results.filter((r) => r.status === s).length;
  return NextResponse.json({
    ok: true,
    apply,
    org: orgName,
    targets: productIds.length,
    wouldStrip: count("would-strip"),
    stripped: count("stripped"),
    clean: count("clean"),
    refused: count("refused-large-cut"),
    failed: count("verify-failed") + count("error") + count("panelde-yok"),
    results,
  });
}
