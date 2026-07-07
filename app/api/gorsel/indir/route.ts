import { NextResponse } from "next/server";

import { getMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHiggsfieldUrl } from "@/lib/photo-kit/higgsfield";

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

  const ext = row.source_url.split(".").pop()?.split("?")[0] || "png";
  const base = (row.title || "jade-gold-nyc").replace(/[^\p{L}\p{N}_-]+/gu, "-");
  const filename = `${base}-${id.slice(0, 8)}.${ext}`;
  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
