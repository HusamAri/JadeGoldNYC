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
import { getGoldSettings } from "@/lib/db/queries/gold-settings";
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
import { ViewsTrendCard } from "@/components/listing/views-trend-card";
import { getListingViewsTrends } from "@/lib/db/queries/etsy-insights";
import { ListingGapsCard } from "@/components/listing/listing-gaps-card";
import { ListingFieldsForm } from "@/components/listing/listing-fields-form";
import { EtsyCopyCard, type EtsyCopyField } from "@/components/listing/etsy-copy-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingPanel } from "@/components/listing/listing-panel";

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

/**
 * Listing Komuta Merkezi — tek listing'in tüm detayları tek sayfada.
 * Uzun bölümler ListingPanel (<details>) ile katlanır; varsayılan açık:
 * künye + varyant toplu fiyat + rakip benzerler. Geri kalan scroll yükü değil.
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
  const goldSettings = await getGoldSettings();
  /** Künye maliyet satırı: tek SKU gramı yoksa medyan varyant gramı. */
  const kunyeWeightGrams =
    product.weight_grams ??
    (() => {
      const grams = variants
        .map((v) => v.weight_grams)
        .filter((g): g is number => g != null && g > 0)
        .sort((a, b) => a - b);
      if (grams.length === 0) return null;
      return grams[Math.floor(grams.length / 2)] ?? null;
    })();

  // Canlı Etsy görselleri — bağlı değilse/geç kalırsa [] (graceful, tek deneme).
  const images: ListingImage[] =
    product.etsy_listing_id != null
      ? await getListingImages(m.org_id, product.etsy_listing_id)
      : [];

  // Pazar konumu ($/gram) — günlük rutin doldurunca dolu, yoksa null (kart yok).
  const marketPosition = await getListingMarketPosition(product.id);

  // Görüntülenme trendi — günlük Etsy fotoğraf birikiminden (API tarihçe vermez).
  const viewsTrend =
    product.etsy_listing_id != null
      ? ((await getListingViewsTrends(m.org_id, [product.etsy_listing_id])).get(
          product.etsy_listing_id,
        ) ?? null)
      : null;

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

      {/* 01 · Görseller — kapalı; üstte zaten thumbnail/vitrin var. */}
      <ListingPanel
        id="gorseller"
        n="01"
        name="Görseller"
        defaultOpen={false}
        tail={
          images.length > 0
            ? `${images.length} canlı görsel`
            : product.num_images
              ? `Etsy'de ${product.num_images} görsel`
              : undefined
        }
      >
        <ImageStrip
          images={images}
          fallbackUrl={product.image_url}
          title={decodeEntities(product.title)}
        />
      </ListingPanel>

      {eon && (
        <ListingPanel
          id="gorsel-yonetimi"
          n="01B"
          name="Görsel Yönetimi"
          defaultOpen={false}
          tail={
            managedImages.length > 0
              ? `EON · ${managedImages.length} görsel`
              : "EON · Drive/yükleme"
          }
        >
          <ListingImageManager
            productId={product.id}
            images={managedImages}
          />
        </ListingPanel>
      )}

      {/* 02 · Künye — günlük giriş noktası, açık. */}
      <div id="kunye" className="grid gap-4 scroll-mt-24 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListingPanel n="02" name="Künye & boşluklar" defaultOpen>
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
              weightGrams={kunyeWeightGrams}
              purchasePrice14kCents={goldSettings.purchase_price_14k_cents}
              purchasePrice10kCents={goldSettings.purchase_price_10k_cents}
              currency={product.currency}
            />
          </ListingPanel>
        </div>
        <ListingGapsCard gaps={gaps} />
      </div>

      <ListingPanel id="kopyala" n="03" name="Etsy'ye kopyala" defaultOpen={false}>
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
      </ListingPanel>

      {/* 04 · Varyantlar — toplu fiyat açık; satır satır içeride katlı. */}
      <ListingPanel
        id="varyantlar"
        n="04"
        name="Varyantlar"
        defaultOpen
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
      >
        <VariantEditor
          productId={product.id}
          variants={variants}
          currency={product.currency}
          productWeightGrams={product.weight_grams}
          productTitle={product.title}
          productTags={product.tags}
          productMaterials={product.materials}
          purchasePrice14kCents={goldSettings.purchase_price_14k_cents}
          purchasePrice10kCents={goldSettings.purchase_price_10k_cents}
        />
      </ListingPanel>

      {/* 05 · Rakip — benzer listingler birincil; matris/reprice katlı. */}
      <ListingPanel
        id="rakip"
        n="05"
        name="Rakip & benzerler"
        defaultOpen
        tail="benzer kartlar · elle link"
      >
        <div className="space-y-4">
          {marketPosition && (
            <MarketPositionCard
              position={marketPosition}
              currency={product.currency}
            />
          )}
          <KeywordResearchPanel productId={product.id} bare />
          <details className="group/mx border-border/60 rounded-[1.25rem] border">
            <summary className="text-muted-foreground flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm select-none [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase">
                Varyant matrisi & otomatik fiyat
              </span>
            </summary>
            <div className="space-y-4 border-t px-4 py-4">
              <VariantMatrix productId={product.id} />
              <RepriceRuleCard
                productId={product.id}
                currency={product.currency}
                hasVariations={variants.length > 1}
              />
            </div>
          </details>
        </div>
      </ListingPanel>

      <ListingPanel
        id="reklam"
        n="06"
        name="Reklam & performans"
        defaultOpen={false}
        tail={
          ads.periods.length > 0
            ? `${ads.periods.length} dönem kaydı`
            : undefined
        }
      >
        <AdsSummaryCard
          ads={ads}
          lifetimeSales={lifetimeSales}
          currency={product.currency}
        />
      </ListingPanel>

      {product.etsy_listing_id != null && (
        <ListingPanel
          id="goruntulenme"
          n="07"
          name="Görüntülenme trendi"
          defaultOpen={false}
          tail={
            viewsTrend && viewsTrend.statDays >= 2
              ? `${viewsTrend.statDays} günlük fotoğraf`
              : "seri olgunlaşıyor"
          }
        >
          <ViewsTrendCard trend={viewsTrend} />
        </ListingPanel>
      )}
    </div>
  );
}
