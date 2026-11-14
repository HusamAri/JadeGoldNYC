"""EON-PEAR2 (14K toi et moi: 1,8 mm ince bant, üstte yan yana iki armut lab-grown taş, 8 × 6 mm ve 5 × 3,5 mm, uçları
zıt yönde, her biri üç tırnaklı alçak sepette) Etsy galerisi: 9 Higgsfield prompt'u + yerelde dizilen ölçü kartı
(10. kare, kredisiz).

Run: python3 -I docs/eon/lab-grown/08-double-pear/images/prompts.py   -> prompts.json + PROMPTS-REVIEW.md

Dil PC9/TMC9'dan: tek pencere gün ışığı, nötr renk, gerçek yumuşak gölge; metal sahnedeki tek doygun öğe, zemin onun
tamamlayıcısı düşük doygunlukta: sarı altın → mavi-gri (seramik karo, arduvaz, şambre), beyaz altın → sıcak terrakota,
rose → adaçayı keten, üç metal → nötr gri kireçtaşı. Kadın yüzüğü: el kareleri kadın eli.

Tasarım referansı: sahibin linki Etsy 1522527544'ün fotoğraflarından SİYAH-BEYAZ sıkı kırpımlar (repoya alınmaz):
refPair (iki taşın yakın çekimi, tırnaklar), refTop (üstten, parmakta: uçlar zıt yönde), refFront (önden, sepetler
bandın üstünde), refSide (yandan profil, sepet yüksekliği). Referans rengi de taşır (Comet Tail 2026-09-27), o yüzden
hepsi siyah-beyaz; renk yalnız metinden. El, tırnak ve deri referanstan alınmaz.

Dersler (second-brain): sayı sayıyla ("exactly two", "exactly three claw prongs"); yön sözcüğü pozla birlikte yazılır
(VB6/HS5): uçların yönü her pozda kameraya ya da parmağa göre söylenir; kusur hep şekil/sayıdadır (Noel 40); "toi et
moi", "engagement", "solitaire", "moissanite", "halo", "sparkle", "macro" yazılmaz (model kendi kalıbını getirir);
cilalı yüzeye göz hizasından yakın bakışta yalnız pencere yansır (TMC9 2026-11-14).
"""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

DESIGN = (
    "a slim plain band about 1.8 mm wide with softly rounded edges, high polish all over, inside and out. On top of "
    "the band sit exactly two pear cut stones side by side, close together, their sides almost touching: one larger "
    "pear about 8 mm long and 6 mm wide, and one smaller pear about 5 mm long and 3.5 mm wide, so the smaller stone is "
    "a little more than half the size of the larger one. Each pear has one rounded end and one sharp point. The long "
    "axis of each pear runs across the band, at right angles to the band's direction around the finger, and the two "
    "long axes are parallel to each other, so the two points face exactly opposite ways: the point of the larger pear "
    "is on one side of the band and the point of the smaller pear is on the other side, head to tail. Neither stone "
    "lies lengthwise along the band, and the two stones never point the same way. Each stone sits "
    "in its own low basket of gold just above the band and is held by exactly three slim claw prongs: one V-shaped "
    "prong covering its point and two prongs at its rounded end. Apart from the two stones the band is plain polished "
    "gold all the way round."
)
ONLY = (
    "These are the only stones on the ring: exactly two pear cut stones, one larger and one smaller, no third stone, "
    "no round stones, no small stones around them, no stones set in the band, no engraving, no milgrain, no hallmark, "
    "no text."
)
DIAMONDS = "The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets."
SLIM = ("The band is slim: its 1.8 mm width is less than a tenth of the ring's outer diameter of about 20 mm, and the "
        "larger stone is about 8 mm long, about two fifths of that diameter.")
RING_Y = "The ring: a solid 14K yellow gold ring, " + DESIGN + " " + DIAMONDS + " " + ONLY
RING_W = ("The ring: a solid 14K white gold ring, bright cool silver-white all over, " + DESIGN + " " + DIAMONDS + " "
          + ONLY + " The metal is white gold everywhere, band, baskets and prongs included: bright, cool and "
          "silver-white, with no yellow tint.")
