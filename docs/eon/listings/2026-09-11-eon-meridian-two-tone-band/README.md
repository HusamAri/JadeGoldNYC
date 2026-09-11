# EON Meridian — iki tonlu alyans (2026-09-11)

Sahibin isteği: **4–7 mm genişlik, 1,5 mm kalınlık, US bedenler (yarım dahil),
tek yüzükte iki metal, metal varyasyonu YOK; ayar başına ayrı listing (10K /
14K / 18K).** Bu paket o üç listing'in repo-yerli kaynağıdır.

Panelde **üç taslak** olarak duruyor (`EON-MERID-TT-10/14/18`, hepsinde
`etsy_listing_id = NULL`). **Etsy'ye hiçbir şey yazılmadı** — gönderim aşağıdaki
onay kapısına bağlı.

## Yapı: ayar başına bir listing (3 listing)

Sahibin 2026-09-11 talimatı: **10K, 14K ve 18K için ayrı listing**, her birinde
genişlik ve US bedenler (yarım bedenler dahil).

Yönetişim dosyası (`eon-etsy-listing-rules.v1.json`, Drive → *EON Etsy Listing
Governance*) bunu zaten taşıyor:

```
"karatAtListingLevel": true                    // ayar listing seviyesinde
"fixedTwoToneAxes": ["Width", "Ring Size"]     // Band color ekseni YOK
```

İki tonlu üründe metal kombinasyonu **tek** olduğu için renk ekseni yok; ayar da
listing seviyesinde sabitlenince her listing'de yalnız **iki** envanter ekseni
kalıyor:

| listing | ayar | eksenler | kombinasyon |
|---|---|---|---|
| `EON-MERID-TT-10` | 10K | Width × Ring Size | 84 |
| `EON-MERID-TT-14` | 14K | Width × Ring Size | 84 |
| `EON-MERID-TT-18` | 18K | Width × Ring Size | 84 |

4 genişlik × 21 beden = 84, Etsy'nin 400 sınırının çok altında; toplam 252 varyant.
Alıcı ne metal rengi ne ayar seçer — ikisi de listing'in kimliğidir. Metin de buna
göre kurulur: başlık ayarla açılır, açıklama "this listing is for 10K only" der ve
"CHOOSE YOUR FIT" **iki** menü anlatır. Üreteç bunu assert'le zorlar (yabancı ayar
başlıkta geçemez, varyant özelliğinde `Karat` kalamaz).

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
{ "listings": 3,
  "listingSkus": ["EON-MERID-TT-10","EON-MERID-TT-14","EON-MERID-TT-18"],
  "variantsPerListing": [84, 84, 84], "variants": 252,
  "priceRegressionAgainstLiveFamily": "252/252 cent-exact",
  "minListUsd": 870, "maxListUsd": 3160,
  "panelDraftOnly": true, "etsyWrites": false }
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

| listing | satır | `sum(price_cents)` | `sum(i × price_cents)` | `sum(gram×100)` | `sum(i × gram×100)` | tekil SKU |
|---|---|---|---|---|---|---|
| `…-TT-10` | 84 | 10.064.000 | 464.159.500 | 37.757 | 1.812.822 | 84 |
| `…-TT-14` | 84 | 14.587.000 | 678.141.500 | 42.895 | 2.059.699 | 84 |
| `…-TT-18` | 84 | 19.685.000 | 911.154.000 | 47.780 | 2.267.145 | 84 |

Üç listing'de de panel (DB) ve repo (`price-table.csv`) **beş ölçümde de birebir**;
hiçbir varyantta `Karat` ekseni kalmadı.

## Açık kapılar — iş BİTMEDİ

1. **Görsel seti 9/10 üretildi, 07 eksik.** Higgsfield `nano_banana_2`, sahibin
   5 referans fotoğrafı `image_references` olarak, 2048×2048 sRGB JPEG, 9 tekil
   hash. Gün ışığı home-studio diline göre 01/03/05 yeniden çekildi.
   **07 (spec kartı) BİLEREK üretilmedi:** üzerinde ölçü yazan bir kart, model
   rakamı yanlış basarsa yazım hatası değil YANLIŞ BEYAN olur; metin elle
   dizilmeli. **05 hedefini tutturamadı:** 1,5 mm et kalınlığını göstermesi
   gerekirken üç-çeyrek açıda çıktı, yeniden çekilmeli.
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
| `validation-plan.json` | beklenen ↔ gerçek + açık blocker'lar |
| `scripts/eon/gen_meridian_package.mjs` | üreteç (`--check` ile yalnız doğrular) |

## Yeniden üretmek

```bash
node scripts/eon/gen_meridian_package.mjs --check   # yalnız doğrula
node scripts/eon/gen_meridian_package.mjs           # doğrula + yaz
```
