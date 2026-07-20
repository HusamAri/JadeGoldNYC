import { Eye } from "lucide-react";

import type { ListingViewsTrend } from "@/lib/db/queries/etsy-insights";
import { ETSY_INSIGHTS_WINDOW_DAYS } from "@/lib/db/queries/etsy-insights";
import { EtsyViewsChart } from "@/components/charts/etsy-views-chart";
import { formatNumber, formatDate } from "@/lib/format";
import { formatPercent } from "@/lib/money";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

/**
 * Listing görüntülenme trendi — Etsy API günlük fotoğraflarının (ömür boyu
 * toplam) panel birikiminden türetilen GÜNLÜK fark serisi + aynı kapsanan
 * aralığın satış dönüşümü. Dürüstlük: kapsanan gerçek aralık etikette yazılır;
 * Etsy API trafik kaynağı kırılımı (sosyal/arama/direkt) VERMEZ — bu sınır
 * kartta ilan edilir, gizlenmez.
 */
export function ViewsTrendCard({ trend }: { trend: ListingViewsTrend | null }) {
  if (!trend || trend.statDays < 2) {
    return (
      <div className="nm-pressed flex flex-col items-center justify-center gap-3 rounded-[1.5rem] p-8 text-center">
        <div className="text-muted-foreground flex size-12 items-center justify-center rounded-full shadow-[var(--shadow-raised-sm)] [background-image:var(--nm-convex)]">
          <Eye className="size-6" />
        </div>
        <div>
          <p className="text-sm font-semibold">Görüntülenme serisi olgunlaşıyor</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Son {ETSY_INSIGHTS_WINDOW_DAYS} gün penceresinde{" "}
            {formatNumber(trend?.statDays ?? 0)} günlük fotoğraf var; günlük
            trend için en az 2 gün gerekir. Etsy senkronu her gün otomatik
            biriktirir.
          </p>
        </div>
      </div>
    );
  }

  const coveredLabel =
    trend.coveredFrom && trend.coveredTo
      ? `${formatDate(trend.coveredFrom)} – ${formatDate(trend.coveredTo)}`
      : "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat
          label="Görüntülenme"
          value={
            trend.viewsDelta != null ? formatNumber(trend.viewsDelta) : "—"
          }
          hint={coveredLabel}
        />
        <Stat
          label="Son 7 gün"
          value={
            trend.viewsDelta7 != null ? formatNumber(trend.viewsDelta7) : "—"
          }
          hint={trend.viewsDelta7 == null ? "fotoğraf yok" : undefined}
        />
        <Stat
          label="Net favori"
          value={
            trend.favorersDelta != null
              ? `${trend.favorersDelta > 0 ? "+" : ""}${formatNumber(trend.favorersDelta)}`
              : "—"
          }
          hint={coveredLabel}
        />
        <Stat
          label="Sipariş"
          value={formatNumber(trend.orders)}
          hint={`${formatNumber(trend.units)} adet · aynı aralık`}
        />
        <Stat
          label="Dönüşüm"
          value={
            trend.conversion != null ? formatPercent(trend.conversion) : "—"
          }
          hint="sipariş / görüntülenme artışı"
        />
      </div>

      {trend.series.length >= 2 ? (
        <EtsyViewsChart data={trend.series} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Grafik için en az 2 fark noktası (3 fotoğraf günü) gerekir — seri
          günlük senkronla uzar.
        </p>
      )}

      <p className="text-muted-foreground text-xs">
        Kaynak: Etsy API günlük listing fotoğrafları (ömür boyu toplamın panel
        birikimi) · fotoğraflar arası fark · {formatNumber(trend.statDays)}{" "}
        günlük fotoğraf. Etsy API trafik kaynağı kırılımı (sosyal medya / arama
        / direkt) vermez — kaynak dağılımı yalnız Etsy Stats ekranındadır.
      </p>
    </div>
  );
}
