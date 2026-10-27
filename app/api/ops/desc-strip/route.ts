import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { normText } from "@/lib/etsy/listing-rewrite";
import { stripVisualizationDisclosure } from "@/lib/etsy/strip-visualization";
import { logAudit } from "@/lib/audit";

export const maxDuration = 120;

/**
 * DESC-STRIP: removes the "images are design visualizations / AI-assisted"
 * disclosure from listing descriptions (owner 2026-10-27, by Artifact Studio
 * Jewelry and EON). The rule is `stripVisualizationDisclosure`; this route only
 * moves text.
 *
 *  - Auth: `ops_tokens` purpose='desc-strip' (SHA-256 CAS, one use) or CRON_SECRET.
 *  - `?org=` required; `?products=<uuid,...>` required (max 20): every call
 *    names its targets.
 *  - Source is the LIVE Etsy description, not the panel copy: the owner may
 *    have edited text in the Etsy editor and the panel mirror can be stale.
 *    A product with no Etsy listing is cleaned in the panel only.
 *  - Default is a dry run (removed fragments, before/after length). `apply=1`
 *    PATCHes the description only, reads it back in the same call and then
 *    writes the same text to products.description.
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

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const orgName = url.searchParams.get("org");
  const productIds = (url.searchParams.get("products") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s));
  if (!orgName || productIds.length === 0 || productIds.length > 20) {
    return NextResponse.json({ error: "org and products (1-20 uuids) are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("name", orgName).maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;

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
        const { text, removed } = stripVisualizationDisclosure(before);
        if (removed.length === 0) {
          results.push({ product: id, sku: p.sku, status: "clean", where: "panel" });
          continue;
        }
        if (apply) {
          await admin.from("products").update({ description: text }).eq("id", id).eq("org_id", orgId);
        }
        results.push({ product: id, sku: p.sku, status: apply ? "stripped" : "would-strip", where: "panel", removed, from: before.length, to: text.length });
        continue;
      }

      const listingId = p.etsy_listing_id;
      const live = await client.get<{ description?: string; state?: string }>(etsyPaths.listing(listingId));
      const before = decodeHtmlEntities(live.description ?? "");
      const { text, removed } = stripVisualizationDisclosure(before);
      const base: Row = { product: id, sku: p.sku, listing: listingId, state: live.state ?? null };
      if (removed.length === 0) {
        // Etsy is already clean; bring a stale panel copy in line so it cannot be pushed back later.
        const panelClean = stripVisualizationDisclosure(p.description ?? "").removed.length === 0;
        if (apply && !panelClean) {
          await admin.from("products").update({ description: before }).eq("id", id).eq("org_id", orgId);
        }
        results.push({ ...base, status: "clean", panelClean });
        continue;
      }
      if (!apply) {
        results.push({ ...base, status: "would-strip", removed, from: before.length, to: text.length });
        continue;
      }
      const shopId = await client.requireShopId();
      await client.requestForm("PATCH", etsyPaths.shopListing(shopId, listingId), { description: text });
      const after = await client.get<{ description?: string }>(etsyPaths.listing(listingId));
      const verified = normText(decodeHtmlEntities(after.description ?? "")) === normText(text);
      if (verified) {
        await admin.from("products").update({ description: text }).eq("id", id).eq("org_id", orgId);
      }
      await logAudit(admin, {
        orgId,
        action: "etsy.desc_strip",
        entityType: "product",
        entityId: id,
        summary:
          `Görselleştirme beyanı kaldırıldı (ops desc-strip): listing ${listingId}, ${removed.length} cümle, ` +
          `${before.length} -> ${text.length} kr; read-back ${verified ? "doğrulandı" : "BAŞARISIZ"}.`,
      });
      results.push({ ...base, status: verified ? "stripped" : "verify-failed", removed, from: before.length, to: text.length });
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
    failed: count("verify-failed") + count("error") + count("panelde-yok"),
    results,
  });
}
