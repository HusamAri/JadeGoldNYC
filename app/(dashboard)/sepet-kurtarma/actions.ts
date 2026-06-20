"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import {
  cartRecoveryFormSchema,
  type CartRecoveryFormValues,
} from "@/lib/validations/cart-recovery";
import { parseMoneyToCents } from "@/lib/money";

export interface CartActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function moneyOrNull(s: string): number | null {
  return s.trim() ? parseMoneyToCents(s) : null;
}

function toRow(v: CartRecoveryFormValues) {
  return {
    buyer_name: v.buyer_name || null,
    buyer_email: v.buyer_email || null,
    cart_value_cents: moneyOrNull(v.cart_value),
    item_summary: v.item_summary || null,
    abandoned_at: v.abandoned_at.trim() ? v.abandoned_at : null,
    status: v.status,
    action_taken: v.action_taken || null,
    incentive: v.incentive || null,
    recovered_value_cents: moneyOrNull(v.recovered_value),
    notes: v.notes || null,
  };
}

export async function createCartRecovery(
  values: CartRecoveryFormValues,
): Promise<CartActionResult> {
  const parsed = cartRecoveryFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_recoveries")
    .insert({ ...toRow(parsed.data), org_id: m.org_id, created_by: m.user_id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/sepet-kurtarma");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateCartRecovery(
  id: string,
  values: CartRecoveryFormValues,
): Promise<CartActionResult> {
  const parsed = cartRecoveryFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cart_recoveries")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sepet-kurtarma");
  return { ok: true, id };
}

export async function deleteCartRecovery(
  id: string,
): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("cart_recoveries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sepet-kurtarma");
  return {};
}
