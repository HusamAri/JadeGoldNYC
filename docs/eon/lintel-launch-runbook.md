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

1. [x] Paket metinleri indirildi (2026-08-11) → `docs/eon/lintel/<NN>/`
   (repoda yaşar; ayna ezerse kanonik kaynak burası). Placeholder çözümü +
   Etsy sert kural denetimi `scripts/gen_lintel_catalog.py` iç assert'lerinde;
   ek olarak token OLMAYAN iç-QA dili de taranıyor ("must be confirmed",
   "confirmed alloy" — beyaz altın paragraflarında düz metin olarak sızmıştı,
   gözle yakalandı, üreticiye kalıcı denetim eklendi).
2. [x] Panelde 9 ürün + 2.025 varyant oluşturuldu (2026-08-11). Üretici çıktısı
   `0137_eon_lintel_family.sql`; canlıya MCP ile aile-aile basıldı. Doğrulama:
   - 9/9 metin uzunluğu üretici çıktısıyla birebir
   - ayar başına konum-ağırlıklı fiyat checksum'u ikiz dome ailesiyle birebir
     (10K 251.225.000 · 14K 382.915.000 · 18K 539.669.000; 0 fiyatsız, 0 gramsız)
   - fiyat aralığı: 10K $470–$2.350 · 14K $670–$3.635 · 18K $970–$5.255
3. [x] 90 görsel Dropbox'tan `public/eon/<sku>/NN.jpg`'ye indirildi (90/90 JPEG
   imza doğrulaması), `listing_images`'a alt-text'lerle basıldı (90 satır,
   17.408 kr alt toplamı kaynak CSV'lerle birebir).
4. [ ] Etsy taslak oluşturma: `/api/ops/lintel-drafts` — prod'da tetiklenir
   (önce dry-run, sonra `?sku=GLD-R-1008&apply=1` ile TEK listing kanıtı,
   sonra kalanlar). NOT: rotadaki göreli-görsel-URL hatası düzeltildi
   (Node fetch göreli yolu çözemiyordu → origin ile mutlaklaştırma).
5. [ ] Read-back doğrulaması + panel ayna eşitlemesi
6. [ ] Aktivasyon (kullanıcı kuralı: önce taslak testi, sonra aktive)

## Placeholder çözüm haritası (aktivasyon öncesi zorunlu)

Açıklamalardaki canlı placeholder'lar ev gerçekleriyle değiştirilir — uydurma
YOK; kaynak canlı dome listing açıklamaları (ör. WHG-R-1401) + kullanıcı kuralları:

| Token | Değer kaynağı |
| --- | --- |
| [[WIDTH_MM]] / [[SIZE_RANGE]] | "4mm to 12mm" / "US 4-16, full and half sizes" (kullanıcı kuralı + matris) |
| [[THICKNESS_MM]] | 1.5mm (EON nihai kalınlık kararı, docs/eon/pricing) |
| [[HALLMARK]] | ayar damgası (10K/14K/18K stamped) — canlı dome metnindeki cümle |
| [[ALLOY_COMPOSITION]] / [[NICKEL_DISCLOSURE]] / [[PLATING_STATUS]] | canlı dome açıklamasındaki solid/kaplama-değil/nikel cümleleri birebir |
| [[MAKER_OR_PRODUCTION_PARTNER]] / [[MADE_IN_LOCATION]] | canlı listing'lerdeki üretim ifadesi (Etsy production partner kaydıyla tutarlı) |
| [[CONFIRM]] içeren cümleler | ev standardı yoksa cümle ÇIKARILIR (placeholder asla yayına sızmaz) |

Doğrulama: yayın öncesi SQL leak sayacı `description like '%[[%'` = 0.
Pakete gömülü "gerçek fotoğraf çekilmeli" uyarısı (PUBLISH-HOLD-SUMMARY,
görsel 01/05/08) kullanıcının aktivasyon talimatıyla geçersiz kılındı — nota
düşüldü, görseller paket hâliyle kullanılacak.

## Durum notları

- (başlangıç) Paket yapısı doğrulandı, fiyat/SKU kararları verildi.
- 2026-08-11: 233/233 dosya alt-ajanla indirildi (scratchpad/lintel/, OZET.json +
  SORUNLAR.md). Başlık/tag sert kuralları 9/9 temiz. Açıklamalar placeholder'lı —
  yukarıdaki haritayla çözülecek. Sıradaki: DB'de 9 taslak + 2.025 varyant
  (ikiz-aile fiyat kopyası, INSERT..SELECT suffix join) + görsellerin repo
  public/eon/ altına alınması + Etsy taslak akışı.
