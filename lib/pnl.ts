import type { CostKind } from "@/lib/types";

/**
 * Satış & Maliyet Takibi — saf yardımcılar (içe aktarmasız motor).
 *
 * Kurallar (docs/satis-maliyet-takip.md):
 *  - Gelir = ürün + alıcı kargosu − indirim; VERGİ GELİR DEĞİL (Etsy toplar/öder).
 *  - İade = kontra gelir. COGS = altın + işçilik + taş + paketleme − geri kazanım.
 *  - Etsy ücretleri + kargo/iade etiketleri = satış gideri (COGS değil).
 *  - Marj = net kâr / net gelir; net gelir 0 ise tanımsız (null) — "%0" değil.
 */

export const ITEM_COST_KINDS = ["gold", "labor", "gem", "packaging", "other"] as const;
export type ItemCostKind = (typeof ITEM_COST_KINDS)[number];

export const COST_KIND_META: Record<
  CostKind,
  { label: string; short: string; categoryKey: string; cogs: boolean }
> = {
  gold: { label: "Altın", short: "Altın", categoryKey: "malzeme", cogs: true },
  labor: { label: "İşçilik", short: "İşçilik", categoryKey: "iscilik", cogs: true },
  gem: { label: "Taş / Gem", short: "Taş", categoryKey: "tas", cogs: true },
  packaging: { label: "Paketleme", short: "Paket", categoryKey: "paketleme", cogs: true },
  shipping_label: { label: "Kargo etiketi", short: "Etiket", categoryKey: "kargo", cogs: false },
  return_label: { label: "İade kargo etiketi", short: "İade etiketi", categoryKey: "kargo", cogs: false },
  other: { label: "Diğer", short: "Diğer", categoryKey: "diger", cogs: false },
};

export function isItemCostKind(v: string): v is ItemCostKind {
  return (ITEM_COST_KINDS as readonly string[]).includes(v);
}

/** sale_item_pnl görünümünün satırı (lib/db/queries/sale-costs.ts cast eder). */
export interface SaleItemPnlRow {
  sale_item_id: string;
  sale_id: string;
  org_id: string;
  product_id: string | null;
  etsy_listing_id: number | null;
  etsy_transaction_id: number | null;
  order_no: string | null;
  etsy_receipt_id: number | null;
  order_date: string;
  status: string;
  buyer_name: string | null;
  ship_country: string | null;
  title: string | null;
  sku: string | null;
  variations: { formatted_name?: string; formatted_value?: string }[] | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  currency: string;
  shipped_at: string | null;
  returned_at: string | null;
  recovered_cents: number;
  refunds_synced_at: string | null;
  refund_count: number;
  share: number;
  discount_alloc_cents: number;
  shipping_income_alloc_cents: number;
  tax_alloc_cents: number;
  refund_alloc_cents: number;
  gross_revenue_cents: number;
  net_revenue_cents: number;
  etsy_fees_alloc_cents: number;
  shipping_label_cents: number;
  return_label_cents: number;
  other_cost_cents: number;
  gold_cents: number;
  labor_cents: number;
  gem_cents: number;
  packaging_cents: number;
  cogs_cents: number;
  total_cost_cents: number;
  net_profit_cents: number;
  has_gold: boolean;
  has_labor: boolean;
  has_gem: boolean;
  has_packaging: boolean;
  gold_manual: boolean;
  labor_manual: boolean;
  gem_manual: boolean;
  packaging_manual: boolean;
  refund_unknown: boolean;
}

/** Marj oranı (0..1); net gelir ≤ 0 ise null (sıfıra bölme / anlamsız). */
export function marginRatio(netProfitCents: number, netRevenueCents: number): number | null {
  if (!(netRevenueCents > 0)) return null;
  return netProfitCents / netRevenueCents;
}

/** Kalem için "maliyet künyesi eksik" mi — altın VEYA işçilik hiç yoksa. */
export function isCostIncomplete(
  r: Pick<SaleItemPnlRow, "has_gold" | "has_labor" | "status">,
): boolean {
  if (r.status === "cancelled") return false;
  return !r.has_gold || !r.has_labor;
}

