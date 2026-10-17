"""FW26 Trend Edit: listing source -> listings/<id>-<slug>.json + .md

Copy is taken from BRIEF.md section 3. Prices are recomputed with the brief's section 4
model and must equal the ladder printed in the brief, or nothing is written.
Run from this folder: python3 build_listings.py [L01 ...]   (no argument = every listing defined here)

Deviations from the brief are recorded per listing under "deviations" with the evidence.
"""
import json, sys, pathlib

HERE = pathlib.Path(__file__).parent
FLOOR, PER_GRAM, K10, K18, LIST, SALE = 320, 100, 1/1.349, 1.31, 1.265, 0.70


def ladder(grams14, pieces=1, adders=0):
    base14 = FLOOR * pieces + PER_GRAM * grams14 + adders
    out = {}
    for k, f in (("10K", K10), ("14K", 1.0), ("18K", K18)):
        lst = round(base14 * f * LIST, 2)
        out[k] = {"list": lst, "sale": round(lst * SALE, 2)}
    return out


ABOUT = {"who_made": "A member of my shop", "what": "A finished product", "when_made": "Made to order"}

LISTINGS = {
 "L01": {
  "id": "L01", "slug": "seal-pin", "name": "Seal Pin",
  "title": "Men's Lapel Pin in Solid Gold, Fluted Cylinder Seal Stick Pin with Engraved Initials, Heirloom Suit and Tuxedo Pin, Gift for Him",
  "category": "Accessories > Pins & Clips > Hat Pins & Stick Pins",
  "taxonomy_id": 11316,
  "section": "Brooches & Pins (new section; also tag the listing in For Him via title and tags)",
  "tags": ["mens lapel pin", "gold lapel pin", "solid gold brooch", "mens brooch", "stick pin for men",
           "tuxedo lapel pin", "groomsmen gift gold", "heirloom jewelry", "engraved lapel pin", "cylinder seal",
           "wedding lapel pin", "gift for him gold", "opera inspired"],
  "materials": ["Solid gold", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Wedding",
                 "Recipient": "Men", "Style": "Classic"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False}],
  "personalization": {"enabled": True, "required": False, "max_chars": 5,
                      "instructions": "Up to 3 initials for the end cap, typed exactly as you want them cut (example: H.A. or HEA). Leave blank for no engraving."},
  "processing_days": "5 to 7 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 2.4, "pieces": 1, "adders": 65, "adders_detail": "engraving 25 + solid gold pin and clutch 40", "base14": 625},
  "brief_prices": {"10K": (586.08, 410.26), "14K": (790.62, 553.43), "18K": (1035.72, 725.00)},
  "description": """A lapel pin for men who dress for the occasion. The Seal Pin takes its form from the Mesopotamian cylinder seal, the small carved cylinder people once wore on a cord as both ornament and signature. Here it is a fluted solid gold cylinder, 14 mm long, on a stick pin with a solid gold clutch, and the flat end cap is engraved with your initials so the signature idea still holds.

- The cylinder measures 14 x 3.5 mm with twelve flutes, cast from our own hand-carved master and finished by hand; the pin is 45 mm long and sits flat behind a lapel, a scarf or a knit.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Everything is solid and stamped, nothing plated or filled.
- Personalization: up to three initials engraved on the end cap in a plain serif. Type them exactly as you want them cut, or leave the field blank for a plain cap.
- Wear it on a tuxedo lapel for a holiday party or an evening at the opera, or on a coat lapel on an ordinary Tuesday. It reads as heirloom jewelry, not as a novelty pin.
- Made to order at our bench in New Jersey in 5 to 7 business days, then shipped free within the US with a solid gold clutch back and a gift box.
- Gold does not tarnish. If the flutes collect dust, a soft brush and warm soapy water bring the shine back.
- A gift message can be added at checkout. Please check the spelling at checkout; engraved pieces are made specifically for you.""",
  "trend": {"anchor": "Operatic Drama (men's brooches +70%, vintage jewelry +75%)", "secondary": "Family Reimagined (personalized gift)"},
  "trend_terms": ["heirloom jewelry", "opera inspired", "lapel pin", "personalized"],
  "manufacturing_note": "Cylinder 14.0 x 3.5 mm, solid, cast in 14K from a hand-carved wax master with 12 longitudinal flutes 0.3 mm deep; flutes hand-finished with a fine needle file, satin inside the flutes and polished on the ridges. End cap flat, 3.5 mm, polished, engraved after casting (laser or graver, 1.2 mm serif capitals). Stick pin 0.9 mm hard 14K wire, 45 mm, soldered into a 1.0 mm blind hole at the cylinder's top end, tip rounded. Clutch: solid 14K pin protector (findings supplier), no plated parts. Hallmark on the end cap edge. Est. 14K weight 2.4 g (cylinder 1.75, pin 0.37, clutch 0.3). One master serves 10K, 14K and 18K.",
  "photo_plan": [
   "Hero on black velvet, warm window light from the left, pin at 45 degrees, flutes catching light",
   "On a tuxedo or dark wool lapel, worn, chest crop, shallow depth",
   "Macro of the flutes and the engraved end cap",
   "In an open palm for scale",
   "Back view with the clutch set behind a lapel",
   "Three karats side by side on dark jacquard (yellow, white, rose)",
   "Gift box, open, pin seated, warm light",
   "Engraving close-up with a sample monogram",
   "Styled flat lay: pin, cufflinks, a folded pocket square, a program from a concert",
   "Process: hands finishing a flute with a needle file (Mark of the Maker)"],
  "video": "Video 8 to 12 s: pin pushed through a lapel, clutch set, hand smooths the fabric",
  "visualization_prompt": "Product photograph, solid yellow gold fluted cylinder lapel pin 14 mm on a slim stick pin, resting on black silk velvet, warm late-afternoon window light, shallow depth of field, 35mm film grain, no retouching, muted palette",
  "deviations": [
   {"field": "category",
    "brief": "Jewelry > Brooches, Pins & Clips > Lapel Pins",
    "used": "Accessories > Pins & Clips > Hat Pins & Stick Pins (taxonomy 11316)",
    "evidence": "Live Etsy seller taxonomy read 2026-10-17 through ops/drafts-push?taxonomy=: no node contains 'lapel'; Pins & Clips sits under Accessories with children Hat Pins & Stick Pins (11316), Pins & Pinback Buttons (41), Shawl Pins (6066), Brooches (1201). A stick pin with a clutch is a stick pin."}],
 },
 "L02": {
  "id": "L02", "slug": "ishtar-rosette", "name": "Ishtar Rosette",
  "title": "Rosette Brooch in Solid Gold with Garnet, Convertible Brooch and Pendant, Vintage Style Heirloom Jewelry, Opera Inspired Gift for Her",
  "category": "Accessories > Pins & Clips > Brooches",
  "taxonomy_id": 1201,
  "section": "Brooches & Pins (new section)",
  "tags": ["gold brooch", "solid gold brooch", "garnet brooch", "vintage style brooch", "brooch pendant",
           "convertible brooch", "heirloom jewelry", "opera inspired", "rosette brooch", "star of ishtar",
           "mesopotamian jewelry", "capelet brooch", "gift for her gold"],
  "materials": ["Solid gold", "Garnet", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "Red", "Holiday": "Christmas", "Occasion": "Anniversary",
                 "Recipient": "Women", "Style": "Historical"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False},
                 {"property": "Chain", "values": ["None", "16 in", "18 in", "20 in"], "price_varies": True,
                  "note": "chain is a 1.2 mm solid gold cable with spring ring"}],
  "personalization": {"enabled": False},
  "processing_days": "3 to 5 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 3.2, "pieces": 1, "adders": 130, "adders_detail": "garnet and bezel 30 + brooch fittings 60 + openwork finishing 40; chain add-on priced separately", "base14": 770},
  "brief_prices": {"10K": (722.05, 505.43), "14K": (974.05, 681.83), "18K": (1276.01, 893.21)},
  "chain": {"none_label": "None", "lengths": ["16 in", "18 in", "20 in"], "addon_base14": 150,
            "brief_addon16_list": {"10K": 140.66, "14K": 189.75, "18K": 248.57},
            "steps_base": {"10K": [20, 20], "14K": [20, 30], "18K": [40, 40]},
            "steps_source": "Reference listing 4590337023 (Bauble) panel bases, read 2026-10-17: 10K 430/450/470, 14K 580/600/630, 18K 760/800/840 at 16/18/20 in"},
  "description": """An eight-petal rosette, the star of Ishtar that appears on Mesopotamian seals and gates, carved as an openwork brooch in solid gold and set with a deep red garnet at its center. A hidden tube behind the top petal takes a chain, so the same piece pins to a velvet lapel or a capelet one night and hangs as a pendant the next.

- The rosette measures 22 mm across and 1.2 mm thick, cast from our own hand-carved master and finished by hand so the edges stay crisp and the back is as clean as the front.
- The garnet is a 5 mm cabochon in a closed bezel; under warm light its color sits between wine and ember.
- Brooch fittings are solid gold: a pin stem, a joint and a safety catch that rolls over so the pin cannot open on its own.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Add a 1.2 mm cable chain in 16, 18 or 20 inches if you want to wear it as a pendant from day one.
- It is made for the season of dressing up: a vintage style brooch for an evening coat, an opera night or a holiday table, and it stays in rotation long after.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Garnet is hard enough for daily wear. Keep the piece away from knocks and clean it with a soft cloth. A gift message can be added at checkout.""",
  "trend": {"anchor": "Operatic Drama (vintage jewelry +75%, ornate brooches)", "secondary": "Merrymaxxing (gemstone)"},
  "trend_terms": ["vintage style", "heirloom jewelry", "opera inspired"],
  "manufacturing_note": "Rosette 22 mm diameter, 1.2 mm sheet thickness equivalent, eight pointed petals with pierced (open) spaces between the inner ring and the petal tips, cast from a hand-carved wax master; openwork cleaned with a saw and needle files, edges crisp, back flat and polished. Center: 5 mm round garnet cabochon in a closed-back bezel cup (0.4 mm wall) soldered to the rosette, bezel burnished over the stone. Brooch fittings in solid 14K: pin stem 0.8 mm hard wire, joint (hinge) and revolving safety catch, soldered on the back at 2 and 10 o'clock so the piece hangs level. Hidden bail: 2.0 mm OD gold tube, 6 mm long, soldered horizontally behind the top petal, sized to pass a 1.2 mm cable chain. Est. 14K weight 3.2 g (rosette 2.6, fittings and bezel 0.6). Chain add-on: 1.2 mm cable 16 in, est. 1.4 g, spring ring clasp.",
  "photo_plan": [
   "Hero on deep green velvet, warm side light, brooch pinned at a coat lapel, garnet catching light",
   "Worn as a pendant on an 18 in chain against a dark knit",
   "Macro of the garnet and bezel",
   "Back view: pin, safety catch, hidden tube bail",
   "On a capelet at the shoulder, atmospheric low light (Operatic Drama)",
   "Three metal colors on dark jacquard fabric",
   "In an open palm for scale",
   "Gift box, open",
   "Styled: brooch on a velvet evening bag beside opera glasses",
   "Process: hands cleaning the openwork with a saw frame (Mark of the Maker)"],
  "video": "Video 8 to 12 s: unpin from the lapel, thread the chain, lift as a pendant",
  "visualization_prompt": "Product photograph, solid gold openwork eight-petal rosette brooch 22 mm with a deep red garnet cabochon center, pinned to dark green velvet, candlelit warm light, shallow depth of field, 35mm film grain, no retouching",
  "deviations": [
   {"field": "category",
    "brief": "Jewelry > Brooches, Pins & Clips > Brooches",
    "used": "Accessories > Pins & Clips > Brooches (taxonomy 1201)",
    "evidence": "Live Etsy seller taxonomy read 2026-10-15: the Jewelry root has no Brooches node; Brooches is 1201 under Accessories > Pins & Clips (the Weddings twin 1682 is excluded). Same node as the live W05 Pine Needle Brooch draft, which passed read-back."},
   {"field": "chain steps for 18 and 20 in",
    "brief": "the shop's standard step, each extra 2 inches adds about 14 to the 10K base",
    "used": "the reference listing's own base steps: 10K +20 / +20, 14K +20 / +30, 18K +40 / +40",
    "evidence": "Panel prices of listing 4590337023 (Bauble) read 2026-10-17: 10K 430 / 450 / 470, 14K 580 / 600 / 630, 18K 760 / 800 / 840 at 16 / 18 / 20 in. No step there is 14."}],
 },
 "L03": {
  "id": "L03", "slug": "fibula", "name": "Fibula",
  "title": "Solid Gold Shawl Pin, Hand Forged Fibula Cape Clasp for Capelets, Scarves and Cardigans, Ancient Style Heirloom Sweater Pin",
  "category": "Accessories > Pins & Clips > Shawl Pins",
  "taxonomy_id": 6066,
  "section": "Brooches & Pins (new section)",
  "tags": ["shawl pin", "gold shawl pin", "cape clasp", "capelet pin", "fibula brooch", "sweater pin", "scarf pin gold",
           "hand forged jewelry", "heirloom jewelry", "cloak pin", "cardigan clip", "opera inspired", "solid gold brooch"],
  "materials": ["Solid gold", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Anniversary",
                 "Recipient": "Women", "Style": "Historical"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False}],
  "personalization": {"enabled": False},
  "processing_days": "3 to 5 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 2.9, "pieces": 1, "adders": 100, "adders_detail": "forging and work-hardening 80 + catch forming 20", "base14": 710},
  "brief_prices": {"10K": (665.79, 466.05), "14K": (898.15, 628.70), "18K": (1176.58, 823.61)},
  "description": """Before buttons, there was the fibula: one length of metal coiled into a spring, bent into a bow and finished with a catch. Ours is forged from a single piece of solid gold wire, so there is no solder joint to fail, and it closes a capelet, a shawl, a scarf or an open cardigan with a shape people have trusted for three thousand years.

- The fibula measures 38 mm long with a 1.3 mm pin; the bow is hammered flat to 2.5 mm, and the double-coil spring keeps tension so the pin stays closed in knits and woven fabrics.
- Forged and work-hardened by hand at our bench, which is why the surface carries soft hammer facets rather than a mirror polish. No two are identical.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Solid and stamped, nothing plated or filled.
- Wear it high on a capelet for an evening out, through a scarf on a coat, or as a sweater pin at the collarbone. It does the work of a brooch without the weight of one, and it is opera inspired in the oldest sense: dressing with intent.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Gold does not tarnish. If the pin tip ever dulls on heavy wool, a few strokes on a fine emery board restore it. Avoid very loose, open weaves, where any pin can slip.
- A gift message can be added at checkout.""",
  "trend": {"anchor": "Operatic Drama (capelets +47%)", "secondary": "Mark of the Maker (hand forged)"},
  "trend_terms": ["hand forged", "heirloom jewelry", "opera inspired"],
  "manufacturing_note": "One piece of 1.3 mm round 14K wire, approx. 120 mm, annealed. Form: pin shank 38 mm; two full coils (spring) of 4 mm ID at the head; bow forged flat with a planishing hammer to 2.5 x 0.8 mm over 30 mm, leaving visible facets; foot bent into a rolled catch (hook) 3 mm deep that receives the pin tip. Work-harden the pin and spring after forming (planish, then twist-harden; do not anneal again). Pin tip ground to a blunt point and polished so it does not snag fibers. Hallmark stamped on the inside of the bow. Est. 14K weight 2.9 g. Note for Efe: 18K is softer; use 1.4 mm wire for the 18K version to keep spring tension.",
  "photo_plan": [
   "Hero: fibula closing a camel cashmere capelet at the shoulder, warm window light",
   "Through a wool scarf on a dark coat, street light",
   "Macro of hammer facets on the bow",
   "Macro of the coil spring and the catch",
   "Open and closed positions side by side on linen",
   "Worn as a sweater pin at the collarbone of a fine knit",
   "In an open palm for scale",
   "Three metal colors on dark jacquard",
   "Gift box, open",
   "Process: hands forging the bow with a planishing hammer on a steel block (Mark of the Maker)"],
  "video": "Video 8 to 12 s: pin slides through knit, catch closes, hand smooths the shawl",
  "visualization_prompt": "Product photograph, hand forged solid gold fibula pin 38 mm with hammered flat bow and coiled spring, fastening a camel cashmere capelet at the shoulder, warm natural light, shallow depth of field, 35mm film grain, no retouching",
  "deviations": [
   {"field": "category",
    "brief": "Jewelry > Brooches, Pins & Clips > Brooches",
    "used": "Accessories > Pins & Clips > Shawl Pins (taxonomy 6066)",
    "evidence": "The brief's path does not exist (no Brooches under Jewelry, read 2026-10-15). Of the two real nodes, Brooches 1201 and Shawl Pins 6066, the title and the first two tags lead with 'shawl pin', so the category matches what the buyer types. Brooches 1201 stays the fallback if Husam prefers it."},
   {"field": "18K wire (note, price not changed)",
    "brief": "18K uses 1.4 mm wire instead of 1.3 mm (manufacturing note)",
    "used": "price ladder unchanged",
    "evidence": "(1.4/1.3)^2 = 1.16, so the 18K piece carries about 0.46 g more metal than the 2.9 g basis; in the brief's own model that is about +60 on the 18K base (+77 on the list price). The 18K sale price of 823.61 absorbs it; recompute when Efe weighs an 18K sample."}],
 },
 "L04": {
  "id": "L04", "slug": "ur-band", "name": "Ur Band",
  "title": "Mosaic Enamel Ring in Solid Gold, Lapis Blue Red and White Kiln Fired Band, Bold Color Statement Ring, Maximalist Stacking Band",
  "category": "Jewelry > Rings > Bands",
  "taxonomy_id": 1232,
  "section": "Rings",
  "tags": ["enamel ring", "mosaic ring", "bold color ring", "maximalist ring", "statement ring gold", "stacking ring enamel",
           "colorful gold ring", "kiln fired enamel", "solid gold band ring", "lapis blue ring", "whimsical ring",
           "hand enameled ring", "sumerian jewelry"],
  "materials": ["Solid gold", "Vitreous enamel", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Blue", "Secondary color": "Red", "Holiday": "Christmas", "Occasion": "Birthday",
                 "Recipient": "Women", "Style": "Whimsical"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Ring Size", "values": [f"US {s:g}" for s in [x / 2 for x in range(8, 21)]], "price_varies": False},
                 {"property": "Palette", "values": ["Ur", "Festival"], "price_varies": False,
                  "note": "Ur = lapis blue, cranberry red, shell white; Festival = cobalt, cranberry, emerald, saffron, pink (explained in the description)"}],
  "metal_color": "Yellow gold only (brief: the warm walls are part of the palette, and the alloy must take enamel firing)",
  "personalization": {"enabled": False},
  "processing_days": "3 to 5 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 2.9, "pieces": 1, "adders": 120, "adders_detail": "12 cells, 3 to 5 colors, multiple firings and flush stoning", "base14": 730},
  "brief_prices": {"10K": (684.54, 479.18), "14K": (923.45, 646.41), "18K": (1209.72, 846.80)},
  "description": """The Standard of Ur, a 4,500-year-old box from a Sumerian tomb, is inlaid in exactly three materials: lapis lazuli, red limestone and white shell. The Ur Band borrows that palette and nothing else. Twelve cells run around a solid gold band, each filled by hand with kiln-fired vitreous enamel in lapis blue, cranberry red and shell white, then stoned flush and polished so the gold walls between them read as fine lines.

- The band is 3.5 mm wide and 1.4 mm thick with a rounded comfort fit inside; the cells are 0.4 mm deep, so the enamel sits protected within the gold.
- Enamel is glass fused to gold at around 800 C, fired cell by cell. Small variations in tone from one firing to the next are the mark of the hand, not a fault.
- Yellow gold only, because the warm walls are part of the palette. Choose solid 10K, 14K or 18K and your US size from 4 to 10 in half sizes. Wider bands fit tighter, so if you sit between sizes, go up.
- Palette: Ur (lapis, red, white) for the original, or Festival (cobalt, cranberry, emerald, saffron and pink) when you want the full maximalist stack.
- One Ur Band is a quiet accent of bold color. Two or three stacked with plain gold bands is the mood of this season, and it still works in July.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.""",
  "trend": {"anchor": "Merrymaxxing (bold color, whimsy +110%)", "secondary": "Mark of the Maker (fired cell by cell by hand)"},
  "trend_terms": ["bold color", "maximalist", "whimsical", "kiln fired", "hand enameled"],
  "manufacturing_note": "Band 3.5 mm wide x 1.4 mm thick, comfort-fit inner profile, cast per size from a master ring (CAD or hand-carved) with twelve rectangular recessed cells 2.3 x 1.4 mm, 0.4 mm deep, separated by 0.5 mm gold walls; cells have a slightly undercut floor to key the enamel. Champleve process: degrease, counter-enamel not required at this depth, wet-pack lead-free vitreous enamel (opaque lapis blue, opaque cranberry red, opaque white; Festival adds opaque emerald, saffron and pink), fire at 780 to 820 C, two to three fills per cell, stone flush with alundum/diamond stick under water, flash fire for gloss, final polish on the gold only. Ur sequence: blue, red, white, repeated four times. Hallmark inside. Est. 14K weight 2.9 g at US 7. Yellow gold only (alloy must tolerate enamel firing; confirm Efe's 10K yellow alloy is enamel-safe, otherwise offer the Ur Band in 14K and 18K only).",
  "photo_plan": [
   "Hero macro: band on a matte cream surface, raking light so the enamel cells show their flush gloss (Merrymaxxing close-up)",
   "On hand, stacked between two plain gold bands, saturated knit sleeve",
   "Ur and Festival palettes side by side",
   "360 detail: three cells filling the frame, gold walls crisp",
   "Both palettes on fingers of two different hands (friend shot)",
   "Scale shot beside a US quarter",
   "Gift box, open",
   "Reference flat lay: the ring beside lapis, red and white raw materials",
   "Process: wet-packing enamel into cells with a fine brush (Mark of the Maker)",
   "Process: kiln door open, ring glowing on a trivet"],
  "video": "Video 8 to 12 s: slow rotation of the band in warm light, then the stack on a hand",
  "visualization_prompt": "Product photograph, solid yellow gold ring band 3.5 mm with twelve flush enamel cells alternating lapis blue, red and white, on a matte cream linen surface, raking natural light, extreme close-up, 35mm film grain, no retouching",
  "deviations": [
   {"field": "Palette values",
    "brief": "Ur (lapis, red, white) / Festival (cobalt, cranberry, emerald, saffron, pink)",
    "used": "Ur / Festival, with the colors spelled out in the description",
    "evidence": "Short variation values keep the checkout dropdown readable; the description already lists both palettes word for word."},
   {"field": "grid rule (open, raised with Husam at approval)",
    "brief": "Karat x Ring Size US 4 to 10 x Palette, yellow gold only",
    "used": "as the brief: 3 x 13 x 2 = 78 variants",
    "evidence": "CLAUDE.md (2026-09-26) asks for a full Karat x Metal Color x size grid with rings at US 3 to 16 full and half. Metal Color cannot be added here: Palette already takes the third axis and the brief keeps the band yellow for enamel. The size range can be widened: US 3 to 16 would be 3 x 27 x 2 = 162 variants, inside Etsy's 400. Price is flat across sizes (est. 2.9 g at US 7)."},
   {"field": "Etsy push protocol (Task 4)",
    "brief": "Jewelry > Rings > Bands",
    "used": "category kept (node 1232 exists, read 2026-10-17)",
    "evidence": "lib/etsy/listing-protocol.ts has no protocol that resolves to Bands (wedding_band, stacking_ring, sculptural_ring resolve elsewhere); one has to be added before the push."}],
 },
 "L05": {
  "id": "L05", "slug": "nar-pomegranate", "name": "Nar (Pomegranate)",
  "title": "Pomegranate Necklace in Solid Gold, Cranberry Enamel Pendant with Garnet Seeds, Bold Color Charm Necklace, Abundance Gift, Christmas Jewelry",
  "category": "Jewelry > Necklaces > Pendant Necklaces",
  "taxonomy_id": 1229,
  "section": "Necklaces",
  "tags": ["pomegranate necklace", "pomegranate jewelry", "garnet necklace gold", "enamel pendant gold", "bold color necklace",
           "solid gold charm", "abundance gift", "hostess gift gold", "new home gift gold", "anatolian jewelry",
           "whimsical necklace", "red enamel necklace", "christmas necklace"],
  "materials": ["Solid gold", "Vitreous enamel", "Garnet", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Red", "Secondary color": "Gold", "Holiday": "Christmas", "Occasion": "Housewarming",
                 "Recipient": "Women", "Style": "Whimsical"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False},
                 {"property": "Chain Length", "values": ["16 inches", "18 inches", "20 inches"], "price_varies": True}],
  "personalization": {"enabled": False},
  "processing_days": "3 to 5 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 3.0, "pieces": 1, "adders": 70, "adders_detail": "three garnets bead set 45 + enamel cell 25; 16 in chain included in the grams", "base14": 690},
  "brief_prices": {"10K": (647.03, 452.92), "14K": (872.85, 611.00), "18K": (1143.43, 800.40)},
  "chain": {"lengths": ["16 inches", "18 inches", "20 inches"], "addon_base14": 0,
            "steps_base": {"10K": [20, 20], "14K": [20, 30], "18K": [40, 40]},
            "steps_source": "16 in is the base price (the 3.0 g basis includes a 16 in chain); 18 and 20 in follow reference listing 4590337023 (Bauble) panel bases, read 2026-10-17: 10K 430/450/470, 14K 580/600/630, 18K 760/800/840"},
  "description": """The pomegranate has meant abundance, luck and a full house from Mesopotamia to Anatolia for as long as people have been carving it. Ours is a 12 mm solid gold fruit with a crown, its skin in cranberry red kiln-fired enamel and a split that opens onto three garnets set as seeds. The word garnet comes from granatum, the Latin for pomegranate, so the gemstones are not decoration; they are the point.

- The pendant measures 12 x 10 mm plus the crown, cast with an open back so it stays light on the chain, and hangs from a fixed loop that keeps it facing forward.
- Three 1.3 mm garnets are bead set into the split by hand; the enamel is fired in a recessed cell with a polished gold rim.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose, and a 1.2 mm solid gold cable chain with spring ring clasp in 16, 18 or 20 inches.
- It is a bold color piece that happens to be festive, which makes it an easy gift for a new home, a host, a friend who feeds everyone, or yourself, which is allowed.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth.
- A gift message can be added at checkout.""",
  "trend": {"anchor": "Merrymaxxing (gemstones, bold color, whimsy)", "secondary": "Family Reimagined (gift for a household, a host, a friend)"},
  "trend_terms": ["bold color", "whimsical", "gemstone"],
  "manufacturing_note": "Pomegranate body 12 x 10 mm, slightly flattened sphere, cast as an open-backed shell with 0.8 mm walls; six-point crown 2.5 mm tall cast integral; fixed bail loop 1.5 mm ID at the crown. Front: one recessed enamel cell following the body silhouette, 0.4 mm deep, with a 0.5 mm polished gold rim; a vertical split 5 x 1.8 mm left bare in the cell and drilled with three 1.3 mm seats for bead-set round garnets (or 1.3 mm cranberry-red garnets matched to the enamel). Enamel: opaque cranberry red, wet-packed, three fills, fired 780 to 820 C, stoned flush, flash fired; set the garnets after enameling. Chain 1.2 mm cable, spring ring. Est. 14K weight 3.0 g with a 16 in chain (pendant 1.5, chain 1.4, findings 0.1). For white and rose gold, confirm enamel adhesion on Efe's alloys; if not, offer yellow only.",
  "photo_plan": [
   "Hero macro: pendant against a split real pomegranate, seeds and garnets in one frame, warm light (Merrymaxxing texture and shine)",
   "Worn at 18 in on skin above a cream knit collar",
   "Macro of the three garnets inside the split, raking light",
   "Layered with the Wedge pendant at 16 and 20 in",
   "Three metal colors on dark linen",
   "Scale shot in an open palm",
   "Gift box, open, with a sprig of pine",
   "Styled on a holiday table beside a glass of red wine (Family Reimagined moment)",
   "Back view showing the open-back construction",
   "Process: bead-setting a garnet under the microscope (Mark of the Maker)"],
  "video": "Video 8 to 12 s: slow turn in candlelight, enamel gloss and garnet flash",
  "visualization_prompt": "Product photograph, solid gold pomegranate pendant 12 mm with glossy cranberry red enamel skin and three tiny garnets visible in a split, resting on a split real pomegranate on dark linen, warm window light, 35mm film grain, no retouching",
  "deviations": [
   {"field": "chain steps for 18 and 20 in",
    "brief": "the shop's standard step, about 14 on the 10K base per 2 inches",
    "used": "the reference listing's own base steps: 10K +20 / +20, 14K +20 / +30, 18K +40 / +40 (same rule as L02, approved)",
    "evidence": "Panel prices of listing 4590337023 (Bauble) read 2026-10-17."}],
 },
 "L06": {
  "id": "L06", "slug": "wedge-cuneiform", "name": "Wedge",
  "title": "Cuneiform Necklace Hand Stamped in Solid Gold, Personalized Bar Pendant with Engraved Initials, Sumerian Sign for Life, Heart, Home or Star",
  "category": "Jewelry > Necklaces > Pendant Necklaces",
  "taxonomy_id": 1229,
  "section": "Necklaces",
  "tags": ["cuneiform necklace", "cuneiform jewelry", "hand stamped pendant", "personalized bar", "engraved bar pendant",
           "sumerian necklace", "mesopotamian jewelry", "gold bar necklace", "initial necklace", "handmade pendant",
           "ancient script", "gift for her gold", "meaningful necklace"],
  "materials": ["Solid gold", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Graduation",
                 "Recipient": "Unisex adults", "Style": "Historical"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Chain Length", "values": ["16 inches", "18 inches", "20 inches"], "price_varies": True},
                 {"property": "Sign", "values": ["TI (life)", "SHA (heart)", "E (home)", "AN (star, sky)"], "price_varies": False}],
  "metal_color": "Yellow gold as standard; white or rose by message (brief)",
  "personalization": {"enabled": True, "required": False, "max_chars": 8,
                      "instructions": "Up to 8 characters engraved on the back: initials, a year or a short word, typed exactly as you want them cut. Leave blank for a plain back."},
  "processing_days": "5 to 7 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 2.55, "pieces": 1, "adders": 55, "adders_detail": "hand stamping 30 + back engraving 25; 16 in chain included in the grams", "base14": 630},
  "brief_prices": {"10K": (590.77, 413.54), "14K": (796.95, 557.87), "18K": (1044.00, 730.80)},
  "chain": {"lengths": ["16 inches", "18 inches", "20 inches"], "addon_base14": 0,
            "steps_base": {"10K": [20, 20], "14K": [20, 30], "18K": [40, 40]},
            "steps_source": "16 in is the base price (the 2.55 g basis includes a 16 in chain); 18 and 20 in follow reference listing 4590337023 (Bauble) panel bases, read 2026-10-17: 10K 430/450/470, 14K 580/600/630, 18K 760/800/840"},
  "description": """Some of the first writing in the world was made by pressing a reed into wet clay. The marks became wedges, and the wedges became cuneiform. The Wedge pendant is a small bar of solid gold struck by hand with the same wedge shapes, one sign at a time, so every stroke is slightly deeper or lighter than the next. You choose the sign; the back is engraved with your initials or a date.

- The bar measures 16 x 5 mm and 1 mm thick, rolled from solid gold sheet, annealed and hand stamped with three sizes of wedge punch. The surface is brushed, the edges softly rounded.
- Four Sumerian signs to choose from: TI (life), SHA (heart), E (home) and AN (star, sky). The listing photos show each sign next to its meaning.
- Personalization: up to 8 characters engraved on the back, initials, a year or a short word, typed exactly as you want them cut.
- Yellow gold as standard; message us for white or rose. Choose solid 10K, 14K or 18K with a 1.2 mm cable chain and spring ring clasp in 16, 18 or 20 inches.
- Because each bar is struck by hand, spacing and depth vary a little from piece to piece. That variation is the point of the design, and it is why no two Wedges match.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping, gift box included. Please check the spelling at checkout; engraved pieces are made specifically for you.
- Gold does not tarnish; a soft cloth keeps the brushed finish even. A gift message can be added at checkout.""",
  "trend": {"anchor": "Mark of the Maker (hand-stamped marks; hand painted items +280%)", "secondary": "Family Reimagined (personalized gifts +1,400%)"},
  "trend_terms": ["hand stamped", "personalized", "handmade"],
  "manufacturing_note": "Bar 16 x 5 x 1.0 mm cut from rolled 14K sheet, corners radiused 0.6 mm, edges rounded, annealed before stamping. Punch set to be made (hardened steel, three wedge sizes: 1.6, 2.4 and 3.2 mm heads) matching the cuneiform stroke shapes; strike on a steel block with a 200 g hammer, one stroke per wedge, then flatten the back lightly. Signs (Sumerian, Unicode reference for the sign drawings): TI U+122FE, SHA (SA3) U+122AE, E (E2) U+1208D, AN U+1202D; prepare a sign card with the four signs and their stroke order for the bench and for photo 3. Back: engraved up to 8 characters in a plain sans serif, 1.3 mm cap height. Bail: 1.5 mm ID loop soldered at the top short edge so the bar hangs vertically (or two end loops for a horizontal bar if Husam prefers; decide before the master). Finish: fine satin brush, edges bright. Hallmark on the back. Est. 14K weight 2.55 g with 16 in chain (bar 1.05, bail 0.1, chain 1.4).",
  "photo_plan": [
   "Hero macro on raw clay or unglazed stoneware, raking light so the wedge depth reads",
   "The four signs side by side with their meanings printed small on a card (shoppers need this image)",
   "Worn at 18 in on a dark turtleneck",
   "Macro of two Wedges showing the hand variation in depth and spacing",
   "Back view with a sample engraving",
   "Layered with the Nar pendant",
   "Scale shot in an open palm",
   "Three karats on linen (color shift between 10K, 14K, 18K)",
   "Gift box, open",
   "Process: hand striking the punch on the bar, hammer mid-air (Mark of the Maker)"],
  "video": "Video 8 to 12 s: three strikes, bar lifted and turned to the light",
  "visualization_prompt": "Product photograph, small brushed solid gold bar pendant 16 mm hand-stamped with a cuneiform star sign of deep wedge impressions, lying on raw unglazed clay, raking warm light, extreme close-up, 35mm film grain, no retouching",
  "deviations": [
   {"field": "chain steps for 18 and 20 in",
    "brief": "the shop's standard step, about 14 on the 10K base per 2 inches",
    "used": "the reference listing's own base steps (same rule as L02 and L05, approved)",
    "evidence": "Panel prices of listing 4590337023 (Bauble) read 2026-10-17."},
   {"field": "grid rule (as the brief, same pattern as L04)",
    "brief": "Karat x Chain Length x Sign, yellow gold; white or rose by message",
    "used": "as the brief: 3 x 3 x 4 = 36 variants",
    "evidence": "Sign takes Etsy's third variation axis, so Metal Color cannot be a variation; the brief routes white and rose through messages."}],
 },
 "L07": {
  "id": "L07", "slug": "thaw-hoops", "name": "Thaw Hoops",
  "title": "Molten Gold Hoop Earrings, Hand Textured Two Tone Solid Gold Hoops with White Gold Tip, Sculptural Huggie Hoops, Winter Gift for Her",
  "category": "Jewelry > Earrings > Hoop Earrings",
  "taxonomy_id": None,
  "section": "Earrings",
  "tags": ["molten gold hoops", "textured gold hoops", "two tone hoops", "solid gold hoops", "huggie hoop earrings",
           "organic gold hoops", "sculptural earrings", "hand textured hoops", "small gold hoops", "white gold tip",
           "handmade gold hoops", "gift for her gold", "winter earrings"],
  "materials": ["Solid gold", "White gold", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "Silver", "Holiday": "Christmas", "Occasion": "Birthday",
                 "Recipient": "Women", "Style": "Minimalist"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow/White Gold", "Rose/White Gold"], "price_varies": False,
                  "note": "body/tip pair, tip always white gold (brief: Body Color Yellow / Rose)"}],
  "personalization": {"enabled": False},
  "processing_days": "3 to 5 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 2.5, "pieces": 1, "adders": 160, "adders_detail": "torch texturing 80 + two-tone tips 60 + posts and backs 20 (pair priced as one piece with heavier labor)", "base14": 730},
  "brief_prices": {"10K": (684.54, 479.18), "14K": (923.45, 646.41), "18K": (1209.72, 846.80)},
  "description": """The Thaw Hoops continue our Thaw cuff: solid gold taken to the edge of melting so the surface pools and ripples, then stopped, with one tip finished in contrasting white gold like the last ice on a river. They are small enough for every day and textured enough to catch candlelight across a table.

- Each hoop measures 15 mm across in 1.6 mm wire, with a post and a solid gold butterfly back, so the pair sits lightly and stays put.
- The molten surface is made by hand with a torch, one hoop at a time; then the white gold tip is soldered and polished. The pair is matched by eye, and the ripples differ slightly from left to right. That is the handmade part, and we would not sand it away.
- Choose solid 10K, 14K or 18K gold; the body comes in yellow or rose, the tip in white. Everything is solid and stamped, nothing plated or filled.
- Wear them alone, or as the second hoop in a stack. They sit well with velvet in December and with a T-shirt in June.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Gold does not tarnish. Warm water with a drop of dish soap and a soft brush clears the texture of any residue.
- A gift message can be added at checkout.""",
  "trend": {"anchor": "Mark of the Maker (visible process, texture)", "secondary": "Operatic Drama (dressing up, candlelight)"},
  "trend_terms": ["hand textured", "sculptural", "handmade"],
  "manufacturing_note": "Pair of hoops, 15 mm outer diameter, 1.6 mm round wire (yellow or rose 14K), formed round, ends butted. Texture: reticulation by torch on a charcoal block, heating until the surface just flows, then quenched; repeat until the ripple reads at arm's length (reference the Thaw Cuff surface); alternatively cast from a torch-textured master if reticulation yield is poor on 10K. White gold tip: 3 mm cap of 14K white (palladium white preferred over nickel for skin), soldered to one end, polished bright; no rhodium. Post 0.8 mm hard wire soldered to the opposite end, 10 mm long, notched; solid 14K butterfly backs. Match left and right by eye for ripple density. Hallmark on the inside of the hoop near the post. Est. 14K weight 2.5 g per pair (hoops 2.2, posts and backs 0.3).",
  "photo_plan": [
   "Hero macro of one hoop: ripples and the bright white tip, raking warm light",
   "On ear with hair tucked, side profile, soft daylight",
   "Both hoops side by side showing the left and right difference",
   "On ear in candlelight at a dinner table (Operatic Drama)",
   "Stacked as the second hoop with a plain huggie",
   "Yellow and rose body versions on dark linen",
   "Scale shot beside a US dime",
   "Back view: post and butterfly",
   "Gift box, open",
   "Process: torch flame on the hoop on a charcoal block, surface flowing (Mark of the Maker)"],
  "video": "Video 8 to 12 s: torch moment, quench, finished pair turned in the hand",
  "visualization_prompt": "Product photograph, pair of small solid yellow gold hoop earrings 15 mm with a molten rippled surface and one polished white gold tip, on dark linen beside a single candle, warm low light, extreme close-up, 35mm film grain, no retouching",
  "deviations": [
   {"field": "variation labels",
    "brief": "Body Color: Yellow / Rose (tip is always white gold)",
    "used": "Metal Color: Yellow/White Gold / Rose/White Gold",
    "evidence": "CLAUDE.md two-tone exception (owner, 2026-10-09): on a two-metal piece Metal Color values are body/accent pairs with '/', and a flat label is never used. Same property name as the Thaw Cuff draft (W01), so the hoops and the cuff filter together."},
   {"field": "third color (open, raised with Husam at approval)",
    "brief": "two body colors",
    "used": "two values, 3 x 2 = 6 variants",
    "evidence": "The same CLAUDE.md rule keeps the two-tone axis at 3 values with the grid full, and the Thaw Cuff draft (4595934362) offers Yellow/White, White/Yellow and Rose/White. Adding White/Yellow Gold (white body, yellow tip) would make 9 variants and change one description line."},
   {"field": "category id",
    "brief": "Jewelry > Earrings > Hoop Earrings",
    "used": "kept; resolved at push by the repo's hoop_earrings protocol (root Jewelry), already used for the FW26/27 enamel hoops",
    "evidence": "lib/etsy/listing-protocol.ts hoop_earrings: taxonomyNames Hoop Earrings, Earrings; taxonomyRoot Jewelry."},
   {"field": "copy reference to the Thaw cuff",
    "brief": "'The Thaw Hoops continue our Thaw cuff'",
    "used": "kept",
    "evidence": "The Thaw Cuff is an Etsy draft (4595934362), not yet published. Publish the cuff no later than the hoops so the line points to a listing a buyer can find."}],
 },
 "L08": {
  "id": "L08", "slug": "split-infinity", "name": "Split Infinity",
  "title": "Friendship Necklace Set of 2 or 3 in Solid Gold, Split Infinity Matching Pendants with Engraved Initials, Best Friend Gift, Friendsmas Gift",
  "category": "Jewelry > Necklaces > Pendant Necklaces",
  "taxonomy_id": 1229,
  "section": "Necklaces",
  "tags": ["friendship necklace", "best friend necklace", "matching necklaces", "friend group gift", "friendsmas gift",
           "set of 3 necklaces", "infinity necklace", "sister necklace set", "couples necklace set", "personalized gift",
           "chosen family gift", "bff necklace gold", "initial necklace set"],
  "materials": ["Solid gold", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Birthday",
                 "Recipient": "Women", "Style": "Minimalist"},
  "variations": [{"property": "Set", "values": ["2 pendants", "3 pendants"], "price_varies": True},
                 {"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False,
                  "note": "chains ship at 18 inches; 16 or 20 by note in the personalization field"}],
  "personalization": {"enabled": True, "required": False, "max_chars": 40,
                      "instructions": "One initial per pendant, in order left to right (example: H / E / C). Optional: chain length per pendant, 16, 18 or 20 inches (example: H 16 / E 18 / C 18)."},
  "processing_days": "5 to 7 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 4.0, "pieces": 2, "adders": 50, "adders_detail": "set of 2: two make-floors + two engravings 50", "base14": 1090},
  "brief_prices": {"10K": (1022.13, 715.49), "14K": (1378.85, 965.19), "18K": (1806.29, 1264.40)},
  "set_options": {
   "2 pendants": {"grams14": 4.0, "pieces": 2, "adders": 50, "base14": 1090},
   "3 pendants": {"grams14": 5.9, "pieces": 3, "adders": 75, "base14": 1625,
                  "brief_prices": {"10K": (1523.81, 1066.67), "14K": (2055.62, 1438.93), "18K": (2692.87, 1885.01)}}},
  "description": """One infinity loop, cut along a soft wave into two or three pieces, each on its own chain. Apart, each pendant is a small gold curve that reads as abstract. Side by side, they close back into the loop. It is a matching set for the people who are family by choice: best friends, sisters, a couple, a trio who has shared a group chat for a decade.

- The complete infinity measures 16 x 8 mm in 1.3 mm solid gold; each piece has its own bail and hangs on a 1.2 mm cable chain with spring ring clasp.
- Choose a set of 2 or 3. Each pendant can carry one engraved initial on the back, so write them in the order you want them matched to the pieces, left to right.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Chains ship at 18 inches; if your friends want 16 or 20, note it next to each initial in the personalization field and we will cut each chain accordingly.
- The pieces are cast from one master and finished together as a set, so the break lines meet cleanly when the pendants are placed side by side.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping. Each pendant arrives in its own gift box, so the set can be given in three places on the same night.
- Please check the spelling at checkout; engraved pieces are made specifically for you.
- Gold does not tarnish. A soft cloth keeps it bright. A gift message can be added at checkout.""",
  "trend": {"anchor": "Family Reimagined (personalized friend gifts +1,400%, Friendsmas +37%)", "secondary": "brand pillar: infinity"},
  "trend_terms": ["matching", "friend group gift", "friendsmas", "personalized"],
  "manufacturing_note": "Master: infinity loop 16 x 8 mm in 1.3 mm round section, flattened slightly on the back (D profile) for comfort and engraving. Two cutting patterns on the same master: Set of 2 (one wave cut through the crossing, giving a left and right piece) and Set of 3 (two wave cuts giving left lobe, center crossing, right lobe). Cast each piece separately from piece-specific masters (do not cut finished castings; cut the wax, then cast, so the break faces are clean). Each piece: 1.5 mm ID bail soldered at its top point, back engraved with one initial 1.5 mm cap height. Chains 1.2 mm cable, 18 in standard, spring ring. Packaging: one box per pendant. Est. 14K weights: set of 2 approx. 4.0 g (pieces 1.2, chains 2.8); set of 3 approx. 5.9 g (pieces 1.5, chains 4.2 plus bails). Note: center piece of the set of 3 is the smallest; make sure it keeps enough face for the initial.",
  "photo_plan": [
   "Hero: three pendants placed together on linen closing the infinity, soft daylight",
   "Three friends at a dinner table, each wearing one piece, candlelight (Family Reimagined moment)",
   "Each piece alone on skin at 18 in, three frames in one image",
   "Back view with sample initials",
   "Set of 2 placed together",
   "Two and three piece sets side by side",
   "Three gift boxes open in a row",
   "Macro of the wave break line meeting",
   "Metal color options on dark linen",
   "Process: hands cutting the wave in wax under a lamp (Mark of the Maker)"],
  "video": "Video 8 to 12 s: three hands place the pieces together until the loop closes",
  "visualization_prompt": "Product photograph, three small solid gold pendant pieces on separate fine chains placed together on cream linen so they form a single infinity loop with soft wave seams, soft window light, overhead, 35mm film grain, no retouching",
  "deviations": [
   {"field": "overlap check",
    "brief": "brand pillar: infinity",
    "used": "kept",
    "evidence": "The shop already sells a Solid 14K Gold Infinity Necklace (4579027067, wide open pendant) and two infinity bracelets. The Split Infinity differs as a cut, multi-piece matching set, and its title leads with 'Friendship Necklace Set', so it does not compete for the same search."}],
 },
 "L09": {
  "id": "L09", "slug": "paw-seal", "name": "Paw Seal",
  "title": "Pet Paw Print Necklace in Solid Gold, Hand Engraved Paw Seal Pendant with Pet Name, Custom Dog Mom or Cat Mom Gift, Pet Memorial Jewelry",
  "category": "Jewelry > Necklaces > Pendant Necklaces",
  "taxonomy_id": 1229,
  "section": "Necklaces",
  "tags": ["paw print necklace", "dog mom necklace", "cat mom gift gold", "custom pet gift", "pet memorial jewelry",
           "pet name necklace", "solid gold paw print", "dog lover gift gold", "cat lover necklace", "paw print jewelry",
           "hand engraved charm", "dog dad gift", "signet style pendant"],
  "materials": ["Solid gold", "Vitreous enamel", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "Blue", "Holiday": "Christmas", "Occasion": "Birthday",
                 "Recipient": "Women", "Style": "Minimalist"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Chain Length", "values": ["16 inches", "18 inches", "20 inches"], "price_varies": True},
                 {"property": "Paw Finish", "values": ["Plain gold", "Cobalt enamel", "Cranberry enamel", "Black enamel"], "price_varies": False}],
  "metal_color": "Yellow gold as standard; white or rose by message (brief)",
  "personalization": {"enabled": True, "required": True, "max_chars": 16,
                      "instructions": "Pet name for the back (up to 10 characters) and DOG or CAT for the paw style. Example: BIBER / DOG. Add a year after the name if you are marking a life."},
  "processing_days": "5 to 7 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 2.5, "pieces": 1, "adders": 75, "adders_detail": "intaglio hand engraving 50 + name engraving 25; enamel fill offered at the same price; 16 in chain included in the grams", "base14": 645},
  "brief_prices": {"10K": (604.84, 423.39), "14K": (815.92, 571.14), "18K": (1068.86, 748.20)},
  "chain": {"lengths": ["16 inches", "18 inches", "20 inches"], "addon_base14": 0,
            "steps_base": {"10K": [20, 20], "14K": [20, 30], "18K": [40, 40]},
            "steps_source": "16 in is the base price (the 2.5 g basis includes a 16 in chain); 18 and 20 in follow reference listing 4590337023 (Bauble) panel bases, read 2026-10-17: 10K 430/450/470, 14K 580/600/630, 18K 760/800/840"},
  "description": """A seal is the mark a thing leaves behind. The Paw Seal is a 10 mm solid gold disc with a paw pressed into its face as an intaglio, cut by hand below the surface the way a signet is cut, so it catches shadow rather than shine. The back carries your pet's name. Choose a plain gold paw, or have the intaglio filled with kiln-fired enamel in cobalt, cranberry or black.

- The disc measures 10 mm across and 1.2 mm thick with a fixed bail; the paw is engraved by hand, and the two styles, dog and cat, are shown in the listing photos.
- Personalization: your pet's name on the back, up to 10 characters, and the choice of dog or cat paw. Add a year if you are marking a life.
- Yellow gold as standard; message us for white or rose. Choose solid 10K, 14K or 18K with a 1.2 mm cable chain and spring ring clasp in 16, 18 or 20 inches. Message us for the bracelet version on a 6.5, 7 or 7.5 inch chain.
- A personalized gift for a dog mom, a cat dad, a puppy's first Christmas, or in memory of a pet whose paw print is still on the car window.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping, gift box included. Please check the spelling at checkout; engraved pieces are made specifically for you.
- If you choose enamel, it is glass fused to gold and can chip from a hard knock; a soft cloth is all it needs. Gold itself does not tarnish.
- A gift message can be added at checkout.""",
  "trend": {"anchor": "Family Reimagined (pet gifting searches doubled; custom pet gift)", "secondary": "Mark of the Maker (hand engraved)"},
  "trend_terms": ["custom pet gift", "hand engraved", "personalized", "kiln fired"],
  "manufacturing_note": "Disc 10.0 mm diameter x 1.2 mm, cast or cut from sheet, edges slightly domed, fixed bail 1.5 mm ID soldered at 12 o'clock. Face: paw intaglio (central pad plus four toe pads, dog version rounder, cat version smaller and more oval) engraved by hand with gravers to 0.3 mm depth, floors matte, walls bright, like a signet; prepare two bench templates so the paws stay consistent. Optional fill: wet-pack opaque enamel (cobalt, cranberry or black) into the intaglio, fire 780 to 820 C, stone flush, flash fire. Back: pet name up to 10 characters, 1.3 mm cap height, centered, plus optional year below. Chain 1.2 mm cable, spring ring. Bracelet version on request: same disc as a connector on a 6.5 to 7.5 in chain. Hallmark on the back under the name. Est. 14K weight 2.5 g with 16 in chain (disc 1.1, bail 0.1, chain 1.4).",
  "photo_plan": [
   "Hero macro of the intaglio paw under raking light, plain gold version",
   "Worn by a person with their dog in frame, daylight, shallow depth (Family Reimagined moment)",
   "The three enamel fills and plain gold side by side",
   "Dog and cat paw styles side by side with small labels",
   "Back view with a sample name and year",
   "Worn at 16 in over a knit, cat on the lap",
   "Scale shot beside a US dime",
   "Gift box, open, with a small paper tag",
   "Styled: the pendant beside a worn leather collar tag",
   "Process: graver cutting the pad under magnification (Mark of the Maker)"],
  "video": "Video 8 to 12 s: engraving strokes, then the disc turned to show the name",
  "visualization_prompt": "Product photograph, small solid gold disc pendant 10 mm with a recessed intaglio paw print catching shadow, on a worn leather dog collar on a wooden table, soft side light, extreme close-up, 35mm film grain, no retouching",
  "deviations": [
   {"field": "chain steps for 18 and 20 in",
    "brief": "the shop's standard step, about 14 on the 10K base per 2 inches",
    "used": "the reference listing's own base steps (same rule as L02, L05, L06)",
    "evidence": "Panel prices of listing 4590337023 (Bauble) read 2026-10-17."},
   {"field": "grid rule (as the brief, same pattern as L04 and L06)",
    "brief": "Karat x Chain Length x Paw Finish, yellow gold; white or rose by message",
    "used": "as the brief: 3 x 3 x 4 = 36 variants",
    "evidence": "Paw Finish takes Etsy's third variation axis, so Metal Color cannot be a variation."},
   {"field": "personalization length",
    "brief": "required, max 16 characters, name up to 10",
    "used": "kept",
    "evidence": "A 10-character name plus ' / DOG' is 16, and the instructions invite a year as well: BIBER 2026 / DOG is 16, a 10-letter name with a year is 21 and would be cut off. Raise to 24 if Husam wants the year to fit every name."}],
 },
 "L10": {
  "id": "L10", "slug": "twin-eye", "name": "Twin Eye",
  "title": "Matching Evil Eye Bracelet Set of 2 in Solid Gold, Twin Eye Friendship Bracelets with Cobalt Enamel and Engraved Initials, Best Friend Gift",
  "category": "Jewelry > Bracelets > Chain & Link Bracelets",
  "taxonomy_id": None,
  "section": "Bracelets (cross-link from Evil Eye via tags)",
  "tags": ["evil eye bracelets", "matching bracelets", "friendship bracelets", "best friend bracelet", "sister bracelet set",
           "couples bracelet set", "friend group gift", "friendsmas gift", "nazar bracelet gold", "cobalt enamel eye",
           "solid gold evil eye", "set of 2 bracelets", "initial bracelet set"],
  "materials": ["Solid gold", "Vitreous enamel", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "Blue", "Holiday": "Christmas", "Occasion": "Birthday",
                 "Recipient": "Women", "Style": "Minimalist"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False},
                 {"property": "Length", "values": ["6.5 inches", "7 inches", "7.5 inches"], "price_varies": False,
                  "note": "length for the set; two different lengths by note in the personalization field"}],
  "personalization": {"enabled": True, "required": False, "max_chars": 40,
                      "instructions": "Two initials, almond bracelet first, then iris bracelet (example: H / C). Optional: a second length if the wrists differ (example: H 6.5 / C 7)."},
  "processing_days": "5 to 7 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 1.9, "pieces": 2, "adders": 75, "adders_detail": "two make-floors + enamel cell 25 + two tag engravings 50", "base14": 905},
  "brief_prices": {"10K": (848.65, 594.05), "14K": (1144.82, 801.37), "18K": (1499.72, 1049.80)},
  "description": """Two bracelets that make one eye. The first carries the almond outline in open solid gold wire; the second carries the iris, a 4 mm gold dome with a cobalt blue kiln-fired enamel center. Each is a quiet bracelet alone. Held wrist to wrist, they complete the eye that has watched over this part of the world for five thousand years. One for you, one for the friend, sister or partner you would call first.

- The almond measures 9 x 5 mm in 0.9 mm wire; the iris dome is 4 mm. Both sit as connectors in a 1.2 mm solid gold cable chain with spring ring clasp and a small gold tag at the clasp.
- Personalization: one initial engraved on each tag, written in the order almond, then iris. Leave the field blank if you prefer them plain.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose, and a length of 6.5, 7 or 7.5 inches for the set. If you need two different lengths, write both in the personalization field.
- The enamel is fired by hand in a recessed cell with a polished gold rim, in the same cobalt as our Evil Eye collection, so the set stacks with it.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping. The two bracelets arrive in separate gift boxes.
- Please check the spelling at checkout; engraved pieces are made specifically for you.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.""",
  "trend": {"anchor": "Family Reimagined (friend gifts +1,400%, matching sets)", "secondary": "Merrymaxxing (cobalt enamel); brand pillar: the eye"},
  "trend_terms": ["matching", "friend group gift", "friendsmas", "kiln fired"],
  "manufacturing_note": "Bracelet A (almond): open almond outline 9 x 5 mm formed from 0.9 mm round wire, ends soldered, two 1.2 mm ID loops soldered at the points as chain connectors. Bracelet B (iris): 4 mm domed disc, 1.2 mm high, with a 2.6 mm recessed cell 0.4 mm deep for opaque cobalt enamel (same color code as the Evil Eye collection), polished rim, two connector loops at 3 and 9 o'clock on the back edge. Both on 1.2 mm cable chain, spring ring clasp, with a 4 x 6 mm oval tag at the clasp for the initial (1.3 mm cap height). Chain lengths 6.5, 7, 7.5 in; cut each bracelet to its own length when two are requested. Packaging: two boxes. Hallmark on the tags. Est. 14K weight 1.9 g per set (almond 0.15, iris 0.35, two chains 1.2, clasps and tags 0.2).",
  "photo_plan": [
   "Hero: two wrists side by side so almond and iris complete the eye, soft daylight (Family Reimagined moment)",
   "Each bracelet alone on a wrist, two frames in one image",
   "Macro of the cobalt iris dome, raking light",
   "Macro of the almond wire and the clasp tag with an initial",
   "Stacked with an existing Evil Eye bracelet from the shop",
   "Two friends at a Friendsmas table, hands on the tablecloth, candles",
   "Metal color options on dark linen",
   "Two gift boxes open side by side",
   "Flat lay forming the eye on cream linen, overhead",
   "Process: wet-packing cobalt enamel into the iris cell (Mark of the Maker)"],
  "video": "Video 8 to 12 s: two wrists move together until the eye closes",
  "visualization_prompt": "Product photograph, two delicate solid gold chain bracelets on two wrists held side by side, one with a small open almond outline and the other with a tiny domed cobalt blue enamel iris, together forming an eye, soft daylight, 35mm film grain, no retouching",
  "deviations": [
   {"field": "category id",
    "brief": "Jewelry > Bracelets > Chain & Link Bracelets",
    "used": "kept; resolved at push by the repo's chain_bracelet protocol (root Jewelry), the protocol the shop's earlier bracelet drafts were pushed with",
    "evidence": "lib/etsy/listing-protocol.ts chain_bracelet: taxonomyNames Chain & Link Bracelets, Bracelets; taxonomyRoot Jewelry."}],
 },
}


