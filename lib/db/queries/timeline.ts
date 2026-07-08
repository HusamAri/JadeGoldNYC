import { createClient } from "@/lib/supabase/server";

export interface TimelineDay {
  date: string; // YYYY-MM-DD
  revenueCents: number;
  orders: number;
}

export interface TimelineEvent {
  date: string; // YYYY-MM-DD
  type: "task" | "task-done" | "inquiry" | "launch";
  label: string;
  href: string;
}

export interface TimelineData {
  days: TimelineDay[]; // geçmiş satış günleri
  events: TimelineEvent[]; // geçmiş + gelecek olaylar
  windowStart: string;
  windowEnd: string;
}

/**
 * Ana panel zaman çizelgesi verisi: geçmiş `pastDays` günün gün-bazlı satışları
 * + görevler (bitiş tarihli — gelecek planı ve geçmiş teslimler) + açık metrik
 * soruları. Kayıt hafif tutulur (yalnız gün/etiket), çizim istemcide.
 */
export async function getTimelineData(
  orgId: string,
  opts: { pastDays?: number; futureDays?: number } = {},
): Promise<TimelineData> {
  const pastDays = opts.pastDays ?? 180;
  const futureDays = opts.futureDays ?? 180;
  const now = new Date();
  const start = new Date(now.getTime() - pastDays * 86_400_000);
  const end = new Date(now.getTime() + futureDays * 86_400_000);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);

  const supabase = await createClient();
  const [salesRes, tasksRes, inquiriesRes] = await Promise.all([
    supabase
      .from("sales")
      .select("order_date, grand_total_cents, item_total_cents")
      .eq("org_id", orgId)
      .gte("order_date", startIso)
      .order("order_date", { ascending: true })
      .limit(5000),
    supabase
      .from("tasks")
      .select("id, title, status, due_date")
      .eq("org_id", orgId)
      .not("due_date", "is", null)
      .gte("due_date", startIso)
      .lte("due_date", endIso),
    supabase
      .from("metric_inquiries")
      .select("id, title, status, created_at")
      .eq("org_id", orgId)
      .neq("status", "resolved"),
  ]);

  const dayMap = new Map<string, TimelineDay>();
  for (const s of (salesRes.data ?? []) as unknown as {
    order_date: string;
    grand_total_cents: number | null;
    item_total_cents: number | null;
  }[]) {
    const d = s.order_date.slice(0, 10);
    const e = dayMap.get(d) ?? { date: d, revenueCents: 0, orders: 0 };
    e.revenueCents += s.grand_total_cents || s.item_total_cents || 0;
    e.orders += 1;
    dayMap.set(d, e);
  }

  const events: TimelineEvent[] = [];
  for (const t of (tasksRes.data ?? []) as unknown as {
    id: string;
    title: string;
    status: string;
    due_date: string;
  }[]) {
    events.push({
      date: t.due_date.slice(0, 10),
      type: t.status === "done" ? "task-done" : "task",
      label: t.title,
      href: `/gorevler/${t.id}`,
    });
  }
  for (const q of (inquiriesRes.data ?? []) as unknown as {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[]) {
    events.push({
      date: q.created_at.slice(0, 10),
      type: "inquiry",
      label: `Soru: ${q.title}`,
      href: "/analizler/aksiyon-plani",
    });
  }

  return {
    days: [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    events: events.sort((a, b) => a.date.localeCompare(b.date)),
    windowStart: startIso,
    windowEnd: endIso,
  };
}
