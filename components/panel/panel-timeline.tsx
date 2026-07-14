"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, CircleDot, Timer } from "lucide-react";

import type {
  TimelineData,
  TimelineEvent,
  TimelineTask,
} from "@/lib/db/queries/timeline";
import { TASK_COLOR_BY_KEY, taskIconUrl } from "@/lib/task-style";

const DAY_MS = 86_400_000;
/** Görünür pencere genişliği (gün) */
const WINDOW_DAYS = 42;
/** Dar (mobil) ekranda görünür pencere — sıkışmayı önlemek için daha az gün */
const WINDOW_DAYS_SM = 24;
/** Çip genişliği (gün cinsinden) — satır (lane) çakışma hesabında kullanılır */
const CHIP_SPAN_DAYS = 11;
const MAX_LANES = 3;
/** Görev bölgesi yüksekliği (üst) ve olay bölgesi payı (alt), px */
const LANE_H = 38;
const EVENT_H = 56;

function fmtShort(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

/** Deterministik minik hash — olay küresi yerleşimi/salınımı için. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type PlacedTask = TimelineTask & { rel: number; lane: number };
type PlacedEvent = TimelineEvent & { rel: number };

/** Olay türü → kontrast gradient mürekkepleri (mor aileye komplemanter). */
const EVENT_INK: Record<
  TimelineEvent["kind"],
  { label: string; hi: string; lo: string; glow: string }
> = {
  satis: {
    label: "Satış",
    hi: "oklch(0.92 0.12 95)",
    lo: "oklch(0.68 0.14 70)",
    glow: "oklch(0.8 0.14 85 / 0.5)",
  },
  yorum: {
    label: "Yorum",
    hi: "oklch(0.9 0.1 350)",
    lo: "oklch(0.62 0.19 350)",
    glow: "oklch(0.72 0.17 350 / 0.5)",
  },
  sistem: {
    label: "Sistem",
    hi: "oklch(0.92 0.09 195)",
    lo: "oklch(0.6 0.12 210)",
    glow: "oklch(0.75 0.12 200 / 0.5)",
  },
};

/**
 * KIRIK CAM parça geometrisi — pill yüzeyini kırılma noktasından (sol-üst
 * üçte birlik) dağılan 5 parçaya böler. Parçalar ayrı backdrop-filter
 * örneklediği için arkadaki olay küreleri her parçada FARKLI bozulur;
 * kayma yönleri kırılma yönünü izler (geçmişe/sola savrulma).
 */
const SHARDS: {
  clip: string;
  dx: number; // savrulma yönü (px, age=1'de)
  dy: number;
  rot: number; // derece (age=1'de)
}[] = [
  { clip: "polygon(0% 0%, 34% 0%, 26% 52%, 0% 78%)", dx: -14, dy: -5, rot: -7 },
  { clip: "polygon(34% 0%, 70% 0%, 60% 46%, 26% 52%)", dx: -6, dy: -9, rot: -3 },
  { clip: "polygon(70% 0%, 100% 0%, 100% 55%, 60% 46%)", dx: -2, dy: -4, rot: 2 },
  { clip: "polygon(0% 78%, 26% 52%, 60% 46%, 48% 100%, 0% 100%)", dx: -10, dy: 7, rot: -5 },
  { clip: "polygon(60% 46%, 100% 55%, 100% 100%, 48% 100%)", dx: -4, dy: 9, rot: 3 },
];

/** Kırılma çizgileri — parça sınırlarını izleyen ince cam çatlağı (SVG). */
function CrackLines() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <g
        fill="none"
        strokeWidth="0.9"
        className="stroke-white/70 dark:stroke-white/35"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M34 0 L26 52 L0 78" />
        <path d="M70 0 L60 46 L26 52" />
        <path d="M100 55 L60 46" />
        <path d="M26 52 L48 100" />
        <path d="M60 46 L48 100" />
        <path d="M26 52 L18 34" strokeWidth="0.5" />
        <path d="M60 46 L68 62" strokeWidth="0.5" />
      </g>
    </svg>
  );
}

/**
 * Ana panel GÖREV zaman çizelgesi v2 — yatay, geniş.
 * · Yaklaşan görevler PARILDAR (shimmer süpürmesi).
 * · Süren görevler ilerleme YÜZDESİ taşır (ince dolum çubuğu + rozet).
 * · Biten görevler KIRIK CAMDIR; geçmişe gittikçe parçalar savrulup çözülür.
 * · OLAYLAR (satış günü, yorum, sistem) camların ARKASINDA havada asılı
 *   kontrast gradient kürelerdir; yalnız hover'da cam popup detay verir.
 * Alttaki kaydırıcı geçmiş↔gelecek gezdirir.
 */
