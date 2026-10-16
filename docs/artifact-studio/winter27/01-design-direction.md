# Winter 26/27 set: design direction

Owner brief (2026-10-15): "kış için 5 tane yeni listing, minimalist klişeden uzak estetik".
Concepts approved by the owner 2026-10-15 ("onay"). Shop: by Artifact Studio Jewelry
(org 2c254edf-2119-4079-b09e-dc672e32c1f9). SKU prefix `BAS-W`.

## Research summary (2026-10-15)

Winter 26/27 fine-jewelry direction, read across trend reports and the shop's own catalog:
one high-impact piece instead of layered minimal stacks; sculptural and molten surfaces;
baroque pearls; enamel colour as the winter accent; mixed metals in one piece; neo-vintage
forms (signet, brooch) worn in modern ways; textured and matte finishes next to polish.
Overlap check against the catalog: Christmas 2026 motifs (poinsettia, candy cane, holly,
star), FW26/27 enamel charms and the Twig pearl bracelet are already live, so none of the
five repeats a motif or a silhouette already in the shop.

## The five pieces

| # | Piece | Form | Winter signal | Axes | Variants |
|---|---|---|---|---|---|
| W01 | Thaw Cuff | Open cuff, 4 mm wide, molten surface, white gold "ice" tip soldered on | Molten texture, mixed metal | Karat x Metal Color (two-tone pairs) x Bracelet Length 6.5 / 7 / 7.5 in | 27 |
| W02 | Pinecone Signet | Oval signet 13 x 11 mm, deep pinecone-scale relief continuing down the shoulders, oxblood enamel in the recesses | Neo-vintage signet, relief, colour | Karat x Metal Color x Ring Size US 3 to 16 full + half | 243 |
| W03 | Juniper Drop Earrings | Four 4.5 mm spheres clustered on a hook: three polished gold, one dusty blue enamel berry | Cluster, colour | Karat x Metal Color | 9 |
| W04 | Ember Lariat | Y lariat, both strands through a slide ring, molten teardrop 12 x 8 mm with a domed ember orange enamel eye | Sculptural drop, colour | Karat x Metal Color x Chain Length 16 / 18 / 20 in | 27 |
| W05 | Pine Needle Brooch | 45 mm crossed bundles of five needles, matte tips, pin stem and catch in the same gold | Brooch revival, texture | Karat x Metal Color | 9 |

Grid rule: every Karat x Metal Color combination is built (CLAUDE.md, 2026-09-26). W01 is
two-tone, so its Metal Color values are the body/accent pairs `Yellow/White Gold`,
`White/Yellow Gold`, `Rose/White Gold` (owner exception 2026-10-09); a flat label is never
put on a two-metal piece.

## Pricing (2 x maker cost, `../maker_cost.py`), estimate

