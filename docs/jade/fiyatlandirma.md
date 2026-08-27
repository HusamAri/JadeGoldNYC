# Jade Gold NYC — fiyatlandırma

**Kapsam:** bölüm bölüm ilerleyen zarar düzeltmesi. Bölüm sırası içerik planıyla
aynı: protection → faith → love → rings + earrings → chains + legacy.

| Bölüm | Tarih | Varyant | Katalog değeri | Kalan zarar |
|---|---|---|---|---|
| **Koruma & Şans** (protection) | 2026-08-14 | 218 düzeltildi / 326 | $357.919 → $485.061 | **0** |
| **İnanç** (faith) | 2026-08-14 | 178 düzeltildi / 235 | $182.913 → $280.318 | 13 (bkz. §7) |
| **Sevgi & Anlam** (love) | 2026-08-15 | 107 düzeltildi / 109 | $63.701 → $82.551 | **0** |
| **Yüzükler** (rings) + **Küpeler** (earrings) | 2026-08-17 | 215 düzeltildi / 221 | $90.929 → $129.528 | **0** |
| **Zincirler** (chains) + **Miras** (legacy) | 2026-08-17 | 658 düzeltildi / 975 | $1.919.235 → $2.195.369 | **0** |

Tüm bölümlerde **fiyatı düşen varyant 0** — yalnız-yukarı kuralı (§3).
Love fiyatları 2026-08-15'te Etsy'ye itildi ve ertesi sabahki senkron
**geri okumada birebir doğrulandı** (fark 0 — tek yönlü ayna vakası tekrarlamadı);
rings+earrings itişi 2026-08-17 21:36 UTC'de aynı yolla doğrulandı.

**Bölüm turu bitti.** Gramı olan tüm katalog fiyatlandı; kalan işler yalnız
veri bekleyenler: gramsız 121 varyant (ekip dosyası), `1520386344` (bozuk gram)
ve tartım işaretli listingler (§7).

## 1. Girdiler (kullanıcı tarafından doğrulandı)

