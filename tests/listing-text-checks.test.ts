import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { listingTextChecks, textBaseline, type TextBaseline } from "@/lib/etsy/create-listing";

/**
 * DRAFTS-PUSH VERIFY: TAG VE AÇIKLAMA KIYASI.
 *
 * Vaka 2026-10-07: For Him setinin 3 taslağı Etsy'de 400 aldı (tag'de nokta:
 * "2.5mm gold band"). Verify o gün başlık, varyant, SKU, fiyat, görsel ve
 * kategoriyi kıyaslıyordu ama tag'e hiç bakmıyordu, yani kırılan alan
 * doğrulamanın dışındaydı.
 *
 * Vaka 2026-10-08 (bağımsız inceleme, doğrulandı): Etsy senkronu panel
 * satırının tag ve açıklamasını Etsy'den ezer. İlk sürüm panele karşı
 * kıyaslıyordu, yani senkrondan sonra Etsy'yi kendisiyle kıyaslayıp hep
 * "geçti" diyecekti. Bu testlerin yarısı o yüzden "kıyaslanmadı" ile "geçti"
 * ayrımını korur.
 *
 * Girdi uydurulmadı: tag ve açıklamalar `docs/artifact-studio/him26/catalog.json`
 * (panelde ve Etsy'de duran metnin kaynağı) dosyasından okunur. Etsy tarafı
 * API'nin bilinen davranışıyla taklit edilir: HTML entity kaçışı, `\r\n`, tag sırası.
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
const panel = (it: Item): TextBaseline => ({ source: "panel", tags: it.tags, description: it.description });
const sent = (it: Item, description = it.description): TextBaseline => ({ source: "sent", tags: it.tags, description });
const etsyEscape = (s: string) => s.replace(/'/g, "&#39;").replace(/"/g, "&quot;");

test("katalog girdisi beklenen şekilde: 30 listing, 13 tag, açıklamalarda kaçışlanacak karakter var", () => {
  assert.equal(items.length, 30);
  for (const it of items) assert.equal(it.tags.length, 13, it.id);
  assert.ok(items.some((i) => /['"]/.test(i.description)), "entity yolu sınanmıyor olurdu");
  // Düzeltilen üç tag kataloğa girdi; noktalı tag kalmadı.
  assert.ok(byId("R05").tags.includes("slim gold band"));
  assert.ok(items.every((i) => i.tags.every((t) => !t.includes("."))));
});

test("taban seçimi: gönderim kaydı > senkronsuz panel > mirrored", () => {
  const it = byId("R05");
  const row = { tags: it.tags, description: it.description };
  const snap = { draftTransfer: { status: "created", sent: { tags: ["x"], description: "sent text" } } };
  // Kayıt varsa satır senkronlanmış olsa bile kayıt kazanır.
  assert.deepEqual(textBaseline({ ...row, last_modified_ts: 1790877087, listing_metadata: snap }), {
    source: "sent",
    tags: ["x"],
    description: "sent text",
  });
  assert.equal(textBaseline({ ...row, last_modified_ts: null, listing_metadata: { draftTransfer: { status: "created" } } }).source, "panel");
  assert.equal(textBaseline({ ...row, last_modified_ts: 1790877087, listing_metadata: null }).source, "mirrored");
  // Bozuk kayıt (sent.tags dizi değil) kanıt sayılmaz.
  assert.equal(
    textBaseline({ ...row, last_modified_ts: 1790877087, listing_metadata: { draftTransfer: { sent: { tags: "x", description: "d" } } } }).source,
    "mirrored",
  );
});

test("mirrored: Etsy ne derse desin sonuç null (kıyaslanmadı), asla true değil", () => {
  const it = byId("B06");
  const r = listingTextChecks({ tags: ["anything"], description: "different text" }, { source: "mirrored" });
  assert.equal(r.tags, null);
  assert.equal(r.description, null);
  // Etsy panelle birebir aynı olsa da: senkron sonrası bu "aynı" bir kanıt değildir.
  const same = listingTextChecks({ tags: it.tags, description: it.description }, { source: "mirrored" });
  assert.equal(same.tags, null);
  assert.equal(same.description, null);
});

test("tag: sıra ve büyük/küçük harf farkı eşleşme sayılır (verifyListingSeo anahtarı)", () => {
  for (const it of items) {
    const live = [...it.tags].reverse().map((t, i) => (i % 2 ? t.toUpperCase() : ` ${t}`));
    for (const base of [panel(it), sent(it)]) {
      const r = listingTextChecks({ tags: live, description: null }, base);
      assert.equal(r.tags, true, `${it.id} ${base.source}`);
      assert.deepEqual(r.missingTags, []);
      assert.deepEqual(r.extraTags, []);
    }
  }
});

test("tag: eksik ya da değişmiş tag yakalanır ve adıyla raporlanır", () => {
  const it = byId("R05");
  const missing = listingTextChecks({ tags: it.tags.slice(1) }, sent(it));
  assert.equal(missing.tags, false);
  assert.deepEqual(missing.missingTags, [it.tags[0]]);

  // Eski (Etsy'nin reddettiği) tag canlıda kalmış olsaydı:
  const live = it.tags.map((t) => (t === "slim gold band" ? "2.5mm gold band" : t));
  const swapped = listingTextChecks({ tags: live }, sent(it));
  assert.equal(swapped.tags, false);
  assert.deepEqual(swapped.missingTags, ["slim gold band"]);
  assert.deepEqual(swapped.extraTags, ["2.5mm gold band"]);
});

test("açıklama: Etsy'nin entity kaçışı ve CRLF eşleşmeyi bozmaz (iki tabanda da)", () => {
  for (const it of items) {
    const live = etsyEscape(it.description).replace(/\n/g, "\r\n");
    for (const base of [panel(it), sent(it)]) {
      const r = listingTextChecks({ description: live }, base);
      assert.equal(r.description, true, `${it.id} ${base.source}`);
      assert.equal(r.descriptionDiff, null);
    }
  }
});

test("açıklama, gönderim kaydı: BİREBİR eşitlik; boş satırdan sonra eklenen paragraf reddedilir", () => {
  const it = byId("B06");
  const appended = `${it.description}\n\nSALE: owner appended paragraph`;
  assert.equal(listingTextChecks({ description: appended }, sent(it)).description, false);
  // Kayıt sabit eksen satırlarını zaten içerir: Etsy'de de aynısı varsa geçer.
  const withConstants = `${it.description}\n\nThickness: 1.5mm`;
  assert.equal(listingTextChecks({ description: withConstants }, sent(it, withConstants)).description, true);
});

test("açıklama, panel tabanı: sabit satırlar bilinmediği için boş satırdan sonraki ek kabul, yapışık ek değil", () => {
  const it = byId("B06");
  assert.equal(listingTextChecks({ description: `${it.description}\n\nThickness: 1.5mm` }, panel(it)).description, true);
  assert.equal(listingTextChecks({ description: `${it.description} plus more` }, panel(it)).description, false);
  // Panel açıklaması boşsa create yalnız sabit satırları göndermiş olabilir: kıyas yok.
  const empty = listingTextChecks({ description: "Metal: 14K" }, { source: "panel", tags: it.tags, description: null });
  assert.equal(empty.description, null);
});

test("açıklama, panel tabanı: dahili EON kuyruğu create'te söküldüğü gibi kıyasta da sökülür", () => {
  const it = byId("R09");
  const base: TextBaseline = { source: "panel", tags: it.tags, description: `${it.description}\n\n---\n[EON 12 · internal note]` };
  assert.equal(listingTextChecks({ description: it.description }, base).description, true);
});

test("açıklama: değişen kelime yakalanır, konum ve iki taraf kesiti döner", () => {
  const it = byId("E01");
  const at = it.description.indexOf(" ", 60) + 1;
  const live = `${it.description.slice(0, at)}XX${it.description.slice(at)}`;
  const r = listingTextChecks({ description: live }, sent(it));
  assert.equal(r.description, false);
  assert.ok(r.descriptionDiff);
  assert.equal(r.descriptionDiff.at, at);
  assert.ok(r.descriptionDiff.etsy.includes("XX"));
  assert.ok(!r.descriptionDiff.panel.includes("XX"));
});

test("Etsy cevabı alanı taşımıyorsa sonuç null (kıyaslanmadı), false değil", () => {
  const r = listingTextChecks({}, sent(byId("R01")));
  assert.equal(r.tags, null);
  assert.equal(r.description, null);
});
