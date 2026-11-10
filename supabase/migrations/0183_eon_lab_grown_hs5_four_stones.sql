-- 0183_eon_lab_grown_hs5_four_stones.sql
-- EON lab-grown 04 (EON-HS5) düzeltmesi. Sahip 2026-11-10, hero v1'den sonra: "taşlar 4 adet eşit aralıkta
-- konumlanmış olmalı". İki taş yerine DÖRT ~1,5 mm round lab-grown taş, bant çevresinde çeyrek tur (90°) arayla,
-- her biri sekiz uçlu oyma yıldızın ortasında. 0182 (iki taş) uygulandığı gibi donuk; bu migration canlı taslağı
-- listing.json'a getirir: başlık, açıklama, stone_count 4, setting_fee_cents 2000 (taş başı: yuva + ışın),
-- meta veri; varyantlarda taş 0.052 ct (kolon numeric(5,2) → 0,05) ve taş maliyeti $40.
-- Fiyat ve gram değişmez: $1.800 (alıcı %25 vitrinle $1.350; sahip ikinci kartta korudu), mühür aynı.
-- Maliyet US 8½ $787 (6,37 g × $100 + taş $40 + takma $40 + ışın $40 + dövme $30); en kötü Offsite kârı en düşük
-- US 16 +$111. Kanıt: docs/eon/lab-grown/2026-11-10-hammered-star-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/04-hammered-star/. Üretici: scripts/eon/gen_lab_grown_hs_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok. Bu migration Etsy'ye yazmaz.
--
-- Koşullu ve idempotent: yalnız taslak (status 'draft'), Etsy'ye çıkmamış (etsy_listing_id null) ve varyant
-- mührü 84001e3e3e8310a04d5a86f7249c6fd3 olan ürünü günceller; fiyat ve gram değişmez, mühür aynı kalır. İkinci koşu aynı değerleri yazar.
begin;

update public.products p set
  title = $ww$14K Gold Lab Grown Diamond Band, Hammered with Four Star Set Stones, 5mm$ww$,
  description = $ww$A solid 14K gold band, 5 mm wide, hammered all over and set with four small lab grown diamonds, each at the heart of an engraved eight-point star. The hammer marks break the light into many small reflections, and the four stars are spaced evenly around the band, a quarter turn apart, so however the ring turns, a star shows on top of your finger.

YOUR RING
Solid 14K gold in yellow, white or rose. Flat profile about 5 mm wide and 1.5 mm thick, with a narrow polished edge along both rims and a polished inside. The outer face is covered in overlapping round hammer marks with a soft satin sheen. Four round brilliant lab grown diamonds, about 1.5 mm each, are star set at equal intervals around the band, a quarter turn apart: each sits level with the surface at the center of a star cut into the gold, with four long rays and four short ones. About 6 grams in US 8.5. The price is for one ring in your selected metal color and size; all four lab grown diamonds are included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size.

ABOUT THE LAB GROWN DIAMONDS
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. A round brilliant cut is faceted to return as much light as possible, so even a small stone gives a bright, crisp flash.

THE STAR SETTING
Each stone sits in a seat cut into the band and is held by tiny beads of gold raised around its edge; the star's rays are then cut into the surface around it. The top of the stone stays level with the gold, so nothing stands proud to catch on clothing or gloves.

THE HAMMERED FINISH
The hammer marks are part of the gold itself, so they soften with wear rather than wearing away, and small everyday scratches blend into the texture.

