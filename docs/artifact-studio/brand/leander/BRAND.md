# LEANDER · Brand guidelines

Version 1.0 · 2026-10-28 · direction A "Horizon", chosen by the owner.
Applies to the Etsy shop currently named by Artifact Studio Jewelry and to every
surface that carries it: Etsy, Instagram, Pinterest, packaging, engraving, email,
the panel. This file is the source of truth; `build.py` generates the assets in
`svg/` from it. Nothing on Etsy or in the panel has been renamed yet.

---

## 1. The idea

**Leander swam the strait every night toward one lamp.** Hero lit it in her
tower; he crossed the water to reach it and swam back before dawn. The tower in
Istanbul still carries his name in the West: Leander's Tower, Kız Kulesi.

The brand keeps the crossing and the lamp, not the ending. Every Leander piece
is solid gold, made to order, one at a time, for one person. That is the
crossing. The single gold point in the identity is the lamp: the one thing
worth going toward.

What the brand is: solid 10K, 14K and 18K gold in yellow, white and rose;
kiln-fired champlevé enamel in polished gold cells; closed backs, nothing hollow;
made to order in Istanbul, sold in the United States.

What the brand is not: plated, vermeil, filled, "demi-fine", fast, loud,
mystical. No promises of luck or protection anywhere in copy (Etsy policy and
brand voice agree).

### Positioning in one line

Quiet solid gold, made to order. Designer-tier construction at two to four times
the Etsy median and at or under the designer price band.

### Personality, three words

Composed. Precise. Warm. (Never: playful, mystical, opulent.)

---

## 2. The name

- Written **LEANDER** in the wordmark, **Leander** in running text. Never
  "leander" in text, never "LEANDER" in a sentence.
- Pronounced lee-AN-der. Say it once in the About page: "Leander, lee-AN-der,
  after the swimmer of the Hellespont."
- Never "Leander's", never "Leander Jewelry" as a phrase (a store in Leander,
  Texas trades under it), never "House of Leander", "Leander Atelier", "Maison".
- Handles and domain carry a qualifier that is not "jewelry": **LeanderGold**
  (Etsy, Instagram, Pinterest, TikTok) and **leander.gold** (web). Both fit
  Etsy's 20-character, letters-and-digits rule.
- Descriptor, always this and only this: **SOLID GOLD · MADE TO ORDER**.
  Four words, one line, middle dot between. In running text: "solid gold, made
  to order".

### Legal position (2026-10-28, not a clearance opinion)

- No live USPTO Class 14 registration for LEANDER was found. "LEANDER MEN'S BAND
  COLLECTION" (serial 88153216) was abandoned 2019-12-16; "LEEANDER" (1977,
  costume jewelry) is a different spelling and likely dead.
- Common-law users: "Leander Jewelry" in Leander, Texas (local retail,
  geographic name); a low-price "Leander" label on Walmart (silver, lab stones).
- Leander is a city of about 70,000 near Austin, so the bare word will not win
  search on its own; the qualifier above carries search.
- Before the Etsy rename: file LEANDER in Class 14 (and 35 for retail) and have
  an attorney run TSDR clearance. This document is not that.

---

## 3. Wordmark

`svg/leander-wordmark.svg` (24 px and up) · `svg/leander-wordmark-small.svg` (under 24 px)

- **Face:** Hanken Grotesk, capitals only.
- **Weight:** Light (300) at 24 px and above. Regular (400) under 24 px. Medium
  (500) under 12 px (invoice footers, hang tags). The light weight is the brand;
  the heavier weights exist only so it survives small.
- **Tracking:** +0.46 em. This is the identity more than the typeface is. Never
  tighten it, never widen it.
- **Case:** capitals only. Lowercase would turn it into every other quiet-luxury
  wordmark; the wide caps are what reads as Leander from across a room.
- Always placed as outlines (the SVGs), never as live text in a logo position.
- Colour: ink on ivory, ivory on ink. Never gold. Gold is reserved for the point
  and the descriptor.

Why Hanken Grotesk: open licence (SIL OFL), neutral grotesk with a slightly
warm, humanist skeleton that does not read as tech. If the brand later licenses
a premium face, the brief is "a light grotesk with no personality of its own":
Neue Haas Grotesk Light, Söhne Leicht, Founders Grotesk Light. Re-run the
tracking test before switching: the wordmark width at 0.46 em must stay within
5 percent of the Hanken version so every lockup still fits.

