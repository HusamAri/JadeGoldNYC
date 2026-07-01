import { z } from "zod";

export const designStatusEnum = z.enum([
  "taslak",
  "onaylandi",
  "yayinda",
  "arsiv",
]);

/**
 * Tasarım formu. `product_id` boş string = ilişkili ürün yok (action'da
 * null'a çevrilir). `tags` virgülle ayrılmış metin olarak alınır ve
 * action'da diziye ayrıştırılır. `version` metin olarak alınır ve action'da
 * tam sayıya çevrilir.
 */
export const designFormSchema = z.object({
  name: z.string().trim().min(1, "Ad gerekli").max(200),
  description: z.string().trim().max(2000),
  status: designStatusEnum,
  product_id: z.string(),
  tags: z.string().trim().max(500),
  version: z
    .string()
    .trim()
    .refine((s) => s === "" || /^\d+$/.test(s), "Versiyon sayı olmalı"),
});

export type DesignFormValues = z.infer<typeof designFormSchema>;
