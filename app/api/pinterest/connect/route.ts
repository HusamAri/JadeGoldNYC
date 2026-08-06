import { NextResponse } from "next/server";

import { getMembership, isManager } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPinterestAuthorizeUrl,
  codeChallengeOf,
  createCodeVerifier,
  isPinterestConfigured,
} from "@/lib/pinterest/client";

/**
 * Pinterest OAuth başlat (PKCE). Kimlik bilgileri yoksa inert → ayarlar
 * sayfasına config hatasıyla döner, hiçbir dış çağrı yapılmaz.
 *
 * `code_verifier` sunucuda üretilir ve state satırında saklanır; callback onu
 * tüketir. İstemciye hiç gitmez.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const m = await getMembership();
  if (!m) return NextResponse.redirect(`${origin}/login`);
  if (!isManager(m.role)) {
    return NextResponse.redirect(`${origin}/ayarlar/pinterest?error=forbidden`);
  }
  if (!isPinterestConfigured()) {
    return NextResponse.redirect(`${origin}/ayarlar/pinterest?error=config`);
  }

  const state = crypto.randomUUID();
  const verifier = createCodeVerifier();
  const challenge = await codeChallengeOf(verifier);

  const admin = createAdminClient();
  const { error } = await admin.from("pinterest_oauth_states").insert({
    state,
    org_id: m.org_id,
    code_verifier: verifier,
    redirect_to: "/ayarlar/pinterest",
  });
  if (error) {
    return NextResponse.redirect(`${origin}/ayarlar/pinterest?error=state`);
  }

  const authorizeUrl = buildPinterestAuthorizeUrl({
    state,
    codeChallenge: challenge,
  });
  if (!authorizeUrl) {
    return NextResponse.redirect(`${origin}/ayarlar/pinterest?error=config`);
  }
  return NextResponse.redirect(authorizeUrl);
}
