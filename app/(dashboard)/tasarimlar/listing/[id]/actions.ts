"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseMoneyToCents } from "@/lib/money";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { pricingWriteBlocked } from "@/lib/feature-flags";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  createMissingListingOfferings,
  pushListingPrices,
} from "@/lib/etsy/inventory";
import { verifyListingSeo } from "@/lib/etsy/listing";
import {
  applyListingPersonalization,
  getListingPersonalization,
  personalizationKey,
  personalizationSummary,
  type PersonalizationQuestion,
} from "@/lib/etsy/personalization";
import { logAudit } from "@/lib/audit";
import {
  asEtsyProperties,
  variantPropsForMatch,
  type RawVariantProperties,
} from "@/lib/variant-properties";

/**
 * Listing Komuta Merkezi — detay sayfası yazma action'ları.
 * Yazmalar admin client ile yapılır ve HER sorguda org_id kilidi zorunludur
 * (bkz. app/(dashboard)/analizler/urunler/actions.ts deseni). Şirket hafızası
 * (audit_log) Postgres trigger'ı ile otomatik dolar — elle loglama gerekmez.
 */

export interface ListingActionResult {
  ok?: boolean;
  error?: string;
}

/** Künye formu alanları — para/adet metin gelir, burada ayrıştırılır. */
export interface ListingFieldsInput {
  title: string;
  description: string;
  /** Virgüllü liste ("gold, chain, necklace"). */
  tags: string;
  /** Virgüllü liste ("14k gold, solid gold"). */
  materials: string;
  /** Para metni ("129,00" / "$129.00"); boş = fiyat yok. */
  price: string;
  quantity: string;
  research_keyword: string;
}

