/**
 * Higgsfield görsel URL yardımcıları. Panel yalnızca Higgsfield CDN'indeki
 * görselleri kabul eder (indirme proxy'sinde SSRF'e karşı host beyaz listesi).
 */

/**
 * Higgsfield'ın BİLİNEN dağıtım host'ları — tam eşleşme. `.cloudfront.net`
 * genelini kabul etmek SSRF/istismar kapısı olur (herkes CloudFront açabilir);
 * yalnız Higgsfield'ın gerçek dağıtımları listelenir. Yeni bir dağıtım
 * görülürse buraya eklenir.
 */
const ALLOWED_HOSTS = new Set([
  "d8j0ntlcm91z4.cloudfront.net", // üretim sonuçları (rawUrl/minUrl)
  "d2ol7oe51mr4n9.cloudfront.net", // yüklenen referans medyaları
]);

/** İzinli host mu? Bilinen Higgsfield dağıtımları + *.higgsfield.ai. */
export function isHiggsfieldUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  return (
    ALLOWED_HOSTS.has(h) || h === "higgsfield.ai" || h.endsWith(".higgsfield.ai")
  );
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
