import type {
  EtsyInventory,
  EtsyInventoryProduct,
  EtsyInventoryUpdate,
  EtsyOffering,
} from "@/lib/etsy/types";

/** The three existing EON drafts only. This module never creates a listing. */
export const FLAT_MILGRAIN_ORG_ID = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";
export const FLAT_MILGRAIN_SHOP_ID = 61324215;

export type FlatMilgrainMetal = "Y" | "W" | "R";

export interface FlatMilgrainTarget {
  productId: string;
  listingId: number;
  metal: FlatMilgrainMetal;
  skuPrefix: string;
}

export const FLAT_MILGRAIN_TARGETS: readonly FlatMilgrainTarget[] = [
  {
    productId: "dd9febe7-9900-4d9d-8d07-88755a5279b8",
    listingId: 4570232103,
    metal: "Y",
    skuPrefix: "EON-FMLGRN-Y",
  },
  {
    productId: "f4d4ef99-26a2-4295-a582-f35b90c78852",
    listingId: 4570232571,
    metal: "W",
    skuPrefix: "EON-FMLGRN-W",
  },
  {
    productId: "e8533ce8-d497-4e9e-af10-6ee4253e6522",
    listingId: 4570233049,
    metal: "R",
    skuPrefix: "EON-FMLGRN-R",
  },
] as const;

export function getFlatMilgrainTarget(productId: string): FlatMilgrainTarget | undefined {
  return FLAT_MILGRAIN_TARGETS.find((target) => target.productId === productId);
}

export interface FlatMilgrainPanelVariant {
  sku: string | null;
  active: boolean | null;
  properties: Record<string, string> | null;
  price_cents: number | null;
  quantity: number | null;
}

export interface ValidatedFlatMilgrainVariant {
  sku: string;
  karat: "10K" | "14K" | "18K";
  width: string;
  ringSize: string;
  priceCents: number;
  quantity: 20;
}

const KARATS = ["10K", "14K", "18K"] as const;
const WIDTHS = [2, 3, 4, 5, 6, 7] as const;
const SIZE_TENTHS = Array.from({ length: 21 }, (_, index) => 30 + index * 5);
const PROPERTY_IDS = [516, 513, 514] as const;
const PROPERTY_NAMES = ["Karat", "Width", "Ring Size"] as const;
const GRID_COUNT = KARATS.length * WIDTHS.length * SIZE_TENTHS.length;
const OLD_SIZE_TENTHS = 130;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`EON Flat Milgrain: ${message}`);
}

function checkTarget(target: FlatMilgrainTarget): void {
  invariant(
    FLAT_MILGRAIN_TARGETS.some(
      (known) =>
        known.productId === target.productId &&
        known.listingId === target.listingId &&
        known.metal === target.metal &&
        known.skuPrefix === target.skuPrefix,
    ),
    "hedef ürün/listing/metal/SKU öneki izin verilen üç taslaktan biri değil",
  );
}

function sizeLabel(tenths: number): string {
  return `US ${Number.isInteger(tenths / 10) ? tenths / 10 : (tenths / 10).toFixed(1)}`;
}

function expectedSku(
  target: FlatMilgrainTarget,
  karat: (typeof KARATS)[number],
  width: (typeof WIDTHS)[number],
  sizeTenths: number,
): string {
  return `${target.skuPrefix}-${karat.slice(0, -1)}-${String(width).padStart(2, "0")}-${String(sizeTenths).padStart(3, "0")}`;
}

function expectedGrid(target: FlatMilgrainTarget): Array<{
  sku: string;
  karat: (typeof KARATS)[number];
  width: string;
  ringSize: string;
  sizeTenths: number;
}> {
  const grid = [];
  for (const karat of KARATS) {
    for (const width of WIDTHS) {
      for (const sizeTenths of SIZE_TENTHS) {
        grid.push({
          sku: expectedSku(target, karat, width, sizeTenths),
          karat,
          width: `${width} mm`,
          ringSize: sizeLabel(sizeTenths),
          sizeTenths,
        });
      }
    }
  }
  return grid;
}

