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

/**
 * Etsy siparişlerini (receipts) çeker ve sales/sale_items tablolarına
 * idempotent upsert eder (etsy_receipt_id üzerinden).
 *
 * Performans: getShopReceipts yanıtı kalemleri (transactions) zaten gömülü
 * döndürür → sipariş başına ayrı istek YOK. Ayrıca her sayfa TEK toplu upsert
 * ile yazılır (satır-satır binlerce DB gidiş-dönüşü yerine) → fonksiyon süresi
 * sınırını aşmaz. Artımlı: last_sync_at'ten beri (1s örtüşmeli) min_created.
 */
export async function syncSales(orgId: string): Promise<{ imported: number }> {
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();
  const admin = createAdminClient();

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
    const data = await client.get<EtsyListResponse<EtsyReceipt>>(
      etsyPaths.receipts(shopId),
      { limit: PAGE, offset, min_created: minCreated },
    );
    const results = data.results ?? [];
    if (results.length === 0) break;

    // 1) Siparişleri toplu upsert et ve id eşlemesini al (tek gidiş-dönüş).
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

    // 2) Kalemleri (gömülü transactions) toplu upsert et.
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

    imported += results.length;

    if (results.length < PAGE) break;
    offset += PAGE;
    if (offset > 20_000) break; // güvenlik sınırı
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

/** Aktif Etsy listelerini products tablosuna senkronize eder (sayfa başına toplu). */
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
    if (results.length === 0) break;

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

    imported += results.length;
    if (results.length < PAGE) break;
    offset += PAGE;
    if (offset > 20_000) break;
  }
  return { imported };
}

/** Mağaza yorumlarını reviews tablosuna senkronize eder (sayfa başına toplu). */
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
    if (results.length === 0) break;

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

    imported += results.length;
    if (results.length < PAGE) break;
    offset += PAGE;
    if (offset > 20_000) break;
  }
  return { imported };
}
