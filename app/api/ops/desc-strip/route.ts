import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { normText } from "@/lib/etsy/listing-rewrite";
import { getListingTranslation, putListingTranslation } from "@/lib/etsy/listing";
import { cleanAltText, publicTextProblem, stripPublicDescription } from "@/lib/etsy/strip-internal";
import type { EtsyListResponse } from "@/lib/etsy/types";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * DESC-STRIP: removes text that must not be public from listing descriptions.
 *  - image-provenance disclosure ("the images are design visualizations / AI-assisted"),
 *    owner 2026-10-27;
 *  - internal workflow and status notes ("DESIGN PROPOSAL — NOT READY FOR SALE",
 *    "IMPORTANT PRODUCTION NOTE", "will be confirmed before this design is offered for
 *    sale", owner approval, supplier readback, design targets), owner 2026-10-31, every
 *    brand.
 * The rules live in `stripPublicDescription` (lib/etsy/strip-internal.ts); this route only
 * moves text.
 *
 *  - Auth: `ops_tokens` purpose='desc-strip' (SHA-256 CAS, one use) or CRON_SECRET.
 *  - `?org=` required.
 *  - `?scan=1`: read only. Pages through the shop's listings on Etsy in every state
 *    (active, draft, inactive, sold_out, expired) and reports each listing whose live
 *    description the rules would change, with its panel product id. Independent of the
 *    panel mirror; nothing is written. `lang=es` scans that language's listing
 *    translation instead (one read per listing; a listing without one is skipped).
 *  - Otherwise `?products=<uuid,...>` required (max 20): every write call names its targets.
 *    Source is the LIVE Etsy description, not the panel copy: the owner may have edited
 *    text in the Etsy editor and the panel mirror can be stale. A product with no Etsy
 *    listing is cleaned in the panel only. With `lang=es` the listing translation is
 *    cleaned instead (title and tags are written back as Etsy holds them).
 *  - Default is a dry run (edits, before/after length; `detail=1` adds the full before and
 *    after text). `apply=1` PATCHes the description only, reads it back in the same call
 *    and then writes the same text to products.description. The audit row keeps the live
 *    text from before the write (`diff.before`), the only way back.
 *  - A cut that would leave less than 40% of the text is refused, never written.
 *  - A run that nears the time limit stops starting new work and reports the rest as
 *    `deferred`.
 *  - `?images=1`: the same for image alt text (public: Etsy serves it with the photo).
 *    With `listings=<etsy ids, max 40>` and no apply it only reads; with `products=` and
 *    `apply=1` it re-attaches each image whose alt text changes at its current rank with
 *    the cleaned alt (`cleanAltText`, the gallery marker "[...]" stays), re-reads the
 *    gallery after every image and stops the listing if the image order moved. Every
 *    outcome (fixed, stopped, error, deferred) is audited with the order from before the
 *    first write and each image's old alt; a listing whose last run did not finish is
 *    refused (`needs-review`) until a person has looked at it (`reviewed=1`). Descriptions are not
 *    touched in this mode.
 *  - `?replan=1` with `products=` (and `lang=` for a translation): the rules got better
 *    after a write (2026-11-01: a Spanish line of glued bullets lost its gift-message and care
 *    bullets with the disclosure at its end). Reads the live text, finds the desc-strip write
 *    that left exactly that text (`diff.after`; an attempt that never landed does not match),
 *    walks back to the text before any desc-strip write (`diff.original`, or through the
 *    earlier writes' `before`), runs the current rules on it and writes the result, so what an
 *    earlier rule took by mistake comes back. A live text no write left (someone changed it
 *    since) is reported as `changed-since` and never written. A result that would restore the
 *    whole original is refused (`original-clean`). Dry run by default, `apply=1` writes,
 *    reads back and audits like any other write. Every desc-strip write records `original`
 *    the same way, so the chain stays whole.
 *  - `?scan=1&smell=1`: also lists, for every scanned listing, the lines of the cleaned text
 *    that still match a broad internal-note pattern (SMELL_RE), deduplicated with a count.
 *    Read only; it is for a person to read, to find wordings the rules do not know yet.
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
// maxDuration is 300 s; stop starting new Etsy work well before it.
const BUDGET_MS = 240_000;

type Photo = { listing_image_id: number; rank: number; alt_text?: string | null };
const altKey = (s: string | null | undefined) => decodeHtmlEntities(s ?? "").trim();
const order = (list: Photo[]) => [...list].sort((a, b) => a.rank - b.rank).map((p) => p.listing_image_id);
const pause = () => new Promise((r) => setTimeout(r, 1000));

/** Alt-text plan for one gallery: every image whose alt the rules would change. */
function altPlan(list: Photo[], title: string) {
  return [...list]
    .sort((a, b) => a.rank - b.rank)
    .map((p) => ({ id: p.listing_image_id, rank: p.rank, from: altKey(p.alt_text), to: cleanAltText(altKey(p.alt_text), title) }))
    .filter((x) => x.from !== "" && x.to !== x.from);
}

/** Statuses of an images apply that did not finish cleanly. */
const UNFINISHED = new Set(["order-changed", "alt-not-applied", "image-missing", "error", "deferred-partial"]);

async function imagesMode(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  orgName: string,
  url: URL,
  apply: boolean,
  productIds: string[],
  deadline: number,
) {
  // `reviewed=1`: a person has checked the gallery after an unfinished run.
  const reviewed = url.searchParams.get("reviewed") === "1";
  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
  }
  const readGallery = async (listingId: number) =>
    (await client.get<{ results?: Photo[] }>(etsyPaths.listingImagesRead(listingId))).results ?? [];

  // Targets: Etsy listing ids (read only) or panel products (read or apply).
  let targets: { product: string | null; listing: number }[] = [];
  if (productIds.length > 0) {
    const { data } = await admin.from("products").select("id, etsy_listing_id").eq("org_id", orgId).in("id", productIds);
    const rows = (data ?? []) as { id: string; etsy_listing_id: number | null }[];
    targets = productIds.map((id) => ({ product: id, listing: rows.find((r) => r.id === id)?.etsy_listing_id ?? 0 }));
  } else {
    if (apply) return NextResponse.json({ error: "apply needs products" }, { status: 400 });
    const ids = (url.searchParams.get("listings") ?? "").split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0 || ids.length > 40) return NextResponse.json({ error: "listings (1-40 Etsy ids) or products (1-20) are required" }, { status: 400 });
    // The panel product of each listing, so the dry run runs the same unfinished-run gate as apply.
    const { data, error: prodErr } = await admin.from("products").select("id, etsy_listing_id").eq("org_id", orgId).in("etsy_listing_id", ids);
    // Without the products the gate cannot run: fail closed rather than report a listing as unknown.
    if (prodErr) return NextResponse.json({ error: "products unreadable", detail: prodErr.message }, { status: 503 });
    const rows = (data ?? []) as { id: string; etsy_listing_id: number }[];
    targets = ids.map((listing) => ({ product: rows.find((r) => r.etsy_listing_id === listing)?.id ?? null, listing }));
  }

  const audit = (t: { product: string | null; listing: number }, status: string, diff: Row) =>
    logAudit(admin, {
      orgId,
      action: "etsy.alt_strip",
      entityType: "product",
      entityId: t.product,
      summary:
        `Görsel alt metninden iç not / görselleştirme notu kaldırıldı (ops desc-strip): listing ${t.listing}, ` +
        `${(diff.done as Row[] | undefined)?.length ?? 0} görsel, durum ${status}.`,
      diff: { listing: t.listing, status, ...diff },
      source: "ops/desc-strip",
    });

  const results: Row[] = [];
  for (const t of targets) {
    if (!t.listing) {
      results.push({ product: t.product, status: "etsy-listing-yok" });
      continue;
    }
    if (Date.now() >= deadline) {
      results.push({ product: t.product, listing: t.listing, status: "deferred" });
      continue;
    }
    let beforeOrder: number[] = [];
    const done: Row[] = [];
    // The image whose re-attach was sent and not yet read back: Etsy may hold it even if a call threw.
    let inFlight: Row | null = null;
    let base: Row = { product: t.product, listing: t.listing };
    try {
      const live = await client.get<{ title?: string; state?: string }>(etsyPaths.listing(t.listing));
      const title = decodeHtmlEntities(live.title ?? "").slice(0, 140);
      const before = await readGallery(t.listing);
      const changes = altPlan(before, title);
      base = { ...base, state: live.state ?? null, images: before.length };
      if (changes.length === 0) {
        results.push({ ...base, status: "clean" });
        continue;
      }
      // A run that stopped half way left the gallery as it found it only up to the stop;
      // a new run would take that order as its baseline. A person looks first. The dry run
      // reports the same gate, so it never promises a fix that apply will refuse.
      if (t.product) {
        const { data: last, error: gateErr } = await admin
          .from("audit_log")
          .select("diff, created_at")
          .eq("org_id", orgId)
          .eq("action", "etsy.alt_strip")
          .eq("entity_id", t.product)
          .order("created_at", { ascending: false })
          .limit(1);
        if (gateErr) {
          results.push({ ...base, status: "needs-review", lastStatus: null, detail: `audit gate unreadable: ${gateErr.message}`, changes });
          continue;
        }
        const lastStatus = ((last ?? [])[0] as { diff?: { status?: string } } | undefined)?.diff?.status;
        if (lastStatus && UNFINISHED.has(lastStatus) && !reviewed) {
          results.push({ ...base, status: "needs-review", lastStatus, changes });
          continue;
        }
      }
      if (!apply) {
        results.push({ ...base, status: "would-fix", changes });
        continue;
      }
      const shopId = await client.requireShopId();
      if (Date.now() >= deadline) {
        results.push({ ...base, status: "deferred" });
        continue;
      }
      beforeOrder = order(before);
      const expectOrder = [...beforeOrder];
      let cur = before;
      let stop: string | null = null;
      for (const c of changes) {
        if (Date.now() >= deadline) {
          stop = "deferred-partial";
          break;
        }
        // Rank from the latest read: Etsy may compact ranks after a write.
        const rank = cur.find((p) => p.listing_image_id === c.id)?.rank;
        if (rank === undefined) {
          stop = "image-missing";
          break;
        }
        const form = new FormData();
        form.append("listing_image_id", String(c.id));
        form.append("rank", String(rank));
        form.append("alt_text", c.to);
        inFlight = { id: c.id, rank, from: c.from, to: c.to };
        const back = await client.requestMultipart<{ listing_image_id?: number }>("POST", etsyPaths.listingImages(shopId, t.listing), form);
        const newId = back?.listing_image_id ?? c.id;
        inFlight = { ...inFlight, newId };
        let list = await readGallery(t.listing);
        for (let i = 0; i < 3 && !list.some((p) => p.listing_image_id === newId && altKey(p.alt_text) === c.to); i++) {
          await pause();
          list = await readGallery(t.listing);
        }
        cur = list;
        const altOk = list.some((p) => p.listing_image_id === newId && altKey(p.alt_text) === c.to);
        const idx = expectOrder.indexOf(c.id);
        if (idx >= 0) expectOrder[idx] = newId;
        const orderOk = JSON.stringify(order(list)) === JSON.stringify(expectOrder);
        done.push({ id: c.id, newId, rank, from: c.from, to: c.to, altOk, orderOk });
        inFlight = null;
        if (!altOk || !orderOk) {
          stop = !orderOk ? "order-changed" : "alt-not-applied";
          break;
        }
      }
      // Deadline before the first write: nothing was sent, so nothing to audit or review.
      if (stop === "deferred-partial" && done.length === 0) {
        results.push({ ...base, status: "deferred" });
        continue;
      }
      if (stop) {
        await audit(t, stop, { beforeOrder, done, expectOrder, liveOrder: order(cur) });
        results.push({ ...base, status: stop, done, expectOrder, liveOrder: order(cur) });
        continue;
      }
      await audit(t, "fixed", { beforeOrder, done });
      results.push({ ...base, status: "fixed", done });
    } catch (e) {
      // Once a re-attach was sent, Etsy may hold a change even if the call threw.
      if (inFlight || done.length > 0) await audit(t, "error", { beforeOrder, done, ...(inFlight ? { inFlight } : {}), error: String(e) });
      results.push({ ...base, status: "error", detail: String(e), done, ...(inFlight ? { inFlight } : {}) });
    }
  }
  const count = (s: string) => results.filter((r) => r.status === s).length;
  return NextResponse.json({
    ok: true,
    images: true,
    apply,
    org: orgName,
    targets: targets.length,
    wouldFix: count("would-fix"),
    fixed: count("fixed"),
    clean: count("clean"),
    deferred: count("deferred"),
    failed: results.length - count("would-fix") - count("fixed") - count("clean") - count("deferred"),
    results,
  });
}

