import { NextResponse } from "next/server";

import { runGoldReprice } from "@/lib/pricing/gold-reprice-run";

export const maxDuration = 300;

/**
 * Altın-endeksli fiyat güncellemesi — gözetimli ops rotası.
 *
 * Varsayılan KURU ÇALIŞMA: hiçbir şey yazmaz, hedefleri ve oranları raporlar.
 *
 * Parametreler:
 *  - `apply=1`    gerçek uygulama (Etsy PUT + read-back + panel + yeni taban)
 *  - `spot=4250`  canlı kaynak yerine elle spot (mantık kapısından yine geçer)
 *  - `org=eon|jade`  tek org'a daralt
 *  - `listing=<id>`  tek listing'de dene (taban İLERLETİLMEZ — kanıt koşusu)
 *  - `force=1`    deadband/max-step kapılarını insan onayıyla aş
 *
 * Auth: `Authorization: Bearer $CRON_SECRET`.
 * Çalıştırma sırası (runbook): önce kuru → tek listing apply → tam apply.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const force = url.searchParams.get("force") === "1";
  const orgFilter = url.searchParams.get("org") ?? undefined;
  const listingRaw = url.searchParams.get("listing");
  const spotRaw = url.searchParams.get("spot");

  try {
    const out = await runGoldReprice({
      apply,
      force,
      orgFilter,
      listingFilter: listingRaw ? Number(listingRaw) : undefined,
      spotOverride: spotRaw ? Number(spotRaw) : undefined,
    });
    return NextResponse.json({ apply, ...out });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
