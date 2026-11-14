"""EON-TMC9 (iki tonlu 7,0 × 2,0 mm bant: beyaz altın raylar + milgrain, kubbeli sarı orta, önde kanalda dokuz 2,75 mm
round lab-grown taş) Etsy galerisi: 9 Higgsfield prompt'u + yerelde dizilen ölçü kartı (10. kare, kredisiz). Sahip onay
verirse 11. kare sahibin kendi düzenlenmemiş fotoğrafıdır (Etsy'nin "en az bir gerçek fotoğraf" kuralı, playbook 04).

Run: python3 -I docs/eon/lab-grown/07-two-tone-milgrain-channel/images/prompts.py   -> prompts.json

Dil HS5/HEP/PC9'dan: tek pencere gün ışığı, nötr renk; metal sahnedeki tek doygun öğe, zemin onun tamamlayıcısı düşük
doygunlukta. İki tonda sıcak olan sarıdır: zeminler mavi-gri / arduvaz / şambre / kömür grisi yün / soğuk beton; 07 siyah
bazalt (nötr, erkek bandında kontrast).

Tasarım referansı: sahibin 4 GERÇEK fotoğrafından (2026-11-13, atölye) yalnız yüzüğe kırpılmış, çevresi nötr griyle
maskelenmiş RENKLİ kırpımlar (ürün aynı iki tonda satılıyor, renk taşıması istenir; PC9'da siyah-beyazdı çünkü referans
başka metaldi): refFace (önden bant yüzü, altı taş + kanalın yuvarlak ucu), refEnd (son üç taş, yuvarlak uç, kubbeli sarı
devam), refRow (dokuz taşlık sıra boydan boya). Cımbız, kâğıt havlu, parmaklar ve atölye yansımaları alınmaz.

Dersler (second-brain): kaplama oranı uç noktalarıyla ve poza göre saat kadranında (HEP 2026-11-11, PC9 2026-11-13: uç
bir yer işaretine bağlanır); sayı sayıyla ("exactly nine"); kusur hep şekil/sayıdadır; "eternity" (taşı bütün halkaya
yayar), "pave", "princess", "baguette", "sparkle"/"macro" jargonu yok; bant oranı sayıyla (7 mm = dış çapın ~3/10'u).
"""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

DESIGN = (
    "about 7 mm wide and about 2 mm thick, made in two tones of gold. Along each of its two edges runs a polished "
    "white gold rail with a softly rounded outer edge, and along the inner edge of each rail runs one fine line of "
    "tiny round milgrain beads, also white gold, all the way around the ring. Between the two bead lines the centre "
    "of the band is a smooth, softly domed strip of polished yellow gold, about three fifths of the band's "
    "width. At the front of the ring one channel is cut into this yellow centre, and in it sits one single row of "
    "exactly nine round brilliant cut stones along the band, edge to edge, held along both sides by the channel's "
    "polished yellow gold walls, with no prongs and no metal between neighbouring stones. Each stone is about 2.75 mm "
    "across, about two fifths of the band's width, its top just below the top of the yellow centre, showing a "
    "crisp pattern of facets radiating from its centre. The row covers only about a third of the ring's circle: past "
    "the last stone at each end the empty channel runs on for about one stone's length and closes in a smooth rounded "
    "end, and beyond it the yellow centre is plain and domed again. The other two thirds of the circle have no stones: "
    "white rails, bead lines and the plain domed yellow centre all the way round. Inside, the band is polished white "
    "gold."
)
COLOURS = ("The white gold is bright, cool silver-white and the yellow gold warm soft yellow; the two tones meet "
           "crisply at the bead lines.")
