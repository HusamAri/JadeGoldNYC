# Jade Gold NYC — fiyatlandırma

**Kapsam:** bölüm bölüm ilerleyen zarar düzeltmesi. Bölüm sırası içerik planıyla
aynı: protection → faith → love → rings + earrings.

| Bölüm | Tarih | Varyant | Katalog değeri | Kalan zarar |
|---|---|---|---|---|
| **Koruma & Şans** (protection) | 2026-08-14 | 218 düzeltildi / 326 | $357.919 → $485.061 | **0** |
| **İnanç** (faith) | 2026-08-14 | 178 düzeltildi / 235 | $182.913 → $280.318 | 13 (bkz. §7) |
| **Sevgi & Anlam** (love) | 2026-08-15 | 107 düzeltildi / 109 | $63.701 → $82.551 | **0** |
| **Yüzükler** (rings) + **Küpeler** (earrings) | 2026-08-17 | 215 düzeltildi / 221 | $90.929 → $129.528 | **0** |

Tüm bölümlerde **fiyatı düşen varyant 0** — yalnız-yukarı kuralı (§3).
Love fiyatları 2026-08-15'te Etsy'ye itildi ve ertesi sabahki senkron
**geri okumada birebir doğrulandı** (fark 0 — tek yönlü ayna vakası tekrarlamadı).
Sıradaki bölümler ve breakeven altı varyant sayıları: **chains 158**, **legacy 110**.

## 1. Girdiler (kullanıcı tarafından doğrulandı)

| Kalem | Değer | Not |
|---|---|---|
| Tedarikçi maliyeti | **$106 / gram** | HER ŞEY DAHİL: ham altın + işçilik + taş/boncuk |
| Kargo | **$5** | Ücretsiz kargo — bedeli satıcı karşılıyor |
| Ambalaj | **$1,50** | |
| İndirim | **%15, kalıcı** | Etsy'de açık; tahsilat = liste × 0,85 |
| Etsy kesintisi | %6,5 işlem + %3 ödeme + $0,25 | |

Bu değerler `lib/jade/pricing.ts` içinde sabit olarak yaşıyor ve tarih taşıyor.
**Altın fiyatı, kargo tarifesi, Etsy komisyonu veya indirim oranı değişirse
oradaki sabitler elden geçirilmeli** — yoksa panel sessizce yanlış marj gösterir.

## 2. Neden yeni bir motor (EON'unki kullanılamazdı)

- `lib/pricing-engine/*` EON'un **yüzük** grid'i: genişlik × beden × profil.
  Jade SKU'ları bu eksenleri taşımıyor → `buildPricingDiff` her Jade satırını
  `unknown` döndürüyor. Bu arıza değil, koruma.
