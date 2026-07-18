/**
 * Shopify Admin API istemcisi — Etsy deseni gibi inert:
 * `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET` yoksa bağlan butonu pasif kalır.
 * OAuth callback token'ı `shopify_connection` tablosuna yazar (service-role).
 */

export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.SHOPIFY_API_KEY?.trim() &&
      process.env.SHOPIFY_API_SECRET?.trim(),
  );
}

export function shopifyScopes(): string {
  return (
    process.env.SHOPIFY_SCOPES?.trim() ||
    "read_products,write_products,read_orders,read_inventory"
  );
}

export function shopifyRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return (
    process.env.SHOPIFY_OAUTH_REDIRECT_URI?.trim() ||
    `${base}/api/shopify/callback`
  );
}

/** OAuth authorize URL — shop alan adı zorunlu (xxx.myshopify.com). */
export function buildShopifyAuthorizeUrl(opts: {
  shopDomain: string;
  state: string;
}): string | null {
  if (!isShopifyConfigured()) return null;
  const shop = normalizeShopDomain(opts.shopDomain);
  if (!shop) return null;
  const key = process.env.SHOPIFY_API_KEY!;
  const params = new URLSearchParams({
    client_id: key,
    scope: shopifyScopes(),
    redirect_uri: shopifyRedirectUri(),
    state: opts.state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export function normalizeShopDomain(raw: string): string | null {
  let s = raw.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!s.includes(".")) s = `${s}.myshopify.com`;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s)) return null;
  return s;
}
