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
import hashlib
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
    """v2 (2026-11-13): v1'de (03, 06) sıra kameraya bakan yan yüzden kumaşa/kile kadar indi (11-13 taş, yarım tur).
    Düzeltme: bitişi bir yer işaretine bağla (halkanın orta yükseklikteki iki en geniş noktasının çok üstünde),
    yanlış sınıfı adıyla yasakla (yanlardan aşağı inmez) ve kamerayı yükselt (taşlar yukarı bakıyor, üstten görünür)."""
    return (
        "Seen as a clock face with 12 o'clock at the top: the row of nine stones sits only on the very top of the ring, "
        "facing up, centred on 12 o'clock, and runs from a point between 10 and 11 o'clock to a point between 1 and 2 "
        "o'clock, about a quarter of the circle, and stops there, well above the ring's two widest points at "
        "mid-height. The stones never run down the sides: the side of the ring that faces the camera, the far side, "
        f"both widest points and the bottom that rests on the {surface} are all plain polished gold and no stone shows, "
        "so in the photograph the nine stones make only a short arc across the top of the ring and most of the circle "
        "is bare gold."
    )


# 08 ölçek karesi, çekim çekim (status.json reddedilenler bu metinlerin md5'ini taşır):
# v1 parmak uçları halkanın iki ucunda (FRAMES geçmişi: git), halkayı başparmağın görünen kalınlığının ~2,1 katı çizdi.
# v2 modelin kendi tutuşu (bandın altı ve üstü), ölçek iki komşu boyutla: tuttu (1,2) ama sırada 8 taş.
# v3 v2 + simetrik sayı (ortada beşinci taş, iki yanda dörder): yine 8 taş. Aynı pozda üçüncü kez sertleştirmek yerine
# poz değişti (second-brain 2026-09-30, "bir detay bir pozda tutmuyorsa pozu değiştir").
# v4 avuç içinde yatık halka: 01, 05 ve 07'de dokuz taşı her seferinde tutan yatık/önden poz; ölçek avuç ve parmakla.
SCALE_PINCH = (
    "Real-size view. A woman's hand is seen from the side, close to the camera, holding the ring level between the "
    "very tips of the thumb and the index finger: the index fingertip rests on the top edge of the band and the thumb "
    "tip under its bottom edge, pinching the front of the band, so the ring is seen edge-on at its own height and the "
    "front of the band faces the lens: the row of nine square stones is in the middle of it, facing the camera, a "
    "short line of stones between the fingertips{count}; the opening is hidden. The ring is small next to the "
    "fingertips, as a real ring is: the band is only 3 mm high, about a fifth of the thickness of the thumb tip, and "
    "the whole ring, about 22 mm wide, is only about one and a half times as wide as the thumb tip is thick. Fingers "
    "relaxed, natural skin, short natural nails without polish. Behind, a pale blue-grey wall is out of focus."
)
SCALE_V2 = SCALE_PINCH.format(count=", and the opening is hidden").replace(
    ", and the opening is hidden; the opening is hidden.", ", and the opening is hidden.")
SCALE_V3 = SCALE_PINCH.format(count=": the fifth stone sits exactly in front of the lens with four stones on each side "
                                    "of it, and a flat end wall closes each end of the row")