function splitList(s: string): string[] | null {
  const items = s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function parseIntOrNull(s: string): number | null | "invalid" {
  const v = s.trim();
  if (!v) return null;
  if (!/^\d+$/.test(v)) return "invalid";
  return Number(v);
}

function parseGramsOrNull(s: string): number | null | "invalid" {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  if (!Number.isFinite(n) || n <= 0 || n > 500) return "invalid";
  return Math.round(n * 100) / 100;
}

/** Künye alanlarını günceller (title, description, tags, materials, fiyat, adet, kelime). */
export async function updateListingFields(
  id: string,
  fields: ListingFieldsInput,
): Promise<ListingActionResult> {
  const m = await requireMembership();

  const title = fields.title.trim();
  if (!title) return { error: "Başlık boş olamaz." };

  let priceCents: number | null = null;
  if (fields.price.trim()) {
    priceCents = parseMoneyToCents(fields.price);
    if (priceCents <= 0) return { error: "Geçerli bir fiyat girin (ör. 129,00)." };
  }

  const quantity = parseIntOrNull(fields.quantity);
  if (quantity === "invalid") return { error: "Adet tam sayı olmalı." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .update({
      title,
      description: fields.description.trim() || null,
      tags: splitList(fields.tags),
      materials: splitList(fields.materials),
      price_cents: priceCents,
      quantity,
      research_keyword: fields.research_keyword.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("org_id", m.org_id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Listing bulunamadı." };

  revalidatePath(`/tasarimlar/listing/${id}`);
  revalidatePath("/tasarimlar");
  return { ok: true };
}

/**
 * TAG'İ ETSY'YE GÖNDER — canlı listing SEO itişi.
 *
 * BAŞLIK GÖNDERİLMEZ (kullanıcı kuralı, 2026-08-01): Etsy başlık değişiminde
 * sıralama düşme uyarısı verdiği için başlıklara dokunulmuyor, SEO çalışması
 * yalnız tag üzerinden yürüyor (bkz. docs/eon/listing-mutabakat-2026-07-30.md).
 * updateListing gövdesinde `title` opsiyoneldir — göndermeyince Etsy'deki
 * başlık olduğu gibi korunur.
 *
 * Akış: paneldeki (güncellenmiş) tag'ler Etsy updateListing PATCH'iyle canlıya
 * yazılır. Panel aynasının kaynağı Etsy olduğu için ("nihai kaynak Etsy"
 * senkron kuralı) bu itiş yapılmadan panelde kalan düzenleme bir sonraki
 * senkronda EZİLİR — düzenledin mi, gönder.
 *
 * Doğrulamalar Etsy'nin sert kuralları: tag ≤13 adet × ≤20 karakter.
 * updateListing form-encoded bekler (requestForm; envanter PUT'u istisnaydı).
 * Yalnız owner/admin + Etsy yazma erişimi açık.
 */
export async function pushListingSeoToEtsy(
  productId: string,
): Promise<ListingActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("etsy_listing_id, title, tags")
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (error) return { error: error.message };
  const prod = data as {
    etsy_listing_id: number | null;
    title: string;
    tags: string[] | null;
  } | null;
  if (!prod) return { error: "Listing bulunamadı." };
  if (prod.etsy_listing_id == null) {
    return { error: "Bu listing Etsy'e bağlı değil — önce 'Etsy'e gönder' ile taslak açın." };
  }

  const tags = (prod.tags ?? []).map((t) => t.trim()).filter(Boolean);
  // BOŞ TAG KORUMASI: Etsy'de `tags` yazılabilir/temizlenebilir bir alandır —
  // boş liste gönderilirse canlı tag'ler SİLİNİR ve read-back bunu yakalayamaz
  // (beklenen boş = canlı boş → "doğrulandı" der). Gönderilecek tag yoksa
  // PATCH hiç atılmaz.
  if (tags.length === 0) {
    return {
      error:
        "Bu listing'in paneldeki tag listesi boş — gönderim Etsy'deki tag'leri siler, önce tag girin.",
    };
  }
  if (tags.length > 13) return { error: `${tags.length} tag var — Etsy sınırı 13.` };
  const uzun = tags.find((t) => t.length > 20);
  if (uzun) return { error: `Tag ≤20 karakter olmalı: "${uzun}" (${uzun.length}).` };

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const shopId = await client.requireShopId();
    // NOT: ETSY_API_BASE zaten ".../v3/application" — path'e ikinci bir
    // "/application" yazmak URL'i çiftleyip 404 "Resource not found" üretir
    // (canlıda yaşandı). Daima etsyPaths helper'ı kullanılır.
    await client.requestForm(
      "PATCH",
      etsyPaths.shopListing(shopId, prod.etsy_listing_id),
      // Yalnız `tags` — gövdeye `title` KOYULMAZ (başlık kuralı, yukarıdaki
      // doküman bloğu). Etsy gönderilmeyen alanı olduğu gibi bırakır.
      { tags: tags.join(",") },
    );
    // READ-BACK: "200 OK" teslim sayılmaz — yazdığımızı geri okuyup doğrula.
    // Beklenen başlık VERİLMEZ: başlığa dokunmadığımız için canlı başlık ne
    // olursa olsun doğrudur; kanıt tag listesidir.
    const dogrulama = await verifyListingSeo(client, prod.etsy_listing_id, {
      tags,
    });
    await logAudit(admin, {
      orgId: m.org_id,
      action: "etsy.seo_push",
      entityType: "product",
      entityId: productId,
      summary: dogrulama.ok
        ? `Listing ${prod.etsy_listing_id} (${prod.title.slice(0, 40)}): ${tags.length} tag Etsy'ye yazıldı ve geri okunarak doğrulandı (başlığa dokunulmadı).`
        : `Listing ${prod.etsy_listing_id}: tag gönderimi yapıldı ama DOĞRULANAMADI (${dogrulama.detail}).`,
      diff: {
        etsy_listing_id: prod.etsy_listing_id,
        tags,
        verified: dogrulama.ok,
        ...(dogrulama.ok ? {} : { verify_detail: dogrulama.detail }),
      },
      source: "app",
    });
    if (!dogrulama.ok) {
      return {
        error: `Etsy 200 döndü ama yazma doğrulanamadı — ${dogrulama.detail}. Etsy editöründe bu listing açıksa kapatıp tekrar deneyin.`,
      };
    }
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) {
      return { error: "Etsy bağlantısı yok — Ayarlar'dan bağlanın." };
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("403")) {
      return {
        error:
          "Etsy yazma izni reddedildi (403) — listings_w kapsamı için yeniden bağlanmak gerekebilir.",
      };
    }
    return { error: msg };
  }

  revalidatePath(`/tasarimlar/listing/${productId}`);
  return { ok: true };
}

/**
 * LISTING DURUMU (Etsy) — pasife al / yeniden yayına al.
 *
 * Neden panelde: aynı ürünün iki listing'i canlı kalınca (çift listing) hem
 * Etsy'de kendi kendine rekabet doğar hem AYNI SKU'lar iki listing'e dağıldığı
 * için panelin varyant sahipliği senkronla el değiştirir (fiyat itişi yanlış
 * hedefe gidebilir). Pasife alma bunu keser ve GERİ ALINABİLİR — silme değil.
 *
 * Etsy `updateListing` state alanı yalnız 'active'/'inactive' kabul eder;
 * sold_out/expired gibi durumlar düzenlenemez (canlı 403 kanıtı).
 */
export async function setListingStateOnEtsy(
  productId: string,
  state: "active" | "inactive",
): Promise<ListingActionResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("etsy_listing_id, title, status")
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (error) return { error: error.message };
  const prod = data as {
    etsy_listing_id: number | null;
    title: string;
    status: string | null;
  } | null;
  if (!prod) return { error: "Listing bulunamadı." };
  if (prod.etsy_listing_id == null) {
    return { error: "Bu listing Etsy'e bağlı değil." };
  }
  const mevcut = (prod.status ?? "").toLowerCase();
  if (mevcut === state) {
    return { error: `Listing zaten ${state === "active" ? "aktif" : "pasif"}.` };
  }
  if (mevcut !== "active" && mevcut !== "inactive" && mevcut !== "expired") {
    return {
      error: `Etsy '${mevcut}' durumundaki listing'i düzenlemeye izin vermiyor (yalnız aktif/pasif/süresi dolmuş).`,
    };
  }

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const shopId = await client.requireShopId();
    await client.requestForm(
      "PATCH",
      etsyPaths.shopListing(shopId, prod.etsy_listing_id),
      { state },
    );
    // Panel aynasını hemen güncelle — bir sonraki senkronu bekleme (kullanıcı
    // sonucu anında görsün; senkron zaten Etsy'yi nihai kaynak sayıp teyit eder).
    await admin
      .from("products")
      .update({ status: state, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("org_id", m.org_id);
    await logAudit(admin, {
      orgId: m.org_id,
      action: "etsy.listing_state",
      entityType: "product",
      entityId: productId,
      summary: `Listing ${prod.etsy_listing_id} Etsy'de ${state === "inactive" ? "PASİFE alındı" : "yeniden YAYINA alındı"}: ${prod.title.slice(0, 60)}`,
      diff: { etsy_listing_id: prod.etsy_listing_id, from: mevcut, to: state },
      source: "app",
    });
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) {
      return { error: "Etsy bağlantısı yok — Ayarlar'dan bağlanın." };
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("403")) {
      return {
        error:
          "Etsy yazma izni reddedildi (403) — listings_w kapsamı için yeniden bağlanmak gerekebilir.",
      };
    }
    return { error: msg };
  }

  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true };
}

/**
 * SKU ÖNEKİ DEĞİŞTİR (Etsy) — kopyalanan listing'i kendi ailesine taşır.
 *
 * Vaka: Etsy'de listing kopyalayınca SKU'lar da kopyalanır; panelde SKU
 * (org_id, sku) ile tekil olduğundan kopya "0 varyant" görünür ve Listeler'de
 * gizlenir. Bu action kopyanın Etsy envanterindeki SKU önekini değiştirir,
 * sonra panel varyantlarını yeniden senkronlar — çakışma kökten biter.
 *
 * Güvenlik: fiyat/adet/property korunur (lib/etsy/inventory kuralları); hedef
 * önek org'da BAŞKA bir listing tarafından kullanılıyorsa reddedilir.
 */
