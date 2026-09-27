import raw from './weight-plan.json';
import { SOURCE } from './catalog';
export const weightPlan = raw;
export const WEIGHT_PLAN = raw.version;
export function artifactQuotedCost(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, unknown>;
  const q = m.purchaseCostSnapshot as Record<string, unknown> | undefined;
  if (m.sourcePackage !== SOURCE || q?.version !== WEIGHT_PLAN || q.currency !== 'USD' || q.includesGoldAndLabor !== true) return null;
  return typeof q.amountCents === 'number' && Number.isSafeInteger(q.amountCents) && q.amountCents > 0 ? q.amountCents : null;
}
export function estimateMetadata<T extends Record<string, unknown>>(existing: T, p: typeof raw.products[number]) {
  const production = (existing.production ?? {}) as Record<string, unknown>;
  return { ...existing,
    weightEstimatePlan: { version: WEIGHT_PLAN, status: 'estimated_not_measured', referenceGoldGrams: p.weightGrams, rangeGrams: p.weightRange, excludesEnamel: true, referenceRingSize: p.id.startsWith('R') ? 7 : null, assumptions: raw.weightBasis },
    purchaseCostSnapshot: { version: WEIGHT_PLAN, amountCents: p.costCents, currency: 'USD', includesGoldAndLabor: true, basis: raw.costBasis, quotedOn: raw.date, automaticSpotAdjustment: false, automaticSizeAdjustment: false },
    production: { ...production, weightVerified: false, weightStatus: 'estimated', costSource: 'user_quote_including_gold_and_labor' },
    ...(p.id.startsWith('R') ? { variationAxes: ['Ring Size', 'Metal Color'], ringSizes: p.variants.map(v=>v.size) } : {}),
  };
}
