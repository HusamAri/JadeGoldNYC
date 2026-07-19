"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion";

/**
 * Click/hover reaction wrapper — soft scale settle (physical press into surface).
 * Prefer for non-button interactive tiles; buttons already have CSS active scale.
 */
export function Pressable({
  className,
  firm = false,
  children,
}: {
  className?: string;
  firm?: boolean;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: firm ? 0.975 : 0.985, y: 0 }}
      transition={springs.snappy}
    >
      {children}
    </motion.div>
  );
}
