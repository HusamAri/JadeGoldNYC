import Image from "next/image";
import { ExternalLink, ImagePlus, Package } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BRAND_GALLERY } from "@/lib/brand-assets";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import { BrandTile } from "@/components/brand/brand-tile";
import { ProductWeightInput } from "@/components/product-weight-input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export const metadata = { title: "Marka Tasarımları" };

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

export default async function TasarimlarPage() {
  const m = await requireMembership();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, title, status, price_cents, currency, url, image_url, description, tags, materials, num_images, quantity, weight_grams",
    )
    .eq("org_id", m.org_id)
    .eq("status", "active")
    .order("title", { ascending: true })
    .limit(200);
  const listings = (products ?? []) as unknown as ProductListing[];
  return (
    <div className="space-y-8">
      <PageHeader
        image="/brand/gallery/nyc-rosary.webp"
        eyebrow="Jade Gold · Görsel Kimlik"
        title="Marka Görsel Kimliği"
        description="Jade Gold NYC marka çekimleri ve görsel öğeleri"
      />

      {BRAND_GALLERY.map((group) => (
        <section key={group.key} className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">{group.title}</h3>
            <p className="text-muted-foreground text-sm">{group.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {group.assets.map((a) => (
              <BrandTile key={a.src} src={a.src} scrim className="aspect-[4/5]">
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-xs font-medium text-white">{a.caption}</p>
                </div>
              </BrandTile>
            ))}
          </div>
        </section>
      ))}

      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <ImagePlus className="size-4 shrink-0" />
        Görselleri <code className="font-mono">public/brand/gallery/</code>{" "}
        klasörüne ilgili dosya adıyla ekleyin; otomatik görünür. Dosya yoksa zarif
        degrade gösterilir.
      </p>

      {/* ── Etsy Listingleri ──────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">
            Etsy Listingleri ({listings.length})
          </h3>
          <p className="text-muted-foreground text-sm">
            Etsy magazasindan senkronize edilen aktif urun listingleri
          </p>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Package className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">
                Henuz senkronize edilmis listing yok. Etsy entegrasyonunu
                ayarlar sayfasindan baglayabilirsiniz.
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
                        {p.num_images} gorsel
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
                      Etsy&apos;de gor
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
