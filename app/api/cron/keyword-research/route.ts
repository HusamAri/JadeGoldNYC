import { NextResponse } from "next/server";

import { advanceKeywordResearch } from "@/lib/etsy/keyword-research";
import { refreshAllCompetitorPrices } from "@/lib/etsy/competitor-watch";

// Bir grupta ~40-55 listing × Etsy araması yapılır; süre limitini uzat.
export const maxDuration = 60;

/**
 * Vercel Cron hedefi — günlük. Listingler 7 gruba bölünmüştür; bugünün grubu
 * (yılın günü % 7) işlenir → her listing 7 günde bir tazelenir.
 * `Authorization: Bearer ${CRON_SECRET}` ile korunur. Etsy bağlı değilse inert.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Yılın günü → 7 günde bir aynı grup döner.
  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000);
  const group = dayOfYear % 7;

  // Rakip seti fiyatları ÖNCE tazelenir ki bugünün grubu araştırılırken
  // band taze rakip-seti kayıtlarından kurulabilsin (0091).
  const competitorWatch = await refreshAllCompetitorPrices();

  const results = await advanceKeywordResearch(group);
  return NextResponse.json({ ok: true, group, results, competitorWatch });
}
