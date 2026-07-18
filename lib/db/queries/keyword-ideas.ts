import { createClient } from "@/lib/supabase/server";

export interface KeywordIdeaRow {
  id: string;
  product_id: string | null;
  seed: string | null;
  keyword: string;
  source: string;
  search_volume: number | null;
  competition: number | null;
  cpc_cents: number | null;
  score: number | null;
  status: string;
  created_at: string;
}

/** Kaydedilmiş (selected) anahtar kelimeler — hacme/skora göre. */
export async function listSavedKeywords(
  orgId: string,
): Promise<KeywordIdeaRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("keyword_ideas")
    .select(
      "id, product_id, seed, keyword, source, search_volume, competition, cpc_cents, score, status, created_at",
    )
    .eq("org_id", orgId)
    .eq("status", "selected")
    .order("search_volume", { ascending: false, nullsFirst: false })
    .order("score", { ascending: false })
    .limit(500);
  if (error) {
    console.error("listSavedKeywords:", error.message);
    return [];
  }
  return (data ?? []) as KeywordIdeaRow[];
}

/** Ürün seçici için hafif liste (id + başlık). */
export async function listProductsLite(
  orgId: string,
): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("listProductsLite:", error.message);
    return [];
  }
  return (data ?? []) as { id: string; title: string }[];
}
