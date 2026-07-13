"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
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
}): Promise<{
  added?: number;
  duplicates?: number;
  invalid?: number;
  invalidLines?: string[];
  error?: string;
}> {
  const m = await requireMembership();

  const lines = input.urls
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return { error: "En az bir görsel URL'i girin." };

  const valid = lines.filter(isHiggsfieldUrl);
  const invalidLines = lines.filter((l) => !isHiggsfieldUrl(l));
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
  revalidatePath("/gorsel-uretim"); // kit sayfasındaki galeri sayacı
  return {
    added,
    duplicates: rows.length - added,
    invalid: invalidLines.length,
    invalidLines,
  };
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
  revalidatePath("/gorsel-uretim");
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
  revalidatePath("/gorsel-uretim");
  return {};
}

export interface UploadToListingResult {
  etsyImageId?: number;
  needsReconnect?: boolean;
  error?: string;
}

/**
 * Seçilen görseli Etsy listing'ine ürün fotoğrafı olarak yükler.
 * Akış: görsel Higgsfield CDN'inden sunucuda çekilir (host beyaz listesi) →
 * Etsy uploadListingImage (multipart, listings_w) → kayıt yüklendi olarak
 * işaretlenir. Listing, parametreden ya da görselin bağlı listing'inden gelir.
 * Mağazaya yazdığı için yalnız owner/admin.
 */
export async function uploadImageToListing(
  imageId: string,
  listingId?: number | null,
): Promise<UploadToListingResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { needsReconnect: true };

  const supabase = await createClient();
  const { data } = await supabase
    .from("generated_images")
    .select("id, source_url, title, etsy_listing_id, etsy_image_id")
    .eq("org_id", m.org_id)
    .eq("id", imageId)
    .maybeSingle();
  const row = data as {
    id: string;
    source_url: string;
    title: string | null;
    etsy_listing_id: number | null;
    etsy_image_id: number | null;
  } | null;
  if (!row) return { error: "Görsel bulunamadı." };
  if (!isHiggsfieldUrl(row.source_url))
    return { error: "Görsel kaynağı izinli değil." };

  const targetListing = listingId ?? row.etsy_listing_id;
  if (!targetListing)
    return {
      error:
        "Bu görsel bir listing'e bağlı değil — üstteki menüden listing seçin.",
    };

  // Görseli Higgsfield'dan çek (yalnız yükleme anında — depolama yok)
  const upstream = await fetch(row.source_url);
  if (!upstream.ok)
    return { error: `Görsel Higgsfield'dan alınamadı (${upstream.status}).` };
  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/"))
    return { error: "Kaynak bir görsel değil." };
  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > 60 * 1024 * 1024)
    return { error: "Görsel çok büyük (60MB üstü)." };

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) return { needsReconnect: true };
    return {
      error: e instanceof Error ? e.message : "Etsy istemcisi kurulamadı.",
    };
  }

  try {
    const shopId = await client.requireShopId();
    const ext = type.includes("webp")
      ? "webp"
      : type.includes("jpeg") || type.includes("jpg")
        ? "jpg"
        : "png";
    const form = new FormData();
    form.append(
      "image",
      new Blob([buf], { type }),
      `jade-gold-${row.id.slice(0, 8)}.${ext}`,
    );
    if (row.title) form.append("alt_text", row.title.slice(0, 250));

    const res = await client.requestMultipart<{ listing_image_id?: number }>(
      "POST",
      etsyPaths.listingImages(shopId, targetListing),
      form,
    );
    const etsyImageId = res?.listing_image_id ?? null;

    await supabase
      .from("generated_images")
      .update({
        etsy_uploaded_at: new Date().toISOString(),
        etsy_image_id: etsyImageId,
        // Menüden seçilen listing kalıcılaşsın (bağsız görsel bağlanır)
        etsy_listing_id: targetListing,
      })
      .eq("org_id", m.org_id)
      .eq("id", imageId);

    await logAudit(supabase, {
      orgId: m.org_id,
      action: "etsy.image_upload",
      entityType: "generated_images",
      entityId: imageId,
      summary: `AI görsel Etsy listing #${targetListing}'e yüklendi${row.title ? ` (${row.title})` : ""}`,
      source: "etsy",
    });

    revalidatePath("/gorsel-uretim/galeri");
    return { etsyImageId: etsyImageId ?? undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Yükleme başarısız.";
    // Etsy 403: listings_w kapsamı yok → yeniden bağlanma yönlendirmesi
    if (msg.includes("(403)")) return { needsReconnect: true };
    return { error: msg };
  }
}
