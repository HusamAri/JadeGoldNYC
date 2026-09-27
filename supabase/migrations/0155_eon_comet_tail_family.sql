-- 0155_eon_comet_tail_family.sql
-- EON Comet Tail: hafif kubbeli, fırçalanmış satin yüzlü, paralel kama kesimli ve iki
-- kenarı milgrain alyans, renk başına bir listing (EON-CTAIL-Y/W/R), her biri Karat x Width x Ring Size = 378 varyant.
-- Kaynak paket: docs/eon/listings/2026-09-27-eon-comet-tail-band/ (README'de fiyat kanıtı: Laurel Cross 378/378 + canlı DB mührü).
-- Üretici: scripts/eon/gen_comet_tail_migration.mjs — ELLE DÜZENLEMEYİN.
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
--     E'\n' order by sku collate "C")) from product_variants where sku like 'EON-CTAIL-%';
--   beklenen: 064a4f74e1409ee4a141f96127370cb0
begin;

create temporary table _ww_cell(karat text, width_mm int, size text, price_cents int, grams numeric) on commit drop;
insert into _ww_cell values
('10K',3,'3',97000,2.02),
('10K',3,'3.5',98000,2.08),
('10K',3,'4',99000,2.13),
('10K',3,'4.5',99500,2.18),
('10K',3,'5',100500,2.23),
('10K',3,'5.5',101500,2.28),
('10K',3,'6',102500,2.33),
('10K',3,'6.5',103500,2.39),
('10K',3,'7',104500,2.44),
('10K',3,'7.5',105000,2.49),
('10K',3,'8',106000,2.54),
('10K',3,'8.5',107000,2.59),
('10K',3,'9',108000,2.64),
('10K',3,'9.5',109000,2.70),
('10K',3,'10',109500,2.75),
('10K',3,'10.5',110500,2.80),
('10K',3,'11',111500,2.85),
('10K',3,'11.5',112500,2.90),
('10K',3,'12',113000,2.95),
('10K',3,'12.5',114000,3.00),
('10K',3,'13',115000,3.06),
('10K',4,'3',109000,2.71),
('10K',4,'3.5',110000,2.77),
('10K',4,'4',111500,2.84),
('10K',4,'4.5',112500,2.91),
('10K',4,'5',113500,2.98),
('10K',4,'5.5',115000,3.04),
('10K',4,'6',116000,3.11),
('10K',4,'6.5',117500,3.18),
('10K',4,'7',118500,3.26),
('10K',4,'7.5',119500,3.32),
('10K',4,'8',121000,3.39),
('10K',4,'8.5',122000,3.46),
('10K',4,'9',123000,3.52),
('10K',4,'9.5',124500,3.59),
('10K',4,'10',125500,3.66),
('10K',4,'10.5',127000,3.73),
('10K',4,'11',128000,3.80),
('10K',4,'11.5',129500,3.87),
('10K',4,'12',130500,3.94),
('10K',4,'12.5',132000,4.01),
('10K',4,'13',133000,4.07),
('10K',5,'3',120500,3.37),
('10K',5,'3.5',122000,3.46),
('10K',5,'4',123500,3.55),
('10K',5,'4.5',125500,3.64),
('10K',5,'5',126500,3.72),
('10K',5,'5.5',128500,3.81),
('10K',5,'6',129500,3.89),
('10K',5,'6.5',131500,3.98),
('10K',5,'7',132500,4.06),
('10K',5,'7.5',134500,4.15),
('10K',5,'8',135500,4.23),
('10K',5,'8.5',137000,4.32),
('10K',5,'9',139000,4.41),
('10K',5,'9.5',140000,4.49),
('10K',5,'10',142000,4.58),
('10K',5,'10.5',143000,4.66),
('10K',5,'11',145000,4.75),
('10K',5,'11.5',146000,4.83),
('10K',5,'12',148000,4.92),
('10K',5,'12.5',149500,5.01),
('10K',5,'13',150500,5.09),
('10K',6,'3',133000,4.07),
('10K',6,'3.5',134500,4.16),
('10K',6,'4',136000,4.26),
('10K',6,'4.5',138000,4.36),
('10K',6,'5',139500,4.46),
('10K',6,'5.5',141500,4.56),
('10K',6,'6',143500,4.67),
('10K',6,'6.5',145000,4.77),
('10K',6,'7',147000,4.87),
('10K',6,'7.5',149000,4.98),
('10K',6,'8',150500,5.08),
('10K',6,'8.5',152500,5.18),
('10K',6,'9',154000,5.29),
('10K',6,'9.5',156000,5.39),
('10K',6,'10',157500,5.49),
('10K',6,'10.5',159500,5.60),
('10K',6,'11',161500,5.70),
('10K',6,'11.5',163000,5.80),
('10K',6,'12',165000,5.91),
('10K',6,'12.5',167000,6.01),
('10K',6,'13',168500,6.11),
('10K',7,'3',144500,4.73),
('10K',7,'3.5',146500,4.85),
('10K',7,'4',148500,4.97),
('10K',7,'4.5',150500,5.09),
('10K',7,'5',153000,5.21),
('10K',7,'5.5',155000,5.33),
('10K',7,'6',157000,5.45),
('10K',7,'6.5',159000,5.57),
('10K',7,'7',161500,5.69),
('10K',7,'7.5',163500,5.81),
('10K',7,'8',165500,5.93),
('10K',7,'8.5',167500,6.05),
('10K',7,'9',169500,6.17),
('10K',7,'9.5',172000,6.29),
('10K',7,'10',174000,6.41),
('10K',7,'10.5',176000,6.53),
('10K',7,'11',178000,6.65),
('10K',7,'11.5',180000,6.77),
('10K',7,'12',182500,6.89),
('10K',7,'12.5',184500,7.01),
('10K',7,'13',186500,7.13),
('10K',8,'3',167500,5.40),
('10K',8,'3.5',170000,5.54),
('10K',8,'4',173000,5.68),
('10K',8,'4.5',175500,5.81),
('10K',8,'5',178000,5.95),
('10K',8,'5.5',180500,6.09),
('10K',8,'6',183000,6.22),
('10K',8,'6.5',185500,6.36),
('10K',8,'7',188500,6.50),
('10K',8,'7.5',191000,6.64),
('10K',8,'8',193500,6.78),
('10K',8,'8.5',196000,6.91),
('10K',8,'9',198500,7.05),
('10K',8,'9.5',201500,7.19),
('10K',8,'10',204000,7.33),
('10K',8,'10.5',206500,7.46),
('10K',8,'11',209000,7.59),
('10K',8,'11.5',211500,7.73),
('10K',8,'12',214000,7.87),
('10K',8,'12.5',216500,8.01),
('10K',8,'13',219000,8.14),
('14K',3,'3',125000,2.29),
('14K',3,'3.5',126500,2.36),
('14K',3,'4',128000,2.42),
('14K',3,'4.5',129500,2.48),
('14K',3,'5',131000,2.54),
('14K',3,'5.5',132500,2.60),
('14K',3,'6',134000,2.66),
('14K',3,'6.5',135000,2.71),
('14K',3,'7',136500,2.77),
('14K',3,'7.5',138000,2.83),
('14K',3,'8',139500,2.89),
('14K',3,'8.5',141000,2.95),
('14K',3,'9',142500,3.01),
('14K',3,'9.5',144000,3.06),
('14K',3,'10',145500,3.12),
('14K',3,'10.5',147000,3.18),
('14K',3,'11',148000,3.23),
('14K',3,'11.5',149500,3.30),
('14K',3,'12',151000,3.36),
('14K',3,'12.5',152500,3.41),
('14K',3,'13',154000,3.47),
('14K',4,'3',144000,3.07),
('14K',4,'3.5',146000,3.15),
('14K',4,'4',148000,3.23),
('14K',4,'4.5',149500,3.30),
('14K',4,'5',151500,3.38),
('14K',4,'5.5',153500,3.46),
('14K',4,'6',155500,3.54),
('14K',4,'6.5',157500,3.61),
('14K',4,'7',159500,3.69),
('14K',4,'7.5',161500,3.77),
('14K',4,'8',163500,3.85),
('14K',4,'8.5',165000,3.92),
('14K',4,'9',167000,4.00),
('14K',4,'9.5',169000,4.08),
('14K',4,'10',171000,4.16),
('14K',4,'10.5',173000,4.24),
('14K',4,'11',175000,4.32),
('14K',4,'11.5',177000,4.40),
('14K',4,'12',178500,4.48),
('14K',4,'12.5',180500,4.55),
('14K',4,'13',182500,4.63),
('14K',5,'3',163500,3.86),
('14K',5,'3.5',165500,3.95),
('14K',5,'4',168000,4.04),
('14K',5,'4.5',170000,4.12),
('14K',5,'5',172000,4.21),
('14K',5,'5.5',175000,4.32),
('14K',5,'6',177500,4.42),
('14K',5,'6.5',179500,4.52),
('14K',5,'7',182000,4.61),
('14K',5,'7.5',184500,4.71),
('14K',5,'8',187000,4.81),
('14K',5,'8.5',189500,4.91),
('14K',5,'9',192000,5.01),
('14K',5,'9.5',194000,5.11),
('14K',5,'10',196500,5.20),
('14K',5,'10.5',199000,5.30),
('14K',5,'11',201500,5.40),
('14K',5,'11.5',204000,5.50),
('14K',5,'12',206500,5.60),
('14K',5,'12.5',208500,5.69),
('14K',5,'13',210500,5.78),
('14K',6,'3',182000,4.62),
('14K',6,'3.5',185000,4.73),
('14K',6,'4',187500,4.84),
('14K',6,'4.5',190500,4.96),
('14K',6,'5',193500,5.07),
('14K',6,'5.5',196000,5.19),
('14K',6,'6',199000,5.31),
('14K',6,'6.5',202000,5.42),
('14K',6,'7',205000,5.54),
('14K',6,'7.5',208000,5.66),
('14K',6,'8',210500,5.78),
('14K',6,'8.5',213500,5.89),
('14K',6,'9',216500,6.01),
('14K',6,'9.5',219500,6.13),
('14K',6,'10',222000,6.24),
('14K',6,'10.5',225000,6.36),
('14K',6,'11',228000,6.48),
('14K',6,'11.5',230500,6.59),
('14K',6,'12',233500,6.71),
('14K',6,'12.5',236500,6.82),
('14K',6,'13',239000,6.94),
('14K',7,'3',200500,5.37),
('14K',7,'3.5',204000,5.51),
('14K',7,'4',207500,5.64),
('14K',7,'4.5',210500,5.78),
('14K',7,'5',214000,5.92),
('14K',7,'5.5',217500,6.06),
('14K',7,'6',221000,6.19),
('14K',7,'6.5',224000,6.33),
('14K',7,'7',227500,6.46),
('14K',7,'7.5',231000,6.60),
('14K',7,'8',234500,6.74),
('14K',7,'8.5',237500,6.87),
('14K',7,'9',241000,7.01),
('14K',7,'9.5',244500,7.15),
('14K',7,'10',248000,7.29),
('14K',7,'10.5',251000,7.42),
('14K',7,'11',254500,7.56),
('14K',7,'11.5',257500,7.69),
('14K',7,'12',261000,7.82),
('14K',7,'12.5',264500,7.96),
('14K',7,'13',268000,8.10),
('14K',8,'3',235500,6.14),
('14K',8,'3.5',240000,6.30),
('14K',8,'4',244000,6.45),
('14K',8,'4.5',248000,6.61),
('14K',8,'5',252000,6.76),
('14K',8,'5.5',256000,6.92),
('14K',8,'6',260000,7.07),
('14K',8,'6.5',264500,7.23),
('14K',8,'7',268500,7.39),
('14K',8,'7.5',273000,7.55),
('14K',8,'8',277000,7.70),
('14K',8,'8.5',281000,7.86),
('14K',8,'9',285000,8.01),
('14K',8,'9.5',289000,8.17),
('14K',8,'10',293000,8.32),
('14K',8,'10.5',297500,8.48),
('14K',8,'11',301500,8.63),
('14K',8,'11.5',305500,8.79),
('14K',8,'12',309500,8.94),
('14K',8,'12.5',313500,9.10),
('14K',8,'13',317500,9.25),
('18K',3,'3',158500,2.64),
('18K',3,'3.5',161000,2.71),
('18K',3,'4',163000,2.77),
('18K',3,'4.5',165000,2.84),
('18K',3,'5',167000,2.90),
('18K',3,'5.5',169000,2.96),
('18K',3,'6',171000,3.03),
('18K',3,'6.5',173000,3.09),
('18K',3,'7',175000,3.16),
('18K',3,'7.5',177000,3.22),
('18K',3,'8',179000,3.28),
('18K',3,'8.5',181000,3.35),
('18K',3,'9',183000,3.41),
('18K',3,'9.5',185000,3.48),
('18K',3,'10',187000,3.54),
('18K',3,'10.5',189000,3.60),
('18K',3,'11',191000,3.67),
('18K',3,'11.5',193000,3.73),
('18K',3,'12',195500,3.80),
('18K',3,'12.5',197000,3.86),
('18K',3,'13',199000,3.92),
('18K',4,'3',189500,3.61),
('18K',4,'3.5',191500,3.68),
('18K',4,'4',194000,3.76),
('18K',4,'4.5',196500,3.83),
('18K',4,'5',199000,3.91),
('18K',4,'5.5',201000,3.98),
('18K',4,'6',203500,4.06),
('18K',4,'6.5',206000,4.14),
('18K',4,'7',208500,4.22),
('18K',4,'7.5',211000,4.30),
('18K',4,'8',213500,4.38),
('18K',4,'8.5',216000,4.45),
('18K',4,'9',218500,4.53),
('18K',4,'9.5',221000,4.61),
('18K',4,'10',223000,4.68),
('18K',4,'10.5',225500,4.76),
('18K',4,'11',228000,4.84),
('18K',4,'11.5',230500,4.92),
('18K',4,'12',233000,5.00),
('18K',4,'12.5',235500,5.07),
('18K',4,'13',238000,5.15),
('18K',5,'3',220000,4.58),
('18K',5,'3.5',223000,4.68),
('18K',5,'4',226000,4.78),
('18K',5,'4.5',229000,4.87),
('18K',5,'5',232000,4.97),
('18K',5,'5.5',235500,5.07),
('18K',5,'6',238000,5.16),
('18K',5,'6.5',241500,5.26),
('18K',5,'7',244500,5.36),
('18K',5,'7.5',247500,5.45),
('18K',5,'8',250500,5.55),
('18K',5,'8.5',253500,5.65),
('18K',5,'9',257000,5.76),
('18K',5,'9.5',260000,5.85),
('18K',5,'10',263000,5.94),
('18K',5,'10.5',266000,6.04),
('18K',5,'11',269000,6.14),
('18K',5,'11.5',272000,6.24),
('18K',5,'12',275000,6.33),
('18K',5,'12.5',278000,6.43),
('18K',5,'13',281500,6.53),
('18K',6,'3',246500,5.43),
('18K',6,'3.5',250500,5.55),
('18K',6,'4',254000,5.66),
('18K',6,'4.5',257500,5.78),
('18K',6,'5',261500,5.90),
('18K',6,'5.5',265500,6.02),
('18K',6,'6',269000,6.14),
('18K',6,'6.5',272500,6.25),
('18K',6,'7',276500,6.37),
('18K',6,'7.5',280000,6.49),
('18K',6,'8',284000,6.61),
('18K',6,'8.5',287500,6.72),
('18K',6,'9',291000,6.84),
('18K',6,'9.5',294500,6.95),
('18K',6,'10',298500,7.07),
('18K',6,'10.5',302000,7.19),
('18K',6,'11',305500,7.30),
('18K',6,'11.5',309500,7.42),
('18K',6,'12',313000,7.54),
('18K',6,'12.5',317000,7.66),
('18K',6,'13',321000,7.78),
('18K',7,'3',262500,5.93),
('18K',7,'3.5',267000,6.07),
('18K',7,'4',271500,6.21),
('18K',7,'4.5',275500,6.35),
('18K',7,'5',280000,6.49),
('18K',7,'5.5',284500,6.63),
('18K',7,'6',289500,6.78),
('18K',7,'6.5',293500,6.92),
('18K',7,'7',298500,7.07),
('18K',7,'7.5',303000,7.21),
('18K',7,'8',307000,7.35),
('18K',7,'8.5',311500,7.49),
('18K',7,'9',316500,7.64),
('18K',7,'9.5',321000,7.78),
('18K',7,'10',325000,7.92),
('18K',7,'10.5',330000,8.07),
('18K',7,'11',334500,8.21),
('18K',7,'11.5',339000,8.35),
('18K',7,'12',343000,8.49),
('18K',7,'12.5',347500,8.63),
('18K',7,'13',352000,8.77),
('18K',8,'3',301500,6.52),
('18K',8,'3.5',307500,6.69),
('18K',8,'4',313000,6.85),
('18K',8,'4.5',318500,7.02),
('18K',8,'5',324500,7.19),
('18K',8,'5.5',329500,7.34),
('18K',8,'6',335000,7.50),
('18K',8,'6.5',340000,7.65),
('18K',8,'7',344500,7.79),
('18K',8,'7.5',350000,7.95),
('18K',8,'8',355500,8.11),
('18K',8,'8.5',360500,8.26),
('18K',8,'9',365500,8.41),
('18K',8,'9.5',370500,8.56),
('18K',8,'10',376000,8.72),
('18K',8,'10.5',381500,8.88),
('18K',8,'11',386500,9.03),
('18K',8,'11.5',392000,9.19),
('18K',8,'12',397500,9.35),
('18K',8,'12.5',402500,9.50),
('18K',8,'13',407500,9.65);

