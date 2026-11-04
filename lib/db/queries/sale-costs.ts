import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";
import {
  buildCostHistory,
  summarizePnl,
  type CostHistoryStats,
  type PnlTotals,
  type SaleItemPnlRow,
} from "@/lib/pnl";
import type { Cost, SaleRefund, SaleShipment } from "@/lib/types";

/**
 * Satış & Maliyet Takibi sorguları — hepsi `sale_item_pnl` görünümünden
 * (security_invoker → RLS). Multi-tenant kilidi: org_id AÇIKÇA eşlenir.
 */

/** PostgREST `.or()` filtresine güvenli giriş. */
function sanitize(term: string): string {
  return term.replace(/[,()%*]/g, " ").trim();
}

export interface PnlListOptions {
  search?: string;
  status?: string;
  /** ISO tarih alt/üst sınırı (order_date). */
  from?: string;
  to?: string;
  /** "eksik" = altın veya işçilik girilmemiş; "iade" = iade/iptal durumları. */
  flag?: "eksik" | "iade" | "kar-negatif";
  productId?: string;
  limit?: number;
  offset?: number;
}

interface PnlBuilder {
  eq(c: string, v: string): PnlBuilder;
  neq(c: string, v: string): PnlBuilder;
  gte(c: string, v: string): PnlBuilder;
  lte(c: string, v: string): PnlBuilder;
  lt(c: string, v: number): PnlBuilder;
  in(c: string, v: string[]): PnlBuilder;
  or(f: string): PnlBuilder;
}

function applyFilters<T>(query: T, orgId: string, o: PnlListOptions): T {
  let q = (query as unknown as PnlBuilder).eq("org_id", orgId);
  if (o.status) q = q.eq("status", o.status);
  else if (o.flag !== "iade") q = q.neq("status", "cancelled");
  if (o.from) q = q.gte("order_date", o.from);
  if (o.to) q = q.lte("order_date", o.to);
  if (o.productId) q = q.eq("product_id", o.productId);
  if (o.flag === "eksik") q = q.or("has_gold.eq.false,has_labor.eq.false");
  if (o.flag === "iade")
    q = q.in("status", ["refunded", "partially_refunded", "cancelled"]);
  if (o.flag === "kar-negatif") q = q.lt("net_profit_cents", 0);
  if (o.search) {
    const s = sanitize(o.search);
    if (s)
      q = q.or(
        `order_no.ilike.%${s}%,title.ilike.%${s}%,sku.ilike.%${s}%,buyer_name.ilike.%${s}%`,
      );
  }
  return q as unknown as T;
}

export async function listSaleItemPnl(orgId: string, opts: PnlListOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const query = applyFilters(
    supabase.from("sale_item_pnl").select("*", { count: "exact" }),
    orgId,
    opts,
  )
    .order("order_date", { ascending: false })
    .order("sale_item_id", { ascending: true })
    .range(offset, offset + limit - 1);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as SaleItemPnlRow[], count: count ?? 0, limit, offset };
}

/** Dar kolonlarla TAM küme (display-limit'ten sayı türetme dersine uygun). */
const TOTAL_COLS =
  "sale_id, quantity, status, currency, gross_revenue_cents, refund_alloc_cents, net_revenue_cents, etsy_fees_alloc_cents, shipping_label_cents, return_label_cents, other_cost_cents, gold_cents, labor_cents, gem_cents, packaging_cents, recovered_cents, cogs_cents, total_cost_cents, net_profit_cents, has_gold, has_labor, refund_unknown";

export interface PnlTotalsByCurrency {
  currency: string;
  totals: PnlTotals;
}

/** Filtre kümesinin toplamları — para birimine göre AYRI (kurlar karışmaz). */
export async function getSaleItemPnlTotals(
  orgId: string,
  opts: PnlListOptions = {},
): Promise<PnlTotalsByCurrency[]> {
  const supabase = await createClient();
  type Row = Parameters<typeof summarizePnl>[0][number] & { currency: string };
  const rows = await fetchAllPages<Row>((from, to) =>
    applyFilters(supabase.from("sale_item_pnl").select(TOTAL_COLS), orgId, opts)
      .order("order_date", { ascending: false })
      .order("sale_item_id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<{
      data: Row[] | null;
      error: { message: string } | null;
    }>,
  );
  const byCur = new Map<string, Row[]>();
  for (const r of rows) {
    const c = r.currency ?? "USD";
    const arr = byCur.get(c) ?? [];
    arr.push(r);
    byCur.set(c, arr);
  }
  return [...byCur.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, rs]) => ({ currency, totals: summarizePnl(rs) }));
}

/** Tek siparişin kalemleri (K/Z) — satış detay sayfası. */
export async function getSalePnlItems(saleId: string): Promise<SaleItemPnlRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_item_pnl")
    .select("*")
    .eq("sale_id", saleId)
    .order("title", { ascending: true });
  if (error) {
    console.error("[sale-costs] sale_item_pnl:", error.message);
    return [];
  }
  return (data ?? []) as SaleItemPnlRow[];
}

export async function getSaleRefunds(saleId: string): Promise<SaleRefund[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_refunds")
    .select("*")
    .eq("sale_id", saleId)
    .order("refunded_at", { ascending: false });
  if (error) {
    console.error("[sale-costs] sale_refunds:", error.message);
    return [];
  }
  return (data ?? []) as SaleRefund[];
}

