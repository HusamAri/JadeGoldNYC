import { createClient } from "@/lib/supabase/server";
import { dayKeyNY } from "@/lib/period";
import type { TaskStatus, TaskPriority } from "@/lib/types";

export interface TimelineTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  assigneeName: string | null;
  /** Süren görevin kullanıcı tanımlı ilerlemesi (0-100); null = belirtilmedi. */
  progress: number | null;
  /** Görev ikon anahtarı (lib/task-style.ts) — yoksa durum glifi. */
  icon: string | null;
  /** İsimlendirilmiş renk anahtarı (lib/task-style.ts). */
  color: string | null;
}

export interface TimelineDay {
  date: string; // YYYY-MM-DD
  revenueCents: number;
  orders: number;
}

/** Çizelge arka planında havada asılı OLAY küresi — hover'da detay verir. */
export interface TimelineEvent {
  date: string; // YYYY-MM-DD
  kind: "satis" | "yorum" | "sistem";
  title: string;
  detail: string;
  /** Küre boyutu/parlaklığı için 0-1 ağırlık (satışta ciroya göre). */
  weight: number;
}

export interface TimelineData {
  tasks: TimelineTask[];
  days: TimelineDay[]; // geçmiş satış günleri (olay kürelerinin kaynağı)
  events: TimelineEvent[];
  windowStart: string;
  windowEnd: string;
}

/**
 * Ana panel GÖREV zaman çizelgesi verisi: bitiş tarihli görevler — geçmiş
 * (teslim edilen/geciken) ve gelecek (planlanan). Çizim istemcide; kayıt hafif.
 */
export async function getTimelineData(
  orgId: string,
  opts: { pastDays?: number; futureDays?: number } = {},
): Promise<TimelineData> {
  const pastDays = opts.pastDays ?? 180;
  const futureDays = opts.futureDays ?? 180;
  const now = new Date();
  const startIso = new Date(now.getTime() - pastDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const endIso = new Date(now.getTime() + futureDays * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const supabase = await createClient();
  const [tasksRes, salesRes, reviewsRes, sysRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, title, status, priority, due_date, assignee_id, progress, icon, color",
      )
      .eq("org_id", orgId)
      .not("due_date", "is", null)
      .gte("due_date", startIso)
      .lte("due_date", endIso)
      .order("due_date", { ascending: true }),
    supabase
      .from("sales")
      .select("order_date, grand_total_cents, item_total_cents")
      .eq("org_id", orgId)
      .gte("order_date", startIso)
      .order("order_date", { ascending: true })
      .limit(5000),
    // Olay küreleri: müşteri yorumları (yıldızıyla).
    supabase
      .from("reviews")
      .select("review_date, rating, buyer_name")
      .eq("org_id", orgId)
      .not("review_date", "is", null)
      .gte("review_date", startIso)
      .order("review_date", { ascending: false })
      .limit(200),
    // Olay küreleri: sistem kilometre taşları (bağlantı, içe aktarma).
    supabase
      .from("audit_log")
      .select("created_at, action, summary")
      .eq("org_id", orgId)
      .in("action", ["etsy.connect", "csv.import"])
      .gte("created_at", startIso)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Sorgu hataları sessizce "veri yok"a dönüşmesin — en azından yüzeye çıkar.
  for (const [name, res] of [
    ["tasks", tasksRes],
    ["sales", salesRes],
    ["reviews", reviewsRes],
    ["audit", sysRes],
  ] as const) {
    if (res.error) console.error(`[timeline] ${name} sorgusu:`, res.error.message);
  }

  const dayMap = new Map<string, TimelineDay>();
  for (const s of (salesRes.data ?? []) as unknown as {
    order_date: string;
    grand_total_cents: number | null;
    item_total_cents: number | null;
  }[]) {
    // Gün anahtarı mağaza saat diliminde (NY): panel "bugün"ü NY takvimiyle
    // hesaplar; UTC slice NY akşam satışlarını ertesi güne kaydırıyordu.
    const d = dayKeyNY(s.order_date);
    const e = dayMap.get(d) ?? { date: d, revenueCents: 0, orders: 0 };
    e.revenueCents += s.grand_total_cents || s.item_total_cents || 0;
    e.orders += 1;
    dayMap.set(d, e);
  }

  const rows = (tasksRes.data ?? []) as unknown as {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string;
    assignee_id: string | null;
    progress: number | null;
    icon: string | null;
    color: string | null;
  }[];

  // Atanan adları (opsiyonel görsel bilgi) — tek sorguyla profillerden
  const assigneeIds = [...new Set(rows.map((r) => r.assignee_id).filter(Boolean))] as string[];
  const names = new Map<string, string | null>();
  if (assigneeIds.length > 0) {
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", assigneeIds);
    if (profilesErr)
      console.error("[timeline] profiles sorgusu:", profilesErr.message);
    for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
      names.set(p.id, p.full_name);
    }
  }

  // ── Olay küreleri ────────────────────────────────────────────────
  const days = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const maxRevenue = Math.max(1, ...days.map((d) => d.revenueCents));
  const events: TimelineEvent[] = [];
  for (const d of days) {
    if (d.orders === 0) continue;
    events.push({
      date: d.date,
      kind: "satis",
      title: `${d.orders} sipariş`,
      detail: `$${(d.revenueCents / 100).toFixed(0)} ciro`,
      weight: d.revenueCents / maxRevenue,
    });
  }
  for (const r of (reviewsRes.data ?? []) as {
    review_date: string | null;
    rating: number | null;
    buyer_name: string | null;
  }[]) {
    if (!r.review_date) continue;
    events.push({
      date: r.review_date.slice(0, 10),
      kind: "yorum",
      title: `${r.rating ?? "?"}★ yorum`,
      detail: r.buyer_name ? `${r.buyer_name}'den` : "Etsy yorumu",
      weight: r.rating != null ? r.rating / 5 : 0.5,
    });
  }
  for (const s of (sysRes.data ?? []) as {
    created_at: string;
    action: string;
    summary: string | null;
  }[]) {
    events.push({
      date: s.created_at.slice(0, 10),
      kind: "sistem",
      title: s.action === "etsy.connect" ? "Etsy bağlandı" : "CSV içe aktarıldı",
      detail: s.summary ?? s.action,
      weight: 0.7,
    });
  }

  return {
    tasks: rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      priority: r.priority,
      dueDate: r.due_date.slice(0, 10),
      assigneeName: r.assignee_id ? (names.get(r.assignee_id) ?? null) : null,
      progress: r.progress,
      icon: r.icon,
      color: r.color,
    })),
    days,
    events,
    windowStart: startIso,
    windowEnd: endIso,
  };
}
