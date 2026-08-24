import type { SupabaseClient } from "@supabase/supabase-js";

import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { asEtsyProperties, type RawVariantProperties } from "@/lib/variant-properties";
import { logAudit } from "@/lib/audit";

/**
 * PANEL DRAFT TO ETSY DRAFT LISTING.
 *
 * The function requires a validated etsy-listing-v1 metadata record. Product
 * type, exact live seller taxonomy path, production identity, parcel, processing
 * time and personalization are listing data, never hardcoded defaults.
 *
 * The flow creates an unpublished Etsy draft, writes at most two inventory
 * axes, uploads the public cover image when available, mirrors the Etsy id and
 * records an audit event. A product with an existing Etsy id is never touched.
 * Every step returns a structured result so partial external success stays
 * visible and recoverable.
 */

/** Etsy custom variation slot id'leri (en fazla iki eksen). */
const CUSTOM_SLOT_IDS = [513, 514] as const;

/** Açıklamanın sonundaki dahili not bloğunu söker: "\n\n---\n[EON NN · ...]".
 *  scripts/eon-push-drafts.ts stripInternalTrailer ile BİREBİR aynı desen. */
export function stripInternalTrailer(desc: string): string {
  return desc.replace(/\n*---\n\[EON [\s\S]*\]$/m, "").trimEnd();
}

export interface TaxNode {
  id: number;
  name: string;
  children?: TaxNode[];
}

