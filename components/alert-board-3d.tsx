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
  /** Popup hangi yöne açılır — üst banttaki kutu panelden taşmasın diye ALTA. */
  popSide: "top" | "bottom";
  /** Kenar kutularında popup içe hizalanır (viewport/panel dışına taşmaz). */
  popAlign: "left" | "center" | "right";
}

/**
 * DÜZENLİ VİTRİN yerleşimi (v3) — v2'nin iki sorunu düzeltildi:
 *  1) Komşu kutular METİN üstünde biniyordu (5 kutu × %20 aralık < kutu
 *     genişliği) → ZİGZAG: bant içinde kutular bir aşağı bir yukarı diziliyor;
 *     yatay komşular artık en fazla KÖŞELERDE (metinsiz alanda) değer.
 *  2) Jitter ±%1.5'e indirildi — kompozisyon sakin, bindirme öngörülebilir.
 * Popup yönü/hizası burada DETERMİNİSTİK hesaplanır (çarpışma-farkında
 * yerleşim: üst bant alta açılır, kenar kutuları içe hizalanır) — çalışma
 * anında flip hesabına gerek kalmaz.
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
      const jx = ((h % 100) / 100 - 0.5) * 3; // ±%1.5 nefes payı
      // Zigzag: çift indeks bandın üstüne, tek indeks altına — komşular
      // dikeyde ayrışır, olası bindirme yalnız köşe değmesi olur.
      const zig = n > 1 ? (i % 2 === 0 ? -7 : 7) : 0;
      const xPct = Math.min(90, Math.max(10, ((i + 0.5) / n) * 100 + jx));
      const yPct = MATERIAL[sev].bandY + zig;
      boxes.push({
        alert: a,
        xPct,
        yPct,
        z: MATERIAL[sev].z + (((h >> 9) % 18) - 9),
        delayMs: placed * 60,
        popSide: yPct < 42 ? "bottom" : "top",
        popAlign: xPct < 24 ? "left" : xPct > 76 ? "right" : "center",
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

      {/* Sakin vitrin sahnesi — derinlik DÜZ sahnede ölçek+z-index ile.
          (v2'deki perspective+preserve-3d+translateZ, popup'ı projeksiyonla
          YANA kaydırıyor ve 3B bağlamda z-index/hover katmanlaması
          çalışmıyordu — kanattaki kutuların açıklaması sağa açılır görünür,
          kaplanan kutu hover tepkisi vermezdi. Ölçek aynı derinlik hissini
          verir; hit-test ve katmanlama normal 2B kurallarına döner.) */}
      <div className="relative h-[340px] sm:h-[380px]">
        {total === 0 ? (
          <p className="text-muted-foreground absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-2 text-sm">
            <CircleCheck className="size-4 text-emerald-600" />
            Board boş — havada asılı uyarı yok, her şey yolunda.
          </p>
        ) : (
          <div className="absolute inset-0">
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
  const { alert: a, xPct, yPct, z, delayMs, popSide, popAlign } = box;
  const m = MATERIAL[a.severity];
  const { ref, onPointerMove } = useCursorGlow<HTMLAnchorElement>();
  // Derinlik = ölçek (eski translateZ/perspective eşleniği: 1200px sahnede
  // z=56 ≈ %4.9 büyüme). Katman sırası banda göre; hover'lı kutu :has ile
  // HER ZAMAN en üste çıkar → kaplanan kutular da tepki verir/okunur.
  const scale = 1 + z / 1150;
  const bandZ = z > 20 ? 30 : z < -20 ? 10 : 20;

  return (
    <div
      // Kademeli belirme: kutular sahneye sırayla yerleşir
      // (soft-in yalnız opacity+blur — inline transform'a dokunmaz).
      className="soft-in absolute [&:has(a:hover)]:z-40 [&:has(a:focus-visible)]:z-40"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        zIndex: bandZ,
        transform: `translate(-50%, -50%) scale(${scale.toFixed(3)})`,
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

        {/* Hover detay popup'ı — cam üstünde cam. Yön/hiza yerleşimde
            DETERMİNİSTİK seçilir (çarpışma-farkında): üst banttaki kutu
            panelden taşmasın diye ALTA açılır, kenar kutularında içe hizalanır
            — açıklama artık kartın hep ÜSTÜNDE/ALTINDA belirir, yana kaymaz. */}
        <span
          className={cn(
            "pointer-events-none invisible absolute z-40 w-[240px] rounded-xl border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] px-3 py-2 opacity-0 shadow-[var(--lift-sm)] [backdrop-filter:var(--glass-filter)] transition-[opacity,translate] duration-200 ease-[var(--ease-premium)] group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 dark:border-[color:oklch(1_0_0/0.2)] dark:[background-color:var(--lume-glass)] dark:[background-image:none]",
            popSide === "top"
              ? "bottom-[calc(100%+8px)] translate-y-1.5 group-hover:translate-y-0"
              : "top-[calc(100%+8px)] -translate-y-1.5 group-hover:translate-y-0",
            popAlign === "center" && "left-1/2 -translate-x-1/2",
            popAlign === "left" && "left-0",
            popAlign === "right" && "right-0",
          )}
        >
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
