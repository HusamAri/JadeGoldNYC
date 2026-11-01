/**
 * Removes the "these images are design visualizations / AI-assisted" disclosure
 * from a listing description, keeping every other piece of information.
 *
 * Owner 2026-10-27: remove the parts that say the listing images are AI, for
 * by Artifact Studio Jewelry and EON. The disclosure was written into many
 * sentences that also carry real information ("sold as a pair; the product
 * images are design visualizations, ..."), so whole-sentence deletion would
 * drop facts. The rule works on clauses:
 *  - a sentence is split on ";" into clauses;
 *  - a clause that mentions the visualization is dropped, unless its leading
 *    part (before ", and" / ", so") is clean, in which case that part stays
 *    ("The bracelet has no stones, and the listing photos are ..." keeps
 *    "The bracelet has no stones");
 *  - the remaining clauses are rejoined with "; ", the first letter is raised
 *    and the sentence ends in a full stop;
 *  - a line left empty (or a bare "- ") disappears.
 * Sentences without the disclosure are returned byte for byte, and a description
 * without it comes back unchanged.
 *
 * 2026-10-31: the rule is now also the publish guard (`assertPublicText`), so it must
 * not match ordinary copy. "visualize the band width", "initials such as AI" and "a crisp
 * rendering of your handwriting" are buyer copy; "AI" and "rendering" count only next to
 * an image word ("the images are AI renderings").
 */

const IMG = String.raw`(?:images?|photos?|photographs?|gallery|pictures?|frames?|imágenes|imagen|fotos?|fotografías?|galería)`;

// A negation word (JS \b is ASCII-only, so "ningún" ends with an explicit look-ahead).
const NEG_WORD = String.raw`\b(?:not|never|no|nunca|none|nothing|nada|ningun[oa]?|ningún)(?![\wÀ-ÿ])`;
const AI_MADE = String.raw`(?:(?:created|made|generated|edited|produced) (?:with|by|using)|(?:cread[oa]s?|se crearon|generad[oa]s?|editad[oa]s?|hech[oa]s?) (?:con|por)) (?:la )?(?:AI|IA)\b`;
// A negation counts only when it governs the AI phrase: the AI phrase follows in the same
// clause, with no subordinating or contrast word in between. "Our photos are not made using
// any kind of AI", "ninguna está editada con IA" are buyer claims; "the photos are not to
// scale since they were created using AI" is still the disclosure. "Nothing but AI art",
// "none other than AI" assert AI and do not count as a negation.
const SUBORD = String.raw`\s(?:since|because|as|but|while|so|porque|pues|ya que|pero|sino|aunque|como)\s`;
const NEG_GOV = String.raw`${NEG_WORD}(?!\s+(?:but|more than|other than|más que|sino)\b)(?=(?:(?!${SUBORD})[^.;]){0,60}?\s(?:${AI_MADE}|(?:AI|IA)\b))`;

// "unedited photo shows the real ..." was the second half of the silver-chain disclosure and is only true
// once the owner has added that photo, so it goes with it.
export const VISUALIZATION_RE = new RegExp(
  [
    String.raw`visuali[sz]ations?\b`,
    String.raw`visualizaci[oó]n(?:es)?\b`,
    String.raw`\bAI-(?:assisted|generated)\b`,
    String.raw`\bgenerad[oa]s? (?:con|por) (?:la )?IA\b`,
    String.raw`(?<!\bnot )(?<!\bno )\bAI (?:design|images?|photos?|frames?|visuali[sz]|renders?|home studio|generated)`,
    // "AI" near an image word, within one clause: "La galería contiene representaciones asistidas
    // por IA". A comma or "and"/"or" ends the clause ("send us a photo, or choose initials such as
    // AI"); a negation in between is a buyer claim ("our photos are not made with AI").
    String.raw`\b${IMG}\b(?:(?!,|:| and | or | y | o |${NEG_GOV})[^.;]){0,60}\b(?:AI|IA)\b`,
    // The same stops as the image-first form, Spanish included: "Iniciales AI y las fotos del
    // anuncio muestran la pieza real" is monogram copy.
    String.raw`(?<!\bnot )(?<!\bno )\bAI\b(?:(?!,|:| and | or | y | o |${NEG_WORD})[^.;]){0,60}\b${IMG}\b`,
    // "Rendering" only as a statement that the image is one: "these photos are renders of the
    // design". "Real photos, not renderings", "without filters or renders" and "your photo
    // renders beautifully on the pendant" are buyer copy.
    String.raw`\b${IMG}\b (?:(?:in this listing|here|shown|above) )?(?:are|is|were|was) (?:an? |all )?(?:AI |3D |CAD |digital |design )?render(?:ing)?s?\b`,
    // At the start of a sentence or clause only: "Shown as a 3D rendering; ..." is the disclosure,
    // "your custom design is shown as a CAD rendering for your approval" is a proof step.
    String.raw`(?:^|[.!?;:]\s*)\s*(?:(?:[-•✔*·]|\d+[.)])\s+)?(?:shown|pictured) as an? (?:3D |CAD |digital )?rendering\b`,
    // The image itself made or edited with AI: "Images and video in this listing were created with
    // AI", "Las fotos y el video se crearon con IA". A negation governing it is a buyer claim.
    String.raw`\b${IMG}\b(?: and videos?| y (?:el |los )?v[ií]deos?)?(?:(?!${NEG_GOV})[^.;]){0,60}\b${AI_MADE}`,
    String.raw`\brecolou?red\b`,
    String.raw`\bunedited photo shows\b`,
  ].join("|"),
  "i",
);

