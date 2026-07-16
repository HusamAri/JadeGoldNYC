/**
 * Tek-parça (varyantsız) listing'ler için deterministik SKU üretimi.
 *
 * Platform kuralı: her sellable birim org içinde benzersiz SKU taşır; SKU'suz
 * varyant/listing olamaz. Etsy'nin varyasyonsuz listing'i SKU alanı boş
 * yaşayabildiğinden panel senkron sınırında SKU'yu KENDİSİ üretir — formül
 * 0086 backfill'iyle birebir aynıdır ki her senkron turu aynı SKU'yu yeniden
 * üretsin (kararlı mirror; Etsy boş döndü diye null'a ezilmez).
 *
 * Biçim: <KategoriHarfi><etsy_listing_id> — sonda "-<sayı>" olmadığından
 * distribute.ts beden-çıkarımı bu SKU'ları atlar (0086 notu).
 */

/** Envanter olmayan yardımcı listing'ler (kargo yükseltme, fiyat farkı) —
 *  bunlara SKU üretilmez (sellable birim değiller; 0086 ile aynı liste). */
export const NON_INVENTORY_LISTING_IDS = new Set([1593402358, 1669546571]);

/** Kategori harfi — earring/hoop, ring'den ÖNCE ("ea**ring**" tuzağı). */
export function categoryLetter(title: string | null | undefined): string {
  const t = (title ?? "").toLowerCase();
  if (t.includes("earring") || t.includes("hoop")) return "E";
  if (t.includes("ring")) return "R";
  if (t.includes("bracelet")) return "B";
  if (t.includes("necklace") || t.includes("chain")) return "C";
  if (t.includes("pendant")) return "P";
  return "X";
}

/** Tek-parça listing için deterministik SKU (0086 formülü). */
export function mintSingleItemSku(
  title: string | null | undefined,
  etsyListingId: number,
): string {
  return `${categoryLetter(title)}${etsyListingId}`;
}
