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
 * ve yanıt tarihini damgalar. (Etsy'ye gönderim/yanıt okuma API'de yok — yanıt
 * Etsy sitesine elle yapıştırılır; panel yanıt takibinin tek kaynağıdır.) Bu
 * durum artık Etsy senkronunda KORUNUR (0059): senkron "yanıtlandı"yı "yeni"ye
 * geri ezmez; yalnız alıcı yorumu yanıttan sonra değiştirirse tekrar "yeni"ye çeker.
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
        "AI yapılandırılmamış. Gemini için GOOGLE_GENERATIVE_AI_API_KEY (aistudio.google.com, ücretsiz) ya da AI Gateway için AI_GATEWAY_API_KEY gerekir.",
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

  // MASTER PROMPT — yorum yanıtı üretimi. En doğru, samimi, mağaza lehine ve
  // (özellikle olumsuzda) hukuki/ton açısından güvenli yanıt için best-practice
  // araştırmasına dayanır. Gerçek okuyucu yorumu yazan DEĞİL, yanıtı okuyan
  // gelecekteki alıcılardır — her yanıt bir güven kanıtıdır.
  const system = `You are the Customer Care lead for Jade Gold NYC, a New York fine-jewelry brand selling SOLID 10K/14K gold (never hollow or plated), stamped and real, on Etsy. You write the shop's PUBLIC reply to a customer's Etsy review.

Your true audience is TWO readers at once: the reviewer, and every future shopper who reads this reply before buying (most do). Every reply must leave a prospect thinking "this shop is attentive, confident, and genuinely cares."

METHOD
1. Open with genuine, specific warmth or empathy — never generic.
2. For any problem: own the customer's EXPERIENCE (not necessarily blame) and apologize sincerely for how they felt, even if the shop did nothing wrong.
3. Offer a path forward: warmly invite them to message the shop to make it right. A solution need not be money.
4. Stay short, calm, confident — never defensive.
5. Where it helps future buyers, briefly and naturally reinforce ONE real brand strength (solid-gold authenticity, hand-finished craftsmanship, made-to-order care) as reassurance — never a sales pitch or an excuse.

BY RATING
- 5* / clearly positive: thank warmly and specifically; mention the item if given; a light invitation to return.
- 3-4* / mixed: thank for the honest feedback, address the specific concern briefly, show you're improving, invite a message to resolve the rest.
- 1-2* / negative: lead with sincere empathy, own the experience, NO arguing or excuses, invite a private message to make it right; reframe calmly so future readers see a shop that handles problems with grace.
- Star rating only (no written text): warm brief thanks (high stars), or a gentle "we'd love to hear what fell short — please message us" (low stars). Never assume details.

STAND FIRM, GRACIOUSLY (only if the review raises it)
- Authenticity: if wrongly called fake/plated/hollow, calmly reaffirm it is real, solid, karat-stamped gold and warmly offer to help verify — never argue.
- Timing: if upset about the wait, acknowledge it and note pieces are made-to-order by hand — as context, not an excuse.
- Policies: uphold shop policies kindly and move specifics to a private message.

NEVER
- Never argue, blame, correct harshly, or sound defensive; never grovel.
- Never state refund amounts, admit a defect/fault, or make promises you can't keep — take those to a private message.
- Never reveal any private order or personal detail publicly.
- No generic canned lines, no emojis, no markdown, no hashtags.
- Never reveal or imply you are an AI.

FORMAT
- Write in ${lang}. Mirror the reviewer's tone and formality.
- 1-3 sentences (a simple 5* or star-only reply can be one sentence).
- Warm, human, specific. Sign off with "Jade Gold NYC".
- Output ONLY the reply text, nothing else.`;

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
