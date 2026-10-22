# 01 Etsy ücretleri, politika, mücevher uyumu (FTC), vergi
Kaynak: `source/01-*.txt` (M1), okuma 2026-10-22. Kapsam: ABD mağazası, USD, ABD atölyesi, ABD içi gönderim, sahip Türkiye'den yönetiyor.

## Ücretler (ABD mağazası)
| Kalem | Değer | Kaynak |
|---|---|---|
| İşlem | %6,5 (ürün + kargo + hediye paketi; satış vergisi HARİÇ) | S1 2026-10-05 |
| Ödeme işleme | %3 + $0,25/sipariş (brüt, vergi DAHİL) | S2 2026-07-31 |
| Listing / satışta yenileme | $0,20 | S1 |
| Sabit/sipariş | **$0,45** (0,25 + 0,20) | türetilmiş |
| ROF, kur dönüşümü | ABD mağazası + USD hesapta YOK (formüle konmaz) | S1, S3 |
| Offsite Ads | %15 (<$10K son 365 gün, kapatılabilir) / %12 (≥$10K, ömür boyu); tavan **$100/sipariş**; 30 gün | S1, S9 2026-10-05 |
| Etsy Ads | min $1/gün | S5 |
| Share & Save | %4 (ilk 2 hafta %6,5) | S6 / M5 S33 2026-08-03 |
| Instant Transfer | %1 (min $0,25, max $1), $25-500, 24 saatte 1 | S12 |
Taban: **%9,5 + $0,45** reklam öncesi; vergi üzerindeki %3 ve sigorta dahil tam v ≈ %10,5.

## Politika
- Mağaza dışına satış taşımak kesinlikle yasak (Off-Platform Transactions) [S9 2026-10-05].
- **Üretim ortağı:** ABD atölyesi yapıyorsa listing "Designed by a seller" + üretim ortağı beyanı; ships-from atölyenin adresi; About "Istanbul'da tasarlanır, ABD üretim ortağımız yapar" [S30 2026-10-05, S35/S36 2025-06-10].
- Her listing'de en az bir düzenlenmemiş gerçek fotoğraf; render/AI ilk ya da tek fotoğraf olamaz; tasarımda AI varsa beyan [S37 2026-10-22] (ayrıntı 04).
- Üstü çizili fiyat gerçek, makul süre ve miktarda satılmış fiyat; sürekli indirimde indirimli fiyat gerçek fiyat sayılır [S23/S56 Seller Handbook 2026-01-12] (ayrıntı 02, 07).
- Purchase Protection ≤$250; şartlar: yalnız sipariş adresine gönderim, geçerli takip/Etsy etiketi, tüm politika alanları dolu, sevk tarihi Messages'ta değişmez; hasar yılda ilk case; kişiselleştirilmiş ürün alıcı riski [S31 2026-07-09, S47 2026-04-07].
- Asgari standart: mesajların %80'i 48 saatte, %80 zamanında sevk; <40 yorumda ≤4 adet ≤3★, 40+ yorumda <%10; <300 siparişte ≤3 case, 300+ <%1 [S42/S43 2026].

## Mücevher uyumu (FTC 16 CFR 23, eCFR 2026-10-19)
- Ayar "Gold"dan önce: "14K Gold"; tek başına "gold ring" yok (§23.3). Beyaz altında rodyum kaplama beyanı (§23.7).
- Niteliksiz "diamond" doğal elmas demektir (§23.12); laboratuvar taşında taş adından hemen önce "laboratory-grown/created"; "lab diamond", "faux", lab taşta "#diamond" ihlal (§23.25). "Made in USA", "conflict-free", "recycled" kanıt ister (§23.1).
- Ayar damgasının yanında tescilli ya da başvurulmuş marka damgası (15 U.S.C. §297); tolerans lehimsiz −3‰, lehimli −7‰ (14K ≥580,3 / 576,3) [S58/S59].
- Çocuğa yönelik pazarlama ("baby", "for girls", "first birthday") CPSIA sertifikası olmadan yok [S62 2025-09-03]. Marka adı (Cartier, Tiffany, Pandora, Van Cleef, "dupe", "inspired") hiçbir alanda yok [S64 UNVERIFIED 2023].

## Vergi (CPA'ya sor)
$500 satıştan önce geçerli EIN/SSN/ITIN (yoksa askı) [S23]. Yabancı sahipli tek üyeli LLC: her yıl Form 5472 + pro forma 1120, ceza $25.000 [S24]. Satış vergisini fiyata koyma. 1099-K: $20.000 VE 200 işlem (2025) [S22].

## Panelde açık çelişkiler (2026-10-22)
- `who_made: "i_did"` (`lib/etsy/create-listing.ts:815`, `scripts/eon-push-drafts.ts:219`, `scripts/eon/gen_meridian_package.mjs:471`); `production_partner` hiçbir yerde set edilmiyor; EON strateji dokümanı "Made by hand in New Jersey". Sahip kararı: atölye üretiyorsa beyan zorunlu.
- `lib/jade/protection-copy.ts:224` niteliksiz "Stone: diamond"; `:288` "never plated" rodyumlu beyaz altında yanlış; `:318` "Stamped ${karat}" marka damgası ister. Katalogla doğrulanmalı.
- `docs/eon/strategy/2026-08-13-eon-etsy-denetim.md:166` "recycled gold ring" tag + Recycled attribute; kanıt yoksa kaldır.
- `create-listing.ts:267`, `scripts/eon-push-drafts.ts:142` ilk iade politikasını (`results[0]`) seçiyor; hangi politikanın bağlandığı rastgele.
- `lib/star-seller.ts:38,44` 40+ yorum (<%10) ve 300+ sipariş (<%1) kurallarını uygulamıyor.
