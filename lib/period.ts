import {
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
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
 * Bir önceki dönemi hesaplar (karşılaştırma için).
 * - today → dün
 * - 7d → önceki 7 gün
 * - 30d → önceki 30 gün
 * - month → geçen ay
 * - all → null (karşılaştırma yok)
 */
export function previousPeriod(
  current: ResolvedPeriod,
): ResolvedPeriod | null {
  const now = new Date();
  switch (current.key) {
    case "today": {
      const yesterday = subDays(now, 1);
      return {
        key: "today",
        fromIso: startOfDay(yesterday).toISOString(),
        toIso: endOfDay(yesterday).toISOString(),
        label: "Dün",
      };
    }
    case "7d": {
      return {
        key: "7d",
        fromIso: startOfDay(subDays(now, 13)).toISOString(),
        toIso: endOfDay(subDays(now, 7)).toISOString(),
        label: "Önceki 7 gün",
      };
    }
    case "30d": {
      return {
        key: "30d",
        fromIso: startOfDay(subDays(now, 59)).toISOString(),
        toIso: endOfDay(subDays(now, 30)).toISOString(),
        label: "Önceki 30 gün",
      };
    }
    case "month": {
      const prevMonth = subMonths(now, 1);
      return {
        key: "month",
        fromIso: startOfMonth(prevMonth).toISOString(),
        toIso: endOfMonth(prevMonth).toISOString(),
        label: "Geçen ay",
      };
    }
    case "all":
    default:
      return null;
  }
}
