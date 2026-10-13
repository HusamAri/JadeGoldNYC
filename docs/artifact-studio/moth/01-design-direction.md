# Openwork Moth Pendant Necklace: design direction (step 1)

Owner brief: JSON spec `as-openwork-moth-pendant-necklace`, 2026-10-13, confirm with Hüsam.
Shop: by Artifact Studio Jewelry (org 2c254edf-2119-4079-b09e-dc672e32c1f9).

## Owner decisions

| # | Decision | Answer |
|---|----------|--------|
| 1 | Metal grid | **Full grid** (2026-10-13): 10K/14K/18K x Yellow/White/Rose x 16/18/20 in = 27 variants. The brief's 4-metal set (10K yellow, 14K three colours, no 18K) is overruled. |
| 2 | Lab diamond in the thorax | **No stone** (c, 2026-10-13). The body stays plain polished gold. |
| 3 | Back engraving 1 to 4 characters | **No engraving** (2026-10-13). No personalization field. |

## Product

- Openwork moth pendant, wingspan 14 mm x 11 mm tall. Wing frames 0.9 mm with open cells; solid body; integral 3 mm bail.
- Chain: 1.1 mm solid gold cable chain, spring ring clasp, 16, 18 or 20 in, in the pendant's karat and colour.
- Protocol: `pendant_necklace`. Axes: Karat x Metal Color x Chain Length (3 axes, the Etsy maximum).
- SKU: `BAS-MOTH-N01-{10K|14K|18K}{Y|W|R}-{16|18|20}IN`.

## Pricing (2 x maker cost, `../maker_cost.py`)

Pendant grams are an estimate (UNCALIBRATED_ASSUMPTION): about 90 mm of 0.9 x 0.8 mm wire
across the frames and veins (65 mm3), body 23 mm3, bail 5 mm3, so 93 mm3 x 13.5 g/cm3 = 1.26 g.
I use **1.3 g 14K**. The chain is the maker's convention: 130 USD at 18 in, scaled by length.

| | 16 in | 18 in | 20 in |
|---|---|---|---|
| 10K | $340 | $360 | $380 |
| 14K | $500 | $520 | $550 |
| 18K | $690 | $730 | $770 |

The brief's band ($249 / $349 / $489) is below cost: the 14K 18 in chain alone is 130 USD,
so 2 x maker cost is $260 before the pendant. At $349, a 14K piece would carry about
$89 over the maker cost, before Etsy fees and the 30% deepest offer. That is a loss.
These prices are estimates until the maker quotes the pendant grams.

## Stone

No stone (owner 2026-10-13, option c). The prices above already exclude it. No stone in copy, tags or images.

## Engraving

None (owner 2026-10-13). The back is plain polished gold; no personalization on the listing.

## Overlap

None. The shop has no butterfly, moth or dragonfly piece. Its only insect is the bee anklet (SS27).

## Image notes

- The 13 Oct hero (cloudfront `hf_20261013_054403...`) is **1024 x 1024**. Shop QA needs 2048, so this frame cannot go to Etsy as it is.
- It shows **clubbed antennae**, which read as a butterfly. A moth has feathered antennae.
  The title and tags say moth, so a buyer who knows the difference sees a mismatch. Fix: regenerate with feathered (comb) antennae, or call the piece a butterfly.
- No stone, so the hero's plain thorax is correct.
- 12 prompts: `prompts.py` -> `image-prompts.md` (ground burnt orange #C4521F, gerbera petal macro after the owner reference, feathered antennae).
- Regeneration follows the credit rule: prompt first, owner approval, count 1, 2k.

## Copy rules

- The title names every metal ("Solid Gold"), never "14k Yellow Gold" alone, because the variants cover 3 karats and 3 colours.
- Banned words: protect, ward, luck, healing, baby/kids, designer names.
