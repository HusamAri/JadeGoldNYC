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
    String.raw`\b(?:approved|ready) for Etsy\b`,
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
    String.raw`\bsample required\b`,
    String.raw`\bphysical verification\b`,
    String.raw`\bmust be confirmed in writing\b`,
    String.raw`\boriginal reference length\b`,
    String.raw`\bprovided specifications\b`,
    String.raw`\bnot (?:listed|specified|provided) in the listing(?: details| information)?\b`,
    String.raw`\bare not provided here\b`,
    String.raw`\bnot established by (?:the |these )?images\b`,
    String.raw`\bcasting waste\b`,
    String.raw`\bUSD \d+ production cost\b`,
    String.raw`antes de poner (?:este|el) diseño a la venta`,
    String.raw`no (?:está|están) (?:list[oa]s?|disponibles?) para la venta`,
    String.raw`\bverificación física\b`,
    String.raw`\bno establecen las medidas\b`,
    String.raw`\bmust be checked before\b`,
    String.raw`\basistidas? por IA\b`,
    String.raw`\bmuestra (?:física|fotografiada)\b`,
    String.raw`\bsin recolorear\b`,
    String.raw`\bes necesario comprobar\b`,
  ].join("|"),
  "i",
);

// Sections that are internal from heading to the end of the paragraph.
const INTERNAL_SECTION_RE =
  /^(?:DESIGN PROPOSAL\b.*|(?:IMPORTANT )?PRODUCTION NOTES?|WEIGHT AND PRICE NOTES?|PRICE NOTES?|INTERNAL NOTES?|INTERNAL|(?:SIZE AND )?SPECIFICATION STATUS)\s*:?\s*$/i;

// An all-caps section heading such as "DETAILS" or "PERSONALIZATION".
function isHeading(line: string): boolean {
  const t = line.trim();
  return t.length >= 3 && t.length <= 70 && /\p{Lu}/u.test(t) && !/\p{Ll}/u.test(t);
}

const BULLET_RE = /^\s*(?:[-•✔*·]|\d+[.)])\s+/;