export async function renameListingSkusOnEtsy(
  productId: string,
  fromPrefix: string,
  toPrefix: string,
): Promise<ListingActionResult & { renamed?: number; sample?: string[] }> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const from = fromPrefix.trim();
  const to = toPrefix.trim();
  if (!from || !to) return { error: "Eski ve yeni SKU öneki gerekli." };
  if (from === to) return { error: "Önekler aynı — değişiklik yok." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("etsy_listing_id, title")
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (error) return { error: error.message };
  const prod = data as { etsy_listing_id: number | null; title: string } | null;
  if (!prod?.etsy_listing_id) return { error: "Listing Etsy'e bağlı değil." };

  // Hedef önek başka bir listing'de yaşıyorsa yeni çakışma yaratma.
  const { data: mevcut } = await admin
    .from("product_variants")
    .select("sku, product_id")
    .eq("org_id", m.org_id)
    .like("sku", `${to}%`)
    .neq("product_id", productId)
    .limit(1);
  if ((mevcut ?? []).length > 0) {
    const v = (mevcut ?? [])[0] as { sku: string };
    return {
      error: `'${to}' öneki zaten başka bir listing'de kullanılıyor (ör. ${v.sku}) — yeni çakışma yaratmamak için durduruldu.`,
    };
  }

  // Eksen adları (Width / Ring Size) için değer→ad haritası. Etsy custom slot
  // 513/514'te property_name'i null döndürür; 2025 envanter PUT'u ise string
  // ister — harita verilmezse eksen adları payload'dan düşer ve PUT "Expected
  // string value for 'property_name'" ile patlar (fiyat/adet itişi bunu zaten
  // taşıyordu, rename yolu taşımıyordu).
  //
  // Ürün-id yerine ESKİ SKU ÖNEKİYLE çekilir: bu action'ın çözdüğü çakışmada
  // varyant satırları çoğu zaman kopyaya değil KAYNAK listing'e bağlıdır
  // (product_id filtresi boş küme döndürürdü). Anahtar da eski SKU olmalı —
  // buildInventoryUpdate envanteri rename ÖNCESİ canlı SKU'yla okur.
  const { data: vRows } = await admin
    .from("product_variants")
    .select("sku, properties")
    .eq("org_id", m.org_id)
    .like("sku", `${from}%`);
  const propsBySku = new Map<string, { name: string; value: string }[]>();
  for (const v of (vRows ?? []) as {
    sku: string | null;
    properties: RawVariantProperties;
  }[]) {
    const sku = (v.sku ?? "").trim();
    if (sku) propsBySku.set(sku, variantPropsForMatch(v.properties));
  }

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const { renameListingSkuPrefix } = await import("@/lib/etsy/inventory");
    const r = await renameListingSkuPrefix(
      client,
      prod.etsy_listing_id,
      from,
      to,
      propsBySku,
    );
    if (r.status === "error") return { error: r.detail ?? "SKU yazılamadı." };
    if (r.status === "unchanged") {
      return { error: "Değişecek SKU bulunamadı (önek eşleşmedi)." };
    }
    // Panel aynasını hemen tazele — varyantlar artık bu listing'e bağlanır.
    const { syncOneListingVariants } = await import("@/lib/etsy/variants");
    await syncOneListingVariants(m.org_id, productId);

    await logAudit(admin, {
      orgId: m.org_id,
      action: "etsy.variant_sync",
      entityType: "product",
      entityId: productId,
      summary: `Listing ${prod.etsy_listing_id}: ${r.renamed} SKU '${from}' → '${to}' olarak Etsy'de yeniden adlandırıldı.`,
      diff: { etsy_listing_id: prod.etsy_listing_id, from, to, renamed: r.renamed, sample: r.sample },
      source: "app",
    });
    revalidatePath(`/tasarimlar/listing/${productId}`);
    revalidatePath("/tasarimlar");
    return {
      ok: true,
      renamed: r.renamed,
      sample: r.sample.map((s) => `${s.from} → ${s.to}`),
    };
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) {
      return { error: "Etsy bağlantısı yok — Ayarlar'dan bağlanın." };
    }
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export interface BulkSeoPushResult {
  ok?: boolean;
  error?: string;
  /** BU çağrıda başarıyla gönderilen listing sayısı. */
  sent?: number;
  /** Gönderilemeyen listing'ler (id + neden) — kısmi başarı gizlenmez. */
  failed?: { listingId: number; error: string }[];
  /** Süre bütçesi doldu, iş yarım kaldı — çağıran taraf devam çağrısı yapmalı. */
  devam?: boolean;
  /** Devam çağrısının başlayacağı sıra (domino imleci). */
  nextIndex?: number;
  /** Bu çağrıda işlenmeden kalan listing sayısı. */
  kalan?: number;
  /** Kapsamdaki toplam listing (ilerleme göstergesi için). */
  total?: number;
}

/** Tek çağrının süre bütçesi — sayfa maxDuration 300sn, ~60sn pay bırakılır. */
const BULK_SEO_BUDGET_MS = 240_000;
/** Kaç listing'de bir ARA audit kaydı düşülür (kısmi yazım iz bırakmalı). */
const BULK_SEO_AUDIT_EVERY = 25;

