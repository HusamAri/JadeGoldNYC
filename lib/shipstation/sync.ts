import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  ShipStationClient,
  ShipStationRateLimitError,
} from "@/lib/shipstation/client";
import { shipStationPaths } from "@/lib/shipstation/endpoints";
import {
  dollarsToCents,
  type ShipStationListResponse,
  type ShipStationOrder,
  type ShipStationShipment,
} from "@/lib/shipstation/types";

const PAGE_SIZE = 500;
const DEFAULT_BUDGET_MS = 40_000;

export interface ShipStationProgress {
  done: boolean;
  status: "running" | "done" | "error" | "paused";
  phase: "orders" | "shipments" | "done";
  orders: number;
  shipments: number;
  error?: string;
}

interface StateRow {
  sync_status: string | null;
  sync_phase: string | null;
  sync_page: number | null;
  sync_orders: number | null;
  sync_shipments: number | null;
}

/**
 * ShipStation senkronunu parça parça ilerletir (siparişler → gönderiler).
 * Sayfa imleci kalıcı; zaman bütçesi veya oran sınırı dolunca duraklar,
 * sonraki çağrı kaldığı yerden sürer. Ham veriyi (raw jsonb) de saklar.
 */
export async function advanceShipStationSync(
  orgId: string,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<ShipStationProgress> {
  const startedAt = Date.now();
  const client = ShipStationClient.fromEnv();
  const admin = createAdminClient();

  const { data } = await admin
    .from("shipstation_connection")
    .select("sync_status, sync_phase, sync_page, sync_orders, sync_shipments")
    .eq("org_id", orgId)
    .maybeSingle();
  const cur = data as StateRow | null;

  const resuming =
    cur?.sync_status === "running" &&
    cur.sync_phase != null &&
    cur.sync_phase !== "done";

  let phase: ShipStationProgress["phase"] = resuming
    ? (cur!.sync_phase as ShipStationProgress["phase"])
    : "orders";
  let page = resuming ? (cur!.sync_page ?? 1) : 1;
  const counts = {
    orders: resuming ? (cur!.sync_orders ?? 0) : 0,
    shipments: resuming ? (cur!.sync_shipments ?? 0) : 0,
  };

  const base = {
    org_id: orgId,
    status: "connected",
    sync_updated_at: new Date().toISOString(),
  };
  const persist = (extra: Record<string, unknown> = {}) =>
    admin.from("shipstation_connection").upsert(
      {
        ...base,
        sync_phase: phase,
        sync_page: page,
        sync_orders: counts.orders,
        sync_shipments: counts.shipments,
        ...extra,
      },
      { onConflict: "org_id" },
    );

  if (!resuming) {
    await admin.from("shipstation_connection").upsert(
      {
        ...base,
        sync_status: "running",
        sync_phase: "orders",
        sync_page: 1,
        sync_orders: 0,
        sync_shipments: 0,
        sync_error: null,
        sync_started_at: new Date().toISOString(),
      },
      { onConflict: "org_id" },
    );
  }

  try {
    while (phase !== "done") {
      if (Date.now() - startedAt > budgetMs) {
        await persist();
        return { done: false, status: "running", phase, ...counts };
      }

      if (phase === "orders") {
        const res = await client.get<ShipStationListResponse<ShipStationOrder>>(
          shipStationPaths.orders,
          { page, pageSize: PAGE_SIZE, sortBy: "OrderDate", sortDir: "ASC" },
        );
        const orders = res.orders ?? [];
        if (orders.length > 0) {
          await upsertOrders(admin, orgId, orders);
          counts.orders += orders.length;
        }
        const pages = res.pages ?? 1;
        if (page >= pages || orders.length === 0) {
          phase = "shipments";
          page = 1;
        } else {
          page += 1;
        }
        await persist();
      } else {
        const res = await client.get<
          ShipStationListResponse<ShipStationShipment>
        >(shipStationPaths.shipments, {
          page,
          pageSize: PAGE_SIZE,
          sortBy: "ShipDate",
          sortDir: "ASC",
        });
        const shipments = res.shipments ?? [];
        if (shipments.length > 0) {
          await upsertShipments(admin, orgId, shipments);
          counts.shipments += shipments.length;
        }
        const pages = res.pages ?? 1;
        if (page >= pages || shipments.length === 0) {
          phase = "done";
        } else {
          page += 1;
        }
        await persist();
      }
    }

    await persist({ sync_status: "done", last_sync_at: new Date().toISOString() });
    return { done: true, status: "done", phase: "done", ...counts };
  } catch (e) {
    if (e instanceof ShipStationRateLimitError) {
      // Oran sınırı: imleci koru, "running" bırak → sonra kaldığı yerden sürer.
      await persist();
      return { done: false, status: "paused", phase, ...counts };
    }
    const message = e instanceof Error ? e.message : "ShipStation senkron hatası";
    await persist({ sync_status: "error", sync_error: message });
    return { done: true, status: "error", phase, ...counts, error: message };
  }
}

async function upsertOrders(
  admin: SupabaseClient,
  orgId: string,
  orders: ShipStationOrder[],
): Promise<void> {
  const rows = orders.map((o) => ({
    org_id: orgId,
    order_id: o.orderId,
    order_number: o.orderNumber ?? null,
    order_date: o.orderDate ?? null,
    order_status: o.orderStatus ?? null,
    customer_name: o.billTo?.name ?? o.shipTo?.name ?? null,
    customer_email: o.customerEmail ?? null,
    order_total_cents: dollarsToCents(o.orderTotal),
    currency: "USD",
    store_id: o.advancedOptions?.storeId ?? null,
    marketplace: o.advancedOptions?.source ?? null,
    raw: o,
  }));
  const { error } = await admin
    .from("shipstation_orders")
    .upsert(rows, { onConflict: "order_id" });
  if (error) throw new Error(`shipstation_orders upsert: ${error.message}`);
}

async function upsertShipments(
  admin: SupabaseClient,
  orgId: string,
  shipments: ShipStationShipment[],
): Promise<void> {
  const rows = shipments.map((s) => ({
    org_id: orgId,
    shipment_id: s.shipmentId,
    order_id: s.orderId ?? null,
    order_number: s.orderNumber ?? null,
    ship_date: s.shipDate ?? null,
    create_date: s.createDate ?? null,
    tracking_number: s.trackingNumber ?? null,
    carrier_code: s.carrierCode ?? null,
    service_code: s.serviceCode ?? null,
    shipment_cost_cents: dollarsToCents(s.shipmentCost),
    insurance_cost_cents: dollarsToCents(s.insuranceCost),
    voided: s.voided ?? null,
    customer_email: s.customerEmail ?? null,
    currency: "USD",
    raw: s,
  }));
  const { error } = await admin
    .from("shipstation_shipments")
    .upsert(rows, { onConflict: "shipment_id" });
  if (error) throw new Error(`shipstation_shipments upsert: ${error.message}`);
}

export async function getShipStationProgress(
  orgId: string,
): Promise<ShipStationProgress> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("shipstation_connection")
    .select("sync_status, sync_phase, sync_orders, sync_shipments, sync_error")
    .eq("org_id", orgId)
    .maybeSingle();
  const c = data as (StateRow & { sync_error: string | null }) | null;
  const status = (c?.sync_status ?? "idle") as
    | ShipStationProgress["status"]
    | "idle";
  return {
    done: status === "done" || status === "error" || status === "idle",
    status: status === "idle" ? "done" : status,
    phase: (c?.sync_phase ?? "done") as ShipStationProgress["phase"],
    orders: c?.sync_orders ?? 0,
    shipments: c?.sync_shipments ?? 0,
    error: c?.sync_error ?? undefined,
  };
}
