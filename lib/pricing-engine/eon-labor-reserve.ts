/**
 * Forward EON gold-ring labor reserve, adopted 2026-09-20.
 *
 * Pure audit policy: no database, Etsy, existing price engine, or historical
 * cost changes. Alura's recorded Labor is a historical cost, not this reserve.
 * The 14-row sample supports these conservative process bands in-sample; it
 * does not guarantee future supplier prices. Gold/fire/premium, packaging,
 * shipping, fees, discount and profit belong to the caller's separate model.
 */

export type EonLaborProcess = "standard" | "decorated" | "handmade" | "unknown";

export const EON_LABOR_RESERVE_FLOOR_CENTS = 10_000;

export const EON_LABOR_RESERVE_RATE_CENTS_PER_GRAM = Object.freeze({
  standard: 2_100,
  decorated: 2_300,
  handmade: 2_700,
  unknown: 2_700,
} satisfies Record<EonLaborProcess, number>);

/** Aggregate provenance only: no customer, invoice, order or SKU records. */
export const EON_LABOR_RESERVE_SOURCE = Object.freeze({
  version: "eon-labor-reserve-2026-09-20",
  asOfDate: "2026-09-20",
  source: "Alura matched Gold/Labor cost observations",
  sampleSize: 14,
  septemberSampleSize: 9,
  weightedLaborToGoldRatio: 0.26035792609976472,
  weightedLaborCentsPerGram: 1907.418436043501,
  observedLaborToGoldRatioMin: 0.14491770694135738,
  observedLaborToGoldRatioMax: 0.3848171578460114,
  observedLaborUsdPerGramMin: 15.082,
  observedLaborUsdPerGramMax: 26.338061465721037,
  limitation: "Small process-mixed sample; forward reserve, not a supplier quote or historical COGS.",
});

export class EonLaborReserveError extends Error {}

export interface EonLaborClassificationInput {
  /** The caller must establish material/category independently of the title. */
  isGoldRing: boolean;
  title?: string;
  /** A verified manufacturing class takes precedence over title keywords. */
  process?: EonLaborProcess;
}

export interface EonLaborClassification {
  eligible: boolean;
  process: EonLaborProcess;
  rateCentsPerGram: number;
  provisional: boolean;
  source: "explicit" | "title" | "unknown" | "out-of-scope";
}

const TITLE_CLASSES: readonly { process: EonLaborProcess; pattern: RegExp }[] = [
  {
    process: "handmade",
    pattern: /\b(?:hand\s*made|(?:hand\s*)?hammered|hand\s*finished|basket\s*weave|greek|two\s*tone)\b/i,
  },
  {
    process: "decorated",
    pattern: /\b(?:milgrain|diamond\s*cut|ribbed|fluted|cnc|engrav(?:e|ed|ing))\b/i,
  },
  {
    process: "standard",
    pattern: /\b(?:dome|domed|flat|bevel(?:ed|led)?|knife|satin)\b/i,
  },
];

function classification(
  process: EonLaborProcess,
  source: EonLaborClassification["source"],
  eligible = true,
): EonLaborClassification {
  return {
    eligible,
    process,
    rateCentsPerGram: EON_LABOR_RESERVE_RATE_CENTS_PER_GRAM[process],
    provisional: process === "unknown" || !eligible,
    source,
  };
}

/** Unknown processes keep the highest reserve; unrelated inventory is ineligible. */
export function classifyEonLaborProcess(
  input: EonLaborClassificationInput,
): EonLaborClassification {
  if (input.isGoldRing !== true) return classification("unknown", "out-of-scope", false);
  if (input.process !== undefined) {
    if (!Object.hasOwn(EON_LABOR_RESERVE_RATE_CENTS_PER_GRAM, input.process)) {
      throw new EonLaborReserveError("Unknown explicit labor process.");
    }
    return classification(input.process, "explicit");
  }
  if (input.title !== undefined && typeof input.title !== "string") {
    throw new EonLaborReserveError("Title must be text when provided.");
  }
  // Normalize separators, preserving word boundaries (not substring matches).
  const title = (input.title ?? "").replace(/[-_\u2010-\u2015]/g, " ");
  const match = TITLE_CLASSES.find(({ pattern }) => pattern.test(title));
  return match ? classification(match.process, "title") : classification("unknown", "unknown");
}

