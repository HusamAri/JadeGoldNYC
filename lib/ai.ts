import { generateText } from "ai";

/**
 * Vercel AI Gateway sarmalayıcısı.
 *
 * Yapılandırma:
 *  - Local geliştirme: `.env.local` içinde `AI_GATEWAY_API_KEY`
 *  - Vercel (prod): deploy sonrası `VERCEL_OIDC_TOKEN` otomatik enjekte edilir,
 *    ayrı bir anahtara gerek kalmaz.
 *
 * Anahtar/token girilene kadar bu modül **inert**'tir (Etsy deseni gibi): çağrı
 * yapılırsa `AINotConfiguredError` fırlatır, böylece UI zarifçe geri çekilebilir.
 *
 * Model "<sağlayıcı>/<model>" slug'ıyla geçilir ve doğrudan AI Gateway'e gider;
 * ayrı bir sağlayıcı paketi (`@ai-sdk/...`) gerekmez.
 */

/** Varsayılan gateway modeli. `AI_MODEL` env'i ile değiştirilebilir. */
export const DEFAULT_AI_MODEL =
  process.env.AI_MODEL ?? "anthropic/claude-sonnet-4.6";

/** AI yapılandırıldı mı? (local anahtar veya Vercel OIDC token). */
export function isAIConfigured(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
  );
}

export class AINotConfiguredError extends Error {
  constructor() {
    super(
      "AI Gateway yapılandırılmamış — local için AI_GATEWAY_API_KEY, Vercel'de VERCEL_OIDC_TOKEN gerekir.",
    );
    this.name = "AINotConfiguredError";
  }
}

/**
 * Tek seferlik metin üretimi (AI Gateway üzerinden).
 * Yapılandırılmamışsa `AINotConfiguredError` fırlatır.
 */
export async function aiGenerateText(opts: {
  prompt: string;
  system?: string;
  model?: string;
  maxOutputTokens?: number;
}): Promise<string> {
  if (!isAIConfigured()) throw new AINotConfiguredError();
  const { text } = await generateText({
    model: opts.model ?? DEFAULT_AI_MODEL,
    system: opts.system,
    prompt: opts.prompt,
    maxOutputTokens: opts.maxOutputTokens ?? 1024,
  });
  return text;
}
