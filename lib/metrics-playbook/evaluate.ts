import type { ShopMetric, ProductMetric } from "@/lib/types";
import {
  PLAYBOOK,
  type PlaybookScenario,
  type ScenarioSeverity,
} from "@/lib/metrics-playbook/playbook";

export type ScenarioStatus = "triggered" | "ok" | "no-data";

export interface ScenarioResult {
  scenario: PlaybookScenario;
  status: ScenarioStatus;
  severity: ScenarioSeverity;
  /** Tetiklendiyse/veri eksikse hesaplanan sayılarla kısa açıklama */
  detail: string;
  /** Listing bazlı senaryolarda etkilenen ürün başlıkları */
  affected?: string[];
  /** Ekip yanıtlarından bu senaryoya çatallanan soruların sonuç notları */
  branchNotes?: { fromTitle: string; note: string }[];
}

/** Çatallanan soru → hedef senaryo bağı (soru başlığı + sonuç notu). */
export interface ScenarioBranch {
  scenarioId: string;
  fromTitle: string;
  note: string;
}

/**
 * Çatallanmış sorulardan son `days` gün içindekileri senaryo bağına çevirir
 * (bileşen dışında — tarih okuması saf-olmayan olduğundan burada yaşar).
 */
export function collectRecentBranches(
  inquiries: {
    title: string;
    createdAt: string;
    branchedToScenario: string | null;
    branchNote: string | null;
  }[],
  days = 30,
): ScenarioBranch[] {
  const cutoff = Date.now() - days * 86_400_000;
  return inquiries
    .filter(
      (i) =>
        i.branchedToScenario &&
        i.branchNote &&
        new Date(i.createdAt).getTime() >= cutoff,
    )
    .map((i) => ({
      scenarioId: i.branchedToScenario!,
      fromTitle: i.title,
      note: i.branchNote!,
    }));
}

