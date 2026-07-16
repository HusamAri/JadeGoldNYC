import Link from "next/link";
import {
  Plus,
  Calculator,
  Scale,
  LayoutGrid,
  ImageOff,
  ExternalLink,
  Package,
  SearchX,
  Wand2,
} from "lucide-react";
import {
  Gem,
  Scale as LuxScale,
  TrendingUp,
} from "@/components/icons/lux-art";

import { requireMembership } from "@/lib/auth";
import { listListingsIndex } from "@/lib/db/queries/listings";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney } from "@/lib/money";
import { formatNumber } from "@/lib/format";
import { OrgMark } from "@/components/brand/org-mark";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { CornerMarks } from "@/components/brand/corner-marks";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const metadata = { title: "Listeler" };

/** Etsy listing durumları (sync `l.state`den gelir) + Türkçe etiket/rozet. */
const LISTING_STATUSES: {
  value: string;
  label: string;
  variant: "success" | "secondary" | "outline" | "warning" | "destructive";
}[] = [
  { value: "active", label: "Aktif", variant: "success" },
  { value: "edit", label: "Düzenlemede", variant: "secondary" },
  { value: "draft", label: "Taslak", variant: "secondary" },
  { value: "inactive", label: "Pasif", variant: "outline" },
  { value: "sold_out", label: "Tükendi", variant: "warning" },
  { value: "expired", label: "Süresi doldu", variant: "destructive" },
  // Panel yaşam-döngüsü filtresi (Etsy durumu değil): arşivlenenler
  // varsayılan listeden gizlidir, yalnız bu seçenekle görünür.
  { value: "arsiv", label: "Arşiv (panel)", variant: "outline" },
];

function statusMeta(status: string | null) {
  return (
    LISTING_STATUSES.find((s) => s.value === status) ?? {
      value: status ?? "",
      label: status ?? "—",
      variant: "outline" as const,
    }
  );
}

export default async function ListelerPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const search = strParam(sp.search);
  const status = strParam(sp.status);

  await requireMembership();
  const rows = await listListingsIndex({ search, status });

  const total = rows.length;
  const active = rows.filter((r) => r.status === "active").length;
  const missingWeight = rows.filter((r) => r.missing_weight_count > 0).length;
  const noKeyword = rows.filter(
    (r) => !(r.research_keyword ?? "").trim(),
  ).length;
  const filtered = Boolean(search || status);

  return (
    <div className="relative z-0 space-y-6 pb-28">
      <GoldStream motif="ring" />
      <PageHeader
        title="Listeler"
        description="Tüm Etsy listingleri tek sayfada — varyantlar, rakip fiyatlar, reklam performansı ve eksik alanlar listing detayında"
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/tasarimlar/varyant-hesapla">
                <Calculator />
                Otomatik Varyant
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tasarimlar/pano">
                <LayoutGrid />
                Yeni Tasarım Panosu
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tasarimlar/etsy-agirlik">
                <Scale />
                Etsy&apos;ye Ağırlık
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tasarimlar/iyilestir">
                <Wand2 />
                İyileştir
              </Link>
            </Button>
            <Button asChild>
              <Link href="/tasarimlar/listing/yeni">
                <Plus />
                Yeni Listing
              </Link>
            </Button>
          </>
        }
      />

      {/* Özet — liste filtresine (durum/arama) saygı duyar */}
      <section className="space-y-4">
        <div aria-hidden className="idx">
          <span>Listeler / 01 · Özet</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          <span><OrgMark /></span>
        </div>
        {filtered && (
          <p className="text-muted-foreground text-xs">
            Özet, uygulanan filtreye göre hesaplanır.
          </p>
        )}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard
              label="Toplam Listing"
              value={formatNumber(total)}
              icon={Gem}
            />
            <KpiCard
              label="Aktif"
              value={formatNumber(active)}
              icon={TrendingUp}
              accent="positive"
            />
            <KpiCard
              label="Eksik Gramlı"
              value={formatNumber(missingWeight)}
              icon={LuxScale}
              accent={missingWeight > 0 ? "negative" : "default"}
              hint="En az bir varyantında gram yok"
            />
            <KpiCard
              label="Kelimesiz"
              value={formatNumber(noKeyword)}
              icon={SearchX}
              accent={noKeyword > 0 ? "negative" : "default"}
              hint="Araştırma kelimesi girilmemiş"
            />
          </div>
          <CornerMarks />
        </div>
      </section>

      <div aria-hidden className="idx -mb-3">
        <span>Listeler / 02 · Listingler</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Başlık veya SKU…" />
            <FilterSelect
              paramKey="status"
              placeholder="Durum"
              options={LISTING_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
          </div>

          {rows.length === 0 ? (
            // Aktif filtre/aramada "kayıt yok" yanıltır — filtre sonucu boş
            // olduğunu söyle ve tek tıkla temizleme yolu sun.
            filtered ? (
              <EmptyState
                icon={Package}
                title="Bu filtreyle sonuç yok"
                description="Arama veya durum filtresine uyan listing bulunamadı. Filtreyi temizleyip tüm listingleri görebilirsiniz."
                action={
                  <Button asChild variant="outline">
                    <Link href="/tasarimlar">Filtreyi temizle</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Package}
                title="Listing yok"
                description="Henüz listing bulunamadı. Etsy senkronu ayarlar sayfasından çalıştırın veya 'Yeni Listing' ile taslak açın."
                action={
                  <Button asChild>
                    <Link href="/tasarimlar/listing/yeni">
                      <Plus />
                      Yeni Listing
                    </Link>
                  </Button>
                }
              />
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Görsel</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                  <TableHead className="text-right">Varyant</TableHead>
                  <TableHead>Kelime</TableHead>
                  <TableHead className="text-right">Reklam · 30g</TableHead>
                  <TableHead className="w-1 text-right">Etsy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const sm = statusMeta(r.status);
                  const keyword = (r.research_keyword ?? "").trim();
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link
                          href={`/tasarimlar/listing/${r.id}`}
                          className="bg-muted block size-10 overflow-hidden rounded-lg"
                        >
                          {r.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.image_url}
                              alt={r.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-muted-foreground/50 flex h-full items-center justify-center">
                              <ImageOff className="size-4" />
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <Link
                          href={`/tasarimlar/listing/${r.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {r.title}
                        </Link>
                        {r.etsy_listing_id != null && (
                          <span className="text-muted-foreground font-mono text-xs tabular-nums">
                            #{r.etsy_listing_id}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sm.variant}>{sm.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.price_cents != null
                          ? formatMoney(r.price_cents, r.currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tabular-nums">{r.variant_count}</span>
                        {r.missing_weight_count > 0 && (
                          <span className="ml-2 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-600 tabular-nums dark:text-amber-300">
                            {r.missing_weight_count} gramsız
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        {keyword ? (
                          <Badge
                            variant={r.has_research ? "success" : "outline"}
                            className="max-w-full"
                            title={
                              r.has_research
                                ? "Rakip araştırması var"
                                : "Henüz rakip araştırması yok"
                            }
                          >
                            <span className="truncate normal-case tracking-normal">
                              {keyword}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
                            kelime yok
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.ads30_spend_cents != null
                          ? formatMoney(r.ads30_spend_cents, r.currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.etsy_listing_id != null ? (
                          <Button asChild variant="ghost" size="icon">
                            <a
                              href={`https://www.etsy.com/listing/${r.etsy_listing_id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="size-4" />
                              <span className="sr-only">Etsy&apos;de aç</span>
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <p className="text-muted-foreground text-xs">
            {formatNumber(total)} listing gösteriliyor — tümü tek sayfada,
            sayfalama yok.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
