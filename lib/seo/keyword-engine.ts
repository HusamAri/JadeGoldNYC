/**
 * Etsy Listing SEO Yardımcısı — üretici motor.
 *
 * Ürün özelliklerinden (tip, zincir stili, malzeme, odak varyant, pazar,
 * kitle) Etsy'ye uygun bir BAŞLIK + 13 ETİKET + AÇIKLAMA taslağı + SEO SKORU
 * üretir. Saf fonksiyon: dış veri/istek yok, anlık (ListingComposer önizleme
 * deseni gibi client'ta `useMemo` ile çağrılır).
 *
 * Etsy kuralları motorda gömülü:
 *  - Etiket ≤ 20 karakter, başlık ≤ 140 karakter.
 *  - Etiketler çok-kelimeli (long-tail); tek kelime kullanılmaz.
 *  - Etiketler 5 arama "kova"sına dağılır (ne / nasıl / kim / stil / neden).
 *  - MALZEME DÜRÜSTLÜĞÜ: kaplama/filled/vermeil üründe "solid"/"real" iddiası
 *    ASLA üretilmez (yanlış beyan → iade + kötü yorum).
 */

export const ETSY_TAG_MAX = 20;
export const ETSY_TITLE_MAX = 140;

// ── Seçenek tipleri ────────────────────────────────────────────────────────

export type ProductType = "necklace" | "bracelet" | "ring" | "earrings" | "anklet";
export type ChainStyle =
  | ""
  | "herringbone"
  | "cuban"
  | "rope"
  | "figaro"
  | "box"
  | "snake"
  | "paperclip"
  | "bead";
export type Material =
  | "10k-solid"
  | "14k-solid"
  | "18k-solid"
  | "gold-filled"
  | "gold-vermeil"
  | "gold-plated"
  | "sterling-silver";
export type Focus = "dainty" | "classic" | "bold";
export type Market = "US" | "EU" | "TR";
export type Audience = "women" | "men" | "unisex";

/** Etiket kovaları — dengeli dağılım için. */
export type Bucket = "ne" | "nasil" | "kim" | "stil" | "neden";

export const BUCKET_LABELS: Record<Bucket, string> = {
  ne: "Ne (ürün)",
  nasil: "Nasıl (özellik)",
  kim: "Kim için",
  stil: "Stil",
  neden: "Neden (durum)",
};

export interface SeoInput {
  productType: ProductType;
  chainStyle: ChainStyle;
  material: Material;
  focus: Focus;
  market: Market;
  audience: Audience;
  /** Zincir genişliği (mm) — opsiyonel serbest metin, ör. "2". */
  widthMm?: string;
  /** Serbest durum/hediye ipucu — ör. "valentines". */
  occasion?: string;
}

export interface SeoTag {
  text: string;
  chars: number;
  bucket: Bucket;
}

export interface SeoCheck {
  key: string;
  label: string;
  passed: boolean;
  /** Geçmediyse ne yapılmalı. */
  hint?: string;
}

export interface SeoResult {
  title: string;
  titleChars: number;
  titleFirst40: string;
  tags: SeoTag[];
  description: string;
  score: { value: number; max: number; checks: SeoCheck[] };
}

// ── Form seçenek listeleri (UI besler) ─────────────────────────────────────

export const SEO_PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "necklace", label: "Kolye" },
  { value: "bracelet", label: "Bileklik" },
  { value: "ring", label: "Yüzük" },
  { value: "earrings", label: "Küpe" },
  { value: "anklet", label: "Halhal" },
];

export const SEO_CHAIN_STYLES: { value: ChainStyle; label: string }[] = [
  { value: "", label: "Belirsiz / yok" },
  { value: "herringbone", label: "Balıksırtı (herringbone)" },
  { value: "cuban", label: "Cuban / gurmet" },
  { value: "rope", label: "Halat (rope)" },
  { value: "figaro", label: "Figaro" },
  { value: "box", label: "Kutu (box)" },
  { value: "snake", label: "Yılan (snake)" },
  { value: "paperclip", label: "Ataç (paperclip)" },
  { value: "bead", label: "Boncuk (bead)" },
];

export const SEO_MATERIALS: { value: Material; label: string }[] = [
  { value: "10k-solid", label: "10k som altın" },
  { value: "14k-solid", label: "14k som altın" },
  { value: "18k-solid", label: "18k som altın" },
  { value: "gold-filled", label: "Gold filled" },
  { value: "gold-vermeil", label: "Gold vermeil" },
  { value: "gold-plated", label: "Altın kaplama" },
  { value: "sterling-silver", label: "925 gümüş" },
];

