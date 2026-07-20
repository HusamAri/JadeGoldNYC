"use client";

import Link from "next/link";
import { TriangleAlert, ChevronRight, CircleCheck } from "lucide-react";

import type { Alert, AlertCenter, AlertSeverity } from "@/lib/db/queries/alerts";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCursorGlow } from "@/components/motion/cursor-glow";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<
  AlertSeverity,
  { label: string; dot: string; text: string; chip: string }
> = {
  kritik: {
    label: "Kritik",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    chip: "bg-red-500/15 text-red-600 dark:text-red-300",
  },
  onemli: {
    label: "Önemli",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
  bilgi: {
    label: "Bilgi",
    dot: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    chip: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
};

const ORDER: AlertSeverity[] = ["kritik", "onemli", "bilgi"];

/**
 * Uyarı Merkezi (liste) — sistemin her yerindeki aksiyon gerektiren sinyaller
 * tek yerde, 3 önem derecesine ayrılmış ve bedele göre sıralı. Board'un yanında
 * "detay + aksiyon" yüzeyi: generous satır aralıkları, cursor-reactive ışık,
 * sakin hover settle. "Neler yolunda gitmiyor?" için tek bakış noktası.
 */
export function AlertCenterCard({ data }: { data: AlertCenter }) {
  const { alerts, counts, total, currency } = data;
  const topSeverity: AlertSeverity =
    counts.kritik > 0 ? "kritik" : counts.onemli > 0 ? "onemli" : "bilgi";
  const visibleSeverities = ORDER.filter((s) => counts[s] > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <TriangleAlert
          className={cn(
            "size-4",
            total > 0 ? SEVERITY_META[topSeverity].text : "text-muted-foreground",
          )}
        />
        <CardTitle className="text-base">Uyarı Merkezi</CardTitle>
        {total > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            {visibleSeverities.map((s) => (
              <span
                key={s}
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums shadow-[var(--shadow-raised-sm)]",
                  SEVERITY_META[s].chip,
                )}
                title={SEVERITY_META[s].label}
              >
                {counts[s]}
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
            <CircleCheck className="size-4 text-emerald-600" />
            Her şey yolunda — aksiyon bekleyen uyarı yok.
          </p>
        ) : (
          <div className="space-y-6">
            {visibleSeverities.map((severity) => {
              const meta = SEVERITY_META[severity];
              const items = alerts.filter((a) => a.severity === severity);
              return (
                <div key={severity} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <span className={cn("size-2 rounded-full", meta.dot)} />
                    <span
                      className={cn(
                        "font-mono text-[10px] font-semibold tracking-[0.16em] uppercase",
                        meta.text,
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                      {items.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {items.map((a) => (
                      <AlertRow
                        key={a.key}
                        alert={a}
                        meta={meta}
                        currency={currency}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Tek uyarı satırı — cursor-reactive ışık + sakin hover settle. */
function AlertRow({
  alert: a,
  meta,
  currency,
}: {
  alert: Alert;
  meta: { label: string; dot: string; text: string; chip: string };
  currency: string;
}) {
  const { ref, onPointerMove } = useCursorGlow<HTMLAnchorElement>();

  return (
    <li>
      <Link
        ref={ref}
        onPointerMove={onPointerMove}
        href={a.href}
        className="group cursor-glow hover:bg-secondary/40 focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background flex items-center gap-3 rounded-xl px-3 py-3 transition-[background-color,transform] duration-300 ease-[var(--ease-premium)] outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">{a.title}</span>
            {a.costCents != null && a.costCents > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
                  meta.chip,
                )}
                title="Dondurulan potansiyel gelir"
              >
                {formatMoney(a.costCents, currency)}
              </span>
            )}
          </span>
          <span className="text-muted-foreground mt-0.5 block text-xs">
            {a.hint}
          </span>
        </span>
        <span className="text-muted-foreground group-hover:text-foreground flex shrink-0 items-center gap-0.5 text-xs font-medium transition-colors">
          {a.actionLabel}
          <ChevronRight className="size-3.5 transition-transform duration-300 ease-[var(--ease-premium)] group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}
