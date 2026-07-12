import * as React from "react";

import { cn } from "@/lib/utils";
import { BrandTile } from "@/components/brand/brand-tile";

export function PageHeader({
  title,
  description,
  action,
  image,
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Bölüm başına marka fotoğrafı şeridi (opsiyonel, estetik). */
  image?: string;
  /** Şerit üzerindeki küçük altın etiket (verilmezse başlık kullanılır). */
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 space-y-4", className)}>
      {image && (
        <BrandTile
          src={image}
          rounded={false}
          scrim
          className="h-24 rounded-[1.5rem] shadow-[var(--shadow-raised)] md:h-28"
        >
          <div className="relative flex h-full items-end p-5">
            <span className="font-mono text-[11px] font-medium tracking-[0.28em] text-[oklch(0.87_0.09_85)] uppercase">
              {eyebrow ?? title}
            </span>
          </div>
        </BrandTile>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {/* Kahraman başlık — display serif (editorial dil). */}
          <h2 className="text-2xl font-semibold tracking-tight [font-family:var(--font-display)]">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {/* Editorial index kuralı — kısa primary vurgu çizgisi + uzayan ince hairline
          (.idx-bar / .idx-ln dili; dekoratif, metinsiz). */}
      <div aria-hidden className="flex items-center gap-3">
        <span className="bg-primary h-px w-9" />
        <span className="bg-border h-px flex-1" />
      </div>
    </div>
  );
}
