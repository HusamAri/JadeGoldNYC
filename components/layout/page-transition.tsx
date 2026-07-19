"use client";

import { usePathname } from "next/navigation";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";

/**
 * Page enter — opacity only (optional 4px rise). No chain stagger on children:
 * dense dashboards feel broken when every block choreographs on route change.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[1480px]"
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
