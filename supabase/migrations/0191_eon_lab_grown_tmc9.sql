-- 0191_eon_lab_grown_tmc9.sql
-- EON lab-grown 07 (EON-TMC9): iki tonlu 7,0 × 2,0 mm bant: beyaz altın raylar, her rayın iç kenarında beyaz milgrain
-- hattı (tam tur), kubbeli cilalı sarı altın orta; önde sarı ortaya kesilmiş tek kanalda dokuz 2,75 mm round lab-grown
-- taş kenar kenara (çemberin ~üçte biri), kanal son taşın biraz ötesinde yuvarlak uçla biter. Karat × Ring Size US 4-16
-- yarım bedenler (75 varyant), ring_band. Ayar başına tek fiyat: 10K $2.400 / 14K $3.100 / 18K $4.000 (alıcı %25 vitrinle $1.800 / $2.325 / $3.000).
-- Maliyet: üretici konvansiyonu ile iki tonlu $250 kuralının yükseği + taş $201,60 + kanal takma $90. Kaynak: sahibin 4
-- gerçek fotoğrafı (2026-11-13). Kanıt: docs/eon/lab-grown/2026-11-13-two-tone-milgrain-channel-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/07-two-tone-milgrain-channel/. Üretici: scripts/eon/gen_lab_grown_tmc_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert. products.price_cents en düşük
-- ayarın fiyatıdır (Etsy listing fiyatı en ucuz seçenektir); her varyant kendi ayarının fiyatını taşır.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Karat')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-TMC9-%';
--   beklenen: e535d9acc96dd1e77d6c03e307eef31c
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-TMC9', $ww$Two Tone 10K 14K 18K Gold Lab Grown Diamond Band, Channel Set, Milgrain, 7mm$ww$,
  $ww$A solid gold two tone band, 7 mm wide, with nine round lab grown diamonds channel set across the top. White gold rails edged with a fine milgrain bead line frame a domed, polished yellow gold centre, and the stones sit side by side in a channel cut into the yellow gold.

YOUR RING
Solid gold in two tones of the same karat: white gold rails and a yellow gold centre, in 10K, 14K or 18K. About 7 mm wide and about 2 mm thick at the top of the dome, polished all over. Nine round brilliant lab grown diamonds, about 2.75 mm each, are channel set side by side in one row across the top of the band; the channel runs a little past the last stone at each end and closes in a rounded end. A fine milgrain bead line runs all the way around the band along each side of the yellow centre. About 10 grams in 14K at US 8.5. The price is for one ring in your selected karat and size; all nine lab grown diamonds are included.

CHOOSE YOUR OPTIONS
1. Karat: 10K, 14K or 18K gold. Both tones are the karat you choose.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size in each karat.

ABOUT THE LAB GROWN DIAMONDS
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. Each of the nine is a round brilliant cut, so the row reads as one line of light along the yellow gold.

THE CHANNEL SETTING
Each stone sits in a channel cut into the yellow gold centre and is held along both sides by the channel walls. There are no prongs, so nothing stands proud to catch on clothing or gloves.

