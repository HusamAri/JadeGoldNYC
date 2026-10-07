"""9 Etsy sales images per For Him listing (frames 02-10); frame 01 is the approved stone hero.

Run after catalog.py: python3 docs/artifact-studio/him26/shots.py
Writes shots.json: {id: {"palette": {...}, "shots": [{slot, title, prompt}]}}.
Each prompt is one generation: nano_banana_2, 2k, 1:1, count 1. The only reference image is a tight
crop of that listing's approved hero (public/artifact/him26/ref/<id>.jpg), cut to the piece so the grey
stone and the hero's framing do not leak (docs/second-brain.md, Comet 2026-09-27).

Art direction: quiet, masculine, minimal. Each listing has its own deep or earthy ground colour so the
thumbnails differ; materials are matte stone, wool, linen, leather and wood in tints and shades of that
ground. Gold reads richest on deep and warm mid tones, so no ground is white, cream or yellow.

Rules carried from docs/second-brain.md:
- take only the piece from the reference, never its stone, angle or framing;
- hero composition words are stripped from the piece text and asserted absent;
- earrings sell single or pair: worn frames show exactly ONE earring in one visible ear, still lifes
  show the pair as in the hero;
- a ring sits on one finger, every other finger and the thumb are bare; QA makes no finger claim
  (R01 Christmas test: the model picks the finger in the middle of the frame);
- no cup or glass in a ringed hand; scale is a number plus a known body part;
- exactly one piece in worn frames; slot 09 is a recolor visualization.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
items = json.load(open(HERE / "catalog.json"))["items"]

# id: (ground name, hex, skin tone, why)
PAL = {
    "R01": ("graphite grey", "#3A3D40", "light warm", "Brushed satin gold needs a dark neutral to show its grain."),
    "R02": ("deep navy", "#1E2A3E", "medium olive", "A high polish dome mirrors the dark blue and glows."),
    "R03": ("oxblood", "#4A1F24", "deep brown", "Classic signet ground, leather and wine."),
    "R04": ("slate blue", "#4B5A6A", "light cool", "Cool mid tone so the brushed face and polished bevels separate."),
    "R05": ("charcoal black", "#232425", "medium olive", "The sharp ridge reads as one line of light on near black."),
    "R06": ("tobacco brown", "#5B4130", "light warm", "Warm earth for the hand-hammered facets."),
    "R07": ("deep forest", "#24382E", "deep brown", "The polished centre line glows against dark green."),
    "R08": ("petrol blue", "#1F4049", "light warm", "Blue-green depth for crisp square edges."),
    "R09": ("espresso", "#3B2A22", "medium olive", "Dark brown keeps eight facets bright."),
    "R10": ("stone grey", "#7A7670", "deep brown", "A lighter grey so the open gap reads as a clean pause."),
    "B01": ("ink blue", "#1C2433", "medium olive", "Dark ground for a fine polished box chain."),
    "B02": ("cognac", "#7A4A2A", "light warm", "Warm leather tone; the bright cut curb glitters."),
    "B03": ("olive drab", "#4B4F33", "deep brown", "Muted green behind a brushed ID bar."),
    "B04": ("midnight", "#161B26", "light cool", "Maximum contrast for a thin polished cuff."),
    "B05": ("rust", "#7B3B24", "medium olive", "Warm red earth makes the twisted rope shine."),
    "B06": ("steel blue", "#4C6072", "light warm", "Cool mid blue for the rhythm of the Figaro links."),
    "B07": ("moss", "#3F4A30", "deep brown", "Dark green for the braided wheat texture."),
    "B08": ("deep teal", "#1D4448", "light warm", "Nautical blue-green for an anchor chain."),
    "B09": ("walnut", "#4A3526", "medium olive", "Wood brown behind brushed square tubes."),
    "B10": ("burgundy", "#4E1E2A", "light cool", "Deep wine for open polished links."),
    "E01": ("concrete grey", "#6E6C69", "light warm", "Brushed square on a matte urban grey."),
    "E02": ("dark slate", "#2E3338", "deep brown", "A mirror disc needs a dark ground to glow."),
    "E03": ("denim blue", "#3A4C66", "medium olive", "Workwear blue behind a vertical gold line."),
    "E04": ("bronze brown", "#5E4632", "light cool", "Warm brown so the hexagon edges catch light."),
    "E05": ("black olive", "#2A2C24", "light warm", "Near black for four polished facets."),
    "E06": ("taupe", "#7B6E64", "deep brown", "Soft warm neutral for a plain huggie."),
    "E07": ("navy slate", "#28313F", "light warm", "Dark blue so the fine ribs read."),
    "E08": ("terracotta", "#8A4B36", "medium olive", "Warm clay behind a crisp square hoop."),
    "E09": ("deep spruce", "#203A36", "light cool", "Dark green for a swinging bar."),
    "E10": ("khaki", "#76704F", "deep brown", "Military khaki for a signet face stud."),
}
assert set(PAL) == {i["id"] for i in items}
assert len({p[1] for p in PAL.values()}) == 30, "every listing gets its own ground"

PROPS = ["a small leather valet tray in a deeper shade of the ground", "a closed plain leather notebook with no marks",
         "a folded wool pocket square in a deeper shade of the ground", "a small rough piece of raw slate",
         "a small block of cedar wood", "a coil of thick waxed cotton cord", "a single dried olive branch",
         "a pair of folded leather gloves", "a small smooth river stone", "a plain matte black fountain pen with no marks"]

CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left with "
          "one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")
NO_PEOPLE = {"06", "07", "08", "09"}

HERO_WORDS = [", shown standing upright in a three-quarter view so the square profile shows at the edge",
              ", shown standing upright in a three-quarter view", ", shown in a three-quarter view from slightly above",
              ", shown from slightly above so the gap is visible", ", shown lying at a slight angle so the opening is visible",
              ", laid in a loose open curve with the bar centred", ", laid in a loose open curve",
              "; one stud lies flat, the other stands slightly angled to show the post",
              "; one hoop lies flat, the other stands upright so the square profile shows",
              "; one hoop lies flat, the other stands upright",
              ]


def piece(it):
    s = it["shape"].replace(" lying flat on its side like a coin, its hole facing up; seen from slightly above,", ";")
    for w in HERO_WORDS:
        s = s.replace(w, "")
    for bad in ("shown", "three-quarter", "loose open curve", "lies flat", "stands upright", "like a coin"):
        assert bad not in s, (it["id"], bad, s)
    return s


def single(it):
    """Earring text for ONE earring (worn frames), from the pair text."""
    s = piece(it)
    s = s.replace("a pair of short drop earrings: each has", "a short drop earring with")
    s = re.sub(r"^a pair of ", "one ", s)
    for a, b in (("earrings", "earring"), (" studs", " stud"), (" hoops", " hoop"), ("each face ", "its face "),
                 (", each ", ", "), (" each ", " "), ("posts with butterfly backs", "post with a butterfly back"),
                 ("on gold posts", "on a gold post"), ("it, a slim", "it, a slim"), ("each with a hinged", "with a hinged")):
        s = s.replace(a, b)
    assert "pair" not in s and "each" not in s, (it["id"], s)
    return s


def scale(it):
    t = it["productType"]
    if t == "ring":
        return f"true size {it['dims']}; on the finger it is a slim band no wider than the fingernail of that finger, never chunky"
    if t == "bracelet":
        return f"true size {it['dims']}; on the wrist it is a fine piece, thinner than a pencil, never chunky"
    return f"true size {it['dims']}; in the ear it is small, clearly smaller than the earlobe"


def worn(it):
    skin = PAL[it["id"]][2]
    t = it["productType"]
    if t == "ring":
        return (f"Exactly one ring, worn on the left hand of a man with {skin} skin, on one finger; every other finger "
                f"and the thumb are bare; no other rings, no bracelet, no watch; a man's hand with natural knuckles, "
                f"anatomically correct with exactly five digits, all five visible")
    if t == "bracelet":
        return (f"Exactly one bracelet, worn on the left wrist of a man with {skin} skin, the clasp turned under the "
                f"wrist; the right wrist is bare; no watch, no rings, no other jewelry; anatomically correct hands "
                f"with five fingers")
    return (f"Exactly one earring, worn in the left earlobe of a man with {skin} skin, short cropped hair and light "
            f"stubble; only the left ear is visible, no earring in any other place, no necklace, no other jewelry; "
            f"the face is cropped above the cheekbone so the eyes are not shown")


def world(it, slot):
    bg, hx = PAL[it["id"]][:2]
    base = (f"Colour world, identical in every image of this listing: {bg} ({hx}) and its paler tints and deeper "
            f"shades only, matte stone, wool, linen, leather and wood surfaces")
    if slot == "07":
        return f"{base}; the small prop is the only other element."
    if slot == "08":
        return f"{base}; the natural linen lining is the only accent."
    if slot not in NO_PEOPLE:
        return f"{base}; clothing is tone on tone in the ground colour; nothing else adds colour."
    return f"{base}; nothing but the piece adds colour."


def style(it, slot):
    noun = {"ring": "ring", "bracelet": "bracelet", "earring": "earring"}[it["productType"]]
    skin = " Natural skin texture visible." if slot not in NO_PEOPLE else ""
    return (f"{world(it, slot)} {CAMERA}{skin} The {noun} must be an exact copy of the {noun} in the reference "
            f"image: same outline, same surface finish (brushed stays brushed, polished stays polished), same gold; do "
            f"not redesign it, do not add stones, engraving, charms or texture; take only the {noun} from the "
            f"reference, never its grey stone background, camera angle or framing. Solid gold only, no enamel, no "
            f"colour, no stones. No text, no numbers, no logo, no watermark, no ruler. Square 1:1.")


def worn_slots(it):
    bg = PAL[it["id"]][0]
    t = it["productType"]
    sc = scale(it)
    if t == "ring":
        return {
            "02": ("Hand on wool trousers", f"Worn close-up: his left hand rests flat and relaxed on the thigh of tailored wool trousers in a deeper shade of {bg}, back of the hand to the camera, the thumb visible. {worn(it)}. Cropped tight on the hand; {sc}."),
            "03": ("Rolled linen sleeve", f"Everyday moment: his left forearm with the sleeve of a linen shirt in a paler tint of {bg} rolled to the elbow, the hand resting on the edge of a plain wooden table stained a deep shade of {bg}, back of the hand up, fingers relaxed and slightly apart. {worn(it)}. Seen from slightly above; {sc}."),
            "04": ("Hand from a plinth", f"Studio sculpture: a single left hand and forearm rising vertically out of a smooth square stone plinth the same {bg} as the backdrop, fingers together pointing up, back of the hand to the camera. {worn(it)}. Clean and graphic, nothing else in the frame; {sc}."),
            "05": ("Fingernail scale", f"Scale shot: his left hand lies flat on {bg} wool felt, fingers straight and slightly apart pointing up in the frame, the ringed finger in sharp focus so the band can be compared with the fingernail beside it. {worn(it)}. Close crop from the wrist to the fingertips; {sc}."),
            "10": ("Hand at a suit lapel", f"Editorial detail: his left hand rests flat on the chest against the lapel of a wool suit jacket in a deeper shade of {bg} over a plain shirt in a paler tint, back of the hand to the camera, the thumb visible. {worn(it)}. Cropped from the chin to the chest, face not shown; {sc}."),
        }
    if t == "bracelet":
        return {
            "02": ("Wrist below a rolled sleeve", f"Worn close-up: his left forearm rests on his knee, the sleeve of a linen shirt in a paler tint of {bg} rolled back, the bracelet on the bare wrist just below the cuff, hand relaxed; behind the knee there is only a {bg} wool blanket, no floor and no wood visible. {worn(it)}. Cropped from the forearm to the fingertips; {sc}."),
            "03": ("Hand on a wooden table", f"Everyday moment: his left hand rests flat on the edge of a plain wooden table stained a deep shade of {bg}, the wrist forward and closest to the camera, the bracelet in sharp focus. {worn(it)}. Seen from slightly above; {sc}."),
            "04": ("Wrist from a plinth", f"Studio sculpture: a single left hand and forearm rising vertically out of a smooth square stone plinth the same {bg} as the backdrop, wrist turned so the bracelet faces the camera, fingers relaxed. {worn(it)}. Clean and graphic, nothing else in the frame; {sc}."),
            "05": ("Wrist scale", f"Scale shot: his left wrist rests on {bg} wool felt and the tip of his right index finger touches the wrist beside the bracelet without covering it, so the bracelet can be compared with a fingertip. {worn(it)}. Cropped tight on the wrist; {sc}."),
            "10": ("Jacket cuff", f"Editorial detail: his right hand straightens the cuff of a wool suit jacket in a deeper shade of {bg} on his left arm, the bracelet visible on the left wrist just below the jacket cuff. {worn(it)}. Cropped on the forearms and hands; {sc}."),
        }
    one = single(it)
    return {
        "02": ("Ear above a knit collar", f"Worn close-up: the left side of his head in clean profile, the ear and jaw in sharp focus above the rolled collar of a ribbed wool sweater in a deeper shade of {bg}. {worn(it)}. Cropped from the cheekbone to the collar; {sc}."),
        "03": ("Coat collar turned up", f"Everyday moment: three-quarter rear view of his head and shoulders, the collar of a wool overcoat in {bg} turned up, the left ear and the earring in sharp focus. {worn(it)}. Cropped from the cheekbone to the shoulders; {sc}."),
        "04": ("Profile against the wall", f"Studio portrait: his neck and jaw in clean profile against the {bg} wall, chin slightly lifted, shoulders bare, graphic and minimal, the left ear in sharp focus. {worn(it)}. Cropped at the cheekbone; {sc}."),
        "05": ("Earlobe scale", f"Scale shot: very close on the left ear, the tip of his left index finger resting on the edge of the ear above the earlobe without touching the earring, so the earring can be compared with the fingertip. {worn(it)}. Close crop on the ear; {sc}."),
        "10": ("Shirt collar", f"Editorial detail: the left side of his head and neck above the open collar of a crisp cotton shirt in a paler tint of {bg}, light from the left catching the earring. {worn(it)}. Cropped from the cheekbone to the collar; {sc}."),
    }, one


def slots(idx, it):
    p = piece(it)
    bg, hx = PAL[it["id"]][:2]
    t = it["productType"]
    noun = {"ring": "ring", "bracelet": "bracelet", "earring": "earring"}[t]
    obj = {"ring": f"this {noun} ({p})", "bracelet": f"this {noun} ({p})", "earring": f"this pair of earrings ({p})"}[t]
    stand = {"ring": "stands upright", "bracelet": "lies in a soft open curve, the clasp visible at one end",
             "earring": "lies side by side, one earring flat and one tilted to show the post or closure"}[t]
    three = {"ring": "three identical copies of this exact ring standing upright side by side, same size and same angle",
             "bracelet": "three complete closed bracelets of this exact chain, each its own separate closed oval with its own clasp, lying side by side, same size and same angle, no loose chain pieces",
             "earring": "three identical single earrings of this exact design lying side by side, same size and same angle"}[t]
    rows = []
    w = worn_slots(it)
    if t == "earring":
        w, one = w
    out = [(k, *w[k]) for k in ("02", "03", "04", "05")]
    out += [
        ("06", "Macro on stone",
         f"Macro detail: {obj} on the flat edge of a block of matte {bg} stone; the camera is a few centimetres away so "
         f"the gold surface and its edges fill most of the frame, the rest falling out of focus; one crisp highlight on "
         f"the gold, the surface finish clearly visible; no leather, no wood, no fabric and no other objects, only the stone and the piece."),
        ("07", "Still life",
         f"Minimal still life: on a flat slab of matte {bg} stone, {obj} {stand}, in sharp focus; beside it, small and "
         f"secondary, {PROPS[idx % 10]}; hard directional light casts one long clean shadow; the {noun if t != 'earring' else 'pair of earrings'} "
         f"is the only jewelry in the frame."),
        ("08", "Gift box",
         f"Gift and display: on a dark matte {bg} wooden surface, a small square box in a deeper shade of {bg}, its lid "
         f"off and leaning beside it, lined with natural undyed linen; {obj} sits on the linen in sharp focus; the box "
         f"has no logo and no text."),
        ("09", "Three gold colours",
         (f"Metal colour visualization on a pale {bg} tint stone surface: three separate bracelets of this exact chain lie "
          f"in one horizontal row, each closed into its own round circle with its own clasp, with a wide strip of bare "
          f"stone between the circles so no two bracelets touch: the left circle all yellow gold, the middle circle all "
          f"white gold (cool silvery white), the right circle all rose gold (soft pink gold), every bracelet a single "
          f"metal from end to end; same chain and finish in all three.") if t == "bracelet" else
         f"Metal colour visualization: {three}, on a pale {bg} tint stone surface: left in yellow gold, centre in white "
         f"gold (cool silvery white), right in rose gold (soft pink gold); the shape and finish are identical in all three."),
        ("10", *w["10"][0:2]),
    ]
    for slot, title, text in out:
        if slot in NO_PEOPLE:
            prompt = f"{text} No people and no hands in the frame. {style(it, slot)}"
        else:
            desc = one if t == "earring" else p
            prompt = f"{text} The {noun}: {desc}. {style(it, slot)}"
        for bad in ("—", "–", "â", "loose open curve", "cup", "glass of", "mug", "holding a", "enamel colours"):
            assert bad not in prompt, (it["id"], slot, bad)
        assert hx in prompt, (it["id"], slot)
        if t == "ring" and slot not in NO_PEOPLE:
            assert "all five visible" in prompt and "every other finger and the thumb are bare" in prompt
        if t == "earring" and slot not in NO_PEOPLE:
            assert "pair" not in prompt.split("Colour world")[0], (it["id"], slot)
        rows.append({"slot": slot, "title": title, "prompt": prompt})
    assert [r["slot"] for r in rows] == [f"{n:02d}" for n in range(2, 11)]
    return rows


out = {}
for idx, it in enumerate(items):
    bg, hx, skin, why = PAL[it["id"]]
    out[it["id"]] = {"palette": {"backdrop": bg, "hex": hx, "skin": skin, "why": why}, "shots": slots(idx, it)}
assert len(out) == 30 and sum(len(v["shots"]) for v in out.values()) == 270
json.dump(out, open(HERE / "shots.json", "w"), indent=1, ensure_ascii=False)
lens = [len(r["prompt"]) for v in out.values() for r in v["shots"]]
print(len(out), sum(len(v["shots"]) for v in out.values()), "prompts", min(lens), max(lens), "chars")
