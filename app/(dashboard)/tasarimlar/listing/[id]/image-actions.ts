"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listingImageReorderSchema,
  listingImageUrlSchema,
} from "@/lib/validations/listing-image";

export interface ListingImageResult {
  ok?: boolean;
  error?: string;
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const BUCKET = "listing-images";

const listingPath = (productId: string) => `/tasarimlar/listing/${productId}`;

/**
 * Ürünün çağıranın org'unda olduğunu doğrular.
 *
 * ÖNCESİ burada bir `isEonActive()` kapısı vardı ("Görsel yönetimi yalnız EON
 * markası aktifken kullanılabilir"). Özellik EON için yazıldığı gün doğruydu,
 * ama panel çok kiracılı hale geldiğinde marka adına sabitlenmiş bir kapı
 * olarak kaldı ve diğer org'ların galerisini tamamen kilitledi — Etsy'ye
 * fotoğrafsız listing gönderilemediği için push da imkânsız hale geliyordu.
 * Vaka 2026-09-13: `by Artifact Studio Jewelry`. Sahiplik zaten RLS ile
 * sağlanıyor (aşağıdaki SELECT yalnız kendi org'unun ürününü döndürür), yani
 * marka kapısı güvenlik değil yalnız kısıt üretiyordu.
 */
async function guard(
  productId: string,
): Promise<
  | { ok: true; orgId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string }
> {
  const m = await requireMembership();
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

  const position = await nextPosition(supabase, productId);
  const user = await getUser();
  const { error } = await supabase.from("listing_images").insert({
    org_id: orgId,
    product_id: productId,
    url: publicUrl,
    storage_path: path,
    source: "upload",
    position,
    created_by: user?.id ?? null,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: error.message };
  }
  // A panel-created draft has no Etsy-synced cover. Its first uploaded gallery
  // image should also appear in Listing Önerileri, without changing the cover
  // of an existing Etsy-backed product.
  if (position === 0) {
    const { error: coverError } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", productId)
      .eq("org_id", orgId)
      .is("image_url", null)
      .is("etsy_listing_id", null);
    if (coverError) {
      revalidatePath(listingPath(productId));
      return {
        error: `Görsel galeriye eklendi, ancak kapak güncellenemedi: ${coverError.message}`,
      };
    }
    revalidatePath("/listing-onerileri");
    revalidatePath("/tasarimlar");
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

/**
 * Dış bir sunucuda duran galeri görsellerini kendi Storage'ımıza taşır.
 *
 * NEDEN: `source: "url"` satırının baytları bize ait değildir. Üretilen ürün
 * kareleri üreticinin CDN'inde duruyor ve o adres bizim kontrolümüzde değil —
 * süresi dolduğu ya da dosya silindiği gün galeri sessizce boşalır ve Etsy
 * push'u fotoğrafsız listing yüzünden patlar. Bu eylem baytı bir kez çeker,
 * kendi kovamıza yazar ve satırı kendi genel adresimize çevirir.
 *
 * SADECE mutlak http(s) adresleri taşınır. Panelde `/eon/...` gibi göreli
 * yollarla duran 245 satır var; onlar dış bağımlılık değil, ellenmez.
 * Zaten Storage'da olan satır da atlanır, yani eylem TEKRAR ÇALIŞTIRILABİLİR:
 * yarısı taşınmış bir galeride ikinci koşu yalnız kalanları alır.
 *
 * Bir satırın taşınması diğerlerini durdurmaz — 15 karelik bir galeride tek
 * bir 404 yüzünden hiçbir şey taşımamak, taşınabilecek 14 kareyi de dış
 * bağımlılıkta bırakırdı. Sayılar geri döner, sessiz kısmi başarı yoktur.
 *
 * SÜRE BÜTÇESİ: bu bir server action, yani platformun fonksiyon limitinde
 * koşar. 15 kare x ~7 MB indirip yüklemek o limiti aşabilir ve YARIDA KESİLEN
 * bir koşu hiçbir şey raporlamadan ölür (bu repoda bir kez 504 olarak yaşandı,
 * bkz. docs/second-brain.md nabız dersi). Bu yüzden kalan süre bir sonraki
 * kareye yetmiyorsa YENİ İŞ BAŞLATILMAZ: o ana kadar taşınanlar raporlanır ve
 * kullanıcı düğmeye tekrar basar. Eylem tekrar çalıştırılabilir olduğu için
 * ikinci koşu kaldığı yerden devam eder, baştan başlamaz.
 */
export async function rehostListingImages(
  productId: string,
): Promise<
  ListingImageResult & {
    moved?: number;
    skipped?: number;
    deferred?: number;
    failed?: string[];
  }
> {
  const g = await guard(productId);
  if (!g.ok) return { error: g.error };
  const { supabase, orgId } = g;

  const { data, error: selErr } = await supabase
    .from("listing_images")
    .select("id, url, storage_path")
    .eq("product_id", productId)
    .order("position", { ascending: true });
  if (selErr) return { error: selErr.message };

  const rows = (data ?? []) as {
    id: string;
    url: string;
    storage_path: string | null;
  }[];

  let moved = 0;
  let skipped = 0;
  const failed: string[] = [];
  let deferred = 0;

  const started = Date.now();
  // Ölçülen en yavaş kare ~6 sn; iki katını emniyet payı sayıp bütçenin son
  // diliminde yeni indirme başlatmıyoruz.
  const BUDGET_MS = 45_000;
  const PER_IMAGE_RESERVE_MS = 12_000;

  for (const row of rows) {
    // Zaten bizde olan ya da göreli yolla duran satır dokunulmaz.
    if (row.storage_path || !/^https?:\/\//i.test(row.url)) {
      skipped++;
      continue;
    }

    // Kalan süre bir kareye yetmiyorsa DURMA noktası burası. Yarıda kesilmiş
    // bir yükleme yetim dosya bırakır ve sayılar hiç geri dönmez.
    if (Date.now() - started > BUDGET_MS - PER_IMAGE_RESERVE_MS) {
      deferred++;
      continue;
    }

    let path: string | null = null;
    try {
      const upstream = await fetch(row.url);
      if (!upstream.ok) {
        failed.push(`${row.url.slice(0, 60)}: HTTP ${upstream.status}`);
        continue;
      }
      const mime = upstream.headers.get("content-type") ?? "";
      if (!mime.startsWith("image/")) {
        failed.push(`${row.url.slice(0, 60)}: görsel değil (${mime || "tip yok"})`);
        continue;
      }
      const buf = await upstream.arrayBuffer();
      if (buf.byteLength === 0) {
        failed.push(`${row.url.slice(0, 60)}: boş dosya`);
        continue;
      }
      if (buf.byteLength > MAX_IMAGE_BYTES) {
        failed.push(`${row.url.slice(0, 60)}: 15 MB'ı aşıyor`);
        continue;
      }

      const ext = (mime.split("/")[1] || "png")
        .split(";")[0]
        .replace("jpeg", "jpg")
        .replace("svg+xml", "svg");
      path = `${orgId}/${productId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: mime, upsert: false });
      if (upErr) {
        failed.push(`${row.url.slice(0, 60)}: ${upErr.message}`);
        path = null;
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { error: updErr } = await supabase
        .from("listing_images")
        .update({ url: publicUrl, storage_path: path, source: "upload" })
        .eq("id", row.id)
        .eq("product_id", productId);
      if (updErr) {
        // Satır güncellenemediyse yüklenen dosya YETİM kalır — geri al.
        await supabase.storage.from(BUCKET).remove([path]);
        path = null;
        failed.push(`${row.url.slice(0, 60)}: ${updErr.message}`);
        continue;
      }
      moved++;
    } catch (e) {
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      failed.push(
        `${row.url.slice(0, 60)}: ${e instanceof Error ? e.message : "çekilemedi"}`,
      );
    }
  }

  // Kapak görseli galerinin ilk satırını gösteriyorsa o da yeni adrese çevrilir,
  // yoksa galeri bizde, kapak hâlâ dış sunucuda kalırdı.
  if (moved > 0) {
    const first = rows[0];
    if (first) {
      const { data: fresh } = await supabase
        .from("listing_images")
        .select("url")
        .eq("id", first.id)
        .maybeSingle();
      const freshUrl = (fresh as { url?: string } | null)?.url;
      if (freshUrl) {
        await supabase
          .from("products")
          .update({ image_url: freshUrl })
          .eq("id", productId)
          .eq("image_url", first.url);
      }
    }
  }

  revalidatePath(listingPath(productId));
  if (failed.length > 0)
    return {
      error: `${moved} taşındı, ${failed.length} başarısız: ${failed.join(" · ")}`,
      moved,
      skipped,
      deferred,
      failed,
    };
  return { ok: true, moved, skipped, deferred, failed };
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
