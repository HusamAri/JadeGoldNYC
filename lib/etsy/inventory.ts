import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  etsyMoneyToUnit,
  type EtsyInventory,
  type EtsyInventoryProduct,
  type EtsyInventoryUpdate,
  type EtsyOfferingUpdate,
  type EtsyProductUpdate,
  type EtsyPropertyValue,
} from "@/lib/etsy/types";
import {
  asEtsyProperties,
  type RawVariantProperties,
} from "@/lib/variant-properties";

const WEDDING_BAND_PROPERTY_IDS = {
  Width: 513,
  "Ring Size": 514,
} as const;

export interface WeddingBandMatrixVariant {
  sku: string | null;
  price_cents: number | null;
  quantity: number | null;
  properties: RawVariantProperties;
}

export interface WeddingBandMatrixValidation {
  ok: boolean;
  error?: string;
  widthCount: number;
  ringSizeCount: number;
  variantCount: number;
}

function normalizedAxisName(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function matrixPropertyMap(
  properties: RawVariantProperties,
): Map<string, string> {
  return new Map(
    asEtsyProperties(properties).flatMap((property) => {
      const name = normalizedAxisName(property.property_name ?? "");
      const value = String(property.values?.[0] ?? "").trim();
      return name && value ? [[name, value]] : [];
    }),
  );
}

export function validateWeddingBandMatrix(
  variants: WeddingBandMatrixVariant[],
): WeddingBandMatrixValidation {
  const base = {
    widthCount: 0,
    ringSizeCount: 0,
    variantCount: variants.length,
  };
  if (variants.length === 0) {
    return { ...base, ok: false, error: "Aktif varyant bulunamadı." };
  }
  const widths = new Set<string>();
  const sizes = new Set<string>();
  const combinations = new Set<string>();
  const skus = new Set<string>();
  for (const variant of variants) {
    const sku = (variant.sku ?? "").trim();
    if (!sku || sku.length > 32) {
      return { ...base, ok: false, error: "Her varyantta en fazla 32 karakterlik SKU olmalı." };
    }
    if (skus.has(sku)) {
      return { ...base, ok: false, error: `Tekrarlanan SKU: ${sku}` };
    }
    skus.add(sku);
    if (!(variant.price_cents != null && variant.price_cents > 0)) {
      return { ...base, ok: false, error: `${sku}: geçerli fiyat yok.` };
    }
    const properties = matrixPropertyMap(variant.properties);
    const width = properties.get("width");
    const ringSize = properties.get("ring size");
    if (!width || !ringSize) {
      return { ...base, ok: false, error: `${sku}: Width veya Ring Size eksik.` };
    }
    widths.add(width);
    sizes.add(ringSize);
    const combination = `${width}|||${ringSize}`;
    if (combinations.has(combination)) {
      return { ...base, ok: false, error: `${sku}: tekrarlanan varyant kombinasyonu.` };
    }
    combinations.add(combination);
  }
  const counts = {
    widthCount: widths.size,
    ringSizeCount: sizes.size,
    variantCount: variants.length,
  };
  if (widths.size < 2 || sizes.size < 2) {
    return { ...counts, ok: false, error: "Width ve Ring Size gerçek varyasyon eksenleri olmalı." };
  }
  if (combinations.size !== widths.size * sizes.size) {
    return {
      ...counts,
      ok: false,
      error: `Varyant matrisi eksik: ${combinations.size}/${widths.size * sizes.size}.`,
    };
  }
  return { ...counts, ok: true };
}

export function buildWeddingBandMatrixUpdate(
  variants: WeddingBandMatrixVariant[],
  readinessStateId: number,
): EtsyInventoryUpdate {
  const validation = validateWeddingBandMatrix(variants);
  if (!validation.ok) throw new Error(validation.error);
  return {
    products: variants.map((variant) => {
      const properties = matrixPropertyMap(variant.properties);
      return {
        sku: (variant.sku ?? "").trim(),
        property_values: [
          {
            property_id: WEDDING_BAND_PROPERTY_IDS.Width,
            property_name: "Width",
            value_ids: [],
            values: [properties.get("width")!],
          },
          {
            property_id: WEDDING_BAND_PROPERTY_IDS["Ring Size"],
            property_name: "Ring Size",
            value_ids: [],
            values: [properties.get("ring size")!],
          },
        ],
        offerings: [
          {
            price: variant.price_cents! / 100,
            quantity: Math.max(0, variant.quantity ?? 1),
            is_enabled: true,
            readiness_state_id: readinessStateId,
          },
        ],
      };
    }),
    price_on_property: [
      WEDDING_BAND_PROPERTY_IDS.Width,
      WEDDING_BAND_PROPERTY_IDS["Ring Size"],
    ],
    quantity_on_property: [],
    sku_on_property: [
      WEDDING_BAND_PROPERTY_IDS.Width,
      WEDDING_BAND_PROPERTY_IDS["Ring Size"],
    ],
    readiness_state_on_property: [],
  };
}

/** Bir listenin tüm envanterini (products/offerings) okur. */
export async function getListingInventory(
  client: EtsyClient,
  listingId: number,
): Promise<EtsyInventory> {
  return client.get<EtsyInventory>(etsyPaths.listingInventory(listingId));
}

export type QuantityResolution =
  | { ok: true; product: EtsyInventoryProduct; reason: "sku" | "sole-product" }
  | { ok: false; reason: "no-match" | "ambiguous" | "empty" };

/**
 * Satırdaki SKU'ya karşılık gelen envanter ürününü bulur — "tam o SKU"
 * politikası (varsayılan güvenli mod):
 *  1) SKU eşleşen ürün varsa onu kullan.
 *  2) SKU boş/eşleşmiyor ama listede TEK ürün varsa (varyantsız liste) onu kullan.
 *  3) Aksi halde belirsiz — asla tahmin etme, atla.
 */
export function resolveTargetProduct(
  inventory: EtsyInventory,
  sku: string | null,
): QuantityResolution {
  const products = (inventory.products ?? []).filter((p) => !p.is_deleted);
  if (products.length === 0) return { ok: false, reason: "empty" };

  if (sku) {
    const match = products.find((p) => (p.sku ?? "") === sku);
    if (match) return { ok: true, product: match, reason: "sku" };
  }
  if (products.length === 1) {
    return { ok: true, product: products[0], reason: "sole-product" };
  }
  return { ok: false, reason: sku ? "no-match" : "ambiguous" };
}

/** Hedef ürünün offering'lerindeki mevcut adet toplamı (gösterim/diff için). */
export function currentQuantityOf(product: EtsyInventoryProduct): number {
  const offs = (product.offerings ?? []).filter((o) => !o.is_deleted);
  if (offs.length === 0) return 0;
  // Standart listelerde ürün başına tek offering olur; birden fazlaysa ilki
  // temsil eder (hepsi aynı adete set edilecek).
  return offs[0].quantity ?? 0;
}

/**
 * Envanteri, YALNIZCA verilen ürünün offering adetlerini `newQuantity` yapacak
 * şekilde Etsy PUT payload'ına dönüştürür. Diğer tüm ürünler/offering'ler
 * aynen korunur. Etsy'nin salt-okunur alanları (product_id, offering_id,
 * scale_name, is_deleted, property_name) çıkarılır; fiyat float'a çevrilir.
 */
export function buildInventoryUpdate(
  inventory: EtsyInventory,
  shouldSet: (product: EtsyInventoryProduct) => boolean,
  newQuantity: number,
  readinessStateId?: number | null,
  propsBySku?: Map<string, { name: string; value: string }[]>,
): EtsyInventoryUpdate {
  const products: EtsyProductUpdate[] = (inventory.products ?? [])
    .filter((p) => !p.is_deleted)
    .map((p) => {
      const isTarget = shouldSet(p);
      const nameByValue = new Map<string, string>();
      for (const pr of propsBySku?.get(p.sku ?? "") ?? []) {
        const v = (pr.value ?? "").trim().toLowerCase();
        if (v && pr.name) nameByValue.set(v, pr.name);
      }
      // PARA GÜVENLİĞİ: Etsy kısmi güncelleme kabul etmez — adet yazarken TÜM
      // offering fiyatlarını da AYNEN geri göndeririz. Bir offering'in canlı
      // fiyatı okunamazsa (etsyMoneyToUnit → 0/NaN) o fiyatı geri yazmak Etsy'de
      // fiyatı SIFIRA çeker. Bu yüzden geçersiz fiyat görülürse fiyatı asla
      // riske atmadan TÜM liste güncellemesini iptal ederiz (throw → çağıran
      // pushListingQuantity yakalar, "error" döner, PUT yapılmaz).
      const offerings: EtsyOfferingUpdate[] = (p.offerings ?? [])
        .filter((o) => !o.is_deleted)
        .map((o) => {
          const price = etsyMoneyToUnit(o.price);
          if (!(price > 0)) {
            throw new Error(
              "Canlı fiyat okunamadı (0/eksik) — fiyatı korumak için stok güncellemesi iptal edildi.",
            );
          }
          return {
            price,
            quantity: isTarget ? newQuantity : (o.quantity ?? 0),
            is_enabled: o.is_enabled ?? true,
            // 2025 modeli (?legacy=false): her offering'e işlem profili.
            ...(readinessStateId != null
              ? { readiness_state_id: readinessStateId }
              : {}),
          };
        });
      // Offering'i price:0 ile YOKTAN YARATMA (fiyat sıfırlama riski) — okunabilir
      // offering yoksa güvenli tarafta kalıp iptal et.
      if (offerings.length === 0) {
        throw new Error(
          "Üründe okunabilir offering yok — fiyat güvenliği için stok güncellemesi atlandı.",
        );
      }
      return {
        sku: p.sku ?? "",
        property_values: (p.property_values ?? []).map((pv) => {
          const firstVal = (pv.values?.[0] ?? "").trim().toLowerCase();
          const resolvedName =
            pv.property_name ?? nameByValue.get(firstVal) ?? null;
          return {
            property_id: pv.property_id,
            ...(resolvedName != null ? { property_name: resolvedName } : {}),
            value_ids: pv.value_ids ?? [],
            values: pv.values ?? [],
            ...(pv.scale_id != null ? { scale_id: pv.scale_id } : {}),
          };
        }),
        offerings,
      };
    });

  return {
    products,
    ...(inventory.price_on_property
      ? { price_on_property: inventory.price_on_property }
      : {}),
    ...(inventory.quantity_on_property
      ? { quantity_on_property: inventory.quantity_on_property }
      : {}),
    ...(inventory.sku_on_property
      ? { sku_on_property: inventory.sku_on_property }
      : {}),
    ...(readinessStateId != null ? { readiness_state_on_property: [] } : {}),
  };
}

/**
 * Envanteri, her offering'in fiyatını panel DB'sindeki karşılık gelen SKU
 * fiyatına çekecek PUT payload'ına dönüştürür (varyantlı listing dahil — her
 * ürün SKU'suyla eşlenir). Diğer her şey (adet, is_enabled, property_values,
 * price_on_property) AYNEN korunur.
 *
 * PARA GÜVENLİĞİ (buildInventoryUpdate ile aynı ilke): bir SKU için DB fiyatı
 * yoksa Etsy'nin CANLI fiyatı geri yazılır; ikisi de geçersizse (0/okunamaz)
 * fiyatı SIFIRA çekmemek için TÜM güncelleme iptal edilir (throw). `changed`,
 * gerçekten farklı olan offering sayısıdır — 0 ise çağıran PUT'u atlar.
 */
export function buildPriceSyncUpdate(
  inventory: EtsyInventory,
  priceBySkuCents: Map<string, number>,
  readinessStateId?: number | null,
  /** SKU → panel varyant property'leri ({name, value}) — Etsy GET property_name
   *  null döndüğünde 2025 PUT için ismi buradan (değer eşleşmesiyle) doldurur. */
  propsBySku?: Map<string, { name: string; value: string }[]>,
): { update: EtsyInventoryUpdate; changed: number } {
  let changed = 0;
  const products: EtsyProductUpdate[] = (inventory.products ?? [])
    .filter((p) => !p.is_deleted)
    .map((p) => {
      const sku = p.sku ?? "";
      // DB varyant property'lerinden değer→isim haritası (küçük harf eşleşme).
      const nameByValue = new Map<string, string>();
      for (const pr of propsBySku?.get(sku) ?? []) {
        const v = (pr.value ?? "").trim().toLowerCase();
        if (v && pr.name) nameByValue.set(v, pr.name);
      }
      const dbCents = priceBySkuCents.get(sku);
      const dbUnit = dbCents != null && dbCents > 0 ? dbCents / 100 : null;
      const offerings: EtsyOfferingUpdate[] = (p.offerings ?? [])
        .filter((o) => !o.is_deleted)
        .map((o) => {
          const liveUnit = etsyMoneyToUnit(o.price);
          const targetUnit = dbUnit ?? liveUnit;
          if (!(targetUnit > 0)) {
            throw new Error(
              "Fiyat okunamadı (DB'de yok, Etsy fiyatı da 0/eksik) — fiyatı sıfırlamamak için güncelleme iptal edildi.",
            );
          }
          if (
            dbUnit != null &&
            Math.round(liveUnit * 100) !== Math.round(dbUnit * 100)
          ) {
            changed += 1;
          }
          return {
            price: targetUnit,
            quantity: o.quantity ?? 0,
            is_enabled: o.is_enabled ?? true,
            // 2025 modeli: her offering'e işlem profili (listing-düzeyi tek
            // readiness). readinessStateId yoksa alan atlanır (legacy PUT).
            ...(readinessStateId != null
              ? { readiness_state_id: readinessStateId }
              : {}),
          };
        });
      if (offerings.length === 0) {
        throw new Error(
          "Üründe okunabilir offering yok — fiyat güvenliği için güncelleme atlandı.",
        );
      }
      return {
        sku,
        property_values: (p.property_values ?? []).map((pv) => {
          // 2025 PUT property_name'i string ister. Etsy GET null döndürüyorsa
          // (özellikle custom slot 513/514) DB değerinden ada eşle.
          const firstVal = (pv.values?.[0] ?? "").trim().toLowerCase();
          const resolvedName =
            pv.property_name ?? nameByValue.get(firstVal) ?? null;
          return {
            property_id: pv.property_id,
            ...(resolvedName != null ? { property_name: resolvedName } : {}),
            value_ids: pv.value_ids ?? [],
            values: pv.values ?? [],
            ...(pv.scale_id != null ? { scale_id: pv.scale_id } : {}),
          };
        }),
        offerings,
      };
    });

  return {
    update: {
      products,
      ...(inventory.price_on_property
        ? { price_on_property: inventory.price_on_property }
        : {}),
      ...(inventory.quantity_on_property
        ? { quantity_on_property: inventory.quantity_on_property }
        : {}),
      ...(inventory.sku_on_property
        ? { sku_on_property: inventory.sku_on_property }
        : {}),
      // 2025 PUT (?legacy=false) readiness_state_on_property bekler; işlem
      // profili property'ye göre değişmediğinden [].
      ...(readinessStateId != null ? { readiness_state_on_property: [] } : {}),
    },
    changed,
  };
}

/**
 * Listing'in işlem profilini (readiness state) çözer — 2025 envanter PUT'unda
 * her offering'e verilir. Mağaza tanımlarından made_to_order (yoksa ilk) seçilir;
 * okunamazsa null (çağıran legacy PUT'a düşer). create-listing ile aynı mantık.
 */
export async function resolveReadinessStateId(
  client: EtsyClient,
): Promise<number | null> {
  try {
    const shopId = await client.resolveShopId();
    if (shopId == null) return null;
    const rs = await client.get<{
      results?: { readiness_state_id: number; readiness_state: string }[];
    }>(etsyPaths.readinessStateDefinitions(shopId));
    const defs = rs.results ?? [];
    return (
      defs.find((d) => d.readiness_state === "made_to_order")
        ?.readiness_state_id ??
      defs[0]?.readiness_state_id ??
      null
    );
  } catch {
    return null;
  }
}

export type PricePushOutcome = {
  listingId: number;
  status: "updated" | "unchanged" | "error";
  changed: number;
  detail?: string;
};

/**
 * Tek listing için: envanteri oku → offering fiyatlarını DB SKU fiyatlarına
 * çek → değişiklik varsa geri yaz. Hata fırlatmaz (toplu akışta bir liste
 * patlarsa diğerleri sürsün); PricePushOutcome döner. Fiyat DB'de değişmemişse
 * PUT yapılmaz (idempotent — tekrar çalıştırma güvenli, "unchanged" döner).
 */
export async function pushListingPrices(
  client: EtsyClient,
  listingId: number,
  priceBySkuCents: Map<string, number>,
  propsBySku?: Map<string, { name: string; value: string }[]>,
): Promise<PricePushOutcome> {
  try {
    const inventory = await getListingInventory(client, listingId);
    const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
    if (live.length === 0) {
      return { listingId, status: "unchanged", changed: 0, detail: "Envanter boş" };
    }
    // 2025 modeli: fiziksel listing envanter PUT'u her offering'de readiness
    // state ister ("All offerings need readiness state"). Çözebilirsek
    // ?legacy=false ile o profili göndeririz; çözemezsek legacy PUT'a düşeriz.
    const readinessStateId = await resolveReadinessStateId(client);
    const { update, changed } = buildPriceSyncUpdate(
      inventory,
      priceBySkuCents,
      readinessStateId,
      propsBySku,
    );
    if (changed === 0) {
      return { listingId, status: "unchanged", changed: 0 };
    }
    await putListingInventory(client, listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });
    return { listingId, status: "updated", changed };
  } catch (e) {
    return {
      listingId,
      status: "error",
      changed: 0,
      detail: e instanceof Error ? e.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Güncellenmiş envanteri Etsy'ye yazar (PUT). listings_w kapsamı gerektirir.
 * `legacy: false` → 2025 envanter modeli (`?legacy=false`): offering-düzeyi
 * readiness_state_id'yi yalnız bu mod kabul eder. Belirtilmezse eski (legacy)
 * yol korunur (reprice/stok gibi mevcut çağıranlar davranış değiştirmez).
 */
export async function putListingInventory(
  client: EtsyClient,
  listingId: number,
  update: EtsyInventoryUpdate,
  opts?: { legacy?: boolean },
): Promise<void> {
  const path =
    opts?.legacy === false
      ? etsyPaths.listingInventory(listingId) + "?legacy=false"
      : etsyPaths.listingInventory(listingId);
  await client.request<unknown>("PUT", path, update);
}

export type WeddingBandMatrixPushOutcome = {
  listingId: number;
  status: "updated" | "error";
  widthCount: number;
  ringSizeCount: number;
  variantCount: number;
  detail?: string;
};

export async function pushWeddingBandMatrix(
  client: EtsyClient,
  listingId: number,
  variants: WeddingBandMatrixVariant[],
): Promise<WeddingBandMatrixPushOutcome> {
  const validation = validateWeddingBandMatrix(variants);
  if (!validation.ok) {
    return { listingId, status: "error", ...validation, detail: validation.error };
  }
  try {
    const readinessStateId = await resolveReadinessStateId(client);
    if (readinessStateId == null) {
      throw new Error("Made-to-order işlem profili çözülemedi.");
    }
    const update = buildWeddingBandMatrixUpdate(variants, readinessStateId);
    await putListingInventory(client, listingId, update, { legacy: false });
    const readback = await getListingInventory(client, listingId);
    const live = (readback.products ?? []).filter((product) => !product.is_deleted);
    const liveAxes = live.map((product) =>
      new Map(
        (product.property_values ?? []).flatMap((property) => {
          const name = normalizedAxisName(property.property_name ?? "");
          const value = String(property.values?.[0] ?? "").trim();
          return name && value ? [[name, value]] : [];
        }),
      ),
    );
    const widths = new Set(liveAxes.map((map) => map.get("width")).filter(Boolean));
    const sizes = new Set(liveAxes.map((map) => map.get("ring size")).filter(Boolean));
    if (
      live.length !== validation.variantCount ||
      widths.size !== validation.widthCount ||
      sizes.size !== validation.ringSizeCount
    ) {
      throw new Error(
        `Canlı geri okuma eşleşmedi: ${live.length} varyant, ${widths.size} width, ${sizes.size} size.`,
      );
    }
    return {
      listingId,
      status: "updated",
      widthCount: widths.size,
      ringSizeCount: sizes.size,
      variantCount: live.length,
    };
  } catch (error) {
    return {
      listingId,
      status: "error",
      widthCount: validation.widthCount,
      ringSizeCount: validation.ringSizeCount,
      variantCount: validation.variantCount,
      detail: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}

export type PushOutcome = {
  listingId: number;
  sku: string | null;
  before: number | null;
  after: number;
  status: "updated" | "skipped" | "error";
  detail?: string;
};

export type RemoveOfferingsOutcome = {
  listingId: number;
  status: "removed" | "unchanged" | "error";
  removed: number;
  remaining: number;
  removedSkus: string[];
  detail?: string;
};

/**
 * Listing'den SKU'su `shouldRemove`'u karşılayan offering'leri KALDIRIR
 * (`createMissingListingOfferings`'in simetriği). Etsy envanter PUT'u tam
 * değiştirmedir: gönderilmeyen ürün silinir — bu yüzden kaldırma, kalanların
 * TAMAMINI aynen geri yazmakla yapılır.
 *
 * GÜVENLİK:
 *  - Kaldırılacaklar payload kurulmadan ÖNCE elenir; böylece silinecek bir
 *    offering'in okunamayan fiyatı işlemi gereksiz yere iptal etmez.
 *  - Kalanların fiyatı okunamazsa `buildInventoryUpdate` fırlatır → PUT yok
 *    (fiyatı sıfıra çekme riski yok).
 *  - Listing'i BOŞALTMAK yasak: kalan ürün yoksa hata döner (Etsy varyantsız
 *    listing'e düşürmek geri dönüşü zor bir yapı değişikliğidir).
 *  - Eşleşme yoksa PUT hiç yapılmaz (`unchanged`) — tekrar çalıştırma güvenli.
 */
export async function removeListingOfferings(
  client: EtsyClient,
  listingId: number,
  shouldRemove: (sku: string) => boolean,
  propsBySku?: Map<string, { name: string; value: string }[]>,
): Promise<RemoveOfferingsOutcome> {
  try {
    const inventory = await getListingInventory(client, listingId);
    const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
    if (live.length === 0) {
      return {
        listingId,
        status: "error",
        removed: 0,
        remaining: 0,
        removedSkus: [],
        detail: "Etsy listing envanteri boş — kaldırılacak offering yok.",
      };
    }

    const doomed = live.filter((p) => shouldRemove((p.sku ?? "").trim()));
    const kept = live.filter((p) => !shouldRemove((p.sku ?? "").trim()));
    if (doomed.length === 0) {
      return {
        listingId,
        status: "unchanged",
        removed: 0,
        remaining: live.length,
        removedSkus: [],
      };
    }
    if (kept.length === 0) {
      return {
        listingId,
        status: "error",
        removed: 0,
        remaining: live.length,
        removedSkus: [],
        detail:
          "Tüm offering'ler kaldırılacaktı — listing boşaltılmaz, işlem iptal edildi.",
      };
    }

    const readinessStateId = await resolveReadinessStateId(client);
    // Yalnız KALANLARdan payload kur: hedeflenen offering yok (adet/fiyat
    // aynen korunur), gönderilmeyen ürünler Etsy tarafında düşer.
    const update = buildInventoryUpdate(
      { ...inventory, products: kept },
      () => false,
      0,
      readinessStateId,
      propsBySku,
    );

    await putListingInventory(client, listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });

    const removedSkus = doomed.map((p) => (p.sku ?? "").trim());
    return {
      listingId,
      status: "removed",
      removed: doomed.length,
      remaining: kept.length,
      removedSkus,
      detail: `${doomed.length} offering kaldırıldı, ${kept.length} kaldı (fiyat/adet korundu).`,
    };
  } catch (e) {
    return {
      listingId,
      status: "error",
      removed: 0,
      remaining: 0,
      removedSkus: [],
      detail: e instanceof Error ? e.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Tek bir liste için: envanteri oku → hedef offering(ler)i çöz → adeti değiştir
 * → geri yaz. `applyToAll` true ise (varyantlı listelerde "tüm bedenlere uygula"
 * modu) tüm offering'ler hedefe set edilir; false ise yalnız satırın SKU'suna
 * (veya varyantsız listede tek ürüne) dokunulur. Hata fırlatmaz, PushOutcome
 * içinde raporlar (toplu akışta bir liste patlarsa diğerleri devam etsin).
 */
export async function pushListingQuantity(
  client: EtsyClient,
  listingId: number,
  sku: string | null,
  targetQuantity: number,
  applyToAll = false,
  propsBySku?: Map<string, { name: string; value: string }[]>,
): Promise<PushOutcome> {
  try {
    const inventory = await getListingInventory(client, listingId);
    const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
    if (live.length === 0) {
      return {
        listingId,
        sku,
        before: null,
        after: targetQuantity,
        status: "skipped",
        detail: "Envanter boş",
      };
    }

    let shouldSet: (p: EtsyInventoryProduct) => boolean;
    let before: number;
    // "Zaten güncel" kontrolü: tek varyantta hedefe eşitlik yeter; tüm
    // bedenlere uygula'da yalnız BÜTÜN varyantlar hedefteyse atlanır — aksi
    // halde ilk varyant eşleşse bile diğerleri güncellenmeli.
    let alreadyCurrent: boolean;
    if (applyToAll) {
      shouldSet = () => true;
      before = currentQuantityOf(live[0]);
      alreadyCurrent = live.every(
        (p) => currentQuantityOf(p) === targetQuantity,
      );
    } else {
      const resolved = resolveTargetProduct(inventory, sku);
      if (!resolved.ok) {
        const map: Record<string, string> = {
          "no-match": "SKU envanterde bulunamadı",
          ambiguous: "Varyantlı ürün — 'tüm bedenlere uygula' gerekli",
          empty: "Envanter boş",
        };
        return {
          listingId,
          sku,
          before: null,
          after: targetQuantity,
          status: "skipped",
          detail: map[resolved.reason],
        };
      }
      const target = resolved.product;
      shouldSet = (p) => p === target;
      before = currentQuantityOf(target);
      alreadyCurrent = before === targetQuantity;
    }

    if (alreadyCurrent) {
      return {
        listingId,
        sku,
        before,
        after: targetQuantity,
        status: "skipped",
        detail: "Adet zaten güncel",
      };
    }
    // 2025 modeli: fiziksel listing envanter PUT'u her offering'de readiness
    // state ister. Çözebilirsek ?legacy=false ile göndeririz (fiyat itişiyle
    // aynı sözleşme); çözemezsek legacy PUT'a düşeriz.
    const readinessStateId = await resolveReadinessStateId(client);
    const update = buildInventoryUpdate(
      inventory,
      shouldSet,
      targetQuantity,
      readinessStateId,
      propsBySku,
    );
    await putListingInventory(client, listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });
    return {
      listingId,
      sku,
      before,
      after: targetQuantity,
      status: "updated",
    };
  } catch (e) {
    return {
      listingId,
      sku,
      before: null,
      after: targetQuantity,
      status: "error",
      detail: e instanceof Error ? e.message : "Bilinmeyen hata",
    };
  }
}

export type CreateMissingOfferingsOutcome = {
  listingId: number;
  status: "created" | "unchanged" | "error";
  /** Bu PUT ile Etsy'de YENİ oluşturulan offering (SKU) sayısı. */
  created: number;
  /** Etsy'de olmayan ve oluşturulamayan (fiyatsız/property'siz) panel SKU'ları. */
  missing: string[];
  detail?: string;
};

export type SkuRenameOutcome = {
  listingId: number;
  status: "updated" | "unchanged" | "error";
  /** Yeniden adlandırılan ürün (SKU) sayısı. */
  renamed: number;
  /** Örnek dönüşüm (ilk üç) — kullanıcıya ne olduğunu göstermek için. */
  sample: { from: string; to: string }[];
  detail?: string;
};

/**
 * SKU ÖNEK DEĞİŞTİRME — Etsy'de kopyalanan listing'in miras aldığı SKU'ları
 * kendi ailesine taşır.
 *
 * NEDEN: Etsy'de "copy listing" SKU'ları da kopyalar. Panelde varyant satırı
 * (org_id, sku) ile TEKİL olduğundan kopya kendi varyantlarını tutamaz —
 * "0 varyant" görünür, Listeler'de gizlenir, fiyat/SEO itişi yanlış hedefe
 * gidebilir. Kalıcı çözüm kopyanın SKU'larını değiştirmektir (canlı vaka:
 * 4544441878 sarı dome, RSG-R-1401 önekiyle doğmuştu).
 *
 * GÜVENLİK: fiyat/adet/property/readiness AYNEN korunur (buildInventoryUpdate
 * ile aynı ilke; okunamayan fiyat görülürse throw → PUT yapılmaz). Yalnız
 * `sku` alanı yeniden yazılır. Öneki taşımayan ürün varsa işlem hiç yapılmaz
 * (kısmi yeniden adlandırma bırakmayız).
 */
export async function renameListingSkuPrefix(
  client: EtsyClient,
  listingId: number,
  fromPrefix: string,
  toPrefix: string,
  /** ESKİ SKU → panel varyant property'leri ({name, value}). Fiyat/adet itişiyle
   *  AYNI PUT sözleşmesi geçerli: Etsy GET custom slot 513/514'te property_name
   *  null döndürür, 2025 PUT ise string ister ("Expected string value for
   *  'property_name' (got NULL)"). Verilmezse EON eksen adları (Width/Ring Size)
   *  payload'dan düşer. Anahtar ESKİ SKU'dur — envanter canlı (rename öncesi)
   *  Etsy SKU'suyla okunur. */
  propsBySku?: Map<string, { name: string; value: string }[]>,
): Promise<SkuRenameOutcome> {
  try {
    const inventory = await getListingInventory(client, listingId);
    const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
    if (live.length === 0) {
      return { listingId, status: "unchanged", renamed: 0, sample: [], detail: "Envanter boş" };
    }
    const yabanci = live.filter((p) => !(p.sku ?? "").startsWith(fromPrefix));
    if (yabanci.length > 0) {
      return {
        listingId,
        status: "error",
        renamed: 0,
        sample: [],
        detail: `${yabanci.length} ürün '${fromPrefix}' önekini taşımıyor (ör. "${yabanci[0].sku ?? "—"}") — hiçbir şey yazılmadı.`,
      };
    }

    const readinessStateId = await resolveReadinessStateId(client);
    // Fiyat/adet/property'yi olduğu gibi koruyan taban payload (hiçbir offering
    // hedeflenmiyor → adetler aynen geri yazılır).
    const update = buildInventoryUpdate(
      inventory,
      () => false,
      0,
      readinessStateId,
      propsBySku,
    );

    const sample: { from: string; to: string }[] = [];
    let renamed = 0;
    update.products = update.products.map((p, i) => {
      const eski = p.sku ?? "";
      const yeni = toPrefix + eski.slice(fromPrefix.length);
      if (yeni !== eski) {
        renamed++;
        if (sample.length < 3) sample.push({ from: eski, to: yeni });
      }
      // Sıra korunur: buildInventoryUpdate canlı ürünleri aynı sırayla üretir.
      void i;
      return { ...p, sku: yeni };
    });
    if (renamed === 0) {
      return { listingId, status: "unchanged", renamed: 0, sample: [] };
    }

    await putListingInventory(client, listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });
    return { listingId, status: "updated", renamed, sample };
  } catch (e) {
    return {
      listingId,
      status: "error",
      renamed: 0,
      sample: [],
      detail: e instanceof Error ? e.message : "Bilinmeyen hata",
    };
  }
}

/** Panel varyant property girdisi — DB `properties` sütunu Etsy GET'in ham
 *  property_values dizisini taşır (property_id/value_ids dahil). Eski
 *  {name, values} biçimi de kabul edilir (yalnız isim eşlemesi için). */
export type PanelVariantProperty = {
  property_id?: number | null;
  property_name?: string | null;
  name?: string;
  values?: string[];
  value_ids?: number[] | null;
  scale_id?: number | null;
};

/**
 * Panel'de olup Etsy'de OLMAYAN varyantları listing'e YENİ offering olarak
 * ekler (envanter PUT tüm matrisi değiştirir; eksikler aynı PUT'ta açılır).
 *
 * FİYAT OTORİTESİ: mevcut offering'lerin fiyatı/adedi/property'si Etsy'deki
 * CANLI değerleriyle AYNEN geri yazılır — panel mevcut fiyatlara DOKUNMAZ
 * (externalPricing kuralı; fiyat dış motorda belirlenir). Yalnız YENİ açılan
 * offering, DB'deki motor-kaynaklı fiyatla doğar — Etsy fiyatsız offering
 * kabul etmez. Oluşturulabilmesi için panel satırı Etsy formatında property
 * (property_id + value_ids) taşımalı; taşımayanlar `missing`te raporlanır.
 *
 * GÜVENLİK: herhangi bir canlı fiyat okunamazsa (0/eksik) tüm PUT iptal
 * edilir (buildInventoryUpdate ilkesi). Eksik SKU yoksa PUT hiç yapılmaz.
 *
 * @param panelVariants Panel DB'sinden ({ sku, price_cents, properties, quantity })
 */
export async function createMissingListingOfferings(
  client: EtsyClient,
  listingId: number,
  panelVariants: Array<{
    sku: string;
    priceCents: number | null;
    quantity: number;
    properties?: PanelVariantProperty[] | null;
  }>,
): Promise<CreateMissingOfferingsOutcome> {
  try {
    const inventory = await getListingInventory(client, listingId);
    const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
    if (live.length === 0) {
      return {
        listingId,
        status: "error",
        created: 0,
        missing: panelVariants.map((v) => v.sku),
        detail: "Etsy listing envanteri boş — sıfırdan kurulum bu akışın işi değil.",
      };
    }

    // Property'leri panel varyantlarından haritala (2025 PUT property_name
    // null dönen custom slot 513/514 için isim çözümü — echo yolunda gerekir).
    const propsBySku = new Map<string, { name: string; value: string }[]>();
    for (const pv of panelVariants) {
      const props: { name: string; value: string }[] = [];
      if (pv.properties) {
        for (const p of pv.properties) {
          const pname = p.property_name ?? p.name;
          if (!pname) continue;
          for (const val of p.values ?? []) {
            props.push({ name: pname, value: val });
          }
        }
      }
      if (props.length > 0) propsBySku.set(pv.sku, props);
    }

    // Eksik varyantları tespit et: Etsy'de bulunmayan panel SKU'ları.
    const etsySkus = new Set(live.map((p) => (p.sku ?? "").trim()));
    const missingAll = panelVariants.filter((v) => !etsySkus.has(v.sku.trim()));
    if (missingAll.length === 0) {
      return { listingId, status: "unchanged", created: 0, missing: [] };
    }

    // Taban payload: hiçbir offering hedeflenmez → canlı fiyat/adet AYNEN
    // geri yazılır (SKU-rename akışıyla aynı koruma; okunamayan fiyat throw).
    const readinessStateId = await resolveReadinessStateId(client);
    const update = buildInventoryUpdate(
      inventory,
      () => false,
      0,
      readinessStateId,
      propsBySku,
    );

    // Etsy'de olmayan panel varyantlarını YENİ offering olarak kur. Şart:
    // geçerli fiyat + Etsy formatında property (property_id'li — 0124 deseni
    // value_id'leri kardeş listing'den kopyalar; uydurma value_id PUT'u kırar.
    // property_id 0 = EON düz-nesne dönüşümü, Etsy'de geçersiz → missing).
    const newProducts: EtsyProductUpdate[] = [];
    const missing: string[] = [];
    for (const pv of missingAll) {
      const cents = pv.priceCents;
      const propVals = (pv.properties ?? []).filter((p) => !!p.property_id);
      if (cents == null || cents <= 0 || propVals.length === 0) {
        missing.push(pv.sku);
        continue;
      }
      newProducts.push({
        sku: pv.sku,
        property_values: propVals.map((p) => {
          const pname = p.property_name ?? p.name;
          return {
            property_id: p.property_id as number,
            ...(pname != null ? { property_name: pname } : {}),
            value_ids: p.value_ids ?? [],
            values: p.values ?? [],
            ...(p.scale_id != null ? { scale_id: p.scale_id } : {}),
          };
        }),
        offerings: [
          {
            price: cents / 100,
            quantity: pv.quantity ?? 0,
            is_enabled: true,
            ...(readinessStateId != null
              ? { readiness_state_id: readinessStateId }
              : {}),
          },
        ],
      });
    }

    if (newProducts.length === 0) {
      // Eksikler var ama hiçbiri oluşturulabilir değil — PUT yapmaya gerek yok.
      return {
        listingId,
        status: "error",
        created: 0,
        missing,
        detail: `${missing.length} eksik SKU oluşturulamadı (fiyat/property eksik): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`,
      };
    }

    update.products.push(...newProducts);
    // Genişlik→beden sırası: tüm SKU'lar <...>-<N>MM-<beden> desenindeyse
    // ürünleri sayısal sıraya koy — Etsy açılır menüsü ilk-görünüm sırasını izler.
    const parsed = update.products.map((p) => {
      const m = /-(\d+)MM-([0-9.]+)$/.exec(p.sku);
      return m ? { w: Number(m[1]), s: Number(m[2]) } : null;
    });
    if (parsed.every((x) => x != null)) {
      const order = update.products
        .map((p, i) => ({ p, k: parsed[i] as { w: number; s: number } }))
        .sort((a, b) => a.k.w - b.k.w || a.k.s - b.k.s)
        .map((x) => x.p);
      update.products = order;
    }

    await putListingInventory(client, listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });

    return {
      listingId,
      status: "created",
      created: newProducts.length,
      missing,
      detail:
        missing.length > 0
          ? `${newProducts.length} yeni offering oluşturuldu; ${missing.length} oluşturulamadı (fiyat/property eksik): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`
          : `${newProducts.length} yeni offering oluşturuldu (mevcut fiyatlara dokunulmadı)`,
    };
  } catch (e) {
    return {
      listingId,
      status: "error",
      created: 0,
      missing: [],
      detail: e instanceof Error ? e.message : "Bilinmeyen hata",
    };
  }
}

/**
 * SKU'nun değiştiği property eksenleri (`sku_on_property` payload alanı).
 *
 * Etsy sözleşmesi: bu alan BOŞKEN tüm offering'ler AYNI SKU'yu taşımak
 * zorundadır; farklı SKU gönderilirse PUT 400 "sku must be consistent across
 * all products" ile reddedilir (2026-08-29 kanaryası). Her tam kombinasyona
 * benzersiz SKU vermek için kullanılan TÜM property slotları bildirilir —
 * `create-listing.ts` (`sku_on_property: usedSlots`) ve `eon-push-drafts.ts`
 * (`[513, 514]`) ile aynı kural.
 *
 * Tek offering'de boş dizi döner: tek SKU zaten "tutarlı"dır, eksen gerekmez.
 */
export function skuVariationSlots(
  products: { property_values?: EtsyPropertyValue[] | null }[],
): number[] {
  if (products.length <= 1) return [];
  return [
    ...new Set(
      products.flatMap((p) =>
        (p.property_values ?? [])
          .map((pv) => pv.property_id)
          .filter((id): id is number => typeof id === "number"),
      ),
    ),
  ];
}

/** SKU ATAMA — Etsy'de SKU'su OLMAYAN offering'lere kimlik yazar. */
export type SkuAssignOutcome = {
  listingId: number;
  status: "planned" | "updated" | "unchanged" | "error";
  /** Bu koşuda SKU verilen (ya da verilecek) offering sayısı. */
  assigned: number;
  /** Zaten SKU'su olduğu için DOKUNULMAYAN offering sayısı. */
  skipped: number;
  /** Ne yazılacağı/yazıldığı — kuru çalışmada tek çıktı budur. */
  plan: { sku: string; label: string | null }[];
  detail?: string;
};

/**
 * Bir listing'in SKU'SUZ offering'lerine SKU yazar (varyantlı listing dahil).
 *
 * Neden gerekiyor: panel Etsy'yi birebir aynalar ve SKU'suz offering için
 * varyant satırı ÜRETMEZ (`lib/etsy/variants.ts` → toRows). SKU yoksa panelde
 * varyant, dolayısıyla offering-başına fiyat haritası da olmaz; fiyat itişi
 * (`pushListingPrices`) sessizce no-op'a düşer. Kimlik verilmeden fiyat
 * yönetilemez.
 *
 * GÜVENLİK KURALLARI
 *  - MEVCUT SKU ASLA EZİLMEZ: dolu olan offering atlanır (idempotent — tekrar
 *    koşmak güvenli; ikinci koşuda hepsi "skipped" olur).
 *  - Offering başına AYRI SKU için `sku_on_property` ZORUNLUDUR: boşken Etsy
 *    tek ortak SKU bekler ve farklı SKU'lara 400 "sku must be consistent
 *    across all products" der. Payload'a kullanılan tüm property slotları
 *    yazılır (create-listing.ts ile aynı kural).
 *  - Karışık durumda (bir kısmı SKU'lu, bir kısmı boş) hiçbir şey yazılmaz:
 *    sku_on_property override'ı mevcut sözleşmeyi değiştirebilir.
 *  - Üretilen SKU'lar listing içinde TEKİL ve <=32 karakter olmalı; değilse
 *    hiçbir şey yazılmaz (yarım kimlik, kimliksizlikten kötüdür).
 *  - Fiyat/adet/property AYNEN korunur: taban payload `buildInventoryUpdate`
 *    ile kurulur; o da okunamayan fiyatta throw eder (fiyatı sıfırlama koruması).
 *  - `apply` false ise PUT YAPILMAZ — yalnız plan döner.
 *  - Yazımdan sonra envanter GERİ OKUNUR ve her SKU'nun Etsy'de göründüğü
 *    doğrulanır; doğrulanamazsa `error` (200 OK teslim sayılmaz).
 */
export async function assignListingSkus(
  client: EtsyClient,
  listingId: number,
  buildSku: (product: EtsyInventoryProduct, index: number) => string,
  opts?: { apply?: boolean },
): Promise<SkuAssignOutcome> {
  const base: Omit<SkuAssignOutcome, "status"> = {
    listingId,
    assigned: 0,
    skipped: 0,
    plan: [],
  };
  try {
    const inventory = await getListingInventory(client, listingId);
    const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
    if (live.length === 0) {
      return { ...base, status: "unchanged", detail: "Envanter boş" };
    }

    // Hangi offering'e ne yazılacak? Dolu olanlar dokunulmadan atlanır.
    const yeniSkuByIndex = new Map<number, string>();
    const plan: { sku: string; label: string | null }[] = [];
    let skipped = 0;
    live.forEach((p, i) => {
      if ((p.sku ?? "").trim() !== "") {
        skipped += 1;
        return;
      }
      const sku = buildSku(p, i).trim();
      yeniSkuByIndex.set(i, sku);
      plan.push({ sku, label: propertyLabel(p.property_values) });
    });

    if (yeniSkuByIndex.size === 0) {
      return {
        ...base,
        status: "unchanged",
        skipped,
        detail: "Tüm offering'lerde SKU zaten var",
      };
    }

    // Kimlik doğrulaması — bozuk/çakışan SKU üretildiyse HİÇBİR ŞEY yazma.
    const uretilen = [...yeniSkuByIndex.values()];
    const bosOlan = uretilen.filter((s) => s === "");
    if (bosOlan.length > 0) {
      return { ...base, status: "error", skipped, plan, detail: `${bosOlan.length} offering için boş SKU üretildi` };
    }
    const uzun = uretilen.filter((s) => s.length > 32);
    if (uzun.length > 0) {
      return { ...base, status: "error", skipped, plan, detail: `SKU 32 karakteri aşıyor (ör. "${uzun[0]}")` };
    }
    const mevcutlar = live.map((p) => (p.sku ?? "").trim()).filter(Boolean);
    const hepsi = [...uretilen, ...mevcutlar];
    if (new Set(hepsi).size !== hepsi.length) {
      return { ...base, status: "error", skipped, plan, detail: "Üretilen SKU'lar listing içinde tekil değil" };
    }

    if (!opts?.apply) {
      return { ...base, status: "planned", assigned: yeniSkuByIndex.size, skipped, plan };
    }

    // KARIŞIK DURUM KORUMASI: bir kısmı SKU'lu bir kısmı boşsa, aşağıdaki
    // sku_on_property override'ı mevcut SKU sözleşmesini değiştirebilir —
    // insan kararı ister, dokunma.
    if (skipped > 0) {
      return {
        ...base,
        status: "error",
        assigned: 0,
        skipped,
        plan,
        detail: `Karışık durum: ${skipped} offering'de SKU var, ${yeniSkuByIndex.size} tanesinde yok. sku_on_property sözleşmesini değiştirmemek için hiçbir şey yazılmadı.`,
      };
    }

    const readinessStateId = await resolveReadinessStateId(client);
    // Fiyat/adet/property'yi olduğu gibi koruyan taban payload.
    const update = buildInventoryUpdate(inventory, () => false, 0, readinessStateId);
    // Sıra korunur: buildInventoryUpdate canlı ürünleri aynı sırayla üretir.
    update.products = update.products.map((p, i) => {
      const yeni = yeniSkuByIndex.get(i);
      return yeni ? { ...p, sku: yeni } : p;
    });

    // SKU EKSENLERİ — offering başına AYRI SKU ancak bununla mümkün.
    // `sku_on_property` boşken Etsy TEK ortak SKU bekler ve farklı SKU'lar
    // gönderilince 400 "sku must be consistent across all products" döner
    // (2026-08-29 kanaryası, listing 4558671043 / 396 offering).
    // Tam kombinasyon benzersiz olduğundan KULLANILAN TÜM property slotları
    // bildirilir — create-listing.ts ve eon-push-drafts.ts ile aynı kural.
    if (live.length > 1) {
      const slotlar = skuVariationSlots(live);
      if (slotlar.length === 0) {
        return {
          ...base,
          status: "error",
          assigned: 0,
          skipped,
          plan,
          detail:
            "Birden çok offering var ama hiçbirinde property yok — SKU'yu hangi eksende değiştireceğimiz bildirilemez, hiçbir şey yazılmadı.",
        };
      }
      update.sku_on_property = slotlar;
    }

    await putListingInventory(client, listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });

    // GERİ OKUMA: "200 OK" teslim sayılmaz — Etsy'de gerçekten var mı?
    const sonra = await getListingInventory(client, listingId);
    const canliSkular = new Set(
      (sonra.products ?? [])
        .filter((p) => !p.is_deleted)
        .map((p) => (p.sku ?? "").trim())
        .filter(Boolean),
    );
    const eksik = uretilen.filter((s) => !canliSkular.has(s));
    if (eksik.length > 0) {
      return {
        ...base,
        status: "error",
        assigned: 0,
        skipped,
        plan,
        detail: `PUT geçti ama geri okumada ${eksik.length} SKU yok (ör. "${eksik[0]}") — yazma doğrulanamadı.`,
      };
    }
    return { ...base, status: "updated", assigned: yeniSkuByIndex.size, skipped, plan };
  } catch (e) {
    return {
      ...base,
      status: "error",
      detail: e instanceof Error ? e.message : "Bilinmeyen hata",
    };
  }
}

/** property_values → okunur etiket ("14K · Yellow Gold · 7"). */
function propertyLabel(props?: EtsyPropertyValue[]): string | null {
  if (!props || props.length === 0) return null;
  const parts = props.map((p) => (p.values ?? []).join("/")).filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
