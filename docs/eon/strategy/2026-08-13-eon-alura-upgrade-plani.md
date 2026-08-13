---
title: EON Fine Jewelry — Alura Growth Upgrade Planı
date: 2026-08-13
type: plan
domain: 03 Creation / Visionary Partners / EON
status: final
tags: [etsy, eon, alura, seo, otomasyon, muhasebe]
related: "[[EON Fine Jewelry]]"
---

# EON Fine Jewelry, Alura Growth ile Uçtan Uca Upgrade Planı
**Tarih:** 13 Ağustos 2026 | **Üyelik:** Alura Growth ($14.99/ay) | **Bağlam:** `eon-etsy-denetim-2026-08-13.md` raporunun uygulama katmanı

## 0. Muhasebe sorusu: Alura'ya maliyet faturası girilebilir mi?

**Hayır.** Alura'nın kâr hesabı = gelir − Etsy komisyonları − reklam harcaması. COGS alanı, malzeme/işçilik girişi, tedarikçi faturası yükleme veya gider defteri yok (Growth dahil hiçbir planda). Kanıt: EON'un 10K Yellow Dome listinginde Alura "Est. Profit $1.4k" gösteriyor; aynı mağazanın gerçek tüm zamanlar neti $64.12. Alura'yı muhasebe katmanı yapmak, Etsy panosunun yaptığı hatayı (COGS'suz "net kâr") büyütür.

**Muhasebenin doğru evi zaten kurulu: Amuletta.** `costs` tablosunda vendor, kategori, sipariş bağı, bearer ve `receipt_url` alanları var. Mevcut durum: 57 maliyet satırı, **0 fatura görseli ekli**, 21 satır siparişe bağlanmamış, 9 siparişte COGS iki kez yazılı (Tamsan faturası + Altın Tedarik modeli → $1,761.42 hayalet maliyet).

**Yapılacaklar (bu sıra):**
1. Çift kayıt temizliği: fatura geldiğinde `gold_auto` satırı silinsin veya "model" işaretlenip toplamdan çıkarılsın.
2. Fatura görsellerini/ekran görüntülerini `receipt_url`'e bağla (elde olanlar: Tamsan faturaları).
3. 21 bağlantısız satırı eşle — özellikle Oly Jewelry $220'nin hangi siparişe ait olduğu.
4. #1 siparişinin (12 Ağu) faturası gelince model satırını gerçekle değiştir.
Bu dördü bitince panel gerçek kârı tek ekranda gösterir; Alura yalnız pazarlama tarafında kalır.

**Alternatif düşünülecekse:** COGS/gider takibi isteyen Etsy satıcıları için ayrı kategori araçları var (Craftybase, ProfitTree gibi). EON'da buna gerek yok — Amuletta zaten sipariş-satır düzeyinde maliyet tutuyor ve Etsy + ShipStation ile senkron. Yeni abonelik eklemek yerine mevcut alanları doldurmak doğru hamle.

## EXECUTIVE SUMMARY (EN)

The Growth plan quotas (500 keyword searches/day, 200 shop analyses/day, 500 follow-ups/mo, 4 A/B tests, 15 pins/day, listing optimization up to 1000, Ads optimizer, 3 years history) are far beyond what a 40-listing shop needs: the membership is underused, not undersized. This plan wires every audit finding to a concrete Alura workflow across 6 modules with a weekly operating rhythm. One caution repeated throughout: Alura profit estimates ignore COGS (it showed $1.4k "Est. Profit" on a listing while the true all-shop net is ≈ $107), so Alura is the eyes (keywords, competitors, automation), Amuletta stays the brain (real margins).

## Durum tespiti (13 Ağu 2026)
- Extension AKTİF ve Etsy'ye gömülü çalışıyor (Ads sayfasında "Powered by Alura" optimizer, listing overlay, SERP overlay doğrulandı).
- Web app (app.alura.io) bu oturumda splash ekranında takıldı (CommonObj hatası). Kendi tarayıcı profilinde açılıyorsa sorun yok; açılmıyorsa cache temizle/yeniden giriş. Web-app gerektiren adımlar aşağıda **[WEB]**, extension ile yapılanlar **[EXT]** işaretli.
- Kota kullanımı şu an ~%0: üyelik atıl. Bu plan üyeliği tam kapasite işletir.

