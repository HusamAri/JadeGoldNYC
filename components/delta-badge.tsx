import { ArrowUp, ArrowDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/money";

/**
 * Önceki döneme göre yüzde değişim rozeti. `goodWhenUp` artışın iyi mi kötü mü
 * olduğunu belirler (gelir için true, maliyet/sepette terk için false).
 */
export function DeltaBadge({
  deltaPct,
  goodWhenUp = true,
}: {
  deltaPct: number | null;
  goodWhenUp?: boolean;
}) {
  if (deltaPct == null || !Number.isFinite(deltaPct)) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  const up = deltaPct > 0.0001;
  const down = deltaPct < -0.0001;
  const good = (up && goodWhenUp) || (down && !goodWhenUp);
  const bad = (up && !goodWhenUp) || (down && goodWhenUp);
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        good && "text-primary",
        bad && "text-destructive",
        !good && !bad && "text-muted-foreground",
      )}
    >
      <Icon className="size-3" />
      {formatPercent(Math.abs(deltaPct))}
    </span>
  );
}
