import { z } from "zod";

/**
 * Etsy Stats dönemsel snapshot formu. Sayısal alanlar metin olarak alınır;
 * action içinde tam sayı / cent'e çevrilir. Trafik kaynakları ayrı alanlardan
 * jsonb'ye toplanır. orders/revenue/rating formda YOK — bunlar dönem tarihine
 * göre sales/reviews tablolarından otomatik hesaplanır (bkz. actions.ts).
 */
export const metricFormSchema = z.object({
  period_label: z.string().trim().min(1, "Dönem etiketi gerekli").max(80),
  period_start: z.string(),
  period_end: z.string(),
  visits: z.string(),
  cart_abandon_amount: z.string(),
  cart_abandon_count: z.string(),
  ads_spend: z.string(),
  ads_revenue: z.string(),
  src_etsy_app: z.string(),
  src_etsy_marketing: z.string(),
  src_etsy_ads: z.string(),
  src_direct: z.string(),
  src_etsy_search: z.string(),
  src_social: z.string(),
  notes: z.string(),
});

export type MetricFormValues = z.infer<typeof metricFormSchema>;
