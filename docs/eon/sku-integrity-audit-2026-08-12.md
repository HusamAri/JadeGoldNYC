# SKU bütünlük denetimi — 2026-08-12 (SALT OKUNUR, hiçbir şey düzeltilmedi)

Tetikleyici: 08-07 siparişinde `WHG-R-1402-5MM-7` SKU'su ile
"10K Solid Gold Hammered Wedding Band, Milgrain Comfort Fit" başlığının
çelişmesi; 07-24 siparişinde SKU'nun hiç olmaması.

Kapsam: EON 42 canlı listing (41 active + 1 sold_out) · 14 Etsy'de taslak
listing · 13.750 varyant satırı; ayrıca Jade Gold NYC 118 canlı listing /
1.945 varyant. **Hiçbir satır değiştirilmedi.**

## SKU şeması (kod + migration'lardan çözüldü)

```
<RENK>-R-<KARAT><PROFIL>-<GENİŞLİK>MM-<BEDEN>
 GLD sarı · WHG beyaz · RSG rose · TTG two-tone
 10 | 14 | 18
 01 dome · 02 flat · 03 beveled · 04 milgrain · 05 knife
 06 (çakışık, aşağıya bak) · 07 ribbed · 08 satin-center
```
Kaynak: `supabase/migrations/0087_eon_sku_families.sql`,
`docs/eon/gen_catalog_v3.py:43`, `lib/listing-facets.ts:28-44`,
`lib/pricing-engine/run.ts:88` (`parseSkuAxes`).

## Temiz çıkan denetimler

| Kontrol | Sonuç |
|---|---|
| 42 canlı listing: renk öneki ↔ başlık rengi | **41/42 uyumlu** |
| 42 canlı listing: karat basamağı ↔ başlık karatı | **41/42 uyumlu** |
| 42 canlı listing: profil kodu ↔ başlık profili | **41/42 uyumlu** |
| 14 Etsy taslağı (18K ailesi) | **14/14 uyumlu** |
| 13.750 varyant: SKU genişlik jetonu = `Width` property | **0 sapma** |
| 13.750 varyant: SKU beden jetonu = `Ring Size` property | **0 sapma** |
| Ayrıştırılamayan SKU | **0** |
| İki ürüne birden ait SKU (sahiplik çakışması) | **0** (her iki org) |
| `product_variants.etsy_listing_id` ≠ ebeveyn ürününki | **0** |

## Bulgular

### B1 — Tek listing'de üç alanlı çelişki (kritik)

`4543442596` · "10K Solid Gold Hammered Wedding Band, Milgrain Comfort Fit Ring"
· varyant ailesi **`HMW-R-1402`** · 225 varyant.

| Alan | SKU ne diyor | Başlık ne diyor |
|---|---|---|
| Renk | `HMW` — renk sözlüğünde YOK (renk yuvasında profil kısaltması) | Sarı ("Solid Gold") |
| Karat | `14` | **10K** |
| Profil | `02` = flat | hammered + milgrain |

`HMW` öneki repoda hiçbir migration'da geçmiyor — 225 satırın tamamı
**2026-08-11 13:49:12**'de tek seferde oluşturulmuş (toplu insert / senkron).
`lib/listing-facets.ts:41-44` `HMW-` önekini tanımadığı için renk yalnız
başlıktan kurtuluyor; SKU'ya bakan her analiz bunu 14K beyaz flat sayıyor.

### B2 — B1'in geçmişe dönük hasarı: bir satış yanlış aileye yazılı

Sipariş `4138365859` (2026-08-07), `sale_items.sku = WHG-R-1402-5MM-7`.
Bu SKU **başka bir canlı listing'in** varyantına ait:

```
WHG-R-1402-5MM-7 → 4543427531  "14K White Gold Flat Wedding Band"
HMW-R-1402-5MM-7 → 4543442596  "10K Solid Gold Hammered..."   (siparişin gerçek listing'i)
```

