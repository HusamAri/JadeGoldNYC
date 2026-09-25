import type { SupabaseClient } from "@supabase/supabase-js";

import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { asEtsyProperties, type RawVariantProperties } from "@/lib/variant-properties";
import { stripImageMetadata } from "@/lib/photo-kit/strip-metadata";
import { logAudit } from "@/lib/audit";
import {
  resolveListingProtocol,
  unknownProtocolError,
  type ListingProtocolSpec,
} from "@/lib/etsy/listing-protocol";

/**
 * PANEL TASLAĞI → ETSY DRAFT LISTING.
 *
 * `scripts/eon-push-drafts.ts`'in canlı-kanıtlı mantığını uygulama içine taşır:
 * kullanıcı listing'i "tailor" ettikten sonra tek tuşla Etsy'de TASLAK (draft —
 * yayınlanmaz) listing açılır. Akış:
 *   1. createListing (POST, form-encoded): başlık, temiz açıklama, tag/materyal,
 *      çapa fiyat (en düşük varyant), kişiselleştirme AÇIK (30 char iç gravür).
 *   2. Envanter PUT: DEĞİŞEN property'ler custom slot 513/514'e; her iki eksen de
 *      fiyat taşır (price_on_property = kullanılan slotlar); fiyat/adet/sku per
 *      offering panel varyantlarından. Sabit property'ler açıklamada kalır.
 *   3. Görseller: kapak (products.image_url) + panel galerisi (listing_images)
 *      sırayla çekilip meta verisi sökülerek multipart yüklenir (rank 1..N).
 *   4. products.etsy_listing_id + url yaz (vekil taze). İDEMPOTENT: etsy_listing_id
 *      doluysa hiç dokunulmaz.
 *
 * TASARIM: hiçbir adım THROW ETMEZ — her adım try/catch ile { ok:false, step,
 * error } döner ki UI net bir mesaj gösterebilsin ve yarım kalan taslak (ör.
 * listing açıldı ama envanter yazılamadı) durumunu kullanıcı görsün.
 *
 * ── ETSY PAYLOAD VARSAYIMLARI (canlı doğrulamada bakılacaklar) ──────────────
 *  A. Zorunlu alan sabitleri (kullanıcı onayı): who_made="i_did"
 *     (ortak Yasin mağaza üyesi), when_made="made_to_order", is_supply="false",
 *     type="physical", state="draft".
 *  B. taxonomy_id, varyasyon eksenleri, kişiselleştirme ve koli ölçüleri
 *     ARTIK SABİT DEĞİL: hepsi `lib/etsy/listing-protocol.ts` içindeki listing
 *     protokolünden gelir ve protokol ürünün `product_type` / `listing_metadata
 *     .listingProtocol` alanından çözülür. Bu dosya bir zamanlar akışın
 *     tamamını alyans şekline sabitliyordu (taksonomi "Wedding Bands", eksen
 *     doğrulayıcısına elle geçilen ["Wedding Bands"] yolu, koşulsuz gravür,
 *     yüzük kutusu ölçüsü) — sonuç olarak yüzük olmayan HER taslak push'ta
 *     "her varyant Width ve Ring Size içermelidir" hatasına çarpıyordu.
 *     Tanınmayan ürün tipi sessizce yüzük sayılmaz, net hatayla durur.
 *  D. İki değişen eksen → custom slot 513/514. Üç değişen eksen → Etsy'nin
 *     üçüncü varyasyon desteği (`max_variations_supported=3`), slotlar canlı
 *     EON Flat Milgrain ile aynı sırada 516/513/514. Üçten fazla eksen ya da
 *     400'ü aşan üç-eksen ızgarası HİÇBİR ETSY YAZMASINDAN ÖNCE durur
 *     (Etsy: fiyat/SKU tüm property'lere bağlıysa en çok 400 ürün).
 *  E. price_on_property: her tam kombinasyon benzersiz fiyat taşıdığından
 *     kullanılan TÜM variation slotları price_on_property'e girer (script deseni).
 *     Etsy, listelenen property'lerin gerçekten variation olmasını ister — sabit
 *     property'ler bilerek slota konmaz.
 *  F. Tag kuralı: her tag ≤20 karakter, en çok 13 tag (Etsy sınırı) — aşanlar
 *     elenir/kırpılır. Materyal: en çok 13, her biri ≤45 char.
 *  G. Görseller: her URL PUBLIC erişilebilir olmalı (Supabase Storage public
 *     bucket). İmzalı/özel URL ise fetch 400/403 döner → o görsel için uyarı
 *     düşer ama listing ve envanter KORUNUR (kısmi başarı). Hiç görsel yoksa
 *     create HİÇ denenmez: Etsy fotoğrafsız listing'i yayınlatmaz, açılan
 *     taslak etsy_listing_id'yi kilitleyip yeniden denemeyi de engellerdi.
 */

