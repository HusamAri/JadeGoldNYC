import { createClient } from "@/lib/supabase/server";
import type { Sale, SaleItem } from "@/lib/types";

/** PostgREST `.or()` filtresine güvenli giriş için temizler. */
function sanitize(term: string): string {
  return term.replace(/[,()%*]/g, " ").trim();
}

export interface ListSalesOptions {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listSales(opts: ListSalesOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("sales")
    .select("*", { count: "exact" })
    .order("order_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) {
    const s = sanitize(opts.search);
    if (s) {
      query = query.or(
        `order_no.ilike.%${s}%,buyer_name.ilike.%${s}%,buyer_email.ilike.%${s}%`,
      );
    }
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Sale[], count: count ?? 0, limit, offset };
}

export async function getSaleWithItems(id: string) {
  const supabase = await createClient();
  const { data: sale, error } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!sale) return null;

  const { data: items } = await supabase
    .from("sale_items")
    .select("*")
    .eq("sale_id", id)
    .order("created_at", { ascending: true });

  return { sale: sale as Sale, items: (items ?? []) as SaleItem[] };
}
