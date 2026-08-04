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
import { getGoldPricePerOunce } from "@/lib/gold-price";
import { detectKarat, derivePurchase18kCentsPerGram } from "@/lib/gold-cost";
import { listCompetitorVariantMatches } from "@/lib/db/queries/keyword-research";
import { projectPricesFromCompetitorMatches } from "@/lib/etsy/competitor-gram-price";
import { getListingImages, type ListingImage } from "@/lib/etsy/images";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { listListingImages } from "@/lib/db/queries/listing-images";
import type { ListingImage as ManagedListingImage } from "@/lib/types";
import { ListingImageManager } from "@/components/listing/listing-image-manager";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import { KeywordResearchPanel } from "@/components/keyword-research-panel";
import { ImageStrip } from "@/components/listing/image-strip";
import { VariantEditor } from "@/components/listing/variant-editor";
import { EtsyPricePushButton } from "@/components/listing/etsy-price-push-button";
import { MarketPositionCard } from "@/components/listing/market-position-card";
import { VariantMatrix } from "@/components/listing/variant-matrix";
import { DiscountControl } from "@/components/listing/discount-control";
import { RepriceRuleCard } from "@/components/listing/reprice-rule-card";
import { AdsSummaryCard } from "@/components/listing/ads-summary-card";
import { ViewsTrendCard } from "@/components/listing/views-trend-card";
import {
  getListingViewsTrends,
  type ListingViewsTrend,
} from "@/lib/db/queries/etsy-insights";
import { ListingGapsCard } from "@/components/listing/listing-gaps-card";
import { ListingFieldsForm } from "@/components/listing/listing-fields-form";
import { ListingStateButton } from "@/components/listing/listing-state-button";
import { SkuRenameForm } from "@/components/listing/sku-rename-form";
import { PersonalizationCard } from "@/components/listing/personalization-card";
import { EtsyCopyCard, type EtsyCopyField } from "@/components/listing/etsy-copy-card";
import { SeoHelperConsole } from "@/components/seo/seo-helper-console";
import { inferSeoInput } from "@/lib/seo/keyword-engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingPanel } from "@/components/listing/listing-panel";
import { AnimatedDisclosure } from "@/components/ui/animated-disclosure";

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
 * Uzun bölümler ListingPanel ile katlanır (nm-raised + motion);
 * varsayılan açık: Künye, Varyantlar, Rakip. Kapalı: Görseller, Kopyala, Reklam.
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
  // Ayar SENKRON tespit edilir (detectKarat await'siz) → 18K spot fetch'i de
  // aşağıdaki tek Promise.all'a girebilir. `detail` bilindikten sonra bu yedi
  // veri birbirinden BAĞIMSIZ; eskiden sırayla await ediliyordu (~6 tur), artık
  // tek turda paralel. Yalnız managedImages `eon` sonucuna bağlı (EON-only 2. tur).
  const simKarat = detectKarat(product.title, product.tags, product.materials);
  const etsyListingId = product.etsy_listing_id;
  const [
    goldSettings,
    rivalMatches,
    goldOunce,
    images,
    marketPosition,
    viewsTrendMap,
    eon,
    writeAccess,
  ] = await Promise.all([
    getGoldSettings(),
    listCompetitorVariantMatches(product.id),
    simKarat === "18K" ? getGoldPricePerOunce() : Promise.resolve<number | null>(null),
    // Canlı Etsy görselleri — bağlı değilse/geç kalırsa [] (graceful, tek deneme).
    etsyListingId != null
      ? getListingImages(m.org_id, etsyListingId)
      : Promise.resolve<ListingImage[]>([]),
    // Pazar konumu ($/gram) — günlük rutin doldurunca dolu, yoksa null.
    getListingMarketPosition(product.id),
    // Görüntülenme trendi — günlük Etsy fotoğraf birikiminden.
    etsyListingId != null
      ? getListingViewsTrends(m.org_id, [etsyListingId])
      : Promise.resolve(new Map<number, ListingViewsTrend>()),
    // EON'a özel: panelden yönetilen çoklu görsel galerisi.
    isEonActive(),
    // Fiyat itiş butonu için Etsy yazma izni.
    getEtsyWriteAccess(m.org_id),
  ]);

  const rivalProjection = projectPricesFromCompetitorMatches(
    rivalMatches,
    variants.map((v) => ({
      sku: v.sku,
      weightGrams: v.weight_grams,
      priceCents: v.price_cents,
    })),
  );
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

  // İndirim simülatörü maliyet tabanı: gram × ayar alım fiyatı (cent/g).
  // 10K/14K org ayarından; 18K canlı spot + 14K işçilik priminden türetilir.
  // Ayar tespit edilemezse null → simülatör kendini gizler, uydurmaz.
  const simCostPerGramCents =
    simKarat === "10K"
      ? goldSettings.purchase_price_10k_cents
      : simKarat === "14K"
        ? goldSettings.purchase_price_14k_cents
        : simKarat === "18K"
          ? derivePurchase18kCentsPerGram(
              goldOunce ?? 0,
              goldSettings.purchase_price_14k_cents,
            )
          : null;

  const viewsTrend =
    etsyListingId != null ? (viewsTrendMap.get(etsyListingId) ?? null) : null;

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
    // page-stack: panel geneliyle aynı cömert dikey ritim (space-y-6 dardı).
    <div className="page-stack">
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
            {product.etsy_listing_id != null && (
              <ListingStateButton
                productId={product.id}
                status={product.status}
              />
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
              hasVariations={variants.length > 0}
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
              variantPriceRange={(() => {
                const ps = variants
                  .map((v) => v.price_cents)
                  .filter((c): c is number => c != null);
                return ps.length
                  ? { minCents: Math.min(...ps), maxCents: Math.max(...ps) }
                  : null;
              })()}
            />
          </ListingPanel>
        </div>
        <ListingGapsCard gaps={gaps} />
      </div>

      {/* 02B · İndirim — manuel Etsy Sale/kupon yüzdesi (API vermiyor);
          indirimli fiyat panelde türetilir, varyant matrisinde gösterilir.
          Simülatör: yüzde yazarken maliyet altına düşen varyantlar anında
          listelenir (maliyet = gram × ayar alım fiyatı; 18K canlı türetim). */}
      <ListingPanel
        id="indirim"
        n="02B"
        name="İndirim"
        defaultOpen={product.discount_pct > 0}
        tail={
          product.discount_pct > 0
            ? `%${product.discount_pct} aktif`
            : "indirim yok"
        }
      >
        <DiscountControl
          productId={product.id}
          initialPct={product.discount_pct}
          basePriceCents={product.price_cents}
          currency={product.currency}
          costPerGramCents={simCostPerGramCents}
          initialStartAt={product.discount_start_at}
          initialEndAt={product.discount_end_at}
          initialMinOrderCents={product.discount_min_order_cents}
          todayIso={new Date().toISOString().slice(0, 10)}
          variants={variants
            .filter((v) => v.price_cents != null)
            .map((v) => ({
              sku: v.sku,
              price_cents: v.price_cents as number,
              weight_grams:
                v.weight_grams == null ? null : Number(v.weight_grams),
            }))}
        />
      </ListingPanel>

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
        {/* SKU çakışması onarımı — YALNIZ varyantsız Etsy listing'inde görünür:
            bu, Etsy'de kopyalanıp kaynağın SKU'larını miras almış listing'in
            imzasıdır (panelde 0 varyant + Listeler'de gizli). */}
        {etsyListingId != null && variants.length === 0 && (
          <div className="border-input mb-3 rounded-xl border border-dashed p-3">
            <p className="mb-2 font-mono text-[10px] tracking-[0.12em] text-amber-600 uppercase dark:text-amber-400">
              SKU çakışması · kopyalanmış listing
            </p>
            <SkuRenameForm productId={product.id} ornekSku={product.sku} />
          </div>
        )}

        {/* Kişiselleştirme ("custom options") — panel bu alanı aynalamıyor,
            canlı hâli Etsy'den okunur. Referans listing'de kurulan sorular
            buradan tüm canlı listing'lere yayılır. */}
        {etsyListingId != null && (
          <div className="border-input mb-3 rounded-xl border border-dashed p-3">
            <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-[0.12em] uppercase">
              Kişiselleştirme · custom options
            </p>
            <PersonalizationCard productId={product.id} />
          </div>
        )}

        {/* Kanarya: bu listing'in panel fiyatlarını Etsy'ye gönder — toplu
            itiş öncesi tek ilanda dene-doğrula; sonucu net raporlar. */}
        {etsyListingId != null && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2">
            <p className="text-muted-foreground text-xs">
              Panel varyant fiyatlarını bu listing için Etsy&apos;ye gönder
              (yalnız farklı olanlar yazılır; fiyat sıfırlanmaz).
            </p>
            <EtsyPricePushButton
              productId={product.id}
              writeEnabled={writeAccess.writeEnabled}
              hasEtsyListing={etsyListingId != null}
            />
          </div>
        )}
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
          rivalProjection={rivalProjection}
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
          <AnimatedDisclosure
            defaultOpen={false}
            className="nm-raised-sm border-0"
            summaryClassName="px-4 py-3"
            panelClassName="space-y-4 px-4 py-4"
            summary={
              <span className="font-mono text-[11px] font-medium tracking-[0.16em] uppercase">
                Varyant matrisi &amp; otomatik fiyat
              </span>
            }
          >
            <VariantMatrix
              productId={product.id}
              discountPct={product.discount_pct}
            />
            <RepriceRuleCard
              productId={product.id}
              currency={product.currency}
              hasVariations={variants.length > 1}
            />
          </AnimatedDisclosure>
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

      {/* 08 · SEO Yardımcısı — künyeden çıkarımla önceden dolu üretici konsol.
          Çıktılar kopyalanır; yazma sahipleri değişmez (künye formu = elle
          kaydet, /seo-etiketleri = onaylı canlı Etsy tag push). */}
      <ListingPanel
        id="seo-yardimcisi"
        n="08"
        name="SEO Yardımcısı"
        defaultOpen={false}
        tail="başlık + 13 etiket üretici · künyeden çıkarım"
      >
        <SeoHelperConsole
          initial={inferSeoInput(
            decodeEntities(product.title),
            product.tags,
            product.materials,
          )}
        />
      </ListingPanel>
    </div>
  );
}
