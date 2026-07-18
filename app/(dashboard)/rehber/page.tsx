import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  ShoppingBag,
  Wallet,
  Megaphone,
  FileBarChart,
  BarChart3,
  Star,
  UserRoundCheck,
  Palette,
  Lightbulb,
  TextSearch,
  Tags,
  Sparkles,
  Archive,
  Boxes,
  MessageSquareText,
  ScrollText,
  Settings,
  Workflow,
} from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { OrgMark } from "@/components/brand/org-mark";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Kullanım Rehberi" };

/**
 * Kullanım Rehberi — panelin her bölümünün NE işe yaradığını ve NASIL
 * kullanılacağını tek yerde anlatır. "Birçok güçlü özellik var ama kimse nasıl
 * kullanılacağını bilmiyor" sorununa yanıt: her bölüm için amaç + adım adım
 * kullanım + gizli/güçlü özellik ipucu. Bölümler sidebar gruplarıyla aynı sırada.
 */

interface GuideEntry {
  label: string;
  route: string;
  icon: LucideIcon;
  purpose: string;
  steps: string[];
  /** Kullanıcının kendiliğinden bulamayacağı güçlü özellik. */
  tip?: string;
  /** Yalnız yönetici (owner/admin) + Etsy yazma izni gerektiren canlı işlem. */
  gated?: boolean;
}
interface GuideGroup {
  label: string;
  blurb: string;
  entries: GuideEntry[];
}

