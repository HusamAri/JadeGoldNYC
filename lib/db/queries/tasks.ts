import { createClient } from "@/lib/supabase/server";
import type {
  Role,
  Task,
  TaskWithAssignee,
  TaskAssignee,
  TaskNote,
} from "@/lib/types";

/** Göreve atanabilecek kullanıcı (org üyesi + profil). */
export interface AssignableUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
}

/** Organizasyon üyelerini profil bilgisiyle döndürür (assignee seçici). */
export async function listAssignableUsers(): Promise<AssignableUser[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role");
  const rows = (members ?? []) as { user_id: string; role: Role }[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  const pmap = new Map(
    ((profs ?? []) as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    }[]).map((p) => [p.id, p]),
  );

  return rows.map((r) => ({
    user_id: r.user_id,
    full_name: pmap.get(r.user_id)?.full_name ?? null,
    avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
    role: r.role,
  }));
}

/** Görevlere atanan kullanıcının profilini iliştirir. */
async function attachAssignees(rows: Task[]): Promise<TaskWithAssignee[]> {
  const ids = [
    ...new Set(rows.map((r) => r.assignee_id).filter(Boolean)),
  ] as string[];
  if (ids.length === 0) return rows.map((r) => ({ ...r, assignee: null }));

  const supabase = await createClient();
  const [{ data: profs }, { data: mem }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids),
    supabase.from("organization_members").select("user_id, role").in("user_id", ids),
  ]);
  const pmap = new Map(
    ((profs ?? []) as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    }[]).map((p) => [p.id, p]),
  );
  const rmap = new Map(
    ((mem ?? []) as { user_id: string; role: Role }[]).map((m) => [
      m.user_id,
      m.role,
    ]),
  );

  return rows.map((r) => {
    if (!r.assignee_id) return { ...r, assignee: null };
    const p = pmap.get(r.assignee_id);
    const assignee: TaskAssignee = {
      user_id: r.assignee_id,
      full_name: p?.full_name ?? null,
      avatar_url: p?.avatar_url ?? null,
      role: rmap.get(r.assignee_id) ?? "member",
    };
    return { ...r, assignee };
  });
}

export interface ListTaskOptions {
  assignee?: string;
  lane?: string;
  priority?: string;
  search?: string;
}

/** Tüm görevler (Kanban tahtası; sayfalama yok). */
export async function listTasks(
  opts: ListTaskOptions = {},
): Promise<TaskWithAssignee[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (opts.assignee) query = query.eq("assignee_id", opts.assignee);
  if (opts.lane) query = query.eq("lane", opts.lane);
  if (opts.priority) query = query.eq("priority", opts.priority);
  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return attachAssignees((data ?? []) as Task[]);
}

export async function getTask(id: string): Promise<TaskWithAssignee | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [withAssignee] = await attachAssignees([data as Task]);
  return withAssignee ?? { ...(data as Task), assignee: null };
}

export async function listTaskNotes(taskId: string): Promise<TaskNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_notes")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  return (data ?? []) as TaskNote[];
}

export interface TaskSummary {
  total: number;
  todo: number;
  doing: number;
  done: number;
  p0Open: number;
}

export async function getTaskSummary(): Promise<TaskSummary> {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("status, priority");
  const rows = (data ?? []) as { status: string; priority: string }[];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  return {
    total: rows.length,
    todo: count("todo"),
    doing: count("doing"),
    done: count("done"),
    p0Open: rows.filter((r) => r.priority === "P0" && r.status !== "done").length,
  };
}
