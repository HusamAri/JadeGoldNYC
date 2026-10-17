import json, re, sys, glob

BANNED = {"\u2014": "em dash", "\u2013": "en dash", "\u00e2": "a circumflex", "\u00c2": "A circumflex"}
FORBIDDEN = ["gilded", "hand painted", "hand-painted", "plated", "customer", "placeholder", "tbd", "lorem"]
VOCAB = ["heirloom jewelry", "opera inspired", "vintage style", "maximalist", "bold color", "whimsical",
         "hand forged", "hand stamped", "hand textured", "hand engraved", "hand enameled", "kiln fired",
         "handmade", "friend group gift", "friendsmas", "matching", "custom pet gift", "personalized",
         "gemstone", "sculptural", "lapel pin"]

def check(l):
    e = []
    t = l["title"]
    if len(t) > 140: e.append(f"title {len(t)} chars")
    if any(c in "$^`" for c in t): e.append("title has $ ^ or backtick")
    if len([w for w in re.findall(r"[A-Za-z]{2,}", t) if w.isupper()]) > 3: e.append("more than 3 all-caps words")
    if len(l["tags"]) != 13: e.append(f"{len(l['tags'])} tags, need 13")
    for tag in l["tags"]:
        if len(tag) > 20: e.append(f"tag over 20: {tag}")
        if not re.fullmatch(r"[a-z0-9 ]+", tag): e.append(f"tag characters: {tag}")
    if len({x.lower() for x in l["tags"]}) != 13: e.append("duplicate tags")
    if not 1 <= len(l["materials"]) <= 13 or any(len(m) > 45 for m in l["materials"]): e.append("materials")
    blob = json.dumps(l, ensure_ascii=False)
    for ch, name in BANNED.items():
        if ch in blob: e.append(f"banned character: {name}")
    d = l["description"].lower().replace("nothing plated or filled", "")
    for p in FORBIDDEN:
        if p in d: e.append(f"forbidden phrase: {p}")
    if re.search(r"\bvintage\b(?! style)(?! inspired)", d): e.append("bare vintage claim")
    for must in ["made to order", "new jersey", "gift message", "solid"]:
        if must not in d: e.append(f"description missing: {must}")
    p = l.get("personalization", {})
    if p.get("enabled"):
        if len(p.get("instructions", "")) > 256: e.append("personalization instructions over 256")
        if "check the spelling" not in d: e.append("engraved piece needs the spelling notice")
    hay = (t + " " + " ".join(l["tags"]) + " " + l["description"]).lower()
    if len([v for v in VOCAB if v in hay]) < 2: e.append("fewer than 2 trend terms")
    pr = l["prices"]
    if not pr["10K"]["list"] < pr["14K"]["list"] < pr["18K"]["list"]: e.append("price ladder order")
    return e

bad = 0
for path in sorted(glob.glob("listings/*.json")):
    l = json.load(open(path, encoding="utf-8"))
    errs = check(l)
    print(("FAIL " if errs else "ok   ") + path, "; ".join(errs))
    bad += bool(errs)
sys.exit(1 if bad else 0)
