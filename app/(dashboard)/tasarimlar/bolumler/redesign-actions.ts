"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { getListing, updateListingDescription } from "@/lib/etsy/listing";
import { stripWeightBlocks, injectWeightBlock } from "@/lib/etsy/weights";
import { listingsWithVariantWeights } from "@/lib/db/queries/variant-weights";
import { logAudit } from "@/lib/audit";
import type { Chapter } from "@/lib/collections/chapters";

const PATH = "/tasarimlar/bolumler";

export interface RedesignResult {
  ok?: boolean;
  error?: string;
  unchanged?: boolean;
}

interface RedesignRow {
  id: string;
  etsy_listing_id: number;
  chapter: string;
  proposed_description: string | null;
  status: string;
  qa_report: { status?: string } | null;
}

/** Etsy günlük kotası — saniyelik limitten AYRI, yeniden denemek işe yaramaz. */
function isDailyRateLimit(msg: string): boolean {
  return /daily/i.test(msg) && /(rate limit|quota)/i.test(msg);
}

async function loadRow(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  id: string,
): Promise<{ row?: RedesignRow; error?: string }> {
  const { data, error } = await admin
    .from("listing_redesigns")
    .select("id, etsy_listing_id, chapter, proposed_description, status, qa_report")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Öneri bulunamadı." };
  return { row: data as RedesignRow };
}

