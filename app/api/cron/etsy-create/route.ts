import { NextResponse } from "next/server";

import { advanceEtsyCreate } from "@/lib/etsy/create-listing";

// Ürün başına 1 POST + (varyantlıda) 1 PUT + (görselli) 1 multipart yapılır;
// istekler arası 500ms bekleme var → süre limitini uzat.
export const maxDuration = 60;

/**
 * Etsy draft listing oluşturma cron'u. `Authorization: Bearer ${CRON_SECRET}`
 * ile korunur. status='connected' her org için onaylı (featured_rank dolu,
 * etsy_listing_id boş) taslakları Etsy'de draft listing'e çevirir. İdempotent:
 * oluşturulmuş ürün atlanır. Manuel de tetiklenebilir: GET /api/cron/etsy-create
 * (Bearer CRON_SECRET). Loop, aynı işi advanceEtsyCreate(orgId?, limit?) ile de
 * doğrudan çağırabilir.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await advanceEtsyCreate();
  return NextResponse.json({ ok: true, results });
}
