import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBudget,
  recordCronAuthFailure,
  recordCronRun,
} from "@/lib/cron-heartbeat";
import { syncListingVariants } from "@/lib/etsy/variants";

// Envanter gezme birden çok listing çağrısı yapar; süreyi uzat.
export const maxDuration = 60;

/**
 * Etsy varyant senkronu. `Authorization: Bearer ${CRON_SECRET}` ile korunur.
 * Bağlı her org için getListingInventory'yi gezip product_variants'i
 * (SKU↔listing + beden/renk + fiyat/adet) doldurur, ardından ShipStation
 * gramajlarını eşler. Üretimde çalışır (geçerli Etsy token + ETSY_API_SECRET).
 * Manuel de tetiklenebilir: GET /api/cron/etsy-variants (Bearer CRON_SECRET).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    // Zamanlayıcı tetikleyip burada 401 yiyorsa bu SESSİZ kalmamalı: nabız
    // aşağıda, auth'tan SONRA yazılıyor — yani "hiç koşmadı" ile "koştu ve
    // reddedildi" aksi hâlde ayırt edilemez (2026-09-13 vakası).
    await recordCronAuthFailure(createAdminClient(), "/api/cron/etsy-variants", request.headers);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const report = await recordCronRun(admin, "/api/cron/etsy-variants", async () => {
    // En bayat org başa (bkz. createBudget — sabit sıra son org'u aç bırakır).
    const { data: conns, error } = await admin
      .from("etsy_connection")
      .select("org_id, last_sync_at")
      .eq("status", "connected")
      .order("last_sync_at", { ascending: true, nullsFirst: true });
    if (error) throw new Error(`etsy_connection sorgusu: ${error.message}`);

    const results: Record<string, unknown> = {};
    const failed: string[] = [];
    const rows = (conns ?? []) as { org_id: string }[];

    // Bütçe org başına DEĞİL koşu başına (maxDuration 60, 10 sn kapanışa ayrılı).
    const budget = createBudget(50_000);
    const MIN_SLICE_MS = 12_000;
    let processed = 0;

    for (const c of rows) {
      if (!budget.hasRoomFor(MIN_SLICE_MS)) {
        results[c.org_id] = { deferred: "süre bütçesi bitti — sonraki koşuda başa alınacak" };
        continue;
      }
      processed += 1;
      try {
        results[c.org_id] = await syncListingVariants(c.org_id, {
          budgetMs: budget.remainingMs(),
        });
      } catch (e) {
        results[c.org_id] = { error: e instanceof Error ? e.message : "error" };
        failed.push(c.org_id);
      }
    }

    return { targetCount: processed, results, failed };
  });

  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}
