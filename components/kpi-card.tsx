import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "default",
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  accent?: "default" | "positive" | "negative";
}) {
  return (
    <Card className="h-full min-w-0">
      <CardContent className="flex h-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          {/* Etiket için sabit yükseklik ayır: 1 ve 2 satırlı etiketlerde
              değerler aynı hizada başlasın (kutu zıplamasın). */}
          <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm leading-snug">
            {label}
          </p>
          <p
            className={cn(
              // tabular-nums: rakam genişliği sabit → sayı değişince kutu kaymaz.
              "truncate text-2xl font-semibold tracking-tight tabular-nums",
              accent === "positive" && "text-primary",
              accent === "negative" && "text-destructive",
            )}
          >
            {value}
          </p>
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
