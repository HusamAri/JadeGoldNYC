import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";

/**
 * Aylık satış tanısı — takvim yılı Ocak'ından bugüne her ayı bir önceki
 * ayla (MoM) karşılaştırır: ne oldu, ne yanlış gitti, ne düzeltilmeli.
 * Ek API/bütçe yok; mağazanın kendi satış + listing + reklam verisi.
 */

export type Severity = "critical" | "warning" | "info" | "good";

export interface DiagnosticSignal {
  severity: Severity;
  title: string;
  detail: string;
  action?: string;
  /** İlgili panel rotası (varsa) — "Düzelt" bağlantısı. */
  href?: string;
}

export interface AdLeak {
  productId: string | null;
  title: string;
  sku: string | null;
  spendCents: number;
  revenueCents: number;
  orders: number;
  clicks: number;
  roas: number | null;
}

export type MonthStatus = "up" | "down" | "flat" | "zero" | "partial";

export interface MonthEvaluation {
  /** "YYYY-MM" */
  ym: string;
  /** "Ocak 2026" */
  label: string;
  /** "1 Oca – 31 Oca 2026" (kısmi ayda bugüne kadar) */
  rangeLabel: string;
  orders: number;
  revenueCents: number;
  discountRatePct: number | null;
  newListings: number;
  /** Bir önceki ayın ym'si (yoksa null — ilk ay). */
  prevYm: string | null;
  prevLabel: string | null;
  ordersChangePct: number | null;
  revenueChangePct: number | null;
  status: MonthStatus;
  /** Kısa özet: ne oldu. */
  whatHappened: string;
  /** Bu ayda tespit edilen sorunlar. */
  issues: string[];
  /** Ay henüz bitmedi mi (içinde bulunduğumuz ay). */
  isPartial: boolean;
}

export type Lifecycle = "young" | "stalled" | "declining" | "healthy" | "dormant";

export interface SalesDiagnostics {
  currency: string;
  /** Değerlendirme yılı (takvim yılı Ocak başlangıcı). */
  year: number;
  fromLabel: string;
  toLabel: string;
  /** Dönem yönteminin tek cümlelik açıklaması. */
  comparisonNote: string;
  months: MonthEvaluation[];
  /** Hâlâ açık, düzeltilmesi gereken sorunlar (güncel durum). */
  openFixes: DiagnosticSignal[];
  lifecycle: Lifecycle;
  headline: string;
  /** Son tamamlanmış ay vs bir önceki tamamlanmış ay (özet kart için). */
  latestComplete: {
    ym: string;
    label: string;
    orders: number;
    prevLabel: string | null;
    ordersChangePct: number | null;
  } | null;
  ads: {
    spendCents: number;
    revenueCents: number;
    roas: number | null;
    topSpenderTitle: string | null;
    concentrationPct: number | null;
    leaks: AdLeak[];
  };
  freshness: {
    activeListings: number;
    newListings30d: number;
    zeroViewListings: number;
    lowImageListings: number;
    inactiveOrOOS: number;
    pendingSeoTags: number;
  };
  /** Geriye uyum — panel kartı / eski UI. */
  signals: DiagnosticSignal[];
  windowDays: number;
  orders: { current: number; previous: number; changePct: number | null };
  revenueCents: { current: number; previous: number; changePct: number | null };
  visits: { current: number; previous: number; changePct: number | null } | null;
  verdict: "traffic" | "conversion" | "both" | "unknown";
  discount: {
    historicalRatePct: number | null;
    recentRatePct: number | null;
    dependent: boolean;
  };
}

const DAY = 86_400_000;
const LOW_IMAGE_THRESHOLD = 5;

const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

const TR_MON_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
] as const;

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null;
  return (cur - prev) / prev;
}

function ymOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseYm(ym: string): { y: number; m: number } {
  const [y, m] = ym.split("-").map(Number);
  return { y, m };
}

function monthLabel(ym: string): string {
  const { y, m } = parseYm(ym);
  return `${TR_MONTHS[m - 1] ?? m} ${y}`;
}

function monthStart(ym: string): Date {
  const { y, m } = parseYm(ym);
  return new Date(y, m - 1, 1);
}

