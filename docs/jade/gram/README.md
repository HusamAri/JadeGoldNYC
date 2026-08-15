# Gram & fiyat çalışma dosyası

İki sürüm var; ikisi de aynı veriden, aynı formülle üretiliyor.

| Dosya | Ne için | Renk | Formül |
|---|---|---|---|
| **`JadeGold-Gram-Fiyat.numbers`** | **Birincil.** Okuma, inceleme, gram girişi | Serin pastel (bebek mavisi / yaz sarısı / nane / mercan) | Hesaplar **değer** olarak dolu (1.823 varyant); canlı formül için «Formüller» sekmesinden yapıştırılır |
| `JadeGold-Gram-Fiyat.xlsx` | Canlı hesap gerekiyorsa | Marka altını / krem | **Canlı** — gram yazılınca her şey anında hesaplanır |

Üretim:
```
python3 scripts/jade-gram-numbers.py  katalog-anlik-<tarih>.json cikti.numbers
python3 scripts/jade-gram-worksheet.py katalog-anlik-<tarih>.json cikti.xlsx
```

## `.numbers` sekmeleri

| Sekme | Satır | Ne işe yarar |
|---|---|---|
| **Başlangıç** | — | Kapak, nasıl kullanılır, durum rengi lejantı |
| **Ayarlar** | 7 | Fiyat sabitleri + açıklamaları |
| **Formüller** | 6 + 5 | Her formülün düz anlatımı **ve** Numbers'a kopyala-yapıştır hazır sözdizimi |
| **Eksik Gramlar** | 121 | Ekip burayı doldurur — sarı GRAM sütunu |
| **Tüm Varyantlar** | 1.944 | Katalog sağlığı + gram kaynağı |
| **Listing Özeti** | 113 | Hangi listing'in tartımı acil |

### `.numbers`'ta hesap neden canlı değil

`.numbers` dosyasına **formül yazılamıyor** (aşağıdaki kısıt tablosu). Bu yüzden
hesaplanan sütunlar Python'da üretilip **değer** olarak yazıldı — gramı olan
1.823 varyantta hesap dolu gelir. Yeni gram girilince sütun kendiliğinden
güncellenmez; «Formüller» sekmesindeki hazır formül ilgili sütuna bir kez
yapıştırılırsa sütun canlıya döner (Numbers aşağı doldurur).

Canlı hesap şartsa XLSX sürümü kullanılır.

## Kısıt: formüllü `.numbers` neden üretilemiyor

Ölçülmüş, varsayım değil:

| Yol | Sonuç |
|---|---|
| `numbers-parser` 4.19 | `.numbers` **yazar** (çok sekme, stil, marka rengi) ama **formül yazamaz** — `=A2*106` düz metin olarak iniyor (`is_formula: False`). Kütüphanenin kendi README'si: *"Formulas cannot be written to a document"* |
| Aspose.Cells | `.numbers`'ı **yalnız okur**. (Pazarlama sayfası "kaydet" diyor, kendi dokümanı *"does not support writing to them"* diyor — dokümana güvenin) |
| Digits / apple-numbers-mcp | Formülü **gerçekten yazar**, çünkü AppleScript ile Numbers.app'i sürüyor → **macOS şart** |

XLSX'i Mac'te Numbers ile açıp `Dosya > Farklı Kaydet` ile de `.numbers`'a
çevirebilirsiniz — Numbers XLSX formüllerini native formüle çevirir, hesaplar
canlı kalır. Formüller bilerek yalnız `IF` / `OR` / `ROUNDUP` ile yazıldı; üçü de
Numbers'ın desteklediği ortak fonksiyonlar, Excel'e özgü fonksiyon yok.

**Kalıcı çözüm:** Mac'e bir Numbers MCP sunucusu kurulursa (ör.
[Digits](https://github.com/apeabody007/Digits) —
`/plugin marketplace add apeabody007/digits`) formüller doğrudan `.numbers`'a
yazılabilir ve bu ayrım tamamen kalkar.

Anlık veri: `katalog-anlik-2026-08-15.json` (1.944 varyant / 113 listing).