// Raise the first letter only when the clause starts with one ("props are ..." ->
// "Props are ..."); "3 to 5 days" and "6 mm wide" stay as they are.
function capitalizeFirst(s: string): string {
  return s.replace(/^(\s*)(\p{Ll})/u, (_m, a: string, c: string) => a + c.toUpperCase());
}

export const BULLET_RE = /^\s*(?:[-•✔*·]|\d+[.)])\s+/;

// Sentence boundaries inside one line:
//  - a full stop (or "?", "!", "…"), any closing quote or bracket after it, then a space;
//  - a full stop glued to the next sentence ("acabado cepillado.Las imágenes ...", "del 3 al
//    16.Las ...", "18K.Las ...") or to the next bullet ("tallas enteras y medias.- Cada anillo
//    ..."), as the 2026 Spanish translations of the by Artifact Studio Jewelry copy were
//    written. Read as one sentence, a disclosure at its end took every bullet before it.
// Not a boundary: an abbreviation ("EE. UU. de la 3 a la 16", "EE. UU. 3 a la 13", "U.S.
// Sizes 3 to 16", "approx. 2.4 g", "e.g.") and an inline list number ("... encargo. 2. Las
// imágenes ..." keeps "2." with its own item, so the number goes when the item goes).
// "EE.UU." and "A.B." are not glued sentence ends (uppercase before the full stop).
const SPACED_RE = /[.!?…]+["”’»)\]]*(\s+)/gu;
const GLUED_RE = /(?<=(?:[\p{Ll}\d)]|\d\p{Lu})[.!?…])(?=\p{Lu})|(?<=[.!?…])(?=[-•]\s)/gu;