DIAMONDS = "The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets."
ONLY = (
    "These are the only stones on the ring: exactly nine, in one single row in the yellow centre, no second row, no "
    "larger centre stone, no stones in the white rails, no stones anywhere else on the band, no engraving, no "
    "hallmark, no text."
)
PROPORTION = "The band is fairly wide: its 7 mm width is about three tenths of the ring's outer diameter of about 23 mm."
RING = "The ring: a solid two tone gold band, " + DESIGN + " " + COLOURS + " " + DIAMONDS + " " + ONLY
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
# Referanslar: sahibin gerçek fotoğraflarından renkli, maskeli kırpımlar; tasarım ve iki ton alınır, sahne alınmaz.
_TAKE = ("Take only the ring's design and its two colours: the white gold rails, the two lines of milgrain beads, the "
         "domed yellow gold centre, the channel with its row of round stones and its rounded ends. Do not take the "
         "photographs' setting: no tweezers, no paper towel, no fingers, not the plain grey mask around the ring, not "
         "their lighting and not their camera angle; the dark patches on the polished gold are only reflections of the "
         "workshop, not part of the ring.")
REF_FACE = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the front of the "
            "band with round stones in the channel and, at the right, the rounded end of the channel; the second shows "
            "the last three stones, the rounded end of the channel and the plain domed yellow centre beyond it. " + _TAKE)
REF_ROW = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the row of round "
           "stones running along the band between the two bead lines, the second shows the front of the band with the "
           "stones and the rounded end of the channel. " + _TAKE)
REF_END = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the last three "
           "stones, the rounded end of the channel and the plain domed yellow centre beyond it, the second shows the "
           "front of the band with the row of stones. " + _TAKE)
REF_PLAIN = ("Reference image: a real photograph of this ring, cropped to the ring; beyond the rounded end of the "
             "channel it shows the plain domed yellow centre between the two bead lines and the white rails. " + _TAKE)

# Sıranın yeri: poza göre saat kadranı. Yatık: 6 kameraya en yakın; dik: 12 en üstte. Üçte bir = 4 saat.
FRONT_ROW = (
    "Seen from above, the ring is like a clock face with 6 o'clock nearest the camera: the row of nine stones is "
    "centred on 6 o'clock, at the front of the ring facing the camera, and runs from 4 o'clock to 8 o'clock, about a "
    "third of the circle, and stops there, well short of the ring's left and right sides at 3 and 9 o'clock; past each "
    "end the empty channel closes in a rounded end, and from there round through 12 o'clock and back no stone shows: "
    "only the white rails, the bead lines and the plain domed yellow centre."
)


def stand_row(surface):
    return (
        "Seen as a clock face with 12 o'clock at the top: the row of nine stones sits only on the top of the ring, "
        "facing up, centred on 12 o'clock, and runs from 10 o'clock to 2 o'clock, about a third of the circle, and "
        "stops there, well above the ring's two widest points at mid-height. The stones never run down the sides: the "
        f"side of the ring that faces the camera, the far side, both widest points and the bottom that rests on the "
        f"{surface} have no stones, only the white rails, the bead lines and the plain domed yellow centre, and no "
        "stone shows there, so in the photograph the nine stones make a short arc across the top of the ring and most "
        "of the circle is bare two tone gold."
    )


FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", REF_FACE,
     "The ring lies flat on a smooth, matte, pale blue-grey ceramic tile, its opening facing up, seen from the front "
     "and a little above, so the front of the band runs across the frame as a gentle curve and, above it, the polished "
     "white gold inside of the back of the band is visible; the whole ring is in view, nothing cut off. " + FRONT_ROW
     + " " + PROPORTION + " Daylight comes from a window on the left: the stones show crisp facets, the bead lines "
     "catch tiny points of light and the polished gold reflects the window softly. The ring sits in the centre of the "
     "frame and fills about half of the frame's width, with generous space all around so that a square crop keeps the "
     "whole ring. Behind it a pale blue-grey plaster wall is softly out of focus. Colour: the tile and the wall are "
     "muted cool blue-grey, so the warm yellow gold is the only warm, saturated colour in the image. The ring is the "
     "only object in the image."),
    ("02-row", "the nine round stones in their channel, up close", REF_ROW,
     "Close-up of the row of stones. The camera looks straight down at the top of the band from a few centimetres "
     "away; the band runs across the frame from left to right as a 7 mm strip in two tones, and the whole row of nine "
     "round stones is in the frame, centred, with the rounded end of the channel and a short length of plain domed "
     "yellow gold beyond each end. Along the top edge and the bottom edge of the strip run the white gold rails, each "
     "with its fine line of milgrain beads beside the yellow centre. All nine stones are in sharp focus; the band "
     "curves gently away and softens toward the left and right edges of the frame. Low daylight from one side: each "
     "stone shows its crisp facets, the beads catch tiny highlights and the domed yellow centre shows one soft long "
     "highlight. Behind the band, blue-grey slate is out of focus. Colour: the slate is a muted cool blue-grey, so the "
     "warm yellow gold is the only warm colour in the image."),
    ("03-stand", "the row across the top, the plain two tone band below", REF_FACE,
     "The ring stands upright on its edge on folded chambray, a soft light-indigo cotton, turned three-quarters to the "
     "camera and seen from above at about 40 degrees, so the top of the ring, where the stones face up, is in clear "
     "view. " + stand_row("cotton") + " The polished white gold inside of the band shows through the opening. "
     + PROPORTION + " Colour: the chambray is a muted light indigo with a soft visible weave, so the warm yellow gold "
     "stands out against it."),
    ("04-hand", "how the band looks on a man's hand", REF_ROW,
     "A man's hand rests palm-down on soft charcoal-grey wool, seen from slightly above, fingers relaxed and slightly "
     "apart. The ring is worn on the ring finger, the fourth finger, between the middle finger and the little finger, "
     "near the base of the finger, with the row of nine stones lying across the top of the finger from one side to "
     "the other, facing the camera; the plain two tone part of the band wraps around the sides and underneath, toward "
     "the palm. It is the only ring; the other fingers and the wrist are bare, no watch and no bracelet. The band sits "
     "firmly on the finger: its 7 mm width is about a third of the finger's width. Natural skin texture, short clean "
     "nails. Colour: the wool is a muted cool charcoal grey and the skin natural, so the gold is the warmest accent in "
     "the image."),
    ("05-tones", "the two tones and the milgrain at the plain back", REF_PLAIN,
     "Close view of the plain back of the band, where there are no stones. The camera looks straight down at the "
     "outside of the band from a few centimetres away, so only a short length of the band is in the frame and the "
     "rest of the ring is outside it; the band runs diagonally across the frame from the upper left corner to the "
     "lower right corner, and across its width it shows, in order: a polished white gold rail, a fine line of round "
     "milgrain beads, the softly domed polished yellow gold centre, another line of milgrain beads and the other white "
     "gold rail. There are no stones and no channel anywhere in this part of the band. The beads are small, round and "
     "evenly spaced, in sharp focus; the band softens toward the two corners. Low daylight from one side draws one "
     "long soft highlight along the yellow dome and tiny points of light on the beads. Behind the band, matte pale "
     "concrete is out of focus. Colour: the concrete is a cool light grey, so the two tones of gold read clearly "
     "against it. The ring is the only object in the image."),
    ("06-face", "the front of the band at eye level: width, stones, two tones", REF_FACE,
     "The ring lies flat on matte charcoal slate, its opening facing up, and the camera is low, just above the slate "
     "and close to the front of the ring, looking straight at the front of the band: the band's outer face fills the "
     "middle of the frame like a low curved wall, about 7 mm tall, with a white gold rail and its bead line along the "
     "top, the domed yellow gold centre in the middle and the other bead line and white rail along the bottom. The row "
     "of nine round stones runs along the yellow centre, centred in front of the lens, and toward the left and the "
     "right the band curves away and softens, where the channel closes in its two rounded ends and the yellow centre "
     "is plain again. Above the front of the band, the polished white gold top edge of the back of the ring is just "
     "visible. Daylight from the left. Colour: the charcoal slate is a cool dark grey, so the gold reads warm and "
     "bright against it. The ring is the only object in the image."),
    ("07-dark", "the band against black stone", REF_FACE,
     "The ring lies flat on a slab of matte black basalt, its opening facing up, seen from the front and a little "
     "above and turned slightly to the right, so the front of the band runs across the frame as a gentle curve; the "
     "whole ring is in view, nothing cut off. " + FRONT_ROW + " " + PROPORTION + " A single soft window light comes "
     "from the right; the black stone stays matte and dark and the ring stands out quietly against it: the white gold "
     "reads bright and cool, the yellow gold warm. The ring sits in the centre of the frame and fills about half of "
     "the frame's width. Colour: the basalt is a neutral matte black, so both tones of gold keep their own true "
     "colour. The ring is the only object in the image."),
    ("08-scale", "real size against a man's palm", REF_FACE,
     "Real-size view. A man's open hand, palm up, is seen from slightly above, the fingers relaxed and slightly "
     "curled; the ring lies flat in the middle of the palm, its opening facing up, turned so that its row of stones is "
     "at the front of the ring, nearest the camera. " + FRONT_ROW + " The ring sits on the palm at its real size: its "
     "whole width, about 23 mm, is about a quarter of the width of the palm, a little more than the width of one "
     "finger at its base. " + PROPORTION + " Natural skin texture, short clean nails. Behind the hand, soft blue-grey "
     "linen is out of focus."),
    ("09-end", "where the row ends: the rounded end of the channel", REF_END,
     "Close view of one end of the row of stones. The camera looks straight down at the top of the band from a few "
     "centimetres away, so only a short length of the band is in the frame and the rest of the ring is outside it; "
     "the band runs diagonally across the frame as a 7 mm two tone strip, from the lower left corner to the upper right "
     "corner. In the upper right are the last three round stones of the row, edge to edge in the channel in the yellow "
     "centre; past the last stone the empty channel runs on for about one stone's length and closes in a smooth "
     "rounded end, its polished yellow floor and walls catching the light; in the lower left the yellow centre is "
     "plain and softly domed again between the two lines of milgrain beads and the white rails. The rounded end and "
     "the stones next to it are in sharp focus; the band softens toward the two corners. Low daylight from one side. "
     "Behind the band, matte blue-grey slate is out of focus. Colour: the slate is a muted cool blue-grey, so the warm "
     "yellow gold is the only warm colour in the image. The ring is the only object in the image."),
]

