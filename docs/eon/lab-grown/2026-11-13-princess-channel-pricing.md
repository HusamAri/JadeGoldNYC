# EON lab-grown 06: Princess Channel band fiyatı (2026-11-13)

Model: `price_model.py pc` (bu klasör). Ürün: `EON-PC9`, paket `06-princess-channel/`.

## Girdi
Sahip 2026-11-13: "https://www.25karats.com/classic-9-stone-princes-cut-diamond-anniversary-band-1-2-ct-t-w?variant_id=41473-14K-White-Gold
new model" (model değişince "Try again").

Referans (okuma 2026-11-13; site konteynere Cloudflare 403, Google çeviri vekili 429 verdi; sayfa `r.jina.ai` okuyucu
vekiliyle okundu, 4 fotoğraf `25karats.com/jewelry-assets/pi/…/thumb_800/` yolundan doğrudan indi; repoya alınmadı):
- "Classic 9 Stone Princes Cut Diamond Anniversary Band (1/2 ct.t.w.)", stil **WB9262**, 14K beyaz altın, **$1.669**
  (indirimsiz, doğal elmas).
- Künye (sayfadan birebir): "channel set diamond band features 9 princess cut 0.45 ct. t.w. diamonds", "designed with
  comfort fit inside", "Precious Metal Weight: Approximately 2.9 grams", "9 Princess 0.05 ct. / 2x2 mm • GH / VS".
- Fotoğraftan tasarım: düz üstlü bant; üstte iki ince cilalı ray arasında tek kanal, içinde 9 kare prenses taş kenar
  kenara; sıranın iki ucu düz, cilalı bir duvarla kapanıyor; sıra yalnız ön üstte (9 × 2 mm ≈ 18 mm), gövdenin geri
  kalanı düz cilalı altın. Beyaz önden karede sıranın ortası kameraya dik bakıyor: taş 69 px = 2 mm; iki ray
  ~12–22 px = ~0,35–0,6 mm (yakın ray yuvarlak kenarı da içeriyor) → **bant ~3,0 mm**.
- Fizik: 2 mm prenses taşın derinliği ~1,4 mm (~%70). Kanal en az ~1,7–1,8 mm et ister; referansın 2,9 g'ı ancak
  ~3,0 × 1,6 mm, konfor kesimli bir bantla tutar (kanal boşluğu 18 × 2 × 1,4 mm ≈ 0,68 g metal alır). Tasarım
  **3,0 × 1,8 mm** (taşın altında ~0,4 mm taban); teyit üreticiye soru.

