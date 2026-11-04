import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * V7 göstergeler — vintage radyo / FM tuner dili. Neumorph YALNIZ burada.
 * Hepsi sunucu bileşenidir (saf işaretleme); etkileşim gerekiyorsa çağıran
 * sarar. CSS: app/globals.css "V7 · GÖSTERGELER".
 */

/** Dört vidalı yumuşak çerçeve; içine .screen ya da başka gövde alır. */
export function Bezel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("bezel", className)} {...props}>
      <span aria-hidden className="screw tl" />
      <span aria-hidden className="screw tr" />
      <span aria-hidden className="screw bl" />
      <span aria-hidden className="screw br" />
      {children}
    </div>
  );
}

/** Koyu cam ekran — tarama çizgili; içeriği .lcd/.dim ile yazılır. */
export function Screen({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("screen", className)} {...props} />;
}

/**
 * FM kadranı: ince/kalın çentikler, uçlarda etiket, `pos` (0..1) konumunda
 * asit iğne. `labels` kadran boyunca eşit dağıtılır.
 */
export function FmDial({
  pos,
  labels,
  className,
  height = 38,
}: {
  pos: number | null;
  labels: string[];
  className?: string;
  height?: number;
}) {
  const p = pos == null ? null : Math.max(0, Math.min(1, pos));
  return (
    <div className={cn("fm", className)} style={{ height }}>
      <div className="ticks" />
      <div className="ticks major" />
      {labels.map((l, i) => {
        const n = labels.length - 1;
        const style: React.CSSProperties =
          i === 0 ? { left: 0 } : i === n ? { right: 0 } : { left: `${(i / n) * 100}%`, transform: "translateX(-50%)" };
        return (
          <span key={`${l}-${i}`} className="lab" style={style}>
            {l}
          </span>
        );
      })}
      {p != null && <div className="needle" style={{ left: `calc(${(p * 100).toFixed(1)}% - 1px)` }} />}
    </div>
  );
}

/**
 * Düğme — `value` (0..1) −135°..+135° arası döner; altında mono etiket.
 * Salt gösterge: değeri yazıyla da verir (erişilebilirlik).
 */