## Nasıl kullanılır

Sarı **GRAM** hücresine gram yazılır. XLSX'te maliyet, breakeven, hedef fiyat,
marj ve durum **anında** hesaplanır; `.numbers`'ta hesap için «Formüller»
sekmesindeki hazır formül bir kez yapıştırılır. Başka hiçbir sütuna dokunulmaz.

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

XLSX'te **Marj** sütunu ayrıca kırmızı → krem → jade renk skalasıyla boyanır;
1.944 satırı okumadan zayıf marjlar göze çarpar.

## Renkler

İki dosya bilerek farklı palet kullanıyor.

**`.numbers` — serin pastel** (kullanıcı tercihi: "kahve değil, cool pastel"):
bebek mavisi `#5B9CC4` başlık / `#A8D5E5` vurgu / `#F0F8FB` zebra, yaz sarısı
`#FFE38C` giriş hücreleri, nane `#B8E0D2` sağlıklı, mercan `#FFC2B8` zarar,
lavanta `#CFC6EC` bekleyen, serin arduvaz `#2E4756` metin.

**`.xlsx` — marka paleti:** altın `#9A7A33` başlık bantları ve sekme renkleri,
krem `#F2EFE6`/`#FBF9F4` zebra, jade `#3F4A44` sağlıklı, bej `#A39F94` nötr,
giriş sarısı `#FCEFC7`. Kaynak: `public/brand/jade-gold-nyc-guidelines.html` —
panelin `globals.css`'i değil, orası mor tonlu arayüz temasıdır, marka değil.

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

`lib/jade/pricing.ts` ile **birebir aynı**, iki dosya da ayrı ayrı doğrulandı:

- **XLSX formülleri** ↔ TS motoru: 16 varyant × 4 metrik = **64 karşılaştırma,
  sıfır sapma**
- **`.numbers` hesaplanmış değerleri** ↔ TS motoru: 20 varyant × 4 metrik =
  **80 karşılaştırma, sıfır sapma**

Üç yerde yaşıyor (TS motoru, XLSX formülü, .numbers üreteci): biri değişirse
üçü de değişmeli.

## Doğrulama notu

**Hiçbir dosya bu ortamda AÇILARAK test edilemedi** — Numbers yalnız macOS'ta
çalışır, LibreOffice kurulumu da bozuk (java eksik, minimal bir XLSX'i bile
açamıyor). Bunun yerine ikisi de programatik olarak geri okunup doğrulandı:

**XLSX:** ZIP bütünlüğü sağlam, 4 sekme, satır sayıları doğru (121/1.944/113),
formüller `openpyxl` ile geri okundu, `Ayarlar!$B$3–$B$9` adreslerinin doğru
değerlere (106 / 5 / 1,5 / %15 / %9,5 / 0,25 / %20) denk geldiği tek tek teyit
edildi, giriş hücrelerinin sarı dolgusu ve koşullu biçim kuralları okundu.

**`.numbers`:** paket bütünlüğü sağlam (91 dosya, Index mevcut), 6 sekme, satır
sayıları doğru (121/1.944/113), pastel renkler hücre hücre geri okundu
(giriş `FFE38C`, sağlıklı `B8E0D2`, zarar `FFC2B8`), hesaplanmış değerler TS
motoruyla karşılaştırıldı. Sayı biçimi doğrulandı: `numbers-parser` float
round-trip'te hassasiyet kaybediyor (`41.61` → `41.61000000000001`), açık
`number`/`currency`/`percentage` biçimi verilerek görünen değer düzeltildi —
2 basamaktan uzun ondalık gösteren **sayısal hücre yok**.

Yine de ilk açılışta gözle bakılmalı: renklerin ve hizalamanın beklendiği gibi
düştüğü, «Formüller» sekmesindeki hazır formülün yapıştırıldığında çalıştığı.

## Geri dönüş akışı

Ekip doldurup gönderince: SKU eşleşmesiyle `product_variants.weight_grams`
yazılır (`weight_source='manual'`), fiyatlar yeniden hesaplanır, panelden
Etsy'ye push edilir.