## Maliyet (üretici teklifi YOK)
Aynı üretici, aynı konvansiyon (VB6'da 11,5 g × $100 = $1.150 tam tuttu): 14K bant = gram × $100 (altın + işçilik),
taş ve takma üstüne. Okuma kötümser: tam kesit gram (kanal boşluğu tampon), taş başı $10 kanal takma.

| Kalem (US 8½) | Değer | Kaynak |
|---|---|---|
| Gram | 4,59 g | üretici listesi `list_g14(3, 8.5, 1.8)`, tam dikdörtgen kesit |
| Altın + işçilik | $458,55 | × $100/g |
| Dokuz taş 2 mm prenses lab | $126 | bilinen tek lab oranı $280/ct × 0,05 ct = $14/taş (kalibre değil) |
| Dokuz kanal takma | $90 | taş başı $10 = Model 2'nin kanal (baget) ücreti; DSP'nin $4'ü tırnak içindi (kalibre değil) |
| **Üretici maliyeti** | **$674,55** | |
| Landed (+ paket $8 + kargo $22) | $704,55 | |

Kanal boşluğu ~0,68 g metal alır (US 8½'te ~$68); bu fark kanal işçiliğine tampon olarak maliyette bırakıldı. Kamuya açık
metin düşük rakamı söyler: "about 4 grams in US 8.5" (4,59 − 0,68 = 3,91 g). Canlı spot $3.887,87 (gold-api.com
2026-11-13 16:44 UTC); 14K melt $73,12/g, üreticinin $100/g'ı içinde işçilik ~$26,88/g.

Panel tarafı: `variant_stone_cost` taş tarafını $126 + 9 × $10 (`setting_fee_cents` 1000) = $216 görür.

## Perakende (EON motoru, ×1,55, en kötü Offsite'ta kâr ≥ $50)
- US 8½ motoru: engine $1.092 → **liste $1.460 → %25 vitrinle $1.095**, kâr (en kötü Offsite) +$186.
- Tek fiyatta US 16 dahil her beden ≥ $50: liste ≥ **$1.465** (alıcı $1.098,75); %35 vitrinde ≥ $1.690.
- Beden başına motor (%25): US 4 $1.285 … US 8½ $1.460 … US 16 $1.745. Gram (tam kesit) US 4 3,75 g → US 16 5,98 g.

Tek fiyat, bedene göre kâr (en kötü Offsite):

| Liste → alıcı | US 4 | US 8½ | US 12 | US 16 | %35 vitrinde |
|---|---|---|---|---|---|
| $1.450 → $1.087,50 | +$263 | +$179 | +$114 | +$40 | US 12'den itibaren zarar (US 16 −$91) |
| **$1.500 → $1.125** | +$297 | +$213 | +$148 | +$74 | US 12 +$12, US 14 −$25, US 16 −$62 |
| $1.550 → $1.162,50 | +$330 | +$247 | +$182 | +$108 | US 14 +$5, US 16 −$32 |
| $1.600 → $1.200 | +$364 | +$281 | +$216 | +$142 | US 16 başabaş (−$3) |

## Piyasa çapası (2026-11-13 okuma)
- Referans 25karats WB9262, doğal elmas GH/VS 0,45 ct, 14K: **$1.669** (indirimsiz).
- Allurez "princess cut channel set lab grown diamond ring 14K white gold 1/2 ct": 9 prenses lab-grown taş, F-G / VS1,
  14K beyaz kanal: **$1.033** (liste $2.506'dan indirimli; arama özeti).
- Blue Nile "channel set princess cut lab grown diamond ring 14K 1/2 ct tw": 19 küçük taş (9 değil), $1.220 → %40 ile
  $732 (arama özeti).
- Lab-grown hattı: DSP $1.200 → $900; HEP $1.050 → $787,50; HS5 ve FR6 $1.800 → $1.350; VB6 $2.665 → $1.999.

## Öneri
**Liste $1.500 → %25 vitrinle $1.125, her beden tek fiyat.** Kötümser maliyetle US 16 dahil her beden en kötü Offsite'ta
≥ +$74; alıcı fiyatı Allurez'in aynı tasarımdaki lab-grown bandının ($1.033) biraz üstünde, bizim bant daha kalın
(1,8 mm, referans ~1,6 mm). $1.465 kâr tabanı, $1.600 %35 vitrine dayanıklı seçenek. Kapsam seri ile aynı: 14K,
Yellow/White/Rose, US 4–16 yarım bedenler (75 varyant), `ring_band`.

## Açık (üretici)
1. Bu tasarımın teklifi: 3,0 × 1,8 mm bant, üstte 9 × 2 mm prenses lab-grown taş kanal yuvada (gram × $100 + taş + taş
   başı takma mı? kanal takma kaç $?).
2. 2 mm prenses için en az kalınlık (öneri 1,8 mm; referans ~1,6 mm, 2,9 g); iç yüzey konfor kesim mi düz mü.
3. Taş sayısı bedenle sabit 9 mu (sıra ~18 mm); küçük bedende (US 4) sıranın çevreye oranı; resize sıranın dışında,
   arkadaki düz kısımdan kaç beden yapılır.
4. Taş rengi/berraklığı (referans GH/VS doğal), beyaz altında rodyum, üretim süresi, bedenle fiyat değişir mi.
