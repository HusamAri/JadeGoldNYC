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
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground nm-pressed bg-background flex h-10 w-full min-w-0 rounded-full px-4 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-ring/60 focus-visible:ring-2",
        "aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
