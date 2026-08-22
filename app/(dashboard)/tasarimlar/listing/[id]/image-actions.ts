"use server";

import { revalidatePath } from "next/cache";

import {
  requireMembership,
  getUser,
  isManager,
  MANAGER_ONLY_ERROR,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isEonActive } from "@/lib/brand";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { stripImageMetadata } from "@/lib/photo-kit/strip-metadata";
import { createClient } from "@/lib/supabase/server";
import {
  listingImageReorderSchema,
  listingImageUrlSchema,
} from "@/lib/validations/listing-image";

export interface ListingImageResult {
  ok?: boolean;
  needsReconnect?: boolean;
  error?: string;
}

export interface ListingImageEtsyResult extends ListingImageResult {
  etsyImageId?: number;
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const BUCKET = "listing-images";
const EON_ONLY_ERROR =
  "Görsel yönetimi yalnız EON markası aktifken kullanılabilir.";

const listingPath = (productId: string) => `/tasarimlar/listing/${productId}`;

function isAllowedEtsyImageSource(input: {
  url: string;
  source: string;
  storagePath: string | null;
}): boolean {
  try {
    const url = new URL(input.url);
    if (url.protocol !== "https:") return false;

    if (input.source === "upload" && input.storagePath) {
      return (
        url.hostname.endsWith(".supabase.co") &&
        url.pathname.includes("/storage/v1/object/public/listing-images/")
      );
    }

    if (url.hostname === "amuletta.artifactstudio.info") {
      return url.pathname.startsWith("/eon/");
    }

    if (url.hostname === "raw.githubusercontent.com") {
      return /^\/HusamAri\/JadeGoldNYC\//i.test(url.pathname);
    }

    return false;
  } catch {
    return false;
  }
}

/** EON geçidi + ürünün çağıranın org'unda olduğunu doğrular. */
async function guard(
  productId: string,
): Promise<
  | {
      ok: true;
      orgId: string;
      supabase: Awaited<ReturnType<typeof createClient>>;
    }
  | { ok: false; error: string }
> {
  const m = await requireMembership();
  if (!(await isEonActive())) return { ok: false, error: EON_ONLY_ERROR };
  const supabase = await createClient();
  // RLS SELECT yalnız kendi org'unu döndürür → sahiplik doğrulaması.
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, error: "Listing bulunamadı." };
  return { ok: true, orgId: m.org_id, supabase };
}