/** Fail closed on a missing, inactive, duplicated, or malformed panel cell. */
export function validateFlatMilgrainPanelVariants(
  target: FlatMilgrainTarget,
  rows: readonly FlatMilgrainPanelVariant[],
): ValidatedFlatMilgrainVariant[] {
  checkTarget(target);
  invariant(rows.length === GRID_COUNT, `${target.skuPrefix}: tam ${GRID_COUNT} aktif panel varyantı gerekir (${rows.length} bulundu)`);

  const bySku = new Map<string, FlatMilgrainPanelVariant>();
  for (const row of rows) {
    invariant(row.active === true, `${row.sku ?? "SKU yok"}: panel varyantı aktif değil`);
    invariant(typeof row.sku === "string" && row.sku.length > 0, "boş SKU bulundu");
    invariant(!bySku.has(row.sku), `${row.sku}: mükerrer SKU`);
    bySku.set(row.sku, row);
  }

  const validated: ValidatedFlatMilgrainVariant[] = [];
  for (const cell of expectedGrid(target)) {
    const row = bySku.get(cell.sku);
    invariant(row, `${cell.sku}: panel varyantı eksik`);
    invariant(
      row.properties !== null &&
        !Array.isArray(row.properties) &&
        Object.keys(row.properties).length === 3 &&
        Object.keys(row.properties).every((key) => PROPERTY_NAMES.includes(key as (typeof PROPERTY_NAMES)[number])),
      `${cell.sku}: yalnız Karat, Width, Ring Size özellikleri bulunmalı`,
    );
    invariant(row.properties.Karat === cell.karat, `${cell.sku}: Karat değeri eşleşmiyor`);
    invariant(row.properties.Width === cell.width, `${cell.sku}: Width değeri eşleşmiyor`);
    invariant(row.properties["Ring Size"] === cell.ringSize, `${cell.sku}: Ring Size değeri eşleşmiyor`);
    invariant(typeof row.price_cents === "number" && Number.isSafeInteger(row.price_cents) && row.price_cents > 0, `${cell.sku}: geçersiz price_cents`);
    invariant(row.quantity === 20, `${cell.sku}: quantity 20 olmalı`);
    validated.push({
      sku: cell.sku,
      karat: cell.karat,
      width: cell.width,
      ringSize: cell.ringSize,
      priceCents: row.price_cents,
      quantity: 20,
    });
  }
  invariant(
    validated.length === bySku.size,
    `${target.skuPrefix}: beklenmeyen SKU bulundu`,
  );
  return validated;
}

function checkReadinessStateId(readinessStateId: number): void {
  invariant(
    Number.isSafeInteger(readinessStateId) && readinessStateId > 0,
    "geçerli Etsy readiness_state_id gerekir",
  );
}

/** Deterministic Etsy 2025 inventory PUT payload, with display order Karat → Width → Ring Size. */
export function buildFlatMilgrainThreeAxisInventory(
  target: FlatMilgrainTarget,
  rows: readonly FlatMilgrainPanelVariant[],
  readinessStateId: number,
): EtsyInventoryUpdate {
  checkReadinessStateId(readinessStateId);
  const variants = validateFlatMilgrainPanelVariants(target, rows);
  return {
    products: variants.map((variant) => ({
      sku: variant.sku,
      property_values: [
        { property_id: 516, property_name: "Karat", value_ids: [], values: [variant.karat] },
        { property_id: 513, property_name: "Width", value_ids: [], values: [variant.width] },
        { property_id: 514, property_name: "Ring Size", value_ids: [], values: [variant.ringSize] },
      ],
      offerings: [
        {
          price: variant.priceCents / 100,
          quantity: variant.quantity,
          is_enabled: true,
          readiness_state_id: readinessStateId,
        },
      ],
    })),
    price_on_property: [...PROPERTY_IDS],
    quantity_on_property: [],
    sku_on_property: [...PROPERTY_IDS],
    readiness_state_on_property: [],
  };
}