// Phrase rewrites that keep the buyer fact. Applied only on a line that carries an
// internal signal (PHRASE_SIGNAL_RE), so every other line stays byte for byte.
const PHRASE_SIGNAL_RE =
  /design target|proposed|provisional listing|quoted (?:bracelet|necklace|chain|anklet) length|model preview|vista previa|created for this metal colou?r|final stone specification|design dimensions|para fundición|unless explicitly stated|in this draft|este borrador no ofrece|\bC\d{5}\b|\}\s*$|CAD final|supplier confirmation|intended metal|metal previsto|ring concept|concepto de anillo|design image|\[insert|final CAD|pre-?production estimate|until the maker confirms|^\s*PROPOSED DESIGN\s*$|^\s*MATERIAL DIRECTION\s*$/im;

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
  // "Personalization is not enabled in this provisional listing" keeps the buyer fact.
  [/\s+in this provisional listing\b/g, ""],
  // "7.5 inch quoted bracelet length" (the supplier quote) -> "7.5 inch bracelet length"
  [/\bquoted (bracelet|necklace|chain|anklet) length\b/g, "$1 length"],
  // EON 4593576445: the section stays (styling and props notes), the "preview" name goes.
  [/^(\s*)ABOUT THIS MODEL PREVIEW(\s*)$/, "$1ABOUT THE IMAGES$2"],
  [/^(\s*)VISTA PREVIA(\s*)$/, "$1SOBRE LAS IMÁGENES$2"],
  // "The main image was created for this metal color." -> "The main image shows this metal color."
  [/\bwas created for this metal (colou?r)\b/g, "shows this metal $1"],
  // "after the final stone specification and size are confirmed" -> "after the size is confirmed"
  [/\bafter the final stone specification and size are confirmed\b/g, "after the size is confirmed"],
  // "Approximate design dimensions: 16.3 mm ..." -> "Approximate dimensions: 16.3 mm ..."
  [/\b([Aa]pproximate) design dimensions\b/g, "$1 dimensions"],
  // Spanish "motivo integrado para fundición" (prepared for casting) -> "motivo fundido integrado"
  [/\bmotivo integrado para fundición\b/g, "motivo fundido integrado"],
  [/\s+unless explicitly stated\b/g, ""],
  // "Inside engraving is not offered in this draft." -> "Inside engraving is not offered."
  [/\s+in this draft\b/g, ""],
  [/\bEste borrador no ofrece\b/g, "No se ofrece"],
  // A supplier catalog code in the copy: "in the C19269 Pebble Station Bracelet" -> "in the Pebble Station Bracelet"
  [/\b(the|The) C\d{5} (?=\p{Lu})/gu, "$1 "],
  // Template residue: a closing brace at the end of a line that never opened one.
  [/^([^{]*?[.!?])\}\s*$/, "$1"],
  // "después del CAD final, la fundición y el acabado" -> "después de la fundición y el acabado"
  [/\bdespués del CAD final, la fundición y el acabado\b/g, "después de la fundición y el acabado"],
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
  // A leading part that holds a comma is a list fragment ("Final diamond color, clarity,
  // and certificate ... must be confirmed"), not a sentence of its own: never keep it.
  if (parts.length > 1 && !INTERNAL_RE.test(parts[0]) && !parts[0].includes(",")) return parts[0].trim();
  // "Final physical dimensions and weight are not established by the images, and props
  // are not included": the internal part leads and a clean tail follows; keep the tail.
  // Only an ", and" tail is independent; ", so ..." states a consequence of the internal
  // part ("added after production readback, so the finished weight is confirmed after
  // production") and goes with it.
  const tail = parts.slice(1);
  if (tail.length > 0 && tail.every((p) => !INTERNAL_RE.test(p) && /^(?:and|y)\s/.test(p))) {
    return tail.join(", ").replace(/^(?:and|y)\s+/, "").trim();
  }
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

/**
 * Alt text of a listing image. Etsy serves alt text with the photo (screen readers,
 * page source), so it is public text too. The 2027 enamel gallery tools wrote
 * "<Name>: <frame>. AI design visualization, 2048 square upscale. [marker]" and
 * "<Name>: AI home studio design visualization. [marker]". The visualization note goes;
 * a trailing "[...]" marker stays, because the gallery tools find their images by it.
 * When only a "Name:" label would be left, the listing title is used.
 */
export function cleanAltText(alt: string, fallback: string): string {
  const m = /\s*(\[[^\]]*\])\s*$/.exec(alt);
  const marker = m ? m[1] : "";
  let body = (m ? alt.slice(0, m.index) : alt)
    .replace(/\s*\bAI design visuali[sz]ation, 2048 square upscale\.?/gi, "")
    .replace(/\bAI home studio design visuali[sz]ation\b/gi, "home studio view");
  body = stripPublicDescription(body).text.replace(/\s+/g, " ").trim();
  if (!/\p{L}{3,}/u.test(body.replace(/^[^:]{0,90}:\s*$/u, ""))) body = fallback.replace(/\s+/g, " ").trim();
  return [body, marker].filter(Boolean).join(" ").slice(0, 500);
}

/** The first fragment the public-text rules would remove, or null when the text is clean. */
export function publicTextProblem(text: string): string | null {
  const r = stripPublicDescription(text);
  if (r.text === text) return null;
  return r.removed[0] ?? r.edits[0]?.from ?? "değişiklik";
}

/**
 * Guard for every path that writes text to a live Etsy listing: refuses text that still
 * carries an internal note or an image-provenance disclosure, so nothing internal can be
 * published by a push that forgot to clean it. ops/desc-strip is the tool that cleans.
 */
export function assertPublicText(text: string, what: string): void {
  const problem = publicTextProblem(text);
  if (problem) {
    throw new Error(
      `${what} kamuya açık olmaması gereken bir not taşıyor ("${problem.slice(0, 120)}"); ` +
        "önce ops/desc-strip ile temizleyin.",
    );
  }
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
