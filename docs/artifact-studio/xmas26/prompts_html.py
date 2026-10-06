"""catalog.json + shots.json -> image-prompts.html, the approval page for the Christmas images.

Run after catalog.py and shots.py:
  python3 docs/artifact-studio/xmas26/prompts_html.py [<out.html>]
One card per listing: the reference hero prompt (warm paper, used only as the
reference image) and the 10 sales frames in that listing's colour world.
"""
import html, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
items = json.load(open(HERE / "catalog.json"))["items"]
shots = json.load(open(HERE / "shots.json"))
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE / "image-prompts.html")

KIND = {"ring": "Rings", "bracelet": "Bracelets", "necklace": "Necklaces"}
fams = list(dict.fromkeys(i["family"] for i in items))
slug = lambda f: f.lower().replace(" ", "-")


def pre(pid, label, text):
    return (f'<li class="shot"><div class="shot-h"><span class="slot">{html.escape(label[:2])}</span>'
            f'<h4>{html.escape(label[3:])}</h4><button type="button" class="copy" data-target="{pid}">Copy</button></div>'
            f'<pre id="{pid}">{html.escape(text)}</pre></li>')


body = []
for f in fams:
    rows = [i for i in items if i["family"] == f]
    colour = "solid gold" if all(i["goldOnly"] for i in rows) else ", ".join(dict.fromkeys(c for i in rows for c in i["enamel"]))
    body.append(f'<section class="fam" id="{slug(f)}"><header class="fam-h"><h2>{html.escape(f)}</h2>'
                f'<p>{html.escape(colour)} · ring, bracelet, necklace</p></header>')
    for i in rows:
        pal = shots[i["id"]]["palette"]
        kind = "Solid gold" if i["goldOnly"] else "Enamel · " + " + ".join(i["enamel"])
        lis = [pre(f'h-{i["id"]}', "00 Reference hero (warm paper)", i["imagePrompt"])]
        lis += [pre(f'p-{i["id"]}-{r["slot"][:2]}', f'{r["slot"][:2]} {r["title"]}', r["prompt"]) for r in shots[i["id"]]["shots"]]
        body.append(f'''<details class="item" id="{i["id"]}">
  <summary>
    <span class="chip" style="--c:{pal["hex"]}" aria-hidden="true"></span>
    <span class="sum-t"><span class="code">{i["id"]}</span><span class="name">{html.escape(i["name"])}</span>
    <span class="spec">{html.escape(kind)} · {html.escape(i["dims"])} · from ${i["refPriceCents"] // 100} in 14K</span></span>
    <span class="chev" aria-hidden="true"></span>
  </summary>
  <div class="pal"><b>{html.escape(pal["backdrop"])} <span class="hex">{pal["hex"]}</span></b>
  <span>Accent: {html.escape(pal["accent"])} · Skin: {html.escape(pal["skin"])}</span>
  <span class="why">{html.escape(pal["why"])}</span></div>
  <ol class="shots">{"".join(lis)}</ol>
</details>''')
    body.append("</section>")

nav = "".join(f'<a href="#{slug(f)}">{html.escape(f)}</a>' for f in fams)
SLOTS = [s["title"] for s in shots["R01"]["shots"]]
plan = "".join(
    f'<tr><td class="slot">{n:02d}</td><td>{html.escape(shots["R01"]["shots"][n-1]["title"])}</td>'
    f'<td>{html.escape(shots["B01"]["shots"][n-1]["title"])}</td><td>{html.escape(shots["N01"]["shots"][n-1]["title"])}</td></tr>'
    for n in range(1, 11))
n_img = len(items) + sum(len(v["shots"]) for v in shots.values())

