import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { resolveRingTaxonomyId } from "@/lib/etsy/taxonomy";
import { mintSingleItemSku } from "@/lib/etsy/sku";
import { logAudit } from "@/lib/audit";

/**
 * Etsy DRAFT listing oluşturma motoru.
 *
 * Panel taslak ürünlerinden (products.status='draft', featured_rank dolu = OK
 * sinyali, etsy_listing_id boş) Etsy'de draft listing kurar. İdempotent:
 * etsy_listing_id dolunca o ürün atlanır. Her deneme etsy_create_log'a
 * (outcome/step/error/request_summary) yazılır (0096).
 *
 * ────────────────────────────────────────────────────────────────────────
 * ETSY PAYLOAD VARSAYIMLARI (canlı yanıtla doğrulanacak — hepsi savunmacı):
 *
 * • createDraftListing form-encoded (application/x-www-form-urlencoded) ister;
 *   dönüş doğrudan ShopListing nesnesi ( .listing_id ).
 * • Varyasyonlar listing alanı DEĞİL, ayrı bir PUT /listings/{id}/inventory
 *   ile kurulur. Etsy en fazla 2 varyasyon özelliği kabul eder; özel (custom)
 *   özellikler property_id 513 ve 514 slotlarını kullanır. Bu slotlarda
 *   value_id YOKTUR; property_name (etiket) + values (metin dizisi) gönderilir.
 * • Fiyat/adet/sku'nun HANGİ özelliğe bağlı değiştiği price_on_property /
 *   quantity_on_property / sku_on_property ile İLAN edilmelidir; ilan edilmeyen
 *   bir attribute tüm offering'lerde AYNI olmalıdır (yoksa Etsy 400 verir).
 *   Bu yüzden: sku her kombinasyonda benzersiz → sku_on_property = tüm
 *   varyasyon özellikleri; fiyat farklıysa price_on_property = fiyatı belirleyen
 *   özellik(ler); adet farklıysa quantity_on_property = varyasyon özellikleri.
 * • offering.price DOLAR birimindedir (cent değil): price_cents/100, 2 hane.
 * • Görsel çok parçalı (multipart) POST /shops/{shop}/listings/{id}/images;
 *   dosya alanı adı "image".
 *
 * Belirsizlik noktaları (canlı testte İZLE): 513/514 slot atamasının fiyatı
 * belirleyen özellikle uyumu; price_on_property tek mi çift mi olmalı; custom
 * property'de value_ids:[] gönderiminin kabulü. request_summary bu alanların
 * gönderilen değerlerini taşır ki yanıtla eşleştirip düzeltebilesin.
 * ────────────────────────────────────────────────────────────────────────
 */

// Etsy özel (custom) varyasyon özelliği slotları — en fazla 2.
const CUSTOM_PROPERTY_IDS = [513, 514] as const;

export type CreateStep = "listing" | "inventory" | "image" | "done";

export interface CreateListingResult {
  ok: boolean;
  /** Zaten oluşturulmuş (idempotens) → ok:true + skipped:true. */
  skipped?: boolean;
  listingId?: number;
  error?: string;
  step?: CreateStep;
}

export interface CreateListingOpts {
  shippingProfileId: number | null;
  returnPolicyId: number | null;
  /** Önceden çözülmüşse tekrar fetch etme (loop tek kez çözer). */
  taxonomyId?: number;
}

/** listApprovedUncreatedDrafts / motor giriş ürünü. */
export interface CreatableProduct {
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
}

interface VariantRow {
  id: string;
  sku: string;
  name: string | null;
  price_cents: number | null;
  quantity: number | null;
  properties: unknown;
}

interface NormalizedVariant {
  id: string;
  sku: string;
  price_cents: number | null;
  quantity: number | null;
  props: Record<string, string> | null;
}

// ── Saf yardımcılar ─────────────────────────────────────────────────────────

