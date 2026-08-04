# Amuletta P&L katmanı — kilitli kararlar (2026-08-04)

Bu dosya, gelir/maliyet katmanının değişmez girdilerini taşır. Faz 3 (masraf
defteri + ortak mutabakatı) bu kararlar üzerine kurulur; kararlar değişirse
ÖNCE burası güncellenir, sonra kod.

## Husam'ın kararları

| Konu | Karar | Sonucu |
|---|---|---|
| **Para birimi** | Yasin'in üretim maliyetleri **zaten USD** | FX katmanı GEREKMİYOR. `currency` alanı yine de tutulur (ileride TRY girişi olursa kırılmasın) ama kur çevrimi kurulmaz. |
| **Kâr payı** | **Önce her ortak cebinden ödediğini geri alır, kalan 50/50** | Mutabakat iki adımlı: (1) payer bazında geri ödeme, (2) artık katkının eşit bölünmesi. Bakiye = ortaklar arası net borç. |
| **Kargo** | Landed'daki **$22 sabit iç pay olarak KALIR**; gerçek etiket bedeliyle fark ayrı izlenir | `landed` deterministik ve sipariş öncesi hesaplanabilir kalır. `shipping_variance = shipping_actual - 22.00` ayrı kolon, katkı payında AYRI satır olarak görünür — gizlenmez. |

## Bağlayıcı kısıtlar (brief'ten)

1. Etsy'ye gözetimsiz yazma YOK. EON `externalPricing = true` KALICI: panel fiyat
   okur, hesaplamaz, itmez.
2. `ha_*` tabloları handover-atlas'a ait, DONMUŞ.
3. `audit_log` 90 gün saklama ile kalır; UI'si kaldırılmış halde kalır.
4. Her para rakamı kaynak satıra tıklanabilir olmalı.
5. Bilinmeyen maliyet **"bilinmiyor"** olarak render edilir ve loglanır — sessiz
   tahmin İKAME EDİLMEZ.

## Faz 1 sabitleri (kilitli)

```
gram_price   = spot_usd / 31.1035
purity       = 10K 0.417 | 14K 0.583 | 18K 0.75
material     = grams * gram_price * purity * 1.07      // %7 fire kaybı
labor        = 30.00  (milgrain / hammered: 40.00)
packaging    = 8.00
shipping     = 22.00                                    // sabit iç pay (yukarıdaki karar)
landed       = material + labor + packaging + shipping  // YUVARLANMAZ
multiplier   = 1.55 (2-7mm) | 2.00 (8-12mm)
engine_price = round(landed * multiplier, 0)            // yuvarlanmamış landed'dan
list_price   = ceiling(engine_price / 0.75, 5)
sale_price   = list_price * 0.75                        // kalıcı %25 indirim
```

Spot 4090 · kalınlık 1.5mm (tüm genişlik/profil) · gram kaynağı dome tablosu,
tüm profiller için geçerli; milgrain/hammered yalnız işçilikte ayrışır.

**Altın değerler** (fonksiyon bunları tutturmadan ileri gidilmez):
`10K 5mm US7 dome → engine 449 / list 600` ·
`10K 8mm US7 → engine 856 / list 1145` ·
`10K 5mm US7 milgrain → engine 465 / list 620`

## Sıraya alınan, bu işe DAHİL DEĞİL

`pricing_engine_current` SECURITY DEFINER düzeltmesi · CRON_SECRET kalıcı
rotasyonu · trafik-kaynağı CSV içe aktarıcı (kaynak toplamı = ziyaret
doğrulaması hâlâ tutmuyor: Temmuz 326'ya karşı 261).
