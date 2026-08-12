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

/**
 * SKU'nun ilk üç harfi saf RENK değil, bir KİMLİK yuvasıdır. Ailelerin
 * çoğunda metal rengini taşır; iki üründe ürünün kendi kimliğini taşır:
 *   TTG  two-tone (iki renk birden — tek bir renge indirgenemez)
 *   HMW  hammered (renk KODLAMAZ; renk başlıktan çözülür)
 *
 * Kullanıcı kararı 2026-08-12: bu kabul edilir, önek listesi buna uyarlanır.
 * Etsy tarafında da aynı önekler duruyor (TTG `4550506421`, HMW `4543442596`
 * canlı editörde teyit edildi), yani panel aynası doğru.
 *
 * `null` = önek tanınır ama renk taşımaz → başlığa düşülür.
 */
const SKU_IDENTITY_PREFIX: Record<string, FacetColor | null> = {
  GLD: "yellow",
  WHG: "white",
  RSG: "rose",
  TTG: "two_tone",
  HMW: null,
};

/**
 * Renk çözümü. Sıra ÖNEMLİ: önce başlık, sonra SKU öneki.
 *
 * SKU denetimi (docs/eon/strategy, APPENDIX A) 42 canlı listing'in 41'inde
 * ikisinin uyuştuğunu, uyuşmayan tek satırda ise BAŞLIĞIN doğru olduğunu
 * gösterdi — o yüzden başlık önce gelir. Önek yalnız başlık renk kelimesi
 * taşımadığında konuşur.
 */
export function deriveColor(
  title: string,
  sku?: string | null,
): FacetColor | null {
  const t = title.toLowerCase();
  if (/two.?tone/.test(t)) return "two_tone";
  if (/rose\s*gold/.test(t)) return "rose";
  if (/white\s*gold/.test(t)) return "white";
  if (/yellow\s*gold/.test(t)) return "yellow";

  const prefix = (sku ?? "").toUpperCase().slice(0, 3);
  if (prefix in SKU_IDENTITY_PREFIX) {
    const c = SKU_IDENTITY_PREFIX[prefix];
    if (c) return c;
  }

  // Son çare: renk sıfatı olmadan "gold" geçen başlık (ör. "Solid 10K Gold
  // Basketweave"). Bu bir ÇIKARIM, ilan edilmiş bir ürün özelliği değil.
  if (/\bgold\b/.test(t)) return "yellow";
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
