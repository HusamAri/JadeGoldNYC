import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBudget,
  recordCronAuthFailure,
  recordCronRun,
} from "@/lib/cron-heartbeat";
import { advanceEtsySync } from "@/lib/etsy/sync";
import { rebuildGoldCostsBulk } from "@/lib/gold-cost-entry";

// Etsy senkronu birden çok sayfalı API çağrısı yapar; süre limitini uzat.
export const maxDuration = 60;

/**
 * Vercel Cron hedefi. `Authorization: Bearer ${CRON_SECRET}` ile korunur.
 * Bağlı organizasyonların Etsy verisini senkronize eder.
 *
 * SÜRE: bütçe org başına değil KOŞU başına (~50 sn; `maxDuration` 60). Org'lar
 * en bayattan (`last_sync_at` artan) işlenir ve bütçe biterse kalanlar ertelenir
 * — devam ettirilebilir senkron bir sonraki koşuda kaldığı yerden sürer, ertelenen
 * org da o koşuda en bayat olduğu için başa geçer. Eski hâli her org'a sabit
 * 50 sn veriyordu ve üçüncü org'a sıra gelmeden fonksiyon 504 ile ölüyordu.
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
      .select("org_id, sync_status, sync_updated_at")
      .eq("status", "connected");
    if (error) throw new Error(`etsy_connection sorgusu: ${error.message}`);

    const results: Record<string, unknown> = {};
    const failed: string[] = [];
    const rows = (conns ?? []) as {
      org_id: string;
      sync_status: string | null;
      sync_updated_at: string | null;
    }[];

    // SIRA — iki kademeli, ve `last_sync_at` BİLEREK kullanılmıyor:
    //
    // İlk denemede sıralama `last_sync_at`e göreydi ve İŞE YARAMADI (2026-09-13):
    // o alan koşunun BAŞLADIĞI anı damgalıyor, verinin tazeliğini değil. 504 ile
    // ölen koşu sıra kendisine gelmeden Ophir'in damgasını ilerletmişti; sonuç:
    // verisi 29 Ağustos'ta kalmış org "az önce senkronlandı" görünüp yine sona
    // düştü — yani açlık sürüyordu.
    //
    // Doğru sinyal `sync_status`: senkron devam ettirilebilir olduğu için yarıda
    // kesilen org `running` olarak kalır (Ophir: phase `listings_all`). Yarım iş
    // ÖNCE bitirilir, sonra en bayat ilerleme (`sync_updated_at`) gelir.
    rows.sort((a, b) => {
      const aOpen = a.sync_status === "done" ? 1 : 0;
      const bOpen = b.sync_status === "done" ? 1 : 0;
      if (aOpen !== bOpen) return aOpen - bOpen;
      const at = a.sync_updated_at ? Date.parse(a.sync_updated_at) : 0;
      const bt = b.sync_updated_at ? Date.parse(b.sync_updated_at) : 0;
      return at - bt;
    });

    // Bütçe KOŞU başına; maxDuration 60 sn, 10 sn'i kapanış/nabız için ayrılıyor.
    const budget = createBudget(50_000);
    const MIN_SLICE_MS = 12_000;
    const GOLD_COST_RESERVE_MS = 5_000;
    let processed = 0;

    for (const c of rows) {
      // Kalan süre bir org'a yetmiyorsa YENİ İŞ BAŞLATMA: yarıda kesilen çağrı
      // 504 üretir ve kapanış nabzı hiç yazılamaz. Atlanan org bir sonraki
      // koşuda en bayat olduğu için başa geçer.
      if (!budget.hasRoomFor(MIN_SLICE_MS)) {
        results[c.org_id] = { deferred: "süre bütçesi bitti — sonraki koşuda başa alınacak" };
        continue;
      }
      processed += 1;
      try {
        results[c.org_id] = await advanceEtsySync(
          c.org_id,
          budget.remainingMs() - GOLD_COST_RESERVE_MS,
        );
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

    // targetCount = GERÇEKTEN işlenen org; ertelenenler sayılmaz, yoksa
    // "hedef sayısı 0" kapısı ertelemeyi iş sanıp sessizce yeşil gösterirdi.
    return { targetCount: processed, results, failed };
  });

  // Başarısız koşu 5xx döner ki Vercel'in cron panosunda KIRMIZI görünsün.
  // Eskiden her koşu `{ ok: true }` dönüyordu; koşu patlasa bile yeşildi.
  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}

