import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

const OPHIR_SLUG = "ophir-gold-usa";
const QUERY_PAGE_SIZE = 1_000;
const MAX_PAGE_SIZE = 2_500;
const MAX_WINDOW_ROWS = 100_000;
const MAX_RESPONSE_BYTES = 4_000_000;
const SUMMARY_EVENTS = 1_000;
const AUDIT_FIELDS = "id, created_at, entity_id, before:diff->before, after:diff->after";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Entity = "product_variants" | "products";
type Row = Record<string, unknown>;
type AuditRow = {
  id: string;
  created_at: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function json(value: unknown, status = 200, html = false) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  const serialized = JSON.stringify(value, null, html ? 2 : undefined) ?? "null";
  let body = serialized;
  if (html) {
    const row = object(value);
    const metadata = ["mode", "entity", "observed_at", "since_inclusive", "audit_until_exclusive",
      "total_update_records", "page_update_records", "page_price_change_records", "complete"]
      .filter((key) => row && row[key] !== undefined)
      .map((key) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(row![key]))}</dd>`).join("");
    const nextPage = typeof row?.next_page === "string" && row.next_page.startsWith("/api/ops/ophir-price-audit?")
      ? `<p><a rel="next" href="${escapeHtml(row.next_page)}">Next page</a></p>` : "";
    body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ophir price audit</title></head><body><main><h1>Ophir price audit</h1><dl>${metadata}</dl>${nextPage}<pre id="price-audit-records">${escapeHtml(serialized)}</pre>${nextPage}</main></body></html>`;
  }
  if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
    return json({ error: "Page is too large. Retry with a smaller page_size." }, 413, html);
  }
  if (html) return new Response(body, {
    status,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff" },
  });
  return NextResponse.json(value, {
    status,
    headers,
  });
}

function object(value: unknown): Row | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : null;
}

