# 07 İndirim/kupon, Etsy dışı pazarlama, KPI, takvim
Kaynak: `source/07-*.txt` (M7), okuma 2026-10-22.

## İndirim ve kupon
- Teklifler yığılmaz: alıcı bir hedefli teklif kullanır; indirim + teklif → yüksek olan; birden çok indirim → en yüksek; bundle ≤3 listing [M7 S1 2026-10-22].
- Hedefli teklifler: sepette terk (>2 saat, en sık 2 günde bir, 60 gün geçerli), favori (aynı), ilgili alıcı (30 günde bir, 7 gün, tek kullanım), teşekkür (1 yıl); promo kodu %5-75 tam sayı; kullanım sınırı sonradan değişmez [M7 S1]. Öneri: terk %10, favori %10, teşekkür %10-15 (modülün önerisi).
- **İndirimden önce fiyat yükseltilmez; üstü çizili fiyat, gerçekten makul süre ve miktarda satılmış fiyat olmalı** [M7 §common mistakes; Glossary; M2 truthfulness rule]. Planlı etkinlik dışında mağaza geneli indirim yok; altında derin Black Friday yok, bunun yerine stacking bant/kolyeye hedefli %10-15, gelinlik tam fiyat.

## Etsy dışı
- Kendi her linkinde Share & Save (%4, ilk 2 hafta %6,5, 30 gün); Creator Collective ile aynı faaliyette ikisi birden yok [M7 S3 2026-08-03].
- Pinterest: marka başına ayrı iş hesabı; panolar arama öbeği adında; 2:3 1000×1500; günde 3-5 yeni pin, eski pin silinmez; sezon panosu bayramdan 60-90 gün önce; gerçek fotoğraf tercih (AI görsele "AI modified" etiketi) [M7 S19-S21].
- Influencer: sezon başına 10-20 mikro (5-50K); "#ad"/"Gifted by EON" caption başında + videoda sözlü; dürüst paylaşım karşılığı, Etsy yorumu istenmez; giriş parçası gönder [FTC 16 CFR 255/465; M7 S24].
- Etsy alıcısı izinsiz e-posta listesine eklenmez; Etsy mesajıyla promosyon yok; paket kartında hikâye + opt-in evet, Etsy dışı indirim hayır; yorum talebi duygu-nötr ve herkese [Etsy Seller Policy 2026-10-05].
- Etsy ve web sitesi fiyatı eşit. TikTok Shop en erken 2027 (365 gün içinde lab testi, sertifika, W-9/EIN).

## KPI (haftalık, Pazartesi)
Dönüşüm = sipariş/ZİYARET (görüntülenme değil), trend izlenir (altında mutlak eşik yok) · AOV · kaynağa göre ziyaret · ROAS ve başa baş (05) · Offsite ücreti/gelir (aylık) · CTR · CAC · katkı marjı (tüm değişken giderler + atfedilen reklam) · ilk 20 arama terimi · favori/sepet · operasyon (ortalama üretim günü, zamanında sevk %, açık case, yanıt süresi) · 4 yıldız altı her yorum · altın fiyatı vs fiyat varsayımı. EverBee tahmini veri değildir.

## Takvim
- Son sipariş tarihi = hedef teslim − (üretim + transit + 2 gün emniyet); en kötü 7+5+2 = 14 iş günü, en iyi 10. USPS "send-by" tarihini üretim günü çıkarmadan kullanma. Cutoff Shop Announcement + politika + her hediye listing açıklamasında; cutoff geçince üretim süresini uzat.
- 2026-27 (türetilmiş, en kötü/en iyi): Hanukkah ~4 Ara → 13/19 Kas · Noel → 4 Ara (Priority ile 7 Ara) · Yılbaşı/teklif sezonu → 10 Ara · Sevgililer 14 Şub → 25/29 Oca · Anneler Günü 9 May → 19/23 Nis · Babalar Günü 20 Haz → 27 May/3 Haz.
- Hazırlık: tatil listing'leri 31 Eki'ye kadar; Sevgililer listing'i Aralık başı, reklamı Ocak 1. hafta, Pinterest panosu Kas ortası; gelin/yıldönümü Şubat'a kadar; Anneler Günü listing'i Şubat ortası, reklam 15 Mar; Babalar Günü listing'i Nisan ortası, reklam 15 May. Etsy trend raporu (Mart, Ekim) sonrası bir hafta içinde listing + keyword + pano; yılda 2 düşüş, 6-10 listing.

## Panelde açık çelişkiler/boşluklar (2026-10-22)
- KALICI mağaza indirimi: `lib/jade/pricing.ts:62` `JADE_DISCOUNT_RATE = 0.30`, `lib/pricing-engine/eon-cost.ts:127` `EON_SALE_RATE = 0.75`; geçmişte indirim artınca etiket ×1,1333 yükseltildi (`docs/second-brain.md`). Üstü çizili fiyat kuralıyla çelişki riski; sahip kararı.
- Hedefli teklifler mağaza indiriminden derin (%30) kurgulanmış (second-brain 2026-09-22); modül %10-15 öneriyor.
- `lib/performance.ts:7-8` mutlak dönüşüm eşikleri (%1/%1,5), `lib/growth-roadmap.ts:249` %2,5/%3,5; `lib/db/queries/etsy-insights.ts:351` dönüşümü görüntülenmeden hesaplıyor.
- Takvim/cutoff hesaplayıcı, Share & Save, Offsite ücret %, sepet takibi yok. Pinterest CSV'leri Share & Save linki taşımıyor, panolar ürün tipi adında (`docs/artifact-studio/pinterest-fw2627/`).