## Modül 1, Keyword Research: 13-tag setlerinin doğrulanması [WEB]
**Amaç:** Denetim Bölüm 6'daki tag çerçevesini tahminden ölçüme çevirmek.
1. Aile başına (Dome, Milgrain, Flat, Beveled, Knife, Textured, Two-Tone, Satin) 15-20 aday sorguyu Keyword Research'te tara: hacim, rekabet, tıklama eğilimi. Günlük 500 arama kotasıyla tüm katalog 1-2 günde biter.
2. Filtre kuralı: orta+ hacim, düşük-orta rekabet, alım niyeti taşıyan long-tail ("mens 6mm gold wedding band", "engraved wedding band for him", "2mm thin gold stacking band", "his and hers wedding band set", "heirloom gold ring").
3. Trending keywords (1,000 erişim): Q4 öncesi "christmas gift for husband jewelry", "engagement season", "anniversary band" trend eğrilerini çek; Q4 takvimindeki yayın haftalarına eşle.
4. Autocomplete enrichment (500/gün): her ailenin kök sorgusundan Etsy'nin gerçek arama önerilerini topla; başlık ilk 40 karakter adaylarını buradan seç.
5. Çıktı: aile × 13 tag matrisi tek sayfa; her tag'in yanında hacim/rekabet notu. Bu matris Etsy'de tag güncellemesinin tek kaynağı olur (haftada 5-8 listing, re-index kuralına uygun).

## Modül 2, Listing Helper + Extension denetim turu [EXT + WEB]
**Amaç:** 40 listing için makine destekli kalite skoru ve düzeltme listesi.
1. [EXT] Kanıtlı 8 listingde extension analizini aç (50 sayfa/gün kotası): başlık, tag, foto sayısı, açıklama skorunu kaydet; AI listing optimization önerilerini al ama otomatik uygulama YOK, öneriler denetim raporunun başlık sistemine göre elden geçer.
2. [EXT] DÜZELT grubunun 6 listingi + Satin serisinden 3 örnek: skor farkını satanlarla kıyasla; tekrarlayan eksikler (video yok, gram bilgisi yok, attribute boşluğu) düzeltme listesine.
3. [WEB] Listing optimization modülünde 40 listingi izlemeye al; skor <80 olanlar haftalık gözden geçirme kuyruğuna.
4. Rakip taktiği: kategori kralı listingleri ($1.7M dome, $343.9k personalized) extension ile aç, foto dizilimi, varyasyon kurgusu ve açıklama yapısını EON şablonuyla kıyasla; kopya değil, boşluk analizi.

## Modül 3, Followup Reminder: review motoru [WEB]
**Amaç:** 10 satışta 2 yorumdan, her teslimatta yorum akışına (cold-start hedefi ilk 10-25 yorum).
1. Akış: teslimat +2 gün "umarız kutuyu sevdiniz, ölçü mükemmel mi?" (resize-first mesajı, iadeyi değişime yönlendirir) → teslimat +7 gün nazik yorum daveti (Etsy kurallarına uygun, teşvik vaadi YOK).
2. 500 follow-up/ay kotası mevcut hacmin ~50 katı; tüm siparişler kapsanır.
3. AI yanıt önerileri (500/ay): Julia'nın mesaj kuyruğunda taslak üretsin, gönderim manuel onayla (EON ses tonu korunur, "İade istiyor" tarzı vakalarda insan devrede).
4. İade talebi açık 4 sipariş İLK kampanyaya dahil edilmez; onlara özel resize/exchange telafi mesajı elden gider.

