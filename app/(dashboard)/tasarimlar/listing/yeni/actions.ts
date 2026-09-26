"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseMoneyToCents } from "@/lib/money";
import { prepareDraftVariants, type DraftVariantInput } from "@/lib/listing-draft-variants";
import { parseDraftStagingJson } from "@/lib/listing-draft-staging";
import {
  LISTING_PROTOCOLS,
  type ListingProtocolId,
} from "@/lib/etsy/listing-protocol";
import {
  inferWeightsBySize,
  distributePriceByWeight,
  type DistVariant,
} from "@/lib/etsy/distribute";

/**
 * Yeni listing composer — taslak oluşturma action'ı.
 * Composer ham girdileri (metin) gönderir; eksik gram/fiyat SUNUCUDA aynı
 * motorla (distribute.ts) yeniden hesaplanır — önizleme ile kayıt birebir
 * aynı fonksiyonlardan geçer, istemciden hesaplanmış değer kabul edilmez.
 * Yazma: admin client + org kilidi (bkz. analizler/urunler/actions.ts deseni).
 * Etsy'ye gönderim YOK — bağlantı salt-okunur; kayıt yalnız panele düşer.
 */

export type { DraftVariantInput } from "@/lib/listing-draft-variants";

export interface DraftListingInput {
  /** Explicit product contract; never infer a new draft to be a wedding band. */
  listingProtocol: string;
  title: string;
  description: string;
  /** Virgüllü liste ("gold, chain, necklace"). */
  tags: string;
  /** Virgüllü liste ("14k gold, solid gold"). */
  materials: string;
  /**
   * Kapak görseli URL'i (ops.) → `products.image_url`. PUBLIC olmalı: hem
   * listelerdeki küçük görsel hem Etsy'ye taslak gönderiminde kapak yüklemesi
   * (lib/etsy/create-listing.ts) baytı bu adresten çeker. Boş bırakılabilir.
   */
  imageUrl: string;
  /** Ayar (ör. "14") — fiyat dağıtım motoruna gider (tek fiyat noktası senaryosu). */
  karat: string;
  /** Altın gram fiyatı USD/g (ops.) — tek fiyat noktasından dağıtım için. */
  goldSpot: string;
  /** Melt çarpanı (işçilik/kâr), vars. 2.5. */
  markup: string;
  /**
   * Varyasyon ekseninin ADI (ör. "Ring Size" / "Width") — satır başına değerle
   * birlikte `product_variants.properties`e yazılır. Etsy'ye gönderimde
   * varyantları AYRI seçeneklere ayıran tek sinyal budur; boşsa N varyant
   * Etsy'de tek offering'e düşerdi (bkz. lib/etsy/create-listing varyant kilidi).
   */
  axisName?: string;
  /** Panel taslağının ikinci varyasyon ekseni. */
  axisName2?: string;
  /** Panel taslağının üçüncü ekseni; Etsy gönderim desteği ayrı doğrulanır. */
  axisName3?: string;
  /** Optional bounded, allowlisted source metadata for this NEW panel draft. */
  stagingJson?: string;
  variants: DraftVariantInput[];
}

export interface DraftListingResult {
  id?: string;
  error?: string;
}

