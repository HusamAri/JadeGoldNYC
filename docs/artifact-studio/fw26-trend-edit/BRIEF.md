# byArtifactStudio FW26 Trend Edit: build 10 new Etsy listings

> **For Claude Code on Husam's Mac.** This is a complete brief plus an execution plan. Work from a written plan and a state file on disk, listing by listing, with validate-fix loops and resume support. Nothing goes live on Etsy without Husam's explicit approval of the exact payload; drafts only.

**Goal:** Create 10 new, publish-ready Etsy listings (copy, structure, pricing, production and photo briefs) for the shop byArtifactStudio, designed around the four Etsy Fall and Winter 2026 trends that fit a solid gold studio, and stage them as Etsy drafts.

**Architecture:** One folder holds the brief, a checkbox plan, a `state.json`, one JSON and one Markdown file per listing, a validator, exports (xlsx and csv), a manufacturing brief for Efe and a photo plan. Etsy writes happen last, as drafts, through the Open API if credentials exist, otherwise through the browser, otherwise not at all.

**Tech stack:** Python 3 (json, openpyxl), the Etsy Open API v3 (optional), Playwright with Husam's Chrome profile (optional fallback), Apple Reminders and the Obsidian vault for capture (optional, gated).

---

## 1. How to work with Husam in this session

