import { strict as assert } from "node:assert";
import test from "node:test";

import {
  altKey,
  byRank,
  describePhotos,
  nextRank,
  planPhotosCopy,
  rankTies,
  sourceProblems,
  specProblems,
  type LivePhoto,
  type PhotosCopySpec,
} from "@/lib/etsy/photos-copy";
import specFile from "@/docs/artifact-studio/fix-plan-2026-11-17/photos-copy.json";

/**
 * ops/photos-copy. Girdi canlı listing'lerden: 4590689501 ürünün mağazadaki
 * listing'i (on kare), 4612132585 mesajlardan açılmış özel sipariş listing'i
 * (tek görseli Etsy'nin yer tutucusu, 8815913736).
 */

const spec = (specFile.specs as Record<string, PhotosCopySpec>)["elongated-cable-7in"];
const withSpec = (patch: Partial<PhotosCopySpec>): PhotosCopySpec => ({ ...spec, ...patch });
const withFrame = (i: number, patch: Partial<PhotosCopySpec["frames"][number]>): PhotosCopySpec =>
  withSpec({ frames: spec.frames.map((f, k) => (k === i ? { ...f, ...patch } : f)) });

const PLACEHOLDER: LivePhoto = { listing_image_id: spec.placeholder, rank: 1, alt_text: null };
/** Hedefte k. kare (0 tabanlı): yeni bir görsel id'si, spec'in alt text'i. */
const copied = (k: number, rank: number): LivePhoto => ({
  listing_image_id: 9_000_000_000 + k,
  rank,
  alt_text: spec.frames[k].alt,
});
const sourceLive = (): LivePhoto[] =>
  spec.frames.map((f, i) => ({
    listing_image_id: f.image,
    rank: i + 1,
    alt_text: null,
    url_fullxfull: `https://i.etsystatic.com/68033014/r/il/000000/${f.image}/il_fullxfull.${f.image}_xxxx.jpg`,
  }));

test("repodaki spec kusursuz: on kare, incelenen sıra, alt text'ler ürünün söylemediğini söylemiyor", () => {
  assert.deepEqual(specProblems(spec), []);
  assert.equal(spec.frames.length, 10);
  assert.equal(spec.from, 4590689501);
  assert.equal(spec.to, 4612132585);
  assert.equal(spec.targetIsPrivate, true);
  assert.deepEqual(
    spec.frames.map((f) => f.image),
    [8688052015, 8688052135, 8688052233, 8688052311, 8688052389, 8688052487, 8688052563, 8640237606, 8640237712, 8688052933],
  );
  spec.frames.forEach((f, i) => {
    // Listing 10K ve 7 inç; kareler ayar ya da boy göstermiyor, alt text de söylemez.
    assert.ok(!/\b\d{2}\s?k\b/i.test(f.alt), `kare ${i + 1}: ayar`);
    assert.ok(!/inch|\bin\.|\bcm\b/i.test(f.alt), `kare ${i + 1}: boy`);
    assert.ok(!/visuali[sz]ation|render|\bAI\b|photo of/i.test(f.alt), `kare ${i + 1}: görsel kökeni`);
    // Metal rengini yalnız üç rengi gösteren kare adlandırır.
    assert.equal(/yellow|white|rose/i.test(f.alt), i === 8, `kare ${i + 1}: renk`);
  });
});