export function PanelTimeline({ data }: { data: TimelineData }) {
  const [offset, setOffset] = useState(0); // pencere merkezi, bugüne göre gün
  const [hoverEvent, setHoverEvent] = useState<string | null>(null);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayMs = useMemo(
    () => new Date(todayIso + "T00:00:00").getTime(),
    [todayIso],
  );

  // Şerit genişliğini ölç: çip genişliği ve lane çakışma aralığı PİKSEL
  // gerçeğine bağlanır (dar viewport'ta çipler üst üste binmesin / kart
  // kenarından taşmasın diye).
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [stripW, setStripW] = useState(0);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => setStripW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const windowDays = stripW > 0 && stripW < 560 ? WINDOW_DAYS_SM : WINDOW_DAYS;
  const winStart = offset - windowDays / 2;
  const winEnd = offset + windowDays / 2;
  const chipMaxPx = stripW > 0 ? Math.min(300, Math.round(stripW * 0.62)) : 300;
  const chipSpanDays =
    stripW > 0
      ? Math.max(CHIP_SPAN_DAYS, Math.ceil(chipMaxPx / (stripW / windowDays)))
      : CHIP_SPAN_DAYS;

  // Penceredeki görevler + satır (lane) ataması.
  const placed = useMemo<PlacedTask[]>(() => {
    const inWin = data.tasks
      .map((t) => ({
        ...t,
        rel: Math.round(
          (new Date(t.dueDate + "T00:00:00").getTime() - todayMs) / DAY_MS,
        ),
      }))
      .filter((t) => t.rel >= winStart - chipSpanDays && t.rel <= winEnd + 1)
      .sort((a, b) => a.rel - b.rel);
    const laneEnds: number[] = [];
    const out: PlacedTask[] = [];
    for (const t of inWin) {
      let lane = laneEnds.findIndex((end) => t.rel > end);
      if (lane === -1) {
        if (laneEnds.length >= MAX_LANES) continue; // taşanlar sayıyla gösterilir
        lane = laneEnds.length;
        laneEnds.push(-Infinity);
      }
      laneEnds[lane] = t.rel + chipSpanDays;
      out.push({ ...t, lane });
    }
    return out;
  }, [data.tasks, winStart, winEnd, todayMs, chipSpanDays]);

  const hiddenCount =
    data.tasks.filter((t) => {
      const rel = Math.round(
        (new Date(t.dueDate + "T00:00:00").getTime() - todayMs) / DAY_MS,
      );
      return rel >= winStart && rel <= winEnd;
    }).length - placed.filter((t) => t.rel >= winStart && t.rel <= winEnd).length;

  const pct = (rel: number) => ((rel - winStart) / windowDays) * 100;
  const windowLabel = `${fmtShort(isoAdd(todayIso, winStart))} — ${fmtShort(isoAdd(todayIso, winEnd))}`;
  const stripH = MAX_LANES * LANE_H + EVENT_H + 22;

  // Penceredeki olaylar — küreler tüm şeride "havada asılı" dağılır.
  const eventsInWin = useMemo<PlacedEvent[]>(() => {
    return data.events
      .map((e) => ({
        ...e,
        rel: Math.round(
          (new Date(e.date + "T00:00:00").getTime() - todayMs) / DAY_MS,
        ),
      }))
      .filter((e) => e.rel >= winStart && e.rel <= winEnd);
  }, [data.events, winStart, winEnd, todayMs]);

  // Eksen işaretleri: 7 günde bir
  const ticks = useMemo(() => {
    const first = Math.ceil(winStart / 7) * 7;
    const arr: number[] = [];
    for (let r = first; r <= winEnd; r += 7) arr.push(r);
    return arr;
  }, [winStart, winEnd]);

  return (
    <div
      className={
        "w-full rounded-[26px] border border-[color:var(--glass-border)] p-4 sm:p-5 " +
        "[background-color:var(--glass)] [background-image:var(--glass-sheen)] [backdrop-filter:var(--glass-filter)] shadow-[var(--lift),var(--glass-highlight)] " +
        "dark:border-[color:oklch(1_0_0/0.05)] dark:[background-color:var(--lume-panel)] dark:[background-image:none] dark:[backdrop-filter:none] dark:shadow-[0_20px_50px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.06)] " +
        "[--tl-todo:oklch(0.54_0.20_278)] [--tl-doing:oklch(0.66_0.20_285)] [--tl-done:oklch(0.83_0.07_290)] [--tl-late:oklch(0.58_0.16_344)] " +
        "dark:[--tl-todo:oklch(0.72_0.14_262)] dark:[--tl-doing:oklch(0.78_0.12_278)] dark:[--tl-done:oklch(0.86_0.05_262)] dark:[--tl-late:oklch(0.74_0.12_344)]"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock aria-hidden className="size-4 text-[color:var(--gold-deep)]" />
        <p className="font-semibold">Görev Zaman Çizelgesi</p>
        <span className="text-muted-foreground text-xs">{windowLabel}</span>
        <span className="text-muted-foreground ml-auto hidden gap-3 text-[11px] sm:flex">
          <Legend color="var(--tl-todo)" label="Yapılacak" />
          <Legend color="var(--tl-doing)" label="Sürüyor · %" />
          <span className="inline-flex items-center gap-1">
            <span className="relative inline-block size-2.5 overflow-hidden rounded-[3px] border border-white/70 bg-[color:var(--tl-done)]/40 dark:border-white/30">
              <span className="absolute inset-x-0 top-1/2 h-px -rotate-12 bg-white/80 dark:bg-white/50" />
            </span>
            Bitti (kırık cam)
          </span>
          <Legend color="var(--tl-late)" label="Gecikmiş" />
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{
                backgroundImage: `radial-gradient(circle at 32% 30%, ${EVENT_INK.satis.hi}, ${EVENT_INK.satis.lo} 70%)`,
              }}
            />
            Olaylar
          </span>
        </span>
      </div>

      {/* Şerit: arkada olay küreleri, önde görev çipleri */}
      <div
        ref={stripRef}
        className="relative mt-3 overflow-hidden px-2 [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-26px),transparent)]"
        style={{ height: `${stripH}px` }}
      >
        {/* eksen çizgileri + etiketleri */}
        {ticks.map((r) => (
          <div
            key={r}
            className="absolute inset-y-0"
            style={{ left: `${pct(r)}%` }}
          >
            <span className="bg-border/60 absolute inset-y-0 w-px" />
            <span className="text-muted-foreground absolute bottom-0 -translate-x-1/2 text-[9px] whitespace-nowrap tabular-nums">
              {fmtShort(isoAdd(todayIso, r))}
            </span>
          </div>
        ))}
        {/* bugün çizgisi */}
        {0 >= winStart && 0 <= winEnd && (
          <div className="absolute inset-y-0 z-[5]" style={{ left: `${pct(0)}%` }}>
            <span className="absolute inset-y-0 w-0.5 bg-[oklch(0.54_0.20_278)] shadow-[0_0_8px_oklch(0.62_0.20_278/0.45)] dark:bg-white dark:shadow-[0_0_10px_rgba(205,214,255,0.7)]" />
            <span className="absolute bottom-3.5 -translate-x-1/2 rounded border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] px-1 text-[9px] font-bold text-[oklch(0.50_0.19_278)] [backdrop-filter:var(--glass-filter-sm)] dark:border-[color:oklch(1_0_0/0.25)] dark:text-white dark:[text-shadow:0_0_10px_rgba(255,255,255,0.5)]">
              Bugün
            </span>
          </div>
        )}

        {/* OLAY KÜRELERİ — camların arkasında havada asılı (z-[1] < çip z-10).
            Alan boyunca eşit-ama-rastgele dağılım: y konumu tarih+tür
            hash'inden türetilir (deterministik; render'lar arasında sabit). */}
        {eventsInWin.map((e) => {
          const id = `${e.kind}:${e.date}:${e.title}`;
          const h = hash(id);
          const ink = EVENT_INK[e.kind];
          const size = 11 + Math.round(e.weight * 17);
          const yPct = 10 + (h % 62);
          const isHover = hoverEvent === id;
          return (
            <span
              key={id}
              className="absolute z-[1] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pct(e.rel)}%`, top: `${yPct}%` }}
            >
              <span
                onMouseEnter={() => setHoverEvent(id)}
                onMouseLeave={() => setHoverEvent(null)}
                className="block cursor-default rounded-full transition-transform duration-300 hover:scale-125 motion-safe:animate-[tl-orb-float_var(--dur)_ease-in-out_infinite]"
                style={
                  {
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundImage: `radial-gradient(circle at 32% 28%, ${ink.hi}, ${ink.lo} 68%, transparent 100%)`,
                    boxShadow: `0 0 ${6 + size / 2}px ${ink.glow}, inset 0 1px 1px oklch(1 0 0 / 0.5)`,
                    "--dur": `${5 + (h % 5)}s`,
                    animationDelay: `${-(h % 4000)}ms`,
                  } as React.CSSProperties
                }
              />
              {/* Cam popup — YALNIZ hover'da */}
              {isHover && (
                <span className="absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] px-3 py-2 text-left shadow-[var(--lift-sm)] [backdrop-filter:var(--glass-filter)] dark:border-[color:oklch(1_0_0/0.2)] dark:[background-color:var(--lume-glass)] dark:[background-image:none]">
                  <span className="block text-[11px] leading-tight font-semibold">
                    {e.title}
                  </span>
                  <span className="text-muted-foreground block font-mono text-[9.5px] leading-tight tracking-[0.1em] uppercase">
                    {fmtShort(e.date)} · {ink.label} · {e.detail}
                  </span>
                </span>
              )}
            </span>
          );
        })}

        {/* GÖREV ÇİPLERİ */}
        {placed.map((t) => {
          const overdue = t.status !== "done" && t.rel < 0;
          const done = t.status === "done";
          // Geçmişe dağılma şiddeti: bitmiş görev ne kadar eskiyse parçalar
          // o kadar savrulur ve çip o kadar çözülür (dissolve).
          const age = done ? Math.min(1, Math.max(0, -t.rel) / 45) : 0;
          const taskColor = t.color ? TASK_COLOR_BY_KEY.get(t.color) : null;
          const color = overdue
            ? "var(--tl-late)"
            : done
              ? "var(--tl-done)"
              : t.status === "doing"
                ? "var(--tl-doing)"
                : "var(--tl-todo)";
          const progress =
            t.status === "doing" && t.progress != null
              ? Math.max(0, Math.min(100, t.progress))
              : null;
          return (
            <Link
              key={t.id}
              href={`/gorevler/${t.id}`}
              title={`${fmtShort(t.dueDate)} · ${t.title}${t.assigneeName ? ` · ${t.assigneeName}` : ""} (${t.priority})${progress != null ? ` · %${progress}` : ""}${done ? " · tamamlandı" : ""}`}
              className={
                "absolute z-10 flex min-w-0 items-center gap-2 overflow-hidden rounded-full border py-1.5 pr-3.5 pl-2 text-[12.5px] font-semibold shadow-[var(--lift-sm)] transition-transform hover:z-20 hover:-translate-y-0.5 [backdrop-filter:var(--glass-filter-sm)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] dark:shadow-[0_10px_24px_oklch(0_0_0/0.45),0_0_16px_oklch(0.7_0.07_262/0.2)] dark:[background-color:var(--lume-glass)] dark:[background-image:none] " +
                (done
                  ? "border-white/60 dark:border-white/20"
                  : "border-[color:var(--glass-border)] dark:border-[color:oklch(1_0_0/0.25)] ") +
                (t.status === "todo" && !overdue ? " tl-shimmer relative" : "")
              }
              style={{
                left: `clamp(0%, ${pct(t.rel)}%, calc(100% - ${chipMaxPx}px))`,
                maxWidth: `${chipMaxPx}px`,
                top: `${t.lane * LANE_H + 4}px`,
                opacity: done ? 1 - age * 0.55 : 1,
              }}
            >
              {/* KIRIK CAM katmanı — parçalar ayrı backdrop örnekler; arkadaki
                  küreler her parçada farklı bozulur, savrulma geçmişe bakar. */}
              {done && (
                <>
                  {SHARDS.map((s, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="absolute inset-0 rounded-full motion-safe:animate-[tl-shard-drift_7s_ease-in-out_infinite]"
                      style={
                        {
                          clipPath: s.clip,
                          backdropFilter: `blur(${1 + age * 1.5}px) saturate(${1.2 + i * 0.15}) brightness(${1 + (i % 2 === 0 ? 0.06 : -0.05)})`,
                          "--sx": `${s.dx * age}px`,
                          "--sy": `${s.dy * age}px`,
                          "--sr": `${s.rot * age}deg`,
                          animationDelay: `${-i * 900}ms`,
                          opacity: 1 - age * 0.3,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                  <CrackLines />
                </>
              )}

              {/* Süren görev: ilerleme dolumu (ince alt çubuk) */}
              {progress != null && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--tl-doing)]/12 dark:bg-[color:var(--tl-doing)]/18"
                  style={{ width: `${progress}%` }}
                />
              )}

              {t.icon ? (
                <span
                  aria-hidden
                  className="relative z-10 inline-block size-[18px] shrink-0"
                  style={{
                    backgroundColor: taskColor?.ink ?? color,
                    maskImage: `url(${taskIconUrl(t.icon)})`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskImage: `url(${taskIconUrl(t.icon)})`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                  }}
                />
              ) : done ? (
                <CheckCircle2 className="relative z-10 size-[18px] shrink-0" style={{ color }} />
              ) : overdue ? (
                <Timer className="relative z-10 size-[18px] shrink-0" style={{ color }} />
              ) : (
                <CircleDot className="relative z-10 size-[18px] shrink-0" style={{ color }} />
              )}
              <span className="relative z-10 min-w-0">
                <span
                  className="block truncate leading-tight"
                  style={done ? { textDecorationLine: "line-through", textDecorationColor: "oklch(0.6 0.05 290 / 0.5)" } : undefined}
                >
                  {t.title}
                </span>
                <span className="text-muted-foreground block truncate font-mono text-[9px] leading-tight tracking-[0.12em] uppercase">
                  {fmtShort(t.dueDate)}
                  {t.assigneeName ? ` · ${t.assigneeName}` : ""} · {t.priority}
                  {done && " · bitti"}
                </span>
              </span>
              {progress != null && (
                <span className="relative z-10 ml-auto shrink-0 rounded-full bg-[color:var(--tl-doing)]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[color:var(--tl-doing)] tabular-nums">
                  %{progress}
                </span>
              )}
            </Link>
          );
        })}

        {placed.length === 0 && eventsInWin.length === 0 && (
          <p className="text-muted-foreground absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm">
            Bu pencerede tarihli görev ya da olay yok — kaydırıcıyla gez ya da{" "}
            <Link href="/gorevler/yeni" className="underline underline-offset-2">
              tarihli görev ekle
            </Link>
            .
          </p>
        )}
        {hiddenCount > 0 && (
          <span className="text-muted-foreground absolute right-2 bottom-6 z-10 rounded-full border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] px-2 py-0.5 text-[10px] tabular-nums [backdrop-filter:var(--glass-filter-sm)]">
            +{hiddenCount} görev sığmadı — pencereyi daralt/kaydır
          </span>
        )}
      </div>

      {/* Kaydırıcı: geçmiş ↔ gelecek */}
      <div className="mt-2 flex items-center gap-3">
        <span className="text-muted-foreground text-[11px]">Geçmiş</span>
        <input
          type="range"
          min={-150}
          max={150}
          step={1}
          value={offset}
          onChange={(e) => setOffset(Number(e.target.value))}
          aria-label="Zaman penceresini kaydır (geçmiş-gelecek)"
          className={
            "h-2.5 flex-1 cursor-ew-resize appearance-none rounded-full " +
            "[background-color:rgb(120_120_150/0.12)] [box-shadow:var(--shadow-pressed)] dark:[background-color:oklch(0_0_0/0.35)] dark:[box-shadow:var(--lume-pit)] " +
            "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[color:rgb(255_255_255/.85)] [&::-webkit-slider-thumb]:[background-image:radial-gradient(circle_at_35%_30%,#ffffff,#dcd6ff_75%)] [&::-webkit-slider-thumb]:[box-shadow:var(--shadow-raised-sm),0_0_12px_oklch(0.62_0.20_278/0.35)] " +
            "dark:[&::-webkit-slider-thumb]:border-[color:oklch(1_0_0/.5)] dark:[&::-webkit-slider-thumb]:[box-shadow:var(--lume-glow-lg)] " +
            "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[color:rgb(255_255_255/.85)] [&::-moz-range-thumb]:[background-image:radial-gradient(circle_at_35%_30%,#ffffff,#dcd6ff_75%)] [&::-moz-range-thumb]:[box-shadow:var(--shadow-raised-sm)] dark:[&::-moz-range-thumb]:[box-shadow:var(--lume-glow-lg)]"
          }
        />
        <span className="text-muted-foreground text-[11px]">Gelecek</span>
        {offset !== 0 && (
          <button
            type="button"
            onClick={() => setOffset(0)}
            className="text-muted-foreground hover:text-foreground border-border hover:border-foreground/40 rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors [font-family:var(--font-index)] dark:hover:border-[color:oklch(1_0_0/.3)]"
          >
            Bugüne dön
          </button>
        )}
      </div>
    </div>
  );
}

function isoAdd(baseIso: string, days: number): string {
  return new Date(new Date(baseIso + "T00:00:00").getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block size-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
