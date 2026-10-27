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
 * Sentences without the disclosure are returned byte for byte.
 */

// "unedited photo shows the real ..." was the second half of the silver-chain disclosure and is only true
// once the owner has added that photo, so it goes with it.
export const VISUALIZATION_RE = /visuali[sz]|AI-assisted|\bAI\b|recolou?red|\brendering\b|unedited photo shows/i;

function capitalizeFirst(s: string): string {
  const i = s.search(/[A-Za-z]/);
  return i < 0 ? s : s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
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

export function stripVisualizationDisclosure(description: string): {
  text: string;
  removed: string[];
} {
  const removed: string[] = [];
  const lines = description.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (!VISUALIZATION_RE.test(line)) {
      out.push(line);
      continue;
    }
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
    if (rebuilt) out.push(bullet + rebuilt);
  }
  // A dropped line can leave two blank lines in a row; collapse to one.
  const text = out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n+$/, "");
  return { text, removed };
}
