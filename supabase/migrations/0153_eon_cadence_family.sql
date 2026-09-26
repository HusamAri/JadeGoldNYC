-- 0153_eon_cadence_family.sql
-- EON Cadence: kumlanmış düz fasetli, fasetler arası parlak kesimli, basamaklı
-- kenarlı alyans, renk başına bir listing (EON-CADNC-Y/W/R), her biri Karat x Width x Ring Size = 378 varyant.
-- Kaynak paket: docs/eon/listings/2026-09-26-eon-cadence-groove-band/ (README'de fiyat kanıtı: Ridge 378/378 + canlı DB mührü).
-- Üretici: scripts/eon/gen_cadence_migration.mjs — ELLE DÜZENLEMEYİN.
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
--     E'\n' order by sku collate "C")) from product_variants where sku like 'EON-CADNC-%';
--   beklenen: 077bc2bb1a552040a73cab0968edeb92
begin;

create temporary table _ww_cell(karat text, width_mm int, size text, price_cents int, grams numeric) on commit drop;
insert into _ww_cell values
('10K',3,'3',91500,2.02),
('10K',3,'3.5',92500,2.08),
('10K',3,'4',93500,2.13),
('10K',3,'4.5',94500,2.18),
('10K',3,'5',95000,2.23),
('10K',3,'5.5',96000,2.28),
('10K',3,'6',97000,2.33),
('10K',3,'6.5',98000,2.39),
('10K',3,'7',99000,2.44),
('10K',3,'7.5',99500,2.49),
('10K',3,'8',100500,2.54),
('10K',3,'8.5',101500,2.59),
('10K',3,'9',102500,2.64),
('10K',3,'9.5',103500,2.70),
('10K',3,'10',104500,2.75),
('10K',3,'10.5',105000,2.80),
('10K',3,'11',106000,2.85),
('10K',3,'11.5',107000,2.90),
('10K',3,'12',108000,2.95),
('10K',3,'12.5',108500,3.00),
('10K',3,'13',109500,3.06),
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
('10K',8,'3',161500,5.40),
('10K',8,'3.5',164500,5.54),
('10K',8,'4',167000,5.68),
('10K',8,'4.5',169500,5.81),
('10K',8,'5',172000,5.95),
('10K',8,'5.5',174500,6.09),
('10K',8,'6',177000,6.22),
('10K',8,'6.5',180000,6.36),
('10K',8,'7',182500,6.50),
('10K',8,'7.5',185000,6.64),
('10K',8,'8',187500,6.78),
('10K',8,'8.5',190000,6.91),
('10K',8,'9',193000,7.05),
('10K',8,'9.5',195500,7.19),
('10K',8,'10',198000,7.33),
('10K',8,'10.5',200500,7.46),
('10K',8,'11',203000,7.59),
('10K',8,'11.5',205500,7.73),
('10K',8,'12',208000,7.87),
('10K',8,'12.5',211000,8.01),
('10K',8,'13',213500,8.14),
('14K',3,'3',119500,2.29),
('14K',3,'3.5',121000,2.36),
('14K',3,'4',122500,2.42),
('14K',3,'4.5',124000,2.48),
('14K',3,'5',125500,2.54),
('14K',3,'5.5',127000,2.60),
('14K',3,'6',128500,2.66),
('14K',3,'6.5',129500,2.71),
('14K',3,'7',131000,2.77),
('14K',3,'7.5',132500,2.83),
('14K',3,'8',134000,2.89),
('14K',3,'8.5',135500,2.95),
('14K',3,'9',137000,3.01),
('14K',3,'9.5',138500,3.06),
('14K',3,'10',140000,3.12),
('14K',3,'10.5',141500,3.18),
('14K',3,'11',142500,3.23),
('14K',3,'11.5',144500,3.30),
('14K',3,'12',145500,3.36),
('14K',3,'12.5',147000,3.41),
('14K',3,'13',148500,3.47),
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
('14K',8,'3',229500,6.14),
('14K',8,'3.5',234000,6.30),
('14K',8,'4',238000,6.45),
('14K',8,'4.5',242000,6.61),
('14K',8,'5',246000,6.76),
('14K',8,'5.5',250500,6.92),
('14K',8,'6',254500,7.07),
('14K',8,'6.5',258500,7.23),
('14K',8,'7',262500,7.39),
('14K',8,'7.5',267000,7.55),
('14K',8,'8',271000,7.70),
('14K',8,'8.5',275000,7.86),
('14K',8,'9',279000,8.01),
('14K',8,'9.5',283500,8.17),
('14K',8,'10',287500,8.32),
('14K',8,'10.5',291500,8.48),
('14K',8,'11',295500,8.63),
('14K',8,'11.5',299500,8.79),
('14K',8,'12',303500,8.94),
('14K',8,'12.5',308000,9.10),
('14K',8,'13',312000,9.25),
('18K',3,'3',153500,2.64),
('18K',3,'3.5',155500,2.71),
('18K',3,'4',157500,2.77),
('18K',3,'4.5',159500,2.84),
('18K',3,'5',161500,2.90),
('18K',3,'5.5',163500,2.96),
('18K',3,'6',165500,3.03),
('18K',3,'6.5',167500,3.09),
('18K',3,'7',169500,3.16),
('18K',3,'7.5',171500,3.22),
('18K',3,'8',173500,3.28),
('18K',3,'8.5',175500,3.35),
('18K',3,'9',177500,3.41),
('18K',3,'9.5',180000,3.48),
('18K',3,'10',181500,3.54),
('18K',3,'10.5',183500,3.60),
('18K',3,'11',185500,3.67),
('18K',3,'11.5',187500,3.73),
('18K',3,'12',190000,3.80),
('18K',3,'12.5',191500,3.86),
('18K',3,'13',193500,3.92),
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
('18K',7,'13',346500,8.77),
('18K',8,'3',295500,6.52),
('18K',8,'3.5',301500,6.69),
('18K',8,'4',307000,6.85),
('18K',8,'4.5',312500,7.02),
('18K',8,'5',318500,7.19),
('18K',8,'5.5',323500,7.34),
('18K',8,'6',329000,7.50),
('18K',8,'6.5',334000,7.65),
('18K',8,'7',338500,7.79),
('18K',8,'7.5',344000,7.95),
('18K',8,'8',349500,8.11),
('18K',8,'8.5',354500,8.26),
('18K',8,'9',359500,8.41),
('18K',8,'9.5',365000,8.56),
('18K',8,'10',370000,8.72),
('18K',8,'10.5',375500,8.88),
('18K',8,'11',380500,9.03),
('18K',8,'11.5',386000,9.19),
('18K',8,'12',391500,9.35),
('18K',8,'12.5',396500,9.50),
('18K',8,'13',401500,9.65);

