# EON Willow — elmas kesim yaprak desenli alyans (2026-09-26)

Sahibin isteği: *"bu görsel demo metalden yapılma. bunu referans alarak 10
görselli listing oluştur. 3 varyantlı olmalı. her metal rengi için 10 görsel"*
+ *"varyantlar size, 10 14 18k ve width 3mm den başlar 8mme kadar"*.
Referans fotoğraf: `images/00-reference-demo-brass.jpg` (pirinç demo numune).

Bu paket o üç listing'in repo-yerli kaynağıdır. Sahip 2026-09-26'da Etsy'ye
gönderimi istedi; akış aşağıda "Panel + Etsy gönderimi" bölümünde.

## Yapı: renk başına bir listing, üç eksen

| | |
|---|---|
| listing | `EON-WILLW-Y` · `EON-WILLW-W` · `EON-WILLW-R` (sarı / beyaz / rose) |
| eksenler | `Karat` × `Width` × `Ring Size` |
| ayar | 10K / 14K / 18K |
| genişlik | 3, 4, 5, 6, 7, 8 mm |
| beden | US 3 – US 13, yarım bedenler dahil (21) |
| kombinasyon | 3 × 6 × 21 = **378** listing başına (Etsy sınırı 400) |
| toplam | 3 × 378 = **1.134 varyant** |
| galeri | listing başına **10 görsel** (30 toplam) |

Metal rengi varyant DEĞİL, ayrı listing: "her metal rengi için 10 görsel"
cümlesi galeriyi renge bağlıyor ve Etsy'de galeri listing'e aittir. Üç eksen
+ renk dördüncü eksen olsaydı 1.134 kombinasyon 400 sınırını da aşardı.

SKU: `EON-WILLW-{Y|W|R}-{10|14|18}-{03..08}-{030..130}` — 32 karakter altı,
1.134'ü tekil (script assert eder).

## Fiyat: uydurulmadı, canlı kardeşe karşı kanıtlandı

`scripts/eon/gen_willow_package.mjs`:

```
(gram + 1 g döküm kaybı) × (spot 4429.1 / 31.1034768) × ayar saflığı × 1.08
  + 130 işçilik + 8 paketleme + 22 kargo payı
  × 2.05  (8 mm'de × 2.2)
  ÷ 0.75  → mağaza indirimi
  ↑ 5 $'a yuvarla → Etsy liste fiyatı
```

Gram ve fiyat fikstürü, yapısı **birebir aynı** olan canlı EON listing'i
**Laurel Cross** (`4569902988`, 10/14/18K × 3–8 mm × US 3–13 yarım = 378)
satırlarından alındı (`weight-source.json`, md5 `cc1d6ff4…`). Motor
**378/378 cent birebir** tutmazsa script hiçbir çıktı yazmaz.

**İşçilik 130 $ — neden 55 $ değil:** Meridian'ın 55 $ kademesi bu aileyi
0/378 üretiyor. Işçilik ızgara taramasıyla 130 $'da 378/378 oturdu. Bağımsız
teyit: en yakın desen kardeşi Diamond Cut Crosshatch (`4565352791` /
`4565351341`) 122–125 $ işçilik ima ediyor — elmas kesim süslü kademede.

| ayar | 3 mm | 6 mm | 8 mm |
|---|---|---|---|
| 10K | 970 – 1.150 $ | 1.330 – 1.685 $ | 1.675 – 2.190 $ |
| 14K | 1.250 – 1.540 $ | 1.820 – 2.390 $ | 2.355 – 3.175 $ |
| 18K | 1.585 – 1.990 $ | 2.465 – 3.210 $ | 3.015 – 4.075 $ |

(aralık = US 3 → US 13; üç renk aynı fiyat)

**Katkı kontrolü** (Etsy ücreti %11,7 ledger'dan, indirimli satış fiyatı
üzerinden): %25 indirimde min **%39,5**; canlı %30 indirimde min **%36,0**;
iki durumda da 0 varyant zararda.

## Görseller: 30/30, hepsi gözle kabul

