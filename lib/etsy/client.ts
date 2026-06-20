import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/etsy/oauth";
import { ETSY_API_BASE } from "@/lib/etsy/endpoints";

export class EtsyNotConnectedError extends Error {
  constructor(message = "Etsy bağlantısı bulunamadı.") {
    super(message);
    this.name = "EtsyNotConnectedError";
  }
}

interface ConnectionRow {
  id: string;
  org_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  shop_id: number | null;
  status: string;
}

/**
 * Etsy Open API v3 istemcisi. Token süresi dolmadan (60 sn kala) otomatik
 * yeniler ve her isteğe `x-api-key` + `Authorization: Bearer` ekler.
 * Yalnızca sunucu tarafında (service-role) kullanılır.
 */
export class EtsyClient {
  private constructor(
    private readonly apiKey: string,
    private conn: ConnectionRow,
    private readonly admin: SupabaseClient,
  ) {}

  static async forOrg(orgId: string): Promise<EtsyClient> {
    const apiKey = process.env.ETSY_API_KEY;
    if (!apiKey) throw new Error("ETSY_API_KEY tanımlı değil.");
    const admin = createAdminClient();
    const { data } = await admin
      .from("etsy_connection")
      .select(
        "id, org_id, access_token, refresh_token, access_token_expires_at, shop_id, status",
      )
      .eq("org_id", orgId)
      .maybeSingle();
    if (!data) throw new EtsyNotConnectedError();
    return new EtsyClient(apiKey, data as ConnectionRow, admin);
  }

  get shopId(): number | null {
    return this.conn.shop_id;
  }

  private async ensureToken(): Promise<string> {
    const expiresAt = new Date(this.conn.access_token_expires_at).getTime();
    if (expiresAt - Date.now() > 60_000) return this.conn.access_token;

    const tok = await refreshAccessToken({
      clientId: this.apiKey,
      refreshToken: this.conn.refresh_token,
    });
    const newExpiry = new Date(Date.now() + tok.expires_in * 1000).toISOString();
    await this.admin
      .from("etsy_connection")
      .update({
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        access_token_expires_at: newExpiry,
        status: "connected",
      })
      .eq("id", this.conn.id);
    this.conn = {
      ...this.conn,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      access_token_expires_at: newExpiry,
    };
    return tok.access_token;
  }

  async get<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
    retry = 1,
  ): Promise<T> {
    const token = await this.ensureToken();
    const url = new URL(ETSY_API_BASE + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v != null) url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url, {
      headers: {
        "x-api-key": this.apiKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 429 && retry > 0) {
      await new Promise((r) => setTimeout(r, 1200));
      return this.get<T>(path, query, retry - 1);
    }
    if (!res.ok) {
      throw new Error(
        `Etsy API hatası (${res.status}) ${path}: ${await res.text()}`,
      );
    }
    return (await res.json()) as T;
  }
}