function pct(n: number): string {
  return `%${(n * 100).toFixed(1)}`;
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Ön-simüle senaryo matrisini gerçek panel verisiyle değerlendirir.
 * cur = en güncel dönem, prev = bir önceki (period_end sırasıyla).
 * Kural: analiz penceresi ≥30 gün varsayımıyla dönem karşılaştırması yapılır
 * (Handbook: "en az 30 güne bak, 2 haftada bir gözden geçir").
 */
export function evaluatePlaybook(input: {
  metrics: ShopMetric[]; // period_end desc sıralı
  productMetrics: ProductMetric[]; // en güncel dönemin satırları
  /** Etsy API günlük mağaza fotoğrafları (en yeni önce) — puan/tatil için */
  shopSnapshots?: {
    reviewAverage: number | null;
    isVacation: boolean | null;
    snapshotDate: string;
  }[];
  /** Ekip yanıtlarından çatallanan senaryolar — durumu zorla tetikler */
  branches?: ScenarioBranch[];
  now?: Date;
}): ScenarioResult[] {
  const { metrics, productMetrics } = input;
  const now = input.now ?? new Date();
  const cur = metrics[0] ?? null;
  const prev = metrics[1] ?? null;

  const byId = new Map(PLAYBOOK.map((s) => [s.id, s]));
  const results: ScenarioResult[] = [];
  const push = (
    id: string,
    status: ScenarioStatus,
    detail: string,
    affected?: string[],
  ) => {
    const scenario = byId.get(id);
    if (!scenario) return;
    results.push({
      scenario,
      status,
      severity: scenario.severity,
      detail,
      affected,
    });
  };

  // --- Dönem verisi tazeliği ---
  const staleDays = cur?.period_end
    ? Math.floor(
        (now.getTime() - new Date(cur.period_end).getTime()) / 86_400_000,
      )
    : null;
  if (!cur || (staleDays !== null && staleDays > 45)) {
    push(
      "no-shop-metrics",
      "triggered",
      cur
        ? `Son dönem ${staleDays} gün önce bitti — taze veri gir.`
        : "Hiç mağaza metriği girilmemiş.",
    );
  } else {
    push("no-shop-metrics", "ok", `Son dönem: ${cur.period_label}.`);
  }

  // --- Dönüşüm ---
  const cr = (m: ShopMetric | null) =>
    m?.visits && m.visits > 0 && m.orders != null ? m.orders / m.visits : null;
  const curCr = cr(cur);
  const prevCr = cr(prev);
  if (curCr == null) {
    push("conversion-drop", "no-data", "Ziyaret/sipariş verisi eksik.");
    push("low-conversion", "no-data", "Ziyaret/sipariş verisi eksik.");
  } else {
    if (prevCr != null && prevCr > 0) {
      const change = (curCr - prevCr) / prevCr;
      if (change < -0.2) {
        push(
          "conversion-drop",
          "triggered",
          `Dönüşüm ${pct(prevCr)} → ${pct(curCr)} (${pct(change)} değişim).`,
        );
      } else {
        push(
          "conversion-drop",
          "ok",
          `Dönüşüm ${pct(curCr)} (önceki ${pct(prevCr)}).`,
        );
      }
    } else {
      push(
        "conversion-drop",
        "no-data",
        "Karşılaştırma için ikinci dönem gerekli.",
      );
    }
    if ((cur?.visits ?? 0) >= 100 && curCr < 0.01) {
      push(
        "low-conversion",
        "triggered",
        `Dönüşüm ${pct(curCr)} — %1 bandının altında (${cur?.visits} ziyaret, ${cur?.orders} sipariş).`,
      );
    } else {
      push("low-conversion", "ok", `Dönüşüm ${pct(curCr)}.`);
    }
  }

  // --- Ziyaret düşüşü ---
  if (cur?.visits != null && prev?.visits != null && prev.visits > 0) {
    const change = (cur.visits - prev.visits) / prev.visits;
    if (change < -0.2) {
      push(
        "visits-drop",
        "triggered",
        `Ziyaret ${prev.visits} → ${cur.visits} (${pct(change)}).`,
      );
    } else {
      push("visits-drop", "ok", `Ziyaret ${cur.visits} (${pct(change)}).`);
    }
  } else {
    push("visits-drop", "no-data", "İki dönemlik ziyaret verisi gerekli.");
  }

  // --- Reklam ROAS ---
  const spend = cur?.ads_spend_cents ?? 0;
  const adsRev = cur?.ads_revenue_cents ?? 0;
  if (spend > 0) {
    const roas = adsRev / spend;
    const roasTxt = `ROAS ${roas.toFixed(1)}x (harcama ${money(spend)}, gelir ${money(adsRev)}).`;
    if (roas < 2 && spend >= 30_00) {
      push("ads-losing", "triggered", roasTxt);
      push("ads-gray", "ok", roasTxt);
      push("ads-scale", "ok", roasTxt);
    } else if (roas >= 2 && roas < 3) {
      push("ads-losing", "ok", roasTxt);
      push("ads-gray", "triggered", roasTxt + " Marj kararı gerekli.");
      push("ads-scale", "ok", roasTxt);
    } else if (roas >= 5) {
      push("ads-losing", "ok", roasTxt);
      push("ads-gray", "ok", roasTxt);
      push("ads-scale", "triggered", roasTxt + " Ölçekleme fırsatı.");
    } else {
      push("ads-losing", "ok", roasTxt);
      push("ads-gray", "ok", roasTxt);
      push("ads-scale", "ok", roasTxt + " Hedef bantta (3-5x).");
    }
  } else {
    push("ads-losing", "no-data", "Reklam harcaması girilmemiş.");
    push("ads-gray", "no-data", "Reklam harcaması girilmemiş.");
    push("ads-scale", "no-data", "Reklam harcaması girilmemiş.");
  }

  // --- Sepet terki ---
  if (cur?.cart_abandon_count != null && cur.orders != null) {
    const denom = cur.orders + cur.cart_abandon_count;
    const rate = denom > 0 ? cur.cart_abandon_count / denom : 0;
    const amountShare =
      cur.revenue_cents && cur.cart_abandon_amount_cents
        ? cur.cart_abandon_amount_cents / cur.revenue_cents
        : null;
    if (rate > 0.7 || (amountShare != null && amountShare > 0.3)) {
      push(
        "cart-abandon-high",
        "triggered",
        `Terk oranı ${pct(rate)}${amountShare != null ? `, tutar cironun ${pct(amountShare)}'i` : ""}.`,
      );
    } else {
      push("cart-abandon-high", "ok", `Terk oranı ${pct(rate)}.`);
    }
  } else {
    push("cart-abandon-high", "no-data", "Sepet terki verisi girilmemiş.");
  }

  // --- Puan --- (öncelik: Etsy API günlük fotoğrafı; yedek: manuel dönem)
  const snaps = input.shopSnapshots ?? [];
  const apiRating = snaps.find((s) => s.reviewAverage != null)?.reviewAverage;
  const apiPrevRating = snaps
    .slice(1)
    .find((s) => s.reviewAverage != null)?.reviewAverage;
  const rating = apiRating ?? cur?.rating ?? null;
  const prevRating = apiRating != null ? (apiPrevRating ?? null) : (prev?.rating ?? null);
  const ratingSrc = apiRating != null ? "Etsy API" : "manuel dönem";
  if (rating != null) {
    const dropped = prevRating != null && rating < prevRating;
    if (rating < 4.8 || dropped) {
      push(
        "rating-drop",
        "triggered",
        `Puan ${rating}${prevRating != null ? ` (önceki ${prevRating})` : ""} — Star Seller eşiği 4.8 (${ratingSrc}).`,
      );
    } else {
      push("rating-drop", "ok", `Puan ${rating} (${ratingSrc}).`);
    }
  } else {
    push("rating-drop", "no-data", "Puan verisi yok (senkron/dönem bekleniyor).");
  }

  // --- Tatil modu (yalnız API bilir) ---
  const latestSnap = snaps[0] ?? null;
  if (latestSnap == null) {
    push("vacation-mode", "no-data", "Mağaza fotoğrafı yok — ilk senkron bekleniyor.");
  } else if (latestSnap.isVacation) {
    push(
      "vacation-mode",
      "triggered",
      `Etsy API'ye göre mağaza tatil modunda (${latestSnap.snapshotDate}).`,
    );
  } else {
    push("vacation-mode", "ok", "Mağaza açık.");
  }

  // --- Trafik yoğunlaşması ---
  const ts = cur?.traffic_sources ?? null;
  if (ts && Object.keys(ts).length > 0) {
    const total = Object.values(ts).reduce((a, b) => a + (b ?? 0), 0);
    if (total > 0) {
      const [topName, topVal] = Object.entries(ts).sort(
        (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
      )[0];
      const share = (topVal ?? 0) / total;
      if (share > 0.8) {
        push(
          "traffic-concentration",
          "triggered",
          `"${topName}" tek başına ${pct(share)} — tek kanala bağımlılık.`,
        );
      } else {
        push(
          "traffic-concentration",
          "ok",
          `En büyük kaynak "${topName}" ${pct(share)}.`,
        );
      }
    } else {
      push("traffic-concentration", "no-data", "Trafik kaynakları boş.");
    }
  } else {
    push("traffic-concentration", "no-data", "Trafik kaynakları girilmemiş.");
  }

  // --- Ciro düşüşü (trafik/dönüşüm sabitken) ---
  if (
    cur?.revenue_cents != null &&
    prev?.revenue_cents != null &&
    prev.revenue_cents > 0
  ) {
    const revChange = (cur.revenue_cents - prev.revenue_cents) / prev.revenue_cents;
    const visitsStable =
      cur.visits != null && prev.visits != null && prev.visits > 0
        ? Math.abs((cur.visits - prev.visits) / prev.visits) < 0.1
        : false;
    const crStable =
      curCr != null && prevCr != null && prevCr > 0
        ? Math.abs((curCr - prevCr) / prevCr) < 0.1
        : false;
    if (revChange < -0.15 && visitsStable && crStable) {
      push(
        "revenue-drop-stable-traffic",
        "triggered",
        `Ciro ${money(prev.revenue_cents)} → ${money(cur.revenue_cents)} (${pct(revChange)}) — trafik/dönüşüm sabit, AOV düşüyor.`,
      );
    } else {
      push(
        "revenue-drop-stable-traffic",
        "ok",
        `Ciro değişimi ${pct(revChange)}.`,
      );
    }
  } else {
    push(
      "revenue-drop-stable-traffic",
      "no-data",
      "İki dönemlik ciro verisi gerekli.",
    );
  }

  // --- Listing bazlı ---
  if (productMetrics.length > 0) {
    const viewsNoOrders = productMetrics.filter(
      (p) => (p.views ?? 0) >= 50 && (p.orders ?? 0) === 0,
    );
    if (viewsNoOrders.length > 0) {
      push(
        "product-views-no-orders",
        "triggered",
        `${viewsNoOrders.length} listing 50+ görüntülenmeye rağmen sipariş almadı.`,
        viewsNoOrders.slice(0, 8).map((p) => p.product_title),
      );
    } else {
      push("product-views-no-orders", "ok", "Tüm yoğun listingler satıyor.");
    }
    const lowViews = productMetrics.filter((p) => (p.views ?? 0) < 10);
    if (lowViews.length > 0) {
      push(
        "product-low-views",
        "triggered",
        `${lowViews.length} listing dönemde 10'dan az görüntülendi.`,
        lowViews.slice(0, 8).map((p) => p.product_title),
      );
    } else {
      push("product-low-views", "ok", "Tüm listingler görünürlük alıyor.");
    }
  } else {
    push("product-views-no-orders", "no-data", "Listing metriği girilmemiş.");
    push("product-low-views", "no-data", "Listing metriği girilmemiş.");
  }

  // ÇATALLANMA: ekip yanıtları bir senaryoya işaret ettiyse, veri onu
  // tetiklemese bile senaryo tetiklenmiş sayılır — sonuç yorumları karta
  // işlenir (soru başlığı + not). Veri zaten tetiklediyse notlar eklenir.
  for (const b of input.branches ?? []) {
    const r = results.find((x) => x.scenario.id === b.scenarioId);
    if (!r) continue;
    r.branchNotes = [
      ...(r.branchNotes ?? []),
      { fromTitle: b.fromTitle, note: b.note },
    ];
    if (r.status !== "triggered") {
      r.status = "triggered";
      r.detail = `Ekip yanıtlarıyla çatallandı (veri tetiklemedi): ${r.detail}`;
    }
  }

  // Sıra: tetiklenen kritik → tetiklenen uyarı → veri eksik → ok
  const sevRank: Record<ScenarioSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  const statusRank: Record<ScenarioStatus, number> = {
    triggered: 0,
    "no-data": 1,
    ok: 2,
  };
  results.sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      sevRank[a.severity] - sevRank[b.severity],
  );
  return results;
}
