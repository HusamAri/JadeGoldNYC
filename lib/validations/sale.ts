import { z } from "zod";

export const saleStatusEnum = z.enum([
  "paid",
  "completed",
  "shipped",
  "cancelled",
  "refunded",
]);

/**
 * Satış formu. Parasal alanlar metin olarak alınır (örn. "12,34") ve
 * server action içinde `parseMoneyToCents` ile cent'e çevrilir.
 */
export const saleFormSchema = z.object({
  order_no: z.string().trim().max(120),
  buyer_name: z.string().trim().max(200),
  buyer_email: z.string().trim().max(200),
  status: saleStatusEnum,
  order_date: z.string().min(1, "Tarih gerekli"),
  ship_country: z.string().trim().max(100),
  item_total: z.string(),
  shipping: z.string(),
  tax: z.string(),
  discount: z.string(),
  etsy_fees: z.string(),
  grand_total: z.string(),
  currency: z.string().trim().min(1, "Para birimi gerekli").max(3),
  notes: z.string().trim().max(2000),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;
