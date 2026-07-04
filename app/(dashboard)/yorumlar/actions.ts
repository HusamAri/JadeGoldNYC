"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { aiGenerateText, isAIConfigured } from "@/lib/ai";
import { getReview } from "@/lib/db/queries/reviews";
import {
  reviewFormSchema,
  type ReviewFormValues,
} from "@/lib/validations/review";

export interface ReviewActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function toRow(v: ReviewFormValues) {
  return {
    buyer_name: v.buyer_name || null,
    rating: v.rating.trim() ? Number(v.rating) : null,
    review_text: v.review_text || null,
    language: v.language || null,
    review_date: v.review_date.trim() ? v.review_date : null,
    status: v.status,
    internal_note: v.internal_note || null,
  };
}

export async function createReview(
  values: ReviewFormValues,
): Promise<ReviewActionResult> {
  const parsed = reviewFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({ ...toRow(parsed.data), org_id: m.org_id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/yorumlar");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateReview(
  id: string,
  values: ReviewFormValues,
): Promise<ReviewActionResult> {
  const parsed = reviewFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/yorumlar");
  return { ok: true, id };
}

export async function deleteReview(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/yorumlar");
  return {};
}

/**
 * Yorum yanıtı taslağını kaydeder. `markAnswered` ise durumu "yanıtlandı" yapar
 * ve yanıt tarihini damgalar. (Etsy'ye gönderim API'de yok — yanıt Etsy sitesine
 * elle yapıştırılır; bu yalnız panel içi taslak + takip.)
 */
export async function saveReviewResponse(
  id: string,
  responseText: string,
  markAnswered: boolean,
): Promise<ReviewActionResult> {
  await requireMembership();
  const text = responseText.trim();
  if (text.length > 4000) return { error: "Yanıt 4000 karakteri aşamaz." };

  const supabase = await createClient();
  const patch: Record<string, unknown> = { response_text: text || null };
  if (markAnswered) {
    patch.status = "yanitlandi";
    patch.responded_at = new Date().toISOString();
  }
  const { error } = await supabase.from("reviews").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/yorumlar");
  revalidatePath(`/yorumlar/${id}/duzenle`);
  return { ok: true, id };
}

export interface AiReplyResult {
  text?: string;
  error?: string;
}

/**
 * Yoruma marka sesiyle kısa bir yanıt taslağı üretir (AI Gateway). Yorumun
 * dilini yansıtır; olumsuz yorumlarda empatik ve çözüm odaklı olur.
 * AI yapılandırılmamışsa zarifçe hata döndürür (buton yine de kullanılabilir).
 */
export async function generateReviewReply(id: string): Promise<AiReplyResult> {
  await requireMembership();
  if (!isAIConfigured()) {
    return {
      error:
        "AI Gateway yapılandırılmamış. Vercel'de otomatik gelir; local için AI_GATEWAY_API_KEY gerekir.",
    };
  }

  const review = await getReview(id);
  if (!review) return { error: "Yorum bulunamadı." };

  let productTitle: string | null = null;
  if (review.product_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("title")
      .eq("id", review.product_id)
      .maybeSingle();
    productTitle = (data as { title?: string } | null)?.title ?? null;
  }

  const lang = review.language
    ? `the reviewer's language ("${review.language}")`
    : "the same language the review is written in";

  const system = `You are the customer-care voice of "Jade Gold NYC", a New York solid-gold (10K/14K) fine-jewelry brand. Write a short, warm, professional PUBLIC reply to a customer's Etsy review.
Rules:
- Write in ${lang}. Mirror the reviewer's tone.
- 1–3 sentences maximum. No emojis. No markdown.
- Positive review: thank them warmly and specifically (mention the item if provided).
- Negative or critical review: be genuinely empathetic, take responsibility, never argue or make excuses, and invite them to message the shop so you can make it right.
- Do not state specific refund amounts or promises you can't keep. Never reveal you are an AI.
- End with the brand name "Jade Gold NYC".
Return ONLY the reply text, nothing else.`;

  const prompt = `Review rating: ${review.rating ?? "—"}/5
${productTitle ? `Item: ${productTitle}\n` : ""}Reviewer: ${review.buyer_name || "a customer"}
Review text:
"""
${review.review_text || "(no written text — star rating only)"}
"""`;

  try {
    const text = await aiGenerateText({
      system,
      prompt,
      maxOutputTokens: 400,
    });
    return { text: text.trim() };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "AI üretimi başarısız oldu.",
    };
  }
}