| Kalem | Değer | Not |
|---|---|---|
| Tedarikçi maliyeti | **$106 / gram** | HER ŞEY DAHİL: ham altın + işçilik + taş/boncuk |
| Kargo | **$5** | Ücretsiz kargo — bedeli satıcı karşılıyor |
| Ambalaj | **$1,50** | |
| İndirim | **1/3 (%33,3), kalıcı** | Etsy'de açık; tahsilat = liste × 0,667. Tarihçe: %15 (→08-20) → %25 (§9) → 1/3 (§10) |
| Etsy kesintisi | %6,5 işlem + %3 ödeme + $0,25 | Ağustos siparişlerinde ölçüldü: %9,1–10,6 ✓ |
| Hedef marj | **%25** | §10 kararı; önceki değer %20 |

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
liste   = (maliyet + $0,25) / ((1 − indirim) × (0,905 − hedef_marj))
```
Tam dolara yukarı yuvarlanır. Güncel değerler: indirim **1/3**, hedef marj **%25**
→ payda `0,667 × 0,655 = 0,436667`. (Bu satır 2026-08-27'de güncellendi; eskiden
payda `0,85 × 0,705` idi ve indirim iki kez değiştiği için sabit kodlanmış `0,85`
sessiz çürümenin kaynağıydı — §9, §10.)

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

## 4e. Zincirler + Miras (2026-08-17)

Katalogun en büyük dalgası: **47 listing, 975 gramlı varyant** (chains 27 +
legacy 20; gümüş bilezik dışlandı). **273'ü breakeven altındaydı.**

| Ölçüt | Önce | Sonra |
|---|---|---|
| Breakeven altı | **273 / 975** | **0** (kötümser gramla da 0) |
| Katalog değeri | $1.919.235 | **$2.195.369** (+%14,4) |
| Fiyatı düşen | — | **0** |
| Zamlanan | — | 658 |
| Dokunulmayan | — | 106 gramsız + gümüş 6 |

Rings dersine uygun olarak tek şablon uygulanmadı; dört kural:

| Kural | Kapsam | Sonuç |
|---|---|---|
| Hedef %20 | 42 listing / 853 varyant | +%14,7 |
| Hero breakeven | `1195581074` (25) | +%10,5 |
| Boy-ölçekli breakeven | `4348066009`, `1355681376`, `1442796773` (72) | +%5,6 |
| ×1,18 + hedef %20 | `1485089843` (25) | +%28,1 |

### Hero — `1195581074` (Miami Cuban Bracelet, 180 satış)

25 gramlı varyantın 25'i zarardaydı. Beş ölçüm gram merdivenini **doğruladı**
(`BMC1-7`=2g taban, boyla lineer) → emniyet payı gereksiz, düz **breakeven**.
Kademeli plan diğer hero'larla aynı: hedef marj değil, önce zarar kapama.

### Boy paylaşımı — üç listing (geçici fiyat, tartım işaretli)

`4348066009` (Rolo, 21), `1355681376` (Valentino bilezik, 21), `1442796773`
(Valentino kolye, 30): genişlik başına TEK gram, tüm boylar paylaşıyor —
`1520386344` deseninin hafif hali. Fiyat boyla artıyor ama gram artmıyor;
kolyede 16"→24" gerçek fark ~%50. Hiçbirinde ölçüm yok. Varsayım: **ilan
edilen gram en kısa boyu temsil eder** (fiyat merdiveni boy oranıyla örtüşüyor);
etkin gram = ilan × boy/en-kısa-boy ile **breakeven** kondu. Tahmin gram
üstüne marj zammı bilerek YAPILMADI — bu üç listing hedef %20'ye ancak gerçek
tartım gelince çekilecek.

### `1485089843` (14K Beaded Ball) — ölçüm ilanı yalanladı, rings vakası (b)

`CM42F-20` ölçümü **6,7g**; ilan merdiveni 20" için ~5,67g diyor (+%18) ve
ölçüm 22" ilanından (6,23g) bile ağır. Tüm listing **gram × 1,18** ile hedef
%20 aldı. Yan kazanç: `CM40F-22`'nin **$14'lık placeholder fiyatı** (2,11g
zincir!) formülle $373'e oturdu — love turunda işaretlenen saçma fiyat
kendiliğinden düzeldi.

### En büyük düzeltmeler

| Listing | Var. | Eski | Yeni | Artış |
|---|---|---|---|---|
| 1849001180 Figaro Chain 10K | 30 | $156–2.561 | $224–4.229 | +%52,8 |
| 1764133503 Miami Cuban CZ | 15 | $2.980–7.235 | $3.994–10.749 | +%49,5 |
| 1849022518 Rope Chain 10K | 25 | $1.575–5.075 | $2.626–7.910 | +%46,8 |
| 4375720322 Rope Bracelet White | 28 | $421–4.694 | $590–6.640 | +%46,0 |
| 1296858064 Bead Ball Chain | 20 | $626–4.331 | $887–6.014 | +%42,0 |
| 1891642136 Franco Chain | 25 | $330–2.164 | $454–2.948 | +%33,9 |
| 1906361879 Cuban Curb | 40 | $204–6.701 | $254–8.741 | +%32,6 |
| 1283581532 Miami Cuban (98 satış) | 40 | $304–7.675 | $742–9.831 | +%21,6 |

Yüksek satışlı sağlıklı listingler (`1199260535` 442, `1296896712` 383,
`1336346678` 154, `1195517566` 152 satış) hedef %20 kuralına girdi ama zaten
hedefe yakındılar: dördü toplam **+%1,3**, en büyük tekil zam +%26 (tek varyant).
İvme riski yok.

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
- **Chains+legacy (975 satır):** SQL kümesi `json_agg` + **md5 mührü** ile tek
  parçada dışa alındı (transkripsiyon riski sıfır), TS motoru 975 satırın
  TAMAMINDA koşuldu — **0 sapma** (boy-ölçekleme ve ×1,18 dahil; SQL `numeric`
  ↔ JS `double` yuvarlama kenarı çıkmadı). UPDATE sonrası: audit 658 satır
  (= zam sayısı birebir), breakeven altı ilan gramıyla 0, kötümser gramla 0,
  toplam cent önizlemeyle birebir.

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
- **Boy paylaşımlı üçlü** (`4348066009`, `1355681376`, `1442796773`): fiyatlar
  boy-ölçekli TAHMİN gramla kondu, geçici. 72 varyant gram çalışma dosyasında
  "boy bazlı tartım gerekli" işaretli.
- **`1485089843`**: ×1,18 emniyet payı da tahmindir; 25 varyant tartım işaretli.
  `CM40F-22` eski fiyatı $14'tı (placeholder) — kayıt olarak not edildi.
- **Chains+legacy gramsız 106 varyant** — ekip dosyası dönene kadar fiyatsız.
- **Satış senkronu 5 Ağustos'tan beri bayat** — ölçüm için tazelenmeli.

## 8. Sıradaki adım

Panelden Etsy'ye push. **Sıra kritik:** DB artık yeni fiyatları taşıyor ama
Etsy eski fiyatlarda. Arada Etsy senkronu koşarsa canlı (eski) fiyatlar
paneldeki yeni fiyatların ÜSTÜNE yazar ve emek kaybolur — push gecikmemeli.

Geri alma: `restoreVariantPricesFromAudit(productId)` (audit_log diff'inden)
veya `restoreVariantPricesFromEtsy(productId)` (canlıdan yeniden senkron).

## 9. İndirim yeniden kalibrasyonu — %15 → %25 (2026-08-20)

**Girdi değişti, sabit değişti.** Mağaza geneli indirim %25'e çekildi (Etsy'de
shop-wide asgarî 25 giriliyor); canlı siparişlerde SALE25 kuponu görüldü.
`JADE_DISCOUNT_RATE` 0,15'te kalsaydı motor "hedef %20" derken fiilen **%12,3**
marj üretirdi ve **89 varyant breakeven'in ALTINDA** kalırdı — panel sessizce
yanlış marj gösteren duruma düşerdi (§1'deki uyarının tam karşılığı).

### Neden düz oran, formül değil

Eski fiyatlar `liste × 0,85` varsayımıyla kurulmuştu. Her fiyata
**× (0,85 / 0,75) = ×1,1333** uygulandı (tam dolara yukarı yuvarlama, yalnız-yukarı):

```
yeni × 0,75  ==  eski × 0,85     →  net tahsilat BİREBİR korunur
```

Bu, formülü yeniden koşmaktan **daha doğru**: formül yeniden koşulsaydı hero
listinglerinde bilerek verilen **kademeli breakeven kararları** ve beden/boy
**emniyet payları** silinir, o ürünler tek hamlede hedef marja fırlardı. Düz
oran her varyantın *amaçlanan* marj konumunu koruyup yalnız indirim tabanını
yeniler.

### Kapsam — bu kez istisnasız

| Grup | Varyant | Kural |
|---|---|---|
| Gramlı (motor) | 1.835 | ×1,1333 |
| **Gramsız** | **123** | ×1,1333 *(kullanıcı talimatı: aynı oranda)* |
| Bozuk gram (`1520386344`) | 24 | ×1,1333 |
| Gümüş (`1454572095`) | 6 | ×1,1333 |
| **Toplam** | **1.988** | fiyatı düşen **0** |

Gramsız/gümüş/bozuk-gram grubu altın motoruna giremez ama **indirim değişimi
metalden bağımsızdır** — %25'e düşen taban her ürünü aynı oranda etkiler.

### Sonuç

| Ölçüt | Öncesi (%25 indirimde) | Sonrası |
|---|---|---|
| Ortalama marj | %12,3 | **%21,5** |
| Breakeven altı | 89 | **0** |
| Katalog listesi | $3.888.758 | **$4.408.200** (+%13,36) |
| Fiyatı düşen | — | **0** |

Alıcının gördüğü fiyat da ~%13 artar (indirim oransal olduğu için). Hedef marjın
altında kalan 179 varyant, bilerek breakeven'de tutulan hero/emniyet satırlarıdır
— kademeli plan korundu.

### Doğrulama

- TS motoru yeni sabitle (0,25) 36 varyantta marj karşılaştırması: **0 sapma**;
  `jadeCostCents(3,73g)` = $401,88 (beklenen değer).
- UPDATE öncesi hesaplanan **md5 mührü** ile UPDATE sonrası canlı fiyatların
  mührü **birebir aynı** (`8aa1b019…`) — satır kayması/kısmi yazma yok.
- Toplam cent önizlemeyle birebir; `audit_log`'da **1.988 satır** (tam geri alma).
- Breakeven altı 0; ortalama marj %21,5 (indirim öncesi seviyeyle aynı).

### ⚠️ Bu UPDATE bir daha koşulmaz — ön koşul mührü

Taban kaydırma **idempotent değildir**: aynı `×1,1333` ikinci kez koşarsa sessizce
bileşikleşir (×1,2844). Nitekim koştu — bağlam devrinden sonra UPDATE tekrar
gönderildi, katalog $4.996.847'ye çıktı ve 1.988 varyant ~%13,3 fazla fiyatlandı.
`audit_log`'un satır-satır `before` kaydından geri alındı; `ceil()` yuvarlaması
yüzünden aritmetik geri alma (bölme) mümkün DEĞİLDİR, tek yol audit'tir. Etsy'ye
itiş yapılmamıştı, hata panelden dışarı çıkmadı.

Yeniden koşmadan önce **girdi durumunu** doğrula — canlı mühür aşağıdakine eşitse
kaydırma zaten uygulanmıştır, **koşma**:

```sql
select md5(string_agg(v.id::text||':'||v.price_cents::text, ',' order by v.id))
from products p join product_variants v on v.product_id=p.id and v.org_id=p.org_id
where p.org_id='f155b853-dfaf-48fd-94c5-ddfcb856e07c'
  and p.etsy_deleted_at is null and v.price_cents is not null;
