# The Lintel lansmanı — runbook ve durum (2026-08-11)

9 yeni listing: "The Lintel" ailesi, 3 ayar × 3 renk. Kaynak: kullanıcının
Obsidian vault'undan Dropbox'a kopyalanan `/11-etsy-upload-packages/`
(9 paket × 10 görsel + listing metinleri + QA; toplam 233 dosya, doğrulama
raporu `00-package-overview/VALIDATION-REPORT.md`).

## Kullanıcı kuralları (2026-08-11)

- **Genişlik: minimum 4mm — 2mm ve 3mm varyantı YOK.** (Eksen: 4–12mm = 9 genişlik.)
- Fiyat ve SKU'lar mantık denetiminden geçecek; eksik/hata testi yapılacak.
- Görseller yüklenecek; önce panelde "gönderime hazır" listing önerisi/taslak,
  test sonrası EON Etsy'de aktivasyon.

## Paket denetimi bulguları

1. **Fiyatlar placeholder**: `05-pricing-template.csv` her satırda REQUIRED /
   PUBLISH_HOLD — pakette gerçek fiyat YOK (bilinçli kontrol). Fiyat kaynağı
   panel motoru olacak: Lintel standart işçilik sınıfı → fiyatlar ayar-eş
   dome ailesinden birebir kopyalanır (profil yalnız işçiliği değiştirir,
   standart profiller aynı fiyattadır):
   - 10K: GLD/WHG/RSG-R-1001 → Lintel 10K üçlüsü
   - 14K: WHG-R-1401 (ve GLD-R-1401) → Lintel 14K üçlüsü
   - 18K: GLD/RSG/WHG-R-1801 → Lintel 18K üçlüsü
2. **Paket SKU şeması reddedildi**: `LNT-10K-YG-S75-W6` ev şemasıyla uyumsuz —
   karat ayrıştırma (`-R-(\d\d)\d\d-`), genişlik regex'i (`-(\d+)MM-`), altın
   endeksi, işçilik sınıfı, fiyat itişi HEPSİ ev şemasına anahtarlı. Yetim
   listing üretir (bkz. 2026-08-11 SKU ayrıştırma vakası). **Ev şeması
   kullanılacak, Lintel profil kodu = 08**:
   `{GLD|WHG|RSG}-R-{10|14|18}08-{W}MM-{S}` (ör. `GLD-R-1008-6MM-7.5`).
3. **Metinlerde [[CONFIRM]] tokenleri var** (fulfillment, adet vb.) — canlıya
   asla sızmamalı; taslak oluştururken ev standartlarıyla (made-to-order,
   mağaza işlem süresi) doldurulur, kalanlar aktivasyondan önce listelenir.
4. Görseller 1254×1254 RGB JPEG (Etsy minimumunu karşılar, 2000px tavsiyesinin
   altında — kabul), 90/90 tam, kopya yok. Videolar iptal (VIDEO-CANCELLED).

## Varyant matrisi (karar)

- Genişlik: 4, 5, 6, 7, 8, 9, 10, 11, 12 (9 adet — kullanıcı kuralı gereği
  2 ve 3 yok)
- Beden: US 4–16 tam+yarım (25 adet)
- Listing başına 225 varyant; 9 listing = 2.025 varyant
- Fiyat: yukarıdaki ikiz ailelerden genişlik+beden eşleşmesiyle kopya

## Uygulama akışı

1. [ ] Paket metinlerini indir (başlık/açıklama/tag/alt-text), [[CONFIRM]]
   temizliği + Etsy sert kural denetimi (140 kr, 13 tag ≤20 kr — VALIDATION
   raporu geçti diyor, yine de programatik doğrula)
2. [ ] Panelde 9 ürün + 2.025 varyant oluştur (products + product_variants,
   status=draft, research_group ata; MCP SQL ile idempotent)
3. [ ] Görselleri Dropbox'tan indirip panel storage'a / Etsy'ye taşı
4. [ ] Etsy taslak oluşturma döngüsü (mevcut task #10 altyapısı:
   listing-onerileri → createListing akışı) — prod'da koşar;
   sku-untangle rotasındaki DB-token deseniyle tetiklenebilir
5. [ ] Read-back doğrulaması + panel ayna eşitlemesi
6. [ ] Aktivasyon (kullanıcı kuralı: önce taslak testi, sonra aktive)

## Durum notları

- (başlangıç) Paket yapısı doğrulandı, fiyat/SKU kararları verildi.
