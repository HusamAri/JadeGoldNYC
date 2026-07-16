import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";
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
  // Arama terimini LİSTE ile AYNI şekilde temizle (sanitize) ki özet ile tablo
  // aynı satır kümesini saysın; boşsa filtre uygulanmasın (null).
  const cleaned = opts.search ? sanitize(opts.search) : "";
  const { data, error } = await supabase.rpc("sales_analytics", {
    p_org: orgId,
    p_status: opts.status ?? null,
    p_search: cleaned || null,
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

export interface MonthlySalesPoint {
  /** "YYYY-MM" */
  ym: string;
  orders: number;
  gross_cents: number;
}

/**
 * Son `months` ayın aylık ciro/sipariş toplamları — sales_analytics RPC'siyle
 * AYNI filtre mantığı (org + status/search; status filtresi yoksa iptaller
 * hariç — status NOT NULL, 0005). RPC'nin 12 aylık penceresi değiştirilmeden,
 * YoY overlay + MoM/YoY rozetleri için daha geniş pencere (varsayılan 24 ay)
 * dar kolonlarla sayfalı çekilir ve TS tarafında aylıklaştırılır.
 * Tutarlar cent (RPC gibi grand_total_cents toplamı).
 */
export async function getMonthlySalesSeries(
  orgId: string,
  opts: { months?: number; search?: string; status?: string } = {},
): Promise<MonthlySalesPoint[]> {
  const supabase = await createClient();
  const months = opts.months ?? 24;
  const now = new Date();
  // Pencere başı: (months-1) ay öncesinin ay başı — RPC'nin
  // date_trunc('month', now()) - interval mantığıyla aynı hizada.
  const fromIso = new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1,
  ).toISOString();
  const cleaned = opts.search ? sanitize(opts.search) : "";

  const rows = await fetchAllPages<{
    order_date: string;
    grand_total_cents: number | null;
  }>((from, to) => {
    let q = supabase
      .from("sales")
      .select("order_date, grand_total_cents")
      // Multi-tenant kilidi: RLS'in aktif-org varsayımına yaslanma.
      .eq("org_id", orgId)
      .gte("order_date", fromIso)
      .order("order_date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);
    if (opts.status) q = q.eq("status", opts.status);
    else q = q.neq("status", "cancelled");
    if (cleaned) {
      q = q.or(
        `order_no.ilike.%${cleaned}%,buyer_name.ilike.%${cleaned}%,buyer_email.ilike.%${cleaned}%`,
      );
    }
    return q;
  });

  const byYm = new Map<string, { orders: number; gross_cents: number }>();
  for (const r of rows) {
    const ym = r.order_date.slice(0, 7);
    const e = byYm.get(ym) ?? { orders: 0, gross_cents: 0 };
    e.orders += 1;
    e.gross_cents += r.grand_total_cents ?? 0;
    byYm.set(ym, e);
  }
  return [...byYm.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, v]) => ({ ym, ...v }));
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
