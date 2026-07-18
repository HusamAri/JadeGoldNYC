import { NextResponse } from "next/server";

import { getMembership, isManager } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildShopifyAuthorizeUrl,
  isShopifyConfigured,
  normalizeShopDomain,
} from "@/lib/shopify/client";

/**
 * Shopify OAuth başlat. `?shop=xxx.myshopify.com` gerekir.
 * API key/secret yoksa inert → ayarlar sayfasına config hatası.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const m = await getMembership();
  if (!m) return NextResponse.redirect(`${origin}/login`);
  if (!isManager(m.role)) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=forbidden`);
  }
  if (!isShopifyConfigured()) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=config`);
  }

  const shop = normalizeShopDomain(url.searchParams.get("shop") ?? "");
  if (!shop) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=shop`);
  }

  const state = crypto.randomUUID();
  const admin = createAdminClient();
  await admin.from("shopify_oauth_states").insert({
    state,
    org_id: m.org_id,
    shop_domain: shop,
    redirect_to: "/ayarlar/shopify",
  });

  const authorizeUrl = buildShopifyAuthorizeUrl({ shopDomain: shop, state });
  if (!authorizeUrl) {
    return NextResponse.redirect(`${origin}/ayarlar/shopify?error=config`);
  }
  return NextResponse.redirect(authorizeUrl);
}