RING_R = ("The ring: a solid 14K rose gold ring, soft warm pink all over, " + DESIGN + " " + DIAMONDS + " " + ONLY
          + " The metal is rose gold everywhere, band, baskets and prongs included: soft warm pink, with no yellow or "
          "white tint.")
RING_3 = (
    "Three identical rings of this one design. From left to right the metals are 14K yellow gold (warm soft yellow), "
    "14K white gold (bright cool silver-white) and 14K rose gold (soft warm pink). Each ring is a slim plain band about "
    "1.8 mm wide, polished all over, with exactly two colourless lab-grown pear cut stones side by side on its top, "
    "one larger (about 8 x 6 mm) and one smaller (about 5 x 3.5 mm). On each ring the long axis of each pear runs across "
    "the band, at right angles to it, and the two long axes are parallel, so the two points face exactly opposite ways "
    "(head to tail); neither stone lies lengthwise along the band. Each stone sits in its own low basket held by "
    "exactly three slim claw prongs. Each ring has only those two stones: no third stone, no round stones, no small "
    "stones around them, no stones in the band, no engraving, no text."
)
LIGHT = (
    "Light: natural daylight only, from one large window to one side, soft and slightly directional, in true neutral "
    "colour, with no coloured tint, no coloured light patches and no studio-flash look. Real soft shadows fall away "
    "from the window. The metal keeps its true natural colour and real reflections, with highlights but none blown "
    "out, no mirror-chrome look and no glow; only the window is reflected in the polished gold, never a person, a "
    "camera or a hand; the stones show real facets, never a blur or a glow. Real metal and real stones, never smooth "
    "plastic or a computer render."
)
PHOTO = (
    "Photorealistic product photograph, natural colour, sharp focus on the jewellery, gentle shallow depth of field. "
    "No text, no logo, no watermark, no packaging."
)
_TAKE = ("Take only the design: the slim plain band, the two pear stones of different sizes side by side with their "
         "points facing opposite ways, their low baskets and the three claw prongs on each; the metal colour comes only "
         "from the description above, never from the references; do not take the hand, fingers, nails or skin, the "
         "background, the lighting or the camera angle.")
REF_PAIR = ("Reference images: black-and-white crops of this ring's design: the first is a close view of the two pear "
            "stones in their claw prongs, the second shows the two stones from above, head to tail on the band. " + _TAKE)
REF_TOP = ("Reference images: black-and-white crops of this ring's design: the first shows the two stones from above, "
           "head to tail on the band, the second is a close view of the two pear stones in their claw prongs. " + _TAKE)
REF_FRONT = ("Reference images: black-and-white crops of this ring's design: the first shows the ring upright from the "
             "front, its two stones in their low baskets on top of the slim round band, the second is a close view of "
             "the two pear stones in their claw prongs. " + _TAKE)
REF_SIDE = ("Reference images: black-and-white crops of this ring's design: the first shows the ring from the side, the "
            "basket and claws standing a little above the slim band, the second shows the ring upright from the front. "
            + _TAKE)
REF_HAND = ("Reference image: a black-and-white crop of this ring's two stones from above, head to tail on the band. "
            + _TAKE)

# Uçların yönü, poza göre (VB6/HS5 dersi: yön sözcüğü pozla birlikte yazılır). v1 (2026-11-14): halkanın önden ya da
# 45°'den göründüğü 01/03/05/06/09'da model damlaları bant boyunca, çapraz ya da aynı yöne çevirdi (sahip: "damlaların
# yönü doğru değil"); yalnız taşların kameraya yüzünü döndüğü 02 ve 07 doğru çıktı. v2: her poz taşları kameraya yüzü
# dönük gösterir ve yön fotoğrafın kendi düzleminde söylenir. Kiralite referanstaki gibi (refPair: büyük taş solda,
# ucu aşağıda); 07 v1 bunun aynasıydı.
FACE_ON = (
    "In the photograph the two pears are seen face-on, side by side, and their long axes run straight up and down, at "
    "right angles to the band: the larger pear on the left with its point toward the bottom of the frame, the smaller "
    "pear on the right with its point toward the top of the frame."
)

FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", RING_Y, REF_PAIR,
     "The ring lies almost flat on a smooth, matte, pale blue-grey ceramic tile, its opening facing up, with its two "
     "stones at the front of the ring, nearest the camera, their faces turned toward the camera, and it is seen from the "
     "front and a little above. " + FACE_ON + " Behind them the slim band curves away from the camera on both sides and "
     "round the back as a thin oval of polished gold; the whole ring is in view. " + SLIM + " Daylight comes from a "
     "window on the left: the stones show crisp facets and the polished gold reflects the window softly. The ring sits "
     "in the centre of the frame and "
     "fills about half of the frame's height, with generous space all around so that a square crop keeps the whole "
     "ring. Colour: the tile and the wall are muted cool blue-grey, so the warm yellow gold is the only warm, "
     "saturated colour in the image. The ring is the only object in the image."),
    ("02-pair", "the two stones up close: sizes, head to tail, three claws each", RING_Y, REF_PAIR,
     "Close-up of the two stones. The camera looks straight down at the top of the ring from a few centimetres away, "
     "so the two pear stones fill the middle of the frame, side by side: the larger pear on the left with its point "
     "toward the bottom of the frame, the smaller pear on the right with its point toward the top of the frame, their "
     "sides almost touching. Each stone shows its three slim claw prongs: one V-shaped prong over its point and two "
     "at its rounded end. To the left and right the slim polished band leaves the stones and runs out of the frame. "
     "Low daylight from one side: each stone shows crisp facets and the prongs catch small highlights. Behind the ring, "
     "blue-grey slate is out of focus. Colour: the slate is a muted cool blue-grey, so the warm yellow gold is the only "
     "warm colour in the image. The ring is the only object in the image."),
    ("03-above", "from above: both stones face-on, the slim band falling away below", RING_Y, REF_PAIR,
     "The ring stands upright on folded chambray, a soft light-indigo cotton, and the camera looks down at it steeply "
     "from above and slightly in front, at about 70 degrees, so the two stones on top face the camera. " + FACE_ON +
     " From under the stones the slim band runs out to the left and right and curves down and away below them as a thin "
     "ellipse of polished gold; the whole ring is in view. " + SLIM + " Daylight from the left. Colour: the chambray is a "
     "muted light indigo with a soft visible weave, so the warm yellow gold stands out against it. The ring is the only "
     "object in the image."),
    ("04-hand", "worn: on a woman's hand", RING_Y, REF_HAND,
     "A woman's hand rests palm-down on soft charcoal-grey wool, seen from above, the fingers pointing to the left of "
     "the frame, relaxed and slightly apart, short natural nails; a natural hand with one thumb and four fingers. The "
     "ring is worn on the ring finger, the fourth finger, between the middle finger and the little finger, near the base "
     "of the finger, with its two stones on top of the finger, facing the camera. Both pears lie along the finger, "
     "parallel to it: the larger pear sits on the half of the finger toward the top of the frame, with its point toward "
     "the fingertip, to the left; the smaller pear sits beside it on the half toward the bottom of the frame, with its "
     "point toward the knuckles, to the right. The ring is "
     "small on the finger, as a real ring is: the larger stone is about two thirds as long as the fingernail, the two "
     "stones side by side cover a little more than half the width of the finger, and the slim band is a thin line of "
     "gold around the finger. Only that one ring on the hand, no other jewellery. Daylight from "
     "a window. Colour: the wool is a muted cool charcoal grey and the skin natural, so the gold is the warmest accent in "
     "the image."),
    ("05-metals", "the three metal colours side by side", RING_3, REF_PAIR,
     "The three rings lie almost flat side by side in a row on matte grey limestone, evenly spaced, each with its "
     "opening facing up and its two stones at the front, nearest the camera, their faces turned toward the camera; they "
     "are seen from the front and a little above. In the photograph, on every ring the two pears are seen face-on, side "
     "by side, and their long axes run straight up and down, at right angles to the band: the larger pear on the left "
     "with its point toward the bottom of the frame and the smaller pear on the right with its point toward the top of "
     "the frame. Behind the stones each slim band curves away as a thin oval. Soft daylight from the left; the three "
     "metals keep their true colours. Colour: the limestone is a neutral light grey, so the three golds read as three "
     "clear colours. The three rings are the only objects in the image."),
    ("06-white", "the white gold version", RING_W, REF_PAIR,
     "The ring stands upright on a matte warm terracotta tile, and the camera looks down at it steeply from above and "
     "slightly in front, at about 70 degrees, so the two stones on top face the camera. " + FACE_ON + " From under the "
     "stones the slim band runs out to the left and right and curves down and away below them as a thin ellipse of "
     "polished white gold; the whole ring is in view. " + SLIM + " Daylight from the right. Colour: the terracotta is a "
     "muted warm clay, so the cool white gold reads bright and clean. The ring sits in the centre of the frame. The ring "
     "is the only object in the image."),
    ("07-rose", "the rose gold version", RING_R, REF_TOP,
     "The ring lies almost flat on soft sage green linen, its opening facing up, with its two stones at the front of the "
     "ring, nearest the camera, their faces turned toward the camera, and it is seen from the front and a little above. "
     + FACE_ON + " Behind them the slim band curves away from the camera on both sides and round the back as a thin oval "
     "of polished rose gold; the whole ring is in view. " + SLIM + " A few eucalyptus leaves lie softly out of focus "
     "behind the ring. Daylight from the left. Colour: the sage linen is a muted cool green, so the warm rose gold stands "
     "out softly against it. The ring is the only piece of jewellery in the image."),
    ("08-profile", "from the side: how high the stones sit", RING_Y, REF_SIDE,
     "The ring stands upright on matte charcoal slate and is seen exactly from the side, the camera level with it and "
     "close: the slim band appears as a thin upright line of polished gold, and at the top the larger pear stone is seen "
     "from the side in its low basket, two of its claw prongs visible, sitting about 4 mm above the band, with the "
     "smaller stone just behind it. The basket is low and slim: it rises straight from the band and holds the stones "
     "close to it, not on a tall post. Daylight from the left draws a long soft highlight down the band. Colour: the "
     "charcoal slate is a cool dark grey, so the gold reads warm and bright against it. The ring is the only object in "
     "the image."),
    ("09-scale", "real size between two fingertips", RING_Y, REF_PAIR,
     "Real-size view, seen from above. A woman's hand holds the ring between the tips of the thumb and the index finger, "
     "pinching the band at its left and right sides, so the top of the ring with its two stones faces straight up toward "
     "the camera, which looks down at it. " + FACE_ON + " The fingertips touch only the band, never the stones. The ring "
     "is small next to the fingertips, as a real ring is: the two stones side by side are together about two thirds as "
     "wide as one fingertip, and the slim band is a thin line of gold. Natural skin texture, short natural nails. Behind "
     "the hand, soft blue-grey linen is out of focus. Daylight from a window."),
]