def sheet(l):
    pr, pb = l["prices"], l["pricing_basis"]
    p = l["personalization"]
    out = [f"# {l['id']} {l['name']}: Etsy listing sheet", "",
           "Copy-paste sheet in the order of Etsy's listing form. Source: `listings/" + f"{l['id']}-{l['slug']}.json`.", "",
           "## Photos (slots 1 to 10)", ""]
    out += [f"{i}. {s}" for i, s in enumerate(l["photo_plan"], 1)]
    out += ["", "Listing images are real photographs of real samples. Shoot spec: BRIEF.md section 5.", "",
            "## Video", "", l["video"], "",
            "## Title", "", "```text", l["title"], "```", f"({len(l['title'])} characters)", "",
            "## About this listing", "", f"- Who made it: {l['about']['who_made']}",
            f"- What is it: {l['about']['what']}", f"- When was it made: {l['about']['when_made']}", "",
            "## Category", "", f"{l['category']}" + (f" (taxonomy id {l['taxonomy_id']})" if l.get("taxonomy_id") else " (resolved at push by the listing protocol)"), "",
            "## Renewal", "", "Automatic", "",
            "## Type", "", "Physical item", "",
            "## Description", "", "```text", l["description"], "```", "",
            "## Section", "", l["section"], "",
            "## Tags", "", "```text", ", ".join(l["tags"]), "```", "",
            "## Materials", "", ", ".join(l["materials"]), "",
            "## Attributes", ""]
    out += [f"- {k}: {v}" for k, v in l["attributes"].items()]
    out += ["", "## Price and Quantity", "",
            f"Quantity {l['quantity']}. Processing time {l['processing_days']}.", "",
            "| Karat | Original list price | Shown during the 30% shop sale |", "|---|---|---|"]
    out += [f"| {k} | ${pr[k]['list']:,.2f} | ${pr[k]['sale']:,.2f} |" for k in ("10K", "14K", "18K")]
    out += ["", f"Basis: est. {pb['grams14']} g in 14K, {pb['pieces']} make-floor, adders {pb['adders']} ({pb['adders_detail']}), 14K base {pb['base14']}. "
            "List = base x 1.265; 10K = 14K / 1.349; 18K = 14K x 1.31. Efe's cast weight overrides the estimate.", ""]
    if l.get("variant_prices"):
        cols = list(next(iter(l["variant_prices"].values())))
        out += ["Price per variation (Metal Color does not change the price), original list / shown during the sale:", "",
                "| Karat | " + " | ".join(cols) + " |", "|---" * (len(cols) + 1) + "|"]
        out += [f"| {k} | " + " | ".join(f"${row[c]['list']:,.2f} / ${row[c]['sale']:,.2f}" for c in cols) + " |"
                for k, row in l["variant_prices"].items()]
        out += [""] + ([f"Chain steps: {l['chain']['steps_source']}.", ""] if l.get("chain") else [])
        if l.get("set_options"):
            out += [f"- {o}: est. {b['grams14']} g in 14K, {b['pieces']} make-floors, adders {b['adders']}, 14K base {b['base14']}"
                    for o, b in l["set_options"].items()] + [""]
    out += [
            "## Variations", ""]
    out += [f"- {v['property']}: {' / '.join(v['values'])}" + (" (price varies)" if v["price_varies"] else "") for v in l["variations"]]
    out += ["", "## Personalization", ""]
    if p["enabled"]:
        out += [f"On, {'required' if p['required'] else 'optional'}, max {p['max_chars']} characters.", "", "```text", p["instructions"], "```"]
    else:
        out += ["Off"]
    out += ["", "## Shipping profile", "", "Free US shipping, ships from West New York NJ", "",
            "## Return policy", "", "Shop default", ""]
    if l.get("deviations"):
        out += ["## Deviations from the brief", ""]
        out += [f"- {d['field']}: brief says \"{d['brief']}\", used {d['used']}. {d['evidence']}" for d in l["deviations"]]
        out += [""]
    return "\n".join(out)


