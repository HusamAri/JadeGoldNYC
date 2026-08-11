import { NextRequest, NextResponse } from "next/server";

import { getMembership } from "@/lib/auth";
import {
  runSearchGrounding,
  runMapsGrounding,
  runHighThinkingAnalysis,
  analyzeJewelryImage,
  runFastLiteAssist,
  FEATURE_COST_CATALOG,
  getGenAIClient,
} from "@/lib/gemini-advanced";

export async function POST(req: NextRequest) {
  // Ücretli Gemini çağrısı — yalnız oturum açmış org üyesi tetikleyebilir
  // (anahtar bütçesi anonim istekle yakılamaz). API rotası redirect değil
  // 401 JSON döner; sayfa zaten (dashboard) kapısının arkasında.
  const membership = await getMembership();
  if (!membership) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, prompt, systemInstruction, imageBase64, mimeType, userLocation, contextData } = body;

    if (!action) {
      return NextResponse.json({ error: "Eylem (action) belirtilmedi." }, { status: 400 });
    }

    switch (action) {
      case "search_grounding": {
        if (!prompt) return NextResponse.json({ error: "İstem (prompt) gerekli." }, { status: 400 });
        const res = await runSearchGrounding(prompt, systemInstruction);
        return NextResponse.json(res);
      }

      case "maps_grounding": {
        if (!prompt) return NextResponse.json({ error: "İstem (prompt) gerekli." }, { status: 400 });
        const res = await runMapsGrounding(prompt, userLocation);
        return NextResponse.json(res);
      }

      case "high_thinking": {
        if (!prompt) return NextResponse.json({ error: "İstem (prompt) gerekli." }, { status: 400 });
        const res = await runHighThinkingAnalysis(prompt, contextData);
        return NextResponse.json(res);
      }

      case "image_understanding": {
        if (!imageBase64) return NextResponse.json({ error: "Görsel verisi (imageBase64) gerekli." }, { status: 400 });
        const res = await analyzeJewelryImage(imageBase64, mimeType || "image/jpeg", prompt);
        return NextResponse.json(res);
      }

      case "fast_lite": {
        if (!prompt) return NextResponse.json({ error: "İstem (prompt) gerekli." }, { status: 400 });
        const res = await runFastLiteAssist(prompt);
        return NextResponse.json(res);
      }

      case "general_flash": {
        if (!prompt) return NextResponse.json({ error: "İstem (prompt) gerekli." }, { status: 400 });
        const ai = getGenAIClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || "Sen Jade Gold NYC e-ticaret asistanısın.",
          },
        });
        return NextResponse.json({
          text: response.text ?? "",
          cost: FEATURE_COST_CATALOG.general_flash,
        });
      }

      default:
        return NextResponse.json({ error: `Geçersiz eylem: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("AI Intelligence Route Error:", error);
    const errMessage = error instanceof Error ? error.message : "Gemini AI işlemi sırasında bir hata oluştu.";
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
