import { createAdminClient } from "@/lib/supabase/admin";

/**
 * SHOPIFY ADMIN API İSTEMCİSİ (GraphQL).
 *
 * ## Neden var
 *
 * `lib/shopify/client.ts` yalnız OAuth el sıkışmasını kuruyordu (yetkilendirme
 * URL'i + alan adı normalizasyonu, 57 satır). Token alındıktan SONRA Shopify'a
 * tek bir çağrı yapacak kod yoktu — yani panelin Shopify'a yazma yeteneği
 * fiilen HİÇ yoktu. Bu dosya o boşluğu kapatır.
 *
 * ## Neden GraphQL, REST değil
 *
 * Shopify 2025-10'da varyant tavanını 100'den **2048'e** çıkardı, ama kendi
 * duyurusunda şunu yazıyor: "merchants using apps that are not using the
 * in-support GraphQL product APIs may have a downgraded or broken experience
 * when creating or viewing products with more than 100 variants." EON'un
 * ürünleri 191-441 varyant taşıyor, yani REST bu katalog için yapısal olarak
 * yetersiz. Tek yol GraphQL.
 *
 * ## Sözleşme (lib/etsy/client.ts deseninden kopyalandı, yeniden türetilmedi)
 *
 *  - Org kilidi AÇIK: token org'dan çözülür, "aktif org" varsayımına
 *    yaslanılmaz (çok kiracılı kilit kuralı).
 *  - Bağlantı yoksa/token boşsa FIRLATIR — sessizce boş sonuç dönmez. Bu
 *    repoda "başarılı ama hiçbir şey yapmadı" en pahalı hata biçimi.
 *  - `userErrors` HATADIR: Shopify mutation'ları HTTP 200 döndürüp gövdede
 *    hata taşır; yutulursa yazma yapılmamışken "yazıldı" sanılır.
 */

/** Shopify Admin API sürümü. Sabit tutulur — "latest" diye bir sürüm yok ve
 *  sürüm atlamak alan adlarını sessizce değiştirebilir. */
export const SHOPIFY_API_VERSION = "2026-07";

export interface ShopifyConnection {
  orgId: string;
  shopDomain: string;
  accessToken: string;
}

/** Org'un Shopify bağlantısını çözer. Yoksa FIRLATIR. */
export async function getShopifyConnection(
  orgId: string,
): Promise<ShopifyConnection> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shopify_connection")
    .select("shop_domain, access_token, status")
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw new Error(`shopify_connection okuma: ${error.message}`);

  const row = data as
    | { shop_domain: string; access_token: string | null; status: string }
    | null;
  if (row == null) {
    throw new Error(
      `Bu org için Shopify bağlantısı yok (org=${orgId}). ` +
        `Önce /ayarlar/shopify üzerinden bağlan.`,
    );
  }
  if (row.status !== "connected") {
    throw new Error(`Shopify bağlantısı '${row.status}' durumunda — yenile.`);
  }
  if (!row.access_token) {
    throw new Error(
      "Shopify bağlantı satırı var ama access_token boş — OAuth yarım kalmış.",
    );
  }
  return {
    orgId,
    shopDomain: row.shop_domain,
    accessToken: row.access_token,
  };
}

interface GraphQLYanit<T> {
  data?: T;
  errors?: { message: string }[];
  extensions?: {
    cost?: {
      requestedQueryCost?: number;
      throttleStatus?: {
        currentlyAvailable?: number;
        maximumAvailable?: number;
        restoreRate?: number;
      };
    };
  };
}

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly detay?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

/**
 * Tek GraphQL çağrısı.
 *
 * Throttle: Shopify maliyet-tabanlı kota kullanır ve kalan bütçeyi HER yanıtın
 * `extensions.cost.throttleStatus` alanında bildirir. Etsy kotası dersinin
 * (0134) aynısı geçerli: sinyal zaten cevabın içindeyse okumamak tercihtir.
 * Bütçe azaldığında kendiliğinden bekler — çağıranın kota yönetmesi gerekmez.
 */
export async function shopifyGraphQL<T>(
  conn: ShopifyConnection,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const url = `https://${conn.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  for (let deneme = 0; deneme < 3; deneme++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": conn.accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    // 429 = kota; Retry-After'a uy. Kör yeniden deneme YAPILMAZ (Etsy dersi:
    // günlük limitte kör tekrar yalnız kotasız istek zinciri üretir).
    if (res.status === 429) {
      const bekle = Number(res.headers.get("Retry-After") ?? "2");
      if (deneme === 2) {
        throw new ShopifyError(`Shopify kotası doldu (429), ${bekle}s sonra.`);
      }
      await new Promise((r) => setTimeout(r, bekle * 1000));
      continue;
    }
    if (!res.ok) {
      throw new ShopifyError(
        `Shopify HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
      );
    }

    const json = (await res.json()) as GraphQLYanit<T>;
    if (json.errors?.length) {
      throw new ShopifyError(
        `Shopify GraphQL: ${json.errors.map((e) => e.message).join(" · ")}`,
        json.errors,
      );
    }
    if (json.data == null) {
      throw new ShopifyError("Shopify boş data döndürdü.");
    }

    // Bütçe azaldıysa bir sonraki çağrı için nefes al — yanıt zaten söylüyor.
    const kalan = json.extensions?.cost?.throttleStatus?.currentlyAvailable;
    const restore = json.extensions?.cost?.throttleStatus?.restoreRate ?? 50;
    if (typeof kalan === "number" && kalan < 200) {
      await new Promise((r) => setTimeout(r, Math.ceil(200 / restore) * 1000));
    }
    return json.data;
  }
  throw new ShopifyError("Shopify: kota nedeniyle 3 denemede tamamlanamadı.");
}

/**
 * `userErrors` taşıyan mutation sonucunu doğrular.
 *
 * Shopify mutation'ları geçersiz girdide HTTP 200 + gövdede `userErrors`
 * döndürür. Bu alan okunmazsa yazma HİÇ olmamışken başarı raporlanır — bu
 * repodaki "sessiz no-op" desenin Shopify'daki karşılığı.
 */
export function userErrorsKapisi(
  islem: string,
  errs: { field?: string[] | null; message: string }[] | undefined,
): void {
  if (errs && errs.length > 0) {
    const metin = errs
      .map((e) => `${(e.field ?? []).join(".") || "-"}: ${e.message}`)
      .join(" · ");
    throw new ShopifyError(`${islem} reddedildi — ${metin}`, errs);
  }
}
