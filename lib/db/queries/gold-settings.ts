import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { derivePurchaseCentsPerGram } from "@/lib/gold-cost";
import { getGoldPricePerOunce } from "@/lib/gold-price";

export interface GoldSettings {
  purchase_price_14k_cents: number;
  purchase_price_10k_cents: number;
  /**
   * true → org 10K alım fiyatı GİRMEDİ; değer canlı spot + 14K işçilik
   * priminden türetildi (derivePurchaseCentsPerGram). Ekran bunu söylemeli:
   * türetilmiş sayı, girilmiş sayı gibi gösterilirse kimse doğrulamaz.
   */
  derived_10k: boolean;
}

/** 14K için son çare varsayılanı (Jade'in eski tedarik fiyatı). */
const DEFAULT_14K_CENTS = 101_00;

export async function getGoldSettings(): Promise<GoldSettings> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("gold_settings")
    .eq("id", m.org_id)
    .maybeSingle();
  // Hata sessizce "varsayılan fiyat"a dönüşmesin — maliyet/marj hesabını
  // besler; en azından yüzeye çıkar (kardeş gold-cost.ts deseni).
  if (error) console.error("[ayarlar] gold_settings sorgusu:", error.message);

  const raw = (data as { gold_settings?: Partial<GoldSettings> } | null)
    ?.gold_settings;

  const purchase_price_14k_cents =
    raw?.purchase_price_14k_cents ?? DEFAULT_14K_CENTS;

  if (raw?.purchase_price_10k_cents) {
    return {
      purchase_price_14k_cents,
      purchase_price_10k_cents: raw.purchase_price_10k_cents,
      derived_10k: false,
    };
  }

  // 10K girilmemiş: eskiden buraya Jade'in $65 sabiti dolduruluyordu ve her
  // org (Ophir dahil) başka bir tedarikçinin sayısıyla maliyetleniyordu.
  // Doğrusu 18K ile aynı türetim — 14K'nın gözlenen işçilik primi + 10K melt.
  const spot = await getGoldPricePerOunce();
  return {
    purchase_price_14k_cents,
    purchase_price_10k_cents: derivePurchaseCentsPerGram(
      "10K",
      spot,
      purchase_price_14k_cents,
    ),
    derived_10k: true,
  };
}
