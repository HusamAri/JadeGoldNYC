"""FW26 Trend Edit, Task 3: exports, manufacturing brief for Efe, photo plan.

Reads listings/*.json and state.json only; writes
  exports/fw26-listings.xlsx, exports/fw26-listings.csv,
  production/manufacturing-brief-efe.md, photography/photo-plan.md
Run from this folder after build_listings.py and validate_listings.py.
"""
import csv, glob, json, pathlib, re

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

HERE = pathlib.Path(__file__).parent
L = [json.load(open(p, encoding="utf-8")) for p in sorted(glob.glob(str(HERE / "listings" / "*.json")))]
STATE = json.load(open(HERE / "state.json", encoding="utf-8"))
assert len(L) == 10, len(L)
STATUS = {k.split("-", 1)[0]: v["status"] for k, v in STATE["listings"].items()}
BANNED = "—–âÂ"


def status(l):
    return STATUS[l["id"][1:]]


def money(x):
    return f"${x:,.2f}"


def variants(l):
    n = 1
    for v in l["variations"]:
        n *= len(v["values"])
    return n


def tsv_variations(l):
    return "; ".join(f"{v['property']}: {' / '.join(v['values'])}" + (" (price varies)" if v["price_varies"] else "") for v in l["variations"])


def personalization(l):
    p = l["personalization"]
    if not p["enabled"]:
        return "Off"
    return f"On, {'required' if p['required'] else 'optional'}, max {p['max_chars']} characters. {p['instructions']}"


# ---------- xlsx ----------
wb = Workbook()
ov = wb.active
ov.title = "Overview"
head = ["#", "Name", "Trend", "Category", "Variants", "10K list", "14K list", "18K list", "14K shown in sale", "Personalized", "Status"]
ov.append(head)
for l in L:
    pr = l["prices"]
    ov.append([l["id"], l["name"], l["trend"]["anchor"].split(" (")[0], l["category"], variants(l),
               pr["10K"]["list"], pr["14K"]["list"], pr["18K"]["list"], pr["14K"]["sale"],
               "yes" if l["personalization"]["enabled"] else "no", status(l)])
for c in ov[1]:
    c.font = Font(bold=True)
for col, w in zip("ABCDEFGHIJK", (5, 20, 20, 48, 9, 11, 11, 11, 16, 12, 11)):
    ov.column_dimensions[col].width = w
for row in ov.iter_rows(min_row=2, min_col=6, max_col=9):
    for c in row:
        c.number_format = '"$"#,##0.00'

for l in L:
    ws = wb.create_sheet(l["id"])
    ws.append(["Field", "Value"])
    pr = l["prices"]
    fields = [
        ("Name", l["name"]), ("Title", l["title"]), ("Title length", len(l["title"])),
        ("Category", l["category"]), ("Section", l["section"]),
        ("Tags", ", ".join(l["tags"])), ("Materials", ", ".join(l["materials"])),
        ("Attributes", "; ".join(f"{k}: {v}" for k, v in l["attributes"].items())),
        ("Variations", tsv_variations(l)), ("Variants", variants(l)),
        ("Personalization", personalization(l)),
        ("Processing time", l["processing_days"]), ("Quantity", l["quantity"]),
        ("Who made it / what / when", f"{l['about']['who_made']} / {l['about']['what']} / {l['about']['when_made']}"),
        ("Prices (list / shown in sale)", "; ".join(f"{k} {money(pr[k]['list'])} / {money(pr[k]['sale'])}" for k in pr)),
    ]
    if l.get("variant_prices"):
        fields.append(("Price per variation", "; ".join(
            f"{k} {opt} {money(v['list'])}" for k, row in l["variant_prices"].items() for opt, v in row.items())))
    fields += [("Description", l["description"]), ("Trend", f"{l['trend']['anchor']}; secondary: {l['trend']['secondary']}"),
               ("Manufacturing note", l["manufacturing_note"]),
               ("Photo plan", "\n".join(f"{i}. {s}" for i, s in enumerate(l["photo_plan"], 1))),
               ("Video", l["video"]), ("Visualization prompt (internal mock only)", l["visualization_prompt"]),
               ("Deviations from the brief", "\n".join(f"{d['field']}: {d['used']}. {d['evidence']}" for d in l.get("deviations", []))),
               ("Status", status(l))]
    for f, v in fields:
        ws.append([f, v])
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 110
    for row in ws.iter_rows():
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    ws["A1"].font = ws["B1"].font = Font(bold=True)

tg = wb.create_sheet("Tags")
tg.append(["#"] + [f"Tag {i}" for i in range(1, 14)] + ["Longest"])
for l in L:
    tg.append([l["id"]] + l["tags"] + [max(len(t) for t in l["tags"])])