---

## 4. Mark

`svg/leander-mark.svg` · one colour: `svg/leander-makers-mark.svg`

A hairline with one gold point above its far end. The line is the water; the
point is Hero's lamp on the far shore. Nothing else.

Geometry, with L the line length:
- line thickness L/60 (never under 0.75 px on screen)
- point radius L/30
- point centre sits L/10 above the line, flush with the line's right end
- the point is always on the right, always above. On the left it reads as a
  bullet; below the line it reads as a footnote.

Letter form: `svg/leander-etsy-icon.svg` and `svg/leander-makers-mark-letter.svg`
set a single Light capital L with the point at cap height to its right. This is
the form for places where a hairline disappears: the Etsy icon (170 px in search,
75 px in messages), a 1.5 mm engraving inside a band, a wax seal, an app icon.

Which form where:
| Surface | Form |
|---|---|
| Stacked and horizontal lockups, banners, packaging face | hairline and point |
| Etsy icon, favicon, app icon, social avatar | L and point (favicon keeps the hairline because it is drawn on whole pixels) |
| Engraving inside bands (1.5 mm), stamps, blind emboss, foil | L and point, one colour |
| Corner signature on a photo | wordmark small, no mark |

The mark never appears with the point in any colour but gold, except the
one-colour maker's mark forms where everything is the same metal or ink.

---

## 5. Lockups

| File | Use | Minimum |
|---|---|---|
| `leander-lockup-stacked.svg` | primary: packaging face, cards, Pinterest and Instagram covers, Etsy banner | 160 px wide / 40 mm |
| `leander-lockup-stacked-reversed.svg` | the same on ink paper, dark surfaces | 160 px / 40 mm |
| `leander-lockup-horizontal.svg` | web header, email header, invoice | 220 px / 55 mm |
| `leander-wordmark.svg` | alone when the mark is already present on the surface | 120 px / 30 mm |
| `leander-wordmark-small.svg` | corner signature on photographs, hang tags | 60 px / 15 mm |

Clear space: the cap height of the wordmark on all four sides. Nothing else
enters that space, including photographs.

Proportions in the stacked lockup, with S the wordmark cap size: line length
3.5 S, gap line to wordmark 1.18 S, descriptor at 0.265 S set 0.62 S under the
wordmark baseline. The horizontal lockup sets the line at the wordmark's cap
mid-height, 2.6 S long, with a 1.1 S gap. These are in `build.py`; do not
re-space by eye.

---

## 6. Colour

| Token | Hex | RGB | Use |
|---|---|---|---|
| Ivory | `#F4EFE7` | 244 239 231 | paper, backgrounds, reversed type |
| Ink | `#1C1A17` | 28 26 23 | type, line, dark backgrounds |
| Gold | `#A8834A` | 168 131 74 | the point, the descriptor, one hairline rule in layouts; never type blocks |
| Stone | `#D9D3C7` | 217 211 199 | optional second paper for grids and contact sheets, never behind the logo |

Rules: no gradients, no metallic rendering, no shimmer, no drop shadows, no
"gold foil" effects on screen. Gold is at most 5 percent of any surface.
Enamel colours (nazar cobalt `#17368C`, poppy, petal pink, porcelain) are
product colours and never appear in the identity or in layout.

Print: Ivory is unprinted uncoated paper (Munken Pure or Colorplan Natural);
Ink is Pantone Black 6 C at 100 percent, or blind emboss; Gold is foil Kurz
Luxor 220 matte, or Pantone 7503 C where foil is not possible. Gold foil is
allowed on print because it is the real material; on screen it is not.

---

## 7. Typography system

| Role | Face | Size and setting |
|---|---|---|
| Wordmark | Hanken Grotesk Light caps, +0.46 em | see section 3 |
| Display headline | Hanken Grotesk Light, sentence case, −0.01 em | 40 to 72 px, one line, no full stop |
| Body | Hanken Grotesk Regular | 16 to 18 px, line height 1.55, measure 60 to 70 characters |
| Label and index | Hanken Grotesk Regular caps, +0.34 em | 9 to 11 px, gold or ink at 60 percent |
| Figures | lining figures always (`lnum`) | "10K 14K 18K" must never read "1oK" |