`pricing.py` prints the table. Every gram is a geometry estimate at 14K density 13.5 g/cm3
(the maker's own band table, second-brain 2026-09-16) and is an UNCALIBRATED_ASSUMPTION
until the maker quotes. Enamel 50 USD per piece, chain 130 USD at 18 in (scaled to 22 in
for the lariat), assembly 50 USD follow the Christmas 2026 quote in `maker_cost.py`.

| Piece | Position | g14 | 10K | 14K | 18K |
|---|---|---|---|---|---|
| W01 Thaw Cuff | 6.5 in | 8.63 | $1,300 | $1,830 | $2,500 |
| | 7 in | 9.34 | $1,390 | $1,970 | $2,700 |
| | 7.5 in | 10.04 | $1,490 | $2,110 | $2,890 |
| W02 Pinecone Signet | US 3 | 6.60 | $1,020 | $1,420 | $1,940 |
| | US 7 | 7.34 | $1,120 | $1,570 | $2,140 |
| | US 10 | 7.90 | $1,200 | $1,680 | $2,300 |
| | US 16 | 9.01 | $1,350 | $1,910 | $2,610 |
| W03 Juniper Drops | pair | 5.75 | $900 | $1,260 | $1,700 |
| W04 Ember Lariat | drop + chain | 2.95 | $930 | $1,110 | $1,340 |
| W05 Pine Needle Brooch | one | 7.72 | $1,170 | $1,650 | $2,250 |

Gram assumptions, per piece:
- W01: strip 4 x 1.3 mm (molten surface varies 1.0 to 1.6 mm), developed length 123 / 133 /
  143 mm (wrist size minus a 25 mm gap). The cuff is the heaviest piece in the set; a 3 mm
  strip would land at 7.0 g and about $1,500 14K at 7 in.
- W02: oval table 13 x 11 x 2.0 mm plus a 3 mm shank at 1.8 mm, signet rule "top + shank"
  (owner 2026-09-16). Hero v1 carries the scales down the shoulders (owner accepted
  2026-10-15), so the shank is counted in full (was 75%; US 7 14K $1,360 -> $1,570).
- W03: per earring four 4.5 mm spheres (three gold, one enamel; hero v1 accepted 2026-10-15,
  spec was three) plus 0.30 g hook. Pair 14K $1,000 -> $1,260.
- W04: ellipsoid 12 x 8 x 4 mm at 0.52 fill plus 0.25 g slide ring; chain 22 in developed
  length (Y plus drop).
- W05: ten needles of 1.2 mm wire x 45 mm plus 0.35 g hub and 0.5 g pin stem and catch.

## Etsy protocol

W05 is the shop's first brooch. `lib/etsy/listing-protocol.ts` has no brooch protocol
(ids checked 2026-10-15: wedding_band, signet_ring, monogram_signet_ring, sculptural_ring,
stacking_ring, fixed_date_ring, pendant_necklace, chain_bracelet, cuff_bracelet,
stud_earrings, dangle_earrings, hoop_earrings, anklet). A `brooch` protocol is added with
this set: taxonomy `Accessories > Pins & Clips > Brooches` (node 1201, read from the live
tree with `ops/drafts-push?taxonomy=brooch`; the Jewelry root has no Brooches and the first
version of the protocol assumed it did), no size axis, no personalization, chain jewelry
parcel, plus a resolver test in `tests/listing-protocol.test.ts`. An undefined protocol id falls to
`product_type` and the wedding band rule (Width required), which is the FW26/27 failure
class (second-brain 2026-09-30).

W01 uses `cuff_bracelet`, W02 `signet_ring`, W03 `dangle_earrings`, W04 `pendant_necklace`
(Chain Length axis, as the FW26/27 lariat).

## Images

Hero first per piece (5 x 2 credits, nano_banana_2, resolution 2k, 1:1, count 1), owner
approval of the five prompts before any generation. Galleries of 12 frames per piece only
after the five heroes are approved; frames are built from a tight crop of the approved hero
(colour and texture only, never the full frame) per the Comet and Willow lessons.

## Heroes (2026-10-15)

`images/W0x-hero-v*.png`, job ids in `images/jobs.json`. 6 generations, 12 credits. W01, W02, W03, W05
accepted at v1; W02 and W03 deviated from the spec (shoulders, four spheres) and the owner chose to
move the spec to the image. W04 v1 cropped the Y away; v2 was made from the teardrop crop of v1
(`W04-hero-v1-crop.png` as image reference) and shows the slide ring with both strands dropping to
the pendant, the enamel eye domed. Higgsfield records the model as `nano_banana_flash`; 2048 px verified.

## Status

- 2026-10-15: concepts, cuff 4 mm, five heroes, 55 gallery prompts approved; 61 frames generated (6 QA reshoots),
  catalog + migration 0170 generated (315 variants, 60 images), brooch protocol added; migration applied,
  seals match; W01 to W04 pushed to Etsy as drafts (W05 blocked on the brooch taxonomy root).
- 2026-10-16: brooch root fixed (Accessories, node 1201), W05 pushed; 5/5 verified by independent
  read-back, 0 mismatch. Listing ids and checks in `etsy.md`. All five are drafts; publication is the owner's.
