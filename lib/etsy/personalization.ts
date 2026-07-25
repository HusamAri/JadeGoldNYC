import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

/**
 * EON (ve benzeri bant alyans) kişiselleştirme kanonu.
 *
 * İki soru:
 *  1. text_input — iç gravür metni, isteğe bağlı, max 30 karakter
 *  2. dropdown  — engraving style (FONT RENDER PLATES), isteğe bağlı
 *
 * Style seçenekleri EON font plate setiyle birebir:
 *   The Signature (Great Vibes · script · default)
 *   The Ornament  (Cinzel Decorative)
 *   The Monument  (Cinzel)
 *   The Editorial (Prata)
 *
 * Etsy `instructions` ≤120 char; dropdown'da instructions YASAK.
 * Dropdown label ≤20 char. POST replace semantics — her yazımda
 * her iki soru birlikte gider.
 */

/** Etsy text_input instructions (≤120). Style artık ayrı dropdown'da. */
export const ENGRAVING_INSTRUCTIONS =
  "Optional inside-band engraving, up to 30 characters. Leave blank for none.";

export const ENGRAVING_MAX_CHARS = 30;

export const ENGRAVING_QUESTION_TEXT = "Inside band engraving (optional)";
export const ENGRAVING_STYLE_QUESTION_TEXT = "Engraving style";

/**
 * Dropdown labels — Etsy max 20 char each.
 * Sıra: Signature önce (plate default / script).
 */
export const ENGRAVING_STYLE_OPTIONS = [
  "The Signature",
  "The Ornament",
  "The Monument",
  "The Editorial",
] as const;

export type PersonalizationQuestionType =
  | "text_input"
  | "dropdown"
  | "unlabeled_upload"
  | "labeled_upload";

export interface PersonalizationOption {
  option_id?: number | null;
  label: string;
}

export interface PersonalizationQuestion {
  question_id?: number | null;
  question_text: string;
  question_type: PersonalizationQuestionType;
  required: boolean;
  instructions?: string | null;
  max_allowed_characters?: number | null;
  max_allowed_files?: number | null;
  options?: PersonalizationOption[] | null;
}

/** Kanonik iki soru — create + sync aynı payload'ı kullanır. */
export function eonPersonalizationQuestions(): PersonalizationQuestion[] {
  return [
    {
      question_type: "text_input",
      question_text: ENGRAVING_QUESTION_TEXT,
      instructions: ENGRAVING_INSTRUCTIONS,
      required: false,
      max_allowed_characters: ENGRAVING_MAX_CHARS,
    },
    {
      question_type: "dropdown",
      question_text: ENGRAVING_STYLE_QUESTION_TEXT,
      required: false,
      options: ENGRAVING_STYLE_OPTIONS.map((label) => ({ label })),
    },
  ];
}

/**
 * Listing'in kişiselleştirmesini kanonik EON setine yazar.
 * `supports_multiple_personalization_questions=true` zorunlu (multi + dropdown).
 */
export async function applyEonPersonalization(
  client: EtsyClient,
  shopId: number | string,
  listingId: number | string,
): Promise<void> {
  await client.request(
    "POST",
    etsyPaths.listingPersonalization(shopId, listingId) +
      "?supports_multiple_personalization_questions=true",
    { personalization_questions: eonPersonalizationQuestions() },
  );
}

/** GET — mevcut sorular (yoksa boş dizi). */
export async function getListingPersonalization(
  client: EtsyClient,
  listingId: number | string,
): Promise<PersonalizationQuestion[]> {
  try {
    const res = await client.get<{
      personalization_questions?: PersonalizationQuestion[];
    }>(etsyPaths.listingPersonalizationByListing(listingId));
    return res.personalization_questions ?? [];
  } catch {
    return [];
  }
}

/**
 * Listing kanonik EON kişiselleştirmesine uyuyor mu?
 * - text_input gravür, max 30, required=false
 * - dropdown "Engraving style" with Script + Block (order-insensitive)
 */
export function matchesEonPersonalization(
  questions: PersonalizationQuestion[],
): boolean {
  if (questions.length !== 2) return false;

  const text = questions.find((q) => q.question_type === "text_input");
  const style = questions.find((q) => q.question_type === "dropdown");
  if (!text || !style) return false;

  const textOk =
    (text.question_text ?? "").trim() === ENGRAVING_QUESTION_TEXT &&
    text.required === false &&
    text.max_allowed_characters === ENGRAVING_MAX_CHARS &&
    (text.instructions ?? "").trim() === ENGRAVING_INSTRUCTIONS;

  const labels = new Set(
    (style.options ?? []).map((o) => (o.label ?? "").trim()),
  );
  const styleOk =
    (style.question_text ?? "").trim() === ENGRAVING_STYLE_QUESTION_TEXT &&
    style.required === false &&
    ENGRAVING_STYLE_OPTIONS.every((l) => labels.has(l)) &&
    labels.size === ENGRAVING_STYLE_OPTIONS.length;

  return textOk && styleOk;
}

/** Kısa audit özeti — sync script / UI için. */
export function summarizePersonalization(
  questions: PersonalizationQuestion[],
): string {
  if (questions.length === 0) return "none";
  return questions
    .map((q) => {
      const bits = [q.question_type, q.question_text];
      if (q.question_type === "text_input") {
        bits.push(`max=${q.max_allowed_characters ?? "?"}`);
      }
      if (q.question_type === "dropdown") {
        bits.push(
          `opts=[${(q.options ?? []).map((o) => o.label).join("|")}]`,
        );
      }
      bits.push(q.required ? "req" : "opt");
      return bits.join(":");
    })
    .join(" || ");
}
