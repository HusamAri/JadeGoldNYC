import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Kazınmış oluk placeholder — içi hafif accent yıkamalı çukur; koyuda
        // lume çukuru. Nabız yalnız opacity anime eder (compositor dostu).
        "bg-accent/60 animate-pulse rounded-lg shadow-[var(--shadow-pressed)] dark:bg-white/[0.05] dark:shadow-[var(--lume-pit)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
