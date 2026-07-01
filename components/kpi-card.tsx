import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatChange(change: number): string {
  const pct = Math.abs(change * 100);
  const arrow = change >= 0 ? "↑" : "↓";
  return `${arrow} %${pct.toFixed(1)}`;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "default",
  change,
  changeLabel,
  className,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  accent?: "default" | "positive" | "negative";
  /** -1..1 arası yüzde değişim. null = gösterme. */
  change?: number | null;
  changeLabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("h-full min-w-0", className)}>
      <CardContent className="flex h-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm leading-snug">
            {label}
          </p>
          <p
            className={cn(
              "truncate text-2xl font-semibold tracking-tight tabular-nums",
              accent === "positive" && "text-primary",
              accent === "negative" && "text-destructive",
            )}
          >
            {value}
          </p>
          {change != null && (
            <p
              className={cn(
                "mt-1 text-xs font-medium tabular-nums",
                change > 0 && "text-emerald-600",
                change < 0 && "text-red-500",
                change === 0 && "text-muted-foreground",
              )}
            >
              {formatChange(change)}
              {changeLabel && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  {changeLabel}
                </span>
              )}
            </p>
          )}
          {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
        </div>
        {Icon && (
          <div className="bg-accent text-accent-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-[var(--shadow-raised-sm)]">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