function monthEndExclusive(ym: string): Date {
  const { y, m } = parseYm(ym);
  return new Date(y, m, 1);
}

function lastDayOfMonth(ym: string): number {
  const { y, m } = parseYm(ym);
  return new Date(y, m, 0).getDate();
}

function rangeLabel(ym: string, isPartial: boolean, today: Date): string {
  const { y, m } = parseYm(ym);
  const short = TR_MON_SHORT[m - 1] ?? String(m);
  if (isPartial) {
    return `1 ${short} – ${today.getDate()} ${short} ${y} (ay devam ediyor)`;
  }
  return `1 ${short} – ${lastDayOfMonth(ym)} ${short} ${y}`;
}

function prevYmOf(ym: string): string {
  const { y, m } = parseYm(ym);
  const d = new Date(y, m - 2, 1);
  return ymOf(d);
}

interface SaleRow {
  order_date: string;
  status: string;
  item_total_cents: number | null;
  discount_cents: number | null;
  grand_total_cents: number | null;
}

interface ProductRow {
  id: string;
  title: string | null;
  sku: string | null;
  status: string | null;
  views: number | null;
  price_cents: number | null;
  quantity: number | null;
  num_images: number | null;
  created_at: string;
  archived_at: string | null;
}

interface MetricRow {
  product_id: string | null;
  product_title: string | null;
  sku: string | null;
  orders: number | null;
  views: number | null;
  ads_clicks: number | null;
  ads_spend_cents: number | null;
  ads_revenue_cents: number | null;
}

/** Takvim yılı Ocak'ından içinde bulunulan aya kadar ym listesi. */
export function yearMonthsThroughNow(now = new Date()): string[] {
  const year = now.getFullYear();
  const endMonth = now.getMonth(); // 0-based
  const out: string[] = [];
  for (let m = 0; m <= endMonth; m++) {
    out.push(`${year}-${String(m + 1).padStart(2, "0")}`);
  }
  return out;
}

function discountRate(rows: SaleRow[]): number | null {
  const base = rows.reduce((a, s) => a + (s.item_total_cents || 0), 0);
  const disc = rows.reduce((a, s) => a + (s.discount_cents || 0), 0);
  if (base <= 0) return null;
  return disc / base;
}

function revOf(s: SaleRow): number {
  return s.grand_total_cents || s.item_total_cents || 0;
}

