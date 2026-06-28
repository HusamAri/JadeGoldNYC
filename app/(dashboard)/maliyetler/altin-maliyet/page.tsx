import Link from "next/link";
import { ArrowLeft, Gem, AlertTriangle, Scale } from "lucide-react";

import { getGoldCostAnalysis } from "@/lib/db/queries/gold-cost";
import { TROY_OUNCE_GRAMS, type KaratType } from "@/lib/gold-cost";
import { getGoldPricePerOunce } from "@/lib/gold-price";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { numParam, type RawSearchParams } from "@/lib/searchparams";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { RetroactiveButton } from "./retroactive-button";

export const metadata = { title: "Altın Maliyet Analizi" };

function fmtUsd(usd: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

function fmtGram(g: number): string {
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(g)}g`;
}

function karatBadgeVariant(k: KaratType) {
  return k === "14K" ? "default" : "secondary";
}

export default async function AltinMaliyetPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const livePrice = await getGoldPricePerOunce();
  const goldPriceOunce = numParam(sp.ons, livePrice);
  const goldPricePerGram = goldPriceOunce / TROY_OUNCE_GRAMS;

  const { items, summary } = await getGoldCostAnalysis(goldPriceOunce);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Altin Maliyet Analizi"
        description="Satilan urunlerin altin malzeme + iscilik maliyet kirilimi"
        action={
          <div className="flex items-center gap-2">
            <RetroactiveButton />
            <Button asChild variant="outline">
              <Link href="/maliyetler">
                <ArrowLeft />
                Maliyetler
              </Link>
            </Button>
          </div>
        }
      />

      {/* ── Altın Fiyat Bilgisi ─────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Scale className="text-muted-foreground size-4" />
            <span className="text-muted-foreground">Altin Ons Fiyati:</span>
            <span className="font-semibold tabular-nums">
              {fmtUsd(goldPriceOunce)}
            </span>
          </div>
          <div className="text-muted-foreground">|</div>
          <div>
            <span className="text-muted-foreground">Gram Fiyati (24K): </span>
            <span className="font-semibold tabular-nums">
              {fmtUsd(goldPricePerGram)}
            </span>
          </div>
          <div className="text-muted-foreground">|</div>
          <div>
            <span className="text-muted-foreground">14K Gram Degeri: </span>
            <span className="font-semibold tabular-nums">
              {fmtUsd(goldPricePerGram * 0.585)}
            </span>
          </div>
          <div className="text-muted-foreground">|</div>
          <div>
            <span className="text-muted-foreground">10K Gram Degeri: </span>
            <span className="font-semibold tabular-nums">
              {fmtUsd(goldPricePerGram * 0.416)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI'lar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Analiz Edilen Kalem"
          value={`${summary.analyzedItems} / ${summary.totalItems}`}
          icon={Gem}
        />
        <KpiCard
          label="Toplam Alim Maliyeti"
          value={formatMoney(summary.totalPurchaseCostCents)}
          icon={Scale}
        />
        <KpiCard
          label="Altin Malzeme Degeri"
          value={formatMoney(summary.totalGoldCostCents)}
        />
        <KpiCard
          label="Toplam Iscilik"
          value={formatMoney(summary.totalLaborCostCents)}
        />
      </div>

      {/* ── Ayar Bazlı Kırılım ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["14K", "10K"] as const).map((k) => {
          const s = summary.byKarat[k];
          return (
            <Card key={k}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={karatBadgeVariant(k)}>{k}</Badge>
                  Ozet
                </CardTitle>
              </CardHeader>
              <CardContent>
                {s.count === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Bu ayarda analiz edilen kalem yok.
                  </p>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Kalem Sayisi</dt>
                    <dd className="font-medium tabular-nums">{s.count}</dd>
                    <dt className="text-muted-foreground">Satis Geliri</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(s.revenueCents)}
                    </dd>
                    <dt className="text-muted-foreground">Altin Degeri</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(s.goldCostCents)}
                    </dd>
                    <dt className="text-muted-foreground">Iscilik Tutari</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(s.laborCostCents)}
                    </dd>
                    <dt className="text-muted-foreground">Alim Maliyeti</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(s.purchaseCostCents)}
                    </dd>
                    <dt className="text-muted-foreground">Iscilik Orani</dt>
                    <dd className="font-medium tabular-nums">
                      {formatPercent(s.avgLaborMarkup)}
                    </dd>
                  </dl>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Detay Tablosu ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Kalem Detaylari</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={Gem}
              title="Satis kalemi yok"
              description="Henuz analiz edilecek satis kalemi bulunamadi."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Urun</TableHead>
                    <TableHead>Ayar</TableHead>
                    <TableHead className="text-right">Agirlik</TableHead>
                    <TableHead className="text-right">Satis Fiyati</TableHead>
                    <TableHead className="text-right">Altin Degeri</TableHead>
                    <TableHead className="text-right">Iscilik</TableHead>
                    <TableHead className="text-right">Alim Maliyeti</TableHead>
                    <TableHead className="text-right">Iscilik %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.saleItemId}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.orderDate)}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        {item.karat ? (
                          <Badge variant={karatBadgeVariant(item.karat)}>
                            {item.karat}
                          </Badge>
                        ) : (
                          <span
                            className="text-muted-foreground inline-flex items-center gap-1 text-xs"
                            title="Ayar tespit edilemedi"
                          >
                            <AlertTriangle className="size-3" /> ?
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.weightGrams != null ? fmtGram(item.weightGrams) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.lineTotalCents)}
                      </TableCell>
                      {item.cost ? (
                        <>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(item.cost.totalGoldCostCents)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(item.cost.totalLaborCostCents)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(item.cost.totalPurchaseCostCents)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPercent(item.cost.laborMarkup)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-muted-foreground text-right text-xs">
                            —
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right text-xs">
                            —
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right text-xs">
                            —
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right text-xs">
                            —
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {summary.unanalyzedItems > 0 && (
            <div className="bg-muted/50 mt-4 flex items-start gap-2 rounded-lg p-3 text-sm">
              <AlertTriangle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <p className="text-muted-foreground">
                <strong>{summary.unanalyzedItems}</strong> kalemde ayar veya agirlik
                tespit edilemedi. Bu kalemler toplam hesaplamaya dahil edilmedi.
                Urun basliginda &quot;10K&quot; / &quot;14K&quot; ve agirlik
                (orn. &quot;8.5g&quot;) bilgisi bulunmalidir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
