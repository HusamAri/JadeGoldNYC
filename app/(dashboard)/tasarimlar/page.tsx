import Link from "next/link";
import { Plus, Pencil, Package, Layers, ImageOff, MessageSquare, Scale, Calculator } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listDesigns } from "@/lib/db/queries/designs";
import {
  listCollections,
  getDesignThumbs,
} from "@/lib/db/queries/design-boards";
import type { Design } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { EmptyState } from "@/components/empty-state";
import { DesignStatusBadge } from "@/components/design-status-badge";
import { NewCollectionForm } from "@/components/design-board/new-collection-form";
import { PanoVideoBackground } from "@/components/brand/pano-video-background";
import { EtsyListingGrid, type ProductListing } from "@/components/etsy-listing-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/data-table/delete-button";
import { deleteDesign } from "./actions";

export const metadata = { title: "Listeler" };

type DesignRow = Design & { collection_id: string | null };

export default async function TasarimlarPage() {
  const m = await requireMembership();
  const supabase = await createClient();

  const [{ rows }, collections, thumbs, { data: products }] = await Promise.all([
    listDesigns(m.org_id, { limit: 500, withCount: false }),
    listCollections(m.org_id),
    getDesignThumbs(m.org_id),
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

  const designs = rows as unknown as DesignRow[];
  const listings = (products ?? []) as unknown as ProductListing[];

  // Koleksiyona göre grupla
  const byCollection = new Map<string | null, DesignRow[]>();
  for (const d of designs) {
    const key = d.collection_id ?? null;
    const list = byCollection.get(key) ?? [];
    list.push(d);
    byCollection.set(key, list);
  }
  const groups: { id: string | null; name: string; designs: DesignRow[] }[] = [
    ...collections.map((c) => ({
      id: c.id,
      name: c.name,
      designs: byCollection.get(c.id) ?? [],
    })),
  ];
  const uncategorized = byCollection.get(null) ?? [];
  if (uncategorized.length > 0) {
    groups.push({ id: null, name: "Koleksiyonsuz", designs: uncategorized });
  }

  return (
    <div className="relative z-0 space-y-8 pb-28">
      <PanoVideoBackground />
      <GoldStream motif="ring" />
      <PageHeader
        title="Listeler"
        description="Ürün listeleri ve tasarım panoları — yeni liste için otomatik varyant (ağırlık↔beden, fiyat↔ağırlık) hesapla; tasarımları koleksiyon panolarında yönet"
        action={
          <>
            <NewCollectionForm />
            <Button asChild variant="outline">
              <Link href="/tasarimlar/varyant-hesapla">
                <Calculator />
                Otomatik Varyant
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tasarimlar/etsy-agirlik">
                <Scale />
                Etsy&apos;ye Ağırlık
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

      <div className="idx">
        <span>Yeni Tasarım Panosu</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span className="normal-case">koleksiyon panoları</span>
      </div>

      {designs.length === 0 && collections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Tasarım yok"
          description="Bir koleksiyon oluşturun ve 'Yeni Tasarım' ile ürün tasarımlarınızı ekleyin; her tasarıma mockup görseli + not ekleyebilirsiniz."
        />
      ) : (
        groups.map((g) => (
          <section key={g.id ?? "none"} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-xl leading-tight">{g.name}</h3>
              <span className="text-muted-foreground text-sm tabular-nums">
                {g.designs.length}
              </span>
            </div>
            {g.designs.length === 0 ? (
              <p className="text-muted-foreground rounded-2xl border border-dashed p-5 text-sm">
                Bu koleksiyonda tasarım yok. &quot;Yeni Tasarım&quot; eklerken bu
                koleksiyonu seçin.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {g.designs.map((d) => {
                  const thumb = thumbs.get(d.id);
                  return (
                    <Card key={d.id} className="gap-0 overflow-hidden p-0">
                      <Link
                        href={`/tasarimlar/${d.id}/duzenle`}
                        className="bg-muted block aspect-video w-full overflow-hidden"
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={d.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground/50 flex h-full items-center justify-center">
                            <ImageOff aria-hidden className="size-6" />
                          </span>
                        )}
                      </Link>
                      <div className="flex items-start justify-between gap-1 px-3 py-2.5">
                        <div className="min-w-0">
                          <Link
                            href={`/tasarimlar/${d.id}/duzenle`}
                            className="block truncate text-sm font-medium hover:underline"
                          >
                            {d.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-1.5">
                            <DesignStatusBadge status={d.status} />
                            {thumb && (
                              <MessageSquare
                                aria-hidden
                                className="text-muted-foreground size-3"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0">
                          <Button asChild variant="ghost" size="icon" className="size-8">
                            <Link href={`/tasarimlar/${d.id}/duzenle`}>
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Düzenle</span>
                            </Link>
                          </Button>
                          <DeleteButton action={deleteDesign} id={d.id} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        ))
      )}

      {/* ── Etsy Listingleri (referans katalog) ──────────────────── */}
      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <h3 className="font-serif text-xl leading-tight">Etsy Listingleri</h3>
            <span className="text-muted-foreground text-sm tabular-nums">
              {listings.length}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Etsy mağazasından senkronize edilen aktif ürün listingleri — ağırlık
            girişi burada
          </p>
        </div>

        {listings.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <Package aria-hidden className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">
                Henüz senkronize edilmiş listing yok. Etsy entegrasyonunu ayarlar
                sayfasından bağlayabilirsiniz.
              </p>
            </div>
          </Card>
        ) : (
          <EtsyListingGrid listings={listings} />
        )}
      </section>
    </div>
  );
}
