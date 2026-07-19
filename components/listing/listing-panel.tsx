"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Listing detay bölümü — kapalıyken nöromorfik kabartma + bölüm adı;
 * tıklanınca height/opacity motion ile açılır (native <details> değil).
 */
export function ListingPanel({
  n,
  name,
  tail,
  defaultOpen = false,
  children,
  className,
  id,
}: {
  /** "01", "04" … */
  n: string;
  name: string;
  tail?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const reduce = useReducedMotion();

  return (
    <div
      id={id}
      className={cn(
        "nm-raised scroll-mt-24 overflow-hidden rounded-[1.75rem] transition-[box-shadow] duration-300",
        open && "shadow-[var(--shadow-raised)]",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-4 px-6 py-5 text-left transition-colors",
          "hover:bg-[color-mix(in_oklab,var(--surface-2)_40%,transparent)]",
        )}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div aria-hidden className="idx">
            <span>Listing / {n}</span>
            <span className="idx-bar" />
            <span className="idx-ln" />
            {tail ? <span className="normal-case">{tail}</span> : null}
          </div>
          <h3 className="display-emboss text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {name}
          </h3>
        </div>
        <span
          className={cn(
            "nm-raised-sm inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            open && "text-[var(--brand)]",
          )}
          aria-hidden
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={
              reduce
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
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.22 },
                  }
            }
            className="overflow-hidden"
          >
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 4 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
              }
              className="border-border/40 space-y-4 border-t px-6 pt-4 pb-6"
            >
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
