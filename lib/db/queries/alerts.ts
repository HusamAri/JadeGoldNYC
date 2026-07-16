import { createClient } from "@/lib/supabase/server";
import {
  getDataGaps,
  type AlertSeverity,
} from "@/lib/db/queries/data-gaps";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getMarketAlertCounts } from "@/lib/db/queries/market-alerts";
import { getListingAuditSummary } from "@/lib/db/queries/listing-audit";
import { computeAdsSignals } from "@/lib/db/queries/ads-actions";

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

  // Olumsuz analiz pencereleri: son 30 gün vs önceki 30 gün.
  const now = Date.now();
  const iso30 = new Date(now - 30 * 86_400_000).toISOString();
  const iso60 = new Date(now - 60 * 86_400_000).toISOString();

  const [
    gaps,
    etsy,
    marketCounts,
    auditSummary,
    orgRow,
    statusProducts,
    openInquiries,
    blockedAlgo,
    p0Tasks,
    recentSales,
    son30Metrics,
    meltRows,
    lastShopSnapshot,
    lastManualMetric,
  ] = await Promise.all([
      getDataGaps(orgId),
      getEtsyStatus(orgId),
      // Bant dışı sayılar — görüntüleme limitinden bağımsız tam sayım.
      getMarketAlertCounts(orgId),
      // Listing denetimi: belgeli Etsy arama sinyalleri (tag/başlık/açıklama).
      getListingAuditSummary(orgId).catch((e) => {
        console.error("[alert-center] listing-audit:", e);
        return [];
      }),
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
        .is("archived_at", null)
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
      // Gelir düşüşü: son 60 günün satışları (iptal hariç) — JS'te iki 30
      // günlük pencereye bölünür (dashboard ile aynı gelir semantiği).
      supabase
        .from("sales")
        .select("order_date, grand_total_cents, item_total_cents")
        .eq("org_id", orgId)
        .neq("status", "cancelled")
        .gte("order_date", iso60),
      // Boşa reklam + düşük dönüşüm: aktif ürünlerin "son 30" dönem metrikleri.
      // Aynı etikete birden çok anlık görüntü olabilir — JS'te ürün başına en
      // güncel kayıt alınır (display-limit/çift sayım dersleri).
      supabase
        .from("product_metrics")
        .select(
          "product_id, created_at, views, orders, ads_spend_cents, ads_revenue_cents, products!inner(status)",
        )
        .eq("org_id", orgId)
        .eq("products.status", "active")
        .ilike("period_label", "%son 30%"),
      // Eritme-altı fiyat: PostgREST kolon-kolon kıyas yapamaz — dar satırlar
      // çekilip JS'te our_per_gram < melt_per_gram karşılaştırılır.
      supabase
        .from("market_price_alerts")
        .select("product_id, our_per_gram_cents, melt_per_gram_cents")
        .eq("org_id", orgId)
        .eq("status", "active")
        .not("our_per_gram_cents", "is", null)
        .not("melt_per_gram_cents", "is", null),
      // Veri tazeliği bekçisi: son günlük senkron fotoğrafı — cron kırılırsa
      // grafikler sessizce bayatlar; bunu Uyarı Merkezi flagler ("aksiyon
      // sinyali ana sayfada" kuralı; kimse Etsy senkron kartını izlemiyor).
      supabase
        .from("etsy_shop_snapshots")
        .select("snapshot_date")
        .eq("org_id", orgId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Manuel dönem metrikleri (analizler): en son kullanıcı girişi.
      supabase
        .from("shop_metrics")
        .select("created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // Sorgu hataları sessizce "her şey yolunda"ya dönüşmesin — logla.
  for (const [name, res] of [
    ["org", orgRow],
    ["products", statusProducts],
    ["inquiries", openInquiries],
    ["algo", blockedAlgo],
    ["tasks", p0Tasks],
    ["sales", recentSales],
    ["metrics", son30Metrics],
    ["melt", meltRows],
    ["snapshot", lastShopSnapshot],
    ["manualMetric", lastManualMetric],
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

  // 5b) Listing denetimi — belgeli Etsy arama sinyalleri (eksik tag, tekrarlı
  // başlık kelimesi, boş malzeme/açıklama…). Severity kontrolün kendisinden
  // gelir; Düzelt akışı yalnız etkilenen listingleri gösterir.
  for (const entry of auditSummary) {
    alerts.push({
      key: `listing_audit_${entry.key}`,
      severity: entry.severity,
      title: entry.title,
      hint: entry.hint,
      count: entry.count,
      href: "/tasarimlar/iyilestir",
      actionLabel: "İyileştirmeye git",
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

  // ── Olumsuz analiz sinyalleri: yalnız eksik veri değil, KÖTÜYE GİDEN her
  // metrik de merkezde flaglenir (gelir düşüşü, boşa reklam, zararına satış,
  // bakan-ama-almayan trafik). ──────────────────────────────────────────────

  // 7) Gelir düşüşü — son 30 gün vs önceki 30 gün (iptal hariç, dashboard
  // semantiği: grand_total || item_total).
  let rev30 = 0;
  let revPrev = 0;
  for (const s of (recentSales.data ?? []) as {
    order_date: string;
    grand_total_cents: number | null;
    item_total_cents: number | null;
  }[]) {
    const amt = s.grand_total_cents || s.item_total_cents || 0;
    if (s.order_date >= iso30) rev30 += amt;
    else revPrev += amt;
  }
  // Gürültü tabanı: önceki dönem en az $100 olsun; ≥%20 düşüş uyarı üretir.
  if (revPrev >= 10_000 && rev30 < revPrev * 0.8) {
    const dropPct = Math.round((1 - rev30 / revPrev) * 100);
    alerts.push({
      key: "revenue_decline",
      severity: dropPct >= 40 ? "kritik" : "onemli",
      title: `Gelir son 30 günde %${dropPct} düştü`,
      hint: "Bir önceki 30 güne göre satışlar belirgin geriledi — bu gidişle aylık ciro erimeye devam eder. Reklamları, fiyat konumunu ve stoğu birlikte gözden geçir; sebep genelde bu üçünden biri.",
      count: 1,
      href: "/analizler",
      actionLabel: "Analizlere git",
      costCents: revPrev - rev30,
    });
  }

  // 8) Boşa reklam + bakan-ama-almayan trafik — ürün başına EN GÜNCEL "son 30"
  // metriği (aynı etikete birden çok anlık görüntü olabilir; çift sayma).
  type MetricRow = {
    product_id: string | null;
    created_at: string;
    views: number | null;
    orders: number | null;
    ads_spend_cents: number | null;
    ads_revenue_cents: number | null;
  };
  const latestByProduct = new Map<string, MetricRow>();
  for (const m of ((son30Metrics.data ?? []) as unknown as MetricRow[]).sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  )) {
    if (m.product_id && !latestByProduct.has(m.product_id))
      latestByProduct.set(m.product_id, m);
  }
  let wastedAdsCount = 0;
  let wastedAdsCents = 0;
  let noConvCount = 0;
  for (const m of latestByProduct.values()) {
    const spend = m.ads_spend_cents ?? 0;
    if (spend > 0 && (m.ads_revenue_cents ?? 0) === 0) {
      wastedAdsCount += 1;
      wastedAdsCents += spend;
    }
    if ((m.views ?? 0) >= 100 && (m.orders ?? 0) === 0) noConvCount += 1;
  }
  if (wastedAdsCount > 0) {
    alerts.push({
      key: "ads_wasted",
      severity: "onemli",
      title: `${wastedAdsCount} üründe reklam parası boşa gidiyor`,
      hint: "Son 30 günde bu ürünlere reklam harcandı ama tek kuruş getiri yok — bütçe her gün eriyor. Reklamı durdur ya da listing'i (görsel/fiyat/başlık) düzeltip yeniden dene.",
      count: wastedAdsCount,
      href: "/analizler/urunler",
      actionLabel: "Reklamları gözden geçir",
      costCents: wastedAdsCents,
    });
  }
  // 8b) BÜTÇE YİYEN — tek ürün toplam reklam harcamasının ≥%35'ini çekiyor VE
  // ROAS < 1,5 (aynı son30 verisi yeniden kullanılır; yeni sorgu yok). Kural
  // ve eşikler reklam motorundan gelir (ads-actions.ts — tek kaynak); boşa
  // harcayanlar (getiri=0) zaten ads_wasted'da, motor onları burada saymaz.
  const budgetEaters = computeAdsSignals(
    [...latestByProduct.entries()].map(([productId, mm]) => ({
      productId,
      spendCents: mm.ads_spend_cents ?? 0,
      adsRevenueCents: mm.ads_revenue_cents ?? 0,
    })),
  ).filter((s) => s.signal === "butce_yiyen");
  if (budgetEaters.length > 0) {
    const top = budgetEaters[0]; // harcamaya göre sıralı gelir
    alerts.push({
      key: "ads_budget_eater",
      severity: "onemli",
      title:
        budgetEaters.length === 1
          ? `Bir ürün reklam bütçesinin %${Math.round(top.share * 100)}'ini tek başına yiyor`
          : `${budgetEaters.length} ürün reklam bütçesini tek başına yiyor`,
      hint: "Harcamanın büyük payı tek listingde toplanmış ama getirisi harcamayı karşılamıyor (ROAS < 1,5) — bütçe diğer ürünlere dağılamıyor ve her gün eriyor. Reklamlar sayfasında azalt/incele kararını ver; uygulamayı Etsy Reklam panosunda elle yap.",
      count: budgetEaters.length,
      href: "/reklamlar",
      actionLabel: "Reklam kararını ver",
      costCents: budgetEaters.reduce((s, b) => s + b.row.spendCents, 0),
    });
  }
  if (noConvCount > 0) {
    alerts.push({
      key: "views_no_orders",
      severity: "onemli",
      title: `${noConvCount} ürün çok bakılıyor ama hiç satmıyor`,
      hint: "Son 30 günde 100+ görüntülemeye rağmen sıfır sipariş — alıcı geliyor, dönüşmüyor. Fiyat, ilk görsel ya da kargo süresi caydırıyor olabilir; bu üçünü test et.",
      count: noConvCount,
      href: "/analizler/urunler",
      actionLabel: "Ürünleri incele",
      costCents: null,
    });
  }

  // 9) Eritme-altı fiyat → hurda değerinin altında satış = garanti zarar (KRİTİK).
  const meltBelow = (
    (meltRows.data ?? []) as {
      our_per_gram_cents: number | null;
      melt_per_gram_cents: number | null;
    }[]
  ).filter(
    (r) =>
      r.our_per_gram_cents != null &&
      r.melt_per_gram_cents != null &&
      r.our_per_gram_cents < r.melt_per_gram_cents,
  ).length;
  if (meltBelow > 0) {
    alerts.push({
      key: "below_melt",
      severity: "kritik",
      title: `${meltBelow} ürün eritme değerinin ALTINDA satılıyor`,
      hint: "Gram fiyatı altının hurda değerinin bile altında — her satış garantili zarar. Bu fiyatları bugün düzelt.",
      count: meltBelow,
      href: "/analizler/urunler",
      actionLabel: "Fiyatları düzelt",
      costCents: null,
    });
  }

  // 9b) Veri tazeliği bekçisi — güncellenmeyen veri sessiz kalmasın.
  // Günlük senkron fotoğrafı 2+ gün eskiyse cron/senkron kırık demektir
  // (bağlantı sağlıklı görünse bile): grafikler ve karşılaştırmalar bayat
  // veriyle karar verdirir. Yalnız bağlı org'da anlamlı.
  if (etsy.status === "connected") {
    const snapDate = (lastShopSnapshot.data as { snapshot_date: string } | null)
      ?.snapshot_date;
    const snapAgeDays = snapDate
      ? Math.floor((now - new Date(snapDate).getTime()) / 86_400_000)
      : null;
    if (snapAgeDays == null || snapAgeDays >= 2) {
      alerts.push({
        key: "sync_snapshot_stale",
        severity: "kritik",
        title:
          snapAgeDays == null
            ? "Günlük senkron fotoğrafı hiç yok — trendler boş"
            : `Günlük senkron ${snapAgeDays} gündür çalışmamış`,
        hint: "Görüntülenme/sağlık grafikleri son fotoğrafta donmuş durumda — bayat veriyle karar veriyorsun ve boşluk geriye dönük doldurulamıyor. Etsy senkronunu elle tetikle; düzelmiyorsa cron/bağlantıyı kontrol et.",
        count: 1,
        href: "/ayarlar/etsy",
        actionLabel: "Senkronu tetikle",
        costCents: null,
      });
    }
  }
  // Manuel dönem metrikleri 30+ gündür girilmemişse karşılaştırma kartları
  // (dönüşüm, sepette terk…) eski dönemi "güncel" gibi gösterir (BİLGİ).
  {
    const lastManual = (lastManualMetric.data as { created_at: string } | null)
      ?.created_at;
    const manualAgeDays = lastManual
      ? Math.floor((now - new Date(lastManual).getTime()) / 86_400_000)
      : null;
    if (manualAgeDays != null && manualAgeDays >= 30) {
      alerts.push({
        key: "manual_metrics_stale",
        severity: "bilgi",
        title: `Manuel dönem metrikleri ${manualAgeDays} gündür güncellenmedi`,
        hint: "Analizler'deki dönüşüm/sepette terk kartları en son girilen dönemi 'güncel' diye gösteriyor — yeni dönem fotoğrafını gir ki karşılaştırmalar bugünü anlatsın.",
        count: 1,
        href: "/analizler",
        actionLabel: "Yeni dönem gir",
        costCents: null,
      });
    }
  }

  // 10) Acil (P0) açık görev → zamana duyarlı iş (KRİTİK).
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
