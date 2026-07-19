import {
  CheckCircle2,
  ExternalLink,
  Flag,
  ListChecks,
  Megaphone,
  MousePointerClick,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { requireMembership } from "@/lib/auth";
import {
  ADS_ACTION_KIND_META,
  ADS_ACTION_STATUS_META,
  ADS_PERIOD_LABEL,
  ADS_SIGNAL_META,
  computeAdsSignals,
  getAdsOverview,
  listAdsActions,
  type AdsMetricSnapshot,
  type AdsOverviewRow,
  type AdsSignal,
} from "@/lib/db/queries/ads-actions";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatDate, formatNumber } from "@/lib/format";
import { OrgMark } from "@/components/brand/org-mark";
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
import { createAdsAction, markAdsAction } from "./actions";

export const metadata = { title: "Reklamlar" };

/** Etsy Reklam panosu — aksiyonun ELLE uygulandığı yer (API vekili yok). */
const ETSY_ADS_URL = "https://www.etsy.com/your/shops/me/advertising";

/** Harcama dağılım tablosunda gösterilen satır sınırı (yalnız görüntü —
 *  toplam/sayılar TAM kümeden hesaplanır, display-limit'ten türetilmez). */
const SPEND_TABLE_LIMIT = 15;

const fmtRoas = (r: number | null) =>
  r == null ? "—" : `${formatNumber(r, 2)}×`;

