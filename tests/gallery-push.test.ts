import { strict as assert } from "node:assert";
import test from "node:test";

import {
  correctPrefix,
  galleryMarker,
  layoutOk,
  linenPending,
  linenPlaced,
  parseGalleryMarker,
  rerankPlan,
  planGallery,
  type GalleryPhoto,
} from "@/lib/etsy/gallery-push";
import { decodeHtmlEntities } from "@/lib/etsy/text";

/**
 * ops/gallery-push yardımcıları. Girdi canlı Etsy dökümünden: A24 taslağının
 * tek görseli (keten hero, alt_text = başlık, id 8608526844) ve sahibin
 * A01..A23'te kurduğu hedef düzen (yeni kareler 1..10, keten hero sonda).
 */

const SET = "ss27-anklets";
const MODEL = "A24";
const SLOTS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
const sha = (s: string) => `${s}`.padEnd(64, "a").replace(/[^0-9a-f]/g, "b");
const expected = Object.fromEntries(SLOTS.map((s) => [s, sha(`c${s}`)]));
const linen: GalleryPhoto = {
  listing_image_id: 8608526844,
  rank: 1,
  alt_text: "Shooting Star Anklet, Gold Star Charm with Blue Enamel Tail, Wish Anklet",
};
const ours = (slot: string, rank: number, id = 9000 + Number(slot)): GalleryPhoto => ({
  listing_image_id: id,
  rank,
  alt_text: `Shooting Star Anklet, sales photo ${slot} of 10. ${galleryMarker(SET, MODEL, slot, expected[slot])}`,
});

test("işaret: üret ve geri oku; başka set/model işareti ayırt edilir", () => {
  const m = galleryMarker(SET, MODEL, "07", expected["07"]);
  assert.match(m, /^\[ss27-anklets\/A24\/07 [0-9a-f]{12}\]$/);
  assert.deepEqual(parseGalleryMarker(`x ${m} y`), { set: SET, model: MODEL, slot: "07", sha12: expected["07"].slice(0, 12) });
  assert.equal(parseGalleryMarker(linen.alt_text), null);
  assert.equal(parseGalleryMarker(null), null);
});

test("başlangıç: yalnız keten hero, 10 slot eksik, düzen tamam değil", () => {
  const p = planGallery([linen], SET, MODEL, expected);
  assert.deepEqual(p.missing, SLOTS);
  assert.equal(p.foreign.length, 1);
  assert.equal(p.stale.length, 0);
  assert.equal(layoutOk(p, SLOTS).ok, false);
});

test("yükleme sonrası (keten önde): eksik yok ama düzen tamam değil", () => {
  const photos = [linen, ...SLOTS.map((s, i) => ours(s, i + 2))];
  const p = planGallery(photos, SET, MODEL, expected);
  assert.deepEqual(p.missing, []);
  const r = layoutOk(p, SLOTS);
  assert.equal(r.ok, false);
});

test("hedef düzen: 01..10 rank 1..10, keten 11 -> tamam; keten yoksa da tamam", () => {
  const photos = [...SLOTS.map((s, i) => ours(s, i + 1)), { ...linen, rank: 11 }];
  assert.deepEqual(layoutOk(planGallery(photos, SET, MODEL, expected), SLOTS), { ok: true, reason: null });
  assert.equal(layoutOk(planGallery(photos.slice(0, 10), SET, MODEL, expected), SLOTS).ok, true);
});

test("sha'sı farklı işaretli görsel ve aynı slotun ikinci kopyası stale sayılır", () => {
  const wrongSha: GalleryPhoto = { ...ours("03", 4), alt_text: `x ${galleryMarker(SET, MODEL, "03", sha("zz"))}` };
  const dup = ours("05", 12, 7777);
  const photos = [...SLOTS.map((s, i) => ours(s, i + 1)), wrongSha, dup];
  const p = planGallery(photos, SET, MODEL, expected);
  assert.equal(p.stale.length, 2);
  assert.equal(layoutOk(p, SLOTS).ok, false);
});

