import { createClient } from "@/lib/supabase/server";
import type { Cost, CostCategory } from "@/lib/types";

export async function listCostCategories(): Promise<CostCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cost_categories")
    .select("*")
    .order("label_tr", { ascending: true });
  return (data ?? []) as CostCategory[];
}

export interface ListCostsOptions {
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export async function listCosts(opts: ListCostsOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("costs")
    .select("*, category:cost_categories(*)", { count: "exact" })
    .order("cost_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) query = query.or(`description.ilike.%${s}%,vendor.ilike.%${s}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Cost[], count: count ?? 0, limit, offset };
}

export async function getCost(id: string): Promise<Cost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("costs")
    .select("*, category:cost_categories(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as Cost) ?? null;
}
