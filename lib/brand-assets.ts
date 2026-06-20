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
 * Marka görsel kimliği galerisi. Dosyalar `public/brand/gallery/` içine
 * aşağıdaki adlarla eklenir; eksikse zarif degrade gösterilir (BrandTile).
 */
export const BRAND_GALLERY: BrandGroup[] = [
  {
    key: "light",
    title: "Aydınlık · Krem & Keten",
    description: "Minimal, ferah ürün ve yaşam tarzı çekimleri",
    assets: [
      { src: "/brand/gallery/chain-cream-01.jpg", caption: "İnce zincir · krem" },
      { src: "/brand/gallery/chain-cream-02.jpg", caption: "Kablo zincir · krem" },
      { src: "/brand/gallery/rope-curb-jade.jpg", caption: "Rope & Curb · jade taşı" },
      { src: "/brand/gallery/olive-chain-01.jpg", caption: "Zincir & zeytin · keten" },
      { src: "/brand/gallery/olive-chain-02.jpg", caption: "Zincir & zeytin · ışık" },
    ],
  },
  {
    key: "dark",
    title: "Koyu · Lav Taşı & Slate",
    description: "Dramatik, premium ürün çekimleri",
    assets: [
      { src: "/brand/gallery/bear-bracelet-01.jpg", caption: "Ayıcık bileklik · lav taşı" },
      { src: "/brand/gallery/bear-bracelet-02.jpg", caption: "Ayıcık bileklik · ışık" },
      { src: "/brand/gallery/chain-dark-brick.jpg", caption: "Zincir · koyu duvar" },
      { src: "/brand/gallery/chain-dark-slate.jpg", caption: "Zincir · siyah taş" },
    ],
  },
  {
    key: "brand",
    title: "NYC & Marka",
    description: "Mekan, kimlik ve grafik öğeler",
    assets: [
      { src: "/brand/gallery/soho-storefront.jpg", caption: "SoHo vitrin · alacakaranlık" },
      { src: "/brand/gallery/wax-seal.jpg", caption: "Altın mühür · zarf" },
      { src: "/brand/gallery/icon-card.jpg", caption: "Marka ikonları · kartvizit" },
    ],
  },
];
