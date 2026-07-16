import {
  variantPropertyParts,
  type RawVariantProperties,
} from "@/lib/variant-properties";

/** Açıklamaya gömülen gram bloğunun işaretçileri (idempotent güncelleme için). */
export const WEIGHT_BLOCK_START = "<!-- JG-WEIGHTS -->";
export const WEIGHT_BLOCK_END = "<!-- /JG-WEIGHTS -->";

export interface VariantWeight {
  sku: string;
  weightGrams: number;
  /** Varyant property'leri — Etsy dizisi VEYA EON düz nesnesi (varsa beden/renk). */
  properties?: RawVariantProperties;
}

/**
 * Bir varyantın okunur beden/etiketini üretir: önce Etsy property_values
 * (ör. "7 inches"), yoksa SKU sonundaki bedeni (…-7, …-7.5, ….7.5) ayıklar.
 */
export function variantSizeLabel(v: VariantWeight): string {
  // properties Etsy dizisi VEYA EON düz nesnesi olabilir — ikisini de indirge.
  const fromProps = variantPropertyParts(v.properties).join(" · ");
  if (fromProps) return fromProps;
  // SKU sonundaki beden: yalnız "-" ayıracından sonra (ör. BMC1-7, BMC1-7.5).
  // Nokta ondalıktır; çok-noktalı/tiresiz SKU'da yanlış beden yerine SKU dön.
  const m = v.sku.match(/-([0-9]+(?:\.[0-9]+)?)$/);
  return m ? `${m[1]}"` : v.sku;
}

/**
 * Beden→gram tablosunu (düz metin) üretir. Etsy açıklaması düz metindir;
 * hizalı, alıcı-dostu ve SEO için ayarı da içeren bir blok döndürür.
 * Varyantlar bedene göre (sayısal) sıralanır.
 */
export function buildWeightBlock(
  variants: VariantWeight[],
  opts: { karatHint?: string } = {},
): string {
  const rows = variants
    .filter((v) => v.weightGrams > 0)
    .map((v) => ({ label: variantSizeLabel(v), grams: v.weightGrams, sku: v.sku }))
    .sort(
      (a, b) =>
        (parseFloat(a.label) || 0) - (parseFloat(b.label) || 0) ||
        a.label.localeCompare(b.label),
    );
  if (rows.length === 0) return "";

  const lines = rows.map((r) => `• ${r.label} — ${formatGrams(r.grams)} g`);
  const header = opts.karatHint
    ? `Weight by size (${opts.karatHint} solid gold):`
    : "Weight by size (solid gold):";

  return [
    WEIGHT_BLOCK_START,
    "",
    header,
    ...lines,
    "",
    "Weights are approximate and may vary slightly per piece.",
    WEIGHT_BLOCK_END,
  ].join("\n");
}

function formatGrams(g: number): string {
  // 5.70 → 5.7, 7 → 7 ; en fazla 2 ondalık
  return String(Math.round(g * 100) / 100);
}

/**
 * Gram bloğunu açıklamaya yerleştirir. Blok zaten varsa (işaretçiler arası)
 * DEĞİŞTİRİR; yoksa sona ekler. Böylece tekrar çalıştırınca çoğaltmaz.
 * `block` boşsa mevcut blok kaldırılır (temizlik).
 */
export function injectWeightBlock(description: string, block: string): string {
  const desc = description ?? "";
  const startIdx = desc.indexOf(WEIGHT_BLOCK_START);
  const endIdx = desc.indexOf(WEIGHT_BLOCK_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = desc.slice(0, startIdx).replace(/\s+$/, "");
    const after = desc.slice(endIdx + WEIGHT_BLOCK_END.length).replace(/^\s+/, "");
    if (!block) {
      return [before, after].filter(Boolean).join("\n\n");
    }
    return [before, block, after].filter(Boolean).join("\n\n");
  }

  if (!block) return desc;
  return [desc.replace(/\s+$/, ""), block].filter(Boolean).join("\n\n");
}
