"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership, getUser } from "@/lib/auth";
import { getProfile } from "@/lib/db/queries/profile";
import {
  taskFormSchema,
  taskNoteSchema,
  taskStatusSchema,
  type TaskFormValues,
} from "@/lib/validations/task";

export interface TaskActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function toRow(v: TaskFormValues) {
  return {
    title: v.title,
    description: v.description || null,
    status: v.status,
    priority: v.priority,
    lane: v.lane ? v.lane : null,
    assignee_id: v.assignee_id ? v.assignee_id : null,
    effort: v.effort || null,
    due_date: v.due_date ? v.due_date : null,
    notes: v.notes || null,
  };
}

export async function createTask(
  values: TaskFormValues,
): Promise<TaskActionResult> {
  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...toRow(parsed.data), org_id: m.org_id, created_by: m.user_id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/gorevler");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateTask(
  id: string,
  values: TaskFormValues,
): Promise<TaskActionResult> {
  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Form geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gorevler");
  revalidatePath(`/gorevler/${id}`);
  return { ok: true, id };
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gorevler");
  return {};
}

/** Hızlı Kanban aksiyonu: görevi bir sütundan diğerine taşı. */
export async function moveTask(
  id: string,
  status: string,
): Promise<{ error?: string }> {
  const parsed = taskStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Geçersiz durum." };
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: parsed.data })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gorevler");
  revalidatePath(`/gorevler/${id}`);
  return {};
}

/** Görevi bir kullanıcıya ata (veya atamayı kaldır: assigneeId = null). */
export async function assignTask(
  id: string,
  assigneeId: string | null,
): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ assignee_id: assigneeId })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gorevler");
  revalidatePath(`/gorevler/${id}`);
  return {};
}

/** Göreve iş birliği notu ekle (çözüm/ilerleme kaydı). */
export async function addTaskNote(
  taskId: string,
  body: string,
): Promise<{ error?: string }> {
  const parsed = taskNoteSchema.safeParse({ body });
  if (!parsed.success) return { error: "Not boş olamaz." };
  const m = await requireMembership();
  const user = await getUser();
  const supabase = await createClient();
  const profile = user ? await getProfile(supabase, user.id) : null;
  const authorLabel = profile?.full_name || user?.email || null;

  const { error } = await supabase.from("task_notes").insert({
    org_id: m.org_id,
    task_id: taskId,
    body: parsed.data.body,
    author_id: m.user_id,
    author_label: authorLabel,
  });
  if (error) return { error: error.message };
  revalidatePath(`/gorevler/${taskId}`);
  return {};
}

export async function deleteTaskNote(
  noteId: string,
  taskId: string,
): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("task_notes").delete().eq("id", noteId);
  if (error) return { error: error.message };
  revalidatePath(`/gorevler/${taskId}`);
  return {};
}
