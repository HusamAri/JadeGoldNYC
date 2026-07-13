import { createClient } from "@/lib/supabase/server";
import type { Report, ReportContent, ReportListItem, ReportWithTasks } from "@/lib/types";
import { listTasksByReport } from "@/lib/db/queries/tasks";

type ReportRow = {
  id: string;
  org_id: string;
  title: string;
  category: string;
  summary: string | null;
  content: Partial<ReportContent> | null;
  report_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * DB'deki `content` JSONB'si `{}`'e (kolon varsayılanı) ya da eksik alanlara
 * sahip olabilir; detay sayfası `stats.length` gibi erişimlerde patlamasın
 * diye zorunlu diziler burada normalize edilir.
 */
function normalizeContent(c: Partial<ReportContent> | null): ReportContent {
  return {
    findings: c?.findings ?? [],
    stats: c?.stats ?? [],
    timeline: c?.timeline,
    yoy: c?.yoy,
    tiers: c?.tiers ?? [],
    sourceNote: c?.sourceNote,
  };
}

/** Kayıtlı raporlar listesi (en yeni önce) + her rapora bağlı görev ilerlemesi. */
export async function listReports(): Promise<ReportListItem[]> {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, title, category, summary, report_date, created_at")
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });
  const rows = (reports ?? []) as Omit<ReportRow, "content" | "org_id" | "created_by" | "updated_at">[];
  if (rows.length === 0) return [];

  const { data: tasks } = await supabase
    .from("tasks")
    .select("report_id, status")
    .in(
      "report_id",
      rows.map((r) => r.id),
    );
  const taskRows = (tasks ?? []) as { report_id: string | null; status: string }[];

  return rows.map((r) => {
    const linked = taskRows.filter((t) => t.report_id === r.id);
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      summary: r.summary,
      report_date: r.report_date,
      created_at: r.created_at,
      taskTotal: linked.length,
      taskDone: linked.filter((t) => t.status === "done").length,
    };
  });
}

/** Tek rapor + ona bağlı görevlerin canlı durumu (Görevler'deki aynı satır). */
export async function getReport(id: string): Promise<ReportWithTasks | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as ReportRow;
  const report: Report = { ...row, content: normalizeContent(row.content) };
  const tasks = await listTasksByReport(id);
  return { ...report, tasks };
}
