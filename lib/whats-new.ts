import {
  BarChart3,
  Sparkles,
  Truck,
  Star,
  MessageSquareReply,
  RefreshCw,
  Search,
  AlertTriangle,
  PanelsTopLeft,
  Moon,
  type LucideIcon,
} from "lucide-react";

/**
 * Panelin sürüm günlüğü / "Neler Yeni" kaynağı. En yeni kayıt EN ÜSTTE.
 *
 * İki yerde kullanılır:
 *  1. Açılıştaki buzlu-cam popup (`components/whats-new.tsx`) — okunmamışları gösterir.
 *  2. Kalıcı "Neler Yeni" (sidebar özeti + `/yenilikler` sayfası) — tüm günlük,
 *     "Yeni Özellikler" ve "Kullanıcı Deneyimi İyileştirmeleri" olarak ikiye ayrılır.
 *
 * `isNew: true` olan (en fazla 3) son BÜYÜK yenilikler NEW yıldız rozetiyle öne çıkar.
 * Yeni özellik yayınlayınca başa yeni kayıt ekleyin ve `isNew` bayrağını güncel
 * 3 büyük yeniliğe taşıyın (id'yi tarih + kısa slug ile benzersiz tutun).
 */
export type WhatsNewCategory = "feature" | "ux";

export interface WhatsNewEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  category: WhatsNewCategory;
  href?: string;
  icon: LucideIcon;
  /** Son büyük yenilik mi? NEW yıldız rozetiyle vurgulanır (en fazla 3). */
  isNew?: boolean;
}

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "2026-07-04-satis-dashboard",
    date: "2026-07-04",
    title: "Satışlar analiz paneli",
    description:
      "Satışlar sekmesinin üstünde ciro / net / sipariş / alıcı KPI'ları, son 12 ay ciro & sipariş grafikleri ve ülkeye göre ciro kırılımı.",
    category: "feature",
    href: "/satislar",
    icon: BarChart3,
    isNew: true,
  },
  {
    id: "2026-07-04-ai-yorum-yanit",
    date: "2026-07-04",
    title: "AI ile yorum yanıtı (ücretsiz Gemini)",
    description:
      "Butona basınca best-practice bir master prompt ile en uygun, samimi ve mağaza lehine yanıt taslağı üretilir. Ücretsiz Google Gemini destekli.",
    category: "feature",
    href: "/yorumlar",
    icon: Sparkles,
    isNew: true,
  },
  {
    id: "2026-07-04-kargo-takip",
    date: "2026-07-04",
    title: "ShipStation → Etsy kargo takibi",
    description:
      "Kargo takip verisini onaylı (legal) yolla Etsy'ye taşıma rehberi ve hazırlık göstergesi — 'zamanında kargo' standardını besler.",
    category: "feature",
    href: "/ayarlar/shipstation",
    icon: Truck,
    isNew: true,
  },
  {
    id: "2026-07-04-stok-isik",
    date: "2026-07-04",
    title: "Stok girişinde ışık odağı",
    description:
      "Hedef stok alanına tıklayınca sarı çerçeve yerine çukura bir köşeden vuran sıcak altın aydınlanma.",
    category: "ux",
    href: "/stok",
    icon: Sparkles,
  },
  {
    id: "2026-07-04-yorum-neon",
    date: "2026-07-04",
    title: "Yanıt gerekli yorumlarda neon",
    description:
      "Yanıt bekleyen yorumlarda alt-sol köşeden yayılan doğal, yönlü neon vurgu — dikkat çeker, rahatsız etmez.",
    category: "ux",
    href: "/yorumlar",
    icon: AlertTriangle,
  },
  {
    id: "2026-07-04-cam-arayuz",
    date: "2026-07-04",
    title: "3B buzlu-cam arayüz",
    description:
      "'Neler Yeni' popup'ı ve grafik tooltip'leri, altın tonlu hacimli (3B) buzlu cam diline geçti.",
    category: "ux",
    icon: PanelsTopLeft,
  },
  {
    id: "2026-07-04-koyu-emboss",
    date: "2026-07-04",
    title: "Koyu tema mat kabartma",
    description:
      "Koyu temada kartlar daha mat bir yüzey + okunur bir kabartma (neumorphic) hissi kazandı.",
    category: "ux",
    icon: Moon,
  },
  {
    id: "2026-07-04-yildiz-satici",
    date: "2026-07-04",
    title: "Yıldız Satıcı takibi",
    description:
      "Etsy Star Seller metriklerini dönem bazında girin; hizmet standardı ve hedefe göre durumu tek bakışta görün.",
    category: "feature",
    href: "/yildiz-satici",
    icon: Star,
  },
  {
    id: "2026-07-04-yorum-yanit",
    date: "2026-07-04",
    title: "Panelden yorum yanıtlama",
    description:
      "Her yoruma taslak önerisi alın, düzenleyin, kaydedin ve tek tıkla Etsy'de yanıtlayın.",
    category: "feature",
    href: "/yorumlar",
    icon: MessageSquareReply,
  },
  {
    id: "2026-07-03-stok-sync",
    date: "2026-07-03",
    title: "Etsy stok senkronizasyonu",
    description:
      "Hedef stok girin ve onayınızla tek geçişte Etsy ile iki yönlü senkronize edin.",
    category: "feature",
    href: "/stok",
    icon: RefreshCw,
  },
  {
    id: "2026-07-03-tasarim-arama",
    date: "2026-07-03",
    title: "Tasarımlarda listing arama + ağırlık",
    description:
      "Tüm Etsy listinglerinde arama; her ürün için ağırlık (gram) girişi erişilebilir.",
    category: "feature",
    href: "/tasarimlar",
    icon: Search,
  },
];

export const LATEST_WHATS_NEW_ID = WHATS_NEW[0]?.id ?? "";

/** NEW rozetli (son büyük) yenilikler — sidebar özetinde öne çıkar. */
export const NEW_WHATS_NEW = WHATS_NEW.filter((e) => e.isNew);

/** Kategoriye göre, tarih (yeni→eski) sıralı. */
export function whatsNewByCategory(
  category: WhatsNewCategory,
): WhatsNewEntry[] {
  return WHATS_NEW.filter((e) => e.category === category).sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}
