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

/** Mağaza saat dilimi — panel "bugün"ü bu takvimle hesaplar (panel/page.tsx). */
const STORE_TIME_ZONE = "America/New_York";

// en-CA yerel ayarı YYYY-MM-DD üretir; tek Intl örneği (format çağrısı ucuz).
const NY_DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: STORE_TIME_ZONE,
});

/**
 * Bir timestamptz ISO değerini mağaza saat diliminin (America/New_York)
 * gün anahtarına (YYYY-MM-DD) çevirir. Gün-bazlı gruplamalar bunu kullanır ki
 * "bugün" panelin NY takvimiyle aynı güne düşsün — `iso.slice(0, 10)` UTC
 * gününü verir ve NY akşam satışlarını ertesi güne kaydırırdı.
 * Tarih-only değer (YYYY-MM-DD) zaten takvim günüdür; dokunulmadan döner
 * (UTC-geceyarısı yorumuyla bir gün geriye kaymasın).
 */
export function dayKeyNY(iso: string): string {
  if (iso.length <= 10) return iso;
  return NY_DAY_FORMAT.format(new Date(iso));
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
      // Bitişik önceki dönem = geçen ay (MoM). Geçen yılın aynı ayı artık
      // ayrı pencere olarak samePeriodLastYear'dan gelir (YoY).
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

/**
 * Geçen yılın AYNI dönemi (aynı tarih aralığı - 1 yıl) — YoY karşılaştırması.
 * 'all' için null (tüm zamanların geçen-yıl karşılığı yok).
 */
export function samePeriodLastYear(
  current: ResolvedPeriod,
): ResolvedPeriod | null {
  if (current.key === "all" || !current.fromIso) return null;
  return {
    key: current.key,
    fromIso: subYears(new Date(current.fromIso), 1).toISOString(),
    toIso: subYears(new Date(current.toIso), 1).toISOString(),
    label: "Geçen yıl aynı dönem",
  };
}

export interface ComparisonWindows {
  /** Önceki bitişik dönem (MoM / geçen ay mantığı). 'all' için null. */
  prev: ResolvedPeriod | null;
  /** Geçen yılın aynı dönemi (YoY). 'all' için null. */
  lastYear: ResolvedPeriod | null;
}

/** Bir dönemin İKİ karşılaştırma penceresini birlikte üretir (MoM + YoY). */
export function comparisonWindows(current: ResolvedPeriod): ComparisonWindows {
  return {
    prev: previousPeriod(current),
    lastYear: samePeriodLastYear(current),
  };
}
