import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

/**
 * Rekabet fiyat araştırması motoru.
 *
 * Her listing için "araştırma kelimesi"nde (products.research_keyword — boşsa
 * birincil tag) Etsy'de organik/relevans sıralı arama yapar, kendi mağazamız
 * dışındaki ilk 10 rakip ürünün fiyat bandını (min/medyan/ort/max) ve bizim
 * fiyatımızın bu banttaki yüzdelik konumunu hesaplayıp `keyword_research`
 * tablosuna anlık görüntü olarak yazar.
 *
 * Listingler 7 gruba (research_group 0..6) bölünmüştür; günlük cron bir grubu
 * işler → her listing 7 günde bir tazelenir.
 */

interface EtsyMoney {
  amount: number;
  divisor: number;
  currency_code: string;
}
interface EtsyActiveListing {
  listing_id: number;
  title: string;
  url?: string;
  shop_id?: number;
  price?: EtsyMoney;
}
interface EtsyActiveSearch {
  count: number;
  results: EtsyActiveListing[];
}

/** Etsy para nesnesi → tam sayı cent (geçersizse null). */
function moneyToCents(m?: EtsyMoney): number | null {
  if (!m || !m.divisor) return null;
  const cents = Math.round((m.amount / m.divisor) * 100);
  return cents > 0 ? cents : null;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export interface CompetitorRow {
  title: string;
  price_cents: number;
  currency: string;
  shop: number | null;
  url: string | null;
  position: number;
}

export interface ResearchResult {
  product_id: string;
  keyword: string | null;
  status: "ok" | "no-keyword" | "no-results";
  result_count: number;
}

export interface ProductRow {
  id: string;
  title: string;
  price_cents: number | null;
  currency: string | null;
  tags: string[] | null;
  research_keyword: string | null;
  etsy_listing_id: number | null;
}

/** Bir listing'in araştırma kelimesini çözer (override → birincil tag). */
export function resolveKeyword(product: ProductRow): string | null {
  const override = product.research_keyword?.trim();
  if (override) return override;
  const firstTag = product.tags?.find((t) => t && t.trim().length > 0);
  return firstTag?.trim() ?? null;
}

/** Bir listing için rekabet araştırması yapıp `keyword_research`'e yazar. */
export async function researchListing(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  ownShopId: number | null,
  product: ProductRow,
): Promise<ResearchResult> {
  const keyword = resolveKeyword(product);
  if (!keyword) {
    return { product_id: product.id, keyword: null, status: "no-keyword", result_count: 0 };
  }

  const search = await client.get<EtsyActiveSearch>(
    etsyPaths.activeListingsSearch(),
    { keywords: keyword, limit: 20, sort_on: "score", sort_order: "down" },
  );

  const currency = product.currency ?? "USD";
  // Rakip = kendi mağazamız dışında, geçerli fiyatlı, aynı para birimi; organik
  // sırayı koruyarak ilk 10.
  const competitors: CompetitorRow[] = (search.results ?? [])
    .filter((l) => ownShopId == null || l.shop_id !== ownShopId)
    .map((l, i) => ({
      title: l.title,
      price_cents: moneyToCents(l.price),
      currency: l.price?.currency_code ?? currency,
      shop: l.shop_id ?? null,
      url: l.url ?? null,
      position: i + 1,
    }))
    .filter(
      (c): c is CompetitorRow =>
        c.price_cents != null && c.currency === currency,
    )
    .slice(0, 10);

  const prices = competitors.map((c) => c.price_cents);
  const our = product.price_cents;
  const stats = prices.length
    ? {
        min_cents: Math.min(...prices),
        max_cents: Math.max(...prices),
        avg_cents: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        median_cents: median(prices),
        our_rank_pct:
          our != null ? prices.filter((p) => p < our).length / prices.length : null,
      }
    : {
        min_cents: null,
        max_cents: null,
        avg_cents: null,
        median_cents: null,
        our_rank_pct: null,
      };

  await admin.from("keyword_research").insert({
    org_id: orgId,
    product_id: product.id,
    keyword,
    our_price_cents: our,
    currency,
    result_count: competitors.length,
    ...stats,
    results: competitors,
  });

  return {
    product_id: product.id,
    keyword,
    status: competitors.length ? "ok" : "no-results",
    result_count: competitors.length,
  };
}

/**
 * Verilen grubu (0..6) tüm bağlı organizasyonlar için işler. Etsy rate-limit'e
 * saygılı (istekler arası ~220ms). Etsy bağlı değilse org atlanır (inert).
 */
export async function advanceKeywordResearch(
  group: number,
): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data: conns } = await admin
    .from("etsy_connection")
    .select("org_id, shop_id")
    .eq("status", "connected");

  const out: Record<string, unknown> = {};
  for (const conn of (conns ?? []) as { org_id: string; shop_id: number | null }[]) {
    let client: EtsyClient;
    try {
      client = await EtsyClient.forOrg(conn.org_id);
    } catch (e) {
      out[conn.org_id] = {
        skipped: e instanceof EtsyNotConnectedError ? "not-connected" : "error",
      };
      continue;
    }

    const { data: products } = await admin
      .from("products")
      .select(
        "id, title, price_cents, currency, tags, research_keyword, etsy_listing_id",
      )
      .eq("org_id", conn.org_id)
      .eq("research_group", group)
      .eq("status", "active");

    let ok = 0;
    let noKeyword = 0;
    let noResults = 0;
    let errors = 0;
    for (const p of (products ?? []) as ProductRow[]) {
      try {
        const r = await researchListing(admin, client, conn.org_id, conn.shop_id, p);
        if (r.status === "ok") ok++;
        else if (r.status === "no-keyword") noKeyword++;
        else noResults++;
      } catch {
        errors++;
      }
      await new Promise((r) => setTimeout(r, 220));
    }
    out[conn.org_id] = {
      group,
      total: products?.length ?? 0,
      ok,
      no_keyword: noKeyword,
      no_results: noResults,
      errors,
    };
  }
  return out;
}
