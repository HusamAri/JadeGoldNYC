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
  // Görsel <em> vurgusu — DOM metni AYNEN kalır; yalnız son kelime italik
  // serif mürekkebe sarılır (ref: Spatial .section-h h2 em / Lume .lsec h2 em).
  const words = title.trim().split(" ");
  const last = words[words.length - 1];
  const head = words.slice(0, -1).join(" ");

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
      {/* Editorial index satırı — bölüm adı + kısa primary vurgu + uzayan
          ince hairline (ref: .lsec .lhead — k + bar 34px + ln flex:1). */}
      <div aria-hidden className="idx">
        <span>{eyebrow ?? title}</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {/* Kahraman başlık — editorial serif; koyuda yüzeyden kabarır
              (display-emboss), em koyuda luminous periwinkle'a döner. */}
          <h2 className="h-serif display-emboss text-3xl md:text-4xl">
            {head ? (
              <>
                {head} <em>{last}</em>
              </>
            ) : (
              title
            )}
          </h2>
          {description && (
            <p className="text-engraved text-muted-foreground max-w-[60ch] text-sm">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
