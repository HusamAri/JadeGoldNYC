"use client";

import { useMemo, useState } from "react";
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
 * başlıklı çipler olarak şeritte durur (gecikmiş kırmızı · yapılacak jade ·
 * sürüyor altın · biten yeşil). Alttaki kaydırıcı geçmiş↔gelecek gezdirir.
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
      .filter((t) => t.rel >= winStart - CHIP_SPAN_DAYS && t.rel <= winEnd + 1)
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
      laneEnds[lane] = t.rel + CHIP_SPAN_DAYS;
      out.push({ ...t, lane });
    }
    return out;
  }, [data.tasks, winStart, winEnd, todayMs]);

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
    <div className="bg-card nm-raised-sm w-full rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock className="size-4 text-[color:var(--gold-deep,#9A7A34)]" />
        <p className="font-semibold">Görev Zaman Çizelgesi</p>
        <span className="text-muted-foreground text-xs">{windowLabel}</span>
        <span className="text-muted-foreground ml-auto hidden gap-3 text-[11px] sm:flex">
          <Legend color="var(--jade,#2F5D50)" label="Yapılacak" />
          <Legend color="var(--gold,#B89347)" label="Sürüyor" />
          <Legend color="#059669" label="Bitti" />
          <Legend color="#b23b3b" label="Gecikmiş" />
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-1.5 rounded-[2px] bg-[color:var(--gold,#B89347)]/50" />
            Günlük satış
          </span>
        </span>
      </div>

      {/* Şerit: üstte BÜYÜK görev çipleri, altta satış sütunları (bağlam) */}
      <div
        className="relative mt-3 overflow-hidden"
        style={{ height: `${MAX_LANES * LANE_H + SALES_H + 22}px` }}
      >
        {/* eksen çizgileri + etiketleri */}
        {ticks.map((r) => (
          <div
            key={r}
            className="absolute inset-y-0"
            style={{ left: `${pct(r)}%` }}
          >
            <span className="absolute inset-y-0 w-px bg-[color:var(--line,#DED9CB)]/60" />
            <span className="text-muted-foreground absolute bottom-0 -translate-x-1/2 text-[9px] whitespace-nowrap tabular-nums">
              {fmtShort(isoAdd(todayIso, r))}
            </span>
          </div>
        ))}
        {/* bugün çizgisi */}
        {0 >= winStart && 0 <= winEnd && (
          <div className="absolute inset-y-0" style={{ left: `${pct(0)}%` }}>
            <span className="absolute inset-y-0 w-0.5 bg-[color:var(--jade,#2F5D50)]" />
            <span className="absolute bottom-0 -translate-x-1/2 text-[9px] font-bold text-[color:var(--jade,#2F5D50)]">
              Bugün
            </span>
          </div>
        )}

        {/* satış sütunları (alt bölge, eksen etiketinin üstünde) */}
        {salesInWin.map((d) => (
          <span
            key={d.date}
            title={`${fmtShort(d.date)} · ${d.orders} sipariş · $${(d.revenueCents / 100).toFixed(0)}`}
            className="absolute -translate-x-1/2 rounded-t-[3px] bg-[color:var(--gold,#B89347)]/50"
            style={{
              left: `${pct(d.rel)}%`,
              bottom: "16px",
              width: `${Math.max(3, 100 / WINDOW_DAYS / 2.2)}%`,
              height: `${Math.max(4, Math.round((d.revenueCents / maxRevenue) * (SALES_H - 8)))}px`,
            }}
          />
        ))}

        {/* görev çipleri — BÜYÜK, başrolde */}
        {placed.map((t) => {
          const overdue = t.status !== "done" && t.rel < 0;
          const color = overdue
            ? "#b23b3b"
            : t.status === "done"
              ? "#059669"
              : t.status === "doing"
                ? "var(--gold,#B89347)"
                : "var(--jade,#2F5D50)";
          return (
            <Link
              key={t.id}
              href={`/gorevler/${t.id}`}
              title={`${fmtShort(t.dueDate)} · ${t.title}${t.assigneeName ? ` · ${t.assigneeName}` : ""} (${t.priority})`}
              className="bg-card absolute flex max-w-[300px] min-w-0 items-center gap-2 rounded-xl border-2 py-1.5 pr-3 pl-2 text-[12.5px] font-semibold shadow-md transition-transform hover:z-10 hover:-translate-y-0.5"
              style={{
                left: `${pct(t.rel)}%`,
                top: `${t.lane * LANE_H + 4}px`,
                borderColor: color,
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
                <span className="text-muted-foreground block text-[10px] leading-tight font-medium">
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
          <span className="text-muted-foreground absolute top-1 right-1 rounded-full border px-2 py-0.5 text-[10px] tabular-nums">
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
          className="h-2 flex-1 cursor-ew-resize appearance-none rounded-full bg-[color:var(--line,#DED9CB)] accent-[color:var(--gold,#B89347)]"
        />
        <span className="text-muted-foreground text-[11px]">Gelecek</span>
        {offset !== 0 && (
          <button
            type="button"
            onClick={() => setOffset(0)}
            className="text-muted-foreground hover:text-foreground rounded-md border px-2 py-1 text-[11px] font-semibold"
            style={{ borderColor: "var(--line,#DED9CB)" }}
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
