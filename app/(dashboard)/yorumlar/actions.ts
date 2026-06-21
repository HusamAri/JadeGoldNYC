"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
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
