import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Palette,
  FileBarChart,
  Settings,
  Lightbulb,
  Boxes,
  MessageSquareText,
  Receipt,
  Tag,
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
   * (lib/platform.ts).
   */
  capability?: "starSeller" | "adsSignals" | "seoTagPush";
}

/** Editoryal bölüm tonu — layout `data-tone` ile yüzey rengini değiştirir. */
export type SectionTone = "olive" | "moss" | "lichen" | "forest" | "slate";

export interface NavGroup {
  label: string;
  tone: SectionTone;
  items: NavItem[];
}

/**
 * Amuletta 2.0 nav (2026-11-04 — docs/amuletta-2/plan.md).
 *
 * Panel üç iş için kullanılır ve nav o üç işin adını taşır, veri tipini değil:
 *
 *   SATIŞ & KÂR     : satış aynası → kalem başına maliyet → kâr raporu
 *   ETSY'YE TASLAK  : öneri → listing taslağı → Etsy'ye gönder
 *   STOK & FİYAT    : stok, varyant, fiyat motoru, ağırlık araçları
 *
 * Kaldırılan yüzeyler (arşiv, görsel üretim, indirimler, SEO, sosyal, reklam,
 * tasarım panosu, Pinterest/Shopify/Shopier, günlük özet) KODUYLA birlikte
 * silindi — geri getirmek git geçmişinden dosya almayı gerektirir.
 * Kayıtlar (şirket hafızası) Ayarlar hub'ından açılır.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Genel",
    tone: "olive",
    items: [{ href: "/panel", label: "Panel", icon: LayoutDashboard }],
  },
  {
    label: "Satış & Kâr",
    tone: "moss",
    items: [
      { href: "/satislar/maliyet", label: "Satış & Maliyet", icon: Receipt },
      { href: "/satislar", label: "Satışlar", icon: ShoppingBag },
      { href: "/maliyetler", label: "Maliyetler", icon: Wallet },
      { href: "/raporlar", label: "Kâr Raporu", icon: FileBarChart },
      { href: "/yorumlar", label: "Yorumlar", icon: MessageSquareText },
    ],
  },
  {
    label: "Etsy'ye Taslak",
    tone: "lichen",
    items: [
      { href: "/listing-onerileri", label: "Listing Önerileri", icon: Lightbulb },
      { href: "/tasarimlar", label: "Listeler", icon: Palette },
    ],
  },
  {
    label: "Stok & Fiyat",
    tone: "forest",
    items: [
      { href: "/stok", label: "Stok", icon: Boxes },
      { href: "/fiyat", label: "Fiyat", icon: Tag },
    ],
  },
  {
    label: "Sistem",
    tone: "slate",
    items: [{ href: "/ayarlar", label: "Ayarlar", icon: Settings }],
  },
];

/** Düz liste — mevcut tüketiciler (topbar başlık eşleme vb.) için. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/**
 * Yol → bölüm tonu. En uzun eşleşen önek kazanır; nav'da olmayan alt rotalar
 * (ör. /tasarimlar/listing/[id], /kayitlar) ait oldukları işin tonunu alır.
 */
const TONE_PREFIXES: Array<[string, SectionTone]> = [
  ["/panel", "olive"],
  ["/satislar", "moss"],
  ["/maliyetler", "moss"],
  ["/raporlar", "moss"],
  ["/yorumlar", "moss"],
  ["/listing-onerileri", "lichen"],
  ["/tasarimlar/eksik-agirlik", "forest"],
  ["/tasarimlar/etsy-agirlik", "forest"],
  ["/tasarimlar/varyant-hesapla", "forest"],
  ["/tasarimlar", "lichen"],
  ["/stok", "forest"],
  ["/fiyat", "forest"],
  ["/ayarlar", "slate"],
  ["/kayitlar", "slate"],
];

export function toneForPath(pathname: string): SectionTone {
  let best: [string, SectionTone] | null = null;
  for (const entry of TONE_PREFIXES) {
    const [prefix] = entry;
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (!best || prefix.length > best[0].length) best = entry;
    }
  }
  return best ? best[1] : "olive";
}
