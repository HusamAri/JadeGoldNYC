import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_EON_PRICING_CONFIG,
  EON_SPOT_USD_PER_OZT,
  type EonPricingConfig,
} from "@/lib/pricing-engine/eon-cost";

/**
 * FİYAT AYARLARI (Faz 5a) — motorun girdileri, org başına tek satır.
 *
 * `spot` arayüzdeki TEK düzenlenebilir fiyat girdisidir. Geri kalanı AYAR'dır:
 * yalnız onaylı ayar ekranından değişir ve değişiklik audit_log'a yazılır.
 * Hiçbir yerde elle fiyat yazılmaz — her fiyat bu girdilerden türetilir.
 *
 * Satır yoksa v4 sabitleri kullanılır (üç altın değeri ve canlı siparişi
 * birebir üreten set). Böylece yeni org sessizce farklı bir fiyat üretmez.
 */

export interface PricingConfigRow extends EonPricingConfig {
  spotUsdPerOzt: number;
  updatedAt: string | null;
  updatedBy: string | null;
  /** DB'de satır var mı — yoksa varsayılanlar gösteriliyor demektir. */
  stored: boolean;
}

interface DbRow {
  spot_usd_per_ozt: string | number;
  fire_factor: string | number;
  labor_usd: string | number;
  labor_handfinished_usd: string | number;
  packaging_usd: string | number;
  shipping_usd: string | number;
  multiplier_narrow: string | number;
  multiplier_wide: string | number;
  wide_band_min_mm: string | number;
  sale_rate: string | number;
  updated_at: string | null;
  updated_by: string | null;
}

const num = (v: string | number): number =>
  typeof v === "number" ? v : Number(v);

export const DEFAULT_PRICING_CONFIG_ROW: PricingConfigRow = {
  ...DEFAULT_EON_PRICING_CONFIG,
  spotUsdPerOzt: EON_SPOT_USD_PER_OZT,
  updatedAt: null,
  updatedBy: null,
  stored: false,
};

export async function getPricingConfig(
  orgId: string,
): Promise<PricingConfigRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pricing_config")
    .select(
      "spot_usd_per_ozt, fire_factor, labor_usd, labor_handfinished_usd, packaging_usd, shipping_usd, multiplier_narrow, multiplier_wide, wide_band_min_mm, sale_rate, updated_at, updated_by",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) {
    // Ayar okunamadıysa SESSİZCE varsayılana düşmek tehlikeli olurdu (yanlış
    // fiyat üretir) — yüzeye çıkar, sonra bilinen-iyi sete düş.
    console.error("getPricingConfig:", error.message);
    return DEFAULT_PRICING_CONFIG_ROW;
  }
  const r = data as DbRow | null;
  if (!r) return DEFAULT_PRICING_CONFIG_ROW;
  return {
    spotUsdPerOzt: num(r.spot_usd_per_ozt),
    fireFactor: num(r.fire_factor),
    laborUsd: num(r.labor_usd),
    laborHandfinishedUsd: num(r.labor_handfinished_usd),
    packagingUsd: num(r.packaging_usd),
    shippingUsd: num(r.shipping_usd),
    multiplierNarrow: num(r.multiplier_narrow),
    multiplierWide: num(r.multiplier_wide),
    wideBandMinMm: num(r.wide_band_min_mm),
    saleRate: num(r.sale_rate),
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
    stored: true,
  };
}

/** Motor için sade ayar nesnesi (spot ve meta alanları olmadan). */
export function toEngineConfig(row: PricingConfigRow): EonPricingConfig {
  return {
    fireFactor: row.fireFactor,
    laborUsd: row.laborUsd,
    laborHandfinishedUsd: row.laborHandfinishedUsd,
    packagingUsd: row.packagingUsd,
    shippingUsd: row.shippingUsd,
    multiplierNarrow: row.multiplierNarrow,
    multiplierWide: row.multiplierWide,
    wideBandMinMm: row.wideBandMinMm,
    saleRate: row.saleRate,
  };
}
