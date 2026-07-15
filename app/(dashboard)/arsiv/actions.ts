"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { EtsyNotConnectedError } from "@/lib/etsy/client";
import {
  getListingArchiveImages,
  getListingArchiveVideos,
} from "@/lib/etsy/media";

const BUCKET = "listing-archive";
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB güvenlik tavanı (Etsy videosu küçüktür)

export interface ArchiveResult {
  images?: number;
  videos?: number;
  skipped?: number;
  needsReconnect?: boolean;
  error?: string;
}

function extFromMime(mime: string, fallback: string): string {
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("mp4")) return "mp4";
  if (m.includes("quicktime") || m.includes("mov")) return "mov";
  if (m.includes("webm")) return "webm";
  return fallback;
}

/**
 * Bir Etsy listing'inin görsel + videolarını panele KALICI arşivler: Etsy
 * CDN'inden baytlar sunucuda çekilir → 'listing-archive' bucket'ına (org
 * klasörü) yüklenir → `listing_media` upsert edilir. Idempotent: aynı medya
 * tekrar çalıştırılınca üzerine yazılır, satır çoğalmaz. Yalnız owner/admin.
 */
export async function archiveListing(
  etsyListingId: number,
): Promise<ArchiveResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  if (!Number.isInteger(etsyListingId)) return { error: "Geçersiz listing." };

  const supabase = await createClient();
  // Sahiplik + başlık: listing çağıranın org'unda mı? (RLS yalnız kendi org'u.)
  const { data: product } = await supabase
    .from("products")
    .select("title")
    .eq("org_id", m.org_id)
    .eq("etsy_listing_id", etsyListingId)
    .maybeSingle();
  const title = (product as { title?: string } | null)?.title ?? null;

  let images: Awaited<ReturnType<typeof getListingArchiveImages>>;
  let videos: Awaited<ReturnType<typeof getListingArchiveVideos>>;
  try {
    [images, videos] = await Promise.all([
      getListingArchiveImages(m.org_id, etsyListingId),
      getListingArchiveVideos(m.org_id, etsyListingId),
    ]);
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) return { needsReconnect: true };
    return {
      error: e instanceof Error ? e.message : "Etsy'den medya alınamadı.",
    };
  }

  let okImages = 0;
  let okVideos = 0;
  let skipped = 0;

  const items: {
    kind: "image" | "video";
    mediaId: number | null;
    url: string;
    rank: number | null;
    width: number | null;
    height: number | null;
    fallbackExt: string;
  }[] = [
    ...images.map((im) => ({
      kind: "image" as const,
      mediaId: im.imageId,
      url: im.url,
      rank: im.rank,
      width: im.width,
      height: im.height,
      fallbackExt: "jpg",
    })),
    ...videos.map((v) => ({
      kind: "video" as const,
      mediaId: v.videoId,
      url: v.url,
      rank: null,
      width: v.width,
      height: v.height,
      fallbackExt: "mp4",
    })),
  ];

  for (const it of items) {
    try {
      const upstream = await fetch(it.url);
      if (!upstream.ok) {
        skipped += 1;
        continue;
      }
      const mime =
        upstream.headers.get("content-type") ||
        (it.kind === "image" ? "image/jpeg" : "video/mp4");
      const buf = await upstream.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
        skipped += 1;
        continue;
      }
      const ext = extFromMime(mime, it.fallbackExt);
      const idPart = it.mediaId ?? `r${it.rank ?? 0}`;
      const path = `${m.org_id}/${etsyListingId}/${it.kind}-${idPart}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: mime, upsert: true });
      if (upErr) {
        skipped += 1;
        continue;
      }

      const { error: rowErr } = await supabase.from("listing_media").upsert(
        {
          org_id: m.org_id,
          etsy_listing_id: etsyListingId,
          kind: it.kind,
          etsy_media_id: it.mediaId,
          rank: it.rank,
          storage_path: path,
          mime,
          width: it.width,
          height: it.height,
          bytes: buf.byteLength,
          source_url: it.url,
          title,
          created_by: m.user_id,
        },
        { onConflict: "org_id,etsy_listing_id,kind,etsy_media_id" },
      );
      if (rowErr) {
        skipped += 1;
        continue;
      }
      if (it.kind === "image") okImages += 1;
      else okVideos += 1;
    } catch {
      skipped += 1;
    }
  }

  await logAudit(supabase, {
    orgId: m.org_id,
    action: "listing.archive",
    entityType: "listing_media",
    entityId: String(etsyListingId),
    summary: `Listing #${etsyListingId} arşivlendi: ${okImages} görsel, ${okVideos} video${title ? ` (${title})` : ""}`,
    source: "etsy",
  });

  revalidatePath("/arsiv");
  return { images: okImages, videos: okVideos, skipped };
}
