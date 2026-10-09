"""catalog.json + heroes.json + shots.json + 01-design-direction.md -> CHATGPT-HANDOFF.md

Owner 2026-10-09: images and listings continue in ChatGPT; this file carries everything
needed there. Run: python3 docs/artifact-studio/evil-eye/chatgpt_handoff.py
"""
import json, pathlib, re

H = pathlib.Path(__file__).parent
cat = json.load(open(H / "catalog.json"))
heroes = {h["id"]: h for h in json.load(open(H / "heroes.json"))["items"]}
shots = json.load(open(H / "shots.json"))
spec = (H / "01-design-direction.md").read_text()

def section(title):
    m = re.search(rf"^## {re.escape(title)}\n(.*?)(?=^## )", spec, re.S | re.M)
    return m.group(1).strip() if m else ""

items = cat["items"]
order = {"ring": 0, "necklace": 1, "bracelet": 2}
items.sort(key=lambda i: (i["familyNo"], order[i["productType"]]))

out = []
fr = ["# Evil Eye Collection: sales frame prompts (10 per listing)\n\nOne image per prompt, square 1:1, 2048 px. Reference: a tight crop of that listing's approved hero, the piece only.\n"]
rows = []
w = out.append
w("# Evil Eye Collection: ChatGPT handoff (by Artifact Studio Jewelry)\n")
w("Built 2026-10-09 from the repo (`docs/artifact-studio/evil-eye/`). Everything needed to generate the "
  "images and prepare the 30 Etsy listings in ChatGPT. Source of truth stays the repo; if you change a "
  "price, title or variant there, the panel will not know until it is brought back.\n")
w("## How to use this file in ChatGPT\n")
w("1. Paste the whole file, then say: \"Work listing by listing. Start with R01.\"\n"
  "2. Images: generate the reference hero first (text only, square 1:1, 2048 px). Check it against the "
  "piece description, then generate the 10 sales frames using a tight crop of the approved hero as the "
  "only reference (crop to the piece; never pass the paper, angle or framing on).\n"
  "3. One image per prompt. Reject a frame that shows a second piece, a hand without five fingers, wrong "
  "scale, domed enamel, lashes or a lid line, text or logos, or a redesigned piece.\n"
  "4. Listing: copy title, tags, materials, description into Etsy as a draft; variants and prices are in variants.csv; the 10 frame prompts per listing are in CHATGPT-FRAMES.md.\n")
w("## Fixed rules\n")
w("- Variants: full grid, Karat (10K/14K/18K) x Metal Color x size. Rings US 3 to 16 whole and half "
  "(243 variants), necklaces 16/18/20 in (27), bracelets 6.5/7/7.5 in (27). 2,970 variants in total.\n"
  "- Two-tone families (1 Halka, 6 Mother and Child, 7 Medal, 8 Twin Wire): Metal Color values are "
  "`Yellow/White Gold`, `White/Yellow Gold`, `Rose/White Gold` (first metal = main metal). Never a plain "
  "colour label on a two-metal piece. Others: Yellow Gold / White Gold / Rose Gold.\n"
  "- SKU: `BAS-EE-{id}-{karat}{Y|W|R|YW|WY|RW}-{size}`, max 32 characters.\n"
  "- Prices are ESTIMATES (2 x maker cost on the Christmas terms); two-tone pieces are unquoted and "
  "must not go live before the maker quote. Listings go up as drafts only.\n"
  "- Never in titles, tags or descriptions: protect, ward, luck, power of, healing, baby, newborn, "
  "christening, kids, hamsa, cross, Horus, Something Blue, designer names, \"Made in Turkey\".\n")
for t in ("Copy rules", "Image notes", "Production rules"):
    s = section(t) or (re.search(rf"^### {t}\n(.*?)(?=^##)", spec, re.S | re.M) or [None, ""])[1]
    if s:
        w(f"## {t} (from the design direction)\n\n{s.strip()}\n")

w("## The 30 listings\n")
for it in items:
    i, hp, sh = it["id"], heroes.get(it["id"], {}), shots.get(it["id"], {})
    w(f"### {i} · {it['name']} (family {it['familyNo']} {it['family']})\n")
    w(f"- **Title:** {it['title']}")
    w(f"- **Tags (13):** {', '.join(it['tags'])}")
    w(f"- **Materials:** {', '.join(it['materials'])}")
    w(f"- **Dimensions:** {it['dims']}")
    w(f"- **Metal Color values:** {', '.join(it['metalColors'])}")
    w(f"- **Variation axes:** {' x '.join(it['variationAxes'])} ({len(it['variants'])} variants)")
    w(f"- **Price, 14K {it['refSize']}:** ${it['refPriceCents'] // 100} (estimate)")
    prices = {}
    for v in it["variants"]:
        p = v["properties"]
        prices.setdefault(p["Karat"], set()).add(v["price_cents"] // 100)
    w("- **Price range by karat:** " + "; ".join(f"{k} ${min(s)} to ${max(s)}" for k, s in sorted(prices.items())))
    blockers = it.get("approval", {}).get("blockers", [])
    if blockers:
        w("- **Blockers:** " + " | ".join(b.split(":")[0] for b in blockers))
    w("\n**Description:**\n")
    w("```\n" + it["description"].strip() + "\n```\n")
    if hp:
        w("**Image 00, reference hero (text only):**\n")
        w("```\n" + hp["imagePrompt"].strip() + "\n```\n")
    if sh:
        p = sh["palette"]
        w(f"**Colour world:** {p['backdrop']} {p['hex']}, accent {p['accent']}, skin {p['skin']}. {p['why']}\n")
        w("**Sales frames 01 to 10:** " + "; ".join(f"{s['slot'][:2]} {s['title']}" for s in sh["shots"])
          + f". Full prompts: CHATGPT-FRAMES.md, section {i}.\n")
        fr.append(f"## {i} · {it['name']}\n\nColour world: {p['backdrop']} {p['hex']}, accent {p['accent']}, skin {p['skin']}.\n")
        for s in sh["shots"]:
            fr.append(f"### Frame {s['slot'][:2]} · {s['title']}\n\n```\n" + s["prompt"].strip() + "\n```\n")
    w(f"\nFull variant list with SKUs and prices: variants.csv (rows for {i}).\n")
    for v in it["variants"]:
        rows.append([i, it["name"], v["sku"], *[f"{k}: {x}" for k, x in v["properties"].items()], f"{v['price_cents'] / 100:.2f}"])

text = "\n".join(out)
for ch in ("—", "–"):
    text = text.replace(ch, ",")
(H / "CHATGPT-HANDOFF.md").write_text(text)
ftext = "\n".join(fr)
for ch in ("\u2014", "\u2013"):
    ftext = ftext.replace(ch, ",")
(H / "CHATGPT-FRAMES.md").write_text(ftext)
import csv
with open(H / "variants.csv", "w", newline="") as f:
    cw = csv.writer(f)
    cw.writerow(["listing", "name", "sku", "option 1", "option 2", "option 3", "price_usd"])
    cw.writerows(rows)
print("frames file", len(ftext), "chars;", len(rows), "variant rows")
print(len(items), "listings,", len(text), "chars")
