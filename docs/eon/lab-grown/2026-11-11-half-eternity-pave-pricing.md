# EON lab-grown 05: taş seçimli yarım tur pavé bandın fiyatı (2026-11-11)

Model: `price_model.py hep` (bu klasör). Ürün: `EON-HEP`, paket `05-half-eternity-pave/`.

## Girdi
Sahip 2026-11-11: "https://www.etsy.com/listing/685259244/classic-natural-diamond-wedding-band18k … new model all stone
choices as specialization option" + listing'in kendi 20 taşlık tablosu ("Stone Available", Nobel Yates).

Referans (okuma 2026-11-11; Etsy konteynere 403, sayfa Google çeviri vekiliyle `www-etsy-com.translate.goog` okundu,
14 fotoğraf `i.etsystatic.com`'dan indi, repoya alınmadı):
- "Natural Diamond or Moissanite Wedding Band: 18K Gold Half Eternity Ring, Custom Stackable Matching Ring";
  NyFineJewelry (marka Nobel Yates Fine Jewelry), 5,0 yıldız, 320 yorum.
- Künye: "Shank: 1.35 mm width, 1.35 mm thickness", "Weight: Approx. 1.49 g", round taş "Approx. 0.184ctw".
- Varyasyonlar: Gemstone (Natural Diamond / Lab Grown Diamond / Moissanite) × Primary color (10K/14K/18K × 3 renk +
  platin). 14K alıcı fiyatı (%25 vitrin sonrası): moissanite **$336,75**, lab ~**$373,50**, doğal ~**$473,75**.
- Fotoğraftan tasarım (03 sarı, 09 beyaz önden): üst yarıda tek sıra round taş, taş bant genişliğine eşit (~1,3 mm),
  komşu taşlar arasında paylaşımlı minik tırnaklar (sıranın iki kenarında ince boncuk çizgisi), alt yarı düz cilalı.
  Önde ~21 taş (US 6 gibi): 21 × 0,009 = 0,19 ct, ilanın 0,184'üyle tutarlı.

## Tasarım ve taş seçimi
- 14K, Metal Color × Ring Size US 4–16 yarım bedenler (75 varyant), `ring_band`, her beden ve her taş tek fiyat.
- Bant **1,5 × 1,5 mm** (EON standart kalınlığı; referans 1,35). Taş **~1,3 mm**, üst yarıda, sayı bedenle değişir:
  yarım dış çevre / 1,45 mm adım → US 4 **19**, US 8½ **23**, US 16 **30** (kötümser; sabit sayı da olabilir, soru).
- Taş seçimi **varyasyon değil, kişiselleştirme açılır listesi** ("Stone", zorunlu, 20 seçenek). Neden: 20 taş × 75
  varyant = 1.500 > Etsy'nin 400 ürün sınırı. Etsy sınırları (canlı OpenAPI + personalization migration rehberi):
  açılır listede 1–30 seçenek, etiket ≤20 kr, `instructions` yasak; **add_on_price yalnız isteğe bağlı text_input'ta**,
  yani kişiselleştirme fiyatı değiştiremez → tek fiyat en pahalı taşı da karşılar.
- Eşleme (FTC: niteliksiz "diamond" doğal demektir §23.12; lab taşta ad hemen niteleyiciyle §23.23/23.25; inci
  "cultured"; işlem beyanı §23.22):

| Tablodaki ad | Etiket (≤20) | Köken / işlem | Taş başı (1,3 mm, kalibre değil) |
|---|---|---|---|
| Diamond | Lab Grown Diamond | lab (varsayılan, fotoğraftaki) | $2,52 ($280/ct) |
| Moissanite | Moissanite | lab-created (metin söyler) | $1,00 |
| Salt and Pepper Diamond | Salt Pepper Diamond | doğal ("&" ile 21 kr) | $4,50 (~$500/ct) |
| Black Diamond | Black Diamond | doğal, renk işlemli (kalıcı) | $2,00 |
| Sapphire / Ruby / Emerald | Lab Created … | lab | $1 / $1 / $2 |
| Alexandrite | Created Alexandrite | lab ("Lab Created" ile 23 kr; doğal melee binlerce $/ct) | $2,00 |
| Amethyst, Aquamarine, Topaz, Morganite, Tourmaline, Tanzanite | Amethyst, Aquamarine, Blue Topaz, Morganite, Pink Tourmaline, Tanzanite | doğal; akuamarin, morganit, tanzanit ısıl işlemli, mavi topaz ışınlanmış (kalıcı) | $0,75–4,00 |
| Opal, Moonstone, Rose quartz, Turquoise, Black Onyx | aynı adlar | doğal; turkuaz stabilize, oniks boyalı (kalıcı); opal/aytaşı/turkuaz yumuşak | $0,50–3,00 |
| Pearl | Cultured Pearl | kültür tatlı su tohum incisi, yumuşak | $1,00 |

Hattın kapısı (`lab_grown_gates.mjs`) bu paket için `allowNatural` ile açılır: açıklamada her "diamond" yine bir
niteleyiciyle (lab grown / laboratory-grown / mined / **natural**) geçer.

## Maliyet (üretici teklifi YOK)
Aynı üretici, aynı konvansiyon: 14K bant = gram × $100 (altın + işçilik), taş ve takma üstüne. Takma taş başı **$4**
(üreticinin DSP notu "taş takma $4", 2,4 mm taş; 1,3 mm mikro tırnak için kalibre değil).

| Kalem (US 8½) | Lab-grown pırlanta | En pahalı seçim ($5/taş) |
|---|---|---|
| Gram (tam kesit, liste) | 1,91 g → $191,06 | aynı |
| 23 taş | $57,96 | $115,00 |
| 23 takma | $92,00 | $92,00 |
| **Üretici maliyeti** | **$341,02** | **$398,06** |
| Landed (+ paket $8 + kargo $22) | $371,02 | $428,06 |

US 16 (2,49 g, 30 taş): lab $444,60, en pahalı $519,00. Canlı spot $4.003,70 (gold-api.com 2026-11-11 17:23 UTC);
14K melt $75,30/g, üreticinin $100/g'ı içinde işçilik ~$24,70/g. Kamuya açık metin "about 1.7 grams in US 8.5" der
(taş yuvaları ve yuvarlatılmış kenar tam kesitten metal alır); maliyet tam kesiti tampon olarak tutar.

## Perakende (EON motoru, ×1,55, en kötü Offsite'ta kâr ≥ $50)
- US 8½ lab motoru: engine $575 → **liste $770 → %25 vitrinle $577,50**, kâr +$65.
- Tek fiyatta US 16 dahil her beden ≥ $50: lab ile liste ≥ **$925** (alıcı $693,75); en pahalı taşla liste ≥
  **$1.035** (alıcı $776,25).
- Beden başına motor (%25, lab): US 4 $645 … US 8½ $770 … US 16 $985.

Tek fiyat, bedene ve taşa göre kâr (en kötü Offsite, %25 vitrin):

| Liste → alıcı | Lab: US 4 / 8½ / 13 / 16 | En pahalı taş: US 4 / 8½ / 13 / 16 | %35 vitrinde |
|---|---|---|---|
| $925 → $693,75 | +217 / +156 / +96 / +53 | +170 / +99 / +29 / **−22** | lab US 15'ten zarar; en pahalı US 13'ten |
| $1.000 → $750 | +268 / +207 / +146 / +104 | +221 / +150 / +79 / +29 | en pahalı US 13'ten zarar |
| **$1.050 → $787,50** | +302 / +241 / +180 / +138 | +255 / +184 / +113 / **+63** | lab her bedende ≥ $43; en pahalı US 14 başabaş, US 15–16 −$15/−$32 |
| $1.150 → $862,50 | +370 / +309 / +248 / +206 | +323 / +252 / +181 / +131 | her taş her bedende kârda (en düşük +$27) |

## Mağaza içi ve piyasa çapası (2026-11-11)
- Referans NyFineJewelry 14K lab ~**$373,50** alıcı (moissanite $336,75, doğal ~$473,75): bizim $787,50 bunun
  ~2,1 katı. Fark maliyetten: bizim US 8½ üretici maliyetimiz ($341) referansın satış fiyatına yakın; en büyük kalemler
  altın + işçilik ($191) ve taş başı takma ($92, 23 × $4). Üretici teklifi (özellikle mikro tırnak takma ücreti)
  fiyatı en çok oynatacak girdi.
- EON lab-grown hattı: DSP (2,75 mm yarım tur) alıcı $900; HS5 (5 mm, dört yıldız) alıcı $1.350.

## Öneri
**Liste $1.050 → %25 vitrinle $787,50**, her beden ve her taş tek fiyat: tek fiyatın her taşı karşılaması gerektiği
için kural en pahalı taşa uygulanır ve yalnız bu fiyat US 16'da en pahalı taşla da ≥ $50 bırakır. Kapsam seri ile aynı
(14K, üç renk, US 4–16 yarım bedenler, 75 varyant, `ring_band`).

## Açık (üretici)
1. Bu tasarımın teklifi: 1,5 × 1,5 mm bant + üst yarıda ~1,3 mm taş, paylaşımlı mikro tırnak (gram × $100 + taş +
   taş başı takma mı; mikro tırnakta takma ücreti kaç $?).
2. Taş sayısı bedenle mi değişir (yarım tur, US 4 19 → US 16 30) yoksa sabit mi; resize aralığı.
3. 20 taşın hepsi ~1,3 mm bulunur ve bu tırnaklarla takılır mı: opal, aytaşı, turkuaz, oniks ve inci genelde kabaşon ya
   da boncuk, inci pim ya da kap ister; yoksa listeden çıkar.
4. Lab-grown pırlanta renk/berraklık; beyaz altında rodyum; üretim süresi; bedenle fiyat değişir mi.
