"""heroes.json + shots.json -> image-prompts.html, the owner's approval page for the evil eye images.

Run after hero_prompts.py and shots.py:
  python3 docs/artifact-studio/evil-eye/prompts_html.py [<out.html>]
One card per listing: the reference hero prompt first (warm paper, text only), then its 10 sales frames in
that listing's colour world, with copy buttons. Nothing here generates an image; the page exists so every
prompt is shown to the owner before it runs (CLAUDE.md: one request, one generation, prompt approved first).

The page does not read catalog.json (another workflow builds it). Indicative 14K prices come from the spec's
own table ("Indicative prices, 14K" in 01-design-direction.md), parsed and asserted here.
"""
import html, json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
H = json.load(open(HERE / "heroes.json"))
items = H["items"]
shots = json.load(open(HERE / "shots.json"))
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE / "image-prompts.html")
P = H["params"]

# ---------------------------------------------------------------- indicative 14K prices (spec table)
spec = (HERE / "01-design-direction.md").read_text()
table = spec.split("Indicative prices, 14K.")[1].split("Entry points")[0]
ROW = re.compile(r"^\| (\d+) \| ([^|]+?) \| ([\d.]+) · ([\d,]+) \| ([\d.]+) · ([\d,]+) \| ([\d.]+) · ([\d,]+)"
                 r"(?: / ([\d,]+))?(?: \(([^)]*)\))? \|$", re.M)
rows = ROW.findall(table)
assert len(rows) == 10 and [int(r[0]) for r in rows] == list(range(1, 11)), "spec price table not parsed"
usd = lambda s: int(s.replace(",", ""))
PRICE = {}
for r in rows:
    n = int(r[0])
    PRICE[f"R{n:02d}"] = f"about ${usd(r[3]):,} in 14K"
    PRICE[f"N{n:02d}"] = f"about ${usd(r[5]):,} in 14K"
    PRICE[f"B{n:02d}"] = (f"about ${usd(r[7]):,} in 14K, basis a (b: ${usd(r[8]):,})" if r[8]
                          else f"about ${usd(r[7]):,} in 14K ({r[9]})")
assert set(PRICE) == {i["id"] for i in items}

# ---------------------------------------------------------------- page parts
KIND = {"ring": "Ring", "necklace": "Necklace", "bracelet": "Bracelet"}
fams = list(dict.fromkeys(i["familyNo"] for i in items))
slug = lambda n: "f" + str(n)
n_hero = len(items)
n_frames = sum(len(v["shots"]) for v in shots.values())
n_alt = sum(len(i["altHeroPrompts"] or {}) for i in items)
n_tt = sum(i["twoTone"] for i in items)
assert (n_hero, n_frames, n_alt, n_tt) == (30, 300, 24, 12)
n_all = n_hero + n_frames
CREDITS = 2


def pre(pid, label, text):
    return (f'<li class="shot"><div class="shot-h"><span class="slot">{html.escape(label[:2])}</span>'
            f'<h4>{html.escape(label[3:])}</h4><button type="button" class="copy" data-target="{pid}">Copy</button></div>'
            f'<pre id="{pid}">{html.escape(text)}</pre></li>')


def enamel_line(i):
    return " + ".join(e["name"] for e in i["enamel"]) if i["enamel"] else "no enamel"


def dots(i):
    return "".join(f'<span class="dot" style="--c:{e["hex"]}" title="{html.escape(e["name"])} {e["hex"]}"></span>'
                   for e in i["enamel"])


