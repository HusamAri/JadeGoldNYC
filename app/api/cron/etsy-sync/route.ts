import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordCronAuthFailure, recordCronRun } from "@/lib/cron-heartbeat";
import { advanceEtsySync } from "@/lib/etsy/sync";
import { rebuildGoldCostsBulk } from "@/lib/gold-cost-entry";

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
    // Zamanlayıcı tetikleyip burada 401 yiyorsa bu SESSİZ kalmamalı: nabız
    // aşağıda, auth'tan SONRA yazılıyor — yani "hiç koşmadı" ile "koştu ve
    // reddedildi" aksi hâlde ayırt edilemez (2026-09-13 vakası).
    await recordCronAuthFailure(createAdminClient(), "/api/cron/etsy-sync", request.headers);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const report = await recordCronRun(admin, "/api/cron/etsy-sync", async () => {
    // Bağlantı sorgusunun hatası YUTULMAZ: düşerse `conns` null gelir, döngü
    // hiç dönmez ve iş "sorunsuz" görünürdü — tam olarak sessiz kusur.
    const { data: conns, error } = await admin
      .from("etsy_connection")
      .select("org_id")
      .eq("status", "connected");
    if (error) throw new Error(`etsy_connection sorgusu: ${error.message}`);

    const results: Record<string, unknown> = {};
    const failed: string[] = [];
    const rows = (conns ?? []) as { org_id: string }[];

    for (const c of rows) {
      try {
        results[c.org_id] = await advanceEtsySync(c.org_id, 50_000);
      } catch (e) {
        results[c.org_id] = { error: e instanceof Error ? e.message : "error" };
        failed.push(c.org_id);
      }

      // Altın maliyet kalemlerini eksik satışlar için oluştur (küme-tabanlı RPC,
      // idempotent; SKU→varyant ağırlığı girildikçe kendiliğinden dolar).
      // Senkronun yan işi: burada patlaması koşuyu başarısız SAYMAZ, ama artık
      // sessizce yutulmuyor, sonuca yazılıyor.
      try {
        await rebuildGoldCostsBulk(admin, c.org_id);
      } catch (e) {
        results[`${c.org_id}:gold-cost`] = {
          warning: e instanceof Error ? e.message : "error",
        };
      }
    }

    return { targetCount: rows.length, results, failed };
  });

  // Başarısız koşu 5xx döner ki Vercel'in cron panosunda KIRMIZI görünsün.
  // Eskiden her koşu `{ ok: true }` dönüyordu; koşu patlasa bile yeşildi.
  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}

