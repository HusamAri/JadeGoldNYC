import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";

/**
 * "Satış durdu" tanılaması — mağazanın KENDİ verisinden (ek API/bütçe yok)
 * satışın neden durduğunu trafik vs dönüşüm ekseninde ayırır ve markaya göre
 * farklı sinyaller üretir:
 *  - Genç/yeniden kurulmuş mağaza (ör. EON): tazelik/görünürlük rampası.
 *  - Yerleşik ama durmuş (ör. Jade): indirim bağımlılığı + reklam bütçe kaçağı.
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
  roas: number | null; // revenue / spend
}

export type Lifecycle = "young" | "stalled" | "declining" | "healthy" | "dormant";

export interface SalesDiagnostics {
  currency: string;
  lifecycle: Lifecycle;
  headline: string;
  windowDays: number;
  orders: { current: number; previous: number; changePct: number | null };
  revenueCents: { current: number; previous: number; changePct: number | null };
  visits: { current: number; previous: number; changePct: number | null } | null;
  verdict: "traffic" | "conversion" | "both" | "unknown";
  ads: {
    spendCents: number;
    revenueCents: number;
    roas: number | null;
    topSpenderTitle: string | null;
    concentrationPct: number | null; // en çok harcayan / toplam
    leaks: AdLeak[];
  };
  discount: {
    historicalRatePct: number | null;
    recentRatePct: number | null;
    dependent: boolean;
  };
  freshness: {
    activeListings: number;
    newListings30d: number;
    zeroViewListings: number;
    lowImageListings: number;
    inactiveOrOOS: number;
    pendingSeoTags: number;
  };
  signals: DiagnosticSignal[];
}

const DAY = 86_400_000;
const LOW_IMAGE_THRESHOLD = 5;

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null; // sıfırdan artış oransız
  return (cur - prev) / prev;
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

export async function getSalesDiagnostics(
  orgId: string,
): Promise<SalesDiagnostics> {
  const supabase = await createClient();
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const cur0 = iso(now - 30 * DAY);
  const prev0 = iso(now - 60 * DAY);
  const hist0 = iso(now - 365 * DAY);

  // --- Satışlar (son 365 gün) — indirim + trafik/dönüşüm pencereleri ---
  const sales = await fetchAllPages<SaleRow>((from, to) =>
    supabase
      .from("sales")
      .select("order_date, status, item_total_cents, discount_cents, grand_total_cents")
      .eq("org_id", orgId)
      .gte("order_date", hist0)
      .order("id", { ascending: true })
      .range(from, to),
  ).catch((e: unknown) => {
    console.error("diagnostics sales:", e instanceof Error ? e.message : e);
    return [] as SaleRow[];
  });

  const live = sales.filter(
    (s) => s.status !== "cancelled" && s.status !== "refunded",
  );
  const rev = (s: SaleRow) => s.grand_total_cents || s.item_total_cents || 0;
  const inWindow = (s: SaleRow, from: string, to?: string) =>
    s.order_date >= from && (to ? s.order_date < to : true);

  const curSales = live.filter((s) => inWindow(s, cur0));
  const prevSales = live.filter((s) => inWindow(s, prev0, cur0));

  const ordersCur = curSales.length;
  const ordersPrev = prevSales.length;
  const revCur = curSales.reduce((a, s) => a + rev(s), 0);
  const revPrev = prevSales.reduce((a, s) => a + rev(s), 0);

  // İndirim oranı: son 30 gün vs geçmiş (30-365 gün) — bağımlılık sinyali.
  const discountRate = (rows: SaleRow[]): number | null => {
    const base = rows.reduce((a, s) => a + (s.item_total_cents || 0), 0);
    const disc = rows.reduce((a, s) => a + (s.discount_cents || 0), 0);
    if (base <= 0) return null;
    return disc / base;
  };
  const histSales = live.filter((s) => inWindow(s, hist0, cur0));
  const historicalRate = discountRate(histSales);
  const recentRate = discountRate(curSales);

  // --- Ürünler (tazelik + kapsam) ---
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
    (p) => now - new Date(p.created_at).getTime() <= 30 * DAY,
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

  // --- Reklam performansı (product_metrics) — kaçak tespiti ---
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
  for (const a of adRows) a.roas = a.spendCents > 0 ? a.revenueCents / a.spendCents : null;
  const adSpendTotal = adRows.reduce((a, r) => a + r.spendCents, 0);
  const adRevTotal = adRows.reduce((a, r) => a + r.revenueCents, 0);
  const adSorted = [...adRows].sort((a, b) => b.spendCents - a.spendCents);
  const topSpender = adSorted[0] ?? null;
  const concentrationPct =
    adSpendTotal > 0 && topSpender ? topSpender.spendCents / adSpendTotal : null;
  // Kaçak: ciddi harcama + zayıf getiri (ROAS < 1) ya da hiç sipariş yok.
  const leaks = adSorted.filter(
    (a) => a.spendCents >= Math.max(500, adSpendTotal * 0.15) &&
      ((a.roas != null && a.roas < 1) || a.orders === 0),
  );

  // --- Bekleyen SEO etiketleri (hazır aksiyon) ---
  let pendingSeoTags = 0;
  try {
    const { count } = await supabase
      .from("seo_tag_optimizations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .not("status", "in", "(pushed,rejected)");
    pendingSeoTags = count ?? 0;
  } catch {
    pendingSeoTags = 0;
  }

  // --- Ziyaret verisi (varsa) — trafik vs dönüşüm ayrımı ---
  const visitsCur = metricsVisits(metrics); // toplam (dönemsiz) — kaba
  const visits = visitsCur > 0 ? { current: visitsCur, previous: 0, changePct: null } : null;

  const currency = "USD";

  // --- Yaşam döngüsü sınıflandırması ---
  const hasHistory = histSales.length > 0;
  let lifecycle: Lifecycle;
  if (!hasHistory && newListings30d > 0 && ordersCur === 0) lifecycle = "young";
  else if (hasHistory && ordersCur === 0) lifecycle = "stalled";
  else if (ordersPrev > 0 && ordersCur / Math.max(1, ordersPrev) < 0.6)
    lifecycle = "declining";
  else if (!hasHistory && ordersCur === 0) lifecycle = "dormant";
  else lifecycle = "healthy";

  // --- Sinyaller (öncelik sırası) ---
  const signals: DiagnosticSignal[] = [];
  const pct = (n: number | null) =>
    n == null ? "—" : `${Math.round(n * 100)}%`;

  if (lifecycle === "stalled" || lifecycle === "declining") {
    signals.push({
      severity: "critical",
      title: "Satışlar düştü",
      detail: `Son 30 günde ${ordersCur} sipariş, önceki 30 günde ${ordersPrev}. Değişim: ${pct(
        pctChange(ordersCur, ordersPrev),
      )}.`,
      action:
        visits && visitsCur > 0
          ? "Ziyaret var ama sipariş yok → dönüşüm sorunu: fiyat, görsel, yorum, kargo."
          : "Önce trafik mi dönüşüm mü olduğunu netleştirin; Etsy Stats CSV'yi içe aktarın.",
      href: "/analizler/urunler/anahtar-kelime",
    });
  }

  if (leaks.length > 0) {
    const top = leaks[0];
    signals.push({
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
        "Bu listing(ler)in reklamını durdurun; bütçeyi dönüşen listinglere kaydırın. Yüksek tıklama/düşük sipariş = ilgi var ama fiyat/görsel/sayfa dönüştürmüyor.",
      href: "/reklamlar",
    });
  }

  if (historicalRate != null && historicalRate >= 0.2) {
    signals.push({
      severity: "warning",
      title: "İndirim bağımlılığı",
      detail: `Geçmiş satışların ortalama ${pct(historicalRate)} indirimle geldi; son 30 günde indirim oranı ${pct(
        recentRate,
      )}. İndirim kesilince alıcılar eski (indirimli) fiyata çıpalandığı için dönüşüm düşmüş olabilir.`,
      action:
        "İndirimi tek seferde kesmek yerine kademeli azaltın; ya da fiyatı indirimli seviyeye yakın yeniden konumlandırıp 'indirim' algısını kaldırın. Pazar konumunu kontrol edin.",
      href: "/analizler",
    });
  }

  if (lifecycle === "young") {
    signals.push({
      severity: "info",
      title: "Genç / yeniden kurulmuş mağaza",
      detail: `${activeProducts.length} aktif listing, son 30 günde ${newListings30d} yeni. Görünürlük yeni birikiyor; Etsy tazeliği ve otoriteyi zamanla ödüllendirir.`,
      action:
        "Düzenli yeni listing + tazeleme, güçlü anahtar kelimeler ve Etsy dışı trafik (Pinterest) ile rampayı hızlandırın. İlk satışlar/yorumlar sıralamayı açar.",
      href: "/tasarimlar",
    });
  }

  if (inactiveOrOOS > 0) {
    signals.push({
      severity: "warning",
      title: "Pasif / stoksuz listingler",
      detail: `${inactiveOrOOS} listing pasif, süresi dolmuş veya stoğu 0 — bunlar aramada görünmez.`,
      action: "Yeniden yayınlayın / stok girin; her aktif listing bir vitrindir.",
      href: "/tasarimlar/iyilestir",
    });
  }

  if (lowImageListings > 0) {
    signals.push({
      severity: "warning",
      title: "Az görselli listingler",
      detail: `${lowImageListings} aktif listing ${LOW_IMAGE_THRESHOLD}'ten az görsele sahip. Görsel sayısı dönüşümü doğrudan etkiler.`,
      action: "Her listinge en az 5-10 kaliteli görsel ekleyin.",
      href: "/tasarimlar/iyilestir",
    });
  }

  if (zeroViewListings > 0) {
    signals.push({
      severity: "info",
      title: "Hiç görüntülenmeyen listingler",
      detail: `${zeroViewListings} aktif listing henüz hiç görüntülenmemiş — başlık/etiket (anahtar kelime) hedeflemesi zayıf olabilir.`,
      action: "Başlık ve 13 etiketi alıcı dilinde, hedef anahtar kelimelerle güncelleyin.",
      href: "/seo-etiketleri",
    });
  }

  if (pendingSeoTags > 0) {
    signals.push({
      severity: "info",
      title: "Hazır SEO etiketi önerileri",
      detail: `${pendingSeoTags} listing için gönderilmeyi bekleyen etiket önerisi var (ücretsiz, hazır aksiyon).`,
      action: "SEO Etiketleri'nden önerileri gözden geçirip Etsy'ye gönderin; öncesi/sonrası ölçülür.",
      href: "/seo-etiketleri",
    });
  }

  if (signals.length === 0) {
    signals.push({
      severity: "good",
      title: "Belirgin bir sorun bulunamadı",
      detail: "Bu tanıda kritik bir durdurucu görünmüyor. Trafik verisi için Etsy Stats CSV içe aktarımı derinlik katar.",
    });
  }

  const headline = buildHeadline(lifecycle, ordersCur, ordersPrev);

  return {
    currency,
    lifecycle,
    headline,
    windowDays: 30,
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
    visits,
    verdict: resolveVerdict(ordersCur, ordersPrev, visits),
    ads: {
      spendCents: adSpendTotal,
      revenueCents: adRevTotal,
      roas: adSpendTotal > 0 ? adRevTotal / adSpendTotal : null,
      topSpenderTitle: topSpender?.title ?? null,
      concentrationPct,
      leaks,
    },
    discount: {
      historicalRatePct: historicalRate,
      recentRatePct: recentRate,
      dependent: historicalRate != null && historicalRate >= 0.2,
    },
    freshness: {
      activeListings: activeProducts.length,
      newListings30d,
      zeroViewListings,
      lowImageListings,
      inactiveOrOOS,
      pendingSeoTags,
    },
    signals,
  };
}

function metricsVisits(metrics: MetricRow[]): number {
  return metrics.reduce((a, m) => a + (m.views ?? 0), 0);
}

function resolveVerdict(
  ordersCur: number,
  ordersPrev: number,
  visits: { current: number } | null,
): SalesDiagnostics["verdict"] {
  const ordersDropped = ordersPrev > 0 && ordersCur / ordersPrev < 0.6;
  if (!visits) return ordersDropped ? "unknown" : "unknown";
  // Kaba: ziyaret verisi varsa ama sipariş düştüyse dönüşüm; ikisi de düştüyse trafik.
  if (ordersDropped && visits.current > 0) return "conversion";
  return "unknown";
}

function buildHeadline(
  lifecycle: Lifecycle,
  ordersCur: number,
  ordersPrev: number,
): string {
  switch (lifecycle) {
    case "young":
      return "Genç / yeniden kurulmuş mağaza — görünürlük yeni birikiyor.";
    case "stalled":
      return "Yerleşik mağaza, satışlar durdu — muhtemel dönüşüm/fiyat/reklam sorunu.";
    case "declining":
      return `Satışlar geriliyor (${ordersPrev} → ${ordersCur} sipariş).`;
    case "dormant":
      return "Mağaza hareketsiz — henüz satış geçmişi yok.";
    default:
      return "Mağaza sağlıklı görünüyor.";
  }
}
