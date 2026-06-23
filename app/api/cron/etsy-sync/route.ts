import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { advanceEtsySync } from "@/lib/etsy/sync";

// Etsy senkronu birden çok sayfalı API çağrısı yapar; süre limitini uzat.
export const maxDuration = 60;

/**
 * Vercel Cron hedefi. `Authorization: Bearer ${CRON_SECRET}` ile korunur.
 * Bağlı tüm organizasyonların Etsy verisini senkronize eder. Devam ettirilebilir
 * senkronu ~50sn bütçeyle ilerletir; tamamlanmadıysa bir sonraki cron (veya
 * kullanıcı) kaldığı yerden sürdürür.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: conns } = await admin
    .from("etsy_connection")
    .select("org_id")
    .eq("status", "connected");

  const results: Record<string, unknown> = {};
  for (const c of (conns ?? []) as { org_id: string }[]) {
    try {
      results[c.org_id] = await advanceEtsySync(c.org_id, 50_000);
    } catch (e) {
      results[c.org_id] = {
        error: e instanceof Error ? e.message : "error",
      };
    }
  }

  return NextResponse.json({ ok: true, results });
}

