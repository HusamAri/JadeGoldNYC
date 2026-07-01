import type { TaskPriority, TaskLane } from "@/lib/types";

/**
 * Harici bir SEO/AEO strateji notundan (2026, "sessiz lüks" konumlandırması)
 * Jade Gold NYC için elenmiş, uygulanabilir öneriler. İçerik statik/küratörlü;
 * canlı bir arama/analitik API'sinden çekilmez. Etsy kategorisi kıyaslamaları
 * (dönüşüm oranı vb.) genel pazar verisidir — bu mağazaya özgü ölçüm değildir.
 */
export interface GrowthTaskSuggestion {
  title: string;
  description: string;
  priority: TaskPriority;
  lane: TaskLane | null;
  effort: string;
}

export interface GrowthActionItem {
  id: string;
  title: string;
  body: string;
  task?: GrowthTaskSuggestion;
}

export interface GrowthPhase {
  key: string;
  title: string;
  goal: string;
  items: GrowthActionItem[];
}

export const GROWTH_IMMEDIATE: GrowthActionItem[] = [
  {
    id: "title-audit",
    title: "Başlıkları denetle: Malzeme + Ürün Tipi + Stil + Vesile",
    body: "Her başlık ilk 40 karakterde ana anahtar kelimeyi önde taşımalı ve 140 karakterin tamamını kullanmalı. Formül: [Ana Anahtar Kelime] — [Malzeme] [Ürün Tipi] | [Stil] | [Vesile/Kitle]. Örn: “Natural Jade Pendant — 14k Gold Setting | Minimalist Everyday Necklace | Quiet Luxury Gift for Her”.",
    task: {
      title: "Tüm liste başlıklarını malzeme+tip+stil+vesile formülüne göre denetle",
      description:
        "Her aktif listede başlığın ilk 40 karakterinde ana anahtar kelime var mı, 140 karakterin tamamı kullanılıyor mu kontrol et; eksikse yeniden yaz.",
      priority: "P0",
      lane: "A",
      effort: "1 hafta",
    },
  },
  {
    id: "tags-13",
    title: "13 etiketin tamamını doldur",
    body: "Geniş (jade jewelry, gold necklace) + uzun kuyruk (dainty jade pendant) + vesile (birthday gift for her) + stil (silent luxury, minimalist gold) + kitle (professional woman jewelry) + niş (NYC made jewelry) karışımı kullan.",
    task: {
      title: "Her listede 13 etiketin tamamını doldur",
      description:
        "Geniş, uzun kuyruk, vesile, stil, kitle ve niş kategorilerinden karışık 13 etiket gir; boş etiket alanı bırakma.",
      priority: "P0",
      lane: "A",
      effort: "birkaç saat",
    },
  },
  {
    id: "attributes-complete",
    title: "Tüm öznitelik (attribute) alanlarını tamamla",
    body: "Malzeme, stil, vesile, zincir uzunluğu, kapama tipi, taş rengi, yüzey işlemi — dolu öznitelikler yüksek niyetli aramalarda filtrelenir ve dönüşümü artırır.",
    task: {
      title: "Liste özniteliklerini eksiksiz doldur",
      description:
        "Malzeme, stil, vesile, zincir uzunluğu, kapama tipi, taş rengi ve yüzey işlemi alanlarının tamamını her listede doldur.",
      priority: "P1",
      lane: "A",
      effort: "birkaç saat",
    },
  },
  {
    id: "renewal-schedule",
    title: "Günlük liste yenileme takvimi kur",
    body: "Etsy algoritması yeniliği ödüllendirir. Günde 5–10 liste yenile (hepsini aynı anda değil), haftada 2–3 yeni liste ekle.",
    task: {
      title: "Günlük 5-10 liste yenileme + haftalık 2-3 yeni liste rutinini başlat",
      description:
        "Her gün 5-10 mevcut listeyi yenile, haftada 2-3 yeni liste ekle — Etsy'nin yenilik sinyalini tetikler.",
      priority: "P1",
      lane: "A",
      effort: "sürekli · günlük 15 dk",
    },
  },
  {
    id: "faq-descriptions",
    title: "Ürün açıklamalarına kısa SSS ekle (AEO)",
    body: "AI arama motorları (ChatGPT, Perplexity, Gemini) doğrudan cevap ve soru-cevap formatını tercih eder. 40-60 kelimelik net cevaplarla 2-3 soru ekle (ör. “Bu kolye günlük kullanıma uygun mu?”).",
    task: {
      title: "Ürün açıklamalarına 2-3 kısa SSS ekle",
      description:
        "Her ürün açıklamasına 40-60 kelimelik net cevaplarla malzeme/kullanım/bakım hakkında 2-3 soru-cevap ekle — AI arama motorlarının doğrudan alıntılayabileceği format.",
      priority: "P2",
      lane: "B",
      effort: "birkaç saat",
    },
  },
];

