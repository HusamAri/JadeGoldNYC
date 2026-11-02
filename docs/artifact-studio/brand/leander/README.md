# Leander · brand folder

The shop now called by Artifact Studio Jewelry becomes **Leander**. The full
guidelines are in [`BRAND.md`](BRAND.md); this file is the index and the
decision log.

## Decision log

- 2026-10-28 · Name chosen by the owner from three rounds (Ninefold, Solidus,
  Halka; Nonet, Ayar, Smalt, Kiln, Kapali, Bezant; Byzas, Pactolus, Stamboul,
  Colchis, Porphyra, Chalcedon, Ravenna, Leander). US collisions and the USPTO
  position are in BRAND.md section 2.
- 2026-10-28 · Round 1 identity (Cormorant Garamond lowercase, an L mark with the
  lamp) rejected by the owner as too ordinary. Lesson: lowercase Garamond is the
  Etsy default; the mark read as a lowercase i.
- 2026-10-28 · Round 2: three directions rendered with real type on ivory, on a
  product photo, reversed and as the Etsy icon (`explore-v2.png`). Owner chose
  **A Horizon**: Hanken Grotesk Light capitals at +0.46 em, a hairline with one
  gold point. The system in `svg/` is this direction.
- Etsy icon uses the letter form (L and point): the hairline disappears at the
  170 px search size and the 75 px message size.

## What is still open

- Trademark filing (Class 14 and 35) before the Etsy rename.
- Etsy handle check: `LeanderGold` free or not.
- Rename runbook (BRAND.md section 13) not started; nothing on Etsy or in the
  panel has changed.

## Rebuild

```
python3 build.py <font_dir> svg
```

`font_dir` holds `hanken-300.ttf`, `hanken-400.ttf`, `hanken-500.ttf`
(Hanken Grotesk variable from Google Fonts, instantiated with
`fontTools.varLib.instancer`). HarfBuzz (`uharfbuzz`) shapes the text; the SVGs
are outlines and need no font.
