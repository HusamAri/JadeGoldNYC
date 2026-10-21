import { strict as assert } from "node:assert";
import test from "node:test";

import { planSeo, rowProblems, type SeoMatrixRow } from "@/lib/etsy/seo-apply";
import matrix from "@/docs/eon/seo/2026-10-21-etsy-keyword/data/optimization-matrix.json";

/**
 * ops/seo-apply karar kuralı. Satır gerçek matristen (Tideline rose, 4595912155):
 * canlı başlık matrisin "önce" hâliyse yazılır, sahip elle değiştirdiyse atlanır.
 */

const rows = matrix as unknown as SeoMatrixRow[];
const row = rows.find((r) => r.id === "4595912155")!;
const sections = new Map([
  ["Flat Wedding Bands", 59433965],
  ["Satin Wedding Bands", 59815975],
]);
const before = { title: row.current_title, tags: row.current_tags, state: "active", sectionId: 59433965 };

test("matrisin tüm satırları Etsy kuralına uyar", () => {
  const bad = rows.map((r) => ({ id: r.id, p: rowProblems(r) })).filter((x) => x.p.length);
  assert.deepEqual(bad, []);
  assert.equal(rows.length, 185);
});

test("canlı = önce hâli: başlık + tag + bölüm yazılır", () => {
  const p = planSeo(row, before, sections);
  assert.equal(p.action, "write");
  if (p.action !== "write") return;
  assert.equal(p.title, row.new_title);
  assert.deepEqual(p.tags, row.new_tags);
  assert.deepEqual(p.sectionMove, { from: "Flat Wedding Bands", to: "Satin Wedding Bands", toId: 59815975 });
});

test("sahip başlığı elle değiştirdiyse atlanır", () => {
  const p = planSeo(row, { ...before, title: "Owner edited title" }, sections);
  assert.equal(p.action, "skip");
  if (p.action === "skip") assert.equal(p.reason, "live-changed");
});

test("tag sırası ve büyük harf fark sayılmaz", () => {
  const tags = [...row.current_tags].reverse().map((t) => t.toUpperCase());
  assert.equal(planSeo(row, { ...before, tags }, sections).action, "write");
});

test("zaten uygulanmışsa yazılmaz (ikinci koşu no-op)", () => {
  const p = planSeo(row, { title: row.new_title, tags: row.new_tags, state: "active", sectionId: 59815975 }, sections);
  assert.equal(p.action, "already");
});

test("canlı bölüm matrisin önce bölümü değilse bölüm taşınmaz", () => {
  const p = planSeo(row, { ...before, sectionId: 123 }, sections);
  assert.equal(p.action, "write");
  if (p.action === "write") {
    assert.equal(p.sectionMove, null);
    assert.match(p.sectionNote ?? "", /taşınmadı/);
  }
});

test("aktif olmayan listing atlanır", () => {
  assert.equal(planSeo(row, { ...before, state: "draft" }, sections).action, "skip");
});