prompts = []
for fid, feature, ring, ref, frame in FRAMES:
    p = " ".join([frame, ring, LIGHT, PHOTO, ref])
    low = p.lower()
    for blk in (ring, LIGHT, PHOTO, ref):
        assert p.count(blk) == 1, (fid, blk[:30])
    # bilinen tuzaklar: başka tasarımın sözcükleri, kalıp çağıran jargon, kardeş listing'ler
    for bad in ("toi et moi", "engagement", "solitaire", "moissanite", "halo", "pave", "pavé", "eternity", "channel",
                "princess", "baguette", "sparkle", "macro", "classic", "same metal", "exact copy", "two tone",
                "two-tone", "nine", "1.25", "carat", " ct", "on its side", "tilted toward each other", "leans in",
                "turned a little", "point toward the camera", "point away from the camera", "level with it, in front"):
        assert bad not in low, (fid, bad)
    assert "exactly two pear cut stones" in low or "exactly two colourless lab-grown pear cut stones" in low, (fid, "iki taş")
    assert "exactly three slim claw prongs" in low, (fid, "üç tırnak")
    assert "point" in low and ("opposite ways" in low or "head to tail" in low), (fid, "zıt yön")
    assert "long axes are parallel" in low and "lengthwise along the band" in low, (fid, "eksenler paralel, banda dik")
    # yön cümlesi pozla birlikte ve fotoğrafın düzleminde (v2): profil dışında her kare uçların kadrajda nereye baktığını
    # söyler; taşlar kameraya yüzü dönük karelerde eksenler "straight up and down".
    if fid != "08-profile":
        assert re.search(r"point toward the (fingertip|bottom of the frame|top of the frame)", low), (fid, "uç yönü")
    if fid in ("01-hero", "03-above", "05-metals", "06-white", "07-rose", "09-scale"):
        assert "seen face-on" in low and "long axes run straight up and down" in low, (fid, "taşlar kameraya yüzü dönük")
    # kiralite referanstaki gibi: bant yatayken büyük taş solda, ucu aşağıda (07 v1 aynasıydı)
    assert "larger pear on the left with its point toward the top of the frame" not in low, (fid, "ayna kiralite")
    if fid == "04-hand":
        assert "toward the top of the frame, with its point toward the fingertip" in low, (fid, "elde kiralite")
    hands = "hand" in frame.lower() and "a woman's hand" in low
    assert hands == (fid in ("04-hand", "09-scale")), (fid, "el yalnız el karelerinde")
    assert "only the window is reflected" in low, (fid, "yansıma cümlesi")
    assert "natural daylight only" in low and "no coloured light patches" in low, fid
    assert "black-and-white" in low and "never from the reference" in low, (fid, "referans rengi alınmaz")
    prompts.append({"id": fid, "feature": feature, "words": len(p.split()), "prompt": p,
                    "md5": hashlib.md5(p.encode()).hexdigest()})

