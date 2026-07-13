import Link from "next/link";
import { Star, Plus, Pencil, CalendarClock } from "lucide-react";

import {
  listStarSellerSnapshots,
  getReviewRatingStats,
} from "@/lib/db/queries/star-seller";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StarSellerSnapshot } from "@/lib/types";
import { overallStatus, metricViews, type StarSellerValues } from "@/lib/star-seller";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { SceneCutouts } from "@/components/scene-cutouts";
import { SectionGuide } from "@/components/section-guide";
import { StarSellerCards, overallLabel } from "@/components/star-seller-cards";
import { StarSellerForm } from "@/components/star-seller-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/data-table/delete-button";
import { StarSellerFormValuesFromRow, EMPTY_FORM } from "./form-defaults";
import { deleteStarSellerSnapshot } from "./actions";

export const metadata = { title: "Yıldız Satıcı" };

function valuesOf(s: StarSellerSnapshot | null): StarSellerValues {
  return {
    messageResponseRate: s?.message_response_rate ?? null,
    onTimeShippingRate: s?.on_time_shipping_rate ?? null,
    avgReviewRating: s?.avg_review_rating ?? null,
    lowReviewCount: s?.low_review_count ?? null,
    caseCount: s?.case_count ?? null,
    orderCount: s?.order_count ?? null,
  };
}

const OVERALL_STYLE = {
  target: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  standard: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  risk: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  unknown: "bg-muted text-muted-foreground",
} as const;

