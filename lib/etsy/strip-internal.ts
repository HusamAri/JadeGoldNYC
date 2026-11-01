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
 * template placeholder, "design target" / "ring concept" / "intended metal" wording, and
 * maker instructions in the 2027 enamel copy ("hanging balance must be sampled").
 *
 * Edits, in this order, each recorded in `edits`:
 *  1. internal section: a heading such as "IMPORTANT PRODUCTION NOTE" goes together with
 *     the lines under it that carry an internal or image-provenance signal; the first
 *     clean line ends the section, so buyer copy written right under it stays. A heading
 *     whose lines carry no signal is not a section ("PRICE NOTE / Price is for one
 *     earring" stays);
 *  2. phrase: a rewrite that keeps the buyer fact and drops the internal qualifier
 *     ("Design target thickness: approximately 1.5 mm" -> "Thickness: approximately 1.5 mm");
 *  3. sentence / clause: a sentence that states an internal status is dropped; when its
 *     leading part (before ";" or ", and" / ", so") is clean, that part stays
 *     ("The listing is for one ring, made to order; final production details are
 *     confirmed before the design is offered for sale." -> "The listing is for one ring,
 *     made to order.");
 *  4. a heading whose paragraph was removed goes too ("PERSONALIZATION" when its only
 *     sentence was the internal one).
 * A line without any internal signal is returned byte for byte, and a description without
 * any signal comes back unchanged.
 *
 * Every pattern names the internal fact itself, in the wording the live text and the repo
 * generators actually used. Ordinary buyer copy that shares a word ("Ring size must be
 * checked before ordering", "we send you a design proposal", "your provided
 * specifications") is not matched.
 *
 * `stripPublicDescription` also removes the image-provenance disclosure
 * (`stripVisualizationLine`, "the images are design visualizations ...") in the same pass,
 * so a heading left empty by either rule goes.
 */

import { stripVisualizationLine, VISUALIZATION_RE } from "./strip-visualization";

export type InternalEdit = { kind: "section" | "phrase" | "sentence" | "heading"; from: string; to: string };

// A clause that states an internal status.
export const INTERNAL_RE = new RegExp(
  [
    String.raw`not (?:yet )?ready for sale`,
    // "The display box shown is not available for sale" is buyer copy; the design as subject is not.
    String.raw`\b(?:this|the) (?:design|listing|piece) is not (?:yet )?available for sale\b`,
    String.raw`^\s*DESIGN PROPOSAL\b`,
    // After a bullet only with a status tail: "• Design proposal for Fall 2026"; not a custom-order
    // step ("2. Design proposal: we email a sketch within 48 hours").
    String.raw`^\s*(?:[-•✔*·]|\d+[.)])\s+DESIGN PROPOSAL\b(?=\s*(?:[—–-]|:?\s*$|for (?:Spring|Summer|Fall|Autumn|Winter|\d{4})\b))`,
    // "once you approve the design proposal" is a custom-order step; the listing's own status is not.
    String.raw`\bthis design proposal\b`,
    String.raw`\bthis (?:listing|design|piece|ring) is (?:a|the|only a) design proposal\b`,
    String.raw`\bpanel proposal\b`,
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
    String.raw`\b(?:confirmed|verified) from the supplier\b`,
    String.raw`\bEtsy (?:publication|price action)\b`,
    String.raw`\b(?:published|sent) to Etsy\b`,
    String.raw`\bbefore Etsy\b`,
    String.raw`\b(?:approved|ready) for Etsy\b`,
    String.raw`\bpre-?production\b`,
    // "Final CAD and cast-weight approval" is internal; "we send the final CAD for your approval" is not.
    String.raw`(?<!\byou the )\bfinal CAD\b(?! (?:for|to|with) you)`,
    String.raw`\bcast-weight\b`,
    String.raw`\b(?:design|development) targets?\b`,
    String.raw`\bphysical sample\b`,
    String.raw`\bmaker (?:approval|confirmation|qualification)\b`,
    String.raw`\bgoldsmith qualification\b`,
    String.raw`\buntil the maker\b`,
    String.raw`\bclaim is made\b`,
    String.raw`\binternal reference\b`,
    String.raw`^\s*internal notes?\s*:`,
    String.raw`\bfrom the approved\b`,
    String.raw`\bthe approved reference\b`,
    String.raw`\bunverified\b`,
    String.raw`\bpersonali[sz]ation is planned\b`,
    String.raw`\bsample required\b`,
    String.raw`\bmust be sampled\b`,
    // "verify the actual chain end can pass" (maker); "verify the actual ring size with a jeweler" is buyer advice.
    String.raw`\bverify the actual (?:chain|bail|jump ring|post|clearance)\b[^.;]*\bcan pass\b`,
    String.raw`\bFire the (?:motif|enamel) before\b`,
    String.raw`\bphysical verification\b`,
    String.raw`\bmust be confirmed in writing\b`,
    String.raw`\boriginal reference length\b`,
    String.raw`\bamong the provided specifications\b`,
    // "- Stamp details are not specified in the listing information." (generator residue);
    // "if your size is not listed in the listing, message us" is not matched.
    // A statement, not a buyer question ("Need a size not specified in the listing? Message us").
    String.raw`\bnot (?:specified|provided) in the listing(?: details| information)?(?=\s*\.|\s*$)`,
    String.raw`\bare not provided here\b`,
    String.raw`\bnot established by (?:the |these )?images\b`,
    String.raw`\bcasting waste\b`,
    // Cost structure: "one additional gram of casting waste and USD 100 production cost".
    String.raw`\bUSD \d+ (?:production cost|labou?r)\b`,
    // "Every price includes one additional gram of ..." (cost structure); not "the Heavy option
    // adds an additional gram of gold".
    String.raw`\b(?:price|prices|cost) includes? (?:one |an )?additional gram of (?:gold|casting waste)\b`,
    String.raw`\bmust be checked before (?:engraving|this|it) can be (?:promised|offered)\b`,
    // Spanish.
    String.raw`antes de poner (?:este|el) diseño a la venta`,
    String.raw`no (?:(?:está|están) )?list[oa]s? para la venta`,
    String.raw`\b(?:este|el) (?:diseño|anuncio) no (?:está )?disponible para la venta\b`,
    // As in English: the heading and the listing's own status, not "te enviamos una propuesta de diseño".
    String.raw`^\s*PROPUESTA DE DISEÑO\b`,
    String.raw`^\s*(?:[-•✔*·]|\d+[.)])\s+PROPUESTA DE DISEÑO\b(?=\s*(?:[—–-]|:?\s*$|para (?:primavera|verano|otoño|invierno|\d{4})\b))`,
    String.raw`\besta propuesta de diseño\b`,
    // "Las dimensiones son objetivos de desarrollo", "grosor objetivo de diseño"; not "nuestro objetivo de diseño fue ...".
    String.raw`\b(?:son|como) objetivos? de (?:diseño|desarrollo)\b`,
    String.raw`\b(?:grosor|espesor|ancho|largo|longitud|altura|peso|medidas?|dimensiones|diámetro) objetivos? de (?:diseño|desarrollo)\b`,
    String.raw`\bbasad[oa]s? en el objetivo de diseño\b`,
    String.raw`\b(?:previas? a la producción|preproducción)\b`,
    String.raw`\baprobación del (?:propietario|fabricante)\b`,
    String.raw`\baprobad[oa]s? por el propietario\b`,
    String.raw`\bpersonalización (?:está )?prevista\b`,
    String.raw`\bse confirmar[áa]n? antes de (?:la )?venta\b`,
    String.raw`\bantes de (?:la )?publicación en Etsy\b`,
    String.raw`\bno se hace ninguna afirmación\b`,
    String.raw`\bverificación física\b`,
    String.raw`\bno establecen las medidas\b`,
    String.raw`\basistidas? por IA\b`,
    String.raw`\bgenerad[oa]s? por IA\b`,
    String.raw`\bmuestra física\b`,
    String.raw`\bmuestra fotografiada es la referencia\b`,
    String.raw`\bsin recolorear\b`,
    String.raw`\bes necesario comprobar el espacio disponible\b`,
  ].join("|"),
  "i",
);

// Headings of internal sections.
// Internal by name: the heading takes its whole paragraph (up to the next blank line or
// heading), whatever the lines say ("INTERNAL NOTES / Maker: ..., quote 2 g + 100 USD").
const INTERNAL_BY_NAME_RE =
  /^(?:DESIGN PROPOSAL\b.*|PROPUESTA DE DISEÑO\b.*|IMPORTANT PRODUCTION NOTES?|WEIGHT AND PRICE NOTES?|INTERNAL NOTES?|INTERNAL|(?:SIZE AND )?SPECIFICATION STATUS)\s*:?\s*$/i;
// Ambiguous: a buyer section can share the name ("PRICE NOTE / Price is for one earring").
// The heading goes only with the lines under it that carry a signal; the first clean line ends it.
const INTERNAL_SECTION_RE = /^(?:PRODUCTION NOTES?|PRICE NOTES?)\s*:?\s*$/i;

// An all-caps line such as "DETAILS" or "PERSONALIZATION".
function isHeading(line: string): boolean {
  const t = line.trim();
  return t.length >= 3 && t.length <= 70 && /\p{Lu}/u.test(t) && !/\p{Ll}/u.test(t);
}

const BULLET_RE = /^\s*(?:[-•✔*·]|\d+[.)])\s+/;

// A section heading proper: not an all-caps bullet ("• US 7") or label ("SIZE: US 7").
function isSectionHeading(line: string): boolean {
  return isHeading(line) && !BULLET_RE.test(line) && !/:\s*\S/.test(line.trim());
}

// Phrase rewrites that keep the buyer fact. Applied only on a line that carries an
// internal signal (PHRASE_SIGNAL_RE), so every other line stays byte for byte.
const PHRASE_SIGNAL_RE =
  /design target|proposed|provisional listing|quoted (?:bracelet|necklace|chain|anklet) length|model preview|vista previa|created for this metal colou?r|final stone specification|design dimensions|para fundición|No personali[sz]ation unless explicitly stated\s*$|in this draft|este borrador no ofrece|\bC\d{5}\b|\}\s*$|CAD final|supplier confirmation|intended metal|metal previsto|(?:ring|necklace|pendant|bracelet|anklet|band) concept|concepto de anillo|objetivo de diseño|as (?:seen|shown) in the design image|\[insert|final CAD|pre-?production estimate|until the maker confirms|^\s*PROPOSED DESIGN\s*$|^\s*MATERIAL DIRECTION\s*$/im;

const cap = (w: string) => w[0].toUpperCase() + w.slice(1);

type Rewrite = [RegExp, string | ((...m: string[]) => string)];
const PHRASE_REWRITES: Rewrite[] = [
  // Headings of the 2027 enamel catalog copy.
  [/^(\s*)PROPOSED DESIGN(\s*)$/, "$1DESIGN$2"],
  [/^(\s*)MATERIAL DIRECTION(\s*)$/, "$1MATERIAL$2"],
  // "Design target thickness: approximately 1.5 mm" -> "Thickness: approximately 1.5 mm"
  [/\b([Dd])esign target (thickness|width|weight|length|diameter|height)\b/g, (_m, d, w) => (d === "D" ? cap(w) : w)],
  // "• Proposed solid 14K ..." -> "• Solid 14K ..."; "• Proposed in solid ..." -> "• Solid ..."
  [/^(\s*(?:[-•✔*·]|\d+[.)])\s+)Proposed (?:in )?(?=solid\b|\d{1,2}K\b)/i, (_m, b) => b + "\u0000"],
  // "Proposed in solid 14K yellow gold with ..., it balances ..." -> "In solid 14K ..."
  [/(^|[.!?]\s+)Proposed in (?=solid\b|\d{1,2}K\b)/g, "$1In "],
  // "with a proposed 3 to 5 business day handling window" -> "with a 3 to 5 business day ..."
  [/\b(a|an|the) proposed (?=\d|solid\b|clear opening\b)/gi, "$1 "],
  // "with proposed clear opening 3.0 x 2.0 mm", "Nominal 17 cm, proposed 15.5–18 cm adjustment",
  // "Proposed 0.8 mm x 10 mm posts" (2027 enamel copy) lose "proposed".
  [/\b[Pp]roposed (?=\d|clear opening\b)/g, ""],
  // ", exact diameter and closure pending supplier confirmation" / ", supplier confirmation pending";
  // a decimal ("1.5 mm") may sit inside the clause.
  [/,\s*(?:(?:[^,;.]|\d\.\d)*?\s)?(?:pending supplier confirmation|supplier confirmation pending)\b/gi, ""],
  [/\bIntended metal(s?):/g, "Metal$1:"],
  [/\b([Tt])he intended metal(s?) (is|are)\b/g, "$1he metal$2 $3"],
  [/\bMetal previsto:/g, "Metal:"],
  // "An individual, minimalist ring concept with ..." -> "An individual, minimalist ring with ..."
  [/\b(ring|earring|necklace|pendant|bracelet|anklet|band) concept\b/g, "$1"],
  [/\bUn concepto de anillo\b/g, "Un anillo"],
  [/\bun concepto de anillo\b/g, "un anillo"],
  [/\b([Gg])rosor objetivo de diseño\b/g, "$1rosor"],
  // "..., as seen in the design image." -> "..., as seen in the listing image."
  [/\b(as (?:seen|shown) in the) design image(s?)\b/gi, "$1 listing image$2"],
  // "[Insert sizes – 7", 7.5", 8", 8.5"" -> "7", 7.5", 8", 8.5""
  [/\[Insert [^\]–—-]*[–—-]\s*([^\]]*)\]?/gi, "$1"],
  // "... may vary by about 10% after final CAD, casting, and finishing." -> "... after casting and finishing."
  [/\bafter final CAD(?:,| and)? casting(,? and finishing)?\b/gi, (_m, f) => "after casting" + (f ? " and finishing" : "")],
  [/\bis a pre-?production estimate\b/g, "is an estimate"],
  [/\bare pre-?production estimates\b/g, "are estimates"],
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
  // "• No personalization unless explicitly stated" (template hedge) -> "• No personalization".
  // Only that bullet: "All stones are natural unless explicitly stated otherwise" is buyer copy.
  [/^(\s*(?:[-•✔*·]|\d+[.)])\s+No personali[sz]ation) unless explicitly stated\s*$/i, "$1"],
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

