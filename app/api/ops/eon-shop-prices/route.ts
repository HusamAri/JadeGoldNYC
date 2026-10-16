import { NextResponse } from "next/server";

import { runEonShopPrices } from "@/lib/pricing/eon-shop-price-run";

export const maxDuration = 300;

/**
 * Eon vitrin fiyatı. Varsayılan kuru çalışmadır.
 *
 * apply=1 yazar. listing=<id> tek listeyi dener ve altın tabanını ilerletmez.
 * Offering liste olarak kalır; kasadaki indirim ayrıca yürür.
 * Tek seferlik kesinti canlı fiyattan en fazla %35'tir.
 *
 * Auth: Authorization: Bearer $REPAIR_ONE_SHOT_TOKEN veya $CRON_SECRET.
 */
function authorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const repair = process.env.REPAIR_ONE_SHOT_TOKEN;
  const cron = process.env.CRON_SECRET;
  if (!auth) return false;
  if (repair && repair.length >= 24 && auth === `Bearer ${repair}`) return true;
  return Boolean(cron && auth === `Bearer ${cron}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const listingRaw = url.searchParams.get("listing");
  const listingId = listingRaw ? Number(listingRaw) : undefined;
  if (listingRaw && !Number.isFinite(listingId)) {
    return NextResponse.json({ error: "listing id invalid" }, { status: 400 });
  }
  try {
    const result = await runEonShopPrices({ apply, listingId });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message.slice(0, 500), apply }, { status: 502 });
  }
}
