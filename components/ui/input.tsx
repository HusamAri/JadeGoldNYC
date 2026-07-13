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
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground nm-pressed bg-background flex h-10 w-full min-w-0 rounded-full px-4 py-1 text-base transition-[color,box-shadow] duration-300 ease-[var(--ease-premium)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Koyu: lume çukur kuyu (Liquid_Dark .slider track birebir) —
        // oklch(0 0 0/0.35) zemin + var(--lume-pit) iç gölge.
        // `color-scheme: dark`: native widget'lar (date takvim ikonu, time
        // spinner) koyu zeminde görünür kalır — siyah-üstüne-siyah olmaz.
        "dark:[background-image:none] dark:[background-color:oklch(0_0_0/0.35)] dark:shadow-[var(--lume-pit)] dark:[color-scheme:dark]",
        // Odak: çukur korunur + accent halka + köşeden çukura vuran holo ışık.
        "focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:shadow-[var(--shadow-pressed),inset_6px_-6px_14px_-4px_var(--pit-glow),inset_11px_-11px_28px_-10px_var(--pit-glow)]",
        "dark:focus-visible:shadow-[var(--lume-pit),inset_6px_-6px_14px_-4px_var(--pit-glow)]",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
