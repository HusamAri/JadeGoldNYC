import { strict as assert } from "node:assert";
import test from "node:test";

import { galleryMarker, layoutOk, linenPending, parseGalleryMarker, planGallery, type GalleryPhoto } from "@/lib/etsy/gallery-push";

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
  // Düzen tek başına "tamam" der; bu yüzden ayrı bir kontrol şart.
  assert.equal(layoutOk(planGallery(frames, SET, MODEL, expected), SLOTS).ok, true);
  assert.equal(linenPending({ status: "needs_review", linenImageId: linen.listing_image_id }, frames), true);
  assert.equal(linenPending({ status: "sending", linenImageId: linen.listing_image_id }, frames), true);
  // Keten geri bağlanmışsa askıda değil.
  assert.equal(linenPending({ status: "needs_review", linenImageId: linen.listing_image_id }, [...frames, { ...linen, rank: 11 }]), false);
  // Bitmiş koşunun id'si sayılmaz (sahip sonradan silmiş olabilir); kayıt yoksa askı yok.
  assert.equal(linenPending({ status: "done", linenImageId: linen.listing_image_id }, frames), false);
  assert.equal(linenPending(null, frames), false);
  assert.equal(linenPending({ status: "needs_review", linenImageId: null }, frames), false);
});