test("spec kuralları: tekrar, kaçış karakteri, uzun tire, sha, yer tutucu, iç not", () => {
  const has = (s: PhotosCopySpec, part: string) => specProblems(s).some((p) => p.includes(part));
  assert.ok(has(withFrame(1, { alt: spec.frames[0].alt }), "aynı"));
  assert.ok(has(withFrame(1, { alt: spec.frames[0].alt.toUpperCase() }), "aynı"));
  assert.ok(has(withFrame(1, { alt: "Bracelet on a man's wrist" }), "kaçış"));
  assert.ok(has(withFrame(1, { alt: "Bracelet \u2013 on the wrist" }), "tire"));
  assert.ok(has(withFrame(1, { alt: " Bracelet on the wrist" }), "boşluk"));
  assert.ok(has(withFrame(1, { alt: "" }), "boş"));
  assert.ok(has(withFrame(1, { alt: "x".repeat(251) }), "250"));
  assert.ok(has(withFrame(1, { sha256: "abc" }), "sha256"));
  assert.ok(has(withFrame(1, { image: spec.frames[0].image }), "tekrar"));
  assert.ok(has(withFrame(1, { image: spec.placeholder }), "yer tutucu"));
  assert.ok(has(withSpec({ to: spec.from }), "aynı listing"));
  assert.ok(has(withSpec({ frames: [] }), "0 kare"));
  assert.ok(
    has(withFrame(1, { alt: "DESIGN PROPOSAL, NOT READY FOR SALE. The images are AI-assisted visualizations." }), "kamuya"),
  );
});

test("kaynak: yalnız incelenen galeri, aynı sırayla kabul edilir", () => {
  assert.deepEqual(sourceProblems(sourceLive(), spec), []);

  const swapped = sourceLive();
  [swapped[0].rank, swapped[1].rank] = [swapped[1].rank, swapped[0].rank];
  assert.ok(sourceProblems(swapped, spec).some((p) => p.includes("incelenen galeri değil")));

  const replaced = sourceLive();
  replaced[4] = { ...replaced[4], listing_image_id: 8_700_000_001 };
  assert.ok(sourceProblems(replaced, spec).some((p) => p.includes("incelenen galeri değil")));

  assert.ok(sourceProblems(sourceLive().slice(0, 9), spec).length > 0);
  assert.ok(
    sourceProblems([...sourceLive(), { listing_image_id: 8_700_000_002, rank: 11 }], spec).length > 0,
  );

  const tied = sourceLive();
  tied[1] = { ...tied[1], rank: 1 };
  assert.ok(sourceProblems(tied, spec).some((p) => p.includes("eşit sıra")));

  const noUrl = sourceLive();
  noUrl[2] = { ...noUrl[2], url_fullxfull: null };
  assert.ok(sourceProblems(noUrl, spec).some((p) => p.includes("kare 3")));
});

test("plan: yalnız yer tutucu duran hedefe on kare sırayla yüklenir", () => {
  assert.deepEqual(planPhotosCopy([PLACEHOLDER], spec), {
    status: "would-copy",
    present: 0,
    missing: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    placeholderPresent: true,
  });
  // Görselsiz hedef: yüklenecek on kare var, kaldırılacak yer tutucu yok.
  assert.deepEqual(planPhotosCopy([], spec).missing.length, 10);
  assert.equal(planPhotosCopy([], spec).placeholderPresent, false);
});

test("plan: yarım kalan koşu kaldığı yerden sürer", () => {
  const half = [PLACEHOLDER, copied(0, 2), copied(1, 3), copied(2, 4)];
  assert.deepEqual(planPhotosCopy(half, spec), {
    status: "would-copy",
    present: 3,
    missing: [3, 4, 5, 6, 7, 8, 9],
    placeholderPresent: true,
  });
});

test("plan: kareler tamamsa yalnız yer tutucu kaldırılır; sonra iş biter", () => {
  const frames = spec.frames.map((_, k) => copied(k, k + 2));
  assert.deepEqual(planPhotosCopy([PLACEHOLDER, ...frames], spec), {
    status: "would-finish",
    present: 10,
    missing: [],
    placeholderPresent: true,
  });
  // Etsy silmeden sonra sıraları sıkıştırmayabilir (2..11) ya da sıkıştırabilir (1..10).
  assert.equal(planPhotosCopy(frames, spec).status, "already");
  assert.equal(planPhotosCopy(spec.frames.map((_, k) => copied(k, k + 1)), spec).status, "already");
  // Sıra değerleri aralıklı olsa da diziliş aynıysa tamamdır.
  assert.equal(planPhotosCopy(spec.frames.map((_, k) => copied(k, 3 * k + 5)), spec).status, "already");
});

