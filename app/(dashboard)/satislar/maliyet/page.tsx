import Link from "next/link";
import { ArrowLeft, Download, Receipt } from "lucide-react";

import { requireMembership, isManager } from "@/lib/auth";
import {
  countRefundBacklog,
  getSaleItemPnlTotals,
  listSaleItemPnl,
  type PnlListOptions,
} from "@/lib/db/queries/sale-costs";
import { resolvePeriod } from "@/lib/period";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { SALE_STATUSES } from "@/lib/constants";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber } from "@/lib/format";
import { OrgMark } from "@/components/brand/org-mark";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/data-table/search-input";
import { FilterSelect } from "@/components/data-table/filter-select";
import { Pagination } from "@/components/data-table/pagination";
import { PeriodSelector } from "@/components/period-selector";
import { SaleCostGrid } from "@/components/sales/sale-cost-grid";
import { CostSetupStrip } from "@/components/sales/cost-setup-strip";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getLastSyncSummary } from "@/lib/etsy/sync";

export const metadata = { title: "Satış & Maliyet Takibi" };

// Etsy çekimi (EtsySyncButton) server action'ı bu rota üzerinden koşar;
// ayarlar/etsy ile aynı gerekçeyle fonksiyon süresi uzatılır.
export const maxDuration = 60;

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "pos" | "neg" | "warn";
}) {
  return (
    <div className="nm-pressed rounded-[1.25rem] px-4 py-3">
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {label}
      </p>
      <p
        className={
          "font-mono text-lg font-semibold tabular-nums " +
          (tone === "neg"
            ? "text-destructive"
            : tone === "pos"
              ? "text-emerald-700 dark:text-emerald-400"
              : tone === "warn"
                ? "text-amber-700 dark:text-amber-400"
                : "")
        }
      >
        {value}
      </p>
      {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
    </div>
  );
}

/**
 * Satış & Maliyet Takibi — Excel "etsy-satis-maliyet-takip" yüzeyinin panel
 * karşılığı. Satılan kalemler Etsy'den gelir; altın/işçilik/taş/paket satırda
 * girilir; iade, Etsy ücreti ve kargo/iade etiketi aynı satırda okunur.
 * Vergi gelir sayılmaz; marj = net kâr / net gelir.
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

  const [{ rows, count }, totalsByCur, backlog, etsyStatus, syncSummary] =
    await Promise.all([
      listSaleItemPnl(m.org_id, { ...opts, limit, offset }),
      getSaleItemPnlTotals(m.org_id, opts),
      countRefundBacklog(m.org_id),
      getEtsyStatus(m.org_id),
      getLastSyncSummary(m.org_id),
    ]);
  const primary = totalsByCur[0];
  const filtered = Boolean(search || status || opts.flag || periodKey !== "all");

  const exportQs = new URLSearchParams();
  if (search) exportQs.set("search", search);
  if (status) exportQs.set("status", status);
  if (opts.flag) exportQs.set("flag", opts.flag);
  if (periodKey !== "all") exportQs.set("period", periodKey);

  return (
    <div className="page-stack relative z-0 pb-32">
      <PageHeader
        title="Satış & Maliyet Takibi"
        eyebrow="Satışlar"
        description="Excel'in panel hâli: her satılan kalem tek satırda, maliyetini hücreye yaz, net kârı anında gör."
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/satislar">
                <ArrowLeft />
                Satışlar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`/satislar/maliyet/export?${exportQs.toString()}`}>
                <Download />
                CSV
              </a>
            </Button>
          </>
        }
      />

      {/* Üç adımlık kurulum şeridi: Etsy çekimi, iade geri doldurma ve maliyet
          girişi AYNI sayfada; hepsi tamamsa şerit kendini gizler. */}
      <CostSetupStrip
        connected={etsyStatus.status === "connected"}
        summary={syncSummary}
        refundBacklog={backlog}
        incompleteItems={primary?.totals.incomplete_items ?? 0}
        totalItems={primary?.totals.items ?? 0}
        canRun={canEdit}
      />

      <div aria-hidden className="idx sm:-mb-4">
        <span>Satışlar / 01 · Özet</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>

      <Card className="glass-board">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchInput placeholder="Sipariş no, ürün, SKU, alıcı…" />
            <PeriodSelector />
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

          {primary ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                <Stat
                  label="Kalem · Adet"
                  value={`${formatNumber(primary.totals.items)} · ${formatNumber(primary.totals.units)}`}
                  hint={`${formatNumber(primary.totals.orders)} sipariş`}
                />
                <Stat
                  label="Net gelir"
                  value={formatMoney(primary.totals.net_revenue_cents, primary.currency)}
                  hint={`iade −${formatMoney(primary.totals.refund_cents, primary.currency)}`}
                />
                <Stat
                  label="Etsy ücreti"
                  value={formatMoney(primary.totals.etsy_fees_cents, primary.currency)}
                  hint={
                    primary.totals.net_revenue_cents > 0
                      ? formatPercent(
                          primary.totals.etsy_fees_cents / primary.totals.net_revenue_cents,
                        ) + " / gelir"
                      : undefined
                  }
                />
                <Stat
                  label="Etiketler"
                  value={formatMoney(
                    primary.totals.shipping_label_cents + primary.totals.return_label_cents,
                    primary.currency,
                  )}
                  hint={`iade etiketi ${formatMoney(primary.totals.return_label_cents, primary.currency)}`}
                />
                <Stat
                  label="COGS"
                  value={formatMoney(primary.totals.cogs_cents, primary.currency)}
                  hint={`altın ${formatMoney(primary.totals.gold_cents, primary.currency)} · işçilik ${formatMoney(primary.totals.labor_cents, primary.currency)}`}
                />
                <Stat
                  label="Taş · Paket"
                  value={`${formatMoney(primary.totals.gem_cents, primary.currency)} · ${formatMoney(primary.totals.packaging_cents, primary.currency)}`}
                  hint={
                    primary.totals.recovered_cents > 0
                      ? `geri kazanım −${formatMoney(primary.totals.recovered_cents, primary.currency)}`
                      : undefined
                  }
                />
                <Stat
                  label="Net kâr"
                  value={formatMoney(primary.totals.net_profit_cents, primary.currency)}
                  tone={primary.totals.net_profit_cents < 0 ? "neg" : "pos"}
                  hint={
                    primary.totals.margin == null
                      ? "marj —"
                      : `marj ${formatPercent(primary.totals.margin)}`
                  }
                />
                <Stat
                  label="Eksik künye"
                  value={formatNumber(primary.totals.incomplete_items)}
                  tone={primary.totals.incomplete_items > 0 ? "warn" : undefined}
                  hint={
                    primary.totals.refund_unknown_items > 0
                      ? `${formatNumber(primary.totals.refund_unknown_items)} iade tutarı bekliyor`
                      : "altın + işçilik girilmemiş kalem"
                  }
                />
              </div>
              {totalsByCur.length > 1 && (
                <p className="text-muted-foreground text-xs">
                  Özet yalnız {primary.currency} kalemlerini toplar; diğer para
                  birimleri ({totalsByCur.slice(1).map((t) => t.currency).join(", ")})
                  ayrı tutulur, tek sayıya karıştırılmaz.
                </p>
              )}
              {primary.totals.incomplete_items > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {formatNumber(primary.totals.incomplete_items)} kalemde altın veya
                  işçilik yok → bu satırların net kârı olduğundan YÜKSEK görünür.
                  Satırdaki maliyet hücrelerine yazın; gram girilmiş varyantlarda
                  altın motoru otomatik doldurur.
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <div aria-hidden className="idx sm:-mb-4">
        <span>Satışlar / 02 · Kalemler</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>

      <Card className="glass-fluted">
        <CardContent className="space-y-4">
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
              <p className="text-muted-foreground text-xs">
                Soluk italik rakam = altın motorunun otomatik değeri (gram × ayar
                alım fiyatı). Üzerine yazınca elle giriş olur ve motor o kaleme
                bir daha dokunmaz. Boş bırakıp çıkmak elle girişi siler.
                İade etiketi Etsy API&apos;de siparişe bağlı gelmez; satış detayından
                elle bağlanır.
              </p>
              <SaleCostGrid rows={rows} canEdit={canEdit} />
              <Pagination count={count} limit={limit} offset={offset} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