function normalizedTaxonomyName(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function matchTaxonomyPath(
  node: TaxNode,
  path: string[],
  pathIndex: number,
): TaxNode | null {
  if (normalizedTaxonomyName(node.name) !== normalizedTaxonomyName(path[pathIndex])) {
    return null;
  }
  if (pathIndex === path.length - 1) return node;
  for (const child of node.children ?? []) {
    const match = matchTaxonomyPath(child, path, pathIndex + 1);
    if (match) return match;
  }
  return null;
}

/** Finds an exact nested seller taxonomy path anywhere in the live tree. */
export function findTaxonomyNodeByPath(
  nodes: TaxNode[],
  path: string[],
): TaxNode | null {
  if (path.length === 0) return null;
  const queue = [...nodes];
  while (queue.length > 0) {
    const node = queue.shift()!;
    const match = matchTaxonomyPath(node, path, 0);
    if (match) return match;
    queue.push(...(node.children ?? []));
  }
  return null;
}

const taxonomyIdCache = new Map<string, number>();

/** Resolves only the manifest's verified path. There is no product fallback. */
export async function resolveSellerTaxonomyId(
  client: EtsyClient,
  sellerPath: string[],
): Promise<number | null> {
  const key = sellerPath.map(normalizedTaxonomyName).join(" > ");
  const cached = taxonomyIdCache.get(key);
  if (cached != null) return cached;
  const tax = await client.get<{ results: TaxNode[] }>(
    etsyPaths.sellerTaxonomyNodes(),
  );
  const nodes = tax.results ?? [];
  const node = findTaxonomyNodeByPath(nodes, sellerPath);
  if (!node) return null;
  taxonomyIdCache.set(key, node.id);
  return node.id;
}

export interface ShopProfiles {
  shippingProfileId: number | null;
  returnPolicyId: number | null;
  /** İşlem profili (readiness state) - Etsy fiziksel üründe zorunlu. */
  readinessStateId: number | null;
}

/**
 * Bir işlem profili (readiness state) çözer; yoksa oluşturur. Etsy 2025
 * migrasyonundan beri fiziksel listing `readiness_state_id` ZORUNLU. Mevcut
 * tanımlardan `made_to_order` tercih edilir (listinglerimiz sipariş üzerine);
 * yoksa ilk tanım; hiç yoksa made-to-order 5-7 gün oluşturulur (kargo metniyle
 * tutarlı). Okunamaz/oluşturulamazsa null döner (create adımı net hata verir).
 */
async function resolveReadinessStateId(
  client: EtsyClient,
  shopId: number,
  processingDays: { min: number; max: number },
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
    // Create the requested made-to-order profile only when none exists.
    const created = await client.requestForm<{ readiness_state_id: number }>(
      "POST",
      etsyPaths.readinessStateDefinitions(shopId),
      {
        readiness_state: "made_to_order",
        min_processing_time: processingDays.min,
        max_processing_time: processingDays.max,
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
 *  - İade: canlı GET returnPolicies ilk kayıt (okunamzsa null - Etsy fiziksel
 *    üründe iade politikası ister ama create adımı yine denenir).
 *  - İşlem profili: resolveReadinessStateId (mevcut made_to_order / ilk / oluştur).
 */
export async function resolveShopProfiles(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
  processingDays: { min: number; max: number },
): Promise<ShopProfiles> {
  let shippingProfileId: number | null = null;

  // Kargo profili - SABİT/manuel (profile_type="manual") TERCİH edilir.
  // Neden: hesaplı (calculated) profil alıcıdan ağırlığa göre posta alır VE
  // listing'de item_weight/boyut şart koşar (yoksa create 400). Açıklamalar
  // "free shipping" vaat ettiğinden ve kargo bedeli fiyata gömüldüğünden
  // sabit/ücretsiz profil doğru olandır. Canlı GET profile_type taşır; manuel
  // yoksa panel-stored / ilk profile düşülür (o org'da calculated tek seçenekse
  // create Etsy'nin net ağırlık hatasını döndürür - kullanıcı yönlendirilir).
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

  // İade politikası - okunamazsa null (yut, create yine denenir).
  let returnPolicyId: number | null = null;
  try {
    const rp = await client.get<{ results: { return_policy_id: number }[] }>(
      etsyPaths.returnPolicies(shopId),
    );
    returnPolicyId = rp.results?.[0]?.return_policy_id ?? null;
  } catch {
    returnPolicyId = null;
  }

  const readinessStateId = await resolveReadinessStateId(
    client,
    shopId,
    processingDays,
  );

  return { shippingProfileId, returnPolicyId, readinessStateId };
}

/** Panel varyantı (create için gereken alt küme). */
export interface DraftVariant {
  sku: string | null;
  properties: RawVariantProperties;
  price_cents: number | null;
  quantity: number | null;
}

type EtsyWhoMade = "i_did" | "collective" | "someone_else";

export interface EtsyListingProtocolMetadata {
  protocolVersion: "etsy-listing-v1";
  productType: string;
  taxonomy: {
    sellerPath: string[];
  };
  production: {
    whoMade: EtsyWhoMade;
    whenMade: "made_to_order";
    processingDays: { min: number; max: number };
    personalization: {
      enabled: boolean;
      question?: string;
      instructions?: string;
      required?: boolean;
      maxAllowedCharacters?: number;
    };
    parcel: {
      weight: number;
      weightUnit: string;
      length: number;
      width: number;
      height: number;
      dimensionsUnit: string;
    };
  };
  approval: {
    ownerApprovalRequiredForEtsy: true;
    status?: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseListingProtocolMetadata(
  productType: string | null,
  raw: unknown,
): { ok: true; value: EtsyListingProtocolMetadata } | { ok: false; error: string } {
  if (!productType) {
    return { ok: false, error: "Ürün tipi doğrulanmamış. Önce listing protokolünü tamamlayın." };
  }
  if (!isRecord(raw) || raw.protocolVersion !== "etsy-listing-v1") {
    return { ok: false, error: "Global Etsy listing protokolü bu üründe kayıtlı değil." };
  }
  if (raw.productType !== productType) {
    return { ok: false, error: "Ürün tipi ile listing protokolü birbiriyle eşleşmiyor." };
  }

  const taxonomy = raw.taxonomy;
  if (
    !isRecord(taxonomy) ||
    !Array.isArray(taxonomy.sellerPath) ||
    taxonomy.sellerPath.length < 2 ||
    !taxonomy.sellerPath.every((part) => typeof part === "string" && part.trim())
  ) {
    return { ok: false, error: "Doğrulanmış Etsy seller taxonomy yolu eksik." };
  }

  const production = raw.production;
  if (!isRecord(production)) {
    return { ok: false, error: "Üretim ve paket bilgileri eksik." };
  }
  if (!new Set(["i_did", "collective", "someone_else"]).has(String(production.whoMade))) {
    return { ok: false, error: "Etsy who_made değeri geçersiz." };
  }
  if (production.whenMade !== "made_to_order") {
    return { ok: false, error: "when_made değeri made_to_order olmalı." };
  }

  const processingDays = production.processingDays;
  if (
    !isRecord(processingDays) ||
    typeof processingDays.min !== "number" ||
    typeof processingDays.max !== "number" ||
    !Number.isInteger(processingDays.min) ||
    !Number.isInteger(processingDays.max) ||
    processingDays.min < 1 ||
    processingDays.max < processingDays.min
  ) {
    return { ok: false, error: "Geçerli minimum ve maksimum üretim süresi eksik." };
  }

  const parcel = production.parcel;
  if (
    !isRecord(parcel) ||
    !["weight", "length", "width", "height"].every(
      (key) => Number(parcel[key]) > 0,
    ) ||
    typeof parcel.weightUnit !== "string" ||
    typeof parcel.dimensionsUnit !== "string"
  ) {
    return { ok: false, error: "Ürün tipine uygun paket ağırlığı veya ölçüleri eksik." };
  }

  const personalization = production.personalization;
  if (!isRecord(personalization) || typeof personalization.enabled !== "boolean") {
    return { ok: false, error: "Kişiselleştirme açık veya kapalı olarak belirtilmeli." };
  }
  if (
    personalization.enabled &&
    (typeof personalization.question !== "string" ||
      typeof personalization.instructions !== "string")
  ) {
    return { ok: false, error: "Kişiselleştirme sorusu ve talimatı eksik." };
  }

  const approval = raw.approval;
  if (!isRecord(approval) || approval.ownerApprovalRequiredForEtsy !== true) {
    return { ok: false, error: "Etsy işlemi için owner onay kapısı eksik." };
  }

  return {
    ok: true,
    value: raw as unknown as EtsyListingProtocolMetadata,
  };
}

/** Create için gereken ürün + varyant kümesi. */
export interface DraftProduct {
  id: string;
  org_id: string;
  etsy_listing_id: number | null;
  sku: string | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  materials: string[] | null;
  price_cents: number | null;
  quantity: number | null;
  image_url: string | null;
  product_type: string | null;
  listing_metadata: unknown;
  variants: DraftVariant[];
}

export interface CreateDraftResult {
  ok: boolean;
  /** etsy_listing_id zaten dolu - hiçbir yazma yapılmadı. */
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
  /** Değişen property adları (en çok 2 - slot sırasıyla). */
  varyingNames: string[];
  /** Slota sığmayan fazladan değişen property adları (uyarı). */
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
    varyingNames: varying.slice(0, CUSTOM_SLOT_IDS.length),
    overflowNames: varying.slice(CUSTOM_SLOT_IDS.length),
    constants,
  };
}

/** Sabit + overflow property'leri açıklama sonuna okunur not olarak ekler. */
function appendConstantsToDescription(
  base: string,
  plan: VariationPlan,
): string {
  const lines: string[] = [];
  for (const [name, value] of plan.constants) lines.push(`${name}: ${value}`);
  for (const name of plan.overflowNames) lines.push(`${name}: varies`);
  if (lines.length === 0) return base;
  return `${base}\n\n${lines.join("\n")}`.trimEnd();
}

/**
 * Panel taslağını Etsy'de DRAFT listing olarak oluşturur. Ayrıntı ve varsayımlar
 * dosya başındaki blokta. Hiçbir adım throw etmez - sonuç nesnesi döner.
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

  const warnings: string[] = [];
  const protocolResult = parseListingProtocolMetadata(
    product.product_type,
    product.listing_metadata,
  );
  if (!protocolResult.ok) {
    return { ok: false, step: "validation", error: protocolResult.error };
  }
  const protocol = protocolResult.value;
  const variants = product.variants ?? [];
  const overlongSku = variants.find((variant) => (variant.sku ?? "").length > 32);
  if (overlongSku) {
    return {
      ok: false,
      step: "validation",
      error: `SKU 32 karakteri aşamaz: ${overlongSku.sku}`,
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
    return { ok: false, step: "create", error: "Fiyat yok - çapa fiyat 0." };
  }

  // Varyasyon planı (değişen → slot, sabit → açıklama).
  const plan = buildVariationPlan(variants);
  if (plan.overflowNames.length > 0) {
    warnings.push(
      `Etsy en fazla 2 varyasyon ekseni kabul eder; şu property'ler açıklamaya taşındı: ${plan.overflowNames.join(", ")}.`,
    );
  }

  const cleanDesc = stripInternalTrailer(product.description ?? "");
  const finalDesc = appendConstantsToDescription(cleanDesc, plan);

  // Taksonomi çöz.
  let taxonomyId: number | null;
  try {
    taxonomyId = await resolveSellerTaxonomyId(
      client,
      protocol.taxonomy.sellerPath,
    );
  } catch (e) {
    return {
      ok: false,
      step: "create",
      error: `Etsy kategorisi okunamadı: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  if (taxonomyId == null) {
    return {
      ok: false,
      step: "create",
      error: `Etsy kategorisi çözülemedi: ${protocol.taxonomy.sellerPath.join(" > ")}.`,
    };
  }

  // Profiller (kargo + iade).
  let profiles: ShopProfiles;
  try {
    profiles = await resolveShopProfiles(
      admin,
      client,
      orgId,
      shopId,
      protocol.production.processingDays,
    );
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
      error: "Mağazada kargo profili bulunamadı - Etsy'de bir profil oluşturun.",
    };
  }
  if (profiles.readinessStateId == null) {
    return {
      ok: false,
      step: "create",
      error:
        "Mağazada işlem profili (processing profile) yok ve oluşturulamadı - " +
        "Etsy Shop Manager > Settings > Shipping'ten made-to-order bir işlem " +
        "süresi ekleyin, sonra tekrar deneyin.",
    };
  }

  const tags = sanitizeTags(product.tags);
  const materials = sanitizeMaterials(product.materials);
  const listingQuantity = product.quantity ?? 1;
  if (tags.length !== 13) {
    return {
      ok: false,
      step: "validation",
      error: "Etsy listingi tam 13 benzersiz ve 20 karakteri aşmayan tag içermeli.",
    };
  }
  if (new Set(tags.map((tag) => tag.toLocaleLowerCase("en-US"))).size !== 13) {
    return { ok: false, step: "validation", error: "Etsy tagleri benzersiz olmalı." };
  }
  if (materials.length === 0) {
    return { ok: false, step: "validation", error: "Doğrulanmış materyal bilgisi eksik." };
  }
  if (!product.title.trim() || product.title.length > 140) {
    return { ok: false, step: "validation", error: "Etsy başlığı boş veya 140 karakterden uzun." };
  }

  const parcel = protocol.production.parcel;

  // ── 1) DRAFT listing oluştur (form-encoded). ──────────────────────────────
  let listingId: number;
  try {
    const createForm: Record<string, string | number | undefined | null> = {
      quantity: listingQuantity,
      title: product.title,
      description: finalDesc,
      price: anchorCents / 100,
      who_made: protocol.production.whoMade,
      when_made: protocol.production.whenMade,
      is_supply: "false",
      taxonomy_id: taxonomyId,
      shipping_profile_id: profiles.shippingProfileId,
      return_policy_id: profiles.returnPolicyId ?? undefined,
      // Etsy 2025 migrasyonu: fiziksel listing'de işlem profili ZORUNLU.
      readiness_state_id: profiles.readinessStateId,
      item_weight: parcel.weight,
      item_weight_unit: parcel.weightUnit,
      item_length: parcel.length,
      item_width: parcel.width,
      item_height: parcel.height,
      item_dimensions_unit: parcel.dimensionsUnit,
      tags: tags.join(","),
      materials: materials.join(","),
      // NOT: legacy is_personalizable/personalization_* alanları Etsy 2025'te
      // create'te DEPRECATED - create sonrası ayrı personalization ucundan yazılır.
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

  const personalization = protocol.production.personalization;
  if (personalization.enabled) {
    try {
      await client.request(
        "POST",
        etsyPaths.listingPersonalization(shopId, listingId) +
          "?supports_multiple_personalization_questions=true",
        {
          personalization_questions: [
            {
              question_type: "text_input",
              question_text: personalization.question,
              instructions: personalization.instructions,
              required: personalization.required ?? false,
              max_allowed_characters:
                personalization.maxAllowedCharacters ?? 30,
            },
          ],
        },
      );
    } catch (e) {
      warnings.push(
        `Kişiselleştirme alanı eklenemedi: ${
          e instanceof Error ? e.message : String(e)
        }. Listing açıldı; gravür alanını Etsy'de elle ekleyebilirsiniz.`,
      );
    }
  }

  // ── 2) Envanter PUT (yalnız gerçek varyasyon varsa). ──────────────────────
  // Değişen property yoksa (tek fiyat/tek varyant) createListing'in otomatik
  // ürün/offering'i yeterli - envanter PUT atlanır.
  if (plan.varyingNames.length > 0 && variants.length > 1) {
    try {
      const usedSlots = plan.varyingNames.map((_, i) => CUSTOM_SLOT_IDS[i]);
      const inventoryProducts = variants.map((v) => {
        const pm = variantPropMap(v);
        const property_values = plan.varyingNames.map((name, i) => ({
          property_id: CUSTOM_SLOT_IDS[i],
          property_name: name,
          // Değeri olmayan varyantta "-" placeholder (Etsy boş değer reddeder).
          values: [pm.get(name) || "-"],
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
              // offerings need readiness state") - listing-düzeyi yetmiyor.
              readiness_state_id: profiles.readinessStateId,
            },
          ],
        };
      });
      // legacy=false: Etsy 2025 envanter modeli - offering-düzeyi
      // readiness_state_id'yi yalnız bu modda kabul eder (yoksa "All offerings
      // need readiness state"). readiness_state_on_property=[] → işlem profili
      // hiçbir property'ye göre DEĞİŞMEZ (tüm offering'ler aynı made-to-order).
      await client.request(
        "PUT",
        etsyPaths.listingInventory(listingId) + "?legacy=false",
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
      // Listing açıldı ama envanter yazılamadı - KISMI başarı; kullanıcı düzeltsin.
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

  // ── 3) Kapak görseli (opsiyonel; image_url PUBLIC olmalı). ────────────────
  if (product.image_url) {
    try {
      const res = await fetch(product.image_url);
      if (!res.ok) {
        warnings.push(
          `Kapak görseli indirilemedi (HTTP ${res.status}) - listing görselsiz açıldı.`,
        );
      } else {
        const buf = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        const fd = new FormData();
        fd.append("image", new Blob([buf], { type: contentType }), "cover.jpg");
        fd.append("rank", "1");
        await client.requestMultipart(
          "POST",
          etsyPaths.listingImages(shopId, listingId),
          fd,
        );
      }
    } catch (e) {
      // Görsel kritik değil - listing korunur, uyarı olarak dön.
      warnings.push(
        `Kapak görseli yüklenemedi: ${e instanceof Error ? e.message : String(e)}`,
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
      // Etsy'de taslak AÇILDI ama panel bağlanamadı - tekrar denerse idempotens
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
