"use client";

import type { ReactNode } from "react";
import { AnimatedDisclosure } from "@/components/ui/animated-disclosure";
import { cn } from "@/lib/utils";

/**
 * Rakip paneli bölümü — başlık tetikleyici, alttan kabararak açılır.
 * "Ayrıntılar" etiketi yok; bölüm adı kendisi kontrol.
 */
export function CompetitorSection({
  title,
  meta,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatedDisclosure
      motion="rise"
      defaultOpen={defaultOpen}
      hintClosed
      className={cn("nm-pressed rounded-2xl border-0", className)}
      summaryClassName="px-3 py-2.5"
      panelClassName="space-y-1 px-2 pt-1 pb-2.5"
      summary={
        <span className="flex min-w-0 flex-wrap items-baseline gap-2">
          <span className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            {title}
          </span>
          {meta != null && (
            <span className="text-muted-foreground font-mono text-[10px] tabular-nums normal-case">
              {meta}
            </span>
          )}
        </span>
      }
    >
      {children}
    </AnimatedDisclosure>
  );
}
