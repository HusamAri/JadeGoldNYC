"use client";

import { Loader2 } from "lucide-react";

import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PricePreviewRow = {
  sku: string;
  label: string;
  grams: number | null;
  beforeCents: number | null;
  afterCents: number | null;
};

export function PriceChangePreviewDialog({
  open,
  onOpenChange,
  rows,
  currency,
  unitLabel,
  confirming,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: PricePreviewRow[];
  currency: string;
  unitLabel?: string | null;
  confirming: boolean;
  onConfirm: () => void;
}) {
  const changed = rows.filter((r) => r.beforeCents !== r.afterCents);
  const up = changed.filter(
    (r) => (r.afterCents ?? 0) > (r.beforeCents ?? 0),
  ).length;
  const down = changed.filter(
    (r) => (r.afterCents ?? 0) < (r.beforeCents ?? 0),
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fiyat değişikliği önizleme</DialogTitle>
          <DialogDescription>
            Henüz kaydedilmedi. Onaylarsan panele yazılır; sonra geri alabilirsin.
            {unitLabel ? ` Birim: ${unitLabel}.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <span>{changed.length} satır değişiyor</span>
          {up > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400">
              {up} artış
            </span>
          )}
          {down > 0 && (
            <span className="text-rose-700 dark:text-rose-400">
              {down} düşüş
            </span>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Gram</TableHead>
                <TableHead className="text-right">Şu an</TableHead>
                <TableHead className="text-right">Yeni</TableHead>
                <TableHead className="text-right">Fark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const delta =
                  r.afterCents != null && r.beforeCents != null
                    ? r.afterCents - r.beforeCents
                    : r.afterCents != null
                      ? r.afterCents
                      : null;
                const changedRow = r.beforeCents !== r.afterCents;
                return (
                  <TableRow
                    key={r.sku}
                    className={cn(changedRow && "bg-primary/5")}
                  >
                    <TableCell>
                      <div className="font-mono text-xs">{r.sku}</div>
                      <div className="text-muted-foreground max-w-[180px] truncate text-[11px]">
                        {r.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.grams != null ? r.grams.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right font-mono text-xs tabular-nums">
                      {r.beforeCents != null
                        ? formatMoney(r.beforeCents, currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium tabular-nums">
                      {r.afterCents != null
                        ? formatMoney(r.afterCents, currency)
                        : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-xs tabular-nums",
                        delta != null && delta > 0 && "text-emerald-700 dark:text-emerald-400",
                        delta != null && delta < 0 && "text-rose-700 dark:text-rose-400",
                        !changedRow && "text-muted-foreground",
                      )}
                    >
                      {delta == null || !changedRow
                        ? "—"
                        : `${delta > 0 ? "+" : ""}${formatMoney(delta, currency)}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={confirming}
            onClick={() => onOpenChange(false)}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={confirming || changed.length === 0}
            onClick={onConfirm}
          >
            {confirming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Onayla ve uygula ({changed.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