/** Etsy custom variation slot id'leri (iki eksen). */
const CUSTOM_SLOT_IDS = [513, 514] as const;
/** Üç eksen: canlı EON Flat Milgrain üç-eksen düzeniyle aynı (Karat 516 önde). */
const THREE_AXIS_SLOT_IDS = [516, 513, 514] as const;
/** Etsy: *_on_property tüm property'leri taşıyorsa üç-eksen listing en çok 400 ürün. */
const MAX_THREE_AXIS_PRODUCTS = 400;

function slotIdsFor(plan: VariationPlan): readonly number[] {
  return plan.varyingNames.length === 3 ? THREE_AXIS_SLOT_IDS : CUSTOM_SLOT_IDS;
}

/** Açıklamanın sonundaki dahili not bloğunu söker: "\n\n---\n[EON NN · ...]".
 *  scripts/eon-push-drafts.ts stripInternalTrailer ile BİREBİR aynı desen. */
export function stripInternalTrailer(desc: string): string {
  return desc.replace(/\n*---\n\[EON [\s\S]*\]$/m, "").trimEnd();
}

interface TaxNode {
  id: number;
  name: string;
  children?: TaxNode[];
}

/** Ağaçta ada göre TÜM eşleşmeler, her biri kök adıyla birlikte. */
function findTaxonomyMatches(
  nodes: TaxNode[],
  name: string,
): { node: TaxNode; root: string }[] {
  const target = normalizedTaxonomyName(name);
  const out: { node: TaxNode; root: string }[] = [];
  const walk = (node: TaxNode, root: string) => {
    if (normalizedTaxonomyName(node.name) === target) out.push({ node, root });
    for (const child of node.children ?? []) walk(child, root);
  };
  for (const node of nodes) walk(node, node.name);
  return out;
}

