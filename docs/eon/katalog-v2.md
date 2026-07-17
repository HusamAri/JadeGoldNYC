# EON Katalog v2 — Karat-Ayrık Listingler, Tam Varyant Matrisi, Gram-Bazlı Fiyat, SEO

Bu doküman EON alyans kataloğunun ikinci sürümünün **karar + paket + runbook**
kaydıdır. Üretici script, gram tabloları, fiyat kalibrasyonu ve SEO şablonu
burada tek kaynakta yaşar; scratchpad yalnız aracı kopyadır.

## 1. Neden

Eski katalog 17 panel taslağıydı: tip×renk, beden **bantları** (4 sabit band),
yalnız 10K/14K. Kullanıcı direktifi ile tümü yeniden yapılandırıldı:

1. **Karat başına ayrı listing** — her ürün tipi×renk kombinasyonundan 3 listing
   (10K / 14K / 18K). "1 ürün tipinden 3 listing."
2. **Tam varyant matrisi** — referans gram tablolarındaki TÜM bedenler
   (US 4–16, 13 adet) × TÜM genişlikler (2–12 mm, 11 adet) × **2 kalınlık**
   (1.5 mm ve 2.0 mm) = **286 varyant/listing**.
3. **Fiyat = gram × hedef-$/g** — gramlar kullanıcının 3 karat tablosundan;
   hedef-$/g pazar analiziyle kalibre; yıldız ürün en rekabetçi, diğerleri kâr
   odaklı ama rekabetçi.
4. **Metin** — Etsy algoritması + SEO odaklı ama ABD ana-dilinde doğal;
   **sessiz lüks (silent luxury) EON tonu**: içten, açıklayıcı, hisle anlatan;
   okuyucuya "özelsin" demeden özel hissettiren. Minimalist ve **kalıcı**:
   fiyat/gram/servis sözü gibi zamanla kayan hiçbir rakam yok.

**Sonuç:** 13 tip×renk × 3 karat = **39 listing**, her biri 286 varyant =
**11.154 varyant**. Eski 17 taslak arşivlenir (silinmez).

## 2. Yapı

| Boyut | Değerler |
|-------|----------|
| Tip×renk (13) | Dome/Flat/Beveled/Milgrain × {Yellow, White, Rose} + Knife Edge × Yellow |
| Karat (3) | 10K · 14K · 18K |
| Beden ekseni (`Ring Size`) | Tek sayı US "4".."16" (13 değer) |
| Genişlik ekseni (`Width`) | Kalınlık katlanmış 22 değer: `"2mm · 1.5mm thick"` … `"12mm · 2.0mm thick"` |
| Adet | 20 / varyant |

Etsy 2-eksen sınırı nedeniyle **kalınlık genişlik eksenine katlanır** (eksen
başına 22 ve 13 değer, ikisi de ≤70 sınırında). Fiyat ve SKU iki eksende de
taşınır (`price_on_property:[513,514]`, `sku_on_property:[513,514]`).

### SKU şeması (0087 aile düzeninin devamı)

```
<RENK>-R-<KARAT+TİP>-<W>MM-T<15|20>-<SIZE>
```

- **RENK**: `GLD` (Yellow) · `WHG` (White) · `RSG` (Rose)
- **KARAT+TİP** (4 hane): karat öneki (10/14/18) + tip kodu (01 Dome · 02 Flat ·
  03 Beveled · 04 Milgrain · 05 Knife). Ör. Dome 14K = `1401`, Flat 18K = `1802`.
- **W**MM: genişlik (2–12)
- **T15 / T20**: kalınlık (1.5 mm / 2.0 mm)
- **SIZE**: tek sayı beden (4–16)

Örnek: `GLD-R-1401-6MM-T20-9` = 14K Yellow Dome, 6 mm, 2.0 mm kalınlık, beden 9.

> **Push script uyumu:** Son ek tek sayı beden → `distribute.ts` `parseSkuParts`
> beden-çıkarımıyla uyumlu. SKU org+sku benzersiz. Açıklama sonundaki dahili not
> `[EON NN · aile · ...]` iki haneli sıfır-dolgulu (`\d\d`) — panel
> `splitInternalTrailer` ve push `stripInternalTrailer` desenine uyar.
> `products.research_group = listing no` (1–39) push gruplaması için taşınır.

