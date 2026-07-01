import Link from "next/link";
import {
  Plus,
  Pencil,
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
    <div className="space-y-6">
      <PageHeader
        title="Tüketici Yorumları"
        description="Etsy yorumlarını, puan trendini ve yanıt durumunu takip edin"
        action={
          <Button asChild>
            <Link href="/yorumlar/yeni">
              <Plus />
              Yeni Yorum
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        />
      </div>

      <Card>
        <CardContent className="space-y-4">
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
            <EmptyState
              icon={MessageSquareText}
              title="Yorum yok"
              description="Müşteri yorumlarını elle ekleyin ya da Etsy senkronizasyonu ile çekin. Puan trendini, yanıt durumunu ve işaretli yorumları buradan yönetin."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Puan</TableHead>
                  <TableHead>Yorum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-1 text-right">İşlem</TableHead>
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
                      <TableCell className="max-w-[160px] truncate font-medium">
                        {r.buyer_name ?? "—"}
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
                      <TableCell className="text-muted-foreground max-w-[320px] truncate">
                        {r.review_text ?? "—"}
                      </TableCell>
                      <TableCell>
                        <ReviewStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/yorumlar/${r.id}/duzenle`}>
                              <Pencil className="size-4" />
                              <span className="sr-only">Düzenle</span>
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