/**
 * TOPLU SEO GÖNDERİMİ — org'un TÜM canlı listing'lerinin paneldeki TAG'ini
 * tek tıkla Etsy'ye yazar. Tek-listing gönderiminin (yukarıda) toplu hâli;
 * idempotent — değişmemiş listing'e aynı tag'leri yazmak zararsızdır. BAŞLIK
 * GÖNDERİLMEZ (başlık kuralı, 2026-08-01 — bkz. pushListingSeoToEtsy).
 * Kural dışı kalan listing (tag yok / >13 tag vb.) TÜMÜ durdurmaz: atlanır ve
 * sonuçta nedeniyle raporlanır. Etsy oran sınırına saygı: istekler sıralı +
 * kısa aralıklı (requestForm zaten 429'da bir kez bekleyip yineler).
 *
 * DOMINO (bkz. lib/etsy/sync.ts advanceEtsySync): listing başına ~1-1,5 sn
 * (PATCH + read-back) harcandığından 100+ listing tek çağrıda fonksiyon süre
 * sınırını aşar; aşınca YANIT DA AUDIT DE kaybolur, yani canlıya yazılmış
 * tag'lerin hiçbir izi kalmazdı. Bu yüzden çağrı bir süre bütçesiyle koşar,
 * bütçe dolunca imleçle (`nextIndex`) yarıda döner ve çağıran taraf kaldığı
 * yerden devam eder; ilerleme ayrıca BULK_SEO_AUDIT_EVERY listing'de bir
 * audit'e yazılır.
 *
 * @param startIndex Kaçıncı listing'den devam edileceği (0 = baştan).
 */
export async function pushAllListingSeoToEtsy(
  startIndex = 0,
): Promise<BulkSeoPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("id, etsy_listing_id, title, tags, status")
    .eq("org_id", m.org_id)
    .not("etsy_listing_id", "is", null)
    .is("etsy_deleted_at", null)
    // Etsy yalnız active/expired listing'in düzenlenmesine izin verir
    // (canlı 403: "must be active or expired but is sold_out") — düzenlenemez
    // durumları hiç deneme, hata gürültüsü üretme.
    .in("status", ["active", "expired"])
    // Sıra TAM olmalı: domino imleci (startIndex) çağrılar arasında aynı
    // diziye denk gelmezse bazı listing'ler atlanır/tekrarlanır. Aynı başlıklı
    // kayıtlarda beraberliği id bozar.
    .order("title")
    .order("id");
  if (error) return { error: error.message };
  const items = (data ?? []) as {
    id: string;
    etsy_listing_id: number;
    title: string;
    tags: string[] | null;
  }[];
  if (items.length === 0) return { error: "Canlı listing yok." };
  const basla = Math.max(0, Math.min(Math.trunc(startIndex), items.length));
  if (basla === items.length) {
    // Devam çağrısı kapsamın sonuna denk geldi — yapacak iş yok.
    return { ok: true, sent: 0, failed: [], total: items.length, kalan: 0 };
  }

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    return {
      error:
        e instanceof EtsyNotConnectedError
          ? "Etsy bağlantısı yok — Ayarlar'dan bağlanın."
          : e instanceof Error
            ? e.message
            : String(e),
    };
  }
  const shopId = await client.requireShopId();

  const bitis = Date.now() + BULK_SEO_BUDGET_MS;
  let sent = 0;
  const failed: { listingId: number; error: string }[] = [];
  let i = basla;
  let sonKayit = basla;

  /**
   * İlerlemeyi audit'e yazar. `sonSira` = işlenen son kaydın sıra numarası
   * (1-tabanlı) = bir sonraki çağrının başlayacağı indeks.
   */
  const yazAudit = async (sonSira: number, ara: boolean, yarim: boolean) =>
    logAudit(admin, {
      orgId: m.org_id,
      action: "etsy.seo_push",
      entityType: "shop",
      summary:
        `Toplu SEO gönderimi${ara ? " (ara kayıt)" : ""}: ${basla + 1}-${sonSira}. sıra, ` +
        `${sent} listing'in tag'i Etsy'ye yazıldı (başlığa dokunulmadı)` +
        `${failed.length ? `, ${failed.length} hata` : ""}` +
        `${yarim ? `; süre bütçesi doldu, ${items.length - sonSira} listing bekliyor` : ""}.`,
      diff: {
        sent,
        failed,
        start: basla,
        next: sonSira,
        total: items.length,
        devam: yarim,
      },
      source: "app",
    });

  for (; i < items.length; i++) {
    // Süre bütçesi: fonksiyon sınırına dayanmadan dur — yarıda kesilen çağrı
    // ne yanıt ne audit bırakır, yani yazılanlar görünmez olurdu.
    if (Date.now() >= bitis) break;
    const it = items[i];
    const tags = (it.tags ?? []).map((t) => t.trim()).filter(Boolean);
    const kural =
      // BOŞ TAG KORUMASI: boş liste göndermek Etsy'deki tag'leri SİLER ve
      // read-back bunu yakalayamaz (boş = boş → "doğrulandı"). Önce bu.
      tags.length === 0
        ? "tag yok — gönderim atlandı"
        : tags.length > 13
          ? `${tags.length}/13 tag`
          : tags.find((t) => t.length > 20)
            ? `tag >20 karakter`
            : null;
    if (kural) {
      failed.push({ listingId: it.etsy_listing_id, error: kural });
      continue;
    }
    try {
      await client.requestForm(
        "PATCH",
        etsyPaths.shopListing(shopId, it.etsy_listing_id),
        // Yalnız `tags` — başlık gövdeye KOYULMAZ (başlık kuralı).
        { tags: tags.join(",") },
      );
      // READ-BACK: yazılan her listing geri okunur; doğrulanmayan "gönderildi"
      // sayılmaz, sapma nedeniyle raporlanır (bkz. lib/etsy/listing.ts).
      // Beklenen başlık verilmez: başlığa dokunulmadı, kanıt tag listesidir.
      const dogrulama = await verifyListingSeo(client, it.etsy_listing_id, {
        tags,
      });
      if (dogrulama.ok) {
        sent++;
      } else {
        failed.push({
          listingId: it.etsy_listing_id,
          error: `yazıldı ama doğrulanamadı: ${dogrulama.detail}`,
        });
      }
    } catch (e) {
      failed.push({
        listingId: it.etsy_listing_id,
        error: e instanceof Error ? e.message.slice(0, 160) : String(e),
      });
    }
    // Oran sınırı nezaketi — Etsy saniyede ~10 isteğe izin verir, aceleye gerek yok.
    await new Promise((r) => setTimeout(r, 150));
    // Ara kayıt: çağrı beklenmedik yerde ölse bile kısmi yazım audit'te durur.
    if (i + 1 - sonKayit >= BULK_SEO_AUDIT_EVERY) {
      sonKayit = i + 1;
      await yazAudit(sonKayit, true, false);
    }
  }

  const devam = i < items.length;
  await yazAudit(i, false, devam);

  revalidatePath("/tasarimlar");
  return {
    ok: failed.length === 0 && !devam,
    sent,
    failed,
    devam,
    nextIndex: i,
    kalan: items.length - i,
    total: items.length,
  };
}

