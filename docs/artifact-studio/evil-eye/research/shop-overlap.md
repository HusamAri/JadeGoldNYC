# Evil eye collection: shop overlap and production constraints (read-only research, 2026-10-09)

Scope: by Artifact Studio Jewelry (org 2c254edf-...), Supabase sewbrqflcrlgczilrusw, read-only SQL plus repo reads. Nothing was written to the repo or the database.

## 1. What already exists (SQL)

Search: `products.title`, `tags` or `description` matching `\m(evil|nazar|mati|hamsa|protection|protective|talisman|amulet|eye|eyes)\M`, all orgs, all statuses. 57 rows. 34 of them are description-only false positives ("eye-catching" in Jade/Ophir copy, "gold eye" on the fish/frog anklets, "side eyes" on the infinity bracelets, "talisman" on the scarab anklet, "ward off evil" on Jade's cornicello horns, "protection" on Jade's crucifixes). No hit for "mati". Seselka Home: 0 rows. Ophir Gold USA: only "eye-catching" false positives, no evil-eye product. The relevant rows:

### 1a. by Artifact Studio Jewelry (own shop): 4 evil-eye/hamsa items, all live

| Etsy id | Status | Item | Form, size, colour | Variants, price |
|---|---|---|---|---|
| 4579034421 | active | 14K Gold Evil Eye Bracelet, Blue Stone | open-outline almond eye 11.8 x 5.8 mm (open centre 7.6 x 3.3), small round dark blue stone flush in a low bezel, chain joined at both tips; 14K yellow only; lobster clasp | 3 (Chain Length 6.5/7/7.5 in) $459-504; 35 views, 2 favs |
| 4575369430 | active | 14K Gold Evil Eye Bracelet, Red Stone | polished solid eye 9 x 4.2 x 1.8 mm, red stone off-centre in a low bezel; 14K yellow only; lobster | 3 (Length) $449; 3 views |
| 4586567180 | active | A21 Evil Eye Anklet (ss27) | round 8 mm enamel nazar: Luminous Blue outer ring, white centre, solid gold pupil; 1.0 mm cable, 9/10/11 in | 27 (Karat x Metal Color x Anklet Length) $670-930 |
| 4586567140 | active | A22 Hamsa Anklet (ss27) | 9 mm Luminous Blue enamel hamsa with a white enamel eye in the palm | 27, $680-940 |

The two stone bracelets are legacy listings off the 3-axis grid (one axis, yellow 14K only). The ss27 doc already argued the overlap: "The shop already has two evil-eye bracelets with stones; an enamel evil-eye anklet is a different product and category, so it stays" (docs/artifact-studio/ss27-anklets/01-design-direction.md:101-103).

Look-alikes in the own shop that a round blue/white nazar would collide with: A34 Lifebuoy anklet (8 mm blue/white quartered ring with open centre, Etsy draft 4586563387), A03 blue Water Drop, A24 Shooting Star (blue tail), A23 Horseshoe (luck), 2027 set cobalt/blue pieces (Arch Pendant "Cobalt Enamel Detail" 4583755281, "Blue Enamel Bar" bracelet 4583755575, "Cobalt Blue Rectangle" studs 4583755885, "Blue Enamel Square Face" signet 4583754889), FW Button (round 9-12 mm disc with four holes), FW Cherry Scatter (3.5 mm dots). The shop has NO two-tone listing (title regex `two.tone` on the org returned nothing).

### 1b. Sister shops

Jade Gold NYC, live on Etsy (all yellow gold, stones/CZ or coloured eye inserts, no enamel, no karat/colour grid):

