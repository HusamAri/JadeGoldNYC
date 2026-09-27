# EON Comet Tail — satin, paralel kama kesimli, iki kenarı milgrain alyans (2026-09-27)

Sahibin isteği: *"yeni model"* (iki fotoğraf). Yapı, akış ve görsel dil Comet ile
aynı: home studio, doğal gölge, cam yansımaları.
Referans fotoğraflar: `images/00-reference-demo.jpg` ve
`images/00-reference-demo-2.jpg` (aynı demo numune, iki açı).

**Tasarım (yakın kırpımlardan okundu):**
- Hafif kubbeli bant, fırçalanmış satin yüz.
- Hepsi aynı yöne yatık, paralel, uzun ve sığ açılı kama kesimler. Her kesim bir
  kenarda sivri uçla başlar, karşı kenara doğru yaklaşık 1,5 mm'ye genişler
  (kuyruklu yıldız izi; ad buradan).
- İki kenarda milgrain boncuk sırası, dışında ince parlak ray. İç yüzey parlak.
  Taş yok.

**Okuma düzeltmesi:** ilk okuma "sürekli zikzak / chevron" idi ve YANLIŞTI. Bir
kamanın iki kenar çizgisinin sivri uçta buluşması, iki kesim arasındaki V
sanıldı. Hero v1 hatayı gösterdi, sahip düzeltilmiş okumayı onayladı; paket o
yüzden "Sierra"dan "Comet Tail"e yeniden adlandırıldı. Ayrıntı
`visual-plan.json` → `geometryCorrection`.

## Yapı

| | |
|---|---|
| listing | `EON-CTAIL-Y` · `EON-CTAIL-W` · `EON-CTAIL-R` |
| eksenler | `Karat` (10/14/18K) × `Width` (3–8 mm) × `Ring Size` (US 3–13 + yarım) |
| kombinasyon | **378** listing başına, toplam 1.134 |
| galeri | listing başına 10 görsel (9 üretim + 1 dizilmiş spec kartı) |

## Fiyat: canlı Laurel Cross ailesine karşı kanıtlandı

Fikstür Willow'daki ile aynı: **Laurel Cross** (`4569902988`), $130 işçilik
(süslü kademe: satin + milgrain + elmas kesim). `weight-source.json` Laurel'in
canlı DB değerlerini birebir taşıyor; 2026-09-27'de konum-ağırlıklı checksum'la
canlıya karşı yeniden doğrulandı (`sum(i*price)` 17.145.630.000,
`sum(i*gram)` 420.250,40). `scripts/eon/gen_comet_tail_package.mjs` hem bunu hem
378/378 cent regresyonunu doğrulamadan çıktı yazmıyor. Liste fiyatı
**$970 – $4.075**.

## Görseller

Her renkte şu kareler var: `01-hero` · `02-worn-linen` · `03-macro` ·
`04-width-ladder` · `05-profile` · `06-worn-glass` · `07-spec-card` ·
`08-scale-fingers` · `09-interior` · `10-pair`.

- Üretim `nano_banana_2`, 2k, count 1. `07-spec-card` elle dizildi:
  `node scripts/eon/typeset_spec_card.mjs comet-tail`.
- **Gri havlu / kadife / kumaş hiçbir karede yok** (sahip talimatı, 2026-09-27).
- Referans yöntemi (retler ve gerekçeleri `visual-plan.json` içinde):
  1. Tam numune fotoğrafları referans verilince gri kadife sahne kareye sızdı
     (hero v2). Hero v3'ten itibaren yalnız metal yüzeyinin sıkı kırpımları
     referans verildi.
  2. Beyaz hero, kadraj için verilen sarı hero'nun rengini boncuklara
     sızdırdı (iki ton). Edit ile düzeltildi.
  3. Seri kareler her rengin hero'sundan kesilmiş satin + kama + milgrain
     kırpımıyla üretildi (kopyalanacak kadraj yok). Ölçek sayıyla yazıldı
     ("yaklaşık 2 cm, parmak ucu genişliği").
  4. Tepe görünüşlü 09 kareleri desenli yüzü disk gibi gösterdi (fiziksel
     olarak imkânsız). 60° içeri bakan açıyla yeniden çekildi.

## Panel + Etsy (Willow/Cadence/Comet akışı)

1. Galeri `public/eon/comet-tail/<renk>/` altında. Merge sonrası prod'da 30/30
   görsel `200` dönmeli ve md5'i repodakiyle eşleşmeli.
2. Panel taslakları: `supabase/migrations/0155_eon_comet_tail_family.sql`
   (`scripts/eon/gen_comet_tail_migration.mjs` üretir). İçerik: 3 ürün,
   1.134 varyant, 30 görsel. Varyant mührü migration başlığında.
3. Etsy: panelde "Etsy'ye gönder" (sahibin oturumu). Listing'ler Etsy'de DRAFT
   olarak açılır. **Yeni görseller canlıda doğrulanmadan gönderilmez.**

## Onay kapısı

`listing-manifest.json` → `approval.blockers`:
- Gramlar tahmini; numune tartılmadı. Kubbe ve iki milgrain rayı düz banttan
  biraz ağır olabilir.
- İşçilik kademesi ($130, süslü) kararı sahipte.
- Canlı indirim %30, motor %25 varsayıyor (EK-6).

## Yeniden üretim

```
node scripts/eon/gen_comet_tail_package.mjs        # price-table.csv + listing-manifest.json
node scripts/eon/typeset_spec_card.mjs comet-tail  # images/*/07-spec-card.jpg
node scripts/eon/gen_comet_tail_migration.mjs      # supabase/migrations/0155_eon_comet_tail_family.sql
```
