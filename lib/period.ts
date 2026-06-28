import {
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  subYears,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export type PeriodKey = "today" | "7d" | "30d" | "month" | "all";

export interface ResolvedPeriod {
  key: PeriodKey;
  fromIso: string | null;
  toIso: string;
  label: string;
}

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Bugün" },
  { value: "7d", label: "Son 7 gün" },
  { value: "30d", label: "Son 30 gün" },
  { value: "month", label: "Bu ay" },
  { value: "all", label: "Tüm zamanlar" },
];

/** URL'deki `period` parametresini tarih aralığına çevirir. */
export function resolvePeriod(period?: string): ResolvedPeriod {
  const now = new Date();
  const toIso = endOfDay(now).toISOString();
  switch (period) {
    case "today":
      return {
        key: "today",
        fromIso: startOfDay(now).toISOString(),
        toIso,
        label: "Bugün",
      };
    case "7d":
      return {
        key: "7d",
        fromIso: startOfDay(subDays(now, 6)).toISOString(),
        toIso,
        label: "Son 7 gün",
      };
    case "month":
      return {
        key: "month",
        fromIso: startOfMonth(now).toISOString(),
        toIso,
        label: "Bu ay",
      };
    case "all":
      return { key: "all", fromIso: null, toIso, label: "Tüm zamanlar" };
    case "30d":
    default:
      return {
        key: "30d",
        fromIso: startOfDay(subDays(now, 29)).toISOString(),
        toIso,
        label: "Son 30 gün",
      };
  }
}

/**
 * Karsilastirma donemi hesaplar.
 * Gunluk/haftalik analizlerde → onceki ay (ayni gunler)
 * Aylik analizlerde → gecen sene (ayni ay)
 */
export function previousPeriod(
  current: ResolvedPeriod,
): ResolvedPeriod | null {
  const now = new Date();
  switch (current.key) {
    case "today": {
      const sameDay = subMonths(now, 1);
      return {
        key: "today",
        fromIso: startOfDay(sameDay).toISOString(),
        toIso: endOfDay(sameDay).toISOString(),
        label: "Gecen ay ayni gun",
      };
    }
    case "7d": {
      const from = subMonths(subDays(now, 6), 1);
      const to = subMonths(now, 1);
      return {
        key: "7d",
        fromIso: startOfDay(from).toISOString(),
        toIso: endOfDay(to).toISOString(),
        label: "Gecen ay ayni hafta",
      };
    }
    case "30d": {
      const prevMonth = subMonths(now, 1);
      return {
        key: "30d",
        fromIso: startOfMonth(prevMonth).toISOString(),
        toIso: endOfMonth(prevMonth).toISOString(),
        label: "Gecen ay",
      };
    }
    case "month": {
      const sameMonthLastYear = subYears(now, 1);
      return {
        key: "month",
        fromIso: startOfMonth(sameMonthLastYear).toISOString(),
        toIso: endOfMonth(sameMonthLastYear).toISOString(),
        label: "Gecen sene ayni ay",
      };
    }
    case "all":
    default:
      return null;
  }
}
