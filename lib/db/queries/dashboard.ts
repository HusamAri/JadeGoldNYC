import { createClient } from "@/lib/supabase/server";
import { recentActivity } from "@/lib/db/queries/audit";
import { fetchAllPages } from "@/lib/db/queries/listings";
import { formatDate } from "@/lib/format";
import { dayKeyNY, type ResolvedPeriod } from "@/lib/period";
import type { AuditLog } from "@/lib/types";

export interface GoldCostSummaryData {
  materialCents: number;
  laborCents: number;
  totalGoldCents: number;
  itemsWithCost: number;
}

export interface TopCustomer {
  buyerName: string;
  orderCount: number;
  revenueCents: number;
}

export interface ChannelBreakdown {
  channel: string;
  orderCount: number;
  revenueCents: number;
}

export interface DashboardData {
  revenueCents: number;
  costCents: number;
  profitCents: number;
  orderCount: number;
  aovCents: number;
  margin: number; // 0..1
  currency: string;
  trend: { date: string; label: string; revenue: number; cost: number; orders: number }[];
  costByCategory: { name: string; value: number }[];
  topProducts: {
    title: string;
    sku: string | null;
    quantity: number;
    revenue: number;
  }[];
  topCustomers: TopCustomer[];
  channelBreakdown: ChannelBreakdown[];
  recent: AuditLog[];
  goldCosts: GoldCostSummaryData;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getDashboard(
  period: ResolvedPeriod,
  currency = "USD",
): Promise<DashboardData> {
  const supabase = await createClient();
  const fromDate = period.fromIso ? period.fromIso.slice(0, 10) : null;
  const toDate = period.toIso.slice(0, 10);

  // --- Sorgular (PERF: 3 sorgu SIRALI await yerine birlikte koşar; kritik
  // yol tek round-trip süresine iner — panel TTFB ölçümünde ana kalemlerden) ---
  let salesQuery = supabase
    .from("sales")
    .select("grand_total_cents, item_total_cents, order_date, buyer_name, source")
    .neq("status", "cancelled")
    .lte("order_date", period.toIso);
  if (period.fromIso) salesQuery = salesQuery.gte("order_date", period.fromIso);

  let costQuery = supabase
    .from("costs")
    .select("amount_cents, cost_date, category:cost_categories(label_tr)")
    .lte("cost_date", toDate);
  if (fromDate) costQuery = costQuery.gte("cost_date", fromDate);

  // Kalemler TAM çekilir (fetchAllPages) — eski sırasız limit(2000) hangi
  // 2000 satırın geleceğini belirsiz bırakıyordu ve "En Çok Satanlar"ı
  // keyfî bir alt kümeden hesaplıyordu. Dönem filtresi hacmi zaten sınırlar.
  const itemsPromise = fetchAllPages<{
    title: string | null;
    sku: string | null;
    quantity: number;
    line_total_cents: number;
  }>((from, to) => {
    let q = supabase
      .from("sale_items")
      .select("title, sku, quantity, line_total_cents, sales!inner(order_date, status)")
      .neq("sales.status", "cancelled")
      .lte("sales.order_date", period.toIso)
      .order("id", { ascending: true })
      .range(from, to);
    if (period.fromIso) q = q.gte("sales.order_date", period.fromIso);
    return q;
  }).catch((e: unknown) => {
    // fetchAllPages hatayı fırlatır; panel boş kalmasın — logla, boş dön.
    console.error(
      "getDashboard sale_items sorgusu:",
      e instanceof Error ? e.message : e,
    );
    return [];
  });

  const [
    { data: salesRows, error: salesErr },
    { data: costRows, error: costErr },
    itemRows,
  ] = await Promise.all([salesQuery, costQuery, itemsPromise]);
  // Hata sessizce "veri yok"a dönüşmesin — en azından yüzeye çıkar.
  if (salesErr) console.error("getDashboard sales sorgusu:", salesErr.message);
  if (costErr) console.error("getDashboard costs sorgusu:", costErr.message);

  const sales = (salesRows ?? []) as {
    grand_total_cents: number;
    item_total_cents: number;
    order_date: string;
    buyer_name: string | null;
    source: string;
  }[];
  // Supabase to-one gömülü ilişkiyi statik olarak dizi sanıyor; çalışmada nesne döner.
  const costs = (costRows ?? []) as unknown as {
    amount_cents: number;
    cost_date: string;
    category: { label_tr: string } | null;
  }[];
  const items = itemRows;

  // --- Toplamlar ---
  const revenueCents = sales.reduce(
    (a, s) => a + (s.grand_total_cents || s.item_total_cents || 0),
    0,
  );
  const costCents = costs.reduce((a, c) => a + (c.amount_cents || 0), 0);
  const profitCents = revenueCents - costCents;
  const orderCount = sales.length;
  const aovCents = orderCount ? Math.round(revenueCents / orderCount) : 0;
  const margin = revenueCents ? profitCents / revenueCents : 0;

  // --- Gün bazlı trend ---
  const dayMap = new Map<string, { revenue: number; cost: number; orders: number }>();
  for (const s of sales) {
    // Gün anahtarı mağaza saat diliminde (NY): panel "bugün"ü NY takvimiyle
    // hesaplar (panel/page.tsx); UTC slice NY akşam satışlarını ertesi güne
    // kaydırıp "Bugün" görünümünü boş gösterebiliyordu. cost_date zaten
    // tarih-only olduğundan aşağıdaki maliyet gruplaması etkilenmez.
    const d = dayKeyNY(s.order_date);
    const e = dayMap.get(d) ?? { revenue: 0, cost: 0, orders: 0 };
    e.revenue += (s.grand_total_cents || s.item_total_cents || 0) / 100;
    e.orders += 1;
    dayMap.set(d, e);
  }
  for (const c of costs) {
    const d = c.cost_date.slice(0, 10);
    const e = dayMap.get(d) ?? { revenue: 0, cost: 0, orders: 0 };
    e.cost += (c.amount_cents || 0) / 100;
    dayMap.set(d, e);
  }
  const trend = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      label: formatDate(date, "d MMM"),
      revenue: round2(v.revenue),
      cost: round2(v.cost),
      orders: v.orders,
    }));

  // --- Kategori kırılımı ---
  const catMap = new Map<string, number>();
  for (const c of costs) {
    const name = c.category?.label_tr ?? "Diğer";
    catMap.set(name, (catMap.get(name) ?? 0) + (c.amount_cents || 0) / 100);
  }
  const costByCategory = [...catMap.entries()]
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value);

  // --- En çok satan ürünler — SKU bazlı (başlık METNİ değil). Her varyantın
  // kendi SKU'su var; listing bir SKU grubunun klasörüdür. Başlık düzenlenince
  // tarihsel satışın bölünmemesi ve varyant-düzeyi doğruluk için anahtar SKU;
  // SKU'suz eski/manuel kalemler başlığa düşer (geriye uyumlu).
  const prodMap = new Map<
    string,
    { title: string; sku: string | null; quantity: number; revenue: number }
  >();
  for (const it of items) {
    const sku = it.sku?.trim() || null;
    const key = sku ? `sku:${sku}` : `title:${it.title ?? "—"}`;
    const e =
      prodMap.get(key) ??
      { title: it.title ?? "—", sku, quantity: 0, revenue: 0 };
    e.quantity += it.quantity || 0;
    e.revenue += (it.line_total_cents || 0) / 100;
    prodMap.set(key, e);
  }
  const topProducts = [...prodMap.values()]
    .map((v) => ({
      title: v.title,
      sku: v.sku,
      quantity: v.quantity,
      revenue: round2(v.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // --- Altın maliyet özeti (gold_auto kaynaklı) — son etkinlikle paralel ---
  let goldCostQuery = supabase
    .from("costs")
    .select("amount_cents, category:cost_categories(key)")
    .eq("source", "gold_auto")
    .lte("cost_date", toDate);
  if (fromDate) goldCostQuery = goldCostQuery.gte("cost_date", fromDate);
  const [{ data: goldCostRows, error: goldErr }, recent] = await Promise.all([
    goldCostQuery,
    recentActivity(8),
  ]);
  if (goldErr) console.error("getDashboard altın maliyet sorgusu:", goldErr.message);
  const goldCosts_ = (goldCostRows ?? []) as unknown as {
    amount_cents: number;
    category: { key: string } | null;
  }[];

  let materialCents = 0;
  let laborCents = 0;
  for (const gc of goldCosts_) {
    const key = gc.category?.key;
    if (key === "malzeme") materialCents += gc.amount_cents || 0;
    else if (key === "iscilik") laborCents += gc.amount_cents || 0;
    else materialCents += gc.amount_cents || 0;
  }

  // --- En iyi müşteriler ---
  const custMap = new Map<string, { orderCount: number; revenueCents: number }>();
  for (const s of sales) {
    const name = s.buyer_name?.trim() || "Isimsiz";
    const e = custMap.get(name) ?? { orderCount: 0, revenueCents: 0 };
    e.orderCount += 1;
    e.revenueCents += s.grand_total_cents || s.item_total_cents || 0;
    custMap.set(name, e);
  }
  const topCustomers: TopCustomer[] = [...custMap.entries()]
    .map(([buyerName, v]) => ({ buyerName, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  // --- Kanal kırılımı ---
  const CHANNEL_LABELS: Record<string, string> = {
    etsy: "Etsy",
    manual: "Manuel",
    csv: "CSV Aktarım",
  };
  const chanMap = new Map<string, { orderCount: number; revenueCents: number }>();
  for (const s of sales) {
    const ch = s.source || "manual";
    const e = chanMap.get(ch) ?? { orderCount: 0, revenueCents: 0 };
    e.orderCount += 1;
    e.revenueCents += s.grand_total_cents || s.item_total_cents || 0;
    chanMap.set(ch, e);
  }
  const channelBreakdown: ChannelBreakdown[] = [...chanMap.entries()]
    .map(([ch, v]) => ({ channel: CHANNEL_LABELS[ch] ?? ch, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    revenueCents,
    costCents,
    profitCents,
    orderCount,
    aovCents,
    margin,
    currency,
    trend,
    costByCategory,
    topProducts,
    topCustomers,
    channelBreakdown,
    recent,
    goldCosts: {
      materialCents,
      laborCents,
      totalGoldCents: materialCents + laborCents,
      itemsWithCost: goldCosts_.length,
    },
  };
}
