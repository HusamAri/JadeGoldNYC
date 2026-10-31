/**
 * Removes internal workflow and status notes from a public listing description.
 *
 * Owner 2026-10-31: "DESIGN PROPOSAL — NOT READY FOR SALE / The single image is an
 * AI-generated design visualization ... require a physical sample and maker approval.
 * No stock, hallmark, allergy or performance claim is made." — this, or anything like
 * it, in any listing of any brand is internal information and must never be public.
 *
 * The live text (2026-10-31) carried several families of such notes: an "IMPORTANT
 * PRODUCTION NOTE" section about supplier readback and owner approval (Jade Gold NYC),
 * a "WEIGHT AND PRICE NOTE" section with the cost structure and CAD approval (EON),
 * "will be confirmed before this design is offered for sale" sentences in English and
 * Spanish (EON Christmas), "Proposed solid 14K ..." bullets, a "[Insert sizes – ...]"
 * template placeholder, and "design target" / "ring concept" / "intended metal" wording.
 *
 * Edits, in this order, each recorded in `edits`:
 *  1. internal section: a heading such as "IMPORTANT PRODUCTION NOTE" goes together with
 *     its paragraph (lines up to the next blank line or heading);
 *  2. phrase: a rewrite that keeps the buyer fact and drops the internal qualifier
 *     ("Design target thickness: approximately 1.5 mm" -> "Thickness: approximately 1.5 mm");
 *  3. sentence / clause: a sentence that states an internal status is dropped; when its
 *     leading part (before ";" or ", and" / ", so") is clean, that part stays
 *     ("The listing is for one ring, made to order; final production details are
 *     confirmed before the design is offered for sale." -> "The listing is for one ring,
 *     made to order.");
 *  4. a heading whose whole section was removed goes too ("PERSONALIZATION" when its only
 *     sentence was the internal one).
 * A line without any internal signal is returned byte for byte, and a description without
 * any signal comes back unchanged.
 *
 * Image-provenance sentences ("the images are design visualizations ...") are handled by
 * `stripVisualizationDisclosure`; `stripPublicDescription` runs both.
 */

import { stripVisualizationDisclosure } from "./strip-visualization";

export type InternalEdit = { kind: "section" | "phrase" | "sentence" | "heading"; from: string; to: string };

// A clause that states an internal status. Narrow on purpose: every pattern names the
// internal fact itself (approval, readback, pre-production, "before ... for sale"), not a
// word that also appears in ordinary buyer copy.
export const INTERNAL_RE = new RegExp(
  [
    String.raw`not (?:yet )?ready for sale`,
    String.raw`\b(?:design|panel) proposal\b`,
    String.raw`\bprovisional\b`,
    String.raw`\bowner[- ]approv`,
    String.raw`\bowner approval\b`,
    String.raw`\bbefore (?:this |the )?(?:design |piece |ring |item |listing )?(?:is )?(?:offered|available|listed|ready) for sale\b`,
    String.raw`\b(?:confirmed|finali[sz]ed|specified) before (?:the )?sale\b`,
    String.raw`\bbefore (?:this |the )?design is available\b`,
    String.raw`\bnot yet specified\b`,
    String.raw`\bread-?back\b`,
    String.raw`\bsupplier (?:confirmation|cost|quote|readback|approval)\b`,
    String.raw`\bsupplied product image\b`,
    String.raw`\bfrom the supplier\b`,
    String.raw`\bEtsy (?:publication|price action)\b`,
    String.raw`\b(?:published|sent) to Etsy\b`,
    String.raw`\bbefore Etsy\b`,
    String.raw`\bpre-?production\b`,
    String.raw`\bfinal CAD\b`,
    String.raw`\bcast-weight\b`,
    String.raw`\b(?:design|development) targets?\b`,
    String.raw`\bphysical sample\b`,
    String.raw`\bmaker (?:approval|confirms|confirmation|qualification)\b`,
    String.raw`\buntil the maker\b`,
    String.raw`\bclaim is made\b`,
    String.raw`\binternal reference\b`,
    String.raw`\bfrom the approved\b`,
    String.raw`\bthe approved (?:reference|design)\b`,
    String.raw`\bunverified\b`,
    String.raw`\bpersonali[sz]ation is planned\b`,
    String.raw`antes de poner (?:este|el) diseño a la venta`,
    String.raw`no (?:está|están) (?:list[oa]s?|disponibles?) para la venta`,
  ].join("|"),
  "i",
);

