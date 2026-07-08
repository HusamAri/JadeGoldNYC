/**
 * Etsy Metrik Aksiyon El Kitabı — araştırmayla DOĞRULANMIŞ senaryo matrisi.
 *
 * Kaynaklar (2026-07 web araştırması):
 *  - Etsy Seller Handbook: "How to Get the Most Out of Your Shop Stats",
 *    "Creating Listings That Convert", "What to Do If You Notice a Dip in
 *    Sales", "Understanding Your Advertising Performance"
 *  - Etsy Help: "What to Do if You Receive a Negative Review",
 *    "Etsy's Customer Service Standards" (Star Seller: 24 saat yanıt)
 *  - eRank / ListingView / Alura / Gelato 2026 kılavuzları (dönüşüm ve ROAS
 *    eşikleri; sektör ortalaması dönüşüm ~%2.9, Etsy'de %1-5 bandı)
 *
 * Temel kurallar:
 *  - Karşılaştırma penceresi en az 30 gün; değişiklikler 2 haftada bir gözden
 *    geçirilir (Handbook önerisi).
 *  - ROAS eşikleri: <2x zarar · 2-3x başabaş (marja bağlı gri bölge) ·
 *    3-5x hedef · 5x+ ölçekle (%20-30 bütçe artışı, 30 gün istikrar şartı).
 *    Listing başına $30+ harcama ve ROAS<2 → o listing'in reklamını kapat.
 *  - Dönüşüm ~%1'in altındaysa "görüntülenme var satış yok" kontrol listesi.
 *  - Kötü yorumda ÖNCE özel mesaj (alenî yanıt verilmeden buyer yorumunu
 *    düzenleyebilir); Star Seller için ilk mesaja 24 saatte yanıt.
 */

export type ScenarioSeverity = "critical" | "warning" | "info";
export type InquiryKind = "data" | "visual" | "opinion" | "vote";

export interface PlaybookAction {
  /** Görev başlığı olarak da kullanılır */
  title: string;
  detail: string;
  /** Doğrulama kaynağı (kısa ad) */
  source: string;
  priority: "P0" | "P1" | "P2" | "P3";
}

export interface PlaybookInquiry {
  title: string;
  body: string;
  kind: InquiryKind;
  options?: string[];
}

export interface PlaybookScenario {
  id: string;
  title: string;
  /** Hangi veri setine bakar */
  dataset: string;
  severity: ScenarioSeverity;
  /** Tetik koşulunun insan-okur açıklaması */
  trigger: string;
  actions: PlaybookAction[];
  /** Eksik/öznel bilgi için ekibe sorulacaklar */
  inquiries: PlaybookInquiry[];
}

