import { createClient } from "@/lib/supabase/server";

export interface ShopierStatus {
  status: "connected" | "error" | "revoked" | "disconnected";
  shop_name: string | null;
  last_sync_at: string | null;
  sync_status: string | null;
  sync_error: string | null;
  /** source='shopier' satış sayısı — bağlantının ürettiği veri kanıtı. */
  orders: number;
}

/** Üye yüzeyi: sır içermeyen bağlantı durumu (RPC) + shopier satış sayısı. */
export async function getShopierStatus(orgId: string): Promise<ShopierStatus> {
  const supabase = await createClient();
  const [rpcRes, countRes] = await Promise.all([
    supabase.rpc("shopier_connection_status", { p_org: orgId }),
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("source", "shopier"),
  ]);
  if (rpcRes.error) {
    // Migration 0110 henüz yoksa RPC da yoktur — disconnected say, gürültü yapma.
    const msg = rpcRes.error.message ?? "";
    if (!/could not find|does not exist|schema cache/i.test(msg)) {
      console.error("[shopier] durum RPC:", msg);
    }
  }

  const row = (Array.isArray(rpcRes.data) ? rpcRes.data[0] : rpcRes.data) as
    | {
        status: string;
        shop_name: string | null;
        last_sync_at: string | null;
        sync_status: string | null;
        sync_error: string | null;
      }
    | null
    | undefined;

  return {
    status: (row?.status as ShopierStatus["status"]) ?? "disconnected",
    shop_name: row?.shop_name ?? null,
    last_sync_at: row?.last_sync_at ?? null,
    sync_status: row?.sync_status ?? null,
    sync_error: row?.sync_error ?? null,
    orders: countRes.count ?? 0,
  };
}