function normalizedTaxonomyName(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

// Taksonomi id'si oturum içinde sabittir — modül-cache.
// Anahtar protokol id'si DEĞİL, çözümü belirleyen ALANLARIN tamamıdır: aynı id
// altında kök iddiası veya aday listesi farklı bir spec, farklı bir düğüme
// çözülür ve yalnız id ile anahtarlamak birinin sonucunu diğerine servis eder.
const cachedTaxonomyIdBySpec = new Map<string, number>();

function taxonomyCacheKey(spec: ListingProtocolSpec): string {
  return `${spec.id}|${spec.taxonomyRoot ?? ""}|${spec.taxonomyNames.join(",")}`;
}

/** Çözüm sonucu: id, ya da NEDEN çözülemediğini söyleyen hata. */
export type TaxonomyResolution =
  | { ok: true; taxonomyId: number }
  | { ok: false; error: string };

/**
 * Protokolün taksonomi id'sini çözer. Adaylar tercih sırasında denenir.
 *
 * `taxonomyRoot` verilmişse eşleşmeler o köke filtrelenir ve geriye BİRDEN
 * ÇOK aday kalırsa hata döner — sessizce ilkini seçmek, listing'i yanlış
 * dikeye dosyalar ve kimse fark etmez ("Pendant Necklaces" Etsy ağacında hem
 * `Jewelry > Necklaces` hem `Weddings > Jewelry` altında var).
 */
export async function resolveTaxonomyIdForProtocol(
  client: EtsyClient,
  spec: ListingProtocolSpec,
): Promise<TaxonomyResolution> {
  const cacheKey = taxonomyCacheKey(spec);
  const cached = cachedTaxonomyIdBySpec.get(cacheKey);
  if (cached != null) return { ok: true, taxonomyId: cached };

  const tax = await client.get<{ results: TaxNode[] }>(
    etsyPaths.sellerTaxonomyNodes(),
  );
  const nodes = tax.results ?? [];

  for (const name of spec.taxonomyNames) {
    let matches = findTaxonomyMatches(nodes, name);
    if (spec.taxonomyRoot) {
      const root = normalizedTaxonomyName(spec.taxonomyRoot);
      matches = matches.filter((m) => normalizedTaxonomyName(m.root) === root);
    }
    if (matches.length === 1) {
      const id = matches[0].node.id;
      cachedTaxonomyIdBySpec.set(cacheKey, id);
      return { ok: true, taxonomyId: id };
    }
    if (matches.length > 1) {
      const roots = [...new Set(matches.map((m) => m.root))].join(", ");
      return {
        ok: false,
        error: `Etsy kategorisi belirsiz: "${name}" ağaçta ${matches.length} yerde bulundu (kökler: ${roots}). Yanlış dala dosyalamamak için işlem durduruldu.`,
      };
    }
  }

  return {
    ok: false,
    error: `Etsy kategorisi çözülemedi (${spec.label}: ${spec.taxonomyNames.join(" / ")}${spec.taxonomyRoot ? `, kök: ${spec.taxonomyRoot}` : ""} bulunamadı).`,
  };
}

export interface ShopProfiles {
  shippingProfileId: number | null;
  returnPolicyId: number | null;
  /** İşlem profili (readiness state) — Etsy fiziksel üründe zorunlu. */
  readinessStateId: number | null;
}

/**
 * Bir işlem profili (readiness state) çözer; yoksa oluşturur. Etsy 2025
 * migrasyonundan beri fiziksel listing `readiness_state_id` ZORUNLU. Mevcut
 * tanımlardan `made_to_order` tercih edilir (listinglerimiz sipariş üzerine);
 * yoksa ilk tanım; hiç yoksa made-to-order 5–7 gün oluşturulur (kargo metniyle
 * tutarlı). Okunamaz/oluşturulamazsa null döner (create adımı net hata verir).
 */
async function resolveReadinessStateId(
  client: EtsyClient,
  shopId: number,
): Promise<number | null> {
  try {
    const rs = await client.get<{
      results?: { readiness_state_id: number; readiness_state: string }[];
    }>(etsyPaths.readinessStateDefinitions(shopId));
    const defs = rs.results ?? [];
    const found =
      defs.find((d) => d.readiness_state === "made_to_order")
        ?.readiness_state_id ?? defs[0]?.readiness_state_id;
    if (found != null) return found;
    // Hiç tanım yok → made-to-order 5–7 gün oluştur (idempotent değil ama yalnız
    // tanım hiç yoksa çalışır; sonraki çağrılar mevcut tanımı bulur).
    const created = await client.requestForm<{ readiness_state_id: number }>(
      "POST",
      etsyPaths.readinessStateDefinitions(shopId),
      {
        readiness_state: "made_to_order",
        min_processing_time: 5,
        max_processing_time: 7,
      },
    );
    return created.readiness_state_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Kargo profili + iade politikası + işlem profili çözümü:
 *  - Kargo: önce panelin `etsy_shipping_profiles` tablosundan (org kilidi) İLK
 *    profil; yoksa canlı GET shippingProfiles ilk kayıt.
 *  - İade: canlı GET returnPolicies ilk kayıt (okunamzsa null — Etsy fiziksel
 *    üründe iade politikası ister ama create adımı yine denenir).
 *  - İşlem profili: resolveReadinessStateId (mevcut made_to_order / ilk / oluştur).
 */
export async function resolveShopProfiles(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
): Promise<ShopProfiles> {
  let shippingProfileId: number | null = null;

  // Kargo profili — SABİT/manuel (profile_type="manual") TERCİH edilir.
  // Neden: hesaplı (calculated) profil alıcıdan ağırlığa göre posta alır VE
  // listing'de item_weight/boyut şart koşar (yoksa create 400). Açıklamalar
  // "free shipping" vaat ettiğinden ve kargo bedeli fiyata gömüldüğünden
  // sabit/ücretsiz profil doğru olandır. Canlı GET profile_type taşır; manuel
  // yoksa panel-stored / ilk profile düşülür (o org'da calculated tek seçenekse
  // create Etsy'nin net ağırlık hatasını döndürür — kullanıcı yönlendirilir).
  try {
    const sp = await client.get<{
      results: { shipping_profile_id: number; profile_type?: string | null }[];
    }>(etsyPaths.shippingProfiles(shopId));
    const profiles = sp.results ?? [];
    const manual = profiles.find((p) => p.profile_type === "manual");
    shippingProfileId = (manual ?? profiles[0])?.shipping_profile_id ?? null;
  } catch {
    // Canlı okunamadı → panel tablosuna düş (tip bilgisi yok).
  }
  if (shippingProfileId == null) {
    const { data: stored } = await admin
      .from("etsy_shipping_profiles")
      .select("profile_id")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const storedId = (stored as { profile_id: number | null } | null)
      ?.profile_id;
    if (storedId != null) shippingProfileId = Number(storedId);
  }

  // İade politikası — okunamazsa null (yut, create yine denenir).
  let returnPolicyId: number | null = null;
  try {
    const rp = await client.get<{ results: { return_policy_id: number }[] }>(
      etsyPaths.returnPolicies(shopId),
    );
    returnPolicyId = rp.results?.[0]?.return_policy_id ?? null;
  } catch {
    returnPolicyId = null;
  }

  const readinessStateId = await resolveReadinessStateId(client, shopId);

  return { shippingProfileId, returnPolicyId, readinessStateId };
}

/** Panel varyantı (create için gereken alt küme). */
export interface DraftVariant {
  sku: string | null;
  /** Panelde görünen seçenek metni (ör. 6.5 in). */
  name?: string | null;
  properties: RawVariantProperties;
  price_cents: number | null;
  quantity: number | null;
}

/** Create için gereken ürün + varyant kümesi. */
export interface DraftProduct {
  id: string;
  org_id: string;
  etsy_listing_id: number | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  materials: string[] | null;
  price_cents: number | null;
  quantity: number | null;
  image_url: string | null;
  /** Panel galerisi (`listing_images`, position sırasında). Görsel yöneticisi
   *  SADECE bu tabloya yazar — `image_url`'e hiç dokunmaz; birleştirilmezse
   *  listing tek/hiç görselle açılırdı. */
  galleryUrls: string[];
  variants: DraftVariant[];
  /** Listing protokolünü çözer (taksonomi, eksen, gravür, koli). NULL olan
   *  eski kayıtlar bilinçli olarak eski alyans davranışına düşer —
   *  bkz. lib/etsy/listing-protocol.ts karar 2. */
  product_type?: string | null;
  /** Protocol plus an optional explicit panel-only creation restriction. */
  listing_metadata?: { listingProtocol?: unknown; approval?: unknown } | null;
}

/**
 * Etsy listing başına kabul ettiği en fazla fotoğraf sayısı.
 *
 * **20** — kaynak: Etsy Help Center "Photo and video requirements"
 * (help.etsy.com/.../115015663347), CANLI okundu 2026-09-13. Aynı sayfa
 * ayrıca 2000 px kenar önerir ve İLK fotoğrafın en az 635 × 635 olmasını
 * şart koşar (altında kalan listing aramada geri düşer).
 *
 * Bu sabit uzun süre **10**'du ve artık doğru değildi: 15 görsellik bir galeri
 * sessizce ilk 10'a kırpılıyordu. Second-brain dersi — dış platformun
 * rehberliğini kodlayan her eşik bir TARİH ve KAYNAK taşımalı, yoksa platform
 * kuralı değiştiğinde panel kendi eski varsayımıyla çalışmaya devam eder ve
 * kimse fark etmez.
 */
const MAX_LISTING_IMAGES = 20;

export interface CreateDraftResult {
  ok: boolean;
  /** etsy_listing_id zaten dolu — hiçbir yazma yapılmadı. */
  skipped?: boolean;
  listingId?: number;
  url?: string;
  /** Hangi adımda durdu (idempotency|create|inventory|image|mirror). */
  step?: string;
  error?: string;
  /** Kısmi başarı uyarıları (ör. görsel yüklenemedi ama listing açıldı). */
  warnings?: string[];
}

/** Bir varyantı property-adı → değer (string) haritasına indirger. */
function variantPropMap(v: DraftVariant): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of asEtsyProperties(v.properties)) {
    const name = (p.property_name ?? "").trim();
    if (!name) continue;
    const value = (p.values ?? []).map((x) => String(x).trim()).filter(Boolean).join(", ");
    if (value) map.set(name, value);
  }
  return map;
}

/** Tag'leri Etsy kurallarına uydurur: ≤20 char, boş değil, en çok 13. */
function sanitizeTags(tags: string[] | null): string[] {
  return (tags ?? [])
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 20)
    .slice(0, 13);
}

