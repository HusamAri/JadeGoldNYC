"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Filtre çipi: aktifken kalıcı dolu, pasifken hover/basınçta yandan
 * kayarak dolan akışkan geçiş (transform: scaleX — GPU dostu).
 */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative isolate rounded-full px-3 py-1 text-xs font-medium transition-colors duration-300",
        active
          ? "text-accent-foreground shadow-[var(--shadow-raised-sm)]"
          : "text-muted-foreground hover:text-accent-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 origin-left overflow-hidden rounded-full bg-accent transition-transform ease-[var(--ease-premium)]",
          active
            ? "scale-x-100 duration-300"
            : "scale-x-0 duration-500 group-hover:scale-x-100 group-active:scale-x-100 group-active:duration-150",
        )}
      />
      {children}
    </button>
  );
}

/**
 * Tek seferlik aksiyon düğmesi (Geri/İleri, devir vb.) — hover'da yönlü
 * dolum, basınca hızlanır. `direction` dolumun başladığı kenarı belirler.
 */
export function SlideButton({
  onClick,
  disabled,
  direction = "left",
  className,
  children,
  type = "button",
}: {
  onClick?: () => void;
  disabled?: boolean;
  direction?: "left" | "right";
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative isolate flex items-center gap-1 overflow-hidden rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-300 hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 scale-x-0 bg-accent/85 transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-x-100 group-active:scale-x-100 group-active:duration-150",
          direction === "left" ? "origin-left" : "origin-right",
        )}
      />
      <span className="relative flex items-center gap-1">{children}</span>
    </button>
  );
}