export function Knob({
  value,
  label,
  readout,
  size = "lg",
  className,
}: {
  value: number | null;
  label: string;
  readout: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  const v = value == null ? 0 : Math.max(0, Math.min(1, value));
  const deg = Math.round(-135 + v * 270);
  return (
    <div
      className={cn("flex flex-col items-center gap-2.5", className)}
      role="img"
      aria-label={`${label}: ${readout}`}
    >
      <div className={cn("knob", size === "sm" && "sm")} style={{ ["--deg" as string]: deg }}>
        <div className="ring" />
        <div className="mark" />
      </div>
      <div className="mono-label tracking-[0.18em]">
        {label} <span className="text-foreground">{readout}</span>
      </div>
    </div>
  );
}

/** Segment anahtarı — linkli; aktif olan kabarık. */
export function SegLinks({
  items,
  className,
}: {
  items: { label: string; href: string; on?: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("seg", className)} role="group">
      {items.map((it) => (
        <Link
          key={it.href + it.label}
          href={it.href}
          aria-current={it.on ? "true" : undefined}
          className={cn(it.on && "on")}
          scroll={false}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

/** Tozlu mavi dekor kartı — sayfa başına en çok bir tane. */
export function DecorCard({
  label,
  value,
  hint,
  href,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      <div className="silk" aria-hidden>
        <svg viewBox="0 0 400 300" preserveAspectRatio="none">
          <path
            d="M-40 260 C100 160 200 280 440 90"
            stroke="#FFFFFF"
            strokeOpacity=".55"
            strokeWidth="18"
            fill="none"
            style={{ filter: "blur(9px)" }}
          />
          <path
            d="M-40 300 C120 200 220 320 440 150"
            stroke="#fff"
            strokeOpacity=".3"
            strokeWidth="8"
            fill="none"
            style={{ filter: "blur(3px)" }}
          />
        </svg>
      </div>
      <div className="flex items-start justify-between gap-3">
        <span className="mono-label">{label}</span>
        {href && <span className="mono-label">→</span>}
      </div>
      <div>
        <div className="ledger-num text-[44px] xl:text-[52px]">{value}</div>
        {hint && <div className="mono-label mt-2.5">{hint}</div>}
      </div>
    </>
  );
  if (href)
    return (
      <Link href={href} className={cn("gcard jg-focus-outline min-h-[150px]", className)}>
        {inner}
      </Link>
    );
  return <div className={cn("gcard min-h-[150px]", className)}>{inner}</div>;
}

/**
 * Osiloskop ekranı — günlük seri; birincil çizgi asit (ışımalı), ikincil
 * çizgi fildişi (maliyet), noktalı üçüncü seri (önceki dönem). Saf SVG,
 * sunucuda çizilir. `series` değerleri aynı birimde (ör. USD).
 */
export function ScopeChart({
  points,
  startLabel,
  endLabel,
  caption,
  maxLabel,
  className,
  height = 190,
}: {
  points: { a: number; b?: number | null; c?: number | null }[];
  startLabel: string;
  endLabel: string;
  caption: string;
  maxLabel?: string;
  className?: string;
  height?: number;
}) {
  const W = 420;
  const H = 200;
  const n = points.length;
  const all = points.flatMap((p) => [p.a, p.b ?? 0, p.c ?? 0]);
  const max = Math.max(1, ...all);
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / max) * (H - 14) - 6;
  const path = (pick: (p: (typeof points)[number]) => number | null | undefined) => {
    let d = "";
    points.forEach((p, i) => {
      const v = pick(p);
      if (v == null) return;
      d += `${d ? " L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
    });
    return d;
  };
  const last = n ? points[n - 1] : null;
  return (
    <Bezel className={className}>
      <Screen className="px-4 pt-3.5 pb-2.5">
        <div className="flex justify-between">
          <span className="dim">{caption}</span>
          {maxLabel && <span className="dim lcd text-[10px]">{maxLabel}</span>}
        </div>
        {n === 0 ? (
          <div className="dim flex items-center justify-center" style={{ height }}>
            sinyal yok
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="mt-2 block w-full overflow-visible"
            style={{ height }}
            aria-hidden
          >
            <g stroke="var(--screen-grid)" strokeWidth="1">
              <line x1="0" y1="50" x2={W} y2="50" />
              <line x1="0" y1="100" x2={W} y2="100" />
              <line x1="0" y1="150" x2={W} y2="150" />
              <line x1="105" y1="0" x2="105" y2={H} strokeDasharray="2 4" />
              <line x1="210" y1="0" x2="210" y2={H} strokeDasharray="2 4" />
              <line x1="315" y1="0" x2="315" y2={H} strokeDasharray="2 4" />
            </g>
            <path d={path((p) => p.c)} fill="none" stroke="var(--screen-dim)" strokeWidth="1.5" strokeDasharray="2 5" />
            <path d={path((p) => p.b)} fill="none" stroke="var(--screen-fg)" strokeOpacity=".75" strokeWidth="1.5" />
            <path
              d={path((p) => p.a)}
              fill="none"
              stroke="var(--neon)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 5px var(--neon))" }}
            />
            {last && (
              <>
                <line x1={x(n - 1)} y1="0" x2={x(n - 1)} y2={H} stroke="var(--neon)" strokeWidth="1" opacity=".55" />
                <circle cx={x(n - 1)} cy={y(last.a)} r="3.5" fill="var(--neon)" />
              </>
            )}
          </svg>
        )}
        <FmDial pos={null} labels={[startLabel, endLabel]} height={26} className="mt-0.5 [&_.ticks]:top-1 [&_.ticks.major]:top-0 [&_.lab]:top-4" />
      </Screen>
    </Bezel>
  );
}

/** Gösterge lejantı — çizgi örnekleri. */
export function Legend({
  items,
  className,
}: {
  items: { label: string; kind: "neon" | "dash" | "ink" }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-x-5 gap-y-1.5", className)}>
      {items.map((it) => (
        <span key={it.label} className="text-ink-2 flex items-center gap-2 text-xs">
          <i
            aria-hidden
            className={cn(
              "inline-block h-0 w-[18px] border-t-2",
              it.kind === "neon" && "border-neon",
              it.kind === "dash" && "border-dashed border-[color:var(--ink-2)]",
              it.kind === "ink" && "border-[color:var(--ink-2)]",
            )}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
