import Link from "next/link";
import { ClipboardList, ChevronRight, CircleCheck } from "lucide-react";

import type { DataGap } from "@/lib/db/queries/data-gaps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * "Eksik Bilgi" paneli — analizleri etkileyen eksik verileri gruplayıp
 * doldurma linkiyle gösterir. Eksik yoksa kısa bir "tamam" durumu.
 */
export function DataGapsCard({ gaps }: { gaps: DataGap[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <ClipboardList className="text-muted-foreground size-4" />
        <CardTitle className="text-base">Eksik Bilgi</CardTitle>
        {gaps.length > 0 && (
          <span className="bg-amber-500/15 ml-auto rounded-full px-2 py-0.5 text-xs font-semibold text-amber-600 tabular-nums">
            {gaps.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
            <CircleCheck className="size-4 text-emerald-600" />
            Analizleri etkileyen eksik veri yok — her şey tamam.
          </p>
        ) : (
          <ul className="divide-y">
            {gaps.map((g) => (
              <li key={g.key}>
                <Link
                  href={g.href}
                  className="group hover:bg-secondary/40 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors"
                >
                  <span
                    className={cn(
                      "mt-0.5 size-2 shrink-0 rounded-full",
                      g.tone === "warn" ? "bg-amber-500" : "bg-sky-500",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{g.title}</span>
                    <span className="text-muted-foreground block text-xs">
                      {g.hint}
                    </span>
                  </span>
                  <span className="text-muted-foreground group-hover:text-foreground flex shrink-0 items-center gap-0.5 text-xs font-medium">
                    {g.actionLabel}
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
