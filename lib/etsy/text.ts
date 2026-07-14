/**
 * Etsy API metin yardımcıları. Etsy v3 API listing başlıklarını HTML
 * entity'leriyle escape ederek döndürür ("7.5&quot;", "Men&#39;s" gibi) —
 * panelde ham entity görünmesin diye senkron sınırında çözülür.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

/** HTML entity'lerini (named + numeric) düz metne çözer. */
export function decodeHtmlEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body: string) => {
    if (body.startsWith("#")) {
      const hex = body[1] === "x" || body[1] === "X";
      const code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : m;
    }
    return NAMED_ENTITIES[body] ?? m;
  });
}

/** Metinde çözülmemiş HTML entity var mı? (denetim sinyali) */
export function hasHtmlEntities(s: string): boolean {
  return /&(#x?[0-9a-fA-F]+|amp|quot|apos|lt|gt|nbsp);/.test(s);
}
