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
  const raw10k = ((formData.get("price_10k") as string | null) ?? "").trim();
  // 10K İSTEĞE BAĞLI: boş bırakılırsa anahtar silinir ve panel 10K'yı canlı
  // spot + 14K işçilik priminden türetir (getGoldSettings / calculateGoldCost).
  const price10k = raw10k === "" ? null : parseFloat(raw10k);

  if (!Number.isFinite(price14k) || price14k <= 0) {
    return { error: "14K alim fiyati gecerli bir sayi olmali." };
  }
  if (price10k !== null && (!Number.isFinite(price10k) || price10k <= 0)) {
    return {
      error:
        "10K alim fiyati bos (spottan turetilir) ya da gecerli bir sayi olmali.",
    };
  }

  // MERGE, ezme değil: gold_settings başka anahtarlar da taşır —
  // `labor_model` (EON: 'per_piece', Tamsan kalibrasyonu), `source` (Ophir:
  // üretici tablosu referansı), ileride `purchase_price_18k_cents`. Eski kod
  // nesneyi 14K+10K ile baştan yazıyordu; EON formu bir kez kaydedilse
  // parça-başı işçilik modeli sessizce silinecekti.
  const { data: cur } = await supabase
    .from("organizations")
    .select("gold_settings")
    .eq("id", m.org_id)
    .maybeSingle();
  const existing =
    ((cur as { gold_settings?: Record<string, unknown> } | null)
      ?.gold_settings ?? {}) as Record<string, unknown>;
  const gold_settings: Record<string, unknown> = {
    ...existing,
    purchase_price_14k_cents: Math.round(price14k * 100),
  };
  if (price10k === null) delete gold_settings.purchase_price_10k_cents;
  else gold_settings.purchase_price_10k_cents = Math.round(price10k * 100);

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
