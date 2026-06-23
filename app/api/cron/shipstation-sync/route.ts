import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ShipStationClient } from "@/lib/shipstation/client";
import { advanceShipStationSync } from "@/lib/shipstation/sync";

// ShipStation senkronu çok sayfalı API çağrısı yapar; süre limitini uzat.
export const maxDuration = 60;

/**
 * Vercel Cron hedefi. `Authorization: Bearer ${CRON_SECRET}` ile korunur.
 * Anahtarlar tanımlıysa tüm organizasyonların ShipStation verisini günlük
 * tazeler (sipariş/ürün/kargo/gönderi tam çekim ~birkaç çağrı; idempotent).
 * Devam ettirilebilir; bütçe veya oran sınırında durursa sonraki cron sürdürür.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ShipStationClient.isConfigured()) {
    return NextResponse.json({ ok: true, skipped: "shipstation not configured" });
  }

  const admin = createAdminClient();
  const { data: orgs } = await admin.from("organizations").select("id");

  const results: Record<string, unknown> = {};
  for (const o of (orgs ?? []) as { id: string }[]) {
    try {
      results[o.id] = await advanceShipStationSync(o.id, 50_000);
    } catch (e) {
      results[o.id] = { error: e instanceof Error ? e.message : "error" };
    }
  }

  return NextResponse.json({ ok: true, results });
}
