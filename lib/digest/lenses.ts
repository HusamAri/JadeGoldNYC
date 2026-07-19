/**
 * Günlük özet “lens” yardımcıları — admin client ile (cron/önizleme).
 * Mevcut tablolardan: reklam metrikleri, pazar fiyat, listing ilgilenme,
 * audit’ten ekip varlığı (oturum süresi yaklaşık).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatMoney } from "@/lib/money";

const CONFIDENCE_W = { yuksek: 3, orta: 2, dusuk: 1 } as const;

/** Sistem / cron gürültüsü — “Neler oldu”ya girmez. */
export const DIGEST_SYSTEM_ACTIONS = new Set([
  "etsy.sync",
  "etsy.reconcile",
  "digest.daily_sent",
  "auth.logout",
]);

export const DIGEST_SYSTEM_SOURCES = new Set([
  "cron",
  "system",
  "digest",
  "webhook",
]);

export type AuditPresenceRow = {
  created_at: string;
  summary: string | null;
  source: string | null;
  action: string | null;
  actor_id: string | null;
  actor_label: string | null;
};

export function isHumanAuditRow(row: AuditPresenceRow): boolean {
  if (!row.actor_id) return false;
  const action = (row.action ?? "").toLowerCase();
  if (DIGEST_SYSTEM_ACTIONS.has(action)) return false;
  if (action.startsWith("digest.")) return false;
  const source = (row.source ?? "").toLowerCase();
  if (DIGEST_SYSTEM_SOURCES.has(source)) return false;
  return true;
}

export function formatHumanActivitySummary(row: AuditPresenceRow): string {
  const who = (row.actor_label ?? "Üye").trim() || "Üye";
  const what = (row.summary ?? row.action ?? "işlem").trim();
  return `${who} · ${what}`;
}

/**
 * Audit zaman damgalarından yaklaşık panel süresi.
 * Aynı kişide 20 dk+ boşluk = yeni oturum; son aksiyona +2 dk pad.
 */
export function estimatePanelPresence(
  rows: AuditPresenceRow[],
  gapMs = 20 * 60 * 1000,
): {
  actorKey: string;
  name: string;
  minutes: number;
  events: number;
}[] {
  const byActor = new Map<string, { name: string; times: number[] }>();
  for (const r of rows) {
    if (!isHumanAuditRow(r)) continue;
    const key = r.actor_id!;
    const t = Date.parse(r.created_at);
    if (!Number.isFinite(t)) continue;
    const cur = byActor.get(key) ?? {
      name: (r.actor_label ?? "Üye").trim() || "Üye",
      times: [],
    };
    if (r.actor_label?.trim()) cur.name = r.actor_label.trim();
    cur.times.push(t);
    byActor.set(key, cur);
  }

  const out: {
    actorKey: string;
    name: string;
    minutes: number;
    events: number;
  }[] = [];

  for (const [actorKey, { name, times }] of byActor) {
    times.sort((a, b) => a - b);
    let ms = 0;
    let sessionStart = times[0]!;
    let prev = times[0]!;
    for (let i = 1; i < times.length; i++) {
      const t = times[i]!;
      if (t - prev > gapMs) {
        ms += prev - sessionStart + 2 * 60 * 1000;
        sessionStart = t;
      }
      prev = t;
    }
    ms += prev - sessionStart + 2 * 60 * 1000;
    const minutes = Math.max(1, Math.round(ms / 60_000));
    out.push({ actorKey, name, minutes, events: times.length });
  }

  out.sort((a, b) => b.minutes - a.minutes || b.events - a.events);
  return out;
}

export type PriceTipRaw = {
  product_id: string;
  title: string;
  price_position: "pahali" | "ucuz";
  deviation_pct: number | null;
  confidence: "yuksek" | "orta" | "dusuk" | null;
  our_price_cents: number | null;
  suggested_price_cents: number | null;
  recommendation: string | null;
  researched_at: string;
  valueScore: number;
};

/** En değerli 5 fiyat önerisi — sapma × güven × fiyat farkı. */
export async function collectTopPriceTips(
  admin: SupabaseClient,
  orgId: string,
  currency: string,
  limit = 5,
): Promise<
  {
    title: string;
    position: "pahali" | "ucuz";
    body: string;
    hrefPath: string;
    valueScore: number;
  }[]
