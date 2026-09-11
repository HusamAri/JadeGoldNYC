# EON Meridian — iki tonlu alyans (2026-09-11)

Sahibin isteği: **4–7 mm genişlik, 1,5 mm kalınlık, US bedenler (yarım dahil),
tek yüzükte iki metal, metal varyasyonu YOK; üç ayar TEK listing'de varyant
olarak.** Bu paket o listing'in repo-yerli kaynağıdır.

Panelde **taslak olarak duruyor** (`EON-MERID-TT`, `etsy_listing_id = NULL`).
**Etsy'ye hiçbir şey yazılmadı** — gönderim aşağıdaki onay kapısına bağlı.

## Yapı: tek listing, üç eksen

| | |
|---|---|
| listing | `EON-MERID-TT` (1 adet) |
| eksenler | `Width` × `Ring Size` × `Karat` |
| genişlik | 4, 5, 6, 7 mm |
| beden | US 3 – US 13, yarım bedenler dahil (21) |
| ayar | 10K / 14K / 18K (varyant, ayrı listing değil) |
| kombinasyon | 4 × 21 × 3 = **252** (Etsy sınırı 400) |
| galeri | tek listing → **10 görsel yeter** |

Yönetişim dosyası (`eon-etsy-listing-rules.v1.json`, Drive → *EON Etsy Listing
Governance*) iki tonlu ürün için ayrı bir satır taşıyor:

```
"fixedTwoToneAxes": ["Width", "Ring Size"]     // Band color ekseni YOK
"maximumAxes": 3
```

İki tonlu üründe metal kombinasyonu **tek** olduğu için renk ekseni yok —
"no different metal variations" cümlesinin birebir karşılığı: alıcı metal
rengi seçmez, çünkü seçilecek bir şey yoktur. Ayar ise üçüncü eksen olarak
listing içinde kalır, yani tek ürün sayfası ve tek galeri.

## Fiyat: uydurulmadı, kanıtlandı

`scripts/eon/gen_meridian_package.mjs` fiyatı 2026-09-06 `pricingMethod`'unun
birebir kodundan üretir:

```
(gram + 1 g döküm kaybı) × (spot/31.1034768) × ayar saflığı × 1.08
  + 55 işçilik + 8 paketleme + 22 kargo payı
  × 2.05   → motor
  ÷ 0.75   → %25 mağaza indirimi korunacak şekilde
  ↑ 5$'a yuvarla → Etsy liste fiyatı
```

Motor **canlı panelde duran 252 Flat Milgrain satırına** karşı regresyona
sokuluyor (aynı geometri sınıfı, aynı 1,5 mm profil, aynı 55 USD kademe).
**252/252 cent birebir** tutmazsa script hata verir ve hiçbir çıktı yazılmaz.

```
$ node scripts/eon/gen_meridian_package.mjs
{ "listings": 1, "variants": 252,
  "priceRegressionAgainstLiveFamily": "252/252 cent-exact",
  "minListUsd": 870, "maxListUsd": 3160,
  "panelDraftOnly": true, "etsyWrites": false, "imagesGenerated": 0 }
```

### Spot tabanı neden 09-06 (09-11 değil)

| | USD/ozt |
|---|---|
| Taban (Kitco bid, 2026-09-06) | 4429,10 |
| Canlı (api.gold-api.com, 2026-09-11 16:30Z) | 4356,60 |
| Fark | **−%1,64** |

Motorun kendi kapıları `DEADBAND_PCT = %1` ile `MAX_STEP_PCT = %10` arasında.
−%1,64 bu bandın içinde ve tabanı korumak Meridian'ı aynı hafta canlıya çıkan
Flat Milgrain / Crossgrain aileleriyle fiyat-tutarlı bırakıyor. **Spot %5'i
aşarak ayrışırsa** bu blok tazelenmeli ve `weight-source.json` içindeki
regresyon fikstür'ü (`sourceListPriceCents`) yeniden üretilmelidir.

## Gram nereden geliyor

Fiziksel numune **tartılmadı**. Gramlar, doğrulanmış 1,5 mm profil tablosundan
geliyor (`weight-source.json` → canlı panel `EON-FMLGRN-Y` → yukarı akış
`hammered-weight-source.json`). Gerekçe:

