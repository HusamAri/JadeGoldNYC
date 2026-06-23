import { SHIPSTATION_API_BASE } from "@/lib/shipstation/endpoints";

export class ShipStationNotConfiguredError extends Error {
  constructor(message = "ShipStation API anahtarları tanımlı değil.") {
    super(message);
    this.name = "ShipStationNotConfiguredError";
  }
}

/** Rate limit'e takılınca (uzun bekleme) senkronu duraklatmak için. */
export class ShipStationRateLimitError extends Error {
  constructor(public readonly resetSeconds: number) {
    super(`ShipStation oran sınırı; ${resetSeconds}s sonra tekrar deneyin.`);
    this.name = "ShipStationRateLimitError";
  }
}

/**
 * ShipStation legacy API istemcisi. HTTP Basic auth (apiKey:apiSecret).
 * 40 istek/dk sınırı: 429'da X-Rate-Limit-Reset kısa ise bekleyip yeniden
 * dener; uzunsa ShipStationRateLimitError fırlatır (senkron duraklar, sonra
 * kaldığı yerden sürer). Yalnız sunucu tarafında kullanılır.
 */
export class ShipStationClient {
  private constructor(private readonly authHeader: string) {}

  static fromEnv(): ShipStationClient {
    const key = process.env.SHIPSTATION_API_KEY;
    const secret = process.env.SHIPSTATION_API_SECRET;
    if (!key || !secret) throw new ShipStationNotConfiguredError();
    const basic = Buffer.from(`${key}:${secret}`).toString("base64");
    return new ShipStationClient(`Basic ${basic}`);
  }

  static isConfigured(): boolean {
    return Boolean(
      process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET,
    );
  }

  async get<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(SHIPSTATION_API_BASE + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v != null) url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 429) {
      const reset = Number(res.headers.get("X-Rate-Limit-Reset") ?? "60");
      if (reset > 0 && reset <= 20) {
        await new Promise((r) => setTimeout(r, (reset + 1) * 1000));
        return this.get<T>(path, query);
      }
      throw new ShipStationRateLimitError(reset);
    }
    if (!res.ok) {
      throw new Error(
        `ShipStation API hatası (${res.status}) ${path}: ${await res.text()}`,
      );
    }
    return (await res.json()) as T;
  }
}
