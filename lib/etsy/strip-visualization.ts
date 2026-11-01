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

// After a disclosure that leads its clause, only a caption stays: a clause whose subject is an
// image and which says what that image shows ("[the product images are design
// visualizations], and the three-metal image shows the same design in yellow, white and rose
// gold"). 2026-11-01: six Artifact listings had lost exactly that, in English and Spanish, only
// because it followed ", and" / ", y" rather than ";". Everything else after the disclosure
// still goes with it: the last item of a list ("..., and the gift box"), a participle
// ("..., and packaged in a gift box"), a consequence ("..., and the finished piece may vary
// slightly", 12 English listings 2026-10-27), a pronoun ("..., and they ...").
// A Spanish word of the subject is never a clitic: "las fotos ... se muestran (con fines
// ilustrativos)" is a passive that says nothing the image shows.
const ES_WORD = String.raw`(?!(?:se|lo|le|les)\b)[\p{L}\d/-]+`;
const CAPTION_RE = new RegExp(
  String.raw`^(?:the|this|each|every)\s+(?:[\w/-]+\s+){0,3}(?:images?|photos?|photographs?|pictures?)\s+` +
    String.raw`(?:shows?|represents?|displays?|depicts?|features?|illustrates?|presents?|visuali[sz]es?)\b` +
    "|" +
    String.raw`^(?:la|las|el|los|esta|estas|cada)\s+(?:imagen|imágenes|foto|fotos|fotografía|fotografías)` +
    String.raw`(?:\s+(?:de|del|con|en)\s+(?:(?:los|las|el|la)\s+)?${ES_WORD}(?:\s+${ES_WORD}){0,2})?` +
    String.raw`\s+(?:(?:lo|la|los|las)\s+)?(?:muestran?|representan?|presentan?|ilustran?|enseñan?|visualizan?)\b`,
  "iu",
);
// The caption ends where a new clause starts: ", so" / ", por lo que" (a consequence), or an
// ", and" / ", y" part with a verb of its own ("..., and the finished piece may vary slightly",
// "..., y las fotos no son de una pieza real"). A part without a verb is the caption's own list
// ("..., white, and rose gold", "..., the chain, and the gift box") and stays.
const CAPTION_PART_RE = /,\s+(?=(?:and|so|but|while|whereas|y|pero|por lo que|así que|mientras que)\s)/i;
const NEW_CLAUSE_RE = new RegExp(
  String.raw`^(?:so|but|while|whereas|pero|por lo que|así que|mientras que)\s` +
    String.raw`|\b(?:is|are|was|were|be|been|being|will|would|may|might|can|could|should|must|has|have|had|do|does|did|ships?|comes?|includes?|arrives?|varies|vary|differs?|looks?|appears?|remains?|stays?` +
    String.raw`|es|son|era|eran|fue|fueron|está|están|estará|estarán|será|serán|puede|pueden|podría|podrían|tiene|tienen|incluye|incluyen|llega|llegan|varía|varían|hay|se)\b`,
  "iu",
);
// A caption that calls what the image shows a render says what the dropped disclosure said
// ("the three-metal image shows a rendering of the same design"): it goes with it. (Elsewhere
// "rendering" alone is buyer copy, see VISUALIZATION_RE; this applies only to a restored caption.)
const CAPTION_PROVENANCE_RE = /\b(?:3D |CAD |digital |AI )?render(?:ing|ings|s|ed)?\b|\bCGI\b|\bmock-?ups?\b|\brenderizad[oa]s?\b|\brepresentaci[oó]n(?:es)? (?:digital(?:es)?|3D)\b|\bmaqueta digital\b/i;
function captionOnly(caption: string): string {
  const parts = caption.split(CAPTION_PART_RE);
  const end = parts.findIndex((p, i) => i > 0 && NEW_CLAUSE_RE.test(p));
  return (end < 0 ? parts : parts.slice(0, end)).join(", ");
}
// A kept caption whose own verb says the image "visualizes" a design says what it shows.
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
  // The disclosure leads: a clean caption after it stays (CAPTION_RE); nothing else does.
  const tail = parts.slice(1);
  if (tail.length === 0 || tail.some((p) => VISUALIZATION_RE.test(p))) return "";
  const caption = captionOnly(tail.join(", ").replace(/^(?:and|y)\s+/, "").trim());
  const head = CAPTION_RE.exec(caption)?.[0];
  if (!head || CAPTION_PROVENANCE_RE.test(caption)) return "";
  // Only the caption's verb: "so you can visualize the width" later in it is the buyer's.
  return SHOWS.reduce((t, [re, rep]) => t.replace(re, rep), head) + caption.slice(head.length);
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