function splitList(s: string): string[] | null {
  const items = s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

/** Calculator ile aynı esneklik: ayrıştırılamayan/≤0 gram = bilinmiyor. */
function gramOrNull(s: string): number | null {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Boş = bilinmiyor; dolu ama ≤0 = bilinmiyor (calculator davranışı). */
function centsOrNull(s: string): number | null {
  if (!s.trim()) return null;
  const cents = parseMoneyToCents(s);
  return cents > 0 ? cents : null;
}

function numOrUndefined(s: string): number | undefined {
  const v = s.trim().replace(",", ".");
  if (!v) return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Taslak listing oluşturur: products (status='draft') + product_variants.
 * Girilen ağırlık weight_source='manual', motor çıkarımı 'inferred'.
 * Başarıda { id } döner → composer detay sayfasına yönlendirir.
 */
export async function createDraftListing(
  input: DraftListingInput,
): Promise<DraftListingResult> {
  const m = await requireMembership();

  const title = input.title.trim();
  if (!title) return { error: "Başlık boş olamaz." };

  const listingProtocol = input.listingProtocol?.trim();
  if (
    !listingProtocol ||
    !Object.prototype.hasOwnProperty.call(LISTING_PROTOCOLS, listingProtocol)
  ) {
    return { error: "Yeni taslak için ürün tipini açıkça seçin." };
  }
  const protocol = listingProtocol as ListingProtocolId;

  // Kapak görseli: yalnız http(s) kabul edilir — Etsy'ye gönderimde bu adres
  // sunucudan fetch edilir (data:/dosya yolu oradan indirilemez).
  const imageUrl = (input.imageUrl ?? "").trim();
  if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) {
    return { error: "Kapak görseli http(s) ile başlayan bir URL olmalı." };
  }

  const prepared = prepareDraftVariants(input.variants, [input.axisName, input.axisName2, input.axisName3]);
  if (prepared.error !== undefined) return { error: prepared.error };
  const { rows, propertiesBySku: axisBySku, axisNames } = prepared;
  const [axisName, axisName2] = axisNames;
  if (protocol === "signet_ring" && rows.length > 1 && axisName !== "Ring Size") {
    return {
      error: "Çok bedenli initial signet ring için varyasyon ekseni Ring Size olmalı.",
    };
  }
  if (
    protocol === "sculptural_ring" &&
    rows.length > 1 &&
    (axisName !== "Ring Size" || axisName2 !== "Metal Color")
  ) {
    return { error: "Çok varyantlı sculptural ring için Ring Size ve Metal Color eksenleri gerekli." };
  }
  const productType =
    protocol === "wedding_band" || protocol === "signet_ring" ||
    protocol === "monogram_signet_ring" || protocol === "sculptural_ring"
      ? "ring" : protocol === "pendant_necklace" ? "necklace" : "bracelet";
  // cuff_bracelet de "bracelet" yazılır: products_product_type_check "cuff"
  // kabul etmez; protokol listing_metadata.listingProtocol üzerinden seçilir.
  const staging = parseDraftStagingJson(input.stagingJson, {
    listingProtocol: protocol, productType, variationAxes: axisNames,
  });
  if (staging.error !== undefined) return { error: staging.error };
  const stagingData = staging.data;
  // Motor: önce eksik ağırlıklar bedenden, sonra eksik fiyatlar ağırlıktan.
  const base: DistVariant[] = rows.map((r) => ({
    sku: r.sku,
    weightGrams: gramOrNull(r.weight),
    priceCents: centsOrNull(r.price),
  }));
  const wPred = new Map(inferWeightsBySize(base).map((p) => [p.sku, p]));
  const withWeights: DistVariant[] = base.map((v) => ({
    ...v,
    weightGrams: v.weightGrams ?? wPred.get(v.sku)?.weightGrams ?? null,
  }));
  const pPred = new Map(
    distributePriceByWeight(withWeights, {
      karat: numOrUndefined(input.karat),
      goldSpotPerGramUsd: numOrUndefined(input.goldSpot),
      markup: numOrUndefined(input.markup),
    }).map((p) => [p.sku, p]),
  );

  const finalVariants = base.map((v) => {
    const inferred = wPred.get(v.sku);
    const weight = v.weightGrams ?? inferred?.weightGrams ?? null;
    return {
      sku: v.sku,
      weight_grams: weight,
      weight_source:
        v.weightGrams != null ? stagingData.weightSource ?? "manual" : inferred ? "inferred" : null,
      price_cents: v.priceCents ?? pPred.get(v.sku)?.priceCents ?? null,
    };
  });

  const prices = finalVariants
    .map((v) => v.price_cents)
    .filter((c): c is number => c != null);
  const minPriceCents = prices.length > 0 ? Math.min(...prices) : null;

  const admin = createAdminClient();
  if (stagingData.sku) {
    const { data: existing, error: lookupError } = await admin
      .from("products")
      .select("id")
      .eq("org_id", m.org_id)
      .eq("sku", stagingData.sku)
      .limit(1)
      .maybeSingle();
    if (lookupError) return { error: lookupError.message };
    if (existing) {
      return { error: `Bu üst SKU zaten kayıtlı (${existing.id}). Yeni kayıt oluşturulmadı; mevcut taslağı kontrol edin.` };
    }
  }
  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      org_id: m.org_id,
      ...(stagingData.sku ? { sku: stagingData.sku } : {}),
      ...(stagingData.quantity !== undefined ? { quantity: stagingData.quantity } : {}),
      title,
      description: input.description.trim() || null,
      tags: splitList(input.tags),
      materials: splitList(input.materials),
      // Panelde ÜRETİLEN taslağın kapağı: bu alana yazan başka yol yok (Etsy
      // senkronu yalnız canlı listing'in aynasını basar), yani burada
      // yazılmazsa listing kapaksız kalır ve Etsy'ye gönderimde de kapak
      // bulunamaz.
      image_url: imageUrl || null,
      product_type: productType,
      listing_metadata: { ...stagingData.metadata, listingProtocol: protocol, variationAxes: axisNames },
      status: "draft",
      currency: "USD",
      price_cents: minPriceCents,
      has_variations: finalVariants.length > 1,
    })
    .select("id")
    .single();
  if (productError || !product) {
    return { error: productError?.message ?? "Listing oluşturulamadı." };
  }
  const productId = (product as { id: string }).id;

  if (finalVariants.length > 0) {
    const { error: variantError } = await admin.from("product_variants").insert(
      finalVariants.map((v) => ({
        org_id: m.org_id,
        product_id: productId,
        ...(stagingData.quantity !== undefined ? { quantity: stagingData.quantity } : {}),
        sku: v.sku,
        price_cents: v.price_cents,
        weight_grams: v.weight_grams,
        weight_source: v.weight_source,
        // Panel-seed şekli (düz nesne) — lib/variant-properties bunu kanonik
        // Etsy dizisine indirger. Eksen yoksa null (tek-varyant taslak).
        properties: axisBySku.get(v.sku) ?? null,
        active: true,
      })),
    );
    if (variantError) {
      // Yarım kayıt bırakma — taslağı geri al (org kilidiyle).
      await admin
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("org_id", m.org_id);
      return {
        error:
          (variantError as { code?: string }).code === "23505"
            ? "Bu SKU'lardan biri zaten kayıtlı — SKU'lar mağaza genelinde benzersiz olmalı."
            : variantError.message,
      };
    }
  }

  revalidatePath("/tasarimlar");
  revalidatePath(`/tasarimlar/listing/${productId}`);
  return { id: productId };
}