SIZING AND RESIZING
Made to order in your size. Wider bands can feel tighter than narrow bands, so message us before ordering if you are between sizes. A jeweler can usually resize the band by about half a size, between two stars; a bigger change would leave the four stars unevenly spaced, and the hammer marks at the join may need to be redone.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  tags = ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$star set ring$ww$,$ww$celestial ring$ww$,$ww$hammered gold band$ww$,$ww$hammered gold ring$ww$,$ww$textured gold band$ww$,$ww$mens gold band$ww$,$ww$white gold band$ww$,$ww$rose gold band$ww$,$ww$14k gold band$ww$,$ww$solid gold band$ww$,$ww$5mm gold band$ww$]::text[],
  materials = ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[],
  stone_count = 4,
  setting_fee_cents = 2000,
  listing_metadata = $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-10-eon-lab-grown-hs5","sourcePackagePath":"docs/eon/lab-grown/04-hammered-star","generatorScript":"scripts/eon/gen_lab_grown_hs_migration.mjs","sourceReferenceUrl":"https://www.etsy.com/listing/4581494716/celestial-hammered-moissanite-ring-925","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"stone":{"origin":"lab","shape":"round","count":4,"sizeMm":"1.5","totalCarat":0.052,"caratNote":"Design stones 4 x 1.5 mm round brilliant, about 0.013 ct each (standard round chart), set at equal intervals around the band (owner 2026-11-10), matching the stone size in the reference photos. The reference claims 2.3 mm each (0.08 ctw DEW), which its own photos do not show and which would not sit safely in a 1.5 mm wall (stone depth about 1.4 mm). Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"settingFeeCents":1000,"engravingFeeCentsEach":1000,"textureFeeCents":3000,"castingFeeCents":0,"stoneCostCentsEstimate":4000,"stoneCostNote":"No maker quote for this design. The maker's only known lab rate is 280 USD/ct (Model 2 baguette): 4 x 0.013 ct = 14.56 USD; booked at 10 USD a stone (uncalibrated). Setting 10 USD a stone = the maker's Model 2 flush setting fee; star rays 10 USD a stone and hammer texture 30 USD a ring, both uncalibrated. Panel cost view (variant_stone_cost) sees stones 40 + star settings 4 x 20 (seat and rays, products.setting_fee_cents 2000) = 120; the 30 USD hammer texture has no panel field and is carried here only."},"band":{"widthMm":5,"thicknessMm":1.5,"karat":"14K","profile":"flat face covered in overlapping round hammer marks, a narrow polished edge along both rims","finish":"hammered face with a soft satin sheen (fine grain radiating inside each mark); high polish rims, star rays and inside","stars":"four identical eight-point stars (four long rays along and across the band, four short diagonal rays), each centred on one stone, spaced evenly around the band a quarter turn (90 degrees) apart (about 17 mm centre to centre along the outside at US 8.5); from any one view two of them show"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5), full rectangular 5 x 1.5 mm section; the hammer marks remove about 5% (about 0.32 g at US 8.5), kept in the cost as a buffer for the hammering. Public text says 'about 6 grams' (the lower, reduced figure).","anchorUs":8.5,"anchorGrams":6.37,"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"maker convention (same maker as EON-VB6): 14K band = grams x 100 USD (gold + labor), stones, settings, star rays and texture on top. US 8.5: 6.37 g x 100 = 636.88 + four stones 40 + four settings 40 + four star rays 40 + texture 30 = 786.88","packagingUsd":8,"shippingUsd":22,"landedUsdAtAnchor":816.88,"multiplier":1.55,"engineUsd":1266,"engineListUsdAtAnchor":1690,"storePromotionRate":0.25,"listUsd":1800,"buyerUsd":1350,"onePriceAllSizes":true,"everySizeFloorListUsd":1710,"worstOffsiteProfitBySizeUsd":{"US4":420,"US8.5":304,"US13":189,"US16":111},"at35PercentSale":"US 4-13 stay above zero at the worst Offsite fee; US 14 breaks even and US 16 loses about 52 USD (owner kept 1,800 USD with four stones on 2026-11-10 knowing this)","spotUsdPerOzt":4023.5,"spotDate":"2026-11-10","marketAnchors":["Reference BRIARLORE (Etsy 4581494716, 925 silver + moissanite, San Marino CA): 175.81 USD, no gold option listed, read 2026-11-10","EON's own '14K Gold Hammered Wedding Band, Beveled Edges, Comfort Fit, 4-8mm' (Etsy 4565377715): 5 mm US 8.5 list 2,005 USD (5.43 g) -> 1,503.75 at 25% off; 0 sales (panel sale_items 2026-11-10)","EON's '10K Gold Hammered Wedding Band, Milgrain Edge, Comfort Fit' (Etsy 4543442596): 4 sales 2026-08-07 to 2026-10-09, average unit 1,047.50 USD (5-6 mm, US 7-8.5)","Brilliant Earth 'Polished 5mm Starburst Diamond Wedding Band' 14K yellow (BE2D928): 5.0 mm, 12 round natural diamonds (min 0.051 ctw), 2,290 USD, read 2026-11-10","Blue Nile 14K yellow 4 mm comfort-fit hammered band 950 USD; Icing on the Ring 14K 6 mm hammered 895-1,150 USD; Allurez 'shooting star' 14K white 0.15 ct 1,954 USD on sale (search snippets 2026-11-10)"],"methodology":"docs/eon/lab-grown/price_model.py hs; formula lib/pricing-engine/eon-cost.ts 457-472"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod, needs no Width axis (width is fixed at 5 mm)"},"approval":{"authority":"Owner 2026-11-10 (question cards): list 1,800 USD -> 25% sale -> 1,350 USD, one price for every size; scope 14K, 3 colours, US 4-16 with half sizes (75 variants); gallery: generate all 10 frames from the prompt sheet (images/PROMPTS-REVIEW.md), hero first and checked against the reference. After hero v1 the owner corrected the design to four stones at equal intervals; hero v2 was approved on a second card, which also kept 1,800 USD with the four-stone cost.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Etsy activation needs at least one unedited photo of the physical piece (draft allowed)","No maker quote for this design: cost is the maker's band list (6.37 g x 100 USD at US 8.5) + four stones 40 + four star settings 80 + hammer texture 30, all estimates","Maker to confirm: stone size for a star setting in a 1.5 mm wall (design 1.5 mm, about 0.013 ct each; the reference claims 2.3 mm), the four stars evenly spaced a quarter turn apart (about 17 mm centre to centre at US 8.5) and how far the band can be resized before the spacing shows, stone colour/clarity grade, white gold rhodium plating, preparation time, price per size","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"84001e3e3e8310a04d5a86f7249c6fd3"}$ww$::jsonb
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HS5'
  and p.status = 'draft' and p.etsy_listing_id is null
  and p.listing_metadata->>'variantSeal' = '84001e3e3e8310a04d5a86f7249c6fd3';

update public.product_variants v set
  stone_carat = 0.052,
  stone_cost_cents = 4000,
  stone_cost_source = 'manual'
from public.products p
where v.product_id = p.id and v.org_id = p.org_id
  and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HS5'
  and p.status = 'draft' and p.etsy_listing_id is null
  and p.listing_metadata->>'variantSeal' = '84001e3e3e8310a04d5a86f7249c6fd3'
  and v.sku like 'EON-HS5-14K-%';

commit;
