# Evil Eye Collection: ChatGPT handoff (by Artifact Studio Jewelry)

Built 2026-10-09 from the repo (`docs/artifact-studio/evil-eye/`). Everything needed to generate the images and prepare the 30 Etsy listings in ChatGPT. Source of truth stays the repo; if you change a price, title or variant there, the panel will not know until it is brought back.

## How to use this file in ChatGPT

1. Paste the whole file, then say: "Work listing by listing. Start with R01."
2. Images: generate the reference hero first (text only, square 1:1, 2048 px). Check it against the piece description, then generate the 10 sales frames using a tight crop of the approved hero as the only reference (crop to the piece; never pass the paper, angle or framing on).
3. One image per prompt. Reject a frame that shows a second piece, a hand without five fingers, wrong scale, domed enamel, lashes or a lid line, text or logos, or a redesigned piece.
4. Listing: copy title, tags, materials, description into Etsy as a draft; variants and prices are in variants.csv; the 10 frame prompts per listing are in CHATGPT-FRAMES.md.

## Fixed rules

- Variants: full grid, Karat (10K/14K/18K) x Metal Color x size. Rings US 3 to 16 whole and half (243 variants), necklaces 16/18/20 in (27), bracelets 6.5/7/7.5 in (27). 2,970 variants in total.
- Two-tone families (1 Halka, 6 Mother and Child, 7 Medal, 8 Twin Wire): Metal Color values are `Yellow/White Gold`, `White/Yellow Gold`, `Rose/White Gold` (first metal = main metal). Never a plain colour label on a two-metal piece. Others: Yellow Gold / White Gold / Rose Gold.
- SKU: `BAS-EE-{id}-{karat}{Y|W|R|YW|WY|RW}-{size}`, max 32 characters.
- Prices are ESTIMATES (2 x maker cost on the Christmas terms); two-tone pieces are unquoted and must not go live before the maker quote. Listings go up as drafts only.
- Never in titles, tags or descriptions: protect, ward, luck, power of, healing, baby, newborn, christening, kids, hamsa, cross, Horus, Something Blue, designer names, "Made in Turkey".

## Copy rules (from the design direction)

- The nazar is "a traditional Turkish and Greek symbol" and the style is
  "Turkish/Greek-style". Never "Made in Turkey".
- A generator assert bans these in titles, tags and descriptions: `protect`, `ward`,
  `luck`, `power of`, `healing` (Etsy bars metaphysical outcomes; "power of protection"
  is a registered mark), and `baby`, `newborn`, `baby shower`, `christening`, `kids`. A
  piece presented as for a child of 12 or under falls under CPSIA third-party testing,
  and vitreous enamel has no exemption. Gifts are for the wearer or the parent.
- Never designer names, hamsa, crosses, the Eye of Horus or "Something Blue" (a US
  Class 14 mark is listed for it). "Iznik" appears only in the Çini description
  ("inspired by Ottoman tilework from Iznik", a registered Turkish geographical
  indication for tiles), never in a title or tag.
- Every name carries "evil eye"; "nazar" goes to the descriptor and the tags. Hanging
  pendants (N01, N02, N05, N06, N07, N09) carry "Evil Eye Pendant" in the descriptor.
- Two-tone titles carry "two tone"; their tags carry "two tone" and "mixed metal". The
  panel's colour facet reads "two tone" from the title.
- Colour words: "cobalt blue enamel", "white enamel", "sky blue enamel", "turquoise
  enamel", "red enamel", "pink enamel". White gold is "white gold, not rhodium plated"
  unless maker question 2 says otherwise.

## Image notes (from the design direction)

Each listing gets one reference hero, then 10 sales frames held to it (nano_banana_2 at
2k, count 1, every prompt shown to the owner before it runs). What every hero prompt
must state physically:

- **Size in mm, against a known object, and "never larger".** The old anchor "a 9 mm eye
  is about the width of a fingertip" asks for 18 to 20 mm and is dropped.

| Size | Anchor in the prompt |
|---|---|
| 6 mm | slightly thinner than a pencil |
| 8.4 to 9.6 mm | a little narrower than the index fingernail |
| 10 to 11.5 mm | about as wide as the index fingernail |
| 13.5 mm (Mother and Child ring) | about as wide as a thumbnail, never wider than the finger |
| 15.8 mm tall (Mother and Child necklace) | about the length of a thumbnail |

- **The metal of every part, by name.** Never "two tone" or "mixed metal" in a prompt.
  One part is one metal: cup and plate, mother and child, coin and almond, wire and
  wire. Never a split within one part (the Meridian arc split), and never a request to
  swap metals between copies.
- **White gold is metal, not enamel:** "polished unplated white gold, a soft warm grey
  metal with mirror reflections". White enamel is "porcelain white enamel, flat, opaque
  and glossy". In Halka the white-gold ring sits exactly where a nazar's white enamel
  would; QA asks of every frame whether each white zone is the right material.
- **Enamel flat, flush and glossy, never domed.** No glass beads, red string, lashes,
  lid lines, realistic irises, shading, iris striations or hamsa props.
- **Closed backs:** every back or side view says "closed, solid, flat gold back".
- **Counts:** any count the copy promises or the eye reads at a glance is three or fewer
  per group. Uniform repeats (the R04 ball band, the R10 link band, a ridged coin edge)
  are allowed only if the copy never states a number; QA checks equal units and a rigid
  band.
