import { createClient } from "@supabase/supabase-js";

/**
 * Service-role istemci — RLS'i atlar. YALNIZCA sunucu tarafında kullanılır
 * (Etsy senkronizasyonu, OAuth callback, token okuma). Asla istemciye sızdırmayın.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service-role yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