// Sections that are internal from heading to the end of the paragraph.
const INTERNAL_SECTION_RE =
  /^(?:DESIGN PROPOSAL\b.*|(?:IMPORTANT )?PRODUCTION NOTES?|WEIGHT AND PRICE NOTES?|PRICE NOTES?|INTERNAL NOTES?|INTERNAL)\s*:?\s*$/i;

// An all-caps section heading such as "DETAILS" or "PERSONALIZATION".
function isHeading(line: string): boolean {
  const t = line.trim();
  return t.length >= 3 && t.length <= 70 && /\p{Lu}/u.test(t) && !/\p{Ll}/u.test(t);
}

const BULLET_RE = /^\s*(?:[-•✔*·]|\d+[.)])\s+/;

// Phrase rewrites that keep the buyer fact. Applied only on a line that carries an
// internal signal (PHRASE_SIGNAL_RE), so every other line stays byte for byte.
const PHRASE_SIGNAL_RE =
  /design target|proposed|supplier confirmation|intended metal|metal previsto|ring concept|concepto de anillo|design image|\[insert|final CAD|pre-?production estimate|until the maker confirms|^\s*PROPOSED DESIGN\s*$|^\s*MATERIAL DIRECTION\s*$/im;

type Rewrite = [RegExp, string | ((...m: string[]) => string)];
const PHRASE_REWRITES: Rewrite[] = [
  // Headings of the 2027 enamel catalog copy.
  [/^(\s*)PROPOSED DESIGN(\s*)$/, "$1DESIGN$2"],
  [/^(\s*)MATERIAL DIRECTION(\s*)$/, "$1MATERIAL$2"],
  // "Design target thickness: approximately 1.5 mm" -> "Thickness: approximately 1.5 mm"
  [/\bDesign target thickness\b/g, "Thickness"],
  [/\bdesign target thickness\b/g, "thickness"],
  // "• Proposed solid 14K ..." -> "• Solid 14K ..."; "• Proposed in solid ..." -> "• Solid ..."
  [/^(\s*(?:[-•✔*·]|\d+[.)])\s+)Proposed (?:in )?(?=solid\b|\d{1,2}K\b)/i, (_m, b) => b + "\u0000"],
  // "Proposed in solid 14K yellow gold with ..., it balances ..." -> "In solid 14K ..."
  [/(^|[.!?]\s+)Proposed in (?=solid\b|\d{1,2}K\b)/g, "$1In "],
  // "with a proposed 3 to 5 business day handling window" -> "with a 3 to 5 business day ..."
  [/\b(a|an|the) proposed (?=\d|solid\b)/gi, "$1 "],
  // ", exact diameter and closure pending supplier confirmation" / ", supplier confirmation pending"
  [/,\s*(?:[^,;.]*?\s)?(?:pending supplier confirmation|supplier confirmation pending)\b/gi, ""],
  [/\bIntended metal:/g, "Metal:"],
  [/\b([Tt])he intended metal is\b/g, "$1he metal is"],
  [/\bMetal previsto:/g, "Metal:"],
  [/\bring concept\b/g, "ring"],
  [/\bUn concepto de anillo\b/g, "Un anillo"],
  [/\bun concepto de anillo\b/g, "un anillo"],
  [/\bdesign image(s?)\b/g, "listing image$1"],
  // "[Insert sizes – 7", 7.5", 8", 8.5"" -> "7", 7.5", 8", 8.5""
  [/\[Insert [^\]–—-]*[–—-]\s*([^\]]*)\]?/gi, "$1"],
  // "... may vary by about 10% after final CAD, casting, and finishing." -> "... after casting and finishing."
  [/\bafter final CAD,? casting,? and finishing\b/gi, "after casting and finishing"],
  [/\bis a pre-?production estimate\b/g, "is an estimate"],
  // "avoid abrasive cleaners and ultrasonic cleaning until the maker confirms the care method"
  // keeps the care advice and drops the pending confirmation.
  [/\s+until the maker confirms[^.;]*/g, ""],
];

function capitalizeFirst(s: string): string {
  const i = s.search(/\p{L}/u);
  return i < 0 ? s : s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
}

