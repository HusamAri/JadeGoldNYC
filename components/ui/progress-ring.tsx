import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressRingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "aria-label"> {
  /** 0-100 arası ilerleme yüzdesi. */
  value: number;
  /** Halka + kabartmalı disk boyutu (px). */
  size?: number;
  /** Halka kalınlığı (px). */
  strokeWidth?: number;
  /** Ortada gösterilecek ana metin (varsayılan: yuvarlanmış yüzde). */
  valueLabel?: string;
  /** Ortada, ana metnin altında gösterilecek küçük etiket. */
  label?: string;
  /** Ekran okuyucular için erişilebilir ad (belirtilmezse label+valueLabel kullanılır). */
  "aria-label"?: string;
  /** Halka rengi: antik altın (varsayılan) veya jade. */
  tone?: "gold" | "jade";
  /** Kabartmalı diskin altında/çevresinde sıcak parıltı halesi (bkz. IMG_5664/5668). */
  glow?: boolean;
}

/**
 * Dairesel ilerleme/gösterge bileşeni — kabartmalı (neomorfik) disk + ince
 * ilerleme halkası + ortada büyük rakam. Referans: IMG_5664 (termostat kadranı,
 * kabartmalı disk + sıcak parıltı halesi) ve IMG_5668 (ince ilerleme halkası +
 * yüzde). Marka altını/jade'ı kullanır; şu an Yıldız Satıcı sayfasında Star
 * Seller ilerlemesi için kullanılıyor. Ayrıca lansman geri sayımı, senkron
 * ilerlemesi (Etsy/ShipStation) gibi tekil-değer göstergeleri için uygundur.
 */
export function ProgressRing({
  value,
  size = 132,
  strokeWidth = 9,
  valueLabel,
  label,
  tone = "gold",
  glow = true,
  className,
  ...props
}: ProgressRingProps) {
  const clamped = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const display = valueLabel ?? `%${Math.round(clamped)}`;
  const ariaLabel = props["aria-label"] ?? (label ? `${label}: ${display}` : display);

  return (
    <div
      {...props}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        glow && "jg-glow-warm jg-glow-warm-lg jg-glow-warm-static",
        className,
      )}
      style={{ width: size, height: size, ...props.style }}
    >
      <div className="nm-raised absolute inset-0 rounded-full" aria-hidden="true" />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={tone === "jade" ? "stroke-primary" : "stroke-[var(--gold-deep)]"}
          style={{ transition: "stroke-dashoffset 0.6s var(--ease-premium)" }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 px-2 text-center">
        <span
          className={cn(
            "font-semibold tracking-tight tabular-nums",
            size >= 100 ? "text-2xl" : "text-base",
          )}
        >
          {display}
        </span>
        {label && (
          <span
            className={cn(
              "text-muted-foreground leading-tight font-medium",
              size >= 100 ? "text-[11px]" : "text-[9px]",
            )}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
