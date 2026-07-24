import type { MetadataRoute } from "next";

// Amuletta bir yönetim paneli — giriş duvarının arkasındaki hiçbir sayfanın
// indekslenmesi istenmiyor. Açık bir Disallow: / hem arama motorlarına net
// sinyal verir hem de /robots.txt'nin 404 dönmesini engeller.
// İleride herkese açık pazarlama sayfaları eklenirse burada ayrıştırılır.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    host: "https://amuletta.artifactstudio.info",
  };
}
