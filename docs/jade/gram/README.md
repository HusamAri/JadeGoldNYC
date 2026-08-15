# Gram & fiyat çalışma dosyası

**`JadeGold-Gram-Fiyat.xlsx`** — ekibin gram girişi yapacağı, aynı anda tüm
katalogun fiyat sağlığını gösteren dosya. Numbers ve Excel açar.

Üretim: `python3 scripts/jade-gram-worksheet.py katalog-anlik-<tarih>.json cikti.xlsx`
Anlık veri: `katalog-anlik-2026-08-15.json` (1.944 varyant / 113 listing).

## Sekmeler

| Sekme | Satır | Ne işe yarar |
|---|---|---|
| **Ayarlar** | 7 sabit | Tüm formüllerin beslendiği tek kaynak |
| **Eksik Gramlar** | 121 | **Ekip burayı doldurur** — sarı GRAM sütunu |
| **Tüm Varyantlar** | 1.944 | Katalog sağlığı + gram kaynağı |
| **Listing Özeti** | 113 | Hangi listing'in tartımı acil |

## Nasıl kullanılır

Sarı **GRAM** hücresine gram yazılır; maliyet, breakeven, hedef fiyat, marj ve
durum **anında** hesaplanır. Başka hiçbir sütuna dokunulmaz (hepsi formül).

Altın fiyatı değişirse `Ayarlar!B2` güncellenir — 1.944 satır yeniden hesaplanır.

## Durum sütunu

| Değer | Anlamı |
|---|---|
| `GRAM EKSİK` | Gram girilmemiş, hesap yapılamıyor |
| `ZARARDA` | Marj negatif — her satışta para kaybı |
| `RİSKLİ` | Fiyat breakeven'in altında |
| `FİYAT ŞÜPHELİ` | Fiyat > $30.000 — placeholder değer, gerçek fiyat değil |
| `ok` | Sağlıklı |

## Neden bu dosya gerekti

Gram üç kaynaktan gelebiliyordu, üçü de tıkalı:

1. **ShipStation kurudu.** Panel gramı `weight_oz`'dan değil, ürünün *internal
   notes* alanına elle yazılan sayıdan çekiyor (2.541 üründen yalnız 1'inde
   `weight_oz` dolu). Notunda gram olan 171 SKU'nun tamamı zaten çekilmiş —
   çekilecek yeni veri **0**. Gramsız 121 varyantın 71'i ShipStation'da var ama
   not alanı boş; `raw` içindeki tüm alanlar tarandı, sayı taşıyanlar yalnız
   fiyat/tarih/raf kodu.
2. **Açıklama metni** yalnız 5 listing'de güvenilir (tek varyantlı). 10 listing'de
   tek gram çok varyanta yayılmış — `1520386344` hatasının aynısı, kullanılamaz.
3. **Terazi** en güvenilir yol ama elle giriş gerektiriyor. 2026-08-15'te tartılan
   4 parçadan biri (`P14F`) sistemdekinden **%15** saptı; kaynağı `description`
   idi, yani tahmindi.

## Formül (panelle aynı olmalı)

```
Maliyet     = gram × 106 + 5 (kargo) + 1,50 (ambalaj)
Tahsilat    = fiyat × 0,85            (kalıcı %15 indirim)
Kesinti     = tahsilat × 0,095 + 0,25 (Etsy)
Marj        = (tahsilat − kesinti − maliyet) / tahsilat
Hedef fiyat = YUKARIYUVARLA((maliyet + 0,25) / (0,85 × (0,905 − hedef marj)))
```

`lib/jade/pricing.ts` ile **birebir aynı** — 10 gram değerinde çapraz doğrulandı,
sıfır sapma. İkisi ayrı yerde yaşıyor: biri değişirse diğeri de değişmeli.

## Doğrulama notu

Dosya bu ortamda LibreOffice ile **açılarak** test edilemedi — LibreOffice
kurulumu bozuk (java eksik), minimal bir XLSX'i bile açamıyor. Bunun yerine
doğrulandı: ZIP bütünlüğü sağlam, 4 sekme ve satır sayıları doğru
(121 / 1.944 / 113), formüller `openpyxl` ile geri okundu, sarı dolgu ve
dondurulmuş başlık yerinde. Formül **aritmetiği** TS motoruyla karşılaştırıldı.
Numbers'ta ilk açılışta hesapların döndüğü gözle teyit edilmeli.

## Geri dönüş akışı

Ekip doldurup gönderince: SKU eşleşmesiyle `product_variants.weight_grams`
yazılır (`weight_source='manual'`), fiyatlar yeniden hesaplanır, panelden
Etsy'ye push edilir.
