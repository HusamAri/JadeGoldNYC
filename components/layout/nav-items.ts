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
 * SADELEŞTİRİLMİŞ nav (Faz 0, 2026-08-11 — docs/panel-sadelestirme-plani.md).
 *
 * Panel iki uçtan uca döngüye indirgendi; nav bu iki döngüyü ve sistemi
 * anlatır, başka hiçbir şeyi değil:
 *
 *   LİSTİNG DÖNGÜSÜ : oluştur → Etsy'ye taslak gönder → senkron doğrula → arşiv
 *   KÂR DÖNGÜSÜ     : satış aynası → maliyet girişi → listing-başına kâr →
 *                     (gerekirse) gözetimli fiyat itişi
 *
 * Kaldırılan sekmeler (reklam/SEO/anahtar kelime/analiz/sosyal/yorum/görev/
 * stok/indirim/AI hub/yıldız satıcı/sepet kurtarma/marka kılavuzu/görsel
 * üretim/rehber) Faz 0'da YALNIZ nav'dan çıkarıldı — rotaları hâlâ yaşıyor,
 * doğrudan URL ile erişilebilir; kod sökümü Faz 1'in işi. Geri almak = bu
 * dosyada satırı geri eklemek.
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
      { href: "/arsiv", label: "Listing Arşivi", icon: Archive },
    ],
  },
  {
    label: "Maliyet & Kâr",
    items: [
      { href: "/satislar", label: "Satışlar", icon: ShoppingBag },
      { href: "/maliyetler", label: "Maliyetler", icon: Wallet },
      { href: "/raporlar", label: "Kâr Raporu", icon: FileBarChart },
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
