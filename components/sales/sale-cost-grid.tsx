"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  AlertTriangle,
  Undo2,
  ChevronDown,
  Columns3,
} from "lucide-react";

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

/** Özet görünümde gizlenen kolon sayısı — "Kolonlar (N gizli)" etiketi. */
const HIDDEN_IN_SUMMARY = 10;
const DETAIL_KEY = "amuletta.salecost.detail";

function toInput(cents: number, present: boolean): string {
  if (!present || cents === 0) return "";
  return centsToDecimal(cents).toFixed(2);
}

/**
 * Tek satırın düzenlenebilir maliyet hücreleri. Sözleşme (docs/amuletta-2/
 * research-ux.md §4): Enter kaydeder, Esc iptal eder, hücre başına
 * "Kaydedildi ✓"; otomatik motor değeri italik ve soluk, dokununca elle giriş
 * olur. Aktif hücre kabarık (raised), yazılınca inset'e döner.
 */
function CostCells({
  row,
  canEdit,
  kinds,
}: {
  row: SaleItemPnlRow;
  canEdit: boolean;
  kinds: EditableKind[];
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
      setTimeout(() => setSaved(null), 1400);
      router.refresh();
    });
  }

  return (
    <>
      {EDITABLE.filter((e) => kinds.includes(e.kind)).map(({ kind, label }) => (
        <td key={kind} className="px-2 py-1.5 text-right align-middle">
          <div className="relative inline-flex flex-col items-end">
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
                "nm-pressed bg-background h-8 w-[88px] rounded-full border border-[color:var(--hairline)]/70 px-2.5 text-right font-mono text-xs tabular-nums outline-none transition-[box-shadow,background-image] duration-200",
                "focus-visible:[background-image:var(--nm-convex)] focus-visible:[box-shadow:var(--shadow-raised-sm)] focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-60",
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
            <span
              aria-live="polite"
              className={cn(
                "pointer-events-none absolute -bottom-3.5 right-1 inline-flex items-center gap-0.5 font-mono text-[9px] tracking-[0.08em] text-[var(--positive)] uppercase transition-opacity duration-300",
                saved === kind ? "opacity-100" : "opacity-0",
              )}
            >
              {saved === kind && (
                <>
                  <Check aria-hidden className="size-3" /> Kaydedildi
                </>
              )}
            </span>
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
        neg && !zero && "text-[var(--negative)]",
      )}
    >
      {neg && !zero ? "−" : ""}
      {formatMoney(Math.abs(cents), currency)}
    </span>
  );
}

const TH =
  "text-muted-foreground px-2 py-2.5 text-right font-mono text-[10px] font-medium tracking-[0.12em] uppercase whitespace-nowrap";

/** Genişletilmiş satırdaki gizli kolon dökümü — etiket + değer çifti. */
function DetailItem({
  label,
  cents,
  currency,
  neg,
}: {
  label: string;
  cents: number;
  currency: string;
  neg?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
        {label}
      </span>
      <Num cents={cents} currency={currency} neg={neg} />
    </div>
  );
}

/**
 * Excel "satış & maliyet takip" ızgarası — her satır bir satılan kalem.
 *
 * Odaklanması kolay tablo (Amuletta 2.0): varsayılan 9 kolon (tarih, ürün,
 * adet, net gelir, altın, işçilik, taş, net kâr, marj); kalan 10 dağıtım
 * kolonu "Kolonlar (10 gizli)" ile açılır ya da satır başındaki okla tek
 * satır için genişletilir. Tablo düz inset kuyuda durur, ilk iki sütun
 * yapışık, sayılar sağda, tek ince ayraç. Seçim localStorage'da hatırlanır
 * (yalnız rahatlık; okunamazsa özet görünüm).
 */
