"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { pushListingPrices } from "@/lib/etsy/inventory";
import {
  getPricingConfig,
  toEngineConfig,
  type PricingConfigRow,
} from "@/lib/pricing-engine/config";
import { buildPricingDiff, type PricingRunRow } from "@/lib/pricing-engine/run";

/**
 * FAZ 5 — fiyat panele geri dönüyor, ama KURALLI.
 *
 * Kalıcı kurallar (bayrak kalksa da geçerli):
 *   1. Etsy'ye programlı/gözetimsiz yazma YOK — onayı insan verir.
 *   2. Elle yazılan fiyat YOK — her fiyat motor fonksiyonundan türer.
 *   3. Her itişin ÖNÜNDE yetkili kuru-çalıştırma farkı durur.
 *   4. Her itiş audit_log'a yazılır.
 *
 * Bu dosyada fiyat kabul eden HİÇBİR parametre yoktur; tek girdi spot'tur.
 */

/** İtiş turunun süre bütçesi (sayfa maxDuration 300sn, pay bırakılır). */
const PUSH_BUDGET_MS = 240_000;

export interface PricingActionResult {
  ok?: boolean;
  error?: string;
  runId?: string;
}

export interface DryRunResult extends PricingActionResult {
  total?: number;
  changed?: number;
  unchanged?: number;
  belowFloor?: number;
  unknown?: number;
  rows?: PricingRunRow[];
  spot?: number;
}

/**
 * 5a + 5b — TEK KOL: spot. Verilen spot ile her varyantı kendi gramından,
 * saflığından, genişlik çarpanından ve işçilik sınıfından yeniden hesaplar;
 * canlı Etsy fiyatıyla karşılaştırıp farkı `pricing_runs`'a yazar.
 *
 * Fiyat yazılmaz — yalnız fark üretilir. İtiş için ayrı ve açık bir onay şart.
 */
