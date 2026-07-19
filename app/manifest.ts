import type { MetadataRoute } from "next";

/**
 * PWA manifesti — Amuletta yönetim platformu.
 *
 * v3 lab kaydı: theme_color açık Spatial lavanta zemin (#eaecf3, sekme
 * markı `app/icon.svg` karosuyla aynı), background_color koyu lume mürekkep
 * (#14161e) — splash'ta lavanta orb markı koyu zeminden ayrışır.
 * Marka-nötr: şirketler (Jade Gold, Yaso, …) platformun kiracılarıdır,
 * kabuk platform kimliğini taşır.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amuletta — Yönetim Platformu",
    short_name: "Amuletta",
    description:
      "Çok markalı e-ticaret yönetim platformu — satış, maliyet, performans ve şirket hafızası tek çatıda.",
    start_url: "/",
    display: "standalone",
    lang: "tr",
    background_color: "#14161e",
    theme_color: "#eaecf3",
    icons: [
      {
        src: "/icon.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
  };
}
