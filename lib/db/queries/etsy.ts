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

/**
 * Etsy'ye YAZMA (adet güncelleme) erişimi durumu. `connected` durum RPC'sinden,
 * `writeEnabled` ise yalnız boolean döndüren etsy_write_enabled RPC'sinden gelir
 * (SECURITY DEFINER; scope/token dışarı çıkmaz). Kullanıcı istemcisiyle çalışır.
 */
export async function getEtsyWriteAccess(
  orgId: string,
): Promise<{ connected: boolean; writeEnabled: boolean }> {
  const supabase = await createClient();
  const [status, writeRes] = await Promise.all([
    supabase.rpc("etsy_connection_status", { p_org: orgId }),
    supabase.rpc("etsy_write_enabled", { p_org: orgId }),
  ]);
  const statusRow = Array.isArray(status.data) ? status.data[0] : status.data;
  const connected = statusRow?.status === "connected";
  const writeEnabled = connected && writeRes.data === true;
  return { connected, writeEnabled };
}
