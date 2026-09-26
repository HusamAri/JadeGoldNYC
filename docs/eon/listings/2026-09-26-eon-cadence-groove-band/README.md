# EON Cadence — kumlanmış, enine kanallı, basamaklı kenar alyans (2026-09-26)

Sahibin isteği: *"yeni model. aynı şekilde listingleri oluştur"* — yani Willow
(`../2026-09-26-eon-willow-diamond-cut-band/`) ile aynı yapı ve aynı akış.
Referans fotoğraf: `images/00-reference-demo.jpg` (demo numune).

**Tasarım (fotoğraftan):** yükseltilmiş düz orta bant kumlanmış (sandblasted)
mat; bant, genişlik boyunca kesilmiş parlak **kanal çiftleriyle** eşit
bölümlere ayrılıyor; iki kenar dar, parlak bir raya **basamakla** iniyor; iç
yüzey parlak comfort fit. Taş yok.

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

## Durum

- [x] Fiyat + varyant + metin (`listing-manifest.json`, `price-table.csv`)
- [x] 10 sahnelik görsel planı (`visual-plan.json`), Willow dersleri baştan içinde
- [ ] Görseller — **sahibin prompt onayını bekliyor** (kredi kuralı: önce onay, count 1)
- [ ] Panel taslakları + Etsy (Willow akışı: `public/` galeri → migration → "Etsy'ye gönder")

## Onay kapısı

`listing-manifest.json` → `approval.blockers`: tahmini gram (numune
tartılmadı), işçilik kademesi kararı, canlı indirim %30 / motor %25 (EK-6).

## Yeniden üretim

```
node scripts/eon/gen_cadence_package.mjs   # price-table.csv + listing-manifest.json
```