> {
  const { data } = await admin
    .from("keyword_research")
    .select(
      "product_id, researched_at, price_position, deviation_pct, confidence, our_price_cents, suggested_price_cents, recommendation, products!inner(title, status)",
    )
    .eq("org_id", orgId)
    .eq("products.status", "active")
    .in("price_position", ["pahali", "ucuz"])
    .not("suggested_price_cents", "is", null)
    .order("researched_at", { ascending: false })
    .limit(250);

  type Row = {
    product_id: string;
    researched_at: string;
    price_position: "pahali" | "ucuz";
    deviation_pct: number | null;
    confidence: "yuksek" | "orta" | "dusuk" | null;
    our_price_cents: number | null;
    suggested_price_cents: number | null;
    recommendation: string | null;
    products:
      | { title: string; status: string }
      | { title: string; status: string }[]
      | null;
  };

  const latest = new Map<string, Row>();
  for (const r of (data ?? []) as Row[]) {
    if (!latest.has(r.product_id)) latest.set(r.product_id, r);
  }
  if (latest.size === 0) return [];

  const productIds = [...latest.keys()];
  const decidedAt = new Map<string, string>();
  const CHUNK = 200;
  for (let i = 0; i < productIds.length; i += CHUNK) {
    const { data: decisions } = await admin
      .from("latest_market_decision")
      .select("product_id, created_at")
      .in("product_id", productIds.slice(i, i + CHUNK));
    for (const d of (decisions as { product_id: string; created_at: string }[] | null) ??
      []) {
      decidedAt.set(d.product_id, d.created_at);
    }
  }

  const scored: PriceTipRaw[] = [];
  for (const r of latest.values()) {
    const dec = decidedAt.get(r.product_id);
    if (dec && new Date(dec) >= new Date(r.researched_at)) continue;
    const our = r.our_price_cents ?? 0;
    const sug = r.suggested_price_cents ?? 0;
    const gap = Math.abs(our - sug);
    if (gap <= 0) continue;
    const confW =
      r.confidence && r.confidence in CONFIDENCE_W
        ? CONFIDENCE_W[r.confidence]
        : 1.5;
    const dev = Math.abs(Number(r.deviation_pct ?? 0.1));
    const valueScore = gap * confW * (1 + Math.min(dev, 1));
    const prod = Array.isArray(r.products) ? r.products[0] : r.products;
    scored.push({
      product_id: r.product_id,
      title: prod?.title ?? "Listing",
      price_position: r.price_position,
      deviation_pct: r.deviation_pct != null ? Number(r.deviation_pct) : null,
      confidence: r.confidence,
      our_price_cents: r.our_price_cents,
      suggested_price_cents: r.suggested_price_cents,
      recommendation: r.recommendation,
      researched_at: r.researched_at,
      valueScore,
    });
  }

  scored.sort((a, b) => b.valueScore - a.valueScore);

  return scored.slice(0, limit).map((t) => {
    const posLabel = t.price_position === "pahali" ? "pahalı" : "ucuz";
    const our = formatMoney(t.our_price_cents ?? 0, currency);
    const sug = formatMoney(t.suggested_price_cents ?? 0, currency);
    const dev =
      t.deviation_pct != null
        ? ` · %${Math.round(Math.abs(t.deviation_pct) * 100)} sapma`
        : "";
    const conf = t.confidence ? ` · güven ${t.confidence}` : "";
    const tip = t.recommendation?.trim()
      ? ` ${t.recommendation.trim()}`
      : "";
    return {
      title: t.title,
      position: t.price_position,
      body: `Şu an ${our} → öneri ${sug} (${posLabel}${dev}${conf}).${tip}`,
      hrefPath: `/tasarimlar/${t.product_id}`,
      valueScore: t.valueScore,
    };
  });
}

export type EngagementMover = {
  title: string;
  deltaViews: number;
  deltaFavorers: number;
  score: number;
};

/**
 * Listing ilgilenme skoru 0–100: son iki fotoğraf günü Δviews + Δfavorers.
 * Mağaza skoru = top mover ortalamasının normalize hali.
 */
