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
  /** Görsel/video linkleri — textarea, her satıra bir URL. */
  media_urls: z.string().optional(),
});

/** Textarea satırları → geçerli http(s) URL dizisi (sıra korunur, ilk 12). */
export function parseMediaUrls(s?: string): string[] {
  if (!s?.trim()) return [];
  const out: string[] = [];
  for (const line of s.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    try {
      const u = new URL(t);
      if (u.protocol === "http:" || u.protocol === "https:") out.push(t);
    } catch {
      // URL olmayan satır sessizce atlanır — not alanı değil, link alanı.
    }
  }
  return [...new Set(out)].slice(0, 12);
}

export type SocialPostInput = z.infer<typeof socialPostSchema>;
