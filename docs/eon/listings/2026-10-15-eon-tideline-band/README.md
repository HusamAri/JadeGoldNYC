# EON Tideline — satin yüz, tek kenarda çift parlak rib alyans (2026-10-15)

Sahibin isteği: *"eon için bu yüzük modelini listing haline getir. 12 satış odaklı
görseli üret. her görselin bir amacı olmalı … 4mm - 7mm width 1.5 thickness. 3 metal
için 3 listing, 10k/14k/18k, width, us tam ve half sizeların tamamı"*.
Referans fotoğraflar: `images/00-reference-demo.jpg`, `images/00-reference-demo-2.jpg`
(sarı demo numune, iki açı).

**Tasarım (yakın kırpımlardan okundu):**
- Düz profilli bant, 1,5 mm kalınlık (sahip). Dış yüz ince satin (hafif fırçalanmış, mata yakın).
- YALNIZ bir kenarda satin yüz bir basamakla iner; o kenar boyunca aralarında ince
  bir oluk olan iki ince, yuvarlak, parlak rib uzanır (genişliğin yaklaşık ¼'ü).
- Karşı kenar kare ve satin. İç yüzey parlak comfort fit. Taş yok.
- Ridge'den farkı: Ridge'in iki kenarı basamaklı ve yüzü dokulu; Tideline asimetrik.

## Yapı

| | |
|---|---|
| listing | `EON-TIDE-Y` · `EON-TIDE-W` · `EON-TIDE-R` |
| eksenler | `Karat` (10/14/18K) × `Width` (4, 5, 6, 7 mm) × `Ring Size` (US 3–13 + yarım, 21) |
| kombinasyon | **252** listing başına (Etsy sınırı 400), toplam 756 |
| galeri | listing başına **12 görsel** (10 üretim + 2 elle dizilmiş kart) |

Beden aralığı EON kataloğunun standardı (US 3–13, yarımlar dahil).

## Fiyat: canlı Ridge ailesine karşı kanıtlandı

- Fikstür: canlı **Ridge Wedding Band** (4569517712), aynı sınıf (basamaklı kenar +
  dokulu yüz, $110 işçilik). Motor 378 aktif satırın **378/378**'ini cent birebir
  üretiyor ve Ridge'in canlı DB mührü (`aa4ef023…`) 2026-10-15'te yeniden doğrulandı
  (Ridge'e sonradan eklenen 63 pasif 2 mm satırı mühür dışında).
- Tideline 4–7 mm satırlarını kullanır: liste **$1.035 – $3.465**; aynı hücrede Ridge ile aynı fiyat.
- 1,5 mm kapısı: 120 tam beden hücresinde gram / motorun 1,5 mm tablosu = 1,035–1,060.
- %30 indirimde zarar tabanı (EK-7): 756/756 üstünde, en dar pay $400
  (taban spotu 4.286,20; 2026-10-15 canlı spot 4.153 → kontrol muhafazakâr).

`node scripts/eon/gen_tideline_package.mjs --check` hepsini yeniden koşar.

## Görseller: 12 kare, her birinin bir görevi var

Etsy Seller Handbook (Kas 2025): ilk görsel yatay ya da kare, ürün ortada ve her yanda
eşit pay (1:1, 4:3, 3:4 kırpmalarında kesilmesin), tüm görseller aynı şekilde, en az
2000 px. Sahip kararı: EON mağazasıyla tutarlı **2048 kare**, yüzük merkezdeki alanda.

| # | dosya | görev |
|---|---|---|
| 01 | hero | arama küçük resmi: alyans olarak okunur, satin + çift rib görünür |
| 02 | worn | elde oran ve satin/ten kontrastı |
| 03 | edge-macro | işçilik: basamak, iki rib, oluk |
| 04 | width-ladder | genişlik seçimi: 4→7 mm |
| 05 | profile | 1,5 mm jant ve basamaklı kenar |
| 06 | everyday | günlük kullanım |
| 07 | spec-card | elle dizilmiş: ayar, genişlik, beden, kalınlık, fit, gravür |
| 08 | true-scale | gerçek boyut (parmak ucu genişliği) |
| 09 | interior | comfort fit iç yüzey |
| 10 | pair | 7 + 4 mm çift |
| 11 | three-colors | üç renk; listing'in kendi rengi önde |
| 12 | engraving-card | elle dizilmiş: dört gravür fontu, 30 karakter |

**Sahip yönü (aynı gün, iki tur):** ilk set üç renkte de açık meşe + cam sahneyi
kullandı ve beyaz/rose hero'lar sarının renk edit'iydi. Sahip: *"görseller bire bir
aynı olmamalı"*, *"daha cool daha farklı ortamlar, yüzüklere metallere uyumlu tonlar,
ürünü ortaya çıkaracak şekilde; doğal kontrollü yansımalar, doğal gölgeler"*. Set
yeniden kuruldu:

- **Sarı:** traverten, kum rengi keten, bal meşe, zeytin dalı, amber cam; alçak sıcak güneş.
- **Beyaz:** arduvaz, fırçalanmış beton, buzlu cam, okaliptüs, su damlası; serin gün ışığı.
- **Rose:** pembe-bej mermer, toz pembe sıva, gül kurusu keten, mat seramik, kuru gül; ikindi ışığı.

Ret gerekçeleri ve iş kimlikleri `visual-plan.json` içinde.

Kredi: 49 üretim, 98 kredi (19'u atıldı). Aynı zaman aralığında hesapta bu oturuma ait
olmayan ~116 kredilik başka üretim de görüldü.

## Panel + Etsy

- `supabase/migrations/0168_eon_tideline_family.sql` (üretici:
  `scripts/eon/gen_tideline_migration.mjs`, ELLE DÜZENLEMEYİN): 3 taslak ürün, 756
  varyant, 36 görsel satırı. Görseller `public/eon/tideline/<renk>/` altından prod
  domain'inden servis edilir, yani migration **merge ve prod deploy'dan sonra** uygulanır.
- Varyant mührü: `3bb707f219704f10461423c8d93572ed` (sorgu migration başında).
- Etsy: panelde listing sayfasındaki "Etsy'ye gönder" (Etsy'de TASLAK açılır). Bu paket
  Etsy'ye yazmaz.

## Açık kalemler

- Gram Ridge ailesinden tahmin; fiziksel numune tartılmadı.
