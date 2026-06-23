import { createClient } from "@/lib/supabase/server";

export interface ShipStationStatus {
  status: string;
  last_sync_at: string | null;
  orders: number;
  shipments: number;
}

export async function getShipStationStatus(): Promise<ShipStationStatus> {
  const supabase = await createClient();
  const [{ data: conn }, { count: orders }, { count: shipments }] =
    await Promise.all([
      supabase
        .from("shipstation_connection")
        .select("status, last_sync_at")
        .maybeSingle(),
      supabase
        .from("shipstation_orders")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("shipstation_shipments")
        .select("*", { count: "exact", head: true }),
    ]);

  const c = conn as { status: string; last_sync_at: string | null } | null;
  return {
    status: c?.status ?? "idle",
    last_sync_at: c?.last_sync_at ?? null,
    orders: orders ?? 0,
    shipments: shipments ?? 0,
  };
}
