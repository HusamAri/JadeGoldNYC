import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";

import type { Alert, AlertCenter, AlertSeverity } from "@/lib/db/queries/alerts";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Deterministik minik hash — kutu yerleşimi/salınım fazı için. */
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
    z: number; // derinlik bandı merkezi (px) — kritik önde, bilgi arkada
    width: number; // px
    surface: string; // background-image
    surfaceDark: string;
    border: string;
    glow: string;
    text: string;
    filter: string; // backdrop-filter
    extra?: "ab-liquid" | "ab-frost";
  }
> = {
  kritik: {
    label: "Kritik",
    matLabel: "renkli cam",
    z: 80,
    width: 200,
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
    z: 10,
    width: 184,
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
    z: -70,
    width: 168,
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
/** Board'da aynı anda asılı duran en çok kutu — kalanı liste kartına düşer. */
const MAX_BOXES = 14;

interface PlacedBox {
  alert: Alert;
  xPct: number;
  yPct: number;
  z: number;
  rotX: number;
  rotY: number;
  durMs: number;
  delayMs: number;
}

/**
 * Alana EŞİT ama RASTGELE dağılım: kutu sayısına göre bir hücre ızgarası
 * kurulur, hücreler ızgara boyuna aralarında asal bir adımla (stride)
 * karıştırılarak gezilir — her kutu farklı hücreye düşer (eşitlik), hücre
 * içindeki konum + derinlik + eğim uyarı anahtarının hash'inden gelir
 * (rastgelelik; deterministik, render'lar arası sabit).
 */
function placeBoxes(alerts: Alert[]): PlacedBox[] {
  const n = alerts.length;
  const cols = Math.max(3, Math.ceil(Math.sqrt(n * 2.6)));
  const rows = Math.max(2, Math.ceil(n / cols));
  const cells = cols * rows;
  // cells'e göre asal bir stride (altın orana yakın başla, asal olana yürü)
  let stride = Math.max(1, Math.round(cells * 0.618));
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  while (gcd(stride, cells) !== 1) stride++;

  return alerts.map((a, i) => {
    const h = hash(a.key);
    const cell = ((i + 1) * stride) % cells;
    const col = cell % cols;
    const row = Math.floor(cell / cols);
    const jx = ((h % 100) / 100 - 0.5) * 0.55; // hücre içi kayma (±%27)
    const jy = (((h >> 5) % 100) / 100 - 0.5) * 0.5;
    const m = MATERIAL[a.severity];
    return {
      alert: a,
      xPct: Math.min(94, Math.max(6, ((col + 0.5 + jx) / cols) * 100)),
      yPct: Math.min(86, Math.max(14, ((row + 0.5 + jy) / rows) * 100)),
      z: m.z + (((h >> 9) % 44) - 22),
      rotX: ((h >> 3) % 11) - 5,
      rotY: ((h >> 13) % 17) - 8,
      durMs: 5200 + (h % 4600),
      delayMs: -(h % 5000),
    };
  });
}

/**
 * UYARI MERKEZİ 3B BOARD — geniş bir sahnede havada asılı, önlü-arkalı
 * kesişen cam kutular. Kritikler renkli cam olarak öne, önemliler liquid
 * cam olarak orta düzleme, bilgiler buzlu cam olarak arkaya asılır; hepsi
 * alana eşit-ama-rastgele dağılır ve kendi fazında süzülür. Kutuya hover →
 * detay; tık → aksiyon yüzeyi. Ayrıntılı liste kartı ayrıca yaşar
 * (özet + detay ikilisi); bu board "neler asılı duruyor?"un uzamsal halidir.
 */
export function AlertBoard3D({ data }: { data: AlertCenter }) {
  const { alerts, counts, total, currency } = data;
  const shown = alerts.slice(0, MAX_BOXES);
  const overflow = total - shown.length;
  const boxes = placeBoxes(shown);
  // Önem grupları legend'i — sayaçlar tam listeden (kesilen değil).
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
          havada asılı {shown.length} uyarı
          {overflow > 0 && ` · +${overflow} listede`}
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

      {/* 3B sahne */}
      <div
        className="relative h-[340px] sm:h-[380px]"
        style={{ perspective: "1300px", perspectiveOrigin: "50% 42%" }}
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
            {boxes.map(({ alert: a, ...p }, i) => {
              const m = MATERIAL[a.severity];
              return (
                <div
                  key={a.key}
                  // Kademeli belirme: kutular sahneye sırayla yerleşir
                  // (soft-in yalnız opacity+blur — inline 3B transform'a dokunmaz).
                  className="soft-in absolute"
                  style={{
                    left: `${p.xPct}%`,
                    top: `${p.yPct}%`,
                    transform: `translate(-50%, -50%) translateZ(${p.z}px) rotateX(${p.rotX}deg) rotateY(${p.rotY}deg)`,
                    transformStyle: "preserve-3d",
                    animationDelay: `${i * 70}ms`,
                    animationDuration: "0.6s",
                  }}
                >
                  <div
                    className="motion-safe:animate-[ab-float_var(--dur)_ease-in-out_infinite]"
                    style={
                      {
                        "--dur": `${p.durMs}ms`,
                        animationDelay: `${p.delayMs}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <Link
                      href={a.href}
                      className={cn(
                        "group relative block overflow-visible rounded-2xl border p-3 transition-transform duration-300 hover:z-30 hover:scale-[1.06] focus-visible:z-30 focus-visible:scale-[1.06] active:scale-[1.01] active:duration-150",
                        "[background-image:var(--ab-surface)] dark:[background-image:var(--ab-surface-dark)]",
                        m.extra,
                      )}
                      style={{
                        width: `${m.width}px`,
                        "--ab-surface": m.surface,
                        "--ab-surface-dark": m.surfaceDark,
                        borderColor: m.border,
                        boxShadow: `${m.glow}, inset 0 1px 0 oklch(1 0 0 / 0.45)`,
                        backdropFilter: m.filter,
                        WebkitBackdropFilter: m.filter,
                      } as React.CSSProperties}
                    >
                      <span
                        className={cn(
                          "font-mono text-[9px] font-bold tracking-[0.16em] uppercase",
                          m.text,
                        )}
                      >
                        {m.label}
                        {a.count > 1 && (
                          <span className="ml-1 tabular-nums opacity-80">
                            ×{a.count}
                          </span>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
