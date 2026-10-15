-- 0168_eon_tideline_family.sql
-- EON Tideline: düz profilli, 1,5 mm, satin yüz; tek kenarda basamakla iki parlak rib
-- ve aralarında ince oluk. Renk başına bir listing (EON-TIDE-Y/W/R), her biri
-- Karat x Width (4-7 mm) x Ring Size = 252 varyant, 12 görsel.
-- Kaynak paket: docs/eon/listings/2026-10-15-eon-tideline-band/ (README'de fiyat kanıtı: Ridge 378/378 + canlı DB mührü, 4-7 mm kullanılır).
-- Üretici: scripts/eon/gen_tideline_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Etsy: panelde "Etsy'ye gönder" (sahibin oturumu). Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (products'ta (org_id, sku) unique
-- yok, not-exists deseni); varyantlar (org_id, sku) üzerinden upsert; görsel
-- satırı aynı URL varsa atlanır. Etsy'de açılmış (etsy_listing_id dolu) ürüne
-- görsel eklenmez.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Karat')||'|'||(properties->>'Width')||'|'
--     ||(properties->>'Ring Size')||'|'||price_cents||'|'||to_char(weight_grams,'FM990.00'),
--     E'\n' order by sku collate "C")) from product_variants where sku like 'EON-TIDE-%';
--   beklenen: 3bb707f219704f10461423c8d93572ed
begin;

