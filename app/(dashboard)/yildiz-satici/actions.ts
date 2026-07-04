"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import {
  starSellerFormSchema,
  type StarSellerFormValues,
} from "@/lib/validations/star-seller";

export interface StarSellerActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function num(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toRow(v: StarSellerFormValues) {
  return {
    period_label: v.period_label.trim(),
    period_start: v.period_start.trim() || null,
    period_end: v.period_end.trim() || null,
    next_chance_on: v.next_chance_on.trim() || null,
    message_response_rate: num(v.message_response_rate),
    on_time_shipping_rate: num(v.on_time_shipping_rate),
    avg_review_rating: num(v.avg_review_rating),
    low_review_count: num(v.low_review_count),
    case_count: num(v.case_count),
    order_count: num(v.order_count),
    note: v.note.trim() || null,
  };
}

export async function upsertStarSellerSnapshot(
  values: StarSellerFormValues,
  id?: string,
): Promise<StarSellerActionResult> {
  const parsed = starSellerFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const row = toRow(parsed.data);

  if (id) {
    const { error } = await supabase
      .from("star_seller_snapshots")
      .update(row)
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/yildiz-satici");
    return { ok: true, id };
  }

  const { data, error } = await supabase
    .from("star_seller_snapshots")
    .insert({ ...row, org_id: m.org_id })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return { error: "Bu dönem etiketi zaten var — mevcut kaydı düzenleyin." };
    }
    return { error: error.message };
  }
  revalidatePath("/yildiz-satici");
  return { ok: true, id: (data as { id: string }).id };
}

export async function deleteStarSellerSnapshot(
  id: string,
): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("star_seller_snapshots")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/yildiz-satici");
  return {};
}
