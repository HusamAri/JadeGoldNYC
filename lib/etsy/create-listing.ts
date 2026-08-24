import type { SupabaseClient } from "@supabase/supabase-js";

import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { asEtsyProperties, type RawVariantProperties } from "@/lib/variant-properties";
import { logAudit } from "@/lib/audit";

/**
 * PANEL TASLAĞI → ETSY DRAFT LISTING.
 *
 * `scripts/eon-push-drafts.ts`'in canlı-kanıtlı mantığını uygulama içine taşır:
 * kullanıcı listing'i "tailor" ettikten sonra tek tuşla Etsy'de TASLAK (draft —
 * yayınlanmaz) listing açılır. Akış:
 *   1. createListing (POST, form-encoded): başlık, temiz açıklama, tag/materyal,
 *      çapa fiyat (en düşük varyant), uygun ürünlerde opsiyonel kişiselleştirme.
 *   2. Envanter PUT: DEĞİŞEN property'ler custom slot 513/514'e; her iki eksen de
 *      fiyat taşır (price_on_property = kullanılan slotlar); fiyat/adet/sku per
 *      offering panel varyantlarından. Sabit property'ler açıklamada kalır.
 *   3. (opsiyonel) products.image_url PUBLIC ise baytı çekip multipart kapak yükle.
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
 *  B. taxonomy_id: "Wedding Bands" düğümü ağaçtan çözülür (yoksa "Rings").
 *     Canlıda taksonomi adı değişmişse veya ağaç şekli farklıysa çözüm boş
 *     dönebilir → o durumda create adımı "Etsy kategorisi çözülemedi" ile durur.
 *  C. Kişiselleştirme: EON Quiet Signs SKU ailesinde kapalıdır. Diğer ürünlerde
 *     required=false ve max=30 char iç gravür olarak eklenir.
 *  D. Varyasyon eşleme: Etsy en fazla 2 custom variation ekseni kabul eder →
 *     DEĞİŞEN ilk 2 property slot 513/514'e; 2'den fazla değişen varsa (nadir)
 *     kalanı açıklamaya not düşülür (canlıda uyarı olarak döneriz).
 *  E. price_on_property: her tam kombinasyon benzersiz fiyat taşıdığından
 *     kullanılan TÜM variation slotları price_on_property'e girer (script deseni).
 *     Etsy, listelenen property'lerin gerçekten variation olmasını ister — sabit
 *     property'ler bilerek slota konmaz.
 *  F. Tag kuralı: her tag ≤20 karakter, en çok 13 tag (Etsy sınırı) — aşanlar
 *     elenir/kırpılır. Materyal: en çok 13, her biri ≤45 char.
 *  G. Kapak görseli: image_url PUBLIC erişilebilir olmalı (Supabase Storage
 *     public bucket). İmzalı/özel URL ise fetch 400/403 döner → görsel adımı
 *     hata verir ama listing ve envanter KORUNUR (kısmi başarı).
 */

/**
 * Kişiselleştirme talimatı — iç gravür (script ile aynı metin, 30 char limit).
 * Etsy `instructions` alanı EN FAZLA 120 karakter (aşılırsa 400 too_long) — kısa tut.
 */
const PERSONALIZATION_INSTRUCTIONS =
  "Optional inside-band engraving, up to 30 characters. " +
  "Script by default; type BLOCK for block letters. Blank = none.";

/** Etsy custom variation slot id'leri (en fazla iki eksen). */
const CUSTOM_SLOT_IDS = [513, 514] as const;

/**
 * Kargo paketi ölçüleri — yüzük kutusu + koruyucu zarf (kullanıcı kararı).
 * Etsy hesaplı (calculated) kargo profili listing'de item_weight + boyut ŞART
 * koşar (yoksa create 400). Bu değerler listing'e yazılınca create her profil
 * tipiyle çalışır. Kargo bedeli fiyata gömülü (free shipping) olduğundan bu
 * ölçüler yalnız Etsy'nin zorunlu alanını doldurur; ABD ücretsiz kalır.
 * Tüm yüzükler için sabit: hafif altın yüzük + sunum kutusu + kabarcıklı zarf.
 */
const PARCEL = {
  weight: 3,
  weight_unit: "oz",
  length: 4,
  width: 4,
  height: 2,
  dimensions_unit: "in",
} as const;

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

