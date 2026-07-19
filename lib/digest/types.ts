import type { DigestContentPrefs } from "@/lib/digest/preferences";

export type DigestBrandId = "jade-gold" | "amuletta" | "eon";

export interface DigestBrandTheme {
  id: DigestBrandId;
  brandName: string;
  accent: string;
  ink: string;
  muted: string;
  paper: string;
  surface: string;
  danger: string;
  warn: string;
  ok: string;
  wordmark: string;
}

export interface DigestKpi {
  label: string;
  value: string;
  deltaLabel?: string | null;
  tone?: "up" | "down" | "flat" | "neutral";
}

export interface DigestActionItem {
  severity: "kritik" | "onemli" | "bilgi";
  title: string;
  hint: string;
  href: string;
  actionLabel: string;
}

export interface DigestActivityItem {
  whenLabel: string;
  summary: string;
  source?: string | null;
  /** Kim yaptı — insan aktivitesinde dolu. */
  actor?: string | null;
}

export interface DigestSuggestion {
  title: string;
  body: string;
  href: string;
}

export interface DigestDayPoint {
  label: string;
  revenueLabel: string;
  orders: number;
}

export interface DigestPriceTip {
  title: string;
  position: "pahali" | "ucuz";
  body: string;
  href: string;
}

export interface DigestEngagementMover {
  title: string;
  deltaViews: number;
  deltaFavorers: number;
  score: number;
}

export interface DigestEngagement {
  shopScore: number;
  shopLabel: string;
  windowLabel: string;
  movers: DigestEngagementMover[];
}

export interface DigestPresenceRow {
  name: string;
  minutesLabel: string;
  events: number;
}

export interface OrgDigest {
  orgId: string;
  orgName: string;
  orgSlug: string | null;
  currency: string;
  theme: DigestBrandTheme;
  /** Örn. 18 Temmuz 2026 · son 24 saat (NY) */
  windowLabel: string;
  generatedAtLabel: string;
  /** İçerik tercihleri — render hangi blokları basacağını buradan okur. */
  prefs: DigestContentPrefs;
  kpis: DigestKpi[];
  /** Reklam (son 30 metrik anlığı) */
  adsKpis: DigestKpi[];
  weekTrend: DigestDayPoint[];
  actions: DigestActionItem[];
  /** Son 24s kapanan uyarılar (Çözüldü görevleri + reklam aksiyonları). */
  closedAlerts: DigestActivityItem[];
  priceTips: DigestPriceTip[];
  engagement: DigestEngagement | null;
  teamPresence: DigestPresenceRow[];
  happened: DigestActivityItem[];
  finished: DigestActivityItem[];
  suggestions: DigestSuggestion[];
  panelUrl: string;
  alertsHref: string;
  adsHref: string;
  settingsHref: string;
}
