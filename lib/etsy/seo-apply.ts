/**
 * ops/seo-apply için saf karar fonksiyonları (ağ yok, test edilebilir).
 *
 * Girdi: bir org keyword matrisinin satırı (EON: docs/eon/seo/2026-10-21-etsy-keyword/,
 * by Artifact Studio: docs/artifact-studio/seo/2026-10-21-etsy-keyword/data/apply-matrix.json)
 * + Etsy'den CANLI okunan listing + mağaza bölümleri.
 * Çıktı: ne yazılacağı ya da neden yazılmayacağı.
 *
 * Kural (RUNBOOK §3): matrisin "önce" hâli (current_title/current_tags) canlıdan
 * farklıysa sahip listing'i 2026-10-21'den sonra elle düzenlemiştir — o listing
 * ATLANIR, üstüne yazılmaz. Matrisin kendi script'i bu kuralı uygulamıyordu.
 */

export type SeoMatrixRow = {
  id: string;
  current_title: string;
  current_tags: string[];
  new_title: string;
  new_tags: string[];
  section_fix: string | null;
};

export type LiveListing = {
  title: string;
  tags: string[];
  state: string | null;
  sectionId: number | null;
};

export type SeoPlan =
  | { action: "skip"; reason: string; detail?: Record<string, unknown> }
  | { action: "already"; sectionMove: SectionMove | null }
  | {
      action: "write";
      title: string | null;
      tags: string[] | null;
      sectionMove: SectionMove | null;
      sectionNote: string | null;
    };

export type SectionMove = { from: string; to: string; toId: number };

/** Etsy panelindeki "No Section" etiketi; API'de shop_section_id = null. */
export const NO_SECTION = "No Section";

export function normTags(tags: string[]): string[] {
  return tags.map((t) => t.trim().toLowerCase()).filter(Boolean).sort();
}

export function sameTags(a: string[], b: string[]): boolean {
  return normTags(a).join("|") === normTags(b).join("|");
}

/** "Flat Wedding Bands -> Textured Gold Bands" → ["Flat Wedding Bands", "Textured Gold Bands"]. */
export function parseSectionFix(fix: string | null): [string, string] | null {
  if (!fix) return null;
  const parts = fix.split(" -> ").map((s) => s.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export function planSeo(
  row: SeoMatrixRow,
  live: LiveListing,
  sections: Map<string, number>,
): SeoPlan {
  if (live.state !== "active") {
    return { action: "skip", reason: `state=${live.state ?? "?"}` };
  }

  const titleIsNew = live.title === row.new_title;
  const tagsAreNew = sameTags(live.tags, row.new_tags);
  const titleIsBefore = live.title === row.current_title;
  const tagsAreBefore = sameTags(live.tags, row.current_tags);

  // Sahibin elle düzenlemesi: canlı ne "önce" ne "sonra" hâline uyuyor.
  if ((!titleIsNew && !titleIsBefore) || (!tagsAreNew && !tagsAreBefore)) {
    return {
      action: "skip",
      reason: "live-changed",
      detail: {
        liveTitle: live.title,
        expectedTitle: row.current_title,
        liveTags: live.tags,
        expectedTags: row.current_tags,
      },
    };
  }

  // Bölüm: yalnız canlı bölüm matrisin "önce" bölümüyse taşınır; hedef mağazada yoksa taşınmaz.
  let sectionMove: SectionMove | null = null;
  let sectionNote: string | null = null;
  const fix = parseSectionFix(row.section_fix);
  if (fix) {
    const [from, to] = fix;
    // "No Section" Etsy'de bir bölüm değildir: listing'in shop_section_id'si boştur.
    const fromNone = from === NO_SECTION;
    const fromId = fromNone ? null : sections.get(from) ?? null;
    const toId = sections.get(to) ?? null;
    if (toId == null) {
      sectionNote = `hedef bölüm mağazada yok: ${to}`;
    } else if (live.sectionId === toId) {
      sectionNote = "bölüm zaten hedefte";
    } else if ((!fromNone && fromId == null) || live.sectionId !== fromId) {
      sectionNote = `canlı bölüm (${live.sectionId ?? "yok"}) matrisin önce hâli değil (${from}); taşınmadı`;
    } else {
      sectionMove = { from, to, toId };
    }
  }

  if (titleIsNew && tagsAreNew && !sectionMove) {
    return { action: "already", sectionMove: null };
  }
  return {
    action: "write",
    title: titleIsNew ? null : row.new_title,
    tags: tagsAreNew ? null : row.new_tags,
    sectionMove,
    sectionNote,
  };
}

/** Yazılacak satırın Etsy kurallarına uyduğunu son kez sınar (13 tag, ≤20 kr, başlık ≤140). */
export function rowProblems(row: SeoMatrixRow): string[] {
  const out: string[] = [];
  if (!row.new_title || row.new_title.length > 140) out.push(`başlık uzunluğu ${row.new_title?.length ?? 0}`);
  if (row.new_tags.length !== 13) out.push(`${row.new_tags.length} tag`);
  if (new Set(row.new_tags).size !== row.new_tags.length) out.push("tekrar eden tag");
  for (const t of row.new_tags) {
    if (t.length > 20) out.push(`tag >20: ${t}`);
    if (!/^[a-z0-9' ]+$/.test(t)) out.push(`tag karakteri: ${t}`);
  }
  return out;
}
