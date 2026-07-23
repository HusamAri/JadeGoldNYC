"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GoldSettingsResult {
  ok?: boolean;
  error?: string;
}

export async function saveGoldSettings(
  formData: FormData,
): Promise<GoldSettingsResult> {
  const m = await requireMembership();
  // Org geneli alım fiyatları TÜM maliyet/marj/breakeven/reprice hesabını
  // besler → yalnız owner/admin. Ayrıca organizations tablosunda UPDATE RLS
  // policy'si YOK (0012/0071: yalnız SELECT); user-scoped client 0 satır
  // günceller ve sessizce {ok:true} döndürürdü — admin client ile yaz (org
  // kilidi .eq("id", org_id) korunur).
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const supabase = createAdminClient();

  const price14k = parseFloat(formData.get("price_14k") as string);
  const price10k = parseFloat(formData.get("price_10k") as string);

  if (!Number.isFinite(price14k) || price14k <= 0) {
    return { error: "14K alim fiyati gecerli bir sayi olmali." };
  }
  if (!Number.isFinite(price10k) || price10k <= 0) {
    return { error: "10K alim fiyati gecerli bir sayi olmali." };
  }

  const gold_settings = {
    purchase_price_14k_cents: Math.round(price14k * 100),
    purchase_price_10k_cents: Math.round(price10k * 100),
  };

  const { error } = await supabase
    .from("organizations")
    .update({ gold_settings })
    .eq("id", m.org_id);

  if (error) return { error: error.message };

  revalidatePath("/ayarlar");
  revalidatePath("/ayarlar/altin");
  revalidatePath("/maliyetler/altin-maliyet");
  revalidatePath("/panel");
  return { ok: true };
}