function buildMonthNarrative(
  cur: {
    orders: number;
    revenueCents: number;
    discountRatePct: number | null;
    newListings: number;
  },
  prev: {
    orders: number;
    revenueCents: number;
    discountRatePct: number | null;
  } | null,
  opts: { isPartial: boolean; label: string; prevLabel: string | null },
): { status: MonthStatus; whatHappened: string; issues: string[] } {
  const issues: string[] = [];
  const ordersDelta = prev ? pctChange(cur.orders, prev.orders) : null;
  const revDelta = prev ? pctChange(cur.revenueCents, prev.revenueCents) : null;

  if (cur.orders === 0) {
    if (opts.isPartial) {
      return {
        status: "partial",
        whatHappened: `${opts.label} henüz sipariş görmedi (ay devam ediyor).`,
        issues: prev && prev.orders > 0
          ? [`${opts.prevLabel} ayında ${prev.orders} sipariş vardı; bu ay şimdilik 0.`]
          : ["Bu ay henüz satış yok."],
      };
    }
    return {
      status: "zero",
      whatHappened: `${opts.label}: hiç sipariş yok.`,
      issues: [
        prev && prev.orders > 0
          ? `${opts.prevLabel} ayındaki ${prev.orders} siparişten sonra satış durdu.`
          : "Ay boyunca satış gelmedi.",
      ],
    };
  }

  let status: MonthStatus = "flat";
  if (opts.isPartial) status = "partial";
  else if (ordersDelta != null && ordersDelta <= -0.15) status = "down";
  else if (ordersDelta != null && ordersDelta >= 0.15) status = "up";
  else if (ordersDelta == null && prev == null) status = "flat";

  const parts: string[] = [];
  if (prev == null) {
    parts.push(
      `${opts.label}: ${cur.orders} sipariş, ${(cur.revenueCents / 100).toFixed(0)}$ ciro (yılın ilk ayı; önceki ay yok).`,
    );
  } else if (ordersDelta == null) {
    parts.push(
      `${opts.label}: ${cur.orders} sipariş (önceki ay ${prev.orders} → sıfırdan artış oranlanamaz).`,
    );
    if (prev.orders === 0 && cur.orders > 0) status = "up";
  } else {
    const sign = ordersDelta > 0 ? "+" : "";
    parts.push(
      `${opts.label}: ${cur.orders} sipariş (${opts.prevLabel}: ${prev.orders}, ${sign}${Math.round(ordersDelta * 100)}%).`,
    );
    if (revDelta != null) {
      const rSign = revDelta > 0 ? "+" : "";
      parts.push(
        `Ciro ${(cur.revenueCents / 100).toFixed(0)}$ (${rSign}${Math.round(revDelta * 100)}%).`,
      );
    }
  }

  if (opts.isPartial) {
    parts.push("Ay henüz bitmedi; karşılaştırma kısmi.");
  }

  // Sorun tespiti
  if (ordersDelta != null && ordersDelta <= -0.3) {
    issues.push(
      `Sipariş sert düştü (${prev!.orders} → ${cur.orders}, ${Math.round(ordersDelta * 100)}%).`,
    );
  } else if (ordersDelta != null && ordersDelta <= -0.15) {
    issues.push(
      `Sipariş geriledi (${prev!.orders} → ${cur.orders}, ${Math.round(ordersDelta * 100)}%).`,
    );
  }

  if (
    revDelta != null &&
    ordersDelta != null &&
    revDelta < ordersDelta - 0.1 &&
    revDelta <= -0.15
  ) {
    issues.push(
      "Ciro siparişten daha hızlı düştü — ortalama sepet / indirim baskısı olabilir.",
    );
  }

  if (
    cur.discountRatePct != null &&
    prev?.discountRatePct != null &&
    cur.discountRatePct - prev.discountRatePct >= 0.08
  ) {
    issues.push(
      `İndirim oranı yükseldi (${Math.round(prev.discountRatePct * 100)}% → ${Math.round(cur.discountRatePct * 100)}%).`,
    );
  } else if (cur.discountRatePct != null && cur.discountRatePct >= 0.25) {
    issues.push(
      `Yüksek indirim bağımlılığı: satışların ~${Math.round(cur.discountRatePct * 100)}%'i indirimli.`,
    );
  }

  if (cur.newListings === 0 && (ordersDelta ?? 0) < 0) {
    issues.push("Bu ay yeni listing eklenmedi; vitrin tazelenmedi.");
  }

  if (issues.length === 0 && status === "up") {
    // olumlu — issues boş kalsın
  } else if (issues.length === 0 && status === "down") {
    issues.push("Düşüşün nedeni (trafik vs dönüşüm) için Etsy Stats dönemi girilmeli.");
  }

  return { status, whatHappened: parts.join(" "), issues };
}

