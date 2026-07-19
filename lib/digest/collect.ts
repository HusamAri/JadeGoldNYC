import type { SupabaseClient } from "@supabase/supabase-js";

import { computeAdsSignals } from "@/lib/db/queries/ads-actions";
import { resolveDigestBrand } from "@/lib/digest/brand";
import type {
  DigestActionItem,
  DigestActivityItem,
  DigestDayPoint,
  DigestKpi,
  DigestSuggestion,
  OrgDigest,
} from "@/lib/digest/types";
import { formatMoney } from "@/lib/money";
import { dayKeyNY, nyDayEndUtc, nyDayStartUtc } from "@/lib/period";

const STORE_TZ = "America/New_York";

function appBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return raw;
}

function abs(path: string): string {
  if (path.startsWith("http")) return path;
  return `${appBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Prod’da migration 0106 henüz uygulanmadıysa PostgREST bu hatayı verir. */
function isMissingDigestSettingsColumn(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("digest_settings") &&
    (msg.includes("schema cache") || msg.includes("does not exist"))
  );
}

function escPct(n: number | null): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}%`;
}

function deltaTone(
  pct: number | null,
  invert = false,
): DigestKpi["tone"] {
  if (pct == null || pct === 0) return "flat";
  const up = pct > 0;
  if (invert) return up ? "down" : "up";
  return up ? "up" : "down";
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: STORE_TZ,
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function windowBounds(now = new Date()) {
  const end = now;
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const priorEnd = start;
  const priorStart = new Date(priorEnd.getTime() - 24 * 60 * 60 * 1000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    priorStartIso: priorStart.toISOString(),
    priorEndIso: priorEnd.toISOString(),
  };
}

type SaleRow = {
  order_date: string;
  grand_total_cents: number | null;
  item_total_cents: number | null;
  status: string | null;
};

function saleRevenue(s: SaleRow): number {
  // Panel semantiği: grand_total tercih; yoksa item_total.
  return s.grand_total_cents ?? s.item_total_cents ?? 0;
}

function sumSales(rows: SaleRow[]): { orders: number; revenueCents: number } {
  let orders = 0;
  let revenueCents = 0;
  for (const s of rows) {
    if (s.status === "cancelled") continue;
    orders += 1;
    revenueCents += saleRevenue(s);
  }
  return { orders, revenueCents };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

/**
 * Tek org için günlük digest verisini service-role ile toplar.
 * Oturum/RLS yok — cron ve önizleme bu yolu kullanır.
 */
export async function collectOrgDigest(
  admin: SupabaseClient,
  orgId: string,
  now = new Date(),
): Promise<OrgDigest | null> {
  let { data: orgRow, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, slug, default_currency, digest_settings")
    .eq("id", orgId)
    .maybeSingle();

  // Migration 0106 yoksa kolon yok — gönderimi kilitleme; varsayılan açık.
  if (isMissingDigestSettingsColumn(orgErr)) {
    const fallback = await admin
      .from("organizations")
      .select("id, name, slug, default_currency")
      .eq("id", orgId)
      .maybeSingle();
    orgRow = fallback.data
      ? { ...fallback.data, digest_settings: { enabled: true } }
      : null;
  }

  if (!orgRow) return null;

  const org = orgRow as {
    id: string;
    name: string;
    slug: string | null;
    default_currency: string | null;
    digest_settings: { enabled?: boolean } | null;
  };

  if (org.digest_settings?.enabled === false) return null;

  const currency = org.default_currency || "USD";
  const theme = resolveDigestBrand(org.slug, org.name);
  const bounds = windowBounds(now);
  const todayKey = dayKeyNY(now.toISOString());

  // Son 8 NY günü (gidişat tablosu).
  const weekStartKey = (() => {
    const d = new Date(`${todayKey}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const weekFromIso = nyDayStartUtc(weekStartKey).toISOString();
  const weekToIso = nyDayEndUtc(todayKey).toISOString();

  const [
    sales24,
    salesPrior,
    salesWeek,
    etsyConn,
    soldOut,
    expired,
    reviewsNew,
    reviewsNeedReply,
    inquiriesOpen,
    p0Tasks,
    tasksDone,
    auditRows,
    productMetrics,
    lastSnapshot,
  ] = await Promise.all([
    admin
      .from("sales")
      .select("order_date, grand_total_cents, item_total_cents, status")
      .eq("org_id", orgId)
      .gte("order_date", bounds.startIso)
      .lte("order_date", bounds.endIso),
    admin
      .from("sales")
      .select("order_date, grand_total_cents, item_total_cents, status")
      .eq("org_id", orgId)
      .gte("order_date", bounds.priorStartIso)
      .lt("order_date", bounds.priorEndIso),
    admin
      .from("sales")
      .select("order_date, grand_total_cents, item_total_cents, status")
      .eq("org_id", orgId)
      .gte("order_date", weekFromIso)
      .lte("order_date", weekToIso),
    admin
      .from("etsy_connection")
      .select("status, last_sync_at")
      .eq("org_id", orgId)
      .maybeSingle(),
    admin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("archived_at", null)
      .eq("status", "sold_out"),
    admin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("archived_at", null)
      .eq("status", "expired"),
    admin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", bounds.startIso),
    admin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "yeni")
      .lte("rating", 3),
    admin
      .from("metric_inquiries")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .neq("status", "resolved"),
    admin
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("priority", "P0")
      .neq("status", "done"),
    admin
      .from("tasks")
      .select("id, title, updated_at, status")
      .eq("org_id", orgId)
      .eq("status", "done")
      .gte("updated_at", bounds.startIso)
      .order("updated_at", { ascending: false })
      .limit(8),
    admin
      .from("audit_log")
      .select("created_at, summary, source, action")
      .eq("org_id", orgId)
      .gte("created_at", bounds.startIso)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("product_metrics")
      .select(
        "product_id, created_at, views, orders, ads_spend_cents, ads_revenue_cents, products!inner(status, title)",
      )
      .eq("org_id", orgId)
      .eq("products.status", "active")
      .ilike("period_label", "%son 30%")
      .order("created_at", { ascending: false })
      .limit(400),
    admin
      .from("etsy_shop_snapshots")
      .select("snapshot_date")
      .eq("org_id", orgId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const curr = sumSales((sales24.data ?? []) as SaleRow[]);
  const prior = sumSales((salesPrior.data ?? []) as SaleRow[]);
  const revPct = pctChange(curr.revenueCents, prior.revenueCents);
  const ordPct = pctChange(curr.orders, prior.orders);

  const kpis: DigestKpi[] = [
    {
      label: "Gelir (24s)",
      value: formatMoney(curr.revenueCents, currency),
      deltaLabel: escPct(revPct)
        ? `${escPct(revPct)} önceki 24s`
        : prior.revenueCents === 0 && curr.revenueCents > 0
          ? "önceki 24s boş"
          : "önceki 24s ile aynı",
      tone: deltaTone(revPct),
    },
    {
      label: "Sipariş (24s)",
      value: String(curr.orders),
      deltaLabel: escPct(ordPct)
        ? `${escPct(ordPct)} önceki 24s`
        : null,
      tone: deltaTone(ordPct),
    },
    {
      label: "Ort. sipariş",
      value:
        curr.orders > 0
          ? formatMoney(Math.round(curr.revenueCents / curr.orders), currency)
          : formatMoney(0, currency),
      tone: "neutral",
    },
  ];

  // 7 günlük gidişat (NY günleri).
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${todayKey}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const s of (salesWeek.data ?? []) as SaleRow[]) {
    if (s.status === "cancelled") continue;
    const key = dayKeyNY(s.order_date);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += saleRevenue(s);
  }
  const weekTrend: DigestDayPoint[] = [...byDay.entries()].map(
    ([key, v]) => ({
      label: new Intl.DateTimeFormat("tr-TR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: STORE_TZ,
      }).format(new Date(`${key}T12:00:00Z`)),
      revenueLabel: formatMoney(v.revenue, currency),
      orders: v.orders,
    }),
  );

  const actions: DigestActionItem[] = [];
  const etsy = etsyConn.data as {
    status: string | null;
    last_sync_at: string | null;
  } | null;
  if (!etsy || etsy.status !== "connected") {
    actions.push({
      severity: "kritik",
      title: "Etsy bağlantısı kopuk",
      hint: "Senkron ve ücret verisi durur; kararlar bayat kalır. Ayarlar’dan yeniden bağla.",
      href: abs("/ayarlar/etsy"),
      actionLabel: "Etsy’yi bağla",
    });
  }
  const soldOutN = soldOut.count ?? 0;
  if (soldOutN > 0) {
    actions.push({
      severity: "kritik",
      title: `${soldOutN} ürün tükendi`,
      hint: "Stok bitince listing kapanır; trafik ve sıralama kaybedersin.",
      href: abs("/tasarimlar?status=sold_out"),
      actionLabel: "Tükenenleri gör",
    });
  }
  const expiredN = expired.count ?? 0;
  if (expiredN > 0) {
    actions.push({
      severity: "onemli",
      title: `${expiredN} listing süresi doldu`,
      hint: "Aramada görünmez; yenilemeden trafik gelmez.",
      href: abs("/tasarimlar?status=expired"),
      actionLabel: "Süresi dolanlar",
    });
  }
  const replyN = reviewsNeedReply.count ?? 0;
  if (replyN > 0) {
    actions.push({
      severity: "onemli",
      title: `${replyN} düşük puanlı yorum yanıt bekliyor`,
      hint: "Yanıtsız olumsuz yorum Star Seller ve güveni zedeler.",
      href: abs("/yorumlar"),
      actionLabel: "Yorumlara git",
    });
  }
  const inqN = inquiriesOpen.count ?? 0;
  if (inqN > 0) {
    actions.push({
      severity: "onemli",
      title: `${inqN} ekip sorusu açık`,
      hint: "Karar bekleyen metrik soruları panoda birikiyor.",
      href: abs("/aksiyon-plani"),
      actionLabel: "Soruları aç",
    });
  }
  const p0N = p0Tasks.count ?? 0;
  if (p0N > 0) {
    actions.push({
      severity: "kritik",
      title: `${p0N} acil (P0) görev açık`,
      hint: "Öncelik sırası bozulmasın diye bugün kapat veya devret.",
      href: abs("/gorevler"),
      actionLabel: "Görevler",
    });
  }
  const snap = lastSnapshot.data as { snapshot_date: string } | null;
  if (snap?.snapshot_date) {
    const ageDays =
      (Date.parse(todayKey) - Date.parse(snap.snapshot_date.slice(0, 10))) /
      86_400_000;
    if (ageDays >= 2) {
      actions.push({
        severity: "kritik",
        title: "Mağaza fotoğrafı bayat",
        hint: `Son senkron fotoğrafı ${snap.snapshot_date.slice(0, 10)}. Cron veya Etsy bağlantısını kontrol et.`,
        href: abs("/ayarlar/etsy"),
        actionLabel: "Senkronu kontrol et",
      });
    }
  }

  // Reklam sinyalleri → öneri + aksiyon.
  type MetricRow = {
    product_id: string;
    created_at: string;
    views: number | null;
    orders: number | null;
    ads_spend_cents: number | null;
    ads_revenue_cents: number | null;
    products: { status: string; title: string } | { status: string; title: string }[] | null;
  };
  const latestByProduct = new Map<string, MetricRow>();
  for (const raw of (productMetrics.data ?? []) as MetricRow[]) {
    if (!latestByProduct.has(raw.product_id)) {
      latestByProduct.set(raw.product_id, raw);
    }
  }
  const signalInputs = [...latestByProduct.values()].map((r) => {
    const prod = Array.isArray(r.products) ? r.products[0] : r.products;
    return {
      productId: r.product_id,
      title: prod?.title ?? "Listing",
      spendCents: r.ads_spend_cents ?? 0,
      adsRevenueCents: r.ads_revenue_cents ?? 0,
      views: r.views ?? 0,
      orders: r.orders ?? 0,
    };
  });
  const signals = computeAdsSignals(signalInputs);
  const suggestions: DigestSuggestion[] = [];
  for (const s of signals.slice(0, 5)) {
    if (s.signal === "bosa") {
      suggestions.push({
        title: `Reklam boşa: ${s.row.title}`,
        body: `Harcama var, gelir yok (${formatMoney(s.row.spendCents, currency)}). Etsy Ads’te kapatmayı veya kreatifi değiştir.`,
        href: abs("/reklamlar"),
      });
      actions.push({
        severity: "onemli",
        title: `Boşa giden reklam: ${s.row.title}`,
        hint: "ROAS 0 — bütçeyi durdur veya listing’i düzelt.",
        href: abs("/reklamlar"),
        actionLabel: "Reklamlara git",
      });
    } else if (s.signal === "butce_yiyen") {
      suggestions.push({
        title: `Bütçe yiyen: ${s.row.title}`,
        body: `Pay ${(s.share * 100).toFixed(0)}%, ROAS ${s.roas.toFixed(1)}x. Bütçeyi azalt.`,
        href: abs("/reklamlar"),
      });
    } else if (s.signal === "firsat") {
      suggestions.push({
        title: `Büyütme fırsatı: ${s.row.title}`,
        body: `ROAS ${s.roas.toFixed(1)}x ve düşük pay — bütçeyi artırmayı dene.`,
        href: abs("/reklamlar"),
      });
    }
  }

  if (curr.orders === 0 && prior.orders > 0) {
    suggestions.unshift({
      title: "Son 24 saatte sipariş yok",
      body: "Önceki 24 saatte sipariş vardı. Reklam, stok ve süresi dolan listingleri kontrol et.",
      href: abs("/panel"),
    });
  }
  if (replyN > 0) {
    suggestions.push({
      title: "Olumsuz yorumlara yanıt yaz",
      body: `${replyN} yorum ≤3 yıldız ve yeni. Hızlı, sakin bir yanıt Star Seller’a yardım eder.`,
      href: abs("/yorumlar"),
    });
  }

  // Deduplicate actions by title (ads may overlap).
  const seenAction = new Set<string>();
  const uniqueActions = actions.filter((a) => {
    if (seenAction.has(a.title)) return false;
    seenAction.add(a.title);
    return true;
  });
  uniqueActions.sort((a, b) => {
    const rank = { kritik: 0, onemli: 1, bilgi: 2 } as const;
    return rank[a.severity] - rank[b.severity];
  });

  const happened: DigestActivityItem[] = [];
  const finished: DigestActivityItem[] = [];

  const newReviews = reviewsNew.count ?? 0;
  if (curr.orders > 0) {
    happened.push({
      whenLabel: "Son 24 saat",
      summary: `${curr.orders} sipariş · ${formatMoney(curr.revenueCents, currency)} gelir`,
      source: "sales",
    });
  }
  if (newReviews > 0) {
    happened.push({
      whenLabel: "Son 24 saat",
      summary: `${newReviews} yeni yorum geldi`,
      source: "reviews",
    });
  }
  if (etsy?.last_sync_at && etsy.last_sync_at >= bounds.startIso) {
    happened.push({
      whenLabel: formatWhen(etsy.last_sync_at),
      summary: "Etsy senkronu tamamlandı / ilerledi",
      source: "etsy",
    });
  }

  for (const row of (auditRows.data ?? []) as {
    created_at: string;
    summary: string | null;
    source: string | null;
    action: string | null;
  }[]) {
    const summary = (row.summary ?? row.action ?? "Olay").trim();
    if (!summary) continue;
    const item: DigestActivityItem = {
      whenLabel: formatWhen(row.created_at),
      summary,
      source: row.source,
    };
    const action = (row.action ?? "").toLowerCase();
    if (
      action.includes("done") ||
      action.includes("complete") ||
      action.includes("finish") ||
      summary.toLowerCase().includes("tamam") ||
      summary.toLowerCase().includes("kapandı")
    ) {
      finished.push(item);
    } else {
      happened.push(item);
    }
  }

  for (const t of (tasksDone.data ?? []) as {
    title: string;
    updated_at: string;
  }[]) {
    finished.push({
      whenLabel: formatWhen(t.updated_at),
      summary: `Görev bitti: ${t.title}`,
      source: "tasks",
    });
  }

  const windowLabel = new Intl.DateTimeFormat("tr-TR", {
    timeZone: STORE_TZ,
    dateStyle: "long",
  }).format(now);

  return {
    orgId: org.id,
    orgName: org.name,
    orgSlug: org.slug,
    currency,
    theme,
    windowLabel: `${windowLabel} · son 24 saat (New York)`,
    generatedAtLabel: new Intl.DateTimeFormat("tr-TR", {
      timeZone: STORE_TZ,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(now),
    kpis,
    weekTrend,
    actions: uniqueActions.slice(0, 12),
    happened: happened.slice(0, 12),
    finished: finished.slice(0, 8),
    suggestions: suggestions.slice(0, 6),
    panelUrl: abs("/panel"),
    alertsHref: abs("/panel"),
  };
}

/** Digest açık org’ları listeler. */
export async function listDigestOrgIds(
  admin: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await admin
    .from("organizations")
    .select("id, digest_settings");

  if (isMissingDigestSettingsColumn(error)) {
    const fallback = await admin.from("organizations").select("id");
    return ((fallback.data ?? []) as { id: string }[]).map((r) => r.id);
  }

  const out: string[] = [];
  for (const row of (data ?? []) as {
    id: string;
    digest_settings: { enabled?: boolean } | null;
  }[]) {
    if (row.digest_settings?.enabled === false) continue;
    out.push(row.id);
  }
  return out;
}

/** Org üyelerinin e-postaları (owner + admin öncelikli; hepsi gönderilir). */
export async function listDigestRecipients(
  admin: SupabaseClient,
  orgId: string,
): Promise<{ email: string; name: string | null; role: string }[]> {
  const { data: members } = await admin
    .from("organization_members")
    .select("user_id, role")
    .eq("org_id", orgId);
  const rows = (members ?? []) as { user_id: string; role: string }[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);
  const { data: profs } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  const names = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  // listUsers sayfalı — büyüyen platformda üye ilk 200’de olmayabilir (PR #130).
  // Üye sayısı küçük; her id için getUserById güvenilir.
  const emails = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || !data.user?.email) return;
      emails.set(id, data.user.email);
    }),
  );

  const roleRank = (r: string) =>
    r === "owner" ? 0 : r === "admin" ? 1 : 2;

  return rows
    .map((r) => ({
      email: emails.get(r.user_id) ?? "",
      name: names.get(r.user_id) ?? null,
      role: r.role,
    }))
    .filter((r) => r.email)
    .sort((a, b) => roleRank(a.role) - roleRank(b.role));
}
