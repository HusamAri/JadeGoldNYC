"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import type { SocialPost } from "@/lib/db/queries/social";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SocialPostCard } from "@/components/social/social-post-card";

const FORMAT_DOT: Record<string, string> = {
  reel: "bg-[oklch(0.58_0.16_344)]",
  photo: "bg-[oklch(0.50_0.14_278)]",
  carousel: "bg-[oklch(0.62_0.12_70)]",
  story: "bg-[oklch(0.55_0.10_200)]",
  post: "bg-muted-foreground",
};

function monthLabel(d: Date) {
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Ay takvimi + seçili günün kartları. İçerik yoksa (Jade) boş ay + "İçerik ekle"
 * CTA; EON seed'li org'da dolu günler noktalanır.
 */
export function SocialCalendar({ posts }: { posts: SocialPost[] }) {
  const [cursor, setCursor] = useState(() => {
    const withDate = posts.find((p) => p.scheduled_at);
    const base = withDate?.scheduled_at
      ? new Date(withDate.scheduled_at)
      : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, SocialPost[]>();
    for (const p of posts) {
      if (!p.scheduled_at) continue;
      const key = ymd(new Date(p.scheduled_at));
      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }
    return m;
  }, [posts]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: { date: Date | null; key: string | null }[] = [];
    for (let i = 0; i < firstDow; i++) out.push({ date: null, key: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      out.push({ date, key: ymd(date) });
    }
    return out;
  }, [cursor]);

  const selectedPosts = selected ? (byDay.get(selected) ?? []) : [];
  const unscheduled = posts.filter((p) => !p.scheduled_at);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
            aria-label="Önceki ay"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-[10rem] text-center text-base font-semibold capitalize">
            {monthLabel(cursor)}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
            aria-label="Sonraki ay"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button asChild>
          <Link href="/sosyal/yeni">
            <Plus className="size-4" />
            İçerik ekle
          </Link>
        </Button>
      </div>

      <div className="nm-raised-sm overflow-hidden rounded-[1.5rem]">
        <div className="text-muted-foreground grid grid-cols-7 border-b font-mono text-[10px] tracking-[0.14em] uppercase">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
            <div key={d} className="px-2 py-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            if (!c.date || !c.key) {
              return <div key={`e-${i}`} className="min-h-20 border-b border-r/50" />;
            }
            const dayPosts = byDay.get(c.key) ?? [];
            const isSel = selected === c.key;
            const isToday = c.key === ymd(new Date());
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(isSel ? null : c.key)}
                className={cn(
                  "min-h-20 border-b border-r/50 p-2 text-left transition-colors",
                  isSel && "bg-primary/8",
                  isToday && !isSel && "bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    isToday && "text-primary font-semibold",
                  )}
                >
                  {c.date.getDate()}
                </span>
                {dayPosts.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        title={p.title}
                        className={cn(
                          "size-1.5 rounded-full",
                          FORMAT_DOT[p.format] ?? FORMAT_DOT.post,
                        )}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-muted-foreground font-mono text-[9px]">
                        +{dayPosts.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed px-6 py-12 text-center">
          <p className="text-sm font-medium">Takvim boş</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Bu marka için henüz içerik yok. İlk Instagram/TikTok planını ekleyin —
            özellik tüm şirketlerde aynı; içerik markaya özel kalır.
          </p>
          <Button asChild className="mt-4">
            <Link href="/sosyal/yeni">
              <Plus className="size-4" />
              İlk içeriği ekle
            </Link>
          </Button>
        </div>
      ) : selected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase">
              {selected}
            </p>
            <Badge variant="secondary">{selectedPosts.length} içerik</Badge>
          </div>
          {selectedPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Bu günde plan yok.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {selectedPosts.map((p) => (
                <li key={p.id}>
                  <SocialPostCard post={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase">
            Yaklaşan / tüm planlı
          </p>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {posts
              .filter((p) => p.status !== "skipped")
              .slice(0, 12)
              .map((p) => (
                <li key={p.id}>
                  <SocialPostCard post={p} />
                </li>
              ))}
          </ul>
          {unscheduled.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {unscheduled.length} plansız fikir (tarihsiz) — kartlardan düzenleyin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
