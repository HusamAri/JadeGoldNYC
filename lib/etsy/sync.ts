import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { logAudit } from "@/lib/audit";
import {
  etsyMoneyToCents,
  type EtsyListResponse,
  type EtsyReceipt,
  type EtsyListing,
  type EtsyReview,
} from "@/lib/etsy/types";

const PAGE = 100;
// Tek çağrıda harcanacak süre bütçesi (fonksiyon 60sn; ~20sn pay bırak).
const DEFAULT_BUDGET_MS = 40_000;

export interface SyncProgress {
  done: boolean;
  status: "running" | "done" | "error";
  phase: "sales" | "listings" | "reviews" | "done";
  sales: number;
  items: number;
  products: number;
  reviews: number;
  error?: string;
}

interface CursorRow {
  sync_status: string | null;
  sync_phase: string | null;
  sync_offset: number | null;
  sync_sales: number | null;
  sync_items: number | null;
  sync_products: number | null;
  sync_reviews: number | null;
  last_sync_at: string | null;
}

/**
 * Etsy senkronunu PARÇA PARÇA ("domino") ilerletir: tek çağrıda yalnızca bir
 * süre bütçesi kadar sayfa işler, ilerlemeyi (faz + offset + sayaçlar) her
 * sayfada etsy_connection'a yazar ve bütçe dolunca `done:false` ile döner.
 * Çağıran taraf (buton döngüsü veya cron) bitene kadar tekrar tetikler →
 * hiçbir tek çağrı 60sn'yi aşmaz, zaman aşımı yapısal olarak imkânsızdır.
 *
 * Her sayfa TEK toplu upsert ile yazılır; getShopReceipts kalemleri (transactions)
 * gömülü döndürdüğünden sipariş başına ayrı istek yapılmaz.
 */
