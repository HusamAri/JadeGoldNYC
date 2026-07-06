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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/gorevler", label: "Görevler", icon: ListChecks },
  { href: "/satislar", label: "Satışlar", icon: ShoppingBag },
  { href: "/maliyetler", label: "Maliyetler", icon: Wallet },
  { href: "/analizler", label: "Performans", icon: BarChart3 },
  { href: "/yildiz-satici", label: "Yıldız Satıcı", icon: Star },
  { href: "/sepet-kurtarma", label: "Geri Kazanım", icon: UserRoundCheck },
  { href: "/tasarimlar", label: "Tasarımlar", icon: Palette },
  { href: "/gorsel-uretim", label: "Görsel Üretim", icon: Sparkles },
  { href: "/stok", label: "Stok", icon: Boxes },
  { href: "/marka-kilavuzu", label: "Marka Kılavuzu", icon: BookOpen },
  { href: "/yorumlar", label: "Yorumlar", icon: MessageSquareText },
  { href: "/kayitlar", label: "Kayıtlar", icon: ScrollText },
  { href: "/raporlar", label: "Raporlar", icon: FileBarChart },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];
