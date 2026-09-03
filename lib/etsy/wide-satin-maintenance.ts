export const WIDE_SATIN_WIDTHS = [4, 5, 6, 7, 8] as const;
export const WIDE_SATIN_RING_SIZES = Array.from(
  { length: 25 },
  (_, index) => 4 + index * 0.5,
);

export interface WideSatinVariantRow {
  id?: string;
  sku?: string | null;
  properties?:
    | Record<string, unknown>
    | Array<{ property_name?: string; values?: unknown[] }>
    | null;
  price_cents?: number | null;
  quantity?: number | null;
  weight_grams?: number | null;
  active?: boolean | null;
  [key: string]: unknown;
}

function propertyMap(
  properties: WideSatinVariantRow["properties"],
): Record<string, unknown> {
  if (!Array.isArray(properties)) return properties ?? {};
  return Object.fromEntries(
    properties.map((property) => [
      property.property_name ?? "",
      property.values?.join(", ") ?? "",
    ]),
  );
}

function numericValue(value: unknown): number | null {
  const match = String(value ?? "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function sizeCode(size: number): string {
  return String(Math.round(size * 2)).padStart(2, "0");
}

function combinationKey(width: number, size: number): string {
  return `${width}|${size}`;
}

function nearest(values: number[], target: number): number {
  return values.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best,
  );
}

export function buildWideSatinTitle(title: string): string {
  const normalized = title
    .replace(/:/g, ",")
    .replace(/,?\s*4\s*mm\s*(?:through|to|\u2013|-)\s*(?:8|12)\s*mm\s*$/iu, "")
    .replace(/\s+,/g, ",")
    .replace(/,{2,}/g, ",")
    .trim();
  return `${normalized}, 4mm to 8mm`;
}

export function buildWideSatinDescription(description: string): string {
  const withoutPriorOptions = description
    .replace(/\n{2,}WIDTH AND RING SIZE OPTIONS[\s\S]*$/u, "")
    .replace(
      /4\s*mm\s*(?:through|to|\u2013|-)\s*12\s*mm/giu,
      "4mm through 8mm",
    )
    .trim();
  const options = [
    "WIDTH AND RING SIZE OPTIONS",
    "Widths: 4mm, 5mm, 6mm, 7mm and 8mm.",
    "Ring sizes: US 4 through US 16, including half sizes.",
    "Select both Width and Ring Size before adding the ring to your cart.",
  ].join("\n");
  return `${withoutPriorOptions}\n\n${options}`;
}

export function buildWideSatinSpanishContent({
  karat,
  color,
}: {
  karat: string;
  color: "Rose" | "White" | "Yellow";
}): { title: string; description: string } {
  const colors = {
    Rose: { title: "Rosa", sentence: "rosa" },
    White: { title: "Blanco", sentence: "blanco" },
    Yellow: { title: "Amarillo", sentence: "amarillo" },
  } as const;
  const localizedColor = colors[color];
  return {
    title:
      `Alianza de Oro ${localizedColor.title} Macizo de ${karat}, ` +
      "Centro Satinado, Bordes Pulidos, 4mm a 8mm",
    description: [
      "ALIANZA WIDE SATIN DE ORO MACIZO",
      "",
      "Una alianza moderna de perfil limpio, hecha a mano en oro macizo. " +
        "El centro satinado crea un contraste discreto con los bordes pulidos, " +
        "mientras que el interior de ajuste cómodo facilita el uso diario.",
      "",
      "DETALLES",
      `Oro ${localizedColor.sentence} macizo de ${karat}.`,
      "Centro ancho con acabado satinado.",
      "Bordes pulidos.",
      "Interior de ajuste cómodo.",
      "Grosor aproximado: 1.5mm.",
      "",
      "OPCIONES DE ANCHO Y TALLA",
      "Anchos: 4mm, 5mm, 6mm, 7mm y 8mm.",
      "Tallas: US 4 a US 16, incluidas las medias tallas.",
      "Selecciona el ancho y la talla antes de añadir el anillo al carrito.",
      "",
      "Cada alianza se fabrica individualmente. Las pequeñas variaciones del " +
        "acabado son parte natural del trabajo artesanal.",
    ].join("\n"),
  };
}

