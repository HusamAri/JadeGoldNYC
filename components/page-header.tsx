import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * V7 editoryal başlık: kicker (asit nokta + mono etiket), Fraunces 300 H1
 * (son kelime italik), lede, sağda aksiyonlar; altta mürekkep çizgisi.
 * `kicker` verilmezse eyebrow/başlık kullanılır. `meta` kicker'ın devamına
 * yazılır (ör. "veri 04.11 11:42'ye kadar").
 */
export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  meta,
  secondary,
  className,
  size = "lg",
}: {
  title: string;
  description?: string;
  /** Birincil aksiyon(lar) — sağ üst, CTA hap. */
  action?: React.ReactNode;
  /** Kicker metni (bölüm adı). */
  eyebrow?: string;
  /** Kicker'a eklenen tazelik/bağlam notu. */
  meta?: string;
  /** CTA'nın altında mono hayalet linkler. */
  secondary?: React.ReactNode;
  className?: string;
  /** lg = sayfa başı (72px), md = alt sayfa (44px). */
  size?: "lg" | "md";
  /** Geriye uyum — V7'de görsel şerit kullanılmaz. */
  image?: string;
}) {
  const words = title.trim().split(" ");
  const last = words[words.length - 1];
  const head = words.slice(0, -1).join(" ");

  return (
    <header
      className={cn(
        "grid gap-6 border-b border-[color:var(--foreground)] pb-5 md:grid-cols-[1fr_auto] md:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3.5">
          <span aria-hidden className="bg-neon size-[7px] rounded-full" />
          <span className="mono-label">
            {eyebrow ?? title}
            {meta ? ` · ${meta}` : ""}
          </span>
        </div>
        <h1
          className={cn(
            "h-display mt-3.5 text-balance",
            size === "lg"
              ? "text-[44px] sm:text-[56px] lg:text-[72px]"
              : "text-[32px] sm:text-[40px] lg:text-[44px]",
          )}
        >
          {head ? (
            <>
              {head} <em>{last}</em>
            </>
          ) : (
            title
          )}
        </h1>
        {description && (
          <p className="text-ink-2 mt-3.5 max-w-[48ch] text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {(action || secondary) && (
        <div className="flex flex-col items-start gap-2.5 md:items-end">
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
          {secondary && (
            <div className="mono-label flex flex-wrap items-center gap-x-2">{secondary}</div>
          )}
        </div>
      )}
    </header>
  );
}
