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
    <div className="border-sidebar-border/60 mt-1 border-t p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold tracking-[0.16em] text-[color:var(--gold-deep)] uppercase">
          Neler Yeni
        </span>
        <Link
          href="/yenilikler"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-[0.7rem] font-medium"
        >
          Tümü
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <ul className="space-y-1">
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
