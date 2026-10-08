import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { listingTextChecks } from "@/lib/etsy/create-listing";

/**
 * DRAFTS-PUSH VERIFY: TAG VE AÇIKLAMA KIYASI.
 *
 * Vaka 2026-10-07: For Him setinin 3 taslağı Etsy'de 400 aldı (tag'de nokta:
 * "2.5mm gold band"). Verify o gün başlık, varyant, SKU, fiyat, görsel ve
 * kategoriyi kıyaslıyordu ama tag'e hiç bakmıyordu, yani kırılan alan
 * doğrulamanın dışındaydı. Girdi uydurulmadı: tag ve açıklamalar
 * `docs/artifact-studio/him26/catalog.json`'dan (panelde ve Etsy'de duran
 * metnin kaynağı) okunur. Etsy tarafı, API'nin bilinen davranışıyla taklit
 * edilir: HTML entity ile escape (`&#39;`, `&quot;`), `\r\n`, tag sırası.
 */

interface Item {
  id: string;
  tags: string[];
  description: string;
}
const items: Item[] = JSON.parse(
  readFileSync("docs/artifact-studio/him26/catalog.json", "utf8"),
).items;
const byId = (id: string) => {
  const it = items.find((i) => i.id === id);
  assert.ok(it, id);
  return it;
};
const etsyEscape = (s: string) => s.replace(/'/g, "&#39;").replace(/"/g, "&quot;");

test("katalog girdisi beklenen şekilde: 30 listing, 13 tag, açıklamalarda kaçışlanacak karakter var", () => {
  assert.equal(items.length, 30);
  for (const it of items) assert.equal(it.tags.length, 13, it.id);
  assert.ok(items.some((i) => /['"]/.test(i.description)), "entity yolu sınanmıyor olurdu");
  // Düzeltilen üç tag kataloğa girdi; noktalı tag kalmadı.
  assert.ok(byId("R05").tags.includes("slim gold band"));
  assert.ok(items.every((i) => i.tags.every((t) => !t.includes("."))));
});

test("tag: sıra ve büyük/küçük harf farkı eşleşme sayılır (verifyListingSeo anahtarı)", () => {
  for (const it of items) {
    const live = [...it.tags].reverse().map((t, i) => (i % 2 ? t.toUpperCase() : ` ${t}`));
    const r = listingTextChecks({ tags: live, description: null }, it);
    assert.equal(r.tags, true, it.id);
    assert.deepEqual(r.missingTags, []);
    assert.deepEqual(r.extraTags, []);
  }
});

test("tag: eksik ya da değişmiş tag yakalanır ve adıyla raporlanır", () => {
  const it = byId("R05");
  const missing = listingTextChecks({ tags: it.tags.slice(1) }, it);
  assert.equal(missing.tags, false);
  assert.deepEqual(missing.missingTags, [it.tags[0]]);

  // Eski (Etsy'nin reddettiği) tag canlıda kalmış olsaydı:
  const live = it.tags.map((t) => (t === "slim gold band" ? "2.5mm gold band" : t));
  const swapped = listingTextChecks({ tags: live }, it);
  assert.equal(swapped.tags, false);
  assert.deepEqual(swapped.missingTags, ["slim gold band"]);
  assert.deepEqual(swapped.extraTags, ["2.5mm gold band"]);
});

test("açıklama: Etsy'nin entity kaçışı ve CRLF eşleşmeyi bozmaz", () => {
  for (const it of items) {
    const live = etsyEscape(it.description).replace(/\n/g, "\r\n");
    const r = listingTextChecks({ description: live }, { tags: it.tags, description: it.description });
    assert.equal(r.description, true, it.id);
    assert.equal(r.descriptionDiff, null);
  }
});

test("açıklama: create'in sona eklediği sabit eksen satırları kabul edilir, yapışık ek kabul edilmez", () => {
  const it = byId("B06");
  const withConstants = `${it.description}\n\nThickness: 1.5mm`;
  assert.equal(listingTextChecks({ description: withConstants }, it).description, true);
  const glued = `${it.description} plus more`;
  assert.equal(listingTextChecks({ description: glued }, it).description, false);
});

test("açıklama: panelin dahili EON kuyruğu create'te söküldüğü gibi kıyasta da sökülür", () => {
  const it = byId("R09");
  const panel = { tags: it.tags, description: `${it.description}\n\n---\n[EON 12 · internal note]` };
  assert.equal(listingTextChecks({ description: it.description }, panel).description, true);
});

test("açıklama: değişen kelime yakalanır, konum ve iki taraf kesiti döner", () => {
  const it = byId("E01");
  const at = it.description.indexOf(" ", 60) + 1;
  const live = `${it.description.slice(0, at)}XX${it.description.slice(at)}`;
  const r = listingTextChecks({ description: live }, it);
  assert.equal(r.description, false);
  assert.ok(r.descriptionDiff);
  assert.equal(r.descriptionDiff.at, at);
  assert.ok(r.descriptionDiff.etsy.includes("XX"));
  assert.ok(!r.descriptionDiff.panel.includes("XX"));
});

test("Etsy cevabı alanı taşımıyorsa sonuç null (kıyaslanmadı), false değil", () => {
  const r = listingTextChecks({}, byId("R01"));
  assert.equal(r.tags, null);
  assert.equal(r.description, null);
});