SCALE_V4 = (
    "Real-size view. A woman's open hand, palm up, is seen from slightly above, the fingers relaxed and slightly "
    "curled; the ring lies flat in the middle of the palm, its opening facing up, turned so that its row of stones is "
    "at the front of the ring, nearest the camera. " + FRONT_ROW + " The ring is small on the palm, as a real ring is: "
    "its whole width, about 22 mm, is only about a quarter of the width of the palm, a little more than the width of "
    "one finger at its base. " + SLIM + " Natural skin texture, short natural nails without polish. Behind the hand, "
    "soft blue-grey linen is out of focus."
)
SCALE = SCALE_V4

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
     "camera and seen from above at about 40 degrees, so the top of the ring, where the stones face up, is in clear "
     "view. " + stand_row("cotton") + " The polished inside of the band shows through "
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
     "from above at about 40 degrees, so the top of the ring, where the stones face up, is in clear view. "
     + stand_row("clay") + " The polished inside of the band shows through the opening. "
     + SLIM + " Daylight grazes across the ring from one side, so the stones show their facets and the rails draw thin "
     "bright lines. Colour: the clay and the softly blurred background are warm, muted terracotta, so the cool white "
     "gold reads crisp and bright against them."),
    ("07-rose", "the rose gold version, against sage green", RING_R, REF_FLAT,
     "The ring lies flat on sage-green linen, its opening facing up, seen from the front and a little above. "
     + FRONT_ROW + " " + SLIM + " A few eucalyptus leaves lie softly out of focus behind the ring. Daylight comes from "
     "a window on the right. Colour: the sage green is the complementary colour of the rose gold's soft pink, kept "
     "muted, so the rose gold looks warm and rich against it. The ring is the only piece of jewellery in the image."),
    ("08-scale", "real size against the hand", RING_Y, REF_FLAT, SCALE),
    ("09-end", "where the row ends: the flat end wall of the channel", RING_Y, REF_END,
     # v2 (2026-11-13): v1 bütün halkayı yatık ve kadrajda çizdi; taş ve bant halkaya göre büyüdü (bant ~5 mm, halka
     # ~12 mm okunuyordu). Bütün halka kadraj dışında kalır, 02 gibi tam tepeden ama bant çapraz akar (02'nin kopyası
     # olmasın diye).
     "Close view of one end of the row of stones. The camera looks straight down at the top of the band from a few "
     "centimetres away, so only a short length of the band is in the frame and the rest of the ring is outside it; the "
     "band runs diagonally across the frame as a slim flat strip, from the lower left corner to the upper right "
     "corner. In the upper right are the last three square stones of the row, edge to edge between the two slim "
     "polished rails; in the centre of the frame the row ends at a flat polished wall of gold cut straight across the "
     "band, level with the rails; in the lower left the band continues as plain polished gold, its smooth flat top and "
     "softly rounded edges catching the window light. The end wall is crisp and square, with no prong, no bead and no "
     "rounded cap. The end wall and the stones next to it are in sharp focus; the band softens toward the two corners. "
     "Low daylight from one side. Behind the band, matte blue-grey slate is out of focus. Colour: the slate is a muted "
     "cool blue-grey, so the warm yellow gold is the only warm colour in the image. The ring is the only object in the "
     "image."),
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
                "02-row": REF_CLOSE, "09-end": REF_END, "04-hand": REF_HAND, "08-scale": REF_FLAT,
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
             "08-scale": "centred on 6 o'clock", "05-metals": "centred on the point nearest the camera"}[fid]
    assert where in low, (fid, "taş sırasının yeri")
    if fid in ("01-hero", "07-rose", "03-stand", "06-white", "08-scale"):
        assert re.search(r"runs from a point between \d+ and \d+ o'clock to a point between \d+ and \d+ o'clock", low), fid
        assert "and stops there" in low and "no stone shows" in low, (fid, "sıranın bittiği yer + gerisi boş")
    # incelik orana bağlı
    assert re.search(r"one seventh|a seventh|a fifth of the finger|a fifth of the thickness of the thumb tip", low) \
        or fid in ("02-row", "09-end"), (fid, "incelik")
    # v2 pinleri (v1 kusurunun sınıfı adıyla)
    if fid in ("03-stand", "06-white"):
        assert "well above the ring's two widest points" in low and "the stones never run down the sides" in low, fid
        assert "seen from above at about 40 degrees" in low and "a little above" not in low, fid
    if fid == "08-scale":
        assert "about a quarter of the width of the palm" in low and "lies flat in the middle of the palm" in low, fid
    if fid == "09-end":
        assert "the rest of the ring is outside it" in low and "diagonally" in low, fid
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
# v1'de kabul edilen kareler (status.json) donuk: metinleri bayt bayt aynı kalır.
FROZEN_V1 = {
    "01-hero": "4d6add819cde4009c5270d3282448080",
    "02-row": "9f8fbd46646c8e8124b436e66a8e82a5",
    "04-hand": "57469ec19144084cbd000ce864ecbf16",
    "05-metals": "08bffd488c3c26016e2cdc52ddd1dbbd",
    "07-rose": "9aee152752fd69fe333a181ece3c778f",
}
for x in prompts:
    if x["id"] in FROZEN_V1:
        assert hashlib.md5(x["prompt"].encode()).hexdigest() == FROZEN_V1[x["id"]], (x["id"], "kabul edilen v1 değişti")
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")
for x in prompts:
    print(f"== {x['id']} ({x['words']} words): {x['feature']}\n{x['prompt']}\n")