- One question at a time. Never a list of clarifying questions.
- Before any live action (Etsy write, reminder, file outside the project folder) show the exact payload or command and wait for a clear yes. Approval is per action, never general.
- Every response ends with one line labeled NEXT STEP, doable in under 5 minutes.
- English throughout. Typography rules are hard: never an em dash or an en dash (use a comma, a colon or the word "to"), never the character "a with circumflex", straight quotes are fine. The validator below enforces this on every file you write.
- Vocabulary: "buyer" not "customer". "Vintage style" or "vintage inspired", never "vintage" alone (Etsy's definition is 20+ years old). Never "gilded" or "plated" or "hand painted": the pieces are solid gold, kiln-fired enamel, hand stamped, hand forged, hand engraved. Never invent metrics, reviews or sales figures.
- Resume rule: on start, read `state.json`; continue from the first listing whose status is not `done`. Never rewrite a listing already marked `approved` or later unless Husam asks.
- Retry rule: a listing that fails validation gets up to 3 fix cycles; after that, mark it `blocked` with the errors and move on.

## 2. Context digest (already researched, do not re-browse unless a value is missing)

**Shop.** byArtifactStudio ("Gold Jewelry by Artifact Studio"), etsy.com/shop/byArtifactStudio. United States, ships from West New York, NJ. Opened September 2026. 209 active listings, 0 sales, 1 admirer, shop-wide 30% sale, free US shipping, returns and exchanges within 30 days, everything made to order in 3 to 5 business days. Sections: Christmas Collection 32, Evil Eye 30, For Him 29, Bracelets 20, Necklaces 18, Rings 22, Earrings 14, Anklets 24. Team: Husam (owner, designer), Efe (owner, maker, shipper), Ceren (buyer service). Brand pillars from the About page: Mesopotamian ornament, infinity and the eye, "reinterpreted rather than reproduced"; motto "The form begins with us. The meaning belongs to you."

**Listing anatomy to mirror** (reference listing 4590337023, Bauble Necklace): three variation properties (Karat 10K / 14K / 18K; Metal Color Rose / White / Yellow; Chain Length 16 / 18 / 20 in) with prices varying by karat and length; materials "Solid gold, Vitreous enamel"; category Jewelry > Necklaces > Pendant Necklaces; description = one intro paragraph plus seven hyphen bullets (dimensions and construction; karat and color options; chain spec; styling; made to order, processing time, ships from NJ; care; what is included and gift message). Voice: plain, precise, warm, teaches the buyer, no exclamation marks, no hype.

**Price architecture observed on the shop:** original list price = base x 1.265; the shop-wide sale shows list x 0.70. On the reference listing the 10K / 14K / 18K bases are 430 / 580 / 760 (ratios 1 : 1.349 : 1.767) and each extra 2 inches of chain adds about 14 to the 10K base.

**Pricing model used for the new pieces** (recompute when Efe sends real cast weights; keep the formula): 14K base = 320 per piece (make-and-finish floor) + 100 per gram of 14K + labor adders listed per listing; 10K base = 14K base / 1.349; 18K base = 14K base x 1.31; list price = base x 1.265; sale display = list x 0.70. Sets count one floor per piece.

**Etsy Fall and Winter 2026 Seller Trend Report** (Etsy search data as of 14 Sep 2026, last three months year over year unless noted; the four trends used and their vocabulary):

| Trend | Signals quoted by Etsy | Terms Etsy recommends | Photo guidance from Etsy |
|---|---|---|---|
| Operatic Drama | vintage jewelry +75%, men's brooches +70%, capelets +47%, jacquard fabric +23% with Millennials | heirloom jewelry, vintage brooch, gilded (we do not use this word), velvet, opera inspired | deep backgrounds, warm light, atmospheric styling |
| Merrymaxxing | whimsy items +110%, bedazzled kits +218%, whimsy ornaments +62% in favorites, whimsical decor +61% with Gen Z | bedazzled, rhinestone, maximalist, bold | close-ups that capture texture, shine and embellishment |
| Mark of the Maker | hand painted items +280%, hand-woven +230%, hand thrown +150% | hand-embroidered, needlepoint, handwoven, visible mending (our analogs: hand stamped, hand forged, hand enameled, hand engraved, kiln fired) | process shots, hands at work, short video of the piece coming together, paired with the finished product |
| Family Reimagined | personalized friend gifts +1,400%, pet gifting searches doubled, pet ornaments +22%, Friendsmas party supply sales +37% | pet ornament, personalized portrait, custom pet gift, friend group gift | show the piece in the moment it was made for; matching sets worn by friends; clear custom option fields at checkout |

Not used, on purpose: Table Dressing (ruffle tablecloths +841%), Craftmas (DIY activities +8,500%) and Freaky Festive Shoes. None has a credible solid gold expression; Craftmas survives only as "stackable" language in the Ur Band.

## 3. The ten listings (the content you are building; copy is final unless the validator objects)

| # | Name | Trend | Type | 14K list | Personalized |
|---|---|---|---|---|---|
| L01 | Seal Pin | Operatic Drama | Lapel Pins | $790.62 | yes |
| L02 | Ishtar Rosette | Operatic Drama | Brooches | $974.05 | no |
| L03 | Fibula | Operatic Drama | Brooches | $898.15 | no |
| L04 | Ur Band | Merrymaxxing | Bands | $923.45 | no |
| L05 | Nar (Pomegranate) | Merrymaxxing | Pendant Necklaces | $872.85 | no |
| L06 | Wedge | Mark of the Maker | Pendant Necklaces | $796.95 | yes |
| L07 | Thaw Hoops | Mark of the Maker | Hoop Earrings | $923.45 | no |
| L08 | Split Infinity | Family Reimagined | Pendant Necklaces | $1,378.85 | yes |
| L09 | Paw Seal | Family Reimagined | Pendant Necklaces | $815.92 | yes |
| L10 | Twin Eye | Family Reimagined | Chain & Link Bracelets | $1,144.82 | yes |

Capsule logic: the pillars appear once each as a hero (cylinder seal, rosette, fibula, mosaic, pomegranate, cuneiform, molten surface, infinity, seal, eye); necklaces and bracelets coordinate without repeating a motif; every piece is light (1.9 to 4.0 g in 14K for a set), structurally credible and manufacturable with the shop's existing processes plus two new tools (a wedge punch set and bench templates for the paw).

### L01 Seal Pin  (`01-seal-pin`)

- Product: Men's lapel pin: fluted solid gold cylinder (Mesopotamian cylinder seal) on a stick pin with solid gold clutch, end cap engraved with initials.
- Trend anchor: Operatic Drama (men's brooches +70%, vintage jewelry +75%). Secondary: Family Reimagined (personalized gift).
- Title (128 chars): Men's Lapel Pin in Solid Gold, Fluted Cylinder Seal Stick Pin with Engraved Initials, Heirloom Suit and Tuxedo Pin, Gift for Him
- Category: Jewelry > Brooches, Pins & Clips > Lapel Pins
- Shop section: Brooches & Pins (new section; also tag the listing in For Him via title and tags)
- Tags (13): mens lapel pin | gold lapel pin | solid gold brooch | mens brooch | stick pin for men | tuxedo lapel pin | groomsmen gift gold | heirloom jewelry | engraved lapel pin | cylinder seal | wedding lapel pin | gift for him gold | opera inspired
- Materials: Solid gold, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: none, Holiday: Christmas, Occasion: Wedding, Recipient: Men, Style: Classic
- Variations: Karat: 10K / 14K / 18K (price varies); Metal Color: Yellow / White / Rose
- Personalization: On, optional, max 5 characters. Instructions: "Up to 3 initials for the end cap, typed exactly as you want them cut (example: H.A. or HEA). Leave blank for no engraving."
- Processing time: 5 to 7 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 2.4 g in 14K, 1 make-floor(s), adders 65 (engraving 25 + solid gold pin and clutch 40) -> 14K base 625
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $586.08 (shows as $410.26 while the shop-wide 30% sale runs)
  - 14K: list $790.62 (shows as $553.43 while the shop-wide 30% sale runs)
  - 18K: list $1,035.72 (shows as $725.00 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
A lapel pin for men who dress for the occasion. The Seal Pin takes its form from the Mesopotamian cylinder seal, the small carved cylinder people once wore on a cord as both ornament and signature. Here it is a fluted solid gold cylinder, 14 mm long, on a stick pin with a solid gold clutch, and the flat end cap is engraved with your initials so the signature idea still holds.

- The cylinder measures 14 x 3.5 mm with twelve flutes, cast from our own hand-carved master and finished by hand; the pin is 45 mm long and sits flat behind a lapel, a scarf or a knit.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Everything is solid and stamped, nothing plated or filled.
- Personalization: up to three initials engraved on the end cap in a plain serif. Type them exactly as you want them cut, or leave the field blank for a plain cap.
- Wear it on a tuxedo lapel for a holiday party or an evening at the opera, or on a coat lapel on an ordinary Tuesday. It reads as heirloom jewelry, not as a novelty pin.
- Made to order at our bench in New Jersey in 5 to 7 business days, then shipped free within the US with a solid gold clutch back and a gift box.
- Gold does not tarnish. If the flutes collect dust, a soft brush and warm soapy water bring the shine back.
- A gift message can be added at checkout. Please check the spelling at checkout; engraved pieces are made specifically for you.
```

- Manufacturing note for Efe: Cylinder 14.0 x 3.5 mm, solid, cast in 14K from a hand-carved wax master with 12 longitudinal flutes 0.3 mm deep; flutes hand-finished with a fine needle file, satin inside the flutes and polished on the ridges. End cap flat, 3.5 mm, polished, engraved after casting (laser or graver, 1.2 mm serif capitals). Stick pin 0.9 mm hard 14K wire, 45 mm, soldered into a 1.0 mm blind hole at the cylinder's top end, tip rounded. Clutch: solid 14K pin protector (findings supplier), no plated parts. Hallmark on the end cap edge. Est. 14K weight 2.4 g (cylinder 1.75, pin 0.37, clutch 0.3). One master serves 10K, 14K and 18K.
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero on black velvet, warm window light from the left, pin at 45 degrees, flutes catching light
  2. On a tuxedo or dark wool lapel, worn, chest crop, shallow depth
  3. Macro of the flutes and the engraved end cap
  4. In an open palm for scale
  5. Back view with the clutch set behind a lapel
  6. Three karats side by side on dark jacquard (yellow, white, rose)
  7. Gift box, open, pin seated, warm light
  8. Engraving close-up with a sample monogram
  9. Styled flat lay: pin, cufflinks, a folded pocket square, a program from a concert
  10. Process: hands finishing a flute with a needle file (Mark of the Maker)
  11. Video 8 to 12 s: pin pushed through a lapel, clutch set, hand smooths the fabric
- Visualization prompt (internal mock only, never a listing image): "Product photograph, solid yellow gold fluted cylinder lapel pin 14 mm on a slim stick pin, resting on black silk velvet, warm late-afternoon window light, shallow depth of field, 35mm film grain, no retouching, muted palette"

### L02 Ishtar Rosette  (`02-ishtar-rosette`)

- Product: Eight-petal openwork rosette brooch in solid gold with a 5 mm garnet cabochon; hidden tube bail converts it to a pendant.
- Trend anchor: Operatic Drama (vintage jewelry +75%, ornate brooches). Secondary: Merrymaxxing (gemstone).
- Title (133 chars): Rosette Brooch in Solid Gold with Garnet, Convertible Brooch and Pendant, Vintage Style Heirloom Jewelry, Opera Inspired Gift for Her
- Category: Jewelry > Brooches, Pins & Clips > Brooches
- Shop section: Brooches & Pins (new section)
- Tags (13): gold brooch | solid gold brooch | garnet brooch | vintage style brooch | brooch pendant | convertible brooch | heirloom jewelry | opera inspired | rosette brooch | star of ishtar | mesopotamian jewelry | capelet brooch | gift for her gold
- Materials: Solid gold, Garnet, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: Red, Holiday: Christmas, Occasion: Anniversary, Recipient: Women, Style: Historical
- Variations: Karat: 10K / 14K / 18K (price varies); Metal Color: Yellow / White / Rose; Chain: None / 16 in / 18 in / 20 in (price varies; chain is a 1.2 mm solid gold cable with spring ring)
- Personalization: Off
- Processing time: 3 to 5 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 3.2 g in 14K, 1 make-floor(s), adders 130 (garnet and bezel 30 + brooch fittings 60 + openwork finishing 40; chain add-on priced separately) -> 14K base 770
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $722.05 (shows as $505.43 while the shop-wide 30% sale runs)
  - 14K: list $974.05 (shows as $681.83 while the shop-wide 30% sale runs)
  - 18K: list $1,276.01 (shows as $893.21 while the shop-wide 30% sale runs)
- Chain add-on (16 in): 10K +$140.66; 14K +$189.75; 18K +$248.57; add the shop's standard step for 18 and 20 in
- Description (paste as is):

```text
An eight-petal rosette, the star of Ishtar that appears on Mesopotamian seals and gates, carved as an openwork brooch in solid gold and set with a deep red garnet at its center. A hidden tube behind the top petal takes a chain, so the same piece pins to a velvet lapel or a capelet one night and hangs as a pendant the next.

- The rosette measures 22 mm across and 1.2 mm thick, cast from our own hand-carved master and finished by hand so the edges stay crisp and the back is as clean as the front.
- The garnet is a 5 mm cabochon in a closed bezel; under warm light its color sits between wine and ember.
- Brooch fittings are solid gold: a pin stem, a joint and a safety catch that rolls over so the pin cannot open on its own.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Add a 1.2 mm cable chain in 16, 18 or 20 inches if you want to wear it as a pendant from day one.
- It is made for the season of dressing up: a vintage style brooch for an evening coat, an opera night or a holiday table, and it stays in rotation long after.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Garnet is hard enough for daily wear. Keep the piece away from knocks and clean it with a soft cloth. A gift message can be added at checkout.
```

- Manufacturing note for Efe: Rosette 22 mm diameter, 1.2 mm sheet thickness equivalent, eight pointed petals with pierced (open) spaces between the inner ring and the petal tips, cast from a hand-carved wax master; openwork cleaned with a saw and needle files, edges crisp, back flat and polished. Center: 5 mm round garnet cabochon in a closed-back bezel cup (0.4 mm wall) soldered to the rosette, bezel burnished over the stone. Brooch fittings in solid 14K: pin stem 0.8 mm hard wire, joint (hinge) and revolving safety catch, soldered on the back at 2 and 10 o'clock so the piece hangs level. Hidden bail: 2.0 mm OD gold tube, 6 mm long, soldered horizontally behind the top petal, sized to pass a 1.2 mm cable chain. Est. 14K weight 3.2 g (rosette 2.6, fittings and bezel 0.6). Chain add-on: 1.2 mm cable 16 in, est. 1.4 g, spring ring clasp.
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero on deep green velvet, warm side light, brooch pinned at a coat lapel, garnet catching light
  2. Worn as a pendant on an 18 in chain against a dark knit
  3. Macro of the garnet and bezel
  4. Back view: pin, safety catch, hidden tube bail
  5. On a capelet at the shoulder, atmospheric low light (Operatic Drama)
  6. Three metal colors on dark jacquard fabric
  7. In an open palm for scale
  8. Gift box, open
  9. Styled: brooch on a velvet evening bag beside opera glasses
  10. Process: hands cleaning the openwork with a saw frame (Mark of the Maker)
  11. Video 8 to 12 s: unpin from the lapel, thread the chain, lift as a pendant
- Visualization prompt (internal mock only, never a listing image): "Product photograph, solid gold openwork eight-petal rosette brooch 22 mm with a deep red garnet cabochon center, pinned to dark green velvet, candlelit warm light, shallow depth of field, 35mm film grain, no retouching"

### L03 Fibula  (`03-fibula`)

- Product: Hand forged solid gold fibula (cape and shawl pin): one piece of wire coiled into a spring, hammered bow, formed catch.
- Trend anchor: Operatic Drama (capelets +47%). Secondary: Mark of the Maker (hand forged).
- Title (123 chars): Solid Gold Shawl Pin, Hand Forged Fibula Cape Clasp for Capelets, Scarves and Cardigans, Ancient Style Heirloom Sweater Pin
- Category: Jewelry > Brooches, Pins & Clips > Brooches
- Shop section: Brooches & Pins (new section)
- Tags (13): shawl pin | gold shawl pin | cape clasp | capelet pin | fibula brooch | sweater pin | scarf pin gold | hand forged jewelry | heirloom jewelry | cloak pin | cardigan clip | opera inspired | solid gold brooch
- Materials: Solid gold, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: none, Holiday: Christmas, Occasion: Anniversary, Recipient: Women, Style: Historical
- Variations: Karat: 10K / 14K / 18K (price varies); Metal Color: Yellow / White / Rose
- Personalization: Off
- Processing time: 3 to 5 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 2.9 g in 14K, 1 make-floor(s), adders 100 (forging and work-hardening 80 + catch forming 20) -> 14K base 710
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $665.79 (shows as $466.05 while the shop-wide 30% sale runs)
  - 14K: list $898.15 (shows as $628.70 while the shop-wide 30% sale runs)
  - 18K: list $1,176.58 (shows as $823.61 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
Before buttons, there was the fibula: one length of metal coiled into a spring, bent into a bow and finished with a catch. Ours is forged from a single piece of solid gold wire, so there is no solder joint to fail, and it closes a capelet, a shawl, a scarf or an open cardigan with a shape people have trusted for three thousand years.

- The fibula measures 38 mm long with a 1.3 mm pin; the bow is hammered flat to 2.5 mm, and the double-coil spring keeps tension so the pin stays closed in knits and woven fabrics.
- Forged and work-hardened by hand at our bench, which is why the surface carries soft hammer facets rather than a mirror polish. No two are identical.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Solid and stamped, nothing plated or filled.
- Wear it high on a capelet for an evening out, through a scarf on a coat, or as a sweater pin at the collarbone. It does the work of a brooch without the weight of one, and it is opera inspired in the oldest sense: dressing with intent.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Gold does not tarnish. If the pin tip ever dulls on heavy wool, a few strokes on a fine emery board restore it. Avoid very loose, open weaves, where any pin can slip.
- A gift message can be added at checkout.
```

- Manufacturing note for Efe: One piece of 1.3 mm round 14K wire, approx. 120 mm, annealed. Form: pin shank 38 mm; two full coils (spring) of 4 mm ID at the head; bow forged flat with a planishing hammer to 2.5 x 0.8 mm over 30 mm, leaving visible facets; foot bent into a rolled catch (hook) 3 mm deep that receives the pin tip. Work-harden the pin and spring after forming (planish, then twist-harden; do not anneal again). Pin tip ground to a blunt point and polished so it does not snag fibers. Hallmark stamped on the inside of the bow. Est. 14K weight 2.9 g. Note for Efe: 18K is softer; use 1.4 mm wire for the 18K version to keep spring tension.
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero: fibula closing a camel cashmere capelet at the shoulder, warm window light
  2. Through a wool scarf on a dark coat, street light
  3. Macro of hammer facets on the bow
  4. Macro of the coil spring and the catch
  5. Open and closed positions side by side on linen
  6. Worn as a sweater pin at the collarbone of a fine knit
  7. In an open palm for scale
  8. Three metal colors on dark jacquard
  9. Gift box, open
  10. Process: hands forging the bow with a planishing hammer on a steel block (Mark of the Maker)
  11. Video 8 to 12 s: pin slides through knit, catch closes, hand smooths the shawl
- Visualization prompt (internal mock only, never a listing image): "Product photograph, hand forged solid gold fibula pin 38 mm with hammered flat bow and coiled spring, fastening a camel cashmere capelet at the shoulder, warm natural light, shallow depth of field, 35mm film grain, no retouching"

### L04 Ur Band  (`04-ur-band`)

- Product: Solid gold band with twelve recessed cells of kiln-fired vitreous enamel in the Standard of Ur palette (lapis blue, red, white) or a five-color Festival palette.
- Trend anchor: Merrymaxxing (bold color, whimsy +110%). Secondary: Mark of the Maker (fired cell by cell by hand).
- Title (127 chars): Mosaic Enamel Ring in Solid Gold, Lapis Blue Red and White Kiln Fired Band, Bold Color Statement Ring, Maximalist Stacking Band
- Category: Jewelry > Rings > Bands
- Shop section: Rings
- Tags (13): enamel ring | mosaic ring | bold color ring | maximalist ring | statement ring gold | stacking ring enamel | colorful gold ring | kiln fired enamel | solid gold band ring | lapis blue ring | whimsical ring | hand enameled ring | sumerian jewelry
- Materials: Solid gold, Vitreous enamel, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Blue, Secondary color: Red, Holiday: Christmas, Occasion: Birthday, Recipient: Women, Style: Whimsical
- Variations: Karat: 10K / 14K / 18K (price varies); Ring Size: US 4 to 10 in half sizes; Palette: Ur (lapis, red, white) / Festival (cobalt, cranberry, emerald, saffron, pink)
- Personalization: Off
- Processing time: 3 to 5 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 2.9 g in 14K, 1 make-floor(s), adders 120 (12 cells, 3 to 5 colors, multiple firings and flush stoning 120) -> 14K base 730
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $684.54 (shows as $479.18 while the shop-wide 30% sale runs)
  - 14K: list $923.45 (shows as $646.41 while the shop-wide 30% sale runs)
  - 18K: list $1,209.72 (shows as $846.80 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
The Standard of Ur, a 4,500-year-old box from a Sumerian tomb, is inlaid in exactly three materials: lapis lazuli, red limestone and white shell. The Ur Band borrows that palette and nothing else. Twelve cells run around a solid gold band, each filled by hand with kiln-fired vitreous enamel in lapis blue, cranberry red and shell white, then stoned flush and polished so the gold walls between them read as fine lines.

- The band is 3.5 mm wide and 1.4 mm thick with a rounded comfort fit inside; the cells are 0.4 mm deep, so the enamel sits protected within the gold.
- Enamel is glass fused to gold at around 800 C, fired cell by cell. Small variations in tone from one firing to the next are the mark of the hand, not a fault.
- Yellow gold only, because the warm walls are part of the palette. Choose solid 10K, 14K or 18K and your US size from 4 to 10 in half sizes. Wider bands fit tighter, so if you sit between sizes, go up.
- Palette: Ur (lapis, red, white) for the original, or Festival (cobalt, cranberry, emerald, saffron and pink) when you want the full maximalist stack.
- One Ur Band is a quiet accent of bold color. Two or three stacked with plain gold bands is the mood of this season, and it still works in July.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.
```

- Manufacturing note for Efe: Band 3.5 mm wide x 1.4 mm thick, comfort-fit inner profile, cast per size from a master ring (CAD or hand-carved) with twelve rectangular recessed cells 2.3 x 1.4 mm, 0.4 mm deep, separated by 0.5 mm gold walls; cells have a slightly undercut floor to key the enamel. Champleve process: degrease, counter-enamel not required at this depth, wet-pack lead-free vitreous enamel (opaque lapis blue, opaque cranberry red, opaque white; Festival adds opaque emerald, saffron and pink), fire at 780 to 820 C, two to three fills per cell, stone flush with alundum/diamond stick under water, flash fire for gloss, final polish on the gold only. Ur sequence: blue, red, white, repeated four times. Hallmark inside. Est. 14K weight 2.9 g at US 7. Yellow gold only (alloy must tolerate enamel firing; confirm Efe's 10K yellow alloy is enamel-safe, otherwise offer the Ur Band in 14K and 18K only).
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero macro: band on a matte cream surface, raking light so the enamel cells show their flush gloss (Merrymaxxing close-up)
  2. On hand, stacked between two plain gold bands, saturated knit sleeve
  3. Ur and Festival palettes side by side
  4. 360 detail: three cells filling the frame, gold walls crisp
  5. Both palettes on fingers of two different hands (friend shot)
  6. Scale shot beside a US quarter
  7. Gift box, open
  8. Reference flat lay: the ring beside lapis, red and white raw materials
  9. Process: wet-packing enamel into cells with a fine brush (Mark of the Maker)
  10. Process: kiln door open, ring glowing on a trivet
  11. Video 8 to 12 s: slow rotation of the band in warm light, then the stack on a hand
- Visualization prompt (internal mock only, never a listing image): "Product photograph, solid yellow gold ring band 3.5 mm with twelve flush enamel cells alternating lapis blue, red and white, on a matte cream linen surface, raking natural light, extreme close-up, 35mm film grain, no retouching"

### L05 Nar (Pomegranate)  (`05-nar-pomegranate`)

- Product: Solid gold pomegranate pendant, 12 mm, cranberry red enamel skin, a split set with three small garnets as seeds, on a 1.2 mm cable chain.
- Trend anchor: Merrymaxxing (gemstones, bold color, whimsy). Secondary: Family Reimagined (gift for a household, a host, a friend).
- Title (140 chars): Pomegranate Necklace in Solid Gold, Cranberry Enamel Pendant with Garnet Seeds, Bold Color Charm Necklace, Abundance Gift, Christmas Jewelry
- Category: Jewelry > Necklaces > Pendant Necklaces
- Shop section: Necklaces
- Tags (13): pomegranate necklace | pomegranate jewelry | garnet necklace gold | enamel pendant gold | bold color necklace | solid gold charm | abundance gift | hostess gift gold | new home gift gold | anatolian jewelry | whimsical necklace | red enamel necklace | christmas necklace
- Materials: Solid gold, Vitreous enamel, Garnet, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Red, Secondary color: Gold, Holiday: Christmas, Occasion: Housewarming, Recipient: Women, Style: Whimsical
- Variations: Karat: 10K / 14K / 18K (price varies); Metal Color: Yellow / White / Rose; Chain Length: 16 / 18 / 20 inches (price varies)
- Personalization: Off
- Processing time: 3 to 5 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 3.0 g in 14K, 1 make-floor(s), adders 70 (three garnets bead set 45 + enamel cell 25) -> 14K base 690
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $647.03 (shows as $452.92 while the shop-wide 30% sale runs)
  - 14K: list $872.85 (shows as $611.00 while the shop-wide 30% sale runs)
  - 18K: list $1,143.43 (shows as $800.40 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
The pomegranate has meant abundance, luck and a full house from Mesopotamia to Anatolia for as long as people have been carving it. Ours is a 12 mm solid gold fruit with a crown, its skin in cranberry red kiln-fired enamel and a split that opens onto three garnets set as seeds. The word garnet comes from granatum, the Latin for pomegranate, so the gemstones are not decoration; they are the point.

- The pendant measures 12 x 10 mm plus the crown, cast with an open back so it stays light on the chain, and hangs from a fixed loop that keeps it facing forward.
- Three 1.3 mm garnets are bead set into the split by hand; the enamel is fired in a recessed cell with a polished gold rim.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose, and a 1.2 mm solid gold cable chain with spring ring clasp in 16, 18 or 20 inches.
- It is a bold color piece that happens to be festive, which makes it an easy gift for a new home, a host, a friend who feeds everyone, or yourself, which is allowed.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth.
- A gift message can be added at checkout.
```

- Manufacturing note for Efe: Pomegranate body 12 x 10 mm, slightly flattened sphere, cast as an open-backed shell with 0.8 mm walls; six-point crown 2.5 mm tall cast integral; fixed bail loop 1.5 mm ID at the crown. Front: one recessed enamel cell following the body silhouette, 0.4 mm deep, with a 0.5 mm polished gold rim; a vertical split 5 x 1.8 mm left bare in the cell and drilled with three 1.3 mm seats for bead-set round garnets (or 1.3 mm cranberry-red garnets matched to the enamel). Enamel: opaque cranberry red, wet-packed, three fills, fired 780 to 820 C, stoned flush, flash fired; set the garnets after enameling. Chain 1.2 mm cable, spring ring. Est. 14K weight 3.0 g with a 16 in chain (pendant 1.5, chain 1.4, findings 0.1). For white and rose gold, confirm enamel adhesion on Efe's alloys; if not, offer yellow only.
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero macro: pendant against a split real pomegranate, seeds and garnets in one frame, warm light (Merrymaxxing texture and shine)
  2. Worn at 18 in on skin above a cream knit collar
  3. Macro of the three garnets inside the split, raking light
  4. Layered with the Wedge pendant at 16 and 20 in
  5. Three metal colors on dark linen
  6. Scale shot in an open palm
  7. Gift box, open, with a sprig of pine
  8. Styled on a holiday table beside a glass of red wine (Family Reimagined moment)
  9. Back view showing the open-back construction
  10. Process: bead-setting a garnet under the microscope (Mark of the Maker)
  11. Video 8 to 12 s: slow turn in candlelight, enamel gloss and garnet flash
- Visualization prompt (internal mock only, never a listing image): "Product photograph, solid gold pomegranate pendant 12 mm with glossy cranberry red enamel skin and three tiny garnets visible in a split, resting on a split real pomegranate on dark linen, warm window light, 35mm film grain, no retouching"

### L06 Wedge  (`06-wedge-cuneiform`)

- Product: Hand-stamped cuneiform bar pendant in solid gold (16 x 5 mm); choose one Sumerian sign (TI life, SHA heart, E home, AN star); initials engraved on the back.
- Trend anchor: Mark of the Maker (hand-stamped marks; hand painted items +280%). Secondary: Family Reimagined (personalized gifts +1,400%).
- Title (139 chars): Cuneiform Necklace Hand Stamped in Solid Gold, Personalized Bar Pendant with Engraved Initials, Sumerian Sign for Life, Heart, Home or Star
- Category: Jewelry > Necklaces > Pendant Necklaces
- Shop section: Necklaces
- Tags (13): cuneiform necklace | cuneiform jewelry | hand stamped pendant | personalized bar | engraved bar pendant | sumerian necklace | mesopotamian jewelry | gold bar necklace | initial necklace | handmade pendant | ancient script | gift for her gold | meaningful necklace
- Materials: Solid gold, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: none, Holiday: Christmas, Occasion: Graduation, Recipient: Unisex adults, Style: Historical
- Variations: Karat: 10K / 14K / 18K (price varies); Chain Length: 16 / 18 / 20 inches (price varies); Sign: TI (life) / SHA (heart) / E (home) / AN (star, sky)
- Personalization: On, optional, max 8 characters. Instructions: "Up to 8 characters engraved on the back: initials, a year or a short word, typed exactly as you want them cut. Leave blank for a plain back."
- Processing time: 5 to 7 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 2.55 g in 14K, 1 make-floor(s), adders 55 (hand stamping 30 + back engraving 25) -> 14K base 630
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $590.77 (shows as $413.54 while the shop-wide 30% sale runs)
  - 14K: list $796.95 (shows as $557.87 while the shop-wide 30% sale runs)
  - 18K: list $1,044.00 (shows as $730.80 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
Some of the first writing in the world was made by pressing a reed into wet clay. The marks became wedges, and the wedges became cuneiform. The Wedge pendant is a small bar of solid gold struck by hand with the same wedge shapes, one sign at a time, so every stroke is slightly deeper or lighter than the next. You choose the sign; the back is engraved with your initials or a date.

- The bar measures 16 x 5 mm and 1 mm thick, rolled from solid gold sheet, annealed and hand stamped with three sizes of wedge punch. The surface is brushed, the edges softly rounded.
- Four Sumerian signs to choose from: TI (life), SHA (heart), E (home) and AN (star, sky). The listing photos show each sign next to its meaning.
- Personalization: up to 8 characters engraved on the back, initials, a year or a short word, typed exactly as you want them cut.
- Yellow gold as standard; message us for white or rose. Choose solid 10K, 14K or 18K with a 1.2 mm cable chain and spring ring clasp in 16, 18 or 20 inches.
- Because each bar is struck by hand, spacing and depth vary a little from piece to piece. That variation is the point of the design, and it is why no two Wedges match.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping, gift box included. Please check the spelling at checkout; engraved pieces are made specifically for you.
- Gold does not tarnish; a soft cloth keeps the brushed finish even. A gift message can be added at checkout.
```

- Manufacturing note for Efe: Bar 16 x 5 x 1.0 mm cut from rolled 14K sheet, corners radiused 0.6 mm, edges rounded, annealed before stamping. Punch set to be made (hardened steel, three wedge sizes: 1.6, 2.4 and 3.2 mm heads) matching the cuneiform stroke shapes; strike on a steel block with a 200 g hammer, one stroke per wedge, then flatten the back lightly. Signs (Sumerian, Unicode reference for the sign drawings): TI U+122FE, SHA (SA3) U+122AE, E (E2) U+1208D, AN U+1202D; prepare a sign card with the four signs and their stroke order for the bench and for photo 3. Back: engraved up to 8 characters in a plain sans serif, 1.3 mm cap height. Bail: 1.5 mm ID loop soldered at the top short edge so the bar hangs vertically (or two end loops for a horizontal bar if Husam prefers; decide before the master). Finish: fine satin brush, edges bright. Hallmark on the back. Est. 14K weight 2.55 g with 16 in chain (bar 1.05, bail 0.1, chain 1.4).
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero macro on raw clay or unglazed stoneware, raking light so the wedge depth reads
  2. The four signs side by side with their meanings printed small on a card (shoppers need this image)
  3. Worn at 18 in on a dark turtleneck
  4. Macro of two Wedges showing the hand variation in depth and spacing
  5. Back view with a sample engraving
  6. Layered with the Nar pendant
  7. Scale shot in an open palm
  8. Three karats on linen (color shift between 10K, 14K, 18K)
  9. Gift box, open
  10. Process: hand striking the punch on the bar, hammer mid-air (Mark of the Maker)
  11. Video 8 to 12 s: three strikes, bar lifted and turned to the light
- Visualization prompt (internal mock only, never a listing image): "Product photograph, small brushed solid gold bar pendant 16 mm hand-stamped with a cuneiform star sign of deep wedge impressions, lying on raw unglazed clay, raking warm light, extreme close-up, 35mm film grain, no retouching"

### L07 Thaw Hoops  (`07-thaw-hoops`)

- Product: 15 mm solid gold post hoops with a torch-melted, rippled surface and a contrasting white gold tip; continues the shop's Thaw Cuff.
- Trend anchor: Mark of the Maker (visible process, texture). Secondary: Operatic Drama (dressing up, candlelight).
- Title (132 chars): Molten Gold Hoop Earrings, Hand Textured Two Tone Solid Gold Hoops with White Gold Tip, Sculptural Huggie Hoops, Winter Gift for Her
- Category: Jewelry > Earrings > Hoop Earrings
- Shop section: Earrings
- Tags (13): molten gold hoops | textured gold hoops | two tone hoops | solid gold hoops | huggie hoop earrings | organic gold hoops | sculptural earrings | hand textured hoops | small gold hoops | white gold tip | handmade gold hoops | gift for her gold | winter earrings
- Materials: Solid gold, White gold, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: Silver, Holiday: Christmas, Occasion: Birthday, Recipient: Women, Style: Minimalist
- Variations: Karat: 10K / 14K / 18K (price varies); Body Color: Yellow / Rose (tip is always white gold)
- Personalization: Off
- Processing time: 3 to 5 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 2.5 g in 14K, 1 make-floor(s), adders 160 (torch texturing 80 + two-tone tips 60 + posts and backs 20 (pair priced as one piece with heavier labor)) -> 14K base 730
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $684.54 (shows as $479.18 while the shop-wide 30% sale runs)
  - 14K: list $923.45 (shows as $646.41 while the shop-wide 30% sale runs)
  - 18K: list $1,209.72 (shows as $846.80 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
The Thaw Hoops continue our Thaw cuff: solid gold taken to the edge of melting so the surface pools and ripples, then stopped, with one tip finished in contrasting white gold like the last ice on a river. They are small enough for every day and textured enough to catch candlelight across a table.

- Each hoop measures 15 mm across in 1.6 mm wire, with a post and a solid gold butterfly back, so the pair sits lightly and stays put.
- The molten surface is made by hand with a torch, one hoop at a time; then the white gold tip is soldered and polished. The pair is matched by eye, and the ripples differ slightly from left to right. That is the handmade part, and we would not sand it away.
- Choose solid 10K, 14K or 18K gold; the body comes in yellow or rose, the tip in white. Everything is solid and stamped, nothing plated or filled.
- Wear them alone, or as the second hoop in a stack. They sit well with velvet in December and with a T-shirt in June.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Gold does not tarnish. Warm water with a drop of dish soap and a soft brush clears the texture of any residue.
- A gift message can be added at checkout.
```

- Manufacturing note for Efe: Pair of hoops, 15 mm outer diameter, 1.6 mm round wire (yellow or rose 14K), formed round, ends butted. Texture: reticulation by torch on a charcoal block, heating until the surface just flows, then quenched; repeat until the ripple reads at arm's length (reference the Thaw Cuff surface); alternatively cast from a torch-textured master if reticulation yield is poor on 10K. White gold tip: 3 mm cap of 14K white (palladium white preferred over nickel for skin), soldered to one end, polished bright; no rhodium. Post 0.8 mm hard wire soldered to the opposite end, 10 mm long, notched; solid 14K butterfly backs. Match left and right by eye for ripple density. Hallmark on the inside of the hoop near the post. Est. 14K weight 2.5 g per pair (hoops 2.2, posts and backs 0.3).
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero macro of one hoop: ripples and the bright white tip, raking warm light
  2. On ear with hair tucked, side profile, soft daylight
  3. Both hoops side by side showing the left and right difference
  4. On ear in candlelight at a dinner table (Operatic Drama)
  5. Stacked as the second hoop with a plain huggie
  6. Yellow and rose body versions on dark linen
  7. Scale shot beside a US dime
  8. Back view: post and butterfly
  9. Gift box, open
  10. Process: torch flame on the hoop on a charcoal block, surface flowing (Mark of the Maker)
  11. Video 8 to 12 s: torch moment, quench, finished pair turned in the hand
- Visualization prompt (internal mock only, never a listing image): "Product photograph, pair of small solid yellow gold hoop earrings 15 mm with a molten rippled surface and one polished white gold tip, on dark linen beside a single candle, warm low light, extreme close-up, 35mm film grain, no retouching"

### L08 Split Infinity  (`08-split-infinity`)

- Product: One 16 x 8 mm solid gold infinity loop cut along a soft wave into 2 or 3 pendants, each on its own chain, each with one engraved initial; sold as a matching set.
- Trend anchor: Family Reimagined (personalized friend gifts +1,400%, Friendsmas +37%). Secondary: Merrymaxxing (none); brand pillar: infinity.
- Title (139 chars): Friendship Necklace Set of 2 or 3 in Solid Gold, Split Infinity Matching Pendants with Engraved Initials, Best Friend Gift, Friendsmas Gift
- Category: Jewelry > Necklaces > Pendant Necklaces
- Shop section: Necklaces
- Tags (13): friendship necklace | best friend necklace | matching necklaces | friend group gift | friendsmas gift | set of 3 necklaces | infinity necklace | sister necklace set | couples necklace set | personalized gift | chosen family gift | bff necklace gold | initial necklace set
- Materials: Solid gold, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: none, Holiday: Christmas, Occasion: Birthday, Recipient: Women, Style: Minimalist
- Variations: Set: 2 pendants / 3 pendants (price varies); Karat: 10K / 14K / 18K (price varies); Metal Color: Yellow / White / Rose (chains ship at 18 inches; 16 or 20 by note in the personalization field)
- Personalization: On, optional, max 40 characters. Instructions: "One initial per pendant, in order left to right (example: H / E / C). Optional: chain length per pendant, 16, 18 or 20 inches (example: H 16 / E 18 / C 18)."
- Processing time: 5 to 7 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 4.0 g in 14K, 2 make-floor(s), adders 50 (set of 2: two make-floors + two engravings 50; set of 3 computed separately (5.9 g, three floors, 75)) -> 14K base 1090
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $1,022.13 (shows as $715.49 while the shop-wide 30% sale runs)
  - 14K: list $1,378.85 (shows as $965.19 while the shop-wide 30% sale runs)
  - 18K: list $1,806.29 (shows as $1,264.40 while the shop-wide 30% sale runs)
- Set of 3 price ladder: 10K list $1,523.81 (sale $1,066.67); 14K list $2,055.62 (sale $1,438.93); 18K list $2,692.87 (sale $1,885.01)
- Description (paste as is):

```text
One infinity loop, cut along a soft wave into two or three pieces, each on its own chain. Apart, each pendant is a small gold curve that reads as abstract. Side by side, they close back into the loop. It is a matching set for the people who are family by choice: best friends, sisters, a couple, a trio who has shared a group chat for a decade.

- The complete infinity measures 16 x 8 mm in 1.3 mm solid gold; each piece has its own bail and hangs on a 1.2 mm cable chain with spring ring clasp.
- Choose a set of 2 or 3. Each pendant can carry one engraved initial on the back, so write them in the order you want them matched to the pieces, left to right.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Chains ship at 18 inches; if your friends want 16 or 20, note it next to each initial in the personalization field and we will cut each chain accordingly.
- The pieces are cast from one master and finished together as a set, so the break lines meet cleanly when the pendants are placed side by side.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping. Each pendant arrives in its own gift box, so the set can be given in three places on the same night.
- Please check the spelling at checkout; engraved pieces are made specifically for you.
- Gold does not tarnish. A soft cloth keeps it bright. A gift message can be added at checkout.
```

- Manufacturing note for Efe: Master: infinity loop 16 x 8 mm in 1.3 mm round section, flattened slightly on the back (D profile) for comfort and engraving. Two cutting patterns on the same master: Set of 2 (one wave cut through the crossing, giving a left and right piece) and Set of 3 (two wave cuts giving left lobe, center crossing, right lobe). Cast each piece separately from piece-specific masters (do not cut finished castings; cut the wax, then cast, so the break faces are clean). Each piece: 1.5 mm ID bail soldered at its top point, back engraved with one initial 1.5 mm cap height. Chains 1.2 mm cable, 18 in standard, spring ring. Packaging: one box per pendant. Est. 14K weights: set of 2 approx. 4.0 g (pieces 1.2, chains 2.8); set of 3 approx. 5.9 g (pieces 1.5, chains 4.2 plus bails). Note: center piece of the set of 3 is the smallest; make sure it keeps enough face for the initial.
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero: three pendants placed together on linen closing the infinity, soft daylight
  2. Three friends at a dinner table, each wearing one piece, candlelight (Family Reimagined moment)
  3. Each piece alone on skin at 18 in, three frames in one image
  4. Back view with sample initials
  5. Set of 2 placed together
  6. Two and three piece sets side by side
  7. Three gift boxes open in a row
  8. Macro of the wave break line meeting
  9. Metal color options on dark linen
  10. Process: hands cutting the wave in wax under a lamp (Mark of the Maker)
  11. Video 8 to 12 s: three hands place the pieces together until the loop closes
- Visualization prompt (internal mock only, never a listing image): "Product photograph, three small solid gold pendant pieces on separate fine chains placed together on cream linen so they form a single infinity loop with soft wave seams, soft window light, overhead, 35mm film grain, no retouching"

### L09 Paw Seal  (`09-paw-seal`)

- Product: 10 mm solid gold disc with a hand-engraved intaglio paw print (dog or cat), optional enamel fill, pet's name engraved on the back; on a 1.2 mm cable chain.
- Trend anchor: Family Reimagined (pet gifting searches doubled; custom pet gift). Secondary: Mark of the Maker (hand engraved).
- Title (136 chars): Pet Paw Print Necklace in Solid Gold, Hand Engraved Paw Seal Pendant with Pet Name, Custom Dog Mom or Cat Mom Gift, Pet Memorial Jewelry
- Category: Jewelry > Necklaces > Pendant Necklaces
- Shop section: Necklaces
- Tags (13): paw print necklace | dog mom necklace | cat mom gift gold | custom pet gift | pet memorial jewelry | pet name necklace | solid gold paw print | dog lover gift gold | cat lover necklace | paw print jewelry | hand engraved charm | dog dad gift | signet style pendant
- Materials: Solid gold, Vitreous enamel, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: Blue, Holiday: Christmas, Occasion: Birthday, Recipient: Women, Style: Minimalist
- Variations: Karat: 10K / 14K / 18K (price varies); Chain Length: 16 / 18 / 20 inches (price varies); Paw Finish: Plain gold / Cobalt enamel / Cranberry enamel / Black enamel
- Personalization: On, required, max 16 characters. Instructions: "Pet name for the back (up to 10 characters) and DOG or CAT for the paw style. Example: BIBER / DOG. Add a year after the name if you are marking a life."
- Processing time: 5 to 7 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 2.5 g in 14K, 1 make-floor(s), adders 75 (intaglio hand engraving 50 + name engraving 25; enamel fill offered at the same price) -> 14K base 645
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $604.84 (shows as $423.39 while the shop-wide 30% sale runs)
  - 14K: list $815.92 (shows as $571.14 while the shop-wide 30% sale runs)
  - 18K: list $1,068.86 (shows as $748.20 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
A seal is the mark a thing leaves behind. The Paw Seal is a 10 mm solid gold disc with a paw pressed into its face as an intaglio, cut by hand below the surface the way a signet is cut, so it catches shadow rather than shine. The back carries your pet's name. Choose a plain gold paw, or have the intaglio filled with kiln-fired enamel in cobalt, cranberry or black.

- The disc measures 10 mm across and 1.2 mm thick with a fixed bail; the paw is engraved by hand, and the two styles, dog and cat, are shown in the listing photos.
- Personalization: your pet's name on the back, up to 10 characters, and the choice of dog or cat paw. Add a year if you are marking a life.
- Yellow gold as standard; message us for white or rose. Choose solid 10K, 14K or 18K with a 1.2 mm cable chain and spring ring clasp in 16, 18 or 20 inches. Message us for the bracelet version on a 6.5, 7 or 7.5 inch chain.
- A personalized gift for a dog mom, a cat dad, a puppy's first Christmas, or in memory of a pet whose paw print is still on the car window.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping, gift box included. Please check the spelling at checkout; engraved pieces are made specifically for you.
- If you choose enamel, it is glass fused to gold and can chip from a hard knock; a soft cloth is all it needs. Gold itself does not tarnish.
- A gift message can be added at checkout.
```

- Manufacturing note for Efe: Disc 10.0 mm diameter x 1.2 mm, cast or cut from sheet, edges slightly domed, fixed bail 1.5 mm ID soldered at 12 o'clock. Face: paw intaglio (central pad plus four toe pads, dog version rounder, cat version smaller and more oval) engraved by hand with gravers to 0.3 mm depth, floors matte, walls bright, like a signet; prepare two bench templates so the paws stay consistent. Optional fill: wet-pack opaque enamel (cobalt, cranberry or black) into the intaglio, fire 780 to 820 C, stone flush, flash fire. Back: pet name up to 10 characters, 1.3 mm cap height, centered, plus optional year below. Chain 1.2 mm cable, spring ring. Bracelet version on request: same disc as a connector on a 6.5 to 7.5 in chain. Hallmark on the back under the name. Est. 14K weight 2.5 g with 16 in chain (disc 1.1, bail 0.1, chain 1.4).
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero macro of the intaglio paw under raking light, plain gold version
  2. Worn by a person with their dog in frame, daylight, shallow depth (Family Reimagined moment)
  3. The three enamel fills and plain gold side by side
  4. Dog and cat paw styles side by side with small labels
  5. Back view with a sample name and year
  6. Worn at 16 in over a knit, cat on the lap
  7. Scale shot beside a US dime
  8. Gift box, open, with a small paper tag
  9. Styled: the pendant beside a worn leather collar tag
  10. Process: graver cutting the pad under magnification (Mark of the Maker)
  11. Video 8 to 12 s: engraving strokes, then the disc turned to show the name
- Visualization prompt (internal mock only, never a listing image): "Product photograph, small solid gold disc pendant 10 mm with a recessed intaglio paw print catching shadow, on a worn leather dog collar on a wooden table, soft side light, extreme close-up, 35mm film grain, no retouching"

### L10 Twin Eye  (`10-twin-eye`)

- Product: Set of 2 solid gold chain bracelets: one carries the almond eye outline in open wire, the other the 4 mm cobalt enamel iris; together they complete the eye. One initial on each clasp tag.
- Trend anchor: Family Reimagined (friend gifts +1,400%, matching sets). Secondary: Merrymaxxing (cobalt enamel); brand pillar: the eye.
- Title (139 chars): Matching Evil Eye Bracelet Set of 2 in Solid Gold, Twin Eye Friendship Bracelets with Cobalt Enamel and Engraved Initials, Best Friend Gift
- Category: Jewelry > Bracelets > Chain & Link Bracelets
- Shop section: Bracelets (cross-link from Evil Eye via tags)
- Tags (13): evil eye bracelets | matching bracelets | friendship bracelets | best friend bracelet | sister bracelet set | couples bracelet set | friend group gift | friendsmas gift | nazar bracelet gold | cobalt enamel eye | solid gold evil eye | set of 2 bracelets | initial bracelet set
- Materials: Solid gold, Vitreous enamel, 14K gold, 10K gold, 18K gold
- Attributes: Primary color: Gold, Secondary color: Blue, Holiday: Christmas, Occasion: Birthday, Recipient: Women, Style: Minimalist
- Variations: Karat: 10K / 14K / 18K (price varies); Metal Color: Yellow / White / Rose; Length: 6.5 / 7 / 7.5 inches for the set (two different lengths by note in the personalization field)
- Personalization: On, optional, max 40 characters. Instructions: "Two initials, almond bracelet first, then iris bracelet (example: H / C). Optional: a second length if the wrists differ (example: H 6.5 / C 7)."
- Processing time: 5 to 7 business days. Quantity: 20. Renewal: automatic. Who made it: a member of my shop. When: made to order. What: a finished product.
- Price basis: est. 1.9 g in 14K, 2 make-floor(s), adders 75 (two make-floors + enamel cell 25 + two tag engravings 50) -> 14K base 905
- Price ladder (original list price for the base option; chain steps follow the shop's standard):
  - 10K: list $848.65 (shows as $594.05 while the shop-wide 30% sale runs)
  - 14K: list $1,144.82 (shows as $801.37 while the shop-wide 30% sale runs)
  - 18K: list $1,499.72 (shows as $1,049.80 while the shop-wide 30% sale runs)
- Description (paste as is):

```text
Two bracelets that make one eye. The first carries the almond outline in open solid gold wire; the second carries the iris, a 4 mm gold dome with a cobalt blue kiln-fired enamel center. Each is a quiet bracelet alone. Held wrist to wrist, they complete the eye that has watched over this part of the world for five thousand years. One for you, one for the friend, sister or partner you would call first.

- The almond measures 9 x 5 mm in 0.9 mm wire; the iris dome is 4 mm. Both sit as connectors in a 1.2 mm solid gold cable chain with spring ring clasp and a small gold tag at the clasp.
- Personalization: one initial engraved on each tag, written in the order almond, then iris. Leave the field blank if you prefer them plain.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose, and a length of 6.5, 7 or 7.5 inches for the set. If you need two different lengths, write both in the personalization field.
- The enamel is fired by hand in a recessed cell with a polished gold rim, in the same cobalt as our Evil Eye collection, so the set stacks with it.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping. The two bracelets arrive in separate gift boxes.
- Please check the spelling at checkout; engraved pieces are made specifically for you.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.
```

- Manufacturing note for Efe: Bracelet A (almond): open almond outline 9 x 5 mm formed from 0.9 mm round wire, ends soldered, two 1.2 mm ID loops soldered at the points as chain connectors. Bracelet B (iris): 4 mm domed disc, 1.2 mm high, with a 2.6 mm recessed cell 0.4 mm deep for opaque cobalt enamel (same color code as the Evil Eye collection), polished rim, two connector loops at 3 and 9 o'clock on the back edge. Both on 1.2 mm cable chain, spring ring clasp, with a 4 x 6 mm oval tag at the clasp for the initial (1.3 mm cap height). Chain lengths 6.5, 7, 7.5 in; cut each bracelet to its own length when two are requested. Packaging: two boxes. Hallmark on the tags. Est. 14K weight 1.9 g per set (almond 0.15, iris 0.35, two chains 1.2, clasps and tags 0.2).
- Photo plan (Etsy slots 1 to 10, then the video slot; shoot spec in section 5):
  1. Hero: two wrists side by side so almond and iris complete the eye, soft daylight (Family Reimagined moment)
  2. Each bracelet alone on a wrist, two frames in one image
  3. Macro of the cobalt iris dome, raking light
  4. Macro of the almond wire and the clasp tag with an initial
  5. Stacked with an existing Evil Eye bracelet from the shop
  6. Two friends at a Friendsmas table, hands on the tablecloth, candles
  7. Metal color options on dark linen
  8. Two gift boxes open side by side
  9. Flat lay forming the eye on cream linen, overhead
  10. Process: wet-packing cobalt enamel into the iris cell (Mark of the Maker)
  11. Video 8 to 12 s: two wrists move together until the eye closes
- Visualization prompt (internal mock only, never a listing image): "Product photograph, two delicate solid gold chain bracelets on two wrists held side by side, one with a small open almond outline and the other with a tiny domed cobalt blue enamel iris, together forming an eye, soft daylight, 35mm film grain, no retouching"


## 4. Pricing model (code)

```python
FLOOR, PER_GRAM, K10, K18, LIST, SALE = 320, 100, 1/1.349, 1.31, 1.265, 0.70

def ladder(grams14, pieces=1, adders=0):
    base14 = FLOOR * pieces + PER_GRAM * grams14 + adders
    out = {}
    for k, f in (("10K", K10), ("14K", 1.0), ("18K", K18)):
        lst = round(base14 * f * LIST, 2)
        out[k] = {"list": lst, "sale": round(lst * SALE, 2)}
    return out
```

When Efe confirms a cast weight, update `grams14` in that listing's JSON, rerun `pricing.py` (wrap the function above; it reads every `listings/*.json`, writes the ladder back into the file and prints a table) and re-validate.

## 5. Photography spec (applies to every photo plan above)

Canon 50mm, ISO 400 to 800, f/1.8 to 2.8, natural light only, 35mm grain, no filters, no retouching. For the 1:1 detail frames use f/2.8 and the closest focusing distance (an extension tube is allowed) so the whole enamel cell or engraving stays sharp. Etsy: 10 image slots, first image square-safe at 2000 px or more, plus one video of 5 to 15 seconds without sound. Trend styling per Etsy: deep backgrounds and warm light for the Operatic Drama pieces (L01 to L03), texture and shine close-ups for Merrymaxxing (L04, L05), hands-at-work and process video for Mark of the Maker (L06, L07, and one process frame in every listing), the piece in its moment for Family Reimagined (L08 to L10). Listing images are real photographs of real samples; the visualization prompts are for internal mocks only.

## 6. Execution plan (write this to `PLAN.md` as checkboxes and keep it current)

### Task 0: Locate the project and set up the folder
- [ ] Find the Artifact Studio Jewelry project folder (search for `byArtifactStudio`, `artifact-studio-jewelry` or `ArtifactStudioJewelry` in `~/Projects`, `~/Documents`, iCloud Drive and the JadeGoldNYC repo). If nothing is found, ask one question: where to create it.
- [ ] Create `<project>/listings/fw26-trend-edit/` with subfolders `listings/`, `exports/`, `production/`, `photography/`.
- [ ] Save this brief verbatim as `BRIEF.md`. Write `PLAN.md` (this section as checkboxes) and `state.json`:

```json
{
  "capsule": "fw26-trend-edit",
  "created": "2026-10-17",
  "etsy_mode": null,
  "listings": {
    "01-seal-pin": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "02-ishtar-rosette": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "03-fibula": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "04-ur-band": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "05-nar-pomegranate": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "06-wedge-cuneiform": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "07-thaw-hoops": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "08-split-infinity": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "09-paw-seal": {"status": "pending", "etsy_listing_id": null, "errors": []},
    "10-twin-eye": {"status": "pending", "etsy_listing_id": null, "errors": []}
  }
}
```

Status values, in order: `pending`, `drafted` (JSON and MD written), `validated`, `approved` (Husam said yes to the copy), `staged` (Etsy draft exists), `done`. Side status: `blocked`.

### Task 1: Write the validator before any listing file
- [ ] Create `validate_listings.py` with exactly this content:

```python
import json, re, sys, glob

BANNED = {"\u2014": "em dash", "\u2013": "en dash", "\u00e2": "a circumflex", "\u00c2": "A circumflex"}
FORBIDDEN = ["gilded", "hand painted", "hand-painted", "plated", "customer", "placeholder", "tbd", "lorem"]
VOCAB = ["heirloom jewelry", "opera inspired", "vintage style", "maximalist", "bold color", "whimsical",
         "hand forged", "hand stamped", "hand textured", "hand engraved", "hand enameled", "kiln fired",
         "handmade", "friend group gift", "friendsmas", "matching", "custom pet gift", "personalized",
         "gemstone", "sculptural", "lapel pin"]

def check(l):
    e = []
    t = l["title"]
    if len(t) > 140: e.append(f"title {len(t)} chars")
    if any(c in "$^`" for c in t): e.append("title has $ ^ or backtick")
    if len([w for w in re.findall(r"[A-Za-z]{2,}", t) if w.isupper()]) > 3: e.append("more than 3 all-caps words")
    if len(l["tags"]) != 13: e.append(f"{len(l['tags'])} tags, need 13")
    for tag in l["tags"]:
        if len(tag) > 20: e.append(f"tag over 20: {tag}")
        if not re.fullmatch(r"[a-z0-9 ]+", tag): e.append(f"tag characters: {tag}")
    if len({x.lower() for x in l["tags"]}) != 13: e.append("duplicate tags")
    if not 1 <= len(l["materials"]) <= 13 or any(len(m) > 45 for m in l["materials"]): e.append("materials")
    blob = json.dumps(l, ensure_ascii=False)
    for ch, name in BANNED.items():
        if ch in blob: e.append(f"banned character: {name}")
    d = l["description"].lower().replace("nothing plated or filled", "")
    for p in FORBIDDEN:
        if p in d: e.append(f"forbidden phrase: {p}")
    if re.search(r"\bvintage\b(?! style)(?! inspired)", d): e.append("bare vintage claim")
    for must in ["made to order", "new jersey", "gift message", "solid"]:
        if must not in d: e.append(f"description missing: {must}")
    p = l.get("personalization", {})
    if p.get("enabled"):
        if len(p.get("instructions", "")) > 256: e.append("personalization instructions over 256")
        if "check the spelling" not in d: e.append("engraved piece needs the spelling notice")
    hay = (t + " " + " ".join(l["tags"]) + " " + l["description"]).lower()
    if len([v for v in VOCAB if v in hay]) < 2: e.append("fewer than 2 trend terms")
    pr = l["prices"]
    if not pr["10K"]["list"] < pr["14K"]["list"] < pr["18K"]["list"]: e.append("price ladder order")
    return e

bad = 0
for path in sorted(glob.glob("listings/*.json")):
    l = json.load(open(path, encoding="utf-8"))
    errs = check(l)
    print(("FAIL " if errs else "ok   ") + path, "; ".join(errs))
    bad += bool(errs)
sys.exit(1 if bad else 0)
```

- [ ] Run `python3 validate_listings.py` with no files present. Expected: no output, exit 0.

### Task 2: One listing at a time (repeat for L01 to L10, in order)
- [ ] Set `state.json` -> `drafted` after writing `listings/<id>-<slug>.json` with keys: `id, slug, name, title, category, section, tags, materials, attributes, variations, personalization, processing_days, quantity, prices, description, trend, trend_terms, manufacturing_note, photo_plan, visualization_prompt`. Copy the values from section 3 exactly; prices from the ladder shown there.
- [ ] Write `listings/<id>-<slug>.md`: a copy-paste sheet in the order of Etsy's listing form (Photos plan, Video, Title, About this listing, Category, Renewal, Type, Description, Section, Tags, Materials, Attributes, Price and Quantity, Variations, Personalization, Shipping profile: "Free US shipping, ships from West New York NJ", Return policy: shop default).
- [ ] Run `python3 validate_listings.py`. Expected: `ok   listings/<id>-<slug>.json`. If FAIL, fix the JSON and MD, rerun, maximum 3 cycles, then `blocked`.
- [ ] Set status `validated`. Show Husam the title, the first 300 characters of the description and the 13 tags in one message, ask "Approve L<id>?" and wait. On yes set `approved`; on edits apply them, revalidate, ask again.
- [ ] Commit if the project is a git repo: `git add listings/ state.json PLAN.md && git commit -m "fw26: L<id> <name> validated"`.

### Task 3: Exports and briefs (after all ten are `approved` or `blocked`)
- [ ] `exports/fw26-listings.xlsx` with openpyxl: sheet `Overview` (the table in section 3 plus status), one sheet per listing (two columns, Field and Value, wrap text, column B width 110), sheet `Tags` (13 columns for QA), sheet `Pricing` (grams, adders, 14K base, ladders, a note that Efe's weights override). Also `exports/fw26-listings.csv` (one row per listing, tags joined with commas) for eRank or Alura imports.
- [ ] `production/manufacturing-brief-efe.md`: the ten manufacturing notes, a tools-to-make list (wedge punch set in three sizes; paw templates dog and cat; rosette, seal cylinder, pomegranate and infinity masters; Ur Band master per size), the alloy questions (enamel on 10K yellow, white and rose; palladium white for the Thaw tips) and the weights table to fill in.
- [ ] `photography/photo-plan.md`: the shoot spec from section 5, then the ten plans, grouped by trend styling so the shoot day runs in four setups (velvet and warm light; cream linen and raking light; the bench; people and pets).
- [ ] Commit: `git commit -am "fw26: exports, production brief, photo plan"`.

### Task 4: Etsy drafts (gated, drafts only, never publish, never touch existing listings)
- [ ] Detect mode and write it to `state.json.etsy_mode`:
  - `api` if `ETSY_API_KEY` and an OAuth token with `listings_w` scope are available in the environment or the project's `.env`;
  - else `browser` if Husam approves using Playwright with his logged-in Chrome profile;
  - else `manual`: stop here and hand over the xlsx and the per-listing MD files.
- [ ] `api` mode, per listing: `GET /v3/application/listings/4590337023` once to copy `shipping_profile_id`, `return_policy_id`, the shop section ids and the variation structure; resolve `taxonomy_id` via `GET /v3/application/seller-taxonomy/nodes`; build the payload for `POST /v3/application/shops/{shop_id}/listings` with `state: "draft"`, `who_made: "collective"` (the UI's "a member of my shop"; Efe makes), `when_made: "made_to_order"`, `is_supply: false`, `quantity: 20`, `shipping_profile_id` and `return_policy_id` copied from the reference listing (confirm them with `GET /v3/application/shops/{shop_id}/shipping-profiles` and `GET /v3/application/shops/{shop_id}/policies/return`), `shop_section_id` from `GET /v3/application/shops/{shop_id}/sections`, the 14K base list price as `price`, `tags`, `materials`, `is_personalizable`, `personalization_is_required`, `personalization_char_count_max`, `personalization_instructions`; then `PUT /v3/application/listings/{listing_id}/inventory` with the per-variation offerings and prices from the ladder, and one `PUT /v3/application/shops/{shop_id}/listings/{listing_id}/properties/{property_id}` per attribute. Show the payload, wait for yes, send, record `etsy_listing_id`, set `staged`.
- [ ] `browser` mode, per listing: open Shop Manager, use Copy on listing 4590337023 so shipping, policies and variation structure are inherited, replace every field from the MD sheet, remove the inherited photos, choose "Save as draft". Show a screenshot before saving, wait for yes, save, read the new listing id from the URL, set `staged`.
- [ ] After all ten: set `done` for staged listings and write `BUILD-REPORT.md` (what exists where, what is blocked and why, Efe's open inputs, photo day checklist, next steps).

### Task 5: Capture (gated where it leaves the project folder)
- [ ] If the Curated Chaos Universe vault is reachable, search it for an existing Artifact Studio Jewelry note and write one decision note that follows the vault's CLAUDE.md conventions and frontmatter, in the domain the vault assigns to Artifact Studio (03 Creation (Studio) unless the vault's rules say otherwise): the decision (10 new designs for the FW26 Trend Edit rather than rewrites), the trend-to-design map, the pricing model and the open inputs. Link it by wikilink to the existing shop note. Do not create top-level folders. Capture meaning, not this brief.
- [ ] Ask once whether to create three Apple Reminders on the Studio list: "Efe: confirm FW26 cast weights (10 designs)", "Efe: make wedge punch set and paw templates", "FW26 photo day: samples, four setups". Only on yes.

## 7. Definition of done

Ten JSON and MD files validated; `state.json` shows every listing `approved` or `blocked` with reasons; the xlsx, csv, manufacturing brief and photo plan exist; Etsy drafts exist for every approved listing when a mode was available; `BUILD-REPORT.md` lists Efe's open inputs (weights, alloy answers, processing times) and the photo day checklist; no existing listing was modified; nothing was published.

NEXT STEP for the first session: run Task 0, then build and validate L01 only, and stop for approval.
