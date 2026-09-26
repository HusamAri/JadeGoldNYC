import type { EtsyInventoryUpdate, EtsyProductUpdate } from "@/lib/etsy/types";

/**
 * Panel varyantlarından TAM bir Etsy envanter yükü kurar (saf, IO yok).
 *
 * Sözleşme create yolundan (lib/etsy/create-listing.ts, D/E maddeleri)
 * birebir alınır, yeniden türetilmez: 3 eksen → slot 516/513/514 ve
 * `max_variations_supported=3` (putListingInventory ekler), 2 eksen →
 * 513/514, 1 eksen → 513; kullanılan tüm slotlar hem price_on_property hem
 * sku_on_property'dedir (her tam kombinasyon kendi fiyatını ve SKU'sunu
 * taşır; sku_on_property boş kalırsa Etsy "sku must be consistent across all
 * products" ile 400 döner, 2026-08-29 dersi). Offering başına readiness.
 *
 * Şüphede REDDET: eksik eksen değeri, tekrarlanan kombinasyon, tekrarlanan
 * ya da 32 karakteri aşan SKU, fiyatsız varyant, 3 eksende 400'ü aşan ızgara.
 */

const SLOT_IDS: Record<number, readonly number[]> = {
  1: [513],
  2: [513, 514],
  3: [516, 513, 514],
};
const MAX_THREE_AXIS_PRODUCTS = 400;
const MAX_SKU_LENGTH = 32;

export interface RebuildVariant {
  sku: string | null;
  price_cents: number | null;
  quantity: number | null;
  properties: unknown;
}

export type RebuildResult =
  | {
      ok: true;
      update: EtsyInventoryUpdate;
      axisValues: Record<string, string[]>;
      priceRange: [number, number];
    }
  | { ok: false; error: string };

function propertyMap(props: unknown): Map<string, string> {
  const out = new Map<string, string>();
  if (Array.isArray(props)) {
    for (const p of props as { property_name?: unknown; values?: unknown; value?: unknown }[]) {
      const name = typeof p?.property_name === "string" ? p.property_name.trim() : "";
      const raw = Array.isArray(p?.values) ? p.values[0] : p?.value;
      const value = typeof raw === "string" || typeof raw === "number" ? String(raw).trim() : "";
      if (name && value) out.set(name, value);
    }
  } else if (props && typeof props === "object") {
    for (const [k, v] of Object.entries(props as Record<string, unknown>)) {
      const value = typeof v === "string" || typeof v === "number" ? String(v).trim() : "";
      if (k.trim() && value) out.set(k.trim(), value);
    }
  }
  return out;
}

export function buildRebuildInventory(
  variants: RebuildVariant[],
  axes: string[],
  readinessStateId: number,
  fallbackQuantity: number,
): RebuildResult {
  const slots = SLOT_IDS[axes.length];
  if (!slots) return { ok: false, error: `eksen sayısı 1-3 olmalı, gelen ${axes.length}` };
  if (new Set(axes).size !== axes.length) return { ok: false, error: "eksen adları tekrarlı" };
  if (variants.length < 2) return { ok: false, error: "en az iki aktif varyant gerekli" };
  if (axes.length === 3 && variants.length > MAX_THREE_AXIS_PRODUCTS) {
    return { ok: false, error: `3 eksen en çok ${MAX_THREE_AXIS_PRODUCTS} ürün, gelen ${variants.length}` };
  }

  const skus = new Set<string>();
  const combos = new Set<string>();
  const axisValues: Record<string, Set<string>> = Object.fromEntries(axes.map((a) => [a, new Set()]));
  const products: EtsyProductUpdate[] = [];
  let lo = Number.POSITIVE_INFINITY;
  let hi = 0;

  for (const v of variants) {
    const sku = (v.sku ?? "").trim();
    if (!sku) return { ok: false, error: "SKU'suz varyant var" };
    if (sku.length > MAX_SKU_LENGTH) return { ok: false, error: `SKU ${MAX_SKU_LENGTH} karakteri aşıyor: ${sku}` };
    if (skus.has(sku)) return { ok: false, error: `SKU tekrarlı: ${sku}` };
    skus.add(sku);
    if (!(v.price_cents && v.price_cents > 0)) return { ok: false, error: `fiyatsız varyant: ${sku}` };

    const map = propertyMap(v.properties);
    const extra = [...map.keys()].filter((k) => !axes.includes(k));
    if (extra.length > 0) return { ok: false, error: `${sku}: eksen dışı özellik ${extra.join(", ")}` };
    const values = axes.map((a) => map.get(a) ?? "");
    const missing = axes.filter((_, i) => !values[i]);
    if (missing.length > 0) return { ok: false, error: `${sku}: eksik eksen ${missing.join(", ")}` };
    const combo = values.join("\u0001");
    if (combos.has(combo)) return { ok: false, error: `kombinasyon tekrarlı: ${values.join(" / ")}` };
    combos.add(combo);
    axes.forEach((a, i) => axisValues[a].add(values[i]));

    lo = Math.min(lo, v.price_cents);
    hi = Math.max(hi, v.price_cents);
    products.push({
      sku,
      property_values: axes.map((name, i) => ({
        property_id: slots[i],
        property_name: name,
        value_ids: [],
        values: [values[i]],
      })),
      offerings: [
        {
          price: v.price_cents / 100,
          quantity: v.quantity ?? fallbackQuantity,
          is_enabled: true,
          readiness_state_id: readinessStateId,
        },
      ],
    });
  }

  for (const a of axes) {
    if (axisValues[a].size < 2) return { ok: false, error: `${a} gerçek bir eksen değil (tek değer)` };
  }
  const expectedGrid = axes.reduce((n, a) => n * axisValues[a].size, 1);
  if (expectedGrid !== products.length) {
    return {
      ok: false,
      error: `ızgara eksik: ${axes.map((a) => axisValues[a].size).join(" × ")} = ${expectedGrid}, varyant ${products.length}`,
    };
  }

  return {
    ok: true,
    update: {
      products,
      price_on_property: [...slots],
      quantity_on_property: [],
      sku_on_property: [...slots],
      readiness_state_on_property: [],
    },
    axisValues: Object.fromEntries(axes.map((a) => [a, [...axisValues[a]]])),
    priceRange: [lo / 100, hi / 100],
  };
}
