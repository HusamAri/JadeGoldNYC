import { decodeHtmlEntities } from "@/lib/etsy/text";
import { normText } from "@/lib/etsy/listing-rewrite";
import { publicTextProblem } from "@/lib/etsy/strip-internal";

/**
 * ops/listing-text yardımcıları. Saf fonksiyonlar: Etsy'ye dokunmaz.
 *
 * Tek bir listing'in başlık ve açıklamasını (istenirse tag'lerini) repodaki
 * bir spec'ten yazar. Spec, değiştirdiği canlı metni de taşır (`expect`):
 * canlı metin ne hedefte ne de beklenen eski hâldeyse sahip arada düzenlemiş
 * demektir ve yazım reddedilir.
 */

export type ListingTextSpec = {
  listing: number;
  /** Karşılaştırma için okunacak ikinci listing (yalnız kuru çalışma dökümü). */
  like?: number;
  /** Bu spec'in değiştirdiği canlı metin. */
  expect: { title: string; description: string };
  title: string;
  description: string;
  /** Verilmezse tag'lere dokunulmaz. */
  tags?: string[];
  note?: string;
};

export type LiveText = { title: string; description: string; tags: string[] };

export type ListingTextPlan = {
  status: "would-write" | "already" | "live-changed";
  /** would-write: yazılacak alanlar. live-changed: beklenmeyen hâlde olan alanlar. */
  fields: string[];
};

const DASH = /[\u2013\u2014]/;
const squash = (s: string) => decodeHtmlEntities(s).replace(/\s+/g, " ").trim();
const clean = (s: string) => normText(decodeHtmlEntities(s));
const tagKey = (tags: string[]) =>
  tags.map((t) => squash(t).toLocaleLowerCase("en-US")).sort().join("|");

/** Spec'in kendi kusurları; boş dizi = yazılabilir. `otherTitles`: mağazanın diğer aktif başlıkları. */
export function specProblems(spec: ListingTextSpec, otherTitles: string[]): string[] {
  const out: string[] = [];
  const title = spec.title.trim();
  if (!title) out.push("title: boş");
  if (title.length > 140) out.push(`title: ${title.length} karakter (en çok 140)`);
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length >= 15) out.push(`title: ${words.length} kelime (15'ten az olmalı)`);
  if (DASH.test(title)) out.push("title: uzun tire");
  const seen = new Set<string>();
  for (const w of words.map((x) => x.replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase("en-US"))) {
    if (!w) continue;
    if (seen.has(w)) out.push(`title: kelime tekrarı (${w})`);
    seen.add(w);
  }
  const mine = squash(title).toLocaleLowerCase("en-US");
  if (otherTitles.some((t) => squash(t).toLocaleLowerCase("en-US") === mine)) {
    out.push("title: başka bir listing ile aynı");
  }

  const description = normText(spec.description);
  if (!description) out.push("description: boş");
  if (DASH.test(description)) out.push("description: uzun tire");
  const internal = description ? publicTextProblem(description) : null;
  if (internal) out.push(`description: kamuya açık olmaması gereken not (${internal.slice(0, 60)})`);
  if (squash(description) === squash(spec.expect.description)) {
    out.push("description: beklenen eski metinle aynı");
  }

  if (spec.tags) {
    if (spec.tags.length !== 13) out.push(`tags: ${spec.tags.length} adet (13 olmalı)`);
    const keys = new Set<string>();
    for (const t of spec.tags) {
      if (t !== t.trim() || !t) out.push(`tags: boşluk ya da boş tag (${t})`);
      if (t.length > 20) out.push(`tags: 20 karakterden uzun (${t})`);
      if (t !== t.toLocaleLowerCase("en-US")) out.push(`tags: büyük harf (${t})`);
      if (DASH.test(t)) out.push(`tags: uzun tire (${t})`);
      if (keys.has(t)) out.push(`tags: tekrar (${t})`);
      keys.add(t);
    }
  }
  return out;
}

/** Canlı metne göre plan. Yazım yalnız "would-write" durumunda yapılır. */
export function planListingText(live: LiveText, spec: ListingTextSpec): ListingTextPlan {
  const titleDone = clean(live.title) === spec.title.trim();
  const descDone = clean(live.description) === normText(spec.description);
  const tagsDone = spec.tags ? tagKey(live.tags) === tagKey(spec.tags) : true;
  if (titleDone && descDone && tagsDone) return { status: "already", fields: [] };

  const changed: string[] = [];
  if (!titleDone && squash(live.title) !== squash(spec.expect.title)) changed.push("title");
  if (!descDone && squash(live.description) !== squash(spec.expect.description)) {
    changed.push("description");
  }
  if (changed.length > 0) return { status: "live-changed", fields: changed };

  return {
    status: "would-write",
    fields: [
      ...(titleDone ? [] : ["title"]),
      ...(descDone ? [] : ["description"]),
      ...(tagsDone ? [] : ["tags"]),
    ],
  };
}

/** Yazımdan sonra geri okunan metinde hedefe uymayan alanlar; boş = doğrulandı. */
export function unverifiedFields(after: LiveText, spec: ListingTextSpec): string[] {
  const out: string[] = [];
  if (clean(after.title) !== spec.title.trim()) out.push("title");
  if (clean(after.description) !== normText(spec.description)) out.push("description");
  if (spec.tags && tagKey(after.tags) !== tagKey(spec.tags)) out.push("tags");
  return out;
}