/** Varyant satırı girdisi — inline editörden metin olarak gelir. */
export interface VariantValuesInput {
  /** Para metni; boş = fiyat bilinmiyor (null). */
  price: string;
  /** Gram; boş = ağırlık bilinmiyor (null). */
  weight: string;
  quantity: string;
  /**
   * Ağırlık hücresine dokunuldu mu? Yalnız adet/fiyat değişen kayıtlarda
   * weight_source ('etsy'/'inferred' vb. köken bilgisi) EZİLMESİN diye
   * ağırlık alanları sadece dirty ise güncellenir.
   */
  weightDirty: boolean;
}

/**
 * Tek varyantı günceller (org_id + sku kapsamlı). Ağırlık girildiyse
 * weight_source='manual'; ağırlık boşaltıldıysa kaynak da temizlenir.
 */
export async function updateVariant(
  productId: string,
  sku: string,
  values: VariantValuesInput,
): Promise<ListingActionResult> {
  const m = await requireMembership();
  if (!sku.trim()) return { error: "SKU gerekli." };

  let priceCents: number | null = null;
  if (values.price.trim()) {
    priceCents = parseMoneyToCents(values.price);
    if (priceCents <= 0) return { error: "Geçerli bir fiyat girin (ör. 129,00)." };
  }

  const grams = parseGramsOrNull(values.weight);
  if (grams === "invalid") return { error: "0–500 arası geçerli bir gram girin." };

  const quantity = parseIntOrNull(values.quantity);
  if (quantity === "invalid") return { error: "Adet tam sayı olmalı." };

  const patch: Record<string, unknown> = {
    price_cents: priceCents,
    quantity,
    updated_at: new Date().toISOString(),
  };
  if (values.weightDirty) {
    patch.weight_grams = grams;
    patch.weight_source = grams != null ? "manual" : null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_variants")
    .update(patch)
    .eq("org_id", m.org_id)
    .eq("sku", sku)
    .select("sku");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Varyant bulunamadı." };

  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true };
}

/**
 * Etsy envanterindeki fiyat/adetleri bu listing'in varyantlarına yazar
 * (gram korunur). Panelde toplu fiyatla ezilen matrisi Etsy'ye döndürmek için.
 */
export async function restoreVariantPricesFromEtsy(
  productId: string,
): Promise<ListingActionResult & { variants?: number }> {
  const m = await requireMembership();
  const { syncOneListingVariants } = await import("@/lib/etsy/variants");
  const res = await syncOneListingVariants(m.org_id, productId);
  if (res.error) return { error: res.error };
  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true, variants: res.variants };
}

/**
 * Audit log'daki son fiyat değişiminden ÖNCEKİ price_cents değerlerine döner
 * (Etsy senkronu yoksa / panel-only değişiklik için).
 */
