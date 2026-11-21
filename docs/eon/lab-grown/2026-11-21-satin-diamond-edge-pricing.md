# EON lab-grown 09: Satin Diamond Edge (EON-SDE6) fiyatı, 2026-11-21

Girdi: sahibin 4 gerçek fotoğrafı + 6,8 sn video (2026-11-19, atölye; repoya alınmadı) ve "new model. but this model
do not accept resizing due to its diamonds are whole circle ... 3karat, all us and half sizes, 3 gold color".

## Tasarım (fotoğraflardan, oranla)
- Düz bant, köşeli omuzlar. Dış yüz fırçalı saten, çizgiler bant boyunca.
- BİR kenarda köşe 45° cilalı pahla kesilmiş; pahta tek sıra round taş, taşlar arasında küçük cilalı boncuk; sıra
  halkanın çevresini **tam** dolaşıyor. Sıranın iç tarafında ince cilalı dudak. Öbür kenar taşsız, dar cilalı pah.
  İç yüzey cilalı. Bu yüzden **resize olmaz** (sahip; üreticinin notu da "tam tur resize olmaz" diyor).
- Ölçek nesnesi yok. Fotoğraf 4'te taş ~32 px, merkezden merkeze ~36 px (adım/taş 1,13); taş/görünen yüz 0,25-0,35;
  görünen yarım yayda ~21 taş, tam turda ~42 (numune ~US 8½). Tasarım: **6,0 × 1,8 mm**, taş **~1,3 mm** (~0,009 ct),
  adım 1,5 mm. Video kareleri 131-137 iki kenarda da parıltı gösteriyor ama hareket bulanık; keskin fotoğraf 4 ve kareler
  1/61/114 öbür kenarı taşsız gösteriyor (karta tasarım teyidi olarak yazıldı).
- Taş sayısı bedenle büyür (sıra her bedende tam tur): ceil(π × (iç çap + 2,0) / 1,5) → US 4 36, US 8½ 44, US 16 56.

## Maliyet (üretici teklifi YOK; tedarikçi notları tarandı: bu tasarım için teklif yok)
- Konvansiyon (VB6/TMC9 ile aynı üretici): 14K gram × $100 (altın + işçilik); 10K/18K $/g panelin kuralı
  `derivePurchaseCentsPerGram` (spot $3.539, gold-api 2026-11-21 07:44Z): 10K $80,77, 18K $118,77.
- Gram üreticinin 14K bant listesinden, 6,0 × 1,8 mm tam kesit (pah ve yuvalar tampon): US 8½ 14K 9,17 g (10K 8,18,
  18K 10,43); US 16 14K 11,95 g.
- Taş $280/ct × 0,009 = $2,52 + boncuk takma $4 (DSP notundaki tırnak ücreti; boncuk için kalibre değil) = $6,52/taş.
- US 8½ maliyet: 10K $947,62 · 14K $1.203,98 · 18K $1.525,35; + paket $8 + kargo $22.

## Fiyat (tek fiyat her beden ve renkte, ayar başına; %25 vitrin)
| Ayar | Liste | Alıcı | Taban (her beden ≥ $50, en kötü Offsite) | Motor listesi (US 8½) | Kâr US 4 / 8½ / 12 / 16 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| 10K | $2.100 | $1.575 | $2.075 | $2.020 | +520 / +347 / +221 / +69 |
| 14K | $2.600 | $1.950 | $2.565 | $2.555 | +649 / +430 / +268 / +74 |
| 18K | $3.250 | $2.437,50 | $3.185 | $3.215 | +828 / +550 / +342 / +96 |

- %35 vitrinde US 12'ye kadar ≥ 0, US 16'da −121 / −161 / −198. Alternatif 10K $2.350 / 14K $2.900 / 18K $3.600
  %35'te de her bedende ≥ 0 (US 16 +26 / +15 / +8).
- Piyasa: Blue Nile "Men's Beveled Edge Diamond Band 14K Yellow 6.5 mm" (item 196251, okuma 2026-11-21): doğal H-I SI2,
  1/2 ct, 44 taş, **iki kenarda** birer sıra, "This ring cannot be resized", $2.541 (indirimli, liste $3.630). 6 mm 14K
  saten/pah erkek pırlanta bantları ~$1.400-3.200 (arama 2026-11-21). Tek kenarda tam tur sıralı bir ilan bulunmadı.

Kanıt: `price_model.py sde`, üreteç `scripts/eon/gen_lab_grown_sde_migration.mjs` (listing.json'daki tabloları bağımsız
yeniden hesaplayıp karşılaştırır). Kuru koşu mührü `a203b09b7421b7afe83c03751a1d06ab` (225 varyant).
