import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server action gövde limiti — profil fotoğrafı (3 MB) ve tasarım panosu
    // görsel yüklemesi (10 MB) sunucu üzerinden yapıldığından yükseltildi.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    // Panel kapak görselleri (products.image_url) Etsy CDN dışında Supabase
    // Storage'ın public bucket'ından da gelebilir (ör. Etsy'ye henüz açılmamış
    // EON taslakları için AI hero kapağı). next/image bilinmeyen host'u
    // reddettiğinden Supabase Storage host'u burada izinlenir.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
