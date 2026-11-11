# EON-HEP gallery prompts

Each AI frame's full prompt = **frame text** + ring block + LIGHT + PHOTO + reference sentence (exact text in `prompts.json`, built and checked by `prompts.py`; every accepted frame's prompt is the one that generated it). Model `nano_banana_2`, 2k, 4:3 (2400×1792), `count: 1`, 2 credits per image. Frame 10 is the stone chart, typeset locally by `stone_chart.py` from `../listing.json` (no credits, no AI text). What was generated, kept and rejected, and why: `status.json` (17 generations, 34 credits).

## Design correction (owner, 2026-11-11, after the v1 set)

> taşlar yarım tur tam tur değil

Half eternity: the stones cover exactly half of the circle. In v1, six of nine frames ran the row past the ring's left-most and right-most points onto the back half (03 almost all the way round). The retakes pin the coverage per pose with a clock face (lying flat: 9 → 6 → 3 with 6 nearest the camera; standing: 9 → 12 → 3), say 'exactly half and no more' and 'stops exactly there' in the ring block, and drop the reference listing's whole-ring crop, which carried its own over-half coverage: v2 references are close crops of the row only, and 09 v3 adds the greyscale crop of the accepted hero v2. 06 moved from a low side view (wrapped twice) to the upright view that held in 03. 02, 04 and 08 kept their v1 takes; their text stays frozen as `DESIGN_V1` / `ONLY_V1`.

## Art direction (as HS5, owner brief 2026-11-10)

Daylight from one window only, true neutral colour, real soft shadows; the metal is the only saturated colour and the background is its muted complementary colour (yellow → blue-grey tile, slate, chambray, linen; white → terracotta; rose → sage; three metals and five stones → neutral grey).

## Shared blocks

**RING_Y**: The ring: a solid 14K yellow gold band, about 1.5 mm wide and 1.5 mm thick: a slim band with softly rounded edges, high polish all over, inside and out. One single row of small round brilliant stones covers exactly half of the ring's circle and no more, the half that sits on top of the finger when the ring is worn: the row's two ends are directly opposite each other across the ring, and the other half of the circle, the part under the finger, is plain polished gold with no stones. In the row the stones sit side by side and close together, about 23 stones in all, each about 1.3 mm across, almost as wide as the band itself, so the row reads as one continuous line of light. Between each pair of neighbouring stones, two tiny polished gold prongs hold both stones, so along each edge of the row there is a fine line of tiny gold beads. Half of the ring has stones and half has none: never a full circle of stones. The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets. These are the only stones on the ring: one single row on one half of the ring only, no second row, no larger centre stone, no stones on the other half, no engraving, no milgrain, no hallmark, no text.

**RING_Y_V1**: The ring: a solid 14K yellow gold band, about 1.5 mm wide and 1.5 mm thick: a slim band with softly rounded edges, high polish all over, inside and out. One single row of small round brilliant stones runs around one half of the ring's circle, the half that sits on top of the finger when the ring is worn, side by side and close together, about 23 stones in all, each about 1.3 mm across, almost as wide as the band itself, so the row reads as one continuous line of light. Between each pair of neighbouring stones, two tiny polished gold prongs hold both stones, so along each edge of the row there is a fine line of tiny gold beads. The row stops where that half ends, at two opposite points of the circle; the other half of the band, the part under the finger, is plain polished gold with no stones. The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets. These are the only stones on the ring: one single row on the top half only, no second row, no larger centre stone, no stones on the lower half, no engraving, no milgrain, no hallmark, no text.

**LIGHT**: Light: natural daylight only, from one large window to one side, soft and slightly directional, in true neutral colour, with no coloured tint, no coloured light patches and no studio-flash look. Real soft shadows fall away from the window. The metal keeps its true natural colour and real reflections, with highlights but none blown out, no mirror-chrome look and no glow; the stones show real facets, never a blur or a glow. Real metal and real stones, never smooth plastic or a computer render.

**PHOTO**: Photorealistic product photograph, natural colour, sharp focus on the jewellery, gentle shallow depth of field. No text, no logo, no watermark, no packaging.

**REF_SERIES**: Reference images: the first two show this ring's design (take only the slim band, the single row of stones across the top half and the tiny shared prongs, not their background, lighting or camera angle); the third is a close crop of this ring, to match its gold colour and the size of its stones, not its composition.

