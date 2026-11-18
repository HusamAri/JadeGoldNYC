"""Step 5 of the gram audit: the per-listing and per-variant table (XLSX, opened and saved as Numbers on the Mac).

usage: PYTHONPATH=<openpyxl target> python3 table.py <offerings_before.json> <titles.json> <out.xlsx>
Inputs: the Etsy dry run of 2026-11-18 (every offering's live price before the write and the new price) and params.json.
Also writes prices.csv next to this file. Formulas are limited to arithmetic and ROUNDUP so Numbers keeps them.
"""
import csv, json, re, sys
from collections import defaultdict
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
HERE = Path(__file__).resolve().parent
SPOT = 3733.25
GPG = {10: 50.05, 14: 70.22, 18: 90.02}
LABOR, FIXED, FEE, SALE = 130, 22.45, 0.905, 0.75
off = json.load(open(sys.argv[1])); titles = json.load(open(sys.argv[2])); P = json.load(open(HERE / "params.json"))
rules = sorted(P["rows"], key=lambda r: -len(r["sku"]))


def karat(sku):
    m = re.search(r"-(1[048])K", sku) or re.search(r"-(1[048])[YWR](-|$)", sku)
    return int(m.group(1)) if m else 14


def rule(sku):
    for r in rules:
        if sku.startswith(r["sku"] + "-"):
            return r
    return {"sku": "", "why": "open rectangle necklace: Blender model, set outright" if sku.startswith("BAS-M11-") else P["default"]["why"]}


def grade(why):
    if "Blender" in why: return "C  3D model"
    if "no anchor" in why or "+ 15%" in why and "cuff" not in why: return "D  estimate + 15%"
    if "supplier" in why or "retail" in why: return "B  supplier chain data"
    if "ratio" in why or "raised to the maker" in why: return "B  maker ratio"
    return "A  maker list or quote"


rows = []
for lid, o in off:
    k = karat(o["sku"]); new = o["panel"]
    g = round((new * FEE * SALE - LABOR - FIXED) / GPG[k], 2)      # inverts the price rule; within 0.02 g of the panel
    rows.append({"listing": lid, "sku": o["sku"], "karat": k, "grams": g, "etsy_before": o["etsy"], "new": new, "why": rule(o["sku"])["why"]})
with open(HERE / "prices.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["listing", "sku", "karat", "grams", "etsy_before_usd", "new_usd"])
    for r in rows: w.writerow([r["listing"], r["sku"], r["karat"], r["grams"], r["etsy_before"], r["new"]])
by = defaultdict(list)
for r in rows: by[r["listing"]].append(r)
wb = Workbook(); H = Font(bold=True, color="FFFFFF"); HF = PatternFill("solid", fgColor="1F2A37")


def head(ws, cols, widths):
    ws.append(cols)
    for i, w in enumerate(widths, 1):
        c = ws.cell(1, i); c.font = H; c.fill = HF; c.alignment = Alignment(wrap_text=True, vertical="center")
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"


ws = wb.active; ws.title = "Listings"
head(ws, ["Listing ID", "Title", "Variants", "Gram source", "Trust", "14K grams low", "14K grams high", "Etsy from, before", "Etsy to, before",
          "New from", "New to", "Change of from price", "Cheapest variant cost", "Cheapest variant, buyer pays at 25% sale", "Left after fees at 25% sale", "Note"],
     [13, 52, 9, 58, 20, 10, 10, 11, 11, 10, 10, 11, 12, 14, 12, 40])
n = 1
for lid, rs in sorted(by.items(), key=lambda kv: kv[1][0]["sku"]):
    n += 1
    g14 = [r["grams"] for r in rs if r["karat"] == 14] or [r["grams"] / {10: 0.892, 18: 1.137}[r["karat"]] for r in rs]
    lo = min(rs, key=lambda r: r["new"])
    note = ""
    if re.search(r"-E\d\d", lo["sku"]) or "L07" in lo["sku"]: note = "Maker's written lines for an enamel earring pair run above 130 labor; check before a sale"
    if "CERCLE" in lo["sku"]: note = "Diamonds are not in the cost; add the stone cost"
    ws.append([lid, titles.get(str(lid), ""), len(rs), rs[0]["why"], grade(rs[0]["why"]), round(min(g14), 2), round(max(g14), 2),
               min(r["etsy_before"] for r in rs), max(r["etsy_before"] for r in rs), min(r["new"] for r in rs), max(r["new"] for r in rs),
               f"=J{n}/H{n}-1", round(lo["grams"] * GPG[lo["karat"]] + LABOR, 2), f"=J{n}*{SALE}", f"=N{n}*{FEE}-{FIXED}-M{n}", note])
    ws.cell(n, 12).number_format = "0%"
ws2 = wb.create_sheet("Variants")
head(ws2, ["Listing ID", "SKU", "Karat", "Grams", "Gold per gram", "Gold cost", "Labor", "Cost", "Break-even list price", "Etsy before", "New price", "Change"],
     [13, 34, 7, 8, 9, 10, 8, 10, 12, 11, 10, 9])
for i, r in enumerate(sorted(rows, key=lambda r: r["sku"]), 2):
    ws2.append([r["listing"], r["sku"], r["karat"], r["grams"], GPG[r["karat"]], f"=D{i}*E{i}", LABOR, f"=F{i}+G{i}",
                f"=ROUNDUP((H{i}+{FIXED})/({FEE}*{SALE}),0)", r["etsy_before"], r["new"], f"=K{i}/J{i}-1"])
    ws2.cell(i, 12).number_format = "0%"
ws3 = wb.create_sheet("Rule and open items")
for line in [["Rule"], [f"Gold spot {SPOT} USD per troy ounce on 2026-11-18. Per gram: 10K {GPG[10]}, 14K {GPG[14]}, 18K {GPG[18]}."],
             ["Cost = grams x gold per gram + 130 labor."], ["List price = (cost + 22.45 shipping, packaging and fixed fee) / (0.905 x 0.75), rounded up to the dollar."],
             ["That is break-even at a 25% sale with 9.5% Etsy fees. At today's 15% sale about 10% of the buyer's price is left for ads and profit."],
             ["Grams are the careful figure: maker's figures where he gave them, his ratios on similar pieces, supplier chain data, or a 3D model plus 15%."], [],
             ["Not changed"], ["6 sterling silver listings: priced on the 12 November rule."],
             ["4581283366 star lariat, 1,454.75 and 4581302864 V necklace with lab diamond, 2,087.25: no variants and no SKU, so the tool cannot write them. Floors: about 590, and about 570 plus the stone."],
             ["4612132585 private custom order listing, 400: left as agreed with the buyer."], [],
             ["Open items"], ["Earrings: the maker's lines for an enamel pair (posts 100, enamel 50, assembly 50) are above 130 before gold. Earrings are priced on 130 as instructed."],
             ["Offsite Ads fee (12% to 15% on an attributed order) is not in the floor."], ["Gold moves: a 5% rise in spot removes about 2% to 4% of the buyer's price."]]:
    ws3.append(line)
ws3.column_dimensions["A"].width = 150
wb.save(sys.argv[3])
print(len(by), "listings", len(rows), "offerings")