/** "Changed" means a rule removed or rewrote something; whitespace alone never counts. */
function plan(before: string) {
  const r = stripPublicDescription(before);
  const changed = r.removed.length > 0 || r.edits.length > 0;
  // stripPublicDescription returns a fixed point; a residual would mean the cut is not public
  // yet, and the write guards would refuse it. Refuse it here too, in the dry run as well.
  const residual = changed && publicTextProblem(r.text) !== null;
  const tooLarge = (changed && r.text.length < before.length * MIN_KEEP_RATIO) || residual;
  return { ...r, changed, tooLarge, residual };
}

const LANG_RE = /^[a-z]{2}(?:-[A-Z]{2})?$/;

// Broad on purpose: a person reads what it finds ("confirm your size" is buyer copy; the
// point is to see every line that could be a note the rules do not know yet).
const SMELL_RE =
  /visuali|\b(?:AI|IA)\b|render|propuesta|proposal|proposed|propon|provisional|aprob|approv|fabricante|\bmaker\b|muestra|sample|prototip|prototype|intern[oa]s?\b|internal|objetivo|target|preliminar|estimaci|estimate|antes de (?:la )?(?:venta|producción|publica)|before (?:sale|production|publish)|\bEtsy\b|\bpanel\b|\bCAD\b|read-?back|lectura de|supplier|proveedor|confirm|pending|pendiente|proporcionan|\bTBD\b|placeholder|\[|\{|desarrollo|development|draft|borrador|\bSKU\b|\bBAS-\d/gi;

/** Every match of SMELL_RE in a line, each with the text around it (a glued line can run 1,000+ characters). */
function smellExcerpts(line: string): { match: string; excerpt: string }[] {
  const out: { match: string; excerpt: string }[] = [];
  for (const m of line.matchAll(SMELL_RE)) {
    const i = m.index ?? 0;
    const excerpt =
      line.length <= 400
        ? line
        : (i > 150 ? "…" : "") + line.slice(Math.max(0, i - 150), i + 250) + (i + 250 < line.length ? "…" : "");
    out.push({ match: m[0], excerpt });
  }
  return out;
}

type Admin = ReturnType<typeof createAdminClient>;
type AuditDiff = { lang?: string; before?: string; after?: string; original?: string; verified?: boolean };
type AuditRow = { id: string; diff: AuditDiff };

/** This product's desc-strip writes of one text (description, or the translation in `lang`), newest first. */
async function stripChain(admin: Admin, orgId: string, productId: string, lang: string | null): Promise<AuditRow[]> {
  const { data, error } = await admin
    .from("audit_log")
    .select("id, diff, created_at")
    .eq("org_id", orgId)
    .eq("action", "etsy.desc_strip")
    .eq("entity_id", productId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`audit unreadable: ${error.message}`);
  return ((data ?? []) as { id: string; diff: AuditDiff | null }[]).filter(
    (a): a is AuditRow => !!a.diff && typeof a.diff.before === "string" && typeof a.diff.after === "string" && (a.diff.lang ?? null) === lang,
  );
}

/**
 * The text before any desc-strip write, for a live text that one of the writes left. Starts at
 * the newest write whose result is the live text (a failed attempt that never landed does not
 * match and is skipped) and walks back through writes that recorded no `original`, each one
 * the result of the write before it.
 */
function originalOf(rows: AuditRow[], live: string): { original: string; from: string } | null {
  let i = rows.findIndex((r) => normText(r.diff.after as string) === normText(live));
  if (i < 0) return null;
  while (typeof rows[i].diff.original !== "string") {
    const cur = rows[i];
    const j = rows.findIndex((r, k) => k > i && normText(r.diff.after as string) === normText(cur.diff.before as string));
    if (j < 0) break;
    i = j;
  }
  const row = rows[i];
  return { original: typeof row.diff.original === "string" ? row.diff.original : (row.diff.before as string), from: row.id };
}

/**
 * `original` for the audit row of a new write, so the chain to the text before any desc-strip
 * write stays whole: the earlier original when the text being replaced is what an earlier
 * write left, the text itself otherwise. When the audit cannot be read the field is left out
 * (a later replan then walks back through the rows instead).
 */
async function originalFor(admin: Admin, orgId: string, productId: string, lang: string | null, before: string): Promise<{ original?: string }> {
  try {
    const prior = originalOf(await stripChain(admin, orgId, productId, lang), before);
    return { original: prior ? prior.original : before };
  } catch {
    return {};
  }
}

/** `replan=1` for one product: see the route comment. */
async function replanProduct(
  admin: Admin,
  client: EtsyClient | null,
  orgId: string,
  p: { id: string; sku: string | null; etsy_listing_id: number | null },
  lang: string | null,
  apply: boolean,
  detail: boolean,
): Promise<Row> {
  const base: Row = { product: p.id, sku: p.sku, listing: p.etsy_listing_id, ...(lang ? { lang } : {}) };
  if (!p.etsy_listing_id || !client) return { ...base, status: "etsy-listing-yok" };
  const listingId = p.etsy_listing_id;
  let rows: AuditRow[];
  try {
    rows = await stripChain(admin, orgId, p.id, lang);
  } catch (e) {
    return { ...base, status: "error", detail: String(e) };
  }
  if (rows.length === 0) return { ...base, status: "no-audit" };

  // The live text first: it decides which earlier write it is the result of.
  let live: string;
  let title = "";
  let tags: string[] = [];
  if (lang) {
    const tr = await getListingTranslation(client, listingId, lang);
    if (!tr) return { ...base, status: "no-translation" };
    live = decodeHtmlEntities(tr.description ?? "");
    title = decodeHtmlEntities(tr.title ?? "");
    tags = (tr.tags ?? []).map((t) => decodeHtmlEntities(t));
  } else {
    const l = await client.get<{ description?: string }>(etsyPaths.listing(listingId));
    live = decodeHtmlEntities(l.description ?? "");
  }
  // No write left this text: someone changed it since (or a write did not land as audited).
  const chain = originalOf(rows, live);
  if (!chain) {
    return { ...base, status: "changed-since", audit: rows[0].id, ...(detail ? { live, expected: rows[0].diff.after } : {}) };
  }
  const original = chain.original;
  const r = plan(original);
  if (!r.changed) return { ...base, status: "original-clean", audit: chain.from };
  const change: Row = { audit: chain.from, from: live.length, to: r.text.length, ...(detail ? { before: live, after: r.text } : {}) };
  if (normText(r.text) === normText(live)) return { ...base, status: "unchanged" };
  if (r.tooLarge) return { ...base, ...change, status: "refused-large-cut" };
  if (!apply) return { ...base, ...change, status: "would-replan" };
  // Outside the write: a failure here sends nothing, so nothing to audit.
  const shopId = lang ? null : await client.requireShopId();

  const tagKey = (list: string[]) => list.map((t) => decodeHtmlEntities(t).trim().toLowerCase()).sort().join("|");
  // Once the write is sent Etsy may hold it whatever happens next: audit every outcome.
  let writeError: string | null = null;
  let readBackError: string | null = null;
  let verified = false;
  try {
    if (lang) {
      await putListingTranslation(client, listingId, lang, { title, description: r.text, tags });
    } else {
      await client.requestForm("PATCH", etsyPaths.shopListing(shopId as number, listingId), { description: r.text });
    }
    try {
      if (lang) {
        const after = await getListingTranslation(client, listingId, lang);
        verified =
          normText(decodeHtmlEntities(after?.description ?? "")) === normText(r.text) &&
          normText(decodeHtmlEntities(after?.title ?? "")) === normText(title) &&
          tagKey(after?.tags ?? []) === tagKey(tags);
      } else {
        const after = await client.get<{ description?: string }>(etsyPaths.listing(listingId));
        verified = normText(decodeHtmlEntities(after.description ?? "")) === normText(r.text);
      }
    } catch (e) {
      readBackError = String(e);
    }
  } catch (e) {
    writeError = String(e);
  }
  if (verified && !lang) {
    await admin.from("products").update({ description: r.text }).eq("id", p.id).eq("org_id", orgId);
  }
  await logAudit(admin, {
    orgId,
    action: "etsy.desc_strip",
    entityType: "product",
    entityId: p.id,
    summary:
      `${lang ? `${lang} çeviri açıklaması` : "Açıklama"} güncel kurallarla özgün metinden yeniden kuruldu (ops desc-strip replan): ` +
      `listing ${listingId}, ${live.length} -> ${r.text.length} kr; ` +
      (writeError ? `yazım hatası, sonuç bilinmiyor.` : `read-back ${verified ? "doğrulandı" : "BAŞARISIZ"}.`),
    // `before` is the live text this write replaced; `original` the text before any desc-strip write.
    diff: {
      listingId,
      ...(lang ? { lang, title, tags } : {}),
      before: live,
      after: r.text,
      original,
      replanOf: chain.from,
      removed: r.removed,
      edits: r.edits,
      verified,
      ...(writeError ? { writeError } : {}),
      ...(readBackError ? { readBackError } : {}),
    },
    source: "ops/desc-strip",
  });
  return {
    ...base,
    ...change,
    status: writeError ? "error" : verified ? "replanned" : "verify-failed",
    ...(writeError ? { detail: writeError } : {}),
    ...(readBackError ? { readBackError } : {}),
  };
}

export async function GET(request: Request) {
  const deadline = Date.now() + BUDGET_MS;
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const scan = url.searchParams.get("scan") === "1";
  const detail = url.searchParams.get("detail") === "1";
  const images = url.searchParams.get("images") === "1";
  const replan = url.searchParams.get("replan") === "1";
  const smell = url.searchParams.get("smell") === "1";
  const lang = url.searchParams.get("lang");
  const orgName = url.searchParams.get("org");
  const productIds = (url.searchParams.get("products") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s));
  if (!orgName) return NextResponse.json({ error: "org is required" }, { status: 400 });
  if (lang !== null && !LANG_RE.test(lang)) return NextResponse.json({ error: "lang: an IETF code such as es" }, { status: 400 });
  if (replan && (scan || images)) return NextResponse.json({ error: "replan works on products, not with scan or images" }, { status: 400 });
  if (smell && !scan) return NextResponse.json({ error: "smell is a scan option" }, { status: 400 });
  if (images) {
    if (productIds.length > 20) return NextResponse.json({ error: "products: max 20" }, { status: 400 });
    const admin = createAdminClient();
    const { data: org } = await admin.from("organizations").select("id").eq("name", orgName).maybeSingle();
    if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
    return imagesMode(admin, (org as { id: string }).id, orgName, url, apply, productIds, deadline);
  }
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
    let translations = 0;
    let partial = false;
    const errors: Row[] = [];
    const smells = new Map<string, { n: number; listings: number[] }>();
    scanLoop: for (const st of SCAN_STATES) {
      for (let offset = 0; ; offset += PAGE) {
        if (Date.now() >= deadline) {
          partial = true;
          break scanLoop;
        }
        const page = await client.get<EtsyListResponse<{ listing_id: number; state?: string; title?: string; description?: string }>>(
          etsyPaths.shopListings(shopId),
          { limit: PAGE, offset, state: st },
        );
        const rows = page.results ?? [];
        for (const l of rows) {
          if (lang && Date.now() >= deadline) {
            partial = true;
            break scanLoop;
          }
          const state = l.state ?? st;
          let title = decodeHtmlEntities(l.title ?? "");
          let before = decodeHtmlEntities(l.description ?? "");
          let tr: Awaited<ReturnType<typeof getListingTranslation>> = null;
          if (lang) {
            try {
              tr = await getListingTranslation(client, l.listing_id, lang);
            } catch (e) {
              // One listing's read error does not throw the scan away; the daily quota ends it.
              // A listing whose read failed is not counted as scanned (it is in errors).
              errors.push({ listing: l.listing_id, state, error: String(e) });
              if (/\(429\)/.test(String(e)) && /daily/i.test(String(e))) {
                partial = true;
                break scanLoop;
              }
              continue;
            }
          }
          // A listing counts as scanned once its text is checked (no translation = checked).
          scanned++;
          byState[state] = (byState[state] ?? 0) + 1;
          if (lang) {
            if (!tr) continue;
            translations++;
            title = decodeHtmlEntities(tr.title ?? title);
            before = decodeHtmlEntities(tr.description ?? "");
          }
          const p = plan(before);
          if (smell) {
            for (const line of (p.changed ? p.text : before).split("\n")) {
              const t = line.trim();
              if (!t) continue;
              // One entry per match, keyed on its excerpt: a long glued line can hold several.
              for (const { match, excerpt } of smellExcerpts(t)) {
                const key = `${match.toLowerCase()}\u0000${excerpt}`;
                const s = smells.get(key) ?? { n: 0, listings: [] };
                s.n++;
                if (s.listings.length < 5) s.listings.push(l.listing_id);
                smells.set(key, s);
              }
            }
          }
          if (!p.changed) continue;
          hits.push({
            listing: l.listing_id,
            state,
            ...(lang ? { lang } : {}),
            title: title.slice(0, 90),
            tooLarge: p.tooLarge,
            ...(p.residual ? { residual: true } : {}),
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
      ...(lang ? { lang, translations } : {}),
      partial: partial || errors.length > 0,
      scanned,
      ...(errors.length ? { errors } : {}),
      byState,
      hits: hits.length,
      notInPanel: hits.filter((h) => !h.product).length,
      ...(smell
        ? {
            smell: [...smells.entries()]
              .map(([key, s]) => {
                const [match, line] = key.split("\u0000");
                return { match, line, n: s.n, listings: s.listings };
              })
              .sort((a, b) => b.n - a.n || a.line.localeCompare(b.line)),
          }
        : {}),
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
    if (Date.now() >= deadline) {
      results.push({ product: id, sku: p.sku, status: "deferred" });
      continue;
    }
    try {
      if (replan) {
        results.push(await replanProduct(admin, client, orgId, p, lang, apply, detail));
        continue;
      }
      if (lang) {
        // Listing translation: Etsy holds it, the panel keeps no live copy of it.
        if (!p.etsy_listing_id || !client) {
          results.push({ product: id, sku: p.sku, status: "etsy-listing-yok" });
          continue;
        }
        const listingId = p.etsy_listing_id;
        const tr = await getListingTranslation(client, listingId, lang);
        const base: Row = { product: id, sku: p.sku, listing: listingId, lang };
        if (!tr) {
          results.push({ ...base, status: "no-translation" });
          continue;
        }
        const before = decodeHtmlEntities(tr.description ?? "");
        const r = plan(before);
        if (!r.changed) {
          results.push({ ...base, status: "clean" });
          continue;
        }
        const change: Row = { removed: r.removed, edits: r.edits, from: before.length, to: r.text.length, ...(r.residual ? { residual: true } : {}), ...(detail ? { before, after: r.text } : {}) };
        if (r.tooLarge) {
          results.push({ ...base, ...change, status: "refused-large-cut" });
          continue;
        }
        if (!apply) {
          results.push({ ...base, ...change, status: "would-strip" });
          continue;
        }
        const title = decodeHtmlEntities(tr.title ?? "");
        const tags = (tr.tags ?? []).map((t) => decodeHtmlEntities(t));
        const original = await originalFor(admin, orgId, id, lang, before);
        const tagKey = (list: string[]) => list.map((t) => decodeHtmlEntities(t).trim().toLowerCase()).sort().join("|");
        // Once the PUT is sent Etsy may hold it whatever happens next: audit every outcome.
        let writeError: string | null = null;
        let readBackError: string | null = null;
        let verified = false;
        try {
          await putListingTranslation(client, listingId, lang, { title, description: r.text, tags });
          try {
            const after = await getListingTranslation(client, listingId, lang);
            verified =
              normText(decodeHtmlEntities(after?.description ?? "")) === normText(r.text) &&
              normText(decodeHtmlEntities(after?.title ?? "")) === normText(title) &&
              tagKey(after?.tags ?? []) === tagKey(tags);
          } catch (e) {
            readBackError = String(e);
          }
        } catch (e) {
          writeError = String(e);
        }
        await logAudit(admin, {
          orgId,
          action: "etsy.desc_strip",
          entityType: "product",
          entityId: id,
          summary:
            `${lang} çeviri açıklamasından kamuya açık olmaması gereken metin kaldırıldı (ops desc-strip): listing ${listingId}, ` +
            `${r.removed.length} görselleştirme cümlesi, ${r.edits.length} iç not düzenlemesi, ` +
            `${before.length} -> ${r.text.length} kr; ` +
            (writeError ? `yazım hatası, sonuç bilinmiyor.` : `read-back ${verified ? "doğrulandı" : "BAŞARISIZ"}.`),
          diff: { listingId, lang, before, after: r.text, ...original, title, tags, removed: r.removed, edits: r.edits, verified, ...(writeError ? { writeError } : {}), ...(readBackError ? { readBackError } : {}) },
          source: "ops/desc-strip",
        });
        results.push({ ...base, ...change, status: writeError ? "error" : verified ? "stripped" : "verify-failed", ...(writeError ? { detail: writeError } : {}), ...(readBackError ? { readBackError } : {}) });
        continue;
      }

      if (!p.etsy_listing_id || !client) {
        const before = p.description ?? "";
        const r = plan(before);
        if (!r.changed) {
          results.push({ product: id, sku: p.sku, status: "clean", where: "panel" });
          continue;
        }
        const base: Row = { product: id, sku: p.sku, where: "panel", removed: r.removed, edits: r.edits, from: before.length, to: r.text.length, ...(r.residual ? { residual: true } : {}), ...(detail ? { before, after: r.text } : {}) };
        if (r.tooLarge) {
          results.push({ ...base, status: "refused-large-cut" });
          continue;
        }
        if (apply) {
          // The products audit trigger keeps the old panel text.
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
      const change: Row = { removed: r.removed, edits: r.edits, from: before.length, to: r.text.length, ...(r.residual ? { residual: true } : {}), ...(detail ? { before, after: r.text } : {}) };
      if (r.tooLarge) {
        results.push({ ...base, ...change, status: "refused-large-cut" });
        continue;
      }
      if (!apply) {
        results.push({ ...base, ...change, status: "would-strip" });
        continue;
      }
      const shopId = await client.requireShopId();
      const original = await originalFor(admin, orgId, id, null, before);
      // Once the PATCH is sent Etsy may hold it whatever happens next: audit every outcome.
      let writeError: string | null = null;
      let readBackError: string | null = null;
      let verified = false;
      try {
        await client.requestForm("PATCH", etsyPaths.shopListing(shopId, listingId), { description: r.text });
        try {
          const after = await client.get<{ description?: string }>(etsyPaths.listing(listingId));
          verified = normText(decodeHtmlEntities(after.description ?? "")) === normText(r.text);
        } catch (e) {
          readBackError = String(e);
        }
      } catch (e) {
        writeError = String(e);
      }
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
          `${before.length} -> ${r.text.length} kr; ` +
          (writeError ? `yazım hatası, sonuç bilinmiyor.` : `read-back ${verified ? "doğrulandı" : "BAŞARISIZ"}.`),
        // The live text before the write: the panel copy can be stale, so this is the way back.
        diff: { listingId, before, after: r.text, ...original, removed: r.removed, edits: r.edits, verified, ...(writeError ? { writeError } : {}), ...(readBackError ? { readBackError } : {}) },
        source: "ops/desc-strip",
      });
      results.push({ ...base, ...change, status: writeError ? "error" : verified ? "stripped" : "verify-failed", ...(writeError ? { detail: writeError } : {}), ...(readBackError ? { readBackError } : {}) });
    } catch (e) {
      results.push({ product: id, sku: p.sku, status: "error", detail: String(e) });
    }
  }

  const count = (s: string) => results.filter((r) => r.status === s).length;
  return NextResponse.json({
    ok: true,
    apply,
    org: orgName,
    ...(lang ? { lang } : {}),
    ...(replan ? { replan: true } : {}),
    targets: productIds.length,
    wouldStrip: count("would-strip"),
    stripped: count("stripped"),
    ...(replan
      ? {
          wouldReplan: count("would-replan"),
          replanned: count("replanned"),
          unchanged: count("unchanged"),
          // Not written: someone changed the text since, no earlier write, or the earlier write
          // was not verified, or the current rules find the original clean.
          held: count("changed-since") + count("no-audit") + count("unverified-audit") + count("original-clean"),
        }
      : {}),
    clean: count("clean"),
    refused: count("refused-large-cut"),
    deferred: count("deferred"),
    // Skipped: nothing to clean in this mode (no translation in that language, or no Etsy listing).
    skipped: count("no-translation") + count("etsy-listing-yok"),
    failed: count("verify-failed") + count("error") + count("panelde-yok"),
    results,
  });
}
