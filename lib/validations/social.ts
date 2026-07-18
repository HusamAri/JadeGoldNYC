import { z } from "zod";

export const socialPostSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "pinterest", "other"]),
  format: z.enum(["reel", "photo", "carousel", "story", "post"]),
  status: z.enum(["idea", "planned", "ready", "published", "skipped"]),
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  week_number: z.string().optional(),
  week_theme: z.string().optional(),
  series: z.string().optional(),
  /** datetime-local veya ISO; boş = plansız. */
  scheduled_at: z.string().optional(),
  asset_note: z.string().optional(),
  overlay: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  tags_note: z.string().optional(),
  permalink: z.string().optional(),
});

export type SocialPostInput = z.infer<typeof socialPostSchema>;
