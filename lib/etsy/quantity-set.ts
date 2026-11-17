import { etsyMoneyToUnit, type EtsyInventory } from "@/lib/etsy/types";

/**
 * ops/quantity-set yardımcıları. Saf fonksiyonlar: Etsy'ye dokunmaz, yalnız
 * okunan envanterden plan ve doğrulama izi üretir.
 *
 * NEDEN VAR (2026-11-17, Leander): 20 Evil Eye listing'i Etsy'de adet 1 ile
 * açılmıştı (panel `products.quantity` boşken taslak adedi 1'e düşüyor), diğer
 * 195 listing 20. Sipariş üzerine üretilen bir listing'de adet 1, ilk satışta
 * listing'in tükenip yayından düşmesi demektir.
 *
 * Kural: yazım yalnız adet TEK DEĞERKEN yapılır. Adet bir varyasyona bağlıysa
 * (`quantity_on_property` dolu) ya da satışa açık offering'ler farklı adet
 * taşıyorsa, düz bir yazım bilerek verilmiş stok kararını ezer; plan reddeder.
 */

export type QuantityRefusal =
  | "empty"
  | "quantity-on-property"
  | "mixed-quantities"
  | "unreadable-price";

export type QuantityPlan = {
  status: "would-set" | "already" | "refuse";
  reason?: QuantityRefusal;
  /** Satışa açık offering'lerdeki farklı adetler, artan sırada. */
  before: number[];
  products: number;
  offerings: number;
  /** Satışa kapalı (is_enabled=false) offering sayısı; adet kontrolüne girmez. */
  disabled: number;
};

type LiveOffering = {
  key: string;
  quantity: number;
  enabled: boolean;
  price: number;
};

function liveOfferings(inventory: EtsyInventory): { products: number; rows: LiveOffering[] } {
  const products = (inventory.products ?? []).filter((p) => !p.is_deleted);
  const rows: LiveOffering[] = [];
  for (const p of products) {
    const values = (p.property_values ?? [])
      .map((pv) => (pv.values ?? []).join("+"))
      .join("/");
    for (const o of (p.offerings ?? []).filter((x) => !x.is_deleted)) {
      rows.push({
        key: `${p.sku ?? ""}|${values}`,
        quantity: o.quantity ?? 0,
        enabled: o.is_enabled ?? true,
        price: etsyMoneyToUnit(o.price),
      });
    }
  }
  return { products: products.length, rows };
}

/** Satışa açık offering'lerdeki farklı adetler, artan sırada. */
export function enabledQuantities(inventory: EtsyInventory): number[] {
  const { rows } = liveOfferings(inventory);
  return [...new Set(rows.filter((r) => r.enabled).map((r) => r.quantity))].sort(
    (a, b) => a - b,
  );
}

/** Hedef adet için plan: yazılır mı, zaten mi, reddedilir mi. */
export function planQuantitySet(inventory: EtsyInventory, target: number): QuantityPlan {
  const { products, rows } = liveOfferings(inventory);
  const enabled = rows.filter((r) => r.enabled);
  const before = enabledQuantities(inventory);
  const base = {
    before,
    products,
    offerings: rows.length,
    disabled: rows.length - enabled.length,
  };
  if (enabled.length === 0) return { status: "refuse", reason: "empty", ...base };
  if ((inventory.quantity_on_property ?? []).length > 0) {
    return { status: "refuse", reason: "quantity-on-property", ...base };
  }
  if (before.length > 1) return { status: "refuse", reason: "mixed-quantities", ...base };
  // Adet yazımı tüm fiyatları okunduğu gibi geri gönderir; okunamayan fiyat
  // yazımı zaten iptal ettirir (buildInventoryUpdate). Kuru çalışma bunu önceden söyler.
  if (rows.some((r) => !(r.price > 0))) {
    return { status: "refuse", reason: "unreadable-price", ...base };
  }
  if (before[0] === target) return { status: "already", ...base };
  return { status: "would-set", ...base };
}

/**
 * Adet DIŞINDA kalan her şeyin izi: offering başına SKU, varyasyon değerleri,
 * fiyat ve satışa açıklık. Yazımdan önce ve sonra aynı çıkmalı; farklıysa
 * adet yazımı fiyata ya da yapıya dokunmuş demektir.
 */
export function priceFingerprint(inventory: EtsyInventory): string {
  const { rows } = liveOfferings(inventory);
  return rows
    .map((r) => `${r.key}|${Math.round(r.price * 100)}|${r.enabled ? 1 : 0}`)
    .sort()
    .join("\n");
}
