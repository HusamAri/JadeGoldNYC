import { createClient } from "@/lib/supabase/server";
import type {
  CompetitorRow,
  VariantComparison,
} from "@/lib/etsy/keyword-research";

/** Bir listing için son rekabet araştırması anlık görüntüsü. */
export interface KeywordResearchSnapshot {
  id: string;
  product_id: string;
  keyword: string;
  researched_at: string;
  our_price_cents: number | null;
  currency: string;
  result_count: number;
  min_cents: number | null;
  max_cents: number | null;
  avg_cents: number | null;
  median_cents: number | null;
  our_rank_pct: number | null;
  results: CompetitorRow[];
  variant_comparison: VariantComparison[] | null;
  // Gram-normalize pazar konumu (0076) — günlük rutin doldurur.
  our_per_gram_cents: number | null;
  market_low_per_gram_cents: number | null;
  market_avg_per_gram_cents: number | null;
  market_high_per_gram_cents: number | null;
  melt_per_gram_cents: number | null;
  price_position: "pahali" | "ucuz" | "bantta" | "belirsiz" | null;
  deviation_pct: number | null;
  confidence: "yuksek" | "orta" | "dusuk" | null;
  recommendation: string | null;
}

/** Listing'in araştırma kelimesi meta bilgisi (editör önizlemesi için). */
export interface ProductResearchMeta {
  research_keyword: string | null;
  tags: string[] | null;
  price_cents: number | null;
}

export async function getProductResearchMeta(
  productId: string,
): Promise<ProductResearchMeta | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("research_keyword, tags, price_cents")
    .eq("id", productId)
    .maybeSingle();
  return (data as ProductResearchMeta | null) ?? null;
}

/** Verilen ürünün EN GÜNCEL araştırma anlık görüntüsü (RLS: org üyesi). */
export async function getLatestKeywordResearch(
  productId: string,
): Promise<KeywordResearchSnapshot | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("keyword_research")
    .select("*")
    .eq("product_id", productId)
    .order("researched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as KeywordResearchSnapshot | null) ?? null;
}