export const SEO_FOCUS: { value: Focus; label: string }[] = [
  { value: "dainty", label: "İnce / zarif" },
  { value: "classic", label: "Klasik" },
  { value: "bold", label: "Kalın / iddialı" },
];

export const SEO_MARKETS: { value: Market; label: string }[] = [
  { value: "US", label: "ABD (İngilizce)" },
  { value: "EU", label: "Avrupa (jewellery)" },
  { value: "TR", label: "Türkiye" },
];

export const SEO_AUDIENCES: { value: Audience; label: string }[] = [
  { value: "women", label: "Kadın" },
  { value: "men", label: "Erkek" },
  { value: "unisex", label: "Unisex" },
];

// ── Malzeme profili ────────────────────────────────────────────────────────

interface MaterialProfile {
  karat: string | null; // "10k" | "14k" | "18k" | null
  metalWord: string; // "gold" | "silver"
  isSolid: boolean;
  /** Başlıkta kullanılacak malzeme öbeği (Title Case'e çevrilir). */
  titlePhrase: string;
  /** Etikette kullanılacak dürüst malzeme öbekleri. */
  materialTags: string[];
}

function materialProfile(m: Material): MaterialProfile {
  switch (m) {
    case "10k-solid":
    case "14k-solid":
    case "18k-solid": {
      const karat = m.slice(0, 3); // "10k" | "14k" | "18k"
      return {
        karat,
        metalWord: "gold",
        isSolid: true,
        titlePhrase: `${karat} solid gold`,
        materialTags: [
          `${karat} gold`,
          "solid gold",
          "real gold",
          `${karat} solid gold`,
        ],
      };
    }
    case "gold-filled":
      return {
        karat: null,
        metalWord: "gold",
        isSolid: false,
        titlePhrase: "gold filled",
        materialTags: ["gold filled", "14k gold filled"],
      };
    case "gold-vermeil":
      return {
        karat: null,
        metalWord: "gold",
        isSolid: false,
        titlePhrase: "gold vermeil",
        materialTags: ["gold vermeil", "18k gold vermeil"],
      };
    case "gold-plated":
      return {
        karat: null,
        metalWord: "gold",
        isSolid: false,
        titlePhrase: "gold plated",
        materialTags: ["gold plated", "18k gold plated"],
      };
    case "sterling-silver":
      return {
        karat: null,
        metalWord: "silver",
        isSolid: false,
        titlePhrase: "sterling silver",
        materialTags: ["sterling silver", "925 silver"],
      };
  }
}

// ── Yardımcılar ────────────────────────────────────────────────────────────

const TYPE_WORD: Record<ProductType, string> = {
  necklace: "necklace",
  bracelet: "bracelet",
  ring: "ring",
  earrings: "earrings",
  anklet: "anklet",
};

const CHAIN_TYPES: ProductType[] = ["necklace", "bracelet", "anklet"];

const FOCUS_ADJECTIVES: Record<Focus, string[]> = {
  dainty: ["dainty", "thin", "delicate", "minimalist"],
  // "simple" — kısa üründe (earrings/ring) 20 kr sınırına sığan üçüncü sıfat;
  // dar kombinasyonlarda (zincirsiz + kaplama) havuz 13'ün altına düşmesin.
  classic: ["classic", "everyday", "simple"],
  bold: ["thick", "chunky", "bold", "statement"],
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bK\b/g, "k");
}

/** Karat token'ı ("10k") Title Case'te küçük kalsın; diğer kelimeler büyür. */
function titleCasePhrase(s: string): string {
  return s
    .split(" ")
    .map((w) => (/^\d+k$/i.test(w) ? w.toLowerCase() : titleCase(w)))
    .join(" ");
}