create temporary table _ww_listing(code text, sku text, dir text, title text, description text, tags text[], materials text[], images jsonb, meta jsonb) on commit drop;
insert into _ww_listing values
  ($ww$Y$ww$, $ww$EON-CADNC-Y$ww$, $ww$yellow$ww$, $ww$Sandblasted Wedding Band, Solid Yellow Gold Faceted Step Edge Ring, Polished Cuts, 10K 14K 18K, 3mm to 8mm$ww$,
   $ww$Flat, frosted facets run around this solid gold band like the sides of a polygon, each one finished in a fine sandblasted matte. Where two facets meet, a broad polished cut crosses the full width of the band, either a smooth scooped channel or a small two-step bar, so bright sculpted joints alternate with quiet matte panels. Both edges step down to a narrow polished rail, and the inside is polished smooth with a comfort fit.

YOUR RING
Solid yellow gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones. The sandblasted finish is applied by hand, so its fine grain varies slightly from ring to ring while the facet pattern stays the same.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The sandblasted center softens gradually with wear and can be refreshed by a jeweler; the polished cuts and rails can be re-polished.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design. Every scene was created independently for this metal color, not recolored from another. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$sandblasted band$ww$,$ww$matte wedding band$ww$,$ww$step edge ring$ww$,$ww$faceted gold band$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$comfort fit ring$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$modern gold band$ww$,$ww$yellow gold ring$ww$]::text[], ARRAY[$ww$Yellow gold$ww$]::text[],
   $ww$[["01-hero.jpg","Yellow gold faceted wedding band with sandblasted panels and polished cuts"],["02-worn-linen.jpg","Yellow gold faceted band worn on the ring finger, hand resting on linen"],["03-macro.jpg","Close-up of the polished cuts between sandblasted facets on the Yellow gold band"],["04-width-ladder.jpg","Three Yellow gold faceted bands in narrow, medium and wide widths"],["05-profile.jpg","Yellow gold faceted band showing its stepped polished edge rails"],["06-worn-coffee.jpg","Yellow gold faceted band worn while holding a coffee cup"],["07-spec-card.jpg","Cadence specification card: 10K 14K 18K, 3 to 8 mm, US 3 to 13"],["08-scale-fingers.jpg","Yellow gold faceted band held between two fingers for scale"],["09-interior.jpg","Yellow gold faceted band showing the polished comfort-fit interior"],["10-pair.jpg","Pair of Yellow gold faceted wedding bands in two widths"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-09-26-eon-cadence-groove-band","sourcePackagePath":"docs/eon/listings/2026-09-26-eon-cadence-groove-band","generatorScript":"scripts/eon/gen_cadence_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"Yellow gold","goldSolidity":"Solid gold","pricing":{"laborUsd":110,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact + live DB seal"},"approval":{"blockers":["Grams are estimated from the Ridge family (same table as Laurel Cross); the physical demo sample was not weighed","Labor tier: USD 110 (Ridge, step + texture) chosen; the ornamental tier USD 130 (Willow) is the owner's alternative for the polished facet cuts","Store discount is 30% live vs 25% assumed by the engine (EK-6) — owner decision pending"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-09-26: \"aynı şekilde listingleri oluştur\" (same flow as Willow: panel draft, then Etsy draft via the panel button)."},"variantSeal":"077bc2bb1a552040a73cab0968edeb92"}$ww$::jsonb),
  ($ww$W$ww$, $ww$EON-CADNC-W$ww$, $ww$white$ww$, $ww$Sandblasted Wedding Band, Solid White Gold Faceted Step Edge Ring, Polished Cuts, 10K 14K 18K, 3mm to 8mm$ww$,
   $ww$Flat, frosted facets run around this solid gold band like the sides of a polygon, each one finished in a fine sandblasted matte. Where two facets meet, a broad polished cut crosses the full width of the band, either a smooth scooped channel or a small two-step bar, so bright sculpted joints alternate with quiet matte panels. Both edges step down to a narrow polished rail, and the inside is polished smooth with a comfort fit.

YOUR RING
Solid white gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones. The sandblasted finish is applied by hand, so its fine grain varies slightly from ring to ring while the facet pattern stays the same.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The sandblasted center softens gradually with wear and can be refreshed by a jeweler; the polished cuts and rails can be re-polished.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design. Every scene was created independently for this metal color, not recolored from another. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$sandblasted band$ww$,$ww$matte wedding band$ww$,$ww$step edge ring$ww$,$ww$faceted gold band$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$comfort fit ring$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$modern gold band$ww$,$ww$white gold ring$ww$]::text[], ARRAY[$ww$White gold$ww$]::text[],
   $ww$[["01-hero.jpg","White gold faceted wedding band with sandblasted panels and polished cuts"],["02-worn-linen.jpg","White gold faceted band worn on the ring finger, hand resting on linen"],["03-macro.jpg","Close-up of the polished cuts between sandblasted facets on the White gold band"],["04-width-ladder.jpg","Three White gold faceted bands in narrow, medium and wide widths"],["05-profile.jpg","White gold faceted band showing its stepped polished edge rails"],["06-worn-coffee.jpg","White gold faceted band worn while holding a coffee cup"],["07-spec-card.jpg","Cadence specification card: 10K 14K 18K, 3 to 8 mm, US 3 to 13"],["08-scale-fingers.jpg","White gold faceted band held between two fingers for scale"],["09-interior.jpg","White gold faceted band showing the polished comfort-fit interior"],["10-pair.jpg","Pair of White gold faceted wedding bands in two widths"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-09-26-eon-cadence-groove-band","sourcePackagePath":"docs/eon/listings/2026-09-26-eon-cadence-groove-band","generatorScript":"scripts/eon/gen_cadence_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"White gold","goldSolidity":"Solid gold","pricing":{"laborUsd":110,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact + live DB seal"},"approval":{"blockers":["Grams are estimated from the Ridge family (same table as Laurel Cross); the physical demo sample was not weighed","Labor tier: USD 110 (Ridge, step + texture) chosen; the ornamental tier USD 130 (Willow) is the owner's alternative for the polished facet cuts","Store discount is 30% live vs 25% assumed by the engine (EK-6) — owner decision pending"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-09-26: \"aynı şekilde listingleri oluştur\" (same flow as Willow: panel draft, then Etsy draft via the panel button)."},"variantSeal":"077bc2bb1a552040a73cab0968edeb92"}$ww$::jsonb),
  ($ww$R$ww$, $ww$EON-CADNC-R$ww$, $ww$rose$ww$, $ww$Sandblasted Wedding Band, Solid Rose Gold Faceted Step Edge Ring, Polished Cuts, 10K 14K 18K, 3mm to 8mm$ww$,
   $ww$Flat, frosted facets run around this solid gold band like the sides of a polygon, each one finished in a fine sandblasted matte. Where two facets meet, a broad polished cut crosses the full width of the band, either a smooth scooped channel or a small two-step bar, so bright sculpted joints alternate with quiet matte panels. Both edges step down to a narrow polished rail, and the inside is polished smooth with a comfort fit.

YOUR RING
Solid rose gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones. The sandblasted finish is applied by hand, so its fine grain varies slightly from ring to ring while the facet pattern stays the same.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. Avoid harsh chemicals and abrasive cleaners. The sandblasted center softens gradually with wear and can be refreshed by a jeweler; the polished cuts and rails can be re-polished.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design. Every scene was created independently for this metal color, not recolored from another. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$sandblasted band$ww$,$ww$matte wedding band$ww$,$ww$step edge ring$ww$,$ww$faceted gold band$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$comfort fit ring$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$modern gold band$ww$,$ww$rose gold ring$ww$]::text[], ARRAY[$ww$Rose gold$ww$]::text[],
   $ww$[["01-hero.jpg","Rose gold faceted wedding band with sandblasted panels and polished cuts"],["02-worn-linen.jpg","Rose gold faceted band worn on the ring finger, hand resting on linen"],["03-macro.jpg","Close-up of the polished cuts between sandblasted facets on the Rose gold band"],["04-width-ladder.jpg","Three Rose gold faceted bands in narrow, medium and wide widths"],["05-profile.jpg","Rose gold faceted band showing its stepped polished edge rails"],["06-worn-coffee.jpg","Rose gold faceted band worn while holding a coffee cup"],["07-spec-card.jpg","Cadence specification card: 10K 14K 18K, 3 to 8 mm, US 3 to 13"],["08-scale-fingers.jpg","Rose gold faceted band held between two fingers for scale"],["09-interior.jpg","Rose gold faceted band showing the polished comfort-fit interior"],["10-pair.jpg","Pair of Rose gold faceted wedding bands in two widths"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-09-26-eon-cadence-groove-band","sourcePackagePath":"docs/eon/listings/2026-09-26-eon-cadence-groove-band","generatorScript":"scripts/eon/gen_cadence_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"Rose gold","goldSolidity":"Solid gold","pricing":{"laborUsd":110,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 110 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact + live DB seal"},"approval":{"blockers":["Grams are estimated from the Ridge family (same table as Laurel Cross); the physical demo sample was not weighed","Labor tier: USD 110 (Ridge, step + texture) chosen; the ornamental tier USD 130 (Willow) is the owner's alternative for the polished facet cuts","Store discount is 30% live vs 25% assumed by the engine (EK-6) — owner decision pending"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-09-26: \"aynı şekilde listingleri oluştur\" (same flow as Willow: panel draft, then Etsy draft via the panel button)."},"variantSeal":"077bc2bb1a552040a73cab0968edeb92"}$ww$::jsonb);

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images,
  product_type, listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', l.sku, l.title, l.description, l.tags, l.materials, 'draft', 'USD',
  (select min(price_cents) from _ww_cell), 20, true,
  'https://amuletta.artifactstudio.info/eon/cadence/' || l.dir || '/' || (l.images->0->>0), jsonb_array_length(l.images),
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
select p.org_id, p.id, 'https://amuletta.artifactstudio.info/eon/cadence/' || l.dir || '/' || (img.v->>0), 'url', img.v->>1, (img.n - 1)::int
from _ww_listing l
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = l.sku and p.etsy_listing_id is null
cross join lateral jsonb_array_elements(l.images) with ordinality img(v, n)
where not exists (
  select 1 from public.listing_images li
  where li.product_id = p.id and li.url = 'https://amuletta.artifactstudio.info/eon/cadence/' || l.dir || '/' || (img.v->>0)
);

commit;
