import { z } from "zod";

/**
 * Maliyet formu. `amount` metin olarak alınır ve server action içinde
 * `parseMoneyToCents` ile cent'e çevrilir.
 */
export const costFormSchema = z.object({
  category_id: z.string().min(1, "Kategori seçin"),
  description: z.string().trim().min(1, "Açıklama gerekli").max(500),
  amount: z.string().min(1, "Tutar gerekli"),
  currency: z.string().trim().min(1, "Para birimi gerekli").max(3),
  cost_date: z.string().min(1, "Tarih gerekli"),
  vendor: z.string().trim().max(200),
  notes: z.string().trim().max(2000),
});

export type CostFormValues = z.infer<typeof costFormSchema>;
