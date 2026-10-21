import { strict as assert } from "node:assert";
import test from "node:test";

import { planSeo, rowProblems, type SeoMatrixRow } from "@/lib/etsy/seo-apply";
import matrix from "@/docs/artifact-studio/seo/2026-10-21-etsy-keyword/data/apply-matrix.json";

/**
 * by Artifact Studio Jewelry matrisi (ops/seo-apply). Satırlar gerçek matristen:
 * 4590695187 "No Section -> Anklets" (Etsy'de shop_section_id null), 4590704340 kare
 * mühür (kişiselleştirme yok, "Engravable" düşürüldü).
 */

const rows = matrix as unknown as SeoMatrixRow[];
const sections = new Map([
  ["Anklets", 1001],
  ["Evil Eye", 1002],
  ["Bracelets", 1003],
]);

test("210 satır, hepsi Etsy kuralına uyar, id tekil", () => {
  assert.equal(rows.length, 210);
  assert.equal(new Set(rows.map((r) => r.id)).size, 210);
  const bad = rows.map((r) => ({ id: r.id, p: rowProblems(r) })).filter((x) => x.p.length);
  assert.deepEqual(bad, []);
});

test("No Section -> X: canlı bölüm null ise taşınır", () => {
  const row = rows.find((r) => r.section_fix === "No Section -> Anklets")!;
  const p = planSeo(row, { title: row.current_title, tags: row.current_tags, state: "active", sectionId: null }, sections);
  assert.equal(p.action, "write");
  if (p.action === "write") assert.deepEqual(p.sectionMove, { from: "No Section", to: "Anklets", toId: 1001 });
});

test("No Section -> X: canlı listing bir bölümdeyse taşınmaz", () => {
  const row = rows.find((r) => r.section_fix === "No Section -> Anklets")!;
  const p = planSeo(row, { title: row.current_title, tags: row.current_tags, state: "active", sectionId: 1003 }, sections);
  assert.equal(p.action, "write");
  if (p.action === "write") {
    assert.equal(p.sectionMove, null);
    assert.match(p.sectionNote ?? "", /taşınmadı/);
  }
});

test("kişiselleştirmesiz mühürler gravür vaat etmez", () => {
  for (const id of ["4590704340", "4590691861"]) {
    const row = rows.find((r) => r.id === id)!;
    assert.doesNotMatch(row.new_title, /engrav/i);
    assert.ok(!row.new_tags.some((t) => /engrav|custom/.test(t)), id);
  }
});