const GROUPS: GuideGroup[] = [
  {
    label: "Genel",
    blurb: "Her günün başladığı yer — genel bakış ve ekip görevleri.",
    entries: [
      {
        label: "Panel",
        route: "/panel",
        icon: LayoutDashboard,
        purpose:
          "Mağazanın kokpiti: seçtiğin dönem için gelir, kâr, sipariş ve maliyet özeti; canlı altın fiyatı; ve aksiyon gerektiren her şeyi toplayan Uyarı Merkezi.",
        steps: [
          "Sağ üstteki dönem seçiciyle tüm sayfayı istediğin aralığa daralt (tüm KPI'lar buna göre yeniden hesaplanır).",
          "Uyarı Merkezi kartındaki uyarıları önem sırasına göre oku; her uyarı seni düzeltmenin yapılacağı sayfaya götürür.",
          "Zaman çizelgesiyle geçmiş/gelecek yol haritasını (görevler + satışlar) tek bakışta gör.",
        ],
        tip: "Uyarı Merkezi her listing'den canlı hesaplanır — sistemin senin için ürettiği yapılacaklar listesidir. Gün başında önce buraya bak.",
      },
      {
        label: "Görevler",
        route: "/gorevler",
        icon: ListChecks,
        purpose:
          "Ekip görev tahtası. Zaman çizelgesi ve Kanban görünümü; öncelik (P0–P3), şerit ve atanan kişiyle.",
        steps: [
          "‘Yeni Görev’ ile görev aç: başlık, öncelik, şerit, atanan, termin ve mücevher ikon/rengi seç.",
          "Kanban'da kartı Geri/İleri ile taşı ya da detayda durumu değiştir; ‘Tamamlandı’ olunca termin bugüne yazılır.",
          "Bir görevi devretmek için detaydaki devir formuyla ata + not bırak (tek adımda).",
        ],
        tip: "Analizler → Aksiyon Planı ve Ayarlar → Etsy Güncellemeleri gibi sayfalar önerdiği aksiyonu tek tuşla buraya görev olarak ekler.",
      },
    ],
  },
  {
    label: "Satış & Finans",
    blurb: "Siparişler, giderler, reklam kararları ve dönem raporları.",
    entries: [
      {
        label: "Satışlar",
        route: "/satislar",
        icon: ShoppingBag,
        purpose:
          "Her sipariş (manuel, CSV, Etsy senkron) + aylık ciro/sipariş grafikleri ve geçen yıl aynı ay karşılaştırması.",
        steps: [
          "Etsy'yi senkronla ya da ‘CSV İçe Aktar’ ile Etsy sipariş dökümünü yükle (sihirbaz eşler + önizler).",
          "‘Yeni Satış’ ile manuel sipariş ekle; satırdan görüntüle/düzenle/sil.",
          "Arama (sipariş no/alıcı) ve durum filtresiyle daralt.",
        ],
        tip: "Özet KPI'lar iptalleri hariç tutar ama tablo hepsini gösterir — başlıktaki not bunu söyler. Geçen yıl verisi yoksa ‘veri yok’ diye dürüstçe yazar.",
      },
      {
        label: "Maliyetler",
        route: "/maliyetler",
        icon: Wallet,
        purpose:
          "Gider defteri + işletme kârlılığı (katkı payı, başa-baş). Taraf (H/Y/I) bazında toplamlar.",
        steps: [
          "‘Yeni Maliyet’ ile gider ekle (kategori + taraf + tutar/kur).",
          "Taraf ve kategori filtreleriyle daralt; toplamlar filtreye göre güncellenir.",
          "‘Altın Maliyet’ ile satılan ürünlerin altın + işçilik maliyet dökümünü aç.",
        ],
        tip: "Altın Maliyet sayfasındaki geriye-dönük yeniden-hesap butonu, ayar değiştiğinde geçmiş satışları yeni fiyatla yeniden maliyetler.",
      },
      {
        label: "Reklamlar",
        route: "/reklamlar",
        icon: Megaphone,
        purpose:
          "Etsy Ads harcamasını değerlendirir ve karar verir. Uygulama Etsy'de yapılır (API reklam yönetimine izin vermez); burası bir karar günlüğüdür.",
        steps: [
          "Otomatik sinyalleri oku: israf / bütçe yiyen / fırsat — her biri sayısal gerekçesiyle.",
          "‘Aksiyona al’ ile kararı kuyruğa ekle; kararı Etsy'de uygula.",
          "Uygulayınca ‘Yapıldı’ işaretle — panel karar anındaki metrikle şimdikini karşılaştırır.",
        ],
        tip: "Asıl güç, ölç-döngüsünde: karar anında anlık görüntü alınır, sonra etkisi otomatik ölçülür. Reklam metrikleri Analizler → Ürün Performansı'ndan beslenir.",
      },
      {
        label: "Raporlar",
        route: "/raporlar",
        icon: FileBarChart,
        purpose: "Dönem raporları kütüphanesi; markalı PDF/CSV dışa aktarımıyla.",
        steps: [
          "Dönem seç, rapor listesinden birini aç.",
          "Detayda ‘PDF / Yazdır’ veya ‘CSV Dışa Aktar’ ile paydaşa gönderilecek markalı çıktı al.",
        ],
      },
    ],
  },
  {
    label: "Analiz",
    blurb: "Etsy performansı, yıldız satıcı ve müşteri geri kazanımı.",
    entries: [
      {
        label: "Performans",
        route: "/analizler",
        icon: BarChart3,
        purpose:
          "Elle girilen Etsy Stats anlık görüntülerini dönüşüm hunisine, yatırım karar çerçevesine ve otomatik uyarılara çevirir.",
        steps: [
          "‘Yeni Snapshot’ ile dönemin Etsy Stats sayılarını gir (ziyaret, dönüşüm, sipariş, ciro…).",
          "Uyarıları ve Yatırım Karar Çerçevesini (geç/riskli/kal) oku.",
          "Alttaki ‘Etsy Verileri (API)’ canlı mağaza sağlığını ve günlük görüntülenme trendini gösterir.",
        ],
        tip: "‘Aksiyon Planı’ alt sayfası, verini araştırma-doğrulanmış senaryo matrisiyle değerlendirir ve her önerilen aksiyonu tek tuşla Görevler'e ekler — paneldeki en güçlü, en az bilinen motor.",
      },
      {
        label: "Yıldız Satıcı",
        route: "/yildiz-satici",
        icon: Star,
        purpose: "Etsy Star Seller'ın 4 metriğini dönem bazında standart/hedefe göre izler.",
        steps: [
          "Etsy'nin Star Seller ekranındaki 4 metriği dönem etiketi + tarihlerle kaydet.",
          "Her döngüde yeni dönem ekle; ilerleme halkası kaç metriğin hedefte olduğunu gösterir.",
        ],
        tip: "Puanı Yorumlar verinden otomatik doldurabilirsin, ama Etsy'nin sayısı esas alınır. Bu sayfada yerleşik ‘Nasıl kullanılır?’ kılavuzu da var.",
      },
      {
        label: "Geri Kazanım",
        route: "/sepet-kurtarma",
        icon: UserRoundCheck,
        purpose:
          "Uzun süredir (90+ gün) sipariş vermemiş değerli müşterileri bulur ve geri kazanım aksiyonlarını izler.",
        steps: [
          "Etsy senkronundan sonra aday listesi (en değerli 500) çıkar.",
          "Bir adaya teklif/aksiyon kaydı aç, sonucu (kazanıldı/kaybedildi) işaretle.",
        ],
      },
    ],
  },
  {
    label: "Ürün & Stüdyo",
    blurb: "Listing hattı: taslaktan Etsy'ye, SEO, görsel ve stok.",
    entries: [
      {
        label: "Listeler",
        route: "/tasarimlar",
        icon: Palette,
        purpose:
          "Etsy'de GERÇEKTEN var olan listing'lerin aynası. Eksik gramlı / kelimesiz listing'leri de flagler.",
        steps: [
          "Bir listing'e gir → Listing Komuta Merkezi (6 bölüm: görseller, künye, Etsy'ye kopyala, varyantlar, rakip fiyat, reklam).",
          "Varyant editöründe gramı bedenden, fiyatı gramdan otomatik doldur.",
          "‘Etsy'ye Ağırlık’, ‘Otomatik Varyant’, ‘İyileştir’ araçlarını başlıktan aç.",
        ],
        tip: "Her listing'de otomatik-fiyatlama motoru (kapalı/öneri/otomatik, rakip çıpası + eritme-fiyat tabanı) kurabilirsin. ‘Otomatik’ modda fiyatı canlı Etsy'ye yazar.",
        gated: true,
      },
      {
        label: "Listing Önerileri",
        route: "/listing-onerileri",
        icon: Lightbulb,
        purpose:
          "Etsy'de henüz/artık olmayan listing'ler: panel taslakları (gönderilmeyi bekleyen) + arşiv.",
        steps: [
          "‘Yeni Taslak’ ile öneri hazırla; listing detayında ‘Etsy'e gönder’ ile Etsy'de TASLAK aç.",
          "Gönderilen taslak buradan düşer, ‘Listeler’e taşınır.",
          "Etsy'de canlı ama panelde takılı kalan taslak varsa ‘Etsy ile eşle’ ile eşle (etsy_listing_id backfill).",
        ],
        tip: "Akış: Öneriler (taslak) → Etsy'e gönder → Listeler. Arşiv, Etsy'ye dokunmadan paneli temiz tutar.",
        gated: true,
      },
      {
        label: "SEO Yardımcısı",
        route: "/seo-yardimcisi",
        icon: TextSearch,
        purpose:
          "Ürün özelliğinden (tip, stil, materyal, odak varyant, pazar) anında Etsy-uyumlu başlık, 13 uzun-kuyruk etiket, açıklama taslağı ve dürüstlük-denetimli SEO skoru üretir.",
        steps: [
          "Ürün özelliklerini seç; başlık/etiket/açıklama anında üretilir.",
          "Çıktıyı kopyalayıp listing'e uygula.",
        ],
      },
      {
        label: "SEO Etiketleri",
        route: "/seo-etiketleri",
        icon: Tags,
        purpose:
          "Aktif listing'ler için değer-öncelikli 13 etiket optimizasyonu (sızıntı > çok satan > dönüştüren > standart). Etsy'ye gönder, etkisini sonra ölç.",
        steps: [
          "Bir listing için önerilen etiket setini incele, düzenle.",
          "‘Etsy'ye gönder’ ile canlı yaz; panel görüntülenme/favori tabanı alır, etkiyi sonra karşılaştırır.",
        ],
        gated: true,
      },
      {
        label: "Görsel Üretim",
        route: "/gorsel-uretim",
        icon: Sparkles,
        purpose:
          "Kimlik-kilitli (img2img) üretim promptları: gerçek Etsy fotoğrafını referans alıp aynı ürünle yeni sahne üret. (Jade Gold'a özel.)",
        steps: [
          "Aktif listing için promptu kopyala, görsel üreticide çalıştır.",
          "‘Üretilen Görseller’ galerisinde beğen/indir; seçilenler doğrudan Etsy listing'ine ürün fotoğrafı olarak yüklenir.",
        ],
        gated: true,
      },
      {
        label: "Listing Arşivi",
        route: "/arsiv",
        icon: Archive,
        purpose:
          "Listing görsel/videolarını panele KALICI çeker — Etsy listing'i silinse bile medya kaybolmaz.",
        steps: ["Bir listing'in medyasını arşivle; baytlar panel deposuna kalıcı kopyalanır."],
        tip: "Listing Önerileri içindeki ‘Arşiv’den farklı: o, taslağı panelde gizler; bu, medyayı kalıcı saklar.",
      },
      {
        label: "Stok",
        route: "/stok",
        icon: Boxes,
        purpose: "Ürün başına eldeki/hedef adedi gir; tek tuşla Etsy ile iki yönlü senkronla.",
        steps: [
          "Ürünleri kategoriye göre gruplu listede gör; adet gir (yönetici).",
          "‘Varyant Stok’ ile SKU başına hedef adedi Etsy offering'lerine gönder.",
        ],
        gated: true,
      },
    ],
  },
  {
    label: "Müşteri",
    blurb: "Yorumlar ve yanıt yönetimi.",
    entries: [
      {
        label: "Yorumlar",
        route: "/yorumlar",
        icon: MessageSquareText,
        purpose: "Etsy yorumlarını, puan trendini ve yanıt durumunu izler.",
        steps: [
          "Etsy senkronundan yorumları çek ya da manuel ekle.",
          "Bir yorumu düzenlerken yanıt taslağı panelini kullan; puan filtresiyle daralt.",
        ],
        tip: "Yorum verisi, Yıldız Satıcı'daki otomatik puan doldurmayı besler.",
      },
    ],
  },
  {
    label: "Sistem",
    blurb: "Denetim logu ve ayarlar/entegrasyonlar.",
    entries: [
      {
        label: "Kayıtlar",
        route: "/kayitlar",
        icon: ScrollText,
        purpose: "Şirket hafızası — her işlemin değişmez denetim logu.",
        steps: [
          "Varlık, işlem (ekle/güncelle/sil), kaynak ve aramayla filtrele.",
          "Aktif filtreye uyan CSV'yi dışa aktar.",
        ],
      },
      {
        label: "Ayarlar",
        route: "/ayarlar",
        icon: Settings,
        purpose: "Organizasyon + entegrasyonlar merkezi (kart kart).",
        steps: [
          "Etsy'yi bağla + ‘Şimdi Senkronize Et’ (satışları, listeleri, stok, mağaza sağlığını besler).",
          "Ekip: üye/rol/davet. Altın Maliyet Ayarları: alım $/g + işçilik (tüm altın-maliyet hesabını sürer).",
          "ShipStation, Etsy Güncellemeleri ve Büyüme Stratejisi kartları (ikincisi aksiyonları Görevler'e ekler).",
        ],
        gated: true,
      },
    ],
  },
];