def build(key):
    src = dict(LISTINGS[key])
    pb = src["pricing_basis"]
    pr = ladder(pb["grams14"], pb["pieces"], pb["adders"])
    assert FLOOR * pb["pieces"] + PER_GRAM * pb["grams14"] + pb["adders"] == pb["base14"], (key, "base14")
    for k, (lst, sale) in src.pop("brief_prices").items():
        assert (pr[k]["list"], pr[k]["sale"]) == (lst, sale), (key, k, pr[k], lst, sale)
    src["prices"] = pr
    ch = src.get("chain")
    if ch:
        grid = {}
        for k, f in (("10K", K10), ("14K", 1.0), ("18K", K18)):
            if "brief_addon16_list" in ch:
                assert round(ch["addon_base14"] * f * LIST, 2) == ch["brief_addon16_list"][k], (key, k, "chain add-on")
            row = {ch["none_label"]: pr[k]} if ch.get("none_label") else {}
            for i, length in enumerate(ch["lengths"]):
                base = pb["base14"] * f + ch["addon_base14"] * f + sum(ch["steps_base"][k][:i])
                lst = round(base * LIST, 2)
                row[length] = {"list": lst, "sale": round(lst * SALE, 2)}
            vals = [v["list"] for v in row.values()]
            assert vals == sorted(vals) and len(set(vals)) == len(vals), (key, k, "chain ladder not rising")
            grid[k] = row
        src["variant_prices"] = grid
    so = src.get("set_options")
    if so:
        grid = {k: {} for k in ("10K", "14K", "18K")}
        for opt, b in so.items():
            assert FLOOR * b["pieces"] + PER_GRAM * b["grams14"] + b["adders"] == b["base14"], (key, opt, "base14")
            lad = ladder(b["grams14"], b["pieces"], b["adders"])
            for k, (lst, sale) in b.get("brief_prices", {}).items():
                assert (lad[k]["list"], lad[k]["sale"]) == (lst, sale), (key, opt, k, lad[k], lst, sale)
            for k in grid:
                grid[k][opt] = lad[k]
        src["variant_prices"] = grid
    stem = f"{src['id']}-{src['slug']}"
    (HERE / "listings" / f"{stem}.json").write_text(json.dumps(src, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (HERE / "listings" / f"{stem}.md").write_text(sheet(src), encoding="utf-8")
    print("wrote", stem, {k: v["list"] for k, v in pr.items()})


for key in (sys.argv[1:] or list(LISTINGS)):
    build(key)
