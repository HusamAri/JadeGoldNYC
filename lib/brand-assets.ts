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
 * Marka görsel kimliği — Higgsfield'de üretilmiş çekimler.
 * Görseller Higgsfield CDN'inden servis edilir (tarayıcı doğrudan yükler).
 * Kendi sunucunuzda barındırmak isterseniz public/brand/ altına indirip
 * src yollarını /brand/... olarak değiştirin (bkz. public/brand/README.md).
 */
export const BRAND_LOGIN_HERO = "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032310_c5998244-2e54-4c44-9781-ebde6d2c5738_min.webp";

export const BRAND_GALLERY: BrandGroup[] = [
  {
    key: "light",
    title: "Aydınlık · Krem & Keten",
    description: "Minimal, ferah ürün ve yaşam tarzı çekimleri",
    assets: [
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032837_507c7994-4085-4aed-a021-bf8a588c7315_min.webp", caption: "İnce zincir · krem" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032801_14cbf502-21eb-40fb-8d92-9da9da237115_min.webp", caption: "Kablo zincir · krem" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032639_8a5abb61-2b29-44aa-97eb-43748da91f6c_min.webp", caption: "Zincir & zeytin · keten" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032635_a781ac1c-02f9-4463-9dd4-2469319f7a43_min.webp", caption: "Zincir & zeytin · ışık" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032043_0ef91dfc-f284-4cb0-8883-487228a7a8bd_min.webp", caption: "Katmanlı zincir · editoryal" },
    ],
  },
  {
    key: "dark",
    title: "Koyu · Lav Taşı & Slate",
    description: "Dramatik, premium ürün çekimleri",
    assets: [
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_033335_b2325cdb-6dfb-4c29-a7f5-9308b2dbc96b_min.webp", caption: "Bileklik · lav taşı" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_033229_6c7c4215-cefa-4699-96c5-bd2c9a18fc38_min.webp", caption: "Bileklik · ışık" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032229_31d21e83-db86-417b-8d58-4653045a13f9_min.webp", caption: "Rope & Cuban · charcoal" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032720_8d16ba8e-6b61-4288-ab3e-f5f58c9d8059_min.webp", caption: "Zincir · dikey atmosfer" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032716_4fd14cd4-5031-4516-b0de-12a4ddea62b1_min.webp", caption: "Zincir · siyah taş" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032110_5f1c5ae6-ff3f-47a5-9280-8442d1d36cb2_min.webp", caption: "Cuban bileklik · bilek" },
    ],
  },
  {
    key: "brand",
    title: "NYC & Marka",
    description: "Mekan, kimlik ve grafik öğeler",
    assets: [
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032304_0a0b8530-2a96-4295-9d23-b1198a29957c_min.webp", caption: "SoHo vitrin · alacakaranlık" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032213_70371d0f-8ec1-4ef3-8fa1-ee7fa250812f_min.webp", caption: "Empire State · altın saat" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032150_d566331d-3ea1-45df-9ac8-488eb9a85e99_min.webp", caption: "Manhattan cephe" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032613_01ae605e-e408-4f6f-bcad-7af6f596e5f5_min.webp", caption: "Altın mühür · zarf" },
      { src: "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260620_032907_ead848a0-fb18-4cce-9dc0-368e8bb897e1_min.webp", caption: "Marka ikonları · kartvizit" },
    ],
  },
];
