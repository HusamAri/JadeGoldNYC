"""10 Etsy sales images per Christmas listing, each in its own colour world.

Run after catalog.py: python3 docs/artifact-studio/xmas26/shots.py
Writes shots.json: {id: {"palette": {...}, "shots": [{slot, title, prompt}]}}.
Each prompt is one generation: nano_banana_2, 2k, 1:1, count 1. The only
reference image is a tight crop of that listing's approved paper hero
(public/artifact/xmas26/<id>.jpg), cut to the piece so no framing or paper
leaks into the frame (docs/second-brain.md, Comet 2026-09-27).

Same system as SS27 v3 (owner moodboards 2026-10-01): seamless single-colour
grounds, paper-sculpture product frames in tints and shades of one colour,
editorial worn frames. Christmas comes from the materials and props only
(chunky knit, velvet, satin ribbon, wrapped gifts, fir, one family prop),
never from a busy scene, so the piece stays the brightest point.

Colour rules (jewelry colour theory, as SS27):
1. Gold reads richest on deep jewel tones and warm mid-tones; no backdrop is
   white, cream or yellow.
2. Enamel pieces sit on a complementary or split complementary ground to
   their main enamel (red enamel on fir green, green enamel on rose, brown
   gingerbread on blue).
3. Holly carries both Christmas colours itself, so its grounds are cool
   neutrals that let red and green both read.
4. The six solid gold pieces (Snowflake, Bell) get the deepest grounds.
5. One accent (ribbon, nail polish) echoes an enamel colour or stays nude.

Rules carried from docs/second-brain.md:
- take only the piece from the reference, never its paper, angle or framing;
- hero composition words ("laid in a loose oval", "out of the top of the
  frame") are stripped from the piece text and asserted absent;
- the ring finger is named by anatomy and the other fingers are declared
  bare (Cartouche 2026-09-26); no cup or glass in a ringed hand (FW 2026-09-30);
- scale is a number plus a known object (Comet 2026-09-27);
- exactly one piece in worn frames; slot 09 is a recolor visualization.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]

# id: (ground name, hex, accent colour for ribbon and nails, skin tone, why)
PAL = {
    "R01": ("icy silver blue", "#B5C9D6", "cranberry red", "light warm", "Holly carries red and green itself; a cool pale blue lets both enamels and the gold read."),
    "B01": ("dove grey", "#A9A8A6", "pine green", "deep brown", "Neutral mid grey: neither Christmas colour competes with the piece."),
    "N01": ("mushroom taupe", "#9C8677", "cranberry red", "medium olive", "Warm neutral for a neckline; red berries and green leaves both stay clear."),
    "R02": ("fir green", "#2F5A47", "cranberry red", "medium olive", "Complementary: red and white stripes pop on deep fir."),
    "B02": ("frosted mint", "#A9C7B5", "cranberry red", "light warm", "Pale complementary green with a value gap, so the small cane stays crisp."),
    "N02": ("deep forest teal", "#1F4A4A", "snow white", "deep brown", "Dark blue-green opposite red; the white stripes are the brightest note."),
    "R03": ("powder blue", "#B7CCE0", "nude", "deep brown", "Blue is the complement of gingerbread brown; the gold icing glows."),
    "B03": ("pale periwinkle", "#B3B8DE", "nude", "light warm", "Split complementary cool ground for three warm brown hearts."),
    "N03": ("Wedgwood blue", "#7D97B8", "nude", "medium olive", "Mid blue: the brown man and the gold icing both read at thumbnail size."),
    "R04": ("blush rose", "#E3B7B9", "emerald green", "medium olive", "Complementary: emerald on rose, value gap keeps the edge."),
    "B04": ("dusty pink", "#D49AA0", "emerald green", "deep brown", "Rose ground for green and one red bauble; the red is darker than the ground."),
    "N04": ("deep burgundy", "#5A1A26", "emerald green", "light warm", "The classic emerald and wine pairing; gold glows on burgundy."),
    "R05": ("midnight navy", "#1B2440", "nude", "light warm", "Solid gold snowflake on the winter night sky: maximum contrast."),
    "B05": ("deep ice teal", "#1F4E5A", "nude", "medium olive", "Cold deep water tone for three gold snowflakes."),
    "N05": ("charcoal blue", "#2B3138", "nude", "deep brown", "Near black with a cool cast, the strongest ground for a polished gold flake."),
    "R06": ("deep cranberry", "#8E1F2F", "nude", "medium olive", "Complementary: a pine green tree and its gold star on cranberry."),
    "B06": ("rose pink", "#D99AA5", "pine green", "light warm", "Soft red ground opposite green; three small trees read clearly."),
    "N06": ("mulled wine plum", "#5C2338", "pine green", "deep brown", "Deep red-violet opposite green; gold star and garland glow."),
    "R07": ("dusty mauve", "#C99AAE", "nude", "light warm", "Red-violet is the complement of sage; white berries stay bright."),
    "B07": ("deep plum", "#4E2340", "snow white", "medium olive", "Dark plum makes the pale sage and white sprig read as light."),
    "N07": ("rosewood", "#A0616E", "nude", "deep brown", "Warm rose-brown opposite sage, soft for a neckline."),
    "R08": ("deep emerald", "#1E5B44", "nude", "deep brown", "Solid gold bell on jewel green: Christmas colours, maximum gold contrast."),
    "B08": ("oxblood", "#4A1C24", "nude", "light warm", "Dark wine red for two gold bells, like a velvet ribbon."),
    "N08": ("deep spruce", "#223F3A", "nude", "medium olive", "Dark blue-green spruce; the bell is the only warm point."),
    "R09": ("pine green", "#24503D", "poinsettia red", "light warm", "Complementary: the red poinsettia on its own leaf green."),
    "B09": ("eucalyptus", "#9FB3A8", "poinsettia red", "deep brown", "Grey-green complement with a value gap for three small flowers."),
    "N09": ("deep teal", "#1F5C66", "poinsettia red", "medium olive", "Blue-green opposite red; the gold bead centre glows."),
    "R10": ("sage green", "#A8B796", "cranberry red", "medium olive", "Muted complementary green; the red and white stocking pops."),
    "B10": ("Nordic blue grey", "#6F8496", "cranberry red", "light warm", "Cool winter grey-blue opposite red, like a snowy window."),
    "N10": ("fir needle green", "#3E5E4A", "snow white", "deep brown", "Mid fir green: the red stocking and white cuff both read."),
}
assert set(PAL) == {i["id"] for i in items}
assert len({p[1] for p in PAL.values()}) == 30, "every listing gets its own ground"

# Christmas story prop for the still life (slot 07), per family.
PROPS = {
    "Holly": "a small sprig of fresh fir with two pine cones",
    "Candy Cane": "one small striped red and white peppermint candy cane",
    "Gingerbread": "one small plain gingerbread cookie on a tiny white ceramic plate",
    "Bauble": "one small glossy glass Christmas bauble in the ground colour",
    "Snowflake": "a light dusting of fine white snow and a small sprig of fresh fir",
    "Tree": "a small sprig of fresh fir and one cinnamon stick",
    "Mistletoe": "a small sprig of real mistletoe with white berries",
    "Bell": "a short length of velvet ribbon in a deeper shade of the ground, tied in a small bow",
    "Poinsettia": "two small sprigs of fresh fir and a few red cranberries",
    "Stocking": "a tiny hand-knit wool mitten in the ground colour and one cinnamon stick",
}
assert {i["family"] for i in items} == set(PROPS)

CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left with "
          "one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")
NO_PEOPLE = {"01-hero", "06-macro", "07-still", "08-gift", "09-metals"}
NOUN = {"ring": "ring", "bracelet": "bracelet", "necklace": "necklace"}


def piece(it):
    """Hero shape text with the hero's composition words removed."""
    s = it["shape"]
    for a, b in ((" laid in a loose oval", ""), ("; shown standing upright in a three-quarter view", ""),
                 (" and curves softly out of the top of the frame", "")):
        s = s.replace(a, b)
    for bad in ("the frame", "loose oval", "shown", "three-quarter"):  # "framed by rims" is product text
        assert bad not in s, (it["id"], bad)
    return s


