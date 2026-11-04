# EON lab-grown pırlanta, ilk listing: Double Shared Prong band fiyatı (2026-11-04)

Model: `price_model.py` (bu klasör). Referans ürün: Brilliance in Diamonds
"Lab Grown Double Shared Prong Diamond Band"
(brillianceindiamonds.com/products/lab-grown-double-shared-prong-diamond-band, okuma 2026-11-04).

## Referans sayfadan okunan
- Fiyat **$945**, üstü çizili fiyat yok; metal ve beden seçimi fiyatı değiştirmiyor (beden seçici yok).
- Yarım tur 0,72 ctw / dörtte üç tur 0,99 ctw; ctw bedene değil "diamond distance" seçimine bağlı.
- D / VS1 lab-grown round brilliant; 2,75 mm genişlik × 2,50 mm yükseklik; double shared prong.
- 14K / 18K (sarı, beyaz, rose) + platin; sipariş üzerine 6-8 hafta; özel ürün, iade yok.
- Açıklama tek cümle: "The double shared prongs on this band beautifully showcases the diamonds and pairs well with any style engagement ring."

## Üreticinin verdiği bilgiler (birebir, 2026-11-04 sabahı)
WhatsApp (06:43-06:56):
1. "tek taşların da abi 1,2,3,4ct girebiliriz ama taş fiyatları çok geniş 4 ct i 1700 e de var 500e de"
2. "1ct 200 / 2ct 400 / 3ct 700 / 4ct 900-1000 gibi fiyatlandırabiliriz"
3. "ilk baştan ufak taşlar ile başlayalım bence abi taş olayını iyice öğrenelim"
4. "resize ve geri iadeye dikkat etmemiz lazım"
5. "tek taşlar resize oluyor ama tam tur veya bazı modeller resize olmuyor abi"
6. "size de fiyat oynamasın abi hatta taş da koyalım parayı"

El yazısı not "Taşlı modeller" (okunamayan sözcük `(?)`):
- **1)** "2,40 taş boyu mm. Round taş. Double shared prong. örn. Size 7 toplam 0.8 ct. toplam 13. 14K - 550$. taş takma benim için(?) 4$"
- 2) "6 mm için Baguette. Minimum 2.20 mm thickness. Minimum 6 mm. 0.35 ct 6×2 taş ölçüsü. 8½(?) size 11,5 gram. taş fiyat 280$ 1 ct. 1150$. taş takma 10$"
- 3) "Yıldız (?) design. 6 mm, 4 taş, 14K, 850$, 10 size. Castingi ≈110$ gibi düşün!!"
- "Mushroom: işçiliği gramda(?) 46$. taş takma parça(?) 7$" · "Model 15: gramda işçilik 15$"
- "14) (?) modeli: Casting + taş takma + taş → 110 / 20 / ?" · "Model 22: CNC 23$ gram"

Boyut tablosu (round): 2,25 mm = 0,04 ct, 2,5 mm = 0,06 ct → 2,40 mm ≈ 0,05-0,06 ct; 13 × 0,06 = 0,78 ≈ "toplam 0,8 ct" (not kendi içinde tutarlı).

