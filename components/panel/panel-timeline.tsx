"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  MessageCircleQuestion,
} from "lucide-react";

import type {
  TimelineData,
  TimelineEvent,
} from "@/lib/db/queries/timeline";
import { cn } from "@/lib/utils";

const DAY_MS = 86_400_000;
/** Görünür pencere genişliği (gün) — geniş ekranda ~2 ay */
const WINDOW_DAYS = 60;

function isoAddDays(base: Date, days: number): string {
  return new Date(base.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function fmtShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/**
 * Ana panel yatay zaman çizelgesi — geçmiş satışlar (altın sütunlar) ve
 * geçmiş+gelecek olaylar (görev/soru işaretleri) tek şeritte. Alttaki
 * kaydırıcı pencereyi geçmişe/geleceğe kaydırır; "bugün" çizgisi sabit renkte.
 */
export function PanelTimeline({ data }: { data: TimelineData }) {
  // offset: pencere merkezinin bugüne göre gün cinsinden kayması
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => new Date(new Date().toISOString().slice(0, 10)), []);

  const startIdx = offset - WINDOW_DAYS / 2; // bugüne göre gün
  const days = useMemo(() => {
    const revByDate = new Map(data.days.map((d) => [d.date, d]));
    const eventsByDate = new Map<string, TimelineEvent[]>();
    for (const e of data.events) {
      const list = eventsByDate.get(e.date) ?? [];
      list.push(e);
      eventsByDate.set(e.date, list);
    }
    return Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const rel = startIdx + i;
      const iso = isoAddDays(today, rel);
      return {
        iso,
        rel,
        day: revByDate.get(iso) ?? null,
        events: eventsByDate.get(iso) ?? [],
      };
    });
  }, [data, startIdx, today]);

  const maxRevenue = useMemo(
    () =>
      Math.max(1, ...days.map((d) => d.day?.revenueCents ?? 0)),
    [days],
  );

  const windowLabel = `${fmtShort(days[0].iso)} — ${fmtShort(days[days.length - 1].iso)}`;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="bg-card nm-raised-sm w-full rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock className="size-4 text-[color:var(--gold-deep,#9A7A34)]" />
        <p className="font-semibold">Zaman Çizelgesi</p>
        <span className="text-muted-foreground text-xs">{windowLabel}</span>
        <span className="text-muted-foreground ml-auto hidden gap-3 text-[11px] sm:flex">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-[2px] bg-[color:var(--gold,#B89347)]" />
            Satış
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDot className="size-3 text-[color:var(--jade,#2F5D50)]" />
            Görev
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircleQuestion className="size-3 text-[color:var(--gold-deep,#9A7A34)]" />
            Soru
          </span>
        </span>
      </div>

      {/* Şerit */}
      <div className="relative mt-3 h-36 select-none">
        <div className="absolute inset-0 flex">
          {days.map((d, i) => {
            const isToday = d.rel === 0;
            const h =
              d.day != null
                ? Math.max(4, Math.round((d.day.revenueCents / maxRevenue) * 72))
                : 0;
            const hasEvents = d.events.length > 0;
            return (
              <div
                key={d.iso}
                className={cn(
                  "relative flex-1 border-r border-transparent",
                  isToday && "bg-[color:var(--jade,#2F5D50)]/5",
                )}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((v) => (v === i ? null : v))}
              >
                {/* bugün çizgisi */}
                {isToday && (
                  <span className="absolute inset-y-0 left-0 w-px bg-[color:var(--jade,#2F5D50)]" />
                )}
                {/* olay işaretleri (üst bölge) */}
                {hasEvents && (
                  <div className="absolute top-1 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5">
                    {d.events.slice(0, 3).map((e, j) => (
                      <Link
                        key={j}
                        href={e.href}
                        title={`${fmtShort(d.iso)} · ${e.label}`}
                        className="block"
                      >
                        {e.type === "task-done" ? (
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                        ) : e.type === "inquiry" ? (
                          <MessageCircleQuestion className="size-3.5 text-[color:var(--gold-deep,#9A7A34)]" />
                        ) : (
                          <CircleDot
                            className={cn(
                              "size-3.5",
                              d.rel < 0
                                ? "text-[color:#b23b3b]" // geçmiş ve bitmemiş: gecikmiş
                                : "text-[color:var(--jade,#2F5D50)]",
                            )}
                          />
                        )}
                      </Link>
                    ))}
                    {d.events.length > 3 && (
                      <span className="text-muted-foreground text-[9px] leading-none">
                        +{d.events.length - 3}
                      </span>
                    )}
                  </div>
                )}
                {/* satış sütunu (alt bölge) */}
                {h > 0 && (
                  <span
                    className="absolute bottom-5 left-1/2 w-[55%] -translate-x-1/2 rounded-t-[3px] bg-[color:var(--gold,#B89347)]"
                    style={{ height: `${h}px`, opacity: d.rel <= 0 ? 0.9 : 0.4 }}
                  />
                )}
                {/* eksen etiketi — 5 günde bir */}
                {(d.rel % 5 === 0 || isToday) && (
                  <span
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap tabular-nums",
                      isToday
                        ? "font-bold text-[color:var(--jade,#2F5D50)]"
                        : "text-muted-foreground",
                    )}
                  >
                    {isToday ? "Bugün" : fmtShort(d.iso)}
                  </span>
                )}
                {/* hover bilgisi */}
                {hover === i && (d.day || hasEvents) && (
                  <div className="bg-popover text-popover-foreground absolute bottom-24 left-1/2 z-10 w-44 -translate-x-1/2 rounded-lg border p-2 text-[11px] shadow-lg">
                    <p className="font-semibold">{fmtShort(d.iso)}</p>
                    {d.day && (
                      <p>
                        {d.day.orders} sipariş · $
                        {(d.day.revenueCents / 100).toFixed(0)}
                      </p>
                    )}
                    {d.events.map((e, j) => (
                      <p key={j} className="truncate">
                        • {e.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
