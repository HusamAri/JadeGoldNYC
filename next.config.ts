import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server action gövde limiti — profil fotoğrafı (3 MB) ve tasarım panosu
    // görsel yüklemesi (10 MB) sunucu üzerinden yapıldığından yükseltildi.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
