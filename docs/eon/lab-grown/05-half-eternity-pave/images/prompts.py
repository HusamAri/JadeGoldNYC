"""EON-HEP (1,5 mm, üst yarıda tek sıra ~1,3 mm round taş, paylaşımlı mikro tırnak; taş seçimli) Etsy galerisi:
9 Higgsfield prompt'u + yerelde dizilen taş tablosu (10. kare, stone_chart.py, kredisiz).

Run: python3 -I docs/eon/lab-grown/05-half-eternity-pave/images/prompts.py   -> prompts.json

Dil HS5'ten (sahip 2026-11-10: "doğal ışık ve metal dokularını koruyarak … color theory'e göre"):
- IŞIK: yalnız tek pencereden gün ışığı, nötr renk, gerçek yumuşak gölge; renkli ışık lekesi yok.
- RENK KURAMI: metal sahnedeki tek doygun öğe, zemin onun tamamlayıcısı, düşük doygunlukta: sarı altın → mavi-gri
  (seramik karo, arduvaz, şambre, keten); beyaz altın → sıcak terrakota; rose → adaçayı; üç metal ve beş taş →
  nötr gri (hiçbir rengi kayırmaz).

Tasarım referansı: sahibin Etsy linki 685259244 (NyFineJewelry) fotoğraflarından sıkı kırpımlar (03 önden halka, 03'ün
taş sırası yakını, 01 dik duran halka); filigran ve kumaş kırpımın dışında. Renk karelerinde (06 beyaz, 07 üç metal,
09 rose) referans SİYAH-BEYAZ: referans rengi de taşır (Comet Tail 2026-09-27). Model ve parametreler jobs.json'da.

Tuzaklar (önceki setlerden): "eternity" sözcüğü yok (model taşı bütün halkaya yayar; tasarım yarım), "pave" yok (çok
sıra çağırır), "sparkle"/"macro" jargonu yok. Taşların yeri her karede POZA göre fiziksel tarifle (HS5 v1: dik duran
yüzükte "sol/sağ" olmaz): düz yatan yüzükte "ön yarı", dik duranda "üst yarı, kemer gibi", parmakta "parmağın üstü".
Bandın inceliği sayıyla ve orana bağlı (VB6/HS5: model bandı kalın çizer): 1,5 mm = dış çapın ~1/14'ü.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

DESIGN = (
    "about 1.5 mm wide and 1.5 mm thick: a slim band with softly rounded edges, high polish all over, inside and "
    "out. One single row of small round brilliant stones runs around one half of the ring's circle, the half that "
    "sits on top of the finger when the ring is worn, side by side and close together, about 23 stones in all, "
    "each about 1.3 mm across, almost as wide as the band itself, so the row reads as one continuous line of "
    "light. Between each pair of neighbouring stones, two tiny polished gold prongs hold both stones, so along "
    "each edge of the row there is a fine line of tiny gold beads. The row stops where that half ends, at two "
    "opposite points of the circle; the other half of the band, the part under the finger, is plain polished gold "
    "with no stones."
)
SLIM = (
    "The band is very slim: its 1.5 mm width is only about one fourteenth of the ring's outer diameter of about "
    "21 mm, like a fine line of gold."
)
ONLY = (
    "These are the only stones on the ring: one single row on the top half only, no second row, no larger centre "
    "stone, no stones on the lower half, no engraving, no milgrain, no hallmark, no text."
)
DIAMONDS = "The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets."
RING_Y = "The ring: a solid 14K yellow gold band, " + DESIGN + " " + DIAMONDS + " " + ONLY
RING_W = ("The ring: a solid 14K white gold band, bright cool silver-white all over, " + DESIGN + " " + DIAMONDS + " "
          + ONLY + " The metal is white gold everywhere, prongs and inside included: bright, cool and silver-white, "
          "with no yellow tint.")
RING_R = ("The ring: a solid 14K rose gold band, soft warm pink all over, " + DESIGN + " " + DIAMONDS + " " + ONLY
          + " The metal is rose gold everywhere, prongs and inside included: soft warm pink, with no yellow or "
          "white tint.")
RING_3 = (
    "Three identical rings of this one design lie flat side by side in a row, evenly spaced, their openings facing "
    "up. From left to right the metals are 14K yellow gold (warm soft yellow), 14K white gold (bright cool "
    "silver-white) and 14K rose gold (soft warm pink). Each ring is a slim band about 1.5 mm wide with softly "
    "rounded edges, polished all over, with one single row of small round brilliant colourless lab-grown diamonds, "
    "each about 1.3 mm across, almost as wide as the band, close together around one half of the ring's circle and "
    "held by tiny shared gold prongs; the other half of each band is plain polished gold with no stones. Each ring "
    "is turned so that its row of stones runs along its front half, nearest the camera. Each ring has only that "
    "one row of stones: no second row, no larger centre stone, no engraving, no text."
)
RING_5 = (
    "Five identical rings of this one design lie flat side by side in a row, evenly spaced, their openings facing "
    "up, all in 14K yellow gold. Each ring is a slim band about 1.5 mm wide with softly rounded edges, polished all "
    "over, with one single row of small round stones, each about 1.3 mm across, almost as wide as the band, close "
    "together around one half of the ring's circle and held by tiny shared gold prongs; the other half of each band "
    "is plain polished gold with no stones. Each ring is set with one kind of stone, the same in every stone of its "
    "row; from left to right: colourless lab-grown diamonds; deep blue lab-created sapphires; clear red lab-created "
    "rubies; green lab-created emeralds; purple amethysts. Each ring is turned so that its row of stones runs along "
    "its front half, nearest the camera. Each ring has only that one row of stones: no second row, no larger centre "
    "stone, no engraving, no text."
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
REF_HERO = (
    "Reference images: they show this ring's design in yellow gold. Take only the slim band, the single row of "
    "small round stones across its top half, their size and close spacing, and the tiny shared prongs between "
    "them; do not take their background, fabric, lighting or camera angle."
)
REF_SERIES = (
    "Reference images: the first two show this ring's design (take only the slim band, the single row of stones "
    "across the top half and the tiny shared prongs, not their background, lighting or camera angle); the third is "
    "a close crop of this ring, to match its gold colour and the size of its stones, not its composition."
)
REF_GREY = (
    "Reference images: they are black-and-white crops that show this ring's design. Take only its shape: the slim "
    "band, the single row of stones across the top half and the tiny shared prongs. The metal colour comes only "
    "from the description above, never from the references."
)
# 05: beş farklı taş; sarı + renksiz referans taşları renksiz çizdirebilir → siyah-beyaz, renk yalnız metinden
REF_GREY_STONES = (
    "Reference images: they are black-and-white crops that show this ring's design. Take only its shape: the slim "
    "band, the single row of stones across the top half and the tiny shared prongs. The metal colour and the colour "
    "of each ring's stones come only from the description above, never from the references."
)
FRONT_ROW = (
    "The half of the band that carries the stones is turned toward the camera, so the row of stones runs along the "
    "whole front curve, from the left end of the ring to the right end; the back half, farther away, is plain "
    "polished gold."
)

FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", RING_Y, REF_HERO,
     "The ring lies flat on a smooth, matte, pale blue-grey ceramic tile, its opening facing up, seen from the front "
     "and a little above, so the front half of the band runs across the frame as a gentle curve and, above it, the "
     "polished inside of the back half is visible; the whole ring is in view, nothing cut off. " + FRONT_ROW + " "
     + SLIM + " Daylight comes from a window on the left: the stones show crisp facets and the polished gold "
     "reflects the window softly. The ring sits in the centre of the frame and fills about half of the frame's "
     "width, with generous space all around so that a square crop keeps the whole ring. Behind it a pale blue-grey "
     "plaster wall is softly out of focus. Colour: the tile and the wall are muted cool blue-grey, so the warm "
     "yellow gold is the only warm, saturated colour in the image. The ring is the only object in the image."),
    ("02-row", "the row of stones and the shared prongs, up close", RING_Y, REF_SERIES,
     "Close-up of the row of stones. The camera looks straight down at the top of the band from a few centimetres "
     "away; the band runs across the whole frame from left to right as a slim strip, the row of round stones "
     "filling it from edge to edge, and the tiny gold prongs between neighbouring stones form a fine beaded line "
     "along the top edge and the bottom edge of the row. About eight stones in the middle of the frame are in sharp "
     "focus; the band curves gently away and softens toward the left and right edges. Low daylight from one side: "
     "each stone shows its crisp facets and one small bright reflection, and the polished prongs catch tiny "
     "highlights. Behind the band, blue-grey slate is out of focus."),
    ("03-stand", "the row over the top half, the plain lower half", RING_Y, REF_SERIES,
     "The ring stands upright on its edge on folded chambray, a soft light-indigo cotton, turned three-quarters to "
     "the camera and seen from a little above. The row of stones runs over the top half of the ring, from one side "
     "of the ring to the other, like an arch; the lower half, resting on the cotton, is plain polished gold. The "
     "polished inside of the band shows through the opening. " + SLIM + " Colour: the chambray is a muted light "
     "indigo with a soft visible weave, so the warm gold stands out against it."),
    ("04-hand", "how the slim band looks on the hand", RING_Y, REF_SERIES,
     "A woman's hand rests palm-down on soft blue-grey linen, seen from slightly above, fingers relaxed and slightly "
     "apart. The ring is worn on the ring finger, the fourth finger, between the middle finger and the little "
     "finger, near the base of the finger, with the row of stones on top of the finger facing the camera; the plain "
     "lower half is underneath, toward the palm, out of sight. It is the only ring; the other fingers and the wrist "
     "are bare, no watch and no bracelet. The band is very slim on the finger: its 1.5 mm width is only about a "
     "tenth of the finger's width, a fine line across the finger. Natural skin texture, short natural nails "
     "without polish. Colour: the linen is a soft muted blue-grey and the skin natural, so the gold is the warmest "
     "accent in the image."),
    ("05-stones", "five of the twenty stone choices side by side", RING_5, REF_GREY_STONES,
     "The five rings lie on smooth, pale neutral-grey linen, seen from the front and a little above. Each band is "
     "very slim: its 1.5 mm width is only about one fourteenth of its ring's outer diameter. Together they fill the "
     "width of the frame, with space around them. Behind them a plain light-grey wall is softly out of focus. "
     "Colour: the linen and the wall are neutral grey, neither warm nor cool, so each kind of gem shows its own "
     "true colour and none is favoured."),
    ("06-white", "the white gold version, against warm clay", RING_W, REF_GREY,
     "Low side view along the band. The ring lies flat on a warm terracotta clay tile, its opening facing up. The "
     "camera is at table level, close to the ring and off to one side of it, so the front half of the band, the "
     "half with the row of stones, runs from the near edge of the frame diagonally away from the lens, curving "
     "toward the back: the stones on the far part of the curve are in sharp focus and those on the near part softly "
     "out of focus. The plain half of the band is the back half of the ring, behind. " + SLIM + " Daylight grazes across "
     "the band from one side, so the stones show their facets and the prongs draw tiny bright points. Colour: the "
     "clay and the softly blurred background are warm, muted terracotta, so the cool white gold reads crisp and "
     "bright against them."),
    ("07-metals", "the three metal colours side by side", RING_3, REF_GREY,
     "The three rings lie on a smooth, matte slab of mid-grey limestone, seen from the front and a little above. "
     "Each band is very slim: its 1.5 mm width is only about one fourteenth of its ring's outer diameter. Together "
     "they fill the width of the frame, with space around them. Behind them a plain light-grey wall is softly out "
     "of focus. Colour: the limestone is a neutral mid-grey, neither warm nor cool, so each metal shows its own true "
     "colour and none is favoured."),
    ("08-scale", "real size against the fingertips", RING_Y, REF_SERIES,
     "Real-size view. A woman's hand is seen from the side, close to the camera, holding the ring level between "
     "the very tips of the thumb and the index finger, the two fingertips pressing on two opposite points of the "
     "ring, so the ring is seen edge-on at its own height: the front half of the band, the half with the row of "
     "stones, faces the lens as a short, thin, straight line of stones between the fingertips, and the opening is "
     "hidden. The ring is small, as a real ring is: its outer diameter of about 21 mm is the gap between the two "
     "fingertips, only about one and a third times the thickness of the thumb's tip as seen from this side. The "
     "band itself is a fine line: its 1.5 mm height is only about a fourteenth of that 21 mm gap. Fingers relaxed, "
     "natural skin, short natural nails without polish. Behind, a pale blue-grey wall is out of focus."),
    ("09-rose", "the rose gold version, against sage green", RING_R, REF_GREY,
     "The ring lies flat on sage-green linen, its opening facing up, seen from the front and a little above. "
     + FRONT_ROW + " " + SLIM + " A few eucalyptus leaves lie softly out of focus behind the ring. Daylight comes "
     "from a window on the right. Colour: the sage green is the complementary colour of the rose gold's soft pink, "
     "kept muted, so the rose gold looks warm and rich against it. The ring is the only piece of jewellery in the "
     "image."),
]

prompts = []
for fid, feature, ring, ref, frame in FRAMES:
    p = " ".join([frame, ring, LIGHT, PHOTO, ref])
    low = p.lower()
    for blk in (LIGHT, PHOTO):
        assert p.count(blk) == 1, (fid, blk[:30])
    counts = tuple(p.count(b) for b in (RING_Y, RING_W, RING_R, RING_3, RING_5))
    want = {"05-stones": (0, 0, 0, 0, 1), "06-white": (0, 1, 0, 0, 0), "07-metals": (0, 0, 0, 1, 0),
            "09-rose": (0, 0, 1, 0, 0)}.get(fid, (1, 0, 0, 0, 0))
    assert counts == want, (fid, counts)
    assert (ref is REF_HERO) == (fid == "01-hero"), fid
    assert (ref is REF_GREY) == (fid in ("06-white", "07-metals", "09-rose")), (fid, "renk karesi siyah-beyaz referans")
    assert (ref is REF_GREY_STONES) == (fid == "05-stones"), (fid, "taş rengi yalnız metinden")
    # bilinen tuzaklar: tam tur çağıran sözcükler, jargon, kardeş listing'lerin tasarımı, renkli ışık
    for bad in ("eternity", "pave", "pavé", "classic", "same metal", "exact copy", "solitaire", "macro", "sparkle",
                "celestial", "starburst", "vertical", "engagement", "baguette", "groove", "bevel", "brushed",
                "hammer", "star", "amber", "teal", "travertine", "moissanite", "in one colour", "all the way around",
                "channel", "bezel", "halo"):
        assert bad not in low, (fid, bad)
    # tasarım pinleri
    assert "single row of small round" in low and "about 1.3 mm across" in low and "one half of the ring's circle" in low, fid
    assert "top half of the ring" not in ring.lower(), (fid, "halka bloğu poza bağlı 'top half' demez")
    assert "tiny shared gold prongs" in low or "two tiny polished gold prongs hold both stones" in low, fid
    assert "plain polished gold with no stones" in low, fid
    assert ("these are the only stones" in low) or ("only that one row of stones" in low), fid
    assert ("1.5 mm wide and 1.5 mm thick" in low) or fid in ("05-stones", "07-metals"), fid
    # 02 yakın plan: halkanın çapı kadrajda yok, oran yerine "taş bant kadar geniş" (DESIGN) taşır
    assert re.search(r"one fourteenth|a fourteenth|a tenth of the finger", low) or fid == "02-row", (fid, "incelik orana bağlı değil")
    # her kare taş sırasının bu pozda nerede olduğunu söyler
    scene = (p if fid in ("05-stones", "07-metals") else frame).lower()
    assert re.search(r"row of stones (runs|on top|on the upper half)|front half, nearest the camera|the half with the row"
                     r"|straight down at the top of the band", scene), (fid, "taş sırasının yeri")
    assert "natural daylight only" in low and "no coloured light patches" in low, fid
    pal = {"05-stones": ("neutral-grey linen",), "06-white": ("terracotta",), "07-metals": ("mid-grey limestone",),
           "09-rose": ("sage",)}.get(fid, ("blue-grey", "slate", "indigo", "chambray"))
    assert any(w in low for w in pal), (fid, "renk kuramı zemini yok")
    if fid in ("06-white", "09-rose"):
        assert "yellow gold" not in low, (fid, "renk karesinde sarı altın yazmaz")
    if fid == "07-metals":
        assert all(c in low for c in ("14k yellow gold", "14k white gold", "14k rose gold")), fid
    if fid == "05-stones":
        assert all(c in low for c in ("lab-grown diamonds", "lab-created sapphires", "lab-created rubies",
                                      "lab-created emeralds", "amethysts")), fid
    hands = bool(re.search(r"\bhands?\b", low))
    assert hands == (fid in ("04-hand", "08-scale")), (fid, "el yalnız el karelerinde")
    if fid == "04-hand":
        assert "fourth finger, between the middle finger and the little finger" in p, fid
    prompts.append({"id": fid, "feature": feature, "prompt": p, "words": len(p.split())})

assert len(prompts) == 9 and len({x["prompt"] for x in prompts}) == 9
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")
for x in prompts:
    print(f"== {x['id']} ({x['words']} words): {x['feature']}\n{x['prompt']}\n")
