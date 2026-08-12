import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Palette,
  ScrollText,
  FileBarChart,
  Settings,
  Archive,
  Lightbulb,
  Tags,
  Boxes,
  MessageSquareText,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Yalnız Jade Gold organizasyonu aktifken görünür (marka-özel içerik). */
  jadeGoldOnly?: boolean;
  /** Jade Gold veya EON aktifken görünür (Marka Kılavuzu vb.). */
  brandBook?: boolean;
  /**
   * Bu sekme yalnız aktif platformun ilgili yeteneği açıksa görünür
   * (lib/platform.ts). Ör. Star Seller Etsy'ye özel bir programdır —
   * Shopify/Shopier bağlı org'da sekme gizlenir, yeniden etiketlenmez.
   */
  capability?: "starSeller" | "adsSignals" | "seoTagPush";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * SADELEŞTİRİLMİŞ nav (2026-08-12 — docs/panel-sadelestirme-plani.md).
 *
 * Panel iki uçtan uca döngüyü taşır; nav onları ve destek yüzeylerini anlatır:
 *
 *   LİSTİNG DÖNGÜSÜ : öneri → oluştur → Etsy'ye taslak gönder → senkron
 *                     doğrula → yayın → arşiv
 *   KÂR DÖNGÜSÜ     : satış aynası → maliyet girişi → listing-başına kâr
 *
 * Kullanıcı kararıyla KALAN yüzeyler (2026-08-12): stok · varyant fiyat
 * dağıtma (listing detayındaki matris) · SEO takip · aksiyon geçmişi
 * (Kayıtlar) · listing önerileri · yorum yanıtı üretimi (Gemini).
 *
 * Kaldırılanlar Faz 1'de KODUYLA birlikte silindi (reklam, analiz, anahtar
 * kelime, görev, AI hub, yıldız satıcı, sepet kurtarma, marka kılavuzu,
 * yenilikler) — geri getirmek git geçmişinden dosya almayı gerektirir.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Genel",
    items: [
      { href: "/panel", label: "Panel", icon: LayoutDashboard },
    ],
  },
  {
    label: "Listeler",
    items: [
      { href: "/tasarimlar", label: "Listeler", icon: Palette },
      { href: "/listing-onerileri", label: "Listing Önerileri", icon: Lightbulb },
      { href: "/seo-etiketleri", label: "SEO Takip", icon: Tags, capability: "seoTagPush" },
      { href: "/stok", label: "Stok", icon: Boxes },
      { href: "/arsiv", label: "Listing Arşivi", icon: Archive },
    ],
  },
  {
    label: "Maliyet & Kâr",
    items: [
      { href: "/satislar", label: "Satışlar", icon: ShoppingBag },
      { href: "/maliyetler", label: "Maliyetler", icon: Wallet },
      { href: "/raporlar", label: "Kâr Raporu", icon: FileBarChart },
      { href: "/reklamlar/ice-aktar", label: "Reklam Verisi", icon: Megaphone, capability: "adsSignals" },
    ],
  },
  {
    label: "Müşteri",
    items: [
      { href: "/yorumlar", label: "Yorumlar", icon: MessageSquareText },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/kayitlar", label: "Kayıtlar", icon: ScrollText },
      { href: "/ayarlar", label: "Ayarlar", icon: Settings },
    ],
  },
];

/** Düz liste — mevcut tüketiciler (topbar başlık eşleme vb.) için. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
