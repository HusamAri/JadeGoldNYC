import { createAdminClient } from "@/lib/supabase/admin";
import {
  ShopierClient,
  ShopierRateLimitError,
} from "@/lib/shopier/client";
import { shopierPaths } from "@/lib/shopier/endpoints";
import type { ShopierOrder } from "@/lib/shopier/types";
import { parseMoneyToCents } from "@/lib/money";
import { logAudit } from "@/lib/audit";

const PAGE_SIZE = 50;
const DEFAULT_BUDGET_MS = 40_000;
// Artımlı turda son senkrondan geriye örtüşme payı (7 gün) — kayıp olmasın.
const OVERLAP_MS = 7 * 86_400_000;

export interface ShopierProgress {
  done: boolean;
  status: "running" | "done" | "error" | "paused";
  orders: number;
  items: number;
  error?: string;
}

interface StateRow {
  sync_status: string | null;
  sync_page: number | null;
  sync_orders: number | null;
  sync_items: number | null;
  sync_date_start: string | null;
  last_sync_at: string | null;
  sync_started_at: string | null;
}

/**
 * Shopier sipariş durumu → panel satış sözlüğü (0080).
 * unpaid → open; tam iade → refunded; kısmi iade → partially_refunded;
 * fulfilled (kargolandı) → shipped; kalan ödenmiş sipariş → paid.
 */
export function mapShopierStatus(o: ShopierOrder): string {
  const refunds = o.refunds ?? [];
  if (refunds.some((r) => r.type === "full")) return "refunded";
  if (refunds.some((r) => r.type === "partial")) return "partially_refunded";
  if ((o.paymentStatus ?? "").toLowerCase() === "unpaid") return "open";
  if ((o.status ?? "").toLowerCase() === "fulfilled") return "shipped";
  return "paid";
}

function buyerName(o: ShopierOrder): string | null {
  const s = o.shippingInfo ?? o.billingInfo;
  const name = [s?.firstName, s?.lastName].filter(Boolean).join(" ").trim();
  return name || null;
}

/**
 * Shopier senkronunu PARÇA PARÇA ilerletir (etsy/shipstation "domino"
 * deseni): süre bütçesi kadar sayfa işler, imleci shopier_connection'a
 * yazar, bütçe dolunca done:false döner; çağıran (buton döngüsü) bitene
 * kadar tekrar tetikler. İlk tur tüm geçmişi, sonrakiler last_sync_at−7g
 * penceresini tarar (dateStart + dateAsc).
 */
