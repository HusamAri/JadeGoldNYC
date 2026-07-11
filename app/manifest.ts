import type { MetadataRoute } from "next";

/**
 * PWA manifesti — Artifact yönetim platformu.
 *
 * Derin mürekkep (#14161d) tema/zemin: ana ekrana eklendiğinde platform
 * elmas markı koyu zeminde çivit-leylak olarak okunur (sekme markı
 * `app/icon.svg` ile tutarlı). Marka-nötr: şirketler (Jade Gold, Yaso, …)
 * platformun kiracılarıdır, kabuk platform kimliğini taşır.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Artifact — Yönetim Platformu",
    short_name: "Artifact",
    description:
      "Çok markalı e-ticaret yönetim platformu — satış, maliyet, performans ve şirket hafızası tek çatıda.",
    start_url: "/",
    display: "standalone",
    lang: "tr",
    background_color: "#14161d",
    theme_color: "#14161d",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  };
}
