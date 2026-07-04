import { createClient } from "@/lib/supabase/server";

export interface ShipStationStatus {
  status: string;
  last_sync_at: string | null;
  orders: number;
  shipments: number;
  products: number;
  items: number;
  customers: number;
  /** Takip numarası olan (Etsy'ye aktarılabilir) gönderi sayısı. */
  shipmentsWithTracking: number;
}

export async function getShipStationStatus(): Promise<ShipStationStatus> {
  const supabase = await createClient();
  const head = (table: string) =>
    supabase.from(table).select("*", { count: "exact", head: true });

  const [
    { data: conn },
    { count: orders },
    { count: shipments },
    { count: products },
    { count: items },
    { count: customers },
    { count: tracked },
  ] = await Promise.all([
    supabase
      .from("shipstation_connection")
      .select("status, last_sync_at")
      .maybeSingle(),
    head("shipstation_orders"),
    head("shipstation_shipments"),
    head("shipstation_products"),
    head("shipstation_order_items"),
    head("shipstation_customers"),
    supabase
      .from("shipstation_shipments")
      .select("*", { count: "exact", head: true })
      .not("tracking_number", "is", null)
      .not("voided", "is", true),
  ]);

  const c = conn as { status: string; last_sync_at: string | null } | null;
  return {
    status: c?.status ?? "idle",
    last_sync_at: c?.last_sync_at ?? null,
    orders: orders ?? 0,
    shipments: shipments ?? 0,
    products: products ?? 0,
    items: items ?? 0,
    customers: customers ?? 0,
    shipmentsWithTracking: tracked ?? 0,
  };
}
