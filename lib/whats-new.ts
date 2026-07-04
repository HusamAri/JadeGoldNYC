import { Star, MessageSquareReply, RefreshCw, Search, type LucideIcon } from "lucide-react";

/**
 * "Neler Yeni" popup'ı için sürüm günlüğü. En yeni kayıt EN ÜSTTE.
 * Yeni bir özellik yayınladıkça başa yeni bir kayıt ekleyin (id'yi tarih +
 * kısa slug ile benzersiz tutun); panel açılışındaki "Neler Yeni" popup'ı bunu
 * otomatik gösterir ve kullanıcı okuyunca (localStorage) bir daha açmaz.
 */
export interface WhatsNewEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  href?: string;
  icon: LucideIcon;
}

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "2026-07-04-yildiz-satici",
    date: "2026-07-04",
    title: "Yıldız Satıcı takibi",
    description:
      "Etsy Star Seller metriklerini dönem bazında girin; hizmet standardı ve hedefe göre durumu tek bakışta görün.",
    href: "/yildiz-satici",
    icon: Star,
  },
  {
    id: "2026-07-04-yorum-yanit",
    date: "2026-07-04",
    title: "Yorumları panelden yanıtlayın",
    description:
      "Her yoruma AI taslak önerisi alın, düzenleyin, kaydedin ve tek tıkla Etsy'de yanıtlayın.",
    href: "/yorumlar",
    icon: MessageSquareReply,
  },
  {
    id: "2026-07-03-stok-sync",
    date: "2026-07-03",
    title: "Etsy stok senkronizasyonu",
    description:
      "Hedef stok girin ve onayınızla tek geçişte Etsy ile iki yönlü senkronize edin.",
    href: "/stok",
    icon: RefreshCw,
  },
  {
    id: "2026-07-03-tasarim-arama",
    date: "2026-07-03",
    title: "Tasarımlarda listing arama",
    description:
      "Tüm Etsy listinglerinde arama; her ürün için ağırlık girişi artık erişilebilir.",
    href: "/tasarimlar",
    icon: Search,
  },
];

export const LATEST_WHATS_NEW_ID = WHATS_NEW[0]?.id ?? "";