create temporary table _ww_cell(karat text, width_mm int, size text, price_cents int, grams numeric) on commit drop;
insert into _ww_cell values
('10K',4,'3',103500,2.71),
('10K',4,'3.5',104500,2.77),
('10K',4,'4',106000,2.84),
('10K',4,'4.5',107000,2.91),
('10K',4,'5',108500,2.98),
('10K',4,'5.5',109500,3.04),
('10K',4,'6',110500,3.11),
('10K',4,'6.5',112000,3.18),
('10K',4,'7',113000,3.26),
('10K',4,'7.5',114000,3.32),
('10K',4,'8',115500,3.39),
('10K',4,'8.5',116500,3.46),
('10K',4,'9',117500,3.52),
('10K',4,'9.5',119000,3.59),
('10K',4,'10',120000,3.66),
('10K',4,'10.5',121500,3.73),
('10K',4,'11',122500,3.80),
('10K',4,'11.5',124000,3.87),
('10K',4,'12',125000,3.94),
('10K',4,'12.5',126500,4.01),
('10K',4,'13',127500,4.07),
('10K',5,'3',115000,3.37),
('10K',5,'3.5',116500,3.46),
('10K',5,'4',118500,3.55),
('10K',5,'4.5',120000,3.64),
('10K',5,'5',121500,3.72),
('10K',5,'5.5',123000,3.81),
('10K',5,'6',124000,3.89),
('10K',5,'6.5',126000,3.98),
('10K',5,'7',127000,4.06),
('10K',5,'7.5',129000,4.15),
('10K',5,'8',130000,4.23),
('10K',5,'8.5',132000,4.32),
('10K',5,'9',133500,4.41),
('10K',5,'9.5',135000,4.49),
('10K',5,'10',136500,4.58),
('10K',5,'10.5',137500,4.66),
('10K',5,'11',139500,4.75),
('10K',5,'11.5',140500,4.83),
('10K',5,'12',142500,4.92),
('10K',5,'12.5',144000,5.01),
('10K',5,'13',145500,5.09),
('10K',6,'3',127500,4.07),
('10K',6,'3.5',129000,4.16),
('10K',6,'4',130500,4.26),
('10K',6,'4.5',132500,4.36),
('10K',6,'5',134000,4.46),
('10K',6,'5.5',136000,4.56),
('10K',6,'6',138000,4.67),
('10K',6,'6.5',139500,4.77),
('10K',6,'7',141500,4.87),
('10K',6,'7.5',143500,4.98),
('10K',6,'8',145000,5.08),
('10K',6,'8.5',147000,5.18),
('10K',6,'9',149000,5.29),
('10K',6,'9.5',150500,5.39),
('10K',6,'10',152500,5.49),
('10K',6,'10.5',154000,5.60),
('10K',6,'11',156000,5.70),
('10K',6,'11.5',157500,5.80),
('10K',6,'12',159500,5.91),
('10K',6,'12.5',161500,6.01),
('10K',6,'13',163000,6.11),
('10K',7,'3',139000,4.73),
('10K',7,'3.5',141000,4.85),
('10K',7,'4',143000,4.97),
('10K',7,'4.5',145500,5.09),
('10K',7,'5',147500,5.21),
('10K',7,'5.5',149500,5.33),
('10K',7,'6',151500,5.45),
('10K',7,'6.5',153500,5.57),
('10K',7,'7',156000,5.69),
('10K',7,'7.5',158000,5.81),
('10K',7,'8',160000,5.93),
('10K',7,'8.5',162000,6.05),
('10K',7,'9',164000,6.17),
('10K',7,'9.5',166500,6.29),
('10K',7,'10',168500,6.41),
('10K',7,'10.5',170500,6.53),
('10K',7,'11',172500,6.65),
('10K',7,'11.5',174500,6.77),
('10K',7,'12',177000,6.89),
('10K',7,'12.5',179000,7.01),
('10K',7,'13',181000,7.13),
('14K',4,'3',138500,3.07),
('14K',4,'3.5',140500,3.15),
('14K',4,'4',142500,3.23),
('14K',4,'4.5',144500,3.30),
('14K',4,'5',146000,3.38),
('14K',4,'5.5',148000,3.46),
('14K',4,'6',150000,3.54),
('14K',4,'6.5',152000,3.61),
('14K',4,'7',154000,3.69),
('14K',4,'7.5',156000,3.77),
('14K',4,'8',158000,3.85),
('14K',4,'8.5',159500,3.92),
('14K',4,'9',161500,4.00),
('14K',4,'9.5',163500,4.08),
('14K',4,'10',165500,4.16),
('14K',4,'10.5',167500,4.24),
('14K',4,'11',169500,4.32),
('14K',4,'11.5',171500,4.40),
('14K',4,'12',173500,4.48),
('14K',4,'12.5',175000,4.55),
('14K',4,'13',177000,4.63),
('14K',5,'3',158000,3.86),
('14K',5,'3.5',160000,3.95),
('14K',5,'4',162500,4.04),
('14K',5,'4.5',164500,4.12),
('14K',5,'5',166500,4.21),
('14K',5,'5.5',169500,4.32),
('14K',5,'6',172000,4.42),
('14K',5,'6.5',174500,4.52),
('14K',5,'7',176500,4.61),
('14K',5,'7.5',179000,4.71),
('14K',5,'8',181500,4.81),
('14K',5,'8.5',184000,4.91),
('14K',5,'9',186500,5.01),
('14K',5,'9.5',189000,5.11),
('14K',5,'10',191000,5.20),
('14K',5,'10.5',193500,5.30),
('14K',5,'11',196000,5.40),
('14K',5,'11.5',198500,5.50),
('14K',5,'12',201000,5.60),
('14K',5,'12.5',203000,5.69),
('14K',5,'13',205000,5.78),
('14K',6,'3',176500,4.62),
('14K',6,'3.5',179500,4.73),
('14K',6,'4',182000,4.84),
('14K',6,'4.5',185000,4.96),
('14K',6,'5',188000,5.07),
('14K',6,'5.5',190500,5.19),
('14K',6,'6',193500,5.31),
('14K',6,'6.5',196500,5.42),
('14K',6,'7',199500,5.54),
('14K',6,'7.5',202500,5.66),
('14K',6,'8',205000,5.78),
('14K',6,'8.5',208000,5.89),
('14K',6,'9',211000,6.01),
('14K',6,'9.5',214000,6.13),
('14K',6,'10',216500,6.24),
('14K',6,'10.5',219500,6.36),
('14K',6,'11',222500,6.48),
('14K',6,'11.5',225000,6.59),
('14K',6,'12',228000,6.71),
('14K',6,'12.5',231000,6.82),
('14K',6,'13',234000,6.94),
('14K',7,'3',195000,5.37),
('14K',7,'3.5',198500,5.51),
('14K',7,'4',202000,5.64),
('14K',7,'4.5',205000,5.78),
('14K',7,'5',208500,5.92),
('14K',7,'5.5',212000,6.06),
('14K',7,'6',215500,6.19),
('14K',7,'6.5',219000,6.33),
('14K',7,'7',222000,6.46),
('14K',7,'7.5',225500,6.60),
('14K',7,'8',229000,6.74),
('14K',7,'8.5',232000,6.87),
('14K',7,'9',235500,7.01),
('14K',7,'9.5',239000,7.15),
('14K',7,'10',242500,7.29),
('14K',7,'10.5',245500,7.42),
('14K',7,'11',249000,7.56),
('14K',7,'11.5',252000,7.69),
('14K',7,'12',255500,7.82),
('14K',7,'12.5',259000,7.96),
('14K',7,'13',262500,8.10),
('18K',4,'3',184000,3.61),
('18K',4,'3.5',186000,3.68),
('18K',4,'4',188500,3.76),
('18K',4,'4.5',191000,3.83),
('18K',4,'5',193500,3.91),
('18K',4,'5.5',195500,3.98),
('18K',4,'6',198000,4.06),
('18K',4,'6.5',200500,4.14),
('18K',4,'7',203000,4.22),
('18K',4,'7.5',205500,4.30),
('18K',4,'8',208000,4.38),
('18K',4,'8.5',210500,4.45),
('18K',4,'9',213000,4.53),
('18K',4,'9.5',215500,4.61),
('18K',4,'10',217500,4.68),
('18K',4,'10.5',220000,4.76),
('18K',4,'11',222500,4.84),
('18K',4,'11.5',225000,4.92),
('18K',4,'12',227500,5.00),
('18K',4,'12.5',230000,5.07),
('18K',4,'13',232500,5.15),
('18K',5,'3',214500,4.58),
('18K',5,'3.5',217500,4.68),
('18K',5,'4',220500,4.78),
('18K',5,'4.5',223500,4.87),
('18K',5,'5',226500,4.97),
('18K',5,'5.5',230000,5.07),
('18K',5,'6',232500,5.16),
('18K',5,'6.5',236000,5.26),
('18K',5,'7',239000,5.36),
('18K',5,'7.5',242000,5.45),
('18K',5,'8',245000,5.55),
('18K',5,'8.5',248000,5.65),
('18K',5,'9',251500,5.76),
('18K',5,'9.5',254500,5.85),
('18K',5,'10',257500,5.94),
('18K',5,'10.5',260500,6.04),
('18K',5,'11',263500,6.14),
('18K',5,'11.5',267000,6.24),
('18K',5,'12',269500,6.33),
('18K',5,'12.5',273000,6.43),
('18K',5,'13',276000,6.53),
('18K',6,'3',241000,5.43),
('18K',6,'3.5',245000,5.55),
('18K',6,'4',248500,5.66),
('18K',6,'4.5',252500,5.78),
('18K',6,'5',256000,5.90),
('18K',6,'5.5',260000,6.02),
('18K',6,'6',263500,6.14),
('18K',6,'6.5',267000,6.25),
('18K',6,'7',271000,6.37),
('18K',6,'7.5',274500,6.49),
('18K',6,'8',278500,6.61),
('18K',6,'8.5',282000,6.72),
('18K',6,'9',285500,6.84),
('18K',6,'9.5',289000,6.95),
('18K',6,'10',293000,7.07),
('18K',6,'10.5',296500,7.19),
('18K',6,'11',300000,7.30),
('18K',6,'11.5',304000,7.42),
('18K',6,'12',308000,7.54),
('18K',6,'12.5',311500,7.66),
('18K',6,'13',315500,7.78),
('18K',7,'3',257000,5.93),
('18K',7,'3.5',261500,6.07),
('18K',7,'4',266000,6.21),
('18K',7,'4.5',270000,6.35),
('18K',7,'5',274500,6.49),
('18K',7,'5.5',279000,6.63),
('18K',7,'6',284000,6.78),
('18K',7,'6.5',288000,6.92),
('18K',7,'7',293000,7.07),
('18K',7,'7.5',297500,7.21),
('18K',7,'8',302000,7.35),
('18K',7,'8.5',306000,7.49),
('18K',7,'9',311000,7.64),
('18K',7,'9.5',315500,7.78),
('18K',7,'10',319500,7.92),
('18K',7,'10.5',324500,8.07),
('18K',7,'11',329000,8.21),
('18K',7,'11.5',333500,8.35),
('18K',7,'12',337500,8.49),
('18K',7,'12.5',342000,8.63),
('18K',7,'13',346500,8.77);

