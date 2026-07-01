import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, ExternalLink, Package, Layers } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listDesigns } from "@/lib/db/queries/designs";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { DESIGN_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DesignStatusBadge } from "@/components/design-status-badge";
import { ProductWeightInput } from "@/components/product-weight-input";
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

interface ProductListing {
  id: string;
  title: string;
  status: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
  image_url: string | null;
  description: string | null;
  tags: string[] | null;
  materials: string[] | null;
  num_images: number | null;
  quantity: number | null;
  weight_grams: number | null;
}

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
    <div className="space-y-8">
      <PageHeader
        title="Tasarımlar"
        description="Tasarım hattını (taslak → onaylandı → yayında → arşiv) yönetin ve ürünlerle ilişkilendirin"
        action={
          <Button asChild>
            <Link href="/tasarimlar/yeni">
              <Plus />
              Yeni Tasarım
            </Link>
          </Button>
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
            Etsy mağazasından senkronize edilen aktif ürün listingleri
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                {p.image_url ? (
                  <div className="bg-muted relative aspect-square">
                    <Image
                      src={p.image_url}
                      alt={p.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="from-primary/20 to-accent/30 flex aspect-square items-center justify-center bg-gradient-to-br">
                    <Package className="text-muted-foreground size-12" />
                  </div>
                )}
                <CardContent className="space-y-2 p-4">
                  <h4 className="line-clamp-2 text-sm font-medium leading-tight">
                    {p.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.price_cents != null && (
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(p.price_cents, p.currency)}
                      </span>
                    )}
                    {p.quantity != null && (
                      <Badge variant="secondary" className="text-xs">
                        Stok: {p.quantity}
                      </Badge>
                    )}
                    {p.num_images != null && p.num_images > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {p.num_images} görsel
                      </Badge>
                    )}
                  </div>
                  <ProductWeightInput
                    productId={p.id}
                    initialGrams={p.weight_grams}
                  />
                  {p.materials && p.materials.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.materials.slice(0, 5).map((mat) => (
                        <Badge
                          key={mat}
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {mat}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                    >
                      Etsy&apos;de gör
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
