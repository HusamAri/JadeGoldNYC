export const BEVELED_MILGRAIN_WIDTHS = [
  4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;

export const BEVELED_MILGRAIN_RING_SIZES = Array.from(
  { length: 25 },
  (_, index) => 4 + index * 0.5,
);

export const BEVELED_MILGRAIN_FAMILY = [
  {
    listingId: 4560212214,
    sourceListingId: 4539493533,
    code: "MG10R",
    karat: "10K",
    color: "Rose",
  },
  {
    listingId: 4560186191,
    sourceListingId: 4539506699,
    code: "MG10W",
    karat: "10K",
    color: "White",
  },
  {
    listingId: 4560186803,
    sourceListingId: 4539517211,
    code: "MG10Y",
    karat: "10K",
    color: "Yellow",
  },
  {
    listingId: 4560188131,
    sourceListingId: 4540045731,
    code: "MG14R",
    karat: "14K",
    color: "Rose",
  },
  {
    listingId: 4560210242,
    sourceListingId: 4542485142,
    code: "MG14W",
    karat: "14K",
    color: "White",
  },
  {
    listingId: 4560211476,
    sourceListingId: 4543953211,
    code: "MG14Y",
    karat: "14K",
    color: "Yellow",
  },
  {
    listingId: 4560210870,
    sourceListingId: 4548734437,
    code: "MG18R",
    karat: "18K",
    color: "Rose",
  },
  {
    listingId: 4560185581,
    sourceListingId: 4546520793,
    code: "MG18W",
    karat: "18K",
    color: "White",
  },
  {
    listingId: 4560211748,
    sourceListingId: 4548748952,
    code: "MG18Y",
    karat: "18K",
    color: "Yellow",
  },
] as const;

type BeveledMilgrainColor = "Rose" | "White" | "Yellow";

export interface BeveledMilgrainVariantRow {
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
  properties: BeveledMilgrainVariantRow["properties"],
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

export function buildBeveledMilgrainContent({
  karat,
  color,
}: {
  karat: string;
  color: BeveledMilgrainColor;
}): {
  en: { title: string; description: string };
  es: { title: string; description: string };
} {
  const spanishColors = {
    Rose: { title: "Rosa", sentence: "rosa" },
    White: { title: "Blanco", sentence: "blanco" },
    Yellow: { title: "Amarillo", sentence: "amarillo" },
  } as const;
  const spanishColor = spanishColors[color];
  const lowerKarat = karat.toLowerCase();

  return {
    en: {
      title:
        `${karat} Solid ${color} Gold Beveled Milgrain Wedding Band, ` +
        "Satin Center Ring, 4mm to 12mm",
      description: [
        `A solid ${lowerKarat} ${color.toLowerCase()} gold wedding band with a broad satin center, two fine milgrain borders and crisp mirror-polished beveled edges. Made to order in your size and width, never plated and never filled.`,
        "",
        "THE DETAILS",
        `Metal: Solid ${lowerKarat} ${color.toLowerCase()} gold. Never plated, never filled.`,
        "Center: Broad satin finish with a quiet linear grain.",
        "Borders: One continuous fine milgrain line on each side of the center.",
        "Edges: Symmetrical mirror-polished planar bevels.",
        "Fit: Polished comfort-fit interior with smooth edges.",
        "Widths: 4mm through 12mm, in whole millimeters.",
        "Thickness: 1.5mm production specification.",
        "Sizes: US 4 through 16, whole and half sizes.",
        `Hallmark: Stamped ${lowerKarat} inside the band.`,
        "",
        "The satin center holds the light softly. The milgrain lines define its boundaries and the polished bevels return a sharper reflection at each edge.",
        "",
        "SIZE AND WIDTH",
        "Choose Ring Size from US 4 through 16, including half sizes. Choose Width from 4mm through 12mm. A 4mm to 5mm band reads restrained. A 6mm to 8mm band has a balanced presence. A 9mm to 12mm band sits broad across the finger. Wider bands can feel tighter than narrow bands, so message us before ordering if you are between sizes.",
        "",
        "INSIDE ENGRAVING",
        "Inside Engraving Text: Enter the exact text, up to 30 characters including spaces. Leave blank for no engraving.",
        "Engraving Font: Choose 1 | Prata, 2 | Cinzel, 3 | Cinzel Decorative or 4 | Great Vibes.",
        "",
        "MADE TO ORDER",
        "Each band is cut and finished for the width and size you select. The satin center, twin milgrain lines and polished bevels are finished as one coherent profile. Standard processing is 5 to 7 business days before dispatch. Shipping and return terms follow the shop policies shown at checkout.",
        "",
        "CARE",
        "Clean with warm water, mild soap and a soft cloth. Avoid chlorine and abrasive compounds. Store the ring separately when it is not being worn.",
        "",
        "WHY EON",
        "Kymation is built around the line where one surface becomes another. A soft center meets a precise edge, keeping detail close without turning ornamental.",
        "",
        `Karat: ${karat}`,
        `Metal: ${color} Gold`,
      ].join("\n"),
    },
    es: {
      title:
        `Alianza de Oro ${spanishColor.title} Macizo de ${karat} con ` +
        "Milgrain y Bordes Biselados, 4mm a 12mm",
      description: [
        `Una alianza de oro ${spanishColor.sentence} macizo de ${karat} con un centro satinado amplio, dos bordes milgrain finos y bordes biselados pulidos a espejo. Se fabrica por encargo en la talla y el ancho que elijas, nunca chapada ni rellena.`,
        "",
        "DETALLES",
        `Metal: Oro ${spanishColor.sentence} macizo de ${karat}. Nunca chapado ni relleno.`,
        "Centro: Acabado satinado amplio con un grano lineal discreto.",
        "Contornos: Una línea milgrain fina y continua a cada lado del centro.",
        "Bordes: Biseles planos, simétricos y pulidos a espejo.",
        "Ajuste: Interior pulido de ajuste cómodo con bordes suaves.",
        "Anchos: 4mm a 12mm, en milímetros enteros.",
        "Grosor: 1.5mm según la especificación de producción.",
        "Tallas: US 4 a US 16, incluidas las medias tallas.",
        `Sello: Marcado ${lowerKarat} en el interior de la alianza.`,
        "",
        "El centro satinado suaviza la luz. Las líneas milgrain definen sus límites y los biseles pulidos devuelven un reflejo más nítido en cada borde.",
        "",
        "TALLA Y ANCHO",
        "Elige la talla US 4 a US 16, incluidas las medias tallas, y el ancho de 4mm a 12mm. Los anchos de 4mm a 5mm se ven discretos. Los de 6mm a 8mm ofrecen una presencia equilibrada. Los de 9mm a 12mm se ven amplios sobre el dedo. Las alianzas anchas pueden sentirse más ajustadas, por lo que recomendamos escribirnos antes de comprar si dudas entre dos tallas.",
        "",
        "GRABADO INTERIOR",
        "Texto de Grabado Interior: Introduce el texto exacto, hasta 30 caracteres incluidos los espacios. Déjalo en blanco si no deseas grabado.",
        "Fuente de Grabado: Elige 1 | Prata, 2 | Cinzel, 3 | Cinzel Decorative o 4 | Great Vibes.",
        "",
        "FABRICADA POR ENCARGO",
        "Cada alianza se corta y se termina según el ancho y la talla que elijas. El centro satinado, las dos líneas milgrain y los biseles pulidos se trabajan como un perfil coherente. El plazo habitual de preparación es de 5 a 7 días laborables antes del envío. Las condiciones de envío y devolución son las indicadas en las políticas de la tienda durante el pago.",
        "",
        "CUIDADO",
        "Limpia la alianza con agua tibia, jabón suave y un paño delicado. Evita el cloro y los productos abrasivos. Guárdala por separado cuando no la uses.",
        "",
        "POR QUÉ EON",
        "Kymation nace de la línea donde una superficie se convierte en otra. Un centro suave se une a un borde preciso, manteniendo el detalle cercano sin resultar ornamental.",
        "",
        `Quilataje: ${karat}`,
        `Metal: Oro ${spanishColor.sentence}`,
      ].join("\n"),
    },
  };
}

export function selectCanonicalBeveledMilgrainVariants<
  T extends BeveledMilgrainVariantRow,
>(rows: T[], code: string): T[] {
  const bySku = new Map<string, T>();
  for (const row of rows) {
    if (!row.sku?.startsWith(`${code}-W`)) continue;
    if (bySku.has(row.sku)) {
      throw new Error(`Duplicate prepared SKU: ${row.sku}`);
    }
    bySku.set(row.sku, row);
  }

  const canonical: T[] = [];
  for (const width of BEVELED_MILGRAIN_WIDTHS) {
    for (const size of BEVELED_MILGRAIN_RING_SIZES) {
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
      if (!Number.isFinite(row.weight_grams) || Number(row.weight_grams) <= 0) {
        throw new Error(`Prepared variant has an invalid weight: ${sku}`);
      }
      canonical.push(row);
    }
  }

  const expected =
    BEVELED_MILGRAIN_WIDTHS.length * BEVELED_MILGRAIN_RING_SIZES.length;
  if (canonical.length === expected) return canonical;
  throw new Error(
    `Expected ${expected} prepared variants for ${code}, found ${canonical.length}.`,
  );
}

export function buildBeveledMilgrainRepairVariants({
  targetRows,
  sourceRows,
  code,
  orgId,
  productId,
}: {
  targetRows: BeveledMilgrainVariantRow[];
  sourceRows: BeveledMilgrainVariantRow[];
  code: string;
  orgId: string;
  productId: string;
}) {
  const targetMap = new Map<string, BeveledMilgrainVariantRow>();
  for (const row of targetRows.filter((candidate) => candidate.active !== false)) {
    const properties = propertyMap(row.properties);
    const width = numericValue(properties.Width ?? properties["Band Width"]);
    const size = numericValue(properties["Ring Size"]);
    if (width == null || size == null) continue;
    targetMap.set(combinationKey(width, size), row);
  }

  const sourceMap = new Map<string, BeveledMilgrainVariantRow>();
  for (const row of sourceRows.filter((candidate) => candidate.active !== false)) {
    const properties = propertyMap(row.properties);
    const width = numericValue(properties.Width ?? properties["Band Width"]);
    const size = numericValue(properties["Ring Size"]);
    if (width == null || size == null) continue;
    sourceMap.set(combinationKey(width, size), row);
  }

  return BEVELED_MILGRAIN_RING_SIZES.flatMap((size) => {
    const targetBase = targetMap.get(combinationKey(5, size));
    if (!targetBase || !Number.isFinite(targetBase.price_cents)) {
      throw new Error(`The target is missing its 5mm base for size ${size}.`);
    }
    const sourceBase = sourceMap.get(combinationKey(5, size));
    if (!sourceBase || !Number.isFinite(sourceBase.price_cents)) {
      throw new Error(`The pricing source is missing its 5mm base for size ${size}.`);
    }

    return BEVELED_MILGRAIN_WIDTHS.map((width) => {
      const source = sourceMap.get(combinationKey(width, size));
      if (!source || !Number.isFinite(source.price_cents)) {
        throw new Error(`The pricing source is missing ${width}mm for size ${size}.`);
      }
      const priceDelta = Number(source.price_cents) - Number(sourceBase.price_cents);
      const targetWeight = Number(targetBase.weight_grams);
      const sourceWeight = Number(source.weight_grams);
      const sourceBaseWeight = Number(sourceBase.weight_grams);
      if (
        !Number.isFinite(targetWeight) ||
        targetWeight <= 0 ||
        !Number.isFinite(sourceWeight) ||
        sourceWeight <= 0 ||
        !Number.isFinite(sourceBaseWeight) ||
        sourceBaseWeight <= 0
      ) {
        throw new Error(`A valid weight is missing for ${width}mm, size ${size}.`);
      }
      const priceCents = Number(targetBase.price_cents) + priceDelta;
      if (!Number.isFinite(priceCents) || priceCents <= 0) {
        throw new Error(`The calculated price is invalid for ${width}mm, size ${size}.`);
      }

      return {
        org_id: orgId,
        product_id: productId,
        sku: `${code}-W${width}-S${sizeCode(size)}`,
        name: `${width}mm, US ${size}`,
        properties: { Width: `${width}mm`, "Ring Size": String(size) },
        price_cents: priceCents,
        currency: "USD",
        quantity: Math.max(1, Number(targetBase.quantity ?? 1)),
        weight_grams: Math.max(
          0.01,
          targetWeight + sourceWeight - sourceBaseWeight,
        ),
        weight_source: "estimated",
        active: true,
      };
    });
  });
}
