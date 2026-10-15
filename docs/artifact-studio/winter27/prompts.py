"""Winter 26/27 set: 11 gallery prompts per piece (slots 02 to 12; 01 is the approved hero).

Run: python3 docs/artifact-studio/winter27/prompts.py  -> prompts.json + image-prompts.md
Nothing here calls a model. Each prompt is one generation: nano_banana_2, resolution "2k", 1:1, count 1,
about 2 credits; 5 x 11 = 55 generations, about 110 credits. Reference for every frame is a TIGHT CROP of
the approved hero (piece only, never the full frame), so the hero's framing does not leak (Comet, Willow).

Rules carried from docs/second-brain.md: every frame line is written per piece, never a shared template
line (huggie/toggle lesson); scale is stated with a number and a known object; the ring finger is described
anatomically and the other fingers named bare; the hand never holds a mug, it rests beside it; worn frames
crop the face out; slot 09 (three metals) says "only the metal colour changes" and never "same metal".
Hero QA 2026-10-15 moved the spec to the image: W02 scales run down the shoulders, W03 has four spheres,
W04 drops both strands through the slide ring and its enamel eye is domed.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left "
          "with one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")
WG = "polished unplated white gold, a pale silvery grey like platinum with no yellow tint"
RG = "polished rose gold, a soft warm pink gold"
HAND = ("anatomically correct hands with five fingers, natural skin texture visible, short natural nails with "
        "sheer nude polish")

PIECES = {
 "W01": dict(name="Thaw Cuff", kind="cuff", bg="pale ice blue", hx="#B9C6CF",
   ground="a slab of frozen river ice, pale ice blue (#B9C6CF), with fine frost crystals and faint cracks inside the ice",
   shape=("an open cuff bracelet, 4 mm wide and about 1.3 mm thick, its whole outer surface a molten, gently rippled "
          "high-polish texture like gold that has just stopped flowing; the last 12 mm of one end is white gold, joined "
          "to the yellow gold in a soft, slightly uneven melted seam; a smooth open C with a 25 mm gap and rounded "
          "ends, solid, no stones, no pattern, no inscription, no hinge"),
   scale="the cuff band is 4 mm wide, about the width of a pencil, and sits close on the wrist",
   worn="worn on the left wrist of a woman, the gap turned to the inside of the wrist, the molten yellow gold on top "
        "and the white gold tip visible at one end; the right wrist is bare; no watch, no rings, no other jewelry"),
 "W02": dict(name="Pinecone Signet", kind="signet", bg="oxblood, deep wine red", hx="#4A1C22",
   ground="a bed of real dry pinecone scales and smooth stone, everything in the same deep oxblood red (#4A1C22)",
   shape=("a chunky oval signet ring: the 13 x 11 mm oval table and both shoulders are carved in deep relief with "
          "overlapping pointed pinecone scales rising in a spiral, the recesses between the scales filled flush with "
          "glossy oxblood vitreous enamel so the gold scale tips stand out against the dark red; a thin polished rim "
          "around the table; the lower shank 3 mm wide, smooth and polished; the table solid and closed underneath, "
          "no hollow back, no stones"),
   scale="the oval table is 13 mm tall, about the size of a fingernail, never larger",
   worn="worn on the ring finger of a woman's left hand (the fourth finger, between the middle finger and the "
        "little finger), the carved table facing the camera; the thumb, index, middle and little fingers are bare; "
        "no other jewelry"),
 "W03": dict(name="Juniper Drop Earrings", kind="earrings", bg="juniper green", hx="#3E5A4C",
   ground="dark juniper green slate (#3E5A4C) with a few real juniper sprigs, their short needles and dusty blue berries",
   shape=("a pair of drop earrings: each earring is a tight cluster of four 4.5 mm spheres touching like berries on a "
          "sprig, three of them bright polished gold and exactly one coated in dusty blue vitreous enamel, a soft "
          "powdery steel blue with a matte bloom like a ripe juniper berry; the cluster hangs from a slim French hook "
          "with a tiny ball at its tip; no stones, no other charms"),
   scale="each sphere is 4.5 mm, the whole cluster about 10 mm, the size of a small fingernail, never larger",
   worn="worn on a woman's earlobe, hair tucked behind the ear, the cluster hanging just below the lobe with the "
        "blue sphere visible; no other earrings, no other jewelry"),
 "W04": dict(name="Ember Lariat", kind="lariat", bg="ash grey", hx="#3B3835",
   ground="cool ash grey slate (#3B3835) dusted with fine grey ash and a few charred twig fragments",
   shape=("a Y lariat necklace: a fine 1.1 mm cable chain whose two strands pass together through a small smooth "
          "polished slide ring and drop together as a short double strand to a solid cast teardrop pendant 12 x 8 mm, "
          "the teardrop smooth and molten with a softly rippled polished surface like a drop of liquid gold, and in "
          "its wide end one small round domed eye of glowing ember orange vitreous enamel about 3 mm across in a "
          "thin polished bezel; no other stones, no second pendant"),
   scale="the teardrop is 12 mm tall, about the size of a fingernail, small against the collarbone, never larger",
   worn="worn by a woman, the chain lying flat on bare skin, the slide ring at the base of the throat and the "
        "teardrop resting just below the collarbones, framed from the chin down to the upper chest so the face is "
        "outside the image; no other necklace, no earrings"),
 "W05": dict(name="Pine Needle Brooch", kind="brooch", bg="snow on dark bark, bark brown", hx="#4A3A30",
   ground="dark bark brown (#4A3A30) pine bark lightly dusted with fresh snow, a few real pine needles out of focus",
   shape=("a brooch 45 mm across: two bundles of five slender gold pine needles, each a straight 1.2 mm round wire "
          "tapering to a soft point, the two bundles crossing at a small central hub in an X; the needle shafts high "
          "polish, the last 8 mm of every tip a fine matte brushed finish; a plain pin stem and a small revolver "
          "catch on the back in the same gold; no stones, no enamel, no other motif"),
   scale="the brooch is 45 mm across, about the length of a thumb, never larger",
   worn="pinned on the left lapel of a woman's charcoal wool coat, the X of needles tilted a little, framed from "
        "the chin down to the chest so the face is outside the image; no other brooch, no necklace"),
}


def style(p, slot, people):
    who = " Natural skin texture visible." if people else " No people and no hands in the image."
    if slot == "09":
        metal = ("the jewelry must be an exact copy of the piece in the reference image: same shape, same surface, "
                 "same proportions; only the metal colour changes, exactly as named for each copy;")
    else:
        metal = ("the jewelry must be an exact copy of the piece in the reference image: same shape, same surface, "
                 "same proportions, same metal;")
    return (f"The piece: {p['shape']}. {CAMERA}{who} {metal[0].upper()}{metal[1:]} do not redesign it, do not add "
            f"stones, charms or a second piece; take only the piece from the reference, never its background, camera "
            f"angle or framing. No text, no numbers, no logo, no watermark, no ruler. Square 1:1.")


def three(p, how):
    return (f"Metal colour visualization on {p['ground']}: three separate copies of this exact design {how}, with "
            f"clear space between them so no two touch; the left one in polished yellow gold, the centre one in {WG}, "
            f"clearly a different colour from the yellow beside it, the right one in {RG}; every enamel colour stays "
            f"the same. A full-bleed photograph, no border, no inset.")


def gift(p, how):
    return (f"Gift and display: on a smooth semi-matte lacquered {p['bg']} surface ({p['hx']}) that shows no "
            f"reflections, {how}; beside it a small square gift box wrapped in matte {p['bg']} paper, its lid off, "
            f"lined with natural undyed linen, a satin ribbon in a soft matching tone curling loose; no logo and no "
            f"text; the piece appears only once.")


def window(p, worn_how):
    return (f"Editorial worn frame: soft cool winter daylight through a frosted window falls across her, a {p['bg']} "
            f"wall ({p['hx']}) behind. {worn_how}. {HAND}; {p['scale']}.")


W = PIECES
FRAMES = {
 "W01": [
  ("02", "Wrist below a knit cuff", True,
   f"Worn close-up on a seamless {W['W01']['bg']} backdrop ({W['W01']['hx']}): her left forearm rests on her knee, "
   f"the cuff of a chunky knit sweater in a deeper ice blue pushed back, the cuff bracelet on the bare wrist just "
   f"below it. The cuff is {W['W01']['worn']}. {HAND}. Cropped from the forearm to the fingertips; {W['W01']['scale']}."),
  ("03", "Molten surface macro", False,
   f"Extreme close detail: the cuff lies on {W['W01']['ground']}; the camera is only a few centimetres from the "
   f"outer surface, so the molten ripples of the yellow gold fill most of the image with light pooling in each "
   f"wave, the rest falling softly out of focus; one crisp highlight on the ridges."),
  ("04", "The thaw seam", False,
   f"Extreme close detail: the end of the cuff where the white gold tip meets the yellow gold rests on "
   f"{W['W01']['ground']}; the camera is a few centimetres away, the slightly uneven melted seam between the two "
   f"metals at the centre in razor-sharp focus, the white gold reading clearly cooler and greyer than the yellow."),
  ("05", "Edge view, width and thickness", False,
   f"Side view macro: the cuff stands on its edge on {W['W01']['ground']}, seen low from the side so the 4 mm "
   f"width and the thin 1.3 mm wall read in profile, the open gap turned toward the camera; one crisp highlight "
   f"along the top edge."),
  ("06", "Hand beside a cup of tea", True,
   f"Winter table moment on a {W['W01']['bg']} linen cloth ({W['W01']['hx']}): her left hand rests flat on the "
   f"cloth beside a small plain white porcelain cup of tea, not holding it, the cuff on the wrist. The cuff is "
   f"{W['W01']['worn']}. {HAND}. Cropped tight on the wrist, hand and cup; {W['W01']['scale']}."),
  ("07", "Fingertip scale", True,
   f"Scale shot on {W['W01']['bg']} linen ({W['W01']['hx']}): her left wrist rests flat and the tip of her right "
   f"index finger touches the cuff band, so the 4 mm band can be compared with the fingernail. The cuff is "
   f"{W['W01']['worn']}. {HAND}. Cropped tight on the wrist; {W['W01']['scale']}."),
  ("08", "Gift box", False,
   gift(W['W01'], "the cuff stands on its edge, the molten surface and the white gold tip facing the camera")),
  ("09", "Three two-tone colours", False,
   f"Metal colour visualization on {W['W01']['ground']}: three separate copies of this exact cuff stand on their "
   f"edges in one horizontal row with clear space between them so no two touch; the left cuff is polished yellow "
   f"gold with its tip in {WG}; the centre cuff is {WG} with its tip in polished yellow gold, the colours reversed; "
   f"the right cuff is {RG} with its tip in {WG}; each cuff keeps the same molten surface and the same melted seam. "
   f"A full-bleed photograph, no border, no inset."),
  ("10", "Hand at a wool collar", True,
   f"Editorial detail on a seamless {W['W01']['bg']} backdrop ({W['W01']['hx']}): her left hand rests at the open "
   f"collar of a wool coat in a deeper ice blue, the wrist turned to the camera. The cuff is {W['W01']['worn']}. "
   f"{HAND}. Seen from the collarbones down: the top edge of the image cuts across the collarbones, so the neck, "
   f"the chin, the lips and the face are all outside the image; {W['W01']['scale']}."),
  ("11", "Open gap from above", False,
   f"Macro still life seen from directly above: the cuff lies flat on {W['W01']['ground']}, the open C and its "
   f"25 mm gap reading clearly, the white gold tip at one end of the gap and the yellow gold end at the other, "
   f"the molten surface catching soft light; the cuff is the only object in the image."),
  ("12", "Window light in winter", True,
   window(W['W01'], f"Her left wrist rests on a windowsill, the cuff {W['W01']['worn']}. Cropped on the wrist and hand")),
 ],
 "W02": [
  ("02", "On the ring finger", True,
   f"Worn close-up on a seamless {W['W02']['bg']} backdrop ({W['W02']['hx']}): her left hand rests loosely on a "
   f"fold of dark oxblood velvet, the ring {W['W02']['worn']}. {HAND}. Cropped tight on the hand; {W['W02']['scale']}."),
  ("03", "Scales and enamel macro", False,
   f"Extreme close detail: the ring lies on {W['W02']['ground']}; the camera is only a few centimetres from the "
   f"table, so the overlapping gold pinecone scales and the glossy oxblood enamel between them fill most of the "
   f"image, the rest falling softly out of focus; one crisp highlight along the scale tips."),
  ("04", "Shoulder relief in profile", False,
   f"Side view macro: the ring stands upright on {W['W02']['ground']}, seen low from the side so the scales running "
   f"down one shoulder into the smooth 3 mm shank read in profile, the table edge at the top; one crisp highlight "
   f"along the shoulder."),
  ("05", "Hand beside a cup of coffee", True,
   f"Winter table moment on a {W['W02']['bg']} linen cloth ({W['W02']['hx']}): her left hand rests flat on the "
   f"cloth beside a small handmade stoneware cup of coffee, not holding it, the ring {W['W02']['worn']}. {HAND}. "
   f"Cropped tight on the hand and cup; {W['W02']['scale']}."),
  ("06", "Fingernail scale", True,
   f"Scale shot on {W['W02']['bg']} linen ({W['W02']['hx']}): the ring {W['W02']['worn']}, the fingers extended "
   f"so the carved oval table can be compared directly with the fingernail beside it. {HAND}. Cropped tight on "
   f"the hand; {W['W02']['scale']}."),
  ("07", "Lying like a coin", False,
   f"Macro still life: the ring lies flat on {W['W02']['ground']} like a coin, the hole facing the ceiling, seen "
   f"from slightly above so the full oval table and the thickness of the shank read; the ring is the only object "
   f"in the image."),
  ("08", "Gift box", False,
   gift(W['W02'], "the ring stands upright in a slot of a small ring cushion in dark oxblood velvet, the table facing the camera")),
  ("09", "Three gold colours", False,
   three(W['W02'], "stand upright in one horizontal row, each with its carved table facing the camera")),
  ("10", "Hand at a wool collar", True,
   f"Editorial detail on a seamless {W['W02']['bg']} backdrop ({W['W02']['hx']}): her left hand rests at the open "
   f"collar of a wool coat in a deeper wine red, the ring {W['W02']['worn']}. {HAND}. Seen from the collarbones "
   f"down: the top edge of the image cuts across the collarbones, so the neck, the chin, the lips and the face are "
   f"all outside the image; {W['W02']['scale']}."),
  ("11", "Inside of the shank", False,
   f"Macro still life: the ring stands upright on {W['W02']['ground']} with the camera looking into the ring at "
   f"about 60 degrees from above, so the smooth polished inner wall of the shank and the underside of the solid "
   f"closed table are shown; the carved outside is seen only along the far rim; one crisp highlight on the inner wall."),
  ("12", "Window light in winter", True,
   window(W['W02'], f"Her left hand rests on a windowsill, the ring {W['W02']['worn']}. Cropped on the hand")),
 ],
 "W03": [
  ("02", "On the ear", True,
   f"Worn close-up on a seamless {W['W03']['bg']} backdrop ({W['W03']['hx']}): close crop of a woman's ear and "
   f"jawline, one earring {W['W03']['worn']}; the face is mostly outside the image. Natural skin texture visible; "
   f"{W['W03']['scale']}."),
  ("03", "Cluster macro", False,
   f"Extreme close detail: one earring lies on {W['W03']['ground']}; the camera is only a few centimetres away, "
   f"so the four touching spheres fill most of the image, three bright polished gold and one matte dusty blue "
   f"enamel, the rest falling softly out of focus; one warm highlight on each gold sphere."),
  ("04", "Enamel berry macro", False,
   f"Extreme close detail: the dusty blue enamel sphere of one earring rests against its two gold neighbours on "
   f"{W['W03']['ground']}, the camera a few centimetres away so the matte powdery bloom of the enamel and the "
   f"mirror polish of the gold beside it read together; beside the earring one real juniper berry of the same blue."),
  ("05", "Hook in profile", False,
   f"Side view macro: one earring hangs from a thin bare juniper twig held horizontally above {W['W03']['ground']}, "
   f"seen from the side so the slim French hook, its tiny ball tip and the cluster hanging below it read in "
   f"profile; the twig leaves the frame out of focus; one crisp highlight on the hook."),
  ("06", "Held between two fingers", True,
   f"Scale shot on {W['W03']['bg']} linen ({W['W03']['hx']}): a woman's right hand holds one earring by the hook "
   f"between thumb and index finger so the cluster hangs beside her fingertip and can be compared with the "
   f"fingernail; the other earring lies on the linen below. {HAND}. Cropped tight on the fingers; {W['W03']['scale']}."),
  ("07", "Pair on a juniper sprig", False,
   f"Macro still life: both earrings hang side by side by their hooks from one small juniper sprig lying across "
   f"{W['W03']['ground']}, the two clusters resting on the slate below the sprig with their blue spheres facing the "
   f"camera; the pair is the only jewelry in the image."),
  ("08", "Gift box", False,
   gift(W['W03'], "the pair of earrings lies side by side, hooks up, clusters toward the camera")),
  ("09", "Three gold colours", False,
   three(W['W03'], "lie in one horizontal row, each a pair of earrings side by side with hooks up, the dusty blue "
                   "enamel sphere on every earring staying the same blue")),
  ("10", "Hair in a low bun", True,
   f"Editorial detail on a seamless {W['W03']['bg']} backdrop ({W['W03']['hx']}): a woman in a high-neck knit in a "
   f"deeper juniper green, hair in a loose low bun, turned three quarters away from the camera so one ear is "
   f"shown with the earring {W['W03']['worn']}; framed from the ear down to the shoulder, the face outside the "
   f"image. Natural skin texture visible; {W['W03']['scale']}."),
  ("11", "One earring standing", False,
   f"Macro still life: one earring stands on {W['W03']['ground']} with its cluster on the slate and its hook rising "
   f"upright, seen at eye level so the full drop reads; the other earring lies flat behind it out of focus."),
  ("12", "Window light in winter", True,
   window(W['W03'], f"Close crop of her ear and jawline, the earring {W['W03']['worn']}, the face outside the image")),
 ],
 "W04": [
  ("02", "At the collarbone", True,
   f"Worn close-up on a seamless {W['W04']['bg']} backdrop ({W['W04']['hx']}): the necklace {W['W04']['worn']}, "
   f"she wears a wide-neck knit in a deeper ash grey. Natural skin texture visible; {W['W04']['scale']}."),
  ("03", "Teardrop macro", False,
   f"Extreme close detail: the teardrop pendant lies on {W['W04']['ground']}; the camera is only a few centimetres "
   f"away, so the molten rippled gold and the domed ember orange enamel eye fill most of the image, the chain "
   f"leaving the frame out of focus; one warm glow in the enamel, one crisp highlight on the gold."),
  ("04", "Ember eye macro", False,
   f"Extreme close detail: the domed ember orange enamel eye of the pendant at the very centre of the image on "
   f"{W['W04']['ground']}, the camera a few centimetres away so the glassy glow of the enamel and its thin "
   f"polished bezel read, the gold around it softly out of focus toward the edges."),
  ("05", "Slide ring macro", False,
   f"Extreme close detail: the small polished slide ring with the two chain strands passing through it lies on "
   f"{W['W04']['ground']}, the camera a few centimetres away so the ring and the links read sharply; the double "
   f"strand drops out of the frame toward the teardrop, softly out of focus."),
  ("06", "Fingertip scale", True,
   f"Scale shot on {W['W04']['bg']} linen ({W['W04']['hx']}): the teardrop pendant lies on the linen and the tip "
   f"of a woman's index finger touches the slate beside it, never covering it, so the teardrop can be compared with "
   f"the fingernail; the chain curves away. {HAND}. Cropped tight on the fingertip and pendant; {W['W04']['scale']}."),
  ("07", "Coiled on slate", False,
   f"Macro still life seen from slightly above: the necklace lies coiled in one loose spiral on {W['W04']['ground']}, "
   f"the slide ring and the teardrop at the front of the coil facing the camera in sharp focus; the necklace is the "
   f"only jewelry in the image."),
  ("08", "Gift box", False,
   gift(W['W04'], "the necklace is draped over the ridge of a small plain white folded card, the slide ring and teardrop at the front")),
  ("09", "Three gold colours", False,
   three(W['W04'], "lie in one horizontal row, each necklace coiled with its teardrop at the front, the ember "
                   "orange enamel eye staying the same on every copy")),
  ("10", "Wool coat at a window", True,
   f"Editorial detail on a seamless {W['W04']['bg']} backdrop ({W['W04']['hx']}): she wears a wide-neck oatmeal "
   f"knit and a charcoal wool coat over the shoulders, the necklace {W['W04']['worn']}. Natural skin texture "
   f"visible; {W['W04']['scale']}."),
  ("11", "Teardrop in profile", False,
   f"Side view macro: the teardrop pendant stands on its wide end on {W['W04']['ground']}, seen low from the side "
   f"so its depth and the molten ripples of the surface read in profile, the domed enamel eye just visible at the "
   f"edge; the chain leaves the frame out of focus; one crisp highlight along the curve."),
  ("12", "Window light in winter", True,
   window(W['W04'], f"The necklace {W['W04']['worn']}")),
 ],
 "W05": [
  ("02", "On a coat lapel", True,
   f"Worn close-up on a seamless {W['W05']['bg']} backdrop ({W['W05']['hx']}): the brooch {W['W05']['worn']}. "
   f"Natural skin texture visible; {W['W05']['scale']}."),
  ("03", "Matte tips macro", False,
   f"Extreme close detail: the tips of three needles of the brooch rest on {W['W05']['ground']}; the camera is only "
   f"a few centimetres away, so the change from the mirror-polished shaft to the fine matte brushed tip fills "
   f"most of the image, the rest falling softly out of focus; one crisp highlight along a polished shaft."),
  ("04", "The crossing hub", False,
   f"Extreme close detail: the small central hub where the two needle bundles cross, on {W['W05']['ground']}, the "
   f"camera a few centimetres away so the ten shafts fanning out from the hub read sharply, the tips leaving the "
   f"frame out of focus."),
  ("05", "The back with the pin", False,
   f"Macro still life: the brooch lies face down on {W['W05']['ground']} so its back is shown: the plain polished "
   f"pin stem across the back and the small revolver catch, both in the same gold, the ten needles spreading out "
   f"underneath; seen from slightly above; the brooch is the only object in the image."),
  ("06", "Held between two fingers", True,
   f"Scale shot on {W['W05']['bg']} linen ({W['W05']['hx']}): a woman's right hand holds the brooch by one needle "
   f"bundle between thumb and index finger, the X of needles beside her thumb so it can be compared with the thumb. "
   f"{HAND}. Cropped tight on the fingers; {W['W05']['scale']}."),
  ("07", "On a knit scarf", False,
   f"Winter still life: the brooch is pinned through the folds of a chunky knit scarf in a deeper bark brown lying "
   f"on {W['W05']['ground']}, the X of needles face up at the centre in sharp focus, the knit texture around it "
   f"softly out of focus; the brooch is the only jewelry in the image."),
  ("08", "Gift box", False,
   gift(W['W05'], "the brooch lies face up at the centre, the X of needles catching the light")),
  ("09", "Three gold colours", False,
   three(W['W05'], "lie face up in one horizontal row, each X of needles the same size")),
  ("10", "On a sweater shoulder", True,
   f"Editorial detail on a seamless {W['W05']['bg']} backdrop ({W['W05']['hx']}): a woman in a cream cable-knit "
   f"sweater, the brooch pinned high on the left shoulder of the knit, framed from the chin down to the chest so "
   f"the face is outside the image; no other jewelry. Natural skin texture visible; {W['W05']['scale']}."),
  ("11", "Low angle across the needles", False,
   f"Side view macro: the brooch lies face up on {W['W05']['ground']}, seen very low across the surface so the "
   f"nearest needles rise toward the camera and the far ones fall out of focus, the round 1.2 mm wire reading in "
   f"profile; one crisp highlight along the nearest shaft."),
  ("12", "Window light in winter", True,
   window(W['W05'], f"The brooch {W['W05']['worn']}")),
 ],
}

BANNED = [r"—", r"–", r"â", r"diamond", r"engrav", r"same metal", r"hold(s|ing)? (a|the) (mug|cup)"]
out, md = {}, ["# Winter 26/27 gallery prompts (awaiting owner approval)", "",
               "nano_banana_2, resolution 2k, 1:1, count 1, about 2 credits each; 55 frames, about 110 credits. "
               "Reference for every frame: tight crop of the approved hero.", ""]
for pid, frames in FRAMES.items():
    p = PIECES[pid]
    rows = []
    for slot, title, people, text in frames:
        prompt = f"{text} {style(p, slot, people)}"
        low = prompt.lower()
        for b in BANNED:
            if slot == "09" and b == r"same metal":
                assert not re.search(b, low), (pid, slot)
            elif b != r"same metal":
                assert not re.search(b, low), (pid, slot, b)
        tl = text.lower().replace("handmade", "")
        if not people:
            assert "woman" not in tl and "hand" not in tl and "finger" not in tl, (pid, slot)
        else:
            assert "face" in tl or "finger" in tl or "hand" in tl, (pid, slot)
        assert p["hx"] in prompt, (pid, slot)
        rows.append({"slot": slot, "title": title, "model": "nano_banana_2", "resolution": "2k",
                     "aspect_ratio": "1:1", "count": 1, "reference": "tight crop of the approved 01", "prompt": prompt})
    assert [r["slot"] for r in rows] == [f"{i:02d}" for i in range(2, 13)], pid
    out[pid] = {"name": p["name"], "ground": [p["bg"], p["hx"]], "frames": rows}
    md += [f"## {pid} {p['name']} ({p['bg']} {p['hx']})", ""]
    md += [f"**{r['slot']} {r['title']}**\n\n> {r['prompt']}\n" for r in rows]
assert len({r["prompt"] for v in out.values() for r in v["frames"]}) == 55
json.dump(out, open(HERE / "prompts.json", "w"), indent=1, ensure_ascii=False)
(HERE / "image-prompts.md").write_text("\n".join(md))
print("frames:", sum(len(v["frames"]) for v in out.values()))
