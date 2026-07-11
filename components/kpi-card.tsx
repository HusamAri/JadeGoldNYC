import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function formatChange(change: number): string {
  const pct = Math.abs(change * 100);
  const arrow = change >= 0 ? "↑" : "↓";
  return `${arrow} %${pct.toFixed(1)}`;
}

// NOT: Bu bir SUNUCU bileşenidir — `icon` prop'u bir React bileşeni (LucideIcon)
// olduğundan client bileşenine dönüştürülemez (RSC sınırından fonksiyon/
// bileşen geçilemez). Hover hareketi bu yüzden CSS ile yapılır (framer-motion
// değil). prefers-reduced-motion'da global kural geçişi durdurur.
export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "default",
  change,
  changeLabel,
  className,
  splitTone = false,
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
  /**
   * Panelin TEK bir hero/öne çıkan KPI'ı için: iki tonlu büyük rakam
   * (üstte nötr, altta sıcak antik altın — bkz. IMG_5669). Tüm KPI
   * kartlarında değil, yalnız en kritik metrikte kullanın.
   */
  splitTone?: boolean;
}) {
  return (
    // Liquid glass board — dev puntolu rakam bu camın üstünde yüzer. Yalnız
    // KPI/istatistik kartlarında (rakamsal board) kullanılır; buzlu cam,
    // içine gömülü renk sızıntısı ve lift gölgesiyle "cam" belirgin okunur.
    <div
      className={cn(
        "glass-board relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] px-6 py-6 transition-transform duration-200 ease-[var(--ease-premium)] hover:-translate-y-[3px]",
        className,
      )}
    >
      <div className="flex h-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm leading-snug">
            {label}
          </p>
          <p
            className={cn(
              "truncate font-semibold tracking-tight tabular-nums",
              splitTone ? "text-4xl leading-tight jg-split-tone" : "text-2xl",
              !splitTone && accent === "positive" && "text-primary",
              !splitTone && accent === "negative" && "text-destructive",
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
          // İkon kuyusu — cam board üstünde hafif frosted çip (ince hairline +
          // highlight); kart zaten cam olduğundan çip sade tutulur.
          <div className="text-foreground/75 flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--glass-border)] bg-white/25 shadow-[var(--glass-highlight)] dark:bg-white/[0.06]">
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}
