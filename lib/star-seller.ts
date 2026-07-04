/**
 * Etsy Yıldız Satıcı (Star Seller) metrik tanımları ve durum hesaplama.
 * Eşikler Etsy'nin resmi hizmet standardı + Star Seller hedeflerinden gelir.
 * Saf (pure) — hem sunucu hem istemcide kullanılabilir.
 */

export type MetricStatus = "target" | "standard" | "risk";

export const METRIC_STATUS_LABEL: Record<MetricStatus, string> = {
  target: "Star Seller",
  standard: "Standart",
  risk: "Risk",
};

/** Bir metriğin dönemsel değerlerinden durum üretir. */
export interface StarSellerValues {
  messageResponseRate: number | null; // %
  onTimeShippingRate: number | null; // %
  avgReviewRating: number | null; // 0–5
  lowReviewCount: number | null; // puanı ≤3 yorum sayısı
  caseCount: number | null;
  orderCount: number | null;
}

function pctStatus(v: number | null): MetricStatus | null {
  if (v == null) return null;
  if (v >= 95) return "target";
  if (v >= 80) return "standard";
  return "risk";
}

function ratingStatus(
  avg: number | null,
  lowCount: number | null,
): MetricStatus | null {
  if (avg == null && lowCount == null) return null;
  if (avg != null && avg >= 4.8) return "target";
  if (lowCount != null ? lowCount <= 4 : (avg ?? 0) >= 4.0) return "standard";
  return "risk";
}

function caseStatus(count: number | null): MetricStatus | null {
  if (count == null) return null;
  if (count === 0) return "target";
  if (count <= 3) return "standard";
  return "risk";
}

export interface MetricView {
  key: "message" | "shipping" | "rating" | "case";
  title: string;
  value: string; // görüntülenecek değer
  status: MetricStatus | null;
  standard: string; // hizmet standardı
  target: string; // Star Seller hedefi
  auto?: boolean; // panelden otomatik hesaplanıyor mu
}

/** 4 metriği görüntü modeline çevirir. */
export function metricViews(v: StarSellerValues): MetricView[] {
  const pct = (n: number | null) => (n == null ? "—" : `%${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`);
  return [
    {
      key: "message",
      title: "Mesaj yanıt hızı",
      value: pct(v.messageResponseRate),
      status: pctStatus(v.messageResponseRate),
      standard: "İlk mesajların %80'ine 24–48 saatte yanıt",
      target: "İlk mesajların %95'ine 24 saatte yanıt",
    },
    {
      key: "shipping",
      title: "Zamanında kargo & takip",
      value: pct(v.onTimeShippingRate),
      status: pctStatus(v.onTimeShippingRate),
      standard: "Siparişlerin en az %80'i zamanında",
      target: "Siparişlerin %95'i takipli ve zamanında",
    },
    {
      key: "rating",
      title: "Ortalama yorum puanı",
      value:
        v.avgReviewRating == null
          ? "—"
          : v.avgReviewRating.toLocaleString("tr-TR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
      status: ratingStatus(v.avgReviewRating, v.lowReviewCount),
      standard: "En fazla 4 yorum ≤3 puan",
      target: "4.8 ve üzeri",
      auto: true,
    },
    {
      key: "case",
      title: "İtiraz oranı",
      value:
        v.caseCount == null
          ? "—"
          : `${v.caseCount} itiraz${v.orderCount != null ? ` / ${v.orderCount} sipariş` : ""}`,
      status: caseStatus(v.caseCount),
      standard: "En fazla 3 sipariş iade itirazı",
      target: "0 itiraz",
    },
  ];
}

/** Tüm metrikler hedefe ulaştıysa Star Seller uygun. */
export function overallStatus(views: MetricView[]): MetricStatus | "unknown" {
  const known = views.filter((m) => m.status != null);
  if (known.length === 0) return "unknown";
  if (known.some((m) => m.status === "risk")) return "risk";
  if (known.every((m) => m.status === "target")) return "target";
  return "standard";
}