## 3. Gram tabloları (sayısallaştırma + düzeltmeler)

Kaynak: kullanıcının 3 karat (10K/14K/18K) dome gram görseli. Sayısallaştırma
sonrası **satır-doğrusallık** ile anomali taraması yapıldı; fizik çapraz-kontrolü
(10K/14K yoğunluk oranı 0.880±0.002, 18K/14K ≈ 1.140) tutarlı çıktı.

**Kullanıcı kararı:** dome tabloları **tüm profillere** uygulanır (Flat/Knife
gerçek gramları farklıysa ileride tablo başına düzeltilir — bkz. Riskler).

### Düzeltilen 22 hücre (kaynak → düzeltilmiş)

```
14K 2mm/1.5mm  S16: 2.46 → 2.40      18K 3mm/1.5mm S16: 4.21 → 4.08
14K 12mm/2mm   S11: 17.64 → 17.02    18K 3mm/2mm   S16: 6.72 → 6.36
10K 7mm/1.5mm  S5:  5.20 → 5.02      18K 4mm/1.5mm S16: 5.61 → 5.40
10K 8mm/2mm    S8:  8.58 → 8.92      18K 4mm/2mm   S16: 7.62 → 7.92
10K 8mm/2mm    S9:  8.94 → 9.27      18K 5mm/2mm   S16: 10.53 → 9.96
10K 8mm/2mm    S10: 9.29 → 9.62      18K 6mm/1.5mm S15: 7.69 → 7.93
10K 8mm/2mm    S11: 9.64 → 9.97      18K 6mm/1.5mm S16: 8.41 → 8.16
10K 8mm/2mm    S12: 10.00 → 10.32    18K 6mm/2mm   S16: 11.43 → 11.76
18K 2mm/1.5mm  S16: 3.80 → 3.36      18K 7mm/1.5mm S16: 9.81 → 9.12
18K 2mm/2mm    S16: 4.81 → 4.56      18K 7mm/2mm   S16: 13.34 → 14.48
                                     18K 8mm/1.5mm S16: 11.22 → 9.96
                                     18K 8mm/2mm   S16: 15.24 → 15.72
```

Tam sayısal tablo: `scratchpad/eon-weight-tables.json` → repoda üretici script
girdisi olarak kalıcı (aşağı bkz.).

## 4. Fiyatlandırma

**Formül:** `fiyat = gram(karat, genişlik, kalınlık, beden) × hedef-$/g(karat, sınıf)`,
$5 adımına **yukarı** yuvarlanır, **+ $10 sabit kargo payı** eklenir. Her fiyat
karat breakeven tabanının üstündedir.

**Kargo payı (kullanıcı kararı):** mağaza **ücretsiz kargo** sunar (Etsy aramada
ödüllendirir + açıklamalardaki "free tracked shipping" vaadiyle uyumlu). Ücretsiz
kargoda posta bedelini satıcı üstlenir → her varyant fiyatına **$10 sabit** gömülür
(yüzük hafif, kargo pratikte sabit; ABD takipli posta ~$5-6 + gömülü tutara Etsy/
ödeme ücreti + tampon; `SHIPPING_ALLOWANCE_CENTS`). Etsy'de **manuel (sabit/ücretsiz)
kargo profili** kurulur; kod hesaplı (calculated) yerine `profile_type="manual"`
profilini TERCİH eder (`resolveShopProfiles`) — hesaplı profil item_weight ister ve
alıcıdan posta alır (istenmez).

**Spot (üretim anı):** $4005 / troy ons → saf $128.76/g.
Pure $/g = spot ÷ 31.1035; melt $/g = pure × saflık (10K 0.4167 · 14K 0.585 · 18K 0.75).
Breakeven $/g = tedarik alım $/g ÷ 0.90 (Etsy ücret payı %10); alım 10K $65 · 14K $101 · 18K $129.

| Karat | Melt $/g | Breakeven $/g | Pazar (düşük/orta/yüksek) | Standart hedef | Yıldız hedef |
|-------|---------:|--------------:|---------------------------|---------------:|-------------:|
| 10K | 53.66 | 72.22 | 69.8 / 96.6 / 123.4 | **107.3** (2.0× melt) | 96.6 (1.8×) |
| 14K | 75.33 | 112.22 | 97.9 / 135.6 / 173.3 | **158.2** (2.1× melt) | 135.6 (1.8×) |
| 18K | 96.57 | 143.33 | 125.5 / 173.8 / 222.1 | **193.2** (2.0× melt) | 173.8 (1.8×) |

