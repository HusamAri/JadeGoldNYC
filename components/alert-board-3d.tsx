"use client";

import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";

import type { Alert, AlertCenter, AlertSeverity } from "@/lib/db/queries/alerts";
import { formatMoney } from "@/lib/money";
import { useCursorGlow } from "@/components/motion/cursor-glow";
import { cn } from "@/lib/utils";

/** Deterministik minik hash — kutu fazı/jitter'ı için (render'lar arası sabit). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * CAM MALZEMESİ önem derecesine bağlıdır:
 *   kritik → RENKLİ cam (yakut tonlu, yarı saydam, kızıl ışıma)
 *   önemli → LIQUID cam (kehribar, en şeffafı; yüzeyinde parlama gezinir)
 *   bilgi  → BUZLU/ICE cam (ağır blur + kristal çizgi dokusu)
 */
const MATERIAL: Record<
  AlertSeverity,
  {
    label: string;
    matLabel: string;
    bandY: number; // sahnedeki yatay bandın dikey merkezi (%)
    z: number; // derinlik (px) — kritik önde, bilgi arkada
    width: number; // px
    surface: string; // background-image
    surfaceDark: string;
    border: string;
    glow: string;
    text: string;
    filter: string; // backdrop-filter (yalnız hover'da)
    extra?: "ab-liquid" | "ab-frost";
  }
> = {
  kritik: {
    label: "Kritik",
    matLabel: "renkli cam",
    bandY: 27,
    z: 56,
    width: 208,
    surface:
      "linear-gradient(135deg, oklch(0.62 0.19 20 / 0.34), oklch(0.5 0.22 15 / 0.16))",
    surfaceDark:
      "linear-gradient(135deg, oklch(0.5 0.2 20 / 0.4), oklch(0.35 0.18 15 / 0.22))",
    border: "oklch(0.64 0.2 20 / 0.6)",
    glow: "0 18px 44px oklch(0.5 0.2 20 / 0.3), 0 0 26px oklch(0.62 0.2 20 / 0.28)",
    text: "text-red-700 dark:text-red-300",
    filter: "blur(5px) saturate(1.5)",
  },
  onemli: {
    label: "Önemli",
    matLabel: "liquid cam",
    bandY: 54,
    z: 0,
    width: 192,
    surface:
      "linear-gradient(120deg, oklch(0.8 0.12 78 / 0.2), oklch(0.72 0.14 62 / 0.08))",
    surfaceDark:
      "linear-gradient(120deg, oklch(0.7 0.12 78 / 0.22), oklch(0.55 0.12 62 / 0.1))",
    border: "oklch(0.76 0.13 75 / 0.55)",
    glow: "0 16px 38px oklch(0.6 0.12 70 / 0.24), 0 0 20px oklch(0.76 0.13 75 / 0.22)",
    text: "text-amber-700 dark:text-amber-300",
    filter: "blur(3px) saturate(1.35)",
    extra: "ab-liquid",
  },
  bilgi: {
    label: "Bilgi",
    matLabel: "buzlu cam",
    bandY: 80,
    z: -56,
    width: 176,
    surface:
      "linear-gradient(160deg, oklch(0.92 0.03 220 / 0.32), oklch(0.85 0.04 210 / 0.18))",
    surfaceDark:
      "linear-gradient(160deg, oklch(0.75 0.04 220 / 0.2), oklch(0.6 0.04 210 / 0.1))",
    border: "oklch(0.95 0.02 220 / 0.65)",
    glow: "0 14px 32px oklch(0.5 0.04 230 / 0.2), inset 0 1px 0 oklch(1 0 0 / 0.6)",
    text: "text-sky-700 dark:text-sky-300",
    filter: "blur(13px) saturate(1.15) brightness(1.04)",
    extra: "ab-frost",
  },
};

const ORDER: AlertSeverity[] = ["kritik", "onemli", "bilgi"];
/** Bant başına en çok kutu — negative space'i korumak için sert tavan. */
const MAX_PER_BAND = 5;

interface PlacedBox {
  alert: Alert;
  xPct: number;
  yPct: number;
  z: number;
  delayMs: number;
}

