# Jade Gold NYC — fiyatlandırma

**Tarih:** 2026-08-14 · **Kapsam:** Koruma & Şans bölümü (326 varyant)

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

## 4. Bulgu ve sonuç

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

- Formül `lib/jade/pricing.ts`'te; SQL uygulaması ile TS motoru **2.071 gram
  değerinde çapraz tarandı, 0 sapma** (iki yerde formül = drift riski).
- Ters-kontrol: üretilen her fiyat için `liste×0,85 − kesinti − maliyet`
  hedef marja oturuyor (15/15 gram değeri).
- Yazma sonrası SQL: zararda varyant 0, fiyatı düşen 0.

## 7. Açık veri sorunları

- **`1209955532`** (10K Cornicello Pendant): `products.weight_grams = 12,50`
  ama fiyatı $51,60. 12,5g × $106 = $1.325 maliyet — imkânsız. Gram hatalı,
  varyantı da yok → fiyatlanamadı. Gram düzeltilmeli.
- **`1228157956`** (Hamsa, P16F): varyant gramları NULL. Kullanıcı 0,77g
  bildirdi ama DB'de yok → fiyatlanamadı. Girilirse hedef ~$147.
- **Satış senkronu 5 Ağustos'tan beri bayat** — ölçüm için tazelenmeli.

## 8. Sıradaki adım

Panelden Etsy'ye push. **Sıra kritik:** DB artık yeni fiyatları taşıyor ama
Etsy eski fiyatlarda. Arada Etsy senkronu koşarsa canlı (eski) fiyatlar
paneldeki yeni fiyatların ÜSTÜNE yazar ve emek kaybolur — push gecikmemeli.

Geri alma: `restoreVariantPricesFromAudit(productId)` (audit_log diff'inden)
veya `restoreVariantPricesFromEtsy(productId)` (canlıdan yeniden senkron).
