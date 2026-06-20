export type RawSearchParams = Record<string, string | string[] | undefined>;

export function strParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v && v.length ? v : undefined;
}

export function numParam(
  v: string | string[] | undefined,
  fallback = 0,
): number {
  const s = strParam(v);
  const n = s ? parseInt(s, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
