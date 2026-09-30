"""9 sales images per listing (slots 02-10; slot 01 is the existing hero).

Run after catalog.py: python3 docs/artifact-studio/fw2627-enamel/shots.py
Writes shots.json: {id: [{slot, name, prompt, refs:[model ids]}]}.
Every prompt is count 1, nano_banana_2, 2k, 1:1 (owner approval 2026-09-30).

Rules carried from docs/second-brain.md:
- the reference is a tight crop of the hero (piece only), so the hero's framing
  does not leak into the frame; the prompt still says "take the piece, not the scene";
- scale is stated with a number and a known object, never "true scale" alone;
- the ring finger is described anatomically, the other fingers are named bare;
- slot 09 (three metals) is a recolor visualization and the listing says so.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"] if isinstance(cat, dict) else cat
by_id = {i["id"]: i for i in items}

STYLE = ("Calm Artifact Studio home studio photograph: warm off-white linen, plaster and pale oak tones, soft "
         "morning window daylight from the left, gentle natural shadows, shallow depth of field, 50 mm lens look, "
         "fine 35 mm film grain, true colour, natural skin with visible texture, no heavy retouching. "
         "The jewelry must be an exact copy of the piece in the reference image: same outline, same flat glossy "
         "enamel colours and cell layout, same thin polished gold rims, same proportions; do not redesign or add "
         "stones; take only the piece from the reference, never its background, camera angle or framing. "
         "Enamel is perfectly flat and flush, never domed. No text, no logo, no watermark, no brand marks. "
         "Square 1:1.")

RING_HAND = ("worn on the ring finger of a woman's left hand (the fourth finger, between the middle finger and "
             "the little finger); the thumb, index, middle and little fingers are bare; short natural nails with "
             "sheer nude polish")

WORN = {
    "ring": RING_HAND,
    "necklace": "worn by a woman, the pendant resting just below the collarbone on the 16 inch chain, framed from chin to upper chest, face out of frame",
    "earring": "worn on a woman's earlobe, hair tucked behind the ear, close crop of the ear and jawline, face mostly out of frame",
    "bracelet": "worn on a woman's left wrist, hand relaxed and palm down",
}
LIFE = {
    "ring": "the hand wearing it wraps around a handmade stoneware coffee mug, the cuff of a chunky cream wool sweater at the wrist",
    "necklace": "she wears a wide-neck oatmeal wool sweater and a soft camel coat over the shoulders, standing by a window",
    "earring": "she wears a high-neck cream knit and her hair is in a loose low bun, turned three-quarters away from the window",
    "bracelet": "the wrist rests on an open hardcover book, the sleeve of a cream cable-knit sweater pushed back",
}


SCENE_BITS = [  # hero composition phrases that must not leak into worn / styled frames
    (r" laid in a loose (oval|curve)", ""),
    (r"; the chain passes through the bail and curves softly out of the top of the frame", "; the chain passes through the bail"),
    (r" that passes through the bail and curves out of the top of the frame", " that passes through the bail"),
    (r" that curves out of the top of the frame", ""),
    (r" and curves out of the top of the frame", ""),
    (r",? (and )?curves (softly )?out of the top of the frame", ""),
    (r"; the chain curves out of the top of the frame", ""),
    (r", shown standing on its edge in a three-quarter view", ""),
    (r"; one earring lies flat, the other stands slightly angled to show the post", ""),
    (r"; one lies flat, one angled", ""),
]


def shape(it):
    p = it["imagePrompt"]
    s = p.split("fine jewelry piece: ", 1)[1].split(". Solid polished", 1)[0]
    for pat, rep in SCENE_BITS:
        s = re.sub(pat, rep, s)
    for bad in ("of the frame", "laid in", "lies flat", "three-quarter view", "angled"):
        assert bad not in s, (it["id"], bad, s)
    return s


def attach_line(it):
    for line in it["description"].split("\n"):
        if line.startswith(("Earrings:", "Chain:", "Cuff:")):
            return line.split(":", 1)[1].strip().split(";")[0].replace(", sold as a pair", "").rstrip(".")
    return ""


NO_HANDS = {"04-macro", "06-profile", "07-still-life", "09-metals", "10-family"}


def slots(it):
    c = it["productType"]
    cuff = it["listingProtocol"] == "cuff_bracelet"
    s, dims, name = shape(it), it["dims"], it["name"].lower()
    enamel = " and ".join(it["enamel"])
    fam = [by_id[f"{k}{it['id'][1:]}"] for k in "RNEB" if f"{k}{it['id'][1:]}" != it["id"]]
    size_hint = {
        "ring": f"it measures {dims}; the top is about as wide as the fingernail, never larger",
        "necklace": f"the pendant measures {dims}; it is about the size of a fingernail, small against the collarbone",
        "earring": f"{dims}; small on the lobe, never larger than the lobe itself",
        "bracelet": f"{dims}; small and delicate against the wrist",
    }[c]
    profile = {
        "ring": "lying on its side on a small pale travertine block, seen from a low three-quarter angle so both the round band and the depth of the top are visible at once; the underside of the top is closed and solid, not hollow",
        "necklace": "hanging against a pale plaster wall, seen from the side so the thin flat profile of the pendant and the bail with the chain passing through it are clear",
        "earring": f"the pair shown from the back and side on linen so the fitting is clear: {attach_line(it)}",
        "bracelet": ("the open cuff lying on linen seen from above, showing the smooth rounded open ends and the slim 1.6 mm band" if cuff
                     else f"close view of how the bracelet closes: {attach_line(it)}; the fastening in sharp focus on linen"),
    }[c]
    hold = {
        "ring": "held upright between the tips of a woman's thumb and index finger",
        "necklace": "the pendant lying flat on the open palm of a woman's hand, chain trailing off the palm",
        "earring": "one earring resting on the tip of a woman's index finger",
        "bracelet": "the bracelet draped over the open palm of a woman's hand",
    }[c]
    many = "three pairs" if c == "earring" else "three"
    out = [
        ("02-worn", f"This piece, {s}, {WORN[c]}; " + ("resting on a warm linen tablecloth by a window, " if c in ("ring", "bracelet") else "soft window light, ") + f"close crop, the piece in sharp focus; {size_hint}."),
        ("03-lifestyle", f"This piece, {s}, {WORN[c]}; {LIFE[c]}; an autumn morning at home, the piece catching the window light, small and true to scale ({dims})."),
        ("04-macro", f"Macro detail of this piece, {s}: it lies flat on warm off-white linen and the camera is a few centimetres above at a slight angle, so the {enamel} enamel and its thin polished gold rim fill most of the frame; the flat glass surface shows one soft window reflection."),
        ("05-scale", f"Scale shot: this piece, {s}, {hold}; {size_hint}; plain warm linen background."),
        ("06-profile", f"This piece, {s}: {profile}."),
        ("07-still-life", f"Home still life: this piece, {s}, resting in a small handmade off-white ceramic trinket dish on a linen runner, a sprig of dried eucalyptus and a folded linen napkin beside it, three-quarter view from above."),
        ("08-gift", f"Gift moment: this piece, {s}, sitting in an open small jewelry box lined with natural undyed linen, a thin cream silk ribbon loosely beside the box on a pale oak table, holiday morning mood; the box has no logo and no text."),
        ("09-metals", f"Metal colour visualization: {many} identical copies of this exact piece, {s}, side by side on warm linen at the same size and angle: left in yellow gold, centre in white gold (cool silvery white), right in rose gold (soft pink gold); the {enamel} enamel is identical in all of them; even soft light."),
        ("10-family", f"Collection styling: this {name} in sharp focus in the foreground on warm linen, and behind it, softly out of focus, its matching pieces from the same collection: "
                      + "; ".join(f"{f['name'].lower()} ({shape(f)})" for f in fam)
                      + f". All share the same {enamel} enamel; the {name} is clearly the hero of the frame."),
    ]
    rows = []
    for slot, text in out:
        refs = [it["id"]] + ([f["id"] for f in fam] if slot == "10-family" else [])
        if slot in NO_HANDS:
            text += " No hands and no people in the frame."
        prompt = text + " " + STYLE
        for b in ("—", "–", "â"):
            assert b not in prompt, (it["id"], slot)
        rows.append({"slot": slot, "prompt": prompt, "refs": refs})
    assert len(rows) == 9
    return rows


shots = {it["id"]: slots(it) for it in items}
assert len(shots) == 40 and sum(len(v) for v in shots.values()) == 360
json.dump(shots, open(HERE / "shots.json", "w"), indent=1, ensure_ascii=False)
print(len(shots), sum(len(v) for v in shots.values()))
