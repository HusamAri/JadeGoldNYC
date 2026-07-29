import {
  SkeletonScreen,
  PageHeaderSkeleton,
  LoadingNote,
  KpiRowSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

/**
 * Panel geneli route geçişi — JENERİK bölgesel iskelet.
 *
 * ÖNCEKİ HÂLİ: tam-viewport buzlu örtü (FrostOverlayStatic). Örtü `fixed
 * inset:0` olduğu için sidebar/topbar da kilitleniyordu → her route
 * değişiminde uygulama "dondu" gibi okunuyordu. Frost artık YALNIZ
 * kullanıcı-tetikli uzun işlerde (senkron/push) kullanılır.
 *
 * ŞİMDİ: iskelet `main` içinde kalır (bu dosya layout'un children yuvasına
 * düşer) → sidebar ve topbar CANLI ve TIKLANABİLİR kalır; kullanıcı beklerken
 * başka bir bölüme geçebilir. Bütçe md.8: blur/backdrop yok, fixed yok,
 * pointer-events kapatan örtü yok.
 */
export default function DashboardLoading() {
  return (
    <SkeletonScreen>
      <PageHeaderSkeleton />
      {/* Hareket sönümlense bile okunan geri bildirim (bütçe md.9). */}
      <LoadingNote />
      <KpiRowSkeleton count={4} />
      <TableSkeleton rows={8} cols={5} />
    </SkeletonScreen>
  );
}
