import Link from "next/link";
import { Plus, Pencil, Wallet, Gem } from "lucide-react";
import { SceneCutouts } from "@/components/scene-cutouts";

import { listCosts, listCostCategories } from "@/lib/db/queries/costs";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { OrgMark } from "@/components/brand/org-mark";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { CornerMarks } from "@/components/brand/corner-marks";
import { EditorialCard } from "@/components/brand/editorial-card";
import { EmptyState } from "@/components/empty-state";
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
import { Pagination } from "@/components/data-table/pagination";
import { DeleteButton } from "@/components/data-table/delete-button";
import { deleteCost } from "./actions";

export default async function MaliyetlerPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const search = strParam(sp.search);
  const categoryId = strParam(sp.category);
  const offset = numParam(sp.offset);
  const limit = 25;

  const [{ rows, count }, categories] = await Promise.all([
    listCosts({ search, categoryId, limit, offset }),
    listCostCategories(),
  ]);
  const catOptions = categories.map((c) => ({ value: c.id, label: c.label_tr }));

  return (
    <div className="relative z-0 space-y-8 pb-28">
      <SceneCutouts page="maliyetler" />
      <GoldStream motif="scale" />
      <PageHeader
        title="Maliyetler"
        description="Malzeme, kargo, Etsy ücretleri, reklam ve diğer giderler"
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/maliyetler/altin-maliyet">
                <Gem />
                Altin Maliyet
              </Link>
            </Button>
            <Button asChild>
              <Link href="/maliyetler/yeni">
                <Plus />
                Yeni Maliyet
              </Link>
            </Button>
          </>
        }
      />

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Maliyetler / 01 · Atölye</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>
      {/* Tek, sessiz marka aksanı — atölye/malzeme temasıyla maliyet sayfasına
          zarif bir giriş (galeri değil, tek kompakt banner). Sayfanın hero
          anı: Spatial köşe işaretleri (dekoratif sarmalayıcı). */}
      <div className="relative">
        <EditorialCard
          compact
          heightClassName="h-[200px]"
          image="/brand/gallery/aydinlik-nugget.webp"
          video="/brand/video/altin-yuzuk-yukselis.mp4"
          eyebrow="Atölye"
          title="Zarafetin sadeliği"
          subtitle="Her maliyet, som altın el işçiliğinin arkasındaki değer."
        />
        <CornerMarks />
      </div>

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Maliyetler / 02 · Kayıtlar</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>
      {/* Kayıt tablosu kabı — bölüm hiyerarşisinde tablo yüzeyi: dikey oluklu
          cam (.glass-fluted). Yarıçapı Card'dan (rounded-[26px]) devralır. */}
      <Card className="glass-fluted">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Açıklama, tedarikçi…" />
            <FilterSelect
              paramKey="category"
              placeholder="Kategori"
              options={catOptions}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Maliyet kaydı yok"
              description="Henüz gider kaydı yok. İlk maliyetinizi ekleyin."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right whitespace-nowrap">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(c.cost_date)}
                    </TableCell>
                    {/* Uzun açıklama kayıt satırında tek satır kalır; sınırlı
                        genişliği taşarsa yatay kaydırılır (.scroll-x) — kırpılıp
                        gizlenmez; tam metin title tooltip'inde de durur. */}
                    <TableCell className="font-medium">
                      <div
                        className="scroll-x max-w-[260px] xl:max-w-[340px]"
                        title={c.description}
                      >
                        {c.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {c.category?.label_tr ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.vendor ?? "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatMoney(c.amount_cents, c.currency)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        {c.source !== "gold_auto" && (
                          <>
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/maliyetler/${c.id}/duzenle`}>
                                <Pencil className="size-4" />
                                <span className="sr-only">Düzenle</span>
                              </Link>
                            </Button>
                            <DeleteButton action={deleteCost} id={c.id} />
                          </>
                        )}
                        {c.source === "gold_auto" && (
                          <Badge variant="outline" className="text-xs">
                            Otomatik
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination count={count} limit={limit} offset={offset} />
        </CardContent>
      </Card>
    </div>
  );
}