function isBoundary(before: string, next: string): boolean {
  if (/(?:^|[\s(])EE\.$/.test(before) && /^UU\b/.test(next)) return false;
  if (/(?:^|[\s(.])(?:UU|U\.S|U\.K)\.$/.test(before) && (/^[\d\p{Ll}]/u.test(next) || /^(?:sizes?|tallas?)\b/i.test(next))) return false;
  if (/(?:^|[\s(])(?:approx|aprox|e\.g|i\.e|vs|n[º°])\.$/i.test(before)) return false;
  if (/(?:^|[.!?…]["”’»)\]]*\s+)\d{1,2}[.)]$/.test(before)) return false;
  return true;
}

/**
 * Splits a line into sentences and keeps what stood between them, so the sentences that
 * stay can be put back with their own spacing: `seps[i]` is what preceded `parts[i]`.
 */
export function splitSentences(text: string): { parts: string[]; seps: string[] } {
  const cuts: { at: number; len: number }[] = [];
  for (const m of text.matchAll(SPACED_RE)) {
    const len = m[1].length;
    const at = (m.index ?? 0) + m[0].length - len;
    const next = text.slice(at + len);
    if (next && isBoundary(text.slice(0, at), next)) cuts.push({ at, len });
  }
  for (const m of text.matchAll(GLUED_RE)) {
    const at = m.index ?? 0;
    if (isBoundary(text.slice(0, at), text.slice(at))) cuts.push({ at, len: 0 });
  }
  cuts.sort((a, b) => a.at - b.at);
  const parts: string[] = [];
  const seps: string[] = [""];
  let pos = 0;
  for (const c of cuts) {
    if (c.at < pos) continue;
    parts.push(text.slice(pos, c.at));
    seps.push(text.slice(c.at, c.at + c.len));
    pos = c.at + c.len;
  }
  parts.push(text.slice(pos));
  return { parts, seps };
}

/**
 * Puts the kept sentences of a line back together. A sentence that was dropped takes one
 * separator with it; the gap left between its neighbours is the one before it, or the one
 * after it when the one before was a glued full stop ("A.B. C." without B is "A. C.").
 */
export function joinSentences(kept: (string | null)[], seps: string[]): string {
  let out = "";
  let started = false;
  let gap: string | null = null;
  kept.forEach((s, i) => {
    if (s === null || !s.trim()) {
      if (started && gap === null) gap = seps[i];
      return;
    }
    if (started) out += gap ? gap : seps[i];
    out += s;
    started = true;
    gap = null;
  });
  return out;
}

// Where a clause can be cut: ", and" / ", so"; and in Spanish an image clause joined by a
// bare "y" ("La pulsera no tiene piedras y las fotos del anuncio son visualizaciones ..."
// keeps "La pulsera no tiene piedras"). "oro amarillo, blanco y rosa" is not cut.
const CLAUSE_CUT_RE = /,\s+(?=(?:and|so)\s)|,?\s+(?=y\s+(?:el|la|los|las)\s+(?:fotos?|fotografías?|imagen|imágenes|galería)\b)/i;

function stripClause(clause: string): string {
  if (!VISUALIZATION_RE.test(clause)) return clause;
  const parts = clause.split(CLAUSE_CUT_RE);
  const kept: string[] = [];
  for (const p of parts) {
    if (VISUALIZATION_RE.test(p)) break;
    kept.push(p);
  }
  // No part holds the disclosure on its own: the clause stays exactly as it was.
  if (kept.length === parts.length) return clause;
  return kept.join(", ").trim();
}

export function stripSentence(sentence: string): string {
  if (!VISUALIZATION_RE.test(sentence)) return sentence;
  const bullet = BULLET_RE.exec(sentence)?.[0] ?? "";
  const body = sentence.slice(bullet.length).replace(/[.!?]\s*$/, "");
  const raw = body.split(/;\s*/);
  const mapped = raw.map(stripClause);
  if (mapped.every((c, i) => c === raw[i])) return sentence;
  const clauses = mapped.filter((c) => c.length > 0);
  if (clauses.length === 0) return "";
  return bullet + capitalizeFirst(clauses.join("; ")) + ".";
}

/**
 * The rebuilt line under its own bullet. When the first sentence went, the next one can be a
 * glued bullet of its own ("- Las imágenes son visualizaciones.- Se puede añadir ..."): one
 * bullet, not two.
 */
export function underBullet(bullet: string, rebuilt: string): string {
  if (!rebuilt) return "";
  return bullet ? bullet + rebuilt.replace(BULLET_RE, "") : rebuilt;
}

/** One line: the disclosure sentences go; "" when nothing is left. */
export function stripVisualizationLine(line: string): { text: string; removed: string[] } {
  if (!VISUALIZATION_RE.test(line)) return { text: line, removed: [] };
  const removed: string[] = [];
  const bullet = BULLET_RE.exec(line)?.[0] ?? "";
  const { parts, seps } = splitSentences(line.slice(bullet.length));
  const kept = parts.map((s, i) => {
    const src = i === 0 ? bullet + s : s;
    const next = stripSentence(src);
    if (next !== src) removed.push(s);
    return i === 0 ? next.slice(bullet.length) : next;
  });
  if (removed.length === 0) return { text: line, removed };
  return { text: underBullet(bullet, joinSentences(kept, seps).trim()), removed };
}

export function stripVisualizationDisclosure(description: string): {
  text: string;
  removed: string[];
} {
  const removed: string[] = [];
  const out: string[] = [];
  for (const line of description.replace(/\r\n/g, "\n").split("\n")) {
    const v = stripVisualizationLine(line);
    removed.push(...v.removed);
    if (v.removed.length === 0) out.push(line);
    else if (v.text) out.push(v.text);
  }
  // Nothing removed: the text comes back byte for byte (no whitespace normalisation).
  if (removed.length === 0) return { text: description, removed };
  // A dropped line can leave two blank lines in a row; collapse to one.
  const text = out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n+$/, "");
  return { text, removed };
}
