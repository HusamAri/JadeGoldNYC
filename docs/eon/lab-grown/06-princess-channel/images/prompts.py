"""EON-PC9 (3,0 × 1,8 mm, üstte iki ince ray arasında tek kanal, dokuz 2 mm prenses lab-grown taş kenar kenara) Etsy
galerisi: 9 Higgsfield prompt'u + yerelde dizilen ölçü kartı (10. kare, spec_card.py, kredisiz).

Run: python3 -I docs/eon/lab-grown/06-princess-channel/images/prompts.py   -> prompts.json

Dil HS5/HEP'ten (sahip 2026-11-10: "doğal ışık ve metal dokularını koruyarak … color theory'e göre"):
- IŞIK: yalnız tek pencereden gün ışığı, nötr renk, gerçek yumuşak gölge; renkli ışık lekesi yok.
- RENK KURAMI: metal sahnedeki tek doygun öğe, zemin onun tamamlayıcısı, düşük doygunlukta: sarı altın → mavi-gri
  (seramik karo, arduvaz, şambre, keten); beyaz altın → sıcak terrakota; rose → adaçayı; üç metal → nötr gri.

Tasarım referansı: sahibin linki 25karats.com WB9262'nin 4 fotoğrafından SİYAH-BEYAZ sıkı kırpımlar (önden yatan
bütün halka, dik duran bütün halka, sıranın ortası, sıranın sol ucu ve düz duvarı); arka plan beyaz render, ışık ve
açı alınmaz. Referans rengi de taşır (Comet Tail 2026-09-27), o yüzden hepsi siyah-beyaz, renk yalnız metinden.
Model ve parametreler jobs.json'da.

Dersler (second-brain): kaplama oranı bir yer sözcüğüdür (HEP 2026-11-11): sıra çemberin ~dörtte biri (US 8½'te
69,6 mm dış çevrenin 18 mm'si, ~93°), her pozda uç noktalarıyla saat kadranında; sayı sayıyla ("exactly nine");
kusur hep şekil/sayıdadır (Noel 40). "eternity" (taşı bütün halkaya yayar), "pave" (çok sıra), "baguette" (dikdörtgen
taş), "sparkle"/"macro" jargonu yok. Bant incelik oranı sayıyla: 3 mm = dış çapın ~1/7'si.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

DESIGN = (
    "about 3 mm wide and 1.8 mm thick, with a flat top and softly rounded edges, high polish all over, inside and "
    "out. Along the top of the band runs one single row of exactly nine square princess cut stones, in a line along "
    "the band, set edge to edge in a channel: two slim polished gold rails run along both sides of the row, each about a quarter as "
    "wide as a stone, and hold the stones between them, with no prongs, no beads and no metal between neighbouring "
    "stones. Each stone is about 2 mm square with sharp square corners, as long as it is wide, its top level with the "
    "rails, showing a crisp X-shaped pattern of facets running corner to corner. The row is about 18 mm long and covers only about a "
    "quarter of the ring's circle: each end of the row is closed by a flat polished wall of gold cut straight across "
    "the band, and beyond it the band continues as plain polished gold. The other three quarters of the circle are "
    "plain polished gold with no stones."
)
ONLY = (
    "These are the only stones on the ring: exactly nine, in one single row, no second row, no larger centre stone, "
    "no round stones, no stones anywhere else on the band, no engraving, no milgrain, no hallmark, no text."
)
DIAMONDS = "The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets."
SLIM = "The band is slim: its 3 mm width is only about one seventh of the ring's outer diameter of about 22 mm."
RING_Y = "The ring: a solid 14K yellow gold band, " + DESIGN + " " + DIAMONDS + " " + ONLY
RING_W = ("The ring: a solid 14K white gold band, bright cool silver-white all over, " + DESIGN + " " + DIAMONDS + " "
          + ONLY + " The metal is white gold everywhere, rails, end walls and inside included: bright, cool and "
          "silver-white, with no yellow tint.")
RING_R = ("The ring: a solid 14K rose gold band, soft warm pink all over, " + DESIGN + " " + DIAMONDS + " " + ONLY
          + " The metal is rose gold everywhere, rails, end walls and inside included: soft warm pink, with no yellow "
          "or white tint.")
RING_3 = (
    "Three identical rings of this one design lie flat side by side in a row, evenly spaced, their openings facing "
    "up. From left to right the metals are 14K yellow gold (warm soft yellow), 14K white gold (bright cool "
    "silver-white) and 14K rose gold (soft warm pink). Each ring is a slim flat-topped band about 3 mm wide, polished "
    "all over, with one single row of exactly nine square princess cut colourless lab-grown diamonds, each "
    "about 2 mm square with sharp corners, set edge to edge in a channel between two slim polished rails, with no "
    "prongs; the row is about 18 mm long and covers only about a quarter of the ring's circle, closed at each end by a "
    "flat polished wall of gold cut straight across the band. Each ring is turned so that its row of stones is at its "
    "front, centred on the point nearest the camera, and stops after about a quarter of the circle; the sides and the "
    "back of each ring, farther from the camera, are plain polished gold, and no stone shows anywhere else. Each ring "
    "has only that one row of nine stones: no second row, no larger centre stone, no round stones, no engraving, no "
    "text."
)
LIGHT = (
    "Light: natural daylight only, from one large window to one side, soft and slightly directional, in true "
    "neutral colour, with no coloured tint, no coloured light patches and no studio-flash look. Real soft shadows "
    "fall away from the window. The metal keeps its true natural colour and real reflections, with highlights but "
    "none blown out, no mirror-chrome look and no glow; the stones show real facets, never a blur or a glow. Real "
    "metal and real stones, never smooth plastic or a computer render."
)
PHOTO = (
    "Photorealistic product photograph, natural colour, sharp focus on the jewellery, gentle shallow depth of "
    "field. No text, no logo, no watermark, no packaging."
)
# Referans cümleleri: hepsi siyah-beyaz kırpım; şekil alınır, renk/zemin/ışık/açı alınmaz.
_TAKE = ("Take only the shape: the slim flat-topped band, the single row of nine square stones in a channel "
         "between two slim rails, where the row begins and ends, and the flat walls of gold that close its two ends; "
         "the metal colour comes only from the description above, never from the references; do not take their "
         "plain white background, their lighting or their camera angle.")
REF_FLAT = ("Reference images: black-and-white crops of this ring's design: the first shows the whole ring tilted "
            "back toward the camera, its short row of square stones across the top, the second is a close crop of the "
            "middle of the row. "
            + _TAKE)
REF_STAND = ("Reference images: black-and-white crops of this ring's design: the first shows the whole ring standing "
             "upright and turned, its short row of square stones near the top, the second is a close crop of the middle "
             "of the row. " + _TAKE)
REF_CLOSE = ("Reference images: black-and-white close crops of this ring: the first shows the middle of the row of "
             "square stones between the two rails, the second shows one end of the row closed by a flat wall of gold. "
             + _TAKE)
REF_END = ("Reference images: black-and-white close crops of this ring: the first shows one end of the row closed by "
           "a flat wall of gold, the second shows the middle of the row of square stones between the two rails. "
           + _TAKE)
REF_HAND = ("Reference image: a black-and-white close crop of this ring's row of square stones between the two rails. "
            "Take only the shape of the square stones, the channel and the rails; the metal colour comes only from the "
            "description above, never from the reference; do not take its background, lighting or camera angle.")
REF_METALS = ("Reference image: a black-and-white crop of this ring's design, tilted back toward the camera, with its "
              "short row of square stones across the top. Take only the shape: the slim flat-topped band, the single row of nine "
              "square stones in a channel, where the row begins and ends and its flat end walls; the metal colours "
              "come only from the description above, never from the reference; do not take its plain white "
              "background, lighting or camera angle.")

# Sıranın yeri: poza göre saat kadranı (HEP dersi). Yatık: 6 kameraya en yakın; dik: 12 en üstte.
FRONT_ROW = (
    "Seen from above, the ring is like a clock face with 6 o'clock nearest the camera: the row of nine stones is "
    "centred on 6 o'clock, at the front of the ring facing the camera, and runs from a point between 4 and 5 o'clock "
    "to a point between 7 and 8 o'clock, about a quarter of the circle, and stops there; everywhere else, from there "
    "round through 12 o'clock and back, the band is plain polished gold and no stone shows."
)


def stand_row(surface):
    return (
        "Seen as a clock face with 12 o'clock at the top: the row of nine stones is centred on 12 o'clock, on the very "
        "top of the ring, and runs from a point between 10 and 11 o'clock to a point between 1 and 2 o'clock, about a "
        "quarter of the circle, and stops there; the rest of the circle, down both sides and across the bottom that "
        f"rests on the {surface}, is plain polished gold and no stone shows."
    )


FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", RING_Y, REF_FLAT,
     "The ring lies flat on a smooth, matte, pale blue-grey ceramic tile, its opening facing up, seen from the front "
     "and a little above, so the front of the band runs across the frame as a gentle curve and, above it, the polished "
     "inside of the back of the band is visible; the whole ring is in view, nothing cut off. " + FRONT_ROW + " " + SLIM
     + " Daylight comes from a window on the left: the stones show crisp facets and the polished gold reflects the "
     "window softly. The ring sits in the centre of the frame and fills about half of the frame's width, with generous "
     "space all around so that a square crop keeps the whole ring. Behind it a pale blue-grey plaster wall is softly "
     "out of focus. Colour: the tile and the wall are muted cool blue-grey, so the warm yellow gold is the only warm, "
     "saturated colour in the image. The ring is the only object in the image."),
    ("02-row", "the nine square stones in their channel, up close", RING_Y, REF_CLOSE,
     "Close-up of the row of stones. The camera looks straight down at the top of the band from a few centimetres "
     "away; the band runs across the frame from left to right as a slim flat strip, and the whole row of nine square "
     "stones is in the frame, centred, with both of its flat end walls and a short length of plain polished gold "
     "beyond each end. The two slim polished rails run along the top edge and the bottom edge of the row. All nine "
     "stones are in sharp focus; the band curves gently away and softens toward the left and right edges of the frame. "
     "Low daylight from one side: each stone shows its crisp facets and square corners, and the polished rails catch "
     "thin bright highlights. Behind the band, blue-grey slate is out of focus."),
    ("03-stand", "the row across the top, the plain band below", RING_Y, REF_STAND,
     "The ring stands upright on its edge on folded chambray, a soft light-indigo cotton, turned three-quarters to the "
     "camera and seen from a little above. " + stand_row("cotton") + " The polished inside of the band shows through "
     "the opening. " + SLIM + " Colour: the chambray is a muted light indigo with a soft visible weave, so the warm "
     "gold stands out against it."),
    ("04-hand", "how the band looks on the hand", RING_Y, REF_HAND,
     "A woman's hand rests palm-down on soft blue-grey linen, seen from slightly above, fingers relaxed and slightly "
     "apart. The ring is worn on the ring finger, the fourth finger, between the middle finger and the little finger, "
     "near the base of the finger, with the row of nine stones lying across the top of the finger from one side to "
     "the other, facing the camera; the plain part of the band wraps around the sides and underneath, toward the palm. "
     "It is the only ring; the other fingers and the wrist are bare, no watch and no bracelet. The band is slim on the "
     "finger: its 3 mm width is only about a fifth of the finger's width. Natural skin texture, short natural nails "
     "without polish. Colour: the linen is a soft muted blue-grey and the skin natural, so the gold is the warmest "
     "accent in the image."),
    ("05-metals", "the three metal colours side by side", RING_3, REF_METALS,
     "The three rings lie on a smooth, matte slab of mid-grey limestone, seen from the front and a little above. Each "
     "band is slim: its 3 mm width is only about one seventh of its ring's outer diameter. Together they fill the width "
     "of the frame, with space around them. Behind them a plain light-grey wall is softly out of focus. Colour: the "
     "limestone is a neutral mid-grey, neither warm nor cool, so each metal shows its own true colour and none is "
     "favoured."),
    ("06-white", "the white gold version, against warm clay", RING_W, REF_STAND,
     "The ring stands upright on its edge on a warm terracotta clay tile, turned three-quarters to the camera and seen "
     "from a little above. " + stand_row("clay") + " The polished inside of the band shows through the opening. "
     + SLIM + " Daylight grazes across the ring from one side, so the stones show their facets and the rails draw thin "
     "bright lines. Colour: the clay and the softly blurred background are warm, muted terracotta, so the cool white "
     "gold reads crisp and bright against them."),
    ("07-rose", "the rose gold version, against sage green", RING_R, REF_FLAT,
     "The ring lies flat on sage-green linen, its opening facing up, seen from the front and a little above. "
     + FRONT_ROW + " " + SLIM + " A few eucalyptus leaves lie softly out of focus behind the ring. Daylight comes from "
     "a window on the right. Colour: the sage green is the complementary colour of the rose gold's soft pink, kept "
     "muted, so the rose gold looks warm and rich against it. The ring is the only piece of jewellery in the image."),
    ("08-scale", "real size against the fingertips", RING_Y, REF_HAND,
     "Real-size view. A woman's hand is seen from the side, close to the camera, holding the ring level between the "
     "very tips of the thumb and the index finger, the two fingertips pressing on the ring's left-most and right-most "
     "points, so the ring is seen edge-on at its own height and the front of the band faces the lens: the row of nine "
     "square stones is in the middle of it, facing the camera, a short straight line of stones between the fingertips, "
     "and the opening is hidden. The ring is small, as a real ring is: its outer diameter of about 22 mm is the gap "
     "between the two fingertips, only about one and a third times the thickness of the thumb's tip as seen from this "
     "side. The band itself is a slim strip: its 3 mm height is only about a seventh of that 22 mm gap. Fingers "
     "relaxed, natural skin, short natural nails without polish. Behind, a pale blue-grey wall is out of focus."),
    ("09-end", "where the row ends: the flat end wall of the channel", RING_Y, REF_END,
     "Close view of one end of the row of stones. The ring stands upright on its edge on matte blue-grey slate, with "
     "its row of stones on top; the camera is close above the top of the ring and a little to one side, looking down "
     "at the top of the band where the row ends. On the "
     "right of the frame are the last three square stones of the row, edge to edge between the two slim polished "
     "rails; in the middle of the frame the row ends at a flat polished wall of gold cut straight across the band, "
     "level with the rails; on the left the band continues as plain polished gold, its smooth flat top and softly "
     "rounded edges catching the window light. The end wall is crisp and square, with no prong, no bead and no rounded "
     "cap. The band's 1.8 mm thickness shows on its side face, toward the camera. Low daylight from one side. Colour: the slate is a "
     "muted cool blue-grey, so the warm yellow gold is the only warm colour in the image. The ring is the only object "
     "in the image."),
]

prompts = []
for fid, feature, ring, ref, frame in FRAMES:
    p = " ".join([frame, ring, LIGHT, PHOTO, ref])
    low = p.lower()
    for blk in (LIGHT, PHOTO, ref):
        assert p.count(blk) == 1, (fid, blk[:30])
    counts = tuple(p.count(b) for b in (RING_Y, RING_W, RING_R, RING_3))
    want = {"05-metals": (0, 0, 0, 1), "06-white": (0, 1, 0, 0), "07-rose": (0, 0, 1, 0)}.get(fid, (1, 0, 0, 0))
    assert counts == want, (fid, counts)
    want_ref = {"01-hero": REF_FLAT, "07-rose": REF_FLAT, "03-stand": REF_STAND, "06-white": REF_STAND,
                "02-row": REF_CLOSE, "09-end": REF_END, "04-hand": REF_HAND, "08-scale": REF_HAND,
                "05-metals": REF_METALS}[fid]
    assert ref is want_ref, (fid, "referans cümlesi")
    # bilinen tuzaklar: tam tur / çok sıra / dikdörtgen taş çağıran sözcükler, jargon, kardeş listing'ler, renkli ışık
    for bad in ("eternity", "pave", "pavé", "baguette", "emerald cut", "rectangular", "classic", "same metal",
                "exact copy", "solitaire", "macro", "sparkle", "celestial", "starburst", "vertical", "engagement",
                "anniversary", "straight row", "cross-shaped", "groove", "bevel", "brushed", "hammer", " star", "amber", "teal", "travertine",
                "moissanite", "in one colour", "all the way around", "bezel", "halo", "tiny shared", "micro"):
        assert bad not in low, (fid, bad)
    # tasarım pinleri
    assert "exactly nine" in low and "princess cut" in low and "edge to edge" in low, fid
    assert "about a quarter of the ring's circle" in low and "flat polished wall of gold" in low, fid
    assert "no prongs" in low, fid
    if fid != "05-metals":
        assert "about 2 mm square with sharp square corners" in low and "these are the only stones" in low, fid
        assert "about 3 mm wide and 1.8 mm thick" in low, fid
        assert "the other three quarters of the circle are plain polished gold with no stones" in low, fid
    # her kare taş sırasının bu pozda nerede olduğunu söyler
    where = {"01-hero": "centred on 6 o'clock", "07-rose": "centred on 6 o'clock", "03-stand": "centred on 12 o'clock",
             "06-white": "centred on 12 o'clock", "02-row": "the whole row of nine square stones is in the frame",
             "09-end": "the row ends at a flat polished wall", "04-hand": "lying across the top of the finger",
             "08-scale": "the row of nine square stones is in the middle", "05-metals": "centred on the point nearest the camera"}[fid]
    assert where in low, (fid, "taş sırasının yeri")
    if fid in ("01-hero", "07-rose", "03-stand", "06-white"):
        assert re.search(r"runs from a point between \d+ and \d+ o'clock to a point between \d+ and \d+ o'clock", low), fid
        assert "and stops there" in low and "no stone shows" in low, (fid, "sıranın bittiği yer + gerisi boş")
    # incelik orana bağlı
    assert re.search(r"one seventh|a seventh|a fifth of the finger", low) or fid in ("02-row", "09-end"), (fid, "incelik")
    assert "natural daylight only" in low and "no coloured light patches" in low, fid
    pal = {"05-metals": ("mid-grey limestone",), "06-white": ("terracotta",), "07-rose": ("sage",)}.get(
        fid, ("blue-grey", "slate", "indigo", "chambray"))
    assert any(w in low for w in pal), (fid, "renk kuramı zemini yok")
    if fid in ("06-white", "07-rose"):
        assert "yellow gold" not in low, (fid, "renk karesinde sarı altın yazmaz")
    if fid == "05-metals":
        assert all(c in low for c in ("14k yellow gold", "14k white gold", "14k rose gold")), fid
    hands = bool(re.search(r"\bhands?\b", low))
    assert hands == (fid in ("04-hand", "08-scale")), (fid, "el yalnız el karelerinde")
    if fid == "04-hand":
        assert "fourth finger, between the middle finger and the little finger" in p, fid
    assert "black-and-white" in low, (fid, "referans siyah-beyaz")
    prompts.append({"id": fid, "feature": feature, "prompt": p, "words": len(p.split())})

assert len(prompts) == 9 and len({x["prompt"] for x in prompts}) == 9
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")
for x in prompts:
    print(f"== {x['id']} ({x['words']} words): {x['feature']}\n{x['prompt']}\n")