## Modül 4, Etsy Ads Optimizer: $25 kural seti [EXT]
**Amaç:** $272.62 harcama / 0 atfedilen sipariş düzenini bitirmek, Jade Gold kuralını otomatikleştirmek.
1. Önce elle: reklamı kanıtlı 8 listinge daralt (Satin/Textured çıkar), günlük bütçe $3-5.
2. Optimizer kuralı (Ads sayfasındaki Alura bloğu): "Spend > $25 AND Orders = 0 → reklamı kapat", inceleme dönemi son 30 gün. İkinci kural: "ROAS < 2 AND Spend > $40 → kapat".
3. Haftalık kontrol: kapatılanlar listesi + CTR'ı yüksek ama satışsız listingler (ör. 14K White Satin %13 CTR) başlık/fiyat düzeltmesine gider, reklama geri dönmez.
4. Kural otomasyonu bir AYAR değişikliğidir: kurulumda son onay Hüsam'da (bu plan öneri, uygulama senin onayınla).

## Modül 5, Shop Analyzer + Product Seeker: rakip radarı [WEB]
**Amaç:** 5 rakip izleme rutini (200 analiz/gün kotasıyla haftalık 15 dk).
1. İzleme seti: VibrantStone, BelaronFineJewelry, FerkosFineJewelry, DiaFineJewelry, kategori kralı dome mağazası (SERP 1. sıradaki). Aylık: fiyat hareketi, yeni listing, indirim davranışı, yorum hızı.
2. Product Seeker: "wedding band" kategorisinde son 90 gün yükselen listingler; EON portföy boşluğu sinyali (ör. hangi genişlik/finish yükseliyor).
3. 3 yıl geçmiş veri: rakiplerin Q4 sezonluk desenlerini çek (hangi ay kaç listing, indirim pencereleri) ve EON Q4 takvimini kalibre et.
4. Çıktı: ayın ilk pazartesisi 1 sayfalık rakip notu (Amuletta haftalık rutinine eklenir).

## Modül 6, A/B Tests + Pinterest [WEB]
1. A/B (4 eş zamanlı hak): önce satan 8'de ana görsel testi (mevcut hero vs el-üstü/İki Kuşak karesi), sonra başlık testi (mevcut vs Personalized-Engraved kalıbı). Tek seferde tek değişken, 2-3 hafta pencere, sonuç Amuletta CR verisiyle çapraz okunur.
2. Pinterest automation (15 pin/gün): Wave 02 M/W/F elle devam; Alura otomasyonu ek katman olarak satan 8 listingin ürün pinlerini haftalık 5-7 pin ile dağıtsın (eğitim içeriği elde, ürün dağıtımı otomasyonda). Share&Save linkleri pin açıklamalarına (fee iadesi %4 + atıf düzelir).
3. Email Sender (500 kişi/ay): mevcut alıcı tabanı 9 kişi, şimdilik pasif; ilk 50 alıcıda "care guide + resize hatırlatması" tek otomasyonu kurulup bırakılır.

## Haftalık işletim ritmi (toplam ~1 saat)
- **Pzt:** Ads optimizer raporu + kapatılanlar (10 dk). Rakip radar notu (ayda 1, 15 dk).
- **Çar:** Keyword matrisi güncellemesi + o haftanın 5-8 listing tag/başlık revizyonu (20 dk).
- **Cum:** Followup/review akış kontrolü + A/B test okuma (15 dk).
- Aylık: Alura verisi ile Amuletta gerçek marj verisinin mutabakatı; sapma raporu vault'a.

## Kırmızı çizgiler
1. Alura "Est. Profit" ve satış tahminleri KARAR verisi değildir (COGS bilmiyor; EON örneğinde $1.4k gösterdi, gerçek mağaza neti ≈ $107). Kâr kararları yalnız Amuletta.
2. AI içerik önerileri EON ses tonundan geçmeden yayınlanmaz (ölçülü, editoryal, hype yok kuralı).
3. Optimizer dahil hiçbir otomasyon bu plan onaylanmadan mağazada değişiklik yapmaz.
4. Kota israfı tersine de geçerli: Growth $14.99/ay ödeniyor; bu ritim işletilmezse üyelik gözden geçirilir (Basic $7.99 yeterli olur). Tam işletilirse Growth doğru katman; Professional'a ($29.99) geçiş ancak çoklu mağaza (Jade Gold + EON tek hesap) senaryosunda anlamlı.
