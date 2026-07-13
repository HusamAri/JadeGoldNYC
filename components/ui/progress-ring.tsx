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
 * Dairesel ilerleme/gösterge bileşeni — kabartmalı (neomorfik) disk + yüzeye
 * OYULMUŞ oluk (debossed ray) + içinde hafif ışıyan accent yay + ışık taşıyan
 * uç damlası + ortada mono "digital display" okuması. Referans: IMG_5664
 * (termostat kadranı) ve IMG_5668 (ince ilerleme halkası + yüzde). Işık
 * tepeden gelir: oluğun iç gölgesi üstte, alt dudakta ince highlight.
 * Şu an Yıldız Satıcı sayfasında Star Seller ilerlemesi için kullanılıyor;
 * lansman geri sayımı, senkron ilerlemesi gibi tekil-değer göstergelerine uygundur.
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
  const uid = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const clamped = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const display = valueLabel ?? `%${Math.round(clamped)}`;
  const ariaLabel = props["aria-label"] ?? (label ? `${label}: ${display}` : display);
  const toneStroke = tone === "jade" ? "var(--primary)" : "var(--gold-deep)";
  /* Yayın ucu — svg -90° döndürüldüğü için 0 rad görsel olarak tepeye düşer. */
  const theta = (clamped / 100) * 2 * Math.PI;
  const tipX = size / 2 + radius * Math.cos(theta);
  const tipY = size / 2 + radius * Math.sin(theta);
  const tipTransition =
    "cx 0.6s var(--ease-premium), cy 0.6s var(--ease-premium)";

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
        <defs>
          {/* Oyulmuş oluk — ışık tepeden: iç gölge üst dudakta, alt dudakta
              adaptif hairline highlight (nm-pressed'in SVG karşılığı). */}
          <filter id={`${uid}-groove`} x="-20%" y="-20%" width="140%" height="140%">
            <feOffset in="SourceAlpha" dx="0" dy="1.6" result="po" />
            <feGaussianBlur in="po" stdDeviation="1.4" result="pb" />
            <feComposite in="SourceAlpha" in2="pb" operator="out" result="pz" />
            <feFlood floodColor="var(--glass-outer)" floodOpacity="0.5" result="pc" />
            <feComposite in="pc" in2="pz" operator="in" result="ps" />
            <feOffset in="SourceAlpha" dx="0" dy="-1.2" result="ho" />
            <feGaussianBlur in="ho" stdDeviation="1" result="hb" />
            <feComposite in="SourceAlpha" in2="hb" operator="out" result="hz" />
            <feFlood floodColor="var(--glass-border)" result="hc" />
            <feComposite in="hc" in2="hz" operator="in" result="hl" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="ps" />
              <feMergeNode in="hl" />
            </feMerge>
          </filter>
        </defs>
        {/* Debossed ray — accent yayın içinde koştuğu oyuk. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          filter={`url(#${uid}-groove)`}
          style={{ stroke: "rgb(var(--nm-dark) / 0.3)" }}
        />
        {/* Accent yay — hafif tonda glow ile oluğun içinde ışır. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={toneStroke}
          style={{
            transition: "stroke-dashoffset 0.6s var(--ease-premium)",
            filter: `drop-shadow(0 0 5px color-mix(in srgb, ${toneStroke} 40%, transparent))`,
          }}
        />
        {/* Işık taşıyan uç damlası — koyu modda beyaz dış glow (lume thumb). */}
        {clamped > 0 && (
          <g
            style={{
              filter: `drop-shadow(0 0 4px color-mix(in srgb, ${toneStroke} 60%, transparent)) drop-shadow(0 0 8px rgb(255 255 255 / 0.35))`,
            }}
          >
            <circle
              cx={tipX}
              cy={tipY}
              r={strokeWidth / 2 + 1.5}
              fill={toneStroke}
              style={{ transition: tipTransition }}
            />
            <circle
              cx={tipX}
              cy={tipY}
              r={Math.max(1.5, strokeWidth / 4)}
              fill="rgb(255 255 255 / 0.85)"
              style={{ transition: tipTransition }}
            />
          </g>
        )}
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 px-2 text-center">
        <span
          className={cn("text-digital", size >= 100 ? "text-2xl" : "text-base")}
          style={{ color: toneStroke }}
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