/** Taksonomi ağacında ada göre BFS (en sığ eşleşme). */
function findTaxonomyNode(nodes: TaxNode[], name: string): TaxNode | null {
  const queue = [...nodes];
  while (queue.length) {
    const n = queue.shift()!;
    if (n.name.toLowerCase() === name.toLowerCase()) return n;
    if (n.children) queue.push(...n.children);
  }
  return null;
}

// Taksonomi id'si oturum içinde sabittir — modül-cache ile tekrar çözülmez.
let cachedWeddingBandTaxonomyId: number | null = null;

/**
 * "Wedding Bands" taksonomi id'sini çözer (yoksa "Rings"). Modül-cache'li.
 * Bulunamazsa null döner (çağıran adımı anlaşılır hata ile durdurur).
 */
export async function resolveWeddingBandTaxonomyId(
  client: EtsyClient,
): Promise<number | null> {
  if (cachedWeddingBandTaxonomyId != null) return cachedWeddingBandTaxonomyId;
  const tax = await client.get<{ results: TaxNode[] }>(
    etsyPaths.sellerTaxonomyNodes(),
  );
  const nodes = tax.results ?? [];
  const node =
    findTaxonomyNode(nodes, "Wedding Bands") ?? findTaxonomyNode(nodes, "Rings");
  if (!node) return null;
  cachedWeddingBandTaxonomyId = node.id;
  return node.id;
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
  properties: RawVariantProperties;
  price_cents: number | null;
  quantity: number | null;
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
  variants: DraftVariant[];
}

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
  /** Değişen property adları (en çok 2 — slot sırasıyla). */
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

  const warnings: string[] = [];
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
    return { ok: false, step: "create", error: "Fiyat yok — çapa fiyat 0." };
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
    taxonomyId = await resolveWeddingBandTaxonomyId(client);
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
      error: "Etsy kategorisi çözülemedi (Wedding Bands/Rings bulunamadı).",
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
      item_weight: PARCEL.weight,
      item_weight_unit: PARCEL.weight_unit,
      item_length: PARCEL.length,
      item_width: PARCEL.width,
      item_height: PARCEL.height,
      item_dimensions_unit: PARCEL.dimensions_unit,
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

  // Quiet Signs products are intentionally sold without engraving.
  const personalizationEnabled = !product.sku?.startsWith("EON-QS26-");
  if (personalizationEnabled) {
    try {
      await client.request(
        "POST",
        etsyPaths.listingPersonalization(shopId, listingId) +
          "?supports_multiple_personalization_questions=true",
        {
          personalization_questions: [
            {
              question_type: "text_input",
              question_text: "Inside band engraving (optional)",
              instructions: PERSONALIZATION_INSTRUCTIONS,
              required: false,
              max_allowed_characters: 30,
            },
          ],
        },
      );
    } catch (e) {
      warnings.push(
        `Kişiselleştirme (iç gravür) eklenemedi: ${
          e instanceof Error ? e.message : String(e)
        }. Listing açıldı; gravür alanını Etsy'de elle ekleyebilirsiniz.`,
      );
    }
  }

  // ── 2) Envanter PUT (yalnız gerçek varyasyon varsa). ──────────────────────
  // Değişen property yoksa (tek fiyat/tek varyant) createListing'in otomatik
  // ürün/offering'i yeterli — envanter PUT atlanır.
  if (plan.varyingNames.length > 0 && variants.length > 1) {
    try {
      const usedSlots = plan.varyingNames.map((_, i) => CUSTOM_SLOT_IDS[i]);
      const inventoryProducts = variants.map((v) => {
        const pm = variantPropMap(v);
        const property_values = plan.varyingNames.map((name, i) => ({
          property_id: CUSTOM_SLOT_IDS[i],
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

  // ── 3) Kapak görseli (opsiyonel; image_url PUBLIC olmalı). ────────────────
  if (product.image_url) {
    try {
      const res = await fetch(product.image_url);
      if (!res.ok) {
        warnings.push(
          `Kapak görseli indirilemedi (HTTP ${res.status}) — listing görselsiz açıldı.`,
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
      // Görsel kritik değil — listing korunur, uyarı olarak dön.
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
