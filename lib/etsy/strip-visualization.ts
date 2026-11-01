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
    String.raw`\b${IMG}\b(?:(?!,|:| and | or | y | o |\bnot\b|\bnever\b|\bno\b|\bnunca\b)[^.;]){0,60}\b(?:AI|IA)\b`,
    String.raw`(?<!\bnot )(?<!\bno )\bAI\b(?:(?!,|:| and | or |\bnot\b|\bnever\b|\bno\b)[^.;]){0,60}\b${IMG}\b`,
    // "Rendering" only as a statement that the image is one: "these photos are renders of the
    // design". "Real photos, not renderings", "without filters or renders" and "your photo
    // renders beautifully on the pendant" are buyer copy.
    String.raw`\b${IMG}\b (?:(?:in this listing|here|shown|above) )?(?:are|is|were|was) (?:an? |all )?(?:AI |3D |CAD |digital |design )?render(?:ing)?s?\b`,
    // At the start of a sentence or clause only: "Shown as a 3D rendering; ..." is the disclosure,
    // "your custom design is shown as a CAD rendering for your approval" is a proof step.
    String.raw`(?:^|[.;:]\s*)\s*(?:[-•]\s+)?(?:shown|pictured) as an? (?:3D |CAD |digital )?rendering\b`,
    // The image itself made or edited with AI: "Images and video in this listing were created with
    // AI", "Las fotos y el video se crearon con IA". A negation is a buyer claim.
    String.raw`\b${IMG}\b(?: and videos?| y (?:el |los )?v[ií]deos?)?(?:(?!\bnot\b|\bnever\b|\bno\b|\bnunca\b)[^.;]){0,60}\b(?:(?:created|made|generated|edited|produced) (?:with|by|using)|(?:cread[oa]s?|se crearon|generad[oa]s?|editad[oa]s?|hech[oa]s?) (?:con|por)) (?:la )?(?:AI|IA)\b`,
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

function stripClause(clause: string): string {
  if (!VISUALIZATION_RE.test(clause)) return clause;
  const parts = clause.split(/,\s+(?=(?:and|so)\s)/);
  const kept: string[] = [];
  for (const p of parts) {
    if (VISUALIZATION_RE.test(p)) break;
    kept.push(p);
  }
  return kept.join(", ").trim();
}

export function stripSentence(sentence: string): string {
  if (!VISUALIZATION_RE.test(sentence)) return sentence;
  const bullet = /^\s*-\s+/.exec(sentence)?.[0] ?? "";
  const body = sentence.slice(bullet.length).replace(/[.!?]\s*$/, "");
  const clauses = body
    .split(/;\s*/)
    .map(stripClause)
    .filter((c) => c.length > 0);
  if (clauses.length === 0) return "";
  return bullet + capitalizeFirst(clauses.join("; ")) + ".";
}

/** One line: the disclosure sentences go; "" when nothing is left. */
export function stripVisualizationLine(line: string): { text: string; removed: string[] } {
  if (!VISUALIZATION_RE.test(line)) return { text: line, removed: [] };
  const removed: string[] = [];
  const bullet = /^\s*-\s+/.exec(line)?.[0] ?? "";
  const sentences = line.slice(bullet.length).split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  sentences.forEach((s, i) => {
    const next = stripSentence(i === 0 ? bullet + s : s);
    if (next !== (i === 0 ? bullet + s : s)) removed.push(s);
    const bare = i === 0 ? next.slice(bullet.length) : next;
    if (bare.trim()) kept.push(bare);
  });
  const rebuilt = kept.join(" ").trim();
  return { text: rebuilt ? bullet + rebuilt : "", removed };
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
