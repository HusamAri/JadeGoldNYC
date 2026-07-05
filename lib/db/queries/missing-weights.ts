import { createClient } from "@/lib/supabase/server";

export interface MissingWeightRow {
  sku: string;
  name: string | null;
}

/** Ağırlığı (gram) boş varyantları listeler — arama + sayfalama. */
export async function listVariantsMissingWeight(
  orgId: string,
  opts: { search?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: MissingWeightRow[]; count: number; limit: number; offset: number }> {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("product_variants")
    .select("sku, name", { count: "exact" })
    .eq("org_id", orgId)
    .is("weight_grams", null)
    .order("sku", { ascending: true })
    .range(offset, offset + limit - 1);

  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) query = query.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
  }

  const { data, count } = await query;
  return {
    rows: (data ?? []) as MissingWeightRow[],
    count: count ?? 0,
    limit,
    offset,
  };
}
