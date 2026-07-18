import { expandSeedRuleBased } from "@/lib/keywords/rule";
import { expandSeedWithAI } from "@/lib/keywords/ai";
import { enrichKeywords, isDataForSeoConfigured } from "@/lib/keywords/dataforseo";
import { isAIConfigured } from "@/lib/ai";
import type { KeywordCandidate, KeywordResearchInput } from "@/lib/keywords/types";

export interface KeywordResearchResult {
  candidates: KeywordCandidate[];
  sources: {
    ai: boolean;
    demand: boolean;
  };
}

/**
 * Anahtar kelime araştırma orkestrasyonu:
 *  1. Kural motoru (ücretsiz, her zaman) + AI (Gemini varsa) adayları üretir.
 *  2. Tekilleştirir.
 *  3. Talep kaynağı (DataForSEO) bağlıysa hacim/rekabet/CPC ile zenginleştirir.
 *  4. Fırsat skorunu (hacim × (1-rekabet)) yeniden hesaplar; hacim yoksa kural
 *     skoru kalır.
 */
export async function researchKeywords(
  input: KeywordResearchInput,
): Promise<KeywordResearchResult> {
  const [ruleCands, aiCands] = await Promise.all([
    Promise.resolve(expandSeedRuleBased(input)),
    expandSeedWithAI(input),
  ]);

  // Tekilleştir — kural + AI birleşimi (AI kaynağı korunur çakışmada).
  const byKeyword = new Map<string, KeywordCandidate>();
  for (const c of [...aiCands, ...ruleCands]) {
    const key = c.keyword.toLowerCase();
    if (!byKeyword.has(key)) byKeyword.set(key, c);
  }
  let candidates = [...byKeyword.values()];

  // Talep verisiyle zenginleştir (bağlıysa).
  const demand = isDataForSeoConfigured();
  if (demand) {
    const metrics = await enrichKeywords(candidates.map((c) => c.keyword));
    candidates = candidates.map((c) => {
      const m = metrics.get(c.keyword.toLowerCase());
      if (!m) return c;
      const searchVolume = m.searchVolume;
      const competition = m.competition;
      const score =
        searchVolume != null
          ? Math.round(searchVolume * (1 - (competition ?? 0)))
          : c.score;
      return {
        ...c,
        searchVolume,
        competition,
        cpcCents: m.cpcCents,
        score,
      };
    });
  }

  // Hacim varsa hacme, yoksa kural skoruna göre sırala.
  candidates.sort((a, b) => {
    if (a.searchVolume != null || b.searchVolume != null) {
      return (b.searchVolume ?? -1) - (a.searchVolume ?? -1);
    }
    return b.score - a.score;
  });

  return {
    candidates: candidates.slice(0, 50),
    sources: { ai: isAIConfigured(), demand },
  };
}
