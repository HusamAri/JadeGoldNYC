"""catalog.json -> hero-prompts.html (one card per charm, copy button per prompt).
Run: python3 docs/artifact-studio/ss27-anklets/prompts_html.py <out.html>
"""
import html, json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE / "hero-prompts.html")

fams = []
for it in items:
    if it["family"] not in fams:
        fams.append(it["family"])


def swatches(prompt):
    hexes = re.findall(r"#[0-9A-Fa-f]{6}", prompt)
    return "".join(f'<span class="sw" style="background:{h}" title="{h}"></span>' for h in dict.fromkeys(hexes))


cards = []
for f in fams:
    rows = [i for i in items if i["family"] == f]
    colour = "solid gold" if all(i["goldOnly"] for i in rows) else ", ".join(dict.fromkeys(c for i in rows for c in i["enamel"]))
    cards.append(f'<section class="fam" id="{f.lower().replace(" ", "-")}"><header class="fam-h"><h2>{html.escape(f)}</h2>'
                 f'<p>{html.escape(colour)}</p></header><div class="grid">')
    for i in rows:
        kind = "Solid gold" if i["goldOnly"] else "Enamel · " + " + ".join(i["enamel"])
        cards.append(f'''<article class="card">
  <div class="meta"><span class="code">{i["id"]}</span><h3>{html.escape(i["name"])}</h3>{swatches(i["imagePrompt"])}</div>
  <p class="spec">{html.escape(kind)} · {html.escape(i["dims"])} · {i["imageFile"]}</p>
  <pre id="p-{i["id"]}">{html.escape(i["imagePrompt"])}</pre>
  <button type="button" class="copy" data-target="p-{i["id"]}">Copy prompt</button>
</article>''')
    cards.append("</div></section>")

nav = "".join(f'<a href="#{f.lower().replace(" ", "-")}">{html.escape(f)}</a>' for f in fams)
page = f'''<title>SS27 Anklet Hero Prompts</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap">
<style>
/* Layout: one column of families, each a grid of prompt cards; Artifact Studio ivory, ink and one gold accent */
:root {{
  --bg: #F3EFE8; --surface: #FBF9F5; --ink: #1C1A17; --muted: #6F675D; --line: #DDD5C8; --gold: #9C7A45;
  --display: "Cormorant Garamond", Georgia, serif; --body: "IBM Plex Sans", system-ui, sans-serif; --mono: "IBM Plex Mono", ui-monospace, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #16140F; --surface: #1F1C17; --ink: #EEE8DD; --muted: #A79E90; --line: #3A352D; --gold: #C9A46A; color-scheme: dark }} }}
:root[data-theme="dark"] {{ --bg: #16140F; --surface: #1F1C17; --ink: #EEE8DD; --muted: #A79E90; --line: #3A352D; --gold: #C9A46A; color-scheme: dark }}
body {{ background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); }}
.wrap {{ max-width: 1120px; margin: 0 auto; padding-inline: 20px; padding-block: 40px 64px; }}
.eyebrow {{ font: 500 12px var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--gold); margin: 0; }}
h1 {{ font: 600 clamp(32px, 5vw, 48px)/1.05 var(--display); margin: 8px 0 12px; text-wrap: balance; }}
.lede {{ max-width: 65ch; color: var(--muted); margin: 0 0 20px; }}
.facts {{ display: flex; flex-wrap: wrap; gap: 8px 24px; font: 13px var(--mono); color: var(--ink); margin: 0 0 24px; padding: 0; list-style: none; }}
.facts b {{ color: var(--muted); font-weight: 400; }}
nav {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; }}
nav a {{ font: 13px var(--mono); color: var(--ink); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; }}
nav a:hover, nav a:focus-visible {{ border-color: var(--gold); color: var(--gold); outline: none; }}
.fam {{ margin-bottom: 48px; }}
.fam-h {{ display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; border-bottom: 1px solid var(--line); padding-bottom: 8px; margin-bottom: 16px; }}
.fam-h h2 {{ font: 600 28px var(--display); margin: 0; }}
.fam-h p {{ margin: 0; color: var(--muted); font-size: 14px; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 16px; }}
.card {{ background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }}
.meta {{ display: flex; align-items: center; gap: 10px; }}
.code {{ font: 500 12px var(--mono); color: var(--gold); letter-spacing: .08em; }}
h3 {{ font: 600 21px var(--display); margin: 0; flex: 1; min-width: 0; }}
.sw {{ width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--line); flex: none; }}
.spec {{ margin: 0; font: 12px var(--mono); color: var(--muted); }}
pre {{ margin: 0; white-space: pre-wrap; word-break: break-word; font: 12.5px/1.6 var(--mono); color: var(--ink); background: var(--bg); border-radius: 4px; padding: 12px; max-height: 260px; overflow: auto; }}
.copy {{ align-self: flex-start; font: 500 13px var(--body); color: var(--ink); background: transparent; border: 1px solid var(--ink); border-radius: 4px; padding: 6px 14px; cursor: pointer; }}
.copy:hover {{ background: var(--ink); color: var(--surface); }}
.copy:focus-visible {{ outline: 2px solid var(--gold); outline-offset: 2px; }}
.copy.done {{ border-color: var(--gold); color: var(--gold); background: transparent; }}
</style>
<div class="wrap">
  <p class="eyebrow">by Artifact Studio Jewelry · SS27 Anklets</p>
  <h1>Hero image prompts</h1>
  <p class="lede">One prompt per anklet, generated from the catalog. Each makes one 2048 × 2048 hero on warm linen. Enamel charms use the enamel template; the seven solid gold charms use the gold-only template.</p>
  <ul class="facts">
    <li><b>Model</b> nano_banana_2</li><li><b>Resolution</b> 2k</li><li><b>Aspect</b> 1:1</li><li><b>Count</b> 1 per charm</li><li><b>Charms</b> {len(items)}</li><li><b>Estimate</b> about 80 credits</li>
  </ul>
  <nav aria-label="Families">{nav}</nav>
  {"".join(cards)}
</div>
<script>
document.addEventListener("click", async (e) => {{
  const b = e.target.closest(".copy"); if (!b) return;
  const pre = document.getElementById(b.dataset.target);
  try {{ await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copied"; }}
  catch (err) {{ const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected, press Ctrl/Cmd+C"; }}
  b.classList.add("done"); setTimeout(() => {{ b.textContent = "Copy prompt"; b.classList.remove("done"); }}, 1800);
}});
</script>
'''
out.write_text(page)
print(out, len(page), "bytes", len(items), "cards")