export default async function YildizSaticiPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const editId = strParam(sp.edit);
  const isNew = strParam(sp.yeni) === "1";

  const snapshots = await listStarSellerSnapshots();

  const latest = snapshots[0] ?? null;
  const editing = editId
    ? (snapshots.find((s) => s.id === editId) ?? null)
    : isNew
      ? null
      : latest;

  // Otomatik doldurma: düzenlenen dönemin tarih aralığına göre (varsa),
  // yoksa tüm yorumlar (yeni dönem için taban değer).
  const ratingStats = await getReviewRatingStats(
    editing?.period_start ?? null,
    editing?.period_end ?? null,
  );

  const latestValues = valuesOf(latest);
  const overall = overallLabel(latestValues);
  // Star Seller ilerlemesi: 4 metrikten kaçı Star Seller hedefinde —
  // gerçek/hesaplanmış veri (icat edilmiş bir "skor" değil).
  const latestMetricViews = metricViews(latestValues);
  const targetMetricCount = latestMetricViews.filter((m) => m.status === "target").length;
  const starSellerProgress = (targetMetricCount / latestMetricViews.length) * 100;

  const formDefaults = editing
    ? StarSellerFormValuesFromRow(editing)
    : EMPTY_FORM;

  return (
    <div className="relative z-0 space-y-8 pb-28">
      <GoldStream motif="star" />
      <SceneCutouts page="yildiz-satici" />
      <PageHeader
        title="Yıldız Satıcı"
        description="Etsy Star Seller metriklerini dönem bazında takip edin; hizmet standardı ve Star Seller hedefiyle karşılaştırın."
        action={
          <Button asChild variant="outline">
            <Link href="/yildiz-satici?yeni=1">
              <Plus />
              Yeni Dönem
            </Link>
          </Button>
        }
      />

      {latest ? (
        <>
          {/* Durum şeridi — sayfanın hero/özet şeridi: berrak cam board */}
          <Card className="glass-board">
            <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <ProgressRing
                value={starSellerProgress}
                valueLabel={`${targetMetricCount}/${latestMetricViews.length}`}
                label="Hedefte"
                size={76}
                strokeWidth={6}
                aria-label={`Star Seller ilerlemesi: 4 metrikten ${targetMetricCount} tanesi hedefte`}
              />
              <div className="flex items-center gap-2">
                <Star className="text-primary size-5" />
                <div>
                  <div className="text-sm font-semibold">{latest.period_label}</div>
                  <div className="text-muted-foreground text-xs">Değerlendirme dönemi</div>
                </div>
              </div>
              {latest.next_chance_on && (
                <div className="flex items-center gap-2">
                  <CalendarClock className="text-muted-foreground size-4" />
                  <div>
                    <div className="text-sm font-medium tabular-nums">
                      {formatDate(latest.next_chance_on)}
                    </div>
                    <div className="text-muted-foreground text-xs">Sonraki şans</div>
                  </div>
                </div>
              )}
              <span
                className={cn(
                  "ml-auto rounded-full px-3 py-1 text-sm font-medium",
                  OVERALL_STYLE[overall.status],
                )}
              >
                {overall.text}
              </span>
            </CardContent>
          </Card>

          <StarSellerCards values={latestValues} />
        </>
      ) : (
        <EmptyState
          icon={Star}
          title="Henüz dönem verisi yok"
          description="Etsy'deki Star Seller panosundaki 4 metriği aşağıdaki forma girin; panel bunları standart ve hedefle karşılaştırıp dönem geçmişini tutar."
        />
      )}

      <SectionGuide title="Yıldız Satıcı verisi nasıl girilir?">
        <p>
          Etsy bu metrikleri API ile paylaşmaz; değerler Etsy&apos;deki{" "}
          <b>Star Seller</b> panosundan dönem başına elle girilir.
        </p>
        <ol>
          <li>
            Etsy &rarr; <b>Star Seller</b> ekranındaki 4 metriği (mesaj yanıt
            hızı, zamanında kargo, ortalama puan, itiraz) aşağıya kopyalayın.
          </li>
          <li>
            Dönem etiketi ve tarihleriyle <b>Dönemi Kaydet</b>. Her yeni dönemde{" "}
            <b>Yeni Dönem</b> ile ekleyin.
          </li>
          <li>
            <b>Ortalama puan</b> ve düşük-puan sayısı yorum verinizden otomatik
            doldurulabilir (&quot;Puanı yorumlardan doldur&quot;) — yetkili
            değer yine de Etsy&apos;deki sayıdır.
          </li>
        </ol>
      </SectionGuide>

      {/* Form */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          {editing
            ? `Dönemi düzenle · ${editing.period_label}`
            : "Yeni dönem verisi gir"}
        </h2>
        <StarSellerForm
          key={editing?.id ?? "new"}
          snapshotId={editing?.id}
          defaultValues={formDefaults}
          autoRating={{
            avgRating: ratingStats.avgRating,
            lowReviewCount: ratingStats.lowReviewCount,
          }}
        />
      </section>

      {/* Geçmiş — uzun liste/tablo kabı: dikey oluklu cam */}
      {snapshots.length > 0 && (
        <Card className="glass-fluted">
          <CardHeader>
            <CardTitle>Dönem Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead className="text-right">Mesaj</TableHead>
                  <TableHead className="text-right">Kargo</TableHead>
                  <TableHead className="text-right">Puan</TableHead>
                  <TableHead className="text-right">İtiraz</TableHead>
                  <TableHead className="w-1 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((s) => {
                  const status = overallStatus(metricViews(valuesOf(s)));
                  const statusLabel =
                    status === "target"
                      ? "Hedefte"
                      : status === "standard"
                        ? "Standart"
                        : status === "risk"
                          ? "Risk"
                          : "Veri yok";
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <span
                          aria-hidden
                          className={cn(
                            "mr-2 inline-block size-2 rounded-full align-middle",
                            status === "target"
                              ? "bg-emerald-500"
                              : status === "standard"
                                ? "bg-amber-500"
                                : status === "risk"
                                  ? "bg-red-500"
                                  : "bg-muted-foreground/40",
                          )}
                        />
                        <span className="sr-only">{statusLabel}: </span>
                        {s.period_label}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.message_response_rate != null ? `%${s.message_response_rate}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.on_time_shipping_rate != null ? `%${s.on_time_shipping_rate}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.avg_review_rating != null ? s.avg_review_rating : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.case_count != null ? s.case_count : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/yildiz-satici?edit=${s.id}`}>
                              <Pencil className="size-4" />
                              <span className="sr-only">Düzenle</span>
                            </Link>
                          </Button>
                          <DeleteButton action={deleteStarSellerSnapshot} id={s.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