/**
 * DÜZENLİ VİTRİN yerleşimi (v2) — eski sürüm her kutuyu rastgele hücre+3B
 * rotasyonla fırlatıyordu ("corrupted" his). Yeni dil: her önem derecesi kendi
 * yatay bandında SAKİN, EŞİT aralıklı dizilir; kritik önde ve üstte, bilgi
 * arkada ve altta. Jitter yalnız ±%3 nefes payı — kompozisyon okunur kalır.
 * Derinlik tek eksende (translateZ), rotasyon YOK; motion cursor-reactive
 * ışık + hover settle'dan gelir.
 */
function placeBoxes(alerts: Alert[]): { boxes: PlacedBox[]; overflow: number } {
  const boxes: PlacedBox[] = [];
  let placed = 0;
  for (const sev of ORDER) {
    const items = alerts
      .filter((a) => a.severity === sev)
      .slice(0, MAX_PER_BAND);
    const n = items.length;
    items.forEach((a, i) => {
      const h = hash(a.key);
      const jx = ((h % 100) / 100 - 0.5) * 6; // ±%3 nefes payı
      const jy = (((h >> 5) % 100) / 100 - 0.5) * 5;
      boxes.push({
        alert: a,
        xPct: Math.min(91, Math.max(9, ((i + 0.5) / n) * 100 + jx)),
        yPct: MATERIAL[sev].bandY + jy,
        z: MATERIAL[sev].z + (((h >> 9) % 18) - 9),
        delayMs: placed * 60,
      });
      placed++;
    });
  }
  return { boxes, overflow: alerts.length - placed };
}

/**
 * UYARI BOARD'U v2 — sakin vitrin: önem derecesine göre üç yatay banda dizilmiş
 * cam kutular (kritik renkli cam önde/üstte · önemli liquid cam ortada · bilgi
 * buzlu cam arkada/altta). Cursor-reactive "pencere ışığı" her kutuda pointer'ı
 * takip eder; hover'da cam bozması + hafif yükselme. Eski rastgele 3B saçılım
 * kaldırıldı — negative space kompozisyonun parçası. Ayrıntılı liste kartı
 * ayrıca yaşar (özet + detay ikilisi).
 */