// Raise the first letter only when the text starts with one ("props are not included" ->
// "Props are not included"); "3 to 5 business day handling" and "6 mm wide" stay.
function capitalizeFirst(s: string): string {
  return s.replace(/^(\s*)(\p{Ll})/u, (_m, a: string, c: string) => a + c.toUpperCase());
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

// A tail that starts with a pronoun points back into the dropped clause ("..., and they may
// vary by 10%"): kept alone it would say nothing about what varies.
const PRONOUN_LEAD_RE = /^(?:it|its|they|their|them|this|these|those|he|she|ello|ella|ellas|ellos|esto|estos|estas|este|esta)\b/i;

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
  // production") and goes with it. A tail without its own subject goes too: a pronoun
  // lead in English, and in Spanish (which drops the pronoun) anything but an article.
  const tail = parts.slice(1);
  if (tail.length > 0 && tail.every((p) => !INTERNAL_RE.test(p) && /^(?:and|y)\s/.test(p))) {
    const t = tail.join(", ").replace(/^(?:and|y)\s+/, "").trim();
    if (PRONOUN_LEAD_RE.test(t)) return "";
    if (/^y\s/.test(tail[0]) && !/^(?:el|la|los|las|un|una|unos|unas)\s/i.test(t)) return "";
    return t;
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

type Result = { text: string; removed: string[]; edits: InternalEdit[] };

function strip(description: string, withVisualization: boolean): Result {
  const edits: InternalEdit[] = [];
  const removed: string[] = [];
  const lines = description.replace(/\r\n/g, "\n").split("\n");
  const signal = (l: string) => INTERNAL_RE.test(l) || VISUALIZATION_RE.test(l);

  // Pass 1: internal sections. A heading internal by name goes with its whole paragraph;
  // an ambiguous one with the lines under it that carry a signal (the first clean line,
  // a blank line or the next heading ends it).
  const keep: (string | null)[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const byName = isHeading(lines[i]) && INTERNAL_BY_NAME_RE.test(t);
    if (byName || (isHeading(lines[i]) && INTERNAL_SECTION_RE.test(t))) {
      let j = i + 1;
      // A by-name section ends only at a blank line or a real heading: an all-caps label or bullet
      // under it ("SKU: ...", "• HALLMARK: TBD") is part of the note.
      while (
        j < lines.length &&
        lines[j].trim() !== "" &&
        !(byName ? isSectionHeading(lines[j]) : isHeading(lines[j])) &&
        (byName || signal(lines[j]))
      )
        j++;
      if (byName || j > i + 1) {
        edits.push({ kind: "section", from: lines.slice(i, j).join("\n"), to: "" });
        for (let k = i; k < j; k++) keep.push(null);
        i = j - 1;
        continue;
      }
    }
    keep.push(lines[i]);
  }

  // Pass 2: image-provenance sentences, phrases and sentences, line by line; remember
  // which lines were emptied.
  const out: (string | null)[] = keep.map((line) => {
    if (line === null) return null;
    let cur = line;
    if (withVisualization) {
      const v = stripVisualizationLine(line);
      if (v.removed.length > 0) {
        removed.push(...v.removed);
        if (v.text === "") return null;
        cur = v.text;
      }
    }
    const next = stripLine(cur, edits);
    return next === "" && cur.trim() !== "" ? null : next;
  });

  // Pass 3: a heading whose paragraph (the lines right under it) had content and lost all
  // of it goes too, unless the section still has a paragraph of its own: one followed by
  // another section. A single paragraph that runs to the end of the text is the brand
  // footer ("Jade Gold NYC, designed in New York City."), not the section's content.
  // A heading with a blank line under it (a separator such as "──── ESPAÑOL ────") stays.
  for (let i = 0; i < out.length; i++) {
    const line = out[i];
    if (line === null || !isSectionHeading(line)) continue;
    let j = i + 1;
    let had = false;
    let has = false;
    for (; j < lines.length && lines[j].trim() !== "" && !isSectionHeading(lines[j]); j++) {
      had = true;
      if (out[j] !== null && (out[j] as string).trim() !== "") has = true;
    }
    if (!had || has) continue;
    const rest: string[] = [];
    let toEnd = true;
    for (let k = j; k < lines.length; k++) {
      // A later heading counts as the section's end only if it is still there.
      if (out[k] !== null && isSectionHeading(lines[k])) {
        toEnd = false;
        break;
      }
      if (out[k] !== null) rest.push(out[k] as string);
    }
    const paragraphs = rest.join("\n").split(/\n\s*\n/).filter((p) => p.trim() !== "").length;
    if (paragraphs === 0 || (paragraphs === 1 && toEnd)) {
      edits.push({ kind: "heading", from: line, to: "" });
      out[i] = null;
    }
  }

  if (edits.length === 0 && removed.length === 0) return { text: description, removed, edits };
  const text = out
    .filter((l): l is string => l !== null)
    .join("\n")
    .replace(/^[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
  return { text, removed, edits };
}

/** Internal notes only (the image-provenance rule is left out). */
export function stripInternalNotes(description: string): { text: string; edits: InternalEdit[] } {
  const r = strip(description, false);
  return { text: r.text, edits: r.edits };
}

/**
 * Both public-text rules: image-provenance disclosure and internal notes. Repeated until
 * the text stops changing (a cut can bring a second note to the start of a line), so the
 * result always passes `publicTextProblem`.
 */
export function stripPublicDescription(description: string): Result {
  let r = strip(description, true);
  for (let pass = 0; pass < 3 && (r.removed.length > 0 || r.edits.length > 0); pass++) {
    const next = strip(r.text, true);
    if (next.removed.length === 0 && next.edits.length === 0) break;
    r = { text: next.text, removed: [...r.removed, ...next.removed], edits: [...r.edits, ...next.edits] };
  }
  return r;
}

/**
 * Alt text of a listing image. Etsy serves alt text with the photo (screen readers,
 * page source), so it is public text too. The 2027 enamel gallery tools wrote
 * "<Name>: <frame>. AI design visualization, 2048 square upscale. [marker]" and
 * "<Name>: AI home studio design visualization. [marker]". The visualization note goes;
 * a trailing "[...]" marker stays, because the gallery tools find their images by it.
 * When only a "Name:" label would be left, the listing title is used. An alt text the
 * rules do not change comes back exactly as it was.
 */
export function cleanAltText(alt: string, fallback: string): string {
  const m = /\s*(\[[^\]]*\])\s*$/.exec(alt);
  const marker = m ? m[1] : "";
  const orig = m ? alt.slice(0, m.index) : alt;
  const pre = orig
    .replace(/\s*\bAI design visuali[sz]ation, 2048 square upscale\.?/gi, "")
    .replace(/\bAI home studio design visuali[sz]ation\b/gi, "home studio view");
  const r = stripPublicDescription(pre);
  if (pre === orig && r.removed.length === 0 && r.edits.length === 0) return alt;
  let body = r.text.replace(/\s+/g, " ").trim();
  if (!/\p{L}{3,}/u.test(body.replace(/^[^:]{0,90}:\s*$/u, ""))) body = fallback.replace(/\s+/g, " ").trim();
  return [body, marker].filter(Boolean).join(" ").slice(0, 500);
}

/**
 * The first fragment the public-text rules would remove, or null when the text is clean.
 * Decided by what the rules removed or rewrote, never by whitespace alone.
 */
export function publicTextProblem(text: string): string | null {
  const r = stripPublicDescription(text);
  if (r.removed.length === 0 && r.edits.length === 0) return null;
  return r.removed[0] ?? r.edits[0].from;
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
