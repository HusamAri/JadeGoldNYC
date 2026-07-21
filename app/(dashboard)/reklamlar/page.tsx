import { notFound } from "next/navigation";

import { getActivePlatform } from "@/lib/platform";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Flag,
  Globe,
  ImageOff,
  ListChecks,
  Megaphone,
  MousePointerClick,
  Satellite,
  ShoppingBag,
  Target,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import Link from "next/link";

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
import {
  ADS_LEDGER_WINDOW_DAYS,
  getAdsLedgerOverview,
} from "@/lib/db/queries/ads-ledger";
import {
  getListingViewsTrends,
  type ListingViewsTrend,
} from "@/lib/db/queries/etsy-insights";
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

/** API (ledger) tablolarının görüntü sınırı — toplamlar tam kümeden. */
const LEDGER_TABLE_LIMIT = 10;

const fmtRoas = (r: number | null) =>
  r == null ? "—" : `${formatNumber(r, 2)}×`;

export default async function ReklamlarPage() {
  // Reklam sinyalleri Etsy Ads verisine bağlı — yetenek kapalıysa derin link koruması.
  const platform = await getActivePlatform();
  if (!platform.capabilities.adsSignals) notFound();
  const m = await requireMembership();
  const [overview, actions, ledger] = await Promise.all([
    getAdsOverview(m.org_id),
    listAdsActions(m.org_id),
    getAdsLedgerOverview(m.org_id),
  ]);
  const { rows, totals, window, currency } = overview;

  // API penceresi etiketi — GERÇEK takvim aralığı (etiket eşleşmesi değil).
  const ledgerWindowLabel = `son ${ADS_LEDGER_WINDOW_DAYS} gün · ${formatDate(ledger.window.fromIso)} – ${formatDate(ledger.window.toIso)} · Etsy API (ledger)`;
  const hasLedgerData =
    ledger.days.length > 0 || ledger.offsiteOrders.length > 0;

  const signals = computeAdsSignals(rows);
  const rowByProduct = new Map(rows.map((r) => [r.productId, r]));

  // Sinyal kartlarının ORGANİK bağlamı — kapat/azalt/artır kararı elle girilen
  // reklam metriğiyle sınırlı kalmasın: aynı listing'in fotoğraf-farkı
  // görüntülenme trendi + aynı aralıktaki dönüşüm (sınırlı küme, sinyaller).
  const signalListingIds = [
    ...new Set(
      signals
        .map((s) => s.row.etsyListingId)
        .filter((n): n is number => n != null),
    ),
  ];
  const trendByListing: Map<number, ListingViewsTrend> =
    signalListingIds.length > 0
      ? await getListingViewsTrends(m.org_id, signalListingIds)
      : new Map();
  const trendFor = (r: AdsOverviewRow): ListingViewsTrend | null =>
    r.etsyListingId != null
      ? (trendByListing.get(r.etsyListingId) ?? null)
      : null;
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

  const snapshotFor = (s: AdsSignal<AdsOverviewRow>) => {
    const t = trendFor(s.row);
    return JSON.stringify({
      spend_cents: s.row.spendCents,
      ads_revenue_cents: s.row.adsRevenueCents,
      roas: s.roas,
      share: s.share,
      window_to: s.row.createdAt,
      // Karar anındaki organik bağlam da fotoğrafa girer (önce/sonra kıyası).
      organic_views_delta: t?.viewsDelta ?? null,
      organic_conversion: t?.conversion ?? null,
      price_cents: s.row.priceCents,
      quantity: s.row.quantity,
    } satisfies AdsMetricSnapshot);
  };

  const spendingRows = rows.filter((r) => r.spendCents > 0);

  return (
    <div className="page-stack relative z-0 pb-32">
      <PageHeader
        title="Reklamlar"
        description="Etsy Ads harcamasını değerlendir, boşa gideni kapat, bütçe yiyeni dizginle, fırsatı büyüt — karar burada, uygulama Etsy'de"
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/reklamlar/ice-aktar">
                <Upload />
                CSV İçe Aktar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={ETSY_ADS_URL} target="_blank" rel="noreferrer">
                <ExternalLink />
                Etsy Reklam panosu
              </a>
            </Button>
          </>
        }
      />

      {/* DÜRÜSTLÜK NOTU — API sınırı gizlenmez, ilan edilir (0059 deseni). */}
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-muted-foreground max-w-[75ch] space-y-2 text-sm">
            <p>
              <span className="text-foreground font-medium">
                Bu panel Etsy reklamını doğrudan değiştiremez
              </span>{" "}
              — Etsy Open API v3 reklam (Etsy Ads) kontrolü ve listing başına
              tık/harcama verisi sunmuyor. Karar burada verilir ve kuyrukta
              takip edilir; kapatma/azaltma/artırma işlemini Etsy Reklam
              panosunda elle yapıp dönüşte &quot;Yapıldı&quot; işaretleyin —
              panel öncesi/sonrası ölçümü tutar.
            </p>
            <p>
              Bu sayfada iki veri kaynağı var:{" "}
              <span className="text-foreground font-medium">
                Etsy API (ledger)
              </span>{" "}
              bölümü mağaza geneli Etsy Ads harcamasını ve Offsite Ads
              ücret/atıflarını senkronla OTOMATİK çeker (Etsy bağlanan her
              şirkette kendiliğinden dolar; CSV/elle giriş istemez). Listing
              başına harcama/tık/ROAS tablolarıysa API&apos;de olmadığından{" "}
              <span className="text-foreground font-medium">
                Analizler → Ürün performansı
              </span>{" "}
              üzerinden &quot;{ADS_PERIOD_LABEL}&quot; etiketli elle girilen
              metriklerden gelir.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <a href={ETSY_ADS_URL} target="_blank" rel="noreferrer">
              <ExternalLink />
              Etsy&apos;de aç
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Reklamlar / 01 · Etsy API (ledger) — otomatik</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>

      {/* API-KAYNAKLI BÖLÜM — org-bağımsız: Etsy bağlanan her şirkette
          (Jade, EON, sonrakiler) senkron ledger'ı bu bölümü otomatik doldurur. */}
      {!ledger.connected && !hasLedgerData ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Satellite}
              title="Etsy bağlı değil"
              description="Ayarlar → Etsy'den bağlantı kurulunca senkron, reklam ücretlerini (Etsy Ads günlük harcaması + Offsite Ads sipariş ücretleri) ledger'dan otomatik çeker — CSV ya da elle giriş gerekmez."
            />
          </CardContent>
        </Card>
      ) : !hasLedgerData ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Satellite}
              title="Son 30 günde reklam ücreti kaydı yok"
              description={`Ledger senkronu bağlı ama ${ledgerWindowLabel} penceresinde prolist/offsite kaydı bulunamadı. Etsy Ads kapalıysa bu normaldir; senkron sonrası ücretler burada kendiliğinden görünür.`}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <KpiCard
              label="Etsy Ads Harcaması (Onsite)"
              cents={ledger.onsiteSpendCents}
              currency={ledger.currency}
              icon={Megaphone}
              hint={`${formatNumber(ledger.onsiteDays)} günde ücret kesildi · ${ledgerWindowLabel}`}
            />
            <KpiCard
              label="Offsite Ads Ücreti"
              cents={ledger.offsiteFeeCents}
              currency={ledger.currency}
              icon={Globe}
              hint={`sipariş başına kesilen komisyon · ${ledgerWindowLabel}`}
            />
            <KpiCard
              label="Offsite Kaynaklı Sipariş"
              value={formatNumber(ledger.offsiteOrderCount)}
              icon={ShoppingBag}
              hint={`ledger ücret kaydı → sipariş bağı · ${ledgerWindowLabel}`}
            />
            <KpiCard
              label="Offsite Kaynaklı Ciro"
              cents={ledger.offsiteRevenueCents}
              currency={ledger.currency}
              icon={TrendingUp}
              accent={
                ledger.offsiteFeeCents > 0 &&
                ledger.offsiteRevenueCents > ledger.offsiteFeeCents
                  ? "positive"
                  : "default"
              }
              hint={
                ledger.offsiteFeeCents > 0
                  ? `ciro / ücret ${fmtRoas(ledger.offsiteRevenueCents / ledger.offsiteFeeCents)} · ${ledgerWindowLabel}`
                  : ledgerWindowLabel
              }
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Günlük seri — yalnız kaydı olan günler; toplamlar tam kümeden. */}
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-muted-foreground size-4" />
                  <p className="text-sm font-medium">Günlük reklam ücreti</p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {ledgerWindowLabel} · kaydı olan{" "}
                  {formatNumber(ledger.days.length)} günden en yeni{" "}
                  {formatNumber(Math.min(LEDGER_TABLE_LIMIT, ledger.days.length))}{" "}
                  tanesi — toplamlar tam kümeden.
                  {ledger.otherCurrencyCount > 0 &&
                    ` ${formatNumber(ledger.otherCurrencyCount)} kayıt farklı kurda (toplam dışı).`}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gün</TableHead>
                      <TableHead className="text-right">Etsy Ads</TableHead>
                      <TableHead className="text-right">Offsite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.days.slice(0, LEDGER_TABLE_LIMIT).map((d) => (
                      <TableRow key={d.date}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(d.date)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(d.onsiteCents, ledger.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(d.offsiteCents, ledger.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Offsite atıf kırılımı — ücret kesilen siparişlerdeki listingler. */}
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="text-muted-foreground size-4" />
                  <p className="text-sm font-medium">
                    Offsite Ads&apos;in getirdiği listingler
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  Ücret kesilen {formatNumber(ledger.offsiteOrderCount)}{" "}
                  siparişin kalem kırılımı · ciroya göre ilk{" "}
                  {formatNumber(
                    Math.min(LEDGER_TABLE_LIMIT, ledger.offsiteListings.length),
                  )}{" "}
                  listing. Onsite (Etsy Ads) listing kırılımını API vermez.
                </p>
                {ledger.offsiteListings.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Bu pencerede offsite ücretli sipariş yok.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead className="text-right">Sipariş</TableHead>
                        <TableHead className="text-right">Adet</TableHead>
                        <TableHead className="text-right">Ciro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.offsiteListings
                        .slice(0, LEDGER_TABLE_LIMIT)
                        .map((l) => (
                          <TableRow key={`${l.etsyListingId ?? l.title}`}>
                            <TableCell className="font-medium">
                              <div
                                className="scroll-x max-w-[240px]"
                                title={l.title}
                              >
                                {l.title}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(l.orders)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(l.units)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(l.revenueCents, ledger.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Reklamlar / 02 · &quot;{ADS_PERIOD_LABEL}&quot; metrikleri — elle girilen</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>

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
        <span>Reklamlar / 03 · Aksiyon önerileri</span>
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
            const t = trendFor(s.row);
            return (
              <Card key={`${s.row.productId}-${s.signal}`}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Link
                        href={`/tasarimlar/listing/${s.row.productId}`}
                        className="bg-muted relative block size-14 shrink-0 overflow-hidden rounded-xl"
                      >
                        {s.row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.row.imageUrl}
                            alt={s.row.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground/50 flex h-full items-center justify-center">
                            <ImageOff className="size-5" />
                          </span>
                        )}
                      </Link>
                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/tasarimlar/listing/${s.row.productId}`}
                          className="hover:text-primary line-clamp-2 font-medium transition-colors"
                        >
                          {s.row.title}
                        </Link>
                      </div>
                    </div>
                    <Badge variant={meta.badgeVariant} className="shrink-0">
                      {meta.title}
                    </Badge>
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
                  {/* Karar bağlamı — organik trend (API fotoğraf farkı,
                      GERÇEK aralık) + canlı fiyat/stok. "son 30" etiketli
                      reklam satırından ayrı pencere olduğu açıkça yazılır. */}
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {t && t.statDays >= 2 && t.viewsDelta != null ? (
                      <>
                        Organik{" "}
                        <span className="text-foreground font-medium">
                          {formatNumber(t.viewsDelta)} görüntülenme
                        </span>
                        {t.favorersDelta != null && (
                          <>
                            {" "}
                            · favori{" "}
                            <span className="text-foreground font-medium">
                              {t.favorersDelta > 0 ? "+" : ""}
                              {formatNumber(t.favorersDelta)}
                            </span>
                          </>
                        )}{" "}
                        · dönüşüm{" "}
                        <span className="text-foreground font-medium">
                          {t.conversion != null
                            ? formatPercent(t.conversion)
                            : "—"}
                        </span>{" "}
                        <span className="text-xs">
                          (fotoğraf farkı · {formatDate(t.coveredFrom!)} –{" "}
                          {formatDate(t.coveredTo!)})
                        </span>
                      </>
                    ) : (
                      <>Organik seri olgunlaşıyor (günlük senkron biriktirir)</>
                    )}
                    {" "}· fiyat{" "}
                    <span className="text-foreground font-medium">
                      {s.row.priceCents != null
                        ? formatMoney(s.row.priceCents, currency)
                        : "—"}
                    </span>{" "}
                    · stok{" "}
                    <span className="text-foreground font-medium">
                      {s.row.quantity != null
                        ? formatNumber(s.row.quantity)
                        : "—"}
                    </span>
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
        <span>Reklamlar / 04 · Aksiyon kuyruğu</span>
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
                        <div className="flex max-w-[260px] items-center gap-2.5">
                          <span className="bg-muted relative block size-9 shrink-0 overflow-hidden rounded-lg">
                            {a.product?.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.product.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-muted-foreground/40 flex h-full items-center justify-center">
                                <ImageOff className="size-3.5" />
                              </span>
                            )}
                          </span>
                          <Link
                            href={`/tasarimlar/listing/${a.product_id}`}
                            className="scroll-x hover:text-primary min-w-0 truncate transition-colors"
                            title={a.product?.title ?? undefined}
                          >
                            {a.product?.title ?? "—"}
                          </Link>
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
        <span>Reklamlar / 05 · Harcama dağılımı</span>
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
              title="Reklam harcaması kaydı yok"
              description={`"${ADS_PERIOD_LABEL}" etiketli ürün metriği yok. Bu, senkron hatası değil: listing ROAS Etsy API'den gelmez. Analizler → Ürün performansına Etsy Ads'ten kopyalanmış "son 30" satırı girin. Mağaza reklam ücreti için Maliyetler'e bakın.`}
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
                      <div className="flex max-w-[300px] items-center gap-2.5">
                        <Link
                          href={`/tasarimlar/listing/${r.productId}`}
                          className="bg-muted relative block size-9 shrink-0 overflow-hidden rounded-lg"
                        >
                          {r.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-muted-foreground/40 flex h-full items-center justify-center">
                              <ImageOff className="size-3.5" />
                            </span>
                          )}
                        </Link>
                        <Link
                          href={`/tasarimlar/listing/${r.productId}`}
                          className="scroll-x hover:text-primary min-w-0 truncate transition-colors"
                          title={r.title}
                        >
                          {r.title}
                        </Link>
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
