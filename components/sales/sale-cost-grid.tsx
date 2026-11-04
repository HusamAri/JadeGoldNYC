"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, AlertTriangle, Undo2 } from "lucide-react";

import { upsertSaleItemCosts } from "@/app/(dashboard)/satislar/maliyet/actions";
import { formatMoney, formatPercent, centsToDecimal } from "@/lib/money";
import { formatDate } from "@/lib/format";
import {
  isCostIncomplete,
  marginRatio,
  variationLabel,
  type SaleItemPnlRow,
} from "@/lib/pnl";
import { SALE_STATUS_LABELS } from "@/lib/constants";
import type { SaleStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type EditableKind = "gold" | "labor" | "gem" | "packaging";
const EDITABLE: { kind: EditableKind; label: string }[] = [
  { kind: "gold", label: "Altın" },
  { kind: "labor", label: "İşçilik" },
  { kind: "gem", label: "Taş" },
  { kind: "packaging", label: "Paket" },
];

function toInput(cents: number, present: boolean): string {
  if (!present || cents === 0) return "";
  return centsToDecimal(cents).toFixed(2);
}

/** Tek satırın düzenlenebilir maliyet hücreleri — blur/Enter'da kaydeder. */
function CostCells({
  row,
  canEdit,
}: {
  row: SaleItemPnlRow;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial: Record<EditableKind, string> = {
    gold: toInput(row.gold_cents, row.has_gold),
    labor: toInput(row.labor_cents, row.has_labor),
    gem: toInput(row.gem_cents, row.has_gem),
    packaging: toInput(row.packaging_cents, row.has_packaging),
  };
  const [vals, setVals] = useState(initial);
  const [saved, setSaved] = useState<EditableKind | null>(null);
  const manual: Record<EditableKind, boolean> = {
    gold: row.gold_manual,
    labor: row.labor_manual,
    gem: row.gem_manual,
    packaging: row.packaging_manual,
  };

  function commit(kind: EditableKind) {
    const next = vals[kind].trim();
    // Değişmediyse yazma (otomatik değer de "değişmemiş" sayılır → motor
    // satırı elle kopyalanmaz; kullanıcı dokunmadıkça otomatik kalır).
    if (next === initial[kind].trim()) return;
    startTransition(async () => {
      const res = await upsertSaleItemCosts({
        sale_item_id: row.sale_item_id,
        [kind]: next,
      });
      if (res?.error) {
        toast.error(res.error);
        setVals((v) => ({ ...v, [kind]: initial[kind] }));
        return;
      }
      setSaved(kind);
      setTimeout(() => setSaved(null), 1200);
      router.refresh();
    });
  }

  return (
    <>
      {EDITABLE.map(({ kind, label }) => (
        <td key={kind} className="px-2 py-1.5 text-right align-middle">
          <div className="relative inline-flex items-center">
            <input
              aria-label={`${label} maliyeti`}
              inputMode="decimal"
              disabled={!canEdit || pending}
              value={vals[kind]}
              placeholder="—"
              onChange={(e) => setVals((v) => ({ ...v, [kind]: e.target.value }))}
              onBlur={() => commit(kind)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape")
                  setVals((v) => ({ ...v, [kind]: initial[kind] }));
              }}
              className={cn(
                "nm-pressed bg-background h-8 w-[84px] rounded-full px-2.5 text-right font-mono text-xs tabular-nums outline-none",
                "focus:ring-ring/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
                // Elle giriş vs otomatik motor: otomatik değer soluk italik —
                // "bu rakam senin değil, motorun" sinyali; dokunursan senin olur.
                !manual[kind] && vals[kind] !== "" && "text-muted-foreground italic",
              )}
              title={
                manual[kind]
                  ? "Elle girildi"
                  : vals[kind] !== ""
                    ? "Otomatik (gram × ayar motoru). Üzerine yazarsan elle giriş olur."
                    : "Girilmedi"
              }
            />
            {saved === kind && (
              <Check
                aria-hidden
                className="absolute -right-4 size-3.5 text-emerald-600 dark:text-emerald-400"
              />
            )}
          </div>
        </td>
      ))}
    </>
  );
}

function Num({
  cents,
  currency,
  neg,
  strong,
  muted,
}: {
  cents: number;
  currency: string;
  neg?: boolean;
  strong?: boolean;
  muted?: boolean;
}) {
  const zero = cents === 0;
  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums",
        strong && "font-semibold",
        muted && "text-muted-foreground",
        zero && "text-muted-foreground/60",
        neg && !zero && "text-destructive",
      )}
    >
      {neg && !zero ? "−" : ""}
      {formatMoney(Math.abs(cents), currency)}
    </span>
  );
}

const TH =
  "text-muted-foreground px-2 py-2 text-right font-mono text-[10px] font-medium tracking-[0.12em] uppercase whitespace-nowrap";

/**
 * Excel "satış & maliyet takip" ızgarası — her satır bir satılan kalem; gelir
 * tarafı Etsy'den (ücret/iade/etiket dahil), maliyet hücreleri yerinde
 * düzenlenir. Geniş tablo yatay kaydırılır (.scroll-x), ilk iki sütun yapışık.
 */
