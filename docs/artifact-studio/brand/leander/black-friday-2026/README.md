# Leander · Black Friday 2026 shop banner

`leander-black-friday-3360x840.png`: Etsy big banner, 3360 x 840 (Etsy's recommended size).

- Photo: Higgsfield Nano Banana 2, 21:9 at 4K, 1 generation, 3 credits (job 0f8c6810).
  Reference: a tight crop of the moth pendant hero (`public/artifact/moth/N01/01.jpg`),
  so the banner shows a piece the shop sells. Prompt approved by the owner on 2026-11-28.
- Type set afterwards in Hanken Grotesk (BRAND.md §7), not by the model: gold 64 px
  hairline + "BLACK FRIDAY" tracked caps, "25% off the whole shop" Light 150 px, descriptor
  "SOLID GOLD · MADE TO ORDER" at 60 percent ink. Text sits on empty linen, never on the product.
- `banner.html` is the layout. It expects the generated photo as `bg.png` beside it
  (not committed, 6336 x 2688); the background is scaled to 3360 wide and offset 420 px up.
- Brand note: BRAND.md §10 says "no seasonal banners with product collages". This is one
  product on linen with the brand type, made at the owner's request for the sale. Swap
  back to `svg/leander-etsy-banner.svg` when the sale ends.