function integer(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

// An allowlist, never a spread of audit diff: no other row data is exported.
function identity(row: Row) {
  return {
    id: text(row.id),
    sku: text(row.sku),
    product_id: text(row.product_id),
    etsy_listing_id: integer(row.etsy_listing_id),
    currency: text(row.currency),
    price_cents: integer(row.price_cents),
  };
}

function priceChange(row: AuditRow) {
  const before = object(row.before);
  const after = object(row.after);
  if (
    !before || !after || !row.entity_id ||
    before.id !== row.entity_id || after.id !== row.entity_id ||
    !Object.hasOwn(before, "price_cents") || !Object.hasOwn(after, "price_cents") ||
    (before.price_cents !== null && integer(before.price_cents) === null) ||
    (after.price_cents !== null && integer(after.price_cents) === null) ||
    before.price_cents === after.price_cents
  ) return null;

  return {
    audit_id: row.id,
    created_at: row.created_at,
    entity_id: row.entity_id,
    before: identity(before),
    after: identity(after),
  };
}

// Require an explicit timezone and reject calendar normalization (e.g. Feb 31).
// Keep the input precision: converting PostgreSQL microseconds to JS ISO loses it.
function timestamp(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const offsetHours = Number(match[8] ?? 0);
  const offsetMinutes = Number(match[9] ?? 0);
  if (
    year < 1970 || month < 1 || month > 12 || day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    hour > 23 || minute > 59 || second > 59 ||
    offsetHours > 14 || offsetMinutes > 59 ||
    (offsetHours === 14 && offsetMinutes !== 0) || !Number.isFinite(Date.parse(value))
  ) return null;
  return value;
}

function audits(client: SupabaseClient, orgId: string, entity: Entity, until: string) {
  return client.from("audit_log")
    .select(AUDIT_FIELDS)
    .eq("org_id", orgId)
    .eq("entity_type", entity)
    .eq("action", "update")
    .lt("created_at", until);
}

async function currentRows(client: SupabaseClient, orgId: string, entity: Entity, ids: string[]) {
  const rows = new Map<string, ReturnType<typeof identity>>();
  const fields = entity === "product_variants"
    ? "id, sku, product_id, etsy_listing_id, currency, price_cents"
    : "id, sku, etsy_listing_id, currency, price_cents";
  // Avoid a request URL containing thousands of UUIDs.
  for (let start = 0; start < ids.length; start += 100) {
    const { data, error } = await client.from(entity)
      .select(fields)
      .eq("org_id", orgId)
      .in("id", ids.slice(start, start + 100))
      .order("id", { ascending: true });
    if (error) throw new Error("Current pricing records could not be read.");
    for (const row of (data ?? []) as unknown as Row[]) {
      if (typeof row.id === "string") rows.set(row.id, identity(row));
    }
  }
  return rows;
}

/** Read-only, cookie-authenticated price evidence. No Etsy calls or writes. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const html = sp.get("format") === "html";
  const respond = (value: unknown, status = 200) => json(value, status, html);
  const membership = await requireMembership();
  if (!isManager(membership.role)) return respond({ error: MANAGER_ONLY_ERROR }, 403);

  const entity = sp.get("entity") ?? "product_variants";
  if (entity !== "product_variants" && entity !== "products") {
    return respond({ error: "entity must be product_variants or products." }, 400);
  }
  const sinceInput = sp.get("since");
  const untilInput = sp.get("until");
  if ((sinceInput === null) !== (untilInput === null)) {
    return respond({ error: "Provide both since and until, or neither for summary." }, 400);
  }
  const since = sinceInput === null ? null : timestamp(sinceInput);
  const requestedUntil = untilInput === null ? null : timestamp(untilInput);
  if (sinceInput !== null && (!since || !requestedUntil || Date.parse(since) >= Date.parse(requestedUntil))) {
    return respond({ error: "Use valid ISO timestamps with timezones and since earlier than until." }, 400);
  }
  const cursor = sp.get("cursor");
  if (cursor !== null && (!since || !UUID.test(cursor))) {
    return respond({ error: "cursor requires a date window and must be an audit UUID." }, 400);
  }
  const sizeInput = sp.get("page_size") ?? String(QUERY_PAGE_SIZE);
  const pageSize = Number(sizeInput);
  if (!/^\d+$/.test(sizeInput) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    return respond({ error: `page_size must be between 1 and ${MAX_PAGE_SIZE}.` }, 400);
  }
  const observedAt = new Date().toISOString();
  const until = requestedUntil && Date.parse(requestedUntil) < Date.parse(observedAt)
    ? requestedUntil : observedAt;
  if (since && Date.parse(since) >= Date.parse(until)) {
    return respond({ error: "since must precede the current audit cutoff." }, 400);
  }

  try {
    const client = await createClient();
    const { data: org, error: orgError } = await client.from("organizations")
      .select("id, slug")
      .eq("id", membership.org_id)
      .maybeSingle();
    if (orgError) return respond({ error: "Active organization could not be verified." }, 500);
    if (!org || org.slug !== OPHIR_SLUG) {
      return respond({ error: "Active organization must be Ophir Gold USA." }, 409);
    }

    if (!since) {
      const changes: NonNullable<ReturnType<typeof priceChange>>[] = [];
      let scanned = 0;
      let last: AuditRow | null = null;
      let exhausted = false;
      while (scanned < MAX_WINDOW_ROWS && changes.length < SUMMARY_EVENTS) {
        let query = audits(client, org.id, entity, until)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(Math.min(QUERY_PAGE_SIZE, MAX_WINDOW_ROWS - scanned));
        if (last) {
          query = query.or(`created_at.lt.${last.created_at},and(created_at.eq.${last.created_at},id.lt.${last.id})`);
        }
        const { data, error } = await query;
        if (error) return respond({ error: "Pricing audit summary could not be read." }, 500);
        const rows = (data ?? []) as unknown as AuditRow[];
        if (rows.length === 0) { exhausted = true; break; }
        scanned += rows.length;
        for (const row of rows) {
          const change = priceChange(row);
          if (change && changes.length < SUMMARY_EVENTS) changes.push(change);
        }
        last = rows[rows.length - 1];
      }
      const minutes = new Map<string, number>();
      for (const change of changes) {
        const minute = new Date(change.created_at).toISOString().slice(0, 16) + ":00Z";
        minutes.set(minute, (minutes.get(minute) ?? 0) + 1);
      }
      return respond({
        mode: "summary", organization: org, entity, observed_at: observedAt,
        audit_until_exclusive: until, latest_price_change: changes[0] ?? null,
        price_changes: changes,
        minute_counts: Array.from(minutes, ([minute_utc, price_changes]) => ({ minute_utc, price_changes })),
        scanned_update_records: scanned, scanned_through: last?.created_at ?? null,
        history_exhausted: exhausted, scan_limit_reached: scanned >= MAX_WINDOW_ROWS,
        sample_limit_reached: changes.length >= SUMMARY_EVENTS,
        note: "Counts describe the returned sample, not an entire pricing operation. Use a since/until window for complete paginated evidence.",
      });
    }

    const { count: total, error: countError } = await client.from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id).eq("entity_type", entity).eq("action", "update")
      .gte("created_at", since).lt("created_at", until);
    if (countError || total === null) return respond({ error: "Audit window count could not be read." }, 500);
    if (total > MAX_WINDOW_ROWS) {
      return respond({ error: "Audit window exceeds the safety bound. Narrow since/until.", total_update_records: total, max_update_records: MAX_WINDOW_ROWS }, 413);
    }
    const rows: AuditRow[] = [];
    let after = cursor;
    let complete = false;
    while (rows.length < pageSize) {
      let query = audits(client, org.id, entity, until)
        .gte("created_at", since)
        .order("id", { ascending: true })
        .limit(Math.min(QUERY_PAGE_SIZE, pageSize - rows.length));
      if (after) query = query.gt("id", after);
      const { data, error } = await query;
      if (error) return respond({ error: "Pricing audit page could not be read." }, 500);
      const page = (data ?? []) as unknown as AuditRow[];
      if (page.length === 0) { complete = true; break; }
      rows.push(...page);
      after = page[page.length - 1].id;
    }
    if (!complete && after) {
      const { data, error } = await audits(client, org.id, entity, until)
        .gte("created_at", since).gt("id", after).order("id", { ascending: true }).limit(1);
      if (error) return respond({ error: "Audit page completion could not be verified." }, 500);
      complete = !data?.length;
    }
    const changes = rows.map(priceChange).filter((change) => change !== null);
    const ids = Array.from(new Set(changes.map((change) => change.entity_id)));
    const current = await currentRows(client, org.id, entity, ids);
    const productIds = entity === "product_variants"
      ? Array.from(new Set(Array.from(current.values()).flatMap((row) => row.product_id ? [row.product_id] : []))) : [];
    const products = await currentRows(client, org.id, "products", productIds);
    const nextCursor = complete ? null : after;
    const next = new URLSearchParams({ entity, since, until, page_size: String(pageSize) });
    if (html) next.set("format", "html");
    if (nextCursor) next.set("cursor", nextCursor);
    return respond({
      mode: "window", organization: org, entity, observed_at: observedAt,
      since_inclusive: since, audit_until_exclusive: until,
      total_update_records: total, page_update_records: rows.length,
      page_price_change_records: changes.length, cursor, next_cursor: nextCursor,
      complete, next_page: nextCursor ? `/api/ops/ophir-price-audit?${next}` : null,
      records: changes.map((change) => {
        const row = current.get(change.entity_id) ?? null;
        return { ...change, current_db: row,
          current_product: row?.product_id ? products.get(row.product_id) ?? null : null };
      }),
      note: "Audit evidence is pinned to the exclusive upper timestamp. Current DB values are observations, not a transaction snapshot or Etsy verification.",
    });
  } catch {
    return respond({ error: "Pricing audit export could not be completed." }, 500);
  }
}
