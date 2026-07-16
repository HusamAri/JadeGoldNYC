import {
  addDays,
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

// ── NY gün sınırları (pencere ↔ gün-anahtarı hizası) ────────────────────────
// Denetim bulgusu: gün-anahtarı NY'ye geçince pencereler UTC gün sınırında
// kalırsa kenar kayar — "Bugün" penceresi NY-dünün akşamını içerir, NY-bugünün
// akşamını kaçırır ve KPI ile trend farklı takvim çerçevesi anlatır. Bu yüzden
// resolvePeriod/previousPeriod pencereleri de NY gün sınırlarında kurulur:
// takvim aritmetiği GÜN ANAHTARI (YYYY-MM-DD) üzerinde yapılır, ISO an'a
// dönüş nyDayStartUtc/nyDayEndUtc ile olur.

/** Verilen andaki NY UTC-ofsetini "-04:00" biçiminde döndürür. */
function nyOffsetString(at: Date): string {
  const part =
    new Intl.DateTimeFormat("en-US", {
      timeZone: STORE_TIME_ZONE,
      timeZoneName: "shortOffset",
    })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const m = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return "-05:00";
  return `${m[1]}${m[2].padStart(2, "0")}:${m[3] ?? "00"}`;
}

/** Gün anahtarını UTC-öğlen çapalı Date'e çevirir (takvim aritmetiği için). */
function keyToNoonUtc(dayKey: string): Date {
  return new Date(`${dayKey}T12:00:00Z`);
}

/** NY takviminde `dayKey` gününün 00:00 anı (UTC Date). DST geçiş gecesinde
 *  ofset gece yarısında öğlenden farklı olabilir — üretilen anın ofseti bir
 *  kez yeniden doğrulanır (ikinci tur daima sabitlenir). */
export function nyDayStartUtc(dayKey: string): Date {
  const offset = nyOffsetString(keyToNoonUtc(dayKey));
  const candidate = new Date(`${dayKey}T00:00:00${offset}`);
  const check = nyOffsetString(candidate);
  return check === offset
    ? candidate
    : new Date(`${dayKey}T00:00:00${check}`);
}

/** NY gününün son anı (ertesi NY gününün başlangıcı − 1ms; lte ile uyumlu). */
export function nyDayEndUtc(dayKey: string): Date {
  const nextKey = addDays(keyToNoonUtc(dayKey), 1).toISOString().slice(0, 10);
  return new Date(nyDayStartUtc(nextKey).getTime() - 1);
}

/** Gün anahtarında takvim aritmetiği (UTC-öğlen çapası DST'den etkilenmez). */
function shiftKey(dayKey: string, fn: (d: Date) => Date): string {
  return fn(keyToNoonUtc(dayKey)).toISOString().slice(0, 10);
}

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Bugün" },
  { value: "7d", label: "Son 7 gün" },
  { value: "30d", label: "Son 30 gün" },
  { value: "month", label: "Bu ay" },
  { value: "all", label: "Tüm zamanlar" },
];

/** URL'deki `period` parametresini tarih aralığına çevirir.
 *  Pencereler NY gün sınırlarına çapalıdır (dayKeyNY gruplamasıyla aynı
 *  takvim çerçevesi — kenar günü kayması olmaz). */
export function resolvePeriod(period?: string): ResolvedPeriod {
  const todayKey = dayKeyNY(new Date().toISOString());
  const toIso = nyDayEndUtc(todayKey).toISOString();
  switch (period) {
    case "today":
      return {
        key: "today",
        fromIso: nyDayStartUtc(todayKey).toISOString(),
        toIso,
        label: "Bugün",
      };
    case "7d":
      return {
        key: "7d",
        fromIso: nyDayStartUtc(shiftKey(todayKey, (d) => subDays(d, 6))).toISOString(),
        toIso,
        label: "Son 7 gün",
      };
    case "month":
      return {
        key: "month",
        fromIso: nyDayStartUtc(`${todayKey.slice(0, 7)}-01`).toISOString(),
        toIso,
        label: "Bu ay",
      };
    case "all":
      return { key: "all", fromIso: null, toIso, label: "Tüm zamanlar" };
    case "30d":
    default:
      return {
        key: "30d",
        fromIso: nyDayStartUtc(shiftKey(todayKey, (d) => subDays(d, 29))).toISOString(),
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
  const todayKey = dayKeyNY(new Date().toISOString());
  // Geçen ayın NY-takvim penceresi (ay başı..ay sonu gün anahtarları).
  const prevMonthDays = () => {
    const start = shiftKey(todayKey, (d) => startOfMonth(subMonths(d, 1)));
    const end = shiftKey(todayKey, (d) => endOfMonth(subMonths(d, 1)));
    return { start, end };
  };
  switch (current.key) {
    case "today": {
      const sameDay = shiftKey(todayKey, (d) => subMonths(d, 1));
      return {
        key: "today",
        fromIso: nyDayStartUtc(sameDay).toISOString(),
        toIso: nyDayEndUtc(sameDay).toISOString(),
        label: "Gecen ay ayni gun",
      };
    }
    case "7d": {
      const from = shiftKey(todayKey, (d) => subMonths(subDays(d, 6), 1));
      const to = shiftKey(todayKey, (d) => subMonths(d, 1));
      return {
        key: "7d",
        fromIso: nyDayStartUtc(from).toISOString(),
        toIso: nyDayEndUtc(to).toISOString(),
        label: "Gecen ay ayni hafta",
      };
    }
    case "30d": {
      const { start, end } = prevMonthDays();
      return {
        key: "30d",
        fromIso: nyDayStartUtc(start).toISOString(),
        toIso: nyDayEndUtc(end).toISOString(),
        label: "Gecen ay",
      };
    }
    case "month": {
      // Bitişik önceki dönem = geçen ay (MoM). Geçen yılın aynı ayı artık
      // ayrı pencere olarak samePeriodLastYear'dan gelir (YoY).
      const { start, end } = prevMonthDays();
      return {
        key: "month",
        fromIso: nyDayStartUtc(start).toISOString(),
        toIso: nyDayEndUtc(end).toISOString(),
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
  // Gün-anahtarı düzleminde -1 yıl: NY takvim günleri korunur (saat kayması
  // ve DST farkı pencereye sızmaz).
  const fromKey = shiftKey(dayKeyNY(current.fromIso), (d) => subYears(d, 1));
  const toKey = shiftKey(dayKeyNY(current.toIso), (d) => subYears(d, 1));
  return {
    key: current.key,
    fromIso: nyDayStartUtc(fromKey).toISOString(),
    toIso: nyDayEndUtc(toKey).toISOString(),
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
