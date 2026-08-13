import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";

export interface EtsyListingDetail {
  listing_id: number;
  title?: string;
  description?: string;
  tags?: string[];
  /** Bulunduğu mağaza bölümü (vitrin yerleşimi). */
  shop_section_id?: number | null;
}

/**
 * Tek listing'i (güncel başlık/açıklama/tag'iyle) okur — `GET /listings/{id}`.
 *
 * NOT: Etsy'de `/shops/{shop_id}/listings/{listing_id}` ucu YALNIZ PATCH tanımlar
 * (resmi OpenAPI şemasında `get` yoktur) — okuma için oraya vurmak 404/405 verir.
 * Tek listing okumasının gerçek ucu budur; satıcı bağlamı gerekmez.
 */
export async function getListing(
  client: EtsyClient,
  listingId: number,
): Promise<EtsyListingDetail> {
  return client.get<EtsyListingDetail>(etsyPaths.listing(listingId));
}

/**
 * Listing açıklamasını günceller (updateListing PATCH, form-encoded).
 * `listings_w` kapsamı + shop_id gerektirir. Yalnız `description` alanına
 * dokunur; diğer alanlar Etsy tarafında korunur.
 */
export async function updateListingDescription(
  client: EtsyClient,
  listingId: number,
  description: string,
): Promise<void> {
  const shopId = await client.resolveShopId();
  if (!shopId) throw new Error("Etsy shop_id çözülemedi.");
  await client.requestForm<unknown>(
    "PATCH",
    etsyPaths.shopListing(shopId, listingId),
    { description },
  );
}

/**
 * Listing'in mağaza bölümünü (vitrin yerleşimi) değiştirir + GERİ OKUR.
 *
 * Read-back zorunlu: "200 OK" teslim sayılmaz (2026-07-31 vakası — PATCH 200
 * döndü ama yazma oturmadı). Aynı turda geri okunup istenen bölüme düştüğü
 * doğrulanır; düşmediyse hata döner ve satır `failed` işaretlenir.
 *
 * Not: bu uç yalnız `shop_section_id` alanına dokunur — başlık, açıklama, tag
 * ve fiyat Etsy tarafında olduğu gibi kalır.
 */
export async function updateListingSection(
  client: EtsyClient,
  listingId: number,
  sectionId: number,
): Promise<{ ok: boolean; detail?: string; liveSectionId?: number | null }> {
  const shopId = await client.resolveShopId();
  if (!shopId) throw new Error("Etsy shop_id çözülemedi.");

  await client.requestForm<unknown>(
    "PATCH",
    etsyPaths.shopListing(shopId, listingId),
    { shop_section_id: String(sectionId) },
  );

  try {
    const live = await getListing(client, listingId);
    const got = live.shop_section_id ?? null;
    if (got !== sectionId) {
      return {
        ok: false,
        liveSectionId: got,
        detail: `Etsy yazmayı kabul etmedi: bölüm ${got ?? "boş"} kaldı (istenen ${sectionId}).`,
      };
    }
    return { ok: true, liveSectionId: got };
  } catch (e) {
    // Geri okuma başarısızsa yazma "doğrulanmadı" sayılır — sessizce başarı deme.
    const msg = e instanceof Error ? e.message : "bilinmiyor";
    return { ok: false, detail: `Yazma sonrası doğrulama okunamadı: ${msg}` };
  }
}

export interface SeoVerification {
  ok: boolean;
  /** Doğrulama neden başarısız — kullanıcıya gösterilecek tek cümle. */
  detail?: string;
  /** Etsy'de okunan başlık (entity'leri çözülmüş). */
  liveTitle?: string;
}

/**
 * READ-BACK DOĞRULAMASI — "200 OK" teslim sayılmaz.
 *
 * Etsy'ye başlık/tag yazdıktan sonra AYNI turda geri okuyup yazdığımızla
 * karşılaştırır. Neden: canlı vaka (2026-07-31) — PATCH 200 döndü, "gönderildi"
 * denip kapatıldı; başlıklar sonradan dış taraftan geri alındı ve sapma ancak
 * ertesi gün senkron aynasında fark edildi (bkz. docs/second-brain.md). Yazmanın
 * gerçekten oturduğunu görmeden başarı raporlanmaz.
 *
 * Etsy okuması yazmanın hemen ardından bir tık bayat gelebildiği için uyuşmazlık
 * bir kez daha (kısa beklemeyle) sınanır — tek seferlik gecikme yanlış alarm
 * üretmesin.
 *
 * `expected.title` OPSİYONELDİR: başlık kuralı (kullanıcı, 2026-08-01) gereği
 * SEO gönderimi Etsy başlığına dokunmuyor. Yazmadığımız bir alanı beklenen
 * değerle kıyaslamak, Etsy editöründe elle düzenlenmiş her başlığı "sapma"
 * sayıp doğru gönderimleri hatalı gösterirdi. Başlık verilmediğinde tek (ve
 * asıl) kanıt tag listesidir.
 */