-- kaydırma SONRASI: 8aa1b019932fd73da355cf88b6feaede / toplam 440820000 cent
```

> **ARTIK GEÇERSİZ (2026-08-27):** yukarıdaki mühür §10'daki ikinci kaydırmayla
> aşıldı. Güncel ön koşul mührü §10'dadır; buradaki değer yalnız tarihsel kayıt.

Önce/sonra mührü tek başına yetmez: ikinci koşu da kendi mühür kontrolünden
geçer, çünkü o mühür "yazmak istediğini yazdı mı?" der, "koşmalı mıydı?" demez.

### Offsite Ads — ÖLÇÜLDÜ (2026-08-27), risk küçük

§9 yazıldığında bu risk "ölçülemiyor" diye açık bırakılmıştı (satış senkronu
5 Ağustos'tan beri bayattı). Senkron 20 Ağustos'ta tazelendi ve ölçüm yapıldı:
Ağustos siparişlerinde gerçek Etsy kesintisi **%9,1–10,6** — motorun
`JADE_ETSY_RATE = 0.095` varsayımı doğru, korkulan ~%24,5'lik Offsite yaygınlığı
**yok**. Kesinti oranı `etsy_fees_cents / (item_total − discount)` ile ölçülür;
`sales.etsy_fees_cents` yalnız ödeme senkronu koştuğunda dolar (Ağustos'ta
68 siparişin 52'sinde doluydu), o yüzden örneklem kısmidir.

## 10. İndirim %25 → 1/3 + hedef marj %20 → %25 (2026-08-27)

### Ne değişti (dış dünya)

İndirim oranı bir hafta içinde **iki kez** değişti ve panel ikisini de görmedi.
Sipariş verisinden ölçülen gerçek oran:

| Dönem | İndirim |
|---|---|
| 1–9 Ağustos | %25 (SALE25) |
| 10–18 Ağustos | %17,6 |
| **20 Ağustos →** | **%33,3 = tam 1/3** (46836/140509 = 0,33333) |

Kullanıcı 27 Ağustos'ta "kalıcı, mağaza geneli" diye doğruladı. Ayrıca 57 yeni
ürün / 460 varyant panele eklendi ama `etsy_listing_id IS NULL` — Etsy'de
yayınlanmamış, bu yüzden kaydırma kapsamı DIŞINDA tutuldu.

### Çürüme (§9'un birebir tekrarı)

Sabit 0,25'te kalınca motor "hedef %20" derken fiilen:

| Mevcut fiyatlarla | Motorun sandığı (%25) | Gerçek (1/3) |
|---|---|---|
| Breakeven altı | 0 | **47 varyant** |
| Ortalama marj | %21,95 | **%13,42** |

### Karar ve oran

İki değişiklik aynı UPDATE'te birleştirildi (kullanıcı kararı):
indirim 0,25 → 1/3 **ve** hedef marj %20 → %25.

Oran motorun kendi paydasından türetildi — `liste = (maliyet+sabit) / (NET × (0,905 − marj))`:

```
eski payda = 0,75      × (0,905 − 0,20) = 0,52875
yeni payda = (1 − 1/3) × (0,905 − 0,25) = 0,436667
oran = 0,52875 / 0,436667 = 1,21088
```

Formül YENİDEN KOŞULMADI, taban kaydırıldı (§9'daki gerekçe: yeniden üretim
hero/emniyet kararlarını siler). Hedef marj yükseltmesinin gerekçesi indirim
telafisinden ayrıdır: derin indirim hacim getirmiyor — %17,6 döneminde 9 günde
~35 sipariş, %33,3 döneminde 7 günde ~14. **Elastikiyet ölçülmedi**; bu bir
karardır, ölçüm değil.

### Sonuç

| | Önce | Sonra |
|---|---|---|
| Kapsam | — | 2.013 canlı varyant (149 gramsız dahil, taslak 460 hariç) |
| Katalog | $4.456.522 | **$5.397.326** (+%21,11) |
| Breakeven altı (1/3 ile) | 47 | **0** |
| Ortalama marj (1/3 ile) | %13,42 | **%26,84** |
| Fiyatı düşen | — | **0** |

### Doğrulama

- Ön koşul: UPDATE öncesi canlı mühür = beklenen kaydırma-öncesi mühür
  (`5eedd8be3426ee3f1d666b99cd9bb36b`) → iş henüz koşmamıştı.
- UPDATE sonrası canlı mühür = önizlemede hesaplanan hedef mühür, **birebir**.
- TS motoru bağımsız koşuldu; oranı 1,21087786 üretti (SQL: 1,21087803).
  Sapma 1,4e-7 → **2013/2013 satırda iki oran da aynı sonucu verdi**, yuvarlama
  hiçbir satırı kaydırmadı.
- Yayınlanmamış 460 taslak varyanta **0 dokunuş** (ayrı sorguyla doğrulandı).

### ⚠️ Ön koşul mührü — bu UPDATE bir daha koşulmaz

```sql
select md5(string_agg(v.id::text||':'||v.price_cents::text, ',' order by v.id)),
       sum(v.price_cents)
