import { createClient } from "@/lib/supabase/server";

/**
 * MAĞAZA GENELİ GÜNLÜK REKLAM İSTATİSTİKLERİ (Etsy Ads "stats over time").
 *
 * `ad_daily_stats` tablosundan (0116) org başına günlük satırları okur. Bu,
 * listing kırılımı olmayan mağaza-geneli günlük seridir (ledger'dan ayrı:
 * ledger yalnız harcamayı verir; bu seri görüntülenme/tık/sipariş/ciro/ROAS
 * ve gün-sonu bütçeyi de taşır). Etsy Reklam panosundan indirilen günlük CSV
 * ile beslenir.
 *
 * Para kuralı: farklı kurlar tek sayıya karıştırılmaz — baskın kur toplanır,
 * kalan kur kaydı ayrıca bildirilir (ledger deseniyle aynı).
 */

export interface AdDailyRow {
  /** YYYY-MM-DD */
  date: string;
  views: number;
  clicks: number;
  orders: number;
  revenueCents: number;
  spendCents: number;
  endingBudgetCents: number | null;
  currency: string;
}

export interface AdDailyTotals {
  views: number;
  clicks: number;
  orders: number;
  revenueCents: number;
  spendCents: number;
  /** reklam geliri / harcama — harcama 0 ise null. */
  roas: number | null;
  /** tık / görüntülenme — görüntülenme 0 ise null. */
  clickRate: number | null;
}

export interface AdDailyOverview {
  /** Gün bazlı seri, tarih AZALAN (en yeni önce). */
  days: AdDailyRow[];
  totals: AdDailyTotals;
  /** Toplamların kuru (baskın kur; kayıt yoksa org varsayılanı). */
  currency: string;
  /** Baskın kur DIŞINDA kalan (toplama katılmayan) kayıt sayısı. */
  otherCurrencyCount: number;
  /** Kapsanan tarih aralığı (varsa). */
  range: { from: string; to: string } | null;
}

interface DbRow {
  stat_date: string;
  views: number | null;
  clicks: number | null;
  orders: number | null;
  revenue_cents: number | null;
  spend_cents: number | null;
  ending_budget_cents: number | null;
  currency: string | null;
}

const EMPTY_TOTALS: AdDailyTotals = {
  views: 0,
  clicks: 0,
  orders: 0,
  revenueCents: 0,
  spendCents: 0,
  roas: null,
  clickRate: null,
};

/**
 * Org'un günlük reklam serisini + toplamlarını döndürür. Multi-tenant kilit:
 * org_id her zaman filtrelenir (RLS'in aktif-org varsayımına yaslanmaz).
 */
export async function getAdDailyOverview(
  orgId: string,
): Promise<AdDailyOverview> {
  const supabase = await createClient();

  const [orgRes, res] = await Promise.all([
    supabase
      .from("organizations")
      .select("default_currency")
      .eq("id", orgId)
      .maybeSingle(),
    supabase
      .from("ad_daily_stats")
      .select(
        "stat_date, views, clicks, orders, revenue_cents, spend_cents, ending_budget_cents, currency",
      )
      .eq("org_id", orgId)
      .order("stat_date", { ascending: false }),
  ]);

  const fallbackCurrency =
    (orgRes.data as { default_currency: string | null } | null)
      ?.default_currency ?? "USD";

  if (res.error) {
    // Sorgu hatası sessizce "veri yok"a dönüşmesin — yüzeye çıkar.
    console.error("[reklamlar] günlük reklam sorgusu:", res.error.message);
    return {
      days: [],
      totals: EMPTY_TOTALS,
      currency: fallbackCurrency,
      otherCurrencyCount: 0,
      range: null,
    };
  }

  const rows = (res.data ?? []) as DbRow[];
  if (rows.length === 0) {
    return {
      days: [],
      totals: EMPTY_TOTALS,
      currency: fallbackCurrency,
      otherCurrencyCount: 0,
      range: null,
    };
  }

  // Baskın kur: en çok kayıt taşıyan kur toplanır, kalanı sayılır.
  const byCurrency = new Map<string, number>();
  for (const r of rows) {
    const c = r.currency ?? fallbackCurrency;
    byCurrency.set(c, (byCurrency.get(c) ?? 0) + 1);
  }
  const currency = [...byCurrency.entries()].sort((a, b) => b[1] - a[1])[0][0];

  let otherCurrencyCount = 0;
  const days: AdDailyRow[] = [];
  const totals = { ...EMPTY_TOTALS };

  for (const r of rows) {
    const c = r.currency ?? fallbackCurrency;
    const row: AdDailyRow = {
      date: (r.stat_date as string).slice(0, 10),
      views: r.views ?? 0,
      clicks: r.clicks ?? 0,
      orders: r.orders ?? 0,
      revenueCents: r.revenue_cents ?? 0,
      spendCents: r.spend_cents ?? 0,
      endingBudgetCents: r.ending_budget_cents,
      currency: c,
    };
    days.push(row);
    // Toplamlar yalnız baskın kurdan; farklı kur toplama karışmaz.
    if (c !== currency) {
      otherCurrencyCount += 1;
      continue;
    }
    totals.views += row.views;
    totals.clicks += row.clicks;
    totals.orders += row.orders;
    totals.revenueCents += row.revenueCents;
    totals.spendCents += row.spendCents;
  }

  totals.roas =
    totals.spendCents > 0 ? totals.revenueCents / totals.spendCents : null;
  totals.clickRate = totals.views > 0 ? totals.clicks / totals.views : null;

  // days tarih AZALAN geldi; aralık için ilk/son.
  const range =
    days.length > 0
      ? { from: days[days.length - 1].date, to: days[0].date }
      : null;

  return { days, totals, currency, otherCurrencyCount, range };
}
