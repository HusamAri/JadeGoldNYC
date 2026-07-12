import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function formatChange(change: number): string {
  const pct = Math.abs(change * 100);
  const arrow = change >= 0 ? "↑" : "↓";
  return `${arrow} %${pct.toFixed(1)}`;
}

/** Etikete göre deterministik küçük hash (SSR-güvenli; Math.random yok). */
function hashLabel(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Kutu ikonunun kenarı yalayan konumu — 4 köşeden biri (bir kısmı dışarı). */
const ICON_SPOTS = [
  { bottom: "-16%", right: "-12%" },
  { top: "-18%", right: "-10%" },
  { bottom: "-14%", left: "-13%" },
  { top: "-16%", left: "-11%" },
] as const;

// NOT: Bu bir SUNUCU bileşenidir — `icon` prop'u bir React bileşeni (LucideIcon)
// olduğundan client bileşenine dönüştürülemez. Hover/süzülme hareketi CSS ile
// yapılır. prefers-reduced-motion'da global kural animasyonu durdurur.
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
  // Her kutu FARKLI süzülür: etiketten türeyen deterministik faz/yön/süre.
  const h = hashLabel(label);
  const spot = ICON_SPOTS[h % ICON_SPOTS.length];
  const iconStyle: React.CSSProperties = {
    ...spot,
    animationName: "kpi-icon-drift",
    // çok çok yavaş — 64…92s; her kutuya farklı gecikme ve yön
    animationDuration: `${64 + (h % 5) * 7}s`,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDirection: h % 2 === 0 ? "normal" : "reverse",
    animationDelay: `-${h % 40}s`,
    willChange: "transform",
  };

  return (
    // Kutu: şeffaf kap (arka plandaki süzülen holo görünür). İçinde 3 katman:
    //  1) anlamlı kalın solid ikon — camın ALTINDA, kenardan taşar (bir kısmı
    //     cam altında buzlanır, bir kısmı dışında açık kalır); çok yavaş süzülür.
    //  2) cam yüzey (.glass-board) — backdrop-filter ikonu ve arkadaki holo'yu
    //     buzlar; sheen + iridesan kenar.
    //  3) içerik (etiket + dev puntolu rakam) — camın üstünde.
    <div
      className={cn(
        "relative flex h-full min-w-0 flex-col rounded-[1.75rem] px-6 py-6 transition-transform duration-200 ease-[var(--ease-premium)] hover:-translate-y-[3px]",
        className,
      )}
    >
      {Icon && (
        <Icon
          aria-hidden
          strokeWidth={2.4}
          fill="currentColor"
          className="text-foreground pointer-events-none absolute z-0 size-[9.5rem] opacity-[0.13] dark:opacity-[0.17]"
          style={iconStyle}
        />
      )}
      {/* cam yüzey — ikonu ve arkadaki süzülen holo'yu buzlar */}
      <div
        aria-hidden
        className="glass-board absolute inset-0 z-[1] rounded-[1.75rem]"
      />
      <div className="relative z-[2] flex h-full items-start justify-between gap-3">
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
      </div>
    </div>
  );
}
