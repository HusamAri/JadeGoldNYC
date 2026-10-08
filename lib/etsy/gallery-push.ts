/**
 * Var olan bir Etsy listing'ine bir setin 01..N satış görsellerini ekleyen
 * `ops/gallery-push` rotasının saf yardımcıları (2026-10-08, SS27 anklet
 * taslakları A24..A40: yalnız keten hero vardı, 10 satış karesi eklenecekti).
 *
 * Kimlik: her yüklenen görselin alt_text'i bir işaret taşır,
 * `[<set>/<model>/<NN> <sha12>]`. İşaret hem idempotensi (aynı kare iki kez
 * yüklenmez) hem de düzen kontrolünü (hangi Etsy görseli hangi kare) sağlar;
 * `gallery-2k-actions.ts`'teki çalışan sözleşmenin aynısı.
 *
 * Hedef düzen sahibin A01..A23'te kurduğu düzendir: yeni kareler 1..N, var
 * olan (işaretsiz) görsel en sonda.
 */

export interface GalleryPhoto {
  listing_image_id: number;
  rank: number;
  alt_text?: string | null;
  full_width?: number | null;
  full_height?: number | null;
}

export interface Marker {
  set: string;
  model: string;
  slot: string;
  sha12: string;
}

const MARKER_RE = /\[([a-z0-9][a-z0-9-]*)\/([A-Z]\d{2})\/(\d{2}) ([0-9a-f]{12})\]/;

export function galleryMarker(set: string, model: string, slot: string, sha256: string): string {
  return `[${set}/${model}/${slot} ${sha256.slice(0, 12)}]`;
}

export function parseGalleryMarker(alt: string | null | undefined): Marker | null {
  const m = (alt ?? "").match(MARKER_RE);
  return m ? { set: m[1], model: m[2], slot: m[3], sha12: m[4] } : null;
}

export interface GalleryPlan {
  /** Bu setin bu modeline ait, sha'sı beklenenle tutan görseller (slot → foto). */
  ours: Map<string, GalleryPhoto>;
  /** Bu set/model işaretli ama sha'sı farklı ya da aynı slot iki kez: elle bakılmalı. */
  stale: GalleryPhoto[];
  /** İşaretsiz ya da başka set/model işaretli görseller (keten hero vb.). */
  foreign: GalleryPhoto[];
  /** Henüz Etsy'de olmayan slotlar, sıralı. */
  missing: string[];
}

export function planGallery(
  photos: GalleryPhoto[],
  set: string,
  model: string,
  expected: Record<string, string>,
): GalleryPlan {
  const ours = new Map<string, GalleryPhoto>();
  const stale: GalleryPhoto[] = [];
  const foreign: GalleryPhoto[] = [];
  for (const p of [...photos].sort((a, b) => a.rank - b.rank)) {
    const m = parseGalleryMarker(p.alt_text);
    if (!m || m.set !== set || m.model !== model) {
      foreign.push(p);
      continue;
    }
    const want = expected[m.slot];
    if (!want || want.slice(0, 12) !== m.sha12 || ours.has(m.slot)) {
      stale.push(p);
      continue;
    }
    ours.set(m.slot, p);
  }
  const missing = Object.keys(expected)
    .sort()
    .filter((s) => !ours.has(s));
  return { ours, stale, foreign, missing };
}

/** Hedef düzen: slotlar 1..N sırasıyla rank 1..N, varsa işaretsizler sonra. */
export function layoutOk(plan: GalleryPlan, slots: string[]): { ok: boolean; reason: string | null } {
  if (plan.stale.length) return { ok: false, reason: `işaretli ama beklenmeyen ${plan.stale.length} görsel` };
  if (plan.missing.length) return { ok: false, reason: `eksik slot: ${plan.missing.join(",")}` };
  const sorted = [...slots].sort();
  for (let i = 0; i < sorted.length; i++) {
    const p = plan.ours.get(sorted[i]);
    if (!p || p.rank !== i + 1) return { ok: false, reason: `${sorted[i]} beklenen sırada değil (rank ${p?.rank ?? "-"})` };
  }
  if (plan.foreign.some((f) => f.rank <= sorted.length)) {
    return { ok: false, reason: "işaretsiz görsel yeni karelerin önünde" };
  }
  return { ok: true, reason: null };
}
