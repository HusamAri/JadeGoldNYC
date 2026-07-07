/**
 * Higgsfield görsel URL yardımcıları. Panel yalnızca Higgsfield CDN'indeki
 * görselleri kabul eder (indirme proxy'sinde SSRF'e karşı host beyaz listesi).
 */

/** İzinli host mu? Higgsfield CloudFront dağıtımları + higgsfield.ai. */
export function isHiggsfieldUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  return h.endsWith(".cloudfront.net") || h.endsWith("higgsfield.ai");
}

/**
 * Tam görselden (rawUrl, .png) küçük önizleme (_min.webp) türetir. Higgsfield
 * `hf_...<id>.png` → `hf_...<id>_min.webp` desenini kullanır. Eşleşmezse null.
 */
export function deriveThumbUrl(sourceUrl: string): string | null {
  const m = sourceUrl.match(/^(.*)\.(png|jpg|jpeg)$/i);
  if (!m) return null;
  if (/_min\.(webp|png|jpg|jpeg)$/i.test(sourceUrl)) return sourceUrl;
  return `${m[1]}_min.webp`;
}
