import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCode } from "@/lib/etsy/oauth";
import { ETSY_API_BASE } from "@/lib/etsy/endpoints";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/ayarlar/etsy?error=missing`);
  }

  const admin = createAdminClient();
  const { data: stateRow } = await admin
    .from("etsy_oauth_states")
    .select("state, org_id, code_verifier")
    .eq("state", state)
    .maybeSingle();
  if (!stateRow) {
    return NextResponse.redirect(`${origin}/ayarlar/etsy?error=state`);
  }

  const clientId = process.env.ETSY_API_KEY;
  if (!clientId) {
    return NextResponse.redirect(`${origin}/ayarlar/etsy?error=config`);
  }
  const redirectUri =
    process.env.ETSY_OAUTH_REDIRECT_URI || `${origin}/api/etsy/callback`;

  try {
    const tok = await exchangeCode({
      clientId,
      redirectUri,
      code,
      verifier: (stateRow as { code_verifier: string }).code_verifier,
    });

    // user_id, access token önekinden (`{user_id}.{token}`) okunur.
    const etsyUserId = tok.access_token.split(".")[0] ?? null;

    // shop_id'yi /users/me'den çekmeyi dene (best-effort).
    let shopId: number | null = null;
    try {
      const apiSecret = process.env.ETSY_API_SECRET;
      const meRes = await fetch(`${ETSY_API_BASE}/users/me`, {
        headers: {
          // Etsy v3 API: x-api-key = keystring:shared_secret
          "x-api-key": apiSecret ? `${clientId}:${apiSecret}` : clientId,
          Authorization: `Bearer ${tok.access_token}`,
        },
      });
      if (meRes.ok) {
        const me = (await meRes.json()) as { shop_id?: number };
        shopId = me?.shop_id ?? null;
      }
    } catch {
      // yok say
    }

    const now = Date.now();
    const orgId = (stateRow as { org_id: string }).org_id;
    await admin.from("etsy_connection").upsert(
      {
        org_id: orgId,
        etsy_user_id: etsyUserId,
        shop_id: shopId,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        scope: process.env.ETSY_SCOPES ?? null,
        access_token_expires_at: new Date(
          now + tok.expires_in * 1000,
        ).toISOString(),
        refresh_token_expires_at: new Date(
          now + 90 * 24 * 3600 * 1000,
        ).toISOString(),
        status: "connected",
      },
      { onConflict: "org_id" },
    );

    await admin.from("etsy_oauth_states").delete().eq("state", state);

    await logAudit(admin, {
      orgId,
      action: "etsy.connect",
      entityType: "etsy_connection",
      summary: "Etsy mağazası bağlandı",
      source: "etsy",
      actorLabel: "Etsy",
    });

    return NextResponse.redirect(`${origin}/ayarlar/etsy?connected=1`);
  } catch {
    return NextResponse.redirect(`${origin}/ayarlar/etsy?error=token`);
  }
}
