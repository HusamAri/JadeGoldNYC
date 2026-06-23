import { NextResponse } from "next/server";

import { getMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generatePkce,
  generateState,
  buildAuthorizeUrl,
} from "@/lib/etsy/oauth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const m = await getMembership();
  if (!m) return NextResponse.redirect(`${origin}/login`);

  const clientId = process.env.ETSY_API_KEY;
  if (!clientId) {
    return NextResponse.redirect(`${origin}/ayarlar/etsy?error=config`);
  }

  const redirectUri =
    process.env.ETSY_OAUTH_REDIRECT_URI || `${origin}/api/etsy/callback`;
  const scopes =
    process.env.ETSY_SCOPES ||
    "shops_r transactions_r listings_r email_r feedback_r";

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
