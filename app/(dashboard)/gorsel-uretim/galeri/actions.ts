"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHiggsfieldUrl, deriveThumbUrl } from "@/lib/photo-kit/higgsfield";

/**
 * Higgsfield görsel URL'lerini panele ekler (satır başına bir URL). Yalnız
 * Higgsfield CDN URL'leri kabul edilir. Küçük önizleme URL'i türetilir; görsel
 * baytları saklanmaz. Tekrar eklenenler sessizce atlanır (org+url tekil).
 */
export async function addImagesFromUrls(input: {
  urls: string;
  listingId?: number | null;
  title?: string | null;
}): Promise<{ added?: number; skipped?: number; error?: string }> {
  const m = await requireMembership();

  const lines = input.urls
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return { error: "En az bir görsel URL'i girin." };

  const valid = lines.filter(isHiggsfieldUrl);
  const invalid = lines.length - valid.length;
  if (valid.length === 0)
    return {
      error: "Geçerli Higgsfield görsel bağlantısı bulunamadı (https, CDN).",
    };

  const rows = Array.from(new Set(valid)).map((url) => ({
    org_id: m.org_id,
    source_url: url,
    thumb_url: deriveThumbUrl(url),
    etsy_listing_id: input.listingId ?? null,
    title: input.title?.trim() || null,
    created_by: m.user_id,
  }));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_images")
    .upsert(rows, { onConflict: "org_id,source_url", ignoreDuplicates: true })
    .select("id");
  if (error) return { error: error.message };

  const added = data?.length ?? 0;
  revalidatePath("/gorsel-uretim/galeri");
  return { added, skipped: rows.length - added + invalid };
}

/** Bir görseli seçili/seçili değil olarak işaretler (final seçim). */
export async function toggleImageSelected(
  id: string,
  selected: boolean,
): Promise<{ error?: string }> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("generated_images")
    .update({ is_selected: selected })
    .eq("org_id", m.org_id)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gorsel-uretim/galeri");
  return {};
}

/** Bir görseli panelden kaldırır (yalnız kayıt silinir, Higgsfield'daki durmaya devam eder). */
export async function deleteGeneratedImage(
  id: string,
): Promise<{ error?: string }> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const supabase = await createClient();
  const { error } = await supabase
    .from("generated_images")
    .delete()
    .eq("org_id", m.org_id)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gorsel-uretim/galeri");
  return {};
}
