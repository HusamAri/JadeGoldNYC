# EON lab-grown 02: Vertical Baguette band fiyatı (2026-11-07)

Model: `price_model.py vb` (bu klasör). Ürün: `EON-VB6`, paket `02-vertical-baguette/`.

## Girdi (birebir)
WhatsApp 2026-11-07, üretici bir fotoğraf (PISSARRO filigranlı, üçüncü tarafın ürünü: fırçalanmış düz sarı bant, bandın
enine tek baget, yüzeyle aynı hizada) ve iki mesaj gönderdi: "abi bizim ki 6mm" / "liste de 2 numara da hesabi yaziyor".

El yazısı not, Model 2: "6 mm için Baguette. Minimum 2.20 mm thickness. Minimum 6 mm. 0.35 ct 6×2 taş ölçüsü.
8½ size 11,5 gram. taş fiyat 280$ 1 ct. 1150$. taş takma 10$"

Sahibin referans listing'i: etsy.com/listing/4405323901 (moissanite, 4 × 2 mm taş). Konteynerden okunamadı
(Etsy 403, okuyucu vekil de 403); tasarım referansı üreticinin fotoğrafı.

## $1.150 neyi kapsıyor?
**11,5 g × $100 = $1.150, tam.** Üreticinin 14K bant listesi "gram × $100, işçilik dahil, ek kalemler ayrı"
(`docs/artifact-studio/maker_cost.py`, 150/150 hücre). Taş ($280/ct) ve takma ($10) notta ayrı satır. Yani:

| Okuma | Üretici maliyeti (US 8½) | Landed (+ paket $8 + kargo $22) |
|---|---|---|
| **B (konvansiyon): $1.150 + taş 0,35 ct × $280 = $98 + takma $10** | **$1.258** | **$1.288** |
| A: $1.150 her şey dahil | $1.150 | $1.180 |

B kötümser ve aritmetikle tutan okuma; fiyat onunla kuruldu. Gram üreticinin kendi beden listesi eğrisiyle
(0,836 + 0,0515 × US) 11,5 g / US 8½'e sabitlendi: US 4 9,41 g → US 16 14,99 g (liste formülü 6 × 2,2 mm US 8½'te
11,21 g veriyor, üretici 11,5 g: +%2,6).

Canlı spot $4.072,10 (gold-api.com 2026-11-07); 14K melt $76,59/g, üreticinin $100/g'ı içinde işçilik ~$23,41/g.

## Perakende (EON motoru, ×1,55, en kötü Offsite'ta kâr ≥ $50)
| Okuma | Motor | Liste @ %25 | Alıcı | Kâr (en kötü Offsite) |
|---|---|---|---|---|
| **B** | $1.996 | **$2.665** | **$1.999** | $420 |
| A | $1.829 | $2.440 | $1.830 | $376 |

Tek fiyat (B, $2.665) beden beden en kötü Offsite kârı: US 4 +$630 · US 8½ +$420 · US 13 +$211 · US 16 +$72.
%35 vitrinde US 13 ve üstü sıfırın altına iner; fiyat Kasım'da çalışan %25 için kurulu (siparişler 05-06 Kas:
%25 ve %15; %35 en son 28 Eki). Beden başına motor (B, %25): US 4 $2.230 … US 8½ $2.665 … US 16 $3.385.

Piyasa çapası (2026-11-07 okuma): JAXXON Beveled Diamond Baguette Band 6mm, solid 14K, tek 0,10 ct lab baget,
6-10 g: $1.299. VRAI Brushed Baguette Band 4,5 × 2,03 mm, 0,10 ct lab, channel: 14K rose $1.450, platin $1.955.
Bizimki 11,5 g ve 6 × 2 mm taş (rakiplerin 3,5 katı karat iddiası, teyitsiz); B okumasında maliyetimiz ($1.288)
JAXXON'un perakendesine yakın, yani o fiyata inmek zarar demek.

## Karar (sahip, 2026-11-07, soru kartı)
- Fiyat: **liste $2.665 → %25 vitrinle $1.999, her beden tek fiyat.**
- Kapsam: **14K, Yellow/White/Rose, US 4–16 yarım bedenler (75 varyant)**, `ring_band` (alyans değil).
- Galeri: 10 kare, amber + teal ışık (onaylı prompt seti `02-vertical-baguette/images/prompts.json`).
- EON-DSP: fiyat aynı kalır, üreticiye kapsam sorulur (aşağıda).

## DSP'ye etkisi (canlı listing, $1.200 → %25 ile $900)
Model 2'nin aritmetiği üreticinin taşlı modellerde de gram × $100 yazdığını gösteriyor; DSP'nin $550'ı da 2,75 × 2,50 mm
profilin liste gramıyla 5,48 g × $100 = $548. Taş ve takma ayrıysa DSP'nin en kötü Offsite kârı (alıcı $900):

| Okuma | Landed | Kâr std | Kâr en kötü Offsite |
|---|---|---|---|
| A $550 her şey dahil | $580 | +$234 | +$134 |
| B + takma 13 × $4 | $632 | +$182 | +$82 |
| C + taş 0,78 ct × ~$100/ct | $710 | +$104 | +$4 |
| C' + taş 0,78 ct × $280/ct (Model 2 oranı) | $850 | −$36 | −$136 |

Sahip kararı: fiyat aynı, önce üretici. Cevap B/C ise DSP `price-sync` kuru koşu → onay → yazım ile düzeltilir.

## Açık (üretici)
1. $550 (Model 1) ve $1.150 (Model 2) fiyatlarına taş ve taş takma dahil mi?
2. Model 2'de 6 × 2 mm baget gerçekten 0,35 ct mi? (Düz baget 6 × 2 mm genelde ~0,15-0,20 ct; listing'de karat yazılmadı.)
3. Bedene göre fiyat değişir mi (US 4 ≈ 9,4 g, US 16 ≈ 15,0 g)?
4. Taş rengi/berraklığı, beyaz altında rodyum, üretim süresi.
