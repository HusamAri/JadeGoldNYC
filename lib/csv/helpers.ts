/** Olası başlık adları arasından ilk dolu değeri (case-insensitive) döndürür. */
export function pick(row: Record<string, string>, names: string[]): string {
  const keys = Object.keys(row);
  for (const n of names) {
    const target = n.toLowerCase().trim();
    for (const key of keys) {
      if (key.toLowerCase().trim() === target) {
        const v = row[key];
        if (v != null && String(v).trim() !== "") return String(v).trim();
      }
    }
  }
  return "";
}

/** Çeşitli tarih formatlarını ISO'ya çevirir; başarısızsa null. */
export function parseDateLoose(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Metinden tam sayı ayıklar; başarısızsa null. */
export function parseIntLoose(s: string): number | null {
  if (!s) return null;
  const n = parseInt(String(s).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}
