"use client";

import { Info } from "lucide-react";

import { AnimatedDisclosure } from "@/components/ui/animated-disclosure";
import { cn } from "@/lib/utils";

/**
 * Veri girişi yapılan bölümlerde bağlamsal kullanım kılavuzu — katlanabilir,
 * animasyonlu aç/kapa, erişilebilir. Başlığa tıklayınca açılır; adımları /
 * ipuçlarını `children` olarak verin.
 */
export function SectionGuide({
  title = "Nasıl kullanılır?",
  children,
  defaultOpen = false,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <AnimatedDisclosure
      defaultOpen={defaultOpen}
      className={cn("nm-pressed", className)}
      summaryClassName="text-sm font-medium"
      panelClassName="text-muted-foreground space-y-2 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_b]:text-foreground [&_b]:font-medium [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
      summary={
        <span className="flex items-center gap-2">
          <Info className="text-primary size-4 shrink-0" />
          <span>{title}</span>
        </span>
      }
    >
      {children}
    </AnimatedDisclosure>
  );
}
