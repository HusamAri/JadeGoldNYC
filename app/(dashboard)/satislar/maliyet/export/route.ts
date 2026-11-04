import { requireMembership } from "@/lib/auth";
import { fetchAllPages } from "@/lib/db/queries/listings";
import { createClient } from "@/lib/supabase/server";
import { resolvePeriod } from "@/lib/period";
import { formatDate } from "@/lib/format";
import { centsToDecimal } from "@/lib/money";
import {
  isCostIncomplete,
  marginRatio,
  variationLabel,
  type SaleItemPnlRow,
} from "@/lib/pnl";
import type { PnlListOptions } from "@/lib/db/queries/sale-costs";

function cell(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v);
  // CSV/formül enjeksiyonu: = + - @ ile başlayan değerleri nötrle.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const money = (c: number) => centsToDecimal(c).toFixed(2);

/**
 * Satış & Maliyet Takibi — aktif filtrelerle CSV (Excel'e geri dönüş yolu).
 * Aynı görünüm (sale_item_pnl), aynı filtre mantığı; sayfalama yok (tam küme).
 */
export async function GET(request: Request) {
  const m = await requireMembership();
  const sp = new URL(request.url).searchParams;
  const periodKey = sp.get("period") ?? "all";
  const period = resolvePeriod(periodKey);
  const flag = sp.get("flag") as PnlListOptions["flag"] | null;
  const search = (sp.get("search") ?? "").replace(/[,()%*]/g, " ").trim();
  const status = sp.get("status");

  const supabase = await createClient();
  const rows = await fetchAllPages<SaleItemPnlRow>((from, to) => {
    let q = supabase
      .from("sale_item_pnl")
      .select("*")
      .eq("org_id", m.org_id)
      .order("order_date", { ascending: false })
      .order("sale_item_id", { ascending: true })
      .range(from, to);
    if (status) q = q.eq("status", status);
    else if (flag !== "iade") q = q.neq("status", "cancelled");
    if (periodKey !== "all") {
      if (period.fromIso) q = q.gte("order_date", period.fromIso);
      q = q.lte("order_date", period.toIso);
    }
    if (flag === "eksik") q = q.or("has_gold.eq.false,has_labor.eq.false");
    if (flag === "iade") q = q.in("status", ["refunded", "partially_refunded", "cancelled"]);
    if (flag === "kar-negatif") q = q.lt("net_profit_cents", 0);
    if (search)
      q = q.or(
        `order_no.ilike.%${search}%,title.ilike.%${search}%,sku.ilike.%${search}%,buyer_name.ilike.%${search}%`,
      );
    return q as unknown as PromiseLike<{
      data: SaleItemPnlRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const header = [
    "Tarih", "Sipariş", "Durum", "Ürün", "SKU", "Varyasyon", "Adet", "Para",
    "Satış", "İndirim", "Kargo geliri", "İade", "Net gelir",
    "Etsy ücreti", "Kargo etiketi", "İade etiketi",
    "Altın", "İşçilik", "Taş", "Paketleme", "Geri kazanım", "COGS",
    "Toplam maliyet", "Net kâr", "Marj", "Künye eksik", "İade tutarı bilinmiyor",
    "Altın kaynak", "İşçilik kaynak",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const margin = marginRatio(r.net_profit_cents, r.net_revenue_cents);
    lines.push(
      [
        cell(formatDate(r.order_date)),
        cell(r.order_no ?? r.etsy_receipt_id),
        cell(r.status),
        cell(r.title),
        cell(r.sku),
        cell(variationLabel(r.variations)),
        cell(r.quantity),
        cell(r.currency),
        cell(money(r.line_total_cents)),
        cell(money(r.discount_alloc_cents)),
        cell(money(r.shipping_income_alloc_cents)),
        cell(r.refund_unknown ? "?" : money(r.refund_alloc_cents)),
        cell(money(r.net_revenue_cents)),
        cell(money(r.etsy_fees_alloc_cents)),
        cell(money(r.shipping_label_cents)),
        cell(money(r.return_label_cents)),
        cell(r.has_gold ? money(r.gold_cents) : ""),
        cell(r.has_labor ? money(r.labor_cents) : ""),
        cell(r.has_gem ? money(r.gem_cents) : ""),
        cell(r.has_packaging ? money(r.packaging_cents) : ""),
        cell(money(r.recovered_cents)),
        cell(money(r.cogs_cents)),
        cell(money(r.total_cost_cents)),
        cell(money(r.net_profit_cents)),
        cell(margin == null ? "" : (margin * 100).toFixed(1)),
        cell(isCostIncomplete(r) ? "evet" : ""),
        cell(r.refund_unknown ? "evet" : ""),
        cell(r.has_gold ? (r.gold_manual ? "elle" : "motor") : ""),
        cell(r.has_labor ? (r.labor_manual ? "elle" : "motor") : ""),
      ].join(","),
    );
  }
  const csv = "﻿" + lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="satis-maliyet-takip-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
