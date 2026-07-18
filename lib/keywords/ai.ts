import { aiGenerateText, isAIConfigured } from "@/lib/ai";
import type { KeywordCandidate, KeywordResearchInput } from "@/lib/keywords/types";

/**
 * Gemini (lib/ai.ts) ile anahtar kelime GENİŞLETME. Tohum + ürün bağlamından
 * alıcı dilinde long-tail adaylar üretir. AI yapılandırılmamışsa boş döner
 * (çağıran yalnız kural adaylarıyla devam eder). Metrik üretmez — hacmi talep
 * kaynağı (DataForSEO) sağlar; buradaki skor geçici (kural benzeri).
 */
export async function expandSeedWithAI(
  input: KeywordResearchInput,
): Promise<KeywordCandidate[]> {
  if (!isAIConfigured()) return [];
  const seed = (input.seed || input.productTitle || "").trim();
  if (!seed) return [];

  const system =
    "You are an Etsy SEO keyword strategist. Return ONLY a JSON array of " +
    "15 long-tail buyer-intent search phrases (2-5 words, lowercase, no # or " +
    "quotes) that shoppers type to find this product. No commentary.";
  const prompt =
    `Product / seed: "${seed}"` +
    (input.productTags?.length
      ? `\nExisting tags: ${input.productTags.join(", ")}`
      : "") +
    `\nReturn a JSON array of strings only.`;

  try {
    const text = await aiGenerateText({
      prompt,
      system,
      maxOutputTokens: 512,
    });
    const parsed = parseKeywordList(text);
    return parsed.slice(0, 15).map<KeywordCandidate>((keyword) => ({
      keyword,
      source: "ai",
      searchVolume: null,
      competition: null,
      cpcCents: null,
      score: 60, // AI adayları için nötr taban; talep verisi gelince güncellenir
    }));
  } catch (e) {
    console.error("expandSeedWithAI hatası:", e instanceof Error ? e.message : e);
    return [];
  }
}

/** Modelin döndürdüğü metinden anahtar kelime listesini güvenle ayrıştırır. */
function parseKeywordList(text: string): string[] {
  const clean = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  try {
    const arr = JSON.parse(clean);
    if (Array.isArray(arr)) {
      return arr
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.toLowerCase().replace(/[#"']/g, "").trim())
        .filter(Boolean);
    }
  } catch {
    // JSON değilse satır bazlı ayrıştır (madde işaretleri/numaralar).
  }
  return clean
    .split("\n")
    .map((l) => l.replace(/^[\s\-*\d.)]+/, "").replace(/[#"']/g, "").trim().toLowerCase())
    .filter((l) => l.length >= 3 && l.length <= 60);
}
