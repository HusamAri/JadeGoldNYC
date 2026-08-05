import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Şirket bazlı özellik bayrakları (migration 0119).
 *
 * Amuletta üç mağazaya hizmet eder ve kapsam kuralları ŞİRKETE ÖZELDİR: bir
 * mağazanın kuralı yüzünden başka mağazanın kullandığı kod SİLİNMEZ — o mağaza
 * için bayrak kapatılır. `lib/platform.ts` bayrakları BAĞLI PLATFORMDAN türetir
 * (Etsy'de Star Seller var, Shopier'de yok); buradakiler ise mağazanın İŞ
 * KARARIDIR (EON fiyatı dışarıda belirliyor) ve platformdan bağımsızdır.
 */
export interface FeatureFlags {
  /**
   * Fiyat panelin DIŞINDA belirlenir (EON fiyat motoru xlsx). AÇIKKEN panel
   * fiyat hesaplamaz/önermez ve platforma fiyat YAZMAZ — gram tablosu ve
   * maliyet varsayımları yalnız salt-okunur içe aktarılır.
   */
  externalPricing: boolean;
  /** Panel içi anahtar kelime / rakip araştırma yüzeyleri. */
  keywordResearch: boolean;
  /** Alıcı takip / geri kazanım yüzeyleri. */
  buyerFollowup: boolean;
  /** Görsel üretim + foto prodüksiyon yüzeyleri. */
  photoStudio: boolean;
}

/**
 * Bayrak yazılmamışsa MEVCUT davranış korunur: fiyat kısıtı kapalı, diğer
 * modüller açık. Yeni org sessizce kısıtlanmaz; kısıtlama daima bilerek yazılır.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  externalPricing: false,
  keywordResearch: true,
  buyerFollowup: true,
  photoStudio: true,
};

/** `externalPricing` açıkken fiyat yazan her aksiyonun döndürdüğü tek mesaj. */
export const EXTERNAL_PRICING_ERROR =
  "Fiyat panel dışında belirleniyor (fiyat motoru). Panel fiyat hesaplayamaz ve mağazaya fiyat yazamaz.";

export const getFeatureFlags = cache(
  async (orgId: string): Promise<FeatureFlags> => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organizations")
      .select("feature_flags")
      .eq("id", orgId)
      .maybeSingle();
    if (error) {
      // Bayrak okunamadıysa kısıtlamaları UYGULA (fail-closed): yanlışlıkla
      // canlı fiyat yazmaktansa aksiyonu reddetmek tercih edilir.
      console.error("getFeatureFlags:", error.message);
      return { ...DEFAULT_FEATURE_FLAGS, externalPricing: true };
    }
    const raw = (data?.feature_flags ?? {}) as Partial<FeatureFlags>;
    return { ...DEFAULT_FEATURE_FLAGS, ...raw };
  },
);

/**
 * Fiyat yazan/hesaplayan sunucu aksiyonlarının kapısı. `externalPricing` açıksa
 * hata metni döner (aksiyon çağıranı bunu kullanıcıya gösterir), aksi halde null.
 */
export async function pricingWriteBlocked(
  orgId: string,
): Promise<string | null> {
  const flags = await getFeatureFlags(orgId);
  return flags.externalPricing ? EXTERNAL_PRICING_ERROR : null;
}