test("başka modelin işaretli görseli yabancıdır, bu modelin slotu sayılmaz", () => {
  const other: GalleryPhoto = { listing_image_id: 1, rank: 1, alt_text: galleryMarker(SET, "A25", "01", expected["01"]) };
  const p = planGallery([other], SET, MODEL, expected);
  assert.equal(p.foreign.length, 1);
  assert.equal(p.ours.size, 0);
});

test("sıra kayması yakalanır: 02 ile 03 yer değiştirmiş", () => {
  const photos = SLOTS.map((s, i) => ours(s, i + 1));
  photos[1] = { ...photos[1], rank: 3 };
  photos[2] = { ...photos[2], rank: 2 };
  const r = layoutOk(planGallery(photos, SET, MODEL, expected), SLOTS);
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /02/);
});

test("keten askıda: kareler 1..10'da, keten yok, önceki koşu id kaydetmiş -> iş bitmemiş", () => {
  const frames = SLOTS.map((s, i) => ours(s, i + 1));
  const plan = planGallery(frames, SET, MODEL, expected);
  // Düzen tek başına "tamam" der; bu yüzden ayrı bir kontrol şart.
  assert.equal(layoutOk(plan, SLOTS).ok, true);
  assert.equal(linenPending({ status: "needs_review", linenImageId: linen.listing_image_id }, frames, plan), true);
  assert.equal(linenPending({ status: "sending", linenImageId: linen.listing_image_id }, frames, plan), true);
  // Keten geri bağlanmışsa askıda değil.
  const back = [...frames, { ...linen, rank: 11 }];
  assert.equal(linenPending({ status: "needs_review", linenImageId: linen.listing_image_id }, back, planGallery(back, SET, MODEL, expected)), false);
  // Bitmiş koşunun id'si sayılmaz (sahip sonradan silmiş olabilir); kayıt yoksa askı yok.
  assert.equal(linenPending({ status: "done", linenImageId: linen.listing_image_id }, frames, plan), false);
  assert.equal(linenPending(null, frames, plan), false);
  assert.equal(linenPending({ status: "needs_review", linenImageId: null }, frames, plan), false);
});

test("keten askıda ama sonda işaretsiz yeni bir görsel var -> eski id yeniden bağlanmaz", () => {
  const replacement: GalleryPhoto = { listing_image_id: 123, rank: 11, alt_text: "owner upload" };
  const photos = [...SLOTS.map((s, i) => ours(s, i + 1)), replacement];
  const plan = planGallery(photos, SET, MODEL, expected);
  assert.equal(linenPending({ status: "needs_review", linenImageId: linen.listing_image_id }, photos, plan), false);
});

test("keten yerinde: 11. sıra ve alt text; verify ile apply aynı kuralı kullanır", () => {
  const altKey = (s: string | null | undefined) => decodeHtmlEntities(s ?? "").trim();
  const frames = SLOTS.map((s, i) => ours(s, i + 1));
  const id = linen.listing_image_id;
  assert.deepEqual(linenPlaced([...frames, { ...linen, rank: 11 }], id, linen.alt_text, 10, altKey), { ok: true, reason: null });
  // Etsy alt'ı entity kaçışıyla döndürse de aynı metin sayılır.
  const escaped = { ...linen, rank: 11, alt_text: linen.alt_text!.replace("Anklet,", "Anklet&#44;") };
  assert.equal(linenPlaced([...frames, escaped], id, linen.alt_text, 10, altKey).ok, true);
  assert.equal(linenPlaced([...frames, { ...linen, rank: 11, alt_text: "" }], id, linen.alt_text, 10, altKey).ok, false);
  assert.equal(linenPlaced([{ ...linen, rank: 1 }, ...frames.map((f) => ({ ...f, rank: f.rank + 1 }))], id, linen.alt_text, 10, altKey).ok, false);
  assert.equal(linenPlaced(frames, id, linen.alt_text, 10, altKey).ok, false);
  // Keten kaydı yoksa (listing'de hiç işaretsiz görsel yoktu) ölçüt yok.
  assert.equal(linenPlaced(frames, null, null, 10, altKey).ok, true);
});

