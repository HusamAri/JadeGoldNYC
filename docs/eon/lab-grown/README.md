# EON lab-grown pırlanta hattı

Üretici: WhatsApp'ta "abi" diye yazan atölye (el yazısı not 2026-11-04). Konvansiyon by Artifact
Studio'nun üreticisiyle aynı: 14K bant = gram × $100 işçilik dahil, ek kalemler ayrı
(`docs/artifact-studio/maker_cost.py`). Taşlı modellerde teklif parça başına her şey dahil geldi.

## 01 Double Shared Prong (EON-DSP), 2026-11-04
- Fiyat kararı (sahip): liste **$1.200** → %25 vitrin → alıcı **$900**; rakip $945. Kanıt:
  `2026-11-04-double-shared-prong-pricing.md` + `price_model.py`.
- Kapsam v1 (sahip): 14K, Metal Color (Yellow/White/Rose) × Ring Size (US 4–10, yarım bedenler),
  yarım tur 13 taş ≈ 0,78 ct, **her beden tek fiyat**. 18K / dörtte üç tur / platin yeni teklif ister.
- Panel taslağı: `supabase/migrations/0175_eon_lab_grown_dsp.sql` (canlıda MCP adı `0173_eon_lab_grown_dsp`; main'de 0173/0174 başkasına ait, dosya 0175'e taşındı; üreteç
  `scripts/eon/gen_lab_grown_dsp_migration.mjs`, girdi `01-double-shared-prong/listing.json`).
  Ürün `EON-DSP` (`product_type = 'ring'`, protokol `listing_metadata.listingProtocol = ring_band`),
  39 varyant `EON-DSP-14K-{YG,WG,RG}-US040..100`,
  taş künyesi `products.stone_*` + `product_variants.stone_carat/stone_cost_cents` (`manual`, teklifin
  içinde ayrıştırılmamış ~$6/taş). Gram geometriden (`estimated`, US4 3,87 g → US10 4,95 g).
- Mühür: `93cbbc41e4f3cd1e28d8d41db67e1ac4`
  ```sql
  select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
    ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
  from product_variants where sku like 'EON-DSP-%';
  ```
- **Sınıf: bant, alyans DEĞİL (sahip, 2026-11-04).** Protokol `ring_band` (canlıda var olan kayıt,
  Jewelry > Rings > Bands 1232, zorunlu eksen yok, gravür yok). Başlık "14K Gold Lab Grown Diamond
  Band, Double Shared Prong, Half Eternity, 2.75mm". Vaka: ilk sürüm yalnız bu PR'da duran
  `diamond_band` id'sini taşıyordu; prod tanımadığı id'yi `product_type = ring`'e düşürdü ve alyans
  kuralı panel push'unu "her varyant Width ve Ring Size içermelidir" ile durdurdu (Etsy'ye yazılmadı).
  Düzeltme canlıda tek satır UPDATE (koşullu, audit_log), regresyon `tests/listing-protocol.test.ts`.
- Panelde: **Listing Önerileri > Panel Taslakları** (EON seçiliyken), satır linki
  `/tasarimlar/listing/f0896e3c-7127-4c89-815d-b9344810d6e1`.
- **Galeri = sahibin panel yüklemesi** (2026-11-04 19:25–19:27, Supabase storage): 10 karenin 8'i
  (01, 02, 03, 04, 06, 08, 09, 10; 05 ve 07 yüklenmedi), MD5 ile eşlendi. Kapak düzeltmesi:
  `products.image_url` ilk yüklenen 09'u (yazılı) gösteriyordu ve push önce onu yükler; galeri sırası
  0'daki 01'e (yazısız) çekildi. Repo kopyası ve galeri migration'ı tutulmadı (çift görsel olurdu).
- Görsel QA: ölçü kareleri 2,50 mm / 2,75 mm listing'le aynı; "LAB-GROWN DIAMONDS" niteleyicili.
  Bulgu: yüzden bakış karesi (04) **11 taş** gösteriyor, ürün 13; tüm kareler sarı altın.
  Açıklamada AI/görsel beyanı yok (sahip kuralı 2026-10-27/31; `publicTextProblem` 0 sorun).
- **Etsy:** panel "Etsy'ye gönder" TASLAK açar (sahibin eylemi). `draftTransfer` hold'u yalnız
  `ops/drafts-push`'u bağlar, panel butonu onu okumaz. **Yayına alma** için en az bir gerçek,
  düzenlenmemiş ürün fotoğrafı şart; AI kare ilk fotoğraf olamaz (playbook 01/04).

## Üreticiye açık sorular (cevap gelmeden Etsy'ye çıkmaz)
1. $550, US 4–10 için tek fiyat mı? (not "örn. size 7" diyor; US10'da altın +$42.)
2. Taşların rengi/berraklığı (referans D/VS1 iddia edilmedi; `stone_color/clarity` boş).
3. Beyaz altın rodyum kaplı mı? (FTC §23.7 beyan; metinde kaplama iddiası yok.)
4. Üretim süresi (referans 6–8 hafta; metin kargo profiline atıf yapıyor).
5. Numune fotoğrafı: gerçek, düzenlenmemiş, ≥2000 px, ilk kare tek ürün; sonra 10'lu set.

## Diğer teklifler (aynı not, ileride)
- Model 2: 6 mm baguette eternity, 2,20 mm min kalınlık, 6×2 mm taş 0,35 ct, taş $280/ct,
  8½ beden 11,5 g → $1.150 + taş takma $10.
- Model 3: yıldız tasarım 6 mm, 4 taş, 14K US10 $850; "casting ≈ $110 gibi düşün".
- Tek taş ölçeği (taş başına): 1 ct $200, 2 ct $400, 3 ct $700, 4 ct $900–1.000.
- Üreticinin uyarıları: küçük taşla başla; resize ve iade; tam tur resize olmaz; fiyat bedenle oynamasın.
