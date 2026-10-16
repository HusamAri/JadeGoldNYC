"""Ophir Christmas 2026: the maker's brief as one PDF.

Run: python3 docs/ophir/xmas26/maker_brief.py  -> maker-brief.html, then
     node docs/ophir/xmas26/render_pdf.js       -> Ophir-Christmas-2026-Maker-Brief.pdf

Everything on a ring page comes from catalog.json (the listing the buyer will read) and
images/jobs.json (which render passed QA). Nothing is typed twice: if the image and the
text ever differ, the text governs, and the page says so where a render is still open.
Retail prices are deliberately NOT in this document: the maker is being asked to quote.
"""
import json, pathlib, datetime, html

HERE = pathlib.Path(__file__).parent
CAT = json.load(open(HERE / "catalog.json"))
JOBS = json.load(open(HERE / "images/jobs.json"))
TODAY = datetime.date.today().isoformat()

GROUP = {**{k: "Bow & ribbon" for k in ("R01", "R02", "R03")},
         **{k: "Signet" for k in ("R04", "R05", "R06")},
         **{k: "Dome" for k in ("R07", "R08", "R09")},
         **{k: "Stacking" for k in ("R10", "R11", "R12")},
         **{k: "Coloured stone" for k in ("R13", "R14", "R15", "R16")},
         **{k: "Winter" for k in ("R17", "R18", "R19", "R20")}}

E = html.escape


def parts(it):
    """description = lead / build + story / spec block / SHIP / CARE / IMAGES."""
    paras = it["description"].split("\n\n")
    assert paras[0] == it["lead"] and paras[1].startswith(it["buildNote"]), it["id"]
    story = paras[1][len(it["buildNote"]):].strip()
    spec = [s for s in paras[2].split("\n") if s.startswith(("Size:", "Stone", "Fit:"))]
    return story, spec


rows, pages = [], []
for it in CAT["items"]:
    rid = it["id"]
    story, spec = parts(it)
    job = JOBS["heroes"].get(f"{rid}-01", {})
    img = f"images/heroes/{rid}-01.jpg"
    assert (HERE / img).exists(), img
    flagged = job.get("qa") != "pass"
    stones = it["accentStonesRef"] + it["centreStonesRef"]
    rows.append(f"<tr><td class=code>{rid}</td><td>{E(it['name'])}</td><td>{E(GROUP[rid])}</td>"
                f"<td>{E(it['dims'])}</td><td class=num>{it['grams14Ref']:.2f}</td>"
                f"<td class=num>{stones or '–'}</td></tr>")
    spec_rows = "".join(f"<tr><th>{E(s.split(':',1)[0])}</th><td>{E(s.split(':',1)[1].strip())}</td></tr>" for s in spec)
    note = ("<p class=flag><b>Render note.</b> This picture does not yet show the face described below "
            "(it rendered as a plain flat oval). Build to the written description: the face lifts on one "
            "side and falls away on the other in one wind-shaped curve. A corrected render follows.</p>"
            if flagged else "")
    pages.append(f"""
<section class=ring>
  <header><span class=code>{rid}</span><h2>{E(it['name'])}</h2><span class=group>{E(GROUP[rid])}</span></header>
  <div class=cols>
    <figure><img src="{img}" alt=""><figcaption>Design render, 14K yellow gold shown. Not a photograph of a sample.</figcaption></figure>
    <div class=text>
      {note}
      <h3>Design</h3>
      <p class=lead>{E(it['lead'])}</p>
      <p>{E(it['buildNote'])}</p>
      <h3>Story</h3>
      <p class=story>{E(story)}</p>
      <h3>Specification</h3>
      <table class=spec>
        <tr><th>Dimensions</th><td>{E(it['dims'])}</td></tr>
        {spec_rows}
        <tr><th>Karats</th><td>10K, 14K, 18K</td></tr>
        <tr><th>Colours</th><td>Yellow, white (unplated), rose</td></tr>
        <tr><th>Sizes</th><td>US 4 to 12 in half sizes (17 sizes)</td></tr>
        <tr><th>Est. weight</th><td>{it['grams14Ref']:.2f} g in 14K at US 7 <span class=est>(our geometric estimate, not weighed; please correct)</span></td></tr>
        <tr><th>Engraving</th><td>None. No personalisation on this line.</td></tr>
      </table>
    </div>
  </div>
</section>""")

