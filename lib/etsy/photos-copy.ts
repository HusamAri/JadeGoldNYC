import { decodeHtmlEntities } from "@/lib/etsy/text";
import { publicTextProblem } from "@/lib/etsy/strip-internal";

/**
 * ops/photos-copy yardımcıları. Saf fonksiyonlar: Etsy'ye dokunmaz.
 *
 * Bir listing'in canlı fotoğraflarını aynı mağazadaki başka bir listing'e
 * kopyalar (2026-11-17, Leander: mesajlardan açılmış özel sipariş listing'i
 * 4612132585 yalnız Etsy'nin yer tutucu grafiğini taşıyordu).
 *
 * Kimlik iki yerde sabitlenir:
 *  - KAYNAK: spec, gözle incelenmiş karelerin `listing_image_id` sırasını ve
 *    indirilen baytların sha256'sını taşır. Canlı galeri bu sıradan farklıysa
 *    (sahip bir kareyi değiştirdiyse) kopya yapılmaz.
 *  - HEDEF: yüklenen her kare kendi alt text'iyle tanınır. Alt text'ler spec
 *    içinde tekildir; aynı kare iki kez yüklenmez ve yarım kalan koşu kaldığı
 *    yerden devam eder.
 *
 * Sıra: `rank` bir dizi indeksi değil bir DEĞERdir ve Etsy'nin silme ya da
 * eşit sıra davranışı listing'den listing'e değişir (2026-10-08 dersi). Bu
 * yüzden her kare o anki en büyük sıranın bir fazlasına yazılır (eşitlik hiç
 * oluşmaz) ve doğrulama sıra numarasına değil DİZİLİŞE bakar.
 */

export type PhotosCopyFrame = {
  /** Kaynak listing'deki listing_image_id. */
  image: number;
  /** İncelenen url_fullxfull baytlarının sha256'sı. */
  sha256: string;
  /** Hedefte yazılacak alt text; hedefte karenin kimliğidir. */
  alt: string;
};

export type PhotosCopySpec = {
  from: number;
  to: number;
  /** Hedef listing'in beklenen durumu; canlı değer farklıysa yazılmaz. */
  targetState: string;
  targetIsPrivate: boolean;
  /** Hedefte kopyadan önce duran ve kareler yerleşince kaldırılacak görsel. */
  placeholder: number;
  frames: PhotosCopyFrame[];
  note?: string;
};

export type LivePhoto = {
  listing_image_id: number;
  rank: number;
  alt_text?: string | null;
  url_fullxfull?: string | null;
  url_570xN?: string | null;
  full_width?: number | null;
  full_height?: number | null;
};

export type PhotosCopyPlan = {
  status: "would-copy" | "would-finish" | "already" | "refuse";
  reason?: string;
  /** Hedefte doğru sırayla duran kare sayısı (baştan itibaren). */
  present: number;
  /** Yüklenecek karelerin indeksleri (0 tabanlı), sırayla. */
  missing: number[];
  placeholderPresent: boolean;
};