export function SaleCostGrid({
  rows,
  canEdit,
}: {
  rows: SaleItemPnlRow[];
  canEdit: boolean;
}) {
  return (
    <div className="scroll-x -mx-2 px-2">
      <table className="w-full min-w-[1480px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className={cn(TH, "bg-card sticky left-0 z-10 text-left")}>Tarih</th>
            <th className={cn(TH, "bg-card sticky left-[86px] z-10 text-left")}>Ürün</th>
            <th className={TH}>Adet</th>
            <th className={TH}>Satış</th>
            <th className={TH}>İndirim</th>
            <th className={TH}>Kargo geliri</th>
            <th className={TH}>İade</th>
            <th className={TH}>Net gelir</th>
            <th className={TH}>Etsy ücreti</th>
            <th className={TH}>Etiket</th>
            <th className={TH}>İade etiketi</th>
            <th className={cn(TH, "text-[var(--brand)]")}>Altın</th>
            <th className={cn(TH, "text-[var(--brand)]")}>İşçilik</th>
            <th className={cn(TH, "text-[var(--brand)]")}>Taş</th>
            <th className={cn(TH, "text-[var(--brand)]")}>Paket</th>
            <th className={TH}>COGS</th>
            <th className={TH}>Toplam maliyet</th>
            <th className={TH}>Net kâr</th>
            <th className={TH}>Marj</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const incomplete = isCostIncomplete(r);
            const margin = marginRatio(r.net_profit_cents, r.net_revenue_cents);
            const variation = variationLabel(r.variations);
            const status = SALE_STATUS_LABELS[r.status as SaleStatus] ?? r.status;
            return (
              <tr
                key={r.sale_item_id}
                className={cn(
                  "border-border/60 border-b transition-colors hover:bg-[color-mix(in_oklab,var(--surface-2)_40%,transparent)]",
                  r.status === "cancelled" && "opacity-55",
                )}
              >
                <td className="bg-card sticky left-0 z-10 px-2 py-1.5 align-top whitespace-nowrap">
                  <Link
                    href={`/satislar/${r.sale_id}`}
                    className="hover:text-foreground block text-xs font-medium"
                  >
                    {formatDate(r.order_date)}
                  </Link>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    #{r.order_no ?? r.etsy_receipt_id ?? "—"}
                  </span>
                </td>
                <td className="bg-card sticky left-[86px] z-10 max-w-[260px] px-2 py-1.5 align-top">
                  <div className="flex items-start gap-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium" title={r.title ?? ""}>
                        {r.product_id ? (
                          <Link
                            href={`/tasarimlar/listing/${r.product_id}`}
                            className="hover:underline"
                          >
                            {r.title ?? "—"}
                          </Link>
                        ) : (
                          (r.title ?? "—")
                        )}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-[10px]">
                        {[r.sku, variation].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {r.status !== "completed" && r.status !== "paid" && (
                          <Badge
                            variant={
                              r.status === "refunded" || r.status === "cancelled"
                                ? "destructive"
                                : "outline"
                            }
                            className="h-4 px-1.5 text-[9px]"
                          >
                            {status}
                          </Badge>
                        )}
                        {r.refund_unknown && (
                          <Badge variant="warning" className="h-4 px-1.5 text-[9px]">
                            iade tutarı bekliyor
                          </Badge>
                        )}
                        {r.returned_at && (
                          <Badge variant="secondary" className="h-4 gap-0.5 px-1.5 text-[9px]">
                            <Undo2 className="size-2.5" /> stoğa döndü
                          </Badge>
                        )}
                      </div>
                    </div>
                    {incomplete && (
                      <span title="Altın veya işçilik girilmemiş — net kâr eksik.">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-xs tabular-nums">
                  {r.quantity}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.line_total_cents} currency={r.currency} />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.discount_alloc_cents} currency={r.currency} neg muted />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.shipping_income_alloc_cents} currency={r.currency} muted />
                </td>
                <td className="px-2 py-1.5 text-right">
                  {r.refund_unknown ? (
                    <span className="text-muted-foreground font-mono text-xs">?</span>
                  ) : (
                    <Num cents={r.refund_alloc_cents} currency={r.currency} neg />
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.net_revenue_cents} currency={r.currency} strong />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.etsy_fees_alloc_cents} currency={r.currency} neg />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.shipping_label_cents} currency={r.currency} neg />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.return_label_cents} currency={r.currency} neg />
                </td>
                <CostCells row={r} canEdit={canEdit} />
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.cogs_cents} currency={r.currency} />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Num cents={r.total_cost_cents} currency={r.currency} neg />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <span
                    className={cn(
                      "font-mono text-xs font-semibold tabular-nums",
                      r.net_profit_cents < 0
                        ? "text-destructive"
                        : "text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    {r.net_profit_cents < 0 ? "−" : ""}
                    {formatMoney(Math.abs(r.net_profit_cents), r.currency)}
                  </span>
                </td>
                <td className="text-muted-foreground px-2 py-1.5 text-right font-mono text-xs tabular-nums">
                  {margin == null ? "—" : formatPercent(margin, 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!canEdit && (
        <p className="text-muted-foreground mt-2 text-xs">
          Maliyet girişi yalnız sahip/yönetici rolüne açık.
        </p>
      )}
    </div>
  );
}
