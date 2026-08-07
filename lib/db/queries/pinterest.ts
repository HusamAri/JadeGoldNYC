import { createClient } from "@/lib/supabase/server";

export interface PinterestStatus {
  status: string | null;
  username: string | null;
  account_type: string | null;
  expires_at: string | null;
  refresh_expires_at: string | null;
  last_sync_at: string | null;
}

const BOS: PinterestStatus = {
  status: null,
  username: null,
  account_type: null,
  expires_at: null,
  refresh_expires_at: null,
  last_sync_at: null,
};

export async function getPinterestStatus(
  orgId: string,
): Promise<PinterestStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pinterest_connection_status", {
    p_org: orgId,
  });
  if (error) {
    // Migration 0132 henüz uygulanmadıysa RPC yoktur — bağlı değil say,
    // sayfayı düşürme (shopier'deki aynı toleranslı desen).
    const msg = error.message ?? "";
    if (!/could not find|does not exist|schema cache/i.test(msg)) {
      console.error("pinterest_connection_status:", msg);
    }
    return BOS;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PinterestStatus) ?? BOS;
}