def mm(it):
    return max(float(x) for x in re.findall(r"\d+(?:\.\d+)?", it["dims"]))


def scale(it):
    m = mm(it)
    t = it["productType"]
    if t == "ring":
        if it["id"] == "R02":  # a striped band, no top motif
            return "the band is only 3 mm wide, narrower than the fingernail on that finger, a slim stacking band"
        obj = "about the width of the fingernail on that finger, never wider than the finger"
        return f"the motif is only {m:g} mm, {obj}, on a slim band"
    if t == "bracelet":
        return (f"each charm or station is only {m:g} mm, smaller than a fingernail, and the chain is a 1.1 mm thread "
                f"of gold, fine against the wrist bone")
    obj = "about the size of a fingertip" if m >= 12 else "smaller than a fingertip"
    return f"the pendant is only {m:g} mm tall, {obj}, on a fine 1.2 mm chain, small against the collarbones"


def worn(it):
    skin = PAL[it["id"]][3]
    t = it["productType"]
    if t == "ring":
        # R01 test 2026-10-06 (14 frames): the model puts the ring on whichever finger sits in the middle of
        # the frame, whatever the prompt says, even with the digits named left to right. These motif rings make no
        # finger claim (unlike the Cartouche pinky signet), so QA accepts the ring, middle or index finger and
        # rejects only a second ring, a hand without five digits, wrong scale or a redesigned ring.
        return (f"Exactly one ring, worn on the left hand of a woman with {skin} skin, on the ring finger or the "
                f"middle finger; every other finger and the thumb are bare; no other rings, no bracelet, no watch; "
                f"anatomically correct hand with exactly five digits, all five visible")
    if t == "bracelet":
        return (f"Exactly one bracelet, worn on the left wrist of a woman with {skin} skin, the charm or stations "
                f"turned to face the camera; the right wrist is bare; no watch, no rings, no other jewelry; "
                f"anatomically correct hands with five fingers")
    return (f"Exactly one necklace, worn by a woman with {skin} skin, the pendant resting at the centre just below "
            f"the collarbones and facing the camera; no earrings, no second chain, no other jewelry; cropped below "
            f"the lips so the face is not shown")


