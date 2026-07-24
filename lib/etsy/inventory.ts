import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  etsyMoneyToUnit,
  type EtsyInventory,
  type EtsyInventoryProduct,
  type EtsyInventoryUpdate,
  type EtsyOfferingUpdate,
  type EtsyProductUpdate,
} from "@/lib/etsy/types";

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
): EtsyInventoryUpdate {
  const products: EtsyProductUpdate[] = (inventory.products ?? [])
    .filter((p) => !p.is_deleted)
    .map((p) => {
      const isTarget = shouldSet(p);
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
        property_values: (p.property_values ?? []).map((pv) => ({
          property_id: pv.property_id,
          value_ids: pv.value_ids ?? [],
          values: pv.values ?? [],
          ...(pv.scale_id != null ? { scale_id: pv.scale_id } : {}),
        })),
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
): { update: EtsyInventoryUpdate; changed: number } {
  let changed = 0;
  const products: EtsyProductUpdate[] = (inventory.products ?? [])
    .filter((p) => !p.is_deleted)
    .map((p) => {
      const sku = p.sku ?? "";
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
        property_values: (p.property_values ?? []).map((pv) => ({
          property_id: pv.property_id,
          value_ids: pv.value_ids ?? [],
          values: pv.values ?? [],
          ...(pv.scale_id != null ? { scale_id: pv.scale_id } : {}),
        })),
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

export type PushOutcome = {
  listingId: number;
  sku: string | null;
  before: number | null;
  after: number;
  status: "updated" | "skipped" | "error";
  detail?: string;
};

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
    const update = buildInventoryUpdate(inventory, shouldSet, targetQuantity);
    await putListingInventory(client, listingId, update);
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
