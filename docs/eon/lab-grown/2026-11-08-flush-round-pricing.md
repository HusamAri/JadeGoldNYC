# EON lab-grown 03: Flush Round band fiyatı (2026-11-08)

Model: `price_model.py fr` (bu klasör). Ürün: `EON-FR6`, paket `03-flush-round/`.

## Girdi
Sahip 2026-11-08: "https://www.etsy.com/listing/4512052520/round-cut-moissanite-diamond-mens … new listing oluştur".

Referans (okuma 2026-11-08; Etsy konteynere doğrudan 403 veriyor, sayfa Google çeviri vekiliyle
`www-etsy-com.translate.goog` okundu, 8 fotoğraf `i.etsystatic.com`'dan doğrudan indi):
- "Round Cut Moissanite Diamond Men's Wedding Ring, 14K Solid Yellow Gold Delicate Men's Ring, Simple Diamonds Ring,
  Unisex Band Ring Gift"; AarsanJewels, Hindistan'dan gönderim, 2026-10-23'te listelendi, 5,0★ / 8 yorum.
- Künye (açıklamadan birebir): "Band Width: 6.00 MM (± 0.10)", "Band Thickness: 1.50 MM (± 0.10)", "Main Stone Shape:
  Round Brilliant Cut", "Main Stone Weight: 0.10 (∓0.05) Carat", "Type: Moissanite", "Setting Type: Flush Setting
  (Gypsy Set)", "Design: Men's Wedding Band (Brushed Finish & Grooved)".
- Fiyat (%25 indirimli / öncesi): 14K **$800,91** / $1.067,88 · 10K $637,09 · 18K $1.050,67 · gümüş $173,56 ·
  platin $1.177,93; US 3–11 çeyrek bedenler.
- Fotoğraftan tasarım: düz yüz, fırçalanmış satin; iki kenarda dar cilalı faset; tek ince cilalı kanal, kenarlara
  paralel, merkez dışı (~3 : 2; ref01/ref03'te alt kenara yakın, ref06'da çevrilmiş); taş kanalın tam üstünde,
  ince cilalı kenarlıkla flush. **Taş kenarlığıyla bant genişliğinin ~1/3'ü = ~2,0 mm** (üç fotoğrafta 0,30 / 0,33 /
  0,32). İlan edilen 0,10 ct (≈3 mm) 1,5 mm duvara flush oturmaz (taş derinliği ~1,8 mm); 2,0 mm (≈0,03 ct,
  derinlik ~1,2 mm) oturur.

## Maliyet (üretici teklifi YOK)
Aynı üretici, aynı konvansiyon (VB6'da 11,5 g × $100 = $1.150 tam tuttu): 14K bant = gram × $100 (altın + işçilik),
taş ve takma üstüne.

| Kalem (US 8½) | Değer | Kaynak |
|---|---|---|
| Gram | 7,64 g | üretici listesi `list_g14(6, 8.5, 1.5)`, tam dikdörtgen kesit |
| Altın + işçilik | $764,25 | × $100/g |
| Taş 2,0 mm round lab | $20 | bilinen tek lab oranı $280/ct → 0,03 ct $8,40; tek taş için $20 (kalibre değil) |
| Flush takma | $10 | Model 2'nin taş başı takma ücreti |
| **Üretici maliyeti** | **$794,25** | |
| Landed (+ paket $8 + kargo $22) | $824,25 | |

Faset + kanal ~%5 metal alır (US 8½'te ~0,38 g ≈ $38); maliyette ince işçilik (kanal, faset cilası) tamponu olarak
bırakıldı. Kamuya açık metin düşük rakamı söyler: "about 7 grams in US 8.5". Canlı spot $4.072,10
(gold-api.com 2026-11-08 20:10 UTC, hafta sonu); 14K melt $76,59/g, üreticinin $100/g'ı içinde işçilik ~$23,41/g.

## Perakende (EON motoru, ×1,55, en kötü Offsite'ta kâr ≥ $50)
- US 8½ motoru: engine $1.278 → **liste $1.705 → %25 vitrinle $1.279**, kâr (en kötü Offsite) +$233.
- Tek fiyatta US 16 dahil her beden ≥ $50: liste ≥ **$1.780** (alıcı $1.335).
- Beden başına motor (%25): US 4 $1.420 … US 8½ $1.705 … US 16 $2.185. Gram US 4 6,25 g → US 16 9,96 g.

Tek fiyat, bedene göre kâr (en kötü Offsite, %25 vitrin):

| Liste → alıcı | US 4 | US 8½ | US 13 | US 16 |
|---|---|---|---|---|
| **$1.800 → $1.350** | +$436 | +$297 | +$158 | +$65 |
| $1.705 → $1.279 | +$372 | +$233 | +$94 | +$1 |
| $1.600 → $1.200 | +$300 | +$161 | +$22 | −$70 |

%35 vitrinde $1.800 listede US 13 ve üstü sıfırın altına iner (US 13 −$5, US 16 −$98); fiyat Kasım'da çalışan %25
için kurulu (siparişler 05-06 Kas: %25 ve %15; %35 en son 28 Eki).

## Piyasa çapası (2026-11-08 okuma)
- JAXXON Modern Classic Diamond Solitaire Band 6mm: solid 14K, tek 0,10 ct lab, flush, cilalı, 5–9 g: **$1.199**
  ("traditional retail" $1.800).
- Dreamstone Mens Single Diamond Wedding Band, 14K beyaz, 6 mm (SKU), 1/15 ct lab F/VS2: **$1.400**.
- Virabyani bezel set single diamond mens band, 14K, lab E-F/VS: $1.241 (indirimli, $1.773'ten; arama özeti).
- Referans Aarsan (moissanite, Hindistan): 14K $800,91. Bizim üretici maliyetimiz ($794) onun perakendesine eşit;
  o fiyata inmek zarar demek.

## Öneri ve karar
Öneri: **liste $1.800 → %25 ile $1.350, her beden tek fiyat** (her beden en kötü Offsite'ta ≥ $50; JAXXON ile Dreamstone
arasında; DSP'nin $1.200 → $900 deseni gibi yuvarlak). Kapsam VB6 ile aynı: 14K, Yellow/White/Rose, US 4–16 yarım
bedenler (75 varyant), `ring_band`.

**Karar (sahip, 2026-11-08, soru kartı): liste $1.800 → %25 vitrinle $1.350, her beden tek fiyat; galeri: 10 karenin
hepsi üretilsin.** Panel taslağı `0179_eon_lab_grown_fr6` ile canlıda (ürün `7675f0e3-9fae-4f6a-bca3-81b1562a6c17`,
75 varyant, mühür `2f1eccd3a9bc2d9344ed06818a43456f`).

## Açık (üretici)
1. Bu tasarımın teklifi: 6 × 1,5 mm faset + kanal + tek flush round için fiyat (gram × $100 + taş + takma mı?).
2. 1,5 mm duvara flush oturacak en büyük round (öneri 2,0 mm ≈ 0,03 ct); daha büyük taş isterse minimum kalınlık.
3. Taş rengi/berraklığı, beyaz altında rodyum, üretim süresi, bedenle fiyat değişir mi.
