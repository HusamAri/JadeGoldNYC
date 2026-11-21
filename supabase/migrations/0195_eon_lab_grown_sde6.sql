-- 0195_eon_lab_grown_sde6.sql
-- EON lab-grown 09 (EON-SDE6): 6,0 × 1,8 mm düz bant, ortası fırçalı saten; İKİ kenarda 45° cilalı pah ve her pahta tam
-- tur tek sıra ~1,3 mm round lab-grown taş (taşlar arası küçük boncuk), her sıranın içinde ince cilalı dudak; iç yüzey
-- cilalı. Resize OLMAZ (taşlar tam tur). Sahip kartı 2026-11-21: iki kenar. Karat × Metal Color × Ring Size US 4-16
-- yarım bedenler (225 varyant), ring_band. Ayar başına tek fiyat: 10K $2.650 / 14K $3.150 / 18K $3.850 (alıcı %25 vitrinle $1.988 / $2.363 / $2.888).
-- Maliyet: üretici konvansiyonu (14K gram × $100; 10K/18K ayar kuralı) + iki sıra × bedene göre taş × ($2,52 + takma $4).
-- Kaynak: sahibin 4 gerçek fotoğrafı + video (2026-11-19). Kanıt: docs/eon/lab-grown/2026-11-21-satin-diamond-edge-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/09-satin-diamond-edge/. Üretici: scripts/eon/gen_lab_grown_sde_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert. products.price_cents en düşük
-- ayarın fiyatıdır (Etsy listing fiyatı en ucuz seçenektir); her varyant kendi ayarının fiyatını taşır. Taş karatı ve
-- taş + takma maliyeti varyant başına (taş sayısı bedenle değişir), products.setting_fee_cents 0.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Karat')||'|'||(properties->>'Metal Color')||'|'
--     ||(properties->>'Ring Size')||'|'||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-SDE6-%';
--   beklenen: caa0e2ed9f235d8e0682254b5df3feab
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-SDE6', $ww$Mens 10K 14K 18K Gold Lab Grown Diamond Eternity Band, Beveled Edges, Brushed, 6mm$ww$,
  $ww$A solid gold band, 6 mm wide, with a brushed satin face between two beveled edges, each set with a row of round lab grown diamonds all the way around. The stones frame the brushed face on both sides and catch the light from either edge.

YOUR RING
Solid gold in 10K, 14K or 18K, in yellow, white or rose gold. About 6 mm wide and about 1.8 mm thick, flat with squared shoulders. The middle of the outer face has a fine brushed satin finish; the bevels and the inside are polished. Both edges are cut into a narrow polished bevel, and each bevel holds a single row of round brilliant lab grown diamonds, about 1.3 mm each, set side by side with small gold beads between them, all the way around the band. The number of stones depends on the ring size, because both rows always close the full circle. The price is for one ring in your selected karat, size and color; all the lab grown diamonds are included.

CHOOSE YOUR OPTIONS
1. Karat: 10K, 14K or 18K gold.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size and color in each karat.
3. Metal Color: yellow, white or rose gold.

SIZING: THIS BAND CANNOT BE RESIZED
The lab grown diamonds run all the way around both edges, so there is no plain section a jeweler could cut or stretch, and the size is set when the band is made. Please have your finger measured by a jeweler before ordering. Wide bands fit more snugly than thin ones; if you are between sizes, message us before ordering.

ABOUT THE LAB GROWN DIAMONDS
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. Each stone is a round brilliant cut, so each row reads as one line of light around its edge.

