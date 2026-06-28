import Link from "next/link";
import { Plus, Pencil, Wallet, Gem } from "lucide-react";

import { listCosts, listCostCategories } from "@/lib/db/queries/costs";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
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
    <div>
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

      <Card>
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
                  <TableHead className="w-1 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatDate(c.cost_date)}</TableCell>
                    <TableCell className="font-medium">
                      {c.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {c.category?.label_tr ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.vendor ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(c.amount_cents, c.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/maliyetler/${c.id}/duzenle`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Düzenle</span>
                          </Link>
                        </Button>
                        <DeleteButton action={deleteCost} id={c.id} />
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
