import { z } from "zod";

export const cartStatusEnum = z.enum(["yeni", "iletildi", "kazanildi", "kayip"]);

/** Sepet kurtarma formu. Parasal alanlar metin; action'da cent'e çevrilir. */
export const cartRecoveryFormSchema = z.object({
  buyer_name: z.string().trim().max(200),
  buyer_email: z.string().trim().max(200),
  cart_value: z.string(),
  item_summary: z.string().trim().max(500),
  abandoned_at: z.string(),
  status: cartStatusEnum,
  action_taken: z.string().trim().max(500),
  incentive: z.string().trim().max(200),
  recovered_value: z.string(),
  notes: z.string().trim().max(2000),
});

export type CartRecoveryFormValues = z.infer<typeof cartRecoveryFormSchema>;