from products p join product_variants v on v.product_id=p.id and v.org_id=p.org_id
where p.org_id='f155b853-dfaf-48fd-94c5-ddfcb856e07c'
  and p.etsy_deleted_at is null and p.etsy_listing_id is not null and v.price_cents > 0;
-- kaydırma SONRASI (mevcut, doğru durum): 5eab3c6911ac756d6a150fed1c5ea94a
-- toplam: 539732600 cent
-- Canlı mühür buysa iş YAPILMIŞTIR — tekrar koşma, bileşikleşir.
```

### Açık kalemler

1. **Etsy'ye itilmedi.** Fiyatlar DB'de güncel, Etsy'de eski — `/fiyat` →
   `panelPushAll`. İtilmeden marj kazanımı gerçekleşmez.
2. **4 varyantsız listing** (`1209955532`, `1806033692`, `4540886291` aktif;
   `1593402358` sold-out) fiyatı `products.price_cents`'te taşıyor. Ne bu
   kaydırmaya ne de §9'unkine girdiler; `panelPushAll` da onları sessizce
   atlıyor (`priceBySku.size === 0 → continue`). Etsy'de elle düzeltilmeli.
3. **Yeni koleksiyon (57 ürün / 460 varyant)** yayınlanmadan önce %33,3 + %25
   hedefe göre fiyatlanmalı — bu turda kapsam dışıydı.
4. **İndirim oranı düzenli ölçülmeli.** İki kez sessizce çürüdü. Ölçüm:
   `sum(discount_cents)/sum(item_total_cents)` son 7 günde; sabitten saparsa
   `JADE_DISCOUNT_RATE` güncellenir.
