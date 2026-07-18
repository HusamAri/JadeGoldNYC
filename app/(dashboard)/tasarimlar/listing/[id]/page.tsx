import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { isEonActive } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import {
  getListingDetail,
  getListingMarketPosition,
} from "@/lib/db/queries/listings";
import { getListingImages, type ListingImage } from "@/lib/etsy/images";
import { listListingImages } from "@/lib/db/queries/listing-images";
import type { ListingImage as ManagedListingImage } from "@/lib/types";
import { ListingImageManager } from "@/components/listing/listing-image-manager";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import { KeywordResearchPanel } from "@/components/keyword-research-panel";
import { ImageStrip } from "@/components/listing/image-strip";
import { VariantEditor } from "@/components/listing/variant-editor";
import { MarketPositionCard } from "@/components/listing/market-position-card";
import { VariantMatrix } from "@/components/listing/variant-matrix";
import { RepriceRuleCard } from "@/components/listing/reprice-rule-card";
import { AdsSummaryCard } from "@/components/listing/ads-summary-card";
import { ListingGapsCard } from "@/components/listing/listing-gaps-card";
import { ListingFieldsForm } from "@/components/listing/listing-fields-form";
import { EtsyCopyCard, type EtsyCopyField } from "@/components/listing/etsy-copy-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Listing Detayı" };

/** Etsy başlıkları HTML entity'leriyle gelebilir — yalnız görüntüde çöz. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, c: string) => String.fromCodePoint(Number(c)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c: string) =>
      String.fromCodePoint(parseInt(c, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Açıklama sonundaki dahili not bloğunu söker — scripts/eon-push-drafts.ts
 *  stripInternalTrailer ile BİREBİR aynı desen (kopyalanan metin = Etsy'ye
 *  giden metin). Künye içeriği ayrıca kurulum notu olarak gösterilir. */
function splitInternalTrailer(desc: string): {
  clean: string;
  note: string | null;
} {
  const m = desc.match(/\n*---\n\[EON \d\d · ([\s\S]*)\]$/m);
  return {
    clean: desc.replace(/\n*---\n\[EON [\s\S]*\]$/m, "").trimEnd(),
    note: m ? m[1] : null,
  };
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "success" | "secondary" | "warning" | "outline" }
> = {
  active: { label: "Aktif", variant: "success" },
  draft: { label: "Taslak", variant: "secondary" },
  inactive: { label: "Pasif", variant: "warning" },
  sold_out: { label: "Tükendi", variant: "warning" },
  expired: { label: "Süresi doldu", variant: "outline" },
};

/** Bölüm indeks başlığı — Amuletta .idx dili ("Listing / 0N · Ad"). */
function SectionIdx({ n, name, tail }: { n: string; name: string; tail?: string }) {
  return (
    <div aria-hidden className="idx">
      <span>
        Listing / {n} · {name}
      </span>
      <span className="idx-bar" />
      <span className="idx-ln" />
      {tail && <span className="normal-case">{tail}</span>}
    </div>
  );
}

/**
 * Listing Komuta Merkezi — tek listing'in tüm detayları tek sayfada:
 * 01 canlı görseller · 02 künye + boşluklar · 03 varyant editörü ·
 * 04 rakip fiyat eşleşmeleri · 05 reklam & performans.
 */
