import { strict as assert } from "node:assert";
import test from "node:test";

import { planSeo, rowProblems, type SeoMatrixRow } from "@/lib/etsy/seo-apply";
import before from "@/docs/artifact-studio/seo/2026-11-03-tag-pass/panel-before.json";
import rebuild from "@/docs/artifact-studio/seo/2026-11-03-tag-pass/rebuild-matrix.json";

/**
 * Leander kelime-salatası yeniden kurulumu (ops/seo-apply `?pass=rebuild-2026-11-03`, sahip onayı
 * 2026-11-03). 10 listing: canlı 13 tag ürün adı taşımayan sıfat yığını; yeni set 2026-10-21
 * araştırmalı matris (altın) ya da gümüş üreteci. Başlık aynen; önce hâli panel aynası.
 */
type Row = SeoMatrixRow & { source: string };
type Before = { listings: { id: string; title: string; tags: string[]; status: string }[] };

const NOUN = /ring|bracelet|necklace|anklet|earring|pendant|chain|charm|band|cuff|hoop|stud|signet|evil eye|nazar|brooch|bangle|lariat|jewelry/;
const DEAD_WORDS =
  /\b(gift|gifts|present|anniversary|birthday|valentine|valentines|graduation|him|her|hers|his|unisex|promise|couples|couple|boyfriend|girlfriend|groomsman|groomsmen|bridesmaid|groom|bride|mom|dad|stocking stuffer|good luck|lucky)\b/;
const rows = rebuild as unknown as Row[];
const beforeById = new Map((before as Before).listings.map((l) => [l.id, l]));

test("rebuild-2026-11-03: 10 salata listing, önce = panel, başlık aynen, yeni set ürün adı taşır, ölü sözcük yok", () => {
  assert.equal(rows.length, 10);
  for (const r of rows) {
    const b = beforeById.get(r.id);
    assert.ok(b && b.status === "active", r.id);
    assert.equal(r.current_title, b.title);
    assert.deepEqual(r.current_tags, b.tags);
    assert.equal(r.new_title, r.current_title, `${r.id} başlık değişmez`);
    assert.deepEqual(rowProblems(r), [], r.id);
    assert.ok(r.current_tags.filter((t) => NOUN.test(t)).length <= 4, `${r.id} canlı set salata olmalı`);
    assert.ok(r.new_tags.filter((t) => NOUN.test(t)).length >= 9, `${r.id} yeni set ürün adı taşımalı`);
    assert.equal(new Set(r.new_tags).size, 13);
    const silver = /sterling silver|\b925\b/i.test(r.new_title);
    for (const t of r.new_tags) {
      assert.ok(!DEAD_WORDS.test(t), `${r.id} ölü sözcük: ${t}`);
      assert.ok(t.length <= 20 && /^[a-z0-9 ]+$/.test(t), `${r.id} biçim: ${t}`);
      if (silver) assert.ok(!t.includes("gold"), `${r.id} gümüşte gold: ${t}`);
      else assert.ok(!/silver|sterling|\b925\b/.test(t), `${r.id} altında gümüş: ${t}`);
    }
  }
  const live = { title: rows[0].current_title, tags: rows[0].current_tags, state: "active", sectionId: null };
  assert.equal(planSeo(rows[0], live, new Map()).action, "write");
  assert.equal(planSeo(rows[0], { ...live, tags: rows[0].new_tags }, new Map()).action, "already");
  assert.equal(planSeo(rows[0], { ...live, tags: ["elle"] }, new Map()).action, "skip");
});
