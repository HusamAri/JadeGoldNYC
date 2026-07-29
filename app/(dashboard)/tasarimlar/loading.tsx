import {
  SkeletonScreen,
  PageHeaderSkeleton,
  LoadingNote,
  KpiRowSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

/**
 * Listeler (tasarımlar) iskeleti. Her satırda listing kapak görseli
 * yüklendiği için ALGILANAN bekleme panelin en uzunlarındandır.
 *
 * NOT (plandan sapma, bilerek): plan burada 3x3 galeri ızgarası (
 * CardGridSkeleton) öngörüyordu; gerçek sayfa ise 4'lü KPI şeridi + 8
 * kolonlu listing TABLOSU. İskelet gerçek düzeni taklit etmek zorunda
 * olduğu için tablo geometrisi kullanıldı (aksi hâlde içerik gelince
 * ızgaradan tabloya sert sıçrama olurdu).
 * Kolonlar: Görsel · Listing · Durum · Fiyat · Varyant · Kelime · Reklam · Etsy
 */
export default function TasarimlarLoading() {
  return (
    <SkeletonScreen>
      <PageHeaderSkeleton actions={5} />
      <LoadingNote label="Listingler alınıyor…" />
      <KpiRowSkeleton count={4} cols={4} />
      <TableSkeleton rows={20} cols={8} />
    </SkeletonScreen>
  );
}
