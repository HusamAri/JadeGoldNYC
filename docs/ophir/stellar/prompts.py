"""The Stellar Line (Ophir Gold USA): 10 image prompts for each of the 5 products, 50 in all.

Run: python3 docs/ophir/stellar/prompts.py  -> prompts.json + image-prompts.md
Nothing here calls a model. Each prompt is one generation: nano_banana_2, resolution 2k, 1:1, count 1.
resolution MUST be passed explicitly -- the model defaults to 1k (1024 px), too small for an Etsy image.
See images/jobs.json for the exact params and the hero job ids.

Frame 01 is the hero and is generated from the OWNER'S REFERENCE CROP (second-brain 2026-10-13: if the
owner gave a render, crop it and feed it, never describe it); frames 02..10 take only a tight crop of the
approved 01. The SHAPE strings below exist so the prompt still carries the spec when the crop is partial --
they are not a substitute for the crop.

Shop visual system (moth, twig, evil-eye, xmas26): one single-colour world per listing, tonal macro product
frames, editorial worn frames, a gift frame and a three-metal frame; Canon 50 mm, f/2.8, ISO 400, 35 mm grain.
Ground: one warm travertine family for the line (the lookbook's world), a distinct tone per listing so the
five thumbnails stay apart in Etsy search.
Star shape is SETTLED, not an open decision: the owner approved these 50 prompts on 2026-10-15 and they say
four point. Reference image 5 draws five points and the first three heroes came back with a six/eight ray
north star; both are deviations from the approved spec, not alternatives to it. See images/qa.md.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent

CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left "
          "with one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")
WG = "polished unplated white gold, a pale silvery grey like platinum with no yellow tint at all"
# 2026-10-15 hero QA: N01, R01 and R03 came back with a six/eight ray north star although the approved
# prompt said "four-point". Both causes were ours: "the classic sparkle shape" handed the model its own
# many-rayed default, and the guard banned only the one wrong value we happened to think of. The count is
# now carried as GEOMETRY (second-brain: describe the object, not the jargon) and the wrong CLASS is named.
STAR_GEO = ("a four point star, exactly four slender tapering points on a cross, one up, one down, one left "
            "and one right, the up and down points a little longer, with nothing in the gaps between them")
STAR_SET = f"{STAR_GEO}, holding one small round brilliant white diamond at its centre"
STAR_PLAIN = f"{STAR_GEO}, solid plain polished gold with no diamond and no empty setting"
STAR_RULE = ("every star in the image has exactly four points on a cross, two long and two short, never five "
             "points and never a six or eight ray north star or compass rose")

# ---------------------------------------------------------------- the five products
P = [
    dict(
        key="E01", name="Stellar Curve Earrings", kind="earrings", stones=True, star=False,
        ground="warm sand", hex="#C9A77C",
        shape=(f"a pair of solid gold drop earrings; each earring is one long smooth tapered gold curve about "
               f"55 mm long, round in section, thick at the top and drawn out to a fine point at the bottom, "
               f"curving like a sabre; a second, much slimmer curve set with a single row of small round "
               f"brilliant white diamonds crosses it from the other side, and where the two cross they tie into "
               f"a small open knot, also set with the same pavé diamonds; the post and butterfly back sit at the "
               f"top of the thick curve; both curves are highly polished; no stones on the thick gold curve, no "
               f"charms, no star, no chain, no hoop"),
        scale="each earring is about 55 mm long and 9 mm across at the knot, small against the ear, never larger",
        detail="the pavé knot where the two curves cross, the set diamonds and the taper of the gold point",
        pose="hanging from the lobe, the long gold point sweeping down and slightly forward along the jaw",
    ),
    dict(
        key="N01", name="Stellar Drop Necklace", kind="necklace", stones=False, star=True,
        ground="soft cream", hex="#EFE7DA",
        shape=(f"a solid gold lariat necklace on a fine 1.0 mm cable chain; at the centre the chain gives way to "
               f"one smooth round gold bar that sweeps across the collarbone and turns back on itself in one open "
               f"teardrop loop; sitting on the line just where the loop closes is {STAR_PLAIN}; from the bottom of the "
               f"loop "
               f"a short length of the same fine chain drops, carrying a second, larger star of the same four "
               f"point shape, also solid plain polished gold, and ending "
               f"in a small smooth polished gold teardrop; a spring ring clasp at the back; everything highly "
               f"polished; no pendant, no other charms, no stones"),
        scale="the centre bar spans about 60 mm, the drop falls about 45 mm below it, delicate against the neck",
        detail="the plain gold four point star where the loop closes and the smooth teardrop at the end of the drop",
        pose="the loop resting just below the hollow of the throat, the drop falling straight down the sternum",
    ),
    dict(
        key="R01", name="Stellar Band Ring", kind="ring", stones=True, star=True,
        ground="pale travertine", hex="#E3D9C6",
        shape=(f"a slim solid gold ring about 1.8 mm wide; the band does not sit flat, it rises in one gentle wave "
               f"over the top of the finger; at the crest of the wave sits {STAR_SET}; along one side of the shank, "
               f"running down from the star, a single "
               f"row of small round brilliant white diamonds is bead set into the gold; the rest of the band is "
               f"smooth and highly polished; no other stones, no engraving, no second band"),
        scale="the band is 1.8 mm wide and the star about 6 mm across, small and fine on the finger",
        detail="the set star at the crest of the wave and the pavé row running away down the shank",
        pose="on the ring finger, the star facing the camera at the top of the finger",
    ),
    dict(
        key="R02", name="Stellar Knot Ring", kind="ring", stones=True, star=False,
        ground="warm greige", hex="#D6C8B4",
        shape=("a solid gold ring made of two slim bands about 1.6 mm wide that cross over the top of the finger "
               "in one open knot, each band sweeping round and passing over and under the other so the knot is "
               "open and you can see through it; both bands are bead set along their whole length with a single "
               "row of small round brilliant white diamonds; the gold between the stones is highly polished; the "
               "two bands join into one shank under the finger; no star, no other stones, no engraving"),
        scale="the knot stands about 11 mm across the top of the finger, each band 1.6 mm wide",
        detail="the open crossing of the two pavé bands and the way the rows of diamonds run over and under",
        pose="on the ring finger, the open knot facing the camera at the top of the finger",
    ),
    dict(
        key="R03", name="Stellar Signet Ring", kind="ring", stones=True, star=True,
        ground="deep camel", hex="#B08D62",
        shape=(f"a bold solid gold signet ring; the face is not flat but a wide sculptural sweep of polished gold "
               f"that curves and folds, rising from a shank that tapers down and widens again where it meets the "
               f"face, so the whole ring reads as one poured, molten form; cut into the face is {STAR_SET}; every "
               f"surface is highly "
               f"polished, no texture, no engraving; no pavé, no other stones"),
        scale="the face is about 16 mm across and the shank narrows to 2.5 mm, a bold ring but still in proportion",
        detail="the single set star on the sculptural face and the fold of the polished gold around it",
        pose="on the index finger, the sculptural face turned to the camera",
    ),
]

# ---------------------------------------------------------------- worn copy by product kind
SKIN = {"02": "light warm", "03": "deep brown", "05": "fair", "09": "medium olive", "10": "warm tan"}


def cap(t):
    return t[0].upper() + t[1:]


def worn(p, n):
    skin, k = SKIN[n], p["kind"]
    if k == "earrings":
        return (f"Exactly one pair of earrings, worn by a woman with {skin} skin, {p['pose']}; both ears show the "
                f"same earring and they are the only jewelry in the image; no necklace, no other piercings, "
                f"no rings")
    if k == "necklace":
        return (f"Exactly one necklace, worn by a woman with {skin} skin, {p['pose']}; it is the only jewelry in "
                f"the image; no earrings, no rings, no second chain")
    return (f"Exactly one ring, worn by a woman with {skin} skin, {p['pose']}; the other fingers are bare and it "
            f"is the only jewelry in the image; no watch, no second ring; anatomically correct hands with five "
            f"fingers")


def metal(p):
    """The stone sentence of the shared block, derived from the product so it is never untrue of it.

    N01 has no stones at all. Telling it "every stone is a white diamond" in the same breath as
    "no stones" is what put a diamond in both of its stars on 2026-10-15.
    """
    if p["stones"]:
        return "The gold is polished 14K yellow gold and every stone is a white diamond."
    return ("The gold is polished 14K yellow gold and the piece carries no stones at all: every star and every "
            "surface is solid plain polished gold, with no diamond, no gem and no empty setting.")


def style(p, n, people):
    who = " Natural skin texture visible." if people else ""
    if n == "01":
        # Hero: no reference is attached yet, so it must NOT be told to copy one (twig does the same).
        # When the owner's render arrives this frame is regenerated with the crop as the reference.
        return (f"{CAMERA} {metal(p)} Do not add stones, charms or engraving; {STAR_RULE}. No text, no "
                f"numbers, no logo, no watermark, no ruler. Square 1:1.")
    what = ("same form, same stones and same settings; only the metal colour changes, exactly as named for each "
            "copy;" if n == "06" else "same form, same stones, same settings, same metal;")
    return (f"{CAMERA}{who} {metal(p)} The piece must be an exact copy of the piece in the reference image: "
            f"{what} do not redesign it, do not add stones, charms or engraving; {STAR_RULE}; "
            f"take only the piece from the reference, never "
            f"its background, camera angle or framing. No text, no numbers, no logo, no watermark, no ruler. "
            f"Square 1:1.")


# ---------------------------------------------------------------- the ten frames
def frames(p):
    g, hx, kind = p["ground"], p["hex"], p["kind"]
    stone = f"{g} stone ({hx}), a smooth honed travertine slab with its fine natural pitting visible in raking light"
    lay = {"earrings": "both earrings lie side by side, a thumb's width apart, their long points sweeping the same way",
           "necklace": "the necklace lies in one soft open curve, the looped centre and the drop face up",
           "ring": "the ring stands upright on the stone, leaning very slightly back"}[kind]
    held = {"earrings": "one earring is held upright between finger and thumb by its post, the long point hanging free",
            "necklace": "the looped centre is lifted on one fingertip so the drop hangs free below",
            "ring": "the ring is held upright between finger and thumb, turned so its face is to the camera"}[kind]
    pair = {"earrings": "the second earring of the pair lies beside it",
            "necklace": "the chain pools softly beside it",
            "ring": "a second ring of the same design lies flat beside it"}[kind]
    return [
        ("01", "Hero on travertine", False,
         f"Etsy thumbnail hero, macro still life in one colour on {stone}: {lay}, in razor-sharp focus at the "
         f"centre of the frame; seen from slightly above; warm light from the upper left with one clean highlight "
         f"running along the polished gold and a bright pinpoint on each diamond; the stone falls softly out of "
         f"focus at the edges. No people and no hands in the image."),
        ("02", "Worn, close editorial", True,
         f"Worn close-up on a seamless {g} backdrop ({hx}): a quiet editorial portrait crop, the light warm and "
         f"directional. {worn(p, '02')}. {cap(p['scale'])}."),
        ("03", "Worn, turned to the light", True,
         f"Worn on a seamless {g} backdrop ({hx}): she has turned a little towards the window so the gold catches "
         f"the light and the diamonds flash. {worn(p, '03')}. {cap(p['scale'])}."),
        ("04", "Signature detail macro", False,
         f"Extreme close detail on {stone}: the camera is only a few centimetres away, so {p['detail']} fill most "
         f"of the frame, every facet of the set stones sharp, the rest falling softly out of focus; one crisp "
         f"highlight travels along the polished gold. No people and no hands in the image."),
        ("05", "Scale in the hand", True,
         f"Scale shot on {g} linen ({hx}): {held}, so it can be compared with the fingertips. A woman with fair "
         f"skin holds it in otherwise bare hands, anatomically correct with five fingers; she wears no rings, no "
         f"watch and no other jewelry, and the piece is not worn, only held. Cropped tight on the hand. "
         f"{cap(p['scale'])}."),
        ("06", "Three gold colours", False,
         f"Metal colour visualization on {stone}: three separate pieces of this exact design lie in one horizontal "
         f"row with clear space between them so no two touch; the left piece in polished yellow gold, the centre "
         f"piece in {WG}, clearly a different colour from the yellow one beside it, the right piece in polished "
         f"rose gold, a soft pink gold; every diamond stays the same white; each piece is one single metal "
         f"throughout. A full-bleed photograph, no border, no inset. No people and no hands in the image."),
        ("07", "Gift box and card", False,
         f"Gift and display: on a smooth semi-matte lacquered {g} surface ({hx}) that shows no reflections, the "
         f"piece rests against the ridge of a small plain ivory folded card; beside it a small square gift box "
         f"wrapped in matte {g} paper, its lid off, lined with natural undyed linen, a loose silk ribbon in a "
         f"warmer shade of the same colour; no logo and no text; the piece appears only once. No people and no "
         f"hands in the image."),
        ("08", "Profile on the stone", False,
         f"Side view macro: the piece rests on {stone}, seen low from the side at the height of the stone so its "
         f"depth and the curve of the gold are read in profile against the out-of-focus ground; one crisp "
         f"highlight along the top edge. No people and no hands in the image."),
        ("09", "Window light, editorial", True,
         f"Editorial worn frame: soft late afternoon daylight through a window falls across her, a {g} wall ({hx}) "
         f"behind, the shadow of the window frame soft on the wall. {worn(p, '09')}. {cap(p['scale'])}."),
        ("10", "Worn with the light behind", True,
         f"Worn, backlit on a seamless {g} backdrop ({hx}): the key light is low and behind her so the polished "
         f"gold rims bright against the softer background and the set stones catch the light. {worn(p, '10')}. "
         f"{cap(p['scale'])}."),
    ]


# ---------------------------------------------------------------- build
BY_KEY = {p["key"]: p for p in P}
out, md = {}, ["# The Stellar Line: 50 image prompts (owner approved 2026-10-15)", "",
               "One warm travertine world per listing. nano_banana_2, 2k, 1:1, count 1 each.",
               "Frame 01 is generated from the owner's reference crop; 02-10 use a tight crop of the approved 01.",
               "Star shape is settled: four points on a cross. The first N01/R01/R03 heroes rendered a north",
               "star and are being reshot; see images/qa.md.", ""]
for p in P:
    md += [f"## {p['key']} · {p['name']}", "", f"Ground {p['ground']} {p['hex']}.", ""]
    for n, title, people, body in frames(p):
        text = f"{body} The piece: {p['shape']}. {style(p, n, people)}"
        text = " ".join(text.split())
        out[f"{p['key']}-{n}"] = {"product": p["name"], "frame": n, "title": title, "prompt": text}
        md += [f"### {n} · {title}", "", "```", text, "```", ""]

json.dump(out, open(HERE / "prompts.json", "w"), indent=1, ensure_ascii=False)
open(HERE / "image-prompts.md", "w").write("\n".join(md))
assert len(out) == 50, len(out)
# STAR_GEO is dropped inside other sentences, so it must stay a plain noun phrase: a semicolon or a
# finite verb in it strands the verb of the host sentence (2026-10-15: "...at its centre is set").
assert ";" not in STAR_GEO and "never" not in STAR_GEO and " is " not in STAR_GEO, STAR_GEO
for k, v in out.items():
    t = v["prompt"]
    assert t.endswith("Square 1:1."), k
    prod = BY_KEY[k.split("-")[0]]
    assert STAR_RULE in t, k                       # positive pin: four points on a cross, stated as geometry
    assert t.count("six or eight ray north star") == 1, k     # the ban has one home, the shared rule
    assert "classic sparkle shape" not in t, k     # the phrase that caused the 2026-10-15 reshoot
    assert "four-pointed" not in t, k              # jargon spelling; the geometry string is the only form
    # the star clause belongs to the products that actually have one, and only to them
    assert (STAR_GEO in t) == bool(prod["star"]), k
    if not prod["star"]:
        assert "no star" in t, k
    # the shared stone sentence must be TRUE of this product; never both claims in one prompt
    assert ("every stone is a white diamond" in t) == bool(prod["stones"]), k
    assert ("carries no stones at all" in t) != bool(prod["stones"]), k
    if not prod["stones"]:
        assert "white diamond" not in t.split("carries no stones at all")[0], k
    ref = "exact copy of the piece in the reference image" in t
    assert ref == (v["frame"] != "01"), k          # hero carries no reference clause; 02-10 must
    assert not re.search(r"\. [a-z]", t), (k, re.search(r"\. [a-z].{0,40}", t).group(0))
    assert not re.search(r"; [A-Z]", t), (k, re.search(r"; [A-Z].{0,40}", t).group(0))
    assert "worn by a woman" not in t or ", worn on" not in t, k
    if v["frame"] == "05":
        assert "worn on" not in t and "only held" in t, k     # held frame, never also worn
print(f"{len(out)} prompts -> prompts.json, image-prompts.md")
