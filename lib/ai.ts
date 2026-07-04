import { generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * AI metin üretimi sarmalayıcısı — iki sağlayıcı destekler:
 *
 *  1. **Google Gemini** (ücretsiz kota): `GOOGLE_GENERATIVE_AI_API_KEY`
 *     (veya `GEMINI_API_KEY`) tanımlıysa ÖNCELİKLİ kullanılır. Anahtarı
 *     https://aistudio.google.com adresinden ücretsiz alabilirsiniz.
 *  2. **Vercel AI Gateway**: Gemini anahtarı yoksa devreye girer.
 *     - Local: `.env.local` içinde `AI_GATEWAY_API_KEY`
 *     - Vercel (prod): `VERCEL_OIDC_TOKEN` otomatik enjekte edilir.
 *
 * Hiçbiri yoksa modül **inert**'tir (Etsy deseni gibi): çağrı yapılırsa
 * `AINotConfiguredError` fırlatır, böylece UI zarifçe geri çekilebilir.
 *
 * Model, `AI_MODEL` env'i ile değiştirilebilir. Gemini yolunda değer bir Gemini
 * model kimliği olmalı (ör. "gemini-2.5-flash"); gateway yolunda
 * "<sağlayıcı>/<model>" slug'ı (ör. "anthropic/claude-sonnet-4.6").
 */

const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
const GATEWAY_DEFAULT_MODEL = "anthropic/claude-sonnet-4.6";

/** Geriye dönük uyum için dışa aktarılan varsayılan (gateway) model. */
export const DEFAULT_AI_MODEL = process.env.AI_MODEL ?? GATEWAY_DEFAULT_MODEL;

function geminiApiKey(): string | undefined {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  );
}

function gatewayConfigured(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
  );
}

/** AI yapılandırıldı mı? (Gemini anahtarı veya AI Gateway). */
export function isAIConfigured(): boolean {
  return Boolean(geminiApiKey()) || gatewayConfigured();
}

export class AINotConfiguredError extends Error {
  constructor() {
    super(
      "AI yapılandırılmamış — Gemini için GOOGLE_GENERATIVE_AI_API_KEY " +
        "(aistudio.google.com'dan ücretsiz), ya da AI Gateway için " +
        "AI_GATEWAY_API_KEY (Vercel'de otomatik) gerekir.",
    );
    this.name = "AINotConfiguredError";
  }
}

/**
 * Çağrı için model çözer. Gemini anahtarı varsa Gemini sağlayıcısını, yoksa
 * AI Gateway model slug'ını döndürür. `explicit` yalnız gateway yolunda
 * kullanılır; Gemini yolunda `AI_MODEL` (slug değilse) ya da varsayılan geçerli.
 */
function resolveModel(explicit?: string): LanguageModel {
  const key = geminiApiKey();
  if (key) {
    const google = createGoogleGenerativeAI({ apiKey: key });
    const configured = process.env.AI_MODEL;
    // AI_MODEL bir gateway slug'ıysa (içinde "/") Gemini için kullanma.
    const modelId =
      configured && !configured.includes("/")
        ? configured
        : GEMINI_DEFAULT_MODEL;
    return google(modelId);
  }
  return explicit ?? process.env.AI_MODEL ?? GATEWAY_DEFAULT_MODEL;
}

/**
 * Tek seferlik metin üretimi. Yapılandırılmamışsa `AINotConfiguredError`
 * fırlatır.
 */
export async function aiGenerateText(opts: {
  prompt: string;
  system?: string;
  model?: string;
  maxOutputTokens?: number;
}): Promise<string> {
  if (!isAIConfigured()) throw new AINotConfiguredError();
  const { text } = await generateText({
    model: resolveModel(opts.model),
    system: opts.system,
    prompt: opts.prompt,
    maxOutputTokens: opts.maxOutputTokens ?? 1024,
  });
  return text;
}
