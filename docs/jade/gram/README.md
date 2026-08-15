# Gram & fiyat çalışma dosyası

**`JadeGold-Gram-Fiyat.xlsx`** — ekibin gram girişi yapacağı, aynı anda tüm
katalogun fiyat sağlığını gösteren dosya.

## Numbers'a çevirme (tek seferlik, ~10 saniye)

Hedef format **`.numbers`**. Dosya XLSX olarak üretiliyor çünkü **formüllü
`.numbers` yalnız Numbers.app tarafından üretilebilir** — bu bir tercih değil,
ölçülmüş bir kısıt:

| Yol | Sonuç |
|---|---|
| `numbers-parser` 4.19 | `.numbers` **yazar** (çok sekme, stil, marka rengi) ama **formül yazamaz** — `=A2*106` düz metin olarak iniyor (`is_formula: False`). Kütüphanenin kendi README'si: *"Formulas cannot be written to a document"* |
| Aspose.Cells | `.numbers`'ı **yalnız okur**. (Pazarlama sayfası "kaydet" diyor, kendi dokümanı *"does not support writing to them"* diyor — dokümana güvenin) |
| Digits / apple-numbers-mcp | Formülü **gerçekten yazar**, çünkü AppleScript ile Numbers.app'i sürüyor → **macOS şart** |

Mac'te: dosyayı **Numbers ile aç** → `Dosya > Farklı Kaydet` → `.numbers`.
Numbers XLSX formüllerini native formüle çevirir; hesaplar canlı kalır.
Formüller bilerek yalnız `IF` / `OR` / `ROUNDUP` ile yazıldı — üçü de Numbers'ın
desteklediği ortak fonksiyonlar, Excel'e özgü fonksiyon yok.

**Kalıcı çözüm:** Mac'e bir Numbers MCP sunucusu kurulursa (ör.
[Digits](https://github.com/apeabody007/Digits) —
`/plugin marketplace add apeabody007/digits`) panel doğrudan `.numbers`
üretebilir, bu ara adım kalkar.

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

Altın fiyatı değişirse `Ayarlar!B3` güncellenir — 1.944 satır yeniden hesaplanır.
(Ayarlar sekmesinde 1. satır başlık bandı olduğu için değerler **B3–B9**'dadır;
formüller oraya bağlı, bu satırlar kaydırılmamalı.)

## Durum sütunu

Durum hücresi formülle hesaplanır ve rengini koşullu biçimden alır — ekip gram
yazdığı anda renk kendiliğinden değişir, elle boyama yoktur.

| Değer | Renk | Anlamı |
|---|---|---|
| `GRAM EKSİK` | bej | Gram girilmemiş, hesap yapılamıyor |
| `ZARARDA` | kırmızı | Marj negatif — her satışta para kaybı |
| `RİSKLİ` | amber | Fiyat breakeven'in altında |
| `FİYAT ŞÜPHELİ` | kırmızı | Fiyat > $30.000 — placeholder değer, gerçek fiyat değil |
| `ok` | jade | Sağlıklı |

**Marj** sütunu ayrıca kırmızı → krem → jade renk skalasıyla boyanır; 1.944 satırı
okumadan zayıf marjlar göze çarpar.

## Renkler

Marka paletinden: altın `#9A7A33` (başlık bantları, sekme sekmeleri), krem
`#F2EFE6`/`#FBF9F4` (zebra), jade `#3F4A44` (sağlıklı), bej `#A39F94` (nötr),
giriş sarısı `#FCEFC7` (doldurulacak hücreler). Kaynak:
`public/brand/jade-gold-nyc-guidelines.html` — panelin `globals.css`'i değil,
orası mor tonlu arayüz temasıdır, marka değil.

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

`lib/jade/pricing.ts` ile **birebir aynı** — 16 varyantta (rastgele 12 + gram/fiyat
uç değerleri) 4 metrik × 16 = **64 karşılaştırma, sıfır sapma**. İkisi ayrı yerde
yaşıyor: biri değişirse diğeri de değişmeli.

## Doğrulama notu

Dosya bu ortamda LibreOffice ile **açılarak** test edilemedi — LibreOffice
kurulumu bozuk (java eksik), minimal bir XLSX'i bile açamıyor. Bunun yerine
doğrulandı: ZIP bütünlüğü sağlam, 4 sekme ve satır sayıları doğru
(121 / 1.944 / 113), formüller `openpyxl` ile geri okundu ve `Ayarlar!$B$3–$B$9`
adreslerinin sekmedeki doğru değerlere (106 / 5 / 1,5 / %15 / %9,5 / 0,25 / %20)
denk geldiği tek tek teyit edildi, giriş hücrelerinin sarı dolgusu ve koşullu
biçim kuralları geri okundu. Formül **aritmetiği** TS motoruyla karşılaştırıldı.
Numbers'ta ilk açılışta hesapların döndüğü ve renklerin taşındığı gözle teyit
edilmeli — Numbers koşullu biçimi destekler ama render'ı Excel'den farklı olabilir.

## Geri dönüş akışı

Ekip doldurup gönderince: SKU eşleşmesiyle `product_variants.weight_grams`
yazılır (`weight_source='manual'`), fiyatlar yeniden hesaplanır, panelden
Etsy'ye push edilir.
