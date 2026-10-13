"""Twig and Baroque Pearl Station Bracelet: 12 image prompts.

Run: python3 docs/artifact-studio/twig/prompts.py  -> prompts.json + image-prompts.md
Nothing here calls a model. Each prompt is one generation: nano_banana_2, resolution 2k, 1:1, count 1.
01 is generated from text first; 02..12 take only a tight crop of the approved 01 as reference.

Shop visual system (moth, evil-eye, xmas26): one single-colour world per listing, tonal macro product frames,
editorial worn frames, a gift frame and a three-metal frame; Canon 50 mm, f/2.8, ISO 400, 35 mm grain.
Ground: winter slate blue #3F5A73. The brief's theme is a winter garden after frost and the blue-and-silver
holiday look; gold reads warm against a cool deep blue and the white pearl stays the brightest point.
Product frames sit on frost-dusted bare twigs and slate stone (the moth's petal macro, in a winter key).
Owner decisions 2026-10-13: white pearl only, no diamond, no engraving, so no disc tag and no extender.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
BG, HX = "winter slate blue", "#3F5A73"
DEEP = "a deeper shade of winter slate blue"
FROST = ("slate blue stone (#3F5A73) dusted with fine white hoarfrost crystals, with a few bare winter twigs coated "
         "in frost, seen as an extreme close macro")
BLUR = "one frosted twig crosses a lower corner in the foreground, softly out of focus"
WG = "polished unplated white gold, a pale silvery grey like platinum with no yellow tint at all"

# Owner 2026-10-13 ("ilk görseldeki referansı al"): the piece copies the brief render (images/brief-twig-crop.png):
# a smooth, polished, gently wavy organic twig (not bark), one spur up and one down, the pearl in a cup right of centre.
SHAPE = ("a fine solid gold chain bracelet with one station at the centre: a cast gold twig about 20 mm long, a slim, "
         "smooth, highly polished organic branch that waves gently like molten gold, with one short spur rising up "
         "and one short spur bending down; just right of the centre a small round gold cup setting about 4.6 mm "
         "across holds one single 6 mm white baroque freshwater pearl, visibly irregular and slightly lumpy with a "
         "soft lustre, the pearl as tall as the twig is thick several times over; each end of the twig has a small "
         "cast loop joined to a fine 1.1 mm gold cable chain that closes with a small spring ring clasp; no disc "
         "tag, no extender chain, no lobster clasp, no charms, no stones, no other pearls")
SCALE = "the twig is 20 mm long and the pearl 6 mm, small against the wrist, never larger"
CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left with "
          "one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")


def worn(skin, how):
    return (f"Exactly one bracelet, worn on the left wrist of a woman with {skin} skin, {how}, the clasp turned under "
            f"the wrist; the right wrist is bare; no watch, no rings, no other jewelry; anatomically correct hands "
            f"with five fingers")


def style(people, n):
    who = " Natural skin texture visible." if people else ""
    metal = ("same twig, spurs, cup setting and pearl; only the metal colour changes, exactly as named for each copy;"
             if n == "09" else "same twig, spurs, cup setting, pearl and chain, same metal;")
    return (f"{CAMERA}{who} The bracelet must be an exact copy of the bracelet in the reference image: {metal} do "
            f"not redesign it, do not add a tag, charms, stones or a second pearl; take only the bracelet from the "
            f"reference, never its background, camera angle or framing. No text, no numbers, no logo, no watermark, "
            f"no ruler. Square 1:1.")


FRAMES = [
    ("01", "Hero on frosted twigs", False,
     f"Etsy thumbnail hero, macro still life in one colour: {FROST}; the bracelet lies in one soft open curve, the "
     f"gold twig and the pearl face up at the centre in razor-sharp focus, the fine chain curving away on both sides; "
     f"{BLUR}; cool winter light from the upper left with one warm highlight on the gold and a soft glow on the pearl."),
    ("02", "Wrist below a knit cuff", True,
     f"Worn close-up on a seamless {BG} backdrop ({HX}): her left forearm rests on her knee, the cuff of a chunky "
     f"knit sweater in {DEEP} pushed back, the bracelet on the bare wrist just below it. "
     f"{worn('light warm', 'the twig and pearl on top of the wrist facing the camera')}. Cropped from the forearm to "
     f"the fingertips; {SCALE}."),
    ("03", "Hand with a frosted branch", True,
     f"Winter garden moment on a seamless {BG} backdrop ({HX}): her left hand lightly holds a single bare frosted "
     f"twig. {worn('deep brown', 'the twig and pearl on top of the wrist facing the camera')}. Cropped tight on the "
     f"wrist and hand; {SCALE}."),
    ("04", "Wrist from a plinth", True,
     f"Studio sculpture: a single left hand and forearm rising vertically out of a smooth cylindrical plinth painted "
     f"the same {BG} as the backdrop ({HX}), the wrist turned so the twig faces the camera, fingers relaxed. "
     f"{worn('medium olive', 'the twig and pearl facing the camera')}. Clean and graphic, nothing else in the image; "
     f"{SCALE}."),
    ("05", "Fingernail scale", True,
     f"Scale shot on {BG} linen ({HX}): her left wrist rests flat and the tip of her right index finger touches the "
     f"wrist beside the pearl, never covering it, so the pearl can be compared with the fingernail. "
     f"{worn('fair', 'the twig and pearl on top of the wrist')}. Cropped tight on the wrist; {SCALE}."),
    ("06", "Pearl macro in frost", False,
     f"Extreme close detail: the gold twig and the baroque pearl rest on {FROST}; the camera is only a few "
     f"centimetres away, so the smooth polished branch, the spurs, the cup setting and the pearl's lustre fill most of the "
     f"image, the rest falling softly out of focus; one crisp highlight on the gold."),
    ("07", "Around a frosted twig", False,
     # QA 2026-10-13: draped over a branch, the chain twice came out as two long strands. Pose changed, not wording.
     f"Macro still life: one small bare twig coated in hoarfrost stands upright out of {FROST}; the bracelet is "
     f"closed and lies flat on the stone in one round circle around the foot of the twig, like a ring around it, the "
     f"gold twig station and pearl at the front of the circle facing the camera, in sharp focus; seen from slightly "
     f"above; the bracelet is the only jewelry in the image."),
    ("08", "Gift box and card", False,
     f"Gift and display: on a smooth semi-matte lacquered {BG} surface ({HX}) that shows no reflections, the "
     f"bracelet is draped over the ridge of a small plain white folded card, the twig and pearl at the front; beside "
     f"it a small square gift box wrapped in matte {BG} paper, its lid off, lined with natural undyed linen, a satin "
     f"ribbon in a soft silver blue curling loose and two small frosted twigs; no logo and no text; the bracelet "
     f"appears only once."),
    ("09", "Three gold colours", False,
     f"Metal colour visualization on {FROST}: three separate bracelets of this exact design lie in one horizontal row, "
     f"each closed into its own round circle with its own clasp and its twig and pearl at the front, with clear space "
     f"between the circles so no two bracelets touch; the left bracelet in polished yellow gold, the centre bracelet in "
     f"{WG}, clearly a different colour from the yellow one beside it, the right bracelet in polished rose gold, a soft "
     f"pink gold; every pearl stays the same white; each bracelet is one single metal from end to end. A full-bleed "
     f"photograph, no border, no inset."),
    ("10", "Hand at a wool collar", True,
     f"Editorial detail on a seamless {BG} backdrop ({HX}): her left hand rests at the open collar of a wool coat in "
     f"{DEEP}, the wrist turned to the camera. {worn('warm tan', 'the twig and pearl facing the camera')}. Seen "
     f"from the collarbones down: the top edge of the image cuts across the collarbones, so the neck, the chin, the "
     f"lips and the face are all outside the image; {SCALE}."),
    ("11", "Twig in profile", False,
     f"Side view macro: the bracelet lies on {FROST}, seen low from the side so the half-round twig, its two spurs "
     f"and the cup rising under the pearl are shown in profile; the chain leaves the frame out of focus; {BLUR}; one "
     f"crisp highlight along the top of the twig."),
    ("12", "Window light in winter", True,
     f"Editorial worn frame: soft cool winter daylight through a frosted window falls across her wrist resting on a "
     f"windowsill, a {BG} wall ({HX}) behind. {worn('deep brown', 'the twig and pearl catching the light')}. Cropped "
     f"on the wrist and hand; {SCALE}."),
]

BANNED = [r"—", r"–", r"â", r"diamond", r"engrav", r"\binitial\b", r"two[ -]tone", r"\bgrey pearl",
          r"silver pearl", r"crystal pearl"]
rows = []
for n, title, people, text in FRAMES:
    p = f"{text} The bracelet: {SHAPE}. " + ("" if people else "No people and no hands in the image. ") + style(people, n)
    if n == "01":
        p = re.sub(r"The bracelet must be an exact copy.*?framing\. ",
                   "The gold is polished 14K yellow gold. Do not add a tag, charms, stones or a second pearl. ", p)
        assert "reference" not in p
    low = p.lower()
    for b in BANNED:
        assert not re.search(b, low), (n, b)
    assert HX in p, n
    if not people:
        assert "woman" not in low, n
    if n == "09":
        assert "same metal" not in low
    rows.append({"slot": n, "title": title, "model": "nano_banana_2", "resolution": "2k", "aspect_ratio": "1:1",
                 "count": 1, "reference": None if n == "01" else "tight crop of the approved 01", "prompt": p})
assert [r["slot"] for r in rows] == [f"{i:02d}" for i in range(1, 13)] and len({r["prompt"] for r in rows}) == 12

json.dump({"ground": [BG, HX], "frames": rows}, open(HERE / "prompts.json", "w"), indent=1, ensure_ascii=False)
md = ["# Twig and Baroque Pearl Bracelet: 12 image prompts (awaiting owner approval)", "",
      f"Ground {BG} {HX}, frost and bare twigs. nano_banana_2, 2k, 1:1, count 1 each. 01 from text first; "
      "02 to 12 use a tight crop of the approved 01.", ""]
for r in rows:
    md += [f"## {r['slot']} · {r['title']}", "", "```", r["prompt"], "```", ""]
(HERE / "image-prompts.md").write_text("\n".join(md))
print(len(rows), "prompts ok")
