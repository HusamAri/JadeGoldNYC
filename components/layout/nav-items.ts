import {
  LayoutDashboard,
  ShoppingBag,
  UserRoundCheck,
  Wallet,
  BarChart3,
  Palette,
  Sparkles,
  BookOpen,
  MessageSquareText,
  ScrollText,
  FileBarChart,
  ListChecks,
  Boxes,
  Star,
  Settings,
  TextSearch,
  Tags,
  Archive,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Yalnız Jade Gold organizasyonu aktifken görünür (marka-özel içerik). */
  jadeGoldOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Panel 2.0 sekme sistemi — düz liste yerine iş akışına göre gruplar:
 * yönet → sat → analiz et → üret → dinle → sistem. Sidebar grupları
 * başlıklarıyla çizer; topbar (mobil) aynı kaynaktan beslenir.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Genel",
    items: [
      { href: "/panel", label: "Panel", icon: LayoutDashboard },
      { href: "/gorevler", label: "Görevler", icon: ListChecks },
    ],
  },
  {
    label: "Satış & Finans",
    items: [
      { href: "/satislar", label: "Satışlar", icon: ShoppingBag },
      { href: "/maliyetler", label: "Maliyetler", icon: Wallet },
      { href: "/raporlar", label: "Raporlar", icon: FileBarChart },
    ],
  },
  {
    label: "Analiz",
    items: [
      { href: "/analizler", label: "Performans", icon: BarChart3 },
      { href: "/yildiz-satici", label: "Yıldız Satıcı", icon: Star },
      { href: "/sepet-kurtarma", label: "Geri Kazanım", icon: UserRoundCheck },
    ],
  },
  {
    label: "Ürün & Stüdyo",
    items: [
      { href: "/tasarimlar", label: "Listeler", icon: Palette },
      { href: "/seo-yardimcisi", label: "SEO Yardımcısı", icon: TextSearch },
      { href: "/seo-etiketleri", label: "SEO Etiketleri", icon: Tags },
      // Prompt kiti Jade Gold listinglerine özel statik içerik — diğer
      // şirketlerde gizli (kendi kitleri üretilince ayrı açılır).
      { href: "/gorsel-uretim", label: "Görsel Üretim", icon: Sparkles, jadeGoldOnly: true },
      { href: "/arsiv", label: "Listing Arşivi", icon: Archive },
      { href: "/stok", label: "Stok", icon: Boxes },
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
      { href: "/marka-kilavuzu", label: "Marka Kılavuzu", icon: BookOpen, jadeGoldOnly: true },
      { href: "/kayitlar", label: "Kayıtlar", icon: ScrollText },
      { href: "/ayarlar", label: "Ayarlar", icon: Settings },
    ],
  },
];

/** Düz liste — mevcut tüketiciler (topbar başlık eşleme vb.) için. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