export async function advanceEtsySync(
  orgId: string,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<SyncProgress> {
  const startedAt = Date.now();
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();
  const admin = createAdminClient();

  const { data } = await admin
    .from("etsy_connection")
    .select(
      "sync_status, sync_phase, sync_offset, sync_sales, sync_items, sync_products, sync_reviews, last_sync_at",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  const cur = data as CursorRow | null;

  // Yeni tur mu? (idle/done/error veya faz yok → baştan başlat.)
  const resuming =
    cur?.sync_status === "running" &&
    cur.sync_phase != null &&
    cur.sync_phase !== "done";

  let phase: SyncProgress["phase"] = resuming
    ? (cur!.sync_phase as SyncProgress["phase"])
    : "sales";
  let offset = resuming ? (cur!.sync_offset ?? 0) : 0;
  const counts = {
    sales: resuming ? (cur!.sync_sales ?? 0) : 0,
    items: resuming ? (cur!.sync_items ?? 0) : 0,
    products: resuming ? (cur!.sync_products ?? 0) : 0,
    reviews: resuming ? (cur!.sync_reviews ?? 0) : 0,
  };

  // Sales fazı: ilk tam tarama (last_sync_at yok) tüm geçmişi; sonraki turlar
  // artımlı (last_sync_at'ten beri, 1 saat örtüşmeli). Tur boyunca last_sync_at
  // sales bitene kadar yazılmadığından min_created chunk'lar arası stabildir.
  const minCreated = cur?.last_sync_at
    ? Math.floor(new Date(cur.last_sync_at).getTime() / 1000) - 3600
    : undefined;

  if (!resuming) {
    await admin
      .from("etsy_connection")
      .update({
        sync_status: "running",
        sync_phase: "sales",
        sync_offset: 0,
        sync_sales: 0,
        sync_items: 0,
        sync_products: 0,
        sync_reviews: 0,
        sync_error: null,
        sync_started_at: new Date().toISOString(),
        sync_updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId);
  }

  const persist = (extra: Record<string, unknown> = {}) =>
    admin
      .from("etsy_connection")
      .update({
        sync_phase: phase,
        sync_offset: offset,
        sync_sales: counts.sales,
        sync_items: counts.items,
        sync_products: counts.products,
        sync_reviews: counts.reviews,
        sync_updated_at: new Date().toISOString(),
        ...extra,
      })
      .eq("org_id", orgId);

  try {
    while (phase !== "done") {
      if (Date.now() - startedAt > budgetMs) {
        await persist();
        return { done: false, status: "running", phase, ...counts };
      }

      if (phase === "sales") {
        const page = await client.get<EtsyListResponse<EtsyReceipt>>(
          etsyPaths.receipts(shopId),
          { limit: PAGE, offset, min_created: minCreated },
        );
        const results = page.results ?? [];
        if (results.length > 0) {
          const n = await upsertSalesPage(admin, orgId, results);
          counts.sales += results.length;
          counts.items += n;
        }
        if (results.length < PAGE) {
          // Sales tamamlandı → artımlı imleci yaz, listings'e geç.
          phase = "listings";
          offset = 0;
          await persist({ last_sync_at: new Date().toISOString() });
        } else {
          offset += PAGE;
          await persist();
        }
      } else if (phase === "listings") {
        const page = await client.get<EtsyListResponse<EtsyListing>>(
          etsyPaths.activeListings(shopId),
          { limit: PAGE, offset },
        );
        const results = page.results ?? [];
        if (results.length > 0) {
          await upsertListingsPage(admin, orgId, results);
          counts.products += results.length;
        }
        if (results.length < PAGE) {
          phase = "reviews";
          offset = 0;
        } else {
          offset += PAGE;
        }
        await persist();
      } else {
        // reviews
        const page = await client.get<EtsyListResponse<EtsyReview>>(
          etsyPaths.reviews(shopId),
          { limit: PAGE, offset },
        );
        const results = page.results ?? [];
        if (results.length > 0) {
          await upsertReviewsPage(admin, orgId, results);
          counts.reviews += results.length;
        }
        if (results.length < PAGE) {
          phase = "done";
        } else {
          offset += PAGE;
        }
        await persist();
      }
    }

    await persist({ sync_status: "done" });
    await logAudit(admin, {
      orgId,
      action: "etsy.sync",
      entityType: "sales",
      summary: `Etsy senkronizasyonu tamamlandı: ${counts.sales} sipariş, ${counts.items} kalem`,
      source: "etsy",
      actorLabel: "Etsy Sync",
    });
    return { done: true, status: "done", phase: "done", ...counts };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Senkron hatası";
    await persist({ sync_status: "error", sync_error: message });
    return { done: true, status: "error", phase, ...counts, error: message };
  }
}

/** Bir sayfa siparişi + gömülü kalemleri toplu upsert eder; kalem sayısını döner. */
async function upsertSalesPage(
  admin: SupabaseClient,
  orgId: string,
  results: EtsyReceipt[],
): Promise<number> {
  const saleRows = results.map((r) => ({
    org_id: orgId,
    source: "etsy",
    etsy_receipt_id: r.receipt_id,
    order_no: String(r.receipt_id),
    buyer_name: r.name ?? null,
    buyer_email: r.buyer_email ?? null,
    status: "completed",
    order_date: new Date(
      (r.created_timestamp ?? Date.now() / 1000) * 1000,
    ).toISOString(),
    ship_country: r.country_iso ?? null,
    item_total_cents: etsyMoneyToCents(r.subtotal),
    shipping_cents: etsyMoneyToCents(r.total_shipping_cost),
    tax_cents: etsyMoneyToCents(r.total_tax_cost),
    discount_cents: etsyMoneyToCents(r.discount_amt),
    grand_total_cents: etsyMoneyToCents(r.grandtotal),
    currency: r.grandtotal?.currency_code ?? "USD",
  }));

  const { data: upserted, error: salesErr } = await admin
    .from("sales")
    .upsert(saleRows, { onConflict: "org_id,etsy_receipt_id" })
    .select("id, etsy_receipt_id");
  if (salesErr) throw new Error(`sales upsert: ${salesErr.message}`);

  const idByReceipt = new Map<number, string>();
  for (const row of (upserted ?? []) as {
    id: string;
    etsy_receipt_id: number;
  }[]) {
    idByReceipt.set(row.etsy_receipt_id, row.id);
  }

  const itemRows = results.flatMap((r) => {
    const saleId = idByReceipt.get(r.receipt_id);
    if (!saleId) return [];
    const currency = r.grandtotal?.currency_code ?? "USD";
    return (r.transactions ?? []).map((t) => ({
      org_id: orgId,
      sale_id: saleId,
      etsy_transaction_id: t.transaction_id,
      title: t.title ?? null,
      sku: t.sku ?? null,
      quantity: t.quantity ?? 1,
      unit_price_cents: etsyMoneyToCents(t.price),
      line_total_cents: etsyMoneyToCents(t.price) * (t.quantity ?? 1),
      currency,
    }));
  });

  if (itemRows.length > 0) {
    const { error: itemsErr } = await admin
      .from("sale_items")
      .upsert(itemRows, { onConflict: "etsy_transaction_id" });
    if (itemsErr) throw new Error(`sale_items upsert: ${itemsErr.message}`);
  }
  return itemRows.length;
}

async function upsertListingsPage(
  admin: SupabaseClient,
  orgId: string,
  results: EtsyListing[],
): Promise<void> {
  const rows = results.map((l) => ({
    org_id: orgId,
    etsy_listing_id: l.listing_id,
    title: l.title ?? `Liste ${l.listing_id}`,
    sku: l.sku?.[0] ?? null,
    status: l.state ?? null,
    price_cents: etsyMoneyToCents(l.price),
    currency: l.price?.currency_code ?? "USD",
    url: l.url ?? null,
  }));
  const { error } = await admin
    .from("products")
    .upsert(rows, { onConflict: "org_id,etsy_listing_id" });
  if (error) throw new Error(`products upsert: ${error.message}`);
}

async function upsertReviewsPage(
  admin: SupabaseClient,
  orgId: string,
  results: EtsyReview[],
): Promise<void> {
  const rows = results.map((rv) => {
    const ts = rv.created_timestamp ?? rv.create_timestamp;
    return {
      org_id: orgId,
      etsy_review_id:
        rv.transaction_id != null ? String(rv.transaction_id) : null,
      rating: rv.rating ?? null,
      review_text: rv.review ?? null,
      language: rv.language ?? null,
      review_date: ts ? new Date(ts * 1000).toISOString() : null,
      source: "etsy",
      status: "yeni",
    };
  });
  const { error } = await admin
    .from("reviews")
    .upsert(rows, { onConflict: "org_id,etsy_review_id" });
  if (error) throw new Error(`reviews upsert: ${error.message}`);
}

/** Senkron ilerleme durumunu okur (canlı akış paneli için). */
export async function getSyncProgress(orgId: string): Promise<SyncProgress> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("etsy_connection")
    .select(
      "sync_status, sync_phase, sync_sales, sync_items, sync_products, sync_reviews, sync_error",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  const c = data as
    | (CursorRow & { sync_error: string | null })
    | null;
  const status = (c?.sync_status ?? "idle") as SyncProgress["status"] | "idle";
  return {
    done: status === "done" || status === "error" || status === "idle",
    status: status === "idle" ? "done" : status,
    phase: (c?.sync_phase ?? "done") as SyncProgress["phase"],
    sales: c?.sync_sales ?? 0,
    items: c?.sync_items ?? 0,
    products: c?.sync_products ?? 0,
    reviews: c?.sync_reviews ?? 0,
    error: c?.sync_error ?? undefined,
  };
}