export interface PnlTotals {
  items: number;
  units: number;
  orders: number;
  gross_revenue_cents: number;
  refund_cents: number;
  net_revenue_cents: number;
  etsy_fees_cents: number;
  shipping_label_cents: number;
  return_label_cents: number;
  other_cost_cents: number;
  gold_cents: number;
  labor_cents: number;
  gem_cents: number;
  packaging_cents: number;
  recovered_cents: number;
  cogs_cents: number;
  total_cost_cents: number;
  net_profit_cents: number;
  /** net kâr / net gelir; net gelir ≤ 0 ise null. */
  margin: number | null;
  /** Altın veya işçilik girilmemiş kalem sayısı (iptal hariç). */
  incomplete_items: number;
  /** Durumu iade olup Etsy iade tutarı henüz okunmamış kalem sayısı. */
  refund_unknown_items: number;
}

type TotalsInput = Pick<
  SaleItemPnlRow,
  | "sale_id"
  | "quantity"
  | "status"
  | "gross_revenue_cents"
  | "refund_alloc_cents"
  | "net_revenue_cents"
  | "etsy_fees_alloc_cents"
  | "shipping_label_cents"
  | "return_label_cents"
  | "other_cost_cents"
  | "gold_cents"
  | "labor_cents"
  | "gem_cents"
  | "packaging_cents"
  | "recovered_cents"
  | "cogs_cents"
  | "total_cost_cents"
  | "net_profit_cents"
  | "has_gold"
  | "has_labor"
  | "refund_unknown"
>;

/** Satır kümesinin toplamları — TEK para birimi varsayar (çağıran filtreler). */
export function summarizePnl(rows: TotalsInput[]): PnlTotals {
  const t: PnlTotals = {
    items: 0,
    units: 0,
    orders: 0,
    gross_revenue_cents: 0,
    refund_cents: 0,
    net_revenue_cents: 0,
    etsy_fees_cents: 0,
    shipping_label_cents: 0,
    return_label_cents: 0,
    other_cost_cents: 0,
    gold_cents: 0,
    labor_cents: 0,
    gem_cents: 0,
    packaging_cents: 0,
    recovered_cents: 0,
    cogs_cents: 0,
    total_cost_cents: 0,
    net_profit_cents: 0,
    margin: null,
    incomplete_items: 0,
    refund_unknown_items: 0,
  };
  const orders = new Set<string>();
  for (const r of rows) {
    t.items += 1;
    t.units += r.quantity;
    orders.add(r.sale_id);
    t.gross_revenue_cents += r.gross_revenue_cents;
    t.refund_cents += r.refund_alloc_cents;
    t.net_revenue_cents += r.net_revenue_cents;
    t.etsy_fees_cents += r.etsy_fees_alloc_cents;
    t.shipping_label_cents += r.shipping_label_cents;
    t.return_label_cents += r.return_label_cents;
    t.other_cost_cents += r.other_cost_cents;
    t.gold_cents += r.gold_cents;
    t.labor_cents += r.labor_cents;
    t.gem_cents += r.gem_cents;
    t.packaging_cents += r.packaging_cents;
    t.recovered_cents += r.recovered_cents;
    t.cogs_cents += r.cogs_cents;
    t.total_cost_cents += r.total_cost_cents;
    t.net_profit_cents += r.net_profit_cents;
    if (isCostIncomplete(r)) t.incomplete_items += 1;
    if (r.refund_unknown) t.refund_unknown_items += 1;
  }
  t.orders = orders.size;
  t.margin = marginRatio(t.net_profit_cents, t.net_revenue_cents);
  return t;
}

// ── Ürün özelinde maliyet tarihçesi (işçilik/altın/taş birim başına) ─────

export interface CostHistoryPoint {
  sale_item_id: string;
  sale_id: string;
  order_date: string;
  order_no: string | null;
  sku: string | null;
  variation: string | null;
  quantity: number;
  /** Birim başına (cent) — adet > 1 ise satır toplamı adede bölünür. */
  gold_unit_cents: number | null;
  labor_unit_cents: number | null;
  gem_unit_cents: number | null;
  net_profit_unit_cents: number;
  net_revenue_unit_cents: number;
  labor_manual: boolean;
}

