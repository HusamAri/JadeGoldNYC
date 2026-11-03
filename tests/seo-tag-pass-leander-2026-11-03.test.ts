import { strict as assert } from "node:assert";
import test from "node:test";

import { planSeo, rowProblems, sameTags, type SeoMatrixRow } from "@/lib/etsy/seo-apply";
import before from "@/docs/artifact-studio/seo/2026-11-03-tag-pass/panel-before.json";
import pass from "@/docs/artifact-studio/seo/2026-11-03-tag-pass/apply-matrix.json";
import prev22 from "@/docs/artifact-studio/seo/2026-10-22-title-pass/apply-matrix.json";

/**
 * Leander (by Artifact Studio Jewelry) tag geçişi
 * (ops/seo-apply `?org=by Artifact Studio Jewelry&pass=tags-2026-11-03`). Yalnız ölü hediye /
 * occasion / his-her / unisex slotları ve kelime-kümesi kopyaları değişir; başlık ve diğer tag'ler
 * panel aynasındaki (2026-11-03 19:34 UTC) hâliyle birebir kalır. "Önce" hâli canlıdan farklıysa
 * planSeo listing'i live-changed sayıp atlar. Üreteç + kapı: scripts/seo/tag_pass_leander_2026_11_03.py.
 */

type Row = SeoMatrixRow & { replaced: string[]; added: string[]; noun: string | null; karats: string[]; colors: string[] };
type Before = {
  listings: { id: string; title: string; tags: string[]; status: string; karats: string[]; colors: string[] }[];
};

const DEAD_WORDS =
  /\b(gift|gifts|present|anniversary|birthday|valentine|valentines|graduation|him|her|hers|his|unisex|promise|couples|couple|boyfriend|girlfriend|groomsman|groomsmen|bridesmaid|groom|bride|mom|dad|stocking stuffer|good luck|lucky)\b/;
const VIBE_WORDS =
  /\b(minimalist|dainty|everyday|luxury|elegant|classic|modern|simple|timeless|boho|trendy|chic|statement|delicate|unique|handmade|artisan|real|genuine|authentic|christmas|holiday)\b/;
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

