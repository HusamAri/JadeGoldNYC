import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

/** CSV metnini başlık modunda ayrıştırır (papaparse). */
export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const headers = result.meta.fields ?? [];
  const errors = (result.errors ?? []).map(
    (e) => `Satır ${e.row ?? "?"}: ${e.message}`,
  );
  return {
    headers,
    rows: (result.data ?? []) as Record<string, string>[],
    errors,
  };
}
