/** Pure conversion for a scoped Ophir rollback; no Etsy or database writes. */
export interface OphirRestoreTarget {
  sku: string;
  beforeCents: number;
  afterCents: number;
}

interface RestoreProperty {
  property_id: number;
  property_name: string;
  scale_id?: number | null;
  value_ids: number[];
  values: string[];
}

interface RestoreOffering {
  price: number;
  quantity: number;
  is_enabled: boolean;
  readiness_state_id: number;
}

interface RestoreProduct {
  sku: string;
  property_values: RestoreProperty[];
  offerings: RestoreOffering[];
}

export interface OphirRestoreInventoryUpdate {
  products: RestoreProduct[];
  price_on_property: number[];
  quantity_on_property: number[];
  sku_on_property: number[];
  readiness_state_on_property: number[];
}

export interface OphirRestorePrice {
  sku: string;
  currentCents: number;
  targetCents: number;
  status: "restore" | "already-restored" | "unchanged";
}

const AXES = [
  "price_on_property",
  "quantity_on_property",
  "sku_on_property",
  "readiness_state_on_property",
] as const;

function fail(message: string): never {
  throw new Error(`Ophir price restore: ${message}`);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
    fail(`${label} must be a safe integer >= ${minimum}`);
  }
  return value;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

/** Reject sub-cent values instead of rounding or silently accepting another currency. */
function moneyCents(value: unknown, label: string): number {
  const money = object(value, label);
  if (money.currency_code !== "USD") fail(`${label} must use USD`);
  const amount = integer(money.amount, `${label}.amount`, 1);
  const divisor = integer(money.divisor, `${label}.divisor`, 1);
  const scaled = amount * 100;
  if (!Number.isSafeInteger(scaled) || scaled % divisor !== 0) {
    fail(`${label} must have exact integer-cent precision`);
  }
  return integer(scaled / divisor, `${label}.cents`, 1);
}

function numericIds(value: unknown, label: string): number[] {
  return array(value, label).map((id) => integer(id, label, 1));
}

function live(value: unknown, label: string): Record<string, unknown> | null {
  const row = object(value, label);
  if (row.is_deleted !== undefined && typeof row.is_deleted !== "boolean") {
    fail(`${label}.is_deleted must be a boolean`);
  }
  return row.is_deleted === true ? null : row;
}

function convertInventory(input: unknown): OphirRestoreInventoryUpdate {
  const inventory = object(input, "inventory");
  const axisArrays = Object.fromEntries(
    AXES.map((key) => [key, numericIds(inventory[key], key)]),
  ) as Pick<OphirRestoreInventoryUpdate, (typeof AXES)[number]>;
  for (const key of AXES) {
    if (new Set(axisArrays[key]).size !== axisArrays[key].length) {
      fail(`${key} contains duplicate property IDs`);
    }
  }
  const products: RestoreProduct[] = [];
  for (const rawProduct of array(inventory.products, "products")) {
    const product = live(rawProduct, "product");
    if (!product) continue;
    const sku = string(product.sku, "product.sku");
    const property_values = array(product.property_values, `${sku}.property_values`).map(
      (rawProperty): RestoreProperty => {
        const property = object(rawProperty, `${sku}.property`);
        const property_name = string(property.property_name, `${sku}.property_name`);
        if (!property_name.trim()) fail(`${sku}.property_name must not be blank`);
        const converted: RestoreProperty = {
          property_id: integer(property.property_id, `${sku}.property_id`, 1),
          property_name,
          value_ids: numericIds(property.value_ids, `${sku}.value_ids`),
          values: array(property.values, `${sku}.values`).map((v) => string(v, `${sku}.value`)),
        };
        if (converted.values.length === 0) fail(`${sku}.values must not be empty`);
        if (property.scale_id !== undefined) {
          converted.scale_id = property.scale_id === null
            ? null
            : integer(property.scale_id, `${sku}.scale_id`, 1);
        }
        return converted;
      },
    );
    const propertyIds = property_values.map((p) => p.property_id);
    if (new Set(propertyIds).size !== propertyIds.length || propertyIds.length > 3) {
      fail(`${sku} has duplicate or unsupported property axes`);
    }
    const offerings: RestoreOffering[] = [];
    for (const rawOffering of array(product.offerings, `${sku}.offerings`)) {
      const offering = live(rawOffering, `${sku}.offering`);
      if (!offering) continue;
      if (typeof offering.is_enabled !== "boolean") fail(`${sku}.is_enabled must be a boolean`);
      offerings.push({
        price: moneyCents(offering.price, `${sku}.price`) / 100,
        quantity: integer(offering.quantity, `${sku}.quantity`),
        is_enabled: offering.is_enabled,
        readiness_state_id: integer(offering.readiness_state_id, `${sku}.readiness_state_id`, 1),
      });
    }
    if (!offerings.length) fail(`${sku} has no current offering`);
    products.push({ sku, property_values, offerings });
  }
  if (!products.length) fail("inventory has no current products");
  for (const product of products) {
    for (const key of AXES) {
      for (const axis of axisArrays[key]) {
        if (!product.property_values.some((p) => p.property_id === axis)) {
          fail(`${product.sku} is missing property axis ${axis} from ${key}`);
        }
      }
    }
  }
  return { products, ...axisArrays };
}