body = []
for f in fams:
    rows_f = [i for i in items if i["familyNo"] == f]
    first = rows_f[0]
    cols = list(dict.fromkeys(e["name"] for i in rows_f for e in i["enamel"]))
    metal = ("two golds, hero in Yellow/White Gold" if first["twoTone"] else "one gold, hero in 14K yellow gold")
    swatches = "".join(f'<span class="dot" style="--c:{e["hex"]}" title="{html.escape(e["name"])} {e["hex"]}"></span>'
                       for e in {e["hex"]: e for i in rows_f for e in i["enamel"]}.values())
    body.append(f'<section class="fam" id="{slug(f)}"><header class="fam-h"><h2>{f} · {html.escape(first["family"])}</h2>'
                f'<p>{swatches}{html.escape(", ".join(cols) if cols else "metal only, no enamel")} · {metal}</p></header>')
    for i in rows_f:
        pal = shots[i["id"]]["palette"]
        kind = ("Enamel · " if i["enamel"] else "") + enamel_line(i)
        kind += " · two golds" if i["twoTone"] else ""
        lis = [pre(f'h-{i["id"]}', "00 Reference hero (warm paper, text only)", i["imagePrompt"])]
        lis += [pre(f'p-{i["id"]}-{r["slot"][:2]}', f'{r["slot"][:2]} {r["title"]}', r["prompt"])
                for r in shots[i["id"]]["shots"]]
        qa = "".join(f"<li>{html.escape(q)}</li>" for q in i["qa"])
        metals = ""
        if i["twoTone"]:
            m = i["metals"]
            metals = (f'<p class="metals"><b>Hero metals, {html.escape(m["value"])}:</b> {html.escape(m["bodyParts"])} '
                      f'in yellow gold; {html.escape(m["accentParts"])} in white gold, unplated.</p>')
        opt = ""
        if i["altHeroPrompts"]:
            alts = "".join(pre(f'a-{i["id"]}-{k}', f"0{k + 1} Hero in {v}", i["altHeroPrompts"][v])
                           for k, v in enumerate(i["altHeroPrompts"]))
            opt = (f'<details class="opt"><summary>Option, not in the {n_all}: the same hero in the other two '
                   f'Metal Color values (+2 generations)</summary><ol class="shots">{alts}</ol></details>')
        body.append(f'''<details class="item" id="{i["id"]}">
  <summary>
    <span class="chip" style="--c:{pal["hex"]}" aria-hidden="true"></span>
    <span class="sum-t"><span class="code">{i["id"]} · {KIND[i["productType"]]}</span><span class="name">{html.escape(i["name"])}</span>
    <span class="spec">{html.escape(kind)} · {html.escape(i["dims"])} · {html.escape(PRICE[i["id"]])}</span></span>
    <span class="chev" aria-hidden="true"></span>
  </summary>
  <div class="pal"><b>{html.escape(pal["backdrop"])} <span class="hex">{pal["hex"]}</span></b>
  <span>Ribbon: {html.escape(pal["accent"] if pal["accent"] != "nude" else "a deeper shade of the ground")} · Nails: {html.escape(pal["nails"])} · Skin: {html.escape(pal["skin"])} · Still life: {html.escape(pal["prop"])}</span>
  <span class="why">{html.escape(pal["why"])}</span></div>
  {metals}
  <div class="qa"><b>QA for this listing</b> {dots(i)}<ul>{qa}</ul></div>
  <ol class="shots">{"".join(lis)}</ol>
  {opt}
</details>''')
    body.append("</section>")

nav = "".join(f'<a href="#{slug(f)}">{f} · {html.escape(next(i["family"] for i in items if i["familyNo"] == f))}</a>'
              for f in fams)
NOTE9 = " (two-tone: three metal pairs; station pieces: one station in each metal)"
plan = "".join(
    f'<tr><td class="slot">{n:02d}</td>'
    + "".join(f'<td>{html.escape(shots[k]["shots"][n - 1]["title"] + (NOTE9 if n == 9 else ""))}</td>'
              for k in ("R02", "N02", "B02")) + "</tr>"
    for n in range(1, 11))
assert shots["R02"]["shots"][8]["title"] == "Three gold colours" and shots["R01"]["shots"][8]["title"] == "Three metal pairs"

page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Evil Eye Image Prompts</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap">
<style>
/* Layout: facts, the order of work and QA gates, a frame plan table, then one collapsible card per listing.
   Artifact Studio ivory and ink with a nazar cobalt accent. */
