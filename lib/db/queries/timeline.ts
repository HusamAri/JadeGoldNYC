import { createClient } from "@/lib/supabase/server";
import type { TaskStatus, TaskPriority } from "@/lib/types";

export interface TimelineTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  assigneeName: string | null;
}

export interface TimelineDay {
  date: string; // YYYY-MM-DD
  revenueCents: number;
  orders: number;
}

export interface TimelineData {
  tasks: TimelineTask[];
  days: TimelineDay[]; // geçmiş satış günleri (bağlam şeridi)
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
  const [{ data }, salesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, assignee_id")
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

  const rows = (data ?? []) as unknown as {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string;
    assignee_id: string | null;
  }[];

  // Atanan adları (opsiyonel görsel bilgi) — tek sorguyla profillerden
  const assigneeIds = [...new Set(rows.map((r) => r.assignee_id).filter(Boolean))] as string[];
  const names = new Map<string, string | null>();
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", assigneeIds);
    for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
      names.set(p.id, p.full_name);
    }
  }

  return {
    tasks: rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      priority: r.priority,
      dueDate: r.due_date.slice(0, 10),
      assigneeName: r.assignee_id ? (names.get(r.assignee_id) ?? null) : null,
    })),
    days: [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    windowStart: startIso,
    windowEnd: endIso,
  };
}
