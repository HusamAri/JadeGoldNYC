"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { WHATS_NEW, LATEST_WHATS_NEW_ID } from "@/lib/whats-new";
import { formatDate } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "jg_whats_new_seen";
const SERVER_SNAPSHOT = " server"; // SSR/hydration nöbeti (vurgu titremesini önler)

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readSeen(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}
function writeSeen(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* yoksay */
  }
  listeners.forEach((l) => l());
}

// Arka plandaki altın tozu (sabit dağılım — Math.random gerektirmez).
const DUST = [
  { x: "12%", y: "22%", s: 5, b: 1, d: "0s" },
  { x: "30%", y: "68%", s: 3, b: 0.5, d: "0.6s" },
  { x: "18%", y: "84%", s: 6, b: 1.5, d: "1.2s" },
  { x: "48%", y: "16%", s: 4, b: 1, d: "0.3s" },
  { x: "62%", y: "78%", s: 5, b: 1.5, d: "1.8s" },
  { x: "8%", y: "52%", s: 3, b: 0.5, d: "2.1s" },
  { x: "72%", y: "40%", s: 4, b: 1, d: "0.9s" },
  { x: "40%", y: "44%", s: 2, b: 0.5, d: "1.5s" },
  { x: "24%", y: "36%", s: 3, b: 1, d: "2.4s" },
  { x: "56%", y: "60%", s: 4, b: 1, d: "1.1s" },
];

/**
 * Panel açılışında görünen "Neler Yeni" POPUP'ı. Hafif sarı (altın) tonlu
 * buzlu cam (frosted) kart; arkasında yanıp sönen altın tozu; her kayıtta
 * ikon; sağ ÜST köşeden asılı duran som altın zincir cutout'u — doğal
 * gölgesiyle. Okunmamış kayıt varsa açılır, "Okudum"/kapatınca bir daha açmaz.
 */
export function WhatsNew() {
  const raw = useSyncExternalStore(subscribe, readSeen, () => SERVER_SNAPSHOT);

  if (WHATS_NEW.length === 0) return null;

  const mounted = raw !== SERVER_SNAPSHOT;
  const seenId = mounted ? raw : "";
  const seenIndex = seenId ? WHATS_NEW.findIndex((e) => e.id === seenId) : -1;
  const unseenCount = seenIndex === -1 ? WHATS_NEW.length : seenIndex;
  const open = mounted && unseenCount > 0;
  const entries = WHATS_NEW.slice(0, Math.max(unseenCount, 1));

  function dismiss() {
    writeSeen(LATEST_WHATS_NEW_ID);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent
        showCloseButton={false}
        className="jg-glass-3d sheen-sweep border-[color:var(--glass-border)] bg-[color:var(--popover)]/90 overflow-hidden rounded-[1.9rem] p-0 backdrop-blur-2xl sm:max-w-[560px]"
      >
        {/* arka plan altın tozu */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[1.9rem]"
        >
          {DUST.map((d, i) => (
            <span
              key={i}
              className="jg-twinkle absolute rounded-full bg-[color:var(--gold)] dark:shadow-[0_0_14px_var(--gold)]"
              style={{
                left: d.x,
                top: d.y,
                width: d.s,
                height: d.s,
                filter: `blur(${d.b}px)`,
                animationDelay: d.d,
              }}
            />
          ))}
        </div>

        {/* Sağ üst köşeye asılı som altın zincir. Kart overflow-hidden olduğu
            için zincirin üst/sağ ucu ÇERÇEVEYE kesilir → havada durmaz,
            gerçekten köşeye asılmış/dökülmüş gibi durur. */}
        <Image
          src="/brand/cutout/gold-chains.webp"
          alt=""
          aria-hidden
          width={560}
          height={510}
          priority
          className="brand-jg pointer-events-none absolute -top-10 -right-6 z-20 hidden w-[196px] rotate-[15deg] select-none drop-shadow-[0_14px_20px_rgba(35,38,60,0.4)] sm:block"
        />

        <div className="relative z-10 p-7 sm:pr-52">
          {/* Editorial eyebrow (.idx) — mono, letterspaced, kısa vurgu çizgisi. */}
          <span className="idx gap-2.5 font-medium tracking-[0.28em] text-[color:var(--gold-deep)]">
            <span aria-hidden className="idx-bar w-6" />
            Yenilikler
          </span>
          <div className="mt-1.5 flex items-center gap-2.5">
            <DialogTitle className="text-2xl leading-none font-normal [font-family:var(--font-display)]">
              Neler{" "}
              <em className="text-primary italic">Yeni</em>
            </DialogTitle>
            <span className="rounded-full bg-[color:var(--gold)]/18 px-2 py-0.5 font-mono text-xs font-semibold text-[color:var(--gold-deep)] tabular-nums">
              {unseenCount} yeni
            </span>
          </div>
          <DialogDescription className="mt-1.5 max-w-sm">
            Panele eklenen son özellikler — kaçırmayın.
          </DialogDescription>

          <ul className="mt-5 max-h-[46vh] space-y-4 overflow-y-auto pr-1">
            {entries.map((e) => {
              const Icon = e.icon;
              return (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold-deep)] shadow-[var(--glass-highlight)] ring-1 ring-[color:var(--gold)]/20">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">{e.title}</span>
                      <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums whitespace-nowrap">
                        {formatDate(e.date)}
                      </span>
                      {e.href && (
                        <Link
                          href={e.href}
                          onClick={dismiss}
                          className="text-primary ml-auto inline-flex shrink-0 items-center gap-0.5 text-xs font-medium hover:underline"
                        >
                          Aç <ArrowUpRight className="size-3" />
                        </Link>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {e.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex justify-start">
            <Button type="button" onClick={dismiss}>
              Okudum
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
