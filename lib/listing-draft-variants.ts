/** Panel-draft input only; this does not define Etsy inventory capabilities. */
export const MAX_DRAFT_VARIANTS = 400;

export interface DraftVariantInput {
  sku: string;
  /** Blank means unknown, not a zero-cost or zero-weight product. */
  weight: string;
  price: string;
  axisValue?: string;
  axisValue2?: string;
  axisValue3?: string;
}

type ParseResult = { rows: DraftVariantInput[]; error?: never } | { error: string; rows?: never };

/** Legacy five columns, or six columns with the third axis before weight/price. */
export function parseBulkDraftVariants(text: string): ParseResult {
  // Do not trim whole lines: the final TAB fields may be unknown weight/price.
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const cells = lines.map((line) =>
    line.split(line.includes("\t") ? "\t" : ",").map((value) => value.trim()),
  );
  if (cells[0]?.[0].toLowerCase() === "sku") cells.shift();
  const columns = cells[0]?.length;
  if (
    cells.length === 0 ||
    (columns !== 5 && columns !== 6) ||
    cells.some((row) => row.length !== columns || !row[0])
  ) {
    return { error: "Her satır aynı düzende 5 veya 6 sütun içermeli: SKU, 2 veya 3 eksen değeri, gram, fiyat. Boş gram/fiyat hücrelerini koruyun." };
  }
  if (cells.length > MAX_DRAFT_VARIANTS) {
    return { error: `Bir panel taslağı en fazla ${MAX_DRAFT_VARIANTS} varyant içerebilir.` };
  }
  return {
    rows: cells.map(([sku, axisValue, axisValue2, fourth, fifth, sixth]) => ({
      sku,
      axisValue,
      axisValue2,
      axisValue3: columns === 6 ? fourth : "",
      weight: columns === 6 ? fifth : fourth,
      price: columns === 6 ? sixth : fifth,
    })),
  };
}

type PreparedVariants =
  | { rows: DraftVariantInput[]; axisNames: string[]; propertiesBySku: Map<string, Record<string, string>>; error?: never }
  | { error: string; rows?: never; axisNames?: never; propertiesBySku?: never };

const axisValueKeys = ["axisValue", "axisValue2", "axisValue3"] as const;
const cleanName = (value: string) => value.trim().replace(/\s+/g, " ");

/** Shared, side-effect-free server validation; one/two-axis drafts stay supported. */
export function prepareDraftVariants(
  variants: DraftVariantInput[],
  names: readonly [string | undefined, string | undefined, string | undefined],
): PreparedVariants {
  const rows = variants.map((row) => ({ ...row, sku: row.sku.trim() })).filter((row) => row.sku);
  if (rows.length === 0) return { error: "En az bir varyantın SKU'su gerekli." };
  if (rows.length > MAX_DRAFT_VARIANTS) {
    return { error: `Bir panel taslağı en fazla ${MAX_DRAFT_VARIANTS} varyant içerebilir.` };
  }
  if (new Set(rows.map((row) => row.sku)).size !== rows.length) {
    return { error: "Varyant SKU'ları benzersiz olmalı." };
  }

  const axisNames = names.map((name) => cleanName(name ?? ""));
  if ((axisNames[1] && !axisNames[0]) || (axisNames[2] && (!axisNames[0] || !axisNames[1]))) {
    return { error: "Varyasyon eksenleri sırayla doldurulmalı; üçüncü eksen için ilk iki eksen gerekli." };
  }
  const activeNames = axisNames.filter(Boolean);
  const normalized = activeNames.map((name) => name.normalize("NFKC").toLowerCase());
  if (new Set(normalized).size !== activeNames.length) {
    return { error: "Varyasyon eksenlerinin adları birbirinden farklı olmalı." };
  }
  if (!axisNames[2] && rows.some((row) => (row.axisValue3 ?? "").trim())) {
    return { error: "Üçüncü eksen değerleri var; üçüncü varyasyon ekseninin adını girin." };
  }

  const propertiesBySku = new Map<string, Record<string, string>>();
  const combinations = new Set<string>();
  const valuesByAxis = activeNames.map(() => new Set<string>());
  for (const row of rows) {
    const values: string[] = [];
    for (let index = 0; index < activeNames.length; index += 1) {
      const value = (row[axisValueKeys[index]] ?? "").trim();
      if (!value) return { error: `"${activeNames[index]}" ekseni için ${row.sku} satırında değer yok.` };
      values.push(value);
      valuesByAxis[index].add(value);
    }
    if (activeNames.length > 0) {
      const combination = JSON.stringify(values);
      if (combinations.has(combination)) {
        return { error: "Aynı varyasyon kombinasyonu birden fazla SKU'da kullanılamaz." };
      }
      combinations.add(combination);
      propertiesBySku.set(row.sku, Object.fromEntries(activeNames.map((name, index) => [name, values[index]])));
    }
  }
  for (let index = 0; index < activeNames.length; index += 1) {
    if (rows.length > 1 && valuesByAxis[index].size < 2) {
      return { error: `"${activeNames[index]}" değerleri değişmiyor — gerçek bir varyasyon ekseni olmalı.` };
    }
  }
  return { rows, axisNames: activeNames, propertiesBySku };
}