export async function collectListingEngagement(
  admin: SupabaseClient,
  orgId: string,
): Promise<{
  shopScore: number;
  shopLabel: string;
  movers: EngagementMover[];
  windowLabel: string;
}> {
  const since = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);
  const [statsRes, productsRes] = await Promise.all([
    admin
      .from("etsy_listing_stats")
      .select("etsy_listing_id, stat_date, views, num_favorers")
      .eq("org_id", orgId)
      .gte("stat_date", since)
      .order("stat_date", { ascending: true })
      .limit(8000),
    admin
      .from("products")
      .select("etsy_listing_id, title")
      .eq("org_id", orgId)
      .not("etsy_listing_id", "is", null),
  ]);

  type StatRow = {
    etsy_listing_id: number;
    stat_date: string;
    views: number | null;
    num_favorers: number | null;
  };
  const stats = (statsRes.data ?? []) as StatRow[];
  const byDate = new Map<string, Map<number, StatRow>>();
  for (const r of stats) {
    const d = r.stat_date.slice(0, 10);
    const m = byDate.get(d) ?? new Map<number, StatRow>();
    m.set(r.etsy_listing_id, r);
    byDate.set(d, m);
  }
  const dates = [...byDate.keys()].sort();
  if (dates.length < 2) {
    return {
      shopScore: 0,
      shopLabel: "Henüz yeterli görüntülenme fotoğrafı yok",
      movers: [],
      windowLabel: "son senkron günleri",
    };
  }

  const prevDate = dates[dates.length - 2]!;
  const curDate = dates[dates.length - 1]!;
  const prev = byDate.get(prevDate)!;
  const curM = byDate.get(curDate)!;
  const titleMap = new Map(
    (
      (productsRes.data ?? []) as {
        etsy_listing_id: number;
        title: string;
      }[]
    ).map((p) => [p.etsy_listing_id, p.title]),
  );

  const movers: EngagementMover[] = [];
  let shopViews = 0;
  let shopFav = 0;
  for (const [id, curRow] of curM) {
    const prevRow = prev.get(id);
    if (!prevRow) continue;
    const deltaViews = Math.max(0, (curRow.views ?? 0) - (prevRow.views ?? 0));
    const deltaFavorers =
      (curRow.num_favorers ?? 0) - (prevRow.num_favorers ?? 0);
    shopViews += deltaViews;
    shopFav += Math.max(0, deltaFavorers);
    if (deltaViews <= 0 && deltaFavorers === 0) continue;
    // Skor: views ağırlıklı + favori × 8 (nadir sinyal).
    const score = Math.min(
      100,
      Math.round(Math.log10(1 + deltaViews) * 35 + Math.max(0, deltaFavorers) * 8),
    );
    movers.push({
      title: titleMap.get(id) ?? `Listing #${id}`,
      deltaViews,
      deltaFavorers,
      score,
    });
  }
  movers.sort((a, b) => b.score - a.score || b.deltaViews - a.deltaViews);

  // Mağaza skoru: toplam günlük ilgilenmenin log ölçeği.
  const shopScore = Math.min(
    100,
    Math.round(Math.log10(1 + shopViews + shopFav * 10) * 28),
  );
  const shopLabel =
    shopScore >= 70
      ? "Güçlü ilgilenme"
      : shopScore >= 40
        ? "Orta ilgilenme"
        : shopScore >= 15
          ? "Zayıf ilgilenme"
          : "Durgun";

  return {
    shopScore,
    shopLabel,
    movers: movers.slice(0, 5),
    windowLabel: `${prevDate} → ${curDate}`,
  };
}

export async function collectAdsTotals(
  admin: SupabaseClient,
  orgId: string,
): Promise<{
  spendCents: number;
  adsRevenueCents: number;
  adsClicks: number;
  roas: number | null;
  spendingProductCount: number;
}> {
  const { data } = await admin
    .from("product_metrics")
    .select(
      "product_id, created_at, ads_clicks, ads_spend_cents, ads_revenue_cents, products!inner(status)",
    )
    .eq("org_id", orgId)
    .eq("products.status", "active")
    .ilike("period_label", "%son 30%")
    .order("created_at", { ascending: false })
    .limit(400);

  type Row = {
    product_id: string;
    created_at: string;
    ads_clicks: number | null;
    ads_spend_cents: number | null;
    ads_revenue_cents: number | null;
  };
  const latest = new Map<string, Row>();
  for (const r of (data ?? []) as Row[]) {
    if (!latest.has(r.product_id)) latest.set(r.product_id, r);
  }
  let spendCents = 0;
  let adsRevenueCents = 0;
  let adsClicks = 0;
  let spendingProductCount = 0;
  for (const r of latest.values()) {
    const s = r.ads_spend_cents ?? 0;
    spendCents += s;
    adsRevenueCents += r.ads_revenue_cents ?? 0;
    adsClicks += r.ads_clicks ?? 0;
    if (s > 0) spendingProductCount += 1;
  }
  return {
    spendCents,
    adsRevenueCents,
    adsClicks,
    roas: spendCents > 0 ? adsRevenueCents / spendCents : null,
    spendingProductCount,
  };
}