doc = f"""<!doctype html><html lang=en><head><meta charset=utf-8>
<title>Ophir Gold USA · Christmas 2026 ring line · maker's brief</title>
<style>
@page {{ size: A4; margin: 16mm 16mm 18mm 16mm; }}
html {{ font-family: Inter, "DejaVu Sans", sans-serif; color: #1c1a17; font-size: 10.5pt; line-height: 1.45; }}
body {{ margin: 0; }}
h1, h2 {{ font-family: Charter, "Bitstream Charter", Caladea, "DejaVu Serif", serif; font-weight: 400; margin: 0; }}
h1 {{ font-size: 30pt; line-height: 1.1; letter-spacing: -0.01em; }}
h2 {{ font-size: 22pt; line-height: 1.15; }}
h3 {{ font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase; color: #8a6d3b; margin: 14pt 0 4pt; font-weight: 600; }}
p {{ margin: 0 0 6pt; }}
.cover {{ page-break-after: always; display: flex; flex-direction: column; min-height: 250mm; }}
.cover .kicker {{ font-size: 8.5pt; letter-spacing: .18em; text-transform: uppercase; color: #8a6d3b; margin-bottom: 18pt; }}
.cover .meta {{ margin-top: 18pt; color: #5c574f; }}
.cover .ask {{ margin-top: 28pt; border-top: 1px solid #d9d2c5; padding-top: 14pt; }}
.cover ol {{ padding-left: 16pt; margin: 6pt 0; }}
.cover li {{ margin-bottom: 4pt; }}
.index {{ page-break-after: always; }}
table {{ border-collapse: collapse; width: 100%; }}
.index table td, .index table th {{ padding: 4pt 6pt; border-bottom: 1px solid #e6e0d4; text-align: left; vertical-align: top; font-size: 9.5pt; }}
.index table th {{ font-size: 8pt; letter-spacing: .1em; text-transform: uppercase; color: #8a6d3b; }}
td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
.code {{ font-family: "DejaVu Sans Mono", monospace; font-size: 9pt; color: #8a6d3b; letter-spacing: .06em; }}
section.ring {{ page-break-after: always; page-break-inside: avoid; }}
section.ring header {{ display: flex; align-items: baseline; gap: 12pt; border-bottom: 1px solid #d9d2c5; padding-bottom: 8pt; margin-bottom: 12pt; }}
section.ring header .group {{ margin-left: auto; font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase; color: #5c574f; }}
.cols {{ display: grid; grid-template-columns: 82mm 1fr; gap: 10mm; align-items: start; }}
figure {{ margin: 0; }}
figure img {{ width: 82mm; height: 82mm; display: block; object-fit: cover; }}
figcaption {{ font-size: 8pt; color: #5c574f; margin-top: 4pt; }}
.lead {{ font-size: 11.5pt; }}
.story {{ color: #3a3631; }}
table.spec th {{ text-align: left; font-weight: 600; width: 24mm; padding: 3pt 6pt 3pt 0; vertical-align: top; font-size: 9.5pt; color: #5c574f; }}
table.spec td {{ padding: 3pt 0; border-bottom: 1px solid #efe9de; font-size: 9.5pt; vertical-align: top; }}
.est {{ color: #8a6d3b; }}
.flag {{ background: #fbf3e4; border-left: 3px solid #c9a24d; padding: 6pt 8pt; font-size: 9.5pt; }}
</style></head><body>
<section class=cover>
  <div class=kicker>Ophir Gold USA · Christmas 2026</div>
  <h1>Twenty Christmas rings:<br>design brief and request for quotation</h1>
  <p class=meta>Prepared {TODAY} · 20 designs · each in 10K, 14K and 18K · yellow, white and rose · US 4–12 in half sizes</p>
  <div class=ask>
    <h3>What we need from you, per design</h3>
    <ol>
      <li>Confirm the design can be cast and finished solid, as drawn and described, at the stated dimensions. Tell us where you would change a dimension and why.</li>
      <li>The finished weight in 14K at US 7. Our weights are geometric estimates and will be wrong by some margin; yours replace ours.</li>
      <li>Your price for one finished piece in 14K yellow at US 7, labour included, and your rule for 10K, 18K and for other sizes.</li>
      <li>Where a design carries a stone, the stone cost separately (stones named per page), and whether you supply or we do.</li>
      <li>Lead time for a first sample of each design, and for a run of ten.</li>
    </ol>
    <h3>How to read the pages</h3>
    <p>Each page is one design: the render, the construction in plain words, the story the listing tells the buyer, and the specification. The renders are design visualisations, not photographs of samples; <b>where the picture and the text differ, the text governs.</b> One render (R06) is marked as not yet matching its description.</p>
    <p>All twenty are solid gold with no hollow sections, no plating on the white gold, and no engraving or personalisation. The two signets with cut motifs (R04, R05) carry the motif only; no lettering.</p>
  </div>
</section>
<section class=index>
  <h3>Index</h3>
  <table><tr><th>Code</th><th>Design</th><th>Group</th><th>Dimensions</th><th>Est. g 14K US 7</th><th>Stones</th></tr>{''.join(rows)}</table>
  <p style="margin-top:10pt;font-size:9pt;color:#5c574f">Weights are our estimates from the drawn geometry; the dome and signet weights use a simple top-and-shank average. They are here only so your figures have something to be compared with.</p>
</section>
{''.join(pages)}
</body></html>"""
(HERE / "maker-brief.html").write_text(doc, encoding="utf-8")
print(f"maker-brief.html: {len(CAT['items'])} ring pages, {sum(1 for p in pages if 'class=flag' in p)} flagged")
