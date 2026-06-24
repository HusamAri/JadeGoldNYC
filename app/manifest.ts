import type { MetadataRoute } from "next";

/**
 * PWA manifesti — Jade Gold NYC yönetim paneli.
 *
 * Kömür (CHAR #131313) tema/zemin rengi: ana ekrana eklendiğinde marka
 * monogramı koyu zeminde antik altın olarak okunur (sekme markı `app/icon.svg`
 * ile tutarlı). Renkler markaya sadık; ikon mevcut marka monogramından gelir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jade Gold NYC — Yönetim Paneli",
    short_name: "Jade Gold NYC",
    description:
      "Jade Gold NYC Etsy mağazası için uçtan uca yönetim, loglama ve raporlama paneli.",
    start_url: "/",
    display: "standalone",
    lang: "tr",
    background_color: "#131313",
    theme_color: "#131313",
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
