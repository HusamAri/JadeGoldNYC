import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { logAudit } from "@/lib/audit";
import {
  etsyMoneyToCents,
  type EtsyListResponse,
  type EtsyReceipt,
  type EtsyTransaction,
  type EtsyListing,
  type EtsyReview,
} from "@/lib/etsy/types";

const PAGE = 100;

/**
 * Etsy siparişlerini (receipts) çeker ve sales/sale_items tablolarına
 * idempotent upsert eder (etsy_receipt_id üzerinden).
 */
export async function syncSales(orgId: string): Promise<{ imported: number }> {
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();
  const admin = createAdminClient();

  // Artımlı senkron: yalnızca son senkrondan beri oluşan siparişleri çek.
  // 1 saatlik örtüşme payı + idempotent upsert ile sınır kayıpları önlenir.
  const { data: conn } = await admin
    .from("etsy_connection")
    .select("last_sync_at")
    .eq("org_id", orgId)
    .maybeSingle();
  const lastSyncAt = (conn as { last_sync_at: string | null } | null)
    ?.last_sync_at;
  const minCreated = lastSyncAt
    ? Math.floor(new Date(lastSyncAt).getTime() / 1000) - 3600
    : undefined;

  let offset = 0;
  let imported = 0;

  for (;;) {
    // includes=Transactions: kalemleri sipariş yanıtına gömerek sipariş başına
    // ayrı istek (N+1) yapmaktan kaçın; süre/oran limiti yükü dramatik düşer.
    const data = await client.get<EtsyListResponse<EtsyReceipt>>(
      etsyPaths.receipts(shopId),
      { limit: PAGE, offset, includes: "Transactions", min_created: minCreated },
    );
    const results = data.results ?? [];

    for (const r of results) {
      const orderDate = new Date(
        (r.created_timestamp ?? Date.now() / 1000) * 1000,
      ).toISOString();
      const currency = r.grandtotal?.currency_code ?? "USD";

      const { data: upserted } = await admin
        .from("sales")
        .upsert(
          {
            org_id: orgId,
            source: "etsy",
            etsy_receipt_id: r.receipt_id,
            order_no: String(r.receipt_id),
            buyer_name: r.name ?? null,
            buyer_email: r.buyer_email ?? null,
            status: "completed",
            order_date: orderDate,
            ship_country: r.country_iso ?? null,
            item_total_cents: etsyMoneyToCents(r.subtotal),
            shipping_cents: etsyMoneyToCents(r.total_shipping_cost),
            tax_cents: etsyMoneyToCents(r.total_tax_cost),
            discount_cents: etsyMoneyToCents(r.discount_amt),
            grand_total_cents: etsyMoneyToCents(r.grandtotal),
            currency,
          },
          { onConflict: "org_id,etsy_receipt_id" },
        )
        .select("id")
        .maybeSingle();

      imported++;

      // Kalemler (transactions) — varsa upsert et. Önce gömülü (includes ile
      // gelen) transactions'ı kullan; yoksa sipariş başına tek istekle çek.
      const saleId = (upserted as { id: string } | null)?.id;
      if (saleId) {
        const items =
          r.transactions ??
          (
            await client.get<EtsyListResponse<EtsyTransaction>>(
              etsyPaths.receiptTransactions(shopId, r.receipt_id),
            )
          ).results ??
          [];
        for (const t of items) {
          await admin.from("sale_items").upsert(
            {
              org_id: orgId,
              sale_id: saleId,
              etsy_transaction_id: t.transaction_id,
              title: t.title ?? null,
              sku: t.sku ?? null,
              quantity: t.quantity ?? 1,
              unit_price_cents: etsyMoneyToCents(t.price),
              line_total_cents:
                etsyMoneyToCents(t.price) * (t.quantity ?? 1),
              currency,
            },
            { onConflict: "etsy_transaction_id" },
          );
        }
      }
    }

    if (results.length < PAGE) break;
    offset += PAGE;
    if (offset > 10_000) break; // güvenlik sınırı
  }

  await admin
    .from("etsy_connection")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("org_id", orgId);

  await logAudit(admin, {
    orgId,
    action: "etsy.sync",
    entityType: "sales",
    summary: `Etsy senkronizasyonu tamamlandı: ${imported} sipariş`,
    source: "etsy",
    actorLabel: "Etsy Sync",
  });

  return { imported };
}

/** Aktif Etsy listelerini products tablosuna senkronize eder. */
export async function syncListings(orgId: string): Promise<{ imported: number }> {
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();
  const admin = createAdminClient();

  let offset = 0;
  let imported = 0;
  for (;;) {
    const data = await client.get<EtsyListResponse<EtsyListing>>(
      etsyPaths.activeListings(shopId),
      { limit: PAGE, offset },
    );
    const results = data.results ?? [];
    for (const l of results) {
      await admin.from("products").upsert(
        {
          org_id: orgId,
          etsy_listing_id: l.listing_id,
          title: l.title ?? `Liste ${l.listing_id}`,
          sku: l.sku?.[0] ?? null,
          status: l.state ?? null,
          price_cents: etsyMoneyToCents(l.price),
          currency: l.price?.currency_code ?? "USD",
          url: l.url ?? null,
        },
        { onConflict: "org_id,etsy_listing_id" },
      );
      imported++;
    }
    if (results.length < PAGE) break;
    offset += PAGE;
    if (offset > 10_000) break;
  }
  return { imported };
}

/** Mağaza yorumlarını reviews tablosuna senkronize eder. */
export async function syncReviews(orgId: string): Promise<{ imported: number }> {
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();
  const admin = createAdminClient();

  let offset = 0;
  let imported = 0;
  for (;;) {
    const data = await client.get<EtsyListResponse<EtsyReview>>(
      etsyPaths.reviews(shopId),
      { limit: PAGE, offset },
    );
    const results = data.results ?? [];
    for (const rv of results) {
      const ts = rv.created_timestamp ?? rv.create_timestamp;
      await admin.from("reviews").upsert(
        {
          org_id: orgId,
          etsy_review_id:
            rv.transaction_id != null ? String(rv.transaction_id) : null,
          rating: rv.rating ?? null,
          review_text: rv.review ?? null,
          language: rv.language ?? null,
          review_date: ts ? new Date(ts * 1000).toISOString() : null,
          source: "etsy",
          status: "yeni",
        },
        { onConflict: "org_id,etsy_review_id" },
      );
      imported++;
    }
    if (results.length < PAGE) break;
    offset += PAGE;
    if (offset > 10_000) break;
  }
  return { imported };
}