export function selectCanonicalWideSatinVariants<T extends WideSatinVariantRow>(
  rows: T[],
  code: string,
): T[] {
  const bySku = new Map<string, T>();
  for (const row of rows) {
    if (!row.sku?.startsWith(`${code}-W`)) continue;
    if (bySku.has(row.sku)) {
      throw new Error(`Duplicate prepared SKU: ${row.sku}`);
    }
    bySku.set(row.sku, row);
  }

  const canonical: T[] = [];
  for (const width of WIDE_SATIN_WIDTHS) {
    for (const size of WIDE_SATIN_RING_SIZES) {
      const sku = `${code}-W${width}-S${sizeCode(size)}`;
      const row = bySku.get(sku);
      if (!row) continue;
      const properties = propertyMap(row.properties);
      const rowWidth = numericValue(properties.Width ?? properties["Band Width"]);
      const rowSize = numericValue(properties["Ring Size"]);
      if (rowWidth !== width || rowSize !== size) {
        throw new Error(`Prepared variant properties do not match SKU: ${sku}`);
      }
      if (!Number.isFinite(row.price_cents) || Number(row.price_cents) <= 0) {
        throw new Error(`Prepared variant has an invalid price: ${sku}`);
      }
      if (!Number.isFinite(row.quantity) || Number(row.quantity) < 1) {
        throw new Error(`Prepared variant has an invalid quantity: ${sku}`);
      }
      canonical.push(row);
    }
  }

  const expected = WIDE_SATIN_WIDTHS.length * WIDE_SATIN_RING_SIZES.length;
  if (canonical.length === expected) return canonical;
  if (bySku.size > 0) {
    throw new Error(
      `Expected ${expected} prepared variants for ${code}, found ${canonical.length}.`,
    );
  }

  const legacyByCombination = new Map<string, T>();
  for (const row of rows) {
    if (row.active === false) continue;
    const properties = propertyMap(row.properties);
    const width = numericValue(properties.Width ?? properties["Band Width"]);
    const size = numericValue(properties["Ring Size"]);
    if (
      width == null ||
      size == null ||
      !WIDE_SATIN_WIDTHS.includes(width as (typeof WIDE_SATIN_WIDTHS)[number]) ||
      !WIDE_SATIN_RING_SIZES.includes(size)
    ) {
      continue;
    }
    const combination = `${width}|${size}`;
    if (legacyByCombination.has(combination)) {
      throw new Error(`Duplicate legacy combination: ${combination}`);
    }
    if (!Number.isFinite(row.price_cents) || Number(row.price_cents) <= 0) {
      throw new Error(`Legacy variant has an invalid price: ${row.sku ?? row.id}`);
    }
    if (!Number.isFinite(row.quantity) || Number(row.quantity) < 1) {
      throw new Error(`Legacy variant has an invalid quantity: ${row.sku ?? row.id}`);
    }
    legacyByCombination.set(combination, row);
  }

  const legacyCanonical = WIDE_SATIN_WIDTHS.flatMap((width) =>
    WIDE_SATIN_RING_SIZES.map((size) => legacyByCombination.get(`${width}|${size}`)),
  ).filter((row): row is T => Boolean(row));
  if (legacyCanonical.length !== expected) {
    throw new Error(
      `Expected ${expected} prepared or legacy variants for ${code}, found ${legacyCanonical.length}.`,
    );
  }
  return legacyCanonical;
}

export function buildWideSatinRepairVariants({
  targetRows,
  sourceRows,
  code,
  orgId,
  productId,
}: {
  targetRows: WideSatinVariantRow[];
  sourceRows: WideSatinVariantRow[];
  code: string;
  orgId: string;
  productId: string;
}) {
  const targetMap = new Map<string, WideSatinVariantRow>();
  for (const row of targetRows.filter((candidate) => candidate.active !== false)) {
    const properties = propertyMap(row.properties);
    const width = numericValue(properties.Width ?? properties["Band Width"]);
    const size = numericValue(properties["Ring Size"]);
    if (width == null || size == null) continue;
    targetMap.set(combinationKey(width, size), row);
  }

  const sourceMap = new Map<string, WideSatinVariantRow>();
  const sourceSizes = new Set<number>();
  for (const row of sourceRows.filter((candidate) => candidate.active !== false)) {
    const properties = propertyMap(row.properties);
    const width = numericValue(properties.Width ?? properties["Band Width"]);
    const size = numericValue(properties["Ring Size"]);
    if (width == null || size == null) continue;
    sourceMap.set(combinationKey(width, size), row);
    sourceSizes.add(size);
  }
  const sortedSourceSizes = [...sourceSizes].sort((left, right) => left - right);
  if (sortedSourceSizes.length === 0) {
    throw new Error("The pricing source has no ring sizes.");
  }

  return WIDE_SATIN_RING_SIZES.flatMap((size) => {
    const targetBase = targetMap.get(combinationKey(4, size));
    if (!targetBase || !Number.isFinite(targetBase.price_cents)) {
      throw new Error(`The target is missing its 4mm base for size ${size}.`);
    }
    const sourceSize = sortedSourceSizes.includes(size)
      ? size
      : nearest(sortedSourceSizes, size);
    const sourceBase = sourceMap.get(combinationKey(4, sourceSize));
    if (!sourceBase || !Number.isFinite(sourceBase.price_cents)) {
      throw new Error(`The pricing source is missing its 4mm base for size ${sourceSize}.`);
    }
    return WIDE_SATIN_WIDTHS.map((width) => {
      const source = sourceMap.get(combinationKey(width, sourceSize));
      if (!source || !Number.isFinite(source.price_cents)) {
        throw new Error(
          `The pricing source is missing ${width}mm for size ${sourceSize}.`,
        );
      }
      const priceDelta = Number(source.price_cents) - Number(sourceBase.price_cents);
      const targetWeight = Number(targetBase.weight_grams);
      const sourceWeight = Number(source.weight_grams);
      const sourceBaseWeight = Number(sourceBase.weight_grams);
      const hasWeightDelta =
        Number.isFinite(targetWeight) &&
        Number.isFinite(sourceWeight) &&
        Number.isFinite(sourceBaseWeight);
      return {
        org_id: orgId,
        product_id: productId,
        sku: `${code}-W${width}-S${sizeCode(size)}`,
        name: `${width}mm, US ${size}`,
        properties: { Width: `${width}mm`, "Ring Size": String(size) },
        price_cents: Number(targetBase.price_cents) + priceDelta,
        currency: "USD",
        quantity: Math.max(1, Number(targetBase.quantity ?? 1)),
        weight_grams: hasWeightDelta
          ? Math.max(0, targetWeight + sourceWeight - sourceBaseWeight)
          : targetBase.weight_grams ?? null,
        weight_source: "estimated",
        active: true,
      };
    });
  });
}
