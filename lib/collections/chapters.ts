/**
 * Jade Gold NYC — Anlam Bölümleri (Chapters).
 *
 * Katalogu ürün-tipi/metal EKSENİNE ek olarak ANLAM eksenine göre gruplar.
 * Marka bölüm sistemiyle hizalı (Drive: JG_CH1_PROTECTION / CH2_FAITH /
 * CH4_LEGACY görselleri): sembolik parçalar anlamlarına, geri kalan katalog
 * biçimlerine göre bölünür. Saf/istemci-güvenli — dış veri yok.
 *
 * Sınıflandırma ANLAM-ÖNCELİKLİdir: bir "Last Supper Ring" biçim olarak yüzük
 * olsa da bölümü FAITH'tir; "Cornicello Miami Cuban Necklace" hem koruma hem
 * cuban içerir → koruma (anlam) kazanır. Sıra bu yüzden kritiktir.
 *
 * Kelime-sınırı (\b) ZORUNLU: sınırsız "ring" deseni "her<b>ring</b>bone" ve
 * "ste<b>rling</b>" içinde eşleşir (SEO motorundaki earring/ring tuzağının
 * aynısı) — tüm zincirler yanlışlıkla RINGS'e düşerdi.
 */

export type Chapter =
  | "protection"
  | "faith"
  | "love"
  | "legacy"
  | "chains"
  | "earrings"
  | "rings";

export interface ChapterMeta {
  key: Chapter;
  /** Marka bölüm no'su (yoksa null — biçim kovaları numarasız). */
  ch: number | null;
  /** Panelde görünen Türkçe etiket. */
  label: string;
  /** Etsy Shop Section adı (İngilizce, alıcıya görünür). */
  section: string;
  /** Bir cümlelik anlam/kapsam. */
  meaning: string;
  /** Görüntü sırası. */
  order: number;
}

export const CHAPTERS: Record<Chapter, ChapterMeta> = {
  protection: {
    key: "protection",
    ch: 1,
    label: "Koruma & Şans",
    section: "Protection & Luck",
    meaning: "Nazar, hamsa, cornicello, muska charm'ları — koruma sembolleri.",
    order: 1,
  },
  faith: {
    key: "faith",
    ch: 2,
    label: "İnanç & Adanmışlık",
    section: "Faith & Devotion",
    meaning: "İsa, haç/crucifix, rosary, Last Supper, aziz ve melek parçaları.",
    order: 2,
  },
  love: {
    key: "love",
    ch: 3,
    label: "Sevgi & Anlam",
    section: "Love & Meaning",
    meaning: "Kalp, teddy, kelebek — sevgi/hediye anlamı taşıyan parçalar.",
    order: 3,
  },
  legacy: {
    key: "legacy",
    ch: 4,
    label: "Miras & Statü",
    section: "Legacy & Statement",
    meaning: "Miami cuban, franco, mariner/anchor, iced-out ağır statü zincirleri.",
    order: 4,
  },
  chains: {
    key: "chains",
    ch: null,
    label: "Günlük Zincirler",
    section: "Everyday Chains",
    meaning: "Rope, box, figaro, valentino, paperclip, herringbone, bead — günlük.",
    order: 5,
  },
  earrings: {
    key: "earrings",
    ch: null,
    label: "Küpeler",
    section: "Earrings & Hoops",
    meaning: "Hoop, huggie, stud — tüm küpeler.",
    order: 6,
  },
  rings: {
    key: "rings",
    ch: null,
    label: "Yüzükler",
    section: "Rings",
    meaning: "Nugget, statement, alyans — sembolik olmayan yüzükler.",
    order: 7,
  },
};

/**
 * Anlam bölümü → Etsy vitrin bölümü (mağaza kararı, 2026-08-13).
 *
 * Etsy'de beş section var: Protection · Faith · Love · Legacy · Everyday.
 * Sembolik olmayan katalog (günlük zincir, küpe, yüzük) tek vitrinde toplanır:
 * alıcı için "gündelik altın" tek bir raf, anlam taşıyanlar ayrı raflar.
 *
 * Not: `ChapterMeta.section` alanı ESKİ öneri adlarını taşır (Protection & Luck
 * gibi) ve canlı karşılığı yoktur — eşleşme bu harita üzerinden yapılır.
 */
export const CHAPTER_TO_SECTION: Record<Chapter, string> = {
  protection: "Protection",
  faith: "Faith",
  love: "Love",
  legacy: "Legacy",
  chains: "Everyday",
  earrings: "Everyday",
  rings: "Everyday",
};

/**
 * Etsy section başlığını eşleştirme anahtarına indirger.
 *
 * Kullanıcı bölümü "Protection" ya da "Protection & Luck" diye adlandırabilir;
 * ikisi de aynı rafı kasteder. İlk kelime alınır, küçük harfe indirilir.
 * Tam eşleşme aramak, adı bir kelime uzayınca gönderimi sessizce durdururdu.
 */
export function sectionKey(title: string): string {
  return (title.trim().split(/[\s&·|/-]+/)[0] ?? "").toLowerCase();
}

export const CHAPTER_ORDER: Chapter[] = (
  Object.values(CHAPTERS) as ChapterMeta[]
)
  .sort((a, b) => a.order - b.order)
  .map((c) => c.key);

/** Filtre seçenekleri (URL param + etiket) — FilterSelect besler. */
export const CHAPTER_OPTIONS: { value: Chapter; label: string }[] =
  CHAPTER_ORDER.map((k) => ({
    value: k,
    label: CHAPTERS[k].ch ? `${CHAPTERS[k].ch} · ${CHAPTERS[k].label}` : CHAPTERS[k].label,
  }));

// Anlam-öncelikli, sıralı desenler. İlk eşleşen kazanır.
const RULES: { key: Chapter; re: RegExp }[] = [
  {
    key: "faith",
    re: /last supper|baby angel|\b(jesus|crucifix|cross|rosary|saint|religious|christian|praying|guadalupe|virgin|angel|medallion)\b/,
  },
  {
    key: "protection",
    re: /evil eye|italian horn|good luck|\b(hamsa|nazar|cornicello|elephant|protection|pharaoh|panther|lion|eagle)\b/,
  },
  { key: "love", re: /\bheart\b|teddy|butterfly/ },
  {
    key: "legacy",
    re: /\bcuban\b|\bfranco\b|mariner|anchor|ice[d]?\s?out|\biced\b|\bcurb\b/,
  },
  { key: "earrings", re: /earring|\bhoops?\b|huggie|\bstuds?\b/ },
  { key: "rings", re: /\brings?\b|\bband\b|wedding/ },
];

/**
 * Bir listing'i anlam bölümüne sınıflar. Başlık + (varsa) etiketler okunur;
 * hiçbir kurala uymazsa "chains" (günlük zincir) varsayılanına düşer.
 */
export function deriveChapter(
  title: string,
  tags?: string[] | null,
): Chapter {
  const text = `${title} ${(tags ?? []).join(" ")}`.toLowerCase();
  for (const r of RULES) {
    if (r.re.test(text)) return r.key;
  }
  return "chains";
}
