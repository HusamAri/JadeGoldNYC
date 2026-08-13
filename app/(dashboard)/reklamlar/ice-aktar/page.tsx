import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { getAdsFreshness } from "@/lib/db/queries/ads-actions";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { AdsImportTabs } from "@/components/csv-import/ads-import-tabs";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Reklam Verisi" };

/**
 * Etsy Open API v3 REKLAM VERİSİ SUNMAZ — bu yüzden reklam sayıları otomatik
 * senkronla gelmez, Etsy Reklam panosundan indirilen CSV ile yüklenir. Sayfa
 * önce verinin KAÇ GÜN GERİDE olduğunu söyler (bayatlık sessiz kalmasın),
 * sonra yükleme sihirbazlarını gösterir.
 */
export default async function ReklamVerisiPage() {
  const m = await requireMembership();
  const fresh = await getAdsFreshness(m.org_id);

  const stale = fresh.staleDays == null || fresh.staleDays > 2;

  return (
    <div>
      <PageHeader
        title="Reklam Verisi"
        description="Etsy Reklam panosundan indirilen CSV'yi yükleyin — mağaza geneli günlük ya da listing kırılımlı"
      />

      <Card className="mb-4">
        <CardContent className="flex items-start gap-3">
          {stale ? (
            <AlertTriangle
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-[var(--chart-4)]"
            />
          ) : (
            <CheckCircle2
              aria-hidden
              className="text-primary mt-0.5 size-5 shrink-0"
            />
          )}
          <div className="space-y-1 text-sm">
            {fresh.lastDailyDate ? (
              <p>
                Günlük seri <strong>{formatDate(fresh.lastDailyDate)}</strong>{" "}
                tarihine kadar dolu
                {fresh.staleDays != null && fresh.staleDays > 0 ? (
                  <>
                    {" "}
                    — <strong>{fresh.staleDays} gün geride</strong>.
                  </>
                ) : (
                  " — güncel."
                )}
              </p>
            ) : (
              <p>Günlük reklam serisi boş — henüz hiç CSV yüklenmemiş.</p>
            )}
            <p className="text-muted-foreground">
              Listing kırılımlı son yükleme:{" "}
              {fresh.lastListingSnapshotAt
                ? formatDate(fresh.lastListingSnapshotAt)
                : "yok"}
              .
            </p>
            {stale && (
              <p className="text-muted-foreground">
                Reklam verisi Etsy API&apos;sinden gelmez; boşluk kapanmazsa
                bütçe kararı eski sayılarla verilir. Etsy → Reklamlar →
                istatistikleri CSV olarak indirip aşağıya yükleyin.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AdsImportTabs />
    </div>
  );
}