- Meridian, Flat Milgrain ile aynı geometri sınıfı: kapalı comfort-fit halka,
  düz dış yüz, tekdüze 1,5 mm et kalınlığı.
- Fırçalama, kumlama ve tek parlak kanal **yüzey işlemi**, hacim değişikliği
  değil.
- İki tonlu yapı kütleyi değiştirmez: aynı ayarın sarı ve beyaz altını aynı
  saflığı taşır, alaşım yoğunluğu farkı tablonun 0,01 g çözünürlüğünün altında.

`finalProductionAuditRequired: true` — ilk üretimde gerçek tartı alınıp bu
dosya güncellenmeli.

## Panel ↔ repo mutabakatı

Varyantlar panele **SQL'de türetilerek** yazıldı (252 satır elle taşınmadı —
transkripsiyon riski sıfır). Doğrulama yalnız toplamla değil **konum-ağırlıklı
checksum**'la yapıldı (salt toplam satır KAYMASINI yakalamaz):

| ölçüm | panel (DB) | repo (price-table.csv) |
|---|---|---|
| satır | 252 | 252 |
| `sum(price_cents)` | 44.336.000 | 44.336.000 |
| `sum(i × price_cents)` | 6.585.843.000 | 6.585.843.000 |
| `sum(gram×100)` | 128.432 | 128.432 |
| `sum(i × gram×100)` | 17.769.886 | 17.769.886 |
| SKU min / max | `…-10-04-030` / `…-18-07-130` | aynı |
| tekil SKU | 252 | 252 |

## Açık kapılar — iş BİTMEDİ

1. **Görsel seti 9/10 hazır, `images/` altında.** Higgsfield `nano_banana_2`,
   sahibin 5 referans fotoğrafı `image_references` olarak; 2048×2048 sRGB JPEG,
   9 tekil hash. Görsel dili `visual-plan.json` → THE MERIDIAN.
   - **07 (spec kartı) BİLEREK üretilmedi:** üzerinde ölçü yazan bir kart, model
     rakamı yanlış basarsa yazım hatası değil YANLIŞ BEYAN olur; metin elle
     dizilmeli.
   - **05 hedefini tutturamadı:** 1,5 mm et kalınlığını göstermesi gerekirken
     üç-çeyrek açıda çıktı (hero'yu tekrarlıyor), yeniden çekilmeli.
   - İlk hero reddedildi: kapalı halka okunmuyordu (`closedContinuousLoopRequired`
     ihlali) ve 170 px'lik Etsy ızgarasında alyans gibi görünmüyordu.
2. **Fiziksel gram ölçülmedi** (yukarı bakınız).
3. **Etsy'ye gönderim yapılmadı.** `etsyPushRequiresExplicitOwnerInstruction:
   true` ve "Etsy'ye gözetimsiz yazma ASLA" kuralı geçerli. Panel taslağı Etsy
   taslağı DEĞİLDİR.

## Dosyalar

| dosya | ne |
|---|---|
| `weight-source.json` | 252 satır gram + regresyon fikstür'ü (cent) |
| `price-table.csv` | üretilen fiyat matrisi (252 satır) |
| `pricing-readback.json` | fiyat tabanı, yöntem, spot drift kararı, checks |
| `listing-manifest.json` | tam listing sözleşmesi (taksonomi, üretim, varyantlar) |
| `listing-copy-en-es.md` | EN + ES başlık/açıklama/13 etiket |
| `visual-plan.json` | görsel dili (THE MERIDIAN), 10 sahne prompt'u, Etsy dil kontrolü + QA kapısı |
| `images/` | üretilen 9 kare (2048×2048 sRGB JPEG) |
| `validation-plan.json` | beklenen ↔ gerçek + açık blocker'lar |
| `scripts/eon/gen_meridian_package.mjs` | üreteç (`--check` ile yalnız doğrular) |

## Yeniden üretmek

```bash
node scripts/eon/gen_meridian_package.mjs --check   # yalnız doğrula
node scripts/eon/gen_meridian_package.mjs           # doğrula + yaz
```
