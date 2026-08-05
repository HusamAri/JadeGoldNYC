import {
  SkeletonScreen,
  PageHeaderSkeleton,
  LoadingNote,
  KpiRowSkeleton,
  PanelSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

/**
 * Analizler iskeleti. Segment iskeleti olduğu için TÜM alt rotaları da
 * kapsar (/analizler/tani, /urunler, /aksiyon-plani …) — `tani` çıplak
 * `await getSalesDiagnostics()` ile en yavaş yüzeydir, en çok o kazanır.
 * Düzen: PageHeader → uyarı boardu → 6 metrik kart (xl:6) → iki grafik
 * alanı (lg:2) → dönem geçmişi tablosu.
 */
export default function AnalizlerLoading() {
  return (
    <SkeletonScreen>
      <PageHeaderSkeleton actions={3} />
      <LoadingNote label="Analiz hesaplanıyor…" />
      <PanelSkeleton lines={3} />
      <KpiRowSkeleton count={6} cols={6} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelSkeleton bodyHeight="h-[240px]" />
        <PanelSkeleton bodyHeight="h-[240px]" />
      </div>
      <TableSkeleton rows={10} cols={5} toolbar={false} />
    </SkeletonScreen>
  );
}