create temporary table _ww_listing(code text, sku text, dir text, title text, description text, tags text[], materials text[], images jsonb, meta jsonb) on commit drop;
insert into _ww_listing values
  ($ww$Y$ww$, $ww$EON-CTAIL-Y$ww$, $ww$yellow$ww$, $ww$Milgrain Wedding Band, Solid Yellow Gold Satin Diagonal Cut Ring, 10K 14K 18K, 3mm to 8mm$ww$,
   $ww$Long, bright cuts sweep diagonally across a softly brushed band, all leaning the same way. Each cut starts as a fine point at one edge and widens toward the other, like the tail of a comet. A row of fine milgrain beads frames the pattern on both sides, finished by a thin polished rail. The profile is gently domed on the outside and polished smooth on the inside for a comfortable fit.

YOUR RING
Solid yellow gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: "diamond cut" is the jeweler's name for the faceting technique, not a stone. The cuts and the milgrain are finished by hand, so their spacing varies slightly from ring to ring while the diagonal pattern stays the same.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width. On narrow widths the cuts sit closer together and read finer.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. A soft brush clears the milgrain beads. Avoid harsh chemicals and abrasive cleaners. The satin finish softens with wear over time and can be refreshed by a jeweler; the polished cuts keep their shine.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design. Every scene was created independently for this metal color, not recolored from another. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$milgrain band$ww$,$ww$diagonal cut band$ww$,$ww$diamond cut band$ww$,$ww$satin wedding band$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$vintage wedding band$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$comfort fit ring$ww$,$ww$yellow gold ring$ww$]::text[], ARRAY[$ww$Yellow gold$ww$]::text[],
   $ww$[["01-hero.jpg","Yellow gold satin wedding band with diagonal polished cuts and milgrain edges, standing on clear glass"],["02-worn-linen.jpg","Yellow gold diagonal-cut milgrain band worn on the ring finger, hand resting on linen"],["03-macro.jpg","Close-up of the brushed satin face, tapered polished cuts and milgrain on the Yellow gold band"],["04-width-ladder.jpg","Three Yellow gold diagonal-cut milgrain bands in narrow, medium and wide widths"],["05-profile.jpg","Yellow gold band lying on cast glass, showing its domed profile and milgrain edge"],["06-worn-glass.jpg","Yellow gold diagonal-cut milgrain band worn while holding a glass of water"],["07-spec-card.jpg","Comet Tail specification card: 10K 14K 18K, 3 to 8 mm, US 3 to 13"],["08-scale-fingers.jpg","Yellow gold diagonal-cut milgrain band held between two fingers for scale"],["09-interior.jpg","Yellow gold band seen from above, showing the polished comfort-fit interior"],["10-pair.jpg","Pair of Yellow gold diagonal-cut milgrain wedding bands in two widths"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-09-27-eon-comet-tail-band","sourcePackagePath":"docs/eon/listings/2026-09-27-eon-comet-tail-band","generatorScript":"scripts/eon/gen_comet_tail_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"Yellow gold","goldSolidity":"Solid gold","pricing":{"laborUsd":130,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 130 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact"},"approval":{"blockers":["Grams are estimated from the Laurel Cross family; physical sample (demo brass) was not weighed. Domed profile and two milgrain rails may weigh slightly more than a flat band","Labor tier (USD 130, ornamental) is the owner's call","Store discount is 30% live vs 25% assumed by the engine (EK-6) — owner decision pending"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-09-27: \"yeni model\" (same conditions as Comet: panel draft, then Etsy draft via the panel button)."},"variantSeal":"064a4f74e1409ee4a141f96127370cb0"}$ww$::jsonb),
  ($ww$W$ww$, $ww$EON-CTAIL-W$ww$, $ww$white$ww$, $ww$Milgrain Wedding Band, Solid White Gold Satin Diagonal Cut Ring, 10K 14K 18K, 3mm to 8mm$ww$,
   $ww$Long, bright cuts sweep diagonally across a softly brushed band, all leaning the same way. Each cut starts as a fine point at one edge and widens toward the other, like the tail of a comet. A row of fine milgrain beads frames the pattern on both sides, finished by a thin polished rail. The profile is gently domed on the outside and polished smooth on the inside for a comfortable fit.

YOUR RING
Solid white gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: "diamond cut" is the jeweler's name for the faceting technique, not a stone. The cuts and the milgrain are finished by hand, so their spacing varies slightly from ring to ring while the diagonal pattern stays the same.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width. On narrow widths the cuts sit closer together and read finer.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. A soft brush clears the milgrain beads. Avoid harsh chemicals and abrasive cleaners. The satin finish softens with wear over time and can be refreshed by a jeweler; the polished cuts keep their shine.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design. Every scene was created independently for this metal color, not recolored from another. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$milgrain band$ww$,$ww$diagonal cut band$ww$,$ww$diamond cut band$ww$,$ww$satin wedding band$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$vintage wedding band$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$comfort fit ring$ww$,$ww$white gold ring$ww$]::text[], ARRAY[$ww$White gold$ww$]::text[],
   $ww$[["01-hero.jpg","White gold satin wedding band with diagonal polished cuts and milgrain edges, standing on clear glass"],["02-worn-linen.jpg","White gold diagonal-cut milgrain band worn on the ring finger, hand resting on linen"],["03-macro.jpg","Close-up of the brushed satin face, tapered polished cuts and milgrain on the White gold band"],["04-width-ladder.jpg","Three White gold diagonal-cut milgrain bands in narrow, medium and wide widths"],["05-profile.jpg","White gold band lying on cast glass, showing its domed profile and milgrain edge"],["06-worn-glass.jpg","White gold diagonal-cut milgrain band worn while holding a glass of water"],["07-spec-card.jpg","Comet Tail specification card: 10K 14K 18K, 3 to 8 mm, US 3 to 13"],["08-scale-fingers.jpg","White gold diagonal-cut milgrain band held between two fingers for scale"],["09-interior.jpg","White gold band seen from above, showing the polished comfort-fit interior"],["10-pair.jpg","Pair of White gold diagonal-cut milgrain wedding bands in two widths"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-09-27-eon-comet-tail-band","sourcePackagePath":"docs/eon/listings/2026-09-27-eon-comet-tail-band","generatorScript":"scripts/eon/gen_comet_tail_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"White gold","goldSolidity":"Solid gold","pricing":{"laborUsd":130,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 130 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact"},"approval":{"blockers":["Grams are estimated from the Laurel Cross family; physical sample (demo brass) was not weighed. Domed profile and two milgrain rails may weigh slightly more than a flat band","Labor tier (USD 130, ornamental) is the owner's call","Store discount is 30% live vs 25% assumed by the engine (EK-6) — owner decision pending"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-09-27: \"yeni model\" (same conditions as Comet: panel draft, then Etsy draft via the panel button)."},"variantSeal":"064a4f74e1409ee4a141f96127370cb0"}$ww$::jsonb),
  ($ww$R$ww$, $ww$EON-CTAIL-R$ww$, $ww$rose$ww$, $ww$Milgrain Wedding Band, Solid Rose Gold Satin Diagonal Cut Ring, 10K 14K 18K, 3mm to 8mm$ww$,
   $ww$Long, bright cuts sweep diagonally across a softly brushed band, all leaning the same way. Each cut starts as a fine point at one edge and widens toward the other, like the tail of a comet. A row of fine milgrain beads frames the pattern on both sides, finished by a thin polished rail. The profile is gently domed on the outside and polished smooth on the inside for a comfortable fit.

YOUR RING
Solid rose gold, available in 10K, 14K or 18K. No plating and no filled metal. The price is for one ring in your selected karat, width and size, not a set. No gemstones: "diamond cut" is the jeweler's name for the faceting technique, not a stone. The cuts and the milgrain are finished by hand, so their spacing varies slightly from ring to ring while the diagonal pattern stays the same.

CHOOSE YOUR FIT
Width: 3, 4, 5, 6, 7 or 8 mm.
Ring size: US 3 to US 13, including half sizes.
Choose Karat, Width and Ring Size from the three variation menus. Wider bands can feel more snug than narrow bands, so confirm your size at your preferred width. On narrow widths the cuts sit closer together and read finer.

OPTIONAL INSIDE ENGRAVING
Enter the exact text in "Inside band engraving", up to 30 characters, and choose an Engraving Font: 1 Prata, 2 Cinzel, 3 Cinzel Decorative or 4 Great Vibes. Leave the text blank for no engraving. These fields do not change the inventory variations.

MADE FOR YOU
Made to order from raw precious-metal materials using hand-guided tools. Allow 4 to 5 business days for preparation before dispatch. Transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft cloth. A soft brush clears the milgrain beads. Avoid harsh chemicals and abrasive cleaners. The satin finish softens with wear over time and can be refreshed by a jeweler; the polished cuts keep their shine.

ABOUT THE IMAGES
The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design. Every scene was created independently for this metal color, not recolored from another. Metal color and reflections vary with lighting and screens. Props are not included.$ww$,
   ARRAY[$ww$milgrain band$ww$,$ww$diagonal cut band$ww$,$ww$diamond cut band$ww$,$ww$satin wedding band$ww$,$ww$solid gold band$ww$,$ww$10k wedding band$ww$,$ww$14k wedding band$ww$,$ww$18k wedding band$ww$,$ww$vintage wedding band$ww$,$ww$mens wedding band$ww$,$ww$womens gold band$ww$,$ww$comfort fit ring$ww$,$ww$rose gold ring$ww$]::text[], ARRAY[$ww$Rose gold$ww$]::text[],
   $ww$[["01-hero.jpg","Rose gold satin wedding band with diagonal polished cuts and milgrain edges, standing on clear glass"],["02-worn-linen.jpg","Rose gold diagonal-cut milgrain band worn on the ring finger, hand resting on linen"],["03-macro.jpg","Close-up of the brushed satin face, tapered polished cuts and milgrain on the Rose gold band"],["04-width-ladder.jpg","Three Rose gold diagonal-cut milgrain bands in narrow, medium and wide widths"],["05-profile.jpg","Rose gold band lying on cast glass, showing its domed profile and milgrain edge"],["06-worn-glass.jpg","Rose gold diagonal-cut milgrain band worn while holding a glass of water"],["07-spec-card.jpg","Comet Tail specification card: 10K 14K 18K, 3 to 8 mm, US 3 to 13"],["08-scale-fingers.jpg","Rose gold diagonal-cut milgrain band held between two fingers for scale"],["09-interior.jpg","Rose gold band seen from above, showing the polished comfort-fit interior"],["10-pair.jpg","Pair of Rose gold diagonal-cut milgrain wedding bands in two widths"]]$ww$::jsonb,
   $ww${"productType":"ring","listingProtocol":"wedding_band","protocolVersion":"etsy-listing-v1","section":"Wedding Bands","sourcePackage":"2026-09-27-eon-comet-tail-band","sourcePackagePath":"docs/eon/listings/2026-09-27-eon-comet-tail-band","generatorScript":"scripts/eon/gen_comet_tail_migration.mjs","variationAxes":["Karat","Width","Ring Size"],"metalColor":"Rose gold","goldSolidity":"Solid gold","pricing":{"laborUsd":130,"goldSpotUsdPerOzt":4429.1,"goldQuoteTimestamp":"2026-09-06T13:21:00-04:00","storePromotionRate":0.25,"methodology":"(Estimated grams + 1 g casting loss) x Kitco bid per gram x karat fineness x 1.08, plus USD 130 labor, USD 8 packing and USD 22 shipping allowance. Multiply by 2.05 (2.2 at 8 mm), divide by 0.75 for the store promotion and round list price upward to USD 5.","regression":"378/378 cent-exact"},"approval":{"blockers":["Grams are estimated from the Laurel Cross family; physical sample (demo brass) was not weighed. Domed profile and two milgrain rails may weigh slightly more than a flat band","Labor tier (USD 130, ornamental) is the owner's call","Store discount is 30% live vs 25% assumed by the engine (EK-6) — owner decision pending"],"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"authority":"Owner instruction 2026-09-27: \"yeni model\" (same conditions as Comet: panel draft, then Etsy draft via the panel button)."},"variantSeal":"064a4f74e1409ee4a141f96127370cb0"}$ww$::jsonb);

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images,
  product_type, listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', l.sku, l.title, l.description, l.tags, l.materials, 'draft', 'USD',
  (select min(price_cents) from _ww_cell), 20, true,
  'https://amuletta.artifactstudio.info/eon/comet-tail/' || l.dir || '/' || (l.images->0->>0), jsonb_array_length(l.images),
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
select p.org_id, p.id, 'https://amuletta.artifactstudio.info/eon/comet-tail/' || l.dir || '/' || (img.v->>0), 'url', img.v->>1, (img.n - 1)::int
from _ww_listing l
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = l.sku and p.etsy_listing_id is null
cross join lateral jsonb_array_elements(l.images) with ordinality img(v, n)
where not exists (
  select 1 from public.listing_images li
  where li.product_id = p.id and li.url = 'https://amuletta.artifactstudio.info/eon/comet-tail/' || l.dir || '/' || (img.v->>0)
);

commit;