## $550 neyi kapsıyor? Bağımsız model okudu
Canlı spot $4.065,80 (gold-api.com 2026-11-04; panel `pricing_config` 4.399,90 Ağustos'ta kalmış, bayat). 14K melt $76,47/g.

| Kalem (US7, 14K) | Bağımsız tahmin |
|---|---|
| Altın ~4,4 g × $76,47 (geometri; üreticinin düz bant formülü 5,48 g üst sınır) | $337 |
| İşçilik | ~$60 |
| 13 taş, 0,78 ct lab melee, ~$100/ct | ~$80 |
| Taş takma 13 × $4 | $52 |
| **Toplam** | **~$529** (üretici **$550**) |

Model 2 aynı şekilde okunuyor: 11,5 g × $76,47 = $879 melt; $1.150 − $879 = $271, içinde taş ($98) + takma + işçilik.
Sonuç: **$550 = altın + işçilik + taş + takma, her şey dahil.** "taş takma 4$" satırı teklifin içindeki kalem dökümü, ek ücret değil.
Karşı okumalar (B: takma ayrı +$52; C: taş da ayrı +$80) aşağıda yine de fiyatlandı.

## Perakende: EON motoru (`eon-cost.ts` 457-472; çarpan 1,55 dar bant, en kötü Offsite'ta kâr ≥ $50)
Landed = üretici + paket $8 + kargo $22.

| Okuma | Landed | Vitrin %25: liste → alıcı | Vitrin %35: liste → alıcı | İndirim dışı | Kâr (en kötü Offsite) | Taban std / offsite |
|---|---|---|---|---|---|---|
| **A $550 her şey dahil** | $580 | **$1.200 → $900** | $1.385 → $900 | $900 | $134 | $649 / $779 |
| B + takma $52 | $632 | $1.310 → $982 | $1.510 → $982 | $980 | $157 | $707 / $849 |
| C + takma + taş $80 | $712 | $1.475 → $1.106 | $1.700 → $1.105 | $1.105 | $189 | $796 / $956 |

Rakip $945 → landed $580 üstünde ima edilen çarpan 1,63; motorun 1,55'i rakibin $45 altına düşürüyor.
Ölçüm notu: Etsy'de gerçekleşen EON indirimi 12 Ekim'den beri **%35** (`sales`, payda `item_total + discount`); kod sabiti `EON_SALE_RATE = 0,75`. Taşlı parça vitrin indirimine girerse liste o günkü orana göre kurulur, alıcının ödediği $900 değişmez.

## Öneri
**14K, yarım tur (13 taş ≈ 0,78 ct): alıcı fiyatı $900.** Vitrin içinde liste $1.200 (%25) ya da indirim dışı düz $900.
`lib/pricing/stone-cost.ts` pırlantalıların indirim DIŞINDA tutulmasını öneriyor; yeni üründe satış geçmişi olmadan sürekli üstü çizili fiyat, playbook 02'nin "sahte indirim" kuralına yakın durur. Karar sahibinde.

Beden tek fiyat (üretici "fiyat oynamasın" dedi, referans da bedene göre değiştirmiyor), taş sayısı 13 sabit:

| Beden | Altın farkı (US7'ye göre) | Kâr @ $900, en kötü Offsite |
|---|---|---|
| US 4 | −$41 | $175 |
| US 7 | 0 | $134 |
| US 10 | +$42 | $92 |
| US 13 | +$83 | $51 |

US 13'te bile ≥ $50 kapısı tutuyor; yine de üreticiye "$550 US 4-10 için tek fiyat mı?" sorulmalı (teklif "örn. size 7" diyor).

18K türetilmiş (yalnız altın payı ölçeklenir: 5,0 g × $98,04; taş/işçilik sabit): landed ~$733 → liste $1.515 → alıcı ~$1.140. **Üretici teklifi yok; TÜRETİLMİŞ, satışa açmadan önce teklif alınır.** Dörtte üç tur (0,99 ctw) ve platin de teklif ister.

Üreticinin tek taş ölçeği (ileride solitaire için, taş başına): 1 ct $200, 2 ct $400, 3 ct $700, 4 ct $900-1.000; 4 ct piyasada $500-1.700 arası, kalite belirtilmeden kullanılmaz.

## Karar ve yapım (2026-11-04 akşamı)
Sahip: **liste $1.200 → %25 vitrin → $900**; v1 = 14K, 3 renk, yarım tur, US 4–10 tek fiyat.
Panel taslağı `0175_eon_lab_grown_dsp.sql` ile açıldı (canlıda `0173_eon_lab_grown_dsp` adıyla uygulandı) (EON-DSP, 39 varyant, mühür
`93cbbc41e4f3cd1e28d8d41db67e1ac4`). Aynı akşam sahip "bu wedding band değil" dedi: başlık "Diamond Band",
protokol `ring_band` (Jewelry > Rings > Bands); galeri sahibin panelden yüklediği 8 kare (README).
Ayrıntı ve açık sorular: `README.md`.

Okuma notu: üreticinin düz bant formülü DOLU 2,75 × 2,50 profilde 5,48 g × $100 = $548 verir ve
"$550 yalnız altın+işçilik" okumasına davet eder; ama taş yuvaları metal alır (≈%12 → 4,4 g), üreticinin
kendi $/g'siyle 4,4 g = $441, + taş ~$80 + takma $52 = $573 ≈ $550. Yani her şey dahil okuma hem
yuvalı gramla hem rakip çapasıyla ($900 ↔ $945) tutuyor; yalnız-altın okuma ancak yuvasız gramla tutar.
Üreticiye teyit sorusu yine de yazıldı (README).

## Yapım aşaması notları (fiyat dışı; listing kurulurken)
- FTC §23.25: taş adının hemen önünde "Lab Grown" / "Laboratory-Grown"; tek başına "#diamond" tag yok; D/VS1 gibi derece iddiası üreticiden belgeyle, yoksa yazılmaz (playbook 01).
- Fotoğraf: en az bir gerçek, düzenlenmemiş fotoğraf; render/AI ilk ya da tek fotoğraf olamaz → üreticiden numune fotoğrafı şart. Referans sitenin görselleri kullanılamaz (playbook 01/04).
- Üretim ortağı beyanı; iade politikası: yarım tur yeniden boyutlanabilir, tam tur değil (üreticinin uyarısı); 6-8 hafta üretim süresi.
- Panel: 0148 şeması hazır (`products.stone_*`, `product_variants.stone_carat/stone_cost_cents`, `diamond_price_book` boş). Teklif her şey dahil olduğu için taş payı ayrıştırılmış değil; varyanta `stone_cost_source = 'manual'` + not ("üretici all-in $550 içinde, ~$6/taş tahmin") yazılmazsa `stone_cost_missing` alarmı yanar.
- Çarpan 1,55 ve $50 kapısı EON düz bant motorunun; taşlı parçada aynı formülün tutması rakip fiyatla sınandı ($900 vs $945), ayrı bir taş çarpanı kurulmadı.
