"""10 Etsy sales frames per evil eye listing (300), each listing in its own colour world.

Run after hero_prompts.py: python3 docs/artifact-studio/evil-eye/shots.py
Writes shots.json: {id: {"palette": {...}, "shots": [{slot, title, prompt}]}}.
Each prompt is one generation: nano_banana_2, 2k, 1:1, count 1. The only reference image is a tight crop
of that listing's approved hero (heroes.json, generated from text first), cut to the piece so no paper
or framing leaks into the frame (docs/second-brain.md, Comet 2026-09-27). Nothing here calls a model.

Same system as xmas26 and SS27 v3: a seamless single-colour ground per listing, paper-sculpture product
frames in shades of that colour, editorial worn frames, a gift frame and a three-metal frame. The evil
eye world comes from Aegean and Mediterranean materials and props (linen, silk, sea salt, olive, figs,
a brass dish), never from glass beads, red string or hamsas, so the piece stays the brightest point.

Colour rules (jewelry colour theory, as SS27 and xmas26):
1. Gold reads richest on deep jewel tones and warm mid-tones; no ground is white, cream or yellow.
2. Cobalt-led pieces (Halka, Damla, Mati, Bead String, Mother and Child, Medal) sit on complementary or
   split complementary warm grounds: terracotta, apricot, clay, rust, brick, cognac; never saffron.
3. Cini (turquoise) sits on warm corals and plums; Sweetheart (red) on cool greens and teals; Paperclip
   (pink) on deep greens and navy; the metal-only Twin Wire on the deepest grounds.
4. 30 distinct grounds, at least 14 Delta E apart inside a family (asserted).
5. One accent: the ribbon echoes an enamel colour or stays a deeper shade of the ground; nails are bare
   except the Valentine families (Sweetheart red, Paperclip pink).

Rules carried from the spec's Image notes and docs/second-brain.md:
- take only the piece from the reference, never its paper, angle or framing;
- the piece text is the hero's `shape`, which carries no composition words (asserted here again);
- rings: the left hand, the ring finger named by anatomy, every other finger and the thumb declared bare
  (Cartouche 2026-09-26). The Christmas R01 test showed the model still picks the finger in the middle of
  the frame; no listing promises a finger, so QA accepts the ring or middle finger and rejects a second
  ring, a hand without five digits, wrong scale or a redesigned piece. No cup or glass in a ringed hand;
- necklaces: nothing above the chin (xmas26 QA rejected lips and profiles); no profile slot;
- exactly one piece in every worn frame; scale is a number plus a known object, never larger;
- product frames name the chain as one single strand (xmas26 QA: doubled chains), the gift surface shows
  no reflections (xmas26 QA: ghost rings), and slot 09 is a full-bleed image of three copies whose metals
  are named part by part (two-tone) or whole (single metal); station pieces show one station per metal;
- counts of three or fewer per group; never "two tone" or "mixed metal" in a prompt.
"""
import itertools, json, pathlib, re

HERE = pathlib.Path(__file__).parent
heroes = json.load(open(HERE / "heroes.json"))
items = heroes["items"]
BY_ID = {i["id"]: i for i in items}