test("plan: tanınmayan görsel, bozuk diziliş, tekrar ve eşit sıra yazımı durdurur", () => {
  const frames = spec.frames.map((_, k) => copied(k, k + 2));
  const owners: LivePhoto = { listing_image_id: 8_900_000_000, rank: 12, alt_text: "Real photo of the bracelet" };
  assert.equal(planPhotosCopy([PLACEHOLDER, owners], spec).status, "refuse");
  assert.match(planPhotosCopy([PLACEHOLDER, ...frames, owners], spec).reason ?? "", /tanımadığı/);

  // Başka bir yer tutucu (sahip görseli değiştirmiş): tanınmaz.
  assert.equal(planPhotosCopy([{ listing_image_id: 8_815_000_000, rank: 1 }], spec).status, "refuse");

  const swapped = [PLACEHOLDER, copied(1, 2), copied(0, 3)];
  assert.match(planPhotosCopy(swapped, spec).reason ?? "", /sırayla değil/);

  const gap = [PLACEHOLDER, copied(0, 2), copied(2, 3)];
  assert.match(planPhotosCopy(gap, spec).reason ?? "", /sırayla değil/);

  const twice = [PLACEHOLDER, copied(0, 2), { ...copied(0, 3), listing_image_id: 9_100_000_000 }];
  assert.match(planPhotosCopy(twice, spec).reason ?? "", /iki kez/);

  const tied = [PLACEHOLDER, copied(0, 2), copied(1, 2)];
  assert.match(planPhotosCopy(tied, spec).reason ?? "", /eşit sıra/);
});

test("alt text Etsy biçiminde dönse de kare tanınır", () => {
  const shaped: LivePhoto = {
    listing_image_id: 9_000_000_000,
    rank: 2,
    alt_text: `  ${spec.frames[0].alt.replace(", ", ",  ")}\r\n`,
  };
  assert.equal(planPhotosCopy([PLACEHOLDER, shaped], spec).present, 1);
  assert.equal(altKey("Links &amp; clasp "), "Links & clasp");
  assert.equal(altKey(null), "");
});

test("sıra yardımcıları: eşitlik, bir sonraki boş sıra, döküm", () => {
  assert.equal(nextRank([]), 1);
  assert.equal(nextRank([PLACEHOLDER]), 2);
  assert.equal(nextRank([PLACEHOLDER, copied(0, 2), copied(1, 7)]), 8);
  assert.deepEqual(rankTies([PLACEHOLDER, copied(0, 1), copied(1, 3), copied(2, 3), copied(3, 4)]), [1, 3]);
  assert.deepEqual(
    byRank([copied(1, 3), PLACEHOLDER, copied(0, 2)]).map((p) => p.rank),
    [1, 2, 3],
  );
  assert.deepEqual(describePhotos([{ ...copied(0, 2), full_width: 2048, full_height: 2048 }, PLACEHOLDER]), [
    { id: spec.placeholder, rank: 1, size: null, alt: null },
    { id: 9_000_000_000, rank: 2, size: "2048x2048", alt: spec.frames[0].alt },
  ]);
});

test("uçtan uca: her kare bir sonraki boş sıraya yazılır, eşitlik oluşmaz, iki silme davranışında da biter", () => {
  let gallery: LivePhoto[] = [PLACEHOLDER];
  for (let k = 0; k < spec.frames.length; k++) {
    const plan = planPhotosCopy(gallery, spec);
    assert.equal(plan.status, "would-copy");
    assert.equal(plan.missing[0], k);
    gallery = [...gallery, copied(k, nextRank(gallery))];
    assert.deepEqual(rankTies(gallery), []);
    assert.equal(planPhotosCopy(gallery, spec).present, k + 1);
  }
  assert.equal(planPhotosCopy(gallery, spec).status, "would-finish");

  const kept = gallery.filter((p) => p.listing_image_id !== spec.placeholder);
  const compacted = byRank(kept).map((p, i) => ({ ...p, rank: i + 1 }));
  for (const after of [kept, compacted]) {
    assert.equal(planPhotosCopy(after, spec).status, "already");
    assert.equal(byRank(after)[0].alt_text, spec.frames[0].alt);
  }
});
