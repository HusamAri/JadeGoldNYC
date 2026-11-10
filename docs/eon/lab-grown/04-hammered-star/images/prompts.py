"""EON-HS5 (5 mm, dövme yüz, dört yıldız yuvalı round lab-grown, eşit aralıklı) Etsy galerisi: 10 Higgsfield prompt'u.

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

Sahip düzeltmesi (2026-11-10, hero v1'den sonra): "taşlar 4 adet eşit aralıkta konumlanmış olmalı". Tasarım
dört taş, bant çevresinde çeyrek tur (90°) arayla. Hiçbir açıdan dördü birden görünmez: bir görüntü dış yüzün en
çok yarısını gösterir, o yarıda iki yıldız olur. Bu yüzden her kare hangi ikisinin göründüğünü ve öbür ikisinin
nerede kaldığını açıkça söyler ("two of its four stars ..., the other two ... out of sight"). v1'in kusuru benim
cümlemdi: dik duran yüzükte "biri solda biri sağda" geometrik olarak olamaz; model iki yıldızı sol yayda üst üste
koydu. Sol-sağ simetri için yüzük düz yatar (açıklık yukarı), kamera önden bakar.

Paylaşılan bloklar HER karede doğru olmak zorunda (moth "same metal", twig "exact copy" dersleri): her renk
karesi kendi halka bloğunu ve kendi referans cümlesini taşır. Yön sözcüğü yok (VB6 "vertical"); taşların
yeri fiziksel tarifle ("one on each side of the band's front centre"), taş ve yıldız ölçüsü sayıyla ve bant
genişliğine oranla. "macro", "sparkle", "celestial" yok (jargon kompozisyon/efekt çağırır). Eski iki taşlı
ifadeler ("both stars", "the two stars") kapıyla yasak.
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
    "polish. Four small round brilliant lab-grown diamonds, bright and colourless, each about 1.5 mm across, so "
    "each stone's diameter is about one third of the band's width, are set at equal intervals all the way "
    "around the band, a quarter turn apart, each one on the middle line of the band's face. "
    "Each stone sits level with the hammered surface at the centre of an eight-point star engraved into the "
    "metal: four long rays, two running along the band and two running across it, each reaching about 1.8 mm "
    "from the stone's centre, so the rays across the band almost reach the polished rims, and four shorter "
    "rays on the diagonals between them. Each ray is a crisp, narrow V-shaped cut with one bright polished "
    "side and one shaded side. Tiny metal beads at the inner ends of the rays hold each stone. The four stars "
    "are identical."
)
ONLY = (
    "These four are the only stones on the ring: no other diamonds, no pave, no prongs or claws standing above "
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
    "Three identical rings of this one design lie flat side by side in a row, evenly spaced, their openings "
    "facing up. From left to right the metals are 14K yellow gold (warm soft "
    "yellow), 14K white gold (bright cool silver-white) and 14K rose gold (soft warm pink). Each ring is a "
    "flat band 5 mm wide, its whole outer face covered in overlapping round hammer marks about 1.5 mm across, "
    "framed by a narrow polished rim along each edge, with four small round brilliant lab-grown diamonds, "
    "each about 1.5 mm across, about one third of the band's width, set at equal intervals all the way around "
    "the band, a quarter turn apart, each set level with the surface at the centre of an engraved eight-point "
    "star with four long rays and four short ones. Each ring is turned so that two of its four stars face the "
    "camera, one on each side of its front centre; the other two are on its back half, out of sight. Each "
    "ring has only those four stones: no other diamonds, no pave, no prongs, no raised "
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
    "Reference images: both show this ring's design in yellow gold; the first shows the front half of the "
    "band, where two of its four stars sit. Take only the band's shape and surface: the overlapping round "
    "hammer marks with their fine radiating grain, the narrow polished rims and the engraved eight-point stars "
    "with a small round stone at the centre of each; do not take their background, wood or lighting."
)
REF_SERIES = (
    "Reference images: the first two show this ring's design (take only the hammer marks, the polished rims "
    "and the engraved stars with their stones, not their background, lighting or camera angle); the third "
    "is a close crop of this ring's surface, to match its gold colour and hammered texture, not its "
    "composition."
)
REF_GREY = (
    "Reference images: they are black-and-white crops that show this ring's design. Take only its shape: the "
    "hammer marks, the polished rims and the engraved stars with their stones. The metal colour comes "
    "only from the description above, never from the references."
)

SLIM = (
    "The band is slim for its size: its 5 mm width is only about a quarter of the ring's outer diamet"
    "er of about 22 mm."
)

FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", RING_Y, REF_HERO,
     "The ring lies flat on a surface of riven blue-grey slate, its opening facing up, seen from the front and a "
     "little above, so the front half of the band runs across the frame as a wide curve of hammered metal and, "
     "above it, the top rim and the polished inside of the back half are visible; the whole ring is in view, "
     "nothing cut off. Two of the ring's four stars face the camera on that front half: one to the left and one "
     "to the right of its front centre, each an eighth of a turn from it, so in the photo each star sits a "
     "little way in from the left or right end of the band. The other two stars are on the back half of the "
     "band, facing away, out of sight. Daylight comes from a window on the left, so the side of each hammer "
     "mark that faces the window glints and the other side falls into soft shade. The ring sits in the centre "
     "of the frame and fills about half of the frame's width, with generous space all around so that a square "
     "crop keeps the whole ring. Behind it a pale blue-grey plaster wall is softly out of focus. Colour: the "
     "slate and the wall are muted cool blue-grey, so the warm yellow gold is the only warm, saturated colour in "
     "the image. The ring is the only object in the image."),
    ("02-star", "one star-set stone and the hammer marks around it, up close", RING_Y, REF_SERIES,
     "Close-up of one of the four stars. The camera faces it straight on from a few centimetres away; the band "
     "runs across the whole frame from left to right, with a polished rim along its top edge and one along its "
     "bottom edge. The small round stone sits in the middle of the frame at the centre of its eight-point star, "
     "its top level with the gold, held by its tiny beads, and the star's rays are crisp bright cuts. The next "
     "stars are a quarter turn away round the band, outside the frame, so this is the only star in the image. "
     "Low daylight from a window to one side rakes across the band, so every hammer mark shows its relief: a "
     "bright edge on one side, a soft shadow on the other and the fine radiating grain inside it. Depth of "
     "field softens the band toward the left and right edges of the frame; behind it, blue-grey slate is out "
     "of focus."),
    # v4 (2026-11-10): lying flat, v1 (~20 deg) and v2 (~30 deg) came back as front views like the hero; v3
    # without the whole-ring reference lost the design (wide channel band, extra stones). The pose changes to
    # the ring standing on its edge, which this model draws well, and the full references come back.
    ("03-flat", "1.5 mm wall, 5 mm width and the polished rim", RING_Y, REF_SERIES,
     "The ring stands upright on its edge on folded indigo-dyed linen, turned three-quarters to the camera and "
     "seen from a little above: on the left the band's hammered outer face curves toward the camera, and on the "
     "right the opening shows the polished inner surface. The front rim facing the camera shows the solid "
     "1.5 mm wall as a smooth, polished edge all the way round the opening. " + SLIM + " Two of the four stars "
     "are on the visible outer face, a quarter of the way round the ring from each other, so they are far "
     "apart: one near the top of that side and one near the bottom of it; the other two are on the far side of "
     "the band, out of sight. The inner surface is mirror-smooth high polish and reflects soft daylight. "
     "Colour: the linen is a deep, muted indigo with a soft visible weave, so the warm gold stands out against "
     "it."),
    ("04-hand-m", "how the 5 mm band looks on a man's hand", RING_Y, REF_SERIES,
     "A man's hand rests palm-down on faded, washed blue denim, seen from slightly above, fingers relaxed and "
     "slightly apart. The ring is worn on the ring finger, the fourth finger, between the middle finger and "
     "the little finger, near the base of the finger, turned so that two of its four stars sit on top of the "
     "finger facing the camera, one on each side of the finger's centre line; the other two are on the "
     "underside of the finger, toward the palm, out of sight. It is the only ring; the other fingers and the "
     "wrist are bare, no watch and no bracelet. The band is slim on the finger: its 5 mm width along the finger "
     "is only about a quarter of the finger's width, with plenty of bare skin on both sides of it along the "
     "finger, never a wide band. Natural skin texture, short clean unpolished nails. Colour: the denim is a soft washed "
     "blue and the skin natural, so the gold is the warmest accent in the image."),
    ("05-inside", "smooth polished interior, plain inside", RING_Y, REF_SERIES,
     "Inside view: the ring stands upright on blue-grey slate, turned so that the camera looks into the "
     "opening from above and to the front. The polished inner surface is the focus, curving smoothly all the "
     "way round and reflecting soft daylight in long clean bands; the inside is plain and smooth, with nothing "
     "engraved. The band is slim: from its front rim to its back rim it is only about a quarter of the ring's "
     "outer diameter, so the opening reads as a large clear circle framed by a narrow band, never as a deep "
     "tube. On the band's outer face, two of the four stars show along the top, one on each side of its "
     "highest point, the stones level with the hammered surface, nothing rising above the gold; the other two "
     "are on the lower half of the band, out of view."),
    ("06-white", "the white gold version, against warm stone", RING_W, REF_GREY,
     "Low side view along the band. The ring lies flat on a slab of warm sandstone with a soft terracotta "
     "tone, its opening facing up. The camera is at table level, close to the ring and off to one side of it, "
     "so the band's hammered outer face runs from the near edge of the frame diagonally away from the lens, "
     "curving toward the back. " + SLIM + " Two of the four stars are on this visible side of the band, a quarter turn "
     "apart: one on the far part of the curve, in sharp focus, and one on the near part, softly out of focus; "
     "the stones sit level with the surface. The other two are on the hidden side of the band, out of sight. "
     "Daylight grazes across the band from one side, so the hammer marks "
     "show their relief and the star rays draw fine bright lines. Colour: the sandstone and the softly blurred "
     "background are warm, muted terracotta and sand, so the cool white gold reads crisp and bright against "
     "them."),
    ("07-metals", "the three metal colours side by side", RING_3, REF_GREY,
     "The three rings lie on a smooth, matte slab of mid-grey limestone, seen from the front and a little "
     "above. Each band is slim: its 5 mm width is only about a quarter of its ring's outer diameter. Together "
     "they fill the width of the frame, with space around them. Behind them a plain light-grey "
     "wall is softly out of focus. Colour: the limestone is a neutral mid-grey, neither warm nor cool, so each "
     "metal shows its own true colour and none is favoured."),
    ("08-scale", "real size against a man's fingertips", RING_Y, REF_SERIES,
     "Real-size view. A man's hand is seen from the side, close to the camera, holding the ring upright "
     "between the very tips of the thumb and the index finger, turned so that the band's hammered outer face "
     "faces the lens with two of its four stars on it, a quarter turn apart; the other two are on the far "
     "side, out of sight. The ring is small, as a real ring is: its outer diameter of about 22 mm is only about "
     "one and a third times the thickness of the thumb's tip as seen from this side, so the two fingertips are "
     "only a short gap apart, and that gap is the ring's height. The hammered strip facing the lens is the "
     "band's 5 mm width: about a quarter of the ring's height, so four such strips side by side would just "
     "span the ring from top to bottom. The ring reads as a slim ring between large fingertips, never as a wide "
     "tube. Fingers relaxed, natural skin, short clean nails. "
     "Behind, a pale blue-grey wall is out of focus."),
    ("09-rose", "the rose gold version, against sage green", RING_R, REF_GREY,
     "The ring lies flat on sage-green linen, its opening facing up, seen straight from the front at the height "
     "of the table, so the front half of the band faces the camera as a curved hammered strip and the opening "
     "is hidden behind it. The strip is slim: about four times as long as it is tall, since the band is 5 mm "
     "wide and the ring about 22 mm across. Two of the four stars sit on that strip, one on each side of its middle, each an "
     "eighth of a turn from it; the other two are on the back half, out of sight. A few eucalyptus leaves lie "
     "softly out of focus behind the ring. Daylight comes from a window on the right. Colour: the sage green "
     "is the complementary colour of the rose gold's soft pink, kept muted, so the rose gold looks warm and "
     "rich against it. The ring is the only piece of jewellery in the image."),
    ("10-dish", "at home: where it rests at night", RING_Y, REF_SERIES,
     "The ring rests in a small, shallow, handmade ceramic dish with a deep cobalt-blue glaze, on a pale oak "
     "bedside table by the window, seen from above at about 45 degrees. The ring lies flat in the dish, its "
     "opening facing up, turned so that two of its four stars face the camera, one on each side of the point "
     "nearest the camera; the other two are on the far side of the band, out of sight. Folded undyed linen and "
     "the window frame behind are out of focus. Colour: the cobalt glaze is the complementary colour of the "
     "warm gold, so the ring is the clear, warm, sharp subject."),
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
    # tasarım pinleri: dört taş eşit aralıklı, yıldız, ölçü oranla, dövme izi, kenar (sahip 2026-11-10)
    assert "four small round brilliant lab-grown diamonds" in low and "about 1.5 mm across" in low, fid
    assert "one third of the band's width" in low and "eight-point star" in low, fid
    assert "at equal intervals all the way around the band, a quarter turn apart" in low, fid
    assert "hammer marks" in low and "polished rim" in low, fid
    assert ("these four are the only stones" in low) or ("only those four stones" in low), fid
    # iki taşlı eski dil yasak; her kare dört yıldızdan hangisinin göründüğünü söyler
    for bad in (r"\bboth (of its )?stars\b", r"\bthe two stars\b", r"\btwo (small )?(round )?stones\b",
                r"\bthese two\b", r"a little less than a quarter"):
        assert not re.search(bad, low), (fid, bad)
    scene = (p if fid == "07-metals" else frame).lower()  # 07'de yerleşim RING_3 bloğunda
    assert re.search(r"\b(two|one) of (the|its|the ring's) four stars\b", scene), (fid, "görünen yıldızlar söylenmeli")
    if fid != "02-star":
        assert "out of sight" in scene or "out of view" in scene, (fid, "öbür ikisi nerede")
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
