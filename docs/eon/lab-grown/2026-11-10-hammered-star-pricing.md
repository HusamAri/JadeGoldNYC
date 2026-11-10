# EON lab-grown 04: Hammered Star band fiyatı (2026-11-10)

Model: `price_model.py hs` (bu klasör). Ürün: `EON-HS5`, paket `04-hammered-star/`.

## Girdi
Sahip 2026-11-10: "https://www.etsy.com/listing/4581494716/celestial-hammered-moissanite-ring-925 … yeni ürün.
görsellerde doğal ışık ve metal dokularını koruyarak görseller üret. daha doğal ve renk tonlarını color theory'e
göre ürünü ortaya çıkaracak şekilde kur."

Referans (okuma 2026-11-10; Etsy konteynere 403, sayfa Google çeviri vekiliyle `www-etsy-com.translate.goog`
okundu, 9 fotoğraf `i.etsystatic.com`'dan doğrudan indi):
- "Celestial Hammered Moissanite Ring, 925 Sterling Silver Men's Wedding Band, Anniversary Gift"; BRIARLORE,
  San Marino CA'dan gönderim, 2026-11-05'te listelendi, yorum yok. Seçenekler yalnız 925 gümüş ve kaplama
  (sarı/rose/siyah); US 5–12 çeyrek bedenler. Fiyat **$175,81** (gümüş).
- Künye (açıklamadan birebir): "Band Width - About 5 mm", "Stone - 2 round brilliant-cut moissanite stones",
  "Stone Size - About 2.3 mm each", "Total Stone Weight - About 0.08 ctw DEW", "Surface - Hammered texture";
  "two starburst-set moissanite stones".
- Fotoğraftan tasarım: düz yüzlü bant, bütün dış yüz iç içe geçmiş yuvarlak dövme izleriyle kaplı (her iz
  ~1,2–2 mm, içinde merkezden yayılan ince saten çizgi); iki kenarda dar cilalı kenar; iç yüzey cilalı. İki
  taş, önde, ön merkezin iki yanında simetrik, ~79° arayla (ref01: ±39°); her taş sekiz uçlu oyma bir
  yıldızın ortasında (dört uzun ışın bant boyunca ve enine, dört kısa ışın çaprazlarda; ışınlar cilalı V kesim,
  taşı ışın diplerindeki küçük boncuklar tutuyor). **Taş bant genişliğinin 0,27–0,33'ü = ~1,4–1,6 mm**
  (ref01 önden 0,27, ref05 parmakta 0,33); yıldızın uçtan uca açıklığı 3,5–4,1 mm (genişliğin ~%75'i).
  İlan edilen 2,3 mm (derinlik ~1,4 mm) 1,5 mm duvarda güvenli oturmaz; 1,5 mm (≈0,013 ct, derinlik ~0,9 mm)
  oturur. Fotoğraflar yapay görüntü (filigranlı, aynı ahşap + bokeh); ölçü fotoğrafla tutarlı alındı.

**Sahip düzeltmesi (2026-11-10, hero v1'den sonra):** "olmadı görsel. taşlar 4 adet eşik [eşit] aralıkta konumlanmış
olmalı" → tasarım DÖRT taş, bant çevresinde çeyrek tur (90°) arayla. Referansın önden fotoğrafındaki iki yıldız (±~40°)
bununla tutarlı: öbür ikisi arka yarıda. Aşağıdaki maliyet ve kâr tabloları dört taşa göre (iki taşlı ilk hesap:
maliyet $727, US 16 +$171; git geçmişinde).

## Maliyet (üretici teklifi YOK)
Aynı üretici, aynı konvansiyon (VB6'da 11,5 g × $100 = $1.150 tam tuttu): 14K bant = gram × $100 (altın +
işçilik), taş ve takma üstüne.

| Kalem (US 8½) | Değer | Kaynak |
|---|---|---|
| Gram | 6,37 g | üretici listesi `list_g14(5, 8.5, 1.5)`, tam dikdörtgen kesit |
| Altın + işçilik | $636,88 | × $100/g |
| Dört taş 1,5 mm round lab | $40 | bilinen lab oranı $280/ct → 0,052 ct $14,56; taş başı $10 (kalibre değil) |
| Dört yıldız takma | $80 | taş başı Model 2 flush ücreti $10 + sekiz ışın oyması $10 (kalibre değil) |
| Dövme doku | $30 | halka başı (kalibre değil) |
| **Üretici maliyeti** | **$786,88** | |
| Landed (+ paket $8 + kargo $22) | $816,88 | |

Dövme izleri ~%5 metal alır (US 8½'te ~0,32 g ≈ $32); bu fark ayrıca dövme işçiliğine tampon olarak
maliyette bırakıldı. Kamuya açık metin düşük rakamı söyler: "about 6 grams in US 8.5". Canlı spot $4.023,50
(gold-api.com 2026-11-10 17:19 UTC); 14K melt $75,67/g, üreticinin $100/g'ı içinde işçilik ~$24,33/g.

Panel tarafı: `variant_stone_cost` taş tarafını $40 + 4 × $20 (yuva + ışın, `setting_fee_cents` 2000) = $120 görür;
$30 dövme işçiliğinin panelde alanı yok, `listing_metadata.stone.textureFeeCents`'te durur.

**Sonradan bulunan çapa (üreticinin 2026-11-04 notu, README "Diğer teklifler"):** Model 3, yıldız tasarım 6 mm, 4 taş,
14K US10 **$850** ("casting ≈ $110 gibi düşün"). Bizim 5 mm tahminimiz US10'da 6,75 g × $100 + $150 = **$825**;
6 mm'nin altını (8,10 g) daha fazla olduğu için 5 mm'de üreticinin fiyatı büyük olasılıkla bunun altında kalır, yani
tahmin muhafazakâr. Casting $850'nin dışındaysa 6 mm $960 olur; 5 mm tahminimiz yine aynı bantta. Tahmine dayanıp
fiyat düşürülmez; teyit üreticiye soru 7 (README).

## Perakende (EON motoru, ×1,55, en kötü Offsite'ta kâr ≥ $50)
- US 8½ motoru: engine $1.266 → **liste $1.690 → %25 vitrinle $1.268**, kâr (en kötü Offsite) +$230.
- Tek fiyatta US 16 dahil her beden ≥ $50: liste ≥ **$1.710** (alıcı $1.282,50).
- Beden başına motor (%25): US 4 $1.450 … US 8½ $1.690 … US 16 $2.090. Gram US 4 5,21 g → US 16 8,30 g.

Tek fiyat, bedene göre kâr (en kötü Offsite):

| Liste → alıcı | US 4 | US 8½ | US 13 | US 16 | %35 vitrinde |
|---|---|---|---|---|---|
| $1.700 → $1.275 | +$352 | +$237 | +$121 | +$43 | US 12'den itibaren zarar (US 16 −$110) |
| **$1.800 → $1.350** | +$420 | +$304 | +$189 | +$111 | US 14 başabaş, US 16 −$52 |
| $1.900 → $1.425 | +$488 | +$372 | +$256 | +$179 | her beden kârda (US 16 +$7) |
| $2.100 → $1.575 | +$624 | +$508 | +$392 | +$315 | her beden kârda (US 16 +$125) |

## Mağaza içi ve piyasa çapası (2026-11-10 okuma)
- EON'un kendi düz dövme bandı "14K Gold Hammered Wedding Band, Beveled Edges, Comfort Fit, 4-8mm"
  (Etsy 4565377715): 5 mm US 8½ liste **$2.005** (5,43 g) → %25 ile $1.503,75. **Satış: 0** (panel `sale_items`).
- EON'da satan tek dövme bandı "10K Gold Hammered Wedding Band, Milgrain Edge, Comfort Fit" (4543442596):
  4 satış (2026-08-07 … 10-09), ortalama birim **$1.047,50** (5–6 mm, US 7–8½).
- Brilliant Earth "Polished 5mm Starburst Diamond Wedding Band" 14K sarı (BE2D928): 5,0 mm, 12 round doğal
  elmas (en az 0,051 ctw), **$2.290** (sayfa çeviri vekiliyle okundu; Cloudflare doğrudan 403).
- Blue Nile 14K sarı 4 mm comfort fit dövme bant $950; Icing on the Ring 14K 6 mm dövme $895–1.150; Allurez
  "shooting star" 14K beyaz 0,15 ct $1.954 (indirimli) — üçü de arama özeti, sayfa okunmadı.
- Referans BRIARLORE gümüş + moissanite $175,81: altın seçeneği listing'de yok.

## Öneri ve karar
İlk öneri (iki taşla): **liste $1.800 → %25 ile $1.350, her beden tek fiyat** — o hesapta %35 vitrinde de her beden
kârdaydı (US 16 +$8),
lab-grown hattında FR6 ile aynı fiyat noktası, mağazanın satan dövme bandının (~$1.050, 10K) üstünde ve
satmayan 14K düz dövme bandının ($1.504) altında. Kapsam seri ile aynı: 14K, Yellow/White/Rose, US 4–16 yarım
bedenler (75 varyant), `ring_band`.

Dört taşla (ikinci kart) seçenekler: $1.800 korunur (%25'te her beden kârda, en düşük US 16 +$111; %35'te US 14
başabaş, US 16 −$52; FR6 ile aynı fiyat, maliyetleri neredeyse eşit) ya da $1.900 (%35 payı geri gelir). Öneri: $1.800.

**Karar (sahip, 2026-11-10, iki soru kartı):** liste **$1.800 → %25 vitrinle $1.350**, her beden tek fiyat (dört taşla da
korundu); kapsam 14K,
üç renk, US 4–16 yarım bedenler (75 varyant). Galeri: 10 karenin hepsi `images/PROMPTS-REVIEW.md`'den, önce hero
üretilip referansla yan yana kontrol edilir. Panel taslağı `0182_eon_lab_grown_hs5` ile canlıda (ürün
`6414f890-0ffd-4325-a60f-b5ce121c00e0`, varyant mührü `84001e3e3e8310a04d5a86f7249c6fd3`, denetimde 1 + 75 satır); dört
taş düzeltmesi `0183_eon_lab_grown_hs5_four_stones` ile (koşullu UPDATE, mühür aynı, denetimde 1 + 75 güncelleme).

## Açık (üretici)
1. Bu tasarımın teklifi: 5 × 1,5 mm dövme bant + dört yıldız yuvalı round (gram × $100 + taş + takma + ışın oyması
   + dövme mi?); Model 3 (yıldız, 6 mm, 4 taş, US10 $850) ile aynı iş mi, "casting ≈ $110" içinde mi?
2. 1,5 mm duvarda yıldız yuvasına oturacak taş (öneri 1,5 mm ≈ 0,013 ct); referansın ilan ettiği 2,3 mm için
   gereken en az kalınlık.
3. Dört yıldız çeyrek tur arayla (US 8½'te dış yüzde merkezden merkeze ~17 mm): bedenle açıyla mı ölçeklenir, resize
   aralığı bozmadan kaç beden yapılabilir.
4. Taş rengi/berraklığı, beyaz altında rodyum, üretim süresi, bedenle fiyat değişir mi.
