# Twig and Baroque Pearl Station Bracelet: design direction

Owner brief: JSON `as-twig-baroque-pearl-bracelet`, 2026-10-13, confirm with Hüsam.
Shop: by Artifact Studio Jewelry (org 2c254edf-2119-4079-b09e-dc672e32c1f9).

## Owner decisions

| # | Decision | Answer |
|---|----------|--------|
| 1 | Variation axes | **(a)** (2026-10-13): white baroque pearl only, no lab diamond. One listing, Karat 10K/14K/18K x Metal Color Yellow/White/Rose x Bracelet Length 6.5/7/7.5 in = 27 variants (full grid). Silver-grey pearl and the diamond spur are dropped: Etsy allows 3 axes and all 3 are used. |
| 2 | Engraved disc tag | **No engraving** (2026-10-13). The disc tag and the 1 inch extender are dropped: the tag existed only to carry the engraving, and the length axis already covers fit. No personalization field. |
| 3 | Pricing basis | Shop convention: the 1 g unit floor (maker count on Christmas B09), so 14K 7 in = $530 (estimate). |

## Pricing (2 x maker cost, `../maker_cost.py`), estimate

Maker terms: 14K 100 USD/g with labour, bracelet chain 100 USD at 7 in, assembly 50 USD.
Pearl 15 USD is an UNCALIBRATED_ASSUMPTION. Twig, cup, loops and tag come to 0.63 g 14K in the brief; the shop's
unit floor (1 g per motif station, maker count on Christmas B09) lifts that to 1.0 g.

| 14K | 6.5 in | 7 in | 7.5 in |
|---|---|---|---|
| floor 1.0 g | $520 | $530 | $550 |
| brief 0.63 g | $450 | $460 | $480 |

The brief's band ($229 / $289 / $389) sits below 2 x maker cost: chain plus assembly alone cost the maker 150 USD.

## Images

12 prompts: `prompts.py` -> `image-prompts.md`. Ground winter slate blue #3F5A73, frost and bare twigs, white pearl. Hero first, then 11 frames from its crop. The brief's 13 Oct image is not used (1024 px, lobster clasp, disc tag).
