# EON lab-grown 07: Two-Tone Milgrain Channel (EON-TMC9), fiyat kanıtı, 2026-11-13

Girdi: sahibin 4 fotoğrafı (yapılmış gerçek parça, atölyede: cımbız, kâğıt havlu, parmaklar) + "New model. 10k 14k ve 18k
3 varyantlı". Fotoğraflar repoya alınmadı. Model: `price_model.py tmc`; üreteç `scripts/eon/gen_lab_grown_tmc_migration.mjs`
aynı sayıları panelin kendi fonksiyonlarıyla (`derivePurchaseCentsPerGram`, `V4`) bağımsız üretir ve her sayıyı sınar.

## Tasarım ve ölçü (fotoğraflardan oranla, ölçek nesnesi yok)
- İki ton: beyaz altın raylar (yuvarlatılmış dış kenar), her rayın iç kenarında beyaz milgrain boncuk hattı (tam tur),
  arada kubbeli cilalı sarı altın orta. Önde sarı ortaya kesilmiş tek kanal, içinde dokuz round taş kenar kenara; kanal
  son taşın biraz ötesinde yuvarlak uçla biter, sarı ortanın geri kalanı düz ve kubbeli. İç yüzey beyaz görünüyor.
- Oranlar: taş / milgrain arası 0,56-0,59 (üç fotoğraf), taş / bant ~0,40, bant / dış çap 0,28-0,30 ve taş / dış çap
  0,116 (iki asılı fotoğraf aynı), dokuz taş çemberin ~üçte biri (yan fotoğrafta uç taşların kısalması ~117-130°).
- Numune bedeni bilinmiyor. Erkek bedeninde (dış çap ~23-24 mm) bant ~6,4-7,3 mm, taş ~2,7-2,8 mm.
- **Tasarım: 7,0 mm, kubbe tepesinde 2,0 mm; 9 × 2,75 mm round (~0,08 ct, toplam ~0,72 ct).** 2,75 mm round ~1,68 mm
  derin. CLAUDE.md iki tonlu kuralının 1,6 mm'si düz iki tonlu bant içindir; kanal taşı daha kalın et ister (PC9'da 2 mm
  prenses için 1,8 mm). 7 mm iki tonlunun 4-8 mm aralığında ve motorun dar bant çarpanında (1,55; 8 mm ve üstü 2,0).

## Maliyet: ayar ve beden başına iki okumanın YÜKSEĞİ
- (a) Üretici konvansiyonu (VB6/PC9 ile aynı üretici): 14K gram × $100 (altın + işçilik). 10K/18K $/g panelin kuralıyla
  (`lib/gold-cost.ts` `derivePurchaseCentsPerGram`, spot $3.883,17, gold-api 2026-11-13 19:12Z): metal saflıkla
  ölçeklenir, 14K'nın işçilik primi ($26,96/g) sabit → **10K $78,90/g, 18K $120,60/g**. Gram × yoğunluk ×0,892 / ×1,137.
- (b) EON iki tonlu kuralı (CLAUDE.md 2026-09-29, `V4.laborTwoToneUsd`): melt × 1,07 + $250.
- (b) küçük bedenlerde bağlar (10K US 4-8½, 14K US 4-7, 18K US 4-6), (a) üstünde. Kural iki tonlu işçiliğin hiçbir
  bedende $250 kuralının altına düşmemesini sağlar.
- Gram: üreticinin 14K bant listesi, tam 7 × 2,0 mm kesit (US 8½: 10K 10,60 / 14K 11,89 / 18K 13,52 g). Kanal ~2,1 g
  metal alır, maliyette tampon olarak kalır (PC9 deseni); metinde "about 10 grams in 14K at US 8.5".
- Ekler: taş 9 × 0,08 ct × $280/ct = $201,60 (üreticinin bilinen tek lab oranı), kanal takma 9 × $10 = $90 (Model 2
  baget kanal ücreti). Paket $8, kargo $22. Hepsi kalibre değil; üretici teklifi yok.

| US 8½, %25 vitrin | 10K | 14K | 18K |
|---|---|---|---|
| altın (okuma) | $840,72 (iki ton) | $1.188,83 (üretici) | $1.630,15 (üretici) |
| maliyet / landed | $1.132,32 / $1.162,32 | $1.480,43 / $1.510,43 | $1.921,75 / $1.951,75 |
| motor (× 1,55) → liste | 1.802 → 2.405 | 2.341 → 3.125 | 3.025 → 4.035 |
| her bedende en kötü Offsite ≥ $50 tabanı | 2.305 | 2.980 | 3.830 |
| **öneri liste → alıcı** | **2.400 → 1.800** | **3.100 → 2.325** | **4.000 → 3.000** |
| en kötü Offsite kârı US 4 / 8½ / 12 / 16 | +474 / +366 / +252 / +117 | +675 / +493 / +325 / +133 | +935 / +663 / +432 / +168 |

- %35 indirimde tabanlar 2.660 / 3.440 / 4.415: önerilen fiyatlarda US 12'ye kadar sıfırın üstü, US 16'da −101 / −148 / −194.
- Duyarlılık (motor listesi 10K / 14K / 18K): 2,2 mm kalınlık 2.570 / 3.370 / 4.375; kanal boşluğu düşülürse 2.190 /
  2.760 / 3.490; taş $150/ct 2.210 / 2.930 / 3.840; 9 × 3,0 mm (0,90 ct) 2.510 / 3.230 / 4.140; 6 mm × 1,8 mm, 9 × 2,4 mm
  (0,45 ct) 1.970 / 2.505 / 3.185 (tabanlar 1.830 / 2.345 / 3.000).

## Piyasa (2026-11-13)
- Cirelli Jewelers, erkek iki tonlu 14K, dokuz round lab-grown, 1,00 ctw, kanal: **$2.425**.
- Kay, erkek lab-grown 1 ct tw 14K iki tonlu, 6,7 mm, on bir round kanal + milgrain: **$2.309,99** (liste $3.299,99; indirim
  bitiş tarihi geçmiş).
- Zales, erkek 1/2 ct doğal (J/I3) iki tonlu kanal milgrain bant: $1.399,99 (liste $1.999,99), stokta yok.
- Jared, erkek lab-grown 1 ct tw 14K iki tonlu, 6,4 mm: $3.990 (indirimli).
- EON hattı: DSP 1.200 → 900; HEP 1.050 → 787,50; PC9 1.500 → 1.125; HS5/FR6 1.800 → 1.350; VB6 2.665 → 1.999.
- 14K alıcı fiyatı $2.325, Kay ve Cirelli'nin arasında; bizim taş toplamı daha küçük (~0,72 ct), ayar seçimi ve sipariş
  üzerine üretim var.

## Üreticiye sorular (README madde 10)
Numunenin genişliği ve kalınlığı, taş boyu ve sayısı (bedenle sabit mi), iki ton gram × $100'e ek ücret mi, 10K ve 18K
$/g, iç yüzey metali, resize aralığı, taş rengi/berraklığı, beyaz altında rodyum, üretim süresi.
