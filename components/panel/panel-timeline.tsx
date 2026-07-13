"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, CircleDot, Timer } from "lucide-react";

import type { TimelineData, TimelineTask } from "@/lib/db/queries/timeline";

const DAY_MS = 86_400_000;
/** Görünür pencere genişliği (gün) */
const WINDOW_DAYS = 42;
/** Çip genişliği (gün cinsinden) — satır (lane) çakışma hesabında kullanılır */
const CHIP_SPAN_DAYS = 11;
const MAX_LANES = 3;
/** Görev bölgesi yüksekliği (üst) ve satış sütun bölgesi (alt), px */
const LANE_H = 38;
const SALES_H = 56;

function fmtShort(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

type PlacedTask = TimelineTask & { rel: number; lane: number };

/**
 * Ana panel GÖREV zaman çizelgesi — yatay, geniş; bitiş tarihli görevler
 * cam pill çipler olarak şeritte durur. Durum mürekkepleri Spatial mor
 * ailesinden türer (yapılacak koyu mor · sürüyor orta mor · biten soluk mor ·
 * gecikmiş negatif 344); koyu temada lume eşleri. Alttaki kaydırıcı neu çukur
 * ray + cam thumb ile geçmiş↔gelecek gezdirir.
 */
export function PanelTimeline({ data }: { data: TimelineData }) {
  const [offset, setOffset] = useState(0); // pencere merkezi, bugüne göre gün
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayMs = useMemo(
    () => new Date(todayIso + "T00:00:00").getTime(),
    [todayIso],
  );

  const winStart = offset - WINDOW_DAYS / 2;
  const winEnd = offset + WINDOW_DAYS / 2;

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
  // Çip azami genişliği: geniş ekranda 300px, dar ekranda şeridin ~%62'si.
  const chipMaxPx = stripW > 0 ? Math.min(300, Math.round(stripW * 0.62)) : 300;
  // Lane hesabı için çip genişliğinin gün karşılığı (px → gün dönüşümü).
  const chipSpanDays =
    stripW > 0
      ? Math.max(CHIP_SPAN_DAYS, Math.ceil(chipMaxPx / (stripW / WINDOW_DAYS)))
      : CHIP_SPAN_DAYS;

  // Penceredeki görevler + basit satır (lane) ataması: aynı satırda üst üste
  // binmesin diye çipler CHIP_SPAN_DAYS aralığına göre açgözlü dağıtılır.
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

  const pct = (rel: number) => ((rel - winStart) / WINDOW_DAYS) * 100;
  const windowLabel = `${fmtShort(isoAdd(todayIso, winStart))} — ${fmtShort(isoAdd(todayIso, winEnd))}`;

  // Penceredeki satış günleri (bağlam şeridi, alt bölge)
  const salesInWin = useMemo(() => {
    return data.days
      .map((d) => ({
        ...d,
        rel: Math.round(
          (new Date(d.date + "T00:00:00").getTime() - todayMs) / DAY_MS,
        ),
      }))
      .filter((d) => d.rel >= winStart && d.rel <= winEnd);
  }, [data.days, winStart, winEnd, todayMs]);
  const maxRevenue = useMemo(
    () => Math.max(1, ...salesInWin.map((d) => d.revenueCents)),
    [salesInWin],
  );

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
        // Açık: Spatial cam kart; koyu: opak lume hücre (Liquid_Dark .cell).
        // Durum mürekkepleri tek yerden: mor aile (koyuda lume eşleri).
        "w-full rounded-[26px] border border-[color:var(--glass-border)] p-4 sm:p-5 " +
        "[background-color:var(--glass)] [background-image:var(--glass-sheen)] [backdrop-filter:var(--glass-filter)] shadow-[var(--lift),var(--glass-highlight)] " +
        "dark:border-[color:oklch(1_0_0/0.05)] dark:[background-color:var(--lume-panel)] dark:[background-image:none] dark:[backdrop-filter:none] dark:shadow-[0_20px_50px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.06)] " +
        "[--tl-todo:oklch(0.54_0.20_278)] [--tl-doing:oklch(0.66_0.20_285)] [--tl-done:oklch(0.83_0.07_290)] [--tl-late:oklch(0.58_0.16_344)] " +
        "dark:[--tl-todo:oklch(0.72_0.14_262)] dark:[--tl-doing:oklch(0.78_0.12_278)] dark:[--tl-done:oklch(0.86_0.05_262)] dark:[--tl-late:oklch(0.74_0.12_344)]"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock className="size-4 text-[color:var(--gold-deep)]" />
        <p className="font-semibold">Görev Zaman Çizelgesi</p>
        <span className="text-muted-foreground text-xs">{windowLabel}</span>
        <span className="text-muted-foreground ml-auto hidden gap-3 text-[11px] sm:flex">
          <Legend color="var(--tl-todo)" label="Yapılacak" />
          <Legend color="var(--tl-doing)" label="Sürüyor" />
          <Legend color="var(--tl-done)" label="Bitti" />
          <Legend color="var(--tl-late)" label="Gecikmiş" />
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-1.5 rounded-[2px] [background-image:linear-gradient(0deg,oklch(0.62_0.19_278/.6),oklch(0.86_0.08_278/.4))] dark:[background-image:linear-gradient(0deg,oklch(0.62_0.06_262/.5),oklch(0.9_0.04_262/.25))]" />
            Günlük satış
          </span>
        </span>
      </div>

      {/* Şerit: üstte BÜYÜK görev çipleri, altta satış sütunları (bağlam) */}
      <div
        ref={stripRef}
        className="relative mt-3 overflow-hidden px-2 [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-26px),transparent)]"
        style={{ height: `${MAX_LANES * LANE_H + SALES_H + 22}px` }}
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
        {/* bugün çizgisi — açıkta mor mürekkep, koyuda beyaz + white glow (lume) */}
        {0 >= winStart && 0 <= winEnd && (
          <div className="absolute inset-y-0" style={{ left: `${pct(0)}%` }}>
            <span className="absolute inset-y-0 w-0.5 bg-[oklch(0.54_0.20_278)] shadow-[0_0_8px_oklch(0.62_0.20_278/0.45)] dark:bg-white dark:shadow-[0_0_10px_rgba(205,214,255,0.7)]" />
            <span className="absolute bottom-3.5 -translate-x-1/2 rounded border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] px-1 text-[9px] font-bold text-[oklch(0.50_0.19_278)] [backdrop-filter:var(--glass-filter-sm)] dark:border-[color:oklch(1_0_0/0.25)] dark:text-white dark:[text-shadow:0_0_10px_rgba(255,255,255,0.5)]">
              Bugün
            </span>
          </div>
        )}

        {/* satış sütunları (alt bölge, eksen etiketinin üstünde) */}
        {salesInWin.map((d) => (
          <span
            key={d.date}
            title={`${fmtShort(d.date)} · ${d.orders} sipariş · $${(d.revenueCents / 100).toFixed(0)}`}
            className="absolute -translate-x-1/2 rounded-t-[3px] border border-[color:rgb(255_255_255/.5)] [background-image:linear-gradient(0deg,oklch(0.62_0.19_278/.5),oklch(0.86_0.08_278/.3))] dark:border-[color:oklch(1_0_0/.28)] dark:[background-image:linear-gradient(0deg,oklch(0.62_0.06_262/.34),oklch(0.9_0.04_262/.16))] dark:shadow-[0_6px_10px_-2px_oklch(0.92_0.05_262/.4),0_0_16px_oklch(0.7_0.07_262/.3)]"
            style={{
              left: `${pct(d.rel)}%`,
              bottom: "16px",
              width: `${Math.max(3, 100 / WINDOW_DAYS / 2.2)}%`,
              height: `${Math.max(4, Math.round((d.revenueCents / maxRevenue) * (SALES_H - 8)))}px`,
            }}
          />
        ))}

        {/* görev çipleri — cam pill'ler; durum mürekkebi yalnız küçük glifte */}
        {placed.map((t) => {
          const overdue = t.status !== "done" && t.rel < 0;
          const color = overdue
            ? "var(--tl-late)"
            : t.status === "done"
              ? "var(--tl-done)"
              : t.status === "doing"
                ? "var(--tl-doing)"
                : "var(--tl-todo)";
          return (
            <Link
              key={t.id}
              href={`/gorevler/${t.id}`}
              title={`${fmtShort(t.dueDate)} · ${t.title}${t.assigneeName ? ` · ${t.assigneeName}` : ""} (${t.priority})`}
              className="absolute flex min-w-0 items-center gap-2 rounded-full border border-[color:var(--glass-border)] py-1.5 pr-3.5 pl-2 text-[12.5px] font-semibold shadow-[var(--lift-sm)] transition-transform hover:z-10 hover:-translate-y-0.5 [backdrop-filter:var(--glass-filter-sm)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] dark:border-[color:oklch(1_0_0/0.25)] dark:shadow-[0_10px_24px_oklch(0_0_0/0.45),0_0_16px_oklch(0.7_0.07_262/0.2)] dark:[background-color:var(--lume-glass)] dark:[background-image:none]"
              style={{
                // Çip sağ kenardan taşmasın: left, (100% - çip genişliği)
                // ile clamp'lenir; genişlik viewport'a göre sınırlanır.
                left: `clamp(0%, ${pct(t.rel)}%, calc(100% - ${chipMaxPx}px))`,
                maxWidth: `${chipMaxPx}px`,
                top: `${t.lane * LANE_H + 4}px`,
              }}
            >
              {t.status === "done" ? (
                <CheckCircle2 className="size-[18px] shrink-0" style={{ color }} />
              ) : overdue ? (
                <Timer className="size-[18px] shrink-0" style={{ color }} />
              ) : (
                <CircleDot className="size-[18px] shrink-0" style={{ color }} />
              )}
              <span className="min-w-0">
                <span className="block truncate leading-tight">{t.title}</span>
                <span className="text-muted-foreground block truncate font-mono text-[9px] leading-tight tracking-[0.12em] uppercase">
                  {fmtShort(t.dueDate)}
                  {t.assigneeName ? ` · ${t.assigneeName}` : ""} · {t.priority}
                </span>
              </span>
            </Link>
          );
        })}

        {placed.length === 0 && (
          <p className="text-muted-foreground absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm">
            Bu pencerede bitiş tarihli görev yok — kaydırıcıyla gez ya da{" "}
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
            // Ray: neu çukur (açık) / lume-pit çukur (koyu). Thumb: beyaz
            // radyal cam; koyuda lume-glow-lg ışıması.
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