/** QA kapısı: hatalı satır onaylanamaz (veri eksik → metin yayına hazır değil). */
export async function approveRedesign(id: string): Promise<RedesignResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const admin = createAdminClient();

  const { row, error } = await loadRow(admin, m.org_id, id);
  if (error || !row) return { error: error ?? "Öneri bulunamadı." };
  if (row.status === "pushed") return { error: "Bu satır zaten gönderildi." };
  if (row.qa_report?.status === "fail") {
    return { error: "QA hatalı — eksik veri girilmeden onaylanamaz." };
  }

  const { error: upErr } = await admin
    .from("listing_redesigns")
    .update({ status: "approved" })
    .eq("org_id", m.org_id)
    .eq("id", id)
    .neq("status", "pushed");
  if (upErr) return { error: upErr.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function rejectRedesign(id: string): Promise<RedesignResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const admin = createAdminClient();
  const { error } = await admin
    .from("listing_redesigns")
    .update({ status: "rejected" })
    .eq("org_id", m.org_id)
    .eq("id", id)
    .neq("status", "pushed");
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

/** Metni elle düzeltme (ölçü/zincir eksiği doldurma). Gönderilmiş satır kilitli. */
export async function updateProposedDescription(
  id: string,
  description: string,
): Promise<RedesignResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const body = description.trim();
  if (body.length < 160) return { error: "Açıklama en az 160 karakter olmalı." };

  const admin = createAdminClient();
  // Ölçü netliği Jade'in 1 numaralı şikâyeti — elle girilen metinde de aranır.
  const hasScale = /\d+(\.\d+)?\s*(mm|cm|inch|inches|")/i.test(body);
  const qa = hasScale
    ? { status: "pass", errors: [], warnings: ["metin elle düzenlendi"] }
    : {
        status: "fail",
        errors: ["açıklamada somut ölçü yok (mm / inç)"],
        warnings: ["metin elle düzenlendi"],
      };

  const { error } = await admin
    .from("listing_redesigns")
    .update({ proposed_description: body, qa_report: qa })
    .eq("org_id", m.org_id)
    .eq("id", id)
    .neq("status", "pushed");
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Tek öneriyi Etsy'ye gönderir.
 *
 * Sıra kritik ve her adımı bir dersin karşılığı:
 *  1. baseline (views/favs) yakalanır — yoksa etkiyi ölçemeyiz (koruma §4).
 *  2. açıklama Etsy'den TAZE okunur — panel aynası bayat olabilir.
 *  3. canlıdaki AĞIRLIK BLOĞU kurtarılır ve yeni gövdenin sonuna geri konur;
 *     `injectWeightBlock` bloğu her zaman sona yazar, o yüzden önce
 *     `stripWeightBlocks` ile öneriden olası kopya temizlenir.
 *  4. yazıldıktan sonra GERİ OKUNUR — "200 OK" teslim sayılmaz (30 EON
 *     başlığının sessizce geri alındığı vaka).
 *  5. `products.description` aynası da eşitlenir (bayat vekil dersi).
 */
export async function pushRedesign(id: string): Promise<RedesignResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();
  const { row, error } = await loadRow(admin, m.org_id, id);
  if (error || !row) return { error: error ?? "Öneri bulunamadı." };
  if (row.status === "pushed") return { ok: true, unchanged: true };
  if (row.status !== "approved") return { error: "Önce onaylanmalı." };
  const proposed = row.proposed_description?.trim();
  if (!proposed) return { error: "Öneri metni boş." };

  try {
    const client = await EtsyClient.forOrg(m.org_id);

    // 1) baseline — yazmadan ÖNCE
    const { data: prod } = await admin
      .from("products")
      .select("id, views, num_favorers")
      .eq("org_id", m.org_id)
      .eq("etsy_listing_id", row.etsy_listing_id)
      .maybeSingle();

    // 2) canlı metin
    const detail = await getListing(client, row.etsy_listing_id);
    const live = detail.description ?? "";

    // 3) Ağırlık bloğu DB'den YENİDEN ÜRETİLİR, canlı metinden kesilmez.
    //    Kesme denemesi (`live.slice(stripWeightBlocks(live).length)`) hatalıydı:
    //    stripWeightBlocks blok ortada olsa da siliyor ve `\n{3,}` → `\n\n`
    //    normalizasyonu yapıyor, yani uzunluk farkı bloğun yerini vermiyor.
    //    `pushWeightForListing` de bloğu DB'den üretir — aynı güvenilir kaynak.
    const weights = await listingsWithVariantWeights(m.org_id);
    const block = weights.find((w) => w.etsyListingId === row.etsy_listing_id)?.block ?? "";
    const body = stripWeightBlocks(proposed);
    const next = block ? injectWeightBlock(body, block) : body;

    if (next === live) {
      // Zaten güncel — aynayı yine de eşitle, yoksa sonsuza dek "bekliyor".
      if (prod) {
        await admin.from("products").update({ description: live }).eq("id", prod.id);
      }
      await admin
        .from("listing_redesigns")
        .update({ status: "pushed", pushed_description: live, pushed_at: new Date().toISOString() })
        .eq("id", id);
      revalidatePath(PATH);
      return { ok: true, unchanged: true };
    }

    await updateListingDescription(client, row.etsy_listing_id, next);

    // 4) READ-BACK — canlıdan geri oku, birebir tutuyor mu
    const after = await getListing(client, row.etsy_listing_id);
    const written = after.description ?? "";
    if (written.trim() !== next.trim()) {
      await admin
        .from("listing_redesigns")
        .update({
          status: "failed",
          error: "Read-back uyuşmadı — Etsy'deki metin gönderilenle aynı değil.",
        })
        .eq("id", id);
      return { error: "Gönderildi ama geri okuma uyuşmadı — satır 'failed' işaretlendi." };
    }

    // 5) staging + ayna
    await admin
      .from("listing_redesigns")
      .update({
        status: "pushed",
        pushed_description: written,
        pushed_at: new Date().toISOString(),
        pushed_by: m.user_id,
        baseline_views: prod?.views ?? null,
        baseline_favs: prod?.num_favorers ?? null,
        baseline_captured_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", id);

    if (prod) {
      await admin.from("products").update({ description: written }).eq("id", prod.id);
    }

    await logAudit(admin, {
      orgId: m.org_id,
      action: "etsy.redesign_push",
      entityType: "products",
      entityId: prod?.id ?? null,
      summary: `Açıklama gönderildi (listing ${row.etsy_listing_id}, ${row.chapter}): ${written.length} karakter, geri okuma doğrulandı.`,
      source: "etsy",
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gönderilemedi.";
    await admin.from("listing_redesigns").update({ status: "failed", error: msg }).eq("id", id);
    return { error: msg };
  }
}

export interface WaveResult {
  pushed: number;
  unchanged: number;
  errors: number;
  rateLimited?: boolean;
  error?: string;
}

/**
 * Bölümün onaylanmış kalanını sırayla gönderir (canary'den SONRA).
 * İlk günlük-429'da devre keser: kotasız çağrı zinciri üretmenin anlamı yok.
 */
export async function pushRedesignWave(chapter: Chapter): Promise<WaveResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { pushed: 0, unchanged: 0, errors: 0, error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return { pushed: 0, unchanged: 0, errors: 0, error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("listing_redesigns")
    .select("id")
    .eq("org_id", m.org_id)
    .eq("chapter", chapter)
    .eq("status", "approved")
    .order("etsy_listing_id", { ascending: true });
  if (error) return { pushed: 0, unchanged: 0, errors: 0, error: error.message };

  let pushed = 0;
  let unchanged = 0;
  let errors = 0;
  for (const r of (data ?? []) as { id: string }[]) {
    const res = await pushRedesign(r.id);
    if (res.unchanged) unchanged += 1;
    else if (res.ok) pushed += 1;
    else {
      errors += 1;
      if (isDailyRateLimit(res.error ?? "")) {
        return { pushed, unchanged, errors, rateLimited: true };
      }
    }
  }
  revalidatePath(PATH);
  return { pushed, unchanged, errors };
}
