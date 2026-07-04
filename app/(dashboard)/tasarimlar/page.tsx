import Link from "next/link";
import { Plus, Pencil, Package, Layers, LayoutGrid } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listDesigns } from "@/lib/db/queries/designs";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { DESIGN_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { EmptyState } from "@/components/empty-state";
import { DesignStatusBadge } from "@/components/design-status-badge";
import { EtsyListingGrid, type ProductListing } from "@/components/etsy-listing-grid";
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
import { deleteDesign } from "./actions";

export const metadata = { title: "Tasarımlar" };

export default async function TasarimlarPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const status = strParam(sp.status);
  const search = strParam(sp.search);
  const offset = numParam(sp.offset);
  const limit = 25;

  const m = await requireMembership();
  const supabase = await createClient();

  const [{ rows, count }, { data: products }] = await Promise.all([
    listDesigns(m.org_id, { status, search, limit, offset }),
    supabase
      .from("products")
      .select(
        "id, title, status, price_cents, currency, url, image_url, description, tags, materials, num_images, quantity, weight_grams",
      )
      .eq("org_id", m.org_id)
      .eq("status", "active")
      .order("title", { ascending: true })
      .limit(200),
  ]);
  const listings = (products ?? []) as unknown as ProductListing[];

  return (
    <div className="relative z-0 pb-28 space-y-8">
      <GoldStream motif="ring" />
      <PageHeader
        title="Tasarımlar"
        description="Tasarım hattını (taslak → onaylandı → yayında → arşiv) yönetin ve ürünlerle ilişkilendirin"
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/tasarimlar/pano">
                <LayoutGrid />
                Tasarım Panoları
              </Link>
            </Button>
            <Button asChild>
              <Link href="/tasarimlar/yeni">
                <Plus />
                Yeni Tasarım
              </Link>
            </Button>
          </>
        }
      />

      {/* ── Tasarım Hattı ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Ad, açıklama…" />
            <FilterSelect
              paramKey="status"
              placeholder="Durum"
              options={[...DESIGN_STATUSES]}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Tasarım yok"
              description="İlk tasarım kaydınızı oluşturun; durumunu ve ilişkili ürünü takip edin."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Etiketler</TableHead>
                  <TableHead className="text-right">Versiyon</TableHead>
                  <TableHead>Güncellendi</TableHead>
                  <TableHead className="w-1 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="max-w-[240px] truncate font-medium">
                      <Link
                        href={`/tasarimlar/${d.id}/duzenle`}
                        className="hover:underline"
                      >
                        {d.name}
                      </Link>
                      {d.description && (
                        <span className="text-muted-foreground block truncate text-xs font-normal">
                          {d.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DesignStatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {d.tags && d.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {d.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs font-normal">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      v{d.version}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(d.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/tasarimlar/${d.id}/duzenle`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Düzenle</span>
                          </Link>
                        </Button>
                        <DeleteButton action={deleteDesign} id={d.id} />
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

      {/* ── Etsy Listingleri (referans katalog) ──────────────────── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">
            Etsy Listingleri ({listings.length})
          </h3>
          <p className="text-muted-foreground text-sm">
            Etsy mağazasından senkronize edilen aktif ürün listingleri — ağırlık
            girişi burada
          </p>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Package className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">
                Henüz senkronize edilmiş listing yok. Etsy entegrasyonunu
                ayarlar sayfasından bağlayabilirsiniz.
              </p>
            </CardContent>
          </Card>
        ) : (
          <EtsyListingGrid listings={listings} />
        )}
      </section>
    </div>
  );
}
