import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  BarChart3,
  Palette,
  BookOpen,
  MessageSquareText,
  ScrollText,
  FileBarChart,
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
  { href: "/satislar", label: "Satışlar", icon: ShoppingBag },
  { href: "/maliyetler", label: "Maliyetler", icon: Wallet },
  { href: "/analizler", label: "Performans", icon: BarChart3 },
  { href: "/sepet-kurtarma", label: "Sepet Kurtarma", icon: ShoppingCart },
  { href: "/tasarimlar", label: "Tasarımlar", icon: Palette },
  { href: "/marka-kilavuzu", label: "Marka Kılavuzu", icon: BookOpen },
  { href: "/yorumlar", label: "Yorumlar", icon: MessageSquareText },
  { href: "/kayitlar", label: "Kayıtlar", icon: ScrollText },
  { href: "/raporlar", label: "Raporlar", icon: FileBarChart },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];
