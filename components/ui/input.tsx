import * as React from "react";

import { cn } from "@/lib/utils";

// Not: `<input>` bir "replaced element" olduğundan `::after` üretilen içerik
// tüm tarayıcılarda güvenilir render edilmez. Odakta/hover'da IMG_5665'teki
// gibi altından yükselen sıcak parıltı isteyen çağıranlar, Input'u
// `<div className="jg-glow-warm relative">` ile sarmalı (bkz. SearchInput).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // NOT: `disabled:pointer-events-none` KALDIRILDI — aynı satırdaki
        // `disabled:cursor-not-allowed`ı ölü koda çeviriyordu (imleç hiç
        // değişmiyordu, alan sessizce "tepkisiz" oluyordu). Textarea zaten
        // doğru davranıyordu; ikisi artık aynı dili konuşuyor.
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground nm-pressed bg-background flex h-10 w-full min-w-0 rounded-full px-4 py-1 text-base transition-[color,background-color,box-shadow] duration-300 ease-[var(--ease-premium)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Hover: çukur KORUNUR (--shadow-pressed yerinde), yalnız kenara ince
        // bir ışık halkası düşer + zemin bir tık koyulaşır — alan "yazılabilir"
        // olduğunu söyler. Odak kuralı bundan sonra geldiği için odakta ezilir.
        "hover:bg-accent/20 hover:shadow-[var(--shadow-pressed),inset_0_0_0_1px_color-mix(in_srgb,var(--ring)_18%,transparent)]",
        "dark:hover:[background-color:oklch(0_0_0/0.45)] dark:hover:shadow-[var(--lume-pit),inset_0_0_0_1px_rgb(255_255_255/0.08)]",
        // Koyu: lume çukur kuyu (Liquid_Dark .slider track birebir) —
        // oklch(0 0 0/0.35) zemin + var(--lume-pit) iç gölge.
        // `color-scheme: dark`: native widget'lar (date takvim ikonu, time
        // spinner) koyu zeminde görünür kalır — siyah-üstüne-siyah olmaz.
        "dark:[background-image:none] dark:[background-color:oklch(0_0_0/0.35)] dark:shadow-[var(--lume-pit)] dark:[color-scheme:dark]",
        // Odak: çukur korunur + accent halka + köşeden çukura vuran holo ışık.
        // Halka kalınlığı sistem diliyle hizalandı (--focus-ring / Button:
        // 3px, ring/60) — panelde tek bir odak dili konuşulur.
        "focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:shadow-[var(--shadow-pressed),inset_6px_-6px_14px_-4px_var(--pit-glow),inset_11px_-11px_28px_-10px_var(--pit-glow)]",
        "dark:focus-visible:shadow-[var(--lume-pit),inset_6px_-6px_14px_-4px_var(--pit-glow)]",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