page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Christmas 2026 Image Prompts</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap">
<style>
/* Layout: a frame plan table, then one collapsible card per listing; Artifact Studio ivory, ink and a cranberry accent */
:root {{
  --bg: #F3EFE8; --surface: #FBF9F5; --ink: #1C1A17; --muted: #6F675D; --line: #DDD5C8; --accent: #9E1B32;
  --display: "Cormorant Garamond", Georgia, serif; --body: "IBM Plex Sans", system-ui, sans-serif; --mono: "IBM Plex Mono", ui-monospace, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #16140F; --surface: #1F1C17; --ink: #EEE8DD; --muted: #A79E90; --line: #3A352D; --accent: #E06A7C; color-scheme: dark }} }}
:root[data-theme="dark"] {{ --bg: #16140F; --surface: #1F1C17; --ink: #EEE8DD; --muted: #A79E90; --line: #3A352D; --accent: #E06A7C; color-scheme: dark }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); }}
.wrap {{ max-width: 1040px; margin: 0 auto; padding: 40px 16px 64px; }}
.eyebrow {{ font: 500 12px var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin: 0; }}
h1 {{ font: 600 clamp(32px, 5vw, 48px)/1.05 var(--display); margin: 8px 0 12px; text-wrap: balance; }}
.lede {{ max-width: 65ch; color: var(--muted); margin: 0 0 20px; }}
.facts {{ display: flex; flex-wrap: wrap; gap: 8px 24px; font: 13px var(--mono); margin: 0 0 28px; padding: 0; list-style: none; }}
.facts b {{ color: var(--muted); font-weight: 400; }}
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
details[open] .chev {{ transform: rotate(225deg); }}
.pal {{ display: flex; flex-direction: column; gap: 2px; padding: 0 14px 12px; font-size: 13px; }}
.hex {{ font: 12px var(--mono); color: var(--muted); font-weight: 400; }}
.why {{ color: var(--muted); }}
.shots {{ list-style: none; margin: 0; padding: 0 14px 14px; display: grid; gap: 10px; }}
.shot {{ border-top: 1px solid var(--line); padding-top: 10px; min-width: 0; }}
.shot-h {{ display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }}
h4 {{ margin: 0; font: 500 14px var(--body); flex: 1; min-width: 0; }}
pre {{ margin: 0; white-space: pre-wrap; word-break: break-word; font: 12px/1.6 var(--mono); background: var(--bg); border-radius: 4px; padding: 10px; max-height: 220px; overflow: auto; }}
.copy {{ font: 500 12px var(--body); color: var(--ink); background: transparent; border: 1px solid var(--ink); border-radius: 4px; padding: 4px 12px; cursor: pointer; flex: none; }}
.copy:hover {{ background: var(--ink); color: var(--surface); }}
.copy:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
.copy.done {{ border-color: var(--accent); color: var(--accent); background: transparent; }}
</style></head><body>
<div class="wrap">
  <p class="eyebrow">by Artifact Studio Jewelry · Christmas 2026</p>
  <h1>Image prompts for approval</h1>
  <p class="lede">30 listings: 10 rings, 10 bracelets, 10 necklaces in ten Christmas families. Each listing gets one reference hero on warm paper, then 10 Etsy sales frames in its own colour world, with that hero cropped to the piece as the only reference.</p>
  <ul class="facts">
    <li><b>Model</b> nano_banana_2</li><li><b>Resolution</b> 2k</li><li><b>Aspect</b> 1:1</li><li><b>Count</b> 1 per prompt</li>
    <li><b>Images</b> {n_img}</li><li><b>Order</b> 30 heroes, 1 test listing, then 29</li>
  </ul>
  <div class="plan-wrap"><table><thead><tr><th>#</th><th>Ring</th><th>Bracelet</th><th>Necklace</th></tr></thead><tbody>{plan}</tbody></table></div>
  <nav aria-label="Families">{nav}</nav>
  {"".join(body)}
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
for bad in ("—", "–", "â"):
    assert bad not in page, bad
out.write_text(page)
print(out, len(page), "bytes", len(items), "listings", n_img, "prompts")