/** Etsy'nin yer tutucusuyla birlikte bir listing'de en çok 20 görsel durabilir. */
const MAX_FRAMES = 19;
const ALT_MAX = 250;
const DASH = /[\u2013\u2014]/;
/** Etsy'nin kaçışlı döndürebileceği karakterler alt text'te kimliği bulandırır. */
const ESCAPABLE = /[&<>"']/;

export const altKey = (s: string | null | undefined) =>
  decodeHtmlEntities(s ?? "").replace(/\s+/g, " ").trim();

export const byRank = <T extends LivePhoto>(photos: T[]): T[] =>
  [...photos].sort((a, b) => a.rank - b.rank || a.listing_image_id - b.listing_image_id);

/** Birden çok görselin paylaştığı sıra değerleri. */
export function rankTies(photos: LivePhoto[]): number[] {
  const count = new Map<number, number>();
  for (const p of photos) count.set(p.rank, (count.get(p.rank) ?? 0) + 1);
  return [...count.entries()].filter(([, n]) => n > 1).map(([r]) => r).sort((a, b) => a - b);
}

/** Bir sonraki BOŞ sıra: en büyük sıranın bir fazlası. */
export const nextRank = (photos: LivePhoto[]) => Math.max(0, ...photos.map((p) => p.rank)) + 1;

const isId = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n > 0;

/** Spec'in kendi kusurları; boş dizi = kullanılabilir. */
export function specProblems(spec: PhotosCopySpec): string[] {
  const out: string[] = [];
  if (!isId(spec.from) || !isId(spec.to)) out.push("from/to: geçersiz listing id");
  if (spec.from === spec.to) out.push("from/to: kaynak ile hedef aynı listing");
  if (!isId(spec.placeholder)) out.push("placeholder: geçersiz görsel id");
  if (typeof spec.targetState !== "string" || !spec.targetState) out.push("targetState: boş");
  if (typeof spec.targetIsPrivate !== "boolean") out.push("targetIsPrivate: boolean olmalı");
  const frames = Array.isArray(spec.frames) ? spec.frames : [];
  if (frames.length < 1 || frames.length > MAX_FRAMES) {
    out.push(`frames: ${frames.length} kare (1 ile ${MAX_FRAMES} arası olmalı)`);
  }
  const ids = new Set<number>();
  const alts = new Set<string>();
  frames.forEach((f, i) => {
    const no = `kare ${i + 1}`;
    if (!isId(f.image)) out.push(`${no}: geçersiz görsel id`);
    if (ids.has(f.image)) out.push(`${no}: görsel id tekrar (${f.image})`);
    ids.add(f.image);
    if (f.image === spec.placeholder) out.push(`${no}: yer tutucu ile aynı görsel`);
    if (!/^[0-9a-f]{64}$/.test(f.sha256 ?? "")) out.push(`${no}: sha256 geçersiz`);
    const alt = f.alt ?? "";
    if (!alt.trim()) out.push(`${no}: alt text boş`);
    if (alt !== altKey(alt)) out.push(`${no}: alt text'te fazladan boşluk`);
    if (alt.length > ALT_MAX) out.push(`${no}: alt text ${alt.length} karakter (en çok ${ALT_MAX})`);
    if (DASH.test(alt)) out.push(`${no}: alt text'te uzun tire`);
    if (ESCAPABLE.test(alt)) out.push(`${no}: alt text'te kaçış gerektiren karakter`);
    const internal = alt.trim() ? publicTextProblem(alt) : null;
    if (internal) out.push(`${no}: alt text kamuya açık olmaması gereken not taşıyor (${internal.slice(0, 60)})`);
    const key = altKey(alt).toLocaleLowerCase("en-US");
    if (key && alts.has(key)) out.push(`${no}: alt text başka bir kareyle aynı`);
    alts.add(key);
  });
  return out;
}

/** Kaynağın canlı galerisi incelenen galeri mi; boş dizi = evet. */
export function sourceProblems(source: LivePhoto[], spec: PhotosCopySpec): string[] {
  const out: string[] = [];
  const ties = rankTies(source);
  if (ties.length) out.push(`kaynak: eşit sıra (${ties.join(", ")})`);
  const live = byRank(source).map((p) => p.listing_image_id);
  const want = spec.frames.map((f) => f.image);
  if (live.length !== want.length || live.some((id, i) => id !== want[i])) {
    out.push(`kaynak: canlı galeri incelenen galeri değil (canlı ${live.join(",") || "-"}; spec ${want.join(",")})`);
  }
  const byId = new Map(source.map((p) => [p.listing_image_id, p]));
  spec.frames.forEach((f, i) => {
    const p = byId.get(f.image);
    if (p && !p.url_fullxfull) out.push(`kaynak: kare ${i + 1} için tam boy adres yok`);
  });
  return out;
}

/**
 * Hedefin canlı galerisine göre plan.
 *  - would-copy: eksik kareler sırayla yüklenir (yer tutucuya dokunulmaz).
 *  - would-finish: bütün kareler sırayla yerinde, yalnız yer tutucu kaldırılır.
 *  - already: yalnız kareler var, doğru sırada.
 *  - refuse: hedefte tanınmayan görsel, eşit sıra ya da bozuk diziliş var.
 */
export function planPhotosCopy(target: LivePhoto[], spec: PhotosCopySpec): PhotosCopyPlan {
  const index = new Map(spec.frames.map((f, i) => [altKey(f.alt), i]));
  let placeholderPresent = false;
  const seen: number[] = [];
  const foreign: number[] = [];
  for (const p of byRank(target)) {
    if (p.listing_image_id === spec.placeholder) {
      placeholderPresent = true;
      continue;
    }
    const k = index.get(altKey(p.alt_text));
    if (k === undefined) foreign.push(p.listing_image_id);
    else seen.push(k);
  }
  const refuse = (reason: string): PhotosCopyPlan => ({
    status: "refuse",
    reason,
    present: 0,
    missing: [],
    placeholderPresent,
  });
  if (foreign.length) return refuse(`hedefte bu spec'in tanımadığı görsel var (${foreign.join(", ")})`);
  const ties = rankTies(target);
  if (ties.length) return refuse(`hedefte eşit sıra var (${ties.join(", ")})`);
  if (new Set(seen).size !== seen.length) return refuse("hedefte aynı kare iki kez duruyor");
  if (seen.some((k, i) => k !== i)) {
    return refuse(`hedefte kareler sırayla değil (${seen.map((k) => k + 1).join(",")})`);
  }
  const present = seen.length;
  const total = spec.frames.length;
  if (present < total) {
    return {
      status: "would-copy",
      present,
      missing: Array.from({ length: total - present }, (_, i) => present + i),
      placeholderPresent,
    };
  }
  return { status: placeholderPresent ? "would-finish" : "already", present, missing: [], placeholderPresent };
}

/** Çıktı ve denetim kaydı için kısa galeri dökümü, sıra değerine göre. */
export function describePhotos(photos: LivePhoto[]) {
  return byRank(photos).map((p) => ({
    id: p.listing_image_id,
    rank: p.rank,
    size: p.full_width && p.full_height ? `${p.full_width}x${p.full_height}` : null,
    alt: altKey(p.alt_text).slice(0, 110) || null,
  }));
}