SIZING AND RESIZING
Made to order in your size. Message us before ordering if you are between sizes. A jeweler who works with two tone gold can usually resize the band by about half a size through the plain gold at the back, away from the stones.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$two tone gold band$ww$,$ww$two tone ring$ww$,$ww$mens two tone band$ww$,$ww$milgrain band$ww$,$ww$channel set band$ww$,$ww$channel set ring$ww$,$ww$nine stone band$ww$,$ww$10k gold band$ww$,$ww$14k gold band$ww$,$ww$18k gold band$ww$,$ww$7mm gold band$ww$]::text[], ARRAY[$ww$Solid 10K white gold$ww$,$ww$Solid 10K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K yellow gold$ww$,$ww$Solid 18K white gold$ww$,$ww$Solid 18K yellow gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  240000, 20, true, null, 0, 'ring',
  'round', 'lab', 9, 1000, 0,
  $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-13-eon-lab-grown-tmc9","sourcePackagePath":"docs/eon/lab-grown/07-two-tone-milgrain-channel","generatorScript":"scripts/eon/gen_lab_grown_tmc_migration.mjs","sourceReference":"Owner 2026-11-13: four unedited photos of a real made piece (workshop: rubber-tipped tweezers, paper towel, fingers) with 'New model. 10k 14k ve 18k 3 varyantlı'. Not committed (the owner's photos; frame use is the owner's decision). Design from the photos: two tone band, white gold rails with a softly rounded outer edge, a fine white milgrain bead line along the inner edge of each rail running all the way around, a domed polished yellow gold centre between them; at the front one channel cut into the yellow centre holds nine round brilliant stones edge to edge, and the channel runs a little past the last stone at each end and closes in a rounded end; the rest of the yellow centre is plain and domed; the inside looks white gold. Measured by pixel ratios (no scale object in the photos): stone / milgrain-to-milgrain 0.56-0.59 (three photos), stone / band about 0.40, band / outer diameter 0.28-0.30 and stone / outer diameter 0.116 (the two hanging photos agree), the nine stones cover about a third of the circle (foreshortening of the end stones in the side photo, about 117-130 degrees). The sample's size is unknown: for a men's size (outer diameter about 23-24 mm) the band is about 6.4-7.3 mm and a stone about 2.7-2.8 mm. Design: 7.0 mm wide, about 2.0 mm at the crown of the dome (a 2.75 mm round is about 1.68 mm deep), nine 2.75 mm round lab grown diamonds, about 0.08 ct each.","variationAxes":["Karat","Ring Size"],"metalColor":"Two tone, fixed (not a variation): white gold rails and milgrain, yellow gold centre, both in the selected karat","goldSolidity":"Solid gold","offersPersonalization":false,"karats":[{"karat":"10K","priceCents":240000},{"karat":"14K","priceCents":310000},{"karat":"18K","priceCents":400000}],"stone":{"origin":"lab","shape":"round","count":9,"sizeMm":"2.75","totalCarat":0.72,"caratNote":"Design stones 9 x 2.75 mm round brilliant, about 0.08 ct each (0.72 ct t.w.), measured from the owner's photos by ratio (no scale object); channel set edge to edge in one row across the top front; the count does not change with size. Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"settingFeeCents":1000,"castingFeeCents":0,"stoneCostCentsEstimate":20160,"stoneCostNote":"No maker quote for this design. The maker's only known lab rate is 280 USD/ct (Model 2 baguette): 9 x 0.08 ct = 201.60 USD. Channel setting 10 USD a stone = the maker's Model 2 baguette (channel) fee, uncalibrated (same as EON-PC9). Panel cost view (variant_stone_cost) sees stones 201.60 + settings 9 x 10 (products.setting_fee_cents 1000) = 291.60."},"band":{"widthMm":7,"thicknessMm":2,"karats":"10K, 14K or 18K (both tones the same karat)","twoTone":"white gold rails (softly rounded outer edges) and inside; yellow gold domed centre","milgrain":"one fine white gold bead line along the inner edge of each rail, all the way around","profile":"white rails, milgrain, domed polished yellow centre; at the front one channel cut into the yellow centre","finish":"high polish all over","row":"nine 2.75 mm round brilliant stones edge to edge in one channel across the top front (about 25 mm, about a third of the circle at the sample's size); the channel runs a little past the last stone at each end and closes in a rounded end; the same nine stones at every size"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5), full rectangular 7 x 2.0 mm section; 10K and 18K x alloy density 0.892 / 1.137. The channel (about 30 x 2.75 x 1.9 mm) removes about 2.1 g in 14K, kept in the cost as a buffer. Public text says 'about 10 grams in 14K at US 8.5' (11.89 - 2.1 = 9.8 g).","anchorUs":8.5,"anchorGrams":{"10K":10.6,"14K":11.89,"18K":13.52},"densityRatio":{"10K":0.892,"14K":1,"18K":1.137},"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"per karat and size, the HIGHER of two readings: (a) the maker convention (same maker as EON-VB6/PC9): 14K grams x 100 USD (gold + labour), 10K/18K USD per gram from lib/gold-cost.ts derivePurchaseCentsPerGram (metal scales with spot x purity, the 14K labour premium does not); (b) the EON two-tone rule (CLAUDE.md 2026-09-29, V4.laborTwoToneUsd): melt x 1.07 + 250 USD. Reading (b) binds at small sizes (10K US 4-8.5, 14K US 4-7, 18K US 4-6), (a) above. Plus nine stones 201.60 and nine channel settings 90. US 8.5: 10K 840.72 + 291.60 = 1132.32; 14K 1188.83 + 291.60 = 1480.43; 18K 1630.15 + 291.60 = 1921.75.","packagingUsd":8,"shippingUsd":22,"multiplier":1.55,"storePromotionRate":0.25,"onePriceAllSizes":true,"spotUsdPerOzt":3883.17,"spotDate":"2026-11-13","spotSource":"gold-api.com 2026-11-13T19:12Z","byKarat":{"10K":{"listUsd":2400,"buyerUsd":1800,"ratePerGramUsd":78.9,"gramsAtAnchor":10.6,"goldUsdAtAnchor":840.72,"goldReadingAtAnchor":"two-tone rule","landedUsdAtAnchor":1162.32,"engineUsd":1802,"engineListUsdAtAnchor":2405,"everySizeFloorListUsd":2305,"worstOffsiteProfitBySizeUsd":{"US4":474,"US8.5":366,"US12":252,"US16":117}},"14K":{"listUsd":3100,"buyerUsd":2325,"ratePerGramUsd":100,"gramsAtAnchor":11.89,"goldUsdAtAnchor":1188.83,"goldReadingAtAnchor":"maker convention","landedUsdAtAnchor":1510.43,"engineUsd":2341,"engineListUsdAtAnchor":3125,"everySizeFloorListUsd":2980,"worstOffsiteProfitBySizeUsd":{"US4":675,"US8.5":493,"US12":325,"US16":133}},"18K":{"listUsd":4000,"buyerUsd":3000,"ratePerGramUsd":120.6,"gramsAtAnchor":13.52,"goldUsdAtAnchor":1630.15,"goldReadingAtAnchor":"maker convention","landedUsdAtAnchor":1951.75,"engineUsd":3025,"engineListUsdAtAnchor":4035,"everySizeFloorListUsd":3830,"worstOffsiteProfitBySizeUsd":{"US4":935,"US8.5":663,"US12":432,"US16":168}}},"at35PercentSale":"every-size floors at a 35% sale are 10K 2,660 / 14K 3,440 / 18K 4,415; at the proposed prices a 35% sale stays above zero through US 12 and loses about 100 / 148 / 194 USD at US 16","marketAnchors":["Cirelli Jewelers 'Men's Two-Tone Diamond Band, 1 Carat Round Lab Grown Diamond 14K Gold Channel Set Band': nine round lab-grown stones, 1.00 ctw, 14K white and yellow, 2,425 USD (read 2026-11-13)","Kay 'Men's Now + Forever Lab-Grown Diamonds Round-Cut Wedding Band 1 ct tw 14K Two-Tone Gold': eleven round channel-set stones, 6.7 mm, milgrain edges, 2,309.99 USD on sale from 3,299.99 (search snippet 2026-11-13; sale end date 10/30/26 passed)","Zales 'Men's 1/2 CT. T.W. Diamond Channel Milgrain Band in 14K Two-Tone Gold' (natural J/I3): 1,399.99 USD from 1,999.99, out of stock (read 2026-11-13)","Jared 'Men's lab-grown diamond band 1 ct tw 14K two-tone': 6.4 mm, 3,990 USD on sale (search snippet 2026-11-13)","EON lab-grown line: DSP 1,200 -> 900; HEP 1,050 -> 787.50; PC9 1,500 -> 1,125; HS5 and FR6 1,800 -> 1,350; VB6 2,665 -> 1,999"],"methodology":"docs/eon/lab-grown/price_model.py tmc; formula lib/pricing-engine/eon-cost.ts 457-472; karat rule lib/gold-cost.ts derivePurchaseCentsPerGram; two-tone rule lib/pricing/gold-index.ts V4"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod and needs no Width axis (width is fixed at 7 mm); Karat x Ring Size go to Etsy custom slots 513/514 (lib/etsy/create-listing.ts)"},"approval":{"authority":"Owner 2026-11-14 (reply '1a 2a 3a' to the decision list): 1a = 7.0 x 2.0 mm, nine 2.75 mm round lab grown stones, list 10K 2,400 / 14K 3,100 / 18K 4,000 USD -> 25% sale 1,800 / 2,325 / 3,000, one price for every size in each karat; scope Karat 10K/14K/18K x Ring Size US 4-16 with half sizes (75 variants), two tone fixed; 2a = gallery: 9 frames from the prompt sheet (images/PROMPTS-REVIEW.md), hero first and checked against the owner's photos, then the other 8, plus the locally typeset spec card, about 30 credits, cap 40; 3a = the owner's first photo (close-up, tweezers behind, six stones and the rounded channel end) goes in the gallery as the last frame, unedited and uncropped (Etsy real-photo rule).","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["No maker quote for this design: cost is the higher of the maker's band list (grams x 100 USD in 14K) and the EON two-tone rule (melt x 1.07 + 250 USD), + nine stones 201.60 + nine channel settings 90, all estimates","Maker to confirm: width and thickness of the sample (design 7.0 x 2.0 mm, measured by ratio only), stone size and count (design 9 x 2.75 mm round, about 0.72 ct), whether two tone adds a fee to grams x 100 USD, 10K and 18K rates, inside metal, how far the band can be resized, stone colour/clarity grade, white gold rhodium plating, preparation time","Gallery not attached yet (the owner's real photo will be the last frame; until the gallery migration is applied the draft has no photos)","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"e535d9acc96dd1e77d6c03e307eef31c"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-TMC9'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-TMC9-' || r.karat || '-US' || lpad(round(r.size * 10)::int::text, 3, '0'),
  p.id,
  r.karat || ' / US ' || r.label || ' / Two Tone',
  jsonb_build_object('Karat', r.karat, 'Ring Size', 'US ' || r.label),
  r.price,
  20,
  r.grams,
  'estimated',
  true,
  'USD',
  0.72,
  20160,
  'manual'
