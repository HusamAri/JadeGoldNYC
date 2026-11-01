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
// Not a boundary:
//  - after an abbreviation that never ends a sentence here ("e.g.", "i.e.", "vs.", "p. ej.");
//  - after any abbreviation before a lowercase word or a number ("0.10 ct. diamond band",
//    "16 in. and 18 in. chains", "EE. UU. 3 a la 13", "approx. 2g", "Style No. 12", "10K vs.
//    14K"); inside an open bracket ("(approx. Size 7)"); "EE." before "UU."; "U.S."/"approx."
//    before a size word ("U.S. Sizes 3 to 16", "approx. US 7"). Before any other capital
//    "approx." and "U.S." can end a sentence ("12 mm approx. The images ...", "Free shipping
//    in the U.S. The images ...");
//  - after an ellipsis before a lowercase word ("las fotos… fueron editadas");
//  - an inline list number, when the full stop before it is a real sentence end ("... encargo.
//    2. Las imágenes ..." keeps "2." with its own item, so the number goes when the item goes;
//    "talla de EE. UU. 7. Las imágenes ..." is a size, not an item).
// Any other full stop before a lowercase word is a sentence end, as before ("... visualizations.
// iPhone photos are sent", "by Artifact Studio Jewelry pieces are ...", all-lowercase copy).
// "EE.UU." and "A.B." are not glued sentence ends (uppercase before the full stop).
const SPACED_RE = /[.!?…]+["”’»)\]]*(\s+)/gu;
const GLUED_RE = /(?<=(?:[\p{Ll}\d)]|\d\p{Lu})[.!?…])(?=\p{Lu})|(?<=[.!?…])(?=[-•]\s)/gu;
const NEVER_END_RE = /(?:^|[\s(.])(?:e\.g|i\.e|vs|p\. ej|ej)\.$/i;
const ABBREV_END_RE = /(?:^|[\s(.])(?:EE|UU|U\.S|U\.K|approx|aprox|e\.g|i\.e|vs|n[º°]|No|ct|in|incl|ej|ca|p|mín|máx|min|max)\.$/;
// A number on its own, with a unit or karat glued to it or not ("7", "3 a la 13", "2.4 g",
// "2g", "15mm", "14K", "½"), not a word that starts with one ("3D").
// A counted noun is not a size ("EE. UU. 3 de las imágenes son ...", "U.S. 2 of the photos ...").
const NUMBER_NEXT_RE = /^(?:\d+(?:[.,]\d+)?(?:\s?(?:mm|cm|in|g|gr|ct|oz|[kK]))?(?![\p{L}\d])(?!\s+(?:of|de)\s)|[½¼¾⅓⅔])/u;
const SIZE_WORD_RE = /^(?:sizes?|tallas?|US\b|U\.S\.|EE\.)/i;
// Only the end of the text before a cut matters; a long line must not cost the whole prefix
// at every cut.
const TAIL = 160;

function openBracket(s: string): boolean {
  let n = 0;
  for (const c of s) {
    if (c === "(" || c === "[") n++;
    else if ((c === ")" || c === "]") && n > 0) n--;
  }
  return n > 0;
}

/** The rules without the inline-list-number one (that one asks these about its own stop). */
function plainBoundary(core: string, next: string): boolean {
  if (/(?:^|[\s(])EE\.$/.test(core) && /^UU\b/.test(next)) return false;
  if (NEVER_END_RE.test(core)) return false;
  const abbrev = ABBREV_END_RE.test(core);
  if (abbrev && (/^\p{Ll}/u.test(next) || NUMBER_NEXT_RE.test(next) || openBracket(core))) return false;
  if (/^\p{Ll}/u.test(next) && /(?:…|\.\.\.)$/.test(core)) return false;
  if (/(?:^|[\s(.])(?:UU|U\.S|U\.K|approx|aprox)\.$/.test(core) && SIZE_WORD_RE.test(next)) return false;
  return true;
}

function isBoundary(before: string, next: string): boolean {
  const tail = before.length > TAIL ? before.slice(-TAIL) : before;
  // A quoted or bracketed full stop before a lowercase word is inside the sentence
  // ("Engraved with “Forever.” on the inside").
  if (/[.!?…]["”’»)\]]+$/.test(tail) && /^\p{Ll}/u.test(next)) return false;
  const core = tail.replace(/["”’»)\]]+$/, "");
  if (!plainBoundary(core, next)) return false;
  if (before.length <= TAIL && /^\s*\d{1,2}[.)]$/.test(core)) return false;
  const item = /^([\s\S]*[.!?…]["”’»)\]]*)\s+(\d{1,2}[.)])$/.exec(core);
  // A run of bare numbers is a list of values ("Sizes: 3. 4. 5. 6."), not item markers.
  const run = item && /(?:^|\s)\d{1,2}[.)]["”’»)\]]*$/.test(item[1]);
  if (item && !run && plainBoundary(item[1].replace(/["”’»)\]]+$/, ""), item[2] + " " + next)) return false;
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

// A tail that starts with a pronoun points back into the dropped clause ("..., and they may
// vary by 10%"): kept alone it would say nothing about what varies.
const PRONOUN_LEAD_RE = /^(?:it|its|they|their|them|this|these|those|he|she|ello|ella|ellas|ellos|esto|estos|estas|este|esta)\b/i;
const ARTICLE_LEAD_RE = /^(?:el|la|los|las|un|una|unos|unas)\s/i;
// "... in yellow, white, and rose gold": an ", and" right after a one-to-three word list item
// closes the list; what follows it is the last item, not a clause ("- Rose gold.").
const LIST_ITEM_END_RE = /,\s*(?:\S+\s+){0,2}\S+\s*$/;

/**
 * What stays of the clauses after a dropped lead ("[dropped], and the three-metal image shows
 * ..."): only an ", and" / ", y" tail is independent, and only when no part of it is flagged
 * too. ", so ..." states a consequence of the dropped part and goes with it. A tail without
 * its own subject goes too: a pronoun lead in English, and in Spanish (which drops the
 * pronoun) anything but an article; so does the last item of a list the lead ends in.
 * "" when nothing stays.
 */
export function independentTail(lead: string, tail: string[], flagged: RegExp): string {
  if (LIST_ITEM_END_RE.test(lead)) return "";
  if (tail.length === 0 || !tail.every((p) => !flagged.test(p) && /^(?:and|y)\s/.test(p))) return "";
  const t = tail.join(", ").replace(/^(?:and|y)\s+/, "").trim();
  if (PRONOUN_LEAD_RE.test(t)) return "";
  if (/^y\s/.test(tail[0]) && !ARTICLE_LEAD_RE.test(t)) return "";
  return t;
}

// "[disclosure], and the finished piece may vary slightly" compares the piece with the images it
// has just called visualizations: a consequence, like ", so ...", and it goes with them (the
// 2026-10-27 pass took it so in 12 English listings). After ";" or as a sentence of its own it
// is the author's own note and stays.
const VARY_RE = /\b(?:may|might|can|could|will) (?:vary|differ)\b|\bpueden? (?:variar|diferir)\b/i;
// A kept clause that says the image "visualizes" a design says what it shows.
const SHOWS: [RegExp, string][] = [
  [/\bvisuali[sz]es\b/g, "shows"],
  [/\bvisuali[sz]e\b/g, "show"],
  [/\bvisualizan\b/g, "muestran"],
  [/\bvisualiza\b/g, "muestra"],
];

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
  if (kept.length > 0) return kept.join(", ").trim();
  // The disclosure leads: "Las imágenes del producto son visualizaciones de diseño, y la imagen
  // de los tres metales muestra el mismo diseño en oro amarillo, blanco y rosa" keeps the
  // three-metal clause, as a clean tail after an internal note does (2026-11-01: six Artifact
  // listings had lost it in English and Spanish only because it followed ", and" not ";").
  const tail = independentTail(parts[0], parts.slice(1).filter((p) => !VARY_RE.test(p)), VISUALIZATION_RE);
  return SHOWS.reduce((t, [re, rep]) => t.replace(re, rep), tail);
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
export function underBullet(bullet: string, rebuilt: string, firstWent: boolean): string {
  if (!rebuilt) return "";
  return bullet && firstWent ? bullet + rebuilt.replace(BULLET_RE, "") : bullet + rebuilt;
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
  return { text: underBullet(bullet, joinSentences(kept, seps).trim(), !kept[0].trim()), removed };
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
