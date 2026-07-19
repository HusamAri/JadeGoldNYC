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
  weekTrend: DigestDayPoint[];
  actions: DigestActionItem[];
  happened: DigestActivityItem[];
  finished: DigestActivityItem[];
  suggestions: DigestSuggestion[];
  panelUrl: string;
  alertsHref: string;
}
