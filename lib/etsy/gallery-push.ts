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

/** Hedef düzen: slotlar 1..N sırasıyla rank 1..N, varsa işaretsiz görsel tam N+1. */
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
  // İşaretsiz görsel tam N+1'de: id'si hiç kaydedilmemiş keten de (yerinden
  // oynamadıysa) ölçülsün; aksi hâlde N+2'ye kaymış keten "tamam" sayılırdı
  // (bağımsız simülasyon 2026-10-08).
  if (plan.foreign.some((f) => f.rank !== sorted.length + 1)) {
    return { ok: false, reason: `işaretsiz görsel ${sorted.length + 1}. sırada değil` };
  }
  return { ok: true, reason: null };
}

/**
 * Önceki koşu keten hero'yu silip geri bağlayamadıysa (id kayıtlı, galeride
 * yok) iş bitmemiştir; kareler 1..N'de "doğru" görünse bile. Bitmiş (done)
 * koşunun id'si sayılmaz: sahip görseli sonradan bilerek silmiş olabilir.
 * Karelerin ardında işaretsiz bir görsel zaten duruyorsa (sahip elle eklemiş)
 * eski id yeniden bağlanmaz, yoksa hero iki kez görünür ve listing kilitlenir
 * (bağımsız inceleme 2026-10-08, iki tur, doğrulandı).
 */
export function linenPending(
  prev: { status?: string; linenImageId?: number | null } | null | undefined,
  photos: GalleryPhoto[],
  plan: Pick<GalleryPlan, "foreign">,
): boolean {
  return (
    prev != null &&
    prev.status !== "done" &&
    prev.linenImageId != null &&
    plan.foreign.length === 0 &&
    !photos.some((p) => p.listing_image_id === prev.linenImageId)
  );
}

/** HTML entity'leri çözülmüş, kırpılmış alt text (Etsy alt'ı kaçışlı döndürebilir). */
export type AltKey = (s: string | null | undefined) => string;

/**
 * Kayıtlı keten hero hedef yerinde mi: N kareden hemen sonra (rank N+1) ve
 * alt text'i korunmuş. Apply'ın son kontrolü ile verify AYNI kuralı kullanır;
 * ilk sürümde kural yalnız apply'daydı ve verify açık bir koşuyu "ok" sayıyordu.
 */
export function linenPlaced(
  photos: GalleryPhoto[],
  linenImageId: number | null | undefined,
  linenAlt: string | null | undefined,
  slotCount: number,
  altKey: AltKey,
): { ok: boolean; reason: string | null } {
  if (linenImageId == null) return { ok: true, reason: null };
  const p = photos.find((x) => x.listing_image_id === linenImageId);
  if (!p) return { ok: false, reason: `keten hero (${linenImageId}) galeride yok` };
  if (p.rank !== slotCount + 1) return { ok: false, reason: `keten hero ${slotCount + 1}. sırada değil (rank ${p.rank})` };
  if (linenAlt && altKey(p.alt_text) !== altKey(linenAlt)) return { ok: false, reason: "keten hero'nun alt text'i değişti" };
  return { ok: true, reason: null };
}

/**
 * Sıra düzeltme planı: kendi slot numarasında (01 → rank 1 …) olmayan kareler.
 * Vaka 2026-10-08, A24 kanaryası: Etsy keten hero silindikten sonra sıraları
 * SIKIŞTIRMADI (kareler 2..11'de kaldı) ve aynı rank'e iki görsel koymaya izin
 * verdi (keten ile 10. kare ikisi de 11). `rank` yalnız bir sıralama değeridir;
 * düzeltme her kareyi silip aynı id ve alt text'le TAM rank'e yeniden bağlar
 * (uploadListingImage listing_image_id; kanaryada değeri birebir yazdığı görüldü).
 */
export function rerankPlan(plan: GalleryPlan, slots: string[]): { photo: GalleryPhoto; rank: number }[] {
  return [...slots]
    .sort()
    .map((slot, i) => ({ photo: plan.ours.get(slot), rank: i + 1 }))
    .filter((x): x is { photo: GalleryPhoto; rank: number } => x.photo != null && x.photo.rank !== x.rank);
}

/**
 * Doğru önek uzunluğu: k. slot tam rank k'de ve rank <= k'de başka görsel yok.
 * Rota düzeni bu önekten sonrasını yeniden kurarak yakınsatır.
 */
export function correctPrefix(photos: GalleryPhoto[], plan: GalleryPlan, slots: string[]): number {
  const sorted = [...slots].sort();
  let k = 0;
  while (
    k < sorted.length &&
    plan.ours.get(sorted[k])?.rank === k + 1 &&
    photos.filter((p) => p.rank <= k + 1).length === k + 1
  ) {
    k++;
  }
  return k;
}

/**
 * Kareler slot sırasıyla kesin artan rank'te mi (değerden bağımsız). Yayındaki
 * listing'de kareye dokunmadan yalnız keten taşınırken kullanılır (A24: kareler
 * 2..11'de, sıra doğru, değerler bir kaymış).
 */
export function framesInOrder(plan: GalleryPlan, slots: string[]): { ok: boolean; maxRank: number; reason: string | null } {
  if (plan.stale.length) return { ok: false, maxRank: 0, reason: `işaretli ama beklenmeyen ${plan.stale.length} görsel` };
  if (plan.missing.length) return { ok: false, maxRank: 0, reason: `eksik slot: ${plan.missing.join(",")}` };
  const sorted = [...slots].sort();
  let last = 0;
  for (const s of sorted) {
    const r = plan.ours.get(s)!.rank;
    if (r <= last) return { ok: false, maxRank: 0, reason: `${s} sırası (${r}) öncekinden büyük değil` };
    last = r;
  }
  return { ok: true, maxRank: last, reason: null };
}

/**
 * Yayın modu kabul ölçütü: kareler sıralı, hiçbir rank paylaşılmıyor,
 * işaretsiz görsel tam son karenin ardında. Görünen sıra hedefle aynıdır;
 * değerler 1'den başlamayabilir (bilerek: yayındaki karelere dokunulmaz).
 */
export function relativeLayoutOk(
  photos: GalleryPhoto[],
  plan: GalleryPlan,
  slots: string[],
): { ok: boolean; maxRank: number; reason: string | null } {
  const fr = framesInOrder(plan, slots);
  if (!fr.ok) return fr;
  const ranks = photos.map((p) => p.rank);
  if (new Set(ranks).size !== ranks.length) return { ok: false, maxRank: fr.maxRank, reason: "aynı rank'te iki görsel var" };
  if (plan.foreign.some((f) => f.rank !== fr.maxRank + 1)) {
    return { ok: false, maxRank: fr.maxRank, reason: `işaretsiz görsel son karenin hemen ardında (${fr.maxRank + 1}) değil` };
  }
  return { ok: true, maxRank: fr.maxRank, reason: null };
}