/** Convert an exact decimal gram amount to integer milligrams, never down-round it. */
function weightMilligrams(value: number | string | null | undefined): number {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new EonLaborReserveError("A positive weight in grams is required.");
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new EonLaborReserveError("Weight must be finite.");
  }
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value).trim());
  if (!match) throw new EonLaborReserveError("Weight must be a positive decimal in grams.");
  const decimals = (match[2] ?? "").replace(/0+$/, "");
  if (decimals.length > 3) {
    throw new EonLaborReserveError("Weight precision exceeds three decimal places.");
  }
  const milligrams = Number(match[1]) * 1_000 + Number(decimals.padEnd(3, "0"));
  if (!Number.isSafeInteger(milligrams) || milligrams <= 0) {
    throw new EonLaborReserveError("Weight must be positive and within integer precision.");
  }
  return milligrams;
}

/** Decimal/exponent parsing avoids ceil(USD * 100) binary floating-point artifacts. */
function quoteCents(value: number | undefined): number | null {
  if (value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new EonLaborReserveError("Verified labor quote must be a finite, nonnegative USD amount.");
  }
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value));
  if (!match) throw new EonLaborReserveError("Verified labor quote is not a decimal USD amount.");
  const digits = match[1] + (match[2] ?? "");
  const centsEnd = match[1].length + Number(match[3] ?? 0) + 2;
  let cents: number;
  if (centsEnd <= 0) {
    cents = /[1-9]/.test(digits) ? 1 : 0;
  } else if (centsEnd >= digits.length) {
    cents = Number(digits + "0".repeat(centsEnd - digits.length));
  } else {
    cents = Number(digits.slice(0, centsEnd)) + (/[1-9]/.test(digits.slice(centsEnd)) ? 1 : 0);
  }
  if (!Number.isSafeInteger(cents)) {
    throw new EonLaborReserveError("Verified labor quote exceeds integer cent precision.");
  }
  return cents;
}

export interface EonLaborReserveInput extends EonLaborClassificationInput {
  weightGrams: number | string | null | undefined;
  verifiedLaborQuoteUsd?: number;
}

export interface EonLaborReserve extends EonLaborClassification {
  currency: "USD";
  normalizedWeightMilligrams: number;
  floorCents: number;
  weightReserveCents: number;
  verifiedQuoteCents: number | null;
  reserveCents: number;
  policyVersion: string;
}

/** max($100, process rate × grams, verified quote), rounding upward to a cent. */
export function calculateEonLaborReserve(input: EonLaborReserveInput): EonLaborReserve {
  const process = classifyEonLaborProcess(input);
  if (!process.eligible) {
    throw new EonLaborReserveError("This labor policy is only for independently verified gold rings.");
  }
  const milligrams = weightMilligrams(input.weightGrams);
  const numerator = milligrams * process.rateCentsPerGram;
  if (!Number.isSafeInteger(numerator)) {
    throw new EonLaborReserveError("Weight reserve exceeds integer cent precision.");
  }
  const weightReserveCents = Math.floor(numerator / 1_000) + (numerator % 1_000 === 0 ? 0 : 1);
  const verifiedQuoteCents = quoteCents(input.verifiedLaborQuoteUsd);
  return {
    ...process,
    currency: "USD",
    normalizedWeightMilligrams: milligrams,
    floorCents: EON_LABOR_RESERVE_FLOOR_CENTS,
    weightReserveCents,
    verifiedQuoteCents,
    reserveCents: Math.max(EON_LABOR_RESERVE_FLOOR_CENTS, weightReserveCents, verifiedQuoteCents ?? 0),
    policyVersion: EON_LABOR_RESERVE_SOURCE.version,
  };
}
