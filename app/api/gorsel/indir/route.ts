import { NextResponse } from "next/server";

import { getMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHiggsfieldUrl } from "@/lib/photo-kit/higgsfield";
import { stripImageMetadata } from "@/lib/photo-kit/strip-metadata";

/**
 * Üretilen görsel indirme proxy'si. Görsel yalnız kullanıcı indir dediğinde
 * (bu uç noktaya tıklandığında) Higgsfield'dan çekilir ve tarayıcıya "attachment"
 * olarak akıtılır — böylece gösterim sırasında siteye yük binmez, indirme temiz
 * çalışır (cross-origin `download` kısıtı aşılır). SSRF'e karşı: URL istemciden
 * gelmez; kimlik (id) ile RLS altında DB'den okunur, host beyaz listeyle doğrulanır.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new NextResponse("Eksik id", { status: 400 });

  const m = await getMembership();
  if (!m) return new NextResponse("Yetkisiz", { status: 401 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("generated_images")
    .select("source_url, title")
    .eq("org_id", m.org_id)
    .eq("id", id)
    .maybeSingle();

  const row = data as { source_url: string; title: string | null } | null;
  if (!row) return new NextResponse("Bulunamadı", { status: 404 });
  if (!isHiggsfieldUrl(row.source_url))
    return new NextResponse("Geçersiz kaynak", { status: 400 });

  const upstream = await fetch(row.source_url);
  if (!upstream.ok || !upstream.body)
    return new NextResponse("Görsel alınamadı", { status: 502 });

  // İçerik doğrulaması: yalnız görüntü, makul boyutta (kötüye kullanım freni)
  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/"))
    return new NextResponse("Kaynak bir görsel değil", { status: 415 });
  const MAX_BYTES = 60 * 1024 * 1024; // 2K PNG'ler ~15-25MB; 60MB güvenli tavan
  const len = Number(upstream.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES)
    return new NextResponse("Görsel çok büyük", { status: 413 });
  // Content-Length yoksa (chunked) başlık kontrolü yetmez: gerçek baytları
  // sayan bir katman sınırı akış sırasında da uygular. Meta veri temizliği tüm
  // baytı gerektirdiği için akışı buffer'a alır, sonra köken etiketlerini söker.
  let streamed = 0;
  const capped = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        streamed += chunk.byteLength;
        if (streamed > MAX_BYTES) {
          controller.error(new Error("Boyut sınırı aşıldı"));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );

  let clean: Uint8Array<ArrayBuffer>;
  try {
    const raw = new Uint8Array(await new Response(capped).arrayBuffer());
    // Üreteç/köken meta verisini sök (ör. Higgsfield `hf-job-id`); ürün fotoğrafı
    // temiz gider. Görünmez SynthID filigranı meta veri değildir, sökülemez.
    clean = stripImageMetadata(raw);
  } catch {
    return new NextResponse("Görsel çok büyük", { status: 413 });
  }

  const ext = row.source_url.split(".").pop()?.split("?")[0] || "png";
  const base = (row.title || "jade-gold-nyc").replace(/[^\p{L}\p{N}_-]+/gu, "-");
  const filename = `${base}-${id.slice(0, 8)}.${ext}`;
  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(clean, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
