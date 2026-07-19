"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kompakt rakip ürün satırı — kapak + başlık/mağaza + fiyat + aksiyonlar.
 * Kart değil; yatay satır (~48–56px).
 */
export function CompetitorProductRow({
  imageUrl,
  title,
  href,
  shop,
  rank,
  colorDot,
  price,
  meta,
  actions,
  className,
}: {
  imageUrl?: string | null;
  title: string;
  href?: string | null;
  shop?: string | null;
  /** Organik sıra (01…). */
  rank?: number | null;
  /** Rakip seti renk noktası. */
  colorDot?: string | null;
  price: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const initials = (shop ?? title)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "·";

  return (
    <li
      className={cn(
        "group flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors duration-300 ease-[var(--ease-premium)] hover:bg-[color-mix(in_oklab,var(--surface-2)_45%,transparent)]",
        className,
      )}
    >
      <div
        className="nm-pressed relative size-10 shrink-0 overflow-hidden rounded-lg"
        style={
          colorDot
            ? { boxShadow: `inset 0 0 0 1.5px ${colorDot}` }
            : undefined
        }
      >
        {imageUrl ? (
          // Etsy CDN — next/image remotePatterns dışında; düz img güvenli.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            aria-hidden
            className="text-muted-foreground flex size-full items-center justify-center font-mono text-[10px] tracking-wider"
          >
            {initials}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-1.5">
          {rank != null && (
            <span className="text-muted-foreground shrink-0 font-mono text-[10px] tabular-nums">
              {String(rank).padStart(2, "0")}
            </span>
          )}
          {colorDot && rank == null && (
            <span
              aria-hidden
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorDot }}
            />
          )}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary min-w-0 truncate text-sm hover:underline"
            >
              {title}
            </a>
          ) : (
            <span className="min-w-0 truncate text-sm">{title}</span>
          )}
        </div>
        {shop && (
          <span className="text-muted-foreground block truncate text-xs">
            {shop}
          </span>
        )}
        {meta}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="font-mono text-sm font-semibold tabular-nums">
          {price}
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
      )}
    </li>
  );
}
