import { strict as assert } from "node:assert";
import test from "node:test";

import { planSeo, rowProblems, sameTags, type SeoMatrixRow } from "@/lib/etsy/seo-apply";
import before from "@/docs/eon/seo/2026-11-02-tag-pass/panel-before.json";
import pass from "@/docs/eon/seo/2026-11-02-tag-pass/apply-matrix.json";
import prev22 from "@/docs/eon/seo/2026-10-22-title-pass/apply-matrix.json";
import panelKarats from "@/docs/eon/seo/2026-10-22-title-pass/panel-karats.json";

/**
 * EON tag geçişi (ops/seo-apply `?org=EON&pass=tags-2026-11-02`). Alyanslarda yalnız ölü
 * "occasion" slotları değişir; başlık ve diğer tag'ler panel aynasındaki (2026-11-02) hâliyle
 * birebir kalır. "Önce" hâli canlıdan farklıysa planSeo listing'i live-changed sayıp atlar.
 */

type Row = SeoMatrixRow & { replaced: string[]; added: string[]; color: string; karats: string[] };
type Before = { listings: { id: string; title: string; tags: string[] }[] };

const DEAD = new Set(["anniversary gift him", "promise ring for him", "his and hers band", "gift for her gold"]);
const DEAD_WORDS =
  /\b(gift|gifts|present|anniversary|birthday|valentine|christmas|holiday|him|her|hers|his|unisex|promise|couples|groom|bride|minimalist|dainty|everyday|luxury|elegant|classic|modern|simple|timeless|boho|trendy|chic|statement|delicate|unique|handmade|artisan|real|genuine|authentic)\b/;
const wset = (t: string) =>
  t
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .sort()
    .join("|");

const rows = pass as unknown as Row[];
const beforeById = new Map((before as Before).listings.map((l) => [l.id, l]));
const title22 = new Map((prev22 as unknown as SeoMatrixRow[]).map((r) => [r.id, r.new_title]));
const karatsOf = (id: string, title: string): string[] => {
  const pk = (panelKarats as { EON: Record<string, string[]> }).EON[id];
  if (pk?.length) return pk;
  return Array.from(new Set(Array.from(title.matchAll(/\b(10|14|18)k\b/gi), (m) => m[1])));
};

test("EON tags-2026-11-02: önce = panel aynası, başlık aynen, yalnız ölü slot değişir, Etsy kuralı", () => {
  assert.ok(rows.length >= 140 && rows.length <= 160, `satır ${rows.length}`);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, "tekil id");
  for (const r of rows) {
    const b = beforeById.get(r.id);
    assert.ok(b, r.id);
    assert.equal(r.current_title, b.title, r.id);
    assert.deepEqual(r.current_tags, b.tags, r.id);
    assert.equal(r.new_title, r.current_title, `${r.id} başlık değişmez`);
    // 2026-10-22 yazımından sonra elle düzenlenmiş listing matriste olamaz (sahibin tezgâhı).
    assert.equal(r.current_title, title22.get(r.id), `${r.id} başlık 10-22 yazımı değil`);
    assert.equal(r.section_fix, null);
    assert.deepEqual(rowProblems(r), [], r.id);
    assert.ok(r.replaced.length >= 1 && r.replaced.every((t) => DEAD.has(t.toLowerCase())), `${r.id} replaced`);
    assert.equal(r.added.length, r.replaced.length, r.id);
    const keptOld = r.current_tags.filter((t) => !DEAD.has(t.toLowerCase()));
    const keptNew = r.new_tags.filter((t) => !r.added.includes(t));
    assert.deepEqual(keptNew, keptOld, `${r.id} korunan tag'ler sırasıyla birebir`);
    assert.ok(r.new_tags.every((t) => !DEAD.has(t.toLowerCase())), `${r.id} ölü tag kaldı`);
    assert.equal(new Set(r.new_tags.map(wset)).size, 13, `${r.id} kelime kümesi tekrarı`);
    assert.ok(r.new_tags.includes("gold wedding band"), `${r.id} gold wedding band`);
    const ks = karatsOf(r.id, r.new_title);
    for (const a of r.added) {
      assert.ok(!DEAD_WORDS.test(a), `${r.id} ölü sözcük: ${a}`);
      if (a.includes("white")) assert.match(r.new_title, /white gold/i, `${r.id} ${a}`);
      if (a.includes("rose")) assert.match(r.new_title, /rose gold/i, `${r.id} ${a}`);
      const k = /^(10|14|18)k /.exec(a);
      if (k) assert.ok(ks.includes(k[1]), `${r.id} satılmayan ayar ${a} (panel ${ks.join("/")})`);
    }
  }
});

test("EON tags-2026-11-02: Noel/stacking/fidget/sizer ve 0 tag'li listing matriste yok", () => {
  const ids = new Set(rows.map((r) => r.id));
  for (const l of (before as Before).listings) {
    if (l.tags.length === 0 || /stacking|fidget|sizer|christmas/i.test(l.title)) {
      assert.ok(!ids.has(l.id), `${l.id} kapsam dışı olmalı: ${l.title}`);
    }
  }
});

test("EON tags-2026-11-02: canlı = önce ise yalnız tag yazılır; zaten yeni ise dokunulmaz; elle değişmişse atlanır", () => {
  const r = rows[0];
  const live = { title: r.current_title, tags: r.current_tags, state: "active", sectionId: null };
  const p = planSeo(r, live, new Map());
  assert.equal(p.action, "write");
  if (p.action === "write") {
    assert.equal(p.title, null);
    assert.ok(p.tags && sameTags(p.tags, r.new_tags));
    assert.equal(p.sectionMove, null);
  }
  assert.equal(planSeo(r, { ...live, tags: r.new_tags }, new Map()).action, "already");
  assert.equal(planSeo(r, { ...live, tags: [...r.current_tags.slice(0, 12), "elle eklendi"] }, new Map()).action, "skip");
  assert.equal(planSeo(r, { ...live, title: "elle düzenlendi" }, new Map()).action, "skip");
  assert.equal(planSeo(r, { ...live, state: "inactive" }, new Map()).action, "skip");
});
