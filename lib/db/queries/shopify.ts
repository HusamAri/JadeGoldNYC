import { createClient } from "@/lib/supabase/server";

export interface ShopifyStatus {
  status: string | null;
  shop_domain: string | null;
  shop_name: string | null;
  last_sync_at: string | null;
}

export async function getShopifyStatus(orgId: string): Promise<ShopifyStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("shopify_connection_status", {
    p_org: orgId,
  });
  if (error) {
    console.error("shopify_connection_status:", error.message);
    return {
      status: null,
      shop_domain: null,
      shop_name: null,
      last_sync_at: null,
    };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      status: null,
      shop_domain: null,
      shop_name: null,
      last_sync_at: null,
    };
  }
  return row as ShopifyStatus;
}