prompts = []
for fid, feature, ref, frame in FRAMES:
    p = " ".join([frame, RING, LIGHT, PHOTO, ref])
    low = p.lower()
    for blk in (RING, LIGHT, PHOTO, ref):
        assert p.count(blk) == 1, (fid, blk[:30])
    want_ref = {"01-hero": REF_FACE, "03-stand": REF_FACE, "06-face": REF_FACE, "07-dark": REF_FACE,
                "08-scale": REF_FACE, "02-row": REF_ROW, "04-hand": REF_ROW, "05-tones": REF_PLAIN,
                "09-end": REF_END}[fid]
    assert ref is want_ref, (fid, "referans cümlesi")
    # bilinen tuzaklar: tam tur / çok sıra / kare ya da dikdörtgen taş, kardeş listing'ler, jargon, renkli ışık
    for bad in ("eternity", "pave", "pavé", "princess", "baguette", "emerald cut", "rectangular", "square stone",
                "square cut", "classic", "same metal", "exact copy", "solitaire", "macro", "sparkle", "starburst",
                "vertical", "engagement", "anniversary", "wedding", "straight row", "groove", "bevel", "brushed",
                "hammer", " star", "rose", "flat polished wall", "a quarter of the ring's circle", "amber",
                "teal", "travertine", "moissanite", "in one colour", "all the way around the ring with stones",
                "bezel", "halo", "tiny shared", "micro", "woman"):
        assert bad not in low, (fid, bad)
    assert not re.search(r"(?<!\d)3 mm", low), (fid, "PC9'un 3 mm'si sızmış (23 mm dış çap hariç)")
    # tasarım pinleri (RING bloğu her karede bir kez)
    for pin in ("exactly nine round brilliant cut stones", "edge to edge", "about a third of the ring's circle",
                "closes in a smooth rounded end", "milgrain beads", "softly domed strip of polished yellow gold",
                "white gold rail", "no prongs", "these are the only stones", "about 7 mm wide and about 2 mm thick",
                "about 2.75 mm across", "the other two thirds of the circle have no stones"):
        assert pin in low, (fid, pin)
    # her kare taş sırasının bu pozda nerede olduğunu söyler
    where = {"01-hero": "centred on 6 o'clock", "07-dark": "centred on 6 o'clock", "08-scale": "centred on 6 o'clock",
             "03-stand": "centred on 12 o'clock", "02-row": "the whole row of nine round stones is in the frame",
             "09-end": "past the last stone the empty channel runs on", "04-hand": "lying across the top of the finger",
             "05-tones": "there are no stones and no channel anywhere in this part of the band",
             "06-face": "centred in front of the lens"}[fid]
    assert where in low, (fid, "taş sırasının yeri")
    if fid in ("01-hero", "07-dark", "08-scale"):
        assert "runs from 4 o'clock to 8 o'clock" in low and "well short of the ring's left and right sides" in low, fid
        assert "and stops there" in low and "no stone shows" in low, (fid, "sıranın bittiği yer + gerisi boş")
    if fid == "03-stand":
        assert "runs from 10 o'clock to 2 o'clock" in low and "well above the ring's two widest points" in low, fid
        assert "the stones never run down the sides" in low and "seen from above at about 40 degrees" in low, fid
    # oran sayıyla
    assert ("three tenths of the ring's outer diameter" in low) == (fid in ("01-hero", "03-stand", "07-dark",
                                                                             "08-scale")), (fid, "oran")
    if fid == "04-hand":
        assert "about a third of the finger's width" in low
        assert "fourth finger, between the middle finger and the little finger" in p, fid
    if fid == "08-scale":
        assert "about a quarter of the width of the palm" in low and "lies flat in the middle of the palm" in low, fid
    if fid in ("05-tones", "09-end"):
        assert "the rest of the ring is outside it" in low and "diagonally" in low, fid
    assert "natural daylight only" in low and "no coloured light patches" in low, fid
    pal = {"01-hero": "blue-grey", "02-row": "blue-grey slate", "03-stand": "chambray", "04-hand": "charcoal-grey wool",
           "05-tones": "pale concrete", "06-face": "charcoal slate", "07-dark": "black basalt",
           "08-scale": "blue-grey linen", "09-end": "blue-grey slate"}[fid]
    assert pal in low, (fid, "renk kuramı zemini yok")
    hands = bool(re.search(r"\bhands?\b", low))
    assert hands == (fid in ("04-hand", "08-scale")), (fid, "el yalnız el karelerinde")
    if hands:
        assert "a man's" in low, (fid, "erkek bandı: erkek eli")
    assert "real photographs of this ring" in low or "a real photograph of this ring" in low, (fid, "referans")
    assert "no tweezers, no paper towel, no fingers" in low, (fid, "atölye sahnesi alınmaz")
    prompts.append({"id": fid, "feature": feature, "prompt": p, "words": len(p.split()),
                    "md5": hashlib.md5(p.encode()).hexdigest()})

assert len(prompts) == 9 and len({x["prompt"] for x in prompts}) == 9
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")
for x in prompts:
    print(f"== {x['id']} ({x['words']} words, md5 {x['md5'][:8]}): {x['feature']}\n{x['prompt']}\n")
