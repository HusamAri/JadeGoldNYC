import Link from "next/link";
import { Scale, ChevronRight, CircleCheck } from "lucide-react";

import type { MarketPriceAlert } from "@/lib/db/queries/market-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function perGram(cents: number | null): string {
  return cents == null ? "—" : `$${(cents / 100).toFixed(0)}/g`;
}

/**
 * "Pazar Fiyat Uyarıları" paneli — günlük pazar araştırmasında rakip bandının
 * DIŞINDA kalan aktif listingler. Pahalı kalan (satışı frenler) kırmızı,
 * çok ucuz kalan (kâr bırakır / kalitesiz algısı) mavi işaretlenir.
 * Veri yoksa kısa bir "tamam" durumu gösterilir.
 */
export function MarketPriceAlertsCard({
  alerts,
}: {
  alerts: MarketPriceAlert[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Scale className="text-muted-foreground size-4" />
        <CardTitle className="text-base">Pazar Fiyat Uyarıları</CardTitle>
        {alerts.length > 0 && (
          <span className="bg-red-500/15 ml-auto rounded-full px-2 py-0.5 font-mono text-xs font-semibold text-red-600 tabular-nums shadow-[var(--shadow-raised-sm)]">
            {alerts.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
            <CircleCheck className="size-4 text-emerald-600" />
            Bant dışı fiyat yok — listingler pazar aralığında.
          </p>
        ) : (
          <ul className="divide-y">
            {alerts.map((a) => (
              <li key={a.product_id}>
                <Link
                  href={`/analizler/urunler/${a.product_id}/duzenle`}
                  className="group hover:bg-secondary/40 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors"
                >
                  <span
                    className={cn(
                      "mt-0.5 size-2 shrink-0 rounded-full",
                      a.price_position === "pahali"
                        ? "bg-red-500"
                        : "bg-sky-500",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {a.title}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      Biz {perGram(a.our_per_gram_cents)} · pazar{" "}
                      {perGram(a.market_low_per_gram_cents)}–
                      {perGram(a.market_high_per_gram_cents)}
                      {a.deviation_pct != null && (
                        <>
                          {" "}
                          ·{" "}
                          {a.price_position === "pahali"
                            ? `%${Math.round(a.deviation_pct * 100)} pahalı`
                            : `%${Math.round(a.deviation_pct * 100)} ucuz`}
                        </>
                      )}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      a.price_position === "pahali"
                        ? "bg-red-500/15 text-red-600"
                        : "bg-sky-500/15 text-sky-600",
                    )}
                  >
                    {a.price_position === "pahali" ? "Pahalı" : "Çok ucuz"}
                  </span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
