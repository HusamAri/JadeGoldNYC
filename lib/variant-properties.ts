import type { EtsyPropertyValue } from "@/lib/etsy/types";

/**
 * `product_variants.properties` iki farklı şekilde saklanır:
 *
 *  - **Etsy senkron** (ör. Jade Gold): `EtsyPropertyValue[]` dizisi —
 *    `[{ property_name: "Size", values: ["7"] }, ...]` (Etsy Open API şekli).
 *  - **Panel seed** (ör. EON alyansları): düz JSON nesnesi —
 *    `{ "Width": "3mm", "Ring Size": "US 4-6.5", "Metal": "Yellow Gold" }`
 *    (anahtar = property adı, değer = tek değer).
 *
 * Diziyi varsayan okuyucular (`.map` / `.flatMap` / `for…of`) nesne şeklinde
 * ÇÖKER (`"... .map is not a function"` / nesne iterable değil) → RSC render'da
 * bu, sayfayı 500'e düşürür. Bu yardımcı her iki şekli de kanonik Etsy dizisine
 * indirger; **dizi girdi olduğu gibi geçer** (Etsy yolu davranışı değişmez,
 * sıfır regresyon riski), yalnız düz nesne diziye çevrilir.
 *
 * Not: `getProductVariantMatrix` (lib/db/queries/variants.ts) BİLEREK nesne
 * şeklini `Record<string,string>` olarak okur (Width/Ring Size'a ada göre
 * erişir) — o yol EON nesnesine göre kurulmuştur, bu yardımcıya ihtiyaç duymaz.
 */
export type RawVariantProperties =
  | EtsyPropertyValue[]
  | Record<string, string>
  | null
  | undefined;

/** Her iki şekli de kanonik `EtsyPropertyValue[]` dizisine indirger. */
export function asEtsyProperties(
  properties: RawVariantProperties,
): EtsyPropertyValue[] {
  if (properties == null) return [];
  if (Array.isArray(properties)) return properties;
  // Düz nesne (EON): her anahtar bir property; değer tek elemanlı values.
  return Object.entries(properties).map(([property_name, value]) => ({
    property_id: 0,
    property_name,
    values: value == null ? [] : [String(value)],
  }));
}

/**
 * Okunur değer parçaları — her property'nin `values`'u virgülle birleşir,
 * boşlar atılır. Varyant etiketi için (ör. ["Yellow Gold", "3mm", "US 4-6.5"]).
 */
export function variantPropertyParts(
  properties: RawVariantProperties,
): string[] {
  return asEtsyProperties(properties)
    .map((p) => (p.values ?? []).join(", "))
    .filter(Boolean);
}

/**
 * {name, value} çiftleri — Etsy 2025 envanter PUT'unda property_name'i (Etsy
 * GET null döndürünce) değer eşleşmesiyle doldurmak için. Her property'nin ilk
 * değeri alınır (ör. [{name:"Width", value:"2mm"}, {name:"Ring Size", value:"5"}]).
 */
export function variantPropsForMatch(
  properties: RawVariantProperties,
): { name: string; value: string }[] {
  return asEtsyProperties(properties)
    .map((p) => ({
      name: p.property_name ?? "",
      value: (p.values ?? [])[0] ?? "",
    }))
    .filter((p) => p.name && p.value);
}
