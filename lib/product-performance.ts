import type { ProductMetric } from "@/lib/types";

export type ProductTone = "star" | "steady" | "zero" | "adwaste" | "none";

export interface ProductDerived {
  conversion: number | null;
  roas: number | null;
  status: { label: string; tone: ProductTone };
}

/**
 * Ürün başına dönüşüm/ROAS + durum işareti (rapor §07/§08):
 * - "Reklam israfı": reklam harcaması var, sipariş 0
 * - "Sıfır satış": çok görüntülenmiş (≥1000) ama sipariş 0
 * - "Yıldız": ciro ≥ $10.000
 * - "Satıyor": sipariş var
 */
export function deriveProduct(m: ProductMetric): ProductDerived {
  const orders = m.orders ?? 0;
  const conversion = m.views && m.views > 0 ? orders / m.views : null;
  const roas =
    m.ads_spend_cents && m.ads_spend_cents > 0
      ? (m.ads_revenue_cents ?? 0) / m.ads_spend_cents
      : null;

  let status: ProductDerived["status"];
  if (m.ads_spend_cents && m.ads_spend_cents > 0 && orders === 0) {
    status = { label: "Reklam israfı", tone: "adwaste" };
  } else if ((m.views ?? 0) >= 1000 && orders === 0) {
    status = { label: "Sıfır satış", tone: "zero" };
  } else if ((m.revenue_cents ?? 0) >= 1_000_000) {
    status = { label: "Yıldız", tone: "star" };
  } else if (orders > 0) {
    status = { label: "Satıyor", tone: "steady" };
  } else {
    status = { label: "—", tone: "none" };
  }

  return { conversion, roas, status };
}
