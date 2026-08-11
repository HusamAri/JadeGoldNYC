import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { FEATURE_COST_CATALOG, CostEstimate } from "./ai-cost-catalog";
export { FEATURE_COST_CATALOG, type CostEstimate };

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

export function getGenAIClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY veya GOOGLE_GENERATIVE_AI_API_KEY tanımlanmamış. AI Studio'dan API anahtarınızı ekleyin."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * 1. Search Grounding - gemini-3.5-flash with googleSearch tool
 */
export async function runSearchGrounding(prompt: string, systemInstruction?: string) {
  const ai = getGenAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || "Sen Jade Gold NYC mücevher markası için canlı pazar ve trend araştırmacısısın.",
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? "";
  const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries ?? [];

  return {
    text,
    searchChunks,
    searchQueries,
    cost: FEATURE_COST_CATALOG.search_grounding,
  };
}

/**
 * 2. Maps Grounding - gemini-3.5-flash with googleMaps tool
 */
export async function runMapsGrounding(prompt: string, userLocation?: { latitude: number; longitude: number }) {
  const ai = getGenAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "Sen Jade Gold NYC için lokasyon, rakip mağazalar ve tedarikçi harita danışmanısın.",
      tools: [{ googleMaps: {} }],
      ...(userLocation
        ? {
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
              },
            },
          }
        : {}),
    },
  });

  const text = response.text ?? "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  return {
    text,
    groundingChunks,
    cost: FEATURE_COST_CATALOG.maps_grounding,
  };
}

/**
 * 3. High Thinking Mode - gemini-3.1-pro-preview with HIGH thinkingLevel
 * Note: Do NOT set maxOutputTokens when using thinking mode
 */
export async function runHighThinkingAnalysis(prompt: string, contextData?: string) {
  const ai = getGenAIClient();
  const fullPrompt = contextData
    ? `BAGLAM VERISI:\n${contextData}\n\nANALIZ ISTEMI:\n${prompt}`
    : prompt;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: fullPrompt,
    config: {
      systemInstruction:
        "Sen Jade Gold NYC'nin Baş Stratejisti ve Finans Analistisin. Altın ons piyasası, marjlar, Etsy sıralama algoritmaları ve mağaza büyümesi için derin mantıksal yürütmeyle yanıt ver.",
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
    },
  });

  return {
    text: response.text ?? "",
    cost: FEATURE_COST_CATALOG.high_thinking,
  };
}

/**
 * 4. Image Understanding - gemini-3.1-pro-preview multimodal
 */
export async function analyzeJewelryImage(imageBase64: string, mimeType: string, prompt?: string) {
  const ai = getGenAIClient();
  const defaultPrompt =
    prompt ||
    "Bu mücevher/ürün görselini incele. Şunları değerlendir:\n1. Ürün kalitesi ve işçilik görünümü\n2. Işık, arka plan ve Etsy listing görsel standartlarına uyum\n3. Varsa 10K/14K ayar damgası, taş yuvası veya zincir detayları\n4. İyileştirme önerileri.";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
      {
        text: defaultPrompt,
      },
    ],
  });

  return {
    text: response.text ?? "",
    cost: FEATURE_COST_CATALOG.image_understanding,
  };
}

/**
 * 5. Fast Lite Assistant - gemini-3.1-flash-lite
 */
export async function runFastLiteAssist(prompt: string) {
  const ai = getGenAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      systemInstruction: "Sen ultra hızlı Etsy etiket, başlık ve SEO yardımcı asistanısın.",
    },
  });

  return {
    text: response.text ?? "",
    cost: FEATURE_COST_CATALOG.fast_lite,
  };
}
