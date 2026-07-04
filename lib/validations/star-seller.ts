import { z } from "zod";

/** Sayısal alan: boş ya da geçerli sayı (metin olarak; action'da çevrilir). */
const numText = (opts?: { min?: number; max?: number; int?: boolean }) =>
  z.string().refine((s) => {
    const t = s.trim();
    if (t === "") return true;
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n)) return false;
    if (opts?.int && !Number.isInteger(n)) return false;
    if (opts?.min != null && n < opts.min) return false;
    if (opts?.max != null && n > opts.max) return false;
    return true;
  }, "Geçersiz değer");

/** Yıldız Satıcı dönem formu. */
export const starSellerFormSchema = z.object({
  period_label: z.string().trim().min(1, "Dönem etiketi gerekli").max(120),
  period_start: z.string(),
  period_end: z.string(),
  next_chance_on: z.string(),
  message_response_rate: numText({ min: 0, max: 100 }),
  on_time_shipping_rate: numText({ min: 0, max: 100 }),
  avg_review_rating: numText({ min: 0, max: 5 }),
  low_review_count: numText({ min: 0, int: true }),
  case_count: numText({ min: 0, int: true }),
  order_count: numText({ min: 0, int: true }),
  note: z.string().trim().max(2000),
});

export type StarSellerFormValues = z.infer<typeof starSellerFormSchema>;