export async function restoreVariantPricesFromAudit(
  productId: string,
): Promise<ListingActionResult & { restored?: number }> {
  const m = await requireMembership();
  const admin = createAdminClient();

  const { data: variants, error: vErr } = await admin
    .from("product_variants")
    .select("id, sku, price_cents")
    .eq("org_id", m.org_id)
    .eq("product_id", productId);
  if (vErr) return { error: vErr.message };
  const rows = (variants ?? []) as {
    id: string;
    sku: string;
    price_cents: number | null;
  }[];
  if (rows.length === 0) return { error: "Varyant yok." };

  let restored = 0;
  for (const v of rows) {
    const { data: logs } = await admin
      .from("audit_log")
      .select("diff, created_at")
      .eq("org_id", m.org_id)
      .eq("entity_type", "product_variants")
      .eq("entity_id", v.id)
      .eq("action", "update")
      .order("created_at", { ascending: false })
      .limit(20);

    type Diff = {
      before?: { price_cents?: number | null };
      after?: { price_cents?: number | null };
    };
    let prevPrice: number | null | undefined;
    for (const log of (logs ?? []) as { diff: Diff }[]) {
      const before = log.diff?.before?.price_cents;
      const after = log.diff?.after?.price_cents;
      if (before !== after && before != null) {
        prevPrice = before;
        break;
      }
    }
    if (prevPrice == null || prevPrice === v.price_cents) continue;

    const { error } = await admin
      .from("product_variants")
      .update({
        price_cents: prevPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", m.org_id)
      .eq("id", v.id);
    if (!error) restored += 1;
  }

  if (restored === 0) {
    return {
      error:
        "Audit’te geri alınacak fiyat değişimi bulunamadı. Etsy’den geri almayı dene.",
    };
  }

  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true, restored };
}

export type VariantPriceSnapshot = {
  sku: string;
  price_cents: number | null;
};

/** Toplu fiyat yazımı — önceki fiyatları döner (geri alma için). */
export async function saveVariantsBulkPrices(
  productId: string,
  items: { sku: string; price: string }[],
): Promise<
  ListingActionResult & {
    updated?: number;
    previous?: VariantPriceSnapshot[];
  }
> {
  const m = await requireMembership();
  if (items.length === 0) return { error: "Kaydedilecek fiyat yok." };
  const admin = createAdminClient();

  const skus = items.map((i) => i.sku.trim()).filter(Boolean);
  const { data: beforeRows, error: beforeErr } = await admin
    .from("product_variants")
    .select("sku, price_cents")
    .eq("org_id", m.org_id)
    .eq("product_id", productId)
    .in("sku", skus);
  if (beforeErr) return { error: beforeErr.message };
  const previous = (beforeRows ?? []) as VariantPriceSnapshot[];

  let updated = 0;
  for (const it of items) {
    if (!it.sku.trim() || !it.price.trim()) continue;
    const priceCents = parseMoneyToCents(it.price);
    if (priceCents <= 0) continue;
    const { data, error } = await admin
      .from("product_variants")
      .update({
        price_cents: priceCents,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", m.org_id)
      .eq("product_id", productId)
      .eq("sku", it.sku)
      .select("sku");
    if (error) return { error: `${it.sku}: ${error.message}` };
    if (data && data.length > 0) updated += 1;
  }
  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true, updated, previous };
}

/** Geri alma: önceki fiyat anlık görüntüsünü yeniden yazar. */
export async function undoVariantPrices(
  productId: string,
  previous: VariantPriceSnapshot[],
): Promise<ListingActionResult & { restored?: number }> {
  const m = await requireMembership();
  if (previous.length === 0) return { error: "Geri alınacak anlık görüntü yok." };
  const admin = createAdminClient();
  let restored = 0;
  for (const it of previous) {
    const { data, error } = await admin
      .from("product_variants")
      .update({
        price_cents: it.price_cents,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", m.org_id)
      .eq("product_id", productId)
      .eq("sku", it.sku)
      .select("sku");
    if (error) return { error: `${it.sku}: ${error.message}` };
    if (data && data.length > 0) restored += 1;
  }
  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true, restored };
}

export interface PushOneResult {
  ok?: boolean;
  /** Gerçekten Etsy'ye yazıldı mı (fiyat farklıydı)? */
  updated?: boolean;
  /** Değişen offering sayısı (updated ise). */
  changed?: number;
  /** Etsy zaten panelle aynıydı — yazılmadı. */
  unchanged?: boolean;
  needsReconnect?: boolean;
  error?: string;
}

/**
 * TEK listing'in varyant fiyatlarını Etsy'ye yazar (kanarya: toplu itiş öncesi
 * bir ilanda dene-doğrula). Toplu "Etsy'e her şeyi gönder" ile AYNI güvenli
 * çekirdeği kullanır (pushListingPrices): DB'de fiyatı olmayan SKU'da Etsy
 * canlı fiyatı korunur, fark yoksa PUT atlanır, fiyat asla sıfırlanmaz. Sonuç
 * NEDEN'i açıkça döner (yazma izni yok / bağlı değil / değişiklik yok / hata).
 */
export async function pushListingPricesToEtsyAction(
  productId: string,
): Promise<PushOneResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  // Fiyat panel dışında belirleniyorsa (EON) panel fiyat yazmaz.
  const pricingBlocked = await pricingWriteBlocked(m.org_id);
  if (pricingBlocked) return { error: pricingBlocked };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return {
      error:
        "Etsy yazma izni (listings_w) kapalı — Ayarlar → Etsy'de 'Yeniden Bağlan' ile yazma iznini onaylayın.",
    };

  const admin = createAdminClient();
  const { data: prod, error: prodErr } = await admin
    .from("products")
    .select("etsy_listing_id")
    .eq("org_id", m.org_id)
    .eq("id", productId)
    .maybeSingle();
  if (prodErr) return { error: prodErr.message };
  const etsyId = (prod as { etsy_listing_id: number | null } | null)
    ?.etsy_listing_id;
  if (etsyId == null) return { error: "Bu listing Etsy'e bağlı değil." };

  const { data: vRows, error: vErr } = await admin
    .from("product_variants")
    .select("sku, price_cents, properties")
    .eq("org_id", m.org_id)
    .eq("product_id", productId);
  if (vErr) return { error: vErr.message };
  const priceBySku = new Map<string, number>();
  const propsBySku = new Map<string, { name: string; value: string }[]>();
  for (const v of (vRows ?? []) as {
    sku: string | null;
    price_cents: number | null;
    properties: RawVariantProperties;
  }[]) {
    const sku = (v.sku ?? "").trim();
    if (!sku) continue;
    if (v.price_cents != null && v.price_cents > 0)
      priceBySku.set(sku, v.price_cents);
    propsBySku.set(sku, variantPropsForMatch(v.properties));
  }
  if (priceBySku.size === 0)
    return { error: "Fiyatı olan varyant yok — gönderilecek fiyat bulunamadı." };

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const r = await pushListingPrices(client, etsyId, priceBySku, propsBySku);
    if (r.status === "error")
      return { error: r.detail ?? "Etsy'ye gönderilemedi." };
    revalidatePath(`/tasarimlar/listing/${productId}`);
    return {
      ok: true,
      updated: r.status === "updated",
      changed: r.changed,
      unchanged: r.status === "unchanged",
    };
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) return { needsReconnect: true };
    return { error: e instanceof Error ? e.message : "Etsy'ye gönderilemedi." };
  }
}

export interface CreateMissingVariantsResult {
  ok?: boolean;
  /** Etsy'de yeni oluşturulan offering (SKU) sayısı. */
  created?: number;
  /** Tüm panel varyantları zaten Etsy'deydi — hiçbir şey yazılmadı. */
  unchanged?: boolean;
  /** Oluşturulamayan panel SKU'ları (fiyat/property eksik). */
  missing?: string[];
  needsReconnect?: boolean;
  error?: string;
}