export const GROWTH_PHASES: GrowthPhase[] = [
  {
    key: "ay1",
    title: "Ay 1 · Temel",
    goal: "Liste kalitesini yükselt, temel dijital varlığı kur.",
    items: [
      {
        id: "gbp",
        title: "Google Business Profile oluştur",
        body: "Fiziksel bir stüdyo/atölye varsa “Jade Gold NYC” için profil aç; süreç fotoğrafları ekle, haftalık paylaşım yap. Yoksa bu adımı atla.",
        task: {
          title: "Google Business Profile aç (stüdyo varsa)",
          description:
            "Fiziksel atölye/stüdyo varsa Jade Gold NYC için Google Business Profile oluştur, süreç fotoğrafları ekle ve haftalık paylaşım rutini başlat.",
          priority: "P2",
          lane: "owner",
          effort: "1 gün",
        },
      },
      {
        id: "mini-site",
        title: "Tek sayfa web sitesi + şema işaretleme",
        body: "Etsy dışında bulunabilirlik için basit bir site (Shopify/Carrd) kurup Etsy mağazasına yönlendir; ürün şeması (JSON-LD) ekle.",
        task: {
          title: "Tek sayfa web sitesi kur ve Etsy'ye yönlendir",
          description:
            "Basit bir web sitesi (Shopify/Carrd) kurup marka hikâyesi + Etsy bağlantısı ekle; ürün şeması (JSON-LD) ile işaretle.",
          priority: "P2",
          lane: "owner",
          effort: "1 hafta",
        },
      },
      {
        id: "blog-faq",
        title: "5 SSS/rehber yazısı yayınla",
        body: "“Doğal jade nasıl anlaşılır?”, “Neden yalnızca som altın kullanıyoruz?” gibi rehberler — hem Google hem AI motorları için alıntı kaynağı.",
        task: {
          title: "5 SSS/rehber içeriği yaz ve yayınla",
          description:
            "Jade kalitesi, som altın vs kaplama, bakım gibi konularda 5 kısa rehber yazısı yayınla; Google Search Console'a kaydet.",
          priority: "P2",
          lane: "B",
          effort: "1-2 hafta",
        },
      },
    ],
  },
  {
    key: "ay2",
    title: "Ay 2 · Görünürlük",
    goal: "Sosyal kanalları, geri bağlantıları ve e-posta listesini büyüt.",
    items: [
      {
        id: "social-process",
        title: "Instagram + TikTok'ta süreç içeriği",
        body: "Elde işçilik, malzeme, ölçek videoları — hem güven inşa eder hem sosyal kanıt oluşturur.",
        task: {
          title: "Instagram/TikTok'ta süreç videosu paylaşım rutini başlat",
          description:
            "Elde işçilik, malzeme yakın çekim ve ölçek videolarını düzenli paylaş; hedef bir ayda takipçi ve etkileşim artışı.",
          priority: "P2",
          lane: "B",
          effort: "sürekli",
        },
      },
      {
        id: "press-giftguides",
        title: "Hediye rehberlerine ve basına başvur",
        body: "Küçük/orta ölçekli hediye rehberi listelerine ve ilgili basın kuruluşlarına 2-3 sunum yap.",
        task: {
          title: "Hediye rehberlerine ve basına 2-3 sunum gönder",
          description:
            "Jade Gold NYC'yi ilgili hediye rehberi listelerine ve küçük/orta ölçekli basın kuruluşlarına tanıtan 2-3 kısa sunum e-postası hazırla ve gönder.",
          priority: "P3",
          lane: "owner",
          effort: "birkaç saat",
        },
      },
      {
        id: "email-list",
        title: "E-posta bülteni başlat",
        body: "Web sitesinde e-posta toplama alanı + jade eğitimi içerikli düzenli bülten.",
        task: {
          title: "E-posta bülteni ve toplama formu kur",
          description:
            "Web sitesine e-posta toplama alanı ekle; jade/malzeme eğitimi içerikli düzenli bülten göndermeye başla.",
          priority: "P3",
          lane: "B",
          effort: "birkaç saat",
        },
      },
    ],
  },
  {
    key: "ay3",
    title: "Ay 3 · Otorite",
    goal: "Niş konumlandırmayı pekiştir, AI görünürlüğünü ölç.",
    items: [
      {
        id: "deep-guides",
        title: "3 derin “jade eğitimi” rehberi yayınla",
        body: "Kaynak, işçilik ve bakım üzerine uzun-format içerik — organik trafik ve AI alıntısı için.",
        task: {
          title: "3 derin jade eğitimi rehberi yaz",
          description:
            "Jade kaynağı, işçilik süreci ve bakım üzerine 3 uzun-format rehber yayınla.",
          priority: "P3",
          lane: "B",
          effort: "2-3 hafta",
        },
      },
      {
        id: "ai-visibility-audit",
        title: "AI görünürlük denetimi yap",
        body: "ChatGPT, Perplexity ve Gemini'de “jade kolye”, “sessiz lüks takı” gibi sorgularla markanın anılıp anılmadığını manuel test et.",
        task: {
          title: "ChatGPT/Perplexity/Gemini'de marka görünürlüğünü test et",
          description:
            "İlgili jade/takı sorgularıyla üç AI motorunda Jade Gold NYC'nin anılıp anılmadığını manuel kontrol et; sonuçları kaydet.",
          priority: "P3",
          lane: "owner",
          effort: "birkaç saat",
        },
      },
      {
        id: "review-drive",
        title: "Yorum toplama kampanyası",
        body: "Teslim sonrası nazik hatırlatma ile yorum oranını artır; hedef %25-30 sipariş→yorum dönüşümü.",
        task: {
          title: "Sistematik yorum isteme rutini kur",
          description:
            "Teslimattan sonra alıcılara nazik bir yorum hatırlatma mesajı gönderen bir rutin kur; hedef sipariş başına %25-30 yorum oranı.",
          priority: "P2",
          lane: "B",
          effort: "birkaç saat",
        },
      },
    ],
  },
];

export interface GrowthBenchmark {
  metric: string;
  target: string;
  note: string;
}

/** Genel Etsy takı kategorisi kıyaslamaları — bu mağazaya özgü ölçüm değil. */
export const GROWTH_BENCHMARKS: GrowthBenchmark[] = [
  {
    metric: "Dönüşüm oranı",
    target: "%2.5 (90 gün) → %3.5 (180 gün)",
    note: "Kategori ortalaması %1-2; %4+ mükemmel kabul edilir.",
  },
  {
    metric: "Yorum oranı",
    target: "Siparişlerin %25-30'u",
    note: "4.8+ yıldız hedefi; 4.7 altı algoritma tarafından cezalandırılabilir.",
  },
  {
    metric: "Ortalama sipariş değeri (AOV)",
    target: "$95",
    note: "Set/katmanlama önerisi ve hediye paketiyle yükseltilebilir.",
  },
  {
    metric: "Aktif liste sayısı",
    target: "200+ (90 gün içinde)",
    note: "Kategori lideri mağazalar 500-1.200 aktif liste taşıyor.",
  },
];
