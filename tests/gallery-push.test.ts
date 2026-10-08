import { strict as assert } from "node:assert";
import test from "node:test";

import {
  galleryMarker,
  layoutOk,
  linenPending,
  linenPlaced,
  parseGalleryMarker,
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