tg.append([])
tg.append(["Rule: 13 tags, each 20 characters or fewer, lowercase letters, digits and spaces (validate_listings.py)."])

pg = wb.create_sheet("Pricing")
pg.append(["#", "Option", "Est. 14K grams", "Make-floors", "Adders", "Adders detail", "14K base",
           "10K list", "14K list", "18K list", "10K sale", "14K sale", "18K sale"])
for l in L:
    opts = l.get("set_options") or {"": l["pricing_basis"]}
    for o, b in opts.items():
        if o:
            pr = {k: l["variant_prices"][k][o] for k in ("10K", "14K", "18K")}
        else:
            pr = l["prices"]
        pg.append([l["id"], o or "base option", b["grams14"], b["pieces"], b["adders"],
                   l["pricing_basis"]["adders_detail"] if not o or o == next(iter(opts)) else "set of 3: three make-floors + three engravings",
                   b["base14"]] + [pr[k]["list"] for k in ("10K", "14K", "18K")] + [pr[k]["sale"] for k in ("10K", "14K", "18K")])
pg.append([])
for line in ["Model (BRIEF.md section 4): 14K base = 320 per piece + 100 per gram of 14K + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; sale display = list x 0.70.",
             "Chain lengths: 16 in is the base price; 18 and 20 in add the reference listing's steps (4590337023: 10K +20/+20, 14K +20/+30, 18K +40/+40 on the base). See each listing sheet.",
             "Efe's cast weights override every gram estimate: update grams14 in build_listings.py, rebuild, revalidate.",
             "Margin check 2026-10-17 against maker_cost.py at the sale price after 12% fees: lowest 30% (L05 18K), before garnet cost."]:
    pg.append([line])
for col, w in zip("ABCDEFGHIJKLM", (5, 13, 13, 11, 8, 48, 9, 11, 11, 11, 11, 11, 11)):
    pg.column_dimensions[col].width = w
for c in pg[1]:
    c.font = Font(bold=True)
for row in pg.iter_rows(min_row=2, min_col=8, max_col=13):
    for c in row:
        if isinstance(c.value, (int, float)):
            c.number_format = '"$"#,##0.00'

(HERE / "exports").mkdir(exist_ok=True)
wb.save(HERE / "exports" / "fw26-listings.xlsx")

# ---------- csv ----------
with open(HERE / "exports" / "fw26-listings.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["id", "name", "title", "category", "section", "tags", "materials", "variations", "personalization",
                "processing", "price_10k_list", "price_14k_list", "price_18k_list", "description", "status"])
    for l in L:
        pr = l["prices"]
        w.writerow([l["id"], l["name"], l["title"], l["category"], l["section"], ",".join(l["tags"]), ",".join(l["materials"]),
                    tsv_variations(l), personalization(l), l["processing_days"],
                    pr["10K"]["list"], pr["14K"]["list"], pr["18K"]["list"], l["description"], status(l)])

# ---------- manufacturing brief ----------
mb = ["# FW26 Trend Edit: manufacturing brief for Efe", "",
      "Ten new designs for by Artifact Studio Jewelry, made to order. Every gram below is an estimate from the design;",
      "your cast weights replace them and the prices are recomputed from them. Nothing here is plated: solid gold,",
      "kiln-fired vitreous enamel, natural garnet.", "",
      "## Weights to confirm", "",
      "Fill in the 14K weight of the first cast (with chain where the piece ships with one).", "",
      "| # | Piece | Estimate (14K) | Cast weight (14K) | 10K or 18K weighed? |", "|---|---|---|---|---|"]
for l in L:
    opts = l.get("set_options")
    est = " / ".join(f"{o}: {b['grams14']} g" for o, b in opts.items()) if opts else f"{l['pricing_basis']['grams14']} g"
    mb.append(f"| {l['id']} | {l['name']} | {est} |  |  |")
mb += ["", "## Tools and masters to make", "",
       "- Wedge punch set (hardened steel, three heads: 1.6, 2.4 and 3.2 mm) and a sign card with TI, SHA, E and AN and their stroke order (L06).",
       "- Two paw templates, dog and cat, so every intaglio stays consistent (L09).",
       "- Masters: seal cylinder with 12 flutes (L01), eight-petal rosette (L02), pomegranate with crown (L05), infinity loop with the set-of-2 and set-of-3 wave cuts cut in wax (L08), almond and iris connectors (L10).",
       "- Ur Band master per size, US 4 to 10 in half sizes (13 masters, or one CAD file scaled per size) (L04).",
       "- Torch-textured master for the Thaw Hoops if reticulation yield on 10K is poor (L07).", "",
       "## Alloy questions", "",
       "1. Is your 10K yellow alloy safe for enamel firing at 780 to 820 C? If not, the Ur Band (L04) drops 10K.",
       "2. Does enamel hold on your white and rose alloys? L05 Nar and L10 Twin Eye offer all three colors; if not, they go yellow only.",
       "3. For the Thaw Hoops (L07) white gold tip: palladium white rather than nickel white, and no rhodium. Is that available?",
       "4. Fibula (L03) in 18K: the note asks for 1.4 mm wire for spring tension. Please weigh the 18K sample; the price is built on 1.3 mm.",
       "5. Processing time: L01, L06, L08, L09 and L10 are listed at 5 to 7 business days (engraving or sets), the rest at 3 to 5. Confirm both.", "",
       "## Pieces", ""]
