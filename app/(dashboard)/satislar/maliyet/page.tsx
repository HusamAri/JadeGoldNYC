import Link from "next/link";
import { Receipt } from "lucide-react";

import { requireMembership, isManager } from "@/lib/auth";
import {
  countRefundBacklog,
  getSaleItemPnlTotals,
  listSaleItemPnl,
  type PnlListOptions,
} from "@/lib/db/queries/sale-costs";
import { getDashboard } from "@/lib/db/queries/dashboard";
import { resolvePeriod, previousPeriod } from "@/lib/period";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { SALE_STATUSES } from "@/lib/constants";
import { formatMoneyParts, formatPercent } from "@/lib/money";
import { formatNumber, formatDate, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/data-table/search-input";
import { FilterSelect } from "@/components/data-table/filter-select";
import { Pagination } from "@/components/data-table/pagination";
import { SaleCostGrid } from "@/components/sales/sale-cost-grid";
import { CostSetupStrip } from "@/components/sales/cost-setup-strip";
import {
  Bezel,
  Screen,
  FmDial,
  Knob,
  SegLinks,
  DecorCard,
  ScopeChart,
  Legend,
} from "@/components/instruments";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getLastSyncSummary } from "@/lib/etsy/sync";

export const metadata = { title: "Satış & Maliyet Takibi" };

// Etsy çekimi (EtsySyncButton) server action'ı bu rota üzerinden koşar;
// ayarlar/etsy ile aynı gerekçeyle fonksiyon süresi uzatılır.
export const maxDuration = 60;

const PERIOD_SEG: { key: string; label: string }[] = [
  { key: "7d", label: "7g" },
  { key: "30d", label: "30g" },
  { key: "month", label: "Ay" },
  { key: "all", label: "Tümü" },
];

/** Defter hücresi — mono etiket, Fraunces rakam, mono dipnot. */
function LedgerStat({
  label,
  value,
  foot,
  tag,
}: {
  label: string;
  value: string;
  foot?: React.ReactNode;
  tag?: string;
}) {
  return (
    <div className="stat">
      <div className="flex items-baseline justify-between gap-2">
        <span className="mono-label">{label}</span>
        {tag && <span className="tag-neon">{tag}</span>}
      </div>
      <div className="ledger-num mt-3.5 text-[40px] xl:text-[52px]">{value}</div>
      {foot && <div className="mono-label mt-2.5 flex items-center gap-2.5">{foot}</div>}
    </div>
  );
}

/** Tutar: para birimi işareti üstte küçük, kuruş yok (defter dili). */
function money(cents: number, currency: string): string {
  const { main } = formatMoneyParts(cents, currency);
  return main;
}

/**
 * Satış & Maliyet Takibi — V7 "defter" yapısı (docs/amuletta-2/plan.md §V7):
 * editoryal başlık, kurulum şeridi (eksikse), dört hücreli defter bandı
 * (tuner ekranı · gelir · COGS · dekor kartı), solda kalem tablosu, sağda
 * osiloskop grafiği + marj düğmesi + Dikkat satırları. Satılan kalemler
 * Etsy'den gelir; altın/işçilik/taş/paket satırda girilir. Vergi gelir
 * sayılmaz; marj = net kâr / net gelir.
 */
