# -*- coding: utf-8 -*-
"""
pins.py + hosted.json → Pinterest içe aktarma dosyaları.
    python3 sheet.py <şablon.xlsx> <çıktı_dizin>
Şablon, kullanıcının "pinterest-import-kit" zip'indeki import-template.xlsx:
satır 1 başlık, satır 2 açıklama, veri satır 3'ten başlar; F/H/I sütunlarının
açılır listeleri ve J sütunundaki STATUS formülü korunur.
"""
import csv, json, os, re, sys
import openpyxl
from pins import PINS

tpl, out = sys.argv[1:3]
hosted = json.load(open(os.path.join(os.path.dirname(__file__), "hosted.json")))
BOARDS = {"Bracelets", "Necklaces", "Rings", "Studo Jewelry"}

rows = []
for p in PINS:
    r = dict(image_url=hosted[str(p["n"])]["url"], title=p["title"], description=p["desc"],
             alt_text=p["alt"], link=p["link"], board=p["board"], board_section="",
             priority=p["pr"], aspect_ratio="2:3")
    assert r["image_url"].startswith("https://")
    assert len(r["title"]) <= 100, (p["n"], len(r["title"]))
    assert len(r["description"]) <= 500 and len(r["alt_text"]) <= 500, p["n"]
    assert r["board"] in BOARDS and r["priority"] in ("low", "high")
    for k in ("title", "description", "alt_text"):
        assert not re.search("[–—]", r[k]), (p["n"], k)  # em/en dash yok
    rows.append(r)
assert len({r["image_url"] for r in rows}) == 60

cols = ["image_url", "title", "description", "alt_text", "link", "board", "board_section", "priority", "aspect_ratio"]
wb = openpyxl.load_workbook(tpl)
ws = wb["Import Data"]
for i, r in enumerate(rows):
    for j, c in enumerate(cols):
        ws.cell(row=3 + i, column=1 + j, value=r[c] or None)
os.makedirs(out, exist_ok=True)
wb.save(os.path.join(out, "artifact-studio-pinterest-60.xlsx"))
with open(os.path.join(out, "artifact-studio-pinterest-60.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    w.writerows(rows)
from collections import Counter
print(len(rows), Counter(r["board"] for r in rows), Counter(r["priority"] for r in rows))
