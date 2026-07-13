import promptsJson from "./prompts.json";

/**
 * AI görsel üretim kiti — kimlik-kilitli (img2img) prompt sistemi.
 * Veri, `prompts.json` içinde statik tutulur; her aktif Etsy listingi için
 * bir ürünün gerçek fotoğrafını referans alıp yeni sahne üretmek üzere yazılmış
 * flat-lay + model + negatif promptları içerir. Prompt üretimi orchestrator
 * workflow'u ile yapıldığından (pahalı), sonuç burada kalıcıdır.
 */
export interface PhotoKitItem {
  /** Etsy listing id */
  id: number;
  /** başlık */
  t: string;
  /** karat / metal (14K, 10K, Silver) */
  k: string;
  /** kategori */
  c: "chain" | "bracelet" | "earrings" | "pendant" | "ring";
  /** atanmış sahne */
  scene: "dark" | "light" | "silk";
  /** model çekim tipi */
  model: "neck" | "hand" | "ear" | "wrist" | "flatlay";
  /** öncelik katmanı (1 en çok satan) */
  tier: 1 | 2 | 3;
  /** toplam satış adedi */
  u: number;
  /** fiyat (USD) */
  pr: number;
  /** Etsy listing url */
  url: string;
  /** referans görsel (Etsy CDN) */
  img: string;
  /** flat-lay prompt */
  p: string;
  /** model / 2. açı prompt */
  mp: string;
  /** negatif prompt */
  n: string;
}

export const PHOTO_KIT: PhotoKitItem[] = promptsJson as PhotoKitItem[];

export const CAT_LABEL: Record<PhotoKitItem["c"], string> = {
  chain: "Zincir / Kolye",
  bracelet: "Bileklik",
  earrings: "Küpe",
  pendant: "Kolye Ucu",
  ring: "Yüzük",
};

export const SCENE_LABEL: Record<PhotoKitItem["scene"], string> = {
  dark: "Lav & Slate",
  light: "Keten & Mermer",
  silk: "Şampanya İpek",
};

export const SCENE_DESC: Record<PhotoKitItem["scene"], string> = {
  dark: "Siyah volkanik taş, sıcak yandan ışık, altın rim — dramatik lüks.",
  light: "Ekru keten + krem mermer, ferah gün ışığı — minimal ve zarif.",
  silk: "Şampanya-altın saten kıvrımlar, sıcak parıltı — editoryal ve feminen.",
};

export const MODEL_LABEL: Record<PhotoKitItem["model"], string> = {
  neck: "Boyun",
  hand: "El",
  ear: "Kulak",
  wrist: "Bilek",
  flatlay: "Flat-lay",
};

export interface PhotoConcept {
  name: string;
  sub: string;
  /** kart üstü renk şeridi (css gradient) */
  bar: string;
  /** açıklama (TR) */
  text: string;
  /** promptun sahne cümlesinin yerine yapıştırılacak İngilizce sahne eki */
  prompt: string;
}

/** Markaya uyumlu ek sahne konseptleri — kimlik kilidi aynı kalır. */
export const PHOTO_CONCEPTS: PhotoConcept[] = [
  {
    name: "NYC Editorial",
    sub: "Şehir · Golden Hour",
    bar: "linear-gradient(120deg,#2b3a4d,#c8a15a)",
    text: "Ürünü fırçalanmış beton ya da koyu mermer bir sette, arkada golden-hour'da yumuşak bulanık New York silüeti (pencereden) ile göster; serin mavi şehir bokeh'i sıcak altın key ışıkla dengelenir; modern, sofistike lüks editoryal.",
    prompt:
      "place the piece on a brushed-concrete or dark marble ledge with a softly blurred New York skyline at golden hour seen through a window behind it; cool blue city bokeh balanced by a warm golden key light igniting the gold; sleek modern luxury editorial, shallow depth of field.",
  },
  {
    name: "Jade & Botanik",
    sub: "Doğal · Taze",
    bar: "linear-gradient(120deg,#2f5d50,#bcae7e)",
    text: "Ürünü pürüzsüz yeşim-yeşili taş bir levha üzerinde, tek bir taze okaliptüs ya da zeytin dalıyla ve yumuşak sabah ışığıyla stille; organik botanik lüks, çiy tazeliği, yeşiller altını tamamlar.",
    prompt:
      "style the piece on a smooth jade-green stone slab with a single fresh eucalyptus or olive sprig and soft morning light; organic botanical luxury, dewy freshness, natural greens complementing the warm gold, delicate soft shadows.",
  },
  {
    name: "Noir Mermer",
    sub: "Dramatik · Yansıma",
    bar: "linear-gradient(120deg,#14140f,#8E6E2C)",
    text: "Ürünü beyaz damarlı parlak siyah Marquina mermer üzerinde, dar bir spot ışık altında göster; derin yansıtıcı siyah, ayna yüzey, yüksek kontrast noir mücevher editoryali.",
    prompt:
      "rest the piece on polished black Marquina marble with dramatic white veining under a tight directional spotlight; deep reflective mirror-black surface, high-contrast noir jewelry editorial, warm rim light on the gold.",
  },
  {
    name: "Gün Işığı Pencere",
    sub: "Ferah · Sıcak",
    bar: "linear-gradient(120deg,#f0e6d2,#d8b56a)",
    text: "Ürünü parlak bir pencere yanında yulaf renkli keten üzerine koy; ince tül perdeden süzülen gün ışığı ve yüzeye düşen yumuşak pencere-çerçeve gölgeleri; İskandinav sıcaklığında, sakin ve davetkâr.",
    prompt:
      "place the piece on warm oat linen beside a bright window with soft sheer-curtain daylight and gentle window-frame shadows falling across the surface; airy Scandinavian warmth, calm inviting mood, warm-neutral palette.",
  },
  {
    name: "Makro Hero",
    sub: "Yakın · Kabartma",
    bar: "linear-gradient(120deg,#b08d3e,#f3e9cf)",
    text: "Ekstrem makro hero çekim: ürün kareyi neredeyse doldurur, kusursuz sıcak degrade fon, altına yandan vuran tek heykelsi ışık her kabartmayı ve faseti ortaya çıkarır; müze kalitesinde ürün kahramanı.",
    prompt:
      "extreme macro hero shot, the piece filling most of the frame on a seamless warm gradient backdrop, a single sculpted raking light across the gold revealing every engraving and facet; museum-grade product hero, tack-sharp.",
  },
];
