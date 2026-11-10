"""EON-HS5 (5 mm, dövme yüz, iki yıldız yuvalı round lab-grown) Etsy galerisi: 10 Higgsfield prompt'u.

Run: python3 -I docs/eon/lab-grown/04-hammered-star/images/prompts.py   -> prompts.json

Sahibin brief'i (2026-11-10): "görsellerde doğal ışık ve metal dokularını koruyarak görseller üret. daha doğal
ve renk tonlarını color theory'e göre ürünü ortaya çıkaracak şekilde kur."
Bu yüzden FR6'nın amber + teal renkli ışık lekeleri BIRAKILDI (renkli ışık doğal değil):
- IŞIK: yalnız tek pencereden gün ışığı, nötr renk, gerçek yumuşak gölge; doku karelerinde alçak, yalayan ışık.
- DOKU: dövme izleri tek tek okunur (her iz kendi parlak kenarı ve gölgesiyle, içinde merkezden yayılan ince
  saten çizgi); yıldız ışınları keskin V kesim; plastik/CGI pürüzsüzlüğü yok.
- RENK KURAMI: ürünün metali sahnedeki tek doygun, sıcak (ya da serin) öğe; zemin onun TAMAMLAYICI rengi,
  düşük doygunlukta (60 zemin / 30 doğal nötr / 10 metal):
    sarı altın (sıcak sarı-turuncu, ~45°) → mavi-gri arduvaz, çivit keten, yıkanmış denim, kobalt sır (~225°);
    beyaz altın (serin nötr) → sıcak kumtaşı / terrakota (sıcaklık karşıtlığı);
    rose altın (pembe-bakır, ~15-20°) → adaçayı yeşili, okaliptüs (~150-170°);
    üç metal birlikte → nötr orta gri kireçtaşı (hiçbir metali kayırmaz).

Tasarım referansı: sahibin Etsy linki 4581494716 (BRIARLORE), ref01'den iki sıkı kırpım (önden bütün halka +
tek yıldız yakını); filigran kırpımın dışında bırakıldı, sahne (ahşap, bokeh) alınmaz. Renk değişen karelerde
(06 beyaz, 07 üç metal, 09 rose) referans kırpımlar SİYAH-BEYAZ verilir: referans rengi de taşır (Comet Tail
2026-09-27: sarı referans beyaz karede boncukları sarı yaptı); şekil gider, renk gitmez. Model ve
parametreler jobs.json'da.

Paylaşılan bloklar HER karede doğru olmak zorunda (moth "same metal", twig "exact copy" dersleri): her renk
karesi kendi halka bloğunu ve kendi referans cümlesini taşır. Yön sözcüğü yok (VB6 "vertical"); taşların
yeri fiziksel tarifle ("one on each side of the band's front centre"), taş ve yıldız ölçüsü sayıyla ve bant
genişliğine oranla. "macro", "sparkle", "celestial" yok (jargon kompozisyon/efekt çağırır).
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

DESIGN = (
    "5 mm wide and 1.5 mm thick, with a flat outer face. The whole outer face, edge to edge and all the way "
    "round, is covered in overlapping round hammer marks: each is a shallow round dimple about 1.5 mm across, "
    "so about three of them span the band's width, and inside each one a very fine satin grain radiates out "
    "from its centre, so every mark catches the light a little differently. Along both edges of the band a "
    "narrow polished rim, about 0.4 mm wide, frames the hammered face. The inside of the band is smooth high "
    "polish. Two small round brilliant lab-grown diamonds, bright and colourless, each about 1.5 mm across, so "
    "each stone's diameter is about one third of the band's width, sit on the front of the band, one on each "
    "side of the band's front centre, a little less than a quarter of the way around the ring from each other. "
    "Each stone sits level with the hammered surface at the centre of an eight-point star engraved into the "
    "metal: four long rays, two running along the band and two running across it, each reaching about 1.8 mm "
    "from the stone's centre, so the rays across the band almost reach the polished rims, and four shorter "
    "rays on the diagonals between them. Each ray is a crisp, narrow V-shaped cut with one bright polished "
    "side and one shaded side. Tiny metal beads at the inner ends of the rays hold each stone."
)
ONLY = (
    "These two are the only stones on the ring: no other diamonds, no pave, no prongs or claws standing above "
    "the surface, no raised bezel, no milgrain, no other engraving, no hallmark, no text."
)
RING_Y = "The ring: a solid 14K yellow gold band, " + DESIGN + " " + ONLY
RING_W = ("The ring: a solid 14K white gold band, bright cool silver-white all over, " + DESIGN + " " + ONLY
          + " The metal is white gold everywhere, rims, rays and beads included: bright, cool and silver-white, "
          "with no yellow tint.")
RING_R = ("The ring: a solid 14K rose gold band, soft warm pink all over, " + DESIGN + " " + ONLY
          + " The metal is rose gold everywhere, rims, rays and beads included: soft warm pink, with no yellow "
          "or white tint.")
RING_3 = (
    "Three identical rings of this one design stand upright side by side in a row, evenly spaced, each with "
    "both of its stars facing the camera. From left to right the metals are 14K yellow gold (warm soft "
    "yellow), 14K white gold (bright cool silver-white) and 14K rose gold (soft warm pink). Each ring is a "
    "flat band 5 mm wide, its whole outer face covered in overlapping round hammer marks about 1.5 mm across, "
    "framed by a narrow polished rim along each edge, with two small round brilliant lab-grown diamonds, each "
    "about 1.5 mm across, about one third of the band's width, one on each side of the band's front centre, "
    "each set level with the surface at the centre of an engraved eight-point star with four long rays and "
    "four short ones. Each ring has only those two stones: no other diamonds, no pave, no prongs, no raised "
    "bezel, no other engraving, no text."
)
LIGHT = (
    "Light: natural daylight only, from one large window to one side, soft and slightly directional, in true "
    "neutral colour, with no coloured tint, no coloured light patches and no studio-flash look. Real soft "
    "shadows fall away from the window. The metal keeps its true natural colour and real reflections: the "
    "hammer marks read as a field of small bright and dark facets, each one crisp, with highlights but none "
    "blown out, no mirror-chrome look and no glow. Real metal, never smooth plastic or a computer render."
)
PHOTO = (
    "Photorealistic product photograph, natural colour, sharp focus on the jewellery, gentle shallow depth "
    "of field. No text, no logo, no watermark, no packaging."
)
REF_HERO = (
    "Reference images: both show this ring's design in yellow gold. Take only the band's shape and surface: "
    "the overlapping round hammer marks with their fine radiating grain, the narrow polished rims and the two "
    "engraved eight-point stars with a small round stone at the centre of each; do not take their background, "
    "wood, lighting or camera angle."
)
REF_SERIES = (
    "Reference images: the first two show this ring's design (take only the hammer marks, the polished rims "
    "and the two engraved stars with their stones, not their background, lighting or camera angle); the third "
    "is a close crop of this ring's surface, to match its gold colour and hammered texture, not its "
    "composition."
)
REF_GREY = (
    "Reference images: they are black-and-white crops that show this ring's design. Take only its shape: the "
    "hammer marks, the polished rims and the two engraved stars with their stones. The metal colour comes "
    "only from the description above, never from the references."
)

FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", RING_Y, REF_HERO,
     "The ring stands upright on a surface of riven blue-grey slate, seen from a three-quarter front angle a "
     "little above it. Both stars face the camera on the front of the band, one to the left and one to the "
     "right of its front centre; the full circle of the band is visible, nothing cut off. Daylight comes from "
     "a window on the left, so the side of each hammer mark that faces the window glints and the other side "
     "falls into soft shade. The ring sits in the centre of the frame and fills a little more than half of "
     "the frame's height, with generous space on the left and right so that a square crop keeps the whole "
     "ring. Behind it a pale blue-grey plaster wall is softly out of focus. Colour: the slate and the wall are "
     "muted cool blue-grey, so the warm yellow gold is the only warm, saturated colour in the image. The ring "
     "is the only object in the image."),
    ("02-star", "one star-set stone and the hammer marks around it, up close", RING_Y, REF_SERIES,
     "Close-up of one of the two stars on the front of the band. The camera faces it straight on from a few "
     "centimetres away; the band runs across the whole frame from left to right, with a polished rim along "
     "its top edge and one along its bottom edge. The small round stone sits in the middle of the frame at "
     "the centre of its eight-point star, its top level with the gold, held by its tiny beads, and the star's "
     "rays are crisp bright cuts. Low daylight from a window to one side rakes across the band, so every "
     "hammer mark shows its relief: a bright edge on one side, a soft shadow on the other and the fine "
     "radiating grain inside it. Depth of field softens the band toward the left and right edges of the "
     "frame; behind it, blue-grey slate is out of focus."),
    ("03-flat", "1.5 mm wall, 5 mm width and the polished rim", RING_Y, REF_SERIES,
     "The ring lies flat like a coin on folded indigo-dyed linen, its opening facing up, seen from above at a "
     "high three-quarter angle. The top rim of the band reads as an even, continuous gold circle all the way "
     "round, showing the solid 1.5 mm wall and the narrow polished rim; the 5 mm hammered face shows around "
     "the front, with both stars at the front of the circle, nearest the camera. Inside the circle the "
     "polished inner surface reflects soft daylight. Colour: the linen is a deep, muted indigo with a soft "
     "visible weave, so the warm gold stands out against it."),
    ("04-hand-m", "how the 5 mm band looks on a man's hand", RING_Y, REF_SERIES,
     "A man's hand rests palm-down on faded, washed blue denim, seen from slightly above, fingers relaxed and "
     "slightly apart. The ring is worn on the ring finger, the fourth finger, between the middle finger and "
     "the little finger, near the base of the finger, with both stars on top of the finger facing the camera. "
     "It is the only ring; the other fingers and the wrist are bare, no watch and no bracelet. The 5 mm band "
     "reads as a medium-width band, a little narrower than a pencil. Natural skin texture, short clean "
     "unpolished nails. Colour: the denim is a soft washed blue and the skin natural, so the gold is the "
     "warmest accent in the image."),
    ("05-inside", "smooth polished interior, plain inside", RING_Y, REF_SERIES,
     "Inside view: the ring stands upright on blue-grey slate, turned so that the camera looks into the "
     "opening from slightly above and to the front. The polished inner surface is the focus, curving smoothly "
     "all the way round and reflecting soft daylight in long clean bands; the inside is plain and smooth, with "
     "nothing engraved. The two stars sit at the top of the band's outer face, the stones level with the "
     "hammered surface, nothing rising above the gold."),
    ("06-white", "the white gold version, against warm stone", RING_W, REF_GREY,
     "Low side view along the band. The ring lies flat on a slab of warm sandstone with a soft terracotta "
     "tone, its opening facing up. The camera is at table level, close to the ring and off to one side of it, "
     "so the band's hammered outer face runs from the near edge of the frame diagonally away from the lens, "
     "curving toward the back; the two stars sit on the far part of that curve, in sharp focus, the stones "
     "level with the surface. The near part of the band is softly out of focus. Daylight grazes across the "
     "band from one side, so the hammer marks show their relief and the star rays draw fine bright lines. "
     "Colour: the sandstone and the softly blurred background are warm, muted terracotta and sand, so the "
     "cool white gold reads crisp and bright against them."),
    ("07-metals", "the three metal colours side by side", RING_3, REF_GREY,
     "The three rings stand on a smooth, matte slab of mid-grey limestone, seen from the front and a little "
     "above; together they fill the width of the frame, with space around them. Behind them a plain light-grey "
     "wall is softly out of focus. Colour: the limestone is a neutral mid-grey, neither warm nor cool, so each "
     "metal shows its own true colour and none is favoured."),
    ("08-scale", "real size against a man's fingertips", RING_Y, REF_SERIES,
     "Real-size view. A man's hand is seen from the side, close to the camera, holding the ring upright "
     "between the very tips of the thumb and the index finger, both stars facing the lens. The ring is small, "
     "as a real ring is: its outer diameter of about 22 mm is about the same as the width of the man's thumb, "
     "and the gap between the two fingertips is only the ring's height. The band's 5 mm width is a little "
     "under a quarter of the ring's height, so the ring reads as a slim ring between large fingertips, never "
     "as a wide tube. Fingers relaxed, natural skin, short clean nails. Behind, a pale blue-grey wall is out "
     "of focus."),
    ("09-rose", "the rose gold version, against sage green", RING_R, REF_GREY,
     "The ring stands upright on sage-green linen, seen straight from the front at the height of the table, "
     "so the front of the band, with both stars, faces the camera as a curved hammered strip and the opening "
     "is hidden behind it. A few eucalyptus leaves lie softly out of focus behind the ring. Daylight comes "
     "from a window on the right. Colour: the sage green is the complementary colour of the rose gold's soft "
     "pink, kept muted, so the rose gold looks warm and rich against it. The ring is the only piece of "
     "jewellery in the image."),
    ("10-dish", "at home: where it rests at night", RING_Y, REF_SERIES,
     "The ring rests in a small, shallow, handmade ceramic dish with a deep cobalt-blue glaze, on a pale oak "
     "bedside table by the window, seen from above at about 45 degrees. The ring lies flat in the dish, its "
     "opening facing up, turned so that both stars face the camera. Folded undyed linen and the window frame "
     "behind are out of focus. Colour: the cobalt glaze is the complementary colour of the warm gold, so the "
     "ring is the clear, warm, sharp subject."),
]

prompts = []
for fid, feature, ring, ref, frame in FRAMES:
    p = " ".join([frame, ring, LIGHT, PHOTO, ref])
    low = p.lower()
    # paylaşılan bloklar birebir ve bir kez
    for blk in (LIGHT, PHOTO):
        assert p.count(blk) == 1, (fid, blk[:30])
    counts = tuple(p.count(b) for b in (RING_Y, RING_W, RING_R, RING_3))
    want = {"06-white": (0, 1, 0, 0), "07-metals": (0, 0, 0, 1), "09-rose": (0, 0, 1, 0)}.get(fid, (1, 0, 0, 0))
    assert counts == want, (fid, counts)
    assert (ref is REF_HERO) == (fid == "01-hero"), fid
    assert (ref is REF_GREY) == (fid in ("06-white", "07-metals", "09-rose")), (fid, "renk karesi siyah-beyaz referans")
    # bilinen tuzaklar (VB6, FR6 + bu brief: renkli ışık, jargon, efekt)
    for bad in ("classic", "same metal", "exact copy", "solitaire", "macro", "sparkle", "celestial", "moissanite",
                "starburst", "vertical", "halo", "engagement", "pavé", "baguette", "groove", "bevel", "brushed",
                "amber", "teal", "travertine", "in one colour", "stone surface", "on the stone "):
        assert bad not in low, (fid, bad)
    assert all(m.group(0) == "no pave" for m in re.finditer(r"\w+ pave", low)), fid
    assert all(m.group(0) == "raised bezel" for m in re.finditer(r"\w+ bezel", low)), fid
    # tasarım pinleri: iki taş, yıldız, ölçü oranla, dövme izi, kenar
    assert "two small round brilliant lab-grown diamonds" in low and "about 1.5 mm across" in low, fid
    assert "one third of the band's width" in low and "eight-point star" in low, fid
    assert "hammer marks" in low and "polished rim" in low and "one on each side of the band's front centre" in low, fid
    assert ("5 mm wide and 1.5 mm thick" in low) or fid == "07-metals", fid
    # doğal ışık: renkli ışık yok, pencere ışığı var
    assert "natural daylight only" in low and "no coloured light patches" in low, fid
    # renk kuramı: metalin tamamlayıcısı
    pal = {"06-white": ("terracotta",), "07-metals": ("mid-grey limestone",), "09-rose": ("sage",)}.get(
        fid, ("blue", "slate", "indigo", "denim", "cobalt"))
    assert any(w in low for w in pal), (fid, "renk kuramı zemini yok")
    if fid in ("06-white", "09-rose"):
        assert "yellow gold" not in low, (fid, "renk karesinde sarı altın yazmaz")
    if fid == "07-metals":
        assert all(c in low for c in ("14k yellow gold", "14k white gold", "14k rose gold")), fid
    hands = bool(re.search(r"\bhands?\b", low))
    assert hands == (fid in ("04-hand-m", "08-scale")), (fid, "el yalnız el karelerinde")
    if fid == "04-hand-m":
        assert "fourth finger, between the middle finger and the little finger" in p, fid
    prompts.append({"id": fid, "feature": feature, "prompt": p, "words": len(p.split())})

assert len(prompts) == 10 and len({x["prompt"] for x in prompts}) == 10
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")
for x in prompts:
    print(f"== {x['id']} ({x['words']} words): {x['feature']}\n{x['prompt']}\n")