**REF_ROW**: Reference images: both are close crops of this ring's row of stones in yellow gold. Take only the size and close spacing of the round stones, the tiny shared prongs between them and the gold colour; how far the row runs around the ring comes only from the description above, never from the references; do not take their background, lighting or camera angle.

**REF_GREY_ROW**: Reference image: a black-and-white close crop of this ring's row of stones. Take only the size and close spacing of the round stones and the tiny shared prongs; the metal colour and how far the row runs around the ring come only from the description above, never from the reference.

**REF_GREY_ROW_STONES**: Reference image: a black-and-white close crop of this ring's row of stones. Take only the size and close spacing of the round stones and the tiny shared prongs; the metal colour, the colour of each ring's stones and how far the row runs around the ring come only from the description above, never from the reference.

**REF_GREY_HERO2**: Reference images: black-and-white crops of this ring: the first shows the whole ring lying flat with its row of stones along the front half only, the second is a close crop of the row. Take only the shape: the slim band, where the row begins and ends, the size and close spacing of the round stones and the tiny shared prongs; the metal colour comes only from the description above, never from the references.

## Frames (accepted take)

### 01-hero (v2): the design at a glance (Etsy first photo: one product, no text)
*RING_Y + REF_ROW*

The ring lies flat on a smooth, matte, pale blue-grey ceramic tile, its opening facing up, seen from the front and a little above, so the front half of the band runs across the frame as a gentle curve and, above it, the polished inside of the back half is visible; the whole ring is in view, nothing cut off. Seen from above, the ring is like a clock face with 6 o'clock nearest the camera: the row of stones runs from 9 o'clock through 6 o'clock to 3 o'clock, along the front half only, and stops exactly at 9 o'clock and at 3 o'clock, the ring's left-most and right-most points; from 3 o'clock through 12 o'clock back to 9 o'clock, the back half farther from the camera, the band is plain polished gold, and no stone shows anywhere on the back half. The band is very slim: its 1.5 mm width is only about one fourteenth of the ring's outer diameter of about 21 mm, like a fine line of gold. Daylight comes from a window on the left: the stones show crisp facets and the polished gold reflects the window softly. The ring sits in the centre of the frame and fills about half of the frame's width, with generous space all around so that a square crop keeps the whole ring. Behind it a pale blue-grey plaster wall is softly out of focus. Colour: the tile and the wall are muted cool blue-grey, so the warm yellow gold is the only warm, saturated colour in the image. The ring is the only object in the image.

### 02-row (v1): the row of stones and the shared prongs, up close
*RING_Y_V1 + REF_SERIES*

Close-up of the row of stones. The camera looks straight down at the top of the band from a few centimetres away; the band runs across the whole frame from left to right as a slim strip, the row of round stones filling it from edge to edge, and the tiny gold prongs between neighbouring stones form a fine beaded line along the top edge and the bottom edge of the row. About eight stones in the middle of the frame are in sharp focus; the band curves gently away and softens toward the left and right edges. Low daylight from one side: each stone shows its crisp facets and one small bright reflection, and the polished prongs catch tiny highlights. Behind the band, blue-grey slate is out of focus.

### 03-stand (v2): the row over the top half, the plain lower half
*RING_Y + REF_ROW*

The ring stands upright on its edge on folded chambray, a soft light-indigo cotton, turned three-quarters to the camera and seen from a little above. Seen as a clock face with 12 o'clock at the top: the row of stones runs over the top of the ring from 9 o'clock through 12 o'clock to 3 o'clock, the upper half only, like an arch, and stops exactly at 9 o'clock and at 3 o'clock, the ring's two widest points at mid-height; from 3 o'clock down through 6 o'clock back to 9 o'clock, the lower half that rests on the cotton, the band is plain polished gold with no stones, so the whole lower half of the circle, on both sides, is bare gold. The polished inside of the band shows through the opening. The band is very slim: its 1.5 mm width is only about one fourteenth of the ring's outer diameter of about 21 mm, like a fine line of gold. Colour: the chambray is a muted light indigo with a soft visible weave, so the warm gold stands out against it.

### 04-hand (v1): how the slim band looks on the hand
*RING_Y_V1 + REF_SERIES*

A woman's hand rests palm-down on soft blue-grey linen, seen from slightly above, fingers relaxed and slightly apart. The ring is worn on the ring finger, the fourth finger, between the middle finger and the little finger, near the base of the finger, with the row of stones on top of the finger facing the camera; the plain lower half is underneath, toward the palm, out of sight. It is the only ring; the other fingers and the wrist are bare, no watch and no bracelet. The band is very slim on the finger: its 1.5 mm width is only about a tenth of the finger's width, a fine line across the finger. Natural skin texture, short natural nails without polish. Colour: the linen is a soft muted blue-grey and the skin natural, so the gold is the warmest accent in the image.