export interface CostHistoryStats {
  points: CostHistoryPoint[];
  /** Son girilen işçilik (birim) ve bir önceki — değişim bunların farkıdır. */
  last_labor_unit_cents: number | null;
  prev_labor_unit_cents: number | null;
  /** last − prev (cent); ikisi de yoksa null. */
  labor_delta_cents: number | null;
  /** (last − prev) / prev; prev 0/yoksa null. */
  labor_delta_ratio: number | null;
  avg_labor_unit_cents: number | null;
  min_labor_unit_cents: number | null;
  max_labor_unit_cents: number | null;
  last_gold_unit_cents: number | null;
  avg_gold_unit_cents: number | null;
  units_sold: number;
  net_profit_cents: number;
  net_revenue_cents: number;
  margin: number | null;
}

export function variationLabel(
  v: { formatted_name?: string; formatted_value?: string }[] | null | undefined,
): string | null {
  if (!v || v.length === 0) return null;
  const parts = v
    .map((x) => (x.formatted_value ?? "").trim())
    .filter((s) => s.length > 0);
  return parts.length ? parts.join(" · ") : null;
}

function perUnit(total: number, qty: number, present: boolean): number | null {
  if (!present) return null;
  const q = qty > 0 ? qty : 1;
  return Math.round(total / q);
}

/**
 * Ürünün satış kalemlerinden maliyet tarihçesi: tarihe göre artan sıra;
 * işçilik/altın/taş yalnız GİRİLMİŞSE nokta olur (0 uydurulmaz). "Değişim"
 * son iki işçilik girişinin farkıdır — kullanıcı sorusu: "aynı listing'den iki
 * satıldığında işçilik ücretindeki değişimi görebileyim".
 */
export function buildCostHistory(
  rows: Pick<
    SaleItemPnlRow,
    | "sale_item_id"
    | "sale_id"
    | "order_date"
    | "order_no"
    | "sku"
    | "variations"
    | "quantity"
    | "status"
    | "gold_cents"
    | "labor_cents"
    | "gem_cents"
    | "has_gold"
    | "has_labor"
    | "has_gem"
    | "labor_manual"
    | "net_profit_cents"
    | "net_revenue_cents"
  >[],
): CostHistoryStats {
  const sorted = rows
    .filter((r) => r.status !== "cancelled")
    .slice()
    .sort((a, b) => a.order_date.localeCompare(b.order_date));
  const points: CostHistoryPoint[] = sorted.map((r) => ({
    sale_item_id: r.sale_item_id,
    sale_id: r.sale_id,
    order_date: r.order_date,
    order_no: r.order_no,
    sku: r.sku,
    variation: variationLabel(r.variations),
    quantity: r.quantity,
    gold_unit_cents: perUnit(r.gold_cents, r.quantity, r.has_gold),
    labor_unit_cents: perUnit(r.labor_cents, r.quantity, r.has_labor),
    gem_unit_cents: perUnit(r.gem_cents, r.quantity, r.has_gem),
    net_profit_unit_cents: perUnit(r.net_profit_cents, r.quantity, true) ?? 0,
    net_revenue_unit_cents: perUnit(r.net_revenue_cents, r.quantity, true) ?? 0,
    labor_manual: r.labor_manual,
  }));
  const labor = points
    .map((p) => p.labor_unit_cents)
    .filter((v): v is number => v != null);
  const gold = points
    .map((p) => p.gold_unit_cents)
    .filter((v): v is number => v != null);
  const last = labor.length ? labor[labor.length - 1] : null;
  const prev = labor.length > 1 ? labor[labor.length - 2] : null;
  const avg = (xs: number[]) =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  let units = 0;
  let profit = 0;
  let revenue = 0;
  for (const r of sorted) {
    units += r.quantity;
    profit += r.net_profit_cents;
    revenue += r.net_revenue_cents;
  }
  return {
    points,
    last_labor_unit_cents: last,
    prev_labor_unit_cents: prev,
    labor_delta_cents: last != null && prev != null ? last - prev : null,
    labor_delta_ratio:
      last != null && prev != null && prev !== 0 ? (last - prev) / prev : null,
    avg_labor_unit_cents: avg(labor),
    min_labor_unit_cents: labor.length ? Math.min(...labor) : null,
    max_labor_unit_cents: labor.length ? Math.max(...labor) : null,
    last_gold_unit_cents: gold.length ? gold[gold.length - 1] : null,
    avg_gold_unit_cents: avg(gold),
    units_sold: units,
    net_profit_cents: profit,
    net_revenue_cents: revenue,
    margin: marginRatio(profit, revenue),
  };
}