/** Materyalleri Etsy kurallarına uydurur: ≤45 char, en çok 13. */
function sanitizeMaterials(materials: string[] | null): string[] {
  return (materials ?? [])
    .map((m) => m.trim())
    .filter((m) => m.length > 0 && m.length <= 45)
    .slice(0, 13);
}

/**
 * Varyasyon eşleme planı: hangi property'ler DEĞİŞİYOR (variation ekseni) →
 * custom slot 513/514; hangileri SABİT → açıklamaya not.
 */
interface VariationPlan {
  /** Değişen property adları (en çok 3 — slot sırasıyla). */
  varyingNames: string[];
  /** Slota sığmayan eksenler: genel create yolu yazmadan reddeder. */
  overflowNames: string[];
  /** Sabit property'ler: ad → tek değer (açıklama notu için). */
  constants: Map<string, string>;
}

function buildVariationPlan(variants: DraftVariant[]): VariationPlan {
  const maps = variants.map(variantPropMap);
  // Tüm property adlarını topla.
  const names = new Set<string>();
  for (const m of maps) for (const k of m.keys()) names.add(k);

  const varying: string[] = [];
  const constants = new Map<string, string>();
  for (const name of names) {
    const values = new Set(maps.map((m) => m.get(name) ?? ""));
    values.delete(""); // eksik değerleri dikkate alma
    if (values.size > 1) {
      varying.push(name);
    } else if (values.size === 1) {
      constants.set(name, [...values][0]);
    }
  }

  return {
    varyingNames: varying.slice(0, THREE_AXIS_SLOT_IDS.length),
    overflowNames: varying.slice(THREE_AXIS_SLOT_IDS.length),
    constants,
  };
}

