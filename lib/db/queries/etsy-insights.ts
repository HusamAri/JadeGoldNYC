import { createClient } from "@/lib/supabase/server";

/**
 * Listing istatistik penceresi (gün): görüntülenme serisi ve top movers bu
 * pencereyle sınırlıdır. UI etiketi de BU sabitten beslenir — etiket ve sorgu
 * ayrışmasın (meta veri kaynağında taşınır kuralı).
 */
export const ETSY_INSIGHTS_WINDOW_DAYS = 45;

export interface ShopSnapshot {
  snapshotDate: string;
  numFavorers: number | null;
  reviewAverage: number | null;
  reviewCount: number | null;
  listingActiveCount: number | null;
  transactionSoldCount: number | null;
  isVacation: boolean | null;
}

export interface ViewsSeriesPoint {
  date: string; // YYYY-MM-DD
  label: string; // kısa görünüm
  views: number; // o günkü GÜNLÜK görüntülenme (delta)
  favorers: number; // o günkü net favori değişimi
}

export interface TopMover {
  etsyListingId: number;
  title: string;
  deltaViews: number;
  deltaFavorers: number;
}

export interface EtsyInsights {
  snapshots: ShopSnapshot[]; // en yeni önce
  /** Günlük görüntülenme serisi — fotoğraflar arası fark; en az 2 gün gerekir */
  viewsSeries: ViewsSeriesPoint[];
  topMovers: TopMover[];
  /** Kaç günlük fotoğraf birikti (seri olgunluğu göstergesi) */
  statDays: number;
}

function fmtLabel(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Etsy tam-senkron veri setlerinden içgörüler: mağaza sağlık fotoğrafları +
 * listing istatistik fotoğraflarından türetilen GÜNLÜK görüntülenme serisi ve
 * "en çok hareket eden" listingler. Views ömür boyu toplam olduğundan seri,
 * ardışık iki fotoğraf günü arasındaki farktır (panel biriktirdikçe uzar).
 */
export async function getEtsyInsights(orgId: string): Promise<EtsyInsights> {
  const supabase = await createClient();
  const since = new Date(Date.now() - ETSY_INSIGHTS_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [snapRes, statsRes, productsRes] = await Promise.all([
    supabase
      .from("etsy_shop_snapshots")
      .select(
        "snapshot_date, num_favorers, review_average, review_count, listing_active_count, transaction_sold_count, is_vacation",
      )
      .eq("org_id", orgId)
      .order("snapshot_date", { ascending: false })
      .limit(60),
    supabase
      .from("etsy_listing_stats")
      .select("etsy_listing_id, stat_date, views, num_favorers")
      .eq("org_id", orgId)
      .gte("stat_date", since)
      .order("stat_date", { ascending: true })
      .limit(10000),
    supabase
      .from("products")
      .select("etsy_listing_id, title")
      .eq("org_id", orgId)
      .not("etsy_listing_id", "is", null),
  ]);

  const snapshots: ShopSnapshot[] = (
    (snapRes.data ?? []) as unknown as {
      snapshot_date: string;
      num_favorers: number | null;
      review_average: number | null;
      review_count: number | null;
      listing_active_count: number | null;
      transaction_sold_count: number | null;
      is_vacation: boolean | null;
    }[]
  ).map((r) => ({
    snapshotDate: r.snapshot_date,
    numFavorers: r.num_favorers,
    reviewAverage: r.review_average != null ? Number(r.review_average) : null,
    reviewCount: r.review_count,
    listingActiveCount: r.listing_active_count,
    transactionSoldCount: r.transaction_sold_count,
    isVacation: r.is_vacation,
  }));

  // Listing fotoğraflarını (tarih → listing → değer) grupla
  type StatRow = {
    etsy_listing_id: number;
    stat_date: string;
    views: number | null;
    num_favorers: number | null;
  };
  const stats = (statsRes.data ?? []) as unknown as StatRow[];
  const byDate = new Map<string, Map<number, StatRow>>();
  for (const r of stats) {
    const d = r.stat_date.slice(0, 10);
    const m = byDate.get(d) ?? new Map<number, StatRow>();
    m.set(r.etsy_listing_id, r);
    byDate.set(d, m);
  }
  const dates = [...byDate.keys()].sort();

  // Günlük seri: ardışık fotoğraf günleri arasında, İKİ günde de mevcut
  // listingler üzerinden fark toplamı (yeni eklenen listing seriyi şişirmesin)
  const viewsSeries: ViewsSeriesPoint[] = [];
  for (let i = 1; i < dates.length; i++) {
    const prev = byDate.get(dates[i - 1])!;
    const curM = byDate.get(dates[i])!;
    let dViews = 0;
    let dFav = 0;
    for (const [id, curRow] of curM) {
      const prevRow = prev.get(id);
      if (!prevRow) continue;
      dViews += Math.max(0, (curRow.views ?? 0) - (prevRow.views ?? 0));
      dFav += (curRow.num_favorers ?? 0) - (prevRow.num_favorers ?? 0);
    }
    viewsSeries.push({
      date: dates[i],
      label: fmtLabel(dates[i]),
      views: dViews,
      favorers: dFav,
    });
  }

  // En çok hareket edenler: son iki fotoğraf günü arasındaki listing farkları
  const titleMap = new Map(
    (
      (productsRes.data ?? []) as unknown as {
        etsy_listing_id: number;
        title: string;
      }[]
    ).map((p) => [p.etsy_listing_id, p.title]),
  );
  let topMovers: TopMover[] = [];
  if (dates.length >= 2) {
    const prev = byDate.get(dates[dates.length - 2])!;
    const curM = byDate.get(dates[dates.length - 1])!;
    topMovers = [...curM.entries()]
      .map(([id, curRow]) => {
        const prevRow = prev.get(id);
        return {
          etsyListingId: id,
          title: titleMap.get(id) ?? `Listing #${id}`,
          deltaViews: prevRow
            ? Math.max(0, (curRow.views ?? 0) - (prevRow.views ?? 0))
            : 0,
          deltaFavorers: prevRow
            ? (curRow.num_favorers ?? 0) - (prevRow.num_favorers ?? 0)
            : 0,
        };
      })
      .filter((m) => m.deltaViews > 0 || m.deltaFavorers !== 0)
      .sort((a, b) => b.deltaViews - a.deltaViews)
      .slice(0, 8);
  }

  return { snapshots, viewsSeries, topMovers, statDays: dates.length };
}
