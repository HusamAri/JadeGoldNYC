import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber } from "@/lib/format";
import type { ShopMetric } from "@/lib/types";

/** Etsy sektör eşikleri (rapor + Etsy Seller Handbook). */
export const THRESHOLDS = {
  conversionTarget: 0.015, // sağlıklı eşik %1.5
  conversionFloor: 0.01, // platform alt sınırı %1
  ratingTarget: 4.5,
  ratingFloor: 4.0,
  roasTarget: 3,
  cartRatioWarn: 0.5,
  cartRatioDanger: 1.0,
  platformAovCents: 4800, // Etsy ort. sepet ~$48
};

export interface Derived {
  conversion: number | null;
  aovCents: number | null;
  roas: number | null;
  cartRatio: number | null;
}

export function derive(m: ShopMetric | null): Derived {
  if (!m) return { conversion: null, aovCents: null, roas: null, cartRatio: null };
  const conversion = m.visits && m.visits > 0 ? (m.orders ?? 0) / m.visits : null;
  const aovCents =
    m.orders && m.orders > 0 ? Math.round((m.revenue_cents ?? 0) / m.orders) : null;
  const roas =
    m.ads_spend_cents && m.ads_spend_cents > 0
      ? (m.ads_revenue_cents ?? 0) / m.ads_spend_cents
      : null;
  const cartRatio =
    m.revenue_cents && m.revenue_cents > 0
      ? (m.cart_abandon_amount_cents ?? 0) / m.revenue_cents
      : null;
  return { conversion, aovCents, roas, cartRatio };
}

export type Verdict = "pass" | "risk" | "fail";

export interface FrameworkRow {
  criter: string;
  value: string;
  threshold: string;
  verdict: Verdict;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: "GEÇTİ",
  risk: "RİSK",
  fail: "KALDI",
};

export function verdictLabel(v: Verdict): string {
  return VERDICT_LABEL[v];
}

/** Yatırım karar çerçevesi (rapor §12). */
export function evaluateFramework(
  current: ShopMetric,
  previous: ShopMetric | null,
  currency = "USD",
): FrameworkRow[] {
  const t = THRESHOLDS;
  const c = derive(current);
  const rows: FrameworkRow[] = [];

  // Dönüşüm oranı
  if (c.conversion != null) {
    rows.push({
      criter: "Dönüşüm oranı",
      value: formatPercent(c.conversion, 2),
      threshold: formatPercent(t.conversionTarget),
      verdict:
        c.conversion >= t.conversionTarget
          ? "pass"
          : c.conversion >= t.conversionFloor
            ? "risk"
            : "fail",
    });
  }

  // Ciro trendi
  if (previous && previous.revenue_cents != null && current.revenue_cents != null) {
    const up = current.revenue_cents >= previous.revenue_cents;
    rows.push({
      criter: "Ciro trendi",
      value: `${formatMoney(previous.revenue_cents, currency)} → ${formatMoney(current.revenue_cents, currency)}`,
      threshold: "Yatay/artan",
      verdict: up ? "pass" : "fail",
    });
  }

  // Trafik trendi
  if (previous && previous.visits != null && current.visits != null) {
    rows.push({
      criter: "Trafik trendi",
      value: `${formatNumber(previous.visits)} → ${formatNumber(current.visits)}`,
      threshold: "Yatay/artan",
      verdict: current.visits >= previous.visits ? "pass" : "fail",
    });
  }

  // Etsy Ads ROAS
  if (c.roas != null) {
    rows.push({
      criter: "Etsy Ads ROAS",
      value: `${c.roas.toFixed(1)}x`,
      threshold: `${t.roasTarget}x`,
      verdict: c.roas >= t.roasTarget ? "pass" : "fail",
    });
  }

  // Sepette terk
  if (c.cartRatio != null) {
    rows.push({
      criter: "Sepette terk / ciro",
      value: `${c.cartRatio.toFixed(1)}x ciro`,
      threshold: "< ciro",
      verdict:
        c.cartRatio < t.cartRatioWarn
          ? "pass"
          : c.cartRatio < t.cartRatioDanger
            ? "risk"
            : "fail",
    });
  }

  // Puan
  if (current.rating != null) {
    rows.push({
      criter: "Puan",
      value: `${current.rating.toFixed(1)} / 5`,
      threshold: `≥ ${t.ratingTarget}`,
      verdict:
        current.rating >= t.ratingTarget
          ? "pass"
          : current.rating >= t.ratingFloor
            ? "risk"
            : "fail",
    });
  }

  return rows;
}

