import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";

/** Hem Lucide hem markaya özel Lux ikonlarını kabul eden ikon tipi. */
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

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

/** Kutu ikonunun konumu — YALNIZ sağ köşeler (sol-üstteki metinle çakışmaz);
    karta clip'lenir → komşu kutulara taşmaz, kenarda kesilir (cam altında). */
const ICON_SPOTS = [
  { bottom: "-14%", right: "-8%" },
  { top: "-15%", right: "-7%" },
  { bottom: "-10%", right: "-12%" },
  { top: "-12%", right: "-11%" },
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
  icon?: IconType;
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
    //  2) cam yüzey — açıkta Spatial .stat camı, koyuda lume hücre;
    //     backdrop-filter ikonu ve arkadaki holo'yu buzlar.
    //  3) içerik (etiket + dev puntolu rakam) — camın üstünde.
    <div
      className={cn(
        "sheen-sweep relative flex h-full min-w-0 flex-col overflow-hidden rounded-[18px] px-6 py-6 transition-transform duration-300 ease-[var(--ease-premium)] hover:-translate-y-0.5 dark:rounded-[26px]",
        className,
      )}
    >
      {Icon && (
        <Icon
          aria-hidden
          // Açıkta camın ALTINDA (z-0, buzlanır); koyuda panel OPAK olduğundan
          // camın üstünde çok soluk oyma filigran olarak durur (dark:z-[2],
          // içerik DOM'da sonra geldiği için üstte kalır). Ham Lucide geçse
          // bile gri klipart'a düşmesin diye varsayılan mürekkep soluk mor.
          className="pointer-events-none absolute z-0 size-[8.5rem] object-contain text-[oklch(0.68_0.15_286)] opacity-[0.88] dark:z-[2] dark:text-[oklch(0.83_0.07_290)] dark:opacity-[0.14]"
          style={iconStyle}
        />
      )}
      {/* cam yüzey — açıkta Spatial .stat kutusu (cam + 1px beyaz kenar +
          glass-hi), koyuda OPAK lume hücre (Liquid_Dark .cell birebir:
          #262935 panel + 0.05 beyaz kenar + 0 20px 50px gölge + üst iç
          highlight; saydamlık/backdrop-blur yok). */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] rounded-[18px] border border-[color:var(--glass-border)] [backdrop-filter:var(--glass-filter)] [background-color:var(--glass)] [box-shadow:var(--lift),var(--glass-highlight)] dark:rounded-[26px] dark:border-[color:oklch(1_0_0/0.05)] dark:[backdrop-filter:none] dark:[background-color:var(--lume-panel)] dark:[box-shadow:0_20px_50px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.06)]"
      />
      <div className="relative z-[2] flex h-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          {/* Etiket — editorial .idx dili: mono, uppercase, geniş tracking. */}
          <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] font-mono text-[11px] leading-[1.5] tracking-[0.16em] uppercase">
            {label}
          </p>
          {/* Değer — font-index readout: açıkta Spatial mürekkebi,
              koyuda lume beyazı + 0 0 14px beyaz ışıma. */}
          <p
            title={typeof value === "string" ? value : undefined}
            className={cn(
              // Mobil dar kolonlarda değer ASLA elipslenmesin: truncate yerine
              // kademeli punto — rakam her zaman tam okunur.
              "font-mono font-semibold tracking-tight break-normal tabular-nums",
              // Uzun finansal değerler ('$2.913.363,72' gibi) dar 5'li grid
              // kartında da tek satırda tam okunur: uzunluğa göre punto düşer.
              splitTone
                ? "text-3xl min-[420px]:text-4xl leading-tight jg-split-tone"
                : cn(
                    typeof value === "string" && value.length > 13
                      ? "text-base min-[420px]:text-lg"
                      : typeof value === "string" && value.length > 10
                        ? "text-lg min-[420px]:text-xl"
                        : "text-xl min-[420px]:text-2xl",
                    "leading-tight dark:[text-shadow:0_0_14px_rgba(255,255,255,.5)]",
                  ),
              !splitTone &&
                accent === "default" &&
                "text-foreground dark:text-white",
              !splitTone &&
                accent === "positive" &&
                "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]",
              !splitTone &&
                accent === "negative" &&
                "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]",
            )}
          >
            {value}
          </p>
          {change != null && (
            <p
              className={cn(
                "mt-1 font-mono text-xs font-medium tabular-nums",
                change > 0 &&
                  "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]",
                change < 0 &&
                  "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]",
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
