import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 "proxy" konvansiyonu (eski adıyla middleware).
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aşağıdakiler hariç tüm istek yollarıyla eşleş:
     * - _next/static, _next/image, favicon.ico
     * - metadata dosya rotaları (apple-icon, icon, opengraph/twitter-image,
     *   manifest) — sosyal botlar ve cihazlar login'e YÖNLENDİRİLEMEZ
     * - statik görsel/video uzantıları
     */
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|icon|opengraph-image|twitter-image|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
