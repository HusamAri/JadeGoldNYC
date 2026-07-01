import type { TaskPriority, TaskLane } from "@/lib/types";

export type EtsyUpdateTier = "act_now" | "worth_doing" | "skip" | "flag";

export interface EtsyUpdateTask {
  title: string;
  description: string;
  priority: TaskPriority;
  lane: TaskLane | null;
  effort: string;
}

export interface EtsyUpdateItem {
  id: string;
  tier: EtsyUpdateTier;
  title: string;
  body: string;
  task?: EtsyUpdateTask;
}

/**
 * Etsy'nin "Newly Crafted" güncelleme duyurusundan, Jade Gold NYC (ABD içi,
 * som altın satıcısı) için elenmiş öneriler. İçerik statik/küratörlü —
 * canlı bir API'den çekilmez; kaynak: help.etsy.com duyurusu.
 */
export const ETSY_UPDATES: EtsyUpdateItem[] = [
  {
    id: "custom-options",
    tier: "act_now",
    title: "Kişiselleştirilmiş sipariş seçenekleri",
    body: "Halihazırda baş harf/doğum taşı işlemesini ücretli özelleştirme olarak sunmuyorsanız, bu güncelleme ön tahsilatı temizler. Altın takı, Etsy'nin en yüksek kişiselleştirme kategorilerinden biri — mesajlaşma gidiş-gelişini azaltır, işlemeyi ödeme adımında ek satış olarak sunmanızı sağlar (satın alma sonrası değil).",
    task: {
      title: "Kişiselleştirilmiş sipariş seçeneklerini ekle",
      description:
        "Baş harf/doğum taşı işlemesini Etsy'nin özelleştirme (personalization) alanı üzerinden ücretli seçenek olarak tanımla — ödeme adımında ek satışa dönüştür.",
      priority: "P1",
      lane: "B",
      effort: "birkaç saat",
    },
  },
  {
    id: "two-videos",
    tier: "act_now",
    title: "Liste başına iki video",
    body: "Buradaki en yüksek etkili güncelleme. 10K/14K som altın ile kaplama arasındaki fark, alıcıların yalnızca fotoğraftan doğrulayamayacağı bir güven sorunu — ikinci bir video (ışıkta parlaması, elde/boyunda ölçek, veya bir 'gerçek altın testi' klibi: mıknatıs, asit, ne kullanıyorsanız) bu kategoride dönüşümü öldüren kaplama şüphesini doğrudan giderir.",
    task: {
      title: "Her listeye ikinci video ekle (som altın kanıtı)",
      description:
        "Işıkta parlama + elde/boyunda ölçek + gerçek altın testi (mıknatıs/asit) gösteren ikinci bir video ekle — kaplama şüphesini giderip dönüşümü artırır.",
      priority: "P0",
      lane: "B",
      effort: "1 hafta",
    },
  },
  {
    id: "marketplace-insights",
    tier: "act_now",
    title: "Pazar Yeri İçgörüleri (Marketplace Insights) genişlemesi",
    body: "Bir sonraki fiyatlandırma veya liste yenilemesinden önce kullan. Arama terimine göre fiyat aralığı, ör. $200'lük kolyenizin 'gold jade necklace' tarzı terimler için alıcıların gerçekte ne ödediğine göre nerede durduğunu gösterir — sadece listelenen fiyatları değil. Arama dönüşüm oranı ve 30/90/365 günlük trendler de dahil.",
    task: {
      title: "Marketplace Insights ile fiyatlandırmayı gözden geçir",
      description:
        "Arama terimine göre fiyat aralığı + arama dönüşüm oranı + 30/90/365 günlük trendleri incele; bir sonraki fiyat/liste yenilemesi öncesi kullan.",
      priority: "P1",
      lane: "A",
      effort: "birkaç saat",
    },
  },
  {
    id: "interested-shopper-offers",
    tier: "act_now",
    title: "İlgilenen alıcı teklifleri (Interested Shopper Offers)",
    body: "Pasif, otomatik, diğer hedefli tekliflere göre 2 kat erişim iddia ediyor. Açmamak için hiçbir neden yok — ücretsiz bir üst-huni geri kazanım aracı.",
    task: {
      title: "İlgilenen alıcı tekliflerini aç",
      description:
        "Etsy Ads/pazarlama ayarlarından 'Interested shopper offers' özelliğini etkinleştir — pasif, otomatik, ek maliyetsiz üst-huni geri kazanım.",
      priority: "P1",
      lane: "B",
      effort: "10 dk",
    },
  },
  {
    id: "thumbnail-preview",
    tier: "worth_doing",
    title: "Liste küçük resmi (thumbnail) önizlemesi",
    body: "Yayınlamadan önce kırpmayı düzelt — takı makro çekimleri mobil ızgarada kötü kırpılıyor.",
    task: {
      title: "Liste küçük resmi kırpmalarını gözden geçir",
      description:
        "Yayınlamadan önce yeni küçük resim önizleme aracıyla makro takı çekimlerinin mobil ızgarada nasıl kırpıldığını kontrol et.",
      priority: "P2",
      lane: "B",
      effort: "birkaç saat",
    },
  },
  {
    id: "promo-code-limits",
    tier: "worth_doing",
    title: "Promosyon kodu kullanım limitleri",
    body: "Sosyal medyada influencer/hediye kodları çalıştırmaya başladığınızda faydalı.",
    task: {
      title: "Promosyon kodu kullanım limitlerini yapılandır",
      description:
        "Influencer/hediye kampanyaları başladığında promosyon kodlarına kullanım limiti ekle.",
      priority: "P3",
      lane: "B",
      effort: "15 dk",
    },
  },
  {
    id: "ads-listing-strategy",
    tier: "worth_doing",
    title: "Etsy Ads liste bazlı strateji",
    body: "Yalnızca günde $25+ harcamaya ulaştığınızda ilgili.",
    task: {
      title: "Etsy Ads liste bazlı stratejiyi değerlendir",
      description:
        "Günlük reklam harcaması $25'i aştığında liste bazlı bütçe/strateji ayarlarını gözden geçir.",
      priority: "P3",
      lane: "A",
      effort: "30 dk",
    },
  },
  {
    id: "tariffs-ddp",
    tier: "skip",
    title: "Gümrük tarifesi tahmincisi ve DDP/gümrük gereksinimi",
    body: "Yurt dışından ABD'ye gönderim yapan satıcılar için — zaten ABD içindesiniz, geçerli değil.",
  },
  {
    id: "ai-shopping-discovery",
    tier: "skip",
    title: "AI alışveriş keşfi (ChatGPT/Gemini/Copilot)",
    body: "Otomatik gerçekleşiyor, sizin tarafınızdan aksiyon gerektirmiyor — temiz ve eksiksiz listeler yeterli; öznitelik öneri aracı bunu artık yarı otomatikleştiriyor.",
  },
  {
    id: "purchase-protection-cap",
    tier: "flag",
    title: "Satın Alma Koruması (Purchase Protection) tavanı: sipariş başına $250",
    body: "Altın parçalarınız düzenli olarak $250'nin üzerinde fiyatlandırılıyorsa, fazlasının otomatik olarak karşılanmadığını bilin. Ortalama sipariş değerinizi bu tavana göre kontrol etmeye değer.",
    task: {
      title: "Ortalama sipariş değerini Purchase Protection tavanına ($250) göre kontrol et",
      description:
        "AOV'nin $250 Purchase Protection tavanının üzerinde olup olmadığını kontrol et; öyleyse ek koruma/sigorta seçeneklerini değerlendir.",
      priority: "P2",
      lane: "owner",
      effort: "15 dk",
    },
  },
];

export const ETSY_UPDATE_TIER_LABELS: Record<EtsyUpdateTier, string> = {
  act_now: "Şimdi Uygula",
  worth_doing: "Değerli, Düşük Öncelik",
  skip: "Atlanabilir",
  flag: "Dikkat",
};
