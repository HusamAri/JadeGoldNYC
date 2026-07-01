import { createClient } from "@/lib/supabase/server";
import type { Design } from "@/lib/types";

export interface ListDesignOptions {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listDesigns(orgId: string, opts: ListDesignOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 25;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("designs")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) {
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
    }
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Design[], count: count ?? 0, limit, offset };
}

export async function getDesign(id: string): Promise<Design | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("designs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Design) ?? null;
}