THE SETTING
Each stone sits in a polished bevel and is held by small gold beads shared with its neighbours. Set in the bevels at the two edges of the band, the stones show from the side and from above while the brushed face between them stays plain.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$mens eternity band$ww$,$ww$beveled edge band$ww$,$ww$brushed gold band$ww$,$ww$double row band$ww$,$ww$mens gold band$ww$,$ww$6mm gold band$ww$,$ww$10k gold band$ww$,$ww$14k gold band$ww$,$ww$18k gold band$ww$,$ww$white gold band$ww$,$ww$rose gold band$ww$]::text[], ARRAY[$ww$Solid 10K yellow gold$ww$,$ww$Solid 10K white gold$ww$,$ww$Solid 10K rose gold$ww$,$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Solid 18K yellow gold$ww$,$ww$Solid 18K white gold$ww$,$ww$Solid 18K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  265000, 20, true, null, 0, 'ring',
  'round', 'lab', 88, 0, 0,
  $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-21-eon-lab-grown-sde6","sourcePackagePath":"docs/eon/lab-grown/09-satin-diamond-edge","generatorScript":"scripts/eon/gen_lab_grown_sde_migration.mjs","sourceReference":"Owner 2026-11-21: four unedited photos and a 6.8 s video of a real made piece (2026-11-19, workshop: red ring holder, white towel, wooden bench) with 'new model. but this model do not accept resizing due to its diamonds are whole circle ... 3karat, all us and half sizes, 3 gold color'. Not committed (the owner's photos; frame use is the owner's decision). Design from photo 4 and video frames 1, 61, 114: a flat band with squared shoulders; the outer face has a fine brushed satin finish with the lines running around the band; along BOTH edges the corner is cut into a polished 45 degree bevel that holds a single row of round brilliant stones, side by side with small polished gold beads between them, all the way around the ring; a thin polished lip runs inside each row; the inside is polished. Owner card 2026-11-21, design check: 'Both edges' (the sharp photos show the near row; photo 2's lower edge and video frames 131-137 show the second row edge-on). Measured by pixel ratios (no scale object): stone about 32 px and centre-to-centre spacing about 36 px in photo 4 (pitch / stone 1.13), stone / visible face 0.25-0.35; about 21 stones on the visible half of the near row, about 42 around each circle, consistent with a sample of about US 8.5. Design: 6.0 mm wide, about 1.8 mm thick, stones about 1.3 mm (about 0.009 ct each), pitch 1.5 mm. Photos 2 and 3 look sharpened or retouched; photo 1 cuts the ring at the right edge; photo 4 (on the red holder) is sharp, unedited and shows the whole ring.","variationAxes":["Karat","Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"resizable":false,"karats":[{"karat":"10K","priceCents":265000},{"karat":"14K","priceCents":315000},{"karat":"18K","priceCents":385000}],"stone":{"origin":"lab","shape":"round","count":88,"countBySize":"2 rows x ceil(pi x (inner diameter + 2.0 mm) / 1.5 mm), inner diameter 11.63 + 0.8128 x US: US 4 72, US 8.5 88, US 16 112 (pessimistic, rounded up per row); products.stone_count carries the US 8.5 count","sizeMm":"1.3","caratEach":0.009,"caratNote":"Design stones about 1.3 mm round brilliant (about 0.009 ct each), measured from the owner's photos by ratio (no scale object); two rows, about 0.79 ct at US 8.5. Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"stoneUsdEach":2.52,"settingUsdEach":4,"settingFeeCents":0,"castingFeeCents":0,"stoneCostNote":"No maker quote for this design. The maker's only known lab rate is 280 USD/ct (Model 2 baguette): 0.009 ct = 2.52 USD a stone. Bead setting 4 USD a stone = the maker's DSP prong-setting note, uncalibrated for bead setting. Stone carat and stone + setting cost are written per variant (the count changes with size), so products.setting_fee_cents is 0 (same as EON-HEP).","rows":2},"band":{"widthMm":6,"thicknessMm":1.8,"profile":"flat outer face with squared shoulders","finish":"fine brushed satin middle of the outer face (about two thirds of the width, about 4 mm), lines running around the band; polished bevels and inside","diamondEdges":"both edges cut into a polished 45 degree bevel; each bevel holds a single row of round brilliant stones side by side with small gold beads between them, all the way around the ring; a thin polished lip inside each row (owner card 2026-11-21: 'Both edges')","rows":2,"row":"stones about 1.3 mm at a 1.5 mm pitch; each row closes the full circle at every size, so the count grows with the size (per row 36 at US 4, 44 at US 8.5, 56 at US 16; both rows 72 / 88 / 112 by the design geometry)"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5), full rectangular 6.0 x 1.8 mm section; 10K and 18K x alloy density 0.892 / 1.137. The two bevels and the stone seats remove metal, kept in the cost as a buffer. Public text gives no weight.","anchorUs":8.5,"anchorGrams":{"10K":8.18,"14K":9.17,"18K":10.43},"densityRatio":{"10K":0.892,"14K":1,"18K":1.137},"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"per karat and size: maker convention (same maker as EON-VB6/TMC9) 14K grams x 100 USD (gold + labour), 10K/18K USD per gram from lib/gold-cost.ts derivePurchaseCentsPerGram (metal scales with spot x purity, the 14K labour premium does not); + two rows of stones by size x (2.52 + 4.00). US 8.5: 10K 660.74 + 573.76 = 1234.50; 14K 917.10 + 573.76 = 1490.86; 18K 1238.47 + 573.76 = 1812.23.","packagingUsd":8,"shippingUsd":22,"multiplier":1.55,"storePromotionRate":0.25,"onePriceAllSizes":true,"spotUsdPerOzt":3539,"spotDate":"2026-11-21","spotSource":"gold-api.com 2026-11-21T07:44Z","byKarat":{"10K":{"listUsd":2650,"buyerUsd":1988,"ratePerGramUsd":80.77,"gramsAtAnchor":8.18,"goldUsdAtAnchor":660.74,"extrasUsdAtAnchor":573.76,"landedUsdAtAnchor":1264.5,"engineUsd":1960,"engineListUsdAtAnchor":2615,"everySizeFloorListUsd":2615,"worstOffsiteProfitBySizeUsd":{"US4":658,"US8.5":434,"US12":275,"US16":77}},"14K":{"listUsd":3150,"buyerUsd":2363,"ratePerGramUsd":100,"gramsAtAnchor":9.17,"goldUsdAtAnchor":917.1,"extrasUsdAtAnchor":573.76,"landedUsdAtAnchor":1520.86,"engineUsd":2357,"engineListUsdAtAnchor":3145,"everySizeFloorListUsd":3105,"worstOffsiteProfitBySizeUsd":{"US4":788,"US8.5":517,"US12":322,"US16":82}},"18K":{"listUsd":3850,"buyerUsd":2888,"ratePerGramUsd":118.77,"gramsAtAnchor":10.43,"goldUsdAtAnchor":1238.47,"extrasUsdAtAnchor":573.76,"landedUsdAtAnchor":1842.23,"engineUsd":2855,"engineListUsdAtAnchor":3810,"everySizeFloorListUsd":3720,"worstOffsiteProfitBySizeUsd":{"US4":1000,"US8.5":671,"US12":430,"US16":138}}},"at35PercentSale":"every-size floors at a 35% sale are 10K 3,015 / 14K 3,580 / 18K 4,295; at the proposed prices a 35% sale stays above zero through US 12 and loses about 163 / 203 / 210 USD at US 16 (worst Offsite)","alternative":"10K 3,050 / 14K 3,600 / 18K 4,300 keeps every size above zero at a 35% sale","marketAnchors":["Blue Nile 'Men's Beveled Edge Diamond Band in 14k Yellow Gold (6.5 mm)', item 196251 (read 2026-11-21): natural H-I SI2, 1/2 ct t.w., 44 round stones, a row along EACH of its two edges, 'This ring cannot be resized', 2,541 USD on sale from 3,630","James Allen 'Beveled Bezel Set Men's Diamond Wedding Band In 14K Yellow Gold (6.00mm)': 2,390 USD shown as 1,792 on sale (search snippet 2026-11-21; the page redirects to a bot check, not read)","Jared 'Men's lab-grown diamond stepped edge band 1-1/2 ct tw 14K white gold' 6.25 mm: 3,192 USD on sale (search snippet 2026-11-21)","Kay 'Now + Forever lab-grown men's three-row diagonal band 1/3 ct tw 14K' 6 mm: 1,399.99 USD (search snippet 2026-11-21)","Search summary 2026-11-21: 6 mm 14K men's diamond bands with satin or beveled finishes about 1,400 to 3,200 USD; no listing with stones all the way around one edge found (Etsy or retail)","EON lab-grown line: PC9 1,500 -> 1,125; HS5 and FR6 1,800 -> 1,350; VB6 2,665 -> 1,999; TMC9 14K 3,100 -> 2,325"],"methodology":"docs/eon/lab-grown/price_model.py sde; formula lib/pricing-engine/eon-cost.ts 457-472; karat rule lib/gold-cost.ts derivePurchaseCentsPerGram","supersededOneRowPrices":"10K 2,100 / 14K 2,600 / 18K 3,250 were chosen on the owner card for the one-row reading; with two rows they lose money from US 12 (14K US 16 -291 USD at the 25% sale), so they are not used"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod and needs no Width axis (width is fixed at 6 mm); Karat x Ring Size x Metal Color go to the Etsy three-axis slots 516/513/514 (lib/etsy/create-listing.ts; jsonb key order Karat, Ring Size, Metal Color), 225 products (limit 400)"},"approval":{"authority":"Owner 2026-11-21, two cards. Card 1: gallery = 9 Higgsfield frames from the prompt sheet (images/PROMPTS-REVIEW.md) + the locally typeset spec card, about 26 credits, cap 40; real photo = photo 4 (red holder, whole ring in frame) as the last frame, unedited; design check = 'Both edges' (each beveled edge carries a full row). Card 1's price answer (10K 2,100 / 14K 2,600 / 18K 3,250) was for the one-row reading and is superseded. Card 2: prices 10K 2,650 / 14K 3,150 / 18K 3,850 -> 25% sale 1,987.50 / 2,362.50 / 2,887.50, one price for every size and color in each karat; generation approved on the revised two-row prompt sheet, hero first.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Gallery not attached yet (9 frames + spec card + the owner's photo 4 as the last frame; until the gallery migration is applied the draft has no photos)","No maker quote for this design: cost is grams x 100 USD in 14K (10K/18K by the karat rule) + two rows of stones, 2.52 USD and bead setting 4 USD each, by size, all estimates","Maker to confirm: width and thickness of the sample (design 6.0 x 1.8 mm, measured by ratio only), stone size and count per size and per row (design two rows of 1.3 mm at a 1.5 mm pitch), lab grown or natural, bead setting fee, 10K and 18K rates, white gold rhodium plating, preparation time","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"caa0e2ed9f235d8e0682254b5df3feab"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-SDE6'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-SDE6-' || r.karat || '-' || c.code || '-US' || lpad(round(r.size * 10)::int::text, 3, '0'),
  p.id,
  r.karat || ' / US ' || r.label || ' / ' || c.name,
  jsonb_build_object('Karat', r.karat, 'Metal Color', c.name, 'Ring Size', 'US ' || r.label),
  r.price,
  20,
  r.grams,
  'estimated',
  true,
  'USD',
  r.stone_carat,
  r.stone_cost,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    ('10K',265000,4.0,'4',6.69,0.65,46944),
    ('10K',265000,4.5,'4.5',6.86,0.67,48248),
    ('10K',265000,5.0,'5',7.02,0.68,49552),
    ('10K',265000,5.5,'5.5',7.19,0.68,49552),
    ('10K',265000,6.0,'6',7.35,0.70,50856),
    ('10K',265000,6.5,'6.5',7.52,0.72,52160),
    ('10K',265000,7.0,'7',7.68,0.74,53464),
    ('10K',265000,7.5,'7.5',7.85,0.76,54768),
    ('10K',265000,8.0,'8',8.02,0.77,56072),
    ('10K',265000,8.5,'8.5',8.18,0.79,57376),
    ('10K',265000,9.0,'9',8.35,0.79,57376),
    ('10K',265000,9.5,'9.5',8.51,0.81,58680),
    ('10K',265000,10.0,'10',8.68,0.83,59984),
    ('10K',265000,10.5,'10.5',8.84,0.85,61288),
    ('10K',265000,11.0,'11',9.01,0.86,62592),
    ('10K',265000,11.5,'11.5',9.17,0.88,63896),
    ('10K',265000,12.0,'12',9.34,0.88,63896),
    ('10K',265000,12.5,'12.5',9.50,0.90,65200),
    ('10K',265000,13.0,'13',9.67,0.92,66504),
    ('10K',265000,13.5,'13.5',9.83,0.94,67808),
    ('10K',265000,14.0,'14',10.00,0.95,69112),
    ('10K',265000,14.5,'14.5',10.17,0.97,70416),
    ('10K',265000,15.0,'15',10.33,0.99,71720),
    ('10K',265000,15.5,'15.5',10.50,0.99,71720),
    ('10K',265000,16.0,'16',10.66,1.01,73024),
    ('14K',315000,4.0,'4',7.50,0.65,46944),
    ('14K',315000,4.5,'4.5',7.69,0.67,48248),
    ('14K',315000,5.0,'5',7.87,0.68,49552),
    ('14K',315000,5.5,'5.5',8.06,0.68,49552),
    ('14K',315000,6.0,'6',8.24,0.70,50856),
    ('14K',315000,6.5,'6.5',8.43,0.72,52160),
    ('14K',315000,7.0,'7',8.61,0.74,53464),
    ('14K',315000,7.5,'7.5',8.80,0.76,54768),
    ('14K',315000,8.0,'8',8.99,0.77,56072),
    ('14K',315000,8.5,'8.5',9.17,0.79,57376),
    ('14K',315000,9.0,'9',9.36,0.79,57376),
    ('14K',315000,9.5,'9.5',9.54,0.81,58680),
    ('14K',315000,10.0,'10',9.73,0.83,59984),
    ('14K',315000,10.5,'10.5',9.91,0.85,61288),
    ('14K',315000,11.0,'11',10.10,0.86,62592),
    ('14K',315000,11.5,'11.5',10.28,0.88,63896),
    ('14K',315000,12.0,'12',10.47,0.88,63896),
    ('14K',315000,12.5,'12.5',10.65,0.90,65200),
    ('14K',315000,13.0,'13',10.84,0.92,66504),
    ('14K',315000,13.5,'13.5',11.03,0.94,67808),
    ('14K',315000,14.0,'14',11.21,0.95,69112),
    ('14K',315000,14.5,'14.5',11.40,0.97,70416),
    ('14K',315000,15.0,'15',11.58,0.99,71720),
    ('14K',315000,15.5,'15.5',11.77,0.99,71720),
    ('14K',315000,16.0,'16',11.95,1.01,73024),
    ('18K',385000,4.0,'4',8.53,0.65,46944),
    ('18K',385000,4.5,'4.5',8.74,0.67,48248),
    ('18K',385000,5.0,'5',8.95,0.68,49552),
    ('18K',385000,5.5,'5.5',9.16,0.68,49552),
    ('18K',385000,6.0,'6',9.37,0.70,50856),
    ('18K',385000,6.5,'6.5',9.58,0.72,52160),
    ('18K',385000,7.0,'7',9.80,0.74,53464),
    ('18K',385000,7.5,'7.5',10.01,0.76,54768),
    ('18K',385000,8.0,'8',10.22,0.77,56072),
    ('18K',385000,8.5,'8.5',10.43,0.79,57376),
    ('18K',385000,9.0,'9',10.64,0.79,57376),
    ('18K',385000,9.5,'9.5',10.85,0.81,58680),
    ('18K',385000,10.0,'10',11.06,0.83,59984),
    ('18K',385000,10.5,'10.5',11.27,0.85,61288),
    ('18K',385000,11.0,'11',11.48,0.86,62592),
    ('18K',385000,11.5,'11.5',11.69,0.88,63896),
    ('18K',385000,12.0,'12',11.90,0.88,63896),
    ('18K',385000,12.5,'12.5',12.11,0.90,65200),
    ('18K',385000,13.0,'13',12.32,0.92,66504),
    ('18K',385000,13.5,'13.5',12.54,0.94,67808),
    ('18K',385000,14.0,'14',12.75,0.95,69112),
    ('18K',385000,14.5,'14.5',12.96,0.97,70416),
    ('18K',385000,15.0,'15',13.17,0.99,71720),
    ('18K',385000,15.5,'15.5',13.38,0.99,71720),
    ('18K',385000,16.0,'16',13.59,1.01,73024)) as r(karat, price, size, label, grams, stone_carat, stone_cost)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-SDE6'
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
