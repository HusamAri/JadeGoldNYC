"""Winter 26/27 set: five hero prompts (one per piece), generated from text first.

Run: python3 docs/artifact-studio/winter27/heroes.py  -> heroes.json + heroes.md
Nothing here calls a model. Each prompt is one generation: nano_banana_2, resolution "2k" (must be passed,
default is 1k), aspect 1:1, count 1, about 2 credits. Galleries (12 frames each) follow only after the five
heroes are approved, from a tight crop of each approved hero.

Shop visual system (moth, twig, xmas26): one single-colour world per listing, tonal macro product hero,
Canon 50 mm, f/2.8, ISO 400, 35 mm grain, hero in 14K yellow gold. Heroes are text-only (no reference), so the
shared block carries no "exact copy of the reference" sentence (second-brain 2026-10-13).
Owner 2026-10-15: cuff stays 4 mm.
"""
import json, pathlib

HERE = pathlib.Path(__file__).parent
CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left "
          "with one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching. Etsy thumbnail "
          "hero, macro still life in one colour, the piece razor-sharp at the centre, the rest falling softly out "
          "of focus. No text, no numbers, no logo, no watermark, no ruler, no hands, no second piece of jewelry. "
          "Square 1:1.")
YG = "polished 14K yellow gold, a warm rich gold, not pale, not orange"
WG = "polished unplated white gold, a pale silvery grey like platinum with no yellow tint"

HEROES = [
    ("W01", "Thaw Cuff", "frozen river ice, pale ice blue #B9C6CF",
     f"A single open cuff bracelet of {YG}, 4 mm wide and about 1.3 mm thick, its whole outer surface a molten, "
     f"gently rippled texture like gold that has just stopped flowing, high polish catching light in soft waves; "
     f"the last 12 mm of one end is {WG}, joined to the yellow gold in a soft, slightly uneven melted seam, as if "
     f"the gold were thawing out of ice; the cuff is a smooth open C with a 25 mm gap, rounded ends, solid, no "
     f"stones, no pattern, no engraving, no hinge. It rests on a slab of frozen river ice, pale ice blue "
     f"(#B9C6CF), with fine frost crystals and faint cracks inside the ice, seen as an extreme close macro, the "
     f"cuff standing on its edge so the molten surface and the white gold tip face the camera; one warm highlight "
     f"on the yellow gold, a cool highlight on the white tip. {CAMERA}"),
    ("W02", "Pinecone Signet", "oxblood, deep wine red #4A1C22",
     f"A single chunky oval signet ring of {YG}: the oval table is 13 x 11 mm and carved in deep relief with "
     f"overlapping pinecone scales, each scale a small pointed, slightly cupped shield rising from the surface in "
     f"a spiral like a real pinecone; the recesses between the scales are filled flush with oxblood vitreous enamel, "
     f"a deep wine red (#4A1C22) with a glassy sheen, so the gold scale tips stand out against the dark red; the "
     f"shank is 3 mm wide, smooth and polished, the table solid, flat and closed underneath, no hollow back, no "
     f"stones. It stands upright on a bed of real dry pinecone scales and smooth stone, everything in the same deep "
     f"oxblood red, seen as an extreme close macro, the ring turned three quarters so both the carved table and "
     f"the shank read; one crisp highlight along the scale tips. {CAMERA}"),
    ("W03", "Juniper Drop Earrings", "juniper green #3E5A4C",
     f"A pair of drop earrings of {YG}: each earring is a tight cluster of three polished 4.5 mm gold spheres "
     f"hanging from a slim French hook, the spheres touching like berries on a sprig, and exactly one of the three "
     f"spheres on each earring is coated in dusty blue vitreous enamel, a soft powdery steel blue like a ripe "
     f"juniper berry, matte with a faint bloom, the other two bright polished gold; no stones, no other charms. "
     f"The pair lies on dark juniper green slate (#3E5A4C) between a few real juniper sprigs with their own dusty "
     f"blue berries and short needles, the two earrings close together, hooks pointing away, clusters toward the "
     f"camera, seen as an extreme close macro; one warm highlight on each gold sphere. {CAMERA}"),
    ("W04", "Ember Lariat", "ash grey #3B3835 with one warm ember glow",
     f"A single Y lariat necklace of {YG}: a fine 1.1 mm cable chain runs through a small polished slide ring and "
     f"drops to a solid cast teardrop pendant 12 x 8 mm, the teardrop smooth and molten with a softly rippled "
     f"polished surface like a drop of liquid gold, and at the centre of its wide end one small round eye of "
     f"ember orange vitreous enamel, a glowing deep orange like a coal, set flush, about 3 mm across; no other "
     f"stones, no second pendant. The necklace lies on cool ash grey slate (#3B3835) dusted with fine grey ash "
     f"and a few charred twig fragments, the chain forming a soft Y, the teardrop at the centre facing up in "
     f"razor-sharp focus with the enamel eye catching one warm glow, seen as an extreme close macro; cool light "
     f"with one warm highlight on the gold. {CAMERA}"),
    ("W05", "Pine Needle Brooch", "snow on dark bark, bark brown #4A3A30",
     f"A single brooch of {YG}, 45 mm across: two bundles of five slender gold pine needles, each needle a "
     f"straight 1.2 mm round wire tapering to a soft point, the two bundles crossing at a small central hub "
     f"like two pine needle fascicles laid over each other in an X; the needle shafts high polish, the last "
     f"8 mm of every needle tip a fine matte brushed finish; the pin stem and catch on the back in the same gold, "
     f"not visible; no stones, no enamel, no other motif. It lies on a piece of dark bark brown (#4A3A30) pine "
     f"bark lightly dusted with fresh snow, a few real pine needles beside it out of focus, the brooch flat and "
     f"face up at the centre in razor-sharp focus, seen as an extreme close macro; one crisp highlight along the "
     f"polished shafts. {CAMERA}"),
]

if __name__ == "__main__":
    for _, _, _, p in HEROES:
        for bad in ["—", "–", "â", "diamond", "reference"]:
            assert bad not in p, bad
    (HERE / "heroes.json").write_text(json.dumps(
        [{"id": i, "name": n, "world": w, "prompt": p, "model": "nano_banana_2", "aspect_ratio": "1:1",
          "resolution": "2k", "count": 1} for i, n, w, p in HEROES], indent=1, ensure_ascii=False) + "\n")
    md = ["# Winter 26/27 hero prompts\n", "nano_banana_2, resolution 2k, 1:1, count 1, about 2 credits each.\n"]
    for i, n, w, p in HEROES:
        md += [f"## {i} {n}\n", f"World: {w}\n", f"> {p}\n"]
    (HERE / "heroes.md").write_text("\n".join(md))
    print("heroes:", len(HEROES))