def ribbon(it):
    bg, accent = PAL[it["id"]][0], PAL[it["id"]][2]
    return f"a satin ribbon in a deeper shade of {bg}" if accent == "nude" else f"a {accent} satin ribbon"


def world(it, slot):
    bg, hx, accent, skin, _ = PAL[it["id"]]
    base = (f"Colour world, identical in every image of this listing: {bg} ({hx}) and its paler tints and deeper "
            f"shades only, matte paper, knit and velvet surfaces")
    if slot in ("07-still",):
        return f"{base}; the small Christmas prop is the only other colour."
    if slot == "08-gift":
        return f"{base}; the satin ribbon and the natural linen lining are the only accents."
    if slot not in NO_PEOPLE:
        nails = "bare natural nails" if accent in ("nude", "snow white") else f"short natural nails painted {accent}"
        return f"{base}; clothing is tone on tone in the ground colour; {nails}; nothing else adds colour."
    return f"{base}; nothing but the piece adds colour."


def style(it, slot):
    noun = NOUN[it["productType"]]
    finish = (f"The {noun} is solid gold only, with no enamel, no colour and no stones." if it["goldOnly"] else
              "Enamel is perfectly flat, glossy and flush inside thin polished gold rims, never domed, no gradient, "
              "no painted detail, no stones.")
    look = "same sculpted shape and surface" if it["goldOnly"] else "same enamel colours and cell layout, same thin polished gold rims"
    skin = " Natural skin texture visible." if slot not in NO_PEOPLE else ""
    return (f"{world(it, slot)} {CAMERA}{skin} The {noun} must be an exact copy of the {noun} in the reference image: same "
            f"outline, {look}, same gold; do not redesign it, do not add charms, motifs or stones; take only the {noun} "
            f"from the reference, never its paper background, camera angle or framing. {finish} No text, no numbers, "
            f"no logo, no watermark, no ruler. Square 1:1.")


