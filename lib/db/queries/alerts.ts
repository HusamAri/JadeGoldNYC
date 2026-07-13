import { createClient } from "@/lib/supabase/server";
import { getDataGaps } from "@/lib/db/queries/data-gaps";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getMarketPriceAlerts } from "@/lib/db/queries/market-alerts";
import { getTaskSummary } from "@/lib/db/queries/tasks";

/**
 * UYARI MERKEZİ — sistemin HER yerindeki aksiyon gerektiren sinyalleri tek
 * yapıda toplar. "Neler yolunda gitmiyor?" için tek bakış noktası. Her uyarı
 * 3 önem derecesine ayrılır ve bedeline (etkiye) göre sıralanır:
 *
 *   kritik → para kaybı akıyor ya da sistem kırık (stok bitti, Etsy koptu,
 *            eritme altı fiyat, acil görev). ŞİMDİ aksiyon.
 *   onemli → performans/gelir aşınıyor (süresi dolmuş, pazar bandı dışı,
 *            olumsuz yorum, eksik gram, karar bekleyen soru).
 *   bilgi  → hijyen/bakım (bağlanabilir kalem, düşük öncelik).
 *
 * Yeni bir uyarı kaynağı eklemek = buraya bir `push` (uygun severity + bedel).
 * costCents: gelir-risk/etki tahmini; sıralama bedele göre bunu kullanır.
 */

export type AlertSeverity = "kritik" | "onemli" | "bilgi";

export interface Alert {
  key: string;
  severity: AlertSeverity;
  title: string;
  hint: string;
  /** Etkilenen kayıt sayısı. */
  count: number;
  href: string;
  actionLabel: string;
  /** Tahmini gelir-risk/etki (cent) — sıralama önceliği; yoksa null. */
  costCents: number | null;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  kritik: 0,
  onemli: 1,
  bilgi: 2,
};

/** Veri-boşluğu türlerini önem derecesine eşler (data-gaps.ts key'leri). */
const GAP_SEVERITY: Record<string, AlertSeverity> = {
  products_sold_out: "kritik",
  products_expired: "onemli",
  variant_weights: "onemli",
  reviews_reply: "onemli",
  sale_items_unlinked: "bilgi",
};

export interface AlertCenter {
  alerts: Alert[];
  counts: Record<AlertSeverity, number>;
  total: number;
}

