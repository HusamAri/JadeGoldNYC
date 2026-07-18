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

export function expandSeedRuleBased(
  input: KeywordResearchInput,
): KeywordCandidate[] {
  const seed = norm(input.seed || input.productTitle || "");
  if (!seed) return [];

  const out = new Set<string>();
  out.add(seed);

  // Tohum + tek modifikatör kombinasyonları (long-tail).
  for (const m of MODIFIERS.material) out.add(`${m} ${seed}`);
  for (const a of MODIFIERS.audience) out.add(`${seed} ${a}`);
  for (const o of MODIFIERS.occasion) out.add(`${seed} ${o}`);
  for (const s of MODIFIERS.style) out.add(`${s} ${seed}`);

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