:root {{
  --bg: #F3EFE8; --surface: #FBF9F5; --ink: #1C1A17; --muted: #6F675D; --line: #DDD5C8; --accent: #17368C;
  --display: "Cormorant Garamond", Georgia, serif; --body: "IBM Plex Sans", system-ui, sans-serif; --mono: "IBM Plex Mono", ui-monospace, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #16140F; --surface: #1F1C17; --ink: #EEE8DD; --muted: #A79E90; --line: #3A352D; --accent: #8FAAF0; color-scheme: dark }} }}
:root[data-theme="dark"] {{ --bg: #16140F; --surface: #1F1C17; --ink: #EEE8DD; --muted: #A79E90; --line: #3A352D; --accent: #8FAAF0; color-scheme: dark }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); }}
.wrap {{ max-width: 1040px; margin: 0 auto; padding: 40px 16px 64px; }}
.eyebrow {{ font: 500 12px var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin: 0; }}
h1 {{ font: 600 clamp(32px, 5vw, 48px)/1.05 var(--display); margin: 8px 0 12px; text-wrap: balance; }}
.lede {{ max-width: 65ch; color: var(--muted); margin: 0 0 20px; }}
.facts {{ display: flex; flex-wrap: wrap; gap: 8px 24px; font: 13px var(--mono); margin: 0 0 28px; padding: 0; list-style: none; }}
.facts b {{ color: var(--muted); font-weight: 400; }}
.boxes {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 28px; }}
.box {{ background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; min-width: 0; }}
.box h2 {{ font: 600 22px var(--display); margin: 0 0 8px; }}
.box ol, .box ul {{ margin: 0; padding-left: 20px; font-size: 14px; }}
.box li + li {{ margin-top: 6px; }}
.box p {{ margin: 0; font-size: 14px; }}
.box p + p {{ margin-top: 8px; }}
.plan-wrap {{ overflow-x: auto; margin-bottom: 32px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; min-width: 520px; }}
th, td {{ text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }}
th {{ font: 500 12px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }}
tr:last-child td {{ border-bottom: 0; }}
.slot {{ font: 500 12px var(--mono); color: var(--accent); }}
nav {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 36px; }}
nav a {{ font: 13px var(--mono); color: var(--ink); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; }}
nav a:hover, nav a:focus-visible {{ border-color: var(--accent); color: var(--accent); outline: none; }}
.fam {{ margin-bottom: 40px; }}
.fam-h {{ display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; border-bottom: 1px solid var(--line); padding-bottom: 8px; margin-bottom: 12px; }}
.fam-h h2 {{ font: 600 28px var(--display); margin: 0; }}
.fam-h p {{ margin: 0; color: var(--muted); font-size: 14px; }}
.dot {{ display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: var(--c); border: 1px solid var(--line); margin-right: 6px; vertical-align: -1px; }}
.item {{ background: var(--surface); border: 1px solid var(--line); border-radius: 6px; margin-bottom: 10px; }}
summary {{ list-style: none; display: flex; align-items: center; gap: 14px; padding: 12px 14px; cursor: pointer; }}
summary::-webkit-details-marker {{ display: none; }}
summary:focus-visible {{ outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 6px; }}
.chip {{ width: 40px; height: 40px; border-radius: 6px; background: var(--c); flex: none; border: 1px solid var(--line); }}
.sum-t {{ display: flex; flex-direction: column; min-width: 0; flex: 1; }}
.code {{ font: 500 12px var(--mono); color: var(--accent); letter-spacing: .08em; }}
.name {{ font: 600 21px/1.2 var(--display); }}
.spec {{ font: 12px var(--mono); color: var(--muted); }}
.chev {{ width: 10px; height: 10px; border-right: 1.5px solid var(--muted); border-bottom: 1.5px solid var(--muted); transform: rotate(45deg); flex: none; transition: transform .2s; }}
details[open] > summary .chev {{ transform: rotate(225deg); }}
.pal {{ display: flex; flex-direction: column; gap: 2px; padding: 0 14px 12px; font-size: 13px; }}
.hex {{ font: 12px var(--mono); color: var(--muted); font-weight: 400; }}
.why {{ color: var(--muted); }}
.metals {{ margin: 0; padding: 0 14px 12px; font-size: 13px; }}
.qa {{ margin: 0 14px 12px; padding: 10px 12px; border-left: 2px solid var(--accent); background: var(--bg); border-radius: 0 4px 4px 0; font-size: 13px; }}
.qa ul {{ margin: 6px 0 0; padding-left: 18px; }}
.shots {{ list-style: none; margin: 0; padding: 0 14px 14px; display: grid; gap: 10px; }}
.shot {{ border-top: 1px solid var(--line); padding-top: 10px; min-width: 0; }}
.shot-h {{ display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }}
h4 {{ margin: 0; font: 500 14px var(--body); flex: 1; min-width: 0; }}
pre {{ margin: 0; white-space: pre-wrap; word-break: break-word; font: 12px/1.6 var(--mono); background: var(--bg); border-radius: 4px; padding: 10px; max-height: 220px; overflow: auto; }}
.copy {{ font: 500 12px var(--body); color: var(--ink); background: transparent; border: 1px solid var(--ink); border-radius: 4px; padding: 4px 12px; cursor: pointer; flex: none; }}
.copy:hover {{ background: var(--ink); color: var(--surface); }}
.copy:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
.copy.done {{ border-color: var(--accent); color: var(--accent); background: transparent; }}
.opt {{ margin: 0 14px 14px; border: 1px dashed var(--line); border-radius: 6px; }}
.opt > summary {{ font-size: 13px; color: var(--muted); padding: 10px 12px; }}
.opt .shots {{ padding: 0 12px 12px; }}
</style></head><body>
<div class="wrap">
  <p class="eyebrow">by Artifact Studio Jewelry · Evil Eye</p>
  <h1>Image prompts for approval</h1>
  <p class="lede">{n_hero} listings: 10 rings, 10 necklaces and 10 bracelets in ten evil eye families. Each listing gets one reference hero on warm off-white paper, generated from text only, then 10 Etsy sales frames in its own colour world, with that hero cropped to the piece as the only reference. Nothing has been generated yet; every prompt below waits for your approval.</p>
  <ul class="facts">
    <li><b>Model</b> {P["model"]}</li><li><b>Resolution</b> {P["resolution"]}</li><li><b>Aspect</b> {P["aspect_ratio"]}</li><li><b>Count</b> {P["count"]} per prompt</li>
    <li><b>Heroes</b> text only, no reference</li><li><b>Frames</b> a tight crop of the approved hero as the only reference</li>
    <li><b>Generations</b> {n_all} ({n_hero} heroes + {n_frames} frames)</li><li><b>Credits</b> about {CREDITS * n_all} at about {CREDITS} each, plus re-shoots</li>
  </ul>
  <div class="boxes">
    <section class="box"><h2>Order of work</h2><ol>
      <li>You approve these prompts. Nothing runs before that, and each prompt is one generation with count 1.</li>
      <li>Heroes first: {n_hero} generations from text only, in launch order: the Christmas wave (Damla, Mati, Bead String, Çini), the January wave (Sweetheart, Paperclip), then the two-tone families (Halka, Mother and Child, Medal, Twin Wire).</li>
      <li>You check the {n_hero} heroes against the spec (form gate). A hero that misses is re-shot with one named fix before any frame uses it.</li>
      <li>Frames: {n_frames} generations, each with a tight crop of its approved hero as the only reference; one test listing first, then family by family, each family on one contact sheet (set gate).</li>
      <li>Nothing goes to Etsy or the panel in this step.</li>
    </ol></section>
    <section class="box"><h2>QA gates</h2><ul>
      <li><b>Form:</b> each hero beside the spec: zones and sizes, the metal of every part, solid gold points and tips, closed back, flat flush enamel.</li>
      <li><b>Set:</b> each family's frames on one contact sheet: copied hero layouts, scale, colour-world drift, repeated poses.</li>
      <li><b>Rings:</b> the prompt names the ring finger by anatomy, but as in the Christmas set the model may still use the middle finger. No listing promises a finger, so either passes; a second ring, a hand without five fingers, wrong scale or a redesigned ring fails.</li>
      <li><b>Necklaces:</b> nothing above the chin.</li>
      <li><b>White zones:</b> white gold metal on Halka and Mother and Child, porcelain white enamel on Damla, Mati and Paperclip; each white zone must be the right material.</li>
      <li><b>Counts:</b> three or fewer per group; the gold balls, links and ridges are never counted, but Paperclip shows exactly two links on each side.</li>
      <li>Each re-shoot names one defect and fixes only that.</li>
    </ul></section>
    <section class="box"><h2>Option: a hero per metal pair</h2>
      <p>The spec proposes, for the {n_tt} two-tone listings, one hero in each Metal Color value (Yellow/White, White/Yellow, Rose/White), each from text with no reference in another colour, and frame 09 composited locally from the three heroes with no model call.</p>
      <p>That is {n_alt} more hero generations (about {CREDITS * n_alt} credits) and {n_tt} fewer model frames: net +{n_alt - n_tt} generations, about +{CREDITS * (n_alt - n_tt)} credits. It needs your yes; the prompts are ready inside each two-tone card. Without it, frame 09 is generated from the Yellow/White hero with the metal of every part named for each copy.</p>
    </section>
  </div>
  <div class="plan-wrap"><table><thead><tr><th>#</th><th>Ring</th><th>Necklace</th><th>Bracelet</th></tr></thead><tbody>{plan}</tbody></table></div>
  <nav aria-label="Families">{nav}</nav>
  {"".join(body)}
  <p class="lede">Prices are the spec's indicative 14K figures (provisional, geometry estimates; two-tone prices include the unquoted two-tone item). Bracelets show basis a, the owner's choice, with basis b in brackets.</p>
</div>
<script>
document.addEventListener("click", async (e) => {{
  const b = e.target.closest(".copy"); if (!b) return;
  const pre = document.getElementById(b.dataset.target);
  try {{ await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copied"; }}
  catch (err) {{ const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; }}
  b.classList.add("done"); setTimeout(() => {{ b.textContent = "Copy"; b.classList.remove("done"); }}, 1800);
}});
</script>
</body></html>
'''
for bad in ("\u2014", "\u2013", "\u00e2"):
    assert bad not in page, bad
ids = re.findall(r'<pre id="([^"]+)"', page)
assert len(ids) == len(set(ids)) == n_all + n_alt, ("every prompt has one copy target", len(ids))
assert page.count('class="item"') == n_hero
out.write_text(page)
print(out.name, len(page.encode()), "bytes;", n_hero, "listings,", n_all, "prompts to approve,", n_alt, "optional")
