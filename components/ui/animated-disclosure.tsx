"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimatedDisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  panelClassName?: string;
  /** Soft amber pulse when closed so the control reads as expandable. */
  hintClosed?: boolean;
  /**
   * `height` — klasik yükseklik açılımı (SectionGuide).
   * `rise` — kısa opacity + y (no blur — filter blur feels digital/janky).
   */
  motion?: "height" | "rise";
};

export function AnimatedDisclosure({
  summary,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  panelClassName,
  hintClosed = true,
  motion: motionMode = "height",
}: AnimatedDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const rise = motionMode === "rise";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-[color-mix(in_oklab,var(--border)_72%,transparent)] bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] shadow-[0_10px_28px_-20px_rgba(28,25,23,0.45)] transition-[border-color,box-shadow] duration-300",
        open
          ? "border-[color-mix(in_oklab,var(--brand)_28%,var(--border))] shadow-[0_16px_36px_-22px_rgba(28,25,23,0.42)]"
          : hintClosed
            ? "disclosure-hint-closed"
            : null,
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--surface-2)_55%,transparent)]",
          summaryClassName,
        )}
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--border)_70%,transparent)] bg-[color-mix(in_oklab,var(--surface)_92%,white)] text-[var(--ink-3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition-colors",
            open && "border-[color-mix(in_oklab,var(--brand)_35%,var(--border))] text-[var(--brand)]",
            !open && hintClosed && "disclosure-chevron-bob",
          )}
          aria-hidden
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 28 }
            }
            className="inline-flex"
          >
            <ChevronDown className="size-4" strokeWidth={2.25} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={
              reduceMotion
                ? { height: "auto", opacity: 1 }
                : rise
                  ? { height: 0, opacity: 0 }
                  : { height: 0, opacity: 0 }
            }
            animate={{ height: "auto", opacity: 1 }}
            exit={
              reduceMotion
                ? { height: "auto", opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.2 },
                  }
            }
            className="overflow-hidden border-t border-[color-mix(in_oklab,var(--border)_55%,transparent)]"
          >
            <motion.div
              initial={
                reduceMotion || !rise ? false : { opacity: 0, y: 6 }
              }
              animate={
                reduceMotion || !rise
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, y: 0 }
              }
              exit={
                reduceMotion || !rise
                  ? undefined
                  : { opacity: 0, y: 4 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : rise
                    ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                    : { duration: 0 }
              }
              className={cn("px-4 py-3.5", panelClassName)}
            >
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