/** Ürünün mevcut en yüksek sırasının bir fazlası (galeri sonuna ekleme). */
async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
): Promise<number> {
  const { data } = await supabase
    .from("listing_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const max = (data as { position?: number } | null)?.position;
  return typeof max === "number" ? max + 1 : 0;
}

/** Yükleme ile görsel ekler: dosya SUNUCUYA gelir, Storage'a yazılır, satır oluşur. */
export async function addListingImageUpload(
  formData: FormData,
): Promise<ListingImageResult> {
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) return { error: "Ürün kimliği eksik." };
  const g = await guard(productId);
  if (!g.ok) return { error: g.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Görsel seçilmedi." };
  if (!file.type.startsWith("image/"))
    return { error: "Yalnızca görsel dosyası yükleyebilirsiniz." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Görsel 15 MB'ı aşamaz." };

  const { supabase, orgId } = g;
  const ext = (file.type.split("/")[1] || "png")
    .replace("jpeg", "jpg")
    .replace("svg+xml", "svg");
  const path = `${orgId}/${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Yükleme başarısız: " + upErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const user = await getUser();
  const { error } = await supabase.from("listing_images").insert({
    org_id: orgId,
    product_id: productId,
    url: publicUrl,
    storage_path: path,
    source: "upload",
    position: await nextPosition(supabase, productId),
    created_by: user?.id ?? null,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: error.message };
  }
  revalidatePath(listingPath(productId));
  return { ok: true };
}

/** URL (Drive önizleme veya doğrudan görsel) ile görsel ekler. */
export async function addListingImageUrl(
  formData: FormData,
): Promise<ListingImageResult> {
  const parsed = listingImageUrlSchema.safeParse({
    productId: String(formData.get("productId") ?? ""),
    url: String(formData.get("url") ?? ""),
    alt: String(formData.get("alt") ?? "") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz görsel." };

  const g = await guard(parsed.data.productId);
  if (!g.ok) return { error: g.error };
  const { supabase, orgId } = g;

  const user = await getUser();
  const { error } = await supabase.from("listing_images").insert({
    org_id: orgId,
    product_id: parsed.data.productId,
    url: parsed.data.url,
    source: "url",
    alt: parsed.data.alt ?? null,
    position: await nextPosition(supabase, parsed.data.productId),
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(listingPath(parsed.data.productId));
  return { ok: true };
}

/** Galeriden bir görseli çıkarır (ve varsa Storage dosyasını siler). */
export async function removeListingImage(
  id: string,
  productId: string,
): Promise<ListingImageResult> {
  const g = await guard(productId);
  if (!g.ok) return { error: g.error };
  const { supabase, orgId } = g;

  const { data: row } = await supabase
    .from("listing_images")
    .select("id, storage_path")
    .eq("id", id)
    .eq("product_id", productId)
    .maybeSingle();
  if (!row) return { error: "Görsel bulunamadı." };

  const { error } = await supabase.from("listing_images").delete().eq("id", id);
  if (error) return { error: error.message };

  const path = (row as { storage_path?: string | null }).storage_path;
  if (path && path.startsWith(`${orgId}/`)) {
    await supabase.storage.from(BUCKET).remove([path]);
  }
  revalidatePath(listingPath(productId));
  return { ok: true };
}

/** Galeriyi yeniden sıralar — verilen id sırasına göre `position` günceller. */
export async function reorderListingImages(
  productId: string,
  orderedIds: string[],
): Promise<ListingImageResult> {
  const parsed = listingImageReorderSchema.safeParse({ productId, orderedIds });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz sıra." };

  const g = await guard(parsed.data.productId);
  if (!g.ok) return { error: g.error };
  const { supabase } = g;

  // Her satırın position'ını yeni indeksine çek (RLS org'u zaten sınırlar).
  for (let i = 0; i < parsed.data.orderedIds.length; i++) {
    const { error } = await supabase
      .from("listing_images")
      .update({ position: i })
      .eq("id", parsed.data.orderedIds[i])
      .eq("product_id", parsed.data.productId);
    if (error) return { error: error.message };
  }
  revalidatePath(listingPath(parsed.data.productId));
  return { ok: true };
}

/** Replaces exactly one live Etsy image rank with a managed EON image. */
export async function overwriteListingImageOnEtsy(
  productId: string,
  imageId: string,
  rank: number,
): Promise<ListingImageEtsyResult> {
  const membership = await requireMembership();
  if (!isManager(membership.role)) return { error: MANAGER_ONLY_ERROR };
  if (!Number.isInteger(rank) || rank < 1 || rank > 20) {
    return { error: "Etsy görsel sırası 1 ile 20 arasında olmalıdır." };
  }

  const g = await guard(productId);
  if (!g.ok) return { error: g.error };

  const { writeEnabled } = await getEtsyWriteAccess(g.orgId);
  if (!writeEnabled) return { needsReconnect: true };

  const { data: product } = await g.supabase
    .from("products")
    .select("etsy_listing_id, title")
    .eq("id", productId)
    .maybeSingle();
  const etsyListingId = (product as { etsy_listing_id?: number | null } | null)
    ?.etsy_listing_id;
  if (!etsyListingId) return { error: "Bu listing Etsy'ye bağlı değil." };

  const { data: imageRow } = await g.supabase
    .from("listing_images")
    .select("id, url, alt, source, storage_path")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();
  const row = imageRow as {
    id: string;
    url: string;
    alt: string | null;
    source: string;
    storage_path: string | null;
  } | null;
  if (!row) return { error: "Görsel bulunamadı." };
  if (
    !isAllowedEtsyImageSource({
      url: row.url,
      source: row.source,
      storagePath: row.storage_path,
    })
  ) {
    return { error: "Bu görsel kaynağı Etsy aktarımı için izinli değil." };
  }

  let upstream: Response;
  try {
    upstream = await fetch(row.url, {
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { error: "Görsel kaynağından alınamadı." };
  }
  if (!upstream.ok) {
    return { error: `Görsel kaynağından alınamadı (${upstream.status}).` };
  }
  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return { error: "Kaynak bir görsel değil." };
  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { error: "Görsel 15 MB'ı aşamaz." };
  }
  const clean = stripImageMetadata(new Uint8Array(buffer));

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(g.orgId);
  } catch (error) {
    if (error instanceof EtsyNotConnectedError) return { needsReconnect: true };
    return {
      error:
        error instanceof Error ? error.message : "Etsy istemcisi kurulamadı.",
    };
  }

  try {
    const shopId = await client.requireShopId();
    const ext = type.includes("webp")
      ? "webp"
      : type.includes("png")
        ? "png"
        : "jpg";
    const form = new FormData();
    form.append(
      "image",
      new Blob([clean], { type }),
      `eon-${productId.slice(0, 8)}-${rank}.${ext}`,
    );
    form.append("rank", String(rank));
    form.append("overwrite", "true");
    const title = (product as { title?: string | null } | null)?.title;
    const altText = row.alt?.trim() || `${title ?? "EON ring"}, image ${rank}`;
    form.append("alt_text", altText.slice(0, 500));

    const response = await client.requestMultipart<{
      listing_image_id?: number;
    }>("POST", etsyPaths.listingImages(shopId, etsyListingId), form);

    await logAudit(g.supabase, {
      orgId: g.orgId,
      action: "etsy.image_upload",
      entityType: "listing_images",
      entityId: imageId,
      summary: `EON görsel Etsy listing #${etsyListingId} sıra ${rank} için yenilendi`,
      source: "etsy",
    });

    revalidatePath(listingPath(productId));
    return {
      ok: true,
      etsyImageId: response?.listing_image_id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Yükleme başarısız.";
    if (message.includes("(403)")) return { needsReconnect: true };
    return { error: message };
  }
}
