"""EON-FR6 (6 mm, fırçalanmış, faset kenar, merkez dışı kanal, flush round, lab-grown) Etsy galerisi:
10 Higgsfield prompt'u.

Run: python3 -I docs/eon/lab-grown/03-flush-round/images/prompts.py   -> prompts.json

Şablon: 02-vertical-baguette/images/prompts.py (sahibin 2026-11-07 brief'i: her kare farklı açı + alıcıya
farklı bir özellik; aynı renk tonları; doğal metal yüzeyleri; "natural home studio with colored light
reflections and controlled metal reflections"; amber + teal, onaylı). Laboratuvar hattı aynı sahne
paletini taşır; ürün ve kadrajlar bu tasarımın özelliklerine göre.

Tasarım referansı: sahibin Etsy linki 4512052520 (AarsanJewels), ref06'dan iki sıkı kırpım
(bütün halka + taş/kanal yakını); "Aarsan" filigranı morfolojik kapamayla silindi, sahne dışarıda.
Model/parametreler jobs.json'da.

Paylaşılan bloklar HER karede doğru olmak zorunda (moth "same metal", twig "exact copy" dersleri):
renk karesi (07) kendi halka bloğunu ve kendi referans cümlesini taşır. Yön sözcüğü yok (VB6 hero v1:
"vertical" resim düzleminde okundu); kanalın konumu fiziksel tarifle ("parallel to its edges, a little
off centre"), taş ölçüsü sayıyla ve bant genişliğine oranla.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

RING_Y = (
    "The ring: a solid 14K yellow gold band, 6 mm wide and 1.5 mm thick, with a flat outer face. Along "
    "each edge of the band the outer corner is cut away at an angle into a narrow, high-polish bevel "
    "about 0.7 mm wide, so a thin bright line frames the face along both edges, all the way round. "
    "Between the two bevels the face has a fine, even brushed satin finish, its soft grain running around "
    "the band. One thin, high-polish groove, a fine bright line about 0.3 mm wide, runs all the way around "
    "the band parallel to its edges, a little off centre: the brushed strip on one side of it is about one "
    "and a half times as wide as the strip on the other side. The inside of the band is smooth high "
    "polish. One single round brilliant lab-grown diamond, bright and colourless, about 2 mm across, so "
    "its diameter is about one third of the band's width. It sits directly on the groove, centred on it, "
    "and the groove runs into its rim from both sides. It is set flush: its top is level with the brushed "
    "face, held by a fine polished gold rim cut into the band, with no claws. It is the only stone on the "
    "ring: no other diamonds, no pave, no prongs, no claws, no raised bezel or collet standing above the "
    "surface, no engraving, no hallmark, no text."
)
RING_3 = (
    "Three identical rings of this one design stand upright side by side in a row, evenly spaced, each "
    "with its round stone facing the camera. From left to right the metals are 14K yellow gold (warm soft "
    "yellow), 14K white gold (bright cool silver-white) and 14K rose gold (soft warm pink). All three have "
    "the same 6 mm flat band with a brushed satin face framed by a narrow high-polish bevel along each "
    "edge, the same thin polished groove running round parallel to the edges a little off centre, and the "
    "same single round brilliant lab-grown diamond, about 2 mm across, about one third of the band's "
    "width, set flush on the groove in a fine polished rim, with no claws. Each ring has only that one "
    "stone: no other diamonds, no pave, no prongs, no raised bezel or collet, no engraving, no text."
)
SCENE = (
    "Setting: a natural home studio in soft late-afternoon daylight from a large window, with a warm "
    "ivory lime-plaster wall, pale travertine and light oak surfaces, and undyed natural linen. Gentle "
    "patches of coloured light fall across the surfaces nearby, honey amber and soft teal, "
    "cast by sunlight through coloured glass outside the frame. Controlled metal reflections: the metal "
    "shows broad, soft reflections with no blown-out highlights, no hard white streaks and no "
    "mirror-chrome look, and it keeps its true natural colour, never orange or over-saturated. A diamond "
    "in view may catch a small flash of the amber or teal light."
)
PHOTO = (
    "Photorealistic product photograph, natural colour, sharp focus on the jewellery, gentle shallow depth "
    "of field. No text, no logo, no watermark, no packaging."
)
REF_HERO = (
    "Reference images: both show this ring's design. Take only the band's shape: its brushed face, the "
    "narrow polished bevels along both edges, the thin off-centre groove and the small round stone set "
    "flush on it; do not take their background, lighting, reflection colours or camera angle."
)
REF_SERIES = (
    "Reference images: the first two show this ring's design (take only the band's brushed face, the "
    "polished bevels, the off-centre groove and the flush-set round stone, not their background, lighting "
    "or camera angle); the third is a close crop of this ring's surface, to match its gold colour and "
    "brushed texture, not its composition."
)
REF_COLOURS = (
    "Reference images: they show this ring's design in yellow gold. Take only the band's brushed face, the "
    "polished bevels, the off-centre groove and the flush-set round stone; the metal colours of the three "
    "rings are exactly as described above, not taken from the references."
)

FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", RING_Y, REF_HERO,
     "The ring stands upright on the pale travertine surface, seen from a three-quarter front angle a "
     "little above it. The round stone faces the camera on the part of the band nearest the lens, sitting "
     "on the thin bright groove; the bright bevels outline both edges of the band, and the full circle of "
     "the band is visible, nothing cut off. The ring sits in the centre of the frame and fills a little "
     "more than half of the frame's height, with generous space on the left and right so that a square "
     "crop keeps the whole ring. A soft amber patch of light lies on the plaster wall behind it and a "
     "faint teal patch on the travertine to one side. The ring is the only object in the image."),
    ("02-stone", "flush-set round stone on the groove, bevels framing the face", RING_Y, REF_SERIES,
     "Close-up of the front of the band. The camera faces the stone straight on from a few centimetres "
     "away; the band runs horizontally across the whole frame, with one bright polished bevel along its "
     "top edge and one along its bottom edge. The thin polished groove runs straight across the frame, a "
     "little off the band's centre line, and the small round stone sits on it in the middle of the frame, "
     "its top exactly level with the brushed gold, ringed by a fine polished rim. The brushed grain around "
     "it is crisp. Depth of field softens the band toward the left and right edges of the frame; behind "
     "the band the oak surface and an amber patch of light are out of focus."),
    ("03-flat", "1.5 mm wall, 6 mm width and the beveled edge", RING_Y, REF_SERIES,
     "The ring lies flat on the light oak surface like a coin, its opening facing up, seen from above at "
     "a high three-quarter angle. The top rim of the band reads as an even, continuous gold circle all the "
     "way round, showing the solid 1.5 mm wall, with the narrow polished bevel catching the light along its "
     "outer corner; the 6 mm brushed outer face shows around the front, with the thin groove and the round "
     "stone at the front of the circle, nearest the camera. Inside the circle, the polished inner surface "
     "reflects soft daylight. A teal light patch falls across the oak beside the ring."),
    ("04-hand-m", "how the 6 mm band looks on a man's hand", RING_Y, REF_SERIES,
     "A man's hand rests palm-down on undyed linen, seen from slightly above, fingers relaxed and "
     "slightly apart. The ring is worn on the ring finger, the fourth finger, between the middle finger "
     "and the little finger, near the base of the finger, with the round stone on top facing the camera. "
     "It is the only ring; the other fingers and the wrist are bare, no watch and no bracelet. The 6 mm "
     "band reads as a substantial band, about as wide as a pencil. Natural skin texture, short clean "
     "unpolished nails. A soft amber patch of light lies across the back of the hand."),
    ("05-inside", "smooth polished interior, plain inside", RING_Y, REF_SERIES,
     "Inside view: the ring stands upright on the travertine, turned so that the camera looks into the "
     "opening from slightly above and to the front. The polished inner surface is the focus, curving "
     "smoothly all the way round and reflecting soft daylight in long clean bands; the inside is plain "
     "and smooth, with nothing engraved. The round stone sits at the top of the band, its top level with "
     "the band's outer curve, nothing rising above the gold."),
    ("06-hand-w", "how it looks on a woman's hand, everyday", RING_Y, REF_SERIES,
     "A woman's hand rests flat on the travertine next to a handmade matte ceramic cup; the hand does not "
     "hold the cup. The ring is worn on the ring finger, the fourth finger, between the middle finger and "
     "the little finger, with the round stone on top facing the camera. It is the only ring and the only "
     "jewellery in the image. Natural skin, short natural nails. The 6 mm band sits clearly on the "
     "slimmer finger. Patches of amber and teal light fall across the travertine and the cup."),
    ("07-metals", "the three metal colours side by side", RING_3, REF_COLOURS,
     "The three rings stand on the pale travertine, seen from the front and a little above; together "
     "they fill the width of the frame, with space around them. A soft amber patch of light lies on the "
     "plaster wall behind them and a faint teal patch on the travertine in front."),
    # v4 (2026-11-08): v1 drew the ring 1.6x the thumb's width and the band 0.46 of its height; edits from v1
    # fixed the band (v2) but could not shrink the ring, because in a pinch the fingertip gap IS the ring's
    # diameter. v4 pins the gap and the thumb width instead of "fingertip size".
    ("08-scale", "real size against a man's fingertips", RING_Y, REF_SERIES,
     "Real-size view. A man's hand is seen from the side, close to the camera, holding the ring upright "
     "between the very tips of the thumb and the index finger, the round stone facing the lens. The ring is "
     "small, as a real ring is: its outer diameter of about 22 mm is about the same as the width of the "
     "man's thumb, and the gap between the two fingertips is only the ring's height. The band's 6 mm width "
     "is about a quarter of the ring's height, so the ring reads as a slim ring between large fingertips, "
     "never as a wide tube. Fingers relaxed, natural skin, short clean nails. Behind, the ivory plaster "
     "wall with a soft amber patch of light is out of focus."),
    # v2 (2026-11-08): v1 came out as a straight-on front view, a near-copy of 02's composition in the set
    # sheet; v2 puts the camera off to one side so the band runs diagonally away from the lens.
    ("09-light", "flush, low profile and the bevel's light, in a grazing side view", RING_Y, REF_HERO,
     "Low side view along the band. The ring lies flat on the travertine, its opening facing up. The camera "
     "is at table level, close to the ring and off to one side of it, so the band's brushed outer face runs "
     "from the near edge of the frame diagonally away from the lens, curving toward the back; the round "
     "stone sits on the far part of that curve, in sharp focus, level with the gold, no edge of the stone "
     "standing above it. The near part of the band is softly out of focus. A narrow beam of late sunlight "
     "grazes across the band from one side: the polished bevel and the thin groove draw two fine bright "
     "lines that run along the curve to the stone, the stone throws a crisp white flash with one small "
     "spark of teal, and the brushed grain glows softly without glare. The far side of the ring and the "
     "background fall into warm amber shade."),
    ("10-dish", "at home: where it rests at night", RING_Y, REF_SERIES,
     "The ring rests in a small, shallow, handmade ceramic dish with a matte off-white glaze, on a light "
     "oak bedside table by the window, seen from above at about 45 degrees. The ring lies flat in the "
     "dish, its opening facing up, turned so that the round stone faces the camera. A soft teal and amber "
     "patch of light crosses the dish; folded linen and the plaster wall behind are out of focus. The ring "
     "is the clear, sharp subject."),
]

prompts = []
for fid, feature, ring, ref, frame in FRAMES:
    p = " ".join([frame, ring, SCENE, PHOTO, ref])
    # paylaşılan bloklar birebir ve bir kez
    for blk in (SCENE, PHOTO):
        assert p.count(blk) == 1, (fid, blk[:30])
    assert (p.count(RING_Y), p.count(RING_3)) == ((0, 1) if fid == "07-metals" else (1, 0)), fid
    assert (ref is REF_HERO) == (fid in ("01-hero", "09-light")) and (ref is REF_COLOURS) == (fid == "07-metals"), fid
    # bilinen tuzaklar (VB6 + bu tasarım)
    low = p.lower()
    for bad in ("classic", "same metal", "exact copy", "solitaire", "sparkle shape", "macro",
                "stone surface", "travertine stone", "on the stone ", "near the ring", "baguette",
                "vertical", "halo", "engagement", "pavé"):
        assert bad not in low, (fid, bad)
    assert not re.search(r"(?<!off-)\bcent(re|er)(ed)? groove", low), (fid, "kanal merkezde değil")
    assert all(m.group(0) == "no pave" for m in re.finditer(r"\w+ pave", low)), fid   # pave yalnız olumsuz
    assert all(m.group(0) == "raised bezel" for m in re.finditer(r"\w+ bezel", low)), fid   # bezel yalnız "no raised bezel"
    # tasarım pinleri: tek round taş, flush, kanalın üstünde, iki faset, kanal merkez dışı, ölçü oranla
    assert "round brilliant lab-grown diamond" in low and "about 2 mm across" in low, fid
    assert "one third of the band's width" in low and "no claws" in low, fid
    assert "set flush" in low and "groove" in low and "bevel" in low and "a little off centre" in low, fid
    assert "parallel to" in low, fid
    hands = bool(re.search(r"\bhand\b", low))
    assert hands == (fid in ("04-hand-m", "06-hand-w", "08-scale")), (fid, "el yalnız el karelerinde")
    if hands and fid != "08-scale":
        assert "fourth finger, between the middle finger and the little finger" in p, fid
    prompts.append({"id": fid, "feature": feature, "prompt": p, "words": len(p.split())})

assert len(prompts) == 10 and len({x["prompt"] for x in prompts}) == 10
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")
for x in prompts:
    print(f"== {x['id']} ({x['words']} words): {x['feature']}\n{x['prompt']}\n")
