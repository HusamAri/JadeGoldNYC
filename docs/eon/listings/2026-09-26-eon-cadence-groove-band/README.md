# EON Cadence — kumlanmış, enine kanallı, basamaklı kenar alyans (2026-09-26)

Sahibin isteği: *"yeni model. aynı şekilde listingleri oluştur"* — yani Willow
(`../2026-09-26-eon-willow-diamond-cut-band/`) ile aynı yapı ve aynı akış.
Referans fotoğraf: `images/00-reference-demo.jpg` (demo numune).

**Tasarım (fotoğraftan):** dış yüzey **düz fasetlerden** oluşur (çokgen gibi),
her faset kumlanmış (sandblasted) mat; iki fasetin birleştiği yerde genişlik
boyunca **geniş parlak bir kesim** var (oyuk kanal ya da iki basamaklı bar);
iki kenar dar, parlak bir raya **basamakla** iniyor; iç yüzey parlak comfort
fit. Taş yok. İlk tarif "yuvarlak bant + ince kanal çifti" idi ve ince
nervürler üretti; sahip "referansa benzet" dedi, tarif fasetli olarak yeniden
yazıldı (`visual-plan.json` → `geometryNote`).

## Yapı (Willow ile aynı)

| | |
|---|---|
| listing | `EON-CADNC-Y` · `EON-CADNC-W` · `EON-CADNC-R` |
| eksenler | `Karat` (10/14/18K) × `Width` (3–8 mm) × `Ring Size` (US 3–13 + yarım) |
| kombinasyon | **378** listing başına, toplam 1.134 |
| galeri | listing başına 10 görsel (9 üretim + 1 dizilmiş spec kartı) |

## Fiyat: canlı Ridge ailesine karşı kanıtlandı

Fikstür **Ridge Wedding Band** (`4569517712`): aynı 378'lik yapı ve aynı
geometri sınıfı (basamaklı kenar + dokulu orta). `weight-source.json`
satırları Ridge'in **canlı DB mührünü** (`aa4ef023…`) birebir yeniden
üretiyor; `scripts/eon/gen_cadence_package.mjs` hem bunu hem 378/378 cent
regresyonunu doğrulamadan hiçbir çıktı yazmaz.

Ridge'in gram tablosu Laurel Cross'unkiyle (Willow fikstürü) **birebir aynı**;
iki aile arasındaki tek fark işçilik kademesi: Ridge **$110**, Laurel/Willow
**$130**. Cadence **$110** ile kuruldu → liste **$915 – $4.015**.

**Açık karar (sahip):** enine parlak kanallar Ridge'de yok. Süslü kademe
($130) istenirse tek sabit değişir, fiyatlar ~%6 artar (en düşük $970).

## Görseller: 30/30

Her renk: `01-hero` · `02-worn-linen` · `03-macro` · `04-width-ladder` ·
`05-profile` · `06-worn-coffee` · `07-spec-card` · `08-scale-fingers` ·
`09-interior` · `10-pair`. Fon koyu kömür süet (sahip kararı, hero'da).

- 27 üretim (`nano_banana_2` 2k, count 1), her renk kendi hero'sunu referans alır.
- `07-spec-card` dizildi: `node scripts/eon/typeset_spec_card.mjs cadence`.
- QA: 2048² sRGB, 30/30 tekil md5, makroblok 0, damga/taş için iç yüzey
  zoom'u, renk başına kontak baskısı. Retler ve gerekçeleri `visual-plan.json`.

## Panel + Etsy (Willow akışı)

1. Galeri `public/eon/cadence/<renk>/` → merge sonrası prod'da 30/30 `200`.
2. Panel taslakları: `supabase/migrations/0153_eon_cadence_family.sql`
   (`scripts/eon/gen_cadence_migration.mjs`), 3 ürün, 1.134 varyant, 30 görsel.
   Varyant mührü `077bc2bb1a552040a73cab0968edeb92`.
3. Etsy: panelde "Etsy'ye gönder" (sahibin oturumu) → Etsy'de DRAFT.

## Onay kapısı

`listing-manifest.json` → `approval.blockers`: tahmini gram (numune
tartılmadı), işçilik kademesi kararı, canlı indirim %30 / motor %25 (EK-6).

## Yeniden üretim

```
node scripts/eon/gen_cadence_package.mjs      # price-table.csv + listing-manifest.json
node scripts/eon/typeset_spec_card.mjs cadence  # images/*/07-spec-card.jpg
node scripts/eon/gen_cadence_migration.mjs    # supabase/migrations/0153_eon_cadence_family.sql
```
