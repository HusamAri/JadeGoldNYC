"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { ReportContent, TaskPriority } from "@/lib/types";

export async function logReportExport(label: string): Promise<void> {
  const m = await requireMembership();
  const supabase = await createClient();
  await logAudit(supabase, {
    orgId: m.org_id,
    action: "report.export",
    entityType: "report",
    summary: `Rapor dışa aktarıldı (${label})`,
    source: "app",
  });
}

export interface CreateReportTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
}

export interface CreateReportInput {
  title: string;
  category: string;
  summary?: string;
  /** YYYY-MM-DD — raporun ait olduğu gün (yazıldığı gün değil, kapsadığı gün). */
  reportDate: string;
  content: ReportContent;
  /** Raporun önerdiği aksiyonlar — Görevler'e gerçek satır olarak eklenir ve
   *  `tasks.report_id` ile bu rapora bağlanır (metinle değil, foreign key'le). */
  tasks?: CreateReportTaskInput[];
}

/**
 * Yeni bir analiz raporu kaydeder ve (varsa) önerdiği aksiyonları Görevler'e
 * gerçek görev satırı olarak ekler. `reports` ve `tasks` tabloları audit
 * trigger'la kayıtlı olduğundan (şirket hafızası) ayrıca log atmaya gerek yok.
 */
export async function createReport(
  input: CreateReportInput,
): Promise<{ error?: string; id?: string }> {
  const m = await requireMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .insert({
      org_id: m.org_id,
      title: input.title.slice(0, 200),
      category: input.category,
      summary: input.summary?.slice(0, 500) ?? null,
      content: input.content,
      report_date: input.reportDate,
      created_by: m.user_id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const reportId = (data as { id: string }).id;

  if (input.tasks && input.tasks.length > 0) {
    const rows = input.tasks.map((t, i) => ({
      org_id: m.org_id,
      title: t.title.slice(0, 200),
      description: t.description?.slice(0, 2000) ?? null,
      status: "todo" as const,
      priority: t.priority,
      due_date: t.dueDate ?? null,
      report_id: reportId,
      created_by: m.user_id,
      sort_order: i,
    }));
    const { error: taskError } = await supabase.from("tasks").insert(rows);
    if (taskError) return { error: taskError.message, id: reportId };
  }

  revalidatePath("/raporlar");
  revalidatePath(`/raporlar/${reportId}`);
  revalidatePath("/gorevler");
  return { id: reportId };
}

export async function deleteReport(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/raporlar");
  revalidatePath("/gorevler");
  return {};
}
