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

export interface SalesAnalytics {
  totals: {
    orders: number;
    gross_cents: number;
    fees_cents: number;
    discount_cents: number;
    shipping_cents: number;
    buyers: number;
  };
  monthly: { ym: string; orders: number; gross_cents: number }[];
  countries: { country: string; orders: number; gross_cents: number }[];
}

/**
 * Satışlar dashboard'u için toplu metrikler (DB-side aggregate RPC —
 * sales_analytics, migration 0048). Liste ile aynı status/search filtresine
 * saygı duyar; org RPC içinde current_org_id() ile ayrıca koşullanır.
 */
export async function getSalesAnalytics(
  orgId: string,
  opts: { search?: string; status?: string } = {},
): Promise<SalesAnalytics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sales_analytics", {
    p_org: orgId,
    p_status: opts.status ?? null,
    p_search: opts.search ?? null,
  });
  if (error) throw error;
  const j = (data ?? {}) as Partial<SalesAnalytics>;
  return {
    totals: j.totals ?? {
      orders: 0,
      gross_cents: 0,
      fees_cents: 0,
      discount_cents: 0,
      shipping_cents: 0,
      buyers: 0,
    },
    monthly: j.monthly ?? [],
    countries: j.countries ?? [],
  };
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
