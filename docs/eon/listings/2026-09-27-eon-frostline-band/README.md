# EON Frostline — satin + florentine, eğik tek parlak oluklu alyans (2026-09-27)

Sahibin isteği: *"new model"* (üç fotoğraf). Yapı, akış ve görsel dil
Willow/Cadence/Comet ile aynı: home studio, doğal gölge, cam yansımaları.
Referans fotoğraflar: `images/00-reference-demo.jpg`, `-2.jpg`, `-3.jpg` (aynı
demo numune, üç açı).

**Tasarım (yakın kırpımlardan okundu, sahip düzeltmeleriyle):**
- Düz bant (kubbesiz), **1,5 mm** kalınlık (sahip beyanı), kare kenarlar,
  parlak iç yüzey. Taş yok, milgrain yok.
- Dış yüzü TEK parlak oluk ikiye ayırır. Oluk kenarlara **paralel değildir**:
  eğik bir düzlemde durur, bir yanda kenara yaklaşır, karşı yanda ortaya
  gelir; iki bölge yüzük döndükçe genişleyip daralır.
- Dar bölge fırçalanmış satin, geniş bölge florentine / "ice" (rastgele
  açılarda kesişen ince düz çizikler).

**Okuma düzeltmeleri (retler `visual-plan.json` içinde):** hero v1 oluğu düz ve
paralel çizdi ("çizgi düz değil"), v2 S dalgası çizdi ("yine olmadı"), v3 eğik
düzlem de tutmadı. Kabul edilen v4, tarif yerine **numunenin kendi
fotoğrafları** referans verilerek üretildi (sahip: "referans görselleri kullan").

## Yapı

| | |
|---|---|
| listing | `EON-FROST-Y` · `EON-FROST-W` · `EON-FROST-R` |
| eksenler | `Karat` (10/14/18K) × `Width` (3–8 mm) × `Ring Size` (US 3–13 + yarım) |
| kombinasyon | **378** listing başına, toplam 1.134 |
| galeri | **ilk yayın: listing başına 3 görsel** (01 hero, 03 yakın plan, 07 spec kartı) |

## Fiyat: canlı Ridge ailesine karşı kanıtlandı

Fikstür Comet ile aynı: **Ridge** (`4569517712`), $110 işçilik.
`scripts/eon/gen_frostline_package.mjs` üç şeyi doğrulamadan çıktı yazmaz:
1. Ridge'in canlı DB mührü ve 378/378 cent regresyonu.
2. **1,5 mm kapısı:** gramlar motorun 1,5 mm tablosunun ×1,035–1,062'si
   (180 tam beden hücresi, `docs/eon/eon-weight-tables.json`), yani fiyat 1,5
   mm'ye göre ve hafif muhafazakâr.
3. **%30 indirim zarar tabanı** (EK-7 kuralı): 1.134 varyantın hepsi üstünde,
   en dar pay $350.

Liste fiyatı **$915 – $4.015**.

## Görseller (ilk yayın)

- `01-hero`: sarı ve rose `nano_banana_2` (2k, count 1), numune fotoğraflarıyla.
  Sarı: arka plandaki örtü edit ile kaldırıldı. Rose: sahip "kalsın" dedi.
- **Beyaz 01-hero, sarı hero'nun yerelde boyanmasıdır** (Higgsfield kredisi
  bitti; sahip: "higsfield olmadan sen üret"). Halka maskesi görüntünün
  netliğinden ölçüldü (arka plan bulanık, halka keskin); oluk yolu sarıyla
  birebir. Listing metni bunu beyaz için açıkça söyler.
- `03-closeup`: her rengin kendi hero'sundan kırpılıp 2048'e büyütüldü.
- `07-spec-card`: `node scripts/eon/typeset_spec_card.mjs frostline`
  (kalınlık satırı dahil, rakamlar manifest'ten).
- **Gri havlu / kadife / kumaş kullanılmaz** (sahip talimatı).
- Kalan 7 seri kare × 3 renk görsel üretim kredisi gelince eklenir; üretici ara
  sayıyı (4–9 görsel) reddeder.

## Panel + Etsy

1. Galeri `public/eon/frostline/<renk>/`. Merge sonrası prod'da 9/9 görsel
   `200` dönmeli.
2. Panel taslakları: `supabase/migrations/0156_eon_frostline_family.sql`
   (`scripts/eon/gen_frostline_migration.mjs` üretir): 3 ürün, 1.134 varyant,
   9 görsel. Varyant mührü migration başlığında.
3. Etsy: panelde "Etsy'ye gönder" (sahibin oturumu), DRAFT olarak açılır.

## Onay kapısı

`listing-manifest.json` → `approval.blockers`: gramlar tahmini (numune
tartılmadı), ilk yayın 3 görsel.

## Yeniden üretim

```
node scripts/eon/gen_frostline_package.mjs        # price-table.csv + listing-manifest.json
node scripts/eon/typeset_spec_card.mjs frostline  # images/*/07-spec-card.jpg
node scripts/eon/gen_frostline_migration.mjs      # supabase/migrations/0156_eon_frostline_family.sql
```
