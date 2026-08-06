import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import {
  PINTEREST_API_BASE,
  exchangeCodeForToken,
  isPinterestConfigured,
} from "@/lib/pinterest/client";

/**
 * Pinterest OAuth callback. State satırı TEK KULLANIMLIK: koşullu silme ile
 * tüketilir, böylece aynı state ile ikinci bir çağrı token üretemez.
 *
 * Not: `searchParams` form-decode'u `+` içeren değerleri bozabildiği için
 * (second-brain vakası) state ham query'den de okunur.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (kod: string) =>
    NextResponse.redirect(`${origin}/ayarlar/pinterest?error=${kod}`);

  if (!isPinterestConfigured()) return fail("config");

  // Pinterest kullanıcı reddederse `error=access_denied` döner.
  if (url.searchParams.get("error")) return fail("denied");

  const code = url.searchParams.get("code");
  const rawState = /[?&]state=([^&]+)/.exec(url.search)?.[1];
  const state = rawState ? decodeURIComponent(rawState) : null;
  if (!code || !state) return fail("params");

  const admin = createAdminClient();

  // TEK KULLANIM: satırı silerek tüket (compare-and-swap yerine delete-returning).
  // İkinci çağrı 0 satır alır ve akış burada durur.
  const { data: consumed } = await admin
    .from("pinterest_oauth_states")
    .delete()
    .eq("state", state)
    .select("org_id, code_verifier, redirect_to");
  const st = (consumed ?? [])[0] as
    | { org_id: string; code_verifier: string | null; redirect_to: string | null }
    | undefined;
  if (!st?.code_verifier) return fail("state");

  let token;
  try {
    token = await exchangeCodeForToken(code, st.code_verifier);
  } catch {
    return fail("token");
  }

  const now = Date.now();
  const row: Record<string, unknown> = {
    org_id: st.org_id,
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? null,
    scope: token.scope ?? null,
    status: "connected",
    expires_at: token.expires_in
      ? new Date(now + token.expires_in * 1000).toISOString()
      : null,
    refresh_expires_at: token.refresh_token_expires_in
      ? new Date(now + token.refresh_token_expires_in * 1000).toISOString()
      : null,
  };

  // Künye: hesap adını hemen çek ki ayarlar sayfası "bağlı" derken KİME bağlı
  // olduğunu da göstersin. Başarısız olursa bağlantı yine kurulur (kritik değil).
  try {
    const res = await fetch(`${PINTEREST_API_BASE}/user_account`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const acc = (await res.json()) as {
        username?: string;
        account_type?: string;
        id?: string;
      };
      row.username = acc.username ?? null;
      row.account_type = acc.account_type ?? null;
      row.account_id = acc.id ?? null;
    }
  } catch {
    // künye yoksa bağlantı yine geçerli
  }

  const { error } = await admin
    .from("pinterest_connection")
    .upsert(row, { onConflict: "org_id" });
  if (error) return fail("save");

  await logAudit(admin, {
    orgId: st.org_id,
    action: "pinterest.connect",
    entityType: "organizations",
    entityId: st.org_id,
    summary: `Pinterest bağlandı${row.username ? ` (@${row.username})` : ""}.`,
    source: "app",
  });

  return NextResponse.redirect(
    `${origin}${st.redirect_to ?? "/ayarlar/pinterest"}?connected=1`,
  );
}