export async function getAlertCenter(orgId: string): Promise<AlertCenter> {
  const supabase = await createClient();

  const [gaps, etsy, market, tasks, revRisk, openInquiries, blockedAlgo] =
    await Promise.all([
      getDataGaps(orgId),
      getEtsyStatus(orgId),
      getMarketPriceAlerts(orgId, 50),
      getTaskSummary(),
      // Stoğu biten/süresi dolan listinglerin dondurduğu potansiyel gelir (bedel).
      supabase
        .from("products")
        .select("status, price_cents")
        .eq("org_id", orgId)
        .in("status", ["sold_out", "expired"]),
      // Karar bekleyen ekip soruları (metric_inquiries open) — aksiyon gerektirir.
      supabase
        .from("metric_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("status", "open"),
      // Algoritma engelli: fiyat/pazar algoritması eksik veriden (gram/rakip)
      // "belirsiz" kaldığı aktif listingler — otomatik öneri üretemiyor.
      supabase
        .from("market_price_alerts")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("status", "active")
        .eq("price_position", "belirsiz"),
    ]);

  // Gelir-risk: sold_out / expired için fiyat toplamı (bedele göre sıralama).
  const risk: Record<string, number> = { sold_out: 0, expired: 0 };
  for (const p of (revRisk.data ?? []) as {
    status: string;
    price_cents: number | null;
  }[]) {
    if (p.status in risk) risk[p.status] += p.price_cents ?? 0;
  }

  const alerts: Alert[] = [];

  // 1) Etsy bağlantısı kopuk → senkron durur, tüm veri bayatlar (KRİTİK).
  if (etsy.status !== "connected") {
    alerts.push({
      key: "etsy_disconnected",
      severity: "kritik",
      title: "Etsy bağlantısı koptu — panel güncellenmiyor",
      hint: "Bağlantı kopunca yeni sipariş, stok ve fiyat verisi gelmiyor; ekranda gördüğün her şey giderek eskiyor ve yanlış kararlara yol açıyor. Yeniden bağla, veriler tazelensin.",
      count: 1,
      href: "/ayarlar/etsy",
      actionLabel: "Yeniden bağlan",
      costCents: null,
    });
  }

  // 2) Veri boşlukları (stok bitti, süresi doldu, eksik gram, yorum, kalem).
  for (const g of gaps) {
    const severity = GAP_SEVERITY[g.key] ?? "bilgi";
    const costCents =
      g.key === "products_sold_out"
        ? risk.sold_out
        : g.key === "products_expired"
          ? risk.expired
          : null;
    alerts.push({
      key: g.key,
      severity,
      title: g.title,
      hint: g.hint,
      count: g.count,
      href: g.href,
      actionLabel: g.actionLabel,
      costCents,
    });
  }

  // 3) Pazar bandı dışı fiyat (pahalı/ucuz) → gelir/marj kaybı (ÖNEMLİ).
  if (market.length > 0) {
    const pahali = market.filter((m) => m.price_position === "pahali").length;
    const ucuz = market.length - pahali;
    const parts = [
      pahali > 0 ? `${pahali} pahalı` : null,
      ucuz > 0 ? `${ucuz} ucuz` : null,
    ].filter(Boolean);
    alerts.push({
      key: "market_price_position",
      severity: "onemli",
      title: `${market.length} listing rakip fiyat bandının dışında`,
      hint: `Gram fiyatına göre ${parts.join(" · ")}: pahalı olanlar satış kaçırıyor, ucuz olanlar hak ettiğin parayı masada bırakıyor. Fiyatları gözden geçir, kazancı topla.`,
      count: market.length,
      href: "/analizler/urunler",
      actionLabel: "Fiyatları gözden geçir",
      costCents: null,
    });
  }

  // 3b) Algoritma engelli → eksik veriden dolayı fiyat/pazar önerisi üretilemiyor.
  const blockedCount = blockedAlgo.count ?? 0;
  if (blockedCount > 0) {
    alerts.push({
      key: "algo_blocked",
      severity: "onemli",
      title: `${blockedCount} üründe fiyat konumu hesaplanamıyor`,
      hint: "Gram ya da rakip verisi eksik olduğu için pazar algoritması bu ürünlere konum veremiyor — şu an körlemesine fiyatlıyorsun. Eksik veriyi tamamla, otomatik fiyat önerileri devreye girsin.",
      count: blockedCount,
      href: "/tasarimlar",
      actionLabel: "Eksikleri tamamla",
      costCents: null,
    });
  }

  // 4) Karar bekleyen ekip soruları → aksiyon/oylama bekliyor (ÖNEMLİ).
  const inquiryCount = openInquiries.count ?? 0;
  if (inquiryCount > 0) {
    alerts.push({
      key: "inquiries_open",
      severity: "onemli",
      title: `${inquiryCount} ekip sorusu karar bekliyor`,
      hint: "Bu kararlar verilmeden bağlı işler başlayamıyor — ekip burada bekliyor. Soruları yanıtla, tıkanan işleri aç.",
      count: inquiryCount,
      href: "/analizler",
      actionLabel: "Soruları gör",
      costCents: null,
    });
  }

  // 5) Acil (P0) açık görev → zamana duyarlı iş (KRİTİK).
  if (tasks.p0Open > 0) {
    alerts.push({
      key: "tasks_p0_open",
      severity: "kritik",
      title: `${tasks.p0Open} acil (P0) görev hâlâ açık`,
      hint: "En yüksek öncelikli işler bitmedi; her geçen gün satışı ve işleyişi doğrudan etkiliyor. Bitir, tıkanmayı aç.",
      count: tasks.p0Open,
      href: "/gorevler",
      actionLabel: "Görevlere git",
      costCents: null,
    });
  }

  alerts.sort((a, b) => {
    const r = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (r !== 0) return r;
    // Aynı derecede: bedele (gelir-risk) göre, sonra adete göre.
    const ca = a.costCents ?? -1;
    const cb = b.costCents ?? -1;
    if (cb !== ca) return cb - ca;
    return b.count - a.count;
  });

  const counts: Record<AlertSeverity, number> = {
    kritik: alerts.filter((a) => a.severity === "kritik").length,
    onemli: alerts.filter((a) => a.severity === "onemli").length,
    bilgi: alerts.filter((a) => a.severity === "bilgi").length,
  };

  return { alerts, counts, total: alerts.length };
}