def worn_slots(it):
    bg, hx, accent, skin, _ = PAL[it["id"]]
    t = it["productType"]
    sc = scale(it)
    box = f"a small gift box wrapped in matte {bg} paper"
    gift = f"{box} tied with {ribbon(it)}"
    if t == "ring":
        return {
            "02": ("Hand on a knit sleeve", f"Worn close-up: her left hand rests flat and relaxed on the sleeve of a chunky cable-knit sweater in a deeper shade of {bg}, back of the hand to the camera, the thumb visible. {worn(it)}. Cropped tight on the hand; {sc}."),
            "03": ("Hand on a wrapped gift", f"Christmas gift moment: her left hand lies flat on the lid of {gift}, back of the hand to the camera, fingers straight and slightly apart pointing up in the frame, away from the camera; nothing is held. {worn(it)}. Seen from above on the {bg} floor; {sc}."),
            "04": ("Hand from a plinth", f"Surreal studio sculpture: a single left hand and forearm rising vertically out of a smooth cylindrical plinth painted the same {bg} as the backdrop, fingers together pointing up, back of the hand to the camera. {worn(it)}. Clean and graphic, nothing else in the frame; {sc}."),
            "05": ("Fingertip scale", f"Scale shot: her left hand resting flat on {bg} velvet, fingers straight and slightly apart pointing up in the frame, the ringed finger in sharp focus so the ring can be compared with the fingernail beside it. {worn(it)}. Close crop from the wrist to the fingertips; {sc}."),
            "10": ("Hand at a velvet lapel", f"Editorial portrait detail: her left hand rests flat on the chest against the lapel of a velvet blazer in a deeper shade of {bg}, back of the hand to the camera, the thumb visible; a few soft out-of-focus warm gold fairy lights far behind. {worn(it)}. Cropped from the chin to the chest, face not shown; {sc}."),
        }
    if t == "bracelet":
        return {
            "02": ("Wrist from a knit cuff", f"Worn close-up: her left wrist rests on her lap where the cuff of a chunky cable-knit sweater in a deeper shade of {bg} is pushed back, hand relaxed, the bracelet on the bare wrist just below the cuff. {worn(it)}. Cropped from the forearm to the fingertips; {sc}."),
            "03": ("Tying a gift ribbon", f"Christmas gift moment: both hands tie {ribbon(it)} around {box}, the left wrist forward and closest to the camera. {worn(it)}. Seen from above at a slight angle on the {bg} floor; {sc}."),
            "04": ("Wrist from a plinth", f"Surreal studio sculpture: a single left hand and forearm rising vertically out of a smooth cylindrical plinth painted the same {bg} as the backdrop, wrist turned so the bracelet faces the camera, fingers relaxed. {worn(it)}. Clean and graphic, nothing else in the frame; {sc}."),
            "05": ("Fingertip scale", f"Scale shot: her left wrist rests on {bg} velvet and the fingertips of her right hand touch the wrist beside the bracelet, never covering a charm, so the charms can be compared with a fingernail. {worn(it)}. Cropped tight on the wrist; {sc}."),
            "10": ("Hand at a velvet collar", f"Editorial portrait detail: her left hand rests at the collar of a velvet blazer in a deeper shade of {bg}, the wrist turned to the camera; a few soft out-of-focus warm gold fairy lights far behind. {worn(it)}. Cropped from the chin to the chest, face not shown; {sc}."),
        }
    return {
        "02": ("Off-shoulder knit", f"Worn portrait: she wears an off-the-shoulder chunky cable-knit sweater in a deeper shade of {bg}, the neckline wide so the collarbones and the pendant sit on bare skin. {worn(it)}. Straight-on, cropped from below the lips to the chest; {sc}."),
        "03": ("Velvet neckline", f"Party look: a velvet slip dress in {bg} with a low square neckline, the pendant on bare skin above it. {worn(it)}. Three-quarter view, cropped from below the lips to the chest; {sc}."),
        "04": ("Profile like a bust", f"Studio sculpture: her neck and shoulders in clean profile against the {bg} wall, shoulders bare, chin lifted, the pendant hanging free at the front of the neck in sharp focus. {worn(it)}. Graphic and minimal, cropped at the chin; {sc}."),
        "05": ("Fingertip scale", f"Scale shot: the fingertips of her right hand rest on the collarbone beside the pendant, never covering it, so the pendant can be compared with a fingertip; bare shoulders. {worn(it)}. Close crop on the collarbones; {sc}."),
        "10": ("Open wool coat", f"Winter evening: an open wool coat in a deeper shade of {bg} over bare collarbones, the pendant at the centre of the open collar; a few soft out-of-focus warm gold fairy lights far behind. {worn(it)}. Cropped from below the lips to the chest; {sc}."),
    }