export const PLAYBOOK: PlaybookScenario[] = [
  {
    id: "no-shop-metrics",
    title: "Dönem verisi eksik",
    dataset: "shop_metrics",
    severity: "info",
    trigger: "Son 45 günde girilmiş mağaza metriği (dönem) yok.",
    actions: [
      {
        title: "Etsy Stats dönem verilerini panele gir",
        detail:
          "Shop Manager → Stats'tan son 30 günün ziyaret, sipariş, ciro, trafik kaynakları ve reklam verilerini Performans → Yeni Dönem ile kaydet. Analiz penceresi en az 30 gün olmalı.",
        source: "Etsy Seller Handbook (Shop Stats)",
        priority: "P1",
      },
    ],
    inquiries: [
      {
        title: "Etsy Stats verisi (son 30 gün)",
        body: "Shop Manager → Stats ekranından: ziyaret, sipariş, ciro, trafik kaynakları (%), reklam harcama/geliri. Tek kişinin girmesi yeter.",
        kind: "data",
      },
    ],
  },
  {
    id: "conversion-drop",
    title: "Dönüşüm oranı düştü",
    dataset: "shop_metrics (visits, orders)",
    severity: "critical",
    trigger:
      "Dönüşüm (sipariş/ziyaret) önceki döneme göre %20'den fazla düştü.",
    actions: [
      {
        title: "En çok görüntülenen 5 listing'in ilk fotoğrafını gözden geçir",
        detail:
          "İlk kare tıklamayı, sonrakiler satışı getirir; 10 fotoğraf hakkının tamamını kullan. Yatay/kare kadraj, kırpmaya dayanıklı boşluk.",
        source: "Etsy Handbook (Listings That Convert)",
        priority: "P1",
      },
      {
        title: "Kargo ücretlerini gözden geçir (ücretsiz kargo eşiği)",
        detail:
          "Pahalı kargo, Etsy'de ilk 10 satın alma engelinden biri. Kargoyu fiyata gömüp ücretsiz kargo göstermeyi değerlendir.",
        source: "Etsy Handbook",
        priority: "P1",
      },
      {
        title: "Başlıkların ilk kelimelerini netleştir",
        detail:
          "Alıcı ilk birkaç kelimede ne sattığını görmeli; taranabilir, net başlık güven verir.",
        source: "Etsy Handbook (Listings That Convert)",
        priority: "P2",
      },
      {
        title: "İki hafta sonra dönüşümü yeniden ölç",
        detail:
          "Tek değişiklik yap → 2 hafta bekle → stats'ı karşılaştır (Handbook deney protokolü).",
        source: "Etsy Handbook (Shop Stats)",
        priority: "P2",
      },
    ],
    inquiries: [
      {
        title: "Görsel kontrol: ilk kare kalitesi",
        body: "En çok ziyaret alan 5 listing'in ilk fotoğrafı: profesyonel, yatay/kare, ürün net mi? Her üye kendi gözüyle puanlasın.",
        kind: "vote",
        options: ["Hepsi iyi", "Birkaçı zayıf", "Çoğu yenilenmeli"],
      },
      {
        title: "Fiyat algısı görüşü",
        body: "Rakip mağazalara göre fiyatlarımız: pahalıysa gerekçesi listing'de anlatılıyor mu? Görüşünü yaz.",
        kind: "opinion",
      },
    ],
  },
  {
    id: "low-conversion",
    title: "Dönüşüm benchmark altında",
    dataset: "shop_metrics (visits, orders)",
    severity: "warning",
    trigger:
      "Dönüşüm %1'in altında (Etsy bandı %1-5; e-ticaret ortalaması ~%2.9) ve ziyaret ≥ 100.",
    actions: [
      {
        title: '"Görüntülenme var, satış yok" kontrol listesini uygula',
        detail:
          "Sırayla: (1) ilk fotoğraf, (2) fiyat gerekçesi, (3) kargo maliyeti, (4) güven sinyalleri (yorum/iade politikası), (5) açıklamanın ilk paragrafı. Tek seferde tek değişiklik.",
        source: "eRank + Etsy Handbook",
        priority: "P1",
      },
      {
        title: "En çok ziyaret edilen listing'leri pazarlamada öne çıkar",
        detail:
          "Alıcılar oraya bir sebeple geliyor; sosyal medya paylaşımlarını bu listinglere yönlendir.",
        source: "Etsy Handbook (Shop Stats)",
        priority: "P2",
      },
    ],
    inquiries: [
      {
        title: "Rakip karşılaştırması",
        body: "Aynı üründe ilk sayfadaki 3 rakibin fiyat + kargo + ilk fotoğrafını incele; farkları not et (link/ekran görüntüsü).",
        kind: "opinion",
      },
    ],
  },
  {
    id: "visits-drop",
    title: "Ziyaretler düştü",
    dataset: "shop_metrics (visits)",
    severity: "warning",
    trigger: "Ziyaret önceki döneme göre %20'den fazla düştü.",
    actions: [
      {
        title: "Search Analytics'ten bulunulan kelimeleri çek ve etiketleri yeniden sırala",
        detail:
          "En çok bulunduran kelime başlığın başına; işe yaramayan etiketleri değiştir. Kelime birden çok listing'e uygunsa hepsinde kullan.",
        source: "eRank / Etsy Handbook (Dip in Sales)",
        priority: "P1",
      },
      {
        title: "En iyi 3-5 listing'i yenile (renew)",
        detail:
          "Küçük, geçici görünürlük artışı sağlar (~$0.60-1.00). Sezonluk ürünlerde talep zirvesinden ÖNCE yenile. Ana strateji değil, destek.",
        source: "Insight Agent / eRank",
        priority: "P2",
      },
      {
        title: "Düşüş nişte mi mağazada mı — karşılaştır",
        detail:
          "eRank/Google Trends ile nişin geneline bak: sezonsal/niş-geneli düşüşse bekle; sadece bizdeyse SEO ve listing kalitesine odaklan.",
        source: "Etsy Handbook (Dip in Sales)",
        priority: "P1",
      },
      {
        title: "Yeni listing ekle",
        detail:
          "Listing sayısı arttıkça bulunma şansı artar (Handbook korelasyonu). Kit'teki AI görsellerle varyant/yeni açı listingleri değerlendir.",
        source: "Etsy Handbook",
        priority: "P3",
      },
    ],
    inquiries: [
      {
        title: "Search Analytics verisi",
        body: "Shop Manager → Stats → Search Analytics: en çok bulunduran 10 arama terimi ve görüntülenme sayıları. Tek giriş yeter.",
        kind: "data",
      },
    ],
  },
  {
    id: "ads-losing",
    title: "Reklamlar zarar ediyor",
    dataset: "shop_metrics (ads_spend, ads_revenue)",
    severity: "critical",
    trigger: "ROAS < 2x (harcama > $30 eşiğinde) — ürün maliyeti ve kesintiler sonrası kesin zarar bölgesi.",
    actions: [
      {
        title: "ROAS<2 olan listinglerin reklamını kapat",
        detail:
          "$30+ harcayıp 2x altında dönen listing reklamı kapatılır; bütçe güçlü ROAS'lı listinglere kayar. Karar öncesi kampanya en az 30 gün çalışmış olmalı.",
        source: "ListingView / Alura (2026)",
        priority: "P0",
      },
      {
        title: "Toplam reklam bütçesini düşür",
        detail:
          "Genel ROAS başabaşın altındaysa zarar sınırlanır: bütçeyi düşür, dönüşüm sorunlarını (fotoğraf/fiyat) çözmeden ölçekleme yapma.",
        source: "Alura",
        priority: "P1",
      },
    ],
    inquiries: [
      {
        title: "Listing bazlı reklam dökümü",
        body: "Etsy Ads panelinden listing başına harcama/gelir/tıklama tablosu (son 30 gün). Tek giriş yeter.",
        kind: "data",
      },
    ],
  },
  {
    id: "ads-gray",
    title: "Reklamlar başabaş (gri bölge)",
    dataset: "shop_metrics (ads_spend, ads_revenue)",
    severity: "warning",
    trigger: "ROAS 2-3x — kârlılık marja bağlı; ekip kararı gerekir.",
    actions: [
      {
        title: "Marj hesabıyla başabaş ROAS'ı belirle",
        detail:
          "Panelin maliyet verisiyle (altın maliyeti + işçilik + Etsy kesintileri) gerçek başabaş ROAS'ı hesapla; 2-3x bandı buna göre kârlı ya da zararlı.",
        source: "ListyBox ROAS kılavuzu",
        priority: "P1",
      },
    ],
    inquiries: [
      {
        title: "Oylama: gri bölge reklam stratejisi",
        body: "ROAS 2-3x bandındayız. Marjlarımıza göre nasıl ilerleyelim?",
        kind: "vote",
        options: [
          "Bütçeyi koru, listing kalitesini iyileştir",
          "Bütçeyi düşür",
          "Sadece en iyi listinglere daralt",
        ],
      },
    ],
  },
  {
    id: "ads-scale",
    title: "Reklamlar çok iyi — ölçekleme fırsatı",
    dataset: "shop_metrics (ads_spend, ads_revenue)",
    severity: "info",
    trigger: "ROAS ≥ 5x — mükemmel bölge.",
    actions: [
      {
        title: "Reklam bütçesini %20-30 artır",
        detail:
          "30 gün boyunca 3x+ istikrar şartıyla kademeli artır; her artıştan sonra sonucu izle, agresif sıçrama yapma.",
        source: "StarterX / ListingView (2026)",
        priority: "P1",
      },
    ],
    inquiries: [],
  },
  {
    id: "cart-abandon-high",
    title: "Sepet terki yüksek",
    dataset: "shop_metrics (cart_abandon_*)",
    severity: "warning",
    trigger:
      "Terk edilen sepet sayısı siparişlerin %70'ini aşıyor (e-ticaret ortalaması ~%70; üstü alarm) ya da terk tutarı dönem cirosunun %30'unu geçiyor.",
    actions: [
      {
        title: "Geri Kazanım modülünden kupon akışını çalıştır",
        detail:
          "Terk edilen sepetlere 1 saat / 24 saat / 72 saat ritmiyle hatırlatma-teklif (e-postayla %5-15 geri kazanım). Paneldeki Geri Kazanım sekmesini kullan.",
        source: "CraftPilot / sektör benchmark",
        priority: "P1",
      },
      {
        title: "Kargo ücretini sepete girmeden görünür yap",
        detail:
          "Yüksek/belirsiz kargo, sepet terkinin 1 numaralı sebebi; ücretsiz kargo eşiği dene.",
        source: "Etsy Handbook",
        priority: "P1",
      },
    ],
    inquiries: [],
  },
  {
    id: "rating-drop",
    title: "Mağaza puanı düştü",
    dataset: "shop_metrics (rating) + reviews",
    severity: "critical",
    trigger: "Puan 4.8'in altında ya da önceki döneme göre düştü (Star Seller eşiği 4.8).",
    actions: [
      {
        title: "Olumsuz yorum sahibine ÖNCE özel mesaj",
        detail:
          "Alenî yanıt VERMEDEN önce Etsy mesajıyla çözüm öner: alıcı, sen alenî yanıt vermediğin sürece yorumunu düzenleyebilir. Alenî yanıt bu hakkı kalıcı kapatır.",
        source: "Etsy Help (Negative Review)",
        priority: "P0",
      },
      {
        title: "Çözülmezse profesyonel alenî yanıt",
        detail:
          "Yoruma değil konuya odaklan; yaptığın düzeltmeyi anlat. Yorumlar sekmesindeki yanıt akışını kullan (panel kaynak-of-truth).",
        source: "Etsy Help",
        priority: "P1",
      },
      {
        title: "İlk mesaja 24 saat içinde yanıt standardını koru",
        detail: "Star Seller şartı; Yıldız Satıcı sekmesinden takip et.",
        source: "Etsy Customer Service Standards",
        priority: "P1",
      },
    ],
    inquiries: [
      {
        title: "Kök neden görüşü",
        body: "Son olumsuz yorum(lar)ın ortak teması ne? (kargo süresi / ürün beklentisi / paketleme / iletişim) Her üye görüşünü yazsın.",
        kind: "opinion",
      },
    ],
  },
  {
    id: "traffic-concentration",
    title: "Trafik tek kaynağa bağımlı",
    dataset: "shop_metrics (traffic_sources)",
    severity: "warning",
    trigger: "Tek trafik kaynağı toplamın %80'ini aşıyor — kırılganlık riski.",
    actions: [
      {
        title: "Kaynak çeşitlendirme planı",
        detail:
          "Etsy Search ağırlıklıysa: sosyal içerik takvimi (Pinterest önceliği) başlat. Sosyal ağırlıklıysa: SEO/etiket çalışması. Direct zayıfsa: e-posta listesi kurmaya başla (kontrolü sende olan tek kanal).",
        source: "eRank (Traffic Sources)",
        priority: "P2",
      },
    ],
    inquiries: [
      {
        title: "Oylama: hangi kanala yatırım?",
        body: "Trafik çeşitlendirmesi için önümüzdeki ay hangi kanala odaklanalım?",
        kind: "vote",
        options: ["Pinterest", "Instagram", "E-posta listesi", "Etsy Ads"],
      },
    ],
  },
  {
    id: "product-views-no-orders",
    title: "Listing: görüntülenme var, sipariş yok",
    dataset: "product_metrics (views, orders)",
    severity: "warning",
    trigger:
      "Bir listing dönemde 50+ görüntülenmeye rağmen 0 sipariş aldı.",
    actions: [
      {
        title: "Listing bazlı dönüşüm kontrolü",
        detail:
          "O listing için: ilk fotoğraf (AI kit'ten yeni görsel yükle!), fiyat-rakip kıyası, kargo, açıklamanın ilk cümlesi. Görsel Üretim galerisindeki seçili görseli tek tuşla Etsy'ye yükleyebilirsin.",
        source: "eRank + panel entegrasyonu",
        priority: "P1",
      },
    ],
    inquiries: [
      {
        title: "Görsel kontrol (listing)",
        body: "Bu listing'in fotoğrafları rakiplerin ilk sayfasıyla yarışıyor mu? Üyeler baksın ve oylasın.",
        kind: "vote",
        options: ["Evet, sorun başka", "Fotoğraf yenilenmeli"],
      },
    ],
  },
  {
    id: "product-low-views",
    title: "Listing: görünürlük yok",
    dataset: "product_metrics (views)",
    severity: "info",
    trigger: "Aktif listing dönemde 10'dan az görüntülenme aldı.",
    actions: [
      {
        title: "Etiket/başlık revizyonu + yenileme",
        detail:
          "13 etiketin tamamını kullan; uzun kuyruk kelimeler ekle; başlığı en güçlü kelimeyle başlat; sonra renew ile tazele.",
        source: "eRank / Growth Willow",
        priority: "P2",
      },
    ],
    inquiries: [],
  },
  {
    id: "revenue-drop-stable-traffic",
    title: "Ciro düştü ama trafik/dönüşüm sabit",
    dataset: "shop_metrics (revenue, visits, orders)",
    severity: "warning",
    trigger:
      "Ciro %15+ düştü; ziyaret ve dönüşüm görece sabit → sepet ortalaması (AOV) düşüyor.",
    actions: [
      {
        title: "Ürün karması analizi",
        detail:
          "Satışlar ucuz ürünlere mi kaydı? Performans sekmesinden dönem kırılımına bak; pahalı ürünlerin görünürlüğünü (renew/reklam/öne çıkarma) artır; bundle/set teklifleri dene.",
        source: "Handbook + panel verisi",
        priority: "P2",
      },
    ],
    inquiries: [
      {
        title: "Görüş: AOV artırma",
        body: "Sepet ortalamasını artırmak için ne deneyelim? (set/bundle, hediye paketi upsell, çok-al-az-öde...)",
        kind: "opinion",
      },
    ],
  },
];

