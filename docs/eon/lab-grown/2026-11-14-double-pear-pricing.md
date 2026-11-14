# EON lab-grown 08: Double Pear Toi et Moi fiyatı (2026-11-14)

Model: `price_model.py dp` (bu klasör). Ürün: `EON-PEAR2`, paket `08-double-pear/`.

## Girdi
Sahip 2026-11-14: "https://www.etsy.com/listing/1522527544/155-tc-double-pear-cut-two-stone-ring new model".

Referans (okuma 2026-11-14; Etsy konteynere 403 verdi, sayfa Google çeviri vekiliyle
`www-etsy-com.translate.goog` üzerinden okundu: JSON-LD ve varyasyon seçicileri; 7 fotoğraf `i.etsystatic.com`'dan
doğrudan indi; repoya alınmadı):
- "1.55 TC Double Pear Cut Two Stone Ring • You N Me Wedding Ring • 14k Solid Yellow Gold" (TheAmericanGoldHouse,
  15 yorum, 5,0). 14K indirimli **$537,11**, renk fark etmiyor.
- Künye: **moissanite**, 8 × 6 mm armut "1.25 CT" + 5 × 3,5 mm armut "0.30 CT" (1.55 TC), bant "altta 1,8 mm",
  VVS/VS renksiz; metal 925 gümüşten 950 platine.
- Fotoğraftan tasarım: ince düz cilalı bant. Üstte iki armut yan yana; uzun eksenleri bandı dik kesiyor (parmak
  boyunca), uçları zıt yönde (takılı karede büyük taşın ucu parmak ucuna, küçüğünki ele bakıyor), yanları neredeyse
  değiyor. Her taş hafif dönük, ucu öbür taşa doğru eğik (iç içe duruş). Her biri alçak bir altın sepette üç tırnakla
  tutuluyor: biri uçta V, ikisi yuvarlak uçta. Yandan profilde sepet bandın hemen üstünde duruyor, uzun direk yok.
- Fizik: armut ağırlığı ≈ uzunluk × genişlik × derinlik × 0,0059; derinlik genişliğin ~%60'ı alındı.
  8 × 6 × 3,6 → **~1,02 ct**, 5 × 3,5 × 2,1 → **~0,22 ct**. Moissanite bunun ~0,91 katı (yoğunluk 3,21 / 3,52).
  Referansın "1.25 + 0.30" beyanı iki okumada da ~%25 fazla. Allurez'in 8 × 6 mm armutu "1.00 ct" diyor, bu tahmini
  bağımsız teyit ediyor. Kamuya açık metinde karat yazmıyor, üretici teyit edene kadar.

## Maliyet (üretici teklifi YOK)
Aynı üretici, aynı konvansiyon: VB6'da 11,5 g × $100 = $1.150 tam tuttu. 14K gram × $100 altın ve işçilik, taş ile
takma bunun üstüne. Okuma kötümser: gram tam dikdörtgen kesitten (gerçek profil yuvarlak), sepet gramı yukarı
yuvarlandı.

| Kalem (US 8½) | Değer | Kaynak |
|---|---|---|
| Gram | 3,45 g | `list_g14(1.8, 8.5, 1.6)` = 2,45 g tam kesit + iki sepet ve altı tırnak 1,0 g (8 × 6 sepet ~0,6 g, 5 × 3,5 ~0,3 g; kalibre değil) |
| Altın + işçilik | $344,56 | × $100/g |
| 8 × 6 mm armut lab-grown (~1,0 ct) | $200 | üreticinin tek taş ölçeği "1 ct $200" |
| 5 × 3,5 mm armut lab-grown (~0,22 ct) | $61,60 | bilinen tek küçük taş oranı $280/ct |
| İki tırnak takma | $40 | taş başı $20; bilinen ücretler paylaşımlı mikro tırnak $4, baget $10 (kalibre değil) |
| **Üretici maliyeti** | **$646,16** | |
| Landed (+ paket $8 + kargo $22) | $676,16 | |

Canlı spot $3.887,60 (gold-api.com, 2026-11-14 17:12 UTC); 14K melt $73,12/g, üreticinin $100/g'ının içinde işçilik
~$26,88/g. Gram US 4'te 3,00 g, US 16'da 4,19 g.

Panel tarafı: `variant_stone_cost` taş tarafını $261,60 + 2 × $20 (`setting_fee_cents` 2000) = $301,60 görür.

## Perakende (EON motoru, ×1,55, en kötü Offsite'ta kâr ≥ $50)
- US 8½ motoru: engine $1.048 → liste $1.400 → %25 vitrinle $1.050, kâr (en kötü Offsite) +$174.
- Tek fiyatla US 16 dahil her bedende ≥ $50 için liste en az **$1.330**; %35 vitrinde en az $1.535.

Tek fiyat, bedene göre kâr (en kötü Offsite):