- **Words kept out of prompts:** "Iznik" and "tile" (write "a flat hexagon");
  "satellite"; "paperclip chain" (write "two elongated oval links on each side, then a
  fine round cable chain"); "coin" (write "a round disc with a finely ridged edge and a
  plain satin face"); "signet" (write "a flat round top, no engraving"); "bezel", "cup",
  "set like a stone", "toi et moi" (write "a flat enamel disc framed by a thin raised
  [metal] collar, flush, not domed, with a closed solid back"); "nazar bead" and "bead
  string" (the eye is "a flat enamel disc", the beads "solid polished gold balls").

Per family:

1. **Halka:** five visible zones on N01 and four on R01/B01, named zone by zone with
   their metals. QA: which part is which metal, and does it match the variant value?
2. **Damla:** the hero fixes the inner bands as offset teardrops and shows the solid
   gold point; frames are held to the hero. Height to width within 10% of 10.6 / 8.8.
3. **Mati:** N03 "hangs level, long axis parallel to the collarbone, from a small loop
   behind the middle of its top edge". B03 "the chain runs straight across just inside
   the top edge of the almond, passing behind it; both pointed tips sit below the chain
   and touch nothing". Add "no eyelashes, no eyelid line, no realistic iris".
4. **Bead String:** "three identical stations; each is one rigid piece 10 mm long: a
   flat 6 mm cobalt blue enamel disc with a 2 mm solid gold ball fused to its left and
   right edge; the chain between stations is bare". R04: "a rigid closed band of small
   solid gold balls in one row, all the same size, no thread, no elastic, no gaps".
5. **Çini:** "the two small hexagons are plain turquoise with no centre dot and no
   ring". QA: six sides, sharp corners, one eye.
6. **Mother and Child:** metals part by part ("the small eye is white gold: white gold
   rim, cobalt blue enamel ring, white gold centre dot, in a thin yellow gold collar
   joined to the big eye"). Ring: the child at 4 to 5 o'clock, the mirror accepted.
   Necklace: the child straight below. The big eye is 1.5 times the small one.
7. **Medal:** "plain satin-finished face with no engraving, no lettering, no numbers, no
   enamel; only the raised almond", the almond in the other metal. Frame 09 can also be
   a local recolour of one hero with two masks (the Frostline method).
8. **Twin Wire:** R08 "two thin round rings, one entirely {body} gold, one entirely
   {accent} gold, fused side by side like a stack of two rings". The eye, as a
   template: "{body} centre dot, slightly raised; {accent} ring; {body} outer rim". If
   two takes fail, R08 becomes a single body-gold band with the two-tone eye on top;
   that is a product change and goes back to the owner before listing.
9. **Sweetheart:** "a solid polished gold heart with full round lobes, with a small
   round red enamel ring and a round gold centre dot set flush in the middle"; "no
   eyelashes, no eyelid line"; the red is the same poppy red on all three metals.
10. **Paperclip:** two links on each side, then the fine cable; QA counts them.

- **Two-tone heroes (proposal for the image step, needs the owner's yes there):** one
  hero per Metal Color value for the 12 two-tone listings, each from text with no
  reference in another colour, and frame 09 composited locally from the three heroes
  with no model call. Cost: 24 extra generations, about 48 credits at the FW rate. For
  station pieces (N04, B04, B05, B06, N10, B10), frame 09 shows a single station in each
  metal, at no extra cost.
- **Two QA gates:** the hero beside the spec drawing (form), then the family's frames on
  one contact sheet (set).

## Production rules (from the design direction)

| Rule | How the set holds it |
|---|---|
| Cells at least 1.5 | Every cell is 1.5 or more. Cells at exactly 1.5 (Halka small cobalt, Damla bands, Mati iris, Çini turquoise, Mother and Child, Medal B07 iris, Sweetheart R09 red, Paperclip connector) are hard minimums (rule C) |
| Walls at least 0.4 | All walls 0.4 to 0.9. Halka's metal ring 0.9, Twin Wire's inlay 1.5, the Mother and Child joint 0.8, gold beside the B07 iris and around the R09 eye 0.45 |
| At most 2 enamels; 6 mm eyes take 1 | Two only on eyes of 8.8 and up. Every eye of 6.0 or less is one colour; Halka's small eye and all of Sweetheart are one colour |
| Polished gold rim on every cell | yes |
| Closed back, no hollow | Plates, coins, discs, tiles, hearts and beads are solid; cups have closed 0.5 backs |
| No enamel on wear surfaces | Shanks, chains, links, beads, loops, coin edges, points and tips are metal |
| Enamel colour fixed per model | yes, never a variation |
| No mixed alloy in the kiln (new for this set) | Each enamelled part is one alloy, fired alone, then joined by setting (1, 6), cast-pin rivets (7) or laser weld. Twin Wire is never fired. No mixed-alloy firing has to be qualified; single-alloy firing on white and rose gold is maker question 2 |
| Motif size 6 to 12 | Motifs 6.0 to 11.5. The Mother and Child pair is 13.5 (ring) and 15.8 (necklace) overall, each eye in range; R09's inset eye is 5.4 inside a 9.6 heart |
| Counts | Any count the copy promises or the eye reads at a glance is three or fewer per group |

- **A. Findings on enamelled parts:** every loop, pin and bail on an enamelled part is
  cast integral. Every closure made after firing (jump rings, chain joins, paperclip
  links, the R10 eye) is laser-welded. No torch solder goes near fired enamel, and any
  seam that enters the kiln is enamelling-grade solder.
- **B. White gold:** palladium white, unplated, across the whole collection. Rhodium
  burns off in the kiln and plating after firing risks the enamel, so enamelled white
  parts cannot be plated; leaving every white part unplated makes the three variants,
  their photos and the copy match. Natural white gold is a soft warm grey; at 10K it is
  close to pale yellow beside yellow gold, where the two-tone read is weakest.
- **C. Hard minimums:** the maker is told that cells drawn at exactly 1.5 have no
  negative tolerance.

### Questions for the maker (before the estimate flags come off)

1. **Two-tone, priced per operation:** a fired plate set in a cup of the other gold with
   the lip burnished over a 0.4 rim without touching the enamel (1, 6); a 1.5 wide,
   0.5 deep flush inlay washer in a 6 mm disc (8); two wires of different gold soldered
   side by side, as a ring and as a 2.0 x 1.0 cuff (8); an almond with cast pins riveted
   through a coin, and through a band head on R07 (7). Which pairs: Yellow/White,
   White/Yellow, Rose/White? Does each accent part cost its own 25 USD model fee (up to
   12, 300 USD one-off)?
2. **White gold and enamel:** palladium white for every white part (nickel white is a
   poor enamel ground and has to meet the EU nickel-release limit on rings); no rhodium
   anywhere; enamel on 10K, white and rose; sample tiles of the six enamels.
3. **Station counting:** is 1 g per 6 to 9 mm unit real? Quote B04 and B02 to settle the
   bracelet basis (decision 2).
4. **Fabrication:** the bypass ring, the Y lariat drop, the cast bead-eye-bead bars, the
   paperclip links and their laser welds, the twin-wire cuff's stiffness. Do the
   parametric bead band (R04) and link band (R10) count as one 25 USD model or one per
   size?
5. **Motif rings on the 3 mm band basis,** including the R07 coin ring at about 3.2 g.

## The 30 listings

### R01 · Two Tone Evil Eye Ring (family 1 Halka)

- **Title:** Two Tone Evil Eye Ring, Cobalt Blue Enamel Nazar Set in Two Colours of Solid Gold, Mixed Metal Ring
- **Tags (13):** two tone ring, mixed metal ring, evil eye ring, nazar ring, gold evil eye ring, blue evil eye, cobalt blue enamel, 14k evil eye ring, enamel evil eye, solid gold ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye 8.4 mm, set 1.8 mm high; band 2.0 mm wide, 1.4 mm thick
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $820 (estimate)
- **Price range by karat:** 10K $520 to $790; 14K $700 to $1100; 18K $930 to $1490
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A round evil eye in cobalt blue enamel, set in a solid gold collar on a slim band, with a ring of the second gold inside the blue.

In the classic nazar a white ring sits inside the dark blue; here that ring is gold: white gold in Yellow/White and Rose/White, yellow gold in White/Yellow. The eye plate is enamelled and fired on its own, then set like a stone, so no heat reaches the enamel after the kiln.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the collar, setting and band are in the main metal; the enamelled eye plate, which shows as the thin ring between the two blues, is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 8.4 mm, set 1.8 mm high; band 2.0 mm wide, 1.4 mm thick.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a ring with a flat round disc on top, 8.4 mm across, a little narrower than the index fingernail, never larger, framed by a thin raised yellow gold collar that holds it flush, not domed; the collar is 1.8 mm high and sits on a band 2 mm wide and 1.4 mm thick with a flat inner side. Each part is entirely one metal: the band, the thin raised collar around the disc and the closed back behind it are polished yellow gold; the disc inside the collar is polished unplated white gold, a soft warm grey metal with mirror reflections. The face of the disc shows four flat zones from the edge inward: the yellow gold collar, 0.8 mm wide; a ring of cobalt blue enamel (#17368C), 1.5 mm wide, that meets the collar directly with no other metal line between them; a flat ring of white gold, 0.9 mm wide; and a round centre dot of cobalt blue enamel, 2 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold back. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). No eyelashes, no eyelid line, no realistic iris. The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** terracotta #B95B45, accent cobalt blue, skin light warm. Fired clay opposite cobalt: the blue ring pops and the white gold ring reads as cool grey metal beside the yellow collar.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R01.


Full variant list with SKUs and prices: variants.csv (rows for R01).

### N01 · Two Tone Evil Eye Necklace (family 1 Halka)

- **Title:** Two Tone Evil Eye Necklace, Cobalt Blue and Sky Blue Enamel Evil Eye Pendant, Solid Gold Nazar Necklace
- **Tags (13):** two tone necklace, mixed metal necklace, evil eye necklace, evil eye pendant, nazar necklace, gold evil eye, blue evil eye, sky blue enamel, 14k evil eye, layering necklace, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye 11.5 mm, 1.5 mm thick
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $820 (estimate)
- **Price range by karat:** 10K $610 to $650; 14K $800 to $850; 18K $1030 to $1110
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
An 11.5 mm evil eye pendant in cobalt blue and sky blue enamel, with the ring and the pupil of the nazar made in a second colour of gold.

Read from the edge in: a collar of the main gold, a band of cobalt blue, a ring of the second gold, sky blue, then a gold pupil. The bail is hidden behind the top edge, so nothing shows above the eye, and the plate is fired on its own and set like a stone.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the collar, setting, bail and chain are in the main metal; the enamelled eye plate, which shows as the ring between the blues and as the pupil, is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel and sky blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 11.5 mm, 1.5 mm thick.
Chain: 1.2 mm solid gold cable chain in the main metal, spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a pendant: a flat round disc, 11.5 mm across, about as wide as the index fingernail, never larger, 1.5 mm thick, framed by a thin raised yellow gold collar that holds it flush, not domed. Each part is entirely one metal: the thin raised collar around the disc, the closed back behind it, a small tube hidden behind the top edge of the disc and the fine 1.2 mm cable chain are polished yellow gold; the disc inside the collar is polished unplated white gold, a soft warm grey metal with mirror reflections. The face of the disc shows five flat zones from the edge inward: the yellow gold collar, 0.8 mm wide; a ring of cobalt blue enamel (#17368C), 1.6 mm wide, that meets the collar directly with no other metal line between them; a flat ring of white gold, 0.9 mm wide; a ring of pale sky blue enamel (#8CC3E8), 1.6 mm wide; and a round white gold centre dot, 1.7 mm across. The fine 1.2 mm cable chain passes through the hidden tube, so it disappears behind the top edge of the disc and no loop shows above it. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold back. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), pale sky blue (#8CC3E8). No eyelashes, no eyelid line, no realistic iris. The pendant lies flat and face up, and the fine chain leaves it as one single strand whose two halves rise straight up and apart like the arms of a letter V and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** apricot #F0B48A, accent sky blue, skin medium olive. A light warm complement for the largest disc; sky blue and both golds stay clear at thumbnail size.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N01.


Full variant list with SKUs and prices: variants.csv (rows for N01).

### B01 · Two Tone Evil Eye Bracelet (family 1 Halka)

- **Title:** Two Tone Evil Eye Bracelet, Cobalt Blue Enamel Nazar Set Inline on Solid Gold Chain, Mixed Metal Bracelet
- **Tags (13):** two tone bracelet, mixed metal bracelet, evil eye bracelet, nazar bracelet, gold evil eye, blue evil eye, cobalt blue enamel, 14k gold bracelet, dainty bracelet, stacking bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye 8.4 mm
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $700 (estimate)
- **Price range by karat:** 10K $570 to $590; 14K $690 to $720; 18K $840 to $880
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A round cobalt blue enamel evil eye set inline in a fine solid gold chain, with a ring of the second gold inside the blue.

The chain runs out of loops cast on each side of the setting, so the eye lies flat on top of the wrist. It is the same eye as the ring, enamelled and fired on its own, then set like a stone.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the collar, setting, loops and chain are in the main metal; the enamelled eye plate, which shows as the thin ring between the two blues, is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 8.4 mm.
Chain: 1.1 mm solid gold cable chain in the main metal, spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm yellow gold cable chain bracelet with one flat round disc, 8.4 mm across, a little narrower than the index fingernail, never larger, in the line of the chain at its centre, framed by a thin raised yellow gold collar that holds it flush, not domed; two small yellow gold loops on the sides of the collar, at 3 and 9 o'clock, join the chain, so the chain runs into the disc from both sides. Each part is entirely one metal: the chain, the two loops, the thin raised collar around the disc and the closed back behind it are polished yellow gold; the disc inside the collar is polished unplated white gold, a soft warm grey metal with mirror reflections. The face of the disc shows four flat zones from the edge inward: the yellow gold collar, 0.8 mm wide; a ring of cobalt blue enamel (#17368C), 1.5 mm wide, that meets the collar directly with no other metal line between them; a flat ring of white gold, 0.9 mm wide; and a round centre dot of cobalt blue enamel, 2 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold back; spring ring clasp. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). No eyelashes, no eyelid line, no realistic iris. The bracelet lies in one soft open curve, one continuous chain from end to end, with the round disc face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** dark umber #3E2C22, accent nude, skin deep brown. Deep warm brown, so the yellow collar and the white gold ring separate on a fine chain.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B01.


Full variant list with SKUs and prices: variants.csv (rows for B01).

### R02 · Teardrop Evil Eye Ring (family 2 Damla)

- **Title:** Teardrop Evil Eye Ring, Cobalt Blue Enamel Nazar Drop on a Slim Solid Gold Band, Dainty Everyday Ring
- **Tags (13):** teardrop ring, teardrop evil eye, evil eye ring, nazar ring, gold evil eye ring, blue evil eye, dainty gold ring, everyday ring, 14k evil eye ring, cobalt blue enamel, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** drop 6.0 x 7.2 mm, 1.1 mm thick; band 1.6 mm round
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $720 (estimate)
- **Price range by karat:** 10K $420 to $690; 14K $600 to $1000; 18K $830 to $1390
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A small teardrop evil eye in cobalt blue enamel with a gold pupil, set low on a slim solid gold band.

The teardrop is the nazar that hangs over doors, point up. On the ring it lies along the finger with the point to the nail, and the last 1.5 mm of the point is solid polished gold, so the enamel stops before the tip. Band and drop are cast in one piece.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: drop 6.0 x 7.2 mm, 1.1 mm thick; band 1.6 mm round.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a slim ring in polished 14K yellow gold with a small flat teardrop on top, 7.2 mm long and 6 mm wide, about as wide as a pencil is thick, never larger, 1.1 mm thick, sitting low on a round band 1.6 mm thick, cast in one piece, the point of the teardrop toward the fingertip when worn. The teardrop is a circle 6 mm across with two straight sides that meet in a right-angled point. Inside a thin polished gold rim 0.4 mm wide, one band of cobalt blue enamel (#17368C), 1.5 mm wide, follows the outline at an even width around a round polished gold centre dot 2.2 mm across at the centre of the round end; the last 1.5 mm of the point is solid polished gold with no enamel. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). No eyelashes, no eyelid line, no realistic iris. The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** persimmon #D2643A, accent nude, skin deep brown. Saturated orange, the direct complement of cobalt, for the smallest teardrop.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R02.


Full variant list with SKUs and prices: variants.csv (rows for R02).

### N02 · Teardrop Evil Eye Necklace (family 2 Damla)

- **Title:** Teardrop Evil Eye Necklace, Cobalt Blue and White Enamel Evil Eye Pendant on Solid Gold Chain, Nazar Necklace
- **Tags (13):** teardrop necklace, teardrop evil eye, evil eye necklace, evil eye pendant, nazar necklace, gold evil eye, blue evil eye, new home gift, dainty necklace, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** drop 8.8 x 10.6 mm, 1.2 mm thick
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $560 (estimate)
- **Price range by karat:** 10K $400 to $440; 14K $540 to $590; 18K $700 to $780
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A teardrop evil eye pendant in cobalt blue and white enamel, hanging point up from a loop cast into its tip.

Dark outside and light inside, the way the nazar is drawn: cobalt blue, a thin gold wall, white, and a gold pupil. The last 1.5 mm of the point is solid gold, and the jump ring is closed by laser weld.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel and white enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: drop 8.8 x 10.6 mm, 1.2 mm thick.
Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a flat teardrop pendant in polished 14K yellow gold, 10.6 mm tall and 8.8 mm wide, about as wide as the index fingernail, never larger, 1.2 mm thick, hanging point up: a small gold loop at the point carries a gold jump ring and the fine 1.2 mm cable chain. The teardrop is a circle 8.8 mm across with two straight sides that meet in a right-angled point, its height about one fifth more than its width. From the outline inward: a thin polished gold rim, 0.4 mm; a band of cobalt blue enamel (#17368C), 1.5 mm wide; a thin gold wall, 0.4 mm; a band of porcelain white enamel, flat, opaque and glossy (#F3F1EA), 1.5 mm wide; and a round polished gold centre dot, 1.2 mm across, at the centre of the round end. Both enamel bands are smaller teardrops of even width that follow the outline; the last 1.5 mm of the point is solid polished gold with no enamel. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), porcelain white (#F3F1EA). No eyelashes, no eyelid line, no realistic iris. The pendant lies flat and face up, and the fine chain leaves it as one single strand whose two halves rise straight up and apart like the arms of a letter V and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** salmon clay #D88A78, accent cobalt blue, skin fair. Soft red-orange clay; the white band stays brighter than the ground and the cobalt pops.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N02.


Full variant list with SKUs and prices: variants.csv (rows for N02).

### B02 · Teardrop Evil Eye Charm Bracelet (family 2 Damla)

- **Title:** Teardrop Evil Eye Charm Bracelet, Cobalt Blue and White Enamel Nazar Charm on Solid Gold Chain
- **Tags (13):** teardrop bracelet, teardrop evil eye, evil eye bracelet, nazar bracelet, charm bracelet, gold evil eye, blue evil eye, dainty bracelet, new home gift, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** drop 8.8 x 10.6 mm, 1.2 mm thick
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $600 (estimate)
- **Price range by karat:** 10K $470 to $490; 14K $590 to $620; 18K $740 to $780
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A teardrop evil eye charm in cobalt blue and white enamel, hanging free at the centre of a fine solid gold chain.

The only charm in the collection that swings: it hangs from a jump ring and turns to show a solid, polished gold back. Cobalt blue outside, white inside, a gold pupil at the centre.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel and white enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: drop 8.8 x 10.6 mm, 1.2 mm thick.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with one flat teardrop charm, 10.6 mm tall and 8.8 mm wide, about as wide as the index fingernail, never larger, 1.2 mm thick, that hangs free, point up, from a small gold jump ring at the centre of the chain, the jump ring through a small loop at the point. The teardrop is a circle 8.8 mm across with two straight sides that meet in a right-angled point, its height about one fifth more than its width. From the outline inward: a thin polished gold rim, 0.4 mm; a band of cobalt blue enamel (#17368C), 1.5 mm wide; a thin gold wall, 0.4 mm; a band of porcelain white enamel, flat, opaque and glossy (#F3F1EA), 1.5 mm wide; and a round polished gold centre dot, 1.2 mm across, at the centre of the round end. Both enamel bands are smaller teardrops of even width that follow the outline; the last 1.5 mm of the point is solid polished gold with no enamel. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back; spring ring clasp. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), porcelain white (#F3F1EA). No eyelashes, no eyelid line, no realistic iris. The bracelet lies in one soft open curve, one continuous chain from end to end, with the teardrop charm face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** mahogany #551C17, accent porcelain white, skin warm tan. Deep red-brown: the white band and the solid gold point glow on a dark warm ground.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B02.


Full variant list with SKUs and prices: variants.csv (rows for B02).

### R03 · White and Blue Almond Evil Eye Bypass Ring (family 3 Mati)

- **Title:** White and Blue Almond Evil Eye Bypass Ring, White and Cobalt Blue Enamel Nazar in Solid Gold, Bridesmaid Gift Ring
- **Tags (13):** almond evil eye, bypass ring, greek evil eye, evil eye ring, nazar ring, gold evil eye ring, white evil eye, bridesmaid gift, greek jewelry, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** almond 11.0 x 6.6 mm, 1.2 mm thick; band 1.5 mm round
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $720 (estimate)
- **Price range by karat:** 10K $420 to $690; 14K $600 to $1000; 18K $830 to $1390
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A bypass ring in solid gold: one end finishes in an almond evil eye in white and cobalt blue enamel, the other in a plain polished taper.

The almond is the modern form of the nazar, with white enamel on each side, a ring of cobalt blue around a gold pupil and solid gold tips. The band is rigid and sized like any ring, and the plain end stops 4 mm short of the eye.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous white enamel and cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: almond 11.0 x 6.6 mm, 1.2 mm thick; band 1.5 mm round.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: an open bypass ring in polished 14K yellow gold: a rigid round band 1.5 mm thick whose two ends pass each other side by side at the top of the ring. One end finishes in a flat almond-shaped plate, 11 mm long and 6.6 mm wide, about as wide as the index fingernail, never larger, 1.2 mm thick, its long axis following the band; the other end is a plain polished tapered end that stops 4 mm short of the almond. The almond is two shallow arcs that meet in two pointed tips, framed by a thin polished gold rim 0.4 mm wide. At its centre is a round island 5 mm across: a thin gold ring 0.4 mm wide, a ring of cobalt blue enamel (#17368C) 1.5 mm wide and a round polished gold centre dot 1.2 mm across, with 0.8 mm of plain gold above and below the island. On each side of the island is a cell of porcelain white enamel, flat, opaque and glossy (#F3F1EA), 1.6 mm long, tall next to the island and narrowing toward the tip; the last 1 mm of each tip is solid polished gold. The almond is a closed solid plate, never an open outline; no eyelashes, no eyelid line, no realistic iris. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: porcelain white (#F3F1EA), cobalt blue (#17368C). The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** blush peach #EBB19E, accent porcelain white, skin medium olive. Soft bridal peach, split complementary to cobalt; the white cells keep their edge at this value.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R03.


Full variant list with SKUs and prices: variants.csv (rows for R03).

### N03 · Almond Evil Eye Lariat Necklace (family 3 Mati)

- **Title:** Almond Evil Eye Lariat Necklace, White and Cobalt Blue Enamel Nazar on a Solid Gold Y Necklace, Bridesmaid Gift
- **Tags (13):** lariat necklace, y necklace, almond evil eye, greek evil eye, evil eye necklace, nazar necklace, gold evil eye, bridesmaid gift, greek jewelry, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** almond 11.0 x 6.6 mm, 1.2 mm thick; 40 mm drop below a 3.0 mm gold bead
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $560 (estimate)
- **Price range by karat:** 10K $400 to $440; 14K $540 to $590; 18K $700 to $780
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A Y lariat in solid gold: a 3 mm gold bead at the Y, then a 40 mm drop ending in an almond evil eye in white and cobalt blue enamel.

The almond hangs level, its long side parallel to the collarbone, from a small loop hidden behind the middle of its top edge. White enamel on each side, cobalt blue around a gold pupil, and solid gold at both tips.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous white enamel and cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: almond 11.0 x 6.6 mm, 1.2 mm thick; 40 mm drop below a 3.0 mm gold bead.
Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches, measured to the Y.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a Y-shaped lariat necklace in polished 14K yellow gold: the fine 1.2 mm cable chain meets at the front in a 3 mm solid polished gold ball, and from the ball a single 40 mm length of the same chain drops straight down to a flat almond-shaped plate, 11 mm long and 6.6 mm wide, about as wide as the index fingernail, never larger, 1.2 mm thick, which hangs level, its long axis horizontal, from a small loop hidden behind the middle of its top edge. The almond is two shallow arcs that meet in two pointed tips, framed by a thin polished gold rim 0.4 mm wide. At its centre is a round island 5 mm across: a thin gold ring 0.4 mm wide, a ring of cobalt blue enamel (#17368C) 1.5 mm wide and a round polished gold centre dot 1.2 mm across, with 0.8 mm of plain gold above and below the island. On each side of the island is a cell of porcelain white enamel, flat, opaque and glossy (#F3F1EA), 1.6 mm long, tall next to the island and narrowing toward the tip; the last 1 mm of each tip is solid polished gold. The almond is a closed solid plate, never an open outline; no eyelashes, no eyelid line, no realistic iris. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: porcelain white (#F3F1EA), cobalt blue (#17368C). The lariat lies face up: the drop runs straight down from the gold ball to the almond, and the two halves of the chain rise from the ball straight up and apart and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** brick #9C4433, accent cobalt blue, skin deep brown. Red-orange brick: the white cells and the cobalt ring both read on a mid-dark warm ground.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N03.


Full variant list with SKUs and prices: variants.csv (rows for N03).

### B03 · Almond Evil Eye Bracelet (family 3 Mati)

- **Title:** Almond Evil Eye Bracelet, White and Cobalt Blue Enamel Nazar on Solid Gold Chain, Bridesmaid Gift Bracelet
- **Tags (13):** almond evil eye, greek evil eye, evil eye bracelet, nazar bracelet, gold evil eye, white evil eye, bridesmaid gift, greek jewelry, dainty bracelet, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** almond 11.0 x 6.6 mm, 1.2 mm thick
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $600 (estimate)
- **Price range by karat:** 10K $470 to $490; 14K $590 to $620; 18K $740 to $780
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
An almond evil eye in white and cobalt blue enamel, lying level on top of the wrist on a fine solid gold chain.

The chain passes behind the almond through two hidden loops near its top edge, about 2.5 mm in from each tip, so the eye sits level and both gold tips hang free below the chain.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous white enamel and cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: almond 11.0 x 6.6 mm, 1.2 mm thick.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with one flat almond-shaped plate, 11 mm long and 6.6 mm wide, about as wide as the index fingernail, never larger, 1.2 mm thick, at its centre, its long axis along the chain: the chain runs straight across just inside the top edge of the almond, passing behind it through two small loops hidden behind the upper edge about 2.5 mm in from each tip, so both pointed tips sit below the chain and touch nothing. The almond is two shallow arcs that meet in two pointed tips, framed by a thin polished gold rim 0.4 mm wide. At its centre is a round island 5 mm across: a thin gold ring 0.4 mm wide, a ring of cobalt blue enamel (#17368C) 1.5 mm wide and a round polished gold centre dot 1.2 mm across, with 0.8 mm of plain gold above and below the island. On each side of the island is a cell of porcelain white enamel, flat, opaque and glossy (#F3F1EA), 1.6 mm long, tall next to the island and narrowing toward the tip; the last 1 mm of each tip is solid polished gold. The almond is a closed solid plate, never an open outline; no eyelashes, no eyelid line, no realistic iris. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back; spring ring clasp. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: porcelain white (#F3F1EA), cobalt blue (#17368C). The bracelet lies in one soft open curve, one continuous chain from end to end, with the almond face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** caramel #A9784F, accent nude, skin light warm. Warm caramel, a Mediterranean mid-tone; white and cobalt are the only cool notes.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B03.


Full variant list with SKUs and prices: variants.csv (rows for B03).

### R04 · Beaded Evil Eye Stacking Ring (family 4 Bead String)

- **Title:** Beaded Evil Eye Stacking Ring, Cobalt Blue Enamel Nazar on a Solid Gold Bead Band, Dainty Gold Ring
- **Tags (13):** beaded ring, bead stacking ring, stacking ring, evil eye ring, nazar ring, gold evil eye ring, blue evil eye, dainty gold ring, gold bead ring, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye 6.0 mm on a 0.6 mm gallery; beads 1.8 mm
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $720 (estimate)
- **Price range by karat:** 10K $420 to $690; 14K $600 to $1000; 18K $830 to $1390
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A rigid band of small solid gold beads with a 6 mm cobalt blue enamel evil eye set flat on top.

The blue eye and gold beads of a Turkish bead string, made in solid gold and cast in one piece, so there is no cord to stretch or break. The beads are all the same size and run evenly all the way round.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 6.0 mm on a 0.6 mm gallery; beads 1.8 mm.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a rigid closed ring band made of small solid polished 14K yellow gold balls, each 1.8 mm across, all the same size, in one single row, each fused to the next, with no thread, no elastic and no gaps, cast in one piece. On top of the band, on a low gold gallery 0.6 mm high, sits a flat round disc, 6 mm across, slightly thinner than a pencil, never larger: a polished gold rim 0.5 mm wide, a ring of cobalt blue enamel (#17368C) 1.7 mm wide and a round polished gold centre dot 1.6 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). No eyelashes, no eyelid line, no realistic iris. The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** tangerine clay #E08A55, accent cobalt blue, skin warm tan. Summer orange opposite cobalt; the gold balls glow like sun on clay.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R04.


Full variant list with SKUs and prices: variants.csv (rows for R04).

### N04 · Evil Eye Bead Station Necklace (family 4 Bead String)

- **Title:** Evil Eye Bead Station Necklace, Three Cobalt Blue Enamel Nazars with Solid Gold Beads, Dainty Layering Necklace
- **Tags (13):** evil eye necklace, nazar necklace, station necklace, bead necklace, gold evil eye, blue evil eye, dainty necklace, layering necklace, travel gift, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** three stations, each 10 mm long with a 6.0 mm eye between two 2.0 mm beads; 22 mm apart
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $1060 (estimate)
- **Price range by karat:** 10K $780 to $820; 14K $1040 to $1090; 18K $1360 to $1440
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
Three stations set into a fine solid gold chain, each a 6 mm cobalt blue enamel evil eye between two solid gold beads.

Each station is one cast bar 10 mm long, joined into the chain at both ends by laser weld, so the three stay 22 mm apart at the front of the neck. The blue eye and gold beads of a Turkish bead string, without glass or cord.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: three stations, each 10 mm long with a 6.0 mm eye between two 2.0 mm beads; 22 mm apart.
Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.2 mm cable chain necklace in polished 14K yellow gold with three identical stations fixed at the front, 22 mm apart, the chain between them bare. Each station is one rigid piece, 10 mm long, about as wide as the index fingernail, never larger: a flat round disc 6 mm across, slightly thinner than a pencil, with one solid polished gold ball 2 mm across fused to its left edge and one fused to its right edge, and a tiny gold loop at each end where the chain is joined. The disc: a polished gold rim 0.5 mm wide, a ring of cobalt blue enamel (#17368C) 1.7 mm wide and a round polished gold centre dot 1.6 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold backs. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). No eyelashes, no eyelid line, no realistic iris. The necklace lies with the three stations face up at the bottom of one smooth U-shaped curve of chain whose two halves rise straight up and apart and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** sand clay #C49A7A, accent nude, skin light warm. Sun-baked sand clay, a soft warm mid-tone; the three cobalt discs are the only cool points.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N04.


Full variant list with SKUs and prices: variants.csv (rows for N04).

### B04 · Evil Eye Bead Station Bracelet (family 4 Bead String)

- **Title:** Evil Eye Bead Station Bracelet, Three Cobalt Blue Enamel Nazars with Solid Gold Beads, Dainty Stacking Bracelet
- **Tags (13):** evil eye bracelet, nazar bracelet, station bracelet, bead bracelet, gold evil eye, blue evil eye, summer bracelet, travel gift, dainty bracelet, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** three stations, each 10 mm long with a 6.0 mm eye between two 2.0 mm beads; 18 mm apart
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $1000 (estimate)
- **Price range by karat:** 10K $750 to $770; 14K $990 to $1020; 18K $1300 to $1340
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
Three small bead and evil eye stations on a fine solid gold bracelet chain: cobalt blue enamel eyes between solid gold beads.

Each station is one cast bar 10 mm long, laser welded into the chain at both ends and spaced 18 mm apart, so the eyes sit evenly on top of the wrist. Bright enough for summer, fine enough to wear every day.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: three stations, each 10 mm long with a 6.0 mm eye between two 2.0 mm beads; 18 mm apart.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with three identical stations fixed at its centre, 18 mm apart, the chain between them bare. Each station is one rigid piece, 10 mm long, about as wide as the index fingernail, never larger: a flat round disc 6 mm across, slightly thinner than a pencil, with one solid polished gold ball 2 mm across fused to its left edge and one fused to its right edge, and a tiny gold loop at each end where the chain is joined. The disc: a polished gold rim 0.5 mm wide, a ring of cobalt blue enamel (#17368C) 1.7 mm wide and a round polished gold centre dot 1.6 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold backs; spring ring clasp. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). No eyelashes, no eyelid line, no realistic iris. The bracelet lies in one soft open curve, one continuous chain from end to end, with the three stations face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** burnt orange #A65424, accent cobalt blue, skin fair. A deep orange complement: the cobalt stations are the only cool points on the wrist.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B04.


Full variant list with SKUs and prices: variants.csv (rows for B04).

### R05 · Hexagon Tile Evil Eye Ring (family 5 Çini)

- **Title:** Hexagon Tile Evil Eye Ring, Cobalt Blue and Turquoise Enamel Nazar on a Solid Gold Band, Geometric Ring
- **Tags (13):** hexagon ring, tile ring, evil eye ring, nazar ring, gold evil eye ring, turquoise enamel, turkish jewelry, ottoman jewelry, travel gift, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** hexagon 9.2 mm flat to flat, 1.3 mm thick; band 2.0 mm wide, 1.4 mm thick
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $720 (estimate)
- **Price range by karat:** 10K $420 to $690; 14K $600 to $1000; 18K $830 to $1390
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A flat hexagon of cobalt blue enamel with a turquoise enamel evil eye at its centre, lying flat on a solid gold band.

The colours are inspired by Ottoman tilework from Iznik, after the first two glazes of the old tiles, and turquoise enamel is also a traditional colour for the nazar. The cobalt blue fills the hexagon to its gold rim, so the eye stays dark outside and light inside.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel and turquoise enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: hexagon 9.2 mm flat to flat, 1.3 mm thick; band 2.0 mm wide, 1.4 mm thick.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a ring with a flat hexagon on top, 9.2 mm across the flats, a little narrower than the index fingernail, never larger, 1.3 mm thick, sitting flat on a band of polished 14K yellow gold 2 mm wide and 1.4 mm thick with a flat inner side. The hexagon is regular, with six equal straight sides and crisp corners, framed by a thin polished gold rim 0.4 mm wide. Its field is cobalt blue enamel (#17368C), 1.6 mm wide at the middle of each side, around a round island 5.2 mm across at the centre: a thin gold ring 0.4 mm wide, a ring of turquoise enamel (#23A5B2) 1.5 mm wide and a round polished gold centre dot 1.4 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), turquoise (#23A5B2). No eyelashes, no eyelid line, no realistic iris. The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** coral #E27D67, accent turquoise, skin fair. Warm coral opposite turquoise and cobalt; both glazes pop.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R05.


Full variant list with SKUs and prices: variants.csv (rows for R05).

### N05 · Hexagon Tile Evil Eye Necklace (family 5 Çini)

- **Title:** Hexagon Tile Evil Eye Necklace, Cobalt Blue and Turquoise Enamel Evil Eye Pendant, Solid Gold Nazar Necklace
- **Tags (13):** hexagon necklace, tile necklace, evil eye necklace, evil eye pendant, nazar necklace, turquoise enamel, turkish jewelry, ottoman jewelry, travel gift, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** hexagon 10.0 mm flat to flat, 1.2 mm thick
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $580 (estimate)
- **Price range by karat:** 10K $420 to $460; 14K $560 to $610; 18K $730 to $810
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A hexagon evil eye pendant in cobalt blue and turquoise enamel, hanging from one corner on a fine solid gold chain.

Inspired by Ottoman tilework from Iznik, in the colours of its first two glazes. It hangs from a loop cast into its top corner, with the cobalt blue enamel running out to a polished gold rim around a turquoise enamel eye.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel and turquoise enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: hexagon 10.0 mm flat to flat, 1.2 mm thick.
Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a flat hexagon pendant in polished 14K yellow gold, 10 mm across the flats, about as wide as the index fingernail, never larger, 1.2 mm thick, hanging from its top corner by a small gold loop on the fine 1.2 mm cable chain. The hexagon is regular, with six equal straight sides and crisp corners, framed by a thin polished gold rim 0.4 mm wide. Its field is cobalt blue enamel (#17368C), 2 mm wide at the middle of each side, around a round island 5.2 mm across at the centre: a thin gold ring 0.4 mm wide, a ring of turquoise enamel (#23A5B2) 1.5 mm wide and a round polished gold centre dot 1.4 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), turquoise (#23A5B2). No eyelashes, no eyelid line, no realistic iris. The pendant lies flat and face up, and the fine chain leaves it as one single strand whose two halves rise straight up and apart like the arms of a letter V and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** deep plum #4F2140, accent turquoise, skin warm tan. Dark plum: the turquoise ring is the brightest point and the gold glows.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N05.


Full variant list with SKUs and prices: variants.csv (rows for N05).

### B05 · Hexagon Tile Evil Eye Bracelet (family 5 Çini)

- **Title:** Hexagon Tile Evil Eye Bracelet, Cobalt Blue and Turquoise Enamel Nazar Stations on Solid Gold Chain
- **Tags (13):** hexagon bracelet, tile bracelet, evil eye bracelet, nazar bracelet, station bracelet, turquoise enamel, turkish jewelry, ottoman jewelry, travel gift, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye hexagon 9.2 mm, two side hexagons 5.0 mm, 5 mm apart
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $1000 (estimate)
- **Price range by karat:** 10K $750 to $770; 14K $990 to $1020; 18K $1300 to $1340
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A cobalt blue and turquoise enamel hexagon evil eye between two small turquoise enamel hexagons, set into a fine solid gold chain.

Inspired by Ottoman tilework from Iznik. The two small hexagons are plain turquoise enamel with no centre dot, so the one eye in the middle stays the focus, and all three are joined into the chain 5 mm apart.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous cobalt blue enamel and turquoise enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye hexagon 9.2 mm, two side hexagons 5.0 mm, 5 mm apart.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with three flat hexagons in a row at its centre, 5 mm apart, joined into the line of the chain by small gold loops at their side corners. The middle hexagon is 9.2 mm across the flats, a little narrower than the index fingernail, never larger, 1.3 mm thick. The hexagon is regular, with six equal straight sides and crisp corners, framed by a thin polished gold rim 0.4 mm wide. Its field is cobalt blue enamel (#17368C), 1.6 mm wide at the middle of each side, around a round island 5.2 mm across at the centre: a thin gold ring 0.4 mm wide, a ring of turquoise enamel (#23A5B2) 1.5 mm wide and a round polished gold centre dot 1.4 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. On each side of the middle hexagon is a small flat hexagon, 5 mm across the flats, slightly thinner than a pencil, never larger, filled with plain turquoise enamel inside a thin polished gold rim, with no centre dot and no ring, and a closed, solid, flat gold back. Every hexagon is regular, with six equal straight sides and crisp corners; spring ring clasp. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), turquoise (#23A5B2). No eyelashes, no eyelid line, no realistic iris. The bracelet lies in one soft open curve, one continuous chain from end to end, with the three hexagons face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** dusty plum #8A5A78, accent nude, skin medium olive. Muted red-violet opposite turquoise, soft enough for three small hexagons.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B05.


Full variant list with SKUs and prices: variants.csv (rows for B05).

### R06 · Mother and Child Evil Eye Ring, Two Tone (family 6 Mother and Child)

- **Title:** Mother and Child Evil Eye Ring, Two Tone, Cobalt Blue and Sky Blue Enamel Nazars in Solid Gold, New Mom Gift
- **Tags (13):** two tone ring, mixed metal ring, evil eye ring, nazar ring, new mom gift, push present, mothers day gift, gift for mom, toi et moi ring, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eyes 9.0 mm and 6.0 mm, about 13.5 x 13.5 mm together; band 1.8 mm round
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $820 (estimate)
- **Price range by karat:** 10K $520 to $790; 14K $700 to $1100; 18K $930 to $1490
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
Two evil eyes side by side on a solid gold band: a 9 mm eye in cobalt blue and sky blue enamel and a 6 mm cobalt blue enamel eye in the second gold.

A gift for a new mother: the large eye and the small one, each enamelled and fired on its own, then joined rim to rim. The small eye sits low at one side of the large one, its pupil and a thin rim in the second gold: two eyes, two golds.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the large eye, the setting of the small eye and the band are in the main metal; the small eye's plate, which shows as its pupil and a thin rim, is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel and sky blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eyes 9.0 mm and 6.0 mm, about 13.5 x 13.5 mm together; band 1.8 mm round.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a ring with two flat round discs joined rim to rim on top of a slim round band 1.8 mm thick, together 13.5 mm across, about as wide as a thumbnail, never wider than the finger, never larger: a large disc 9 mm across and, at its lower right at the 4 to 5 o'clock position, a small disc 6 mm across; the large disc is one and a half times the small one. Each part is entirely one metal: the band, the large disc with its rims and centre dot, and the thin raised collar around the small disc are polished yellow gold; the small disc inside that collar is polished unplated white gold, a soft warm grey metal with mirror reflections. The large disc, from the edge inward: a polished yellow gold rim 0.4 mm wide; a ring of cobalt blue enamel (#17368C) 1.5 mm wide; a thin yellow gold ring 0.4 mm wide; a ring of pale sky blue enamel (#8CC3E8) 1.5 mm wide; and a round yellow gold centre dot 1.4 mm across. The small disc, from the edge inward: a white gold rim 0.5 mm wide; a ring of cobalt blue enamel 1.5 mm wide; and a round white gold centre dot 2 mm across; it sits flush, not domed, in a thin raised yellow gold collar 0.4 mm wide that is joined to the large disc with at least 0.8 mm of gold at the joint. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold backs. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), pale sky blue (#8CC3E8). No eyelashes, no eyelid line, no realistic iris. The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** dusty rose #CC9590, accent sky blue, skin deep brown. Soft warm rose for a new mother's gift; cobalt and sky stay clear and both golds read.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R06.


Full variant list with SKUs and prices: variants.csv (rows for R06).

### N06 · Mother and Child Evil Eye Necklace, Two Tone (family 6 Mother and Child)

- **Title:** Mother and Child Evil Eye Necklace, Two Tone, Double Evil Eye Pendant, Solid Gold Nazar, New Mom Gift
- **Tags (13):** two tone necklace, mixed metal necklace, evil eye necklace, evil eye pendant, nazar necklace, new mom gift, push present, mothers day gift, gift for mom, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** 9.0 mm eye above a 6.0 mm eye, 15.8 mm tall
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $760 (estimate)
- **Price range by karat:** 10K $570 to $610; 14K $740 to $790; 18K $940 to $1020
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A double evil eye pendant: a 9 mm eye in cobalt blue and sky blue enamel with a 6 mm cobalt blue enamel eye directly below it, in two colours of solid gold.

Made as a gift for a mother, one eye for her and one for her child. The bail sits behind the top of the large eye, in line with the small one, so the pair hangs straight.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the large eye, the setting of the small eye, the bail and the chain are in the main metal; the small eye's plate, which shows as its pupil and a thin rim, is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel and sky blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: 9.0 mm eye above a 6.0 mm eye, 15.8 mm tall.
Chain: 1.2 mm solid gold cable chain in the main metal, spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a pendant of two flat round discs joined rim to rim, one directly below the other, together 9 mm wide and 15.8 mm tall, about the length of a thumbnail, never larger: the large disc 9 mm across at the top and the small disc 6 mm across straight below it at 6 o'clock; the large disc is one and a half times the small one. The fine 1.2 mm cable chain passes through a small tube hidden behind the top of the large disc, so no loop shows above it and the small disc hangs straight below the large one. Each part is entirely one metal: the large disc with its rims and centre dot, the thin raised collar around the small disc, the hidden tube and the chain are polished yellow gold; the small disc inside the collar is polished unplated white gold, a soft warm grey metal with mirror reflections. The large disc, from the edge inward: a polished yellow gold rim 0.4 mm wide; a ring of cobalt blue enamel (#17368C) 1.5 mm wide; a thin yellow gold ring 0.4 mm wide; a ring of pale sky blue enamel (#8CC3E8) 1.5 mm wide; and a round yellow gold centre dot 1.4 mm across. The small disc, from the edge inward: a white gold rim 0.5 mm wide; a ring of cobalt blue enamel 1.5 mm wide; and a round white gold centre dot 2 mm across; it sits flush, not domed, in a thin raised yellow gold collar 0.4 mm wide that is joined to the large disc with at least 0.8 mm of gold at the joint. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold backs. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), pale sky blue (#8CC3E8). No eyelashes, no eyelid line, no realistic iris. The pendant lies flat and face up, and the fine chain leaves it as one single strand whose two halves rise straight up and apart like the arms of a letter V and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** rosewood #82504A, accent nude, skin light warm. A pink-brown mid-dark ground: the small white gold disc reads as cool metal below the yellow.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N06.


Full variant list with SKUs and prices: variants.csv (rows for N06).

### B06 · Mother and Child Evil Eye Bracelet, Two Tone (family 6 Mother and Child)

- **Title:** Mother and Child Evil Eye Bracelet, Two Tone, Cobalt Blue and Sky Blue Enamel Nazars on Solid Gold Chain, Mothers Day Gift
- **Tags (13):** two tone bracelet, mixed metal bracelet, evil eye bracelet, nazar bracelet, new mom gift, push present, mothers day gift, gift for mom, station bracelet, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eyes 9.0 mm and 6.0 mm
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $900 (estimate)
- **Price range by karat:** 10K $710 to $730; 14K $890 to $920; 18K $1120 to $1160
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
Two evil eyes at the centre of a fine solid gold chain: a 9 mm eye in cobalt blue and sky blue enamel and a 6 mm cobalt blue enamel eye in the second gold.

Made as a gift for a mother. The two eyes are separate stations with their own cast loops, joined at the centre by one small jump ring closed by laser weld, so they sit side by side on the wrist.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the large eye, the setting of the small eye, the jump ring and the chain are in the main metal; the small eye's plate, which shows as its pupil and a thin rim, is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel and sky blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eyes 9.0 mm and 6.0 mm.
Chain: 1.1 mm solid gold cable chain in the main metal, spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm yellow gold cable chain bracelet with two flat round discs side by side at its centre, in the line of the chain and joined to each other by one small yellow gold jump ring: a large disc 9 mm across, a little narrower than the index fingernail, never larger, and a small disc 6 mm across, slightly thinner than a pencil, never larger; each disc has a small yellow gold loop on its outer side where the chain continues. Each part is entirely one metal: the chain, the jump ring, the loops, the large disc with its rims and centre dot, and the thin raised collar around the small disc are polished yellow gold; the small disc inside the collar is polished unplated white gold, a soft warm grey metal with mirror reflections. The large disc, from the edge inward: a polished yellow gold rim 0.4 mm wide; a ring of cobalt blue enamel (#17368C) 1.5 mm wide; a thin yellow gold ring 0.4 mm wide; a ring of pale sky blue enamel (#8CC3E8) 1.5 mm wide; and a round yellow gold centre dot 1.4 mm across. The small disc, from the edge inward: a white gold rim 0.5 mm wide; a ring of cobalt blue enamel 1.5 mm wide; and a round white gold centre dot 2 mm across; it sits flush, not domed, in a thin raised yellow gold collar 0.4 mm wide. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold backs; spring ring clasp. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C), pale sky blue (#8CC3E8). No eyelashes, no eyelid line, no realistic iris. The bracelet lies in one soft open curve, one continuous chain from end to end, with the two discs face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** cognac #7E4423, accent sky blue, skin warm tan. Warm leather brown: both discs and both golds separate on the wrist.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B06.


Full variant list with SKUs and prices: variants.csv (rows for B06).

### R07 · Two Tone Evil Eye Coin Ring (family 7 Medal)

- **Title:** Two Tone Evil Eye Coin Ring, Cobalt Blue Enamel Almond Nazar on a Solid Gold Disc, Mixed Metal Ring
- **Tags (13):** two tone ring, mixed metal ring, evil eye ring, nazar ring, coin ring, evil eye coin, graduation gift, unisex ring, new job gift, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** disc 9.0 mm, 1.3 mm thick; almond 7.0 x 3.6 mm; band 2.0 mm wide, 1.4 mm thick
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $820 (estimate)
- **Price range by karat:** 10K $520 to $790; 14K $700 to $1100; 18K $930 to $1490
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A 9 mm solid gold disc on a slim band, its satin face carrying a polished almond evil eye in the second gold with a cobalt blue enamel iris.

A gold coin is the old gift for a milestone, made here in two golds. The almond is cast with its own pins, enamelled and fired alone, then pinned through the disc with no solder near the enamel. The face is plain: no lettering, only the almond.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the disc and band are in the main metal; the polished almond with its cobalt blue enamel iris is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: disc 9.0 mm, 1.3 mm thick; almond 7.0 x 3.6 mm; band 2.0 mm wide, 1.4 mm thick.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a ring with a flat round top: a round disc 9 mm across, a little narrower than the index fingernail, never larger, 1.3 mm thick, with a plain satin-finished face, a polished border 0.6 mm wide and a polished bevelled edge, on a band 2 mm wide and 1.4 mm thick with a flat inner side; no engraving, no lettering, no numbers; nothing on the face but the raised almond. Each part is entirely one metal: the disc and the band are polished yellow gold; a small raised almond on the satin face is polished unplated white gold, a soft warm grey metal with mirror reflections. The almond is 7 mm long and 3.6 mm wide, 0.9 mm thick and polished, fixed flat on the centre of the satin face with its long axis across the finger; at its centre is one round cell of cobalt blue enamel (#17368C), 1.6 mm across, inside a thin white gold rim 0.4 mm wide. The satin face itself has no enamel; the almond is a closed solid plate; no eyelashes, no eyelid line, no realistic iris. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold back. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** walnut #614532, accent nude, skin medium olive. Dark warm wood: the satin yellow face and the polished white gold almond both read.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R07.


Full variant list with SKUs and prices: variants.csv (rows for R07).

### N07 · Two Tone Evil Eye Coin Necklace (family 7 Medal)

- **Title:** Two Tone Evil Eye Coin Necklace, Mixed Metal Evil Eye Pendant with Cobalt Blue Enamel, Solid Gold Nazar Coin
- **Tags (13):** two tone necklace, mixed metal necklace, evil eye necklace, evil eye pendant, coin necklace, evil eye coin, nazar necklace, graduation gift, unisex necklace, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** coin 11.0 mm, 1.0 mm thick, reeded edge; almond 8.0 x 4.0 mm
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $780 (estimate)
- **Price range by karat:** 10K $590 to $630; 14K $760 to $810; 18K $970 to $1050
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
An 11 mm solid gold coin with a satin face, a reeded edge and a polished almond evil eye in the second gold, riveted to the front.

Single sided and plain: no lettering, no rays, only the almond with its cobalt blue enamel iris. The almond is fired on its own and its cast pins are riveted flush at the back, so no heat reaches the enamel.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the coin, loop and chain are in the main metal; the polished almond with its cobalt blue enamel iris is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: coin 11.0 mm, 1.0 mm thick, reeded edge; almond 8.0 x 4.0 mm.
Chain: 1.2 mm solid gold cable chain in the main metal, spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a round disc pendant, 11 mm across, about as wide as the index fingernail, never larger, 1 mm thick, with a plain satin-finished face, a polished border 0.6 mm wide and a finely ridged edge; no engraving, no lettering, no numbers; nothing on the face but the raised almond; it hangs from a small loop at the top through a jump ring on the fine 1.2 mm cable chain. Each part is entirely one metal: the disc, the loop, the jump ring and the chain are polished yellow gold; a small raised almond on the satin face is polished unplated white gold, a soft warm grey metal with mirror reflections. The almond is 8 mm long and 4 mm wide, 0.9 mm thick and polished, fixed flat at the centre of the satin face with its long axis horizontal; at its centre is one round cell of cobalt blue enamel (#17368C), 2 mm across, inside a thin white gold rim 0.4 mm wide. The satin face itself has no enamel; the almond is a closed solid plate; no eyelashes, no eyelid line, no realistic iris. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold back. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). The pendant lies flat and face up, and the fine chain leaves it as one single strand whose two halves rise straight up and apart like the arms of a letter V and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** chestnut #5B2C16, accent cobalt blue, skin fair. Deep red-brown for the largest disc; the ridged edge catches the light.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N07.


Full variant list with SKUs and prices: variants.csv (rows for N07).

### B07 · Two Tone Evil Eye Coin Bracelet (family 7 Medal)

- **Title:** Two Tone Evil Eye Coin Bracelet, Cobalt Blue Enamel Almond Nazar on a Solid Gold Coin, Mixed Metal Bracelet
- **Tags (13):** two tone bracelet, mixed metal bracelet, evil eye bracelet, nazar bracelet, coin bracelet, evil eye coin, graduation gift, unisex bracelet, new job gift, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** coin 8.5 mm, 0.9 mm thick, reeded edge; almond 6.4 x 3.2 mm
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $700 (estimate)
- **Price range by karat:** 10K $570 to $590; 14K $690 to $720; 18K $840 to $880
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
An 8.5 mm solid gold coin set at the centre of a fine chain, with a polished almond evil eye in the second gold riveted to its satin face.

The coin is a station with loops cast at each side, so it lies flat on the wrist. The almond and its cobalt blue enamel iris sit inside a polished border, with no lettering and nothing else on the face.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the coin, loops and chain are in the main metal; the polished almond with its cobalt blue enamel iris is in the second gold.
Enamel: kiln-fired vitreous cobalt blue enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: coin 8.5 mm, 0.9 mm thick, reeded edge; almond 6.4 x 3.2 mm.
Chain: 1.1 mm solid gold cable chain in the main metal, spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm yellow gold cable chain bracelet with one round disc, 8.5 mm across, a little narrower than the index fingernail, never larger, 0.9 mm thick, in the line of the chain at its centre, joined by two small loops at 3 and 9 o'clock; the disc has a plain satin-finished face, a polished border 0.6 mm wide and a finely ridged edge; no engraving, no lettering, no numbers; nothing on the face but the raised almond. Each part is entirely one metal: the chain, the loops and the disc are polished yellow gold; a small raised almond on the satin face is polished unplated white gold, a soft warm grey metal with mirror reflections. The almond is 6.4 mm long and 3.2 mm wide, 0.9 mm thick and polished, fixed flat at the centre of the satin face inside the border, its long axis along the chain; at its centre is one round cell of cobalt blue enamel (#17368C), 1.5 mm across, inside a thin white gold rim 0.4 mm wide. The satin face itself has no enamel; the almond is a closed solid plate; no eyelashes, no eyelid line, no realistic iris. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat yellow gold back; spring ring clasp. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: cobalt blue (#17368C). The bracelet lies in one soft open curve, one continuous chain from end to end, with the round disc face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** rust red #803022, accent nude, skin deep brown. Dark rust, warm against cobalt; the small disc glows on the wrist.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B07.


Full variant list with SKUs and prices: variants.csv (rows for B07).

### R08 · Two Tone Mixed Metal Evil Eye Ring (family 8 Twin Wire)

- **Title:** Two Tone Mixed Metal Evil Eye Ring, Two Solid Gold Wires with an Inlaid Gold Nazar, Stacking Ring
- **Tags (13):** two tone ring, mixed metal ring, two tone gold ring, evil eye ring, nazar ring, gold evil eye ring, stacking ring, double band ring, minimalist ring, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold
- **Dimensions:** band 2.6 mm wide, two 1.3 mm wires; eye 6.0 mm, 1.2 mm thick
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $920 (estimate)
- **Price range by karat:** 10K $620 to $890; 14K $800 to $1200; 18K $1030 to $1590
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | White gold plating unconfirmed | No images yet

**Description:**

```
Two round wires of solid gold in two colours, soldered side by side into one band, with a metal evil eye set flat over both.

No enamel: the eye is drawn in metal alone, a ring of the second gold inlaid flush into a disc of the main gold around a slightly domed gold pupil. It wears like a stack of two thin rings that stay together.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the wire nearer the fingertip, the eye's rim and its pupil are in the main metal; the other wire and the inlaid ring are in the second gold.
Finish: polished solid gold in two colours; no enamel, no stones.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: band 2.6 mm wide, two 1.3 mm wires; eye 6.0 mm, 1.2 mm thick.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a ring of two thin round rings, each 1.3 mm thick, fused side by side like a stack of two rings, together 2.6 mm wide: one ring entirely polished yellow gold, on the side toward the fingertip when worn, and one ring entirely polished unplated white gold, a soft warm grey metal with mirror reflections, on the side toward the hand. On top, across both rings on a low yellow gold gallery 0.6 mm high, sits a flat round disc, 6 mm across, slightly thinner than a pencil, never larger, 1.2 mm thick, all metal with no enamel: a yellow gold outer rim 0.5 mm wide, a flat polished white gold ring 1.5 mm wide inlaid flush, and a yellow gold centre dot 2 mm across, slightly raised. Each part is entirely one metal; no eyelashes, no eyelid line, no realistic iris; closed, solid, flat yellow gold back. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. No enamel, no colour and no stones; real metal reflections. The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** espresso #2B1D17, accent nude, skin warm tan. Near-black warm brown: yellow and white gold separate by tone alone, with no colour to compete.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R08.


Full variant list with SKUs and prices: variants.csv (rows for R08).

### N08 · Two Tone Evil Eye Station Necklace (family 8 Twin Wire)

- **Title:** Two Tone Evil Eye Station Necklace, Inlaid Two Colour Gold Nazar on Fine Solid Gold Chain, Mixed Metal Necklace
- **Tags (13):** two tone necklace, mixed metal necklace, evil eye necklace, nazar necklace, station necklace, gold evil eye, minimalist necklace, dainty necklace, layering necklace, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold
- **Dimensions:** eye 6.0 mm, 1.0 mm thick
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $660 (estimate)
- **Price range by karat:** 10K $500 to $540; 14K $640 to $690; 18K $800 to $880
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | White gold plating unconfirmed | No images yet

**Description:**

```
A 6 mm evil eye drawn in two golds, set inline at the centre of a fine solid gold chain.

No enamel and no stones: a ring of the second gold is inlaid flush into a disc of the main gold, around a slightly domed gold pupil. Loops cast at each side carry the chain, so the eye sits flat at the base of the neck.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: the eye's disc, rim and pupil, its loops and the chain are in the main metal; the inlaid ring is in the second gold.
Finish: polished solid gold in two colours; no enamel, no stones.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 6.0 mm, 1.0 mm thick.
Chain: 1.2 mm solid gold cable chain in the main metal, spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.2 mm yellow gold cable chain necklace with one flat round disc, 6 mm across, slightly thinner than a pencil, never larger, 1 mm thick, in the line of the chain at the centre front: two small yellow gold loops on the sides of the disc, at 3 and 9 o'clock, join the chain on both sides. Each part is entirely one metal: the chain, the two loops, the outer rim and the centre dot of the disc are polished yellow gold; the inlaid ring is polished unplated white gold, a soft warm grey metal with mirror reflections. The disc is all metal with no enamel: a yellow gold outer rim 0.5 mm wide, a flat polished white gold ring 1.5 mm wide inlaid flush, and a yellow gold centre dot 2 mm across, slightly raised; no eyelashes, no eyelid line, no realistic iris; closed, solid, flat yellow gold back. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. No enamel, no colour and no stones; real metal reflections. The necklace lies with the round disc face up at the bottom of one smooth U-shaped curve of chain whose two halves rise straight up and apart and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** midnight ink #161C2C, accent nude, skin deep brown. Blue-black ink: the white gold ring reads bright and the yellow rim glows.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N08.


Full variant list with SKUs and prices: variants.csv (rows for N08).

### B08 · Two Tone Evil Eye Cuff Bracelet (family 8 Twin Wire)

- **Title:** Two Tone Evil Eye Cuff Bracelet, Two Solid Gold Wires with an Inlaid Gold Nazar, Mixed Metal Open Cuff
- **Tags (13):** two tone bracelet, mixed metal bracelet, cuff bracelet, open cuff, evil eye bracelet, nazar bracelet, gold evil eye, stacking cuff, minimalist cuff, 14k gold cuff, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold
- **Dimensions:** cuff 2.0 mm wide, two 1.0 mm wires; eye 6.0 mm, 1.2 mm thick
- **Metal Color values:** Yellow/White Gold, White/Yellow Gold, Rose/White Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $1020 (estimate)
- **Price range by karat:** 10K $770 to $840; 14K $970 to $1080; 18K $1230 to $1380
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | TWO-TONE UNQUOTED | White gold plating unconfirmed | No images yet

**Description:**

```
An open cuff of two solid gold wires in two colours, side by side, with a metal evil eye set over both at the front.

The same eye as the twin wire ring: a ring of the second gold inlaid flush into a disc of the main gold, around a slightly domed gold pupil. The cuff slips on from the side of the wrist.

Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Two tone: one wire, the eye's rim and its pupil are in the main metal; the other wire and the inlaid ring are in the second gold.
Finish: polished solid gold in two colours; no enamel, no stones.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: cuff 2.0 mm wide, two 1.0 mm wires; eye 6.0 mm, 1.2 mm thick.
Cuff: open, 2.0 mm wide; choose 6.5, 7 or 7.5 inches inner circumference.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish.

The product images are design visualizations of the finished piece, and the three-colour image is a visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: an open cuff bracelet of two round wires, each 1 mm thick, fused side by side, together 2 mm wide: one wire entirely polished yellow gold, and one wire entirely polished unplated white gold, a soft warm grey metal with mirror reflections; both wires end in plain polished ends at the opening. At the front, across both wires on a low yellow gold gallery, sits a flat round disc, 6 mm across, slightly thinner than a pencil, never larger, 1.2 mm thick, all metal with no enamel: a yellow gold outer rim 0.5 mm wide, a flat polished white gold ring 1.5 mm wide inlaid flush, and a yellow gold centre dot 2 mm across, slightly raised. Each part is entirely one metal; no eyelashes, no eyelid line, no realistic iris; closed, solid, flat yellow gold back. Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one metal from edge to edge, with no plating and no colour wash between parts. No enamel, no colour and no stones; real metal reflections. The cuff stands on its open back with the disc at the front facing the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** oxblood #3D1418, accent nude, skin light warm. Deep wine red, the darkest warm ground, for a cuff of two wires.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three metal pairs; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B08.


Full variant list with SKUs and prices: variants.csv (rows for B08).

### R09 · Red Evil Eye Heart Ring (family 9 Sweetheart)

- **Title:** Red Evil Eye Heart Ring, Polished Solid Gold Heart with a Red Enamel Nazar, Valentines Gift Ring
- **Tags (13):** red evil eye, heart ring, evil eye ring, nazar ring, gold heart ring, red enamel ring, valentines gift, anniversary gift, gift for her, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** heart 9.6 x 9.2 mm, 1.1 mm thick; eye 5.4 mm; band 1.5 mm round
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $720 (estimate)
- **Price range by karat:** 10K $420 to $690; 14K $600 to $1000; 18K $830 to $1390
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A polished solid gold heart with a small red enamel evil eye set flush at its centre, on a slim gold band.

The heart is plain gold with full round lobes, and the eye is one ring of red enamel around a gold pupil. It stands upright on the finger, point to the wrist, cast in one piece with the band.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous red enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: heart 9.6 x 9.2 mm, 1.1 mm thick; eye 5.4 mm; band 1.5 mm round.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a slim ring in polished 14K yellow gold with a solid polished gold heart on top, 9.6 mm wide and 9.2 mm tall, a little narrower than the index fingernail, never larger, 1.1 mm thick, with full round lobes and straight sides that meet in a pointed tip, sitting low on a round band 1.5 mm thick, cast in one piece, the heart upright with its point toward the wrist when worn. Set flush into the heart, slightly above its middle, is a small round motif 5.4 mm across: a thin polished gold rim 0.4 mm wide, a ring of poppy red enamel (#D7352B) 1.5 mm wide and a round polished gold centre dot 1.6 mm across, with at least 0.45 mm of polished gold all around it to the edge of the heart. The rest of the heart is plain polished gold; no eyelashes, no eyelid line. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: poppy red (#D7352B). The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** jade green #3E7A68, accent poppy red, skin light warm. Complementary: poppy red on cool jade; the gold heart glows.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R09.


Full variant list with SKUs and prices: variants.csv (rows for R09).

### N09 · Red Evil Eye Heart Necklace (family 9 Sweetheart)

- **Title:** Red Evil Eye Heart Necklace, Solid Gold Heart Evil Eye Pendant with Red Enamel Nazar, Valentines Gift
- **Tags (13):** red evil eye, heart necklace, evil eye necklace, evil eye pendant, nazar necklace, gold heart pendant, valentines gift, anniversary gift, gift for her, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** heart 11.0 x 10.5 mm, 1.2 mm thick; eye 6.0 mm
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $600 (estimate)
- **Price range by karat:** 10K $430 to $470; 14K $580 to $630; 18K $760 to $840
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
An 11 mm polished solid gold heart pendant with a red enamel evil eye set flush at its centre.

Plain gold with full round lobes and a ring of red enamel around a gold pupil. The bail is hidden behind the cleft, so the heart hangs upright with nothing above it.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous red enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: heart 11.0 x 10.5 mm, 1.2 mm thick; eye 6.0 mm.
Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a solid polished 14K yellow gold heart pendant, 11 mm wide and 10.5 mm tall, about as wide as the index fingernail, never larger, 1.2 mm thick, with full round lobes and straight sides that meet in a pointed tip; the fine 1.2 mm cable chain passes through a small tube hidden behind the cleft between the lobes, so no loop shows above the heart. Set flush into the heart, slightly above its middle, is a small round motif 6 mm across: a thin polished gold rim 0.5 mm wide, a ring of poppy red enamel (#D7352B) 1.7 mm wide and a round polished gold centre dot 1.6 mm across, with at least 0.6 mm of polished gold all around it to the edge of the heart. The rest of the heart is plain polished gold; no eyelashes, no eyelid line. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: poppy red (#D7352B). The pendant lies flat and face up, and the fine chain leaves it as one single strand whose two halves rise straight up and apart like the arms of a letter V and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** deep teal #1E5459, accent poppy red, skin medium olive. Dark blue-green opposite red; the heart is the warmest point in the image.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N09.


Full variant list with SKUs and prices: variants.csv (rows for N09).

### B09 · Red Evil Eye Heart Bracelet (family 9 Sweetheart)

- **Title:** Red Evil Eye Heart Bracelet, Polished Gold Heart with a Red Enamel Nazar on Solid Gold Chain, Valentines Gift
- **Tags (13):** red evil eye, heart bracelet, evil eye bracelet, nazar bracelet, gold heart bracelet, red enamel, valentines gift, anniversary gift, gift for her, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** heart 9.6 x 9.2 mm, 1.1 mm thick; eye 5.4 mm
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $600 (estimate)
- **Price range by karat:** 10K $470 to $490; 14K $590 to $620; 18K $740 to $780
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A polished solid gold heart with a red enamel evil eye, set at the centre of a fine gold chain.

The heart is a station, the chain held by loops cast at its two lobes, so it lies flat on the wrist. Red enamel around a gold pupil, the same red in yellow, white and rose gold.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous red enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: heart 9.6 x 9.2 mm, 1.1 mm thick; eye 5.4 mm.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with one solid polished gold heart, 9.6 mm wide and 9.2 mm tall, a little narrower than the index fingernail, never larger, 1.1 mm thick, in the line of the chain at its centre, joined by two small loops at the tops of its two lobes so the heart sits upright between them, with full round lobes and straight sides that meet in a pointed tip. Set flush into the heart, slightly above its middle, is a small round motif 5.4 mm across: a thin polished gold rim 0.4 mm wide, a ring of poppy red enamel (#D7352B) 1.5 mm wide and a round polished gold centre dot 1.6 mm across, with at least 0.45 mm of polished gold all around it to the edge of the heart. The rest of the heart is plain polished gold; no eyelashes, no eyelid line. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back; spring ring clasp. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: poppy red (#D7352B). The bracelet lies in one soft open curve, one continuous chain from end to end, with the heart face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** eucalyptus #8CAE9F, accent poppy red, skin fair. Soft grey-green with a value gap, so the small red ring stays crisp.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B09.


Full variant list with SKUs and prices: variants.csv (rows for B09).

### R10 · Pink Evil Eye Paperclip Ring (family 10 Paperclip)

- **Title:** Pink Evil Eye Paperclip Ring, Pink Enamel Nazar on a Solid Gold Paperclip Band, Stacking Ring
- **Tags (13):** pink evil eye, paperclip ring, evil eye ring, nazar ring, pink enamel ring, stacking ring, best friend gift, birthday gift, gold evil eye ring, 14k evil eye ring, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye 6.0 mm on a band of soldered paperclip links
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Ring Size (243 variants)
- **Price, 14K US 7:** $720 (estimate)
- **Price range by karat:** 10K $420 to $690; 14K $600 to $1000; 18K $830 to $1390
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A rigid band of small solid gold paperclip links with a 6 mm pink enamel evil eye set on top.

The links are soldered closed into a band that is sized like any ring. The eye is enamelled and fired on its own, then laser welded on top, with a closed solid gold back.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous pink enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 6.0 mm on a band of soldered paperclip links.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a rigid ring band made of elongated oval links of polished 14K yellow gold, each 7 mm long and 2.4 mm wide in 0.8 mm wire, joined end to end in one single row and soldered stiff so the band keeps a round shape, all the links the same size. Fixed flat on top of the band is a flat round disc, 6 mm across, slightly thinner than a pencil, never larger: a thin polished gold rim 0.5 mm wide, a ring of petal pink enamel (#EC9AB4) 1.7 mm wide and a round polished gold centre dot 1.6 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: petal pink (#EC9AB4). No eyelashes, no eyelid line, no realistic iris. The ring stands upright with its top turned toward the camera, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** emerald #1F6A50, accent petal pink, skin deep brown. Complementary: petal pink on emerald, the classic pink and green pairing.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Hand on linen trousers; 03 Hand on a wrapped gift; 04 Hand from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section R10.


Full variant list with SKUs and prices: variants.csv (rows for R10).

### N10 · Pink Evil Eye Paperclip Necklace (family 10 Paperclip)

- **Title:** Pink Evil Eye Paperclip Necklace, Pink and White Enamel Nazar on Solid Gold Chain, Best Friend Gift
- **Tags (13):** pink evil eye, paperclip necklace, evil eye necklace, nazar necklace, pink enamel, gold evil eye, best friend gift, birthday gift, layering necklace, 14k evil eye, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye 9.0 mm; paperclip links 7.0 x 2.4 mm
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Chain Length (27 variants)
- **Price, 14K 18 inches:** $700 (estimate)
- **Price range by karat:** 10K $530 to $570; 14K $680 to $730; 18K $860 to $940
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A 9 mm evil eye in pink and white enamel, set into a fine solid gold chain with two gold paperclip links on each side.

The eye is part of the chain rather than a charm hanging from it. Pink outside, white inside, a gold pupil at the centre; the paperclip links are closed around the fired eye by laser weld, then the fine cable chain runs on to the clasp.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous pink enamel and white enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 9.0 mm; paperclip links 7.0 x 2.4 mm.
Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a necklace in polished 14K yellow gold with one flat round connector, 9 mm across, a little narrower than the index fingernail, never larger, at the centre front, held in the line of the chain by small loops at 3 and 9 o'clock: two elongated oval links on each side, then a fine round cable chain 1.2 mm thick; each link is 7 mm long and 2.4 mm wide in 0.8 mm wire. The connector, from the edge inward: a thin polished gold rim 0.4 mm wide; a ring of petal pink enamel (#EC9AB4) 1.5 mm wide; a thin gold ring 0.4 mm wide; a ring of porcelain white enamel, flat, opaque and glossy (#F3F1EA), 1.5 mm wide; and a round polished gold centre dot 1.4 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: petal pink (#EC9AB4), porcelain white (#F3F1EA). No eyelashes, no eyelid line, no realistic iris. The necklace lies with the round connector and its links face up at the bottom of one smooth U-shaped curve of chain whose two halves rise straight up and apart and leave the image at the top edge; the chain is never doubled, never coiled and never forms a second loop, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** navy #1D2A4D, accent petal pink, skin warm tan. Deep navy: pink and white both read as light and the gold links glow.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Open linen collar; 03 Silk neckline; 04 Lying on linen; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Open blazer. Full prompts: CHATGPT-FRAMES.md, section N10.


Full variant list with SKUs and prices: variants.csv (rows for N10).

### B10 · Pink Evil Eye Paperclip Bracelet (family 10 Paperclip)

- **Title:** Pink Evil Eye Paperclip Bracelet, Pink and White Enamel Nazar on Solid Gold Chain, Best Friend Gift
- **Tags (13):** pink evil eye, paperclip bracelet, evil eye bracelet, nazar bracelet, pink enamel, gold evil eye, best friend gift, birthday gift, dainty bracelet, 14k gold bracelet, evil eye jewelry, evil eye gift, turkish evil eye
- **Materials:** Solid gold, Vitreous enamel
- **Dimensions:** eye 9.0 mm; paperclip links 7.0 x 2.4 mm
- **Metal Color values:** Yellow Gold, White Gold, Rose Gold
- **Variation axes:** Karat x Metal Color x Bracelet Length (27 variants)
- **Price, 14K 7 inches:** $640 (estimate)
- **Price range by karat:** 10K $500 to $520; 14K $630 to $660; 18K $800 to $840
- **Blockers:** ESTIMATED PRICE | Grams are geometry estimates | Alloy/enamel firing qualification | White gold plating unconfirmed | No images yet

**Description:**

```
A 9 mm pink and white enamel evil eye at the centre of a fine solid gold chain, with two gold paperclip links on each side.

A small bright eye for a best friend or a birthday. The links are closed around the fired eye by laser weld, and the rest of the bracelet is fine cable chain.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Enamel: kiln-fired vitreous pink enamel and white enamel, set flush in recessed cells with polished gold rims.
Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol.
Size: eye 9.0 mm; paperclip links 7.0 x 2.4 mm.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.
```

**Image 00, reference hero (text only):**

```
Studio product photograph of one fine jewelry piece: a bracelet in polished 14K yellow gold with one flat round connector, 9 mm across, a little narrower than the index fingernail, never larger, at its centre, held in the line of the chain by small loops at 3 and 9 o'clock: two elongated oval links on each side, then a fine round cable chain 1.1 mm thick; each link is 7 mm long and 2.4 mm wide in 0.8 mm wire. The connector, from the edge inward: a thin polished gold rim 0.4 mm wide; a ring of petal pink enamel (#EC9AB4) 1.5 mm wide; a thin gold ring 0.4 mm wide; a ring of porcelain white enamel, flat, opaque and glossy (#F3F1EA), 1.5 mm wide; and a round polished gold centre dot 1.4 mm across. The enamel is flush with the metal, flat and glossy, never domed; closed, solid, flat gold back; spring ring clasp. All metal is solid polished 14K yellow gold. Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, no painted detail, no stones. Enamel colours: petal pink (#EC9AB4), porcelain white (#F3F1EA). No eyelashes, no eyelid line, no realistic iris. The bracelet lies in one soft open curve, one continuous chain from end to end, with the round connector and its links face up at the centre of the curve and the spring ring clasp at one end, on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, square format.
```

**Colour world:** dark forest #233826, accent petal pink, skin medium olive. Dark green opposite pink; the white ring is the brightest point.

**Sales frames 01 to 10:** 01 Hero on a paper wave; 02 Wrist below a linen cuff; 03 Tying a gift ribbon; 04 Wrist from a plinth; 05 Fingernail scale; 06 Close detail on paper hills; 07 Aegean still life; 08 Gift box and card; 09 Three gold colours; 10 Hand at a silk collar. Full prompts: CHATGPT-FRAMES.md, section B10.


Full variant list with SKUs and prices: variants.csv (rows for B10).