export default async function ListingDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await requireMembership();
  const detail = await getListingDetail(id);
  if (!detail) notFound();
  const { product, variants, ads, lifetimeSales, gaps } = detail;

  // Canlı Etsy görselleri — bağlı değilse/geç kalırsa [] (graceful, tek deneme).
  const images: ListingImage[] =
    product.etsy_listing_id != null
      ? await getListingImages(m.org_id, product.etsy_listing_id)
      : [];

  // Pazar konumu ($/gram) — günlük rutin doldurunca dolu, yoksa null (kart yok).
  const marketPosition = await getListingMarketPosition(product.id);

  // EON'a özel: panelden yönetilen çoklu görsel galerisi (Drive/yükleme + sırala).
  const eon = await isEonActive();
  let managedImages: ManagedListingImage[] = [];
  if (eon) {
    const supabase = await createClient();
    managedImages = await listListingImages(supabase, product.id);
  }

  const status = product.status
    ? (STATUS_LABELS[product.status] ?? {
        label: product.status,
        variant: "outline" as const,
      })
    : null;
  const etsyUrl =
    product.url ??
    (product.etsy_listing_id != null
      ? `https://www.etsy.com/listing/${product.etsy_listing_id}`
      : null);

  const descriptionParts = [
    product.sku ? `SKU ${product.sku}` : null,
    product.etsy_listing_id != null ? `Etsy #${product.etsy_listing_id}` : null,
    product.price_cents != null
      ? formatMoney(product.price_cents, product.currency)
      : null,
    `${variants.length} varyant`,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title={decodeEntities(product.title)}
        eyebrow="Listing Komuta Merkezi"
        description={descriptionParts.join(" · ")}
        action={
          <>
            {status && <Badge variant={status.variant}>{status.label}</Badge>}
            <Button asChild variant="outline">
              <Link href="/tasarimlar">
                <ArrowLeft />
                Listeler
              </Link>
            </Button>
            {etsyUrl && (
              <Button asChild variant="outline">
                <a href={etsyUrl} target="_blank" rel="noreferrer noopener">
                  <ExternalLink />
                  Etsy&apos;de aç
                </a>
              </Button>
            )}
          </>
        }
      />

      {/* 01 · Görseller — yan yana yatay şerit. */}
      <section id="gorseller" className="scroll-mt-24">
        <Card>
          <CardContent className="space-y-4">
            <SectionIdx
              n="01"
              name="Görseller"
              tail={
                images.length > 0
                  ? `${images.length} canlı görsel`
                  : product.num_images
                    ? `Etsy'de ${product.num_images} görsel`
                    : undefined
              }
            />
            <ImageStrip
              images={images}
              fallbackUrl={product.image_url}
              title={decodeEntities(product.title)}
            />
          </CardContent>
        </Card>
      </section>

      {/* 01B · Görsel yönetimi — yalnız EON: Drive/yükleme + çıkar + sırala. */}
      {eon && (
        <section id="gorsel-yonetimi" className="scroll-mt-24">
          <Card>
            <CardContent className="space-y-4">
              <SectionIdx
                n="01B"
                name="Görsel Yönetimi"
                tail={
                  managedImages.length > 0
                    ? `EON · ${managedImages.length} görsel`
                    : "EON · Drive/yükleme"
                }
              />
              <ListingImageManager
                productId={product.id}
                images={managedImages}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {/* 02 · Künye & boşluklar. */}
      <section id="kunye" className="grid gap-6 scroll-mt-24 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <SectionIdx n="02" name="Künye & boşluklar" />
            <ListingFieldsForm
              productId={product.id}
              alreadyOnEtsy={product.etsy_listing_id != null}
              initial={{
                title: product.title,
                description: product.description,
                tags: product.tags,
                materials: product.materials,
                price_cents: product.price_cents,
                quantity: product.quantity,
                research_keyword: product.research_keyword,
              }}
            />
          </CardContent>
        </Card>
        <ListingGapsCard gaps={gaps} />
      </section>

      {/* 03 · Etsy'ye kopyala — manuel listing açma panosu (alan alan kopya).
          Açıklama sunucuda temizlenir; kopyalanan = Etsy'ye giden metin. */}
      <section id="kopyala" className="scroll-mt-24">
        <Card>
          <CardContent className="space-y-4">
            <SectionIdx n="03" name="Etsy'ye kopyala" />
            {(() => {
              const { clean, note } = splitInternalTrailer(
                product.description ?? "",
              );
              const fields: EtsyCopyField[] = [
                {
                  label: "Başlık",
                  value: decodeEntities(product.title),
                  hint: `${decodeEntities(product.title).length}/140 karakter`,
                },
                {
                  label: "Etiketler",
                  value: (product.tags ?? []).join(", "),
                  hint: `${product.tags?.length ?? 0}/13 · virgülle yapıştır`,
                },
                {
                  label: "Malzemeler",
                  value: (product.materials ?? []).join(", "),
                },
                {
                  label: "Açıklama",
                  value: clean,
                  multiline: true,
                  hint: note ? "iç not temizlendi" : undefined,
                },
              ].filter((f) => f.value.length > 0);
              return <EtsyCopyCard fields={fields} setupNote={note} />;
            })()}
          </CardContent>
        </Card>
      </section>

      {/* 04 · Varyantlar — inline editör + otomatik dolum. */}
      <section id="varyantlar" className="scroll-mt-24">
        <Card>
          <CardContent className="space-y-4">
            <SectionIdx
              n="04"
              name="Varyantlar"
              tail={
                variants.length > 0
                  ? `${variants.length} varyant${
                      gaps.missing_weights > 0
                        ? ` · ${gaps.missing_weights} gram eksik`
                        : ""
                    }`
                  : gaps.no_weight
                    ? "Varyantsız · gram eksik"
                    : product.weight_grams != null
                      ? `Varyantsız · ${product.weight_grams} g`
                      : undefined
              }
            />
            <VariantEditor
              productId={product.id}
              variants={variants}
              currency={product.currency}
              productWeightGrams={product.weight_grams}
            />
          </CardContent>
        </Card>
      </section>

      {/* 05 · Rakip fiyat eşleşmeleri — hazır panel AYNEN (kendi kartı var). */}
      <section id="rakip" className="space-y-4 scroll-mt-24">
        <SectionIdx n="05" name="Rakip fiyat eşleşmeleri" />
        {marketPosition && (
          <MarketPositionCard
            position={marketPosition}
            currency={product.currency}
          />
        )}
        {/* Varyant matrisi — genişlik × beden (fiyat + gram); varyantsız
            listing'de kendini gizler (null döner). */}
        <VariantMatrix productId={product.id} />
        <KeywordResearchPanel productId={product.id} />
        {/* Otomatik fiyat kuralı — rakip çapasına bağlı reprice motoru
            (kapalı/öneri/otomatik); araştırma panelinin hemen altında, çünkü
            çapası buradaki araştırma kaydıdır. */}
        <RepriceRuleCard
          productId={product.id}
          currency={product.currency}
          hasVariations={variants.length > 1}
        />
      </section>

      {/* 06 · Reklam & performans. */}
      <section id="reklam" className="scroll-mt-24">
        <Card>
          <CardContent className="space-y-4">
            <SectionIdx
              n="06"
              name="Reklam & performans"
              tail={
                ads.periods.length > 0
                  ? `${ads.periods.length} dönem kaydı`
                  : undefined
              }
            />
            <AdsSummaryCard
              ads={ads}
              lifetimeSales={lifetimeSales}
              currency={product.currency}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
