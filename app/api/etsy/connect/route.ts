import { NextResponse } from "next/server";

import { getMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generatePkce,
  generateState,
  buildAuthorizeUrl,
  resolveEtsyScopes,
} from "@/lib/etsy/oauth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const m = await getMembership();
  if (!m) return NextResponse.redirect(`${origin}/login`);

  const clientId = process.env.ETSY_API_KEY;
  // Etsy v3 API çağrıları keystring + shared secret ister. Secret yoksa bağlantı
  // baştan kurulamaz (API 403); OAuth akışını başlatmadan config hatası ver.
  if (!clientId || !process.env.ETSY_API_SECRET) {
    return NextResponse.redirect(`${origin}/ayarlar/etsy?error=config`);
  }

  const redirectUri =
    process.env.ETSY_OAUTH_REDIRECT_URI || `${origin}/api/etsy/callback`;
  // Zorunlu kapsamlar (listings_w dahil) connect + callback arasında paylaşılır;
  // böylece saklanan scope gerçekten istenen izni yansıtır.
  const scopes = resolveEtsyScopes();

  const { verifier, challenge } = await generatePkce();
  const state = generateState();

  const admin = createAdminClient();
  await admin.from("etsy_oauth_states").insert({
    state,
    org_id: m.org_id,
    code_verifier: verifier,
    redirect_to: "/ayarlar/etsy",
  });

  const authorizeUrl = buildAuthorizeUrl({
    clientId,
    redirectUri,
    scopes,
    state,
    challenge,
  });
  return NextResponse.redirect(authorizeUrl);
}
