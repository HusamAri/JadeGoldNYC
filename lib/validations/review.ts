import { z } from "zod";

export const reviewStatusEnum = z.enum(["yeni", "yanitlandi", "isaretli"]);

/** Yorum formu. rating metin ("" ya da 1–5); action'da sayıya çevrilir. */
export const reviewFormSchema = z.object({
  buyer_name: z.string().trim().max(200),
  rating: z
    .string()
    .refine(
      (s) => s.trim() === "" || /^[1-5]$/.test(s.trim()),
      "Puan 1–5 arası olmalı",
    ),
  review_text: z.string().trim().max(4000),
  language: z.string().trim().max(20),
  review_date: z.string(),
  status: reviewStatusEnum,
  internal_note: z.string().trim().max(2000),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
