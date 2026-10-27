"""Titles, tags and descriptions for S01..S06. Run: python3 listings.py  (writes listings.json + listings.md)

Rules (docs/etsy-playbook/03-seo.md, 01-fees-compliance.md): title under 15 words, no repeated word, no
subjective or gift words; 13 tags, each 20 chars or less, no duplicates; no "diamond" anywhere (unqualified
"diamond" means a stone under FTC 23.12, so the finish is "faceted"); no origin claim (catalog does not say
Italy); rhodium plating claimed for Franco only (catalog: "RH Solid Franco").
"""
import json, re
from pricing import CHAINS, LENGTHS, IDS

NAMES = {"franco": "Franco", "cuban": "Cuban Curb", "figaro": "Figaro"}
TITLES = {
    "S01": "925 Sterling Silver Franco Chain Necklace, Rhodium Plated, 2.2 to 5.2mm, Men's",
    "S02": "925 Sterling Silver Franco Bracelet, Rhodium Plated Chain, 2.2 to 5.2mm, Men's",
    "S03": "925 Sterling Silver Cuban Curb Chain Necklace, Flat Faceted Links, 3.3 to 10.2mm, Men's",
    "S04": "925 Sterling Silver Cuban Link Bracelet, Flat Curb Chain, 3.3 to 10.2mm, Men's",
    "S05": "925 Sterling Silver Figaro Chain Necklace, 3+1 Faceted Links, 3.4 to 10.3mm, Men's",
    "S06": "925 Sterling Silver Figaro Bracelet, Flat 3+1 Link Chain, 3.4 to 10.3mm, Men's",
}
TAGS = {
    "S01": ["franco chain", "mens silver chain", "sterling franco", "silver franco chain", "925 silver necklace",
            "mens franco necklace", "franco link chain", "rhodium silver chain", "thick silver chain",
            "everyday mens chain", "solid silver chain", "square link chain", "mens neck chain"],
    "S02": ["franco bracelet", "mens silver bracelet", "sterling bracelet", "silver franco links",
            "925 silver bracelet", "mens chain bracelet", "rhodium bracelet", "solid 925 bracelet",
            "square link bracelet", "mens wrist chain", "thick silver links", "mens stack bracelet",
            "mens franco bracelet"],
    "S03": ["cuban link chain", "mens silver chain", "silver curb chain", "cuban curb necklace",
            "925 silver necklace", "flat curb chain", "mens cuban necklace", "faceted curb links",
            "thick silver chain", "solid silver chain", "sterling cuban", "mens neck chain", "classic curb chain"],
    "S04": ["cuban link bracelet", "mens silver bracelet", "curb chain bracelet", "silver cuban links",
            "925 silver bracelet", "flat curb bracelet", "mens cuban bracelet", "faceted curb links",
            "thick silver links", "sterling bracelet", "mens wrist chain", "solid silver links",
            "mens stack bracelet"],
    "S05": ["figaro chain", "mens silver chain", "silver figaro chain", "figaro necklace men",
            "925 silver necklace", "3 plus 1 chain", "flat figaro links", "faceted figaro",
            "solid silver chain", "sterling figaro", "mens neck chain", "classic figaro links",
            "thick silver chain"],
    "S06": ["figaro bracelet", "mens silver bracelet", "silver figaro links", "figaro bracelet men",
            "925 silver bracelet", "3 plus 1 bracelet", "flat figaro chain", "faceted figaro",
            "sterling bracelet", "mens wrist chain", "solid silver links", "thick silver links",
            "mens stack bracelet"],
}
LOOK = {
    "franco": ("Franco is a square chain: V-shaped links locked tightly into each other, so every side shows the same "
               "chevron pattern and the chain sits straight and does not kink. It is rhodium plated over the "
               "sterling silver for a bright white finish."),
    "cuban": ("Cuban curb links are flat ovals twisted so the chain lies completely flat, each link cut with bright "
              "flat facets that catch the light from every angle."),
    "figaro": ("Figaro repeats three short links and one long link, all flat and faceted, the classic pattern that "
               "reads clean at any width."),
}
SHIP = ("Made to order at our bench in New Jersey and shipped within 2 business days, free US shipping, gift box included.")  # owner 2026-10-27
# Owner 2026-10-27: no image-visualization disclosure in descriptions (removed live via ops/desc-strip).


def description(lid, chain, piece):
    lens = LENGTHS[piece]
    rows = []
    for w, g18 in CHAINS[chain].items():
        ref = 20 if piece == "necklace" else 8
        rows.append(f"- {w} mm: about {g18 * ref / 18:.1f} g at {ref} inches")
    noun = "necklace" if piece == "necklace" else "bracelet"
    first = (f"Solid 925 sterling silver {NAMES[chain]} chain {noun} for men, made to order in your width and "
             f"length: {min(CHAINS[chain])} to {max(CHAINS[chain])} mm wide, {lens[0]} to {lens[-1]} inches.")
    body = [first, "", LOOK[chain], "",
            "Widths and approximate weight (weight grows with length):", *rows, "",
            f"- Lengths: {', '.join(str(x) for x in lens)} inches, measured end to end with the clasp.",
            "- Lobster clasp, stamped 925 on the tag plate.",
            "- Solid links, not hollow, no stones.",
            f"- {SHIP}"]
    return "\n".join(body)


def main():
    out = {}
    titles = set()
    for (chain, piece), lid in IDS.items():
        t = TITLES[lid]; words = re.findall(r"[\w.+']+", t.lower())
        assert len(words) < 15, (lid, len(words))
        assert len(words) == len(set(words)), (lid, [w for w in words if words.count(w) > 1])
        assert t not in titles; titles.add(t)
        tags = TAGS[lid]
        assert len(tags) == 13 and len(set(tags)) == 13, lid
        assert all(len(x) <= 20 for x in tags), [x for x in tags if len(x) > 20]
        d = description(lid, chain, piece)
        blob = (t + " " + " ".join(tags) + " " + d).lower()
        assert "diamond" not in blob and "ital" not in blob and "gift for" not in blob, lid
        if chain != "franco":
            assert "rhodium" not in blob, lid
        out[lid] = {"title": t, "tags": tags, "description": d, "chain": chain, "piece": piece}
    json.dump(out, open("listings.json", "w"), indent=1)
    with open("listings.md", "w") as f:
        f.write("# Sterling silver chains: listing copy\n\nGenerated by `listings.py`.\n")
        for lid, v in out.items():
            f.write(f"\n## {lid}\n\n**Title:** {v['title']}\n\n**Tags:** {', '.join(v['tags'])}\n\n"
                    f"**Description:**\n\n{v['description']}\n")
    print("ok", len(out))


if __name__ == "__main__":
    main()
