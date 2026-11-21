# EON-SDE6 galeri prompt'ları: inceleme sayfası (2026-11-21)

Kaynak `prompts.py` → `prompts.json` (bu sayfa ondan üretildi; elle düzenlemeyin). Model `nano_banana_2`, 2k, 4:3, `count` 1, kare başı 2 kredi. Plan: önce yalnız **01 hero** (2 kredi), sahibin fotoğraflarıyla yan yana kontrol; tutarsa kalan 8 kare (16 kredi). Yeniden çekim payıyla tahmin **~26 kredi**, tavan 40. 10. kare ölçü kartı yerelde dizilir (kredisiz). 11. kare sahibin düzenlenmemiş gerçek fotoğrafı (foto 4, kırmızı tutucu, halkanın tamamı).

Referanslar (sahibin gerçek fotoğraflarından sıkı kırpımlar, repoya alınmadı): `refWhole` foto 1 (yatık halka, tam tur taş dairesi), `refTop` foto 3 (pahtaki sıra yakın, iç dudak), `refSide` foto 2 (göz hizası, fırçalı duvar); beyaz, rose ve üç-renk karelerinde siyah-beyaz kopyaları.

Her prompt = **kareye özgü metin** + RING + LIGHT + PHOTO + referans cümlesi.

## RING (sarı karelerde; beyaz/rose/üçlü karelerde yalnız renk cümlesi değişir)

The ring: a solid gold band, about 6 mm wide and about 1.8 mm thick: a flat band with a flat outer face and squared shoulders. The whole outer face has a fine brushed satin finish: soft, matte and even, made of very fine parallel brush lines that run around the ring along the band, never across it. Along ONE edge of the band only, the corner between the outer face and the side of the band is cut off at 45 degrees into a narrow, flat, polished slope, and set into this slope sits one single row of small round brilliant cut stones, side by side and close together, with one tiny round polished gold bead between each pair of stones holding them. The row runs all the way around the ring without a gap and without an end, so this edge is one continuous circle of small stones. Each stone is tiny, about 1.3 mm across, about a fifth of the band's width, so about forty of them fit around the circle. On the inner side of the row a thin polished gold lip borders the hole of the ring. The other edge of the band has no stones at all: only a very narrow polished bevel, a thin bright line. The inside of the band is smooth, high-polished gold. The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are brighter warm yellow. The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets. These are the only stones on the ring: one single row of small stones along one edge only, no stones on the brushed outer face, no second row on the other edge, no larger centre stone, no stones inside the band, no engraving, no hallmark, no text.

## LIGHT

Light: natural daylight only, from one large window to one side, soft and slightly directional, in true neutral colour, with no coloured tint, no coloured light patches and no studio-flash look. Real soft shadows fall away from the window. The metal keeps its true natural colour and real reflections, with highlights but none blown out, no mirror-chrome look and no glow; on the polished inside only the soft window reflects, no person, no camera and no hands. The stones show real facets, never a blur or a glow. Real metal and real stones, never smooth plastic or a computer render.

## PHOTO

Photorealistic product photograph, natural colour, sharp focus on the jewellery, gentle shallow depth of field. No text, no logo, no watermark, no packaging.

## 01-hero: the design at a glance (Etsy first photo: one product, no text)

md5 `e867c09a941d305f008d3fecaea0b690`, 805 kelime, metal Y, referans refWhole, refTop.

**Kare:** The ring lies flat on a smooth, matte, pale blue-grey ceramic tile and is seen from the front and above, at about 40 degrees, so the whole ring is in view and nothing is cut off. The ring lies flat with its stone edge facing up: the continuous circle of small stones runs all the way around the top rim of the opening, and the plain edge rests on the surface underneath. Seen this way the circle of stones is an ellipse around the opening; the brushed satin outer face forms the front wall of the band, facing the camera, with the row of stones along its top edge; through the opening the polished inside of the back of the band is visible. The band's 6 mm width is about a quarter of the ring's outer diameter of about 22 mm. Daylight comes from a window on the left: the stones show crisp facets, the beads catch tiny points of light and the brushed face stays soft and matte. The ring sits in the centre of the frame and fills about half of the frame's width, with generous space all around so that a square crop keeps the whole ring. Behind it a pale blue-grey plaster wall is softly out of focus. Colour: the tile and the wall are muted cool blue-grey, so the warm yellow gold is the only warm, saturated colour in the image. The ring is the only object in the image.