assert len(prompts) == 9 and len({x["prompt"] for x in prompts}) == 9
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")

jobs = json.loads((HERE / "jobs.json").read_text())
# Referans sırası da prompt'tur (second-brain 2026-11-14): prompt'un "the first ... the second ..." tarifi ile gönderilen
# görsellerin sayısı ve sırası birebir aynı olmalı.
REF_ORDER = {REF_PAIR: ["refPair", "refTop"], REF_TOP: ["refTop", "refPair"], REF_FRONT: ["refFront", "refPair"],
             REF_SIDE: ["refSide", "refFront"], REF_HAND: ["refTop"]}
for fid, _f, _r, ref, _fr in FRAMES:
    assert jobs["byFrame"][fid] == REF_ORDER[ref], (fid, "referans sırası prompt'la uyuşmuyor", jobs["byFrame"][fid])
    assert all(k in jobs["references"] for k in jobs["byFrame"][fid]), fid
review = ["# EON-PEAR2 prompt seti v2 (yön düzeltmesi, sahip onayına)", "",
          f"Model `{jobs['model']}`, {jobs['aspect_ratio']}, `{jobs['resolution']}`, count {jobs['count']}; kare başı "
          f"{jobs['costCreditsPerImage']} kredi. 10. kare ölçü kartı yerelde dizilir (kredisiz).", "",
          "v1 (`prompts-v1.json`) ile üretilen 9 karede sahip \"damlaların yönü doğru değil\" dedi: halkanın önden ya da "
          "45°'den göründüğü 01/03/05/06/09'da damlalar bant boyunca, çapraz ya da aynı yöne dönmüştü, 04'te büyük taş "
          "ele bakıyordu. Doğru çıkan 02 ve 07'de taşlar kameraya yüzünü dönmüştü. v2'de her poz taşları kameraya yüzü "
          "dönük gösterir, yön fotoğrafın kendi düzleminde yazılır (büyük taş solda ucu aşağıda, küçük sağda ucu "
          "yukarıda; eksenler paralel ve banda dik). 07 v1 bu düzenin aynasıydı, onun için de yeniden çekim. 02 ve 08 v1 "
          "olarak kalır (metinleri `prompts-v1.json`'da).", ""]
for x in prompts:
    refs = " + ".join(jobs["byFrame"][x["id"]])
    review += [f"## {x['id']}: {x['feature']}", "", f"Referans: {refs} · {x['words']} kelime · md5 `{x['md5'][:8]}`", "",
               x["prompt"], ""]
(HERE / "PROMPTS-REVIEW.md").write_text("\n".join(review))
for x in prompts:
    print(f"== {x['id']} ({x['words']} words, md5 {x['md5'][:8]}): {x['feature']}")
