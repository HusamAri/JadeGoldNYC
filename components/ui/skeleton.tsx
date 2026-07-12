import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Kazınmış oluk placeholder — içi hafif accent yıkamalı çukur (nöromorfik
        // zemin bandı dili); nabız animasyonu korunur.
        "bg-accent/60 animate-pulse rounded-lg shadow-[var(--shadow-pressed)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
