"use client";

import { usePathname } from "next/navigation";

/**
 * Her rota değişiminde içeriği yumuşakça "yükselterek" getirir.
 * key={pathname} → segment remount → animasyon yeniden oynar.
 * prefers-reduced-motion'da animasyon süresi sıfırlanır (globals.css).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-rise">
      {children}
    </div>
  );
}
