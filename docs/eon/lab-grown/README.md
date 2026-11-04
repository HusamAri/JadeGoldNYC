# EON lab-grown pırlanta hattı

Üretici: WhatsApp'ta "abi" diye yazan atölye (el yazısı not 2026-11-04). Konvansiyon by Artifact
Studio'nun üreticisiyle aynı: 14K bant = gram × $100 işçilik dahil, ek kalemler ayrı
(`docs/artifact-studio/maker_cost.py`). Taşlı modellerde teklif parça başına her şey dahil geldi.

## 01 Double Shared Prong (EON-DSP), 2026-11-04
- Fiyat kararı (sahip): liste **$1.200** → %25 vitrin → alıcı **$900**; rakip $945. Kanıt:
  `2026-11-04-double-shared-prong-pricing.md` + `price_model.py`.
- Kapsam v1 (sahip): 14K, Metal Color (Yellow/White/Rose) × Ring Size (US 4–10, yarım bedenler),
  yarım tur 13 taş ≈ 0,78 ct, **her beden tek fiyat**. 18K / dörtte üç tur / platin yeni teklif ister.
- Panel taslağı: `supabase/migrations/0173_eon_lab_grown_dsp.sql` (üreteç
  `scripts/eon/gen_lab_grown_dsp_migration.mjs`, girdi `01-double-shared-prong/listing.json`).
  Ürün `EON-DSP` (`product_type = 'ring'`, protokol `listing_metadata.listingProtocol = diamond_band`;
  `products.product_type` kısıtı yeni tip kabul etmez), 39 varyant `EON-DSP-14K-{YG,WG,RG}-US040..100`,
  taş künyesi `products.stone_*` + `product_variants.stone_carat/stone_cost_cents` (`manual`, teklifin
  içinde ayrıştırılmamış ~$6/taş). Gram geometriden (`estimated`, US4 3,87 g → US10 4,95 g).
- Mühür: `93cbbc41e4f3cd1e28d8d41db67e1ac4`
  ```sql
  select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
    ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
  from product_variants where sku like 'EON-DSP-%';
  ```
- Etsy protokolü `diamond_band` (`lib/etsy/listing-protocol.ts`): taksonomi alyansla aynı
  ("Wedding Bands"), zorunlu eksen yalnız Ring Size, gravür yok. Test `tests/listing-protocol.test.ts`.
- **Etsy itişi TUTULUYOR:** `listing_metadata.draftTransfer = hold` (gerçek, düzenlenmemiş ürün
  fotoğrafı şart; playbook 01/04). Fotoğraf gelince: hold'u sil → galeriyi `listing_images`'a bağla →
  prod'da `diamond_band` protokolünün deploy olduğunu kuru koşuda `protocol: diamond_band` ile gör →
  `ops/drafts-push` (org EON, önek `EON-DSP`) kuru → kanarya → `verify=1` taze token.

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
