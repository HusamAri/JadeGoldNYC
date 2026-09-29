/**
 * byArtifactStudio listing rewrite (docs/artifact-studio/etsy-rewrite): saf
 * planlayıcı. Canlı Etsy durumu + rewrite JSON girdisi → uygulanacak işlemler.
 * IO yok; rota (app/api/ops/listing-rewrite) okur, bu dosya karar verir.
 *
 * Kurallar RUNBOOK.md'den: kopya birebir; "none" değer niteliği boşaltır;
 * "(variation)" varyasyonu izler ve atlanır; "leave …" atölye bekleyen alandır,
 * dokunulmaz; Etsy listesinde olmayan değer atlanır ve loglanır. JSON'da
 * olmayan nitelikler olduğu gibi kalır.
 */

export interface TaxonomyPropertyValue {
  value_id: number;
  name: string;
  scale_id?: number | null;
}
export interface TaxonomyProperty {
  property_id: number;
  name: string;
  display_name?: string | null;
  is_multivalued?: boolean;
  max_values_allowed?: number | null;
  supports_attributes?: boolean;
  scales?: { scale_id: number; display_name: string }[];
  possible_values?: TaxonomyPropertyValue[];
}
export interface ListingPropertyValue {
  property_id: number;
  property_name?: string | null;
  scale_id?: number | null;
  value_ids?: number[];
  values?: string[];
}

export interface AttrSet {
  key: string;
  property_id: number;
  value_ids: number[];
  values: string[];
  scale_id: number | null;
}
export interface AttrPlan {
  set: AttrSet[];
  clear: { key: string; property_id: number }[];
  unchanged: string[];
  skipped: { key: string; value: string; reason: string }[];
}

const norm = (s: string) => s.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");

function findProperty(key: string, props: TaxonomyProperty[]): TaxonomyProperty | undefined {
  const k = norm(key);
  const strip = (s: string) => s.replace(/s$/, "");
  return (
    props.find((p) => norm(p.display_name ?? "") === k || norm(p.name) === k) ??
    props.find((p) => strip(norm(p.display_name ?? p.name)) === strip(k))
  );
}

const UNIT: Record<string, string[]> = {
  mm: ["mm", "millimeters", "millimetres"],
  cm: ["cm", "centimeters", "centimetres"],
  in: ["in", "inch", "inches"],
};

/** "9 mm" / "18 inches" / "11.8 mm" → sayı + birim. */
export function parseMeasure(v: string): { num: string; unit: string } | null {
  const m = v.trim().match(/^(\d+(?:\.\d+)?)\s*(mm|cm|in|inch|inches)$/i);
  if (!m) return null;
  const u = m[2].toLowerCase();
  const unit = Object.keys(UNIT).find((k) => UNIT[k].includes(u))!;
  return { num: m[1], unit };
}