/** Comparison keeps all writable fields; ignores only response IDs/presentation and order. */
function canonicalUpdate(update: OphirRestoreInventoryUpdate, includePrice: boolean): string {
  const products = update.products.map((p) => ({
    sku: p.sku,
    property_values: p.property_values.map((property) => ({
      property_id: property.property_id,
      property_name: property.property_name,
      scale_id: property.scale_id ?? null,
      // Keep ID/value pairing and ordering; changing a value ID is not a price change.
      value_ids: property.value_ids,
      values: property.values,
    })).sort((a, b) => a.property_id - b.property_id),
    offerings: p.offerings.map((o) => ({
      ...(includePrice ? { price_cents: Math.round(o.price * 100) } : {}),
      quantity: o.quantity,
      is_enabled: o.is_enabled,
      readiness_state_id: o.readiness_state_id,
    })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  })).sort((a, b) => a.sku.localeCompare(b.sku) || JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify({
    products,
    ...Object.fromEntries(AXES.map((key) => [key, [...update[key]].sort((a, b) => a - b)])),
  });
}

export function canonicalOphirInventory(input: unknown): string {
  return canonicalUpdate(convertInventory(input), true);
}

export function canonicalOphirInventoryNonPrice(input: unknown): string {
  return canonicalUpdate(convertInventory(input), false);
}

function checkPriceAxes(update: OphirRestoreInventoryUpdate): void {
  const pricesByAxes = new Map<string, number>();
  for (const product of update.products) {
    const key = JSON.stringify(update.price_on_property.map((id) => {
      const property = product.property_values.find((p) => p.property_id === id)!;
      return [id, property.scale_id ?? null, property.value_ids, property.values];
    }));
    for (const offering of product.offerings) {
      const cents = Math.round(offering.price * 100);
      const previous = pricesByAxes.get(key);
      if (previous !== undefined && previous !== cents) {
        fail(`restored prices conflict with current price_on_property at ${product.sku}`);
      }
      pricesByAxes.set(key, cents);
    }
  }
}

export function buildOphirPriceRestore(
  current: unknown,
  targets: readonly OphirRestoreTarget[],
): {
  update: OphirRestoreInventoryUpdate;
  changed: number;
  alreadyRestored: number;
  currentFingerprint: string;
  expectedFingerprint: string;
  nonPriceFingerprint: string;
  prices: OphirRestorePrice[];
  query: Record<string, string>;
} {
  const update = convertInventory(current);
  const currentFingerprint = canonicalUpdate(update, true);
  const nonPriceFingerprint = canonicalUpdate(update, false);
  const targetsBySku = new Map<string, OphirRestoreTarget>();
  for (const rawTarget of array(targets, "targets")) {
    const target = object(rawTarget, "target");
    const sku = string(target.sku, "target.sku");
    if (!sku.trim() || sku !== sku.trim()) fail("target.sku must be nonblank without outer whitespace");
    if (targetsBySku.has(sku)) fail(`duplicate target SKU ${sku}`);
    targetsBySku.set(sku, {
      sku,
      beforeCents: integer(target.beforeCents, `${sku}.beforeCents`, 1),
      afterCents: integer(target.afterCents, `${sku}.afterCents`, 1),
    });
  }
  const productsBySku = new Map<string, RestoreProduct[]>();
  for (const product of update.products) {
    productsBySku.set(product.sku, [...(productsBySku.get(product.sku) ?? []), product]);
  }
  const prices: OphirRestorePrice[] = [];
  for (const target of targetsBySku.values()) {
    const matches = productsBySku.get(target.sku) ?? [];
    if (matches.length !== 1 || matches[0].offerings.length !== 1) {
      fail(`${target.sku} must identify exactly one current product and offering`);
    }
    const offering = matches[0].offerings[0];
    const currentCents = Math.round(offering.price * 100);
    if (currentCents !== target.afterCents && currentCents !== target.beforeCents) {
      fail(`price conflict for ${target.sku}: current ${currentCents}, expected ${target.afterCents} or ${target.beforeCents}`);
    }
    const status = target.beforeCents === target.afterCents
      ? "unchanged"
      : currentCents === target.beforeCents ? "already-restored" : "restore";
    prices.push({ sku: target.sku, currentCents, targetCents: target.beforeCents, status });
    offering.price = target.beforeCents / 100;
  }
  checkPriceAxes(update);
  if (canonicalUpdate(update, false) !== nonPriceFingerprint) fail("non-price fields changed");
  const query: Record<string, string> = { legacy: "false" };
  if (update.products.some((p) => p.property_values.length === 3)) {
    query.max_variations_supported = "3";
  }
  return {
    update,
    changed: prices.filter((p) => p.status === "restore").length,
    alreadyRestored: prices.filter((p) => p.status === "already-restored").length,
    currentFingerprint,
    expectedFingerprint: canonicalUpdate(update, true),
    nonPriceFingerprint,
    prices,
    query,
  };
}