Her renk: `01-hero-daylight` · `02-worn-linen` · `03-macro-leaves` ·
`04-width-ladder` · `05-profile-flat` · `06-worn-coffee` · `07-spec-card` ·
`08-scale-fingers` · `09-interior` · `10-pair-editorial`.

- 27 kare Higgsfield `nano_banana_2` 2k ile, **her istek count 1**; her renk
  kendi kabul edilmiş hero'sunu referans alır (`heroReferenceJobs`).
- `07-spec-card` modele **üretilmedi**, `scripts/eon/typeset_willow_spec_card.mjs`
  ile dizildi: her rakam manifest'ten okunur ve açıklama metniyle uyuşmazsa
  script yazmaz (model bu seride iki kez sahte ayar damgası bastı).
- Kalite kapısı: 2048² sRGB, 30/30 tekil md5, köken meta verisi yok,
  `scripts/eon/detect_block_artifacts.mjs` makroblok dedektörü = 0, sonra
  kare kare ve renk başına kontak baskısıyla göz.
- **15 ret** `visual-plan.json` → `rejected` altında gerekçesiyle: eldiven,
  pirinç tonu (demo referansından taşınan), sahte damga ("14K HERITAGE
  GOLD"), yaprak içinde pavé taş, eşleşik yaprak çiftleri, makroblok zemin ve
  W03 — tek tek her kontrolü geçip hero'nun kopyası çıkan kare (yalnız set
  kontak baskısı yakaladı).
- Bilinen tutarlılık notu: beyaz setin hero'su kenarda ince bir basamaklı
  jant taşıyor, sarı/rose'da jant düz. Beyaz set kendi içinde tutarlı;
  demo numunenin kenarı üretimde hangisiyse o renk yeniden çekilmeli.

## Onay kapısı (Etsy'ye yazmadan önce)

`listing-manifest.json` → `approval.blockers`:

1. **Gram tahmini.** Laurel Cross'un gramları da `estimated`; demo pirinç
   numune tartılmadı. İlk üretimde bir beden/genişlik tartılıp fikstür
   sınanmalı (Meridian/Laurel dersi: ölçüm hangi noktada, ilan ortalama mı).
2. **İndirim oranı.** Canlı EON indirimi %30 (2026-09-20'den beri), motor
   %25 varsayıyor (`storePromotionRateKnownStale`). Zarar yok ama hedef marj
   ~3,5 puan eksik. Katalog tutarlılığı için bilerek %25'te bırakıldı;
   düzeltme sahibin kararı (`docs/eon/strategy/2026-09-12-eon-satis-teshis.md` EK-6).
3. **İspanyolca metin yok.** Meridian'da EN+ES vardı; burada yalnız EN.
4. **Ad.** "Willow" çalışma adı; başlık adı taşımıyor, yalnız spec kartında
   görünüyor.

## Panel + Etsy gönderimi (2026-09-26, sahibin "push to etsy" talimatı)

1. Görseller `public/eon/willow/<renk>/` altında, prod'dan servis edilir
   (`https://amuletta.artifactstudio.info/eon/willow/...`). Etsy görseli bu
   URL'den indirir; merge + deploy olmadan 404 döner ve taslak fotoğrafsız
   açılır — o yüzden sıra: merge → 30/30 `200` kontrolü → DB → gönder.
2. Panel taslakları `supabase/migrations/0152_eon_willow_family.sql`
   (`scripts/eon/gen_willow_migration.mjs`): 3 ürün, 1.134 varyant, 30 görsel.
   Mühür `68e58431ad16582033c6a3a4a55823d9` (sorgu migration başlığında).
3. Etsy: panelde listing sayfası → "Etsy'ye gönder" (sahibin oturumu).
   Etsy'de **DRAFT** açılır; aktivasyon ayrı ve sahibin kararı.

## Yeniden üretim

```
node scripts/eon/gen_willow_package.mjs          # price-table.csv + listing-manifest.json
node scripts/eon/typeset_willow_spec_card.mjs    # images/*/07-spec-card.jpg
node scripts/eon/gen_willow_migration.mjs        # supabase/migrations/0152_eon_willow_family.sql
node scripts/eon/detect_block_artifacts.mjs images/*/*.jpg
```