export async function getSaleShipments(saleId: string): Promise<SaleShipment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_shipments")
    .select("*")
    .eq("sale_id", saleId)
    .order("notified_at", { ascending: false });
  if (error) {
    console.error("[sale-costs] sale_shipments:", error.message);
    return [];
  }
  return (data ?? []) as SaleShipment[];
}

/** Siparişe bağlı TÜM maliyet satırları (kalem + sipariş seviyesi), kaynak dahil. */
export async function getSaleCostRows(saleId: string): Promise<Cost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("costs")
    .select("*, category:cost_categories(*)")
    .eq("sale_id", saleId)
    .order("cost_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[sale-costs] costs:", error.message);
    return [];
  }
  return (data ?? []) as Cost[];
}

/** Kalem × tür elle giriş notları (form ön-dolumu için). */
export async function getManualItemCostNotes(
  saleItemIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (saleItemIds.length === 0) return map;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("costs")
    .select("sale_item_id, cost_kind, notes")
    .in("sale_item_id", saleItemIds)
    .eq("source", "manual")
    .not("cost_kind", "is", null);
  if (error) {
    console.error("[sale-costs] manual notes:", error.message);
    return map;
  }
  for (const r of (data ?? []) as {
    sale_item_id: string;
    cost_kind: string;
    notes: string | null;
  }[]) {
    if (r.notes) map.set(`${r.sale_item_id}:${r.cost_kind}`, r.notes);
  }
  return map;
}

export interface UnlinkedLabelEntry {
  entry_id: number;
  ledger_type: string;
  amount_cents: number;
  currency: string;
  entry_date: string;
  is_return: boolean;
}

/**
 * Siparişe bağlanmamış Etsy kargo etiketi ledger kayıtları (iade etiketi
 * dahil). Etsy API etiket↔sipariş bağı vermez; iade etiketi zamanla da
 * eşleşmez → kullanıcı sipariş detayından elle bağlar. `aroundIso` verilirse
 * ±45 gün penceresi, yakınlık sırası.
 */
export async function listUnlinkedLabelEntries(
  orgId: string,
  opts: { aroundIso?: string; returnOnly?: boolean; limit?: number } = {},
): Promise<UnlinkedLabelEntry[]> {
  const supabase = await createClient();
  const types = opts.returnOnly
    ? ["shipping_labels_usps_return"]
    : ["shipping_labels", "shipping_labels_usps_return", "shipping_label_insurance"];
  let q = supabase
    .from("etsy_ledger_entries")
    .select("entry_id, ledger_type, amount_cents, currency, entry_date")
    .eq("org_id", orgId)
    .eq("reference_type", "shipping_label")
    .in("ledger_type", types)
    .lt("amount_cents", 0)
    .order("entry_date", { ascending: false })
    .limit(opts.limit ?? 400);
  if (opts.aroundIso) {
    const t = new Date(opts.aroundIso).getTime();
    const win = 45 * 86_400_000;
    q = q
      .gte("entry_date", new Date(t - win).toISOString())
      .lte("entry_date", new Date(t + win).toISOString());
  }
  const { data, error } = await q;
  if (error) {
    console.error("[sale-costs] ledger labels:", error.message);
    return [];
  }
  const entries = (data ?? []) as {
    entry_id: number;
    ledger_type: string;
    amount_cents: number;
    currency: string | null;
    entry_date: string;
  }[];
  if (entries.length === 0) return [];

  const keys = entries.map((e) => `ledger:${e.entry_id}`);
  const { data: linked, error: linkErr } = await supabase
    .from("costs")
    .select("external_key")
    .eq("org_id", orgId)
    .in("external_key", keys);
  if (linkErr) console.error("[sale-costs] linked keys:", linkErr.message);
  const linkedSet = new Set(
    ((linked ?? []) as { external_key: string }[]).map((l) => l.external_key),
  );
  const out = entries
    .filter((e) => !linkedSet.has(`ledger:${e.entry_id}`))
    .map((e) => ({
      entry_id: e.entry_id,
      ledger_type: e.ledger_type,
      amount_cents: -e.amount_cents,
      currency: e.currency ?? "USD",
      entry_date: e.entry_date,
      is_return: e.ledger_type === "shipping_labels_usps_return",
    }));
  if (opts.aroundIso) {
    const t = new Date(opts.aroundIso).getTime();
    out.sort(
      (a, b) =>
        Math.abs(new Date(a.entry_date).getTime() - t) -
        Math.abs(new Date(b.entry_date).getTime() - t),
    );
  }
  return out;
}

/** Ürün özelinde satış + maliyet tarihçesi (listing detay paneli). */
export async function getProductCostHistory(
  orgId: string,
  productId: string,
): Promise<{ rows: SaleItemPnlRow[]; stats: CostHistoryStats }> {
  const supabase = await createClient();
  const rows = await fetchAllPages<SaleItemPnlRow>((from, to) =>
    supabase
      .from("sale_item_pnl")
      .select("*")
      .eq("org_id", orgId)
      .eq("product_id", productId)
      .order("order_date", { ascending: false })
      .order("sale_item_id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<{
      data: SaleItemPnlRow[] | null;
      error: { message: string } | null;
    }>,
  );
  return { rows, stats: buildCostHistory(rows) };
}

/** Durumu iade olup iade tutarı henüz Etsy'den okunmamış sipariş sayısı. */
export async function countRefundBacklog(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .in("status", ["refunded", "partially_refunded"])
    .not("etsy_receipt_id", "is", null)
    .is("refunds_synced_at", null);
  if (error) {
    console.error("[sale-costs] refund backlog:", error.message);
    return 0;
  }
  return count ?? 0;
}
