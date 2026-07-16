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
  /** Taraf filtresi: H | Y | I | "none" (atanmamış). */
  bearer?: string;
  limit?: number;
  offset?: number;
}

/** PostgREST builder'ının filtre yüzeyi — dar yapısal tip (derin generic
 *  örneklemesinden kaçınmak için; istemciler zaten tipsiz, lib/types cast'i). */
interface CostFilterBuilder {
  eq(column: string, value: string): CostFilterBuilder;
  is(column: string, value: null): CostFilterBuilder;
  or(filters: string): CostFilterBuilder;
}

function applyCostFilters<T>(query: T, opts: ListCostsOptions): T {
  let q = query as unknown as CostFilterBuilder;
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.bearer === "none") q = q.is("bearer", null);
  else if (opts.bearer) q = q.eq("bearer", opts.bearer);
  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) q = q.or(`description.ilike.%${s}%,vendor.ilike.%${s}%`);
  }
  return q as unknown as T;
}

export async function listCosts(opts: ListCostsOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const query = applyCostFilters(
    supabase
      .from("costs")
      .select("*, category:cost_categories(*)", { count: "exact" }),
    opts,
  )
    .order("cost_date", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Cost[], count: count ?? 0, limit, offset };
}

export interface BearerTotal {
  bearer: "H" | "Y" | "I" | null;
  currency: string;
  amount_cents: number;
  count: number;
}

/**
 * Aktif filtre kümesi için taraf bazlı toplamlar (H/Y/I + atanmamış).
 * Para kuralı gereği kur bazında AYRI toplanır — farklı kurlar tek sayıya
 * karıştırılmaz. Dar kolon çekimi; liste sayfalamasından bağımsız TAM toplam
 * (display-limit'ten sayı türetme dersine uygun).
 */
export async function getCostBearerTotals(
  opts: ListCostsOptions = {},
): Promise<BearerTotal[]> {
  const supabase = await createClient();
  const query = applyCostFilters(
    supabase.from("costs").select("bearer, currency, amount_cents"),
    opts,
  ).limit(10_000);
  const { data, error } = await query;
  if (error) {
    console.error("[costs] bearer toplamları:", error.message);
    return [];
  }
  const agg = new Map<string, BearerTotal>();
  for (const r of (data ?? []) as {
    bearer: "H" | "Y" | "I" | null;
    currency: string | null;
    amount_cents: number | null;
  }[]) {
    const currency = r.currency ?? "USD";
    const key = `${r.bearer ?? "-"}|${currency}`;
    const t =
      agg.get(key) ??
      ({ bearer: r.bearer, currency, amount_cents: 0, count: 0 } as BearerTotal);
    t.amount_cents += r.amount_cents ?? 0;
    t.count += 1;
    agg.set(key, t);
  }
  return [...agg.values()];
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