export function planAttributes(
  wanted: Record<string, string>,
  props: TaxonomyProperty[],
  current: ListingPropertyValue[],
): AttrPlan {
  const plan: AttrPlan = { set: [], clear: [], unchanged: [], skipped: [] };
  const curById = new Map(current.map((c) => [c.property_id, c]));

  for (const [key, raw] of Object.entries(wanted)) {
    const v = raw.trim();
    if (/^leave\b/i.test(v)) {
      plan.skipped.push({ key, value: raw, reason: "held for workshop, left as is" });
      continue;
    }
    const prop = findProperty(key, props);
    if (!prop) {
      plan.skipped.push({ key, value: raw, reason: "attribute not offered for this category" });
      continue;
    }
    const cur = curById.get(prop.property_id);
    if (/^none\b/i.test(v)) {
      if (cur && ((cur.value_ids ?? []).length || (cur.values ?? []).length)) {
        plan.clear.push({ key, property_id: prop.property_id });
      } else plan.unchanged.push(key);
      continue;
    }
    // "(variation)" / "(per variation)": değer varyasyonu izler.
    const paren = v.match(/\(([^)]*)\)\s*$/);
    const main = paren ? v.slice(0, paren.index).trim() : v;
    const tokens = main.split(/,\s*|\s+or\s+/i).map((t) => t.trim()).filter(Boolean);
    if (paren && /variation/i.test(paren[1]) && (tokens.length > 1 || /^\(variation\)$/i.test(paren[0]))) {
      plan.skipped.push({ key, value: raw, reason: "follows the variation" });
      continue;
    }

    let target: AttrSet | null = null;
    const pv = prop.possible_values ?? [];
    if (pv.length > 0) {
      const ids: number[] = [];
      const names: string[] = [];
      const missing: string[] = [];
      for (const t of tokens) {
        const hit = pv.find((p) => norm(p.name) === norm(t));
        if (hit) {
          ids.push(hit.value_id);
          names.push(hit.name);
        } else missing.push(t);
      }
      if (missing.length) {
        // RUNBOOK: listede olmayan DEĞER atlanır, niteliğin tamamı değil. Çok
        // değerli nitelikte eşleşenler yazılır; tek değerlide yazılacak bir şey kalmaz.
        plan.skipped.push({ key, value: raw, reason: `not in Etsy's list: ${missing.join(", ")}` });
        if (!prop.is_multivalued || ids.length === 0) continue;
      }
      const max = prop.is_multivalued ? prop.max_values_allowed ?? ids.length : 1;
      if (ids.length > max) {
        plan.skipped.push({ key, value: raw, reason: `Etsy allows ${max} value(s), copy has ${ids.length}` });
        continue;
      }
      target = { key, property_id: prop.property_id, value_ids: ids, values: names, scale_id: null };
    } else {
      const m = tokens.length === 1 ? parseMeasure(tokens[0]) : null;
      if (!m) {
        plan.skipped.push({ key, value: raw, reason: "free value this tool does not map" });
        continue;
      }
      const scale = (prop.scales ?? []).find((s) =>
        UNIT[m.unit].some((u) => norm(s.display_name).includes(u)),
      );
      if ((prop.scales ?? []).length > 0 && !scale) {
        plan.skipped.push({ key, value: raw, reason: `no ${m.unit} scale on this attribute` });
        continue;
      }
      target = { key, property_id: prop.property_id, value_ids: [], values: [m.num], scale_id: scale?.scale_id ?? null };
    }

    const same =
      cur &&
      (target.value_ids.length
        ? [...(cur.value_ids ?? [])].sort().join() === [...target.value_ids].sort().join()
        : (cur.values ?? []).join() === target.values.join() &&
          (cur.scale_id ?? null) === target.scale_id);
    if (same) plan.unchanged.push(key);
    else plan.set.push(target);
  }
  return plan;
}

export interface PersonalizationQuestion {
  question_type: "text_input";
  question_text: string;
  instructions: string;
  required: boolean;
  max_allowed_characters: number;
}

/**
 * "Inside engraving (optional): up to 10 characters, …" →
 * soru metni "Inside engraving (optional)", talimat iki noktadan sonrası,
 * zorunluluk ("required" var ve "optional" yok), karakter sınırı "up to N
 * characters" ya da "one … letter" = 1. "none" → null.
 */
export function parsePersonalization(field: string): PersonalizationQuestion | null {
  const f = field.trim();
  if (/^none\b/i.test(f)) return null;
  let label: string;
  let instructions: string;
  const colon = f.indexOf(":");
  if (colon > 0) {
    label = f.slice(0, colon).trim();
    instructions = f.slice(colon + 1).trim();
  } else {
    const m = f.match(/^([^(,]+)\(([^)]*)\)(.*)$/);
    label = (m ? m[1] : f).trim();
    instructions = m ? m[2].trim() : "";
  }
  instructions = instructions.replace(/,?\s*required\s*$/i, "").trim();
  const required = /\brequired\b/i.test(f) && !/\boptional\b/i.test(f);
  const upTo = f.match(/up to (\d+) characters?/i);
  const max = upTo ? Number(upTo[1]) : /\bone\b[^,]*\bletter\b/i.test(f) ? 1 : 256;
  if (instructions) instructions = instructions[0].toUpperCase() + instructions.slice(1);
  return { question_type: "text_input", question_text: label, instructions, required, max_allowed_characters: max };
}

/** Etsy materials: yalnız harf, rakam, boşluk. Geçmeyen değer atlanır (kopya değiştirilmez). */
export function splitMaterials(materials: string[]): { ok: string[]; rejected: string[] } {
  const ok: string[] = [];
  const rejected: string[] = [];
  for (const m of materials) (/^[\p{L}\p{N} ]+$/u.test(m) ? ok : rejected).push(m);
  return { ok, rejected };
}

/** "set quantity to 20 …" / "keep 20" / "keep quantity at 20" → 20. */
export function parseQuantity(note: string): number | null {
  const m = note.match(/\b(\d+)\b/);
  return m ? Number(m[1]) : null;
}

export function normText(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}
