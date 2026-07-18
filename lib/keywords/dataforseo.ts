/**
 * DataForSEO talep verisi adaptörü — Google Ads arama hacmi / rekabet / CPC.
 * Tek hesap tüm markalara hizmet eder (pay-as-you-go). Anahtar yoksa modül
 * INERT'tir (Etsy deseni): `isDataForSeoConfigured()` false döner, çağıran
 * zarifçe null metriklerle devam eder.
 *
 * ENV: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 */

const BASE = "https://api.dataforseo.com/v3";

export function isDataForSeoConfigured(): boolean {
  return Boolean(
    process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD,
  );
}

export interface KeywordMetric {
  keyword: string;
  searchVolume: number | null;
  competition: number | null; // 0..1
  cpcCents: number | null;
}

function authHeader(): string {
  const raw = `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`;
  return "Basic " + Buffer.from(raw).toString("base64");
}

/**
 * Verilen anahtar kelimeleri Google Ads arama hacmiyle zenginleştirir.
 * Yapılandırılmamışsa boş harita döner (çağıran null metriklerle devam eder).
 */
export async function enrichKeywords(
  keywords: string[],
  opts: { locationCode?: number; languageCode?: string } = {},
): Promise<Map<string, KeywordMetric>> {
  const result = new Map<string, KeywordMetric>();
  if (!isDataForSeoConfigured() || keywords.length === 0) return result;

  const body = [
    {
      keywords: keywords.slice(0, 1000),
      location_code: opts.locationCode ?? 2840, // ABD
      language_code: opts.languageCode ?? "en",
    },
  ];

  try {
    const res = await fetch(
      `${BASE}/keywords_data/google_ads/search_volume/live`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!res.ok) {
      console.error("DataForSEO HTTP", res.status);
      return result;
    }
    const json = (await res.json()) as {
      tasks?: {
        result?: {
          keyword: string;
          search_volume: number | null;
          competition_index: number | null; // 0..100
          cpc: number | null; // dolar
        }[];
      }[];
    };
    for (const task of json.tasks ?? []) {
      for (const r of task.result ?? []) {
        result.set(r.keyword.toLowerCase(), {
          keyword: r.keyword,
          searchVolume: r.search_volume ?? null,
          competition:
            r.competition_index == null ? null : r.competition_index / 100,
          cpcCents: r.cpc == null ? null : Math.round(r.cpc * 100),
        });
      }
    }
  } catch (e) {
    console.error(
      "DataForSEO enrichKeywords hatası:",
      e instanceof Error ? e.message : e,
    );
  }
  return result;
}