export async function verifyListingSeo(
  client: EtsyClient,
  listingId: number,
  expected: { title?: string; tags: string[] },
  opts: { firstDelayMs?: number; retryDelayMs?: number } = {},
): Promise<SeoVerification> {
  const norm = (s: string) => decodeHtmlEntities(s).trim();
  const tagKey = (t: string[]) =>
    t.map((x) => x.trim().toLowerCase()).sort().join("|");
  const beklenenTitle = expected.title?.trim();
  const beklenenTags = tagKey(expected.tags);

  for (const [i, bekle] of [
    opts.firstDelayMs ?? 400,
    opts.retryDelayMs ?? 1500,
  ].entries()) {
    await new Promise((r) => setTimeout(r, bekle));
    let live: EtsyListingDetail;
    try {
      // Okuma `GET /listings/{id}` ile yapılır: satıcıya özel
      // `/shops/{shop_id}/listings/{listing_id}` ucunun GET'i YOKTUR (yalnız
      // PATCH) — oraya vurmak her doğrulamayı 404'e düşürüp "yazma sonrası
      // okuma başarısız" yanlış alarmına çeviriyordu.
      live = await getListing(client, listingId);
    } catch (e) {
      // Okuma başarısızsa yazmayı doğrulayamadık — sessizce başarı sayma.
      if (i === 1) {
        return {
          ok: false,
          detail: `yazma sonrası okuma başarısız: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`,
        };
      }
      continue;
    }
    const liveTitle = norm(live.title ?? "");
    const tagsGeldi = Array.isArray(live.tags);
    // Başlık beklentisi varsa (eski çağrı biçimi) tag alanının hiç gelmemesi
    // hoş görülür — o senaryoda kanıt başlıktır. Başlık beklenmiyorsa gönderilen
    // TEK alan tag'dir: alan yanıtta yoksa doğrulama SONUÇSUZDUR, "geldi varsayıp"
    // başarı yazmak yanlış/boş yazımı görünmez yapardı.
    const tagUyusuyor = tagsGeldi
      ? tagKey(live.tags ?? []) === beklenenTags
      : beklenenTitle != null;
    const titleUyusuyor = beklenenTitle == null || liveTitle === beklenenTitle;
    if (titleUyusuyor && tagUyusuyor) {
      return { ok: true, liveTitle };
    }
    if (i === 1) {
      const sapma = !tagsGeldi
        ? "Etsy yanıtı tag alanı içermedi — yazma doğrulanamadı"
        : !tagUyusuyor
          ? "tag listesi Etsy'de farklı"
          : `başlık Etsy'de "${liveTitle.slice(0, 60)}…" (${liveTitle.length} kr), beklenen ${beklenenTitle!.length} kr`;
      return { ok: false, detail: sapma, liveTitle };
    }
  }
  return { ok: false, detail: "doğrulanamadı" };
}

/**
 * Listing etiketlerini (tags) günceller (updateListing PATCH, form-encoded).
 * `listings_w` kapsamı + shop_id gerektirir. Etsy `tags`'i virgülle ayrılmış
 * TEK string bekler; kelimeleri kendisi kombinler. Yalnız `tags` alanına
 * dokunur; diğer alanlar Etsy tarafında korunur. Etsy kuralı: ≤13 tag, her
 * biri ≤20 karakter (çağıran taraf doğrular).
 */
export async function updateListingTags(
  client: EtsyClient,
  listingId: number,
  tags: string[],
): Promise<void> {
  const shopId = await client.requireShopId();
  await client.requestForm<unknown>(
    "PATCH",
    etsyPaths.shopListing(shopId, listingId),
    { tags: tags.join(",") },
  );
}
