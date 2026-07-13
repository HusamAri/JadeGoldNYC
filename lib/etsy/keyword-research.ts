import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  etsyMoneyToCents,
  type EtsyPropertyValue,
  type EtsyInventory,
} from "@/lib/etsy/types";

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

// ── Aynı-varyant karşılaştırması (deep mod) ────────────────────────────────
// Rakip listing'lerin varyantları (getListingInventory) çekilir; bizim
// varyantlarla beden/uzunluk + ayar (karat) token'ıyla eşleştirilir.

interface VariantTokens {
  size: string | null; // normalize uzunluk/beden, ör. "22in" | "7"
  karat: string | null; // "10k" | "14k" | "18k" | "24k"
}

/** property_values dizisinden beden/ayar token'larını çıkarır. */
function tokenize(props?: EtsyPropertyValue[] | null): VariantTokens {
  const text = (props ?? [])
    .flatMap((p) => p.values ?? [])
    .join(" ")
    .toLowerCase();
  let size: string | null = null;
  let karat: string | null = null;
  const len = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in\b|"|”|cm|mm)/);
  if (len) size = len[1].replace(/\.0$/, "") + "in";
  if (!size) {
    // bedensiz sayı (yüzük ölçüsü vb.) — ilk bağımsız sayı
    const n = text.match(/\b(\d{1,2}(?:\.\d)?)\b/);
    if (n) size = n[1];
  }
  const k = text.match(/\b(\d{1,2})\s*k(?:t|arat|\b)/) || text.match(/\b(\d{1,2})\s*ayar/);
  if (k) karat = k[1] + "k";
  return { size, karat };
}

/** İki varyant token'ı aynı varyantı mı gösteriyor? */
function tokensMatch(a: VariantTokens, b: VariantTokens): boolean {
  if (a.karat && b.karat && a.size && b.size)
    return a.karat === b.karat && a.size === b.size;
  if (a.size && b.size) return a.size === b.size;
  if (a.karat && b.karat) return a.karat === b.karat;
  return false;
}

interface CompetitorOffering {
  tokens: VariantTokens;
  price_cents: number;
}

/** Bir rakip listing'in varyant offering'lerini çeker (okunamıyorsa boş).
 *  Public getListing?includes=Inventory kullanılır — sahiplik gerektirmez,
 *  aktif listing'in herkese açık varyant/fiyatlarını döndürür. */
async function fetchCompetitorOfferings(
  client: EtsyClient,
  listingId: number,
  currency: string,
): Promise<CompetitorOffering[]> {
  try {
    const resp = await client.get<{ inventory?: EtsyInventory }>(
      etsyPaths.listing(listingId),
      { includes: "Inventory" },
    );
    const products = resp.inventory?.products ?? [];
    const out: CompetitorOffering[] = [];
    for (const p of products) {
      if (p.is_deleted) continue;
      const off = (p.offerings ?? []).find((o) => !o.is_deleted);
      const cents = etsyMoneyToCents(off?.price);
      if (!cents || (off?.price && off.price.currency_code !== currency)) continue;
      out.push({ tokens: tokenize(p.property_values), price_cents: cents });
    }
    return out;
  } catch {
    return []; // rakip envanteri okunamadı — bu rakip atlanır
  }
}

export interface OurVariant {
  sku: string;
  name: string | null;
  properties: EtsyPropertyValue[] | null;
  price_cents: number | null;
  weight_grams: number | null;
}

export interface VariantComparison {
  sku: string;
  label: string;
  our_price_cents: number | null;
  competitor_count: number;
  min_cents: number | null;
  median_cents: number | null;
  avg_cents: number | null;
  max_cents: number | null;
  our_rank_pct: number | null;
  basis: "variant" | "none";
}

/** Bizim varyantlar × rakip offering'ler → varyant başına fiyat bandı + konum. */
function buildVariantComparison(
  ourVariants: OurVariant[],
  competitorOfferings: CompetitorOffering[],
): VariantComparison[] {
  return ourVariants.map((v) => {
    const vt = tokenize(v.properties);
    const label =
      (v.properties ?? [])
        .flatMap((p) => p.values ?? [])
        .join(" · ") || v.name || v.sku;
    const matched = competitorOfferings.filter((c) => tokensMatch(vt, c.tokens));
    const prices = matched.map((c) => c.price_cents);
    if (!prices.length) {
      return {
        sku: v.sku,
        label,
        our_price_cents: v.price_cents,
        competitor_count: 0,
        min_cents: null,
        median_cents: null,
        avg_cents: null,
        max_cents: null,
        our_rank_pct: null,
        basis: "none",
      };
    }
    const our = v.price_cents;
    return {
      sku: v.sku,
      label,
      our_price_cents: our,
      competitor_count: prices.length,
      min_cents: Math.min(...prices),
      median_cents: median(prices),
      avg_cents: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      max_cents: Math.max(...prices),
      our_rank_pct:
        our != null ? prices.filter((p) => p < our).length / prices.length : null,
      basis: "variant",
    };
  });
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
  deep = false,
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
  // sırayı koruyarak ilk 10. Ham liste listing_id'yi taşır (derin mod için).
  const rawCompetitors = (search.results ?? [])
    .filter((l) => ownShopId == null || l.shop_id !== ownShopId)
    .filter((l) => {
      const c = moneyToCents(l.price);
      return c != null && (l.price?.currency_code ?? currency) === currency;
    })
    .slice(0, 10);

  const competitors: CompetitorRow[] = rawCompetitors.map((l, i) => ({
    title: l.title,
    price_cents: moneyToCents(l.price) as number,
    currency: l.price?.currency_code ?? currency,
    shop: l.shop_id ?? null,
    url: l.url ?? null,
    position: i + 1,
  }));

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

  // Derin mod: rakip varyantlarını çekip bizimkilerle eşleştir (aynı-varyant
  // fiyat karşılaştırması). Maliyeti sınırlamak için ilk 8 rakip.
  let variantComparison: VariantComparison[] | null = null;
  if (deep) {
    const { data: ourVars } = await admin
      .from("product_variants")
      .select("sku, name, properties, price_cents, weight_grams")
      .eq("org_id", orgId)
      .eq("product_id", product.id);
    const ourVariants = (ourVars ?? []) as OurVariant[];
    if (ourVariants.length > 0) {
      const offerings: CompetitorOffering[] = [];
      for (const l of rawCompetitors.slice(0, 8)) {
        if (l.listing_id == null) continue;
        const offs = await fetchCompetitorOfferings(client, l.listing_id, currency);
        offerings.push(...offs);
        await new Promise((r) => setTimeout(r, 160));
      }
      variantComparison = buildVariantComparison(ourVariants, offerings);
    }
  }

  await admin.from("keyword_research").insert({
    org_id: orgId,
    product_id: product.id,
    keyword,
    our_price_cents: our,
    currency,
    result_count: competitors.length,
    ...stats,
    results: competitors,
    variant_comparison: variantComparison,
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