/**
 * Eski elle açılmış bileklik taslaklarında seçenek metni `name` alanında
 * (ör. "6.5 in", "7 in"), fakat `properties` boş kalmış olabilir. Bu durumda
 * Etsy üç bedeni tek offering'e düşürürdü. Yalnız zincir bilekliklerde, zaten
 * değişen bir property yoksa, bu açık değerlerden `Bracelet Length` eksenini
 * türetiriz. Wedding band'lere Width veya Ring Size eklenmez.
 */
function prepareBraceletLengthVariants(
  variants: DraftVariant[],
  protocol: ListingProtocolSpec,
): DraftVariant[] {
  if (protocol.id !== "chain_bracelet" || variants.length < 2) return variants;
  if (buildVariationPlan(variants).varyingNames.length > 0) return variants;

  const lengths = variants.map((variant) => (variant.name ?? "").trim());
  if (lengths.some((length) => !length) || new Set(lengths).size < 2) {
    return variants;
  }

  return variants.map((variant, index) => ({
    ...variant,
    properties: {
      ...Object.fromEntries(variantPropMap(variant)),
      "Bracelet Length": lengths[index]!,
    },
  }));
}

/**
 * Protokolün dayattığı varyasyon eksenlerini doğrular.
 *
 * ÖNCESİ: bu fonksiyon `validateWeddingBandVariationAxes(sellerPath, variants)`
 * idi ve çağıran `sellerPath`'i `["Wedding Bands"]` diye ELLE geçiyordu — yani
 * kapı ürün ne olursa olsun HER ZAMAN açılıyordu. Kolye, bileklik ve küpe
 * taslakları bu yüzden "her varyant Width ve Ring Size içermelidir" hatasına
 * çarpıyordu. Artık eksenler protokolden gelir ve eksen listesi boşsa kapı hiç
 * çalışmaz.
 */
export function validateVariationAxes(
  spec: ListingProtocolSpec,
  variants: DraftVariant[],
): string | null {
  const required = spec.requiredVariationAxes;
  if (required.length === 0) return null;
  const normalizedRequired = required.map(normalizedTaxonomyName);

  if (variants.length === 0) {
    return `${spec.label} listinglerinde ${required.join(" ve ")} varyantları zorunludur.`;
  }
  const maps = variants.map(variantPropMap);
  const everyVariantHasAll = maps.every((map) =>
    normalizedRequired.every((name) =>
      [...map.keys()].some((key) => normalizedTaxonomyName(key) === name),
    ),
  );
  if (!everyVariantHasAll) {
    return `${spec.label} listinglerinde her varyant ${required.join(" ve ")} içermelidir.`;
  }
  for (let i = 0; i < required.length; i += 1) {
    const values = new Set(
      maps.flatMap((map) =>
        [...map.entries()]
          .filter(([name]) => normalizedTaxonomyName(name) === normalizedRequired[i])
          .map(([, value]) => value),
      ),
    );
    if (values.size < 2) {
      return `${spec.label} listinglerinde ${required[i]} gerçek bir varyasyon ekseni olmalıdır.`;
    }
  }
  return null;
}


/** Sabit property'leri açıklama sonuna okunur not olarak ekler. */
function appendConstantsToDescription(
  base: string,
  plan: VariationPlan,
): string {
  const lines: string[] = [];
  for (const [name, value] of plan.constants) lines.push(`${name}: ${value}`);
  if (lines.length === 0) return base;
  return `${base}\n\n${lines.join("\n")}`.trimEnd();
}

/**
 * Panel taslağını Etsy'de DRAFT listing olarak oluşturur. Ayrıntı ve varsayımlar
 * dosya başındaki blokta. Hiçbir adım throw etmez — sonuç nesnesi döner.
 */
