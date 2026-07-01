"use client";

import * as React from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Segmentli, tek-seçimli sekme grubu — seçim komşu sekmeye geçerse gösterge
 * sıvı gibi esneyip kayar (goo filtresiyle gerçek "birleşme" hissi); seçim
 * alakasız (bitişik olmayan) bir sekmeye atlarsa gösterge eski yerde erir,
 * yeni yerde sıfırdan damla gibi dolar. Deri altında kayan kabarcık hissi
 * için: https://css-tricks.com/gooey-effect/ tekniği (blur + kontrast matrisi).
 */

type TabItem<T extends string> = { value: T; label: React.ReactNode };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// SSR'da useLayoutEffect uyarısı vermesin; ölçüm yalnız istemcide gerekli.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Bubble {
  id: string;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
}

export function LiquidTabs<T extends string>({
  items,
  value,
  onChange,
  indicatorClassName = "bg-accent",
  activeTextClassName = "text-accent-foreground",
  disabled = false,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Göstergenin (dolu sıvı) arka plan sınıfı. */
  indicatorClassName?: string;
  /** Seçili sekmenin metin rengi (gösterge dolduğunda okunaklı kalsın). */
  activeTextClassName?: string;
  disabled?: boolean;
  className?: string;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const filterId = `liquid-goo-${rawId}`;
  const reducedMotion = usePrefersReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const prevValueRef = useRef<T | null>(null);

  const [rect, setRect] = useState<Rect | null>(null);
  const [phase, setPhase] = useState<"idle" | "shrink" | "snap" | "grow">(
    "idle",
  );
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  const itemsKey = items.map((i) => i.value).join("|");

  function measure(v: T): Rect | null {
    const el = btnRefs.current.get(v);
    const container = containerRef.current;
    if (!el || !container) return null;
    const er = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    return { x: er.left - cr.left, y: er.top - cr.top, w: er.width, h: er.height };
  }

  useIsoLayoutEffect(() => {
    const next = measure(value);
    if (!next) return;

    const prevValue = prevValueRef.current;
    prevValueRef.current = value;

    // İlk ölçüm veya aynı değer: animasyonsuz yerleş.
    if (prevValue === null || prevValue === value) {
      setRect(next);
      setPhase("idle");
      return;
    }

    const prevIndex = items.findIndex((i) => i.value === prevValue);
    const nextIndex = items.findIndex((i) => i.value === value);
    const delta = Math.abs(nextIndex - prevIndex);
    const adjacent = delta === 1;

    if (reducedMotion) {
      setRect(next);
      setPhase("idle");
      return;
    }

    const prev = rect ?? next;
    const midX = (prev.x + prev.w / 2 + next.x + next.w / 2) / 2;
    const midY = (prev.y + prev.h / 2 + next.y + next.h / 2) / 2;
    const bubbleSize = Math.max(8, next.h * 0.4);
    const spawnBubbles = (originX: number, originY: number, spread: number) => {
      const id = `${value}-${Date.now()}`;
      const made: Bubble[] = [0, 1].map((i) => ({
        id: `${id}-${i}`,
        x: originX + (i === 0 ? -spread : spread) * 0.5 - bubbleSize / 2,
        y: originY - bubbleSize / 2,
        size: bubbleSize * (i === 0 ? 1 : 0.75),
        dx: (i === 0 ? -1 : 1) * (6 + Math.random() * 10),
        dy: -(4 + Math.random() * 8),
      }));
      setBubbles(made);
      window.setTimeout(() => setBubbles([]), 600);
    };

    if (adjacent) {
      // Komşu sekme: gösterge esneyerek kayar, kabarcıklar geçiş noktasında patlar.
      setPhase("idle");
      setRect(next);
      spawnBubbles(midX, midY, Math.abs(next.x - prev.x));
    } else {
      // Alakasız sekme: eski yerde erir, yeni yerde sıfırdan dolar.
      setPhase("shrink");
      const t1 = window.setTimeout(() => {
        setRect(next);
        setPhase("snap");
        requestAnimationFrame(() => {
          setPhase("grow");
          spawnBubbles(next.x + next.w / 2, next.y + next.h / 2, next.w * 0.3);
        });
      }, 150);
      return () => window.clearTimeout(t1);
    }
  }, [value, itemsKey, reducedMotion]);

  // Yeniden boyutlanma/reflow'da (üye listesi yüklenince, mobilde satır kayınca) yeniden ölç.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const next = measure(value);
      if (next) setRect(next);
    });
    ro.observe(container);
    return () => ro.disconnect();
    // measure() bilerek dep değil: her render'da yeni referans, gereksiz yeniden bağlanmayı önler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, itemsKey]);

  const indicatorTransform = rect
    ? `translate(${rect.x}px, ${rect.y}px) scale(${phase === "shrink" ? 0.15 : 1})`
    : undefined;

  const indicatorTransition =
    phase === "snap"
      ? "none"
      : phase === "grow"
        ? `transform 0.42s var(--ease-liquid-pop)`
        : phase === "shrink"
          ? `transform 0.15s var(--ease-premium)`
          : `transform 0.55s var(--ease-liquid-slide), width 0.55s var(--ease-liquid-slide), height 0.55s var(--ease-liquid-slide)`;

  return (
    <div
      ref={containerRef}
      className={cn("relative isolate inline-flex flex-wrap gap-1.5", className)}
    >
      {/* Goo filtresi: bulanıklaştır + kontrastı keskinleştir → üst üste binen
          şekiller sıvı gibi birleşir (metaball tekniği). */}
      <svg aria-hidden className="absolute size-0">
        <filter id={filterId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      <div
        aria-hidden
        style={{ filter: `url(#${filterId})` }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {rect && (
          <span
            className={cn("absolute top-0 left-0 rounded-full", indicatorClassName)}
            style={{
              width: rect.w,
              height: rect.h,
              transform: indicatorTransform,
              transition: indicatorTransition,
            }}
          />
        )}
        {bubbles.map((b) => (
          <span
            key={b.id}
            className={cn("liquid-bubble absolute rounded-full", indicatorClassName)}
            style={
              {
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size,
                "--liquid-dx": `${b.dx}px`,
                "--liquid-dy": `${b.dy}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              if (el) btnRefs.current.set(item.value, el);
            }}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.value)}
            aria-pressed={active}
            className={cn(
              "relative z-10 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50",
              active
                ? activeTextClassName
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
