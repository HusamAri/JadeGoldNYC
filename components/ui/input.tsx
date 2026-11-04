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
        // V7: düz alan — sis zemini, hairline kenar, 10px köşe; odakta asit
        // mürekkep halka. Çukur/cam yok.
        "file:text-foreground placeholder:text-muted-foreground selection:bg-neon selection:text-foreground bg-background flex h-10 w-full min-w-0 rounded-[10px] border border-[color:var(--hairline)] px-3.5 py-1 text-base transition-[border-color,box-shadow] duration-200 ease-[var(--ease-quiet)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-[color:var(--ink-2)]",
        "focus-visible:border-[color:var(--neon-ink)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--neon)]/40",
        "dark:[color-scheme:dark]",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