export const PLAYBOOK_SOURCES: { name: string; url: string }[] = [
  {
    name: "Etsy Seller Handbook — Shop Stats",
    url: "https://www.etsy.com/seller-handbook/article/624088232713",
  },
  {
    name: "Etsy Seller Handbook — Listings That Convert",
    url: "https://www.etsy.com/seller-handbook/article/366469719354",
  },
  {
    name: "Etsy Seller Handbook — Dip in Sales",
    url: "https://www.etsy.com/seller-handbook/article/what-to-do-if-you-notice-a-dip-in-sales/46046802209",
  },
  {
    name: "Etsy Help — Negative Review",
    url: "https://help.etsy.com/hc/en-us/articles/115015808588",
  },
  {
    name: "Etsy Help — Customer Service Standards (Star Seller)",
    url: "https://help.etsy.com/hc/en-us/articles/360036207794",
  },
  {
    name: "Etsy Help — Ads Performance",
    url: "https://help.etsy.com/hc/en-us/articles/360034223613",
  },
  {
    name: "eRank — Conversion / Views-No-Sales / Traffic Sources",
    url: "https://help.erank.com/blog/what-is-a-good-conversion-rate-on-etsy/",
  },
  {
    name: "ListingView — Etsy Ads 2026 (ROAS eşikleri)",
    url: "https://listingview.io/blogs/how-etsy-ads-work-in-2026-and-when-to-turn-them-off",
  },
];
