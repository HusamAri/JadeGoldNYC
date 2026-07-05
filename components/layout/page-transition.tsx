"use client";

import { usePathname } from "next/navigation";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";

/**
 * Panel geneli sayfa geçişi (Framer Motion). Her rota değişiminde içerik
 * yumuşakça "yükselerek" gelir; key={pathname} segment remount → giriş oynar.
 *
 * GİRİŞ-ONLY (exit yok): eski içerik anında değişir, yenisi animasyonla gelir —
 * böylece gezinmeye gecikme eklenmez. (AnimatePresence mode="wait" çıkışı
 * beklettiği için ~320ms gecikme yaratıyordu; App Router'da exit zaten güvenilir
 * çalışmaz.) MotionConfig reducedMotion="user" → tüm alt motion bileşenleri
 * hareket tercihine merkezi olarak uyar.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