export async function advanceShopierSync(
  orgId: string,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<ShopierProgress> {
  const startedAt = Date.now();
  const admin = createAdminClient();
  const client = await ShopierClient.forOrg(admin, orgId);

  const { data } = await admin
    .from("shopier_connection")
    .select(
      "sync_status, sync_page, sync_orders, sync_items, sync_date_start, last_sync_at, sync_started_at",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  const cur = data as StateRow | null;

  const resuming = cur?.sync_status === "running";
  let page = resuming ? Math.max(1, cur!.sync_page ?? 1) : 1;
  const counts = {
    orders: resuming ? (cur!.sync_orders ?? 0) : 0,
    items: resuming ? (cur!.sync_items ?? 0) : 0,
  };
  // Artımlı pencere: sipariş SONRADAN güncellenebilir (kargolandı/iade) ama
  // liste ucu yalnız oluşturulma tarihiyle filtreler; 7 gün örtüşme payı
  // yeni durum değişikliklerinin çoğunu yakalar, tam tarama her zaman mümkün.
  // Pencere başı TUR BOYU kalıcıdır (sync_date_start): duraklayıp süren tur
  // aynı veri kümesi üzerinde sayfalar — tam/pencereli karışmaz.
  const dateStart = resuming
    ? (cur!.sync_date_start ?? undefined)
    : cur?.last_sync_at
      ? new Date(new Date(cur.last_sync_at).getTime() - OVERLAP_MS)
          .toISOString()
          .slice(0, 10)
      : undefined;

  const persist = (extra: Record<string, unknown> = {}) =>
    admin
      .from("shopier_connection")
      .update({
        sync_page: page,
        sync_orders: counts.orders,
        sync_items: counts.items,
        sync_updated_at: new Date().toISOString(),
        ...extra,
      })
      .eq("org_id", orgId);

  if (!resuming) {
    await persist({
      sync_status: "running",
      sync_page: 1,
      sync_orders: 0,
      sync_items: 0,
      sync_date_start: dateStart ?? null,
      sync_error: null,
      sync_started_at: new Date().toISOString(),
    });
  }

  try {
    for (;;) {
      if (Date.now() - startedAt > budgetMs) {
        await persist();
        return { done: false, status: "running", ...counts };
      }

      const orders = await client.get<ShopierOrder[]>(shopierPaths.orders(), {
        limit: PAGE_SIZE,
        page,
        sort: "dateAsc",
        dateStart,
      });
      const rows = Array.isArray(orders) ? orders : [];
      if (rows.length > 0) {
        const n = await upsertShopierOrders(admin, orgId, rows);
        counts.orders += rows.length;
        counts.items += n;
      }
      if (rows.length < PAGE_SIZE) break;
      page += 1;
      await persist();
    }

    await persist({
      sync_status: "done",
      status: "connected",
      last_sync_at: new Date().toISOString(),
      sync_error: null,
    });
    await logAudit(admin, {
      orgId,
      action: "shopier.sync",
      entityType: "sales",
      summary: `Shopier senkronizasyonu tamamlandı: ${counts.orders} sipariş, ${counts.items} kalem`,
      source: "shopier",
      actorLabel: "Shopier Sync",
    });
    return { done: true, status: "done", ...counts };
  } catch (e) {
    if (e instanceof ShopierRateLimitError) {
      await persist({ sync_status: "paused" });
      return { done: true, status: "paused", ...counts, error: e.message };
    }
    const message = e instanceof Error ? e.message : "Senkron hatası";
    await persist({
      sync_status: "error",
      status: "error",
      sync_error: message,
    });
    return { done: true, status: "error", ...counts, error: message };
  }
}

/** Bir sayfa Shopier siparişini sales + sale_items'a idempotent yazar. */
async function upsertShopierOrders(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  orders: ShopierOrder[],
): Promise<number> {
  const saleRows = orders.map((o) => ({
    org_id: orgId,
    source: "shopier",
    shopier_order_id: o.id,
    order_no: o.id,
    buyer_name: buyerName(o),
    buyer_email: o.shippingInfo?.email ?? o.billingInfo?.email ?? null,
    status: mapShopierStatus(o),
    order_date: o.dateCreated
      ? new Date(o.dateCreated).toISOString()
      : new Date().toISOString(),
    ship_country: o.shippingInfo?.country ?? null,
    item_total_cents: parseMoneyToCents(o.totals?.subtotal ?? null),
    shipping_cents: parseMoneyToCents(o.totals?.shipping ?? null),
    discount_cents: parseMoneyToCents(o.totals?.discount ?? null),
    grand_total_cents: parseMoneyToCents(o.totals?.total ?? null),
    // Kur satırda taşınır (çoğunlukla TRY) — USD toplamlarına karışmaz;
    // para kuralı: farklı kurlar tek sayıya toplanmaz.
    currency: o.currency ?? "TRY",
    notes: o.note ?? null,
  }));

  const { data: upserted, error: salesErr } = await admin
    .from("sales")
    .upsert(saleRows, { onConflict: "org_id,shopier_order_id" })
    .select("id, shopier_order_id");
  if (salesErr) throw new Error(`shopier sales upsert: ${salesErr.message}`);

  const idByOrder = new Map<string, string>();
  for (const r of (upserted ?? []) as {
    id: string;
    shopier_order_id: string;
  }[]) {
    idByOrder.set(r.shopier_order_id, r.id);
  }

  // Kalemlerin doğal benzersiz kimliği yok (line item id gelmiyor) →
  // sipariş başına sil + yeniden yaz (idempotent, çift sayım imkânsız).
  const saleIds = [...idByOrder.values()];
  if (saleIds.length > 0) {
    const { error: delErr } = await admin
      .from("sale_items")
      .delete()
      .eq("org_id", orgId)
      .in("sale_id", saleIds);
    if (delErr) throw new Error(`shopier sale_items sil: ${delErr.message}`);
  }

  const itemRows = orders.flatMap((o) => {
    const saleId = idByOrder.get(o.id);
    if (!saleId) return [];
    const currency = o.currency ?? "TRY";
    return (o.lineItems ?? []).map((li) => {
      const qty = li.quantity ?? 1;
      const unit = parseMoneyToCents(li.price ?? null);
      return {
        org_id: orgId,
        sale_id: saleId,
        title: li.title ?? null,
        quantity: qty,
        unit_price_cents: unit,
        line_total_cents: li.total ? parseMoneyToCents(li.total) : unit * qty,
        currency,
      };
    });
  });
  if (itemRows.length > 0) {
    const { error: itemsErr } = await admin
      .from("sale_items")
      .insert(itemRows);
    if (itemsErr) throw new Error(`shopier sale_items ekle: ${itemsErr.message}`);
  }
  return itemRows.length;
}

/** Senkron ilerleme durumunu okur (buton canlı akışı). */
export async function getShopierProgress(
  orgId: string,
): Promise<ShopierProgress> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("shopier_connection")
    .select("sync_status, sync_orders, sync_items, sync_error")
    .eq("org_id", orgId)
    .maybeSingle();
  const c = data as
    | {
        sync_status: string | null;
        sync_orders: number | null;
        sync_items: number | null;
        sync_error: string | null;
      }
    | null;
  const status = (c?.sync_status ?? "idle") as ShopierProgress["status"] | "idle";
  return {
    done: status !== "running",
    status: status === "idle" ? "done" : status,
    orders: c?.sync_orders ?? 0,
    items: c?.sync_items ?? 0,
    error: c?.sync_error ?? undefined,
  };
}