test("Leander tags-2026-11-03: önce = panel aynası, başlık aynen, yalnız ölü slot ve kopya değişir, Etsy kuralı", () => {
  assert.ok(rows.length >= 110 && rows.length <= 140, `satır ${rows.length}`);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, "tekil id");
  for (const r of rows) {
    const b = beforeById.get(r.id);
    assert.ok(b, r.id);
    assert.equal(b.status, "active", `${r.id} yalnız aktif`);
    assert.equal(r.current_title, b.title, r.id);
    assert.deepEqual(r.current_tags, b.tags, r.id);
    assert.equal(r.new_title, r.current_title, `${r.id} başlık değişmez`);
    // 2026-10-22 yazımından sonra elle düzenlenmiş listing matriste olamaz (sahibin tezgâhı).
    if (title22.has(r.id)) assert.equal(r.current_title, title22.get(r.id), `${r.id} başlık 10-22 yazımı değil`);
    assert.doesNotMatch(r.current_title, /sterling silver|\b925\b/i, `${r.id} gümüş bu geçişte yok`);
    assert.equal(r.section_fix, null);
    assert.deepEqual(rowProblems(r), [], r.id);
    assert.ok(r.replaced.length >= 1 && r.replaced.length === r.added.length, `${r.id} replaced/added`);
    for (const x of r.replaced) {
      const copy = r.current_tags.filter((y) => wset(y) === wset(x)).length > 1;
      assert.ok(DEAD_WORDS.test(x.toLowerCase()) || copy, `${r.id} ölü olmayan tag değişmiş: ${x}`);
    }
    const dead = new Set(r.replaced.map((t) => t.toLowerCase()));
    const keptOld = r.current_tags.filter((t) => !dead.has(t.toLowerCase()));
    const keptNew = r.new_tags.filter((t) => !r.added.includes(t));
    assert.deepEqual(keptNew, keptOld, `${r.id} korunan tag'ler sırasıyla birebir`);
    assert.ok(r.new_tags.every((t) => !DEAD_WORDS.test(t.toLowerCase())), `${r.id} ölü tag kaldı`);
    assert.equal(new Set(r.new_tags.map(wset)).size, 13, `${r.id} kelime kümesi tekrarı`);
    const tl = r.new_title.toLowerCase();
    const mens = /\bmen'?s\b|\bfor men\b|\bmale\b/.test(tl);
    const ks = b.karats.length ? b.karats : Array.from(new Set(Array.from(tl.matchAll(/\b(10|14|18)k\b/g), (m) => m[1])));
    for (const a of r.added) {
      assert.ok(!DEAD_WORDS.test(a) && !VIBE_WORDS.test(a), `${r.id} ölü/his sözcük: ${a}`);
      assert.ok(a.length <= 20 && /^[a-z0-9 ]+$/.test(a), `${r.id} biçim: ${a}`);
      if (a.includes("white")) assert.ok(b.colors.includes("white"), `${r.id} beyaz satılmıyor: ${a}`);
      if (a.includes("rose")) assert.ok(b.colors.includes("rose"), `${r.id} rose satılmıyor: ${a}`);
      const k = /^(10|14|18)k /.exec(a);
      if (k) assert.ok(ks.includes(k[1]), `${r.id} satılmayan ayar ${a} (panel ${ks.join("/")})`);
      assert.ok(!/silver|sterling/.test(a), `${r.id} altın listing'de gümüş tag: ${a}`);
      if (/\bmens\b| men$/.test(a)) assert.ok(mens, `${r.id} başlık erkek demiyor: ${a}`);
      if (a.includes("evil eye")) assert.match(tl, /evil eye/, `${r.id} evil eye değil: ${a}`);
      if (r.noun && /anklet|bracelet|necklace|earrings|ring|pendant/.test(a)) {
        // Eklenen tag'in ürün adı listing'in kendi ürünü olmalı (09-23 dersi: eksen ürün tipiyle tutarlı).
        const nounIn = a.replace(/s$/, "");
        if (/(anklet|bracelet|necklace|earring|pendant)$/.test(nounIn)) {
          const n = /(anklet|bracelet|necklace|earring|pendant)$/.exec(nounIn)![1];
          assert.ok(r.noun.startsWith(n), `${r.id} ürün adı uyumsuz: ${a} (noun ${r.noun})`);
        }
      }
    }
  }
});

test("Leander tags-2026-11-03: Noel/kış, taslak, gümüş ve ölü slotu olmayan listing matriste yok", () => {
  const ids = new Set(rows.map((r) => r.id));
  for (const l of (before as Before).listings) {
    const seasonal = /christmas|xmas|holiday|snowflake|pinecone|holly|wreath|mistletoe|poinsettia|candy cane|reindeer|ornament|bauble|santa|gingerbread|stocking|nutcracker|sleigh|advent|bethlehem|garland|\bwinter\b|frost|icicle|evergreen|fir tree|spruce|\bbow\b|ribbon/i.test(l.title) || l.tags.some((t) => /christmas|holiday|xmas/.test(t));
    const silver = /sterling silver|\b925\b/i.test(l.title);
    const dead = l.tags.some((t) => DEAD_WORDS.test(t.toLowerCase()));
    if (l.status !== "active" || seasonal || silver || l.tags.length === 0) {
      assert.ok(!ids.has(l.id), `${l.id} kapsam dışı olmalı: ${l.title}`);
    }
    if (!dead && new Set(l.tags.map(wset)).size === l.tags.length) {
      assert.ok(!ids.has(l.id), `${l.id} ölü slotu yok, matriste olmamalı: ${l.title}`);
    }
  }
});

test("Leander tags-2026-11-03: canlı = önce ise yalnız tag yazılır; zaten yeni ise dokunulmaz; elle değişmişse atlanır", () => {
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
  assert.equal(planSeo(r, { ...live, state: "draft" }, new Map()).action, "skip");
});
