import { z } from "zod";

/** URL ile görsel ekleme (Drive önizleme URL'i veya doğrudan görsel linki). */
export const listingImageUrlSchema = z.object({
  productId: z.string().uuid("Geçersiz ürün"),
  url: z.string().trim().url("Geçerli bir URL girin").max(2000),
  alt: z.string().trim().max(300).optional(),
});

/** Galeri yeniden sıralama: ürünün görsel id'leri yeni sırayla. */
export const listingImageReorderSchema = z.object({
  productId: z.string().uuid("Geçersiz ürün"),
  orderedIds: z.array(z.string().uuid()).min(1, "Sıra boş olamaz"),
});

export type ListingImageUrlValues = z.infer<typeof listingImageUrlSchema>;
export type ListingImageReorderValues = z.infer<
  typeof listingImageReorderSchema
>;
