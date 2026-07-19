import {
  variantPropertyParts,
  type RawVariantProperties,
} from "@/lib/variant-properties";

/**
 * ESKİ işaretçiler — Etsy açıklaması DÜZ METİNDİR ve bu HTML yorumlarını
 * round-trip'te SİLER; bu yüzden idempotentlik artık marker'a değil blok
 * METİN İMZASINA dayanır (başlık `WEIGHT_HEADER_RE` … footer `WEIGHT_FOOTER`).
 * Sabitler yalnız DB'de kalmış eski marker'lı blokları söküp temizlemek için
 * korunuyor; `buildWeightBlock` ARTIK bu marker'ları ÜRETMEZ.
 */
export const WEIGHT_BLOCK_START = "<!-- JG-WEIGHTS -->";
export const WEIGHT_BLOCK_END = "<!-- /JG-WEIGHTS -->";

/** Blok kapanış cümlesi — hem üretimde hem sökme imzasında kullanılır. */
export const WEIGHT_FOOTER =
  "Weights are approximate and may vary slightly per piece.";

/** Blok başlık imzası: "Weight by size (…solid gold):" (karatlı/karatsız). */
const WEIGHT_HEADER_RE = /Weight by size \([^)]*\):/;

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

  // HTML-yorum marker'ı YOK (Etsy siliyor) — blok kendi metin imzasıyla tanınır.
  return [header, ...lines, "", WEIGHT_FOOTER].join("\n");
}

function formatGrams(g: number): string {
  // 5.70 → 5.7, 7 → 7 ; en fazla 2 ondalık
  return String(Math.round(g * 100) / 100);
}

/**
 * Açıklamadaki TÜM ağırlık bloklarını söker — hem eski HTML-yorum marker'lı
 * bloklar (panel DB'de kalmış olabilir) hem Etsy'nin marker'ı sildiği
 * marker'sız metin-imzalı kopyalar (round-trip sonrası çoğalanlar). Idempotentlik
 * marker'a DEĞİL blok metin imzasına (başlık … footer) dayanır — yoksa her push
 * yeni blok ekleyip biriktirir (gerçek vaka: 158 listing'de 3-4 kopya).
 */
export function stripWeightBlocks(description: string): string {
  const footer = WEIGHT_FOOTER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const header = WEIGHT_HEADER_RE.source;
  return (description ?? "")
    // 1) Eski marker'lı bloklar (uçtan uca, marker dahil)
    .replace(
      new RegExp(`\\n*${WEIGHT_BLOCK_START}[\\s\\S]*?${WEIGHT_BLOCK_END}\\n*`, "g"),
      "\n",
    )
    // 2) Marker'sız metin-imzalı bloklar (başlıktan footer'a; çoklu)
    .replace(new RegExp(`\\n*${header}[\\s\\S]*?${footer}\\n*`, "g"), "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/, "");
}

/**
 * Gram bloğunu açıklamaya IDEMPOTENT yerleştirir: önce MEVCUT tüm bloklar
 * (marker'lı + marker'sız kopyalar) sökülür, sonra tek taze blok eklenir.
 * Böylece tekrar tekrar çalıştırılsa da çoğalmaz. `block` boşsa yalnız
 * temizlik yapılır (blok kaldırılır).
 */
export function injectWeightBlock(description: string, block: string): string {
  const base = stripWeightBlocks(description ?? "");
  if (!block) return base;
  return [base, block].filter(Boolean).join("\n\n");
}
