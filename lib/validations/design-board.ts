import { z } from "zod";

export const boardTitleSchema = z.string().trim().max(120);
export const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Yorum boş olamaz")
  .max(2000, "Yorum 2000 karakteri aşamaz");

export const pinPositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