/**
 * Panel'de olup Etsy'de OLMAYAN varyantları listing'e YENİ offering olarak
 * ekler (vaka: 0124 — basketweave/ribbed'e 2-5mm genişlikler panelde eklendi
 * ama Etsy'de yoktu; kullanıcı fiyat butonuna basınca externalPricing kapısına
 * takıldı ve eksikler hiç açılamadı).
 *
 * externalPricing kapısına BİLEREK takılmaz: mevcut offering'lerin fiyatı
 * Etsy'deki canlı değeriyle AYNEN geri yazılır (panel fiyat DEĞİŞTİRMEZ);
 * yalnız yeni açılan offering, DB'deki motor-kaynaklı fiyatla doğar — Etsy
 * fiyatsız offering kabul etmediği için bu zorunludur.
 */
export async function createMissingEtsyVariantsAction(
  productId: string,
): Promise<CreateMissingVariantsResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return {
      error:
        "Etsy yazma izni (listings_w) kapalı — Ayarlar → Etsy'de 'Yeniden Bağlan' ile yazma iznini onaylayın.",
    };

  const admin = createAdminClient();
  const { data: prod, error: prodErr } = await admin
    .from("products")
    .select("etsy_listing_id")
    .eq("org_id", m.org_id)
    .eq("id", productId)
    .maybeSingle();
  if (prodErr) return { error: prodErr.message };
  const etsyId = (prod as { etsy_listing_id: number | null } | null)
    ?.etsy_listing_id;
  if (etsyId == null) return { error: "Bu listing Etsy'e bağlı değil." };

  const { data: vRows, error: vErr } = await admin
    .from("product_variants")
    .select("sku, price_cents, quantity, properties")
    .eq("org_id", m.org_id)
    .eq("product_id", productId);
  if (vErr) return { error: vErr.message };
  const variants = ((vRows ?? []) as {
    sku: string | null;
    price_cents: number | null;
    quantity: number | null;
    properties: RawVariantProperties;
  }[])
    .filter((v) => (v.sku ?? "").trim())
    .map((v) => ({
      sku: (v.sku ?? "").trim(),
      priceCents: v.price_cents,
      quantity: v.quantity ?? 0,
      // Her iki DB şeklini de kanonik Etsy dizisine indirger; EON düz-nesne
      // şekli property_id 0 alır → create yolu onları "missing" diye raporlar.
      properties: asEtsyProperties(v.properties),
    }));
  if (variants.length === 0) return { error: "Panelde varyant yok." };

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const r = await createMissingListingOfferings(client, etsyId, variants);
    if (r.status === "error")
      return { error: r.detail ?? "Etsy'ye gönderilemedi.", missing: r.missing };
    if (r.created > 0 || r.missing.length > 0) {
      await logAudit(admin, {
        orgId: m.org_id,
        action: "etsy.variant_sync",
        entityType: "products",
        entityId: productId,
        summary:
          `Eksik varyantlar Etsy'de oluşturuldu (listing ${etsyId}): ${r.created} yeni offering` +
          (r.missing.length ? `, ${r.missing.length} oluşturulamadı` : "") +
          " — mevcut fiyatlara dokunulmadı.",
        source: "etsy",
      });
    }
    revalidatePath(`/tasarimlar/listing/${productId}`);
    revalidatePath("/stok/varyant");
    return {
      ok: true,
      created: r.created,
      unchanged: r.status === "unchanged",
      missing: r.missing,
    };
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) return { needsReconnect: true };
    return { error: e instanceof Error ? e.message : "Etsy'ye gönderilemedi." };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * KİŞİSELLEŞTİRME ("custom options") — referanstan kopyalama
 * ────────────────────────────────────────────────────────────────────────── */

/** Toplu kopyalamanın süre bütçesi (sayfa maxDuration 300sn, pay bırakılır). */
const BULK_PERSONALIZATION_BUDGET_MS = 240_000;

export interface PersonalizationReadResult {
  error?: string;
  listingId?: number;
  questions?: PersonalizationQuestion[];
  summary?: string;
}

/**
 * Bir listing'in Etsy'deki CANLI kişiselleştirmesini okur (yazma yok).
 *
 * Panel bu alanı aynalamıyor — tek doğruluk kaynağı Etsy. Kullanıcı önce
 * referans listing'de ne olduğunu GÖRÜR, sonra kopyalamaya karar verir.
 */
export async function readListingPersonalization(
  productId: string,
): Promise<PersonalizationReadResult> {
  const m = await requireMembership();
  const admin = createAdminClient();
  const { data: prod } = await admin
    .from("products")
    .select("etsy_listing_id")
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  const listingId = (prod as { etsy_listing_id: number | null } | null)
    ?.etsy_listing_id;
  if (!listingId) return { error: "Bu kayıt Etsy'de yayında değil." };

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const questions = await getListingPersonalization(client, listingId);
    return {
      listingId,
      questions,
      summary: personalizationSummary(questions),
    };
  } catch (e) {
    return {
      error:
        e instanceof EtsyNotConnectedError
          ? "Etsy bağlantısı yok — Ayarlar'dan bağlanın."
          : e instanceof Error
            ? e.message
            : String(e),
    };
  }
}

export interface BulkPersonalizationResult {
  ok?: boolean;
  error?: string;
  /** Bu turda yazılan ve read-back ile doğrulanan listing sayısı. */
  applied?: number;
  /** Zaten referansla aynı olduğu için dokunulmayan listing sayısı. */
  skipped?: number;
  failed?: { listingId: number; error: string }[];
  total?: number;
  kalan?: number;
  devam?: boolean;
  nextIndex?: number;
  /** Referansta okunan soruların özeti — kullanıcıya ne yazıldığını gösterir. */
  summary?: string;
}