# id: (ground, hex, ribbon accent ("nude" = a deeper shade of the ground), nails ("bare" or a colour), skin, why)
PAL = {
    "R01": ("terracotta", "#B95B45", "cobalt blue", "bare", "light warm", "Fired clay opposite cobalt: the blue ring pops and the white gold ring reads as cool grey metal beside the yellow collar."),
    "N01": ("apricot", "#F0B48A", "sky blue", "bare", "medium olive", "A light warm complement for the largest disc; sky blue and both golds stay clear at thumbnail size."),
    "B01": ("dark umber", "#3E2C22", "nude", "bare", "deep brown", "Deep warm brown, so the yellow collar and the white gold ring separate on a fine chain."),
    "R02": ("persimmon", "#D2643A", "nude", "bare", "deep brown", "Saturated orange, the direct complement of cobalt, for the smallest teardrop."),
    "N02": ("salmon clay", "#D88A78", "cobalt blue", "bare", "fair", "Soft red-orange clay; the white band stays brighter than the ground and the cobalt pops."),
    "B02": ("mahogany", "#551C17", "porcelain white", "bare", "warm tan", "Deep red-brown: the white band and the solid gold point glow on a dark warm ground."),
    "R03": ("blush peach", "#EBB19E", "porcelain white", "bare", "medium olive", "Soft bridal peach, split complementary to cobalt; the white cells keep their edge at this value."),
    "N03": ("brick", "#9C4433", "cobalt blue", "bare", "deep brown", "Red-orange brick: the white cells and the cobalt ring both read on a mid-dark warm ground."),
    "B03": ("caramel", "#A9784F", "nude", "bare", "light warm", "Warm caramel, a Mediterranean mid-tone; white and cobalt are the only cool notes."),
    "R04": ("tangerine clay", "#E08A55", "cobalt blue", "bare", "warm tan", "Summer orange opposite cobalt; the gold balls glow like sun on clay."),
    "N04": ("sand clay", "#C49A7A", "nude", "bare", "light warm", "Sun-baked sand clay, a soft warm mid-tone; the three cobalt discs are the only cool points."),
    "B04": ("burnt orange", "#A65424", "cobalt blue", "bare", "fair", "A deep orange complement: the cobalt stations are the only cool points on the wrist."),
    "R05": ("coral", "#E27D67", "turquoise", "bare", "fair", "Warm coral opposite turquoise and cobalt; both glazes pop."),
    "N05": ("deep plum", "#4F2140", "turquoise", "bare", "warm tan", "Dark plum: the turquoise ring is the brightest point and the gold glows."),
    "B05": ("dusty plum", "#8A5A78", "nude", "bare", "medium olive", "Muted red-violet opposite turquoise, soft enough for three small hexagons."),
    "R06": ("dusty rose", "#CC9590", "sky blue", "bare", "deep brown", "Soft warm rose for a new mother's gift; cobalt and sky stay clear and both golds read."),
    "N06": ("rosewood", "#82504A", "nude", "bare", "light warm", "A pink-brown mid-dark ground: the small white gold disc reads as cool metal below the yellow."),
    "B06": ("cognac", "#7E4423", "sky blue", "bare", "warm tan", "Warm leather brown: both discs and both golds separate on the wrist."),
    "R07": ("walnut", "#614532", "nude", "bare", "medium olive", "Dark warm wood: the satin yellow face and the polished white gold almond both read."),
    "N07": ("chestnut", "#5B2C16", "cobalt blue", "bare", "fair", "Deep red-brown for the largest disc; the ridged edge catches the light."),
    "B07": ("rust red", "#803022", "nude", "bare", "deep brown", "Dark rust, warm against cobalt; the small disc glows on the wrist."),
    "R08": ("espresso", "#2B1D17", "nude", "bare", "warm tan", "Near-black warm brown: yellow and white gold separate by tone alone, with no colour to compete."),
    "N08": ("midnight ink", "#161C2C", "nude", "bare", "deep brown", "Blue-black ink: the white gold ring reads bright and the yellow rim glows."),
    "B08": ("oxblood", "#3D1418", "nude", "bare", "light warm", "Deep wine red, the darkest warm ground, for a cuff of two wires."),
    "R09": ("jade green", "#3E7A68", "poppy red", "poppy red", "light warm", "Complementary: poppy red on cool jade; the gold heart glows."),
    "N09": ("deep teal", "#1E5459", "poppy red", "poppy red", "medium olive", "Dark blue-green opposite red; the heart is the warmest point in the image."),
    "B09": ("eucalyptus", "#8CAE9F", "poppy red", "poppy red", "fair", "Soft grey-green with a value gap, so the small red ring stays crisp."),
    "R10": ("emerald", "#1F6A50", "petal pink", "petal pink", "deep brown", "Complementary: petal pink on emerald, the classic pink and green pairing."),
    "N10": ("navy", "#1D2A4D", "petal pink", "petal pink", "warm tan", "Deep navy: pink and white both read as light and the gold links glow."),
    "B10": ("dark forest", "#233826", "petal pink", "petal pink", "medium olive", "Dark green opposite pink; the white ring is the brightest point."),
}