export type AlertLevel = "danger" | "warning" | "info";
export interface PerfAlert {
  level: AlertLevel;
  title: string;
  detail: string;
}

const SEVERITY: Record<AlertLevel, number> = { danger: 0, warning: 1, info: 2 };

/** Dönüşüm hunisi temelli otomatik uyarılar. */
export function evaluatePerformanceAlerts(
  current: ShopMetric,
  previous: ShopMetric | null,
  currency = "USD",
): PerfAlert[] {
  const t = THRESHOLDS;
  const c = derive(current);
  const alerts: PerfAlert[] = [];

  if (c.conversion != null) {
    if (c.conversion < t.conversionFloor) {
      alerts.push({
        level: "danger",
        title: "Dönüşüm kritik seviyede",
        detail: `Dönüşüm ${formatPercent(c.conversion, 2)} — platform alt sınırı ${formatPercent(t.conversionFloor)} altında. ${formatNumber(current.visits ?? 0)} ziyaret yalnız ${formatNumber(current.orders ?? 0)} siparişe döndü.`,
      });
    } else if (c.conversion < t.conversionTarget) {
      alerts.push({
        level: "warning",
        title: "Dönüşüm eşik altında",
        detail: `Dönüşüm ${formatPercent(c.conversion, 2)} — sağlıklı eşik ${formatPercent(t.conversionTarget)} altında.`,
      });
    }
  }

  if (c.cartRatio != null && c.cartRatio >= t.cartRatioDanger) {
    alerts.push({
      level: "danger",
      title: "Sepette terk ciroyu aşıyor",
      detail: `Terk edilen sepet tutarı ${formatMoney(current.cart_abandon_amount_cents ?? 0, currency)} — cironun ${c.cartRatio.toFixed(1)} katı. Ödeme hunisinde ciddi sızıntı var.`,
    });
  }

  if (previous) {
    if (
      previous.revenue_cents != null &&
      current.revenue_cents != null &&
      previous.revenue_cents > 0
    ) {
      const d = (current.revenue_cents - previous.revenue_cents) / previous.revenue_cents;
      if (d <= -0.15) {
        alerts.push({
          level: "warning",
          title: "Ciro düşüşü",
          detail: `Ciro önceki döneme göre ${formatPercent(d)}: ${formatMoney(previous.revenue_cents, currency)} → ${formatMoney(current.revenue_cents, currency)}.`,
        });
      }
    }
    if (
      previous.visits != null &&
      current.visits != null &&
      previous.visits > 0
    ) {
      const d = (current.visits - previous.visits) / previous.visits;
      if (d <= -0.15) {
        alerts.push({
          level: "warning",
          title: "Trafik düşüşü",
          detail: `Ziyaret ${formatPercent(d)}: ${formatNumber(previous.visits)} → ${formatNumber(current.visits)}.`,
        });
      }
    }
  }

  if (current.rating != null) {
    if (current.rating < t.ratingFloor) {
      alerts.push({
        level: "danger",
        title: "Puan kritik",
        detail: `Mağaza puanı ${current.rating.toFixed(1)} — ${t.ratingFloor} altında.`,
      });
    } else if (current.rating < t.ratingTarget) {
      alerts.push({
        level: "warning",
        title: "Puan eşik altında",
        detail: `Mağaza puanı ${current.rating.toFixed(1)} — hedef ${t.ratingTarget} altında.`,
      });
    }
  }

  if (c.roas != null && c.roas < t.roasTarget) {
    alerts.push({
      level: "warning",
      title: "Reklam ROAS düşük",
      detail: `Etsy Ads ROAS ${c.roas.toFixed(1)}x — hedef ${t.roasTarget}x altında.`,
    });
  }

  return alerts.sort((a, b) => SEVERITY[a.level] - SEVERITY[b.level]);
}
