import { NextResponse } from "next/server";

import { runGoldReprice } from "@/lib/pricing/gold-reprice-run";

export const maxDuration = 300;

/**
 * Günlük altın-endeks cron'u (04:30 UTC — 06:00 Etsy senkronundan ÖNCE, ki
 * senkron aynı sabah yeni fiyatları aynalasın).
 *
 * Kapılar çekirdekte: |Δ| < %1 → no-op (deadband), |Δ| > %10 → uygulamaz ve
 * `blocked-max-step` raporlar (insan ops rotasından force ile onaylar).
 * Spot iki bağımsız kaynaktan çapraz doğrulanır; doğrulanamazsa hiçbir şey
 * yazılmaz. Uyarı Merkezi sinyali audit log üzerinden okunur.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const out = await runGoldReprice({ apply: true });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