function rewritePhrases(line: string): string {
  if (!PHRASE_SIGNAL_RE.test(line)) return line;
  let out = line;
  for (const [re, rep] of PHRASE_REWRITES) {
    out = out.replace(re, rep as never);
  }
  // The bullet rewrite leaves a marker where the next letter must be raised.
  out = out.replace(/\u0000(\p{L})/u, (_m, c: string) => c.toUpperCase()).replace(/\u0000/g, "");
  return out;
}

function stripClause(clause: string): string {
  if (!INTERNAL_RE.test(clause)) return clause;
  // "Ring size is selected from the options, and final measurements, weight, and fit will
  // be confirmed before ... sale": keep only the clean leading part, never a middle piece
  // of a list, so the sentence cannot end mid-list.
  const parts = clause.split(/,\s+(?=(?:and|so|but|y|pero)\s)/);
  if (parts.length > 1 && !INTERNAL_RE.test(parts[0])) return parts[0].trim();
  return "";
}

function stripSentence(sentence: string): string {
  if (!INTERNAL_RE.test(sentence)) return sentence;
  const bullet = BULLET_RE.exec(sentence)?.[0] ?? "";
  const body = sentence.slice(bullet.length);
  const end = /[.!?]\s*$/.exec(body)?.[0]?.trim() ?? "";
  const clauses = body
    .replace(/[.!?]\s*$/, "")
    .split(/;\s*/)
    .map(stripClause)
    .filter((c) => c.length > 0);
  if (clauses.length === 0) return "";
  const kept = capitalizeFirst(clauses.join("; "));
  // A bullet without a full stop stays without one.
  return bullet + kept + (end || (bullet ? "" : "."));
}

function stripLine(line: string, edits: InternalEdit[]): string {
  const rewritten = rewritePhrases(line);
  if (rewritten !== line) edits.push({ kind: "phrase", from: line, to: rewritten });
  if (!INTERNAL_RE.test(rewritten)) return rewritten;
  const bullet = BULLET_RE.exec(rewritten)?.[0] ?? "";
  const sentences = rewritten.slice(bullet.length).split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  sentences.forEach((s, i) => {
    const src = i === 0 ? bullet + s : s;
    const next = stripSentence(src);
    if (next !== src) edits.push({ kind: "sentence", from: s, to: i === 0 ? next.slice(bullet.length) : next });
    const bare = i === 0 ? next.slice(bullet.length) : next;
    if (bare.trim()) kept.push(bare);
  });
  const rebuilt = kept.join(" ").trim();
  return rebuilt ? bullet + rebuilt : "";
}

export function stripInternalNotes(description: string): { text: string; edits: InternalEdit[] } {
  const edits: InternalEdit[] = [];
  const lines = description.replace(/\r\n/g, "\n").split("\n");

  // Pass 1: whole internal sections.
  const keep: (string | null)[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isHeading(lines[i]) && INTERNAL_SECTION_RE.test(lines[i].trim())) {
      const block = [lines[i]];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "" && !isHeading(lines[j])) {
        block.push(lines[j]);
        j++;
      }
      edits.push({ kind: "section", from: block.join("\n"), to: "" });
      for (let k = i; k < j; k++) keep.push(null);
      i = j - 1;
      continue;
    }
    keep.push(lines[i]);
  }

  // Pass 2: phrases and sentences, line by line; remember which lines were emptied.
  const out: (string | null)[] = keep.map((line) => {
    if (line === null) return null;
    const next = stripLine(line, edits);
    return next === "" && line.trim() !== "" ? null : next;
  });

  // Pass 3: a heading whose section had content and lost all of it goes too.
  for (let i = 0; i < out.length; i++) {
    const line = out[i];
    if (line === null || !isHeading(line)) continue;
    let had = false;
    let has = false;
    for (let j = i + 1; j < lines.length; j++) {
      if (isHeading(lines[j])) break;
      if (lines[j].trim() !== "") had = true;
      if (out[j] !== null && (out[j] as string).trim() !== "") has = true;
    }
    if (had && !has) {
      edits.push({ kind: "heading", from: line, to: "" });
      out[i] = null;
    }
  }

  if (edits.length === 0) return { text: description, edits };
  const text = out
    .filter((l): l is string => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
  return { text, edits };
}

/** Both public-text rules: image-provenance disclosure, then internal notes. */
export function stripPublicDescription(description: string): {
  text: string;
  removed: string[];
  edits: InternalEdit[];
} {
  const v = stripVisualizationDisclosure(description);
  const i = stripInternalNotes(v.text);
  return { text: i.text, removed: v.removed, edits: i.edits };
}
