import { strict as assert } from "node:assert";
import test from "node:test";

import { planSeo, rowProblems, sameTags, type SeoMatrixRow } from "@/lib/etsy/seo-apply";
import eonPrev from "@/docs/eon/seo/2026-10-21-etsy-keyword/data/optimization-matrix.json";
import basPrev from "@/docs/artifact-studio/seo/2026-10-21-etsy-keyword/data/apply-matrix.json";
import eonPass from "@/docs/eon/seo/2026-10-22-title-pass/apply-matrix.json";
import basPass from "@/docs/artifact-studio/seo/2026-10-22-title-pass/apply-matrix.json";

/**
 * Kısa başlık geçişi (ops/seo-apply `?pass=titles-2026-10-22`). "Önce" hâli, 2026-10-21
 * matrisinin YAZDIĞI hâl olmalı; aksi hâlde planSeo her listing'i live-changed sayıp atlar.
 */

const sets = [
  { name: "EON", prev: eonPrev as unknown as SeoMatrixRow[], pass: eonPass as unknown as SeoMatrixRow[], n: 185 },
  { name: "Artifact", prev: basPrev as unknown as SeoMatrixRow[], pass: basPass as unknown as SeoMatrixRow[], n: 210 },
];

for (const { name, prev, pass, n } of sets) {
  test(`${name}: ${n} satır, önce = 10-21 yazımı, tag'e dokunulmaz, Etsy kuralı`, () => {
    assert.equal(pass.length, n);
    const byId = new Map(prev.map((r) => [r.id, r]));
    for (const r of pass) {
      const p = byId.get(r.id)!;
      assert.ok(p, r.id);
      assert.equal(r.current_title, p.new_title, r.id);
      assert.ok(sameTags(r.current_tags, p.new_tags) && sameTags(r.new_tags, p.new_tags), r.id);
      assert.equal(r.section_fix, null);
      assert.deepEqual(rowProblems(r), [], r.id);
      assert.ok(r.new_title.replace(/,/g, " ").split(/\s+/).filter(Boolean).length < 15, r.new_title);
    }
    assert.equal(new Set(pass.map((r) => r.new_title)).size, n, "kardeş başlık tekil");
  });

  test(`${name}: canlı = 10-21 yazımı ise yalnız başlık yazılır; zaten yeni ise dokunulmaz`, () => {
    const r = pass[0];
    const live = { title: r.current_title, tags: r.current_tags, state: "active", sectionId: null };
    const p = planSeo(r, live, new Map());
    assert.equal(p.action, "write");
    if (p.action === "write") {
      assert.equal(p.title, r.new_title);
      assert.equal(p.tags, null);
      assert.equal(p.sectionMove, null);
    }
    assert.equal(planSeo(r, { ...live, title: r.new_title }, new Map()).action, "already");
    assert.equal(planSeo(r, { ...live, title: "elle düzenlendi" }, new Map()).action, "skip");
  });
}
