import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { syncSales, syncListings, syncReviews } from "@/lib/etsy/sync";

/**
 * Vercel Cron hedefi. `Authorization: Bearer ${CRON_SECRET}` ile korunur.
 * Bağlı tüm organizasyonların Etsy verisini senkronize eder.
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
      const r = await syncSales(c.org_id);
      await syncListings(c.org_id);
      await syncReviews(c.org_id);
      results[c.org_id] = r;
    } catch (e) {
      results[c.org_id] = {
        error: e instanceof Error ? e.message : "error",
      };
    }
  }

  return NextResponse.json({ ok: true, results });
}