/**
 * properties JSONB'sini {anahtar: metin} nesnesine indirger. Panel taslak
 * varyantları NESNE ({"Karat":"14K","Ring Size":"US 4-6.5"}) taşır. Etsy senkron
 * kökenli varyantlar DİZİ (EtsyPropertyValue[]) taşıyabilir — bu motor panel
 * kökenli taslaklar içindir; dizi/boş şekli null'a düşürüp varyasyonsuz sayarız.
 */
function asPropertyObject(props: unknown): Record<string, string> | null {
  if (!props || typeof props !== "object" || Array.isArray(props)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(props as Record<string, unknown>)) {
    if (v == null) continue;
    const key = k.trim();
    const val = String(v).trim();
    if (key && val) out[key] = val;
  }
  return Object.keys(out).length ? out : null;
}

/** Değeri >1 farklı olan (yani gerçekten VARYASYON olan) property anahtarları,
 *  ilk görülme sırasında. Tüm varyantlarda sabit olan (Karat/Metal) atlanır. */
function detectVariationKeys(variants: NormalizedVariant[]): string[] {
  const valuesByKey = new Map<string, Set<string>>();
  for (const v of variants) {
    if (!v.props) continue;
    for (const [k, val] of Object.entries(v.props)) {
      const set = valuesByKey.get(k) ?? new Set<string>();
      set.add(val);
      valuesByKey.set(k, set);
    }
  }
  const varying: string[] = [];
  for (const [k, set] of valuesByKey) {
    if (set.size > 1) varying.push(k);
  }
  return varying;
}

/** Fiyat TEK BAŞINA `key` özelliğinin değerine göre belirleniyor mu? (aynı
 *  değeri paylaşan varyantlar aynı fiyattaysa evet). */
function priceDeterminedByKey(
  variants: NormalizedVariant[],
  key: string,
  baseCents: number,
): boolean {
  const priceByValue = new Map<string, number>();
  for (const v of variants) {
    const val = v.props?.[key];
    if (val == null) return false;
    const price = v.price_cents ?? baseCents;
    const existing = priceByValue.get(val);
    if (existing != null && existing !== price) return false;
    priceByValue.set(val, price);
  }
  return true;
}

/** Etsy tag kuralı: en fazla 13, her biri ≤20 karakter; tekrar temizlenir. */
export function sanitizeTags(tags: string[] | null): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = (raw ?? "").trim();
    // >20 karakteri kırpmak kelime ortasından bozuk etiket üretir → düşür.
    if (!t || t.length > 20) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 13) break;
  }
  return out;
}

/** Etsy materials kuralı: en fazla 13, her biri ≤45 karakter, harf/rakam/boşluk. */
function sanitizeMaterials(materials: string[] | null): string[] {
  if (!materials) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of materials) {
    const cleaned = (raw ?? "")
      .replace(/[^a-zA-Z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 45);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= 13) break;
  }
  return out;
}

// ── etsy_create_log yardımcısı ──────────────────────────────────────────────

async function logCreate(
  admin: SupabaseClient,
  orgId: string,
  productId: string,
  outcome: "created" | "failed" | "skipped",
  step: CreateStep,
  extra: {
    listingId?: number | null;
    error?: string | null;
    requestSummary?: Record<string, unknown> | null;
  } = {},
): Promise<void> {
  const { error } = await admin.from("etsy_create_log").insert({
    org_id: orgId,
    product_id: productId,
    etsy_listing_id: extra.listingId ?? null,
    outcome,
    step,
    error: extra.error ?? null,
    request_summary: extra.requestSummary ?? null,
  });
  // Loglama asıl işi bozmasın; sessiz kalma (.error yutulmaz dersi).
  if (error) console.error("etsy_create_log insert hatası:", error.message);
}

// ── Ana motor ────────────────────────────────────────────────────────────────

