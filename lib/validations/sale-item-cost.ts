import { z } from "zod";

/**
 * Kalem-başı maliyet girişi (Satış & Maliyet Takibi). `amount` metin alınır,
 * action içinde `parseMoneyToCents`. Boş/0 tutar = elle girişi SİL (otomatik
 * motor satırı varsa yeniden görünür).
 */
export const saleItemCostSchema = z.object({
  sale_item_id: z.string().uuid(),
  kind: z.enum(["gold", "labor", "gem", "packaging", "other"]),
  amount: z.string().trim().max(32),
  /** Boş = sipariş tarihi. */
  cost_date: z.string().trim().max(10).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
export type SaleItemCostValues = z.infer<typeof saleItemCostSchema>;

/** Toplu giriş: aynı kalem için birden çok tür tek seferde. */
export const saleItemCostBatchSchema = z.object({
  sale_item_id: z.string().uuid(),
  gold: z.string().trim().max(32).optional(),
  labor: z.string().trim().max(32).optional(),
  gem: z.string().trim().max(32).optional(),
  packaging: z.string().trim().max(32).optional(),
  other: z.string().trim().max(32).optional(),
  note: z.string().trim().max(500).optional(),
});
export type SaleItemCostBatchValues = z.infer<typeof saleItemCostBatchSchema>;

/** İade/geri kazanım: ürün stoğa döndü mü, geri kazanılan değer. */
export const saleItemReturnSchema = z.object({
  sale_item_id: z.string().uuid(),
  returned: z.boolean(),
  recovered: z.string().trim().max(32),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
export type SaleItemReturnValues = z.infer<typeof saleItemReturnSchema>;
