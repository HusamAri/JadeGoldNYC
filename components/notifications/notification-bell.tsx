"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, X } from "lucide-react";

import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/**
 * BİLDİRİM ZİLİ — Uyarı Merkezi sinyallerinin üst bardaki özeti (kullanıcı
 * kararı: 3B uyarı board'unun yerini aldı).
 *
 *  · Veri mount SONRASI `/api/notifications`tan çekilir — en ağır sorgu
 *    (tüm listing denetimi) kabuğu/rota geçişlerini bekletmez.
 *  · Liste "liquid iced glass" dilinde: altı şeffaf, altındaki görüntüyü
 *    hafifçe büker (blur+saturate), ışıklı hale, mat, katmanlı doğal gölge
 *    (.liquid-glass — globals.css).
 *  · Oturumda İLK bildirim geldiğinde sağdan kayan cam kart belirir
 *    (sessionStorage bekçisi; reduced-motion'da animasyonsuz).
 */

type Severity = "kritik" | "onemli" | "bilgi";

interface NotifItem {
  key: string;
  title: string;
  hint: string;
  href: string;
  severity: Severity;
  costCents: number | null;
  actionLabel: string;
}

const DOT: Record<Severity, string> = {
  kritik: "bg-red-500",
  onemli: "bg-amber-500",
  bilgi: "bg-sky-500",
};

const INTRO_SEEN_KEY = "amuletta-notif-intro-v1";

export function NotificationBell() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [intro, setIntro] = useState<NotifItem | null>(null);
  const [introShown, setIntroShown] = useState(false); // slide-in tetiği
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as {
          currency?: string;
          items?: NotifItem[];
        };
        if (cancelled || !data.items) return;
        setItems(data.items);
        if (data.currency) setCurrency(data.currency);
        // İlk-bildirim kartı: oturumda bir kez, en kritik sinyalle.
        if (
          data.items.length > 0 &&
          !window.sessionStorage.getItem(INTRO_SEEN_KEY)
        ) {
          window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
          setIntro(data.items[0]);
          // Bir frame sonra translate-x-0'a geç — kayma animasyonu.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setIntroShown(true)),
          );
          dismissTimer.current = setTimeout(() => setIntroShown(false), 9000);
        }
      } catch {
        // Sessiz: zil boş kalır; Uyarı Merkezi kartı panelde yaşamaya devam eder.
      }
    })();
    return () => {
      cancelled = true;
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const kritik = items.filter((i) => i.severity === "kritik").length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Bildirimler${items.length ? ` (${items.length})` : ""}`}
            className="relative"
          >
            <Bell />
            {items.length > 0 && (
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white shadow-[var(--shadow-raised-sm)]",
                  kritik > 0 ? "bg-red-500" : "bg-amber-500",
                )}
              >
                {items.length > 99 ? "99+" : items.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="liquid-glass w-[340px] rounded-2xl p-1.5"
        >
          <p className="text-muted-foreground px-2.5 pt-1.5 pb-1 font-mono text-[0.65rem] font-medium tracking-[0.16em] uppercase">
            Bildirimler{items.length > 0 && ` · ${items.length}`}
          </p>
          {items.length === 0 ? (
            <p className="text-muted-foreground px-2.5 py-3 text-sm">
              Her şey yolunda — aksiyon bekleyen bildirim yok.
            </p>
          ) : (
            <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto">
              {items.map((n) => (
                <li key={n.key}>
                  <Link
                    href={n.href}
                    className="group hover:bg-white/35 dark:hover:bg-white/10 flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        DOT[n.severity],
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {n.title}
                        </span>
                        {n.costCents != null && n.costCents > 0 && (
                          <span className="text-muted-foreground shrink-0 font-mono text-[10px] font-semibold tabular-nums">
                            {formatMoney(n.costCents, currency)}
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
                        {n.hint}
                      </span>
                    </span>
                    <ChevronRight className="text-muted-foreground size-3.5 shrink-0 translate-y-1 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* İlk-bildirim slide-in'i — sağ kenardan süzülen buz camı kart. */}
      {intro && (
        <div
          role="status"
          className={cn(
            "liquid-glass fixed top-24 right-4 z-[60] w-[320px] rounded-2xl p-4 transition-[transform,opacity] duration-700 ease-[var(--ease-premium)] motion-reduce:transition-none",
            introShown
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-[130%] opacity-0",
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                DOT[intro.severity],
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{intro.title}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {intro.hint}
              </p>
              <Link
                href={intro.href}
                onClick={() => setIntroShown(false)}
                className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                {intro.actionLabel}
                <ChevronRight className="size-3" />
              </Link>
            </div>
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => setIntroShown(false)}
              className="text-muted-foreground hover:text-foreground -m-1 cursor-pointer rounded-full p-1 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