/**
 * Tek taslak ürünü Etsy'de draft listing'e çevirir. THROW ETMEZ — sonucu
 * CreateListingResult ile döndürür (toplu loop bir sonrakine geçebilsin).
 *
 * Adımlar: 1) listing (form POST) → 2) inventory (varyant varsa PUT) →
 * 3) görsel (multipart) → 4) DB aynası + audit + create_log 'done'.
 *
 * İDEMPOTENS EMNİYETİ: listing Etsy'de oluştuğu AN products.etsy_listing_id
 * aynalanır; sonraki adım patlasa bile bu ürün bir daha oluşturulmaz (Etsy'de
 * mükerrer draft doğmaz), yalnız create_log'da 'failed' izi kalır — elle onarılır.
 */
export async function createDraftListingFromProduct(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
  product: CreatableProduct,
  opts: CreateListingOpts,
): Promise<CreateListingResult> {
  // ADIM 0 — İdempotens.
  if (product.etsy_listing_id != null) {
    return { ok: true, skipped: true, listingId: product.etsy_listing_id };
  }

  // Varyantları çek + normalize et.
  const { data: vData, error: vErr } = await admin
    .from("product_variants")
    .select("id, sku, name, price_cents, quantity, properties")
    .eq("org_id", orgId)
    .eq("product_id", product.id);
  if (vErr) console.error("create-listing: varyant okuma:", vErr.message);
  const variants: NormalizedVariant[] = ((vData ?? []) as VariantRow[]).map(
    (v) => ({
      id: v.id,
      sku: (v.sku ?? "").trim(),
      price_cents: v.price_cents,
      quantity: v.quantity,
      props: asPropertyObject(v.properties),
    }),
  );

  // Taban (base) fiyat: varyantlıda EN DÜŞÜK geçerli varyant fiyatı, yoksa ürün.
  const variantPrices = variants
    .map((v) => v.price_cents)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const baseCents = variantPrices.length
    ? Math.min(...variantPrices)
    : (product.price_cents ?? 0);

  const requestSummary: Record<string, unknown> = {
    product_id: product.id,
    variant_count: variants.length,
    base_price_cents: baseCents,
  };

  if (!(baseCents > 0)) {
    await logCreate(admin, orgId, product.id, "failed", "listing", {
      error: "Taban fiyat yok/0 — listing oluşturulamadı.",
      requestSummary,
    });
    return {
      ok: false,
      step: "listing",
      error: "Taban fiyat yok/0 — listing oluşturulamadı.",
    };
  }

  // ── ADIM 1: listing (form-encoded POST) ────────────────────────────────────
  let listingId: number;
  try {
    const taxonomyId =
      opts.taxonomyId ?? (await resolveRingTaxonomyId(client));
    // Etsy başlık sınırı 140 karakter — gerekiyorsa kırp.
    const title = product.title.slice(0, 140);
    if (product.title.length > 140) {
      requestSummary.title_truncated = true;
    }
    const description =
      (product.description ?? "").trim() || product.title; // Etsy açıklama ister
    const tags = sanitizeTags(product.tags);
    const materials = sanitizeMaterials(product.materials);

    const form: Record<string, string | number | undefined | null> = {
      quantity: product.quantity ?? 1, // varyantlıda taban; inventory PUT ezer
      title,
      description,
      price: (baseCents / 100).toFixed(2), // Etsy float birim (dolar) bekler
      who_made: "i_did",
      when_made: "made_to_order",
      taxonomy_id: taxonomyId,
      is_supply: "false",
      state: "draft",
      type: "physical",
      // Politikalar yoksa GÖNDERİLMEZ (requestForm null/undefined'ı atlar);
      // Etsy draft'ı bunlarsız reddederse create_log'da görürüz.
      shipping_profile_id: opts.shippingProfileId ?? undefined,
      return_policy_id: opts.returnPolicyId ?? undefined,
      tags: tags.length ? tags.join(",") : undefined,
      materials: materials.length ? materials.join(",") : undefined,
    };
    Object.assign(requestSummary, {
      taxonomy_id: taxonomyId,
      tag_count: tags.length,
      material_count: materials.length,
      shipping_profile_id: opts.shippingProfileId,
      return_policy_id: opts.returnPolicyId,
    });

    const created = await client.requestForm<{ listing_id?: number }>(
      "POST",
      etsyPaths.createListing(shopId),
      form,
    );
    if (!created?.listing_id) {
      throw new Error("createListing yanıtında listing_id yok.");
    }
    listingId = created.listing_id;
  } catch (e) {
    const error = e instanceof Error ? e.message : "Bilinmeyen hata";
    await logCreate(admin, orgId, product.id, "failed", "listing", {
      error,
      requestSummary,
    });
    return { ok: false, step: "listing", error };
  }

  // İDEMPOTENS EMNİYETİ — listing oluştu, HEMEN aynala (bkz. fonksiyon başlığı).
  {
    const { error } = await admin
      .from("products")
      .update({
        etsy_listing_id: listingId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .eq("org_id", orgId);
    if (error) {
      console.error("create-listing: etsy_listing_id aynalama:", error.message);
    }
  }

  // ── ADIM 2: inventory / varyasyon (yalnız gerçek varyasyon varsa) ───────────
  const varyingKeys = detectVariationKeys(variants).slice(0, 2); // Etsy en çok 2
  const invVariants = variants.filter(
    (v) => v.sku && v.props && varyingKeys.every((k) => v.props![k] != null),
  );
  const doInventory = varyingKeys.length > 0 && invVariants.length >= 1;

  if (doInventory) {
    try {
      const propIds = varyingKeys.map((_, i) => CUSTOM_PROPERTY_IDS[i]);

      // Fiyatı belirleyen özellik(ler): tek özellik yetiyorsa onu, yoksa hepsini
      // ilan et (her SKU benzersiz olduğundan hepsi güvenli üst sınırdır).
      const distinctPrices = new Set(
        invVariants.map((v) => v.price_cents ?? baseCents),
      );
      let priceOnProperty: number[] = [];
      if (distinctPrices.size > 1) {
        let single: number | null = null;
        for (let i = 0; i < varyingKeys.length; i++) {
          if (priceDeterminedByKey(invVariants, varyingKeys[i], baseCents)) {
            single = propIds[i];
            break;
          }
        }
        priceOnProperty = single != null ? [single] : propIds;
      }

      const distinctQty = new Set(invVariants.map((v) => v.quantity ?? 1));
      const quantityOnProperty = distinctQty.size > 1 ? propIds : [];

      const invProducts = invVariants.map((v) => ({
        sku: v.sku,
        property_values: varyingKeys.map((k, i) => ({
          property_id: propIds[i],
          property_name: k,
          // Custom property → value_id yok; metin değer gönderilir.
          value_ids: [] as number[],
          values: [v.props![k]],
        })),
        offerings: [
          {
            price: Number(((v.price_cents ?? baseCents) / 100).toFixed(2)),
            quantity: v.quantity ?? 1,
            is_enabled: true,
          },
        ],
      }));

      const invPayload = {
        products: invProducts,
        // sku her kombinasyonda benzersiz → daima ilan et.
        sku_on_property: propIds,
        ...(priceOnProperty.length
          ? { price_on_property: priceOnProperty }
          : {}),
        ...(quantityOnProperty.length
          ? { quantity_on_property: quantityOnProperty }
          : {}),
      };

      Object.assign(requestSummary, {
        variation_keys: varyingKeys,
        property_ids: propIds,
        price_on_property: priceOnProperty,
        quantity_on_property: quantityOnProperty,
        offering_count: invProducts.length,
      });

      // Envanter PUT'u JSON gövdesi ister (form değil — inventory.ts deseni).
      await client.request<unknown>(
        "PUT",
        etsyPaths.listingInventory(listingId),
        invPayload,
      );
    } catch (e) {
      const error = e instanceof Error ? e.message : "Bilinmeyen hata";
      await logCreate(admin, orgId, product.id, "failed", "inventory", {
        listingId,
        error,
        requestSummary,
      });
      return { ok: false, listingId, step: "inventory", error };
    }
  }

  // ── ADIM 3: görsel (multipart) ─────────────────────────────────────────────
  if (product.image_url) {
    try {
      const imgRes = await fetch(product.image_url);
      if (!imgRes.ok) {
        throw new Error(
          `Görsel indirilemedi (${imgRes.status}): ${product.image_url}`,
        );
      }
      const blob = await imgRes.blob();
      const filename =
        product.image_url.split("/").pop()?.split("?")[0] || "image.jpg";
      const fd = new FormData();
      fd.append("image", blob, filename);
      fd.append("rank", "1");
      await client.requestMultipart<unknown>(
        "POST",
        etsyPaths.listingImages(shopId, listingId),
        fd,
      );
    } catch (e) {
      const error = e instanceof Error ? e.message : "Bilinmeyen hata";
      await logCreate(admin, orgId, product.id, "failed", "image", {
        listingId,
        error,
        requestSummary,
      });
      return { ok: false, listingId, step: "image", error };
    }
  }

  // ── ADIM 4: DB aynası + audit + create_log 'done' ──────────────────────────
  // Varyantsız (tek-parça) listing → deterministik SKU bas (evrensel anahtar).
  const singleItemSku =
    variants.length === 0
      ? mintSingleItemSku(product.title, listingId)
      : null;
  if (singleItemSku) {
    const { error } = await admin
      .from("products")
      .update({ sku: singleItemSku, updated_at: new Date().toISOString() })
      .eq("id", product.id)
      .eq("org_id", orgId);
    if (error) console.error("create-listing: sku aynalama:", error.message);
  }

  // Varyantlara etsy_listing_id yaz (SKU↔listing bağı).
  if (variants.length > 0) {
    const { error } = await admin
      .from("product_variants")
      .update({
        etsy_listing_id: listingId,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .eq("product_id", product.id);
    if (error) {
      console.error("create-listing: varyant aynalama:", error.message);
    }
  }

  await logAudit(admin, {
    orgId,
    action: "etsy.listing_create",
    entityType: "products",
    entityId: product.id,
    summary: `Etsy draft listing oluşturuldu: "${product.title}" (listing ${listingId})`,
    diff: { etsy_listing_id: listingId, base_price_cents: baseCents },
    source: "app",
    actorLabel: "Etsy Create",
  });

  await logCreate(admin, orgId, product.id, "created", "done", {
    listingId,
    requestSummary,
  });

  return { ok: true, listingId };
}

// ── Loop besleyicileri ───────────────────────────────────────────────────────

/**
 * İnceleme loop'unun ONAYLADIĞI (featured_rank dolu) ama henüz Etsy'de
 * oluşturulmamış taslakları başlık sırasıyla döndürür — motorun çekeceği liste.
 * Multi-tenant kilidi: her sorgu org_id ile kapsanır.
 */
export async function listApprovedUncreatedDrafts(
  admin: SupabaseClient,
  orgId: string,
): Promise<CreatableProduct[]> {
  const { data, error } = await admin
    .from("products")
    .select(
      "id, org_id, etsy_listing_id, title, description, tags, materials, price_cents, quantity, image_url",
    )
    .eq("org_id", orgId)
    .not("featured_rank", "is", null)
    .is("etsy_listing_id", null)
    .is("archived_at", null)
    .eq("status", "draft")
    .order("title", { ascending: true });
  if (error) {
    console.error("listApprovedUncreatedDrafts:", error.message);
    return [];
  }
  return (data ?? []) as CreatableProduct[];
}

/**
 * Mağaza profillerini çözer: ilk kargo profili + ilk iade politikası.
 * Kargo: önce panel tablosundan (etsy_shipping_profiles, ucuz) — shop_id'den
 * org_id çözülüp multi-tenant kilidiyle okunur — yoksa canlı GET. İade:
 * yalnız canlı GET (panelde tablo yok). Bulunamazsa null (listing bunlarsız da
 * draft denenebilir; Etsy reddederse create_log'da görülür).
 */
export async function resolveShopProfiles(
  admin: SupabaseClient,
  client: EtsyClient,
  shopId: number,
): Promise<{ shippingProfileId: number | null; returnPolicyId: number | null }> {
  // shop_id → org_id (etsy_shipping_profiles org-bazlı; kilidi koru).
  const { data: connRow } = await admin
    .from("etsy_connection")
    .select("org_id")
    .eq("shop_id", shopId)
    .maybeSingle();
  const orgId = (connRow as { org_id: string } | null)?.org_id ?? null;

  let shippingProfileId: number | null = null;
  if (orgId) {
    const { data } = await admin
      .from("etsy_shipping_profiles")
      .select("profile_id")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    shippingProfileId =
      (data as { profile_id: number } | null)?.profile_id ?? null;
  }
  if (shippingProfileId == null) {
    try {
      const page = await client.get<{
        results?: { shipping_profile_id?: number }[];
      }>(etsyPaths.shippingProfiles(shopId));
      shippingProfileId = page.results?.[0]?.shipping_profile_id ?? null;
    } catch (e) {
      console.error(
        "resolveShopProfiles: kargo profili GET:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  let returnPolicyId: number | null = null;
  try {
    const page = await client.get<{
      results?: { return_policy_id?: number }[];
    }>(etsyPaths.returnPolicies(shopId));
    returnPolicyId = page.results?.[0]?.return_policy_id ?? null;
  } catch (e) {
    console.error(
      "resolveShopProfiles: iade politikası GET:",
      e instanceof Error ? e.message : e,
    );
  }

  return { shippingProfileId, returnPolicyId };
}

export interface CreateSummary {
  org_id: string;
  processed: number;
  created: number;
  skipped: number;
  failed: number;
}

/**
 * Onaylı taslakları Etsy'de draft'a çevirir. `orgId` verilirse tek org, aksi
 * halde status='connected' TÜM org'lar (cron yolu). İstekler arası ~500ms
 * bekleme (rate-limit). Motor/loop bu fonksiyonu çağırır.
 */
export async function advanceEtsyCreate(
  orgId?: string,
  limit = 25,
): Promise<Record<string, CreateSummary>> {
  const admin = createAdminClient();

  let orgs: string[];
  if (orgId) {
    orgs = [orgId];
  } else {
    const { data } = await admin
      .from("etsy_connection")
      .select("org_id")
      .eq("status", "connected");
    orgs = ((data ?? []) as { org_id: string }[]).map((r) => r.org_id);
  }

  const out: Record<string, CreateSummary> = {};
  for (const org of orgs) {
    const summary: CreateSummary = {
      org_id: org,
      processed: 0,
      created: 0,
      skipped: 0,
      failed: 0,
    };
    out[org] = summary;

    let client: EtsyClient;
    let shopId: number;
    try {
      client = await EtsyClient.forOrg(org);
      shopId = await client.requireShopId();
    } catch (e) {
      console.error(
        `etsy-create: org ${org} istemci kurulamadı:`,
        e instanceof Error ? e.message : e,
      );
      continue;
    }

    const drafts = await listApprovedUncreatedDrafts(admin, org);
    if (drafts.length === 0) continue;

    // Taksonomi bir kez çözülür (cache'li); çözülemezse org atlanır.
    let taxonomyId: number;
    try {
      taxonomyId = await resolveRingTaxonomyId(client);
    } catch (e) {
      console.error(
        `etsy-create: org ${org} taksonomi çözülemedi:`,
        e instanceof Error ? e.message : e,
      );
      continue;
    }

    const { shippingProfileId, returnPolicyId } = await resolveShopProfiles(
      admin,
      client,
      shopId,
    );

    const batch = drafts.slice(0, limit);
    for (const product of batch) {
      const res = await createDraftListingFromProduct(
        admin,
        client,
        org,
        shopId,
        product,
        { shippingProfileId, returnPolicyId, taxonomyId },
      );
      summary.processed++;
      if (res.skipped) summary.skipped++;
      else if (res.ok) summary.created++;
      else summary.failed++;

      // Etsy'ye peş peşe istek — rate-limit nefesi.
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return out;
}
