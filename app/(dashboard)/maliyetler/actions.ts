"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { costFormSchema, type CostFormValues } from "@/lib/validations/cost";
import { parseMoneyToCents } from "@/lib/money";

export interface CostActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function toRow(v: CostFormValues) {
  return {
    category_id: v.category_id,
    description: v.description,
    amount_cents: parseMoneyToCents(v.amount),
    currency: (v.currency || "USD").toUpperCase(),
    cost_date: v.cost_date,
    vendor: v.vendor || null,
    notes: v.notes || null,
  };
}

export async function createCost(
  values: CostFormValues,
): Promise<CostActionResult> {
  const parsed = costFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("costs")
    .insert({
      ...toRow(parsed.data),
      org_id: m.org_id,
      source: "manual",
      created_by: m.user_id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/maliyetler");
  revalidatePath("/panel");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateCost(
  id: string,
  values: CostFormValues,
): Promise<CostActionResult> {
  const parsed = costFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("costs")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/maliyetler");
  revalidatePath("/panel");
  return { ok: true, id };
}

export async function deleteCost(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("costs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/maliyetler");
  revalidatePath("/panel");
  return {};
}
