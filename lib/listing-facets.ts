/**
 * Listing facet türetimi — başlık + SKU'dan ayar (karat), metal rengi ve ürün
 * grubu çıkarır. Etsy shop-section verisi senkronda YOK; pratik karşılığı bu
 * türetilmiş yüzlerdir (filtreler bunları kullanır). Saf/istemci-güvenli.
 *
 * Grup önceliği (ilk eşleşen kazanır) gerçek katalogla kalibre edildi:
 *   küpe → bileklik → yüzük/alyans → kolye(zincir) → kolye ucu → diğer
 * "Pendant Necklace" (zincirli) kolyeye, yalnız "Pendant" kolye ucuna düşer —
 * envanter gerçeğiyle uyumlu (uçlu-zincir ayrı ürün, çıplak uç ayrı ürün).
 */

export type FacetKarat = "10K" | "14K" | "18K";
export type FacetColor = "yellow" | "white" | "rose" | "two_tone";
export type FacetGroup =
  | "ring"
  | "bracelet"
  | "necklace"
  | "pendant"
  | "earrings"
  | "other";

export function deriveKarat(
  title: string,
  sku?: string | null,
): FacetKarat | null {
  const m = /\b(10|14|18)\s*[kK]\b/.exec(title);
  if (m) return `${m[1]}K` as FacetKarat;
  // EON SKU aile deseni: <RENK>-R-<KARAT><TİP> (ör. GLD-R-1402 → 14K).
  const s = /-[A-Z]-(10|14|18)\d{2}\b/.exec(sku ?? "");
  if (s) return `${s[1]}K` as FacetKarat;
  return null;
}

export function deriveColor(
  title: string,
  sku?: string | null,
): FacetColor | null {
  const t = title.toLowerCase();
  const s = (sku ?? "").toUpperCase();
  if (/two.?tone/.test(t)) return "two_tone";
  if (/rose\s*gold/.test(t) || s.startsWith("RSG-")) return "rose";
  if (/white\s*gold/.test(t) || s.startsWith("WHG-")) return "white";
  if (/\bgold\b/.test(t) || s.startsWith("GLD-")) return "yellow";
  return null;
}

export function deriveGroup(title: string): FacetGroup {
  const t = title.toLowerCase();
  if (/earring|\bhoops?\b|\bstuds?\b/.test(t)) return "earrings";
  if (/bracelet|anklet/.test(t)) return "bracelet";
  if (/\brings?\b|\bband\b/.test(t)) return "ring";
  if (/necklace|\bchain\b/.test(t)) return "necklace";
  if (/pendant|\bcharm\b|medallion|crucifix|\bcross\b/.test(t)) return "pendant";
  return "other";
}

/** Filtre seçenekleri (URL param değerleri + Türkçe etiketler). */
export const KARAT_OPTIONS: { value: FacetKarat; label: string }[] = [
  { value: "10K", label: "10K" },
  { value: "14K", label: "14K" },
  { value: "18K", label: "18K" },
];

export const COLOR_OPTIONS: { value: FacetColor; label: string }[] = [
  { value: "yellow", label: "Sarı altın" },
  { value: "white", label: "Beyaz altın" },
  { value: "rose", label: "Rose altın" },
  { value: "two_tone", label: "Two-tone" },
];

export const GROUP_OPTIONS: { value: FacetGroup; label: string }[] = [
  { value: "ring", label: "Yüzük / Alyans" },
  { value: "bracelet", label: "Bileklik" },
  { value: "necklace", label: "Kolye / Zincir" },
  { value: "pendant", label: "Kolye Ucu" },
  { value: "earrings", label: "Küpe" },
  { value: "other", label: "Diğer" },
];
