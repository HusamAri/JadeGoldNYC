import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Inset oluk (nm-pressed) — Input ile aynı çukur dili, köşeler yumuşak.
        "nm-pressed bg-background placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex field-sizing-content min-h-16 w-full rounded-xl px-4 py-2.5 text-base transition-[color,box-shadow] duration-300 ease-[var(--ease-premium)] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Odak: çukur korunur + köşeden çukura vuran holo ışık (pit-glow, mevcut dil).
        "focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:shadow-[var(--shadow-pressed),inset_6px_-6px_14px_-4px_var(--pit-glow),inset_11px_-11px_28px_-10px_var(--pit-glow)]",
        "aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
