import { getActivePlatform } from "@/lib/platform";
import Link from "next/link";
import {
  Plus,
  MessageSquareReply,
  MessageSquareText,
  Star,
  Inbox,
  Flag,
  AlertTriangle,
} from "lucide-react";

import { listReviews, getReviewSummary } from "@/lib/db/queries/reviews";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { REVIEW_STATUSES } from "@/lib/constants";
import { formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { SceneCutouts } from "@/components/scene-cutouts";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/data-table/search-input";
import { FilterSelect } from "@/components/data-table/filter-select";
import { Pagination } from "@/components/data-table/pagination";
import { DeleteButton } from "@/components/data-table/delete-button";
import { ReviewStatusBadge } from "@/components/review-status-badge";
import { RatingStars } from "@/components/rating-stars";
import { deleteReview } from "./actions";

export const metadata = { title: "Yorumlar" };

const RATING_OPTIONS = [
  { value: "5", label: "5 yıldız" },
  { value: "4", label: "4 yıldız" },
  { value: "3", label: "3 yıldız" },
  { value: "2", label: "2 yıldız" },
  { value: "1", label: "1 yıldız" },
];

export default async function YorumlarPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const platform = await getActivePlatform();
  const sp = await searchParams;
  const status = strParam(sp.status);
  const rating = strParam(sp.rating);
  const search = strParam(sp.search);
  const offset = numParam(sp.offset);
  const limit = 25;

  const [{ rows, count }, summary] = await Promise.all([
    listReviews({ status, rating, search, limit, offset }),
    getReviewSummary(),
  ]);

  return (
    <div className="page-stack relative z-0 pb-32">
      <GoldStream motif="star" />
      <SceneCutouts page="yorumlar" />
      <PageHeader
        title="Tüketici Yorumları"
        description={`${platform.label} yorumlarını, puan trendini ve yanıt durumunu takip edin`}
        action={
          <Button asChild>
            <Link href="/yorumlar/yeni">
              <Plus />
              Yeni Yorum
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Toplam Yorum"
          value={formatNumber(summary.total)}
          icon={MessageSquareText}
        />
        <KpiCard
          label="Ortalama Puan"
          value={summary.ratedCount ? summary.avgRating.toFixed(1) : "—"}
          icon={Star}
          hint={
            summary.ratedCount
              ? `${formatNumber(summary.ratedCount)} puanlı yorum`
              : undefined
          }
          accent={summary.avgRating >= 4 ? "positive" : "default"}
        />
        <KpiCard
          label="Yanıt Bekleyen"
          value={formatNumber(summary.newCount)}
          icon={Inbox}
        />
        <KpiCard
          label="İşaretli"
          value={formatNumber(summary.flagged)}
          icon={Flag}
          accent={summary.flagged > 0 ? "negative" : "default"}
        />
        <KpiCard
          label="Yanıt Gerekli"
          value={formatNumber(summary.needsResponse)}
          icon={AlertTriangle}
          accent={summary.needsResponse > 0 ? "negative" : "default"}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Tablo/liste kabı — dikey oluklu cam (glass-fluted); yarıçapı Card'dan
          miras alır, içerik otomatik z-index:1 ile oluğun üstünde kalır. */}
      <Card className="glass-fluted">
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Alıcı, yorum metni…" />
            <FilterSelect
              paramKey="status"
              placeholder="Durum"
              options={REVIEW_STATUSES}
            />
            <FilterSelect
              paramKey="rating"
              placeholder="Puan"
              options={RATING_OPTIONS}
            />
          </div>

          {rows.length === 0 ? (
            // Aktif filtre/aramada "kayıt yok" yanıltır — filtre sonucu boş
            // olduğunu söyle ve tek tıkla temizleme yolu sun.
            search || status || rating ? (
              <EmptyState
                icon={MessageSquareText}
                title="Bu filtreyle sonuç yok"
                description="Arama, durum veya puan filtresine uyan yorum bulunamadı. Filtreyi temizleyip tüm yorumları görebilirsiniz."
                action={
                  <Button asChild variant="outline">
                    <Link href="/yorumlar">Filtreyi temizle</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={MessageSquareText}
                title="Yorum yok"
                description={`Müşteri yorumlarını elle ekleyin ya da ${platform.label} senkronizasyonu ile çekin. Puan trendini, yanıt durumunu ve işaretli yorumları buradan yönetin.`}
              />
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Puan</TableHead>
                  <TableHead>Yorum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right whitespace-nowrap">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const needsResponse =
                    r.status === "yeni" && r.rating != null && r.rating <= 3;
                  return (
                    <TableRow
                      key={r.id}
                      className={cn(
                        needsResponse && "bg-destructive/5 hover:bg-destructive/10",
                      )}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDate(r.review_date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {/* max-w bir td'de güvenilir değil — iç div ile sınırla;
                            uzun ad kırpılmaz, tek satır kalıp yatay kaydırılır. */}
                        <div
                          className="max-w-[110px] scroll-x"
                          title={r.buyer_name ?? undefined}
                        >
                          {r.buyer_name ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RatingStars rating={r.rating} />
                          {needsResponse && (
                            <Badge variant="destructive">
                              <AlertTriangle />
                              Yanıt Gerekli
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div
                          className="max-w-[260px] scroll-x xl:max-w-[420px]"
                          title={r.review_text ?? undefined}
                        >
                          {r.review_text ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {needsResponse ? (
                          <span className="jg-neon inline-flex items-center rounded-full border border-red-500/70 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                            Yeni
                          </span>
                        ) : (
                          <ReviewStatusBadge status={r.status} />
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className={cn(
                              needsResponse
                                ? "jg-neon border-red-500/70 text-red-600 hover:text-red-600 dark:text-red-400"
                                : "border-transparent",
                            )}
                          >
                            <Link href={`/yorumlar/${r.id}/duzenle`}>
                              <MessageSquareReply className="size-4" />
                              Yanıtla
                            </Link>
                          </Button>
                          <DeleteButton action={deleteReview} id={r.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <Pagination count={count} limit={limit} offset={offset} />
        </CardContent>
      </Card>
    </div>
  );
}