export default async function SatisMaliyetPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const search = strParam(sp.search);
  const status = strParam(sp.status);
  const flag = strParam(sp.flag) as PnlListOptions["flag"] | undefined;
  const periodKey = strParam(sp.period) ?? "all";
  const offset = numParam(sp.offset);
  const limit = 50;

  const m = await requireMembership();
  const canEdit = isManager(m.role);
  const period = resolvePeriod(periodKey);
  const opts: PnlListOptions = {
    search,
    status,
    flag: flag && ["eksik", "iade", "kar-negatif"].includes(flag) ? flag : undefined,
    from: periodKey === "all" ? undefined : (period.fromIso ?? undefined),
    to: periodKey === "all" ? undefined : period.toIso,
  };
  // Osiloskop penceresi: "Tümü" seçiliyken grafik son 30 günü gösterir
  // (tüm zamanların günlük serisi okunmaz, sorgu da ağırlaşır).
  const chartPeriod = periodKey === "all" ? resolvePeriod("30d") : period;
  const chartPrev = previousPeriod(chartPeriod);

  const [{ rows, count }, totalsByCur, backlog, etsyStatus, syncSummary, dash, dashPrev, negative] =
    await Promise.all([
      listSaleItemPnl(m.org_id, { ...opts, limit, offset }),
      getSaleItemPnlTotals(m.org_id, opts),
      countRefundBacklog(m.org_id),
      getEtsyStatus(m.org_id),
      getLastSyncSummary(m.org_id),
      getDashboard(chartPeriod, m.org_id),
      chartPrev ? getDashboard(chartPrev, m.org_id) : Promise.resolve(null),
      listSaleItemPnl(m.org_id, { ...opts, flag: "kar-negatif", limit: 1 })
        .then((r) => r.count)
        .catch(() => null),
    ]);
  const primary = totalsByCur[0];
  const t = primary?.totals;
  const cur = primary?.currency ?? dash.currency;
  const filtered = Boolean(search || status || opts.flag || periodKey !== "all");

  const exportQs = new URLSearchParams();
  if (search) exportQs.set("search", search);
  if (status) exportQs.set("status", status);
  if (opts.flag) exportQs.set("flag", opts.flag);
  if (periodKey !== "all") exportQs.set("period", periodKey);

  // Segment linkleri — diğer filtreleri korur, sayfayı sıfırlar.
  const segHref = (key: string) => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (status) q.set("status", status);
    if (opts.flag) q.set("flag", opts.flag);
    if (key !== "all") q.set("period", key);
    const s = q.toString();
    return `/satislar/maliyet${s ? `?${s}` : ""}`;
  };

  const flagHref = (f: string) => {
    const base = segHref(periodKey);
    return `${base}${base.includes("?") ? "&" : "?"}flag=${f}`;
  };

  // Marj düğmesi: −20%..+60% aralığı 0..1'e eşlenir.
  const margin = t?.margin ?? null;
  const knobValue = margin == null ? null : (margin + 0.2) / 0.8;
  // Tuner iğnesi: son satışlı günün dönem içindeki konumu (veriden okunur,
  // saatten değil; "bugün" iğnesi değil "son sinyal" iğnesi).
  const lastTrend = dash.trend.length ? dash.trend[dash.trend.length - 1] : null;
  const dialPos = (() => {
    if (!chartPeriod.fromIso || !lastTrend) return null;
    const from = new Date(chartPeriod.fromIso).getTime();
    const to = new Date(chartPeriod.toIso).getTime();
    const at = new Date(lastTrend.date).getTime();
    return to > from ? (at - from) / (to - from) : null;
  })();
  const dialLabels = [
    chartPeriod.fromIso ? formatDate(chartPeriod.fromIso, "d MMM") : "",
    formatDate(chartPeriod.toIso, "d MMM"),
  ];
  // Önceki dönem gün indeksine göre hizalanır (panel ile aynı kural).
  const dayIndex = (dateIso: string, fromIso: string) =>
    Math.floor((new Date(dateIso).getTime() - new Date(fromIso).getTime()) / 86_400_000);
  const prevByIdx = new Map<number, number>();
  if (dashPrev && chartPrev?.fromIso)
    for (const p of dashPrev.trend) prevByIdx.set(dayIndex(p.date, chartPrev.fromIso), p.revenue);
  const points = dash.trend.map((p) => ({
    a: p.revenue,
    b: p.cost,
    c: chartPeriod.fromIso ? (prevByIdx.get(dayIndex(p.date, chartPeriod.fromIso)) ?? null) : null,
  }));
  const chartMax = Math.max(0, ...points.flatMap((p) => [p.a, p.b ?? 0]));

  const netProfit = t?.net_profit_cents ?? 0;
  const profitParts = formatMoneyParts(netProfit, cur);

  return (
    <div className="flex flex-col gap-8 pb-24">
      <PageHeader
        eyebrow="01 · Satış & Kâr"
        meta={
          syncSummary.lastSyncAt
            ? `veri ${formatDateTime(syncSummary.lastSyncAt, "dd.MM HH:mm")}'e kadar`
            : "Etsy senkronu yok"
        }
        title="Satış & Maliyet"
        description="Satılan her kalem tek satırda: Etsy'den gelen gelir, iade ve etiket; senin girdiğin altın, işçilik ve taş."
        secondary={
          <>
            <a className="ghost-link" href={`/satislar/maliyet/export?${exportQs.toString()}`}>
              CSV indir
            </a>
            <span>·</span>
            <Link className="ghost-link" href="/satislar">
              Satışlar
            </Link>
          </>
        }
      />

      {/* Üç adımlık kurulum şeridi — hepsi tamamsa kendini gizler. */}
      <CostSetupStrip
        connected={etsyStatus.status === "connected"}
        summary={syncSummary}
        refundBacklog={backlog}
        incompleteItems={t?.incomplete_items ?? 0}
        totalItems={t?.items ?? 0}
        canRun={canEdit}
      />

      {/* Defter bandı */}
      <section
        aria-label="Özet"
        className="band grid-cols-1 gap-y-6 sm:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr_1fr] xl:gap-y-0"
      >
        <div className="stat sm:pr-6">
          <Bezel>
            <Screen>
              <div className="flex justify-between">
                <span className="dim">Net kâr · {period.label}</span>
                <span className="dim">● rec</span>
              </div>
              <div className="lcd mt-2 text-[40px] leading-none tracking-[0.02em] xl:text-[44px]">
                {netProfit < 0 ? "−" : ""}
                {profitParts.main.replace(/^-/, "")}
                <span className="text-[18px] opacity-70">{profitParts.fraction}</span>
              </div>
              <FmDial pos={dialPos} labels={dialLabels} className="mt-2.5" />
              <div className="mt-1.5 flex justify-between">
                <span className="dim">
                  {margin == null ? "marj —" : `marj ${formatPercent(margin)}`}
                  {t ? ` · ${formatNumber(t.items)} kalem` : ""}
                </span>
                <span className="dim lcd text-[10px]">{cur}</span>
              </div>
            </Screen>
          </Bezel>
        </div>
        <LedgerStat
          label="Net gelir"
          value={t ? money(t.net_revenue_cents, cur) : "—"}
          foot={
            t ? (
              <>
                <span>iade −{money(t.refund_cents, cur)}</span>
                <span>·</span>
                <span>{formatNumber(t.orders)} sipariş</span>
              </>
            ) : undefined
          }
        />
        <LedgerStat
          label="Satılan malın maliyeti"
          value={t ? money(t.cogs_cents, cur) : "—"}
          foot={
            t ? (
              <>
                <span>altın {money(t.gold_cents, cur)}</span>
                <span>·</span>
                <span>işçilik {money(t.labor_cents, cur)}</span>
              </>
            ) : undefined
          }
        />
        <div className="stat decor">
          <DecorCard
            label="Maliyeti eksik"
            value={t ? formatNumber(t.incomplete_items) : "—"}
            hint="kalem · altın ya da işçilik yok"
            href={flagHref("eksik")}
          />
        </div>
      </section>

      {/* İkincil defter satırı — ücret, etiket, taş/paket, adet */}
      {t && (
        <div className="mono-label -mt-3 grid grid-cols-2 gap-x-6 gap-y-2 border-b border-[color:var(--rule-2)] pb-4 sm:grid-cols-4">
          <span>
            Etsy ücreti <b className="text-foreground font-normal">{money(t.etsy_fees_cents, cur)}</b>
            {t.net_revenue_cents > 0 && (
              <> · {formatPercent(t.etsy_fees_cents / t.net_revenue_cents)}</>
            )}
          </span>
          <span>
            Etiketler{" "}
            <b className="text-foreground font-normal">
              {money(t.shipping_label_cents + t.return_label_cents, cur)}
            </b>
          </span>
          <span>
            Taş · paket{" "}
            <b className="text-foreground font-normal">
              {money(t.gem_cents, cur)} · {money(t.packaging_cents, cur)}
            </b>
          </span>
          <span>
            Kalem · adet{" "}
            <b className="text-foreground font-normal">
              {formatNumber(t.items)} · {formatNumber(t.units)}
            </b>
          </span>
          {totalsByCur.length > 1 && (
            <span className="col-span-full normal-case tracking-normal">
              Özet yalnız {cur} kalemlerini toplar; diğer para birimleri (
              {totalsByCur.slice(1).map((x) => x.currency).join(", ")}) ayrı tutulur.
            </span>
          )}
        </div>
      )}

      {/* Gövde: sol defter tablosu · sağ göstergeler */}
      <section className="grid gap-x-12 gap-y-10 xl:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0">
          <div className="sec-h">
            <span className="num">A</span>
            <h2>Satılan kalemler</h2>
            <span className="mono-label right">
              {period.label.toLocaleLowerCase("tr-TR")} · {formatNumber(count)} kalem
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchInput placeholder="Sipariş no, ürün, SKU, alıcı…" />
            <FilterSelect
              paramKey="status"
              placeholder="Durum"
              options={SALE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
            <FilterSelect
              paramKey="flag"
              placeholder="Bayrak"
              options={[
                { value: "eksik", label: "Maliyeti eksik" },
                { value: "iade", label: "İade / iptal" },
                { value: "kar-negatif", label: "Zararına satış" },
              ]}
            />
          </div>
          <div className="mt-4">
            {rows.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={filtered ? "Bu filtreyle kalem yok" : "Henüz satılan kalem yok"}
                description={
                  filtered
                    ? "Arama, dönem, durum veya bayrak filtresine uyan satış kalemi bulunamadı."
                    : "Etsy senkronu siparişleri çekince kalemler burada listelenir."
                }
                action={
                  filtered ? (
                    <Button asChild variant="outline">
                      <Link href="/satislar/maliyet">Filtreyi temizle</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <SaleCostGrid rows={rows} canEdit={canEdit} />
                <Pagination count={count} limit={limit} offset={offset} />
                <p className="note mt-5">
                  <span className="mark">†</span>
                  <span>
                    İade etiketi Etsy API&apos;de siparişe bağlı gelmez; satış detayından elle
                    bağlanır. Boş bırakıp çıkmak elle girişi siler; motor değeri geri gelir.
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="sec-h">
            <span className="num">B</span>
            <h2>Gelir ve maliyet</h2>
            <span className="mono-label right">günlük</span>
          </div>
          <ScopeChart
            className="mt-4"
            points={points}
            startLabel={dialLabels[0].toLocaleUpperCase("tr-TR")}
            endLabel={dialLabels[1].toLocaleUpperCase("tr-TR")}
            caption={`Gelir / maliyet · ${chartPeriod.label.toLocaleLowerCase("tr-TR")}`}
            maxLabel={chartMax > 0 ? `max ${formatNumber(Math.round(chartMax))}` : undefined}
          />
          <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <Legend
                items={[
                  { label: "Gelir", kind: "neon" },
                  { label: chartPrev ? "Önceki dönem" : "Önceki dönem (yok)", kind: "dash" },
                  { label: "Maliyet", kind: "ink" },
                ]}
              />
              <SegLinks
                className="mt-3.5"
                items={PERIOD_SEG.map((p) => ({
                  label: p.label,
                  href: segHref(p.key),
                  on: periodKey === p.key,
                }))}
              />
            </div>
            <Knob
              value={knobValue}
              label="Marj"
              readout={margin == null ? "—" : formatPercent(margin)}
              className="px-2 pt-3"
            />
          </div>

          <div className="mt-6 border-t border-[color:var(--rule)] pt-4">
            <p className="mono-label mb-1.5">Dikkat · aksiyon bekleyen</p>
            <div className="flex flex-col gap-2">
              {backlog > 0 && (
                <Link href="/satislar/maliyet" className="inset-row jg-focus-outline">
                  <span>{formatNumber(backlog)} iadeli siparişin tutarı okunmadı</span>
                  <span>Etsy&apos;den çek →</span>
                </Link>
              )}
              {t && t.incomplete_items > 0 && (
                <Link href={flagHref("eksik")} className="inset-row jg-focus-outline">
                  <span>{formatNumber(t.incomplete_items)} kalemde altın ya da işçilik yok; kâr olduğundan yüksek</span>
                  <span>filtrele →</span>
                </Link>
              )}
              {negative != null && negative > 0 && (
                <Link href={flagHref("kar-negatif")} className="inset-row jg-focus-outline">
                  <span>{formatNumber(negative)} kalem zararına satıldı</span>
                  <span>gör →</span>
                </Link>
              )}
              {backlog === 0 && (!t || t.incomplete_items === 0) && !(negative && negative > 0) && (
                <div className="inset-row">
                  <span>Bekleyen aksiyon yok</span>
                  <span>✓</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