export default async function ReklamlarPage() {
  const m = await requireMembership();
  const [overview, actions] = await Promise.all([
    getAdsOverview(m.org_id),
    listAdsActions(m.org_id),
  ]);
  const { rows, totals, window, currency } = overview;

  const signals = computeAdsSignals(rows);
  const rowByProduct = new Map(rows.map((r) => [r.productId, r]));
  // Aynı ürün+tür beklemedeyken kartta ikinci kez "Aksiyona al" gösterilmez.
  const pendingKeys = new Set(
    actions
      .filter((a) => a.status === "beklemede")
      .map((a) => `${a.product_id}:${a.kind}`),
  );

  // Veri penceresi etiketi — her toplamın kapsamı ekranda yazılır.
  const windowLabel =
    window.from && window.to
      ? `"${ADS_PERIOD_LABEL}" etiketli en güncel kayıtlar · ${formatDate(window.from)} – ${formatDate(window.to)}`
      : `"${ADS_PERIOD_LABEL}" etiketli metrik kaydı yok`;

  const reasonFor = (s: AdsSignal<AdsOverviewRow>) =>
    `${ADS_SIGNAL_META[s.signal].title}: ${formatMoney(s.row.spendCents, currency)} harcama, ${formatMoney(s.row.adsRevenueCents, currency)} getiri, ROAS ${fmtRoas(s.roas)}, bütçe payı ${formatPercent(s.share)} ("${ADS_PERIOD_LABEL}" · ${formatDate(s.row.createdAt)})`;

  const snapshotFor = (s: AdsSignal<AdsOverviewRow>) =>
    JSON.stringify({
      spend_cents: s.row.spendCents,
      ads_revenue_cents: s.row.adsRevenueCents,
      roas: s.roas,
      share: s.share,
      window_to: s.row.createdAt,
    } satisfies AdsMetricSnapshot);

  const spendingRows = rows.filter((r) => r.spendCents > 0);

  return (
    <div className="page-stack relative z-0 pb-32">
      <PageHeader
        title="Reklamlar"
        description="Etsy Ads harcamasını değerlendir, boşa gideni kapat, bütçe yiyeni dizginle, fırsatı büyüt — karar burada, uygulama Etsy'de"
        action={
          <Button asChild variant="outline">
            <a href={ETSY_ADS_URL} target="_blank" rel="noreferrer">
              <ExternalLink />
              Etsy Reklam panosu
            </a>
          </Button>
        }
      />

      {/* DÜRÜSTLÜK NOTU — API sınırı gizlenmez, ilan edilir (0059 deseni). */}
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-[75ch] text-sm">
            <span className="text-foreground font-medium">
              Bu panel Etsy reklamını doğrudan değiştiremez
            </span>{" "}
            — Etsy Open API v3 reklam (Etsy Ads) kontrolü sunmuyor. Karar burada
            verilir ve kuyrukta takip edilir; kapatma/azaltma/artırma işlemini
            Etsy Reklam panosunda elle yapıp dönüşte &quot;Yapıldı&quot;
            işaretleyin — panel öncesi/sonrası ölçümü tutar.
          </p>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <a href={ETSY_ADS_URL} target="_blank" rel="noreferrer">
              <ExternalLink />
              Etsy&apos;de aç
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Genel bakış KPI'ları — pencere etiketi her kartta yazılı. */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Reklam Harcaması"
          cents={totals.spendCents}
          currency={currency}
          icon={Wallet}
          hint={windowLabel}
        />
        <KpiCard
          label="Reklam Geliri"
          cents={totals.adsRevenueCents}
          currency={currency}
          icon={TrendingUp}
          accent={
            totals.roas == null
              ? "default"
              : totals.roas >= 1
                ? "positive"
                : "negative"
          }
          hint={windowLabel}
        />
        <KpiCard
          label="ROAS"
          value={fmtRoas(totals.roas)}
          icon={Target}
          accent={
            totals.roas == null
              ? "default"
              : totals.roas >= 1
                ? "positive"
                : "negative"
          }
          hint={
            totals.roas == null
              ? `harcama yok · ${windowLabel}`
              : `reklam geliri / harcama · ${windowLabel}`
          }
        />
        <KpiCard
          label="Reklam Tıklaması"
          value={formatNumber(totals.adsClicks)}
          icon={MousePointerClick}
          hint={windowLabel}
        />
        <KpiCard
          label="İşaretli Ürün"
          value={formatNumber(signals.length)}
          icon={Flag}
          accent={signals.length > 0 ? "negative" : "positive"}
          hint={`aksiyon sinyali üreten ürün · ${formatNumber(overview.spendingProductCount)} üründe harcama var`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Reklamlar / 01 · Aksiyon önerileri</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>

      {signals.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={CheckCircle2}
              title="Aksiyon sinyali yok"
              description={`Boşa harcama, bütçe yiyen ya da büyütme fırsatı üreten ürün bulunmadı (${windowLabel}). Yeni "son 30" metrikleri girildikçe sinyaller burada belirir.`}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {signals.map((s) => {
            const meta = ADS_SIGNAL_META[s.signal];
            return (
              <Card key={`${s.row.productId}-${s.signal}`}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{s.row.title}</p>
                    <Badge variant={meta.badgeVariant}>{meta.title}</Badge>
                  </div>
                  {/* Neden — sayılarla: harcama, getiri, ROAS, bütçe payı. */}
                  <p className="text-sm tabular-nums">
                    Harcama{" "}
                    <span className="font-medium">
                      {formatMoney(s.row.spendCents, currency)}
                    </span>{" "}
                    · Getiri{" "}
                    <span className="font-medium">
                      {formatMoney(s.row.adsRevenueCents, currency)}
                    </span>{" "}
                    · ROAS <span className="font-medium">{fmtRoas(s.roas)}</span>{" "}
                    · Bütçe payı{" "}
                    <span className="font-medium">{formatPercent(s.share)}</span>
                  </p>
                  <p className="text-muted-foreground text-sm">{meta.hint}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {meta.suggestedKinds.map((k) =>
                      pendingKeys.has(`${s.row.productId}:${k}`) ? (
                        <Badge key={k} variant="outline">
                          <CheckCircle2 />
                          {ADS_ACTION_KIND_META[k].label} · kuyrukta
                        </Badge>
                      ) : (
                        <form key={k} action={createAdsAction}>
                          <input type="hidden" name="product_id" value={s.row.productId} />
                          <input type="hidden" name="kind" value={k} />
                          <input type="hidden" name="reason" value={reasonFor(s)} />
                          <input type="hidden" name="snapshot" value={snapshotFor(s)} />
                          <Button type="submit" size="sm">
                            Aksiyona al · {ADS_ACTION_KIND_META[k].label}
                          </Button>
                        </form>
                      ),
                    )}
                    <Button asChild variant="outline" size="sm">
                      <a href={ETSY_ADS_URL} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Etsy Reklam panosu
                      </a>
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Bu panel Etsy reklamını doğrudan değiştiremez (API
                    sunmuyor) — karar burada, uygulama Etsy&apos;de.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Reklamlar / 02 · Aksiyon kuyruğu</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>

      {/* Ölçüm döngüsü: beklemede → Etsy'de elle uygula → Yapıldı işaretle →
          karar anı fotoğrafı vs güncel "son 30" metriği kıyası. */}
      <Card className="glass-fluted">
        <CardContent className="space-y-4">
          {actions.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Kuyrukta aksiyon yok"
              description="Yukarıdaki önerilerden 'Aksiyona al' dediğinizde karar buraya düşer; Etsy panosunda uyguladıktan sonra 'Yapıldı' işaretleyin ki öncesi/sonrası ölçülsün."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Aksiyon</TableHead>
                  <TableHead>Neden</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Ölçüm (karar anı → şimdi)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((a) => {
                  const snap = a.metric_snapshot;
                  const cur = rowByProduct.get(a.product_id);
                  const statusMeta = ADS_ACTION_STATUS_META[a.status];
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(a.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="scroll-x max-w-[220px]" title={a.product?.title}>
                          {a.product?.title ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ADS_ACTION_KIND_META[a.kind]?.label ?? a.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="scroll-x max-w-[260px]" title={a.reason ?? undefined}>
                          {a.reason ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMeta.badgeVariant}>
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {snap ? (
                          <div className="space-y-0.5 whitespace-nowrap">
                            <div>
                              Karar anı:{" "}
                              {formatMoney(snap.spend_cents ?? 0, currency)} ·
                              ROAS {fmtRoas(snap.roas ?? null)}
                            </div>
                            {a.status === "yapildi" && (
                              <div className="text-muted-foreground">
                                Şimdi:{" "}
                                {cur
                                  ? `${formatMoney(cur.spendCents, currency)} · ROAS ${fmtRoas(
                                      cur.spendCents > 0
                                        ? cur.adsRevenueCents / cur.spendCents
                                        : null,
                                    )}`
                                  : "güncel metrik yok"}
                              </div>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.status === "beklemede" ? (
                          <div className="flex justify-end gap-1">
                            <form action={markAdsAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value="yapildi" />
                              <Button type="submit" size="sm" variant="outline">
                                Yapıldı
                              </Button>
                            </form>
                            <form action={markAdsAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value="yok_sayildi" />
                              <Button type="submit" size="sm" variant="ghost">
                                Yok say
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {a.decided_at ? formatDate(a.decided_at) : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Reklamlar / 03 · Harcama dağılımı</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs">
            {windowLabel} · harcaması olan {formatNumber(spendingRows.length)}{" "}
            üründen en yüksek {formatNumber(Math.min(SPEND_TABLE_LIMIT, spendingRows.length))}{" "}
            tanesi gösteriliyor — toplamlar tam kümeden hesaplanır.
          </p>
          {spendingRows.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Reklam harcaması yok"
              description={`"${ADS_PERIOD_LABEL}" penceresinde reklam harcaması kaydı bulunamadı. Analizler'den ürün metriklerini (Etsy Ads sütunlarıyla) girin.`}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Harcama</TableHead>
                  <TableHead className="text-right">Reklam Geliri</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Pay</TableHead>
                  <TableHead className="text-right">Tık</TableHead>
                  <TableHead className="text-right">Görüntülenme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spendingRows.slice(0, SPEND_TABLE_LIMIT).map((r) => (
                  <TableRow key={r.productId}>
                    <TableCell className="font-medium">
                      <div className="scroll-x max-w-[280px]" title={r.title}>
                        {r.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(r.spendCents, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(r.adsRevenueCents, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtRoas(r.spendCents > 0 ? r.adsRevenueCents / r.spendCents : null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(
                        totals.spendCents > 0 ? r.spendCents / totals.spendCents : 0,
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(r.adsClicks)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(r.views)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