def slots(it):
    p = piece(it)
    bg, hx, accent, skin, _ = PAL[it["id"]]
    t = it["productType"]
    noun = NOUN[t]
    surface = "the polished sculpted gold surface" if it["goldOnly"] else "the flat glossy enamel and its thin polished gold rims"
    lie = {"ring": "stands upright on the pale floor, the motif facing the camera in a three-quarter view",
           "bracelet": "lies in a soft open curve on the pale floor, the clasp visible at one end",
           "necklace": "lies on the pale floor with the chain in a soft loop around the pendant"}[t]
    drape = {"ring": f"this {noun} ({p}) stands upright on the crest of the arc, the motif facing the camera",
             "bracelet": f"this {noun} ({p}) is draped over its top edge so the chain hangs in a soft V with the charms at the front",
             "necklace": f"this {noun} ({p}) is draped over its top edge so the chain hangs in a V and the pendant hangs free at the lowest point"}[t]
    card = {"ring": f"this {noun} ({p}) standing in a slit cut in the ridge of a small plain white folded card",
            "bracelet": f"this {noun} ({p}) draped over the ridge of a small plain white folded card, the charms at the front",
            "necklace": f"this {noun} ({p}) draped over the ridge of a small plain white folded card, the pendant hanging at the front"}[t]
    three = {"ring": "three identical copies of this exact ring standing upright side by side, same size and same angle",
             "bracelet": "three identical copies of this exact bracelet laid in three parallel soft curves, same size and same angle",
             "necklace": "three identical copies of this exact pendant laid side by side with their chains running up and away, same size and same angle"}[t]
    w = worn_slots(it)
    out = [
        ("01-hero", "Hero on a paper wave",
         f"Etsy thumbnail hero: a sheet of {bg} paper curls in one soft wave across the top of the frame over a floor of "
         f"pale {bg} tint paper; this {noun} ({p}) {lie}, seen from slightly above, in sharp focus at the centre of the "
         f"frame with generous empty space around it, one clean soft shadow under the curl; one small sprig of fresh fir "
         f"lies far in the corner, out of focus."),
        ("02-" + w["02"][0].lower().replace(" ", "-"), w["02"][0], w["02"][1]),
        ("03-" + w["03"][0].lower().replace(" ", "-"), w["03"][0], w["03"][1]),
        ("04-" + w["04"][0].lower().replace(" ", "-"), w["04"][0], w["04"][1]),
        ("05-scale", w["05"][0], w["05"][1]),
        ("06-macro", "Macro on paper hills",
         f"Macro detail: this {noun} ({p}), the motif resting on the crest of layered curved paper cut-outs in graduated "
         f"shades of {bg}, like soft snowy hills; the camera is a few centimetres away so the motif and {surface} fill "
         f"most of the frame, the rest falling out of focus; one crisp highlight on the gold."),
        ("07-still", "Christmas still life",
         f"Paper sculpture still life: a wide ribbon of {bg} paper curls in one sweeping arc through the frame; {drape}, "
         f"in sharp focus; below it on the curved paper floor, {PROPS[it['family']]}, small and secondary; hard "
         f"directional light casts one long curved shadow; the {noun} is the only piece of jewelry in the frame."),
        ("08-gift", "Christmas gift box",
         f"Gift and display: on a glossy lacquered {bg} surface that mirrors soft reflections, {card}; beside it a small "
         f"square gift box wrapped in matte {bg} paper, its lid off, lined with natural undyed linen, and "
         f"{ribbon(it)} curling loose across the surface; the card and the box have no logo and no text."),
        ("09-metals", "Three gold colours",
         f"Metal colour visualization: {three}, on pale {bg} tint paper with a {bg} paper curl at the top edge: left in "
         f"yellow gold, centre in white gold (cool silvery white), right in rose gold (soft pink gold); "
         + ("the shape is identical in all three." if it["goldOnly"] else "the enamel colours are identical in all three.")),
        ("10-" + w["10"][0].lower().replace(" ", "-"), w["10"][0], w["10"][1]),
    ]
    rows = []
    for slot, title, text in out:
        if slot[:2] in ("01", "06", "07", "08", "09"):
            slot = {"01": "01-hero", "06": "06-macro", "07": "07-still", "08": "08-gift", "09": "09-metals"}[slot[:2]]
            text += " No people and no hands in the frame."
            prompt = f"{text} {style(it, slot)}"
        else:
            text += f" The {noun}: {p}."
            prompt = f"{text} {style(it, 'worn')}"
        for bad in ("—", "–", "â", "loose oval", "out of the top of the frame", "cup", "glass of",
                    "mug", "holding a", "nude satin", "motif is only 3 mm"):
            assert bad not in prompt, (it["id"], slot, bad)
        assert hx in prompt, (it["id"], slot)
        if t == "ring" and slot[:2] not in ("01", "06", "07", "08", "09"):
            assert "all five visible" in prompt and "every other finger and the thumb are bare" in prompt, (it["id"], slot)
        rows.append({"slot": slot, "title": title, "prompt": prompt})
    assert len(rows) == 10 and len({r["slot"][:2] for r in rows}) == 10
    return rows


out = {}
for it in items:
    bg, hx, accent, skin, why = PAL[it["id"]]
    out[it["id"]] = {"palette": {"backdrop": bg, "hex": hx, "accent": accent, "skin": skin, "why": why},
                     "shots": slots(it)}
assert len(out) == 30 and sum(len(v["shots"]) for v in out.values()) == 300
json.dump(out, open(HERE / "shots.json", "w"), indent=1, ensure_ascii=False)
lens = [len(r["prompt"]) for v in out.values() for r in v["shots"]]
print(len(out), sum(len(v["shots"]) for v in out.values()), "prompts", min(lens), max(lens), "chars")
