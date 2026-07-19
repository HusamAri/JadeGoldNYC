/**
 * digest_settings.emails — satır/virgül ayrılmış metni temiz e-posta listesine çevirir.
 */
export function parseDigestEmailList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,;]+/)) {
    const email = part.trim().toLowerCase();
    if (!email) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export function formatDigestEmailList(emails: string[]): string {
  return emails.join("\n");
}
