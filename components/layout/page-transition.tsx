"use client";

import { usePathname } from "next/navigation";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { springs } from "@/lib/motion";

/**
 * Panel geneli sayfa geçişi. Giriş-only (exit yok) — gezinme gecikmesiz.
 * Calm spring settle; reduced-motion → kısa fade.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce
            ? { duration: 0.12 }
            : springs.gentle
        }
        className="motion-chain"
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