test("sıra düzeltme planı: A24 kanaryasının gerçek durumu (kareler 2..11, keten ile 10 ikisi 11'de)", () => {
  // Canlı geri okumadan (2026-10-08): 01..09 rank 2..10, keten 11, 10 da 11.
  const photos = [...SLOTS.map((s, i) => ours(s, i + 2)), { ...linen, rank: 11 }];
  const plan = planGallery(photos, SET, MODEL, expected);
  assert.equal(layoutOk(plan, SLOTS).ok, false);
  const moves = rerankPlan(plan, SLOTS);
  assert.deepEqual(moves.map((m) => [m.photo.listing_image_id, m.rank]), SLOTS.map((s, i) => [9000 + Number(s), i + 1]));
  // Planı uygulayınca düzen ve keten yerinde.
  const fixed = [...SLOTS.map((s, i) => ours(s, i + 1)), { ...linen, rank: 11 }];
  const altKey = (x: string | null | undefined) => (x ?? "").trim();
  assert.equal(layoutOk(planGallery(fixed, SET, MODEL, expected), SLOTS).ok, true);
  assert.equal(linenPlaced(fixed, linen.listing_image_id, linen.alt_text, 10, altKey).ok, true);
  assert.deepEqual(rerankPlan(planGallery(fixed, SET, MODEL, expected), SLOTS), []);
});

test("sıra düzeltme planı: yerindeki kareye dokunmaz, yalnız kayanları taşır", () => {
  const photos = SLOTS.map((s, i) => ours(s, i + 1));
  photos[4] = { ...photos[4], rank: 12 };
  const moves = rerankPlan(planGallery(photos, SET, MODEL, expected), SLOTS);
  assert.deepEqual(moves.map((m) => [m.photo.listing_image_id, m.rank]), [[9005, 5]]);
});

test("keten N+2'ye kaymışsa düzen tamam değil (id kaydı olmasa da)", () => {
  const photos = [...SLOTS.map((s, i) => ours(s, i + 1)), { ...linen, rank: 12 }];
  const r = layoutOk(planGallery(photos, SET, MODEL, expected), SLOTS);
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /11/);
});

test("doğru önek: A39 gerçek durumu (01..09 1..9, keten ile 10 ikisi 10'da)", () => {
  // Canlı geri okumadan (2026-10-08): keten alınınca önek 10 olur, yalnız keten taşınır.
  const photos = [...SLOTS.slice(0, 9).map((s, i) => ours(s, i + 1)), { ...linen, rank: 10 }, ours("10", 10)];
  assert.equal(correctPrefix(photos, planGallery(photos, SET, MODEL, expected), SLOTS), 9);
  const noLinen = photos.filter((p) => p.listing_image_id !== linen.listing_image_id);
  assert.equal(correctPrefix(noLinen, planGallery(noLinen, SET, MODEL, expected), SLOTS), 10);
});

test("doğru önek: A39 ara durumu (01:1, keten:2, 02..08 3..9) ve eşit rank'li ilk kare", () => {
  const mid = [ours("01", 1), { ...linen, rank: 2 }, ...SLOTS.slice(1, 8).map((s, i) => ours(s, i + 3))];
  assert.equal(correctPrefix(mid, planGallery(mid, SET, MODEL, expected), SLOTS), 1);
  // Taze yükleme sonrası eşitlik: 01 ve keten ikisi de 1'de -> önek 0 (keten önce alınır).
  const tie = [{ ...linen, rank: 1 }, ...SLOTS.map((s, i) => ours(s, i + 1))];
  assert.equal(correctPrefix(tie, planGallery(tie, SET, MODEL, expected), SLOTS), 0);
  const fixed = [...SLOTS.map((s, i) => ours(s, i + 1)), { ...linen, rank: 11 }];
  assert.equal(correctPrefix(fixed, planGallery(fixed, SET, MODEL, expected), SLOTS), 10);
});
