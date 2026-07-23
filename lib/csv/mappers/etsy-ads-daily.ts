import { parseIntLoose } from "@/lib/csv/helpers";
import { parseMoneyToCents } from "@/lib/money";

/**
 * Etsy Reklam panosunun GÜNLÜK ("stats over time") dışa aktarımı — mağaza
 * geneli tek satır/gün: `Date (ET), Views, Clicks, Orders, Revenue (USD),
 * Spend (USD), ROAS, Click rate, Ending budget (USD)`. Listing kırılımı YOK
 * (o yüzden per-listing etsy-ads mapper'ından ayrı). `ad_daily_stats`'e yazılır.
 *
 * ROAS ve tık oranı SAKLANMAZ — türetilir; ham sayaçlar + para (cent) tutulur.
 */

export interface MappedAdsDailyRow {
  /** YYYY-MM-DD */
  date: string;
  views: number;
  clicks: number;
  orders: number;
  revenueCents: number;
  spendCents: number;
  endingBudgetCents: number | null;
}

export interface AdsDailyMapResult {
  rows: MappedAdsDailyRow[];
  warnings: string[];
}

export interface AdsDailyColumnMap {
  date?: string;
  views?: string;
  clicks?: string;
  orders?: string;
  revenue?: string;
  spend?: string;
  budget?: string;
}

const DATE_ALIASES = ["Date (ET)", "Date", "Day", "Tarih", "Gün"];
const VIEWS_ALIASES = ["Views", "View", "Impressions", "Görüntülenme", "Gösterim"];
const CLICKS_ALIASES = ["Clicks", "Click", "Tıklama", "Tıklanma"];
const ORDERS_ALIASES = ["Orders", "Order", "Sipariş", "Siparişler"];
const REVENUE_ALIASES = [
  "Revenue (USD)", "Revenue", "Ads Revenue", "Ad Revenue", "Ciro", "Gelir",
];
const SPEND_ALIASES = [
  "Spend (USD)", "Spend", "Ad Spend", "Ads Spend", "Cost", "Harcama",
];
const BUDGET_ALIASES = [
  "Ending budget (USD)", "Ending budget", "Budget", "Bütçe", "Gün sonu bütçe",
];

function findHeader(headers: string[], aliases: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const a of aliases) {
    const i = lower.indexOf(a.toLowerCase());
    if (i >= 0) return headers[i];
  }
  for (const a of aliases) {
    const al = a.toLowerCase();
    const i = lower.findIndex((h) => h.includes(al));
    if (i >= 0) return headers[i];
  }
  return undefined;
}

/** Başlıklardan tarih / metrik sütunlarını sezgisel tespit. */
export function autoDetectAdsDailyColumns(headers: string[]): AdsDailyColumnMap {
  return {
    date: findHeader(headers, DATE_ALIASES),
    views: findHeader(headers, VIEWS_ALIASES),
    clicks: findHeader(headers, CLICKS_ALIASES),
    orders: findHeader(headers, ORDERS_ALIASES),
    revenue: findHeader(headers, REVENUE_ALIASES),
    spend: findHeader(headers, SPEND_ALIASES),
    budget: findHeader(headers, BUDGET_ALIASES),
  };
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/**
 * "Jul 1, 2026" / "July 1, 2026" → "2026-07-01". Sayısal/ISO tarihleri de
 * tolere eder. TZ kaymasını önlemek için ay-adı yolu Date() kullanmaz.
 */
export function parseAdsDailyDate(raw: string): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  // Zaten ISO (YYYY-MM-DD…) ise ilk 10 karakter.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // "Mon D, YYYY" (Etsy formatı).
  const m = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mon) {
      const day = m[2].padStart(2, "0");
      return `${m[3]}-${mon}-${day}`;
    }
  }
  // Son çare: Date parse (TZ kaymasına karşı UTC bileşenlerini al).
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * Satırları MappedAdsDailyRow'a çevirir. Tarihi çözülemeyen satırlar atlanır;
 * metrik sütunu seçilmemişse sayısal alanlar 0, bütçe null olur.
 */
export function mapEtsyAdsDaily(
  rows: Record<string, string>[],
  cols: AdsDailyColumnMap,
): AdsDailyMapResult {
  const warnings: string[] = [];
  if (!cols.date) {
    return { rows: [], warnings: ["Tarih sütunu seçilmeli."] };
  }
  const out: MappedAdsDailyRow[] = [];
  let skipped = 0;
  const seen = new Set<string>();
  for (const row of rows) {
    const date = parseAdsDailyDate(row[cols.date] ?? "");
    if (!date) {
      skipped += 1;
      continue;
    }
    // Aynı dosyada tekrar eden gün — son değer kazanır (upsert semantiği).
    if (seen.has(date)) {
      const idx = out.findIndex((r) => r.date === date);
      if (idx >= 0) out.splice(idx, 1);
    }
    seen.add(date);
    out.push({
      date,
      views: cols.views ? (parseIntLoose(row[cols.views] ?? "") ?? 0) : 0,
      clicks: cols.clicks ? (parseIntLoose(row[cols.clicks] ?? "") ?? 0) : 0,
      orders: cols.orders ? (parseIntLoose(row[cols.orders] ?? "") ?? 0) : 0,
      revenueCents: cols.revenue
        ? parseMoneyToCents(row[cols.revenue] ?? "")
        : 0,
      spendCents: cols.spend ? parseMoneyToCents(row[cols.spend] ?? "") : 0,
      endingBudgetCents: cols.budget
        ? parseMoneyToCents(row[cols.budget] ?? "")
        : null,
    });
  }
  if (skipped > 0) {
    warnings.push(`${skipped} satır tarih çözülemediği için atlandı.`);
  }
  if (out.length === 0) {
    warnings.push("Geçerli günlük satır bulunamadı — sütun seçimlerini kontrol edin.");
  }
  return { rows: out, warnings };
}
