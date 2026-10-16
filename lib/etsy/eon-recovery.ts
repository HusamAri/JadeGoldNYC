/**
 * Eon Etsy recovery, 16 October 2026.
 *
 * Factual copy only. Prices, tags, titles, processing profiles and
 * holiday disclosures stay as they are. A holiday listing that still
 * says its specs are unconfirmed is paused, not rewritten.
 */

export const EON_ORG_ID = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";
export const EON_SHOP_NAME = "EONFineJewelry";

/** Live Christmas concepts whose copy still withholds production specs. */
export const CHRISTMAS_LISTING_IDS = [
  4593654581, 4593723030, 4593706383, 4593792565, 4593814704, 4593809784,
  4593671353, 4593705461, 4593791991, 4593794275, 4593705293, 4593787441,
  4593797291, 4593789699, 4593814362, 4593798957, 4593789141,
] as const;

/**
 * Core listings whose engraving prose still describes a script/block
 * choice. Applied only when the live listing has a font dropdown.
 */
export const ENGRAVING_LISTING_IDS = [
  4539666999, 4539777986, 4539780408, 4556710904, 4542485142, 4539493533,
  4548151075, 4565352791,
] as const;

export const BRAND_SCOPE_LISTING_ID = 4539780408;
export const LAUREL_LISTING_ID = 4569902788;
export const COUNTERFORM_LISTING_ID = 4561605534;
export const SATIN_18K_LISTING_ID = 4565352791;
export const KINETIC_LISTING_ID = 4561855998;
export const HAMMERED_REFERENCE_LISTING_ID = 4543442596;

/** Purchase-backed bands that replace the four holiday featured slots. */
export const FEATURED_REPLACEMENTS: { listingId: number; rank: number }[] = [
  { listingId: 4554014095, rank: 1 },
  { listingId: 4539666999, rank: 2 },
  { listingId: 4539780408, rank: 3 },
  { listingId: 4556710904, rank: 4 },
];

const UNCONFIRMED_HOLIDAY =
  /will be confirmed before this design is offered for sale/i;

export function hasUnconfirmedHolidayDisclosure(description: string): boolean {
  return UNCONFIRMED_HOLIDAY.test(description);
}

export interface FontQuestion {
  question_type: string;
  question_text: string;
  options?: { label: string }[] | null;
}

/** Dropdown question buyers actually use to pick a font, if one exists. */
const STALE_FONT_INSTRUCTIONS =
  /script by default|type block|block letters|block lettering/i;

export const FONT_MENU_INSTRUCTIONS =
  "Optional inside engraving, up to 30 characters. " +
  "Choose your font from the Engraving Font menu. Leave blank for none.";

/** 18K satin promises four numbered fonts but ships with a text field only. */
export function shouldAttachFontMenu(input: {
  listingId: number;
  description: string;
  fontMenu: string | null;
}): boolean {
  return (
    input.listingId === SATIN_18K_LISTING_ID &&
    input.fontMenu == null &&
    /four numbered fonts/i.test(input.description)
  );
}

export function repairFontInstructions(
  instructions: string | null | undefined,
): string | null {
  if (!instructions || !STALE_FONT_INSTRUCTIONS.test(instructions)) return null;
  return FONT_MENU_INSTRUCTIONS;
}

export function fontMenuLabel(questions: FontQuestion[]): string | null {
  const font = questions.find(
    (q) =>
      q.question_type === "dropdown" &&
      (q.options?.length ?? 0) > 0 &&
      /font|style|letter|engraving/i.test(q.question_text),
  );
  const label = font?.question_text.trim();
  return label ? label : null;
}

function chooseFont(menu: string): string {
  return `Choose your font from the ${menu} menu.`;
}

const BRAND_SCOPE_FROM =
  "Every piece is made to order by our goldsmith in solid 10k or 14k gold, never plated and never filled.";
const BRAND_SCOPE_TO =
  "Eon makes jewelry in solid 10K, 14K or 18K gold, as specified in each listing. Available metals and personalization options vary by design. Every piece is made to order and is never plated or filled.";

const WIDTH_FROM = "Choose a width of 7, or 8 mm from the variation menu.";
const WIDTH_TO = "Choose a width of 7 or 8 mm from the variation menu.";

const APPROVAL_SENTENCE =
  "Final metal weight will be confirmed before the listing is approved for Etsy.";

/**
 * Surgical description repairs. Returns the same string when nothing on
 * this listing is both present and safe to change.
 */
export function repairCoreListingCopy(input: {
  listingId: number;
  description: string;
  fontMenu: string | null;
}): { description: string; changes: string[] } {
  let description = input.description;
  const changes: string[] = [];
  const menu = input.fontMenu;

  if (menu) {
    const swaps: [string, string][] = [
      [
        "Script is the default engraving style, while block letters are available by request.",
        chooseFont(menu),
      ],
      [
        "with standard script or block letters available by request",
        chooseFont(menu),
      ],
      [
        "script is standard, or request block letters in the personalization box",
        chooseFont(menu),
      ],
      [
        "Script is standard, with block lettering available by request; leaving personalization blank keeps the interior clean.",
        `${chooseFont(menu)} Leaving personalization blank keeps the interior clean.`,
      ],
      [
        "or leave it blank; script is the default.",
        `or leave it blank. ${chooseFont(menu)}`,
      ],
      [
        "Script is the default font; note block letters in your personalization if you prefer, or leave it blank and the band ships clean.",
        `${chooseFont(menu)} Leave it blank and the band ships clean.`,
      ],
    ];
    for (const [from, to] of swaps) {
      if (description.includes(from)) {
        description = description.replace(from, to);
        changes.push("engraving-menu");
      }
    }
    if (
      input.listingId === SATIN_18K_LISTING_ID &&
      description.includes(
        "Optional inside engraving is available in four numbered fonts, with a standard limit of 30 characters including spaces.",
      ) &&
      !description.includes(menu)
    ) {
      description = description.replace(
        "Optional inside engraving is available in four numbered fonts, with a standard limit of 30 characters including spaces.",
        `Optional inside engraving: enter up to 30 characters, including spaces. ${chooseFont(menu)} Leave the text blank for no engraving.`,
      );
      changes.push("engraving-menu");
    }
  }

  if (
    input.listingId === BRAND_SCOPE_LISTING_ID &&
    description.includes(BRAND_SCOPE_FROM)
  ) {
    description = description.replace(BRAND_SCOPE_FROM, BRAND_SCOPE_TO);
    changes.push("metal-scope");
  }

  if (input.listingId === LAUREL_LISTING_ID && description.includes(WIDTH_FROM)) {
    description = description.replace(WIDTH_FROM, WIDTH_TO);
    changes.push("width-comma");
  }

  if (
    input.listingId === COUNTERFORM_LISTING_ID &&
    description.includes(APPROVAL_SENTENCE)
  ) {
    description = description
      .replace(` ${APPROVAL_SENTENCE}`, "")
      .replace(APPROVAL_SENTENCE, "");
    changes.push("internal-approval-note");
  }

  return { description, changes };
}