export async function createPricingDryRun(
  spotInput: string,
  productId?: string,
): Promise<DryRunResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const spot = Number(String(spotInput).trim().replace(",", "."));
  if (!Number.isFinite(spot) || spot <= 0) {
    return { error: "Spot pozitif bir sayı olmalı (USD/troy ons)." };
  }

  const admin = createAdminClient();
  const cfg = await getPricingConfig(m.org_id);
  const engineCfg = toEngineConfig(cfg);

  let diff;
  try {
    diff = await buildPricingDiff(m.org_id, spot, engineCfg, { productId });
  } catch (e) {
    return {
      error:
        e instanceof EtsyNotConnectedError
          ? "Etsy bağlantısı yok — Ayarlar'dan bağlanın."
          : e instanceof Error
            ? e.message
            : String(e),
    };
  }
  if (diff.total === 0) {
    return { error: "Kapsamda varyant bulunamadı." };
  }

  // Bekleyen eski kuru çalıştırmaları kapat: onay ekranında tek güncel fark
  // dursun, kullanıcı yanlışlıkla bayat bir farkı onaylamasın.
  await admin
    .from("pricing_runs")
    .update({ status: "cancelled" })
    .eq("org_id", m.org_id)
    .eq("status", "dry_run");

  const { data, error } = await admin
    .from("pricing_runs")
    .insert({
      org_id: m.org_id,
      status: "dry_run",
      spot_usd_per_ozt: spot,
      config: engineCfg,
      product_id: productId ?? null,
      rows: diff.rows,
      total_rows: diff.total,
      changed_rows: diff.changed,
      below_floor_rows: diff.belowFloor,
      unknown_rows: diff.unknown,
      created_by: m.user_id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/fiyat");
  return {
    ok: true,
    runId: (data as { id: string }).id,
    total: diff.total,
    changed: diff.changed,
    unchanged: diff.unchanged,
    belowFloor: diff.belowFloor,
    unknown: diff.unknown,
    spot,
    rows: diff.rows,
  };
}

export interface ApproveResult extends PricingActionResult {
  updated?: number;
  skipped?: number;
  errors?: number;
  listings?: number;
}

/**
 * 5c + 5d — TEK ONAY, TEK İTİŞ.
 *
 * Eşzamanlılık: `pricing_runs`ta org başına yalnız BİR satır aynı anda
 * approved/running olabilir (kısmi tekil indeks, migration 0126). Onayı
 * koşullu UPDATE (compare-and-swap) tüketir: `status = 'dry_run'` iken
 * 'approved'a çevrilir. Çift tıklamada ikinci UPDATE 0 satır etkiler ve
 * ikinci itiş HİÇ başlamaz. v3 itişindeki üç-tıklama yarışının bir daha
 * mümkün olmaması için uygulama ve veritabanı katmanı birlikte kilitler.
 *
 * Zemin kuralı: farkta zemin altı satır varsa onay REDDEDİLİR. Kullanıcı o
 * satırları hariç tutmadan (yeniden kuru çalıştırma) itiş yapılamaz.
 */
export async function approvePricingRun(runId: string): Promise<ApproveResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();
  const { data: runData, error: runErr } = await admin
    .from("pricing_runs")
    .select("id, status, spot_usd_per_ozt, rows, below_floor_rows")
    .eq("id", runId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (runErr) return { error: runErr.message };
  const run = runData as {
    id: string;
    status: string;
    spot_usd_per_ozt: string | number;
    rows: PricingRunRow[];
    below_floor_rows: number;
  } | null;
  if (!run) return { error: "Kuru çalıştırma bulunamadı." };
  if (run.status !== "dry_run") {
    return {
      error: `Bu kuru çalıştırma onaylanabilir durumda değil (${run.status}).`,
    };
  }
  if (run.below_floor_rows > 0) {
    return {
      error:
        `Farkta ${run.below_floor_rows} satır zeminin ALTINDA — onaylanamaz. ` +
        "O satırları kapsamdan çıkarıp kuru çalıştırmayı yenileyin.",
    };
  }

  // KİLİT: koşullu UPDATE. Aynı anda ikinci bir onay 0 satır etkiler.
  const { data: claimed, error: claimErr } = await admin
    .from("pricing_runs")
    .update({
      status: "approved",
      approved_by: m.user_id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .eq("org_id", m.org_id)
    .eq("status", "dry_run")
    .select("id");
  if (claimErr) {
    // Kısmi tekil indeks ihlali = org'da zaten koşan bir itiş var.
    return {
      error:
        "Bu org'da hâlihazırda onaylı/koşan bir fiyat itişi var — bitmesini bekleyin.",
    };
  }
  if (!claimed || claimed.length === 0) {
    return { error: "Onay başka bir oturumda tüketildi — itiş başlatılmadı." };
  }

  const rows = (run.rows ?? []).filter(
    (r) => r.status === "changed" && r.newCents != null,
  );
  if (rows.length === 0) {
    await admin
      .from("pricing_runs")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        updated_rows: 0,
      })
      .eq("id", runId);
    return { ok: true, updated: 0, skipped: 0, errors: 0, listings: 0 };
  }

  await admin.from("pricing_runs").update({ status: "running" }).eq("id", runId);

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    await admin
      .from("pricing_runs")
      .update({
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
    return { error: e instanceof Error ? e.message : String(e) };
  }

  // Listing başına grupla: envanter PUT'u listing seviyesindedir.
  const bySku = new Map<number, Map<string, number>>();
  for (const r of rows) {
    if (!bySku.has(r.listingId)) bySku.set(r.listingId, new Map());
    bySku.get(r.listingId)!.set(r.sku, r.newCents!);
  }

  const deadline = Date.now() + PUSH_BUDGET_MS;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let listings = 0;
  const hatalar: { listingId: number; error: string }[] = [];

  for (const [listingId, priceBySku] of bySku) {
    if (Date.now() > deadline) break;
    const out = await pushListingPrices(client, listingId, priceBySku);
    listings++;
    if (out.status === "updated") updated += out.changed;
    else if (out.status === "unchanged") skipped += priceBySku.size;
    else {
      errors += priceBySku.size;
      hatalar.push({ listingId, error: out.detail ?? "bilinmeyen hata" });
    }
  }

  await admin
    .from("pricing_runs")
    .update({
      status: errors > 0 && updated === 0 ? "failed" : "done",
      updated_rows: updated,
      skipped_rows: skipped,
      error_rows: errors,
      error: hatalar.length ? JSON.stringify(hatalar).slice(0, 2000) : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  await logAudit(admin, {
    orgId: m.org_id,
    action: "etsy.reprice",
    entityType: "shop",
    entityId: runId,
    summary:
      `Fiyat itişi onaylandı ve uygulandı (spot ${Number(run.spot_usd_per_ozt)} $/ozt): ` +
      `${listings} listing · ${updated} varyant güncellendi · ${skipped} zaten aynı` +
      `${errors ? ` · ${errors} hata` : ""}. Tam fark: pricing_runs/${runId}.`,
    diff: {
      run_id: runId,
      spot_usd_per_ozt: Number(run.spot_usd_per_ozt),
      total_rows: run.rows?.length ?? 0,
      push_rows: rows.length,
      listings,
      updated,
      skipped,
      errors,
      failures: hatalar,
    },
    source: "app",
  });

  revalidatePath("/fiyat");
  return { ok: true, updated, skipped, errors, listings, runId };
}

export interface ConfigInput {
  fireFactor: string;
  laborUsd: string;
  laborHandfinishedUsd: string;
  packagingUsd: string;
  shippingUsd: string;
  multiplierNarrow: string;
  multiplierWide: string;
  wideBandMinMm: string;
  saleRate: string;
}

/**
 * 5a — AYAR ekranı. İşçilik, paket, kargo, fire ve iki çarpan yalnız buradan
 * değişir; her değişiklik audit_log'a ESKİ→YENİ olarak yazılır. Fiyat alanı
 * YOKTUR: burada değişen şey girdilerdir, çıktı hep motordan gelir.
 */
export async function updatePricingConfig(
  input: ConfigInput,
): Promise<PricingActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const parse = (s: string, ad: string): number | string => {
    const n = Number(String(s).trim().replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return `${ad} sayı olmalı.`;
    return n;
  };
  const alanlar: [keyof ConfigInput, string, string][] = [
    ["fireFactor", "fire_factor", "Fire çarpanı"],
    ["laborUsd", "labor_usd", "İşçilik"],
    ["laborHandfinishedUsd", "labor_handfinished_usd", "El işçiliği"],
    ["packagingUsd", "packaging_usd", "Paketleme"],
    ["shippingUsd", "shipping_usd", "Kargo payı"],
    ["multiplierNarrow", "multiplier_narrow", "Dar bant çarpanı"],
    ["multiplierWide", "multiplier_wide", "Geniş bant çarpanı"],
    ["wideBandMinMm", "wide_band_min_mm", "Geniş bant eşiği"],
    ["saleRate", "sale_rate", "Vitrin indirimi oranı"],
  ];
  const yeni: Record<string, number> = {};
  for (const [key, kolon, ad] of alanlar) {
    const v = parse(input[key], ad);
    if (typeof v === "string") return { error: v };
    yeni[kolon] = v;
  }
  if (yeni.sale_rate <= 0 || yeni.sale_rate > 1) {
    return { error: "Vitrin indirimi oranı 0 ile 1 arasında olmalı." };
  }
  if (yeni.fire_factor <= 0 || yeni.multiplier_narrow <= 0 || yeni.multiplier_wide <= 0) {
    return { error: "Fire ve çarpanlar sıfırdan büyük olmalı." };
  }

  const admin = createAdminClient();
  const eski: PricingConfigRow = await getPricingConfig(m.org_id);

  const { error } = await admin.from("pricing_config").upsert(
    {
      org_id: m.org_id,
      // Spot AYAR DEĞİLDİR — bu ekrandan değişmez, mevcut değeri korunur.
      spot_usd_per_ozt: eski.spotUsdPerOzt,
      ...yeni,
      updated_at: new Date().toISOString(),
      updated_by: m.user_id,
    },
    { onConflict: "org_id" },
  );
  if (error) return { error: error.message };

  await logAudit(admin, {
    orgId: m.org_id,
    action: "etsy.reprice",
    entityType: "shop",
    summary:
      "Fiyat motoru ayarları güncellendi — bundan sonraki her hesap yeni " +
      "varsayımlarla üretilir (mevcut canlı fiyatlar değişmez; itiş ayrı onay ister).",
    diff: {
      onceki: {
        fire_factor: eski.fireFactor,
        labor_usd: eski.laborUsd,
        labor_handfinished_usd: eski.laborHandfinishedUsd,
        packaging_usd: eski.packagingUsd,
        shipping_usd: eski.shippingUsd,
        multiplier_narrow: eski.multiplierNarrow,
        multiplier_wide: eski.multiplierWide,
        wide_band_min_mm: eski.wideBandMinMm,
        sale_rate: eski.saleRate,
      },
      yeni,
    },
    source: "app",
  });

  revalidatePath("/fiyat");
  return { ok: true };
}

/** Spot'u kalıcı kaydeder (tek kol). Fiyat YAZMAZ — yalnız girdiyi saklar. */
export async function savePricingSpot(
  spotInput: string,
): Promise<PricingActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const spot = Number(String(spotInput).trim().replace(",", "."));
  if (!Number.isFinite(spot) || spot <= 0) {
    return { error: "Spot pozitif bir sayı olmalı (USD/troy ons)." };
  }
  const admin = createAdminClient();
  const eski = await getPricingConfig(m.org_id);
  const { error } = await admin.from("pricing_config").upsert(
    {
      org_id: m.org_id,
      spot_usd_per_ozt: spot,
      fire_factor: eski.fireFactor,
      labor_usd: eski.laborUsd,
      labor_handfinished_usd: eski.laborHandfinishedUsd,
      packaging_usd: eski.packagingUsd,
      shipping_usd: eski.shippingUsd,
      multiplier_narrow: eski.multiplierNarrow,
      multiplier_wide: eski.multiplierWide,
      wide_band_min_mm: eski.wideBandMinMm,
      sale_rate: eski.saleRate,
      updated_at: new Date().toISOString(),
      updated_by: m.user_id,
    },
    { onConflict: "org_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/fiyat");
  return { ok: true };
}
