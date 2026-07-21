import { cache } from "react";

import { getMembership } from "@/lib/auth";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getShopifyStatus } from "@/lib/db/queries/shopify";
import { getShopierStatus } from "@/lib/db/queries/shopier";

/**
 * Aktif organizasyonun BAĞLI e-ticaret platformu — çok-bağlantılı platform
 * (Amuletta) çekirdeği. Panel yüzeyleri platform adını hardcode ETMEZ
 * ("Etsy siparişleri" vb.); bu çözücüden gelen etikete ve yetenek bayraklarına
 * göre uyarlanır: Etsy bağlı org Etsy dilini, Shopify/Shopier bağlı org kendi
 * platform dilini görür; Etsy'ye özel motorlar (reklam sinyali, SEO etiket
 * push, Star Seller, reprice) diğer platformlarda GİZLENİR (yeniden
 * etiketlenmez — yetenek yoksa yüzey yok).
 *
 * Öncelik: birden çok bağlantı varsa etsy > shopify > shopier (panelin en
 * derin entegrasyonu kazanır). Hiçbiri bağlı değilse "none": nötr
 * "pazaryeri" dili + tüm platform-yetenekleri kapalı (manuel/CSV akışları
 * çalışmaya devam eder). `getBrandScope` deseni: aktif üyelikten türer,
 * `cache()` ile istek başına tek çözüm.
 */

export type CommercePlatformKey = "etsy" | "shopify" | "shopier" | "none";

export interface PlatformCapabilities {
  /** Sipariş/listing senkronu panel içinden tetiklenebilir. */
  sync: boolean;
  /** Panel taslağı platforma push edilebilir (listing oluşturma). */
  listingPush: boolean;
  /** SEO etiketleri canlı platforma yazılabilir (Etsy'ye özel). */
  seoTagPush: boolean;
  /** Reklam sinyalleri/karar kuyruğu (Etsy Ads verisine bağlı). */
  adsSignals: boolean;
  /** Star Seller takibi (Etsy'ye özel program). */
  starSeller: boolean;
  /** Otomatik yeniden fiyatlama canlıya yazabilir (Etsy'ye özel). */
  reprice: boolean;
  /** Stok adetleri platforma iki yönlü senkronlanabilir. */
  stockSync: boolean;
}

export interface ActivePlatform {
  key: CommercePlatformKey;
  /** Kullanıcıya görünen ad: "Etsy" | "Shopify" | "Shopier" | "Pazaryeri". */
  label: string;
  connected: boolean;
  capabilities: PlatformCapabilities;
}

const NONE_CAPS: PlatformCapabilities = {
  sync: false,
  listingPush: false,
  seoTagPush: false,
  adsSignals: false,
  starSeller: false,
  reprice: false,
  stockSync: false,
};

const PLATFORM_DEFS: Record<
  Exclude<CommercePlatformKey, "none">,
  { label: string; capabilities: PlatformCapabilities }
> = {
  etsy: {
    label: "Etsy",
    capabilities: {
      sync: true,
      listingPush: true,
      seoTagPush: true,
      adsSignals: true,
      starSeller: true,
      reprice: true,
      stockSync: true,
    },
  },
  shopify: {
    label: "Shopify",
    // Bugün: bağlantı + senkron temeli var; Etsy'ye özel motorlar kapalı.
    capabilities: { ...NONE_CAPS, sync: true },
  },
  shopier: {
    label: "Shopier",
    capabilities: { ...NONE_CAPS, sync: true },
  },
};

/** Bağlantısız/nötr durum — platform dili yerine genel "pazaryeri" dili. */
const NONE_PLATFORM: ActivePlatform = {
  key: "none",
  label: "Pazaryeri",
  connected: false,
  capabilities: NONE_CAPS,
};

/**
 * Aktif organizasyonun platformunu çözer. Üç durum RPC'si paralel sorgulanır;
 * hepsi sır içermeyen SECURITY DEFINER uçlarıdır. Hata/eksik migration
 * durumunda o platform "bağlı değil" sayılır (sorgu katmanları zaten yutar).
 *
 * KİMLİK ≠ CANLI BAĞLANTI: bir org'un bağlantı SATIRI varsa (durum
 * expired/error olsa bile) o org o platformun org'udur — UI şekli (sekmeler,
 * etiketler) kimliğe göre kurulur ki geçici token süresi dolunca sekmeler
 * kaybolmasın. `connected` yalnız canlı-yazma akışlarını (zaten kendi
 * writeEnabled kapıları var) bilgilendirir.
 */
export const getActivePlatform = cache(async (): Promise<ActivePlatform> => {
  const m = await getMembership();
  if (!m) return NONE_PLATFORM;

  const [etsy, shopify, shopier] = await Promise.all([
    getEtsyStatus(m.org_id).catch(() => null),
    getShopifyStatus(m.org_id).catch(() => null),
    getShopierStatus(m.org_id).catch(() => null),
  ]);

  // Satır varlığı = platform kimliği (status null/"disconnected" = satır yok).
  const hasEtsy = etsy != null && etsy.status !== "disconnected";
  const hasShopify = shopify != null && shopify.status != null;
  const hasShopier = shopier != null && shopier.status !== "disconnected";

  if (hasEtsy) {
    return {
      key: "etsy",
      connected: etsy.status === "connected",
      ...PLATFORM_DEFS.etsy,
    };
  }
  if (hasShopify) {
    return {
      key: "shopify",
      connected: shopify.status === "connected",
      ...PLATFORM_DEFS.shopify,
    };
  }
  if (hasShopier) {
    return {
      key: "shopier",
      connected: shopier.status === "connected",
      ...PLATFORM_DEFS.shopier,
    };
  }
  return NONE_PLATFORM;
});
