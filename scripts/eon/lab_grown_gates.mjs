/**
 * EON lab-grown listing paketlerinin ortak metin kapıları (01 DSP, 02 VB6 ...).
 *
 * Her üreteç DB'ye yazmadan önce bunu koşar. Kapılar:
 *  - başlık <15 kelime, ≤140 kr, yalnız satılan ayar (14K Gold), 10K/18K yok;
 *  - 13 tag, ≤20 kr, küçük harf, kelime-kümesi tekrarı yok, occasion sözcüğü yok (03-seo 2026-11-02);
 *  - FTC §23.25: "diamond" yalnız lab niteleyicisinin HEMEN ardından (ya da "mined diamonds"
 *    karşılaştırmasında); "lab diamond" yetersiz;
 *  - görsel/AI beyanı yok (sahip kuralı 2026-10-27/31; panelin publicTextProblem kapısı ayrıca koşulur).
 */
import assert from "node:assert/strict";

export const UNQUALIFIED_DIAMOND =
  /(?<!\blab grown )(?<!\blab-grown )(?<!\blaboratory-grown )(?<!\blab created )(?<!\bmined )\bdiamonds?\b/i;

const DEAD = /\b(gift|anniversary|promise|his|hers|him|her|unisex|minimalist|christmas)\b/;

const wset = (t) =>
  t.toLowerCase().split(/\s+/).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w)).sort().join(" ");

export function checkListingText(L) {
  const words = L.title.trim().split(/\s+/);
  assert(words.length < 15, `başlık ${words.length} kelime`);
  assert(L.title.length <= 140, "başlık 140 kr");
  assert(/\b14K Gold\b/.test(L.title) && !/\b1[08]K\b/.test(L.title), "başlıkta yalnız satılan ayar: 14K");
  assert.equal(L.tags.length, 13);
  assert.equal(new Set(L.tags.map(wset)).size, 13, "tag kelime-kümesi tekrarı");
  for (const t of L.tags) {
    assert(t.length <= 20 && /^[a-z0-9' ]+$/.test(t), `tag biçimi: ${t}`);
    assert(!DEAD.test(t), `occasion sözcüğü: ${t}`);
  }
  for (const [k, text] of Object.entries({
    title: L.title,
    description: L.description,
    tags: L.tags.join("\n"),
    materials: L.materials.join("\n"),
  })) {
    const m = UNQUALIFIED_DIAMOND.exec(text);
    assert(
      !m,
      `${k}: niteliksiz "diamond" @${m?.index}: …${text.slice(Math.max(0, (m?.index ?? 0) - 40), (m?.index ?? 0) + 12)}…`,
    );
  }
  assert(!/\blab diamond\b/i.test(L.description + L.title + L.tags.join(" ")), '"lab diamond" yetersiz niteleyici');
  assert(!/\bAI\b|\brender|\bvisuali[sz]ation|ABOUT THE IMAGES/i.test(L.description), "görsel yokken görsel beyanı yazılmaz");
}
