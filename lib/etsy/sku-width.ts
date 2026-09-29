/**
 * EON SKU'sundan bant genişliği (mm). İki şema tanınır:
 *  - v4 / TTG: `...-<N>MM-<beden>`         (`TTG-R-1006-10MM-10`)
 *  - EON-R panel şeması: `EON-R-<tasarım 4 hane>-<ayar>-<genişlik 2 hane>-<beden×10 3 hane>`
 *                                           (`EON-R-1015-18-03-030`)
 * Desen tutmuyorsa null: tanımadığımız SKU'ya asla dokunulmaz. İkinci şema
 * eklenmeden önce prune-widths `EON-R` listing'lerinde hiçbir şeyi
 * kaldırmadan "0 kaldırıldı" derdi (2026-09-29).
 */
export function widthOfSku(sku: string): number | null {
  const s = sku.trim();
  const mm = /-(\d+)MM-[0-9.]+$/.exec(s);
  if (mm) return Number(mm[1]);
  const eonR = /^EON-R-\d{4}-(?:10|14|18)-(\d{2})-\d{3}$/.exec(s);
  return eonR ? Number(eonR[1]) : null;
}