**Renk:** The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are brighter warm yellow.

## 02-row: the stones on the beveled edge, up close

md5 `4f6c8057a913153f7aa1e59b7ab4f489`, 729 kelime, metal Y, referans refTop, refSide.

**Kare:** Close-up of the stone edge. The camera is a few centimetres from the ring and looks down at about 45 degrees at a short arc of the beveled edge, so only part of the ring is in the frame and the rest is outside it: the row of small round stones runs across the frame from left to right in a gentle curve, each stone sitting on the polished slope with a tiny gold bead between each pair; above the row the thin polished lip borders the hole, and below it the brushed satin outer face falls away out of focus. About ten stones in the middle of the row are in sharp focus. Low daylight from one side: each stone shows crisp facets, the beads catch tiny highlights, the brushed lines of the face are visible. Behind the ring, blue-grey slate is out of focus. Colour: the slate is a muted cool blue-grey, so the warm yellow gold is the only warm colour in the image. The ring is the only object in the image.

**Renk:** The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are brighter warm yellow.

## 03-profile: the brushed face at eye level: 6 mm width, stones on one edge only

md5 `6dde69592aa2af284d2e61bd69ad1196`, 728 kelime, metal Y, referans refSide, refTop.

**Kare:** The ring lies flat on matte charcoal slate, its stone edge facing up, and the camera is low, level with the ring and close to it, looking straight at the front of the band: the brushed satin outer face fills the middle of the frame like a low curved wall about 6 mm tall. Along the top edge of this wall runs the row of small round stones on its polished slope, with the thin polished lip above it; along the bottom edge, where the band rests on the slate, there are no stones, only the narrow polished bevel, a thin bright line. Toward the left and the right the band curves away and softens. Above the front of the band, the polished inside of the back of the ring is just visible. Daylight from the left draws one long soft sheen along the brushed face. Colour: the charcoal slate is a cool dark grey, so the gold reads warm and bright against it. The ring is the only object in the image.

**Renk:** The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are brighter warm yellow.

## 04-hand: how the band looks on a man's hand

md5 `ea0705a3e5b24261765bbd94977458de`, 724 kelime, metal Y, referans refWhole, refTop.

**Kare:** A man's hand rests palm-down on soft charcoal-grey wool, seen from slightly above and from the side of the fingertips, fingers relaxed and slightly apart. The ring is worn on the ring finger, the fourth finger, between the middle finger and the little finger, near the base of the finger, with its brushed satin face across the top of the finger and its stone edge toward the fingertips, so the row of small stones shows as a fine line of light along the front edge of the band, facing the camera; the plain edge is toward the knuckle. It is the only ring; the other fingers and the wrist are bare, no watch and no bracelet. The band sits firmly on the finger: its 6 mm width is about a third of the finger's width. Natural skin texture, short clean nails. Colour: the wool is a muted cool charcoal grey and the skin natural, so the gold is the warmest accent in the image.

**Renk:** The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are brighter warm yellow.

## 05-three: the band in yellow, white and rose gold

md5 `cfdf0db8c6a1389a6c13f7f52657c241`, 718 kelime, metal 3, referans refWhole_bw, refTop_bw.

**Kare:** Three of these rings lie flat side by side in a row on a slab of pale, matte, neutral limestone, a little apart, all three with their stone edges facing up, seen from the front and above at about 40 degrees: from left to right yellow gold, white gold and rose gold. Each ring shows the continuous circle of small stones around the top rim of its opening, the brushed satin face as its front wall and the polished inside of its back. All three are the same size and completely in view, evenly lit by daylight from the left. Colour: the limestone is a neutral pale grey-beige, so each gold keeps its own true colour. These three rings are the only objects in the image.

