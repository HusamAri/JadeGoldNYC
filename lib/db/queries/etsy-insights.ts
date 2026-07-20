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

// ── Listing bazlı görüntülenme trendi (karar bağlamı) ──────────────────────

export interface ListingViewsTrend {
  etsyListingId: number;
  /** Penceredeki fotoğraf günü sayısı — seri olgunluğu (≥2 gerekir). */
  statDays: number;
  /** Günlük görüntülenme farkları (ardışık fotoğraf günleri arası). */
  series: ViewsSeriesPoint[];
  /** Serinin KAPSADIĞI gerçek aralık (ilk→son fotoğraf günü) — etikete yazılır. */
  coveredFrom: string | null;
  coveredTo: string | null;
  /** Kapsanan aralıktaki toplam görüntülenme artışı (delta toplamı). */
  viewsDelta: number | null;
  /** Son 7 güne düşen delta toplamı (o aralıkta ≥1 delta noktası yoksa null). */
  viewsDelta7: number | null;
  /** Kapsanan aralıktaki net favori değişimi. */
  favorersDelta: number | null;
  /** Kapsanan aralıktaki sipariş/adet (sale_items, iptaller hariç). */
  orders: number;
  units: number;
  /** sipariş / görüntülenme artışı — payda 0/veri yoksa null. */
  conversion: number | null;
}

/**
 * Verilen listingler için GÜNLÜK görüntülenme trendi + aynı aralıktaki satış
 * dönüşümü. Kaynak: etsy_listing_stats günlük fotoğrafları (Etsy API'nin
 * verdiği ömür-boyu toplamların panel birikimi). Etsy API tarihçe ve trafik
 * kaynağı VERMEZ — seri fotoğraflar arası farktır; kapsanan gerçek aralık
 * (coveredFrom→coveredTo) çıktıya yazılır ki etiket pencere uydurmasın.
 * Dönüşüm de aynı kapsanan aralığın sale_items'ından sayılır (elma-elma).
 */
export async function getListingViewsTrends(
  orgId: string,
  etsyListingIds: number[],
): Promise<Map<number, ListingViewsTrend>> {
  const out = new Map<number, ListingViewsTrend>();
  const ids = [...new Set(etsyListingIds)].filter((n) => Number.isFinite(n));
  if (ids.length === 0) return out;

  const supabase = await createClient();
  const since = new Date(Date.now() - ETSY_INSIGHTS_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data: statRows, error: statsErr } = await supabase
    .from("etsy_listing_stats")
    .select("etsy_listing_id, stat_date, views, num_favorers")
    .eq("org_id", orgId)
    .in("etsy_listing_id", ids)
    .gte("stat_date", since)
    .order("stat_date", { ascending: true })
    .limit(10_000);
  if (statsErr)
    console.error("[etsy-insights] listing stats sorgusu:", statsErr.message);

  type StatRow = {
    etsy_listing_id: number;
    stat_date: string;
    views: number | null;
    num_favorers: number | null;
  };
  const byListing = new Map<number, StatRow[]>();
  for (const r of (statRows ?? []) as unknown as StatRow[]) {
    const arr = byListing.get(r.etsy_listing_id) ?? [];
    arr.push(r);
    byListing.set(r.etsy_listing_id, arr);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  for (const id of ids) {
    const rows = (byListing.get(id) ?? []).sort((a, b) =>
      a.stat_date.localeCompare(b.stat_date),
    );
    const series: ViewsSeriesPoint[] = [];
    for (let i = 1; i < rows.length; i++) {
      const d = rows[i].stat_date.slice(0, 10);
      series.push({
        date: d,
        label: fmtLabel(d),
        views: Math.max(0, (rows[i].views ?? 0) - (rows[i - 1].views ?? 0)),
        favorers:
          (rows[i].num_favorers ?? 0) - (rows[i - 1].num_favorers ?? 0),
      });
    }
    const matured = rows.length >= 2;
    const points7 = series.filter((p) => p.date >= sevenDaysAgo);
    out.set(id, {
      etsyListingId: id,
      statDays: rows.length,
      series,
      coveredFrom: matured ? rows[0].stat_date.slice(0, 10) : null,
      coveredTo: matured
        ? rows[rows.length - 1].stat_date.slice(0, 10)
        : null,
      viewsDelta: matured
        ? series.reduce((a, p) => a + p.views, 0)
        : null,
      viewsDelta7:
        matured && points7.length > 0
          ? points7.reduce((a, p) => a + p.views, 0)
          : null,
      favorersDelta: matured
        ? series.reduce((a, p) => a + p.favorers, 0)
        : null,
      orders: 0,
      units: 0,
      conversion: null,
    });
  }

  // Dönüşüm: her listing'in kendi kapsanan aralığındaki satış kalemleri.
  // Tek sorguda pencerenin tamamı çekilir, listing başına aralık filtresi
  // bellek tarafında uygulanır (kapsanan aralıklar listing başına farklı).
  const { data: itemRows, error: itemsErr } = await supabase
    .from("sale_items")
    .select("etsy_listing_id, quantity, sales!inner(order_date, status)")
    .eq("org_id", orgId)
    .in("etsy_listing_id", ids)
    .neq("sales.status", "cancelled")
    .gte("sales.order_date", `${since}T00:00:00Z`)
    .limit(10_000);
  if (itemsErr)
    console.error("[etsy-insights] dönüşüm sorgusu:", itemsErr.message);

  for (const raw of (itemRows ?? []) as unknown as {
    etsy_listing_id: number | null;
    quantity: number | null;
    sales: { order_date: string | null; status: string | null } | null;
  }[]) {
    if (raw.etsy_listing_id == null) continue;
    const t = out.get(raw.etsy_listing_id);
    if (!t || !t.coveredFrom || !t.coveredTo) continue;
    const day = (raw.sales?.order_date ?? "").slice(0, 10);
    // Kapsanan aralık dışındaki sipariş sayılmaz (görüntülenme paydası yok).
    if (day < t.coveredFrom || day > t.coveredTo) continue;
    t.orders += 1;
    t.units += raw.quantity ?? 1;
  }
  for (const t of out.values()) {
    t.conversion =
      t.viewsDelta != null && t.viewsDelta > 0 ? t.orders / t.viewsDelta : null;
  }

  return out;
}
