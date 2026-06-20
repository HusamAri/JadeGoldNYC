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
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p
            className={cn(
              "text-2xl font-semibold tracking-tight",
              accent === "positive" && "text-primary",
              accent === "negative" && "text-destructive",
            )}
          >
            {value}
          </p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        {Icon && (
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-lg">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