Hanken Grotesk replaces Cormorant Garamond and IBM Plex Mono on every new
surface. The existing Pinterest and Instagram sets stay as they are until they
are regenerated; when they are, `render.py` moves to Hanken (serif headline
becomes Light sentence case, mono label becomes Regular tracked caps). One
family, three weights, no italics.

Tone of type: lots of air, small type, short lines. If a layout needs a bigger
headline to feel finished, the layout is wrong, not the type size.

---

## 8. Photography

The identity never competes with the product. Photography rules already in use
in the shop stay in force and become brand rules:

- Ivory linen or stone surfaces, natural daylight from one side, soft shadow.
  No black, no velvet, no mirrors, no coloured gels.
- Gold is shown as gold: polished, no colour grading toward orange or green.
- No text over the product. Text only in paper or stone negative space, and only
  the corner signature (wordmark small) or a label line.
- Scale is honest: rings about 2 cm, shown against a finger or a known object.
- Hero: product alone, centred, 2048 px square. Worn: hands and necks only,
  no faces, no jewellery other than the piece.
- Nothing is darkened, no gradient bands, no vignettes, no borders, no frames.

Listing images never carry the logo. The brand lives in the shop icon, the
banner, the packaging and the copy.

---

## 9. Layout

- Grid: 12 columns, 108 px outer margin at 1080 px (10 percent). On paper, 10
  percent of the short side.