function norm(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function widthToken(widthMm?: string): string | null {
  const v = (widthMm ?? "").trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  // "2mm" / "1.5mm" — sondaki .0 sadeleşir.
  const label = Number.isInteger(n) ? String(n) : String(n);
  return `${label.replace(/\.0$/, "")}mm`;
}

// ── Etiket adayları (kova bazında, öncelik sıralı) ─────────────────────────

function tagCandidates(input: SeoInput): Record<Bucket, string[]> {
  const mp = materialProfile(input.material);
  const type = TYPE_WORD[input.productType];
  const metal = mp.metalWord;
  const isChain = CHAIN_TYPES.includes(input.productType);
  const style = isChain ? input.chainStyle : "";
  const width = widthToken(input.widthMm);
  const jewelryWord = input.market === "EU" ? "jewellery" : "jewelry";
  const audience = input.audience; // "women" | "men" | "unisex"
  const audienceWord = audience === "unisex" ? "" : audience;

  // Zincir ürünlerde "chain" ismi, değilse ürün tipi (yüzükte "chain" olmaz).
  const noun = isChain ? "chain" : type;

  const ne: string[] = [];
  if (mp.karat) ne.push(`${mp.karat} ${metal} ${type}`); // "10k gold necklace"
  if (mp.isSolid) ne.push(`solid ${metal} ${type}`); // "solid gold necklace"
  if (style) ne.push(`${style} ${type}`); // "herringbone necklace"
  if (style && mp.karat) ne.push(`${mp.karat} ${style}`); // "10k herringbone"
  ne.push(`${metal} ${type}`); // "gold necklace" / "silver ring"
  ne.push(`${metal} ${jewelryWord}`); // "gold jewelry" — jenerik yedek

  const nasil: string[] = [];
  if (style === "herringbone" || style === "snake") {
    nasil.push("flat snake chain");
    nasil.push(`flat ${metal} chain`);
  }
  if (mp.isSolid) {
    nasil.push(`real ${metal} ${noun}`); // zincirde "real gold chain", değilse "real gold ring"
    nasil.push(`solid ${metal} ${noun}`);
  }
  // Dürüst malzeme etiketi (kaplama/filled/vermeil/gümüş burada yaşar).
  if (!mp.isSolid) {
    for (const t of mp.materialTags) nasil.push(t);
  }
  if (width && isChain) nasil.push(`${width} ${metal} chain`);
  if (isChain) nasil.push(`${metal} chain necklace`);

  const kim: string[] = [];
  if (input.productType === "necklace") kim.push("layering necklace");
  if (audienceWord) {
    if (isChain) kim.push(`${metal} chain ${audienceWord}`); // "gold chain women"
    kim.push(`${type} for ${audienceWord}`); // "necklace for women"
    kim.push(`${metal} ${type} ${audienceWord}`); // "gold necklace women"
  } else {
    // Unisex — kitle sözcüğü yok; nötr ama gerçek arama terimleri.
    kim.push(`unisex ${type}`); // "unisex ring"
    kim.push(`handmade ${type}`); // "handmade ring"
    kim.push(`${metal} ${type} gift`); // "silver ring gift"
  }

  const stil: string[] = [];
  for (const adj of FOCUS_ADJECTIVES[input.focus]) {
    stil.push(`${adj} ${metal} ${type}`); // "dainty gold necklace"
    stil.push(`${adj} ${type}`); // "dainty necklace"
    if (isChain) stil.push(`${adj} ${metal} chain`); // "thin gold chain"
  }
  if (mp.isSolid) stil.push(`fine ${jewelryWord}`);

  const neden: string[] = [];
  const occ = norm(input.occasion ?? "");
  if (occ) neden.push(`${occ} gift`);
  neden.push(audience === "men" ? "gift for him" : "gift for her");
  neden.push("anniversary gift");
  neden.push("birthday gift");
  neden.push(`everyday ${type}`);
  if (audience !== "men") neden.push("gift for mom");
  neden.push("christmas gift"); // sezonluk jenerikler — dar havuz yedeği
  neden.push("wedding gift");

  return { ne, nasil, kim, stil, neden };
}

/** Aday geçerli mi? — çok kelimeli, ≤20 kr, boş değil. */
function validTag(t: string): boolean {
  const n = norm(t);
  return n.length > 0 && n.length <= ETSY_TAG_MAX && n.includes(" ");
}

const BUCKET_ORDER: Bucket[] = ["ne", "nasil", "stil", "kim", "neden"];

/** Kova adaylarından tam 13 etiket seç: önce her kovadan 1 (kapsama), sonra
 *  round-robin ile dengeli doldur. Tekrar (case-insensitive) ve >20 kr elenir. */
function selectTags(cands: Record<Bucket, string[]>): SeoTag[] {
  // Kova başına geçerli + benzersiz aday kuyrukları.
  const queues: Record<Bucket, string[]> = {
    ne: [],
    nasil: [],
    kim: [],
    stil: [],
    neden: [],
  };
  const globalSeen = new Set<string>();
  for (const b of BUCKET_ORDER) {
    const localSeen = new Set<string>();
    for (const raw of cands[b]) {
      const n = norm(raw);
      if (!validTag(n) || localSeen.has(n)) continue;
      localSeen.add(n);
      queues[b].push(n);
    }
  }

  const picked: SeoTag[] = [];
  const take = (b: Bucket): boolean => {
    while (queues[b].length) {
      const n = queues[b].shift() as string;
      if (globalSeen.has(n)) continue;
      globalSeen.add(n);
      picked.push({ text: n, chars: n.length, bucket: b });
      return true;
    }
    return false;
  };

  // 1) Kapsama — her kovadan bir tane (mümkünse).
  for (const b of BUCKET_ORDER) {
    if (picked.length >= 13) break;
    take(b);
  }
  // 2) Round-robin — kalan slotları dengeli doldur.
  let guard = 0;
  while (picked.length < 13 && guard < 200) {
    let progressed = false;
    for (const b of BUCKET_ORDER) {
      if (picked.length >= 13) break;
      if (take(b)) progressed = true;
    }
    if (!progressed) break; // aday tükendi
    guard++;
  }
  return picked;
}

// ── Başlık ─────────────────────────────────────────────────────────────────

function buildTitle(input: SeoInput): string {
  const mp = materialProfile(input.material);
  const type = TYPE_WORD[input.productType];
  const isChain = CHAIN_TYPES.includes(input.productType);
  const style = isChain ? input.chainStyle : "";
  const focusAdj = FOCUS_ADJECTIVES[input.focus];

  // Lead (ilk 40 kr'a sığar): malzeme + stil + ürün tipi.
  const leadParts = [mp.titlePhrase, style, type].filter(Boolean);
  const lead = titleCasePhrase(leadParts.join(" "));

  const parts: string[] = [lead];

  // 2. öbek — odak + özellik.
  if (style === "herringbone" || style === "snake") {
    const desc = [focusAdj[0], focusAdj[1] ?? "", "snake chain"]
      .filter(Boolean)
      .join(" ");
    parts.push(titleCasePhrase(desc));
  } else if (input.focus !== "classic") {
    parts.push(titleCasePhrase(`${focusAdj[0]} ${focusAdj[1] ?? ""} ${type}`.trim()));
  }

  // 3. öbek — kitle / kullanım. Kolyede "Layering", diğerlerinde "Handmade".
  const forAudience =
    input.audience === "unisex" ? "" : ` for ${input.audience}`;
  const realPrefix = mp.isSolid ? "Real Gold " : "";
  const midWord = input.productType === "necklace" ? "Layering" : "Handmade";
  parts.push(
    `${realPrefix}${midWord} ${titleCase(type)}${titleCase(forAudience)}`.trim(),
  );

  // 4. öbek — stil + hediye.
  const giftWho = input.audience === "men" ? "Him" : "Her";
  parts.push(`Minimalist Gift for ${giftWho}`);

  let title = parts.filter(Boolean).join(", ");
  if (title.length > ETSY_TITLE_MAX) {
    // Kelime ortasından kesme; son tam kelimeye kadar kırp.
    title = title.slice(0, ETSY_TITLE_MAX);
    title = title.replace(/[,\s]+\S*$/, "").replace(/[,\s]+$/, "");
  }
  return title;
}

// ── Açıklama ───────────────────────────────────────────────────────────────

function buildDescription(input: SeoInput): string {
  const mp = materialProfile(input.material);
  const type = TYPE_WORD[input.productType];
  const style = CHAIN_TYPES.includes(input.productType) ? input.chainStyle : "";
  const focusWord = FOCUS_ADJECTIVES[input.focus][0];
  const width = widthToken(input.widthMm);

  const honesty = mp.isSolid
    ? `real, stamped ${mp.karat} gold (not plated, not filled)`
    : `${mp.titlePhrase}`;
  const styleLine = style
    ? `${focusWord} flat ${style} ${type}`
    : `${focusWord} ${type}`;

  const lead =
    `${titleCasePhrase(mp.titlePhrase)} ${style ? style + " " : ""}${type} — ` +
    `${honesty}${
      style === "herringbone" || style === "snake"
        ? ` with a smooth, flat snake chain that lies perfectly flat and mirrors the light`
        : ""
    }. A timeless piece to layer or gift.`;

  const specs = [
    `• Material: ${mp.titlePhrase}${mp.isSolid ? ` (hallmarked "${mp.karat}")` : ""}`,
    style ? `• Style: ${styleLine}` : `• Style: ${focusWord} ${type}`,
    `• Width: ${width ? width : "[ ___ mm ]"}`,
    `• Length: [ 16" / 18" / 20" ]`,
    mp.isSolid ? `• Weight: [ ___ g ]  (som altında ağırlık = güven + fiyat gerekçesi)` : null,
    `• Perfect for: layering, everyday wear, gift for ${
      input.audience === "men" ? "him" : "her"
    } (birthday, anniversary, Valentine's)`,
  ].filter(Boolean);

  const care =
    style === "herringbone" || style === "snake"
      ? `Ships from [konum]. Care: store flat & keep dry to prevent kinks.`
      : `Ships from [konum]. Care: keep dry, store in a soft pouch.`;

  return [lead, "", ...specs, "", care].join("\n");
}

// ── Skor ───────────────────────────────────────────────────────────────────

function buildChecks(input: SeoInput, title: string, tags: SeoTag[]): SeoCheck[] {
  const mp = materialProfile(input.material);
  const type = TYPE_WORD[input.productType];
  const first40 = title.slice(0, 40).toLowerCase();
  const allTagsText = tags.map((t) => t.text).join(" ");
  const bucketsPresent = new Set(tags.map((t) => t.bucket));
  const focusAdj = FOCUS_ADJECTIVES[input.focus];

  // Dürüstlük: solid değilse "solid"/"real" iddiası olmamalı.
  const dishonest =
    !mp.isSolid &&
    (/(^|\s)(solid|real)(\s|$)/.test(allTagsText.toLowerCase()) ||
      /(^|\s)(solid|real)(\s|$)/.test(title.toLowerCase()));

  // Odak tutarlılığı (klasikte otomatik geçer).
  const focusConsistent =
    input.focus === "classic" ||
    (focusAdj.some((a) => allTagsText.toLowerCase().includes(a)) &&
      focusAdj.some((a) => title.toLowerCase().includes(a)));

  const checks: SeoCheck[] = [
    {
      key: "count",
      label: "13/13 etiket dolu",
      passed: tags.length === 13,
      hint: "Etiket havuzu 13'e ulaşmadı — daha fazla özellik gir.",
    },
    {
      key: "longtail",
      label: "Hepsi çok-kelimeli (long-tail)",
      passed: tags.every((t) => t.text.includes(" ")),
      hint: "Tek kelimelik etiket rekabette kaybolur.",
    },
    {
      key: "tagmax",
      label: "Etiketler ≤ 20 karakter",
      passed: tags.every((t) => t.chars <= ETSY_TAG_MAX),
      hint: "20 karakteri aşan etiket Etsy tarafından kesilir.",
    },
    {
      key: "lead",
      label: "Başlık ilk 40 kr güçlü (malzeme + tip)",
      passed:
        (mp.karat ? first40.includes(mp.karat) : first40.includes(mp.metalWord)) &&
        first40.includes(type),
      hint: "En değerli öbeği (malzeme + ürün tipi) başlığın başına al.",
    },
    {
      key: "buckets",
      label: "5 arama kovası temsil ediliyor",
      passed: bucketsPresent.size >= 5,
      hint: "Tek kovaya yığılma var — çeşitlendir.",
    },
    {
      key: "honesty",
      label: "Malzeme dürüst (yanlış 'solid/real' yok)",
      passed: !dishonest,
      hint: "Kaplama/filled üründe 'solid/real' iddiası iade + kötü yorum getirir.",
    },
    {
      key: "focus",
      label: "Odak varyant tutarlı (başlık + etiket)",
      passed: focusConsistent,
      hint: "İnce/kalın sinyali başlık ve etiketlerde hizalı olmalı.",
    },
    {
      key: "titlemax",
      label: "Başlık ≤ 140 karakter",
      passed: title.length <= ETSY_TITLE_MAX,
      hint: "Başlık 140 karakteri aşıyor.",
    },
  ];
  return checks;
}

// ── Ana giriş noktası ──────────────────────────────────────────────────────

export function generateSeo(input: SeoInput): SeoResult {
  const tags = selectTags(tagCandidates(input));
  const title = buildTitle(input);
  const description = buildDescription(input);
  const checks = buildChecks(input, title, tags);
  const value = checks.filter((c) => c.passed).length;

  return {
    title,
    titleChars: title.length,
    titleFirst40: title.slice(0, 40),
    tags,
    description,
    score: { value, max: checks.length, checks },
  };
}

/** Etiketleri Etsy'ye yapıştırmaya hazır virgüllü satır. */
export function tagsToLine(tags: SeoTag[]): string {
  return tags.map((t) => t.text).join(", ");
}

// ── Mevcut künyeden çıkarım (listing detay gömme) ──────────────────────────

/**
 * Mevcut listing künyesinden (başlık + etiketler + malzemeler) SeoInput
 * çıkarır — listing detay sayfası konsolu bu değerlerle önceden doldurur,
 * kullanıcı yalnız ince ayar yapar. Saf ve iddiasız: malzemede solid kanıtı
 * (karat/"solid") yoksa kaplama varsayılır — dürüstlük kuralı çıkarımda da
 * geçerli; yanlış yönde hata "solid demek"ten iyidir.
 */
export function inferSeoInput(
  title: string,
  tags?: string[] | null,
  materials?: string[] | null,
): SeoInput {
  const text = [title, ...(tags ?? []), ...(materials ?? [])]
    .join(" ")
    .toLowerCase();

  // Ürün tipi — spesifik kelimeler önce; "earring" içindeki "ring"i
  // \bring\b eşlemez (word boundary), yine de sıra earrings → ring.
  let productType: ProductType = "necklace";
  if (/\banklet/.test(text)) productType = "anklet";
  else if (/\bbracelet/.test(text)) productType = "bracelet";
  else if (/\bearring/.test(text)) productType = "earrings";
  else if (/\bring\b/.test(text)) productType = "ring";

  // Zincir stili — ilk eşleşen kazanır; herringbone en spesifik, başta.
  let chainStyle: ChainStyle = "";
  if (CHAIN_TYPES.includes(productType)) {
    const styles: ChainStyle[] = [
      "herringbone",
      "cuban",
      "figaro",
      "paperclip",
      "snake",
      "rope",
      "box",
      "bead",
    ];
    for (const s of styles) {
      if (new RegExp(`\\b${s}`).test(text)) {
        chainStyle = s;
        break;
      }
    }
  }

  // Malzeme — açık kaplama/filled/vermeil sinyalleri karat'tan ÖNCE okunur
  // ("18k gold plated" karat içerir ama plated'dır); sonra karat → solid.
  const karatMatch = text.match(/\b(10|14|18)\s*k\b/);
  let material: Material;
  if (/vermeil/.test(text)) material = "gold-vermeil";
  else if (/\bfilled\b/.test(text)) material = "gold-filled";
  else if (/plated|kaplama/.test(text)) material = "gold-plated";
  else if (/sterling|\b925\b/.test(text)) material = "sterling-silver";
  else if (karatMatch) material = `${karatMatch[1]}k-solid` as Material;
  else if (/\bsolid\b/.test(text)) material = "14k-solid"; // solid ama karatsız — en yaygın ayar
  else if (/silver|gümüş/.test(text)) material = "sterling-silver";
  else material = "gold-plated"; // kanıt yok → iddiasız varsayım

  // Odak — ince/kalın sinyali; yoksa klasik.
  let focus: Focus = "classic";
  if (/dainty|\bthin\b|delicate|minimalist/.test(text)) focus = "dainty";
  else if (/thick|chunky|\bbold\b|statement|heavy/.test(text)) focus = "bold";

  // Kitle — "women/womens" içindeki "men"i \bmen\b eşlemez; yine de
  // önce açık kadın sinyali okunur.
  let audience: Audience = "women";
  if (/unisex/.test(text)) audience = "unisex";
  else if (/wom[ae]n|\bher\b|ladies/.test(text)) audience = "women";
  else if (/\bmen\b|\bmens\b|men's|\bhim\b/.test(text)) audience = "men";

  const widthMatch = text.match(/(\d+(?:\.\d+)?)\s*mm/);

  return {
    productType,
    chainStyle,
    material,
    focus,
    market: "US", // metinden çıkarılamaz; mağaza varsayılanı
    audience,
    widthMm: widthMatch ? widthMatch[1] : "",
    occasion: "",
  };
}
