import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Pinterest API v5 istemcisi — Etsy/Shopify deseni gibi INERT:
 * `PINTEREST_APP_ID` + `PINTEREST_APP_SECRET` yoksa bağlan butonu pasif kalır,
 * hiçbir çağrı yapılmaz. Kimlik bilgileri Pinterest Developer konsolundan
 * alınır; env'e girilene kadar modül tamamen sessizdir.
 *
 * Pinterest'in Etsy/Shopify'dan iki yapısal farkı var, tasarım buna göre:
 *  1. access_token SÜRELİDİR (varsayılan ~30 gün) ve refresh_token'ın KENDİSİ
 *     de sürelidir (~1 yıl). Refresh süresi dolduysa sessiz yenileme
 *     İMKÂNSIZDIR — kullanıcı yeniden yetkilendirmeli. Panel bunu ayrı
 *     kolonda (refresh_expires_at) taşır ki uyarı doğru zamanda çıksın.
 *  2. Token ucu Basic auth ister (client_id:client_secret base64), gövdede
 *     client_secret GÖNDERİLMEZ.
 */

const AUTHORIZE_URL = "https://www.pinterest.com/oauth/";
const TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
export const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

/** Yenilemeyi erken tetikleme payı — süre bitimine bu kadar kalınca yenile. */
const REFRESH_SKEW_MS = 5 * 60_000;

export function isPinterestConfigured(): boolean {
  return Boolean(
    process.env.PINTEREST_APP_ID?.trim() &&
      process.env.PINTEREST_APP_SECRET?.trim(),
  );
}

/**
 * Varsayılan kapsam SALT OKUNUR + pin yazma. `boards:write` bilerek YOK:
 * panelin işi mevcut panolara pin basmak, pano yapısını değiştirmek değil.
 * Genişletmek gerekirse env ile açılır (en az yetki ilkesi).
 */
export function pinterestScopes(): string {
  return (
    process.env.PINTEREST_SCOPES?.trim() ||
    "user_accounts:read,boards:read,pins:read,pins:write"
  );
}

export function pinterestRedirectUri(): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  // OAuth callback KALICI domain olmalı — hash'li deployment URL'i deployment
  // silinince akışı kırar (second-brain: DEPLOYMENT_NOT_FOUND vakası).
  return (
    process.env.PINTEREST_OAUTH_REDIRECT_URI?.trim() ||
    `${base}/api/pinterest/callback`
  );
}

// ── PKCE ──────────────────────────────────────────────────────────────────

function base64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createCodeVerifier(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(48)));
}

export async function codeChallengeOf(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(digest);
}

export function buildPinterestAuthorizeUrl(opts: {
  state: string;
  codeChallenge: string;
}): string | null {
  if (!isPinterestConfigured()) return null;
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_APP_ID!.trim(),
    redirect_uri: pinterestRedirectUri(),
    response_type: "code",
    scope: pinterestScopes(),
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
  const id = process.env.PINTEREST_APP_ID!.trim();
  const secret = process.env.PINTEREST_APP_SECRET!.trim();
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

export interface PinterestTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
}

async function postToken(
  body: Record<string, string>,
): Promise<PinterestTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    // Gövdeyi kırpıp taşı: Pinterest hata metni teşhis için gerekli, ama
    // token içerebilecek uzun cevabı olduğu gibi loglamayız.
    throw new Error(`Pinterest token ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as PinterestTokenResponse;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<PinterestTokenResponse> {
  return postToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: pinterestRedirectUri(),
    code_verifier: codeVerifier,
  });
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<PinterestTokenResponse> {
  return postToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: pinterestScopes(),
  });
}

// ── Bağlantı bağlamlı istemci ─────────────────────────────────────────────

export class PinterestNotConnectedError extends Error {}

interface ConnectionRow {
  id: string;
  org_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  refresh_expires_at: string | null;
  status: string;
}

/**
 * Org bağlamında otomatik yenilemeli Pinterest istemcisi.
 *
 * Yenileme kuralı: access_token süresi dolmuşsa (veya 5dk içinde dolacaksa)
 * refresh edilir. Refresh token'ın KENDİSİ süresi dolmuşsa bağlantı `expired`
 * işaretlenir ve throw edilir — sessizce başarısız çağrı üretmek yerine
 * kullanıcıdan yeniden yetkilendirme istenir.
 */
export class PinterestClient {
  private constructor(
    private readonly orgId: string,
    private accessToken: string,
  ) {}

  static async forOrg(orgId: string): Promise<PinterestClient> {
    if (!isPinterestConfigured()) {
      throw new PinterestNotConnectedError(
        "Pinterest kimlik bilgileri tanımlı değil (PINTEREST_APP_ID/SECRET).",
      );
    }
    const admin = createAdminClient();
    const { data } = await admin
      .from("pinterest_connection")
      .select(
        "id, org_id, access_token, refresh_token, expires_at, refresh_expires_at, status",
      )
      .eq("org_id", orgId)
      .maybeSingle();
    const row = data as ConnectionRow | null;
    if (!row?.access_token) {
      throw new PinterestNotConnectedError("Pinterest bağlantısı yok.");
    }
    if (row.status === "revoked") {
      throw new PinterestNotConnectedError(
        "Pinterest bağlantısı iptal edilmiş — yeniden bağlanın.",
      );
    }

    const now = Date.now();
    const exp = row.expires_at ? Date.parse(row.expires_at) : NaN;
    const taze = !Number.isFinite(exp) || exp - now > REFRESH_SKEW_MS;
    if (taze) return new PinterestClient(orgId, row.access_token);

    // Yenileme gerekli — önce refresh token'ın kendisi geçerli mi?
    const rexp = row.refresh_expires_at
      ? Date.parse(row.refresh_expires_at)
      : NaN;
    if (!row.refresh_token || (Number.isFinite(rexp) && rexp <= now)) {
      await admin
        .from("pinterest_connection")
        .update({ status: "expired" })
        .eq("id", row.id);
      throw new PinterestNotConnectedError(
        "Pinterest yenileme izni süresi doldu — Ayarlar'dan yeniden bağlanın.",
      );
    }

    const t = await refreshAccessToken(row.refresh_token);
    await admin
      .from("pinterest_connection")
      .update({
        access_token: t.access_token,
        // Pinterest bazı akışlarda yeni refresh token döndürmez; döndürmezse
        // mevcut olan korunur (null yazmak bağlantıyı öldürürdü).
        ...(t.refresh_token ? { refresh_token: t.refresh_token } : {}),
        ...(t.expires_in
          ? { expires_at: new Date(now + t.expires_in * 1000).toISOString() }
          : {}),
        ...(t.refresh_token_expires_in
          ? {
              refresh_expires_at: new Date(
                now + t.refresh_token_expires_in * 1000,
              ).toISOString(),
            }
          : {}),
        status: "connected",
      })
      .eq("id", row.id);
    return new PinterestClient(orgId, t.access_token);
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${PINTEREST_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(
        `Pinterest ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`,
      );
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  /** Bağlı hesabın kimliği — bağlantı kurulurken künyeyi doldurmak için. */
  async userAccount(): Promise<{
    username?: string;
    account_type?: string;
    id?: string;
  }> {
    return this.get("/user_account");
  }

  orgIdValue(): string {
    return this.orgId;
  }
}
