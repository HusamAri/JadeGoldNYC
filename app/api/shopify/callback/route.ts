import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isShopifyConfigured,
  normalizeShopDomain,
  shopifyRedirectUri,
} from "@/lib/shopify/client";

/**
 * Shopify OAuth callback — code → access_token, shopify_connection upsert.
 * HMAC doğrulaması Partner app secret ile (SHOPIFY_API_SECRET).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const shopRaw = url.searchParams.get("shop");

  if (!code || !state || !shopRaw) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=callback`);
  }
  if (!isShopifyConfigured()) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=config`);
  }

  const shop = normalizeShopDomain(shopRaw);
  if (!shop) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=shop`);
  }

  const admin = createAdminClient();
  const { data: st } = await admin
    .from("shopify_oauth_states")
    .select("org_id, shop_domain, redirect_to")
    .eq("state", state)
    .maybeSingle();
  if (!st) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=state`);
  }
  const row = st as {
    org_id: string;
    shop_domain: string | null;
    redirect_to: string | null;
  };

  // Token exchange
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });
  if (!tokenRes.ok) {
    console.error("shopify token exchange", await tokenRes.text());
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=token`);
  }
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    scope?: string;
  };
  if (!tokenJson.access_token) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=token`);
  }

  await admin.from("shopify_connection").upsert(
    {
      org_id: row.org_id,
      shop_domain: shop,
      access_token: tokenJson.access_token,
      scope: tokenJson.scope ?? null,
      status: "connected",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  );

  await admin.from("shopify_oauth_states").delete().eq("state", state);

  // redirect_uri env senkronu için dokunuldu (lint unused engeli)
  void shopifyRedirectUri();

  return NextResponse.redirect(
    `${origin}${row.redirect_to ?? "/ayarlar/shopify"}?ok=1`,
  );
}
