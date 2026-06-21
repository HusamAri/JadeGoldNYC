export interface BrandAsset {
  src: string;
  caption: string;
}

export interface BrandGroup {
  key: string;
  title: string;
  description: string;
  assets: BrandAsset[];
}

/**
 * Marka görsel kimliği.
 * Galeri görselleri gerçek ürün çekimleridir; referans ürün fotoğraflarından
 * üretilip public/brand/gallery/ altında YEREL olarak barındırılır.
 * Giriş ekranı hero'su Higgsfield CDN'inden servis edilir.
 */
export const BRAND_LOGIN_HERO = "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032310_c5998244-2e54-4c44-9781-ebde6d2c5738_min.webp";

export const BRAND_GALLERY: BrandGroup[] = [
  {
    key: "light",
    title: "Aydınlık · Krem & Keten",
    description: "Minimal, ferah ürün çekimleri",
    assets: [
      { src: "/brand/gallery/aydinlik-cuban.webp", caption: "Miami Cuban · keten" },
      { src: "/brand/gallery/aydinlik-nugget.webp", caption: "Nugget · krem" },
      { src: "/brand/gallery/aydinlik-malgoz.webp", caption: "Mal göz · halat" },
    ],
  },
  {
    key: "dark",
    title: "Koyu · Lav Taşı & Slate",
    description: "Dramatik, premium ürün çekimleri",
    assets: [
      { src: "/brand/gallery/koyu-franco.webp", caption: "Franco · lav taşı" },
      { src: "/brand/gallery/koyu-paperclip.webp", caption: "Paperclip · slate" },
      { src: "/brand/gallery/koyu-jesus.webp", caption: "Jesus · lav taşı" },
    ],
  },
  {
    key: "model",
    title: "Model · Yaşam Tarzı",
    description: "Takılı, editoryal çekimler",
    assets: [
      { src: "/brand/gallery/model-hamsa.webp", caption: "Hamsa · boyun" },
      { src: "/brand/gallery/model-dome.webp", caption: "Dome band · el" },
      { src: "/brand/gallery/model-bamboo.webp", caption: "Bamboo halka · kulak" },
    ],
  },
  {
    key: "nyc",
    title: "NYC · Bağlam",
    description: "Şehir, altın saat ve marka anlatımı",
    assets: [
      { src: "/brand/gallery/nyc-horn.webp", caption: "Italian horn · Little Italy" },
      { src: "/brand/gallery/nyc-butterfly.webp", caption: "Butterfly · krem taş" },
      { src: "/brand/gallery/nyc-rosary.webp", caption: "Rosary · katedral" },
    ],
  },
];
