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
| W02 | Pinecone Signet | Oval signet 13 x 11 mm, deep pinecone-scale relief, oxblood enamel in the recesses | Neo-vintage signet, relief, colour | Karat x Metal Color x Ring Size US 3 to 16 full + half | 243 |
| W03 | Juniper Drop Earrings | Three 4.5 mm polished spheres clustered on a hook, one dusty blue enamel berry per earring | Cluster, colour | Karat x Metal Color | 9 |
| W04 | Ember Lariat | Y lariat, molten teardrop 12 x 8 mm with an ember orange enamel eye | Sculptural drop, colour | Karat x Metal Color x Chain Length 16 / 18 / 20 in | 27 |
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
| W02 Pinecone Signet | US 3 | 5.71 | $890 | $1,250 | $1,690 |
| | US 7 | 6.26 | $970 | $1,360 | $1,840 |
| | US 10 | 6.68 | $1,030 | $1,440 | $1,960 |
| | US 16 | 7.51 | $1,140 | $1,610 | $2,190 |
| W03 Juniper Drops | pair | 4.46 | $720 | $1,000 | $1,350 |
| W04 Ember Lariat | drop + chain | 2.95 | $930 | $1,110 | $1,340 |
| W05 Pine Needle Brooch | one | 7.72 | $1,170 | $1,650 | $2,250 |

Gram assumptions, per piece:
- W01: strip 4 x 1.3 mm (molten surface varies 1.0 to 1.6 mm), developed length 123 / 133 /
  143 mm (wrist size minus a 25 mm gap). The cuff is the heaviest piece in the set; a 3 mm
  strip would land at 7.0 g and about $1,500 14K at 7 in.
- W02: oval table 13 x 11 x 2.0 mm plus a 3 mm shank at 1.8 mm, signet rule "top + shank"
  (owner 2026-09-16); shank counted at 75% because the table replaces a quarter of the ring.
- W03: per earring three 4.5 mm spheres plus 0.30 g hook.
- W04: ellipsoid 12 x 8 x 4 mm at 0.52 fill plus 0.25 g slide ring; chain 22 in developed
  length (Y plus drop).
- W05: ten needles of 1.2 mm wire x 45 mm plus 0.35 g hub and 0.5 g pin stem and catch.

## Etsy protocol

W05 is the shop's first brooch. `lib/etsy/listing-protocol.ts` has no brooch protocol
(ids checked 2026-10-15: wedding_band, signet_ring, monogram_signet_ring, sculptural_ring,
stacking_ring, fixed_date_ring, pendant_necklace, chain_bracelet, cuff_bracelet,
stud_earrings, dangle_earrings, hoop_earrings, anklet). A `brooch` protocol is added with
this set: taxonomy `Jewelry > Brooches`, no size axis, no personalization, ring parcel,
plus a resolver test in `tests/listing-protocol.test.ts`. An undefined protocol id falls to
`product_type` and the wedding band rule (Width required), which is the FW26/27 failure
class (second-brain 2026-09-30).

W01 uses `cuff_bracelet`, W02 `signet_ring`, W03 `dangle_earrings`, W04 `pendant_necklace`
(Chain Length axis, as the FW26/27 lariat).

## Images

Hero first per piece (5 x 2 credits, nano_banana_2, resolution 2k, 1:1, count 1), owner
approval of the five prompts before any generation. Galleries of 12 frames per piece only
after the five heroes are approved; frames are built from a tight crop of the approved hero
(colour and texture only, never the full frame) per the Comet and Willow lessons.

## Status

- 2026-10-15: concepts approved, pricing estimated. Open: owner decision on the cuff width
  (4 mm as briefed, or 3 mm) before the hero prompts.