export function AlertBoard3D({ data }: { data: AlertCenter }) {
  const { alerts, counts, total, currency } = data;
  const { boxes, overflow } = placeBoxes(alerts);
  const visibleSeverities = ORDER.filter((s) => counts[s] > 0);

  return (
    <div className="relative isolate overflow-hidden rounded-[26px] border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] shadow-[var(--lift),var(--glass-highlight)] dark:border-[color:oklch(1_0_0/0.05)] dark:[background-color:var(--lume-panel)] dark:[background-image:radial-gradient(120%_90%_at_50%_-10%,oklch(0.3_0.06_278/0.5),transparent_60%)]">
      {/* Başlık şeridi */}
      <div className="relative z-20 flex flex-wrap items-center gap-2 px-5 pt-4">
        <TriangleAlert
          className={cn(
            "size-4",
            total > 0
              ? MATERIAL[visibleSeverities[0] ?? "bilgi"].text
              : "text-muted-foreground",
          )}
        />
        <p className="font-semibold">Uyarı Board&rsquo;u</p>
        <span className="text-muted-foreground text-xs">
          {total > 0 ? (
            <>
              havada asılı {boxes.length} uyarı
              {overflow > 0 && ` · +${overflow} listede`}
            </>
          ) : (
            "aksiyon bekleyen yok"
          )}
        </span>
        <span className="text-muted-foreground ml-auto hidden gap-3 font-mono text-[10px] tracking-[0.08em] uppercase sm:flex">
          {ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-[4px] border"
                style={{
                  backgroundImage: MATERIAL[s].surface,
                  borderColor: MATERIAL[s].border,
                }}
              />
              {MATERIAL[s].label} · {MATERIAL[s].matLabel}
              <span className="tabular-nums">{counts[s]}</span>
            </span>
          ))}
        </span>
      </div>

      {/* Sakin vitrin sahnesi — üç bant, tek eksen derinlik */}
      <div
        className="relative h-[340px] sm:h-[380px]"
        style={{ perspective: "1200px", perspectiveOrigin: "50% 42%" }}
      >
        {total === 0 ? (
          <p className="text-muted-foreground absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-2 text-sm">
            <CircleCheck className="size-4 text-emerald-600" />
            Board boş — havada asılı uyarı yok, her şey yolunda.
          </p>
        ) : (
          <div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {boxes.map((b) => (
              <AlertBox key={b.alert.key} box={b} currency={currency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Tek cam kutu — cursor-reactive ışık + hover cam bozması. */
function AlertBox({
  box,
  currency,
}: {
  box: PlacedBox;
  currency: string;
}) {
  const { alert: a, xPct, yPct, z, delayMs } = box;
  const m = MATERIAL[a.severity];
  const { ref, onPointerMove } = useCursorGlow<HTMLAnchorElement>();

  return (
    <div
      // Kademeli belirme: kutular sahneye sırayla yerleşir
      // (soft-in yalnız opacity+blur — inline 3B transform'a dokunmaz).
      className="soft-in absolute"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(-50%, -50%) translateZ(${z}px)`,
        transformStyle: "preserve-3d",
        animationDelay: `${delayMs}ms`,
        animationDuration: "0.6s",
      }}
    >
      <Link
        ref={ref}
        onPointerMove={onPointerMove}
        href={a.href}
        className={cn(
          "group cursor-glow ab-glass relative block overflow-visible rounded-2xl border p-3 transition-[transform,box-shadow] duration-300 ease-[var(--ease-premium)] hover:z-30 hover:-translate-y-1 focus-visible:z-30 focus-visible:-translate-y-1 active:translate-y-0 active:duration-150",
          "[background-image:var(--ab-surface)] dark:[background-image:var(--ab-surface-dark)]",
          m.extra,
        )}
        style={
          {
            width: `${m.width}px`,
            "--ab-surface": m.surface,
            "--ab-surface-dark": m.surfaceDark,
            // PERF: backdrop-filter yalnız HOVER'da devreye girer (.ab-glass);
            // idle'da gradient yüzey + glow zaten cam hissi verir.
            "--ab-filter": m.filter,
            borderColor: m.border,
            boxShadow: `${m.glow}, inset 0 1px 0 oklch(1 0 0 / 0.45)`,
          } as React.CSSProperties
        }
      >
        <span
          className={cn(
            "font-mono text-[9px] font-bold tracking-[0.16em] uppercase",
            m.text,
          )}
        >
          {m.label}
          {a.count > 1 && (
            <span className="ml-1 tabular-nums opacity-80">×{a.count}</span>
          )}
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug font-semibold [text-shadow:0_1px_2px_oklch(1_0_0/0.3)] dark:[text-shadow:0_1px_3px_oklch(0_0_0/0.5)]">
          {a.title}
        </span>
        {a.costCents != null && a.costCents > 0 && (
          <span
            className={cn(
              "mt-1 inline-block rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums",
              m.text,
            )}
            style={{ borderColor: m.border }}
            title="Dondurulan potansiyel gelir"
          >
            {formatMoney(a.costCents, currency)}
          </span>
        )}

        {/* Hover detay popup'ı — cam üstünde cam */}
        <span className="pointer-events-none invisible absolute bottom-[calc(100%+8px)] left-1/2 z-40 w-[240px] -translate-x-1/2 translate-y-1.5 rounded-xl border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] px-3 py-2 opacity-0 shadow-[var(--lift-sm)] [backdrop-filter:var(--glass-filter)] transition-[opacity,translate] duration-200 ease-[var(--ease-premium)] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-[color:oklch(1_0_0/0.2)] dark:[background-color:var(--lume-glass)] dark:[background-image:none]">
          <span className="text-muted-foreground block text-[11px] leading-relaxed">
            {a.hint}
          </span>
          <span
            className={cn(
              "mt-1 block font-mono text-[10px] font-bold tracking-[0.1em] uppercase",
              m.text,
            )}
          >
            {a.actionLabel} →
          </span>
        </span>
      </Link>
    </div>
  );
}
