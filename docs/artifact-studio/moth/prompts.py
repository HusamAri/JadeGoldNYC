"""Openwork Moth Pendant Necklace: 12 image prompts (owner 2026-10-13: "12 görsel, görsel tasarım diline uygun").

Run: python3 docs/artifact-studio/moth/prompts.py  -> prompts.json + image-prompts.md
Nothing here calls a model. Each prompt is one generation: nano_banana_2, resolution 2k, 1:1, count 1.
01 is generated from text first; 02..12 take only a tight crop of the approved 01 as reference
(second-brain, Comet 2026-09-27: a full reference leaks its composition).

Visual system of the shop (evil-eye/shots.py, xmas26, SS27): one seamless single-colour ground per listing,
paper-sculpture product frames in shades of that ground, editorial worn frames, a gift frame and a
three-metal frame; Canon 50 mm, f/2.8, ISO 400, one clean shadow, 35 mm grain.
Ground: burnt orange #C4521F, owner reference 2026-10-13: a tonal macro on giant gerbera petals, one soft
petal blurred in the foreground. The reference is used as text only; its piece (stones, ridged wings) is never
passed to the model. Product frames sit on petals instead of paper; worn frames keep the seamless ground.
The 13 Oct hero is not reused: 1024 px, clubbed (butterfly) antennae. Here the antennae are feathered.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
BG, HX = "burnt orange", "#C4521F"
DEEP = "a deeper shade of burnt orange"
PETALS = ("long velvety burnt orange gerbera petals (#C4521F) with fine lengthwise grooves, filling the whole image "
          "edge to edge, seen as an extreme close macro so each petal is wider than the pendant")
BLUR = "one soft out-of-focus petal crosses a lower corner in the foreground"
WG = "polished unplated white gold, a soft warm grey metal with mirror reflections"

SHAPE = ("an openwork moth pendant 14 mm wide and 11 mm tall, seen from the front with its wings spread flat: "
         "the wings are drawn only as fine polished gold outlines 0.9 mm wide with open cells between a few thin "
         "gold veins, nothing filled in; the fore wings are broad with softly pointed tips, the hind wings smaller "
         "and rounded; a slim solid polished gold body runs down the centre; two short feathered antennae like tiny "
         "gold combs sweep back from the head, never thin stalks with round tips; a small smooth gold bail 3 mm "
         "tall is cast into the top of the head; the whole piece is flat and about 1 mm thick, with no stones and "
         "no enamel")
SCALE = "the pendant is 14 mm wide, about the width of a fingernail, never larger, on a fine 1.1 mm cable chain"
CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left with "
          "one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")
CROP = "the top edge of the image cuts across the middle of the neck, so the chin, the lips and the face are outside the image"
SINGLE = ("one single strand whose two halves run straight up and apart like the arms of a letter V and leave the "
          "image at the top edge, never doubled, never coiled")


def worn(skin, how):
    return (f"Exactly one necklace, worn by a woman with {skin} skin, the moth resting flat {how}; no earrings, no "
            f"other necklace, no other jewelry; {CROP}")


def style(people):
    who = " Natural skin texture visible." if people else ""
    return (f"{CAMERA}{who} The necklace must be an exact copy of the necklace in the reference image: same outline, "
            f"same open cells and veins, same feathered antennae, same bail, same metal; do not redesign it, do not "
            f"add stones, enamel, charms or a second pendant; take only the necklace from the reference, never its "
            f"background, camera angle or framing. The chain is one single strand. No text, no numbers, no logo, "
            f"no watermark, no ruler. Square 1:1.")


FRAMES = [
    ("01", "Hero on gerbera petals", False,
     f"Etsy thumbnail hero, macro still life in one colour: {PETALS}; the necklace lies across the petals with the "
     f"moth near the centre, slightly turned, and the chain leaving it as {SINGLE}; the moth in razor-sharp focus, "
     f"its open cells showing the petal grooves through them; {BLUR}; warm directional light from the upper left "
     f"rakes across the petal grooves, one crisp highlight on the gold."),
    ("02", "Open linen collar", True,
     f"Worn portrait on a seamless {BG} backdrop ({HX}): she wears a loose linen shirt in {DEEP}, open at the neck; "
     f"{BLUR}. {worn('light warm', 'on bare skin just below the collarbones')}. Straight-on; {SCALE}."),
    ("03", "Silk neckline", True,
     f"Evening look on a seamless {BG} backdrop ({HX}): a silk slip dress in {BG} with a low square neckline. "
     f"{worn('deep brown', 'on bare skin above the neckline')}. Torso turned slightly to the left; {SCALE}."),
    ("04", "Lying among petals", True,
     f"Seen from directly above: she lies on her back on {BG} linen ({HX}) with a few loose burnt orange gerbera "
     f"petals scattered beside her bare shoulders, arms relaxed at her sides. {worn('medium olive', 'on her skin')}. "
     f"{SCALE[0].upper() + SCALE[1:]}."),
    ("05", "Fingernail scale", True,
     f"Scale shot on a seamless {BG} backdrop ({HX}): the tip of her right index finger rests on the collarbone a "
     f"few millimetres from the moth, never covering it, so the moth can be compared with the fingernail; bare "
     f"shoulders; closer than a portrait. {worn('fair', 'on the collarbone')}. Close crop on the collarbones; {SCALE}."),
    ("06", "Macro on a flower centre", False,
     f"Extreme close detail: the moth rests at the edge of a burnt orange gerbera flower centre ({HX}), its tight "
     f"ring of short inner petals rising around it; the camera is only a few centimetres away, so the wing outlines, "
     f"the open cells and the feathered antennae fill most of the image, the rest falling softly out of focus; one "
     f"crisp highlight on the gold; no fabric, no wood, only the flower and the piece."),
    ("07", "Hanging from a petal", False,
     f"Macro still life: a single long burnt orange gerbera petal ({HX}) arcs across the image against out-of-focus "
     f"petals of the same colour; the necklace is draped over the petal so the chain hangs in a V and the moth hangs "
     f"free at the lowest point, in sharp focus, as if it had just landed; hard warm light casts one soft shadow of "
     f"the open wings onto the petal behind; the necklace is the only jewelry in the image."),
    ("08", "Gift box and petals", False,
     f"Gift and display: on a smooth semi-matte lacquered {BG} surface ({HX}) that shows no reflections, the "
     f"necklace is draped over the ridge of a small plain white folded card, the moth hanging at the front; beside "
     f"it a small square gift box wrapped in matte {BG} paper, its lid off, lined with natural undyed linen, a satin "
     f"ribbon in {DEEP} curling loose across the surface and a few loose burnt orange gerbera petals; no logo and no "
     f"text; the necklace appears only once."),
    ("09", "Three gold colours", False,
     f"Metal colour visualization on {PETALS}: three identical copies of this exact necklace lie side by side, the "
     f"moth of each at the bottom and its chain running straight up as one single strand, same size and same angle, "
     f"with space between them so no two chains touch; the left copy in polished yellow gold, the centre copy in "
     f"{WG}, the right copy in polished rose gold, a soft pink gold; each copy is one single metal from end to end. "
     f"A full-bleed photograph, no border, no inset."),
    ("10", "Open blazer", True,
     f"Evening detail on a seamless {BG} backdrop ({HX}): an open tailored blazer in {DEEP} over bare collarbones. "
     f"{worn('warm tan', 'at the centre of the open collar')}. {SCALE[0].upper() + SCALE[1:]}."),
    ("11", "Polished back", False,
     f"Back view macro: the moth lies face down on {PETALS}, showing its flat, plain, mirror-polished gold reverse "
     f"with no engraving, no hallmark and no hollow, the open cells still open; the chain runs away from the bail as "
     f"one single strand out of focus; {BLUR}; one crisp highlight across the flat back."),
    ("12", "Evening window light", True,
     f"Editorial worn frame: low warm evening sunlight falls through a window across her bare collarbones, a soft "
     f"band of light and shade on a {BG} wall ({HX}) behind her, the moth catching the light. "
     f"{worn('deep brown', 'on bare skin below the collarbones')}. Straight-on; {SCALE}."),
]

BANNED = [r"butterfly", r"clubbed", r"diamond", r"\bstones? set\b", r"—", r"–", r"â", r"two[ -]tone", r"crystal", r"rhinestone",
          r"engrav(?!ing, no hallmark)"]
rows = []
for n, title, people, text in FRAMES:
    p = f"{text} The necklace: {SHAPE}. " + ("" if people else "No people and no hands in the image. ") + style(people)
    low = p.lower()
    for b in BANNED:
        assert not re.search(b, low), (n, b)
    assert HX in p and "count" not in low, n
    if not people:
        assert "woman" not in low, n
    rows.append({"slot": n, "title": title, "model": "nano_banana_2", "resolution": "2k", "aspect_ratio": "1:1",
                 "count": 1, "reference": None if n == "01" else "tight crop of the approved 01", "prompt": p})
assert [r["slot"] for r in rows] == [f"{i:02d}" for i in range(1, 13)]
assert len({r["prompt"] for r in rows}) == 12

json.dump({"ground": [BG, HX], "frames": rows}, open(HERE / "prompts.json", "w"), indent=1, ensure_ascii=False)
md = ["# Openwork Moth: 12 image prompts (awaiting owner approval)", "",
      f"Ground {BG} {HX}. nano_banana_2, 2k, 1:1, count 1 each. 01 from text; 02 to 12 use a tight crop of the approved 01.",
      "Order: 01 alone first, owner looks at it, then 02 to 12.", ""]
for r in rows:
    md += [f"## {r['slot']} · {r['title']}", "", "```", r["prompt"], "```", ""]
(HERE / "image-prompts.md").write_text("\n".join(md))
print(len(rows), "prompts ok")
