import Link from "next/link";
import { TriangleAlert, ChevronRight, CircleCheck } from "lucide-react";

import type { AlertCenter, AlertSeverity } from "@/lib/db/queries/alerts";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
 * Uyarı Merkezi — sistemin her yerindeki aksiyon gerektiren sinyaller tek
 * yerde, 3 önem derecesine (kritik/önemli/bilgi) ayrılmış ve bedele göre
 * sıralı. "Neler yolunda gitmiyor?" için tek bakış noktası.
 */
export function AlertCenterCard({ data }: { data: AlertCenter }) {
  const { alerts, counts, total, currency } = data;
  const topSeverity: AlertSeverity =
    counts.kritik > 0 ? "kritik" : counts.onemli > 0 ? "onemli" : "bilgi";
  // Görünür önem grupları — başlık çipleri ve gövde aynı listeden beslenir.
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
          <div className="space-y-5">
            {visibleSeverities.map((severity) => {
              const meta = SEVERITY_META[severity];
              const items = alerts.filter((a) => a.severity === severity);
              return (
                <div key={severity} className="space-y-1">
                  <div className="flex items-center gap-2">
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
                  <ul className="divide-y">
                    {items.map((a) => (
                      <li key={a.key}>
                        <Link
                          href={a.href}
                          className="group hover:bg-secondary/40 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {a.title}
                              </span>
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
                          <span className="text-muted-foreground group-hover:text-foreground flex shrink-0 items-center gap-0.5 text-xs font-medium">
                            {a.actionLabel}
                            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </li>
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
