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
 *      çapa fiyat (en düşük varyant), kişiselleştirme AÇIK (30 char iç gravür).
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
 *  C. Kişiselleştirme: is_personalizable=true, required=false, max=30 char.
 *     Bant alyanslarında bu iç gravür talimatıdır; Etsy 30 char'ı aşan talebi
 *     reddeder.
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

/** Kişiselleştirme talimatı — iç gravür (script ile aynı metin, 30 char limit). */
const PERSONALIZATION_INSTRUCTIONS =
  "Optional. Enter the engraving for the inside of the band: a date, initials, " +
  "coordinates, or a short phrase (up to 30 characters). Script by default, " +
  "write BLOCK if you prefer block letters. Leave blank for no engraving.";

/** Etsy custom variation slot id'leri (en fazla iki eksen). */
const CUSTOM_SLOT_IDS = [513, 514] as const;

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
}

/**
 * Kargo profili + iade politikası çözümü:
 *  - Kargo: önce panelin `etsy_shipping_profiles` tablosundan (org kilidi) İLK
 *    profil; yoksa canlı GET shippingProfiles ilk kayıt.
 *  - İade: canlı GET returnPolicies ilk kayıt (okunamzsa null — Etsy fiziksel
 *    üründe iade politikası ister ama create adımı yine denenir).
 */
export async function resolveShopProfiles(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
): Promise<ShopProfiles> {
  let shippingProfileId: number | null = null;

  // 1) Panel tablosu (org kilidi) — senkron doldurmuşsa canlı çağrıdan kaçınırız.
  const { data: stored } = await admin
    .from("etsy_shipping_profiles")
    .select("profile_id")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const storedId = (stored as { profile_id: number | null } | null)?.profile_id;
  if (storedId != null) shippingProfileId = Number(storedId);

  // 2) Panelde yoksa canlı GET.
  if (shippingProfileId == null) {
    const sp = await client.get<{
      results: { shipping_profile_id: number }[];
    }>(etsyPaths.shippingProfiles(shopId));
    shippingProfileId = sp.results?.[0]?.shipping_profile_id ?? null;
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

  return { shippingProfileId, returnPolicyId };
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
      tags: tags.join(","),
      materials: materials.join(","),
      is_personalizable: "true",
      personalization_is_required: "false",
      personalization_char_count_max: 30,
      personalization_instructions: PERSONALIZATION_INSTRUCTIONS,
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
            },
          ],
        };
      });
      await client.request("PUT", etsyPaths.listingInventory(listingId), {
        products: inventoryProducts,
        // Her tam kombinasyon benzersiz fiyat/sku taşır → kullanılan tüm slotlar.
        price_on_property: usedSlots,
        quantity_on_property: [],
        sku_on_property: usedSlots,
      });
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
