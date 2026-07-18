"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { researchKeywords, type KeywordResearchResult } from "@/lib/keywords";
import type { KeywordCandidate } from "@/lib/keywords/types";

export interface KeywordActionResult {
  ok?: boolean;
  error?: string;
}

/** Ürün bağlamını (başlık + etiket) çeker — araştırmayı zenginleştirir. */
async function productContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string | null,
): Promise<{ title: string | null; tags: string[] | null }> {
  if (!productId) return { title: null, tags: null };
  const { data } = await supabase
    .from("products")
    .select("title, tags")
    .eq("id", productId)
    .maybeSingle();
  const row = data as { title: string | null; tags: string[] | null } | null;
  return { title: row?.title ?? null, tags: row?.tags ?? null };
}

/** Tohum (ve opsiyonel ürün) için aday anahtar kelimeleri üretir (kaydetmez). */
export async function researchKeywordsAction(
  seed: string,
  productId?: string | null,
): Promise<
  { ok: true; data: KeywordResearchResult } | { ok: false; error: string }
> {
  await requireMembership();
  const s = seed.trim();
  if (!s && !productId) return { ok: false, error: "Bir tohum kelime girin." };

  const supabase = await createClient();
  const ctx = await productContext(supabase, productId ?? null);
  try {
    const data = await researchKeywords({
      seed: s || ctx.title || "",
      productTitle: ctx.title,
      productTags: ctx.tags,
    });
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Araştırma başarısız.",
    };
  }
}

/** Bir adayı 'selected' olarak kaydeder (listing SEO akışına taşımak üzere). */
export async function saveKeywordAction(
  candidate: KeywordCandidate,
  seed: string,
  productId?: string | null,
): Promise<KeywordActionResult> {
  const m = await requireMembership();
  const keyword = candidate.keyword.trim();
  if (!keyword) return { error: "Boş anahtar kelime." };

  const supabase = await createClient();
  const user = await getUser();
  const { error } = await supabase.from("keyword_ideas").insert({
    org_id: m.org_id,
    product_id: productId ?? null,
    seed: seed.trim() || null,
    keyword,
    source: candidate.source,
    search_volume: candidate.searchVolume,
    competition: candidate.competition,
    cpc_cents: candidate.cpcCents,
    score: candidate.score,
    status: "selected",
    created_by: user?.id ?? null,
  });
  // Aynı anahtar kelime zaten kayıtlıysa (unique ihlali) sessizce başarı say.
  if (error && error.code !== "23505") return { error: error.message };
  revalidatePath("/anahtar-kelime");
  return { ok: true };
}

/** Kaydedilmiş anahtar kelimeyi çıkarır. */
export async function removeSavedKeywordAction(
  id: string,
): Promise<KeywordActionResult> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("keyword_ideas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/anahtar-kelime");
  return { ok: true };
}
