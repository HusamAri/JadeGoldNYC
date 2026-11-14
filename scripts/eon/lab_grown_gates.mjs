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

/**
 * 05 HEP (taş seçimli bant, 2026-11-11): seçeneklerde DOĞAL taşlar da var (salt and pepper, siyah). FTC'de
 * niteliksiz "diamond" zaten doğal demektir; bu hattın kapısı yine her "diamond"ı açık bir niteleyiciyle ister,
 * yalnız "natural" da kabul edilir. Yalnız `allowNatural` ile açılır; diğer paketlerin kapısı değişmez.
 */
export const UNQUALIFIED_DIAMOND_ALLOW_NATURAL =
  /(?<!\blab grown )(?<!\blab-grown )(?<!\blaboratory-grown )(?<!\blab created )(?<!\bmined )(?<!\bnatural )(?<!\bnatural black )(?<!\bnatural salt and pepper )\bdiamonds?\b/i;

const DEAD = /\b(gift|anniversary|promise|his|hers|him|her|unisex|minimalist|christmas)\b/;

const wset = (t) =>
  t.toLowerCase().split(/\s+/).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w)).sort().join(" ");

export function checkListingText(L, { allowNatural = false, karats = null } = {}) {
  const unqualified = allowNatural ? UNQUALIFIED_DIAMOND_ALLOW_NATURAL : UNQUALIFIED_DIAMOND;
  const words = L.title.trim().split(/\s+/);
  assert(words.length < 15, `başlık ${words.length} kelime`);
  assert(L.title.length <= 140, "başlık 140 kr");
  if (!karats) {
    assert(/\b14K Gold\b/.test(L.title) && !/\b1[08]K\b/.test(L.title), "başlıkta yalnız satılan ayar: 14K");
  } else {
    // 07 TMC9 (ayar eksenli, 2026-11-13): satılan ayarların HEPSİ, sırayla ve "Gold"un hemen önünde (FTC §23.3);
    // satılmayan ayar başlıkta yok. Seçenek verilmeyen paketlerin kapısı değişmez.
    assert(new RegExp(`\\b${karats.join(" ")} Gold\\b`).test(L.title), `başlıkta "${karats.join(" ")} Gold" yok`);
    const named = L.title.match(/\b\d{1,2}K\b/g) ?? [];
    assert.deepEqual(named, karats, `başlıktaki ayarlar satılanla aynı değil: ${named}`);
  }
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
    const m = unqualified.exec(text);
    assert(
      !m,
      `${k}: niteliksiz "diamond" @${m?.index}: …${text.slice(Math.max(0, (m?.index ?? 0) - 40), (m?.index ?? 0) + 12)}…`,
    );
  }
  assert(!/\blab diamond\b/i.test(L.description + L.title + L.tags.join(" ")), '"lab diamond" yetersiz niteleyici');
  assert(!/\bAI\b|\brender|\bvisuali[sz]ation|ABOUT THE IMAGES/i.test(L.description), "görsel yokken görsel beyanı yazılmaz");
}
