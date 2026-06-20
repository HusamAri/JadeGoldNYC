import { createClient } from "@/lib/supabase/server";
import type { EtsyConnectionStatus } from "@/lib/types";

export async function getEtsyStatus(
  orgId: string,
): Promise<EtsyConnectionStatus> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("etsy_connection_status", {
    p_org: orgId,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      status: "disconnected",
      shop_id: null,
      last_sync_at: null,
      expires_at: null,
    };
  }
  return {
    status: row.status,
    shop_id: row.shop_id,
    last_sync_at: row.last_sync_at,
    expires_at: row.expires_at,
  };
}
