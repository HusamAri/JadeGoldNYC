import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { NEW_WHATS_NEW } from "@/lib/whats-new";
import { NewStar } from "@/components/whats-new-badge";

/**
 * Sidebar'ın en altında KALICI "Neler Yeni" özeti — nav listesinin altında hep
 * görünür. Son büyük yenilikleri NEW yıldız rozetiyle listeler; "Tümü" ile
 * /yenilikler sayfasına (iki bölümlü tam günlük) götürür.
 */
export function WhatsNewNav() {
  return (
    <div className="border-sidebar-border/60 mt-1 border-t px-4 pt-4 pb-6">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        {/* Editorial bölüm etiketi (.idx) — mono, letterspaced, kısa vurgu çizgisi. */}
        <span className="idx gap-2 font-medium text-[color:var(--gold-deep)]">
          <span aria-hidden className="idx-bar w-4" />
          Neler Yeni
        </span>
        <Link
          href="/yenilikler"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-[0.7rem] font-medium transition-colors duration-300"
        >
          Tümü
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {/* Neumorfik girinti oluk — kayıtlar oluğun içinde, hover'da kabarır.
          Koyuda derin panele oyulmuş lume çukuru (--lume-pit, #171922). */}
      <ul className="nm-pressed space-y-1 rounded-2xl p-1.5 dark:bg-[#171922] dark:[background-image:none] dark:[box-shadow:var(--lume-pit)]">
        {NEW_WHATS_NEW.map((e) => (
          <li key={e.id}>
            <Link
              href={e.href ?? "/yenilikler"}
              className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-[box-shadow,background-image] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:[background-image:var(--nm-convex)] hover:[box-shadow:var(--shadow-raised-sm)]"
            >
              <NewStar withLabel={false} className="px-1.5" />
              <span className="text-sidebar-foreground/85 group-hover:text-foreground min-w-0 flex-1 truncate text-xs font-medium">
                {e.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
