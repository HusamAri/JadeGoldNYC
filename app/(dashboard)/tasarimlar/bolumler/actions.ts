"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CHAPTERS, type Chapter } from "@/lib/collections/chapters";

export interface ChapterActionResult {
  ok?: true;
  error?: string;
  changed?: number;
}

const VALID = new Set<string>(Object.keys(CHAPTERS));

/**
 * Bir listing'in anlam bölümünü elle sabitler (chapter_locked = true).
 *
 * PANEL-ONLY: Etsy'ye hiçbir şey yazmaz — `chapter` senkronun dokunmadığı bir
 * yaşam-döngüsü alanıdır (0138). Kilit, otomatik backfill'in insan kararını
 * geri almasını engeller: motor "Lion & Eagle"ı korumaya atar, sen inanca
 * taşırsan bir sonraki toplu çalıştırma bunu bozmaz.
 */
export async function setChapter(
  productId: string,
  chapter: string,
): Promise<ChapterActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  if (!VALID.has(chapter)) return { error: "Geçersiz bölüm." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ chapter: chapter as Chapter, chapter_locked: true })
    .eq("id", productId)
    .eq("org_id", m.org_id);

  if (error) return { error: error.message };

  revalidatePath("/tasarimlar/bolumler");
  revalidatePath(`/tasarimlar/listing/${productId}`);
  return { ok: true };
}

/** Kilidi kaldırır: bölüm yeniden otomatik türetilebilir hale gelir. */
export async function unlockChapter(
  productId: string,
): Promise<ChapterActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ chapter_locked: false })
    .eq("id", productId)
    .eq("org_id", m.org_id);

  if (error) return { error: error.message };
  revalidatePath("/tasarimlar/bolumler");
  return { ok: true };
}

/**
 * Sınıflanmamış / güncelliğini yitirmiş listingleri yeniden sınıflar.
 *
 * Senkron yeni listing getirdiğinde `chapter` NULL gelir (senkron bu alanı
 * yazmaz) — bu aksiyon boşluğu kapatır. Kilitli satırlara DOKUNMAZ.
 * Etsy'ye yazma yok; tamamen panel-içi.
 */
export async function rebuildChapters(): Promise<ChapterActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("backfill_chapters", {
    p_org: m.org_id,
  });

  if (error) return { error: error.message };

  revalidatePath("/tasarimlar/bolumler");
  return { ok: true, changed: typeof data === "number" ? data : 0 };
}
