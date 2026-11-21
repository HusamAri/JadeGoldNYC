# EON lab-grown 09: Satin Diamond Edge (EON-SDE6) fiyatı, 2026-11-21

Girdi: sahibin 4 gerçek fotoğrafı + 6,8 sn video (2026-11-19, atölye; repoya alınmadı) ve "new model. but this model
do not accept resizing due to its diamonds are whole circle ... 3karat, all us and half sizes, 3 gold color".

## Tasarım (fotoğraflardan, oranla)
- Düz bant, köşeli omuzlar. Dış yüz fırçalı saten, çizgiler bant boyunca.
- **İKİ** kenarda da köşe 45° cilalı pahla kesilmiş; her pahta tek sıra round taş, taşlar arasında küçük cilalı boncuk;
  her sıra halkanın çevresini **tam** dolaşıyor. Sıraların iç tarafında ince cilalı dudak; iki sıranın arası fırçalı saten
  (~4 mm). İç yüzey cilalı. Bu yüzden **resize olmaz** (sahip; üreticinin notu da "tam tur resize olmaz" diyor).
- **Sahip kartı 2026-11-21, tasarım teyidi: "Both edges".** İlk okumam tek kenardı (keskin fotoğraflar yakın sırayı gösteriyor);
  foto 2'nin alt kenarındaki ince çizgi ve video kareleri 131-137 ikinci sırayı kenardan gösteriyordu. Fiyat iki sırayla yeniden
  kuruldu: kartta tek sıra için seçilen 2.100 / 2.600 / 3.250 iki sırayla US 12'den itibaren zarar ediyor (14K US 16 −$291).
- Ölçek nesnesi yok. Fotoğraf 4'te taş ~32 px, merkezden merkeze ~36 px (adım/taş 1,13); taş/görünen yüz 0,25-0,35;
  görünen yarım yayda ~21 taş, tam turda ~42 (numune ~US 8½). Tasarım: **6,0 × 1,8 mm**, taş **~1,3 mm** (~0,009 ct),
  adım 1,5 mm. Video kareleri 131-137 iki kenarda da parıltı gösteriyor ama hareket bulanık; keskin fotoğraf 4 ve kareler
  1/61/114 öbür kenarı göstermiyordu; sahip iki kenar dedi.
- Taş sayısı bedenle büyür (iki sıra, her biri her bedende tam tur): 2 × ceil(π × (iç çap + 2,0) / 1,5) → US 4 72, US 8½ 88,
  US 16 112 (US 8½'te ~0,79 ct).

## Maliyet (üretici teklifi YOK; tedarikçi notları tarandı: bu tasarım için teklif yok)
- Konvansiyon (VB6/TMC9 ile aynı üretici): 14K gram × $100 (altın + işçilik); 10K/18K $/g panelin kuralı
  `derivePurchaseCentsPerGram` (spot $3.539, gold-api 2026-11-21 07:44Z): 10K $80,77, 18K $118,77.
- Gram üreticinin 14K bant listesinden, 6,0 × 1,8 mm tam kesit (pah ve yuvalar tampon): US 8½ 14K 9,17 g (10K 8,18,
  18K 10,43); US 16 14K 11,95 g.
- Taş $280/ct × 0,009 = $2,52 + boncuk takma $4 (DSP notundaki tırnak ücreti; boncuk için kalibre değil) = $6,52/taş;
  US 8½'te 88 taş = $573,76.
- US 8½ maliyet: 10K $1.234,50 · 14K $1.490,86 · 18K $1.812,23; + paket $8 + kargo $22.

## Fiyat (tek fiyat her beden ve renkte, ayar başına; %25 vitrin; iki sıra)
| Ayar | Liste | Alıcı | Taban (her beden ≥ $50, en kötü Offsite) | Motor listesi (US 8½) | Kâr US 4 / 8½ / 12 / 16 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| 10K | $2.650 | $1.987,50 | $2.615 | $2.615 | +658 / +434 / +275 / +77 |
| 14K | $3.150 | $2.362,50 | $3.105 | $3.145 | +788 / +517 / +322 / +82 |
| 18K | $3.850 | $2.887,50 | $3.720 | $3.810 | +1.000 / +671 / +430 / +138 |

- %35 vitrinde US 12'ye kadar ≥ 0, US 16'da −163 / −203 / −210. Alternatif 10K $3.050 / 14K $3.600 / 18K $4.300 %35'te de
  her bedende ≥ 0 (tabanlar 3.015 / 3.580 / 4.295).
- Tek sıra okumasıyla kartta seçilen 2.100 / 2.600 / 3.250 kullanılmıyor (iki sırada US 12'den zarar).
- Piyasa: Blue Nile "Men's Beveled Edge Diamond Band 14K Yellow 6.5 mm" (item 196251, okuma 2026-11-21): doğal H-I SI2,
  1/2 ct, 44 taş, **iki kenarda** birer sıra, "This ring cannot be resized", $2.541 (indirimli, liste $3.630). 6 mm 14K
  saten/pah erkek pırlanta bantları ~$1.400-3.200 (arama 2026-11-21).

Kanıt: `price_model.py sde`, üreteç `scripts/eon/gen_lab_grown_sde_migration.mjs` (listing.json'daki tabloları bağımsız
yeniden hesaplayıp karşılaştırır). Kuru koşu mührü `caa0e2ed9f235d8e0682254b5df3feab` (225 varyant, iki sıra).
