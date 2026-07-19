"use client";

import { AmulettaMark } from "@/components/brand/amuletta-mark";
import { cn } from "@/lib/utils";

export type FrostMode = "loading" | "updating" | "syncing";

const MODE_META: Record<
  FrostMode,
  { label: string; toneClass: string }
> = {
  loading: {
    label: "Yükleniyor…",
    toneClass: "frost-tone-loading",
  },
  updating: {
    label: "Güncelleniyor…",
    toneClass: "frost-tone-updating",
  },
  syncing: {
    label: "Senkronize ediliyor…",
    toneClass: "frost-tone-syncing",
  },
};

/**
 * Tam ekran buzlu örtü + yay/halka mark motion.
 * `revealing` true iken dalgalar buzu dağıtır.
 */
export function FrostOverlay({
  mode,
  label,
  revealing = false,
  className,
}: {
  mode: FrostMode;
  label?: string;
  revealing?: boolean;
  className?: string;
}) {
  const meta = MODE_META[mode];
  const text = label ?? meta.label;

  return (
    <div
      className={cn(
        "frost-overlay",
        meta.toneClass,
        revealing && "frost-revealing",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy={!revealing}
    >
      <div className="frost-veil" aria-hidden />
      <div className="frost-waves" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="frost-center">
        <div className={cn("frost-mark", `frost-mark-${mode}`)}>
          <AmulettaMark className="size-14 sm:size-16" />
        </div>
        <p className="frost-label">{text}</p>
      </div>
    </div>
  );
}

/** RSC / loading.tsx için sabit (istemcisiz) frost iskeleti. */
export function FrostOverlayStatic({
  mode = "loading",
  label,
}: {
  mode?: FrostMode;
  label?: string;
}) {
  const meta = MODE_META[mode];
  return (
    <div
      className={cn("frost-overlay", meta.toneClass)}
      role="status"
      aria-live="polite"
      aria-busy
    >
      <div className="frost-veil" aria-hidden />
      <div className="frost-center">
        <div className={cn("frost-mark", `frost-mark-${mode}`)}>
          <AmulettaMark className="size-14 sm:size-16" />
        </div>
        <p className="frost-label">{label ?? meta.label}</p>
      </div>
    </div>
  );
}
