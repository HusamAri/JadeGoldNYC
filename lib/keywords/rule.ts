import type { KeywordCandidate, KeywordResearchInput } from "@/lib/keywords/types";

/**
 * Ücretsiz kural motoru — dış API/anahtar GEREKMEZ. Tohum + ürün bağlamından
 * long-tail aday anahtar kelimeler türetir (alıcı dili modifikatörleri). Gerçek
 * arama hacmi yok; skor uzunluk/özgüllük sezgiseline dayanır (talep kaynağı
 * bağlanınca gerçek hacimle güncellenir).
 */

const MODIFIERS = {
  material: ["14k gold", "solid gold", "gold filled", "sterling silver", "18k gold"],
  audience: ["for women", "for men", "for her", "for him"],
  occasion: [
    "gift",
    "birthday gift",
    "anniversary gift",
    "wedding",
    "valentines gift",
    "christmas gift",
  ],
  style: ["dainty", "minimalist", "chunky", "vintage", "personalized", "handmade"],
} as const;

const STOP = new Set(["the", "a", "an", "and", "for", "with", "of", "in"]);

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Uzunluk/özgüllük sezgisel skoru (0..100) — long-tail'i ödüllendirir. */
function ruleScore(keyword: string): number {
  const words = keyword.split(" ").filter((w) => w && !STOP.has(w)).length;
  // 3-5 kelimelik long-tail en yüksek; tek kelime düşük.
  const lenScore = Math.max(0, Math.min(1, (words - 1) / 4)); // 1..5 kelime → 0..1
  const hasModifier =
    /(gold|silver|gift|women|men|dainty|minimalist|personalized|handmade|vintage)/.test(
      keyword,
    );
  const base = 40 + lenScore * 40 + (hasModifier ? 20 : 0);
  return Math.round(Math.min(100, base));
}

/** Modifikatörü tohumun üzerine ekler; tohumda zaten geçen kelimeleri
 *  tekrarlamaz. Örtüşme sonrası anlamsız kalıntı (tek "filled" gibi) oluşursa
 *  o adayı atlar (null). Örnek: seed="gold cuban chain" + "14k gold" →
 *  "14k gold cuban chain"; + "gold filled" → "gold filled cuban chain"
 *  (kalan "filled" seed'in başına değil, doğal sırada yeniden kurulur). */
function combine(
  modifier: string,
  seed: string,
  position: "before" | "after",
): string | null {
  const seedWords = new Set(seed.split(" "));
  const modWords = modifier.split(" ").filter(Boolean);
  const unique = modWords.filter((w) => !seedWords.has(w));
  if (unique.length === 0) return null;
  // Malzeme gibi çok-kelimeli modifikatörlerde kısmi örtüşme varsa doğal
  // sırayı koru: benzersiz kelime(ler) + seed (ör. "filled" + "gold cuban…"
  // yerine "gold filled" kelime sırasını seed'e enjekte et).
  if (unique.length < modWords.length && position === "before") {
    // Modifikatör kelimelerini seed'in metal kelimesinin önüne/arkasına yerleştirmek
    // yerine: benzersiz kısımları seed başına ekle (14k → "14k gold cuban chain").
    // "gold filled" → unique=["filled"] → "filled gold cuban chain" kötü;
    // bu durumda "gold filled" ifadesini seed'deki "gold"ın yerine koy.
    if (modWords.includes("gold") && seedWords.has("gold")) {
      return seed.replace(/\bgold\b/, modifier); // "gold cuban…" → "gold filled cuban…"
    }
    if (modWords.includes("silver") && seedWords.has("silver")) {
      return seed.replace(/\bsilver\b/, modifier);
    }
  }
  return position === "before"
    ? `${unique.join(" ")} ${seed}`
    : `${seed} ${unique.join(" ")}`;
}

export function expandSeedRuleBased(
  input: KeywordResearchInput,
): KeywordCandidate[] {
  const seed = norm(input.seed || input.productTitle || "");
  if (!seed) return [];

  const out = new Set<string>();
  out.add(seed);

  // Tohum + tek modifikatör kombinasyonları (long-tail); örtüşen kelimeler atılır.
  // Malzeme: tohumda zaten bir metal varsa (gold/silver) karşıt metal ekleme.
  const seedHasGold = /\bgold\b/.test(seed);
  const seedHasSilver = /\bsilver\b/.test(seed);
  for (const m of MODIFIERS.material) {
    if (seedHasGold && /\bsilver\b/.test(m)) continue;
    if (seedHasSilver && /\bgold\b/.test(m)) continue;
    const c = combine(m, seed, "before");
    if (c) out.add(c);
  }
  for (const a of MODIFIERS.audience) {
    const c = combine(a, seed, "after");
    if (c) out.add(c);
  }
  for (const o of MODIFIERS.occasion) {
    const c = combine(o, seed, "after");
    if (c) out.add(c);
  }
  for (const s of MODIFIERS.style) {
    const c = combine(s, seed, "before");
    if (c) out.add(c);
  }

  // Ürün etiketlerini de tohumla harmanla (varsa) — mağazaya özgü diller.
  for (const t of input.productTags ?? []) {
    const nt = norm(t);
    if (nt && nt !== seed) out.add(nt);
  }

  return [...out]
    .map((k) => k.replace(/\s+/g, " ").trim())
    .filter((k) => k.length >= 3 && k.length <= 60)
    .map<KeywordCandidate>((keyword) => ({
      keyword,
      source: "rule",
      searchVolume: null,
      competition: null,
      cpcCents: null,
      score: ruleScore(keyword),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
}