const WORKFLOW: string[] = [
  "Ayarlar → Etsy senkron: Listeler (ayna), Stok, Satışlar adayları ve mağaza sağlığı beslenir.",
  "Analizler: snapshot + ürün metriği + kelime CSV gir → Aksiyon Planı önerileri Görevler'e düşer.",
  "Reklamlar: sinyal → karar kuyruğu → Etsy'de uygula → ‘Yapıldı’ → etki ölçülür.",
  "Ürün hattı: Öneriler'de taslak → Komuta Merkezi'nde kur → Etsy'e gönder → Listeler; SEO + görsel + stok.",
  "Müşteri: Yorumlar → Yıldız Satıcı; Geri Kazanım küskün alıcıları çalışır.",
  "Her yazma işlemi Kayıtlar'a (denetim logu) işlenir.",
];

export default async function RehberPage() {
  await requireMembership();
  return (
    <div className="relative z-0 space-y-8 pb-28">
      <GoldStream motif="ring" />
      <PageHeader
        title="Kullanım Rehberi"
        description="Panelin her bölümü ne işe yarar ve nasıl kullanılır — bölüm bölüm. Güçlü ama gizli özellikler ‘ipucu’ olarak işaretli."
      />

      {/* İş akışı — büyük resim. */}
      <section className="space-y-4">
        <div aria-hidden className="idx">
          <span>Rehber / 00 · İş Akışı</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          <span>
            <OrgMark />
          </span>
        </div>
        <Card>
          <CardContent className="space-y-3 py-6">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Workflow className="size-4" />
              Panelin amaçladığı döngü
            </div>
            <ol className="space-y-2">
              {WORKFLOW.map((w, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-[var(--gold-deep)] tabular-nums font-medium">
                    {i + 1}.
                  </span>
                  <span>{w}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      {GROUPS.map((group, gi) => (
        <section key={group.label} className="space-y-4">
          <div aria-hidden className="idx">
            <span>
              Rehber / {String(gi + 1).padStart(2, "0")} · {group.label}
            </span>
            <span className="idx-bar" />
            <span className="idx-ln" />
            <span>
              <OrgMark />
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{group.blurb}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {group.entries.map((e) => (
              <Card key={e.route} className="overflow-hidden">
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-[var(--gold-tint)] text-[var(--gold-deep)] flex size-9 items-center justify-center rounded-lg">
                        <e.icon className="size-4" strokeWidth={1.5} />
                      </span>
                      <div>
                        <h3 className="font-medium leading-tight">{e.label}</h3>
                        <code className="text-muted-foreground text-xs">{e.route}</code>
                      </div>
                    </div>
                    {e.gated && (
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        Yönetici · canlı
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm">{e.purpose}</p>

                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                      Nasıl kullanılır
                    </p>
                    <ol className="space-y-1.5">
                      {e.steps.map((s, si) => (
                        <li key={si} className="flex gap-2 text-sm">
                          <span className="text-[var(--gold-deep)] tabular-nums">{si + 1}.</span>
                          <span className="text-muted-foreground">{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {e.tip && (
                    <div className="border-[var(--gold)]/30 bg-[var(--gold-tint)]/40 rounded-md border px-3 py-2 text-xs">
                      <span className="text-[var(--gold-deep)] font-medium">İpucu · </span>
                      <span>{e.tip}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <p className="text-muted-foreground pt-2 text-center text-xs">
        <Badge variant="outline" className="mr-1.5 text-[10px]">
          Yönetici · canlı
        </Badge>
        işareti: yalnız sahip/yönetici + Etsy yazma izni olanların yaptığı, canlı
        Etsy&apos;ye yazan işlemler.
      </p>
    </div>
  );
}
