import { z } from "zod";

/** Ürün bazlı performans (dönemsel) formu. Sayısal alanlar metin olarak alınır. */
export const productMetricFormSchema = z.object({
  period_label: z.string().trim().min(1, "Dönem etiketi gerekli").max(80),
  product_title: z.string().trim().min(1, "Ürün adı gerekli").max(200),
  sku: z.string().trim().max(80),
  views: z.string(),
  orders: z.string(),
  revenue: z.string(),
  ads_clicks: z.string(),
  ads_spend: z.string(),
  ads_revenue: z.string(),
  notes: z.string(),
});

export type ProductMetricFormValues = z.infer<typeof productMetricFormSchema>;
