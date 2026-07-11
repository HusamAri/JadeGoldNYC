import type { createAdminClient } from "@/lib/supabase/admin";
import { SHIPSTATION_API_BASE } from "@/lib/shipstation/endpoints";

type AdminClient = ReturnType<typeof createAdminClient>;

export class ShipStationNotConfiguredError extends Error {
  constructor(message = "ShipStation API anahtarları tanımlı değil.") {
    super(message);
    this.name = "ShipStationNotConfiguredError";
  }
}

/** Rate limit'e takılınca (uzun bekleme) senkronu duraklatmak için. */
export class ShipStationRateLimitError extends Error {
  constructor(public readonly resetSeconds: number) {
    super(`ShipStation oran sınırı; ${resetSeconds}s sonra tekrar deneyin.`);
    this.name = "ShipStationRateLimitError";
  }
}

/**
 * ShipStation legacy API istemcisi. HTTP Basic auth (apiKey:apiSecret).
 * 40 istek/dk sınırı: 429'da X-Rate-Limit-Reset kısa ise bekleyip yeniden
 * dener; uzunsa ShipStationRateLimitError fırlatır (senkron duraklar, sonra
 * kaldığı yerden sürer). Yalnız sunucu tarafında kullanılır.
 */
export class ShipStationClient {
  private constructor(private readonly authHeader: string) {}

  static fromEnv(): ShipStationClient {
    const key = process.env.SHIPSTATION_API_KEY;
    const secret = process.env.SHIPSTATION_API_SECRET;
    if (!key || !secret) throw new ShipStationNotConfiguredError();
    return ShipStationClient.fromCredentials(key, secret);
  }

  static fromCredentials(key: string, secret: string): ShipStationClient {
    const basic = Buffer.from(`${key}:${secret}`).toString("base64");
    return new ShipStationClient(`Basic ${basic}`);
  }

  /**
   * Platform env anahtarları YALNIZ tek bir org'a aittir — her org'a fallback
   * olamaz, yoksa cron bir şirketin kargo verisini diğerinin tablolarına yazar
   * (PR #130 inceleme bulgusu). Sahiplik: SHIPSTATION_ORG_ID env'i; o yoksa
   * geriye dönük uyum için "platformda tek org varsa env onundur".
   */
  private static async envBelongsToOrg(
    admin: AdminClient,
    orgId: string,
  ): Promise<boolean> {
    if (!ShipStationClient.isConfigured()) return false;
    const explicit = process.env.SHIPSTATION_ORG_ID;
    if (explicit) return explicit === orgId;
    const { count } = await admin
      .from("organizations")
      .select("id", { count: "exact", head: true });
    return (count ?? 0) <= 1;
  }

  /**
   * Org'a özel kimlik bilgisi (shipstation_credentials — service-role-only
   * tablo, site içinden girilir); yoksa platform env'i YALNIZ env'in sahibi
   * org için kullanılır.
   */
  static async forOrg(
    admin: AdminClient,
    orgId: string,
  ): Promise<ShipStationClient> {
    const { data } = await admin
      .from("shipstation_credentials")
      .select("api_key, api_secret")
      .eq("org_id", orgId)
      .maybeSingle();
    const creds = data as { api_key: string; api_secret: string } | null;
    if (creds?.api_key && creds?.api_secret) {
      return ShipStationClient.fromCredentials(creds.api_key, creds.api_secret);
    }
    if (await ShipStationClient.envBelongsToOrg(admin, orgId)) {
      return ShipStationClient.fromEnv();
    }
    throw new ShipStationNotConfiguredError();
  }

  /** Org için kimlik bilgisi var mı (org kaydı YA DA org'a ait platform env'i)? */
  static async isConfiguredForOrg(
    admin: AdminClient,
    orgId: string,
  ): Promise<boolean> {
    const { count } = await admin
      .from("shipstation_credentials")
      .select("org_id", { count: "exact", head: true })
      .eq("org_id", orgId);
    if ((count ?? 0) > 0) return true;
    return ShipStationClient.envBelongsToOrg(admin, orgId);
  }

  static isConfigured(): boolean {
    return Boolean(
      process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET,
    );
  }

  async get<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
    deadlineMs?: number,
  ): Promise<T> {
    const url = new URL(SHIPSTATION_API_BASE + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v != null) url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 429) {
      const reset = Number(res.headers.get("X-Rate-Limit-Reset") ?? "60");
      const waitMs = (reset + 1) * 1000;
      // Yalnızca kısa beklemeler VE eylem süresine sığıyorsa bekle+yeniden dene;
      // yoksa duraklat (server action 60sn'de öldürülmesin).
      if (
        reset > 0 &&
        reset <= 20 &&
        (deadlineMs == null || Date.now() + waitMs < deadlineMs)
      ) {
        await new Promise((r) => setTimeout(r, waitMs));
        return this.get<T>(path, query, deadlineMs);
      }
      throw new ShipStationRateLimitError(reset);
    }
    if (!res.ok) {
      throw new Error(
        `ShipStation API hatası (${res.status}) ${path}: ${await res.text()}`,
      );
    }
    return (await res.json()) as T;
  }
}
