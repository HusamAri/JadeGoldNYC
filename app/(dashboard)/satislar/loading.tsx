import {
  SkeletonScreen,
  PageHeaderSkeleton,
  LoadingNote,
  KpiRowSkeleton,
  PanelSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

/**
 * Satışlar iskeleti — gerçek sayfanın düzeni birebir:
 * PageHeader → 6 KPI (grid-cols-2 / md:3) → iki grafik kartı (lg:2) →
 * 25 satırlık tablo (6 kolon). Liste `limit = 25` SABİT olduğu için satır
 * sayısı birebir eşleşir → sayfa gelince sıfır layout kayması.
 */
export default function SatislarLoading() {
  return (
    <SkeletonScreen>
      <PageHeaderSkeleton actions={2} />
      <LoadingNote />
      <KpiRowSkeleton count={6} cols={3} />
      <div className="grid gap-5 lg:grid-cols-2">
        <PanelSkeleton bodyHeight="h-[220px]" />
        <PanelSkeleton bodyHeight="h-[220px]" />
      </div>
      {/* Tarih · Sipariş No · Alıcı · Durum · Genel Toplam · İşlem = 6 kolon */}
      <TableSkeleton rows={25} cols={6} />
    </SkeletonScreen>
  );
}
