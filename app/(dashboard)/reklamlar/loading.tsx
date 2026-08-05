import {
  SkeletonScreen,
  PageHeaderSkeleton,
  LoadingNote,
  KpiRowSkeleton,
  PanelSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

/**
 * Reklamlar iskeleti. Sayfa 1000+ satır ve DÖRT kademeli waterfall veri
 * çeker — iskeletsiz en uzun boş ekran buradaydı.
 * Düzen: PageHeader → API-sınırı bilgi kartı → 6 KPI (xl:6) →
 * arama-terimi tablosu (12 satır) → iki karar kartı.
 */
export default function ReklamlarLoading() {
  return (
    <SkeletonScreen>
      <PageHeaderSkeleton actions={2} />
      <LoadingNote />
      {/* Dürüstlük notu kartı (gerçek sayfada KPI'lardan önce gelir). */}
      <PanelSkeleton lines={3} title={false} />
      <KpiRowSkeleton count={6} cols={6} />
      <TableSkeleton rows={12} cols={7} />
      <div className="grid gap-5 lg:grid-cols-2">
        <PanelSkeleton lines={4} />
        <PanelSkeleton lines={4} />
      </div>
    </SkeletonScreen>
  );
}
