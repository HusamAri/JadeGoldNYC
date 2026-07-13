import { createClient } from "@/lib/supabase/server";
import {
  getDataGaps,
  type AlertSeverity,
} from "@/lib/db/queries/data-gaps";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getMarketAlertCounts } from "@/lib/db/queries/market-alerts";

/**
 * UYARI MERKEZİ — sistemin HER yerindeki aksiyon gerektiren sinyalleri tek
 * yapıda toplar. "Neler yolunda gitmiyor?" için tek bakış noktası. Her uyarı
 * 3 önem derecesine ayrılır ve bedeline (etkiye) göre sıralanır:
 *
 *   kritik → para kaybı akıyor ya da sistem kırık (stok bitti, Etsy koptu,
 *            acil görev). ŞİMDİ aksiyon.
 *   onemli → performans/gelir aşınıyor (süresi dolmuş, pazar bandı dışı,
 *            olumsuz yorum, eksik gram, karar bekleyen soru).
 *   bilgi  → hijyen/bakım (bağlanabilir kalem, düşük öncelik).
 *
 * Yeni bir uyarı kaynağı eklemek = buraya bir `push` (uygun severity + bedel).
 * costCents: gelir-risk/etki tahmini (org para biriminde); sıralama bunu kullanır.
 */

export type { AlertSeverity };

export interface Alert {
  key: string;
  severity: AlertSeverity;
  title: string;
  hint: string;
  /** Etkilenen kayıt sayısı. */
  count: number;
  href: string;
  actionLabel: string;
  /** Tahmini gelir-risk/etki (cent, org para biriminde) — sıralama önceliği. */
  costCents: number | null;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  kritik: 0,
  onemli: 1,
  bilgi: 2,
};

export interface AlertCenter {
  alerts: Alert[];
  counts: Record<AlertSeverity, number>;
  total: number;
  /** costCents alanlarının para birimi (org varsayılanı). */
  currency: string;
}

/** Ürün-durumu uyarıları — durum başına başlık/hint/link (tek products
 *  sorgusundan hem sayı hem dondurulan gelir çıkar; kopya blok yok). */
const PRODUCT_STATUS_ALERTS: {
  status: "sold_out" | "expired";
  key: string;
  severity: AlertSeverity;
  title: (n: number) => string;
  hint: string;
  href: string;
  actionLabel: string;
}[] = [
  {
    status: "sold_out",
    key: "products_sold_out",
    severity: "kritik",
    title: (n) => `${n} ürün tükendi — şu an satılamıyor`,
    hint: "Stok bitince listing kapanıyor; müşteri o ürünü başka mağazadan alıyor ve Etsy sıralamanda geriliyorsun. Stok ekleyip yeniden yayınla, satışa geri dönsün.",
    href: "/tasarimlar?status=sold_out",
    actionLabel: "Tükenenleri gör",
  },
  {
    status: "expired",
    key: "products_expired",
    severity: "onemli",
    title: (n) => `${n} listing süresi doldu`,
    hint: "Süresi dolan ürün aramada hiç çıkmıyor — alıcılar seni bulamıyor, o listinge gelen trafik tamamen kesiliyor. Yenile, tekrar görünür olsun.",
    href: "/tasarimlar?status=expired",
    actionLabel: "Süresi dolanları gör",
  },
];

