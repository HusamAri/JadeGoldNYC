import {
  SkeletonScreen,
  PageHeaderSkeleton,
  LoadingNote,
  PanelSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

/**
 * Maliyetler iskeleti. Segment sınırı olduğu için `maliyetler/altin-maliyet`
 * alt rotası da bundan faydalanır — o sayfa ~9sn'lik DIŞ altın fiyat
 * fetch'ine seri kilitlidir ve iskeletsiz tamamen boş kalıyordu.
 * Düzen: PageHeader → editorial hero şeridi (h-[200px]) → işletme kârı
 * özeti → 15 satırlık kayıt tablosu (7 kolon) → kategori/taraf kartı.
 */
export default function MaliyetlerLoading() {
  return (
    <SkeletonScreen>
      <PageHeaderSkeleton actions={2} />
      <LoadingNote />
      <PanelSkeleton bodyHeight="h-[200px]" title={false} />
      <PanelSkeleton lines={4} />
      {/* Tarih · Açıklama · Kategori · Taraf · Tedarikçi · Tutar · İşlem */}
      <TableSkeleton rows={15} cols={7} />
      <PanelSkeleton lines={2} />
    </SkeletonScreen>
  );
}