# Still life prop for slot 07, per family: Aegean and Mediterranean life, small and secondary.
PROPS = {
    1: "a small round brass dish with a pinch of coarse sea salt in it",
    2: "a small old brass door key and a short sprig of olive leaves",
    3: "a short sprig of white orange blossom",
    4: "two smooth sea-worn pebbles and a scatter of coarse sea salt",
    5: "a small hammered copper coffee pot with a long handle",
    6: "a small sprig of white jasmine flowers and a folded square of natural linen",
    7: "a small sprig of bay laurel leaves",
    8: "a small piece of sun-bleached driftwood",
    9: "half a fresh pomegranate showing its red seeds",
    10: "a fresh fig split open and a few dried pink rose petals",
}
VALENTINE = {9: "red", 10: "pink"}  # rose petals in the gift frame, only for the January (Valentine's) families

CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left with "
          "one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")
WHITE_GOLD = "polished unplated white gold, a soft warm grey metal with mirror reflections"
NO_PEOPLE = {"01", "06", "07", "08", "09"}
NOUN = {"ring": "ring", "necklace": "necklace", "bracelet": "bracelet"}
CROP = "the top edge of the image cuts across the middle of the neck, so the chin, the lips and the face are outside the image"
RING_FINGER = "on the ring finger, the fourth finger counting from the thumb, between the middle finger and the little finger"
RING_BARE = "the thumb, the index finger, the middle finger and the little finger are completely bare"