### 05-stones (v2): five of the twenty stone choices side by side
*RING_5 + REF_GREY_ROW_STONES*

The five rings lie on smooth, pale neutral-grey linen, seen from the front and a little above. Each band is very slim: its 1.5 mm width is only about one fourteenth of its ring's outer diameter. Together they fill the width of the frame, with space around them. Behind them a plain light-grey wall is softly out of focus. Colour: the linen and the wall are neutral grey, neither warm nor cool, so each kind of gem shows its own true colour and none is favoured.

### 06-white (v3): the white gold version, against warm clay
*RING_W + REF_GREY_ROW*

The ring stands upright on its edge on a warm terracotta clay tile, turned three-quarters to the camera and seen from a little above. Seen as a clock face with 12 o'clock at the top: the row of stones runs over the top of the ring from 9 o'clock through 12 o'clock to 3 o'clock, the upper half only, like an arch, and stops exactly at 9 o'clock and at 3 o'clock, the ring's two widest points at mid-height; from 3 o'clock down through 6 o'clock back to 9 o'clock, the lower half that rests on the clay, the band is plain polished white gold with no stones, so the whole lower half of the circle, on both sides, is bare metal. The polished inside of the band shows through the opening. The band is very slim: its 1.5 mm width is only about one fourteenth of the ring's outer diameter of about 21 mm, like a fine line of gold. Daylight grazes across the ring from one side, so the stones show their facets and the prongs draw tiny bright points. Colour: the clay and the softly blurred background are warm, muted terracotta, so the cool white gold reads crisp and bright against them.

### 07-metals (v2): the three metal colours side by side
*RING_3 + REF_GREY_ROW*

The three rings lie on a smooth, matte slab of mid-grey limestone, seen from the front and a little above. Each band is very slim: its 1.5 mm width is only about one fourteenth of its ring's outer diameter. Together they fill the width of the frame, with space around them. Behind them a plain light-grey wall is softly out of focus. Colour: the limestone is a neutral mid-grey, neither warm nor cool, so each metal shows its own true colour and none is favoured.

### 08-scale (v1): real size against the fingertips
*RING_Y_V1 + REF_SERIES*

Real-size view. A woman's hand is seen from the side, close to the camera, holding the ring level between the very tips of the thumb and the index finger, the two fingertips pressing on two opposite points of the ring, so the ring is seen edge-on at its own height: the front half of the band, the half with the row of stones, faces the lens as a short, thin, straight line of stones between the fingertips, and the opening is hidden. The ring is small, as a real ring is: its outer diameter of about 21 mm is the gap between the two fingertips, only about one and a third times the thickness of the thumb's tip as seen from this side. The band itself is a fine line: its 1.5 mm height is only about a fourteenth of that 21 mm gap. Fingers relaxed, natural skin, short natural nails without polish. Behind, a pale blue-grey wall is out of focus.

### 09-rose (v3): the rose gold version, against sage green
*RING_R + REF_GREY_HERO2*

The ring lies flat on sage-green linen, its opening facing up, seen from the front and a little above. Seen from above, the ring is like a clock face with 6 o'clock nearest the camera: the row of stones runs from 9 o'clock through 6 o'clock to 3 o'clock, along the front half only, and stops exactly at 9 o'clock and at 3 o'clock, the ring's left-most and right-most points; from 3 o'clock through 12 o'clock back to 9 o'clock, the back half farther from the camera, the band is plain polished gold, and no stone shows anywhere on the back half. The band is very slim: its 1.5 mm width is only about one fourteenth of the ring's outer diameter of about 21 mm, like a fine line of gold. A few eucalyptus leaves lie softly out of focus behind the ring. Daylight comes from a window on the right. Colour: the sage green is the complementary colour of the rose gold's soft pink, kept muted, so the rose gold looks warm and rich against it. The ring is the only piece of jewellery in the image.

### 10-chart (typeset): all twenty stone choices
`stone_chart.py`: "Choose your stone", the 20 names exactly as in the Etsy Stone list, each with its origin (laboratory-grown, laboratory-created, natural with any treatment, cultured) and a representative colour dot; footer "Colors are a guide: natural stones vary a little. Opal, moonstone, turquoise and pearl are softer gems."