**Renk:** The three rings are identical in design and differ only in the colour of their gold: the left ring is warm yellow gold, the middle ring is cool silver-white white gold and the right ring is soft pink-copper rose gold.

## 06-white: white gold, the stone edge facing the camera

md5 `21b9137969264727c7868a47cd8d2016`, 731 kelime, metal W, referans refWhole_bw, refTop_bw.

**Kare:** The white gold ring stands upright on its edge on a slab of warm, matte sandstone, turned three-quarters so that its stone edge faces the camera: the camera looks from the front-left and slightly above, so on the left the opening appears as a tall ellipse framed all the way around by the continuous circle of small stones on the beveled edge, with the thin polished lip just inside it and the polished inside beyond; on the right the brushed satin outer face curves away as a wall. The band's 6 mm width is about a quarter of the ring's outer diameter of about 22 mm. Daylight from the left. Colour: the sandstone is a warm, muted honey-beige, the complement of the cool white gold, so the silver-white metal and the clear stones stand out against it. The ring is the only object in the image.

**Renk:** The gold is white gold: bright, cool silver-white; the brushed face is a soft pale grey-white satin and the polished parts are bright silver-white. There is no yellow tint anywhere on the ring.

## 07-rose: rose gold, the full circle of stones from above

md5 `bd300d65de8c53255d880e80a08bacf0`, 748 kelime, metal R, referans refTop_bw, refWhole_bw.

**Kare:** The rose gold ring lies flat on soft, muted sage-green linen and is seen from high above, at about 70 degrees, so the opening looks almost round. The ring lies flat with its stone edge facing up: the continuous circle of small stones runs all the way around the top rim of the opening, and the plain edge rests on the surface underneath. From this height the stones make one complete circle around the opening, with the thin polished lip on their inner side and, outside them, a narrow band of the brushed satin face curving down to the linen; through the opening the linen shows. The band's 6 mm width is about a quarter of the ring's outer diameter of about 22 mm. Daylight from the left, the linen weave softly visible. Colour: the sage green is the muted complement of the warm pink gold, so the rose gold is the only warm colour in the image. The ring is the only object in the image.

**Renk:** The gold is rose gold: a soft pink-copper colour; the brushed face is a muted dusty-rose satin and the polished parts are a brighter warm pink.

## 08-scale: real size in a man's palm

md5 `a451bd0e2009aa1750cf25d8bd9bc75a`, 694 kelime, metal Y, referans refWhole, refTop.

**Kare:** Real-size view. A man's open hand, palm up, is seen from slightly above, the fingers relaxed and slightly curled; the ring lies flat in the middle of the palm with its stone edge facing up, so the continuous circle of small stones runs around the top rim of the opening and the brushed satin face forms the front wall of the band. The ring sits on the palm at its real size: its whole width, about 22 mm, is about a quarter of the width of the palm, a little more than the width of one finger at its base. The band's 6 mm width is about a quarter of the ring's outer diameter of about 22 mm. Natural skin texture, short clean nails. Behind the hand, soft blue-grey linen is out of focus.

**Renk:** The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are brighter warm yellow.

## 09-circle: the stone edge straight on: a complete circle of stones

md5 `034755bcd5d6bfdafb97f53894391b28`, 712 kelime, metal Y, referans refTop, refSide.

**Kare:** The ring stands upright on its edge on a slab of matte black basalt, and the camera looks almost straight at its stone edge, along the ring's axis and slightly from above: the opening appears as a nearly round hole, and around it the polished slope with its row of small stones forms one complete, continuous circle of light, with the thin polished lip on its inner side and the polished inside of the band receding into the hole; only a thin sliver of the brushed satin face shows around the outside. A single soft window light comes from the right; the black stone stays matte and dark and the ring stands out quietly against it. The ring sits in the centre of the frame and fills about half of the frame's height. Colour: the basalt is a neutral matte black, so the yellow gold keeps its own true colour. The ring is the only object in the image.

**Renk:** The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are brighter warm yellow.