create temporary table _ww_listing(code text, sku text, dir text, title text, description text, tags text[], materials text[], images jsonb, meta jsonb) on commit drop;
insert into _ww_listing values
  ($ww$Y$ww$, $ww$EON-TIDE-Y$ww$, $ww$yellow$ww$, $ww$Satin Wedding Band, Solid Yellow Gold Stepped Edge Ring, Polished Double Rib Detail, 10K 14K 18K, 4mm to 7mm$ww$,
   $ww$A flat solid gold band with a soft satin face and one finely worked edge. Along that edge the satin steps down to two slim polished ribs with a fine groove between them, so a line of bright light runs around the ring as it turns. The other edge is cut square and clean. The band is 1.5 mm thick and the inside is polished smooth with a comfort fit.

YOUR RING
Solid yellow gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: the shine comes from the polished ribs against the satin face. The satin finish is applied by hand, so its grain varies slightly from ring to ring.

CHOOSE YOUR FIT
Width: 4, 5, 6 or 7 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The satin face softens gradually with wear and can be refreshed by a jeweler; the polished ribs can be re-polished.

ABOUT THE IMAGES
The gallery uses AI-assisted visualizations guided by photographs of the physical design. The specification card and the engraving card are typeset, not generated. One image shows the three metal colors together; this listing is for the color named in the title. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$satin wedding band$ww$,$ww$stepped edge ring$ww$,$ww$double rib band$ww$,$ww$brushed gold band$ww$,$ww$matte gold ring$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$comfort fit ring$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$yellow gold ring$ww$]::text[], ARRAY[$ww$Yellow gold$ww$]::text[],
   $ww$[["01-hero.jpg","Yellow gold wedding band with a satin face and two polished ribs along one edge, standing on stone"],["02-worn.jpg","Yellow gold satin wedding band worn on the ring finger"],["03-edge-macro.jpg","Macro of the Yellow gold band: satin face, the step and the two polished ribs with a fine groove"],["04-width-ladder.jpg","Four Yellow gold bands from 4 mm to 7 mm side by side"],["05-profile.jpg","Yellow gold band lying flat, showing the 1.5 mm rim and the stepped edge"],["06-everyday.jpg","Hand wearing the Yellow gold band in everyday light"],["07-spec-card.jpg","Tideline specification card: 10K 14K 18K, 4 to 7 mm, US 3 to 13, 1.5 mm thick"],["08-true-scale.jpg","Yellow gold band held between two fingers to show its true size"],["09-interior.jpg","Polished comfort-fit interior of the Yellow gold band"],["10-pair.jpg","Yellow gold wedding pair, 7 mm and 4 mm"],["11-three-colors.jpg","The band in yellow, white and rose gold, Yellow gold in front"],["12-engraving-card.jpg","Inside engraving options: four fonts, up to 30 characters"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-10-15-eon-tideline-band","sourcePackagePath":"docs/eon/listings/2026-10-15-eon-tideline-band","generatorScript":"scripts/eon/gen_tideline_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"Yellow gold","goldSolidity":"Solid gold","pricing":{"laborUsd":110,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05, divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact + live DB seal; 252 used (4-7 mm)"},"approval":{"blockers":["Grams are estimated from the Ridge family; the physical demo sample was not weighed"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-10-15: \"eon için bu yüzük modelini listing haline getir\" (panel draft, then Etsy draft via the panel button)."},"variantSeal":"3bb707f219704f10461423c8d93572ed"}$ww$::jsonb),
  ($ww$W$ww$, $ww$EON-TIDE-W$ww$, $ww$white$ww$, $ww$Satin Wedding Band, Solid White Gold Stepped Edge Ring, Polished Double Rib Detail, 10K 14K 18K, 4mm to 7mm$ww$,
   $ww$A flat solid gold band with a soft satin face and one finely worked edge. Along that edge the satin steps down to two slim polished ribs with a fine groove between them, so a line of bright light runs around the ring as it turns. The other edge is cut square and clean. The band is 1.5 mm thick and the inside is polished smooth with a comfort fit.

YOUR RING
Solid white gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: the shine comes from the polished ribs against the satin face. The satin finish is applied by hand, so its grain varies slightly from ring to ring.

CHOOSE YOUR FIT
Width: 4, 5, 6 or 7 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The satin face softens gradually with wear and can be refreshed by a jeweler; the polished ribs can be re-polished.

ABOUT THE IMAGES
The gallery uses AI-assisted visualizations guided by photographs of the physical design. The specification card and the engraving card are typeset, not generated. One image shows the three metal colors together; this listing is for the color named in the title. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$satin wedding band$ww$,$ww$stepped edge ring$ww$,$ww$double rib band$ww$,$ww$brushed gold band$ww$,$ww$matte gold ring$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$comfort fit ring$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$white gold ring$ww$]::text[], ARRAY[$ww$White gold$ww$]::text[],
   $ww$[["01-hero.jpg","White gold wedding band with a satin face and two polished ribs along one edge, standing on stone"],["02-worn.jpg","White gold satin wedding band worn on the ring finger"],["03-edge-macro.jpg","Macro of the White gold band: satin face, the step and the two polished ribs with a fine groove"],["04-width-ladder.jpg","Four White gold bands from 4 mm to 7 mm side by side"],["05-profile.jpg","White gold band lying flat, showing the 1.5 mm rim and the stepped edge"],["06-everyday.jpg","Hand wearing the White gold band in everyday light"],["07-spec-card.jpg","Tideline specification card: 10K 14K 18K, 4 to 7 mm, US 3 to 13, 1.5 mm thick"],["08-true-scale.jpg","White gold band held between two fingers to show its true size"],["09-interior.jpg","Polished comfort-fit interior of the White gold band"],["10-pair.jpg","White gold wedding pair, 7 mm and 4 mm"],["11-three-colors.jpg","The band in yellow, white and rose gold, White gold in front"],["12-engraving-card.jpg","Inside engraving options: four fonts, up to 30 characters"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-10-15-eon-tideline-band","sourcePackagePath":"docs/eon/listings/2026-10-15-eon-tideline-band","generatorScript":"scripts/eon/gen_tideline_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"White gold","goldSolidity":"Solid gold","pricing":{"laborUsd":110,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05, divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact + live DB seal; 252 used (4-7 mm)"},"approval":{"blockers":["Grams are estimated from the Ridge family; the physical demo sample was not weighed"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-10-15: \"eon için bu yüzük modelini listing haline getir\" (panel draft, then Etsy draft via the panel button)."},"variantSeal":"3bb707f219704f10461423c8d93572ed"}$ww$::jsonb),
  ($ww$R$ww$, $ww$EON-TIDE-R$ww$, $ww$rose$ww$, $ww$Satin Wedding Band, Solid Rose Gold Stepped Edge Ring, Polished Double Rib Detail, 10K 14K 18K, 4mm to 7mm$ww$,
   $ww$A flat solid gold band with a soft satin face and one finely worked edge. Along that edge the satin steps down to two slim polished ribs with a fine groove between them, so a line of bright light runs around the ring as it turns. The other edge is cut square and clean. The band is 1.5 mm thick and the inside is polished smooth with a comfort fit.

YOUR RING
Solid rose gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: the shine comes from the polished ribs against the satin face. The satin finish is applied by hand, so its grain varies slightly from ring to ring.

CHOOSE YOUR FIT
Width: 4, 5, 6 or 7 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The satin face softens gradually with wear and can be refreshed by a jeweler; the polished ribs can be re-polished.

ABOUT THE IMAGES
The gallery uses AI-assisted visualizations guided by photographs of the physical design. The specification card and the engraving card are typeset, not generated. One image shows the three metal colors together; this listing is for the color named in the title. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$satin wedding band$ww$,$ww$stepped edge ring$ww$,$ww$double rib band$ww$,$ww$brushed gold band$ww$,$ww$matte gold ring$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$comfort fit ring$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$rose gold ring$ww$]::text[], ARRAY[$ww$Rose gold$ww$]::text[],
   $ww$[["01-hero.jpg","Rose gold wedding band with a satin face and two polished ribs along one edge, standing on stone"],["02-worn.jpg","Rose gold satin wedding band worn on the ring finger"],["03-edge-macro.jpg","Macro of the Rose gold band: satin face, the step and the two polished ribs with a fine groove"],["04-width-ladder.jpg","Four Rose gold bands from 4 mm to 7 mm side by side"],["05-profile.jpg","Rose gold band lying flat, showing the 1.5 mm rim and the stepped edge"],["06-everyday.jpg","Hand wearing the Rose gold band in everyday light"],["07-spec-card.jpg","Tideline specification card: 10K 14K 18K, 4 to 7 mm, US 3 to 13, 1.5 mm thick"],["08-true-scale.jpg","Rose gold band held between two fingers to show its true size"],["09-interior.jpg","Polished comfort-fit interior of the Rose gold band"],["10-pair.jpg","Rose gold wedding pair, 7 mm and 4 mm"],["11-three-colors.jpg","The band in yellow, white and rose gold, Rose gold in front"],["12-engraving-card.jpg","Inside engraving options: four fonts, up to 30 characters"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-10-15-eon-tideline-band","sourcePackagePath":"docs/eon/listings/2026-10-15-eon-tideline-band","generatorScript":"scripts/eon/gen_tideline_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"Rose gold","goldSolidity":"Solid gold","pricing":{"laborUsd":110,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05, divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact + live DB seal; 252 used (4-7 mm)"},"approval":{"blockers":["Grams are estimated from the Ridge family; the physical demo sample was not weighed"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-10-15: \"eon için bu yüzük modelini listing haline getir\" (panel draft, then Etsy draft via the panel button)."},"variantSeal":"3bb707f219704f10461423c8d93572ed"}$ww$::jsonb);

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images,
  product_type, listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', l.sku, l.title, l.description, l.tags, l.materials, 'draft', 'USD',
  (select min(price_cents) from _ww_cell), 20, true,
  'https://amuletta.artifactstudio.info/eon/tideline/' || l.dir || '/' || (l.images->0->>0), jsonb_array_length(l.images),
  'ring', l.meta
from _ww_listing l
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = l.sku
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  l.sku || '-' || left(c.karat, 2) || '-' || lpad(c.width_mm::text, 2, '0') || '-' || lpad(round(c.size::numeric * 10)::int::text, 3, '0'),
  p.id,
  c.width_mm || ' mm / US ' || c.size || ' / ' || c.karat,
  jsonb_build_object('Karat', c.karat, 'Width', c.width_mm || ' mm', 'Ring Size', 'US ' || c.size),
  c.price_cents,
  20,
  c.grams,
  'estimated',
  true,
  'USD'
from _ww_listing l
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = l.sku
cross join _ww_cell c
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  name = excluded.name,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, 'https://amuletta.artifactstudio.info/eon/tideline/' || l.dir || '/' || (img.v->>0), 'url', img.v->>1, (img.n - 1)::int
from _ww_listing l
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = l.sku and p.etsy_listing_id is null
cross join lateral jsonb_array_elements(l.images) with ordinality img(v, n)
where not exists (
  select 1 from public.listing_images li
  where li.product_id = p.id and li.url = 'https://amuletta.artifactstudio.info/eon/tideline/' || l.dir || '/' || (img.v->>0)
);

commit;
