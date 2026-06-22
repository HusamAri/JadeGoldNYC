import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Profil fotoğrafı yükleme (en fazla 3 MB) için server action gövde limiti.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
