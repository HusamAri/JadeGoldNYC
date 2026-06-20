import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/lib/types";

export interface ListAuditOptions {
  entityType?: string;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listAudit(opts: ListAuditOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.entityType) query = query.eq("entity_type", opts.entityType);
  if (opts.action) query = query.eq("action", opts.action);
  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) query = query.or(`summary.ilike.%${s}%,actor_label.ilike.%${s}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as AuditLog[], count: count ?? 0, limit, offset };
}

export async function recentActivity(limit = 8): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AuditLog[];
}