export async function getSalesDiagnostics(
  orgId: string,
): Promise<SalesDiagnostics> {
  const supabase = await createClient();
  const now = new Date();
  const year = now.getFullYear();
  const monthsYm = yearMonthsThroughNow(now);
  const currentYm = ymOf(now);
  const yearStart = new Date(year, 0, 1);
  const yearStartIso = yearStart.toISOString();
  // Ocak MoM için önceki yıl Aralık + lifecycle için ~365 gün.
  const decPrevStart = new Date(year - 1, 11, 1);
  const histStart = new Date(now.getTime() - 365 * DAY);
  const fetchFrom = (
    histStart < decPrevStart ? histStart : decPrevStart
  ).toISOString();

  const allSales = await fetchAllPages<SaleRow>((from, to) =>
    supabase
      .from("sales")
      .select(
        "order_date, status, item_total_cents, discount_cents, grand_total_cents",
      )
      .eq("org_id", orgId)
      .gte("order_date", fetchFrom)
      .order("id", { ascending: true })
      .range(from, to),
  ).catch((e: unknown) => {
    console.error("diagnostics sales:", e instanceof Error ? e.message : e);
    return [] as SaleRow[];
  });

  const live = allSales.filter(
    (s) => s.status !== "cancelled" && s.status !== "refunded",
  );

  const inYm = (s: SaleRow, ym: string) => {
    const start = monthStart(ym).toISOString();
    const end = monthEndExclusive(ym).toISOString();
    // Kısmi ay: bugüne kadar (end = yarın 00:00 yerine now+1gün yeterli;
    // order_date genelde gün başı; şimdiki ay için endExclusive zaten gelecek ay 1'i).
    return s.order_date >= start && s.order_date < end;
  };

  const products = await fetchAllPages<ProductRow>((from, to) =>
    supabase
      .from("products")
      .select(
        "id, title, sku, status, views, price_cents, quantity, num_images, created_at, archived_at",
      )
      .eq("org_id", orgId)
      .order("id", { ascending: true })
      .range(from, to),
  ).catch((e: unknown) => {
    console.error("diagnostics products:", e instanceof Error ? e.message : e);
    return [] as ProductRow[];
  });

  const liveProducts = products.filter((p) => p.archived_at == null);
  const activeProducts = liveProducts.filter((p) => p.status === "active");
  const newListings30d = liveProducts.filter(
    (p) => now.getTime() - new Date(p.created_at).getTime() <= 30 * DAY,
  ).length;
  const zeroViewListings = activeProducts.filter(
    (p) => (p.views ?? 0) === 0,
  ).length;
  const lowImageListings = activeProducts.filter(
    (p) => (p.num_images ?? 0) < LOW_IMAGE_THRESHOLD,
  ).length;
  const inactiveOrOOS = liveProducts.filter(
    (p) =>
      p.status === "inactive" ||
      p.status === "expired" ||
      p.status === "sold_out" ||
      (p.status === "active" && (p.quantity ?? 0) === 0),
  ).length;

  const newListingsInYm = (ym: string) => {
    const start = monthStart(ym).getTime();
    const end = monthEndExclusive(ym).getTime();
    return liveProducts.filter((p) => {
      const t = new Date(p.created_at).getTime();
      return t >= start && t < end;
    }).length;
  };

  const metrics = await fetchAllPages<MetricRow>((from, to) =>
    supabase
      .from("product_metrics")
      .select(
        "product_id, product_title, sku, orders, views, ads_clicks, ads_spend_cents, ads_revenue_cents",
      )
      .eq("org_id", orgId)
      .order("id", { ascending: true })
      .range(from, to),
  ).catch((e: unknown) => {
    console.error("diagnostics metrics:", e instanceof Error ? e.message : e);
    return [] as MetricRow[];
  });

  const adAgg = new Map<string, AdLeak>();
  for (const m of metrics) {
    const key = m.product_id ?? `t:${m.product_title ?? m.sku ?? "?"}`;
    const e =
      adAgg.get(key) ??
      ({
        productId: m.product_id ?? null,
        title: m.product_title ?? "—",
        sku: m.sku ?? null,
        spendCents: 0,
        revenueCents: 0,
        orders: 0,
        clicks: 0,
        roas: null,
      } as AdLeak);
    e.spendCents += m.ads_spend_cents ?? 0;
    e.revenueCents += m.ads_revenue_cents ?? 0;
    e.orders += m.orders ?? 0;
    e.clicks += m.ads_clicks ?? 0;
    adAgg.set(key, e);
  }
  const adRows = [...adAgg.values()].filter((a) => a.spendCents > 0);
  for (const a of adRows)
    a.roas = a.spendCents > 0 ? a.revenueCents / a.spendCents : null;
  const adSpendTotal = adRows.reduce((a, r) => a + r.spendCents, 0);
  const adRevTotal = adRows.reduce((a, r) => a + r.revenueCents, 0);
  const adSorted = [...adRows].sort((a, b) => b.spendCents - a.spendCents);
  const topSpender = adSorted[0] ?? null;
  const concentrationPct =
    adSpendTotal > 0 && topSpender
      ? topSpender.spendCents / adSpendTotal
      : null;
  const leaks = adSorted.filter(
    (a) =>
      a.spendCents >= Math.max(500, adSpendTotal * 0.15) &&
      ((a.roas != null && a.roas < 1) || a.orders === 0),
  );

  let pendingSeoTags = 0;
  try {
    const { count, error } = await supabase
      .from("seo_tag_optimizations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .not("status", "in", "(pushed,rejected)");
    // Sorgu hatası sessizce 0'a düşmesin — "bekleyen yok" ile "sorgu patladı"
    // ayırt edilebilsin.
    if (error)
      console.error("[tanı] seo_tag_optimizations sayımı:", error.message);
    pendingSeoTags = count ?? 0;
  } catch (e) {
    console.error("[tanı] seo_tag_optimizations sayımı (istisna):", e);
    pendingSeoTags = 0;
  }

  // --- Aylık değerlendirmeler ---
  type MonthAgg = {
    orders: number;
    revenueCents: number;
    discountRatePct: number | null;
    newListings: number;
  };
  const emptyAgg = (): MonthAgg => ({
    orders: 0,
    revenueCents: 0,
    discountRatePct: null,
    newListings: 0,
  });
  const buildAgg = (ym: string): MonthAgg => {
    const rows = live.filter((s) => inYm(s, ym));
    return {
      orders: rows.length,
      revenueCents: rows.reduce((a, s) => a + revOf(s), 0),
      discountRatePct: discountRate(rows),
      newListings: newListingsInYm(ym),
    };
  };
  const aggs = new Map<string, MonthAgg>();
  for (const ym of monthsYm) aggs.set(ym, buildAgg(ym));

  // Ocak MoM: önceki yıl Aralık (timeline'da gösterilmez, karşılaştırma için).
  const firstYm = monthsYm[0];
  const decPrev = firstYm ? prevYmOf(firstYm) : null;
  if (decPrev) aggs.set(decPrev, buildAgg(decPrev));

  const months: MonthEvaluation[] = monthsYm.map((ym, idx) => {
    const cur = aggs.get(ym) ?? emptyAgg();
    const isPartial = ym === currentYm;
    const pYm = prevYmOf(ym);
    // İlk ay (Ocak) her zaman Aralık ile karşılaştırılır; diğerleri bir önceki ay.
    const prevAgg = aggs.get(pYm) ?? (idx === 0 && decPrev ? emptyAgg() : null);
    const hasPrev = prevAgg != null;
    const narrative = buildMonthNarrative(cur, hasPrev ? prevAgg : null, {
      isPartial,
      label: monthLabel(ym),
      prevLabel: hasPrev ? monthLabel(pYm) : null,
    });
    return {
      ym,
      label: monthLabel(ym),
      rangeLabel: rangeLabel(ym, isPartial, now),
      orders: cur.orders,
      revenueCents: cur.revenueCents,
      discountRatePct: cur.discountRatePct,
      newListings: cur.newListings,
      prevYm: hasPrev ? pYm : null,
      prevLabel: hasPrev ? monthLabel(pYm) : null,
      ordersChangePct: prevAgg
        ? pctChange(cur.orders, prevAgg.orders)
        : null,
      revenueChangePct: prevAgg
        ? pctChange(cur.revenueCents, prevAgg.revenueCents)
        : null,
      status: narrative.status,
      whatHappened: narrative.whatHappened,
      issues: narrative.issues,
      isPartial,
    };
  });

  // --- Açık düzeltmeler (güncel durum) ---
  const openFixes: DiagnosticSignal[] = [];
  const pct = (n: number | null) =>
    n == null ? "—" : `${Math.round(n * 100)}%`;

  const completeMonths = months.filter((m) => !m.isPartial);
  const lastComplete = completeMonths[completeMonths.length - 1] ?? null;
  const downMonths = completeMonths.filter((m) => m.status === "down" || m.status === "zero");
  const worst = [...completeMonths]
    .filter((m) => m.ordersChangePct != null)
    .sort((a, b) => (a.ordersChangePct ?? 0) - (b.ordersChangePct ?? 0))[0];

  if (worst && (worst.ordersChangePct ?? 0) <= -0.15) {
    openFixes.push({
      severity: "critical",
      title: `${worst.label}: en sert düşüş`,
      detail: `${worst.prevLabel} → ${worst.label}: sipariş ${pct(worst.ordersChangePct)} (${worst.prevYm ? (aggs.get(worst.prevYm)?.orders ?? "?") : "?"} → ${worst.orders}). ${worst.issues[0] ?? ""}`,
      action:
        "Bu aya geri dönüp o dönemdeki fiyat, reklam, stok ve listing değişikliklerini kontrol edin; tekrarlayan kalıp varsa kalıcı düzeltme gerekir.",
      href: "/satislar",
    });
  }

  if (downMonths.length >= 2) {
    openFixes.push({
      severity: "warning",
      title: "Birden fazla ay geriledi",
      detail: `${year} içinde ${downMonths.map((m) => m.label).join(", ")} aylarında sipariş düştü veya sıfırlandı.`,
      action:
        "Tek seferlik dip değil; trend var. Trafik (Etsy Stats) ve dönüşüm (fiyat/görsel/yorum) ayrımını netleştirin.",
      href: "/analizler",
    });
  }

  if (leaks.length > 0) {
    const top = leaks[0];
    openFixes.push({
      severity: "critical",
      title: "Reklam bütçesi kaçağı",
      detail: `${leaks.length} listing bütçeyi tüketiyor ama getirisi zayıf. En büyüğü "${top.title}" — harcama ${(
        top.spendCents / 100
      ).toFixed(0)}$, ROAS ${top.roas == null ? "—" : top.roas.toFixed(2)}, ${top.orders} sipariş${
        concentrationPct != null
          ? `. Bu tek listing toplam reklam harcamasının ${pct(concentrationPct)}'ini yiyor.`
          : "."
      }`,
      action:
        "Bu listing(ler)in reklamını durdurun; bütçeyi dönüşen listinglere kaydırın.",
      href: "/reklamlar",
    });
  }

  const yearSales = live.filter((s) => s.order_date >= yearStartIso);
  const yearDisc = discountRate(yearSales);
  const recentYm = currentYm;
  const recentDisc = aggs.get(recentYm)?.discountRatePct ?? null;
  if (yearDisc != null && yearDisc >= 0.2) {
    openFixes.push({
      severity: "warning",
      title: "İndirim bağımlılığı",
      detail: `${year} yılı satışlarının ortalama ${pct(yearDisc)}'i indirimli; bu ay ${pct(recentDisc)}.`,
      action:
        "İndirimi kademeli azaltın veya fiyatı indirimli seviyeye yakın yeniden konumlandırın.",
      href: "/analizler",
    });
  }

  if (inactiveOrOOS > 0) {
    openFixes.push({
      severity: "warning",
      title: "Pasif / stoksuz listingler",
      detail: `${inactiveOrOOS} listing pasif, süresi dolmuş veya stoğu 0 — aramada görünmez.`,
      action: "Yeniden yayınlayın veya stok girin.",
      href: "/tasarimlar/iyilestir",
    });
  }

  if (lowImageListings > 0) {
    openFixes.push({
      severity: "warning",
      title: "Az görselli listingler",
      detail: `${lowImageListings} aktif listing ${LOW_IMAGE_THRESHOLD}'ten az görsele sahip.`,
      action: "Her listinge en az 5-10 kaliteli görsel ekleyin.",
      href: "/tasarimlar/iyilestir",
    });
  }

  if (zeroViewListings > 0) {
    openFixes.push({
      severity: "info",
      title: "Hiç görüntülenmeyen listingler",
      detail: `${zeroViewListings} aktif listing henüz hiç görüntülenmemiş.`,
      action: "Başlık ve 13 etiketi alıcı dilinde güncelleyin.",
      href: "/seo-etiketleri",
    });
  }

  if (pendingSeoTags > 0) {
    openFixes.push({
      severity: "info",
      title: "Hazır SEO etiketi önerileri",
      detail: `${pendingSeoTags} listing için bekleyen etiket önerisi var.`,
      action: "SEO Etiketleri'nden gözden geçirip Etsy'ye gönderin.",
      href: "/seo-etiketleri",
    });
  }

  if (openFixes.length === 0) {
    openFixes.push({
      severity: "good",
      title: "Açık kritik sorun yok",
      detail:
        "Aylık seride belirgin bir durdurucu görünmüyor. Derinlik için Etsy Stats dönemlerini girin.",
    });
  }

  // Lifecycle: son tamamlanmış aya göre
  const histLive = live;
  const hasHistory = histLive.length > 0;
  const ordersCur = lastComplete?.orders ?? months[months.length - 1]?.orders ?? 0;
  const ordersPrev = lastComplete?.prevYm
    ? (aggs.get(lastComplete.prevYm)?.orders ?? 0)
    : 0;
  let lifecycle: Lifecycle;
  if (!hasHistory && newListings30d > 0 && ordersCur === 0) lifecycle = "young";
  else if (hasHistory && ordersCur === 0) lifecycle = "stalled";
  else if (ordersPrev > 0 && ordersCur / Math.max(1, ordersPrev) < 0.6)
    lifecycle = "declining";
  else if (!hasHistory && ordersCur === 0) lifecycle = "dormant";
  else lifecycle = "healthy";

  const fromLabel = monthLabel(monthsYm[0] ?? `${year}-01`);
  const toLabel = monthLabel(monthsYm[monthsYm.length - 1] ?? currentYm);
  const headline = buildHeadline(lifecycle, months, year);

  const revCur = lastComplete?.revenueCents ?? 0;
  const revPrev = lastComplete?.prevYm
    ? (aggs.get(lastComplete.prevYm)?.revenueCents ?? 0)
    : 0;

  return {
    currency: "USD",
    year,
    fromLabel,
    toLabel,
    comparisonNote: `${fromLabel} – ${toLabel}: her ay bir önceki ayla (MoM) karşılaştırılır. İçinde bulunulan ay kısmi işaretlenir.`,
    months,
    openFixes,
    lifecycle,
    headline,
    latestComplete: lastComplete
      ? {
          ym: lastComplete.ym,
          label: lastComplete.label,
          orders: lastComplete.orders,
          prevLabel: lastComplete.prevLabel,
          ordersChangePct: lastComplete.ordersChangePct,
        }
      : null,
    ads: {
      spendCents: adSpendTotal,
      revenueCents: adRevTotal,
      roas: adSpendTotal > 0 ? adRevTotal / adSpendTotal : null,
      topSpenderTitle: topSpender?.title ?? null,
      concentrationPct,
      leaks,
    },
    freshness: {
      activeListings: activeProducts.length,
      newListings30d,
      zeroViewListings,
      lowImageListings,
      inactiveOrOOS,
      pendingSeoTags,
    },
    signals: openFixes,
    windowDays: Math.max(
      1,
      Math.ceil((now.getTime() - yearStart.getTime()) / DAY),
    ),
    orders: {
      current: ordersCur,
      previous: ordersPrev,
      changePct: pctChange(ordersCur, ordersPrev),
    },
    revenueCents: {
      current: revCur,
      previous: revPrev,
      changePct: pctChange(revCur, revPrev),
    },
    visits: null,
    verdict: "unknown",
    discount: {
      historicalRatePct: yearDisc,
      recentRatePct: recentDisc,
      dependent: yearDisc != null && yearDisc >= 0.2,
    },
  };
}

function buildHeadline(
  lifecycle: Lifecycle,
  months: MonthEvaluation[],
  year: number,
): string {
  const complete = months.filter((m) => !m.isPartial);
  const downs = complete.filter((m) => m.status === "down" || m.status === "zero");
  const ups = complete.filter((m) => m.status === "up");
  if (lifecycle === "young") {
    return `${year} Ocak'tan bu yana: genç / yeniden kurulmuş mağaza — görünürlük yeni birikiyor.`;
  }
  if (lifecycle === "stalled") {
    return `${year} Ocak'tan bu yana: satışlar durdu — son tamamlanan ayda sipariş yok.`;
  }
  if (downs.length >= ups.length && downs.length > 0) {
    return `${year} Ocak'tan bu yana ${downs.length} ay geriledi veya sıfırlandı; düzeltilmesi gereken noktalar aşağıda.`;
  }
  if (lifecycle === "declining") {
    return `${year}: son tamamlanan ay bir öncekiye göre belirgin düşüşte.`;
  }
  if (lifecycle === "dormant") {
    return `${year} Ocak'tan bu yana henüz satış geçmişi yok.`;
  }
  return `${year} Ocak'tan bu yana aylık seyir genel olarak dengeli görünüyor.`;
}
