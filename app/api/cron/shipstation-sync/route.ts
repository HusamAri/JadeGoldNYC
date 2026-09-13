import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordCronAuthFailure, recordCronRun } from "@/lib/cron-heartbeat";
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
    // Zamanlayıcı tetikleyip burada 401 yiyorsa bu SESSİZ kalmamalı: nabız
    // aşağıda, auth'tan SONRA yazılıyor — yani "hiç koşmadı" ile "koştu ve
    // reddedildi" aksi hâlde ayırt edilemez (2026-09-13 vakası).
    await recordCronAuthFailure(createAdminClient(), "/api/cron/shipstation-sync", request.headers);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();

  const report = await recordCronRun(admin, "/api/cron/shipstation-sync", async () => {
    const { data: orgs, error } = await admin.from("organizations").select("id");
    if (error) throw new Error(`organizations sorgusu: ${error.message}`);

    const results: Record<string, unknown> = {};
    const failed: string[] = [];
    // HEDEF = yapılandırılmış org. Yapılandırılmamışlar atlanır ve hedef
    // SAYILMAZ: hepsi atlanırsa `targetCount` 0 olur ve koşu başarısız
    // işaretlenir. Kasıtlı — vercel.json'da tanımlı ama her gün hiçbir şey
    // yapmayan bir cron, sessiz bir kusurdur: ya yapılandırma kopmuştur ya da
    // kaydın kaldırılması gerekir. İkisi de görünmeli.
    let configured = 0;

    for (const o of ((orgs ?? []) as { id: string }[])) {
      // Platform: kimlik bilgisi org-bazlı (env yalnız geriye dönük uyumluluk).
      if (!(await ShipStationClient.isConfiguredForOrg(admin, o.id))) {
        results[o.id] = { skipped: "not configured" };
        continue;
      }
      configured += 1;
      try {
        results[o.id] = await advanceShipStationSync(o.id, 50_000);
      } catch (e) {
        results[o.id] = { error: e instanceof Error ? e.message : "error" };
        failed.push(o.id);
      }
    }

    return { targetCount: configured, results, failed };
  });

  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}
