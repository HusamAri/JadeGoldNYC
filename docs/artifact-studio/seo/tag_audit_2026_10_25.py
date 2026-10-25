"""ON HOLD (2026-10-25): the "current" tags below are the researched 2026-10-21 keyword matrix
(docs/artifact-studio/seo/2026-10-21-etsy-keyword), live since 21-22 Oct. The search-click data that
flagged these listings is mostly from BEFORE that pass, so it cannot judge these tags yet. Do not push
before the 21 Nov baseline read (STATE.md); overwriting now also breaks that comparison.

Tag audit for 9 active listings that only drew search clicks from page 4+ (Etsy search-click data, 2026-09-25 to 10-24).
Rule: keep tags that name the product as a buyer types it; swap generic giant-pool tags and tags that misdescribe the piece.
Picks are by specificity, not measured search volume (no volume data in the panel). Run: python3 tag_audit_2026_10_25.py
"""
import json, re, pathlib
CUR = {}  # filled from the panel mirror at audit time (listing id -> current 13 tags)
SWAP = {
 4585875423: ("Domino ring", {"polished ring": "black and cream ring", "graphic ring": "gold domino ring",
               "black ring": "gold bar ring", "colorful enamel ring": "east west ring"}),
 4586539516: ("Water Drop anklet", {"summer anklet": "blue enamel anklet", "gift for her": "blue drop anklet",
               "anklet for women": "raindrop anklet", "blue anklet": "beach anklet gold"}),
 4583755381: ("Petal pendant", {"gift for her": "pink enamel necklace", "cable chain necklace": "pink petal pendant",
               "pink necklace": "flower petal charm"}),
 4590691531: ("Dome band", {"3mm ring": "3mm gold band", "ring for him": "gold ring for men",
               "dome ring": "classic gold band"}),
 4590691215: ("Bar drop earrings", {"12mm earrings": "single bar earring", "minimalist earrings": "gold dangle earring",
               "mens earrings": "10k gold earrings", "bar earrings": "unisex bar earrings"}),
 4585872073: ("Domino studs", {"4mm studs": "mismatched earrings", "black studs": "black cream earrings",
               "tiny gold studs": "odd pair earrings"}),
 4590335799: ("Snowflake bracelet", {"6mm bracelet": "snowflake jewelry", "sculpted bracelet": "winter bracelet",
               "snowflake charm": "gold snowflake charm"}),
 4583755619: ("Orange dot bracelet", {"disc charm": "orange enamel charm", "circle bracelet": "14k enamel bracelet",
               "orange bracelet": "dot bracelet gold"}),
 4590349492: ("Christmas tree ring", {"green ring": "green enamel ring", "festive jewelry": "xmas tree ring",
               "gift for her": "holiday ring gold"}),
}
if __name__ == "__main__":
    cur = json.load(open(pathlib.Path(__file__).with_name("tag_audit_current.json")))
    out = {}
    for lid, (name, swap) in SWAP.items():
        tags = cur[str(lid)]
        for old in swap: assert old in tags, (lid, old)
        new = [swap.get(t, t) for t in tags]
        assert len(new) == 13 and len(set(new)) == 13, lid
        for t in new: assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), (lid, t)
        out[lid] = {"name": name, "tags": new, "swapped": swap}
    pathlib.Path(__file__).with_name("tag_audit_2026_10_25.json").write_text(json.dumps(out, indent=1) + "\n")
    print(len(out), "listings,", sum(len(v["swapped"]) for v in out.values()), "tags swapped")