export async function getAlertCenter(orgId: string): Promise<AlertCenter> {
  const supabase = await createClient();

  const [gaps, etsy, marketCounts, orgRow, statusProducts, openInquiries, blockedAlgo, p0Tasks] =
    await Promise.all([
      getDataGaps(orgId),
      getEtsyStatus(orgId),
      // Bant dışı sayılar — görüntüleme limitinden bağımsız tam sayım.
      getMarketAlertCounts(orgId),
      // costCents'in para birimi: org varsayılanı.
      supabase
        .from("organizations")
        .select("default_currency")
        .eq("id", orgId)
        .maybeSingle(),
      // Stoğu biten/süresi dolan listingler — TEK sorgudan hem sayı hem
      // dondurulan potansiyel gelir (bedele göre sıralama için).
      supabase
        .from("products")
        .select("status, price_cents, currency")
        .eq("org_id", orgId)
        .in("status", PRODUCT_STATUS_ALERTS.map((s) => s.status)),
      // Karar bekleyen ekip soruları — open VE review: ilk yanıt soruyu
      // 'review'a taşır ama kapama/dallandırma kararı hâlâ bekler; yalnız
      // 'open' sayılsaydı ilk yanıt gelir gelmez uyarı sessizce kaybolurdu.
      supabase
        .from("metric_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .neq("status", "resolved"),
      // Algoritma engelli: fiyat/pazar algoritması eksik veriden (gram/rakip)
      // "belirsiz" kaldığı, araştırılmış aktif listingler.
      supabase
        .from("market_price_alerts")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("status", "active")
        .eq("price_position", "belirsiz"),
      // Acil görevler — org kilidi AÇIK (RLS'e ek): fonksiyonun orgId
      // sözleşmesi aktif-org varsayımına yaslanmasın.
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("priority", "P0")
        .neq("status", "done"),
    ]);

  // Sorgu hataları sessizce "her şey yolunda"ya dönüşmesin — logla.
  for (const [name, res] of [
    ["org", orgRow],
    ["products", statusProducts],
    ["inquiries", openInquiries],
    ["algo", blockedAlgo],
    ["tasks", p0Tasks],
  ] as const) {
    if (res.error) console.error(`[alert-center] ${name} sorgusu:`, res.error.message);
  }

  const currency =
    (orgRow.data as { default_currency: string | null } | null)?.default_currency ??
    "USD";

  // Durum başına sayı + dondurulan gelir (yalnız org para birimindeki fiyatlar
  // toplanır — farklı kurları tek sayıya karıştırmak yanıltıcı olur).
  const byStatus: Record<string, { count: number; sumCents: number }> = {};
  for (const p of (statusProducts.data ?? []) as {
    status: string;
    price_cents: number | null;
    currency: string | null;
  }[]) {
    const b = (byStatus[p.status] ??= { count: 0, sumCents: 0 });
    b.count += 1;
    if ((p.currency ?? currency) === currency) b.sumCents += p.price_cents ?? 0;
  }

  const alerts: Alert[] = [];

  // 1) Etsy bağlantısı sağlıksız → senkron durur, tüm veri bayatlar (KRİTİK).
  if (etsy.status !== "connected") {
    const wasConnected = etsy.status === "expired" || etsy.status === "revoked";
    alerts.push({
      key: "etsy_disconnected",
      severity: "kritik",
      title: wasConnected
        ? "Etsy bağlantısının süresi doldu — panel güncellenmiyor"
        : "Etsy bağlı değil — panel veri alamıyor",
      hint: wasConnected
        ? "Bağlantı düşünce yeni sipariş, stok ve fiyat verisi gelmiyor; ekranda gördüğün her şey giderek eskiyor ve yanlış kararlara yol açıyor. Yeniden bağla, veriler tazelensin."
        : "Mağaza bağlanana kadar sipariş, stok ve fiyat verisi akmıyor — panel boş/bayat kalır. Ayarlar'dan Etsy'yi bağla, her şey kendiliğinden dolsun.",
      count: 1,
      href: "/ayarlar/etsy",
      actionLabel: wasConnected ? "Yeniden bağlan" : "Etsy'yi bağla",
      costCents: null,
    });
  }

  // 2) Ürün durumu: stok bitti / süresi doldu — sayı + dondurulan gelir.
  for (const cfg of PRODUCT_STATUS_ALERTS) {
    const b = byStatus[cfg.status];
    if (!b || b.count === 0) continue;
    alerts.push({
      key: cfg.key,
      severity: cfg.severity,
      title: cfg.title(b.count),
      hint: cfg.hint,
      count: b.count,
      href: cfg.href,
      actionLabel: cfg.actionLabel,
      costCents: b.sumCents > 0 ? b.sumCents : null,
    });
  }

  // 3) Veri boşlukları (eksik gram, yanıtsız yorum, bağlanmamış kalem) —
  // severity gap'in kendisinden gelir (data-gaps.ts tek yerden karar verir).
  for (const g of gaps) {
    alerts.push({
      key: g.key,
      severity: g.severity,
      title: g.title,
      hint: g.hint,
      count: g.count,
      href: g.href,
      actionLabel: g.actionLabel,
      costCents: null,
    });
  }

  // 4) Pazar bandı dışı fiyat (pahalı/ucuz) → gelir/marj kaybı (ÖNEMLİ).
  if (marketCounts.total > 0) {
    const parts = [
      marketCounts.pahali > 0 ? `${marketCounts.pahali} pahalı` : null,
      marketCounts.ucuz > 0 ? `${marketCounts.ucuz} ucuz` : null,
    ].filter(Boolean);
    alerts.push({
      key: "market_price_position",
      severity: "onemli",
      title: `${marketCounts.total} listing rakip fiyat bandının dışında`,
      hint: `Gram fiyatına göre ${parts.join(" · ")}: pahalı olanlar satış kaçırıyor, ucuz olanlar hak ettiğin parayı masada bırakıyor. Aşağıdaki pazar uyarılarından tek tek karar ver.`,
      count: marketCounts.total,
      href: "/analizler/urunler",
      actionLabel: "Fiyatları gözden geçir",
      costCents: null,
    });
  }

  // 5) Algoritma engelli → eksik veriden fiyat/pazar önerisi üretilemiyor.
  const blockedCount = blockedAlgo.count ?? 0;
  if (blockedCount > 0) {
    alerts.push({
      key: "algo_blocked",
      severity: "onemli",
      title: `${blockedCount} üründe fiyat konumu hesaplanamıyor`,
      hint: "Araştırma yapıldı ama gram ya da rakip verisi eksik olduğu için pazar algoritması konum veremedi — bu ürünlerde şu an körlemesine fiyatlıyorsun. Eksik veriyi tamamla, otomatik fiyat önerileri devreye girsin.",
      count: blockedCount,
      href: "/tasarimlar",
      actionLabel: "Eksikleri tamamla",
      costCents: null,
    });
  }

  // 6) Karar bekleyen ekip soruları → aksiyon/oylama bekliyor (ÖNEMLİ).
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

  // 7) Acil (P0) açık görev → zamana duyarlı iş (KRİTİK).
  const p0Open = p0Tasks.count ?? 0;
  if (p0Open > 0) {
    alerts.push({
      key: "tasks_p0_open",
      severity: "kritik",
      title: `${p0Open} acil (P0) görev hâlâ açık`,
      hint: "En yüksek öncelikli işler bitmedi; her geçen gün satışı ve işleyişi doğrudan etkiliyor. Bitir, tıkanmayı aç.",
      count: p0Open,
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

  const counts: Record<AlertSeverity, number> = { kritik: 0, onemli: 0, bilgi: 0 };
  for (const a of alerts) counts[a.severity] += 1;

  return { alerts, counts, total: alerts.length, currency };
}