Sipariş satırının `product_id` bağı DOĞRU (hammered listing'ini gösteriyor),
`etsy_listing_id` de doğru. Yani başlık/ürün üzerinden çalışan raporlar
doğru; **SKU anahtarıyla çalışan her rapor bu $940'ı 14K beyaz flat ailesine
yazar.** Sipariş anında (08-07) Etsy tarafındaki SKU `WHG-…` idi; panel
tarafı 08-11'de `HMW-…` oldu. Etsy'nin bugünkü SKU'su bu konteynerden
okunamıyor (token canlı app'e bağlı).

### B3 — 10K ürün, 14K fiyat merdiveninde (karar gerekiyor)

`HMW-R-1402` fiyat merdiveni, `WHG-R-1402` (14K beyaz flat) ile örneklenen
**36 (genişlik, beden) hücresinin hepsinde kuruşu kuruşuna aynı**:

| Hücre | HMW (10K hammered) | WHG-R-1402 (14K flat) | GLD-R-1002 (10K flat) |
|---|---|---|---|
| 5mm / 7 | $940.00 | $940.00 | $640.00 |
| 8mm / 7 | $1,840.00 | $1,840.00 | $1,220.00 |
| 12mm / 16 | $3,635.00 | $3,635.00 | $2,350.00 |

Hammered + milgrain işçiliği için bir prim meşrudur; ama 14K merdiveniyle
**kuruş bazında birebir** olması bir fiyat kararının değil, kopyalanmış
listing'in imzasıdır. 10K flat merdivenine göre %44–55 yukarıda. Canlı
fiyat olduğu için burada DOKUNULMADI.

### B4 — İki canlı listing'de gram tamamen boş (maliyet/marj imkânsız)

| Listing | Aile | Boş gram |
|---|---|---|
| `4544441878` "Solid 14K Yellow Gold Dome…" (**yıldız ürün**) | `GLD-R-1401` | 275 / 275 |
| `4543442596` "10K Solid Gold Hammered…" | `HMW-R-1402` | 225 / 225 |

Gram yoksa maliyet yok, marj yok, fiyat motoru bu satırları hesaplayamaz.
Diğer tüm canlı ailelerde gram dolu.

### B5 — Profil kodu tekil değil (yapısal)

| Kod | Başlıkta karşılığı | Önekler |
|---|---|---|
| `02` | flat **+ hammered** | GLD, RSG, WHG, **HMW** |
| `06` | basketweave **+ two-tone diamond cut** | GLD, **TTG** |

`0124` `06`'yı basketweave için kullanmış; `0127` başlığında "EON profil 06 —
Two-Tone Diamond-Cut" yazıyor. Yani kod defterinin iki ayrı tanımı var.
Sonuç: profil kodu tek başına profil anahtarı olarak kullanılamaz; `02`'de
renk öneki eklense bile ayrım yalnız `HMW`'nin varlığına dayanıyor.

### B6 — Ürün seviyesinde SKU hiç yok; iki listing hiçbir yerde SKU taşımıyor

- 42 canlı EON listing'inin **42'sinde** `products.sku` boş; aile kimliği
  yalnız varyant SKU'larında yaşıyor.
- Varyantı hiç olmayan 2 canlı listing:
  `4543000739` (sold_out, "10K Solid White Gold Dome… matte") ve
  `4553003504` ("10K white gold 6mm size 8 beveled…"). Etsy'de varyasyonsuz
  oldukları için SKU üretilmiyor.
- **07-24 siparişindeki boş SKU bunun sonucudur** (`4543000739`) — bozulma
  değil, yapısal. Ama bu iki listing SKU anahtarlı her rapora görünmez.

### B7 — Jade Gold NYC'de denetimin ön kabulü geçerli değil

118 canlı listing / 1.945 varyant. SKU'lar tedarikçi kodları
(`B1523519158`, `RWB6-9`); karat, renk ya da profil KODLAMIYOR → SKU↔başlık
karşılaştırması yapılamaz. Çakışan SKU yok, boş varyant SKU'su yok,
118'inde de `products.sku` boş. 2 başlıkta ne karat ne renk geçiyor.

## Yan gözlemler (bulgu değil, kayda geçsin)

- **Hammered'ın 2mm+3mm varyantları (50 satır) panelde 2026-08-11 16:16'da
  ZATEN silinmiş** (audit_log, aktör "Sistem"). Listing şu an 225 satır
  (4–12mm × 25 beden). Etsy tarafı buradan okunamıyor.
- `lib/pricing-engine/run.ts:69-78` `PROFILE_PATTERNS` içinde "satin center"
  ve "two tone / diamond cut" YOK → 9 satin-center + 2 two-tone canlı
  listing `detectProfile` = `null` döner. Ayrıca hammered başlığı
  `milgrain` desenine ÖNCE takılıyor → hammered listing'i motora "milgrain
  işçilik sınıfı" olarak giriyor. (Fiyat kuru koşusundaki envanter-okuma
  hatasından ayrı, bağımsız bir kusur.)
- Etsy'de olmayan 16 eski taslakta 218 varyant hâlâ 2026-07 öncesi
  obje-şekilli `properties` ve NULL SKU taşıyor. Canlı değil.

## Öneri (uygulanmadı — kullanıcı kararı bekliyor)

1. `HMW-R-1402` → doğru koda geçir (10K + hammered için yeni profil kodu;
   `02`'yi flat'e bırak). Panelde yeniden adlandır **ve Etsy'de de yaz** —
   tek yönlü değişiklik bir sonraki senkronda geri alınır.
2. Yeniden adlandırma sonrası 08-07 sipariş satırının SKU'sunu yeni kimliğe
   eşle, yoksa geçmiş rapor yanlış ailede kalır.
3. B3'ü fiyat kararı olarak ayrıca ele al: 10K hammered fiyatı kasıtlı mı,
   yoksa kopya artığı mı?
4. B4'teki 500 satıra gram gir (yıldız ürün dahil) — aksi halde marj
   raporu bu iki listing'i sessizce dışarıda bırakır.
5. Kod defterini tek dosyada sabitle (`06` çakışması), yeni profil ekleyen
   her migration önce oraya baksın.
