import type { createAdminClient } from "@/lib/supabase/admin";
import { SHOPIER_API_BASE } from "@/lib/shopier/endpoints";

type AdminClient = ReturnType<typeof createAdminClient>;

export class ShopierNotConfiguredError extends Error {
  constructor(message = "Shopier kişisel erişim anahtarı (PAT) tanımlı değil.") {
    super(message);
    this.name = "ShopierNotConfiguredError";
  }
}

export class ShopierRateLimitError extends Error {
  constructor() {
    super("Shopier oran sınırına takıldı; kısa bir süre sonra tekrar deneyin.");
    this.name = "ShopierRateLimitError";
  }
}

/**
 * Shopier PAT REST API istemcisi (api.shopier.com/v1, Bearer token).
 * Platform env'i YOK — anahtar org başına site içinden girilir
 * (shopier_connection, service-role-only). Yalnız sunucuda kullanılır.
 * Hatalar YÜKSEK SESLE: durum kodu + gövde mesajı fırlatılır (sessiz boş
 * dönüş yok) — resmi şema dokümanı bot korumalı olduğundan alan eşlemesi
 * savunmacı, hata eşlemesi açıktır.
 */
export class ShopierClient {
  private constructor(private readonly pat: string) {}

  static fromPat(pat: string): ShopierClient {
    if (!pat.trim()) throw new ShopierNotConfiguredError();
    return new ShopierClient(pat.trim());
  }

  /** Org'un kayıtlı PAT'iyle istemci kurar; kayıt yoksa anlaşılır hata. */
  static async forOrg(
    admin: AdminClient,
    orgId: string,
  ): Promise<ShopierClient> {
    const { data } = await admin
      .from("shopier_connection")
      .select("pat")
      .eq("org_id", orgId)
      .maybeSingle();
    const pat = (data as { pat: string } | null)?.pat;
    if (!pat) throw new ShopierNotConfiguredError();
    return ShopierClient.fromPat(pat);
  }

  static async isConfiguredForOrg(
    admin: AdminClient,
    orgId: string,
  ): Promise<boolean> {
    const { count } = await admin
      .from("shopier_connection")
      .select("org_id", { count: "exact", head: true })
      .eq("org_id", orgId);
    return (count ?? 0) > 0;
  }

  async get<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(SHOPIER_API_BASE + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v != null) url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.pat}`,
        Accept: "application/json",
      },
    });

    if (res.status === 429) throw new ShopierRateLimitError();
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Shopier PAT reddedildi (401/403) — anahtarı Ayarlar → Shopier'den yenileyin.",
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Shopier API ${res.status}: ${body.slice(0, 300) || res.statusText}`,
      );
    }
    return (await res.json()) as T;
  }
}
