import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/etsy/oauth";
import { ETSY_API_BASE, etsyPaths } from "@/lib/etsy/endpoints";

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
    private readonly apiSecret: string,
    private conn: ConnectionRow,
    private readonly admin: SupabaseClient,
  ) {}

  /** Kota yazımını sıkıştırmak için son DB yazım anı (ms). */
  private lastQuotaWriteMs = 0;

  /**
   * Etsy her cevapta günlük kotayı bildirir (x-limit-per-day /
   * x-remaining-today). Fire-and-forget kaydeder ki altın endeksi gibi toplu
   * işler koşmadan ÖNCE "bütçe var mı?" diye bakabilsin (0134). En fazla
   * 10 sn'de bir yazılır; kota 500'ün altındaysa her cevapta tazelenir.
   */
  private recordQuota(res: Response): void {
    const remaining = Number(res.headers.get("x-remaining-today"));
    const limit = Number(res.headers.get("x-limit-per-day"));
    if (!Number.isFinite(remaining) || !Number.isFinite(limit)) return;
    const now = Date.now();
    if (remaining >= 500 && now - this.lastQuotaWriteMs < 10_000) return;
    this.lastQuotaWriteMs = now;
    void this.admin
      .from("etsy_connection")
      .update({
        quota_limit_daily: limit,
        quota_remaining: remaining,
        quota_observed_at: new Date(now).toISOString(),
      })
      .eq("id", this.conn.id)
      .then(({ error }) => {
        if (error) console.error("Etsy kota kaydı:", error.message);
      });
  }

  /**
   * 429 triyajı: SANİYELİK limitte kısa bekleme işe yarar, GÜNLÜK limitte
   * yaramaz — beklemek yalnız kotasız istek zinciri üretir (2026-08-08
   * vakası). Günlükse kota 0 olarak kaydedilir ve hata ANINDA fırlatılır.
   */
  private async triage429(res: Response, label: string): Promise<string> {
    const text = await res.text();
    if (/daily/i.test(text)) {
      void this.admin
        .from("etsy_connection")
        .update({
          quota_remaining: 0,
          quota_observed_at: new Date().toISOString(),
        })
        .eq("id", this.conn.id)
        .then(({ error }) => {
          if (error) console.error("Etsy kota kaydı:", error.message);
        });
      throw new Error(`Etsy API hatası (429) ${label}: ${text}`);
    }
    return text;
  }

  // Etsy v3 API çağrıları x-api-key'de "keystring:shared_secret" bekler.
  // apiSecret forOrg()'ta zorunlu kılınır; yalnız keystring'e düşmeyiz
  // (Etsy bunu 403 ile reddeder), bunun yerine net bir config hatası veririz.
  private get xApiKey(): string {
    return `${this.apiKey}:${this.apiSecret}`;
  }

  static async forOrg(orgId: string): Promise<EtsyClient> {
    const apiKey = process.env.ETSY_API_KEY;
    if (!apiKey) throw new Error("ETSY_API_KEY tanımlı değil.");
    const apiSecret = process.env.ETSY_API_SECRET;
    // Etsy v3 her API çağrısında shared secret ister; eksikse sessizce
    // keystring'e düşmek yerine erken ve anlaşılır hata ver.
    if (!apiSecret) throw new Error("ETSY_API_SECRET tanımlı değil.");
    const admin = createAdminClient();
    const { data } = await admin
      .from("etsy_connection")
      .select(
        "id, org_id, access_token, refresh_token, access_token_expires_at, shop_id, status",
      )
      .eq("org_id", orgId)
      .maybeSingle();
    if (!data) throw new EtsyNotConnectedError();
    return new EtsyClient(apiKey, apiSecret, data as ConnectionRow, admin);
  }

  get shopId(): number | null {
    return this.conn.shop_id;
  }

  /**
   * shop_id'yi getMe'den çözüp kalıcılaştırır. Callback'teki tek seferlik
   * /users/me çağrısı (geçici hata vb.) boş döndüyse burada self-heal eder;
   * istemcinin sağlam get()'i token yeniler + 429'da yeniden dener.
   */
  async resolveShopId(): Promise<number | null> {
    if (this.conn.shop_id) return this.conn.shop_id;
    const me = await this.get<{ user_id?: number; shop_id?: number | null }>(
      etsyPaths.me(),
    );
    const shopId = me?.shop_id ?? null;
    if (shopId) {
      await this.admin
        .from("etsy_connection")
        .update({ shop_id: shopId })
        .eq("id", this.conn.id);
      this.conn = { ...this.conn, shop_id: shopId };
    }
    return shopId;
  }

  /** shop_id'yi garanti eder; bulunamazsa anlaşılır hata fırlatır. */
  async requireShopId(): Promise<number> {
    const shopId = this.conn.shop_id ?? (await this.resolveShopId());
    if (!shopId) {
      throw new Error(
        "Etsy mağaza kimliği (shop_id) alınamadı. Mağazanızın açık olduğundan emin olun ya da yeniden bağlanın.",
      );
    }
    return shopId;
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
        "x-api-key": this.xApiKey,
        Authorization: `Bearer ${token}`,
      },
    });

    this.recordQuota(res);
    if (res.status === 429 && retry > 0) {
      await this.triage429(res, path); // günlükse fırlatır
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

  /**
   * Yazma (POST/PUT/PATCH) isteği — JSON gövdesiyle. get() ile aynı token
   * yenileme ve 429 yeniden deneme mantığını paylaşır. listings_w kapsamı
   * yoksa Etsy 403 döndürür; çağıran taraf bunu anlaşılır mesaja çevirir.
   */
  async request<T>(
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    retry = 1,
  ): Promise<T> {
    const token = await this.ensureToken();
    const res = await fetch(ETSY_API_BASE + path, {
      method,
      headers: {
        "x-api-key": this.xApiKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body == null ? undefined : JSON.stringify(body),
    });

    this.recordQuota(res);
    if (res.status === 429 && retry > 0) {
      await this.triage429(res, `${method} ${path}`);
      await new Promise((r) => setTimeout(r, 1200));
      return this.request<T>(method, path, body, retry - 1);
    }
    if (!res.ok) {
      throw new Error(
        `Etsy API hatası (${res.status}) ${method} ${path}: ${await res.text()}`,
      );
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /**
   * Form-encoded yazma (application/x-www-form-urlencoded). Etsy'nin çoğu
   * write ucu (ör. updateListing) JSON değil form bekler — envanter PUT'u
   * istisna. undefined alanlar atlanır.
   */
  async requestForm<T>(
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    form: Record<string, string | number | undefined | null>,
    retry = 1,
  ): Promise<T> {
    const token = await this.ensureToken();
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(form)) {
      if (v != null) body.append(k, String(v));
    }
    const res = await fetch(ETSY_API_BASE + path, {
      method,
      headers: {
        "x-api-key": this.xApiKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    this.recordQuota(res);
    if (res.status === 429 && retry > 0) {
      await this.triage429(res, `${method} ${path}`);
      await new Promise((r) => setTimeout(r, 1200));
      return this.requestForm<T>(method, path, form, retry - 1);
    }
    if (!res.ok) {
      throw new Error(
        `Etsy API hatası (${res.status}) ${method} ${path}: ${await res.text()}`,
      );
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /**
   * Multipart yazma (dosya yükleme — ör. uploadListingImage). Content-Type
   * ELLE SET EDİLMEZ: fetch, FormData'dan boundary'li başlığı kendisi üretir.
   * get() ile aynı token yenileme + 429 yeniden deneme mantığı.
   */
  async requestMultipart<T>(
    method: "POST" | "PUT",
    path: string,
    form: FormData,
    retry = 1,
  ): Promise<T> {
    const token = await this.ensureToken();
    const res = await fetch(ETSY_API_BASE + path, {
      method,
      headers: {
        "x-api-key": this.xApiKey,
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    this.recordQuota(res);
    if (res.status === 429 && retry > 0) {
      await this.triage429(res, `${method} ${path}`);
      await new Promise((r) => setTimeout(r, 1200));
      return this.requestMultipart<T>(method, path, form, retry - 1);
    }
    if (!res.ok) {
      throw new Error(
        `Etsy API hatası (${res.status}) ${method} ${path}: ${await res.text()}`,
      );
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}
