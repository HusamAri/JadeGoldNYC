"""Image prompts for the six sterling silver chain listings (S01..S06).

Run: python3 prompts.py > image-prompts.md
One scene palette per listing (Artifact rule), cool silver, men's audience.
Model params are fixed here so every call copies them: nano_banana_2, resolution 2k, 1:1, count 1.
"""

METAL = ("solid 925 sterling silver, a bright cool white silver with no yellow or gold tint, "
         "not chrome-like, real metal with soft natural reflections")

CHAINS = {
    "franco": ("a Franco chain: square in cross-section, made of tightly interlocked V-shaped links that form "
               "a continuous chevron (herringbone arrow) pattern running along all four faces, rigid and even, "
               "no gaps between links"),
    "cuban": ("a Cuban curb chain: flat interlocking oval links, each link twisted so the chain lies completely "
              "flat, every link face diamond-cut with bright flat facets, links touching edge to edge with no "
              "open space, uniform width along the whole length"),
    "figaro": ("a Figaro chain: flat diamond-cut links in a strict repeating pattern of three short round-oval "
               "links followed by one long elongated oval link, then three short again, all links twisted to lie "
               "flat, uniform width"),
}

CLASP = ("a sterling silver lobster clasp joined to a small flat oval tag plate and a round jump ring at the other "
         "end, nothing else on the chain")

LISTINGS = [
    # id, chain, piece, width (mm), palette name, hero scene, worn scene, flat-lay scene
    ("S01", "franco", "necklace", 3.4, "graphite",
     "laid in a loose S-curve on a slab of raw dark grey slate, cool overcast window light from the left",
     "worn by a man in a charcoal merino crewneck, the chain resting on the knit at the collarbone, only "
     "the neck and upper chest in frame, no face, soft grey daylight",
     "on a charcoal wool blanket beside a matte black steel lighter and a slate coaster"),
    ("S02", "franco", "bracelet", 4.1, "ink navy",
     "coiled loosely on folded raw indigo denim, cool daylight from a high window",
     "on the left wrist of a man in a navy cotton shirt with the cuff rolled once, forearm resting on a dark "
     "navy desk, only the forearm and hand in frame, soft cool daylight",
     "on deep navy linen beside a folded indigo pocket square and a dark blue notebook"),
    ("S03", "cuban", "necklace", 6.5, "black",
     "laid in a loose curve on polished black marble with faint grey veining, a single hard light from the side",
     "worn by a man in an open-collar black shirt, the chain lying flat on the skin at the base of the neck, "
     "only the neck and upper chest in frame, no face, low moody side light",
     "on black leather beside a black ceramic espresso cup on a black stone tray"),
    ("S04", "cuban", "bracelet", 7.6, "olive",
     "lying open on an olive green waxed canvas jacket sleeve, soft daylight",
     "on the right wrist of a man in an olive field jacket, hand relaxed on a weathered olive canvas bag, "
     "only the forearm and hand in frame, soft overcast daylight",
     "on olive waxed canvas beside a matte steel carabiner and a folded olive bandana"),
    ("S05", "figaro", "necklace", 4.6, "fog grey",
     "laid in a loose curve on smooth pale grey concrete, cool diffused daylight",
     "worn by a man in a crisp white oxford shirt with the top two buttons open, the chain lying on the skin, "
     "only the neck and upper chest in frame, no face, bright soft daylight",
     "on light grey felt beside a folded white shirt collar and a pale concrete dish"),
    ("S06", "figaro", "bracelet", 6.6, "espresso",
     "coiled on dark espresso brown leather, warm low side light from a window",
     "on the left wrist of a man in a dark brown suede jacket, hand resting on a walnut table, only the forearm "
     "and hand in frame, warm window light",
     "on a dark walnut board beside a brown leather card holder and a coffee cup"),
]

TAIL = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, natural light only, fine 35 mm film grain, true colour, "
        "no heavy retouching. The chain razor-sharp, the background falling softly out of focus. No text, no "
        "letters, no numbers, no logo, no watermark, no ruler, no other jewelry, no gold anywhere. Square 1:1.")

LEN = {"necklace": "20 inch necklace", "bracelet": "8 inch bracelet"}
SIZE_NECK = ("a long chain about 50 cm end to end, laid out as one large open oval that fills most of the "
             "frame, clearly a neck-length chain, never coiled, never a small bracelet loop")
SIZE_WRIST = ("about 20 cm end to end, laid as one single open loop the size of a wrist, never coiled or "
              "wrapped more than once")
BACK = (", the clasp and tag plate hidden at the back of the neck, not visible, the chain continuous across "
        "the front")
FACETS = {"franco": "the chevron V-links on every face", "cuban": "the flat diamond-cut facets of each link", "figaro": "the three-short, one-long rhythm and the diamond-cut facets"}


def frames(lid, chain, piece, w, palette, hero, worn, flat):
    one = f"One {LEN[piece]} in {METAL}, {w} mm wide, {CHAINS[chain]}, with {CLASP}."
    size = (SIZE_NECK if piece == "necklace" else SIZE_WRIST)
    yield "01 hero", (f"{one} The whole {piece} {hero}, {size}, the clasp visible at one end. "
                      f"Palette: {palette} tones only. Etsy listing hero. {TAIL}")
    yield "02 worn", (f"{one} {worn.capitalize()}. The {piece} is the only jewelry on the man, true to scale, "
                      f"{w} mm wide{BACK if piece == 'necklace' else ''}. Palette: {palette} tones only. {TAIL}")
    yield "03 link macro", (f"{one} Extreme close-up of one straight section of the {piece}, about 3 cm, a "
                            f"single chain running diagonally corner to corner, no clasp, no tag plate and no "
                            f"second strand in frame, edge to edge on the same {palette} surface as the hero, "
                            f"{FACETS[chain]} crisp, raking light. {TAIL}")
    yield "04 clasp", (f"{one} Close-up of the lobster clasp closed through the jump ring, the oval tag plate "
                       f"beside it with a small 925 stamp, on the same {palette} surface, soft side light. "
                       f"The stamp reads 925 only, no other marks. {TAIL}".replace(
                           "No text, no letters, no numbers,", "No other text,"))
    yield "05 flat lay", (f"{one} The {piece} {flat}, seen from directly above, a calm men's still life. "
                          f"Palette: {palette} tones only. {TAIL}")


def main():
    print("# Sterling silver chains: image prompts\n")
    print("nano_banana_2, resolution 2k, 1:1, count 1 (about 2 credits each, 30 frames = about 60 credits).")
    print("Etsy rule since 2026-10-22: every listing also needs at least one real, unedited photo of the "
          "actual chain (slot 06). These AI frames do not replace it.\n")
    for row in LISTINGS:
        lid, chain, piece, w, palette = row[:5]
        print(f"## {lid} {chain.title()} {piece} ({w} mm hero, palette: {palette})\n")
        for name, p in frames(*row):
            assert "gold" not in p.replace("no gold anywhere", "").replace("no yellow or gold tint", "") , (lid, name)
            assert p.count(palette) >= 1 or name.startswith("04"), (lid, name)
            print(f"**{name}**\n\n> {p}\n")


if __name__ == "__main__":
    main()