export async function createDraftListingFromProduct(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
  product: DraftProduct,
): Promise<CreateDraftResult> {
  // ── 0) İdempotens: zaten Etsy'deyse hiç dokunma. ──────────────────────────
  if (product.etsy_listing_id != null) {
    return {
      ok: true,
      skipped: true,
      listingId: product.etsy_listing_id,
      url: `https://www.etsy.com/listing/${product.etsy_listing_id}`,
      step: "idempotency",
    };
  }

  // Explicit panel-only staging must not become Etsy authorization merely
  // because the generic send button was clicked. Legacy absent flags keep
  // their existing path; existing guarded three-axis sync is a separate flow.
  const approval = product.listing_metadata?.approval;
  if (
    approval !== null && typeof approval === "object" && !Array.isArray(approval) &&
    (approval as Record<string, unknown>).etsyDraftCreationAuthorized === false
  ) {
    return {
      ok: false,
      step: "validation",
      error: "Bu ürün yalnız panel taslağı olarak işaretli; Etsy taslak oluşturma izni kapalı. Hiçbir Etsy yazması yapılmadı.",
    };
  }

  const warnings: string[] = [];
  const rawVariants = product.variants ?? [];
  const overlongSku = rawVariants.find((variant) => (variant.sku ?? "").length > 32);
  if (overlongSku) {
    return {
      ok: false,
      step: "validation",
      error: `SKU 32 karakteri aşamaz: ${overlongSku.sku}`,
    };
  }
  // ÜRÜN TİPİ KAPISI — akışın geri kalanı bu protokole göre kurulur.
  // Tanınmayan tip sessizce yüzük sayılmaz; net hatayla durur.
  const protocol = resolveListingProtocol(product);
  if (!protocol) {
    return { ok: false, step: "validation", error: unknownProtocolError(product) };
  }
  const variants = prepareBraceletLengthVariants(rawVariants, protocol);
  const variationError = validateVariationAxes(protocol, variants);
  if (variationError) {
    return { ok: false, step: "validation", error: variationError };
  }

  const plan = buildVariationPlan(variants);
  if (plan.overflowNames.length > 0) {
    return {
      ok: false,
      step: "validation",
      error: `Etsy en çok üç varyasyon eksenini kabul eder; fazladan değişen: ${plan.overflowNames.join(", ")}. Hiçbir Etsy yazması yapılmadı.`,
    };
  }
  if (plan.varyingNames.length === 3 && variants.length > MAX_THREE_AXIS_PRODUCTS) {
    return {
      ok: false,
      step: "validation",
      error: `Üç eksenli listing en çok ${MAX_THREE_AXIS_PRODUCTS} varyant taşıyabilir (Etsy sınırı); bu taslakta ${variants.length} var. Hiçbir Etsy yazması yapılmadı.`,
    };
  }

  // Fiyat çapası: en düşük varyant fiyatı; varyant yoksa ürün fiyatı.
  const variantPrices = variants
    .map((v) => v.price_cents)
    .filter((c): c is number => c != null && c > 0);
  const anchorCents =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : product.price_cents ?? 0;
  if (!(anchorCents > 0)) {
    return { ok: false, step: "create", error: "Fiyat yok — çapa fiyat 0." };
  }

  // Varyasyon planı (değişen → slot, sabit → açıklama).
  // VARYANT KAYBI KİLİDİ — hiçbir şey yazmadan durur.
  // Envanter PUT'u yalnız "değişen property" varsa çalışır; plan SADECE
  // `product_variants.properties`ten kurulur. Panel composer'ından doğan
  // taslakta bu kolon hiç yazılmadığı için plan boş kalıyor, PUT sessizce
  // atlanıyor ve N varyantın hepsi Etsy'ye TEK offering olarak gidiyordu —
  // üstelik akış ok:true dönüp etsy_listing_id yazdığı için idempotens kilidi
  // devreye giriyor ve hata bir daha görünmüyordu.
  if (variants.length > 1 && plan.varyingNames.length === 0) {
    return {
      ok: false,
      step: "create",
      error:
        `${variants.length} varyant var ama varyasyon ekseni (ör. Ring Size / Width) tanımlı değil — ` +
        "hepsi Etsy'de tek seçeneğe düşerdi. Varyant satırlarına eksen adı + değer girip tekrar deneyin.",
    };
  }
  // Yüklenecek görseller: kapak (products.image_url) + panel galerisi
  // (listing_images). Tekilleştirilir — aynı URL hem kapak hem galeri satırı
  // olabilir; Etsy'ye iki kez yüklenmesi çift fotoğraf üretirdi.
  const gallery = [
    ...new Set(
      [product.image_url, ...(product.galleryUrls ?? [])]
        .map((u) => (u ?? "").trim())
        .filter(Boolean),
    ),
  ];
  // Fotoğrafsız listing Etsy'de YAYINLANAMAZ. Bunu create'ten sonra fark etmek
  // yayınlanamayan bir taslak + kilitli etsy_listing_id bırakır; önceden dur.
  if (gallery.length === 0) {
    return {
      ok: false,
      step: "create",
      error:
        "Görsel yok — Etsy fotoğrafsız listing'i yayınlatmaz. Listing'e en az bir görsel ekleyip tekrar deneyin.",
    };
  }
  if (gallery.length > MAX_LISTING_IMAGES) {
    warnings.push(
      `${gallery.length} görsel var; Etsy sınırı ${MAX_LISTING_IMAGES} — ilk ${MAX_LISTING_IMAGES} yüklendi.`,
    );
  }

  const cleanDesc = stripInternalTrailer(product.description ?? "");
  const finalDesc = appendConstantsToDescription(cleanDesc, plan);

  // Taksonomi çöz.
  let taxonomyId: number;
  try {
    const resolved = await resolveTaxonomyIdForProtocol(client, protocol);
    if (!resolved.ok) {
      return { ok: false, step: "create", error: resolved.error };
    }
    taxonomyId = resolved.taxonomyId;
  } catch (e) {
    return {
      ok: false,
      step: "create",
      error: `Etsy kategorisi okunamadı: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  // Profiller (kargo + iade).
  let profiles: ShopProfiles;
  try {
    profiles = await resolveShopProfiles(admin, client, orgId, shopId);
  } catch (e) {
    return {
      ok: false,
      step: "create",
      error: `Kargo/iade profili okunamadı: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  if (profiles.shippingProfileId == null) {
    return {
      ok: false,
      step: "create",
      error: "Mağazada kargo profili bulunamadı — Etsy'de bir profil oluşturun.",
    };
  }
  if (profiles.readinessStateId == null) {
    return {
      ok: false,
      step: "create",
      error:
        "Mağazada işlem profili (processing profile) yok ve oluşturulamadı — " +
        "Etsy Shop Manager > Settings > Shipping'ten made-to-order bir işlem " +
        "süresi ekleyin, sonra tekrar deneyin.",
    };
  }

  const tags = sanitizeTags(product.tags);
  const materials = sanitizeMaterials(product.materials);
  const listingQuantity = product.quantity ?? 1;

  // ── 1) DRAFT listing oluştur (form-encoded). ──────────────────────────────
  let listingId: number;
  try {
    const createForm: Record<string, string | number | undefined | null> = {
      quantity: listingQuantity,
      title: product.title,
      description: finalDesc,
      price: anchorCents / 100,
      who_made: "i_did",
      when_made: "made_to_order",
      is_supply: "false",
      taxonomy_id: taxonomyId,
      shipping_profile_id: profiles.shippingProfileId,
      return_policy_id: profiles.returnPolicyId ?? undefined,
      // Etsy 2025 migrasyonu: fiziksel listing'de işlem profili ZORUNLU.
      readiness_state_id: profiles.readinessStateId,
      // Paket ağırlık + boyut (yüzük kutusu) — hesaplı profil bunları şart
      // koşar; free shipping'te fiyata gömülü olduğundan alıcıya yansımaz.
      item_weight: protocol.parcel.weight,
      item_weight_unit: protocol.parcel.weight_unit,
      item_length: protocol.parcel.length,
      item_width: protocol.parcel.width,
      item_height: protocol.parcel.height,
      item_dimensions_unit: protocol.parcel.dimensions_unit,
      tags: tags.join(","),
      materials: materials.join(","),
      // NOT: legacy is_personalizable/personalization_* alanları Etsy 2025'te
      // create'te DEPRECATED — create sonrası ayrı personalization ucundan yazılır.
      should_auto_renew: "false",
      state: "draft",
      type: "physical",
    };
    const listing = await client.requestForm<{ listing_id: number }>(
      "POST",
      etsyPaths.createListing(shopId),
      createForm,
    );
    listingId = listing.listing_id;
  } catch (e) {
    return {
      ok: false,
      step: "create",
      error: e instanceof Error ? e.message : "Listing oluşturulamadı.",
    };
  }

  const url = `https://www.etsy.com/listing/${listingId}`;

  // ── 1b) Kişiselleştirme — 2025 migrasyonu: legacy create alanları yerine
  // ayrı uç. PROTOKOLE BAĞLI: alyansta iki soru (iç gravür metni + yazı stili),
  // kolyede kişiselleştirme YOK ve uç hiç çağrılmaz. Alyansın 30 karakterlik
  // gravür sorusunu kolyeye taşımak, sunulmayan bir hizmeti vaat etmek olurdu.
  // Başarısız olursa listing yaşar; uyarı eklenir.
  if (protocol.personalization) {
    try {
      await client.request(
        "POST",
        etsyPaths.listingPersonalization(shopId, listingId) +
          "?supports_multiple_personalization_questions=true",
        { personalization_questions: protocol.personalization },
      );
    } catch (e) {
      warnings.push(
        `Kişiselleştirme (gravür + yazı stili) eklenemedi: ${
          e instanceof Error ? e.message : String(e)
        }. Listing açıldı; alanları Etsy'de elle ekleyebilir veya listing ` +
          `sayfasındaki kişiselleştirme kartından kopyalayabilirsiniz.`,
      );
    }
  }

  // ── 2) Envanter PUT (yalnız gerçek varyasyon varsa). ──────────────────────
  // Değişen property yoksa (tek fiyat/tek varyant) createListing'in otomatik
  // ürün/offering'i yeterli — envanter PUT atlanır.
  if (plan.varyingNames.length > 0 && variants.length > 1) {
    try {
      const slotIds = slotIdsFor(plan);
      const usedSlots = plan.varyingNames.map((_, i) => slotIds[i]);
      const inventoryProducts = variants.map((v) => {
        const pm = variantPropMap(v);
        const property_values = plan.varyingNames.map((name, i) => ({
          property_id: slotIds[i],
          property_name: name,
          // Değeri olmayan varyantta "—" placeholder (Etsy boş değer reddeder).
          values: [pm.get(name) || "—"],
        }));
        const offeringCents = v.price_cents ?? anchorCents;
        return {
          sku: v.sku ?? "",
          property_values,
          offerings: [
            {
              price: offeringCents / 100,
              quantity: v.quantity ?? listingQuantity,
              is_enabled: true,
              // Etsy 2025: her offering'in de işlem profili olmalı ("All
              // offerings need readiness state") — listing-düzeyi yetmiyor.
              readiness_state_id: profiles.readinessStateId,
            },
          ],
        };
      });
      // legacy=false: Etsy 2025 envanter modeli — offering-düzeyi
      // readiness_state_id'yi yalnız bu modda kabul eder (yoksa "All offerings
      // need readiness state"). readiness_state_on_property=[] → işlem profili
      // hiçbir property'ye göre DEĞİŞMEZ (tüm offering'ler aynı made-to-order).
      await client.request(
        "PUT",
        etsyPaths.listingInventory(listingId) +
          (plan.varyingNames.length === 3
            ? "?legacy=false&max_variations_supported=3"
            : "?legacy=false"),
        {
          products: inventoryProducts,
          // Her tam kombinasyon benzersiz fiyat/sku taşır → kullanılan tüm slotlar.
          price_on_property: usedSlots,
          quantity_on_property: [],
          sku_on_property: usedSlots,
          readiness_state_on_property: [],
        },
      );
    } catch (e) {
      // Listing açıldı ama envanter yazılamadı — KISMI başarı; kullanıcı düzeltsin.
      return {
        ok: false,
        listingId,
        url,
        step: "inventory",
        error: e instanceof Error ? e.message : "Envanter yazılamadı.",
        warnings,
      };
    }
  }

  // ── 3) Görseller: kapak + panel galerisi (URL'ler PUBLIC olmalı). ─────────
  // Sıra paneldeki sıradır (kapak önce, sonra listing_images.position) → Etsy
  // rank 1..N. Her görsel BAĞIMSIZ yüklenir: biri patlarsa listing ve diğer
  // görseller yaşar, yalnız o görsel için uyarı düşer.
  for (const [i, imageUrl] of gallery.slice(0, MAX_LISTING_IMAGES).entries()) {
    const sira = i + 1;
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        warnings.push(
          `Görsel ${sira} indirilemedi (HTTP ${res.status}) — Etsy'ye yüklenmedi.`,
        );
        continue;
      }
      const buf = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      // Üreteç/köken meta verisini sök (ör. Higgsfield `hf-job-id`) — mağazaya
      // çıkan ürün fotoğrafı kaynağını ele veren etiketler taşımasın; galeri
      // yükleme yolu (gorsel-uretim/galeri) ve indirme proxy'si ile aynı kural.
      // (Piksele gömülü SynthID filigranı meta veri DEĞİLDİR, sökülemez.)
      const clean = stripImageMetadata(new Uint8Array(buf));
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
          ? "webp"
          : "jpg";
      const fd = new FormData();
      fd.append(
        "image",
        new Blob([clean], { type: contentType }),
        `listing-${sira}.${ext}`,
      );
      fd.append("rank", String(sira));
      fd.append("alt_text", product.title.slice(0, 250));
      await client.requestMultipart(
        "POST",
        etsyPaths.listingImages(shopId, listingId),
        fd,
      );
    } catch (e) {
      // Görsel kritik değil — listing korunur, uyarı olarak dön.
      warnings.push(
        `Görsel ${sira} yüklenemedi: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // ── 4) Paneli bağla (vekil taze) + denetim logu. ──────────────────────────
  try {
    const { error } = await admin
      .from("products")
      .update({ etsy_listing_id: listingId, url })
      .eq("id", product.id)
      .eq("org_id", orgId);
    if (error) {
      // Etsy'de taslak AÇILDI ama panel bağlanamadı — tekrar denerse idempotens
      // çift açar. Kullanıcıya net söyle.
      return {
        ok: false,
        listingId,
        url,
        step: "mirror",
        error: `Taslak Etsy'de açıldı (#${listingId}) ama panele bağlanamadı: ${error.message}. Etsy listing id'sini elle girin.`,
        warnings,
      };
    }
  } catch (e) {
    return {
      ok: false,
      listingId,
      url,
      step: "mirror",
      error: `Taslak açıldı (#${listingId}) ama panele bağlanamadı: ${e instanceof Error ? e.message : String(e)}.`,
      warnings,
    };
  }

  await logAudit(admin, {
    orgId,
    action: "etsy.listing_create",
    entityType: "product",
    entityId: product.id,
    summary: `Etsy taslak listing açıldı (#${listingId}): ${product.title}`,
    source: "app",
  });

  return {
    ok: true,
    listingId,
    url,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
