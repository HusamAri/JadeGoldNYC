import { NextResponse } from "next/server";

import { evaluateRepriceRules } from "@/lib/etsy/reprice";

// Kural başına en çok 1 envanter GET + 1 PUT yapılır; süre limitini uzat.
export const maxDuration = 60;

/**
 * Vercel Cron hedefi — günlük 10:00 UTC (rakip araştırması cron'u 09:00'da
 * taze anlık görüntüyü yazdıktan SONRA çalışır). Aktif reprice kurallarını
 * tüm org'lar için değerlendirir: mode='otomatik' + varyantsız listing'de
 * Etsy fiyatı güncellenir, aksi halde öneri loglanır (reprice_log).
 * `Authorization: Bearer ${CRON_SECRET}` ile korunur; kural yoksa inert.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await evaluateRepriceRules();
  return NextResponse.json({ ok: true, results });
}