- **EON'un işçilik kalibrasyonu Jade'e uygulanamaz.** Tamsan faturalarından
  çıkan parça-başı işçilik ($54 düz / $74 süslü) EON'un üreticisine kilitli
  (`organizations.gold_settings.labor_model='per_piece'`, yalnız EON'da).
  O modeli 0,37 gramlık bir charm'a uygulamak — işçilik tek başına satış
  fiyatını aşıyor — `docs/second-brain.md`'de kayıtlı hatanın tekrarı olurdu.
- Jade'in $106/g maliyeti zaten işçiliği içeriyor → **ayrı işçilik kalemi yok.**

## 3. Formül

```
maliyet = gram × $106 + $5 (kargo) + $1,50 (ambalaj)
liste   = (maliyet + $0,25) / (0,85 × (0,905 − hedef_marj))
```
Tam dolara yukarı yuvarlanır. Hedef marj **%20**.

**Yalnız YUKARI:** hesaplanan hedef mevcut fiyatın altındaysa fiyat korunur.
Gerekçe ticari: %70 marjla satan Italian Horn'u formüle çekmek ciroyu bedelsiz
yakar. Formül zarar kapatmak için var, fiyat "normalleştirmek" için değil.

**Hero istisnası — kademeli:** `1203090834` (14K Evil Eye Pendant, 1.466 satış,
mağaza ünitelerinin ~%24'ü) hedefi $77 ama **$69**'da tutuldu (breakeven $60).
Sebep: hacim motorunda tek seferde %43 zam talebi öldürebilir. 30 gün sonra
dönüşüm korunuyorsa ikinci adım değerlendirilir.

**Hero istisnası 2 — love (2026-08-15):** `1739245557` (10K Heart Nugget Ring,
**194 satış**, love'ın hacim lideri) 40 varyantının 40'ı zarardaydı. Hedef marj
$295–972 demekti (+%36…+%51); bunun yerine **breakeven**e çekildi
($256–847, +%24,3 ortalama). Evil Eye ile aynı gerekçe: en çok satanda tek
seferlik büyük zam ivmeyi kırar. Bu listing'de ayrıca **beden emniyeti** var
(§4c).

## 4. Bulgu ve sonuç — Koruma & Şans (2026-08-14)

**326 varyantın 218'i (%67) breakeven'in ALTINDA satıyordu.**

Hero örneği: $54 liste → $45,90 tahsilat, maliyet $45,72, Etsy kesintisi $4,61
→ **net −$4,43 (marj −%9,7)**. Mağazanın en çok satan ürünü her satışta zarar
ediyordu.

| Ölçüt | Önce | Sonra |
|---|---|---|
| Zararda varyant | **218 / 326** | **0** |
| En düşük marj | −%42,3 | **+%12,1** |
| Ortalama marj | — | **+%26,2** |
| Fiyatı düşen | — | 0 (yalnız-yukarı kuralı) |
| Katalog değeri | $357.919 | $485.061 |

En ağır düzeltmeler: Diamond Panther $590 → $1.122 (maliyeti $672 idi),
Puffed Evil Eye $114/119 → $206, CZ Hoop Huggie $274 → $484,
Hamsa Pendant $237 → $413, Pharaoh $260 → $409.

## 4b. İnanç bölümü (2026-08-14)

Bu bölüm o gün düzeltildi ama **dokümana hiç yazılmamıştı**; aşağıdaki rakamlar
`audit_log`'daki before/after diff'inden geri kazanıldı (2026-08-15).

| Ölçüt | Değer |
|---|---|
| Fiyatı değişen varyant | **178** / 235 |
| Katalog değeri | $182.912,64 → **$280.318,00** (+%53,3) |
| Fiyatı düşen | **0** |
| En düşük eski fiyat | $185,00 |
| En yüksek yeni fiyat | $4.370,00 |
| Kalan breakeven altı | **13** (12'si tek listing, §7) |

## 4c. Sevgi & Anlam bölümü (2026-08-15)

**109 varyantın 78'i (%72) breakeven altındaydı** — oransal olarak protection'dan
da kötüydü, yalnız 29 varyant sağlıklıydı.

| Ölçüt | Önce | Sonra |
|---|---|---|
| Breakeven altı | **78 / 109** | **0** |
| Katalog değeri | $63.701 | **$82.551** (+%29,6) |
| Fiyatı düşen | — | **0** |
| Dokunulmayan | — | 2 (gramı NULL) |

| Listing | Var. | Eski | Yeni | Artış |
|---|---|---|---|---|
| 1713308864 Nugget Heart Pendant | 48 | $144–1.103 | $194–1.742 | +%32,5 |
| 1739245557 Heart Nugget Ring ⚑ | 40 | $217–643 | $256–847 | +%24,3 |
| 1467444368 Graduated Hoop | 4 | $168–552 | $259–825 | +%56,6 |
| 1652142260 Heart Bamboo Hoop | 3 | $301–925 | $321–949 | +%3,5 |
| 1821803697 Heart Nugget Earrings | 3 | $145–380 | $217–565 | +%50,9 |
| 1230866961 Graduated Heart Hoop | 2 | $450–671 | $820–1.043 | +%66,2 |
| 1656788008 Puffed Heart Hoop | 2 | $1.051–1.676 | $1.146–1.809 | +%8,4 |
| 1834635671 Puffed Hoop | 2 | $558–1.002 | $595–1.016 | +%3,3 |
| 1232906923 Heart Hoop | 1 | $1.497 | $1.846 | +%23,3 |
| 1448783390 Butterfly Charm | 1 | $546 | $588 | +%7,7 |
| 1726181962 Teddy Bear Bracelet | 1 | $758 | $1.436 | +%89,4 |

### Beden emniyeti — `1739245557` (geçici fiyat, geri dönülecek)

Bu listing'de 10 beden (5–9.5) **aynı gramı ve aynı fiyatı** paylaşıyor; beden
ağırlığa hiç yansıtılmamış. 40 varyanttan **yalnız biri ölçülmüş**: `RHN2-7`
(`weight_source='shipstation'`), yani beden **7** — aralığın ortası. Kalan 39'u
`description` kaynaklı.

Bu, `1520386344` hatasının daha hafif bir sürümü: gram ile fiyat kendi aralarında
tutarlı (ikisi de genişliğe göre değişiyor), ama **beden ekseni hiç modellenmemiş**.
İlan edilen gram orta bedeni temsil ettiği için 7.5–9.5 aralığında maliyet EKSİK
hesaplanıyor — düz breakeven uygulamak büyük bedenleri zararda bırakırdı.

Yüzük ağırlığı iç çevreyle ~lineer artar; beden 7 → 9.5 için
19,41 mm / 17,35 mm ≈ **+%12**. Bu yüzden breakeven **gram × 1,12** ile hesaplandı:

| Aile | Gram | Eski | Yeni |
|---|---|---|---|
| RHN1 | 1,60 | $217 | $256 |
| RHN2 | 1,77 | $243 | $282 |
| RHN3 | 2,94 | $384 | $463 |
| RHN4 | 5,43 | $643 | $847 |

**Bu bir tahmindir, ölçüm değil.** Ekipten 40 varyantın beden bazlı gramı istendi;
geldiğinde fiyatlar yeniden hesaplanmalı. Doğrulama SQL'i emniyetli varsayımla da
koşuldu: gram × 1,12 ile bile breakeven altı **0**.

### Ayrıca işaretli

- **`1726181962`** (Teddy Bear Bracelet, +%89,4): tek varyantlı, gramı
  `description` kaynaklı yani **tahmin**, yalnız 2 satışı var. Zam yönü doğru
  ama dayanağı zayıf — tartılana kadar şüpheli sayılır.
- **`PNUG2-3` ailesinde eski fiyatlar monoton değildi** (18" $719 → 20" $831 →
  22" $820; uzun zincir daha ucuz). Yeni hesap monoton çıktı
  ($875 → $939 → $1.002), tutarsızlık kendiliğinden onarıldı. Kaynağı elle
  girilmiş fiyatlar.

## 4d. Yüzükler + Küpeler (2026-08-17)

**221 varyantın 169'u breakeven altındaydı** (rings 134/174, earrings 29/41 +
6 gramsız). 215 varyant düzeltildi; earrings'in hacim lideri `1201031517`
(156 satış) zaten sağlıklıydı, yalnız-yukarı kuralı onu korudu (+%4,5).

| Ölçüt | Önce | Sonra |
|---|---|---|
| Breakeven altı | **169 / 221** | **0** |
| Katalog değeri | $90.929 | **$129.528** (+%42,5) |
| Fiyatı düşen | — | **0** |
| Dokunulmayan | — | 6 (gramı NULL, earrings) |

### Hero — `1219136707` (Men's Nugget Ring, 386 satış: mağazanın en çok satanı)

60 varyantın 60'ı zarardaydı; en ucuz aile $147'de, breakeven'i $261. Love
hero'suyla aynı beden tuzağı: 12 beden (7–12,5) aile başına tek gramı
paylaşıyor. Ölçülen iki nokta (`R14-11` 2,29g, `R15-9` 2,88g) ilan edilen
gramın orta bedeni temsil ettiğini doğruladı. **Emniyetli breakeven** (gram ×
1,16; beden 9 → 12,5 çevre oranı) uygulandı:

| Aile | Gram | Eski | Yeni |
|---|---|---|---|
| R49 | 1,83 | $147 | $302 |
| R14 | 2,30 | $263 | $377 |
| R15 | 3,12 | $366 | $508 |
| R16 | 5,00 | $487–538 | $808 |
| R50 | 5,59 | $645 | $903 |

Hedef marj değil breakeven — 386 satışlık üründe tek seferlik %90 zam ivmeyi
öldürür; kademeli plan hero istisnasıyla aynı (30 gün sonra ikinci adım).

### `1743975353` — ölçüm ilan edilen gramı yalanladı

42 varyant aile başına 3,56g ilan ediyor; ölçülen `RCZOV-10` **4,38g** (+%23).
Yani OV ailesinde ilan edilen gram beden 10'un bile altında. REC/SQ aileleri
hedef %20 ($641) aldı; **OV ailesine taban kondu**: beden 12,5'e ölçeklenmiş
kötümser gram (4,38 × çevre oranı ≈ 4,84g) ile breakeven $676 > $641 →
OV paylaşılan varyantlar **$676**, ölçülen `RCZOV-10` kendi gramıyla $787.

### Diğerleri

- `1865969006` (alyans, 30 varyant): hedef %20. Ölçümler ilan = orta beden
  desenini doğruladı (`RWB5-10` 4,20g ≈ 3,82 × 1,116 tahmini); hedef %20,
  ×1,12 kötümser breakeven'i her ailede aşıyor — ayrı taban gerekmedi.
- `1743489483` (42 varyant): hedef %20. Ölçümler bedenle **monoton artmıyor**
  (2,76g @ 10,5 < 3,38g @ 7) — ağırlık taş/kafa baskın, beden payı gerekmez.
- Earrings 11 listing: hedef %20, gram varyant başına (beden tuzağı yok).

### Altın olmayan kayıtlar (motor dışı)

- **`1454572095`** (925 gümüş tenis bileziği): altın motoru $1.306 breakeven
  biçiyordu, ürün $34–39 bandında satılıyor — gümüş ~$1/g, uygulanamaz.
  Yanlış bölümdeydi (rings); **chains'e taşındı ve kilitlendi**. Chains
  fiyatlanırken de DIŞLANMALI; istenirse ayrı gümüş maliyet modeli kurulur.
- **`1593402358`** ("Shipping Upgrade", legacy): ürün değil kargo hizmeti.
  Legacy fiyatlanırken dışlanmalı.
- Bu ikisi dışında katalogdaki **tüm** listingler karat işareti taşıyor
  (başlıkta 10K/14K/…) — karat taraması tüm bölümlerde koşuldu.

## 5. Yan düzeltmeler

- **`products.discount_pct = 15`** (116 aktif listing). Etsy API aktif Sale'i
  vermiyor (migration `0115`), değer elle taşınır. Bu yazılmadan önce panel
  tüm marjları indirimsiz fiyattan hesaplıyordu ve `discount_below_melt`
  uyarısı hiç ateşlenmiyordu.
- **`panelPushAll` org sızıntısı düzeltildi:** `FLAT_FIX_TARGETS` iki EON
  listing'i taşıyor ama döngü org süzgeci olmadan koşuyordu — Jade oturumunda
  push'a basmak Jade'in token'ıyla EON listing'ine yazmaya çalışıyor, iki
  başarısız çağrı + boşa yanan günlük kota üretiyordu.

## 6. Doğrulama

- Formül `lib/jade/pricing.ts`'te; SQL uygulaması ile TS motoru **protection'da
  2.071 gram değerinde**, **love'da 107 varyantın tamamında** çapraz tarandı —
  ikisinde de **0 sapma** (formül üç yerde yaşıyor: TS motoru, SQL, XLSX/.numbers
  üreteçleri → drift riski gerçek).
- Ters-kontrol: üretilen her fiyat için `liste×0,85 − kesinti − maliyet`
  hedef marja oturuyor (15/15 gram değeri).
- Yazma sonrası SQL: zararda varyant 0, fiyatı düşen 0.
- **Love'da transkripsiyon mührü:** SQL kümesi dosyaya taşınırken 6 checksum
  (satır sayısı, fiyat toplamı, hesap toplamı, **konum-ağırlıklı** `Σ i·hesap`,
  gram toplamı, hero sayısı) karşılaştırıldı — 6/6 tuttu. Ağırlıklı checksum
  satır kaymasını yakalar, düz toplam yakalamaz.
- **Geri alma güvencesi:** love UPDATE'i sonrası `audit_log`'da 107 satır,
  107 farklı varyant — before/after diff'i mevcut.

## 7. Açık veri sorunları

- **`1520386344`** (10K Last Supper Pendant, faith): 24 varyantın **hepsi 6,21g**
  ama fiyatlar $216–$2.027. Zincir boyu grama hiç yansıtılmamış → gram yapısal
  olarak kullanılamaz. **12 varyant bu yüzden fiyatlanmadı** ve faith'teki kalan
  13 zararın 12'si budur. Gerçek gram şart.
- **`PCRCZ-1`** (14K CZ Jesus Cross, faith): 3,00g, fiyat $398, breakeven $423 —
  faith'teki tek gerçek ıska, $25 açık. Gramı `description` kaynaklı.
- **`1209955532`** (10K Cornicello Pendant): `products.weight_grams = 12,50`
  ama fiyatı $51,60. 12,5g × $106 = $1.325 maliyet — imkânsız. Gram hatalı,
  varyantı da yok → fiyatlanamadı. Gram düzeltilmeli.
- **`1228157956`** (Hamsa, P16F): varyant gramları NULL. Kullanıcı 0,77g
  bildirdi ama DB'de yok → fiyatlanamadı. Girilirse hedef ~$147.
- **Love'da gramı NULL 2 varyant** (`1230866961`, `1232906923`) — gram çalışma
  dosyasında ekip girişini bekliyor, fiyatlanmadı.
- **Satış senkronu 5 Ağustos'tan beri bayat** — ölçüm için tazelenmeli.

## 8. Sıradaki adım

Panelden Etsy'ye push. **Sıra kritik:** DB artık yeni fiyatları taşıyor ama
Etsy eski fiyatlarda. Arada Etsy senkronu koşarsa canlı (eski) fiyatlar
paneldeki yeni fiyatların ÜSTÜNE yazar ve emek kaybolur — push gecikmemeli.

Geri alma: `restoreVariantPricesFromAudit(productId)` (audit_log diff'inden)
veya `restoreVariantPricesFromEtsy(productId)` (canlıdan yeniden senkron).
