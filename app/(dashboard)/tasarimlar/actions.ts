"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";

/**
 * Ürünün ağırlığını (gram) kaydeder — altın maliyet motorunun güvenilir
 * girdisi. Boş/geçersiz değer ağırlığı temizler (regex yedeğine döner).
 */
export async function updateProductWeight(
  productId: string,
  grams: number | null,
): Promise<{ error?: string }> {
  await requireMembership();
  if (grams != null && (!Number.isFinite(grams) || grams <= 0)) {
    return { error: "Geçerli bir ağırlık girin." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ weight_grams: grams })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/tasarimlar");
  return {};
}
