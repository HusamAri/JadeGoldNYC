"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";

/**
 * Panel geneli sayfa geçişi (Framer Motion). Her rota değişiminde içerik
 * yumuşakça "yükselerek" gelir; key={pathname} segment remount → geçiş oynar.
 * MotionConfig reducedMotion="user" → TÜM alt motion bileşenleri hareket
 * tercihine merkezi olarak uyar (erişilebilirlik). prefers-reduced-motion'da
 * yalnız opaklık geçişi kalır.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
