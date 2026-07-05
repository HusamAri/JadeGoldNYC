"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface SaveWeightResult {
  ok?: boolean;
  error?: string;
}

/** Bir varyantın ağırlığını elle kaydeder (weight_source='manual'). */
export async function saveVariantWeight(
  sku: string,
  grams: number,
): Promise<SaveWeightResult> {
  const m = await requireMembership();
  if (!sku) return { error: "SKU gerekli." };
  if (!Number.isFinite(grams) || grams <= 0 || grams > 500)
    return { error: "0–500 arası geçerli bir gram girin." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_variants")
    .update({
      weight_grams: grams,
      weight_source: "manual",
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", m.org_id)
    .eq("sku", sku);
  if (error) return { error: error.message };

  revalidatePath("/tasarimlar/eksik-agirlik");
  revalidatePath("/panel");
  return { ok: true };
}
