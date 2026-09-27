# EON Comet — parlak kumlanmış, tek oluklu alyans (2026-09-27)

Sahibin isteği: *"yeni model aynı şartlar"*. Yapı ve akış Willow ve Cadence ile
aynı. Görsel dil için sahibin talimatı: *"home studio, natural shadows, glass
reflections, EON visual language matching with ring style"*.
Referans fotoğraf: `images/00-reference-demo.jpg` (demo numune).

**Tasarım (yakın kırpımlardan okundu):**
- Düz profilli bant; dış yüzün tamamı kaba, parlak kumlama ("stardust"), ışıkta
  nokta nokta parlıyor.
- Çevre boyunca tek bir sürekli parlak oluk var. Oluk ortada değil, bir kenara
  daha yakın (genişliğin yaklaşık üçte biri); bunu sahip teyit etti.
- Kenarlar kare, iç yüzey parlak. Taş yok.

## Yapı

| | |
|---|---|
| listing | `EON-COMET-Y` · `EON-COMET-W` · `EON-COMET-R` |
| eksenler | `Karat` (10/14/18K) × `Width` (3–8 mm) × `Ring Size` (US 3–13 + yarım) |
| kombinasyon | **378** listing başına, toplam 1.134 |
| galeri | listing başına 10 görsel (9 üretim + 1 dizilmiş spec kartı) |

## Fiyat: canlı Ridge ailesine karşı kanıtlandı

Fikstür Cadence'takiyle aynı: **Ridge Wedding Band** (`4569517712`), $110 işçilik.
`weight-source.json` Ridge'in canlı DB mührünü (`aa4ef023…`) birebir yeniden
üretiyor. `scripts/eon/gen_comet_package.mjs` hem bunu hem de 378/378 cent
regresyonunu doğrulamadan hiçbir çıktı yazmıyor. Liste fiyatı **$915 – $4.015**.

**Açık karar (sahip):** tek oluk + kumlama Ridge'den sade. Daha düşük bir işçilik
kademesi istenirse tek sabit değişir.

## Görseller: 30/30

Her renkte şu kareler var: `01-hero` · `02-worn-linen` · `03-macro` ·
`04-width-ladder` · `05-profile` · `06-worn-glass` · `07-spec-card` ·
`08-scale-fingers` · `09-interior` · `10-pair`.
Sahne ev ortamı: sabah pencere ışığı, meşe, keten ve şeffaf cam (levha, döküm
cam küp, su bardağı, üfleme cam kase). Cam yumuşak ve kaymış yansımalar veriyor;
ayna ya da simetrik yansıma yok.

- Üretim `nano_banana_2`, 2k, count 1.
- `07-spec-card` elle dizildi: `node scripts/eon/typeset_spec_card.mjs comet`.
- QA: 2048² sRGB, 30/30 tekil md5.
  - Dedektörün işaretlediği blokların hepsi göz kontrolünde yanlış alarm çıktı
    (cam kenarı, düz zemin).
  - Renk başına kontak baskısı yapıldı.
- 3 tur üretim yapıldı; retler ve gerekçeleri `visual-plan.json` içinde:
  1. **1. tur:** hero referans verildi, 11 kare hero'nun kadrajını kopyaladı ya da
     aynı açıya yığıldı.
  2. **2. tur:** hero yerine hero'dan kesilmiş sıkı renk/doku kırpımı ve
     fiziksel duruş tarifi kullanıldı; 11/11 kare tuttu.
  3. **3. tur:** sahip 08'de yüzüğü ele göre büyük buldu. Gerçek ölçek
     ("yaklaşık 2 cm, parmak ucu kadar") yazılınca 3/3 kare düzeldi.

## Panel + Etsy (Willow/Cadence akışı)

1. Galeri `public/eon/comet/<renk>/` altında. Merge sonrası prod'da 30/30
   görsel `200` dönmeli ve md5'i repodakiyle eşleşmeli.
2. Panel taslakları: `supabase/migrations/0154_eon_comet_family.sql`
   (`scripts/eon/gen_comet_migration.mjs` üretir). İçerik: 3 ürün, 1.134 varyant,
   30 görsel. Varyant mührü `c6a37f94ba6003a56ee7b2e06e4a2b47`.
3. Etsy: panelde "Etsy'ye gönder" (sahibin oturumu). Listing'ler Etsy'de DRAFT
   olarak açılır. **Yeni görseller canlıda doğrulanmadan gönderilmez.**

## Onay kapısı

`listing-manifest.json` → `approval.blockers`:
- Gramlar tahmini; numune tartılmadı.
- İşçilik kademesi kararı sahipte.
- Canlı indirim %30, motor %25 varsayıyor (EK-6).

## Yeniden üretim

```
node scripts/eon/gen_comet_package.mjs        # price-table.csv + listing-manifest.json
node scripts/eon/typeset_spec_card.mjs comet  # images/*/07-spec-card.jpg
node scripts/eon/gen_comet_migration.mjs      # supabase/migrations/0154_eon_comet_family.sql
```
