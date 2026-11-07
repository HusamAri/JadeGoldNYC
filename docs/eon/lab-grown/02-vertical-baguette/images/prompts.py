"""EON-VB6 (6 mm, tek dikey baget, lab-grown) Etsy galerisi: 10 Higgsfield prompt'u.

Run: python3 -I docs/eon/lab-grown/02-vertical-baguette/images/prompts.py   -> prompts.json

Sahip brief'i (2026-11-07): her kare farklı açı + alıcıya farklı bir özellik; aynı renk tonları;
doğal metal yüzeyleri; "natural home studio with colored light reflections and controlled metal
reflections". Tasarım referansı: üreticinin WhatsApp'tan gönderdiği foto (PISSARRO filigranlı),
yalnız halka ve taşın sıkı kırpımı (filigran ve sahne dışarıda). Model/parametreler jobs.json'da.

Paylaşılan bloklar HER karede doğru olmak zorunda (moth "same metal", twig "exact copy" dersleri):
renk karesi (07) kendi halka bloğunu ve kendi referans cümlesini taşır.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

RING_Y = (
    "The ring: a solid 14K yellow gold band, 6 mm wide and 2.2 mm thick, with a flat outer face and "
    "crisp, squared edges. The outer face has a fine, even brushed satin finish, its soft grain running "
    "around the band; the inside is smooth high polish. One single lab-grown diamond baguette, a long, "
    "narrow, step-cut rectangle about 6 x 2 mm, bright and colourless, is set vertically: its long side "
    "runs across the band from one edge to the other, its top sits level with the brushed face, and the "
    "gold meets its two long sides in clean straight lines. It is the only stone on the ring: no other "
    "diamonds, no pave, no prongs, no claws, no raised bezel, no engraving, no hallmark, no text."
)
RING_3 = (
    "Three identical rings of this one design stand upright side by side in a row, evenly spaced, each "
    "with its baguette facing the camera. From left to right the metals are 14K yellow gold (warm soft "
    "yellow), 14K white gold (bright cool silver-white) and 14K rose gold (soft warm pink). All three "
    "have the same 6 mm flat band with crisp, squared edges and a brushed satin outer face, and the same "
    "single lab-grown diamond baguette, a long, narrow, step-cut rectangle set vertically across the "
    "band from edge to edge, its top level with the brushed face. Each ring has only that one stone: no "
    "other diamonds, no pave, no prongs, no raised bezel, no engraving, no text."
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
    "Reference images: both show this ring's design. Take only the band's flat brushed shape, the "
    "baguette and the way it is set flush across the band; do not take their background, lighting, "
    "reflection colours or camera angle."
)
REF_SERIES = (
    "Reference images: the first two show this ring's design (take only the band's flat brushed shape, "
    "the baguette and its flush setting, not their background, lighting or camera angle); the third is "
    "a close crop of this ring's surface, to match its gold colour and brushed texture, not its "
    "composition."
)
REF_COLOURS = (
    "Reference images: they show this ring's design in yellow gold. Take only the band's flat brushed "
    "shape, the baguette and its flush setting; the metal colours of the three rings are exactly as "
    "described above, not taken from the references."
)

FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", RING_Y, REF_HERO,
     "The ring stands upright on the pale travertine surface, seen from a three-quarter front angle a "
     "little above it. The baguette faces the camera at the front centre of the band; the full circle "
     "of the band is visible and nothing is cut off. The ring sits in the centre of the frame and fills "
     "a little more than half of the frame's height, with generous space on the left and right so that a square crop "
     "keeps the whole ring. A soft amber patch of light lies on the plaster wall behind it and a faint "
     "teal patch on the travertine to one side. The ring is the only object in the image."),
    ("02-stone", "step-cut baguette and flush setting up close", RING_Y, REF_SERIES,
     "Close-up of the front of the band. The camera faces the baguette straight on from a few "
     "centimetres away; the band runs horizontally across the whole frame, so the stone stands upright "
     "in the centre and spans the band from its top edge to its bottom edge. The step-cut facets show "
     "as long parallel steps, the stone's top sits exactly level with the brushed gold, and the brushed "
     "grain around it is crisp. Depth of field softens the band toward the left and right edges of the "
     "frame; behind the band the oak surface and an amber patch of light are out of focus."),
    ("03-flat", "2.2 mm wall thickness and 6 mm width", RING_Y, REF_SERIES,
     "The ring lies flat on the light oak surface like a coin, its opening facing up, seen from above at "
     "a high three-quarter angle. The top rim of the band reads as an even, continuous gold circle all "
     "the way round, showing the solid 2.2 mm wall; the 6 mm brushed outer face shows around the front, "
     "with the baguette at the front of the circle, nearest the camera. Inside the circle, the polished "
     "inner surface reflects soft daylight. A teal light patch falls across the oak beside the ring."),
    ("04-hand-m", "how the 6 mm band looks on a man's hand", RING_Y, REF_SERIES,
     "A man's hand rests palm-down on undyed linen, seen from slightly above, fingers relaxed and "
     "slightly apart. The ring is worn on the ring finger, the fourth finger, between the middle finger "
     "and the little finger, near the base of the finger, with the baguette on top facing the camera. It "
     "is the only ring; the other fingers and the wrist are bare, no watch and no bracelet. The 6 mm band "
     "reads as a substantial band, about as wide as a pencil. Natural skin texture, short clean "
     "unpolished nails. A soft amber patch of light lies across the back of the hand."),
    ("05-inside", "smooth polished interior, plain inside", RING_Y, REF_SERIES,
     "Inside view: the ring stands upright on the travertine, turned so that the camera looks into the "
     "opening from slightly above and to the front. The polished inner surface is the focus, curving "
     "smoothly all the way round and reflecting soft daylight in long clean bands; the inside is plain "
     "and smooth, with nothing engraved. The baguette sits at the top of the band."),
    ("06-hand-w", "how it looks on a woman's hand, everyday", RING_Y, REF_SERIES,
     "A woman's hand rests flat on the travertine next to a handmade matte ceramic cup; the hand does not "
     "hold the cup. The ring is worn on the ring finger, the fourth finger, between the middle finger and "
     "the little finger, with the baguette on top facing the camera. It is the only ring and the only "
     "jewellery in the image. Natural skin, short natural nails. The 6 mm band sits clearly on the "
     "slimmer finger. Patches of amber and teal light fall across the travertine and the cup."),
    ("07-metals", "the three metal colours side by side", RING_3, REF_COLOURS,
     "The three rings stand on the pale travertine, seen from the front and a little above; together "
     "they fill the width of the frame, with space around them. A soft amber patch of light lies on the "
     "plaster wall behind them and a faint teal patch on the travertine in front."),
    ("08-scale", "real size against a fingertip", RING_Y, REF_SERIES,
     "The ring is held upright between the thumb and index finger of a hand, close to the camera, the "
     "baguette facing the lens. The ring is about 2 cm across, about the size of the fingertip and never "
     "larger. Fingers relaxed, natural skin, short clean nails. Behind, the ivory plaster wall with a "
     "soft amber patch of light is out of focus."),
    ("09-light", "the baguette's light: clean step-cut flashes", RING_Y, REF_SERIES,
     "The ring stands upright on the travertine in a narrow beam of late sunlight. The camera is close, "
     "level with the baguette and slightly to one side. The step-cut facets throw crisp white flashes in "
     "clean straight lines, with one small spark of teal; the brushed gold around the stone glows softly "
     "without glare. The background falls into warm amber shade."),
    ("10-dish", "at home: where it rests at night", RING_Y, REF_SERIES,
     "The ring rests in a small, shallow, handmade ceramic dish with a matte off-white glaze, on a light "
     "oak bedside table by the window, seen from above at about 45 degrees. The ring lies flat in the "
     "dish, its opening facing up, turned so that the baguette faces the camera. A soft teal and amber patch of light crosses "
     "the dish; folded linen and the plaster wall behind are out of focus. The ring is the clear, sharp "
     "subject."),
]

prompts = []
for fid, feature, ring, ref, frame in FRAMES:
    p = " ".join([frame, ring, SCENE, PHOTO, ref])
    # paylaşılan bloklar birebir ve bir kez
    for blk in (SCENE, PHOTO):
        assert p.count(blk) == 1, (fid, blk[:30])
    assert (p.count(RING_Y), p.count(RING_3)) == ((0, 1) if fid == "07-metals" else (1, 0)), fid
    assert (ref is REF_HERO) == (fid == "01-hero") and (ref is REF_COLOURS) == (fid == "07-metals"), fid
    # bilinen tuzaklar
    low = p.lower()
    for bad in ("classic", "same metal", "exact copy", "solitaire", "sparkle shape", "macro",
                "stone surface", "travertine stone", "on the stone ", "near the ring"):
        assert bad not in low, (fid, bad)
    assert all(m.group(0) == "no pave" for m in re.finditer(r"\w+ pave", low)), fid   # pave yalnız olumsuz
    assert "baguette" in low and "lab-grown diamond baguette" in low, fid
    hands = bool(re.search(r"\bhand\b", low))
    assert hands == (fid in ("04-hand-m", "06-hand-w", "08-scale")), (fid, "el yalnız el karelerinde")
    if hands and fid != "08-scale":
        assert "fourth finger, between the middle finger and the little finger" in p, fid
    prompts.append({"id": fid, "feature": feature, "prompt": p, "words": len(p.split())})

assert len(prompts) == 10 and len({x["prompt"] for x in prompts}) == 10
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")
for x in prompts:
    print(f"== {x['id']} ({x['words']} words): {x['feature']}\n{x['prompt']}\n")