| Liste → alıcı (%25) | US 4 | US 8½ | US 12 | US 16 | %35 vitrinde |
|---|---|---|---|---|---|
| $1.400 → $1.050 | +$218 | +$174 | +$139 | +$99 | US 14 −$7, US 15 −$17, US 16 −$27 |
| **$1.450 → $1.087,50** | +$252 | +$208 | +$173 | +$133 | her beden ≥ 0 (US 16 +$2) |
| $1.500 → $1.125 | +$286 | +$242 | +$207 | +$167 | US 16 +$32 |
| $1.550 → $1.162,50 | +$320 | +$275 | +$241 | +$201 | US 16 +$61 |

Duyarlılık ($1.450 liste, US 8½ farkı):
- 1 ct taş $300 olursa −$100.
- Küçük taş $100 olursa −$38.
- Sepetler 1,5 g olursa −$50.
- Bant 2,0 × 1,8 mm olursa −$61 (US 16'da −$80).
- Takma taş başı $10 olursa +$20.

Kötü dördü birden gerçekleşirse kâr US 8½'te −$42, US 16'da −$135 (en kötü Offsite). Offsite ücreti yoksa bu rakamlar
$100 yukarı çıkar. En büyük kalem 1 ct taş; onun $200'ü üreticinin kendi notu, tahminin en sağlam girdisi.

## Piyasa çapası (2026-11-14 arama özeti; fiyatlar değişir)
- Referans (moissanite, karşılaştırılabilir taş değil): $537,11.
- [Simon](https://shop.simon.com/products/1-1-4ct-pear-cut-toi-et-moi-diamond-ring-14k-gold-or-pt-lab-grown): 1 1/4 ct armut
  toi et moi, 14K, lab-grown: $786,49 (normal $1.572,98).
- [Ross-Simons](https://www.ross-simons.com/jewelry/rings/230327.html): 1,00 ct t.w. armut lab-grown bypass, 14kt sarı:
  $1.015,75 (indirimli).
- [RareCarat](https://www.rarecarat.com/wedding-ring/56-Toi-Et-Moi-Oval-&-Pear-Lab-Diamond-Ring-(1.00ct-tw)/40165): 1,00 ct
  tw oval + armut, 14K sarı: $1.200 ($360 kupon notu).
- [Leo Hamel](https://www.leohamel.com/product/new-1-00-carat-lab-grown-diamond-toi-et-moi-ring): 1,00 ct armut + oval,
  14K beyaz: $1.495 ($1.725'ten).
- [James Allen](https://www.jamesallen.com/fashion-rings/diamond-rings/14k-white-gold-toi-et-moi-lab-grown-pave-diamond-ring-item-281132):
  14K beyaz pavé toi et moi, 1,00 ct armut: $1.925 (sayfada $1.254 indirim de görünüyordu).
- [Allurez](https://www.allurez.com/diamond/diamond-rings/pear-and-round-cut-lab-grown-diamond-toi-et-moi-ring-14k-white-gold-2.00ct/pid/111032/29):
  8 × 6 mm armut 1,00 ct + round (toplam 2,00 ct), 14K beyaz: $2.288.
- Lab-grown hattımız: DSP $1.200 → $900; HEP $1.050 → $787,50; PC9 $1.500 → $1.125; HS5 ve FR6 $1.800 → $1.350;
  VB6 $2.665 → $1.999.

## Öneri
**Liste $1.450 → %25 vitrinle $1.087,50, her beden tek fiyat.** Kötümser maliyetle her beden en kötü Offsite'ta en az
+$133 kalıyor; %35 vitrine çıkılsa bile hiçbir beden zarar etmiyor (US 16 +$2). Alıcı fiyatı 1 ct lab-grown toi et moi
aralığının ortasında ($786–1.925). $1.400 motorun fiyatı, ama %35 vitrinde US 14–16 zarar eder; $1.500 daha geniş tampon.
Kapsam seri ile aynı: 14K, Yellow/White/Rose, US 4–16 yarım bedenler (75 varyant). Protokol `sculptural_ring`
(Jewelry > Rings); toi et moi bant değil, Width ekseni istemez.

## Açık (üretici)
1. Bu tasarımın teklifi: 1,8 × 1,6 mm ince bant, üstte 8 × 6 mm ve 5 × 3,5 mm armut lab-grown, her biri üç tırnaklı
   alçak sepette. Hesap gram × $100 + taş + taş başı takma mı, tırnak takma kaç $?
2. Taşlar: 8 × 6 mm armut ~1,0 ct mı, "1 ct $200" ölçeği armut için de geçerli mi; 5 × 3,5 mm armut (~0,22 ct) kaç $;
   renk ve berraklık.
3. Bant kalınlığı (tasarım 1,6 mm), iki sepet ve altı tırnağın gramı (tasarım 1,0 g), taşların banttan yüksekliği.
4. Resize aralığı (arkadaki düz kısımdan), beyaz altında rodyum, üretim süresi, fiyat bedenle değişir mi.