from public.products p
cross join (values
    ('10K',240000,4.0,'4',8.67),
    ('10K',240000,4.5,'4.5',8.89),
    ('10K',240000,5.0,'5',9.10),
    ('10K',240000,5.5,'5.5',9.32),
    ('10K',240000,6.0,'6',9.53),
    ('10K',240000,6.5,'6.5',9.75),
    ('10K',240000,7.0,'7',9.96),
    ('10K',240000,7.5,'7.5',10.18),
    ('10K',240000,8.0,'8',10.39),
    ('10K',240000,8.5,'8.5',10.60),
    ('10K',240000,9.0,'9',10.82),
    ('10K',240000,9.5,'9.5',11.03),
    ('10K',240000,10.0,'10',11.25),
    ('10K',240000,10.5,'10.5',11.46),
    ('10K',240000,11.0,'11',11.68),
    ('10K',240000,11.5,'11.5',11.89),
    ('10K',240000,12.0,'12',12.11),
    ('10K',240000,12.5,'12.5',12.32),
    ('10K',240000,13.0,'13',12.53),
    ('10K',240000,13.5,'13.5',12.75),
    ('10K',240000,14.0,'14',12.96),
    ('10K',240000,14.5,'14.5',13.18),
    ('10K',240000,15.0,'15',13.39),
    ('10K',240000,15.5,'15.5',13.61),
    ('10K',240000,16.0,'16',13.82),
    ('14K',310000,4.0,'4',9.73),
    ('14K',310000,4.5,'4.5',9.97),
    ('14K',310000,5.0,'5',10.21),
    ('14K',310000,5.5,'5.5',10.45),
    ('14K',310000,6.0,'6',10.69),
    ('14K',310000,6.5,'6.5',10.93),
    ('14K',310000,7.0,'7',11.17),
    ('14K',310000,7.5,'7.5',11.41),
    ('14K',310000,8.0,'8',11.65),
    ('14K',310000,8.5,'8.5',11.89),
    ('14K',310000,9.0,'9',12.13),
    ('14K',310000,9.5,'9.5',12.37),
    ('14K',310000,10.0,'10',12.61),
    ('14K',310000,10.5,'10.5',12.85),
    ('14K',310000,11.0,'11',13.09),
    ('14K',310000,11.5,'11.5',13.33),
    ('14K',310000,12.0,'12',13.57),
    ('14K',310000,12.5,'12.5',13.81),
    ('14K',310000,13.0,'13',14.05),
    ('14K',310000,13.5,'13.5',14.29),
    ('14K',310000,14.0,'14',14.53),
    ('14K',310000,14.5,'14.5',14.77),
    ('14K',310000,15.0,'15',15.01),
    ('14K',310000,15.5,'15.5',15.25),
    ('14K',310000,16.0,'16',15.49),
    ('18K',400000,4.0,'4',11.06),
    ('18K',400000,4.5,'4.5',11.33),
    ('18K',400000,5.0,'5',11.60),
    ('18K',400000,5.5,'5.5',11.88),
    ('18K',400000,6.0,'6',12.15),
    ('18K',400000,6.5,'6.5',12.42),
    ('18K',400000,7.0,'7',12.70),
    ('18K',400000,7.5,'7.5',12.97),
    ('18K',400000,8.0,'8',13.24),
    ('18K',400000,8.5,'8.5',13.52),
    ('18K',400000,9.0,'9',13.79),
    ('18K',400000,9.5,'9.5',14.06),
    ('18K',400000,10.0,'10',14.34),
    ('18K',400000,10.5,'10.5',14.61),
    ('18K',400000,11.0,'11',14.88),
    ('18K',400000,11.5,'11.5',15.16),
    ('18K',400000,12.0,'12',15.43),
    ('18K',400000,12.5,'12.5',15.70),
    ('18K',400000,13.0,'13',15.98),
    ('18K',400000,13.5,'13.5',16.25),
    ('18K',400000,14.0,'14',16.52),
    ('18K',400000,14.5,'14.5',16.80),
    ('18K',400000,15.0,'15',17.07),
    ('18K',400000,15.5,'15.5',17.34),
    ('18K',400000,16.0,'16',17.62)) as r(karat, price, size, label, grams)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-TMC9'
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  name = excluded.name,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  stone_carat = excluded.stone_carat,
  stone_cost_cents = excluded.stone_cost_cents,
  stone_cost_source = excluded.stone_cost_source,
  updated_at = now();

commit;