/**
 * REFERANS LISTING'İN KİŞİSELLEŞTİRMESİNİ TÜM CANLI LISTING'LERE KOPYALAR.
 *
 * Sorular referanstan OKUNUR (kodda sabit değildir — bkz. lib/etsy/personalization.ts),
 * hedeflere yazılır ve her hedefte AYNI TURDA geri okunarak doğrulanır.
 * Referansın kendisi atlanır. Zaten aynı olan hedef de atlanır: Etsy POST'u
 * mevcut kişiselleştirmeyi tamamen değiştirdiği için gereksiz yazma, alıcı
 * tarafında soru kimliklerini boşuna döndürür.
 *
 * DOMINO (bkz. pushAllListingSeoToEtsy): listing başına ~1,5-2 sn (okuma +
 * POST + read-back) harcanır; 40+ listing tek çağrıya sığmaz. Bütçe dolunca
 * imleçle (`nextIndex`) yarıda dönülür, çağıran kaldığı yerden devam eder.
 */
export async function copyPersonalizationToAllListings(
  referenceProductId: string,
  startIndex = 0,
): Promise<BulkPersonalizationResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();
  const { data: ref } = await admin
    .from("products")
    .select("etsy_listing_id, title")
    .eq("id", referenceProductId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  const refListingId = (ref as { etsy_listing_id: number | null } | null)
    ?.etsy_listing_id;
  if (!refListingId) return { error: "Referans listing Etsy'de yayında değil." };

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    return {
      error:
        e instanceof EtsyNotConnectedError
          ? "Etsy bağlantısı yok — Ayarlar'dan bağlanın."
          : e instanceof Error
            ? e.message
            : String(e),
    };
  }
  const shopId = await client.requireShopId();

  let kaynak: PersonalizationQuestion[];
  try {
    kaynak = await getListingPersonalization(client, refListingId);
  } catch (e) {
    return {
      error: `Referans kişiselleştirme okunamadı: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
  if (kaynak.length === 0) {
    // Boş kaynağı yaymak hedeflerdeki soruları SİLERDİ — baştan reddet.
    return {
      error:
        "Referans listing'de kişiselleştirme sorusu yok — kopyalamak diğer " +
        "listing'lerin sorularını silerdi.",
    };
  }
  const kaynakKey = personalizationKey(kaynak);
  const ozet = personalizationSummary(kaynak);

  const { data, error } = await admin
    .from("products")
    .select("id, etsy_listing_id, title, status")
    .eq("org_id", m.org_id)
    .not("etsy_listing_id", "is", null)
    .is("etsy_deleted_at", null)
    // TASLAK DA DAHİL. SEO gönderimi active/expired ile sınırlı çünkü
    // updateListing PATCH taslakta 403 veriyor; kişiselleştirme AYRI bir uç ve
    // taslak düzenlemeyi engellediğine dair kanıt yok. Taslakları baştan
    // dışlamak, tam da yeni açılan (ve bu yüzden soruları eksik olan)
    // listing'leri kapsam dışı bırakırdı. Etsy reddederse hata o listing için
    // raporlanır — sessiz atlama olmaz.
    .in("status", ["active", "expired", "draft"])
    // Domino imleci çağrılar arasında AYNI diziye denk gelmeli.
    .order("title")
    .order("id");
  if (error) return { error: error.message };

  const items = (
    (data ?? []) as { id: string; etsy_listing_id: number; title: string }[]
  ).filter((p) => p.etsy_listing_id !== refListingId);
  if (items.length === 0) return { error: "Kopyalanacak başka canlı listing yok." };

  const basla = Math.max(0, Math.min(Math.trunc(startIndex), items.length));
  if (basla === items.length) {
    return { ok: true, applied: 0, skipped: 0, failed: [], total: items.length, kalan: 0, summary: ozet };
  }

  const bitis = Date.now() + BULK_PERSONALIZATION_BUDGET_MS;
  let applied = 0;
  let skipped = 0;
  const failed: { listingId: number; error: string }[] = [];
  let i = basla;

  for (; i < items.length; i++) {
    if (Date.now() > bitis) break;
    const it = items[i];
    try {
      // Zaten aynıysa yazma: gereksiz POST soru kimliklerini değiştirir.
      const mevcut = await getListingPersonalization(client, it.etsy_listing_id);
      if (personalizationKey(mevcut) === kaynakKey) {
        skipped++;
        continue;
      }
      const sonuc = await applyListingPersonalization(
        client,
        shopId,
        it.etsy_listing_id,
        kaynak,
      );
      if (sonuc.ok) applied++;
      else {
        failed.push({
          listingId: it.etsy_listing_id,
          error: `yazıldı ama doğrulanamadı: ${sonuc.detail}`,
        });
      }
    } catch (e) {
      failed.push({
        listingId: it.etsy_listing_id,
        error: e instanceof Error ? e.message.slice(0, 140) : String(e),
      });
    }
  }

  const yarim = i < items.length;
  await logAudit(admin, {
    orgId: m.org_id,
    action: "etsy.personalization_push",
    entityType: "shop",
    summary:
      `Kişiselleştirme kopyalandı (referans ${refListingId}): ${basla + 1}-${i}. sıra, ` +
      `${applied} listing'e yazıldı ve doğrulandı, ${skipped} zaten aynıydı` +
      `${failed.length ? `, ${failed.length} hata` : ""}` +
      `${yarim ? `; süre bütçesi doldu, ${items.length - i} listing bekliyor` : ""}. ` +
      `Yazılan: ${ozet}`,
    diff: {
      reference_listing_id: refListingId,
      questions: kaynak.length,
      applied,
      skipped,
      failed,
      start: basla,
      next: i,
      total: items.length,
      devam: yarim,
    },
    source: "app",
  });

  revalidatePath("/tasarimlar");
  return {
    ok: true,
    applied,
    skipped,
    failed,
    total: items.length,
    kalan: items.length - i,
    devam: yarim,
    nextIndex: i,
    summary: ozet,
  };
}