# ---------------------------------------------------------------- palette checks
def lab(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = lin(r), lin(g), lin(b)
    x, y, z = ((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b,
               (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883)
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def delta_e(a, b):
    return sum((p - q) ** 2 for p, q in zip(lab(a), lab(b))) ** 0.5


assert set(PAL) == set(BY_ID), "a palette for every listing"
assert len({p[1] for p in PAL.values()}) == 30 and len({p[0] for p in PAL.values()}) == 30, "30 distinct grounds"
for k, (bg, hx, *_rest) in PAL.items():
    assert re.fullmatch(r"#[0-9A-F]{6}", hx), k
    assert not re.search(r"white|cream|ivory|yellow|saffron|lemon|butter|beige|grey|gray", bg), (k, "ground colour rule")
    L, a, b = lab(hx)
    assert L <= 80, (k, "too pale: reads as cream")
fams = {}
for k in PAL:
    fams.setdefault(BY_ID[k]["familyNo"], []).append(k)
for f, ks in fams.items():
    for x, y in itertools.combinations(ks, 2):
        assert delta_e(PAL[x][1], PAL[y][1]) >= 14, (f, x, y, "grounds too close inside a family")
    assert len({PAL[k][4] for k in ks}) == 3, (f, "three different skin tones per family")
assert min(delta_e(PAL[x][1], PAL[y][1]) for x, y in itertools.combinations(PAL, 2)) >= 8, "grounds too close"
WARM = {1, 2, 3, 4, 6, 7}
for k, (bg, hx, *_rest) in PAL.items():
    L, a, b = lab(hx)
    f = BY_ID[k]["familyNo"]
    if f in WARM:
        assert a > 5 and b > 5, (k, "cobalt pieces need a warm ground")
    if f in (9, 10):
        assert a < 10 and (a < 0 or b < -10), (k, "red and pink pieces need a cool green, teal or navy ground")
    if f == 5:
        assert a > 20, (k, "turquoise needs coral or plum")
    if f == 8:
        assert L < 16, (k, "the metal-only family gets the deepest grounds")
skins = [p[4] for p in PAL.values()]
assert len(set(skins)) == 5 and min(skins.count(s) for s in set(skins)) >= 5, "skin tones varied across the set"
assert {i["familyNo"] for i in items} == set(PROPS)


# ---------------------------------------------------------------- text helpers
def ribbon(it):
    bg, _, accent = PAL[it["id"]][:3]
    return f"a satin ribbon in a deeper shade of {bg}" if accent == "nude" else f"a {accent} satin ribbon"


def nails(it):
    n = PAL[it["id"]][3]
    return "bare natural nails" if n == "bare" else f"short natural nails painted {n}"


def colours(it):
    out = []
    for e in it["enamel"]:
        name = {"white": "porcelain white", "sky": "pale sky blue"}.get(e["key"], e["name"])
        out.append(f"{name} ({e['hex']})")
    return ", ".join(out)


def scale(it):
    t = it["productType"]
    if t == "ring":
        return f"{it['scale']}, on a slim band"
    if it["kind"] == "cuff":
        return f"{it['scale']}, on two fine wires 1 mm thick, slim against the wrist bone"
    if t == "bracelet":
        return f"{it['scale']}, and the chain is a 1.1 mm thread of gold, fine against the wrist bone"
    return f"{it['scale']}, on a fine 1.2 mm chain, small against the collarbones"


def worn(it):
    skin = PAL[it["id"]][4]
    t, m = it["productType"], it["motif"]
    if t == "ring":
        return (f"Exactly one ring, worn on the left hand of a woman with {skin} skin, {RING_FINGER}; {RING_BARE}; no "
                f"other rings, no bracelet, no watch, no other jewelry; anatomically correct hand with exactly five "
                f"digits, all five visible")
    if it["kind"] == "cuff":
        return (f"Exactly one cuff bracelet, worn on the left wrist of a woman with {skin} skin, the disc on top of the "
                f"wrist facing the camera and the opening of the cuff turned under the wrist; no clasp and no chain; "
                f"the right wrist is bare; no watch, no rings, no other jewelry; anatomically correct hands with five "
                f"fingers")
    if t == "bracelet":
        return (f"Exactly one bracelet, worn on the left wrist of a woman with {skin} skin, {m} on top of the wrist "
                f"facing the camera and the clasp turned under the wrist; the right wrist is bare; no watch, no rings, "
                f"no other jewelry; anatomically correct hands with five fingers")
    return (f"Exactly one necklace, worn by a woman with {skin} skin, {it['wear']}; no earrings, no other necklace, no "
            f"other jewelry; {CROP}")


def world(it, slot):
    bg, hx = PAL[it["id"]][:2]
    base = (f"Colour world, identical in every image of this listing: {bg} ({hx}) and its slightly lighter and "
            f"deeper shades only, matte paper, linen and silk surfaces; the backdrop is never white, cream or grey")
    if slot == "01":
        return f"{base}; the small out-of-focus olive sprig is the only other colour."
    if slot == "07":
        return f"{base}; the small prop is the only other colour."
    if slot == "08":
        return f"{base}; the white card, the satin ribbon and the natural linen lining are the only accents."
    if slot not in NO_PEOPLE:
        gift = "; the satin ribbon is the only other accent" if slot == "03" and it["productType"] != "necklace" else ""
        return (f"{base}; the wall and the floor behind her are the same {bg}; clothing is tone on tone in the ground "
                f"colour; {nails(it)}{gift}; nothing else adds colour.")
    return f"{base}; nothing but the piece adds colour."


def metal_note(it, slot):
    if slot == "09":
        return "only the metals change, exactly as named for each copy"
    if it["twoTone"]:
        m = it["metals"]
        return f"the same metal on every part ({m['bodyParts']} in yellow gold, {m['accentParts']} in white gold)"
    return "the same 14K yellow gold"


def style(it, slot):
    noun = NOUN[it["productType"]]
    if it["enamel"]:
        look = "same enamel colours and cell layout, same thin polished rims"
        finish = ("The enamel is perfectly flat, glossy and flush with the metal, never domed, no gradient, no shading, "
                  "no painted detail, no stones; no eyelashes, no eyelid line, no realistic iris.")
    else:
        look = "same flush inlaid ring and slightly raised centre dot"
        finish = (f"The {noun} is solid gold only, with no enamel, no colour and no stones; no eyelashes, no eyelid "
                  f"line, no realistic iris.")
    skin = " Natural skin texture visible." if slot not in NO_PEOPLE else ""
    return (f"{world(it, slot)} {CAMERA}{skin} The {noun} must be an exact copy of the {noun} in the reference image: "
            f"same outline and proportions, {look}, {metal_note(it, slot)}; do not redesign it, do not add charms, "
            f"motifs or stones; take only the {noun} from the reference, never its paper background, camera angle or "
            f"framing. {finish} No text, no numbers, no logo, no watermark, no ruler. Square 1:1.")


def worn_slots(it):
    bg = PAL[it["id"]][0]
    t, m = it["productType"], it["motif"]
    sc, w = scale(it), worn(it)
    them = "them" if re.match(r"the (two|three) |.* and its ", m) else "it"
    box = f"a small gift box wrapped in matte {bg} paper"
    if t == "ring":
        return {
            "02": ("Hand on linen trousers", f"Worn close-up: her left hand rests relaxed on the knee of loose linen trousers in a deeper shade of {bg}, back of the hand to the camera, fingers straight and slightly apart, the thumb visible, the ring finger at the centre of the image; seen from slightly above. {w}. Cropped tight on the hand; {sc}."),
            "03": ("Hand on a wrapped gift", f"Gift moment: her left hand lies flat on the lid of {box} tied with {ribbon(it)}, back of the hand to the camera, fingers straight and slightly apart pointing up in the image, away from the camera, the ring finger at the centre; nothing is held. {w}. Seen from above on the {bg} floor; {sc}."),
            "04": ("Hand from a plinth", f"Studio sculpture: a single left hand and forearm rising vertically out of a smooth cylindrical plinth painted the same {bg} as the backdrop, fingers together pointing up, back of the hand to the camera. {w}. Clean and graphic, nothing else in the image; {sc}."),
            "05": ("Fingernail scale", f"Scale shot: her left hand rests flat on {bg} linen, seen from directly above, fingers straight and slightly apart pointing up in the image, the ring finger at the centre and in sharp focus, so the top of the ring can be compared with the fingernails beside it. {w}. Close crop from the wrist to the fingertips; {sc}."),
            "10": ("Hand at a silk collar", f"Editorial portrait detail: her left hand rests flat on her chest at the open collar of a silk shirt in a deeper shade of {bg}, back of the hand to the camera, the thumb visible. {w}. Cropped from the middle of the neck to the chest, so the chin, the lips and the face are outside the image; {sc}."),
        }
    if t == "bracelet":
        return {
            "02": ("Wrist below a linen cuff", f"Worn close-up: her left forearm rests on her knee, the cuff of a loose linen shirt in a deeper shade of {bg} rolled back, the bracelet on the bare wrist just below the cuff, hand relaxed; behind the knee there is only {bg} linen, no floor and no wood visible. {w}. Cropped from the forearm to the fingertips; {sc}."),
            "03": ("Tying a gift ribbon", f"Gift moment: both hands tie {ribbon(it)} around {box}, the left wrist forward and closest to the camera. {w}. Seen from above at a slight angle on the {bg} floor; {sc}."),
            "04": ("Wrist from a plinth", f"Studio sculpture: a single left hand and forearm rising vertically out of a smooth cylindrical plinth painted the same {bg} as the backdrop, the wrist turned so the bracelet faces the camera, fingers relaxed. {w}. Clean and graphic, nothing else in the image; {sc}."),
            "05": ("Fingernail scale", f"Scale shot: her left wrist rests on {bg} linen and the tip of her right index finger touches the wrist beside {m}, never covering {them}, so {m} can be compared with the fingernail. {w}. Cropped tight on the wrist; {sc}."),
            "10": ("Hand at a silk collar", f"Editorial portrait detail: her left hand rests at the open collar of a silk shirt in a deeper shade of {bg}, the wrist turned to the camera. {w}. Cropped from the middle of the neck to the chest, so the chin, the lips and the face are outside the image; {sc}."),
        }
    return {
        "02": ("Open linen collar", f"Worn portrait: she wears a loose linen shirt in a deeper shade of {bg}, open at the neck so the collarbones and {m} sit on bare skin. {w}. Straight-on; {sc}."),
        "03": ("Silk neckline", f"Evening look: a silk slip dress in {bg} with a low square neckline, {m} on bare skin above it. {w}. A three-quarter view of the torso; {sc}."),
        "04": ("Lying on linen", f"Seen from directly above: she lies on her back on softly rumpled {bg} linen, shoulders bare, arms relaxed at her sides, {m} resting flat on her skin. {w}. {sc[0].upper() + sc[1:]}."),
        "05": ("Fingernail scale", f"Scale shot: the tip of her right index finger rests on the collarbone a few millimetres from {m}, never covering {them}, so {m} can be compared with the fingernail; bare shoulders; seen from a low three-quarter angle and closer than a portrait. {w}. Close crop on the collarbones; {sc}."),
        "10": ("Open blazer", f"Evening detail: an open tailored blazer in a deeper shade of {bg} over bare collarbones, {m} at the centre of the open collar. {w}. {sc[0].upper() + sc[1:]}."),
    }


def three_metals(it):
    """Slot 09: three copies; two-tone copies name every part's metal, single-metal copies are one metal each."""
    t, m, kind = it["productType"], it["motif"], it["kind"]
    noun = NOUN[t]
    if it["station"]:
        copies = (f"three single stations of this {noun} lie in one row with a wide strip of bare paper between them, "
                  f"same size and same angle, each {it['station']}, with a short end of fine chain on both sides")
    elif kind == "cuff":
        copies = ("three separate cuffs of this exact design stand in one row on their open backs, the disc of each "
                  "facing the camera, with a wide strip of bare paper between them so no two cuffs touch")
    elif t == "ring":
        copies = ("three identical copies of this exact ring stand upright side by side with space between them, same "
                  "size and same angle")
    elif t == "bracelet":
        copies = (f"three separate bracelets of this exact design lie in one horizontal row, each closed into its own "
                  f"round circle with its own clasp and {m} at the front of the circle, with a wide strip of bare paper "
                  f"between the circles so no two bracelets touch")
    else:
        copies = (f"three identical copies of this exact necklace lie side by side, {m} of each at the bottom and its "
                  f"chain running straight up and away as one single strand, same size and same angle, with space "
                  f"between them so no two chains touch")
    if it["twoTone"]:
        b, a = it["metals"]["bodyParts"], it["metals"]["accentParts"]
        metals = (f"the left copy has {b} in yellow gold and {a} in white gold; the centre copy has {b} in white gold "
                  f"and {a} in yellow gold; the right copy has {b} in rose gold and {a} in white gold; white gold is "
                  f"always {WHITE_GOLD}, and rose gold is a soft pink gold; every part is one single metal")
    else:
        metals = (f"the left copy in polished yellow gold, the centre copy in {WHITE_GOLD}, the right copy in polished "
                  f"rose gold, a soft pink gold; each copy is one single metal from end to end")
    enamel = (f"; the enamel colours stay exactly the same in all three: {colours(it)}" if it["enamel"]
              else "; no enamel in any copy")
    return copies, metals + enamel


def slots(it):
    p = it["shape"]
    bg, hx = PAL[it["id"]][:2]
    t, m, kind = it["productType"], it["motif"], it["kind"]
    noun = NOUN[t]
    fam = it["familyNo"]
    surface = ("the flat glossy enamel and its thin polished rims" if it["enamel"]
               else "the polished metal and the flush inlaid ring")
    single = "one single strand whose two halves run straight up and apart like the arms of a letter V and leave the image at the top edge, never doubled, never coiled, never a second loop"
    if kind == "cuff":
        lie = "stands on its open back on the paper floor, the disc at the front facing the camera"
        drape = f"this cuff ({p}) sits astride the crest of the arc, the disc at the front facing the camera"
        card = f"this cuff ({p}) standing on its open back in front of a small plain white folded card, the disc facing the camera"
    elif t == "ring":
        lie = "stands upright on the paper floor, its top facing the camera"
        drape = f"this ring ({p}) stands upright on the crest of the arc, its top facing the camera"
        card = f"this ring ({p}) standing in a slit cut in the ridge of a small plain white folded card"
    elif t == "bracelet":
        lie = (f"lies in one soft open curve on the paper floor, one continuous chain from end to end, {m} face up at "
               f"the centre of the curve and the clasp at one end")
        drape = f"this bracelet ({p}) is draped over its top edge so the chain hangs in a soft V with {m} at the front"
        card = f"this bracelet ({p}) draped over the ridge of a small plain white folded card, {m} at the front"
    elif kind == "lariat":
        lie = (f"lies face up on the paper floor, the drop running straight down from the gold ball to the almond and "
               f"the chain rising from the ball as {single}")
        drape = (f"this necklace ({p}) is draped over its top edge so the chain hangs in a V, the gold ball at the "
                 f"lowest point and the drop with the almond hanging straight below it")
        card = f"this necklace ({p}) draped over the ridge of a small plain white folded card, the drop and the almond hanging at the front"
    else:
        lie = f"lies face up on the paper floor with {m} at the bottom and the chain leaving it as {single}"
        drape = (f"this necklace ({p}) is draped over its top edge so the chain hangs in a V and {m} "
                 + ("hangs free at the lowest point" if kind == "pendant" else "sits at the lowest point"))
        card = f"this necklace ({p}) draped over the ridge of a small plain white folded card, {m} hanging at the front"
    petals = (f", and a few dried {VALENTINE[fam]} rose petals scattered beside the box" if fam in VALENTINE else "")
    copies, metals = three_metals(it)
    w = worn_slots(it)
    out = [
        ("01-hero", "Hero on a paper wave",
         f"Etsy thumbnail hero: a sheet of {bg} paper curls in one soft wave across the top of the image over a floor of "
         f"{bg} paper one shade lighter; this {noun} ({p}) {lie}, seen from slightly above, in sharp focus at the centre "
         f"with generous empty space around it, one clean soft shadow under the curl; one short sprig of olive leaves "
         f"lies far in a corner, out of focus."),
        ("02-" + w["02"][0].lower().replace(" ", "-"), w["02"][0], w["02"][1]),
        ("03-" + w["03"][0].lower().replace(" ", "-"), w["03"][0], w["03"][1]),
        ("04-" + w["04"][0].lower().replace(" ", "-"), w["04"][0], w["04"][1]),
        ("05-scale", w["05"][0], w["05"][1]),
        ("06-macro", "Close detail on paper hills",
         f"Close detail: this {noun} ({p}), {m} resting on the crest of layered curved paper cut-outs in graduated "
         f"shades of {bg}, like soft hills; the camera is only a few centimetres away, so {m} and {surface} fill most "
         f"of the image from edge to edge, the rest falling softly out of focus; one crisp highlight on the metal; no "
         f"fabric, no wood and no other objects, only the paper and the piece."),
        ("07-still", "Aegean still life",
         f"Paper sculpture still life: a wide ribbon of {bg} paper curls in one sweeping arc through the image; {drape}, "
         f"in sharp focus; below it on the curved paper floor, {PROPS[fam]}, small and secondary; hard directional "
         f"light casts one long curved shadow; the {noun} is the only piece of jewelry in the image."),
        ("08-gift", "Gift box and card",
         f"Gift and display: on a smooth semi-matte lacquered {bg} surface that shows no reflections, {card}; beside it "
         f"a small square gift box wrapped in matte {bg} paper, its lid off, lined with natural undyed linen, and "
         f"{ribbon(it)} curling loose across the surface{petals}; the card and the box have no logo and no text; the "
         f"{noun} appears only once in the image."),
        ("09-metals", "Three metal pairs" if it["twoTone"] else "Three gold colours",
         f"Metal colour visualization on {bg} paper one shade lighter, a curl of {bg} paper at the top edge: {copies}: "
         f"{metals}. A full-bleed photograph that fills the whole square, no border, no mat, no inset."),
        ("10-" + w["10"][0].lower().replace(" ", "-"), w["10"][0], w["10"][1]),
    ]
    rows = []
    for slot, title, text in out:
        if slot[:2] in NO_PEOPLE:
            prompt = f"{text} No people and no hands in the image. {style(it, slot[:2])}"
        else:
            prompt = f"{text} The {noun}: {p}. {style(it, slot[:2])}"
        check(it, slot, prompt)
        rows.append({"slot": slot, "title": title, "prompt": prompt})
    assert [r["slot"][:2] for r in rows] == [f"{n:02d}" for n in range(1, 11)], it["id"]
    assert len({r["slot"] for r in rows}) == 10 and len({r["prompt"] for r in rows}) == 10, it["id"]
    return rows


# ---------------------------------------------------------------- rules, asserted on every prompt
BANNED = [r"\biznik\b", r"\btiles?\b", r"satellite", r"paperclip", r"\bcoins?\b", r"signet", r"bezel", r"\bcups?\b",
          r"set like a stone", r"toi et moi", r"nazar", r"bead", r"two[ -]?tone", r"mixed[ -]metal", r"hamsa",
          r"glass", r"red string", r"evil eye", r"pupil", r"sclera", r"bicolou?r", r"swap", r"revers", r"\bmug\b",
          r"holding a", r"christmas", r"\bfir\b", r"fairy light", r"snow", r"velvet", r"width of a fingertip",
          r"size of a fingertip", r"loose oval", r"out of the top of the frame", "\u2014", "\u2013", "\u00e2"]
NEGATED_ONLY = ["no eyelashes", "no eyelid line", "no realistic iris"]
COMPOSITION = [r"\bframe\b", r"loose oval", r"\bshown\b", r"three-quarter", r"camera", r"\bview\b", r"centred",
               r"from above", r"background", r"paper", r"\blaid\b", r"\blies\b", r"resting", r"\bstands\b",
               r"\bimage\b", r"photograph", r"\bseen\b"]
COUNT_WORDS = r"\b(four|five|six|seven|eight|nine|ten|eleven|twelve|dozen)\b"
COUNT_OK = ["six equal straight sides", "four flat zones", "five flat zones", "exactly five digits",
            "all five visible", "with five fingers"]


def check(it, slot, prompt):
    low = prompt.lower()
    key = (it["id"], slot)
    for b in BANNED:
        assert not re.search(b, low), (key, "banned", b)
    rest = low
    for n in NEGATED_ONLY:
        rest = rest.replace(n, "")
    assert not re.search(r"lash|eyelid|lid line|\biris", rest), (key, "eye feature outside a negation")
    rest = low
    for ok in COUNT_OK:
        rest = rest.replace(ok, "")
    assert not re.search(COUNT_WORDS, rest), (key, "count over three", re.search(COUNT_WORDS, rest))
    assert PAL[it["id"]][1] in prompt, (key, "ground hex")
    assert f"take only the {NOUN[it['productType']]} from the reference" in prompt, key
    assert "no eyelashes, no eyelid line, no realistic iris" in low, key
    if slot[:2] in NO_PEOPLE:
        assert "No people and no hands in the image." in prompt, key
        assert "woman" not in low, key
    else:
        noun = "cuff bracelet" if it["kind"] == "cuff" else NOUN[it["productType"]]
        assert f"Exactly one {noun}, worn" in prompt, (key, "exactly one piece")
        assert low.count("exactly one") == 1, (key, "one worn clause")
        if it["productType"] == "ring":
            assert RING_FINGER in prompt and RING_BARE in prompt and "all five visible" in prompt, (key, "ring anatomy")
            assert "left hand" in prompt, key
        elif it["productType"] == "bracelet":
            assert "left wrist" in prompt and "the right wrist is bare" in prompt, (key, "bracelet wrist")
        else:
            assert CROP in prompt, (key, "nothing above the chin")
    if slot.startswith("09"):
        assert "full-bleed" in low and "three" in low, key
        if it["twoTone"]:
            for c in ("left copy", "centre copy", "right copy", "yellow gold", "white gold", "rose gold", WHITE_GOLD):
                assert c in prompt, (key, c)
            assert it["metals"]["bodyParts"] in prompt and it["metals"]["accentParts"] in prompt, key
        else:
            assert WHITE_GOLD in prompt and "rose gold" in prompt and "one single metal" in prompt, key
        if it["station"]:
            assert "single stations" in prompt and it["station"] in prompt, (key, "one station per metal")
    if it["twoTone"]:
        assert WHITE_GOLD in prompt, (key, "white gold is metal, named")


for it in items:
    for c in COMPOSITION:
        assert not re.search(c, it["shape"].lower()), (it["id"], "composition word in the piece text", c)
    for b in BANNED + [r"glass", r"hamsa", r"red string", r"bead"]:
        assert not re.search(b, PROPS[it["familyNo"]].lower()), (it["id"], "prop", b)

out = {}
for it in items:
    bg, hx, accent, nail, skin, why = PAL[it["id"]]
    out[it["id"]] = {"palette": {"backdrop": bg, "hex": hx, "accent": accent, "nails": nail, "skin": skin, "why": why,
                                 "prop": PROPS[it["familyNo"]]},
                     "shots": slots(it)}
assert len(out) == 30 and sum(len(v["shots"]) for v in out.values()) == 300
json.dump(out, open(HERE / "shots.json", "w"), indent=1, ensure_ascii=False)
lens = [len(r["prompt"]) for v in out.values() for r in v["shots"]]
print("shots.json", len(out), "listings,", sum(len(v["shots"]) for v in out.values()), "prompts;", min(lens), max(lens),
      "chars")