| Etsy id | Item | Form, size, colour | Price, traffic |
|---|---|---|---|
| 1203090834 | 14K Evil Eye Pendant, Dark Blue | puffed round charm 15 mm, 0.37 g; Navy / Ocean Blue / Red / Turquoise | $98; 80,063 views, 3,587 favs (sister shop's hero) |
| 1216728323 | 14K Evil Eye Pendant, Ocean Blue | 3D puffed round 16 mm, 0.83 g | $224; 10,575 views, 509 favs |
| 1228150776 | 14K Puffed Evil Eye Pendant, Ocean Blue | puffed round 17 mm, 1.11 g; Blue / Red | $308; 10,741 views, 448 favs |
| 1228152002 | 14K Puffed Evil Eye Pendant, Diamond Cut | puffed diamond-cut 16.5 mm, 0.96 g; Blue / Red | $307; 832 views |
| 1525338848 | 14K Evil Eye Bracelet | round puffed charm on chain, 1.38 g, 7 3/4 in, spring ring; Black / Multi / Navy / Ocean Blue / Red / White | $383; 7,312 views, 277 favs |
| 1228157956 | 14K Diamond Cut Hamsa Pendant with evil eye | puffed hamsa 19 mm, 0.77 g; Blue / Navy / Red eye | $221; 6,035 views, 301 favs |
| 1731430357, 1717808152 | 10K Hamsa CZ "Evil Eye" pendant, rope chain | hamsa 26/32/38/43 mm, rope chain 2.5/3/3.5 mm x 16-24 in | $510-3,265; ~1,000 views each |
| 1480904845 | 14K CZ huggie hoops with charms | 15 mm huggie; Style includes "Evil Eye" and "Evil Eye Eyelash" | $722; 108 favs |
| 1206377232 | 14K CZ Hamsa Evil Eye dangle earrings | 12 mm hoop, 11 mm evil eye, 2.44 g | $661 |

Jade Gold NYC, unpublished panel drafts (etsy_listing_id null), "Fall 2026" eye-geometry concepts: Iris Disc Necklace (10 mm concentric engraved disc, 1 mm open centre; 14K/18K x Y/W/R x 1.0/1.2 mm chain), Three Watchers Bracelet (two 5 mm open-ring stations + one eyelash-arc station), Two Tone Iris Signet Ring (14 x 9 mm oval, concentric engraving, fixed yellow body with white-gold centre inlay, "select ring size only"), Aperture Eye Link Curb bracelet (14K and 18K, yellow curb chain with a white-gold marquise centre link, 6.5-8 in). The 18K Iris Disc / Three Watchers / Iris Signet copies are archived.

EON, unpublished draft: "14K Gold Blue Enamel Lookback Ring, Minimalist Evil Eye Protection Ring": 2.1 mm comfort-fit band rising into an asymmetric 8.0 x 4.2 mm eye aperture, 0.35 mm deep cobalt vitreous enamel field, 0.4 mm same-gold border, 1.2 mm gold pupil boss, ~1.96 g at US 7; 14K only, Gold Color Y/W/R x US 3-13 (63 variants), $910-1,090.

### 1c. What the new collection must not repeat

- Round puffed solid-gold evil eye charm with coloured centre, any of navy/ocean/red/turquoise (Jade's hero 1203090834 and four siblings), including on a chain bracelet (1525338848).
- Puffed hamsa with an eye; CZ hamsa on rope chain; huggies with evil-eye charms; hamsa CZ dangles (Jade).
- Almond eye aperture on a slim band with cobalt enamel and a gold pupil boss (EON Lookback). This is the "obvious" enamel evil-eye ring; ours has to depart from it in shape, colour or construction.
- Concentric engraved eye disc, eyelash-arc station, white-gold marquise link in a yellow curb chain, two-tone oval signet with a white inlay (Jade drafts; two of them are already two-tone, so "two-tone eye" alone is not a differentiator against Jade's plans).
- Own shop: 8 mm round Luminous Blue ring / white centre / gold pupil (A21) and blue hamsa with white eye (A22); open-outline almond with bezel stone (4579034421); small polished eye with off-centre stone (4575369430). A third Luminous Blue + white nazar would read as a re-colour of A21.
- Untaken ground: two-tone gold (no product in this shop), non-blue/white nazar palettes inside the 2-colour rule, solid-gold sculpted eyes with an enamel pupil only, eye as a structural element of the piece (clasp, link, ring opening) rather than a charm.

## 2. Production rules this workflow uses

| Rule | Value | Evidence |
|---|---|---|
| Technique | champlevé: kiln-fired vitreous enamel in cells recessed ~0.4 mm into solid gold, flush, flat, glossy; no domed/cabochon | fw2627-enamel/01-design-direction.md:67-69, 80-85; xmas26/catalog.py:401-408 |
| Enamel cell width | at least 1.5 mm | xmas26/01-design-direction.md:48; fw2627 doc:70; ss27 doc:116-118 |
| Gold walls between cells | at least 0.4 mm | same lines |
| Enamel colours | at most 2 per piece; smallest (6 mm) pieces 1 colour | xmas26 doc:48-49; ss27 doc:117-119; asserted in xmas26/catalog.py:449 |
| Rims | every cell framed by a polished gold rim | xmas26 doc:49; fw2627 doc:68 |
| Solid-gold pieces | sculpted, closed back, no hollow | xmas26 doc:50; ss27 doc:120-121; second-brain.md:1837 (hollow back drawn by the image model = misrepresentation) |
| Wear surfaces | no enamel on shank, clasp, earring post; no gradients, no painted detail; pips/stems/caps are metal | fw2627 doc:71-73. Exception already made: xmas R02 full enamel stripe band, quoted by the maker as 4 mm band + 100 USD (maker_cost.py:9) |
| Enamel colour | fixed per model, never a variation | fw2627 doc:76-77 |
| Alloy qualification | "Physical sample and alloy/enamel firing qualification" is blocker #1 on all 20 artifact-2027 listings | SQL on listing_metadata.approval.blockers |
| Ring sizes | US 3 to 16 whole and half = 27 | xmas26/catalog.py:27; doc:51 |
| Necklace chain | 1.2 mm solid gold cable, spring ring, 16/18/20 in | xmas26/catalog.py:28, 384; doc:51-52 |
| Bracelet chain | 1.1 mm solid gold cable, spring ring, 6.5/7/7.5 in | xmas26/catalog.py:29, 385. (Men's set: 7.5/8/8.5 in, him26/catalog.py:29; anklets 1.0 mm, 9/10/11 in) |
| Clasp | spring ring (FW allows spring ring or lobster); the two legacy stone bracelets use lobster | fw2627 doc:74; DB descriptions |
| Grid | Karat (10K/14K/18K) x Metal Color (Yellow/White/Rose Gold) x size, nothing skipped; structural exception only on the owner's explicit word | CLAUDE.md:64-70 |
| Variant counts | ring 3 x 3 x 27 = 243; necklace 27; bracelet 27; 10+10+10 set = 2,970 variants | xmas26/catalog.py:483; xmas26/gen_migration.py assert NV == 2970 |
| Etsy cap | 3 varying properties, at most 400 products; checked before any Etsy write | lib/etsy/create-listing.ts:48-52, 67-71; lib/etsy/inventory-rebuild.ts:14-15 |
| SKU | `PREFIX + id + -{karat}{Y/W/R}-{size}`, at most 32 chars, unique | xmas26/catalog.py:475-477 |
| Listing protocols | ring `sculptural_ring`, necklace `pendant_necklace`, bracelet `chain_bracelet`; no personalization | xmas26/catalog.py:387; lib/etsy/listing-protocol.ts:174-214 |

### 2a. What the rules mean for an evil eye (my arithmetic, not a maker figure)

- A classic nazar is 3 to 4 colours (dark blue, white, light blue, black). The 2-colour rule forces a reduction; the shop precedent is blue + white + a solid gold pupil (A21).
- Concentric 2-colour nazar (outer blue annulus, gold wall, white annulus, gold pupil Ø 1.2 mm, outer rim 0.4 mm): minimum diameter = 2 x (0.4 + 1.5 + 0.4 + 1.5 + 0.6) = 8.8 mm, so about 9 mm. A21 at 8 mm leaves the white zone at about 1.2 mm around a 1.0 mm pupil, which is under the 1.5 mm rule; the ss27 doc accepted it (01-design-direction.md:107-110), but new pieces should not use 8 mm as the precedent.
- One enamel colour + gold pupil: minimum Ø = 2 x (0.4 + 1.5 + 0.6) = 5.0 mm. This is the only nazar that fits ring stations, small bracelet stations or a 6 mm charm.
- Almond (vesica) eye: the tips taper below 1.5 mm, so the enamel stops where the width falls under 1.5 mm plus walls and the tips are gold. EON's Lookback field (8.0 x 4.2 mm, 0.35 mm deep, 0.4 mm border, 1.2 mm boss) is a working data point for this shape.
- Two-tone does not use enamel colours: metal colour and enamel colour are counted separately, so "two-colour gold + two enamel colours" is within the rules but busy at 6-10 mm.

### 2b. Two-tone: what the repo has done

| Where | How two-tone was expressed | Evidence |
|---|---|---|
| EON TTG (live, 3 listings by karat) | metal is a fixed property "Two Tone Yellow and White Gold"; axes Width x Ring Size | scripts/gen_catalog_ttg.py:57 |
| EON Meridian (panel draft) | single metal combination, NO colour axis: `fixedTwoToneAxes: ["Width","Ring Size"]`, Karat as 3rd axis, 4 x 21 x 3 = 252 | docs/eon/listings/2026-09-11-eon-meridian-two-tone-band/README.md:10-33 |
| Jade EON-top10 model 09 (panel drafts) | colour axis kept as BODY colour; accent fixed per body: Yellow -> White accent, White -> Yellow accent, Rose -> White accent; title "Yellow Gold and White Gold" | scripts/jade-eon-top10/catalog.py:81, 105-106, 135-136 |
| Jade Iris Signet / Aperture Link drafts | fixed two-tone construction, no colour axis ("Select ring size only") | DB descriptions |
| EON maker rule (owner 2026-09-29) | two-tone rings only 4-8 mm wide, 1.6 mm thick, $250 labour (vs $55 Meridian standard, $74 Tamsan "decorated" incl. two-tone) | CLAUDE.md:71-81; lib/pricing/gold-index.ts:44-46; lib/gold-cost.ts:34-41 |

The EON rule belongs to EON's maker. The Artifact maker's list is colour-blind ("üretici gram ve maliyeti yalnız ayara göre veriyor, renge göre değil", docs/ophir/README.md:486-488), so there is no two-tone price or limit for this maker in the repo. The EON limits show the work has real constraints; ask this maker for them.

Image-pipeline lessons about two metals: the generator merged a yellow and a rose bracelet into one two-tone chain (fw2627-enamel/gallery.json:193); split the Meridian tones as an arc instead of lengthwise (second-brain.md:1805); a yellow reference turned a white piece's beads yellow (second-brain.md:1880). Frame 09 of every set ("three-metal colour visualization", xmas26/catalog.py:398-399) has to become a three-pair image for two-tone pieces.

### 2c. Metal Color for two-tone pieces within the 3-axis grid and 400 products

Binding constraint is the ring: 3 karats x C colour values x 27 sizes <= 400, so C <= 4 (C=3: 243, C=4: 324, C=5: 405, C=6: 486). Chain pieces allow up to 44 values (3 x C x 3).

| Option | Metal Color values | Ring / chain products | Rule status |
|---|---|---|---|
| A. Three two-tone pairs | "Yellow and White Gold", "Rose and White Gold", "Yellow and Rose Gold" (body named first) | 243 / 27 | 3 axes, 3 values, full grid; the values differ from CLAUDE.md's Yellow/White/Rose list, so owner sign-off |
| B. Body colour + fixed accent (Jade precedent) | "Yellow Gold" (white accent), "White Gold" (yellow accent), "Rose Gold" (white or yellow accent), accent stated in copy | 243 / 27 | values identical to CLAUDE.md; only the copy and images change; buyer-facing value under-describes the piece |
| C. 3 solid + 1 two-tone | Yellow, White, Rose, "Yellow and White Gold" | 324 / 36 | under 400, no combination skipped, but 4 values: structural exception, owner sign-off |
| D. All 6 ordered pairs | Y/W, W/Y, Y/R, R/Y, W/R, R/W | 486 / 54 | rings impossible (over 400); chain pieces fine |
| E. No colour axis (EON Meridian) | fixed pair | 81 / 9 | breaks the Artifact 3-axis rule; owner sign-off |

Tooling fit: create-listing maps the three varying axes to custom slots 516/513/514 and stops over 400 (lib/etsy/create-listing.ts:48-52, 67-71), and inventory-rebuild only checks that the grid is a complete Cartesian product (lib/etsy/inventory-rebuild.ts:93-94, 124-128); neither hard-codes colour names, so A, B and C pass. SKU codes stay under 32 chars with 2-letter pairs (e.g. `BAS-EE-R10-18KYW-US10_5` = 23 chars).

Risks: (1) do not use "&" in values. Etsy returns property values HTML-encoded (Jade's live Length values are stored as `2.5mm 16&quot;` in product_variants.properties), so "Yellow & White" would most likely come back as `&amp;` and stop matching panel values. Use "and" (inference, not tested). (2) The panel colour facet reads the title: any title with "two tone" becomes facet `two_tone` (lib/listing-facets.ts:62-70). (3) The EON pricing engine maps "two tone" titles to its twotone/$250 profile (lib/pricing-engine/run.ts:69-79). It is org-parameterised and has never been run on this org; keep it that way.

## 3. Pricing inputs

Current rule (owner 2026-10-07): price = ceil(2 x maker cost / 10) x 10 (docs/artifact-studio/maker_cost.py:1, 28, 53-54).

- Gold: 14K = 100.00 USD/g, labour included (maker band list, docs/ophir/uretici-gram-fiyat-tablosu.xlsx). At spot 4,178.20 USD/ozt the labour part is 21.42 USD/g, karat-independent (additive model). 10K/18K: grams x density (0.892 / 1.137) x (spot x purity + 21.42) -> cost per 14K-gram 69.07 / 100.00 / 138.90 (18K/14K = 1.389, maker's own table says 1.400) (maker_cost.py:16-27, 43-50, 57-58).
- Rings: "price it as a 3 mm band from the list", enamel motif rings included (poinsettia, bell, snowflake): 14K US 7 = 3.59 g -> cost 358.95 -> price 720; range 420 (10K US 3) to 1,390 (18K US 16). Full enamel band: 4 mm band + 100 USD (maker_cost.py:8-9, 38-40; xmas26/catalog.py:62-66, 84-85; xmas26/catalog.json).
- Necklaces: pendant grams + 50 USD enamel + chain 130 USD at 18 in scaled by length (chain not quoted; maker convention = middle length of the range) (maker_cost.py:10, 13-14, 32-33; xmas26/catalog.py:67-68, 72-78). Example 1.2 g enamel pendant, 14K, 18 in: 120 + 50 + 130 = 300 -> 600. Christmas necklaces 340-870.
- Bracelets: quoted station bracelet = 3 g + 50 enamel + 100 chain + 50 assembly (14K 7 in cost 500 -> 1,000). The other bracelets use own grams x 3.75 (the B09 ratio), and that factor is applied to single-charm bracelets too (B02/B10: 0.6 g charm -> 2.25 g -> 850). That is likely pessimistic for single charms (xmas26/catalog.py:58, 67-69, 86-87). Christmas bracelets 640-1,340.
- Solid gold, no enamel: same gold cost, no 50 USD enamel item (xmas26/catalog.py:86).
- Model fee: 25 USD once per design, not in the unit price (maker_cost.py:12, 29). 30 designs = 750 USD one-off.
- Men's set (plain gold): rings from the band list with width/wall equivalents; signets "top + shank, halve it" (2026-09-16); station bracelets +50 assembly; earrings 162 USD non-gold work per pair, single 0.6x UNCALIBRATED (him26/catalog.py:69-98).
- Superseded v1 (still kept per variant): category labour from the 2027 enamel quotes: ring 365 USD at 2.04 g, necklace 380 at 2.96 g, bracelet 375 at 1.48 g, earring pair 350 at 0.88 g; labour = quote - grams x spot x 0.585 x 1.07 = ring 193.47, necklace 131.11, bracelet 250.55, earring 276.00 (fw2627-enamel/catalog.py:20-25; xmas26/catalog.py:22-24, 47-51).
- Two-tone: no quote for this maker. The only figures in the repo are EON's ($250 labour, 1.6 mm wall, 4-8 mm), which belong to a different maker. Any two-tone surcharge is an estimate and must carry a flag.

Flags used when no maker quote exists:
- `listing_metadata.pricing.status`: `PROVISIONAL` (ss27 anklets, xmas26), `ESTIMATE_MAKER_V2` (him26/gen_migration.py:129), `quoteStatus: ESTIMATE_LABOUR_100` (Jade E-series 2026-09-23, second-brain.md:981).
- `weightSource`: `geometry_estimate` (fw/ss27/xmas) or `maker-v2-est` (him26).
- `approval.blockers[]` sentences ("ESTIMATED PRICE: ...", "Grams are list or geometry estimates; no sample has been cast or weighed.", image blocker); `approval.etsyDraftCreationAuthorized: true`, `livePublicationAuthorized: false`; `missingHero` (xmas26/gen_migration.py:70-103; him26/gen_migration.py:126-138).
- Code comments `UNCALIBRATED_ASSUMPTION` / `UNCALIBRATED` on guessed parameters (him26/catalog.py:26; ss27/catalog.py:27).

Side finding (stale metadata): all 30 xmas26 rows still carry `pricing.status = PROVISIONAL` and the blocker "labor per category comes from the 2027 enamel quotes", but their prices were moved to 2 x maker cost by migrations 0163/0164. gen_reprice_migration.py and gen_reprice2_migration.py never touch listing_metadata (SQL group-by on sourcePackage plus grep). A new set should write the maker-v2 flag at generation.

## 4. Decisions the owner has to make before the catalog

1. Two-tone axis: option A, B or C from 2c (each needs an explicit yes, since CLAUDE.md:64-70 fixes the colour values and allows exceptions only on the owner's word).
2. Ask the maker for two-tone: price per piece, minimum accent size, which pairs (Y/W, R/W, Y/R) and whether enamel firing on a mixed-alloy piece is accepted (the alloy/enamel firing qualification is already an open blocker on the 2027 set).
3. Nazar palette within 2 enamel colours, and minimum size: about 9 mm for a concentric blue/white/gold-pupil eye, 5 mm for a one-colour eye with a gold pupil.
4. Whether the two legacy stone evil-eye bracelets (4579034421, 4575369430) stay beside 10 new evil-eye bracelets, and how the new set separates itself from A21/A22 (different palette or form) and from the EON Lookback ring and Jade's drafts.