for l in L:
    mb += [f"### {l['id']} {l['name']}", "", f"Variations: {tsv_variations(l)}", "", l["manufacturing_note"], ""]
(HERE / "production").mkdir(exist_ok=True)
(HERE / "production" / "manufacturing-brief-efe.md").write_text("\n".join(mb), encoding="utf-8")

# ---------- photo plan ----------
SETUPS = [
    ("bench", "The bench: process frames and process video", r"^process|torch|hands (cutting|forging|finishing|cleaning)|wet-packing|kiln|graver|striking|bead-setting"),
    ("people", "People and pets: the piece worn, in its moment", r"\bworn\b(?! leather)|on ear|on hand|wrist|friends|person|dog in frame|cat on|on a tuxedo|lapel, worn|chest crop|capelet|through a wool scarf|sweater pin|fingers of two|open palm|on skin|layered with|stacked|behind a lapel|holiday table"),
    ("velvet", "Velvet and warm light: deep backgrounds (Operatic Drama)", r"velvet|jacquard|candle|opera|gift box|evening"),
    ("linen", "Cream linen and raking light: texture and shine close-ups", r"."),
]
groups = {k: [] for k, _, _ in SETUPS}
OPERATIC = {"L01", "L02", "L03"}   # brief section 5: deep backgrounds and warm light for every L01 to L03 still
for l in L:
    for i, s in enumerate(l["photo_plan"], 1):
        for k, _, rx in SETUPS:
            if k == "linen" and l["id"] in OPERATIC and "linen" not in s.lower():
                k = "velvet"
            if re.search(rx, s, re.I):
                groups[k].append(f"- {l['id']} {l['name']}, slot {i}: {s}")
                break
    groups["bench"].append(f"- {l['id']} {l['name']}, video: {l['video']}")
brief = (HERE / "BRIEF.md").read_text(encoding="utf-8")
spec = re.search(r"## 5\. Photography spec.*?\n\n(.*?)\n\n## 6", brief, re.S).group(1)
pp = ["# FW26 Trend Edit: photo plan", "", "## Shoot spec", "", spec, "",
      "Listing images are real photographs of real samples; the visualization prompts in the listing files are internal mocks only.", "",
      "## Shoot day in four setups", "",
      f"Every frame of the ten plans, {sum(len(l['photo_plan']) for l in L)} stills plus 10 videos, sorted into one setup each so the lights move four times, not forty.", ""]
for k, title, _ in SETUPS:
    pp += [f"### {title} ({len(groups[k])})", ""] + groups[k] + [""]
pp += ["## Checklist", "", "- Samples of all ten pieces, plus the three metal colors where a frame shows them side by side.",
       "- Props: black and deep green velvet, dark jacquard, cream and dark linen, raw clay or unglazed stoneware, a split pomegranate, pine sprig, candles, opera glasses, a leather dog collar, US quarter and dime, gift boxes.",
       "- People: a tuxedo or dark wool lapel, a capelet, three friends for L08, two wrists for L10, a dog and a cat for L09.",
       "- Bench: needle files, saw frame, planishing hammer and steel block, torch and charcoal block, kiln, wedge punches, gravers, microscope.", ""]
(HERE / "photography").mkdir(exist_ok=True)
(HERE / "photography" / "photo-plan.md").write_text("\n".join(pp), encoding="utf-8")

# ---------- checks ----------
for p in ["exports/fw26-listings.csv", "production/manufacturing-brief-efe.md", "photography/photo-plan.md"]:
    t = (HERE / p).read_text(encoding="utf-8")
    assert not any(c in t for c in BANNED), p
assert sum(len(v) for v in groups.values()) == sum(len(l["photo_plan"]) + 1 for l in L)
print({k: len(v) for k, v in groups.items()})
print("wrote exports/fw26-listings.xlsx, exports/fw26-listings.csv, production/manufacturing-brief-efe.md, photography/photo-plan.md")