export function SaleCostGrid({
  rows,
  canEdit,
}: {
  rows: SaleItemPnlRow[];
  canEdit: boolean;
}) {
  // Kolon tercihi yalnız rahatlık: SSR özet görünümle başlar, istemci
  // hydrate olunca localStorage okunur (setState bir effect'te değil, lazy
  // init + hydration bayrağıyla; `react-hooks/set-state-in-effect`).
  const [hydrated, setHydrated] = useState(false);
  const [detailPref, setDetailPref] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const t = setTimeout(() => {
      let pref = false;
      try {
        pref = localStorage.getItem(DETAIL_KEY) === "1";
      } catch {}
      setDetailPref(pref);
      setHydrated(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const detail = hydrated && detailPref;
  const setDetail = setDetailPref;
  function toggleDetail() {
    setDetail((v) => {
      try {
        localStorage.setItem(DETAIL_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
  }
  function toggleRow(id: string) {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const kinds: EditableKind[] = detail
    ? ["gold", "labor", "gem", "packaging"]
    : ["gold", "labor", "gem"];
  const colCount = detail ? 19 : 9;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          <span className="italic">İtalik</span> rakam motor tahminidir (gram × ayar);
          üstüne yazınca elle giriş olur. Enter kaydeder, Esc vazgeçer.
        </p>
        <button
          type="button"
          onClick={toggleDetail}
          aria-pressed={detail}
          className="nm-raised-sm inline-flex h-8 items-center gap-2 rounded-full px-3.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-[box-shadow] hover:[box-shadow:var(--shadow-hover)] focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
        >
          <Columns3 aria-hidden className="size-3.5" />
          {detail ? "Kolonlar: tümü" : `Kolonlar (${HIDDEN_IN_SUMMARY} gizli)`}
        </button>
      </div>
      <div className="table-well">
        <div className="scroll-x">
          <table
            className={cn(
              "w-full border-separate border-spacing-0 text-sm",
              detail ? "min-w-[1480px]" : "min-w-[920px]",
            )}
          >
            <thead>
              <tr className="[&>th]:border-b [&>th]:border-[color:var(--hairline)]">
                <th className={cn(TH, "sticky left-0 z-10 bg-[inherit] text-left")}>
                  Tarih
                </th>
                <th className={cn(TH, "sticky left-[96px] z-10 bg-[inherit] text-left")}>
                  Ürün
                </th>
                <th className={TH}>Adet</th>
                {detail && (
                  <>
                    <th className={TH}>Satış</th>
                    <th className={TH}>İndirim</th>
                    <th className={TH}>Kargo geliri</th>
                    <th className={TH}>İade</th>
                  </>
                )}
                <th className={TH}>Net gelir</th>
                {detail && (
                  <>
                    <th className={TH}>Etsy ücreti</th>
                    <th className={TH}>Etiket</th>
                    <th className={TH}>İade etiketi</th>
                  </>
                )}
                <th className={cn(TH, "text-[color:var(--gold-deep)]")}>Altın</th>
                <th className={cn(TH, "text-[color:var(--gold-deep)]")}>İşçilik</th>
                <th className={cn(TH, "text-[color:var(--gold-deep)]")}>Taş</th>
                {detail && (
                  <>
                    <th className={cn(TH, "text-[color:var(--gold-deep)]")}>Paket</th>
                    <th className={TH}>COGS</th>
                    <th className={TH}>Toplam maliyet</th>
                  </>
                )}
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
                const expanded = !detail && open.has(r.sale_item_id);
                return (
                  <RowGroup key={r.sale_item_id} expanded={expanded} colCount={colCount} row={r}>
                    <tr
                      className={cn(
                        "transition-colors hover:bg-accent/30 focus-within:bg-accent/30 [&>td]:border-b [&>td]:border-[color:var(--border)]",
                        r.status === "cancelled" && "opacity-55",
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-[inherit] px-2 py-2 align-top whitespace-nowrap">
                        <div className="flex items-start gap-1">
                          {!detail && (
                            <button
                              type="button"
                              onClick={() => toggleRow(r.sale_item_id)}
                              aria-expanded={expanded}
                              aria-label={expanded ? "Dağıtımı gizle" : "Dağıtımı göster"}
                              className="text-muted-foreground hover:text-foreground mt-0.5 rounded-full p-0.5 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
                            >
                              <ChevronDown
                                className={cn(
                                  "size-3.5 transition-transform duration-200",
                                  expanded && "rotate-180",
                                )}
                              />
                            </button>
                          )}
                          <div>
                            <Link
                              href={`/satislar/${r.sale_id}`}
                              className="hover:text-foreground block text-xs font-medium"
                            >
                              {formatDate(r.order_date)}
                            </Link>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              #{r.order_no ?? r.etsy_receipt_id ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="sticky left-[96px] z-10 max-w-[280px] bg-[inherit] px-2 py-2 align-top">
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
                              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[color:var(--gold-deep)]" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs tabular-nums">
                        {r.quantity}
                      </td>
                      {detail && (
                        <>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.line_total_cents} currency={r.currency} />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.discount_alloc_cents} currency={r.currency} neg muted />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.shipping_income_alloc_cents} currency={r.currency} muted />
                          </td>
                          <td className="px-2 py-2 text-right">
                            {r.refund_unknown ? (
                              <span className="text-muted-foreground font-mono text-xs">?</span>
                            ) : (
                              <Num cents={r.refund_alloc_cents} currency={r.currency} neg />
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-2 py-2 text-right">
                        <Num cents={r.net_revenue_cents} currency={r.currency} strong />
                      </td>
                      {detail && (
                        <>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.etsy_fees_alloc_cents} currency={r.currency} neg />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.shipping_label_cents} currency={r.currency} neg />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.return_label_cents} currency={r.currency} neg />
                          </td>
                        </>
                      )}
                      <CostCells row={r} canEdit={canEdit} kinds={kinds} />
                      {detail && (
                        <>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.cogs_cents} currency={r.currency} />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Num cents={r.total_cost_cents} currency={r.currency} neg />
                          </td>
                        </>
                      )}
                      <td className="px-2 py-2 text-right">
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold tabular-nums",
                            r.net_profit_cents < 0
                              ? "text-[var(--negative)]"
                              : "text-[var(--positive)]",
                          )}
                        >
                          {r.net_profit_cents < 0 ? "−" : ""}
                          {formatMoney(Math.abs(r.net_profit_cents), r.currency)}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-2 py-2 text-right font-mono text-xs tabular-nums">
                        {margin == null ? "—" : formatPercent(margin, 0)}
                      </td>
                    </tr>
                  </RowGroup>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {!canEdit && (
        <p className="text-muted-foreground text-xs">
          Maliyet girişi yalnız sahip/yönetici rolüne açık.
        </p>
      )}
    </div>
  );
}

/** Satır + (açıksa) altındaki dağıtım satırı — React.Fragment yerine
    anahtarlı sarmalayıcı; tbody'de doğrudan iki <tr> üretir. */
function RowGroup({
  row,
  expanded,
  colCount,
  children,
}: {
  row: SaleItemPnlRow;
  expanded: boolean;
  colCount: number;
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {expanded && (
        <tr className="[&>td]:border-b [&>td]:border-[color:var(--border)]">
          <td colSpan={colCount} className="px-3 py-3">
            <div className="nm-pressed grid gap-x-8 gap-y-1.5 rounded-xl px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Satış" cents={row.line_total_cents} currency={row.currency} />
              <DetailItem label="İndirim" cents={row.discount_alloc_cents} currency={row.currency} neg />
              <DetailItem label="Kargo geliri" cents={row.shipping_income_alloc_cents} currency={row.currency} />
              <DetailItem label="İade" cents={row.refund_alloc_cents} currency={row.currency} neg />
              <DetailItem label="Etsy ücreti" cents={row.etsy_fees_alloc_cents} currency={row.currency} neg />
              <DetailItem label="Etiket" cents={row.shipping_label_cents} currency={row.currency} neg />
              <DetailItem label="İade etiketi" cents={row.return_label_cents} currency={row.currency} neg />
              <DetailItem label="Paket" cents={row.packaging_cents} currency={row.currency} neg />
              <DetailItem label="COGS" cents={row.cogs_cents} currency={row.currency} />
              <DetailItem label="Toplam maliyet" cents={row.total_cost_cents} currency={row.currency} neg />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