- One idea per surface. One image, one line of type, one label.
- Index pattern (from the panel's `.idx`): a 24 px gold hairline, then a label
  in tracked caps, then the content. This is the only decorative device.
- Alignment: left or centred, never both on one surface. Lockups centred;
  running text left.
- White space is the luxury. If it looks unfinished, add nothing; remove one more
  thing.

---

## 10. Applications

### Etsy
- Shop name: `LeanderGold` (or `Leander` if available and the qualifier goes to
  the domain only; the owner decides at rename time).
- Icon: `leander-etsy-icon.svg` exported to PNG at 500 x 500. The L and point
  sit inside the inner 60 percent because Etsy crops round.
- Big banner: `leander-etsy-banner.svg` at 1200 x 300, stacked lockup centred,
  nothing else. No seasonal banners with product collages.
- Shop title (the line under the name): "Solid gold, made to order".
- Announcement: one sentence, no emoji, no urgency: "Every piece is made to order
  in solid 10K, 14K or 18K gold and ships in about three weeks."
- About page: the story in three short paragraphs: the name, the making, the
  grid of nine golds. One portrait of hands at the bench, no logo in the image.
- Listing titles and descriptions keep their current protocol
  (`docs/etsy-playbook/`); only the brand tail changes to "Leander".

### Instagram
- Handle `@leandergold`. Avatar: the Etsy icon.
- Bio, three lines: "Solid gold, made to order." / "10K · 14K · 18K · nine golds,
  one piece." / "Made in Istanbul, sent anywhere in the US."
- Feed: product and hands only; type only in paper space, Hanken Light sentence
  case at 56 px on a 1080 canvas, 108 px margins. Reel covers: photo on top,
  ivory band below with the headline inside the 4:5 crop.
- Stories: ivory background, one image, wordmark small at the bottom.
- No carousel cover grids, no black CTA cards, no stickers over product.

### Pinterest
- Boards named by product ("Rings", "Necklaces", "Enamel"), never by season.
- Pin templates (editorial, story, guide, word, diptych, trio) keep their
  structure; the serif headline becomes Hanken Light, the mono label Hanken
  Regular tracked. Signature: wordmark small at the bottom margin.

### Packaging
- Box: ivory uncoated board, stacked lockup blind embossed on the lid, point in
  gold foil. Nothing printed inside.
- Card: 85 x 55 mm, ivory, horizontal lockup front, three lines on the back
  (karat, colour, size) handwritten in ink.
- Pouch: ivory cotton, wordmark small in ink, 15 mm wide.
- Tissue: unprinted. No ribbon, no sticker, no branded tape.

### Engraving and stamps
- Inside every band and on every clasp tag: the letter maker's mark at 1.5 mm
  beside the karat stamp (10K, 14K, 18K, or 585/750 where the maker uses
  fineness). Never the wordmark inside a ring.
- Wax seal and blind stamp: the letter form.

### Email, invoice, panel
- Email header: horizontal lockup at 220 px on ivory, 100 percent width with
  max-width 640 px, never fixed width.
- Invoice: horizontal lockup top left, Hanken Regular 10 px body, Medium caps
  footer with the wordmark small.
- Panel: `OrgMark` for this org points at `leander-mark.svg`; the org name
  becomes "Leander".

---

## 11. Voice

Short sentences. Materials first, adjectives last. Numbers are exact (1.2 mm
cable, 16 in, 0.4 mm walls). The guest is "you"; the brand is "we", never
"Leander" in the third person in its own copy.

Say: solid gold, made to order, kiln-fired enamel, closed back, nine golds,
about three weeks.
Never: luxury, exquisite, stunning, timeless, elegant, handcrafted with love,
protection, lucky, energy, gift for her, limited.

Tagline bank, use at most one per surface, never with the descriptor:
- "One lamp across the water."
- "Nine golds, one piece."
- "Made for one person at a time."

Product naming stays as it is in the catalog: material, form, piece, in that
order ("14K Gold Enamel Evil Eye Necklace"). Families keep their working names
(Halka, Damla, Tideline) in the panel and in the About page, never in titles.

---

## 12. Do not

- Do not set the wordmark in lowercase or in a serif.
- Do not tighten the tracking, not even on a narrow banner; use the stacked lockup.
- Do not put the point anywhere but above the right end of the line.
- Do not colour the wordmark gold.
- Do not add a second mark, a monogram circle, a crest, a laurel, a tower
  illustration, waves, or an eye.
- Do not use gradients, metallic textures, shadows or outlines on the identity.
- Do not place the logo on a photograph of a product.
- Do not combine with Cormorant, Plex Mono or any serif on a new surface.
- Do not write "Leander Jewelry".

---

## 13. Rename runbook (repo and channels)

Order matters; the Etsy name flips last.

1. Trademark filing in Class 14 and 35 submitted.
2. Panel: `orgs.name` to "Leander", `OrgMark` asset, email templates.
3. Catalog generators (`docs/artifact-studio/*/catalog.py`, 8 files name the
   shop in the brand tail) updated in one commit so a regeneration cannot bring
   the old name back. Verify with a grep that returns 0.
4. Live descriptions: one batch pass through an ops route in the style of
   `ops/desc-strip`, reading the live Etsy text (not the panel copy), replacing
   only the brand tail. Count first, dry run, canary one listing, apply in
   batches, read back with a fresh token.
5. Instagram and Pinterest: new avatar, bio, board covers; regenerate the
   Pinterest sheet (`sheet.py` falls 20 pins back to the shop URL, which changes
   and is not redirected by Etsy).
6. Etsy: icon and banner uploaded, shop title and announcement set, then the
   name changed in Shop Manager. Listing URLs keep their numeric ids and
   survive; only the shop URL changes.
7. Bookmarks and links in this repo that point at `etsy.com/shop/byArtifactStudio`
   updated (grep).

---

## 14. Files

```
docs/artifact-studio/brand/leander/
  BRAND.md                        this document
  README.md                       index and decision log
  build.py                        generates svg/ from fonts (HarfBuzz shaping, outlines)
  contact-sheet.png               the current set rendered with size and engraving tests
  explore-v2.png                  the three directions shown to the owner (A chosen)
  svg/
    leander-wordmark.svg              Light caps, 24 px and up
    leander-wordmark-small.svg        Regular caps, under 24 px
    leander-mark.svg                  hairline and gold point
    leander-makers-mark.svg           hairline and point, one colour
    leander-makers-mark-letter.svg    L and point, one colour (engraving)
    leander-lockup-stacked.svg        primary lockup
    leander-lockup-stacked-reversed.svg
    leander-lockup-horizontal.svg
    leander-etsy-icon.svg             L and point, 500 x 500, ivory
    leander-etsy-icon-line.svg        hairline form, alternative
    leander-etsy-banner.svg           1200 x 300
    leander-favicon.svg               32 x 32
```

Rebuild: `python3 build.py <font_dir> svg` with `hanken-300.ttf`,
`hanken-400.ttf`, `hanken-500.ttf` (Hanken Grotesk variable from Google Fonts,
instantiated with fontTools at those weights). Fonts are not committed.
PNG exports for Etsy: render the SVG at 1x with Chromium (Playwright is in the
repo's toolchain); no other converter has been checked for colour fidelity.