type InventoryReadback = EtsyInventory & {
  readiness_state_on_property?: number[];
  products: Array<
    EtsyInventoryProduct & {
      offerings?: Array<EtsyOffering & { readiness_state_id?: number }>;
    }
  >;
};

function sameNumbers(actual: readonly number[] | undefined, expected: readonly number[]): boolean {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function offeringCents(offering: EtsyOffering, sku: string): number {
  const money = offering.price;
  invariant(
    money &&
      Number.isFinite(money.amount) &&
      Number.isFinite(money.divisor) &&
      money.divisor > 0 &&
      money.currency_code === "USD",
    `${sku}: Etsy USD fiyatı eksik/geçersiz`,
  );
  const cents = (money.amount / money.divisor) * 100;
  invariant(Number.isSafeInteger(Math.round(cents)) && Math.abs(cents - Math.round(cents)) < 1e-6, `${sku}: Etsy fiyatı tam cent değil`);
  return Math.round(cents);
}

function oneOffering(product: EtsyInventoryProduct, sku: string): EtsyOffering & { readiness_state_id?: number } {
  invariant(product.is_deleted !== true, `${sku}: Etsy ürünü silinmiş`);
  invariant(product.offerings?.length === 1, `${sku}: tam bir Etsy offering gerekir`);
  const offering = product.offerings[0] as EtsyOffering & { readiness_state_id?: number };
  invariant(offering.is_deleted !== true, `${sku}: Etsy offering silinmiş`);
  invariant(offering.is_enabled === true, `${sku}: Etsy offering etkin değil`);
  return offering;
}

function expectedBySku(target: FlatMilgrainTarget, expected: EtsyInventoryUpdate): Map<string, EtsyInventoryUpdate["products"][number]> {
  checkTarget(target);
  invariant(expected.products.length === GRID_COUNT, `${target.skuPrefix}: beklenen PUT yükü ${GRID_COUNT} ürün olmalı`);
  const bySku = new Map(expected.products.map((product) => [product.sku, product]));
  invariant(bySku.size === GRID_COUNT, `${target.skuPrefix}: beklenen PUT yükünde mükerrer SKU`);
  const grid = expectedGrid(target);
  invariant(grid.every((cell) => bySku.has(cell.sku)), `${target.skuPrefix}: beklenen PUT yükünde SKU ızgarası eksik`);
  return bySku;
}

/** GET `?legacy=false` readback must exactly match every written axis and offering. */
export function verifyFlatMilgrainReadback(
  target: FlatMilgrainTarget,
  current: InventoryReadback,
  expected: EtsyInventoryUpdate,
  readinessStateId: number,
): void {
  checkReadinessStateId(readinessStateId);
  const expectedProducts = expectedBySku(target, expected);
  invariant(current.products?.length === GRID_COUNT, `${target.skuPrefix}: Etsy readback ${GRID_COUNT} ürün değil`);
  invariant(sameNumbers(current.price_on_property, PROPERTY_IDS), `${target.skuPrefix}: price_on_property üç eksen değil`);
  invariant(sameNumbers(current.sku_on_property, PROPERTY_IDS), `${target.skuPrefix}: sku_on_property üç eksen değil`);
  invariant(sameNumbers(current.quantity_on_property, []), `${target.skuPrefix}: quantity_on_property boş değil`);
  invariant(sameNumbers(current.readiness_state_on_property, []), `${target.skuPrefix}: readiness_state_on_property boş değil`);

  const seen = new Set<string>();
  for (const product of current.products) {
    const sku = product.sku ?? "SKU yok";
    invariant(!seen.has(sku), `${sku}: Etsy readback mükerrer SKU`);
    seen.add(sku);
    const intended = expectedProducts.get(sku);
    invariant(intended, `${sku}: Etsy readback beklenmeyen SKU`);
    invariant(product.property_values?.length === 3, `${sku}: tam üç Etsy property gerekir`);
    for (let i = 0; i < PROPERTY_IDS.length; i += 1) {
      const actualProperty = product.property_values[i];
      const expectedProperty = intended.property_values[i];
      invariant(actualProperty.property_id === PROPERTY_IDS[i], `${sku}: ${PROPERTY_NAMES[i]} property ID/sırası farklı`);
      invariant(
        actualProperty.values?.length === 1 && actualProperty.values[0] === expectedProperty.values[0],
        `${sku}: ${PROPERTY_NAMES[i]} değeri farklı`,
      );
      // Etsy GET custom property names may be null; the IDs and values are authoritative.
    }
    const actualOffering = oneOffering(product, sku);
    const expectedOffering = intended.offerings[0];
    invariant(offeringCents(actualOffering, sku) === Math.round(expectedOffering.price * 100), `${sku}: Etsy fiyatı farklı`);
    invariant(actualOffering.quantity === expectedOffering.quantity, `${sku}: Etsy adedi farklı`);
    invariant(actualOffering.readiness_state_id === readinessStateId, `${sku}: Etsy readiness state farklı`);
  }
  invariant(seen.size === expectedProducts.size, `${target.skuPrefix}: Etsy readback SKU sayısı farklı`);
}

/** Only a verified 18-cell US 13 baseline may be upgraded; a verified 378-cell state is a no-op. */
export function preflightFlatMilgrainInventory(
  target: FlatMilgrainTarget,
  current: InventoryReadback,
  expected: EtsyInventoryUpdate,
  readinessStateId: number,
): "upgrade" | "unchanged" {
  checkReadinessStateId(readinessStateId);
  const expectedProducts = expectedBySku(target, expected);
  if (current.products?.length === GRID_COUNT) {
    verifyFlatMilgrainReadback(target, current, expected, readinessStateId);
    return "unchanged";
  }

  invariant(current.products?.length === KARATS.length * WIDTHS.length, `${target.skuPrefix}: Etsy baseline tam 18 ürün değil`);
  const oldSkus = new Set(
    expectedGrid(target)
      .filter((cell) => cell.sizeTenths === OLD_SIZE_TENTHS)
      .map((cell) => cell.sku),
  );
  const seen = new Set<string>();
  for (const product of current.products) {
    const sku = product.sku ?? "SKU yok";
    invariant(oldSkus.has(sku) && !seen.has(sku), `${sku}: Etsy baseline US 13 SKU ızgarasıyla eşleşmiyor`);
    seen.add(sku);
    const intended = expectedProducts.get(sku);
    invariant(intended, `${sku}: beklenen panel fiyatı bulunamadı`);
    invariant(product.property_values?.length === 2, `${sku}: Etsy baseline tam Karat + Width ekseninde değil`);
    const oldProperties = new Map(product.property_values.map((property) => [property.property_id, property]));
    invariant(oldProperties.size === 2 && oldProperties.has(516) && oldProperties.has(513), `${sku}: Etsy baseline Karat + Width ID'leri farklı`);
    invariant(
      oldProperties.get(516)?.values?.length === 1 &&
        oldProperties.get(516)?.values?.[0] === intended.property_values[0].values[0],
      `${sku}: Etsy baseline Karat değeri farklı`,
    );
    invariant(
      oldProperties.get(513)?.values?.length === 1 &&
        oldProperties.get(513)?.values?.[0] === intended.property_values[1].values[0],
      `${sku}: Etsy baseline Width değeri farklı`,
    );
    const offering = oneOffering(product, sku);
    invariant(offeringCents(offering, sku) === Math.round(intended.offerings[0].price * 100), `${sku}: Etsy baseline fiyatı panelden farklı`);
    invariant(offering.quantity === intended.offerings[0].quantity, `${sku}: Etsy baseline adedi panelden farklı`);
  }
  invariant(seen.size === oldSkus.size, `${target.skuPrefix}: Etsy baseline US 13 ızgarası eksik`);
  return "upgrade";
}