**Yıldız ürün:** `GLD-R-1401` = **14K Yellow Dome**. Gerekçe: her hacim sinyali
burada buluşur — 2025–26 sektör verisi modal erkek alyans harcamasını $300–600'a,
en çok satın alınan konfigürasyonu 14K 3–4 mm'ye koyuyor; 14K alyans arama
medyanı ~$489.50 ve kanonik listing şekli tam olarak "14k yellow dome comfort fit
band". Yıldız 1.8× melt (bandın rekabetçi/merkez ucu), diğer 38 listing kâr
odaklı (2.0–2.1× melt), hepsi breakeven'a klipli.

**Spot değişince yeniden hesap (method_note):** (1) melt = spot÷31.1035×saflık.
(2) pazar bandı = 1.3× / 1.8× / 2.3× melt. (3) hedefler: yıldız 1.8×; standart
14K 2.1×, 10K/18K 2.0×. (4) her hedefi breakeven tabanına klip. Sonrası panelin
mevcut reprice motoru sürdürür.

> **Kritik uyarı (pricing risks):** 14K ve 18K'da **pazar-düşük breakeven'ın
> ALTINDA** ($97.9 < $112.2; $125.5 < $143.3) — en agresif Etsy rakibine
> asla inme. Spot >%5 oynarsa hedefleri yeniden klipleyip tedarikçi kotasyonunu
> yenile (tedarik $/g spot'u otomatik takip etmez).

## 5. SEO / metin şablonu (kanonik)

Çıktı: workflow (5 mercek web araştırması → sentez → 39 listing yaz+adversarial
doğrula). Tam şablon + araştırma: `scratchpad/eon-wf-template-pricing.json`.

- **Başlık formülü:** `[Karat] Solid [Color] Gold Wedding Band, [Profil/Fit], [Genişlik aralığı]`.
  Birincil anahtar (`solid [karat] [color] gold wedding band`) ilk **40 karakter**
  içinde, kullanıcının aradığı kelime sırasında; <15 kelime; tekrar/öznel sıfat/
  hediye-durum kelimesi yok. Kardeş listingler ilk 40 karakterde ayrışır.
- **13 tag:** her biri çok kelimeli, ≤20 karakter, insanın arama çubuğuna yazacağı
  ifade; tek jenerik kelime yok, kategori/attribute'u tekrar etmez, iç-içe çift yok.
  Kapsam: karat+form, alıcı (mens/womens), durum/hediye, profil/stil, genişlik dili,
  kişiselleştirme, komşu niyet (stacking/plain).
- **Açıklama iskeleti:** ~160 karakter açılış snippet (birincil anahtar + "solid,
  not plated/filled" + made to order + tek fark: ücretsiz iç gravür) → **THE
  DETAILS** (label:değer spec) → **SIZE & WIDTH** (286 matris nasıl seçilir + fit
  fiziği) → **MAKE IT YOURS** (3 adım sipariş + 30-char gravür) → **WHY EON**
  (sessiz lüks kapanış).
- **Minimalist + kalıcı kural:** açıklama yalnız yüzüğü ve nasıl sipariş
  edileceğini anlatır. YASAK: fiyat, fiyat-mekaniği anlatımı, gram/ağırlık rakamı,
  resize/iade/yanıt-süresi sözü, indirim, başka karat, kargo kökeni, ödül/çoksatar
  iddiası, URL, emoji, HTML. Bunlar kod-tabanlı doğrulayıcıyla zorlanır.
- **Ses (silent luxury):** metal bilen ABD ana-dilli usta; içten, sakin
  açıklayıcı, hisle; anlamı **somut detayla** taşır (rengin ışıkta davranışı,
  profilin ışığı kesişi, ağırlığın hissi), okuyucuyu övmeden. AI-pazarlama
  dolgusu (elevate, timeless elegance, look no further, whether you are...) yasak.

## 6. Runbook — nasıl yeniden üretilir / uygulanır

**Üretici:** `scratchpad/gen_catalog_v2.py` (repoda: `docs/eon/gen_catalog_v2.py`).
Girdiler: `eon-weight-tables.json` (gram) + `eon-wf-output.json` (workflow:
pricing + 39 listing metni). Çıktı: `eon-new-catalog.json` + `sql/` parçaları +
`supabase/migrations/0100_eon_catalog_v2.sql`.

```
python3 gen_catalog_v2.py            # gerçek metin/fiyatla tam üretim
python3 gen_catalog_v2.py --placeholder   # workflow çıktısı olmadan yapı testi
```

Script içi doğrulamalar (fail = üretim durur): 39 listing, 11.154 varyant,
286/listing, SKU tekilliği, her fiyat ≥ breakeven×gram, örneklem gram == tablo,
başlık ≤140, 13 tag ≤20 char, açıklamada dolar/gram yok.

**DB uygulaması** (Supabase MCP, 0085 deseniyle parçalı):
1. `sql/step1_archive.sql` — 17 eski taslak `archived_at = now()`.
2. `sql/step2_staging.sql` — geçici `eon_seed_texts` + `eon_seed_grams`.
3. `sql/texts_01..39.sql` — 39 metin satırı (parça başına 1).
4. `sql/grams_0..N.sql` — gram satırları (22'lik parçalar).
5. `sql/step5_master.sql` — 39 `products` + 11.154 `product_variants` staging'den türetilir.
6. `sql/step6_verify.sql` — sayımlar (39 draft + 11.154 varyant + arşiv).
7. `sql/step7_cleanup.sql` — staging tablolarını düşür.

Migration dosyası (`0100`) 1–7'nin tek transaction eşdeğeridir (preview provizyonu için).

**Etsy'ye gönderim (bu planın DIŞINDA):** taslaklar OK olunca kullanıcı mevcut
"Etsy'e gönder" butonu / `scripts/eon-push-drafts.ts` ile gönderir. Script
`properties.Width` ve `properties["Ring Size"]` okur → yeni değerlerle çalışır
(`price_on_property [513,514]` aynı). **Not:** push script grup seçimini
`[EON ${g.no} ` ile yapar — v2 için 39 grup + iki-hane sıfır-dolgu + tek-sayı
beden şemasına uyarlanmalı. İlk canlı gönderim tek listing'de doğrulanır.

## 6.1 Kademeli açılış — ilk listing canlıya hazır (2026-07-17)

Kullanıcı "ilk listing'i açmaya başlayayım" dediği için **yıldız ürün tek başına
önce uygulandı** (kalanı workflow bitince toplu eklenir; çakışma yok):

- **Uygulanan:** `GLD-R-1401` = **14K Yellow Gold Dome** (no 02) — panel taslağı,
  **286 varyant**, fiyat **$215–$2.725** (yıldız hedefi 135.6 $/g). Eski 17 taslak
  arşivlendi (arşiv toplam 27). Örneklem gram/fiyat tabloyla birebir doğrulandı.
- **Nasıl açılır:** panelde listing detayına gir → **"Etsy'e gönder"** butonu
  (EON `listings_w` yetkili + bağlı; buton `[EON NN]` künyesini söker, 286
  varyantı 513/514 slotlarına yazar, Karat/Metal sabitlerini açıklamaya not düşer).
- **Kalan 38:** workflow metinleri bitince üretici `GLD-R-1401` HARİÇ koşulur
  (master SQL yalnız staging'deki satırları basar → çakışma yok). Bu yüzden tam
  apply'da yıldızın texts satırı yüklenmez.

## 7. Riskler / işaretli varsayımlar

- **18K alım maliyeti türetilmiş** (~$129/g, 14K'dan saflık oranıyla) — gerçek
  tedarik verisi gelince `lib/gold-cost.ts` + fiyat yeniden hesaplanır.
- **Gram tabloları dome-kaynaklı**, tüm profillere uygulanıyor (kullanıcı kararı).
- **Knife yalnız yellow** (mevcut kapsam).
- **Fiyat kalıcı değil**: spot oynar; reprice motoru + method_note ile bakım şart.
- **Etsy offering sınırı**: 286/listing güncel sınırlar içinde; ilk canlı
  gönderim tek listing'de teyit edilir.
