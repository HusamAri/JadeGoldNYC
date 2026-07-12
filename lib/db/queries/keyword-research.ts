import { createClient } from "@/lib/supabase/server";
import type { CompetitorRow } from "@/lib/etsy/keyword-research";

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
