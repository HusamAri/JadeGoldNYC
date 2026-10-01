"""shots.json -> sales-image-prompts.html (10 prompts per anklet in its colour world, copy button each).
Run after shots.py:
  python3 docs/artifact-studio/ss27-anklets/shots_html.py <out.html> [<thumbs_dir>]
Thumbnails (320 px crops of the approved heroes) are written to <thumbs_dir>
and published next to the page as thumbs/<id>.jpg.
"""
import html, json, pathlib, sys
from PIL import Image

HERE = pathlib.Path(__file__).parent
REPO = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]
shots = json.load(open(HERE / "shots.json"))
picks = {r["id"]: r for r in json.load(open(HERE / "images.json"))["images"]}
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE / "sales-image-prompts.html")
thumbs = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None

if thumbs:
    thumbs.mkdir(parents=True, exist_ok=True)
    for it in items:
        im = Image.open(REPO / "public/artifact/ss27-anklets" / f"{it['id']}.jpg").convert("RGB")
        im.thumbnail((320, 320))
        im.save(thumbs / f"{it['id']}.jpg", "JPEG", quality=82, optimize=True)

SLOTS = [  # Etsy photo order; all ten share the anklet's colour world
    ("01", "Hero on a paper wave", "A sheet of the backdrop colour curls over a paler floor; the anklet lies below, charm centred. A coloured ground stands out in a search grid of white backgrounds."),
    ("02", "Legs raised, crossed", "The moodboard leg shot: legs in the air against the wall, left leg in front, cropped knee to toe so the charm stays readable."),
    ("03", "Foot on a plinth", "A bare foot rising from a plinth in the backdrop colour. The graphic, surreal frame that stops the scroll."),
    ("04", "Over a sculptural chair", "Legs over a rounded chair one shade darker than the wall, a mule hanging from the toes."),
    ("05", "Hand at the ankle, scale", "Fingertips beside the charm: the size comparison buyers need, inside the editorial look."),
    ("06", "Macro on paper hills", "The charm on the crest of layered paper cut-outs in shades of the backdrop: the quality proof for the price."),
    ("07", "Draped over a paper ribbon", "The chain hangs in a V over a sweeping paper arc, the charm free at the lowest point; the family prop (orange, sorbet, shells) sits small below."),
    ("08", "Card stand and gift box", "White folded card on a glossy surface in the backdrop colour, beside an open linen box and an accent ribbon."),
    ("09", "Three gold colours", "Yellow, white and rose side by side below a paper curl: the 27 options at a glance. Recolor visualization."),
    ("10", "Standing, knee raised", "The shoe-campaign pose: one knee bent, the foot resting on the other shin, the charm turned to the camera."),
]
assert [s[0] for s in SLOTS] == [r["slot"][:2] for r in shots["A01"]["shots"]]

fams = list(dict.fromkeys(i["family"] for i in items))
slug = lambda f: f.lower().replace(" ", "-")

body = []
for f in fams:
    rows = [i for i in items if i["family"] == f]
    body.append(f'<section class="fam" id="{slug(f)}"><header class="fam-h"><h2>{html.escape(f)}</h2>'
                f'<p>{len(rows)} anklets · {len(rows) * 10} prompts</p></header>')
    for i in rows:
        kind = "Solid gold" if i["goldOnly"] else "Enamel · " + " + ".join(i["enamel"])
        pick = picks[i["id"]]
        pal = shots[i["id"]]["palette"]
        lis = []
        for r in shots[i["id"]]["shots"]:
            pid = f'p-{i["id"]}-{r["slot"][:2]}'
            lis.append(f'''<li class="shot">
      <div class="shot-h"><span class="slot">{r["slot"][:2]}</span><h4>{html.escape(r["title"])}</h4>
      <button type="button" class="copy" data-target="{pid}">Copy</button></div>
      <pre id="{pid}">{html.escape(r["prompt"])}</pre>
    </li>''')
        body.append(f'''<details class="item" id="{i["id"]}">
  <summary>
    <span class="thumb" style="--c:{pal["hex"]}"><img src="thumbs/{i["id"]}.jpg" alt="{html.escape(i["name"])} hero" width="72" height="72" loading="lazy"></span>
    <span class="sum-t"><span class="code">{i["id"]}</span><span class="name">{html.escape(i["name"])}</span>
    <span class="spec">{html.escape(kind)} · {html.escape(i["dims"])} · reference: hero {pick["candidate"]}</span></span>
    <span class="chev" aria-hidden="true"></span>
  </summary>
  <div class="pal">
    <span class="chip" style="--c:{pal["hex"]}"></span>
    <div class="pal-t"><b>{html.escape(pal["backdrop"])} <span class="hex">{pal["hex"]}</span></b>
    <span>Mules: {html.escape(pal["mules"])} · Polish: {html.escape(pal["polish"])} · Skin: {html.escape(pal["skin"])}</span>
    <span class="why">{html.escape(pal["why"])}</span></div>
  </div>
  <ol class="shots">{"".join(lis)}</ol>
</details>''')
    body.append("</section>")

nav = "".join(f'<a href="#{slug(f)}">{html.escape(f)}</a>' for f in fams)
slot_rows = "".join(f'<li><span class="slot">{n}</span><div><b>{html.escape(t)}</b><p>{html.escape(d)}</p></div></li>' for n, t, d in SLOTS)

page = f'''<title>SS27 Anklet Sales Images</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
/* Layout: brief (slot plan + rules) then families; each anklet is a collapsible card with its 9 prompts in Etsy slot order */
:root {{
  --bg: #F1EEE7; --surface: #FBFAF6; --ink: #1B1A16; --muted: #6B655B; --line: #DCD5C9; --gold: #94743F; --sea: #1F4FD1;
  --display: "Cormorant Garamond", Georgia, serif; --body: "IBM Plex Sans", system-ui, sans-serif; --mono: "IBM Plex Mono", ui-monospace, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #15140F; --surface: #1E1C17; --ink: #EDE7DC; --muted: #A59D8F; --line: #39342C; --gold: #C9A46A; --sea: #8FA8F0; color-scheme: dark }} }}
:root[data-theme="dark"] {{ --bg: #15140F; --surface: #1E1C17; --ink: #EDE7DC; --muted: #A59D8F; --line: #39342C; --gold: #C9A46A; --sea: #8FA8F0; color-scheme: dark }}
body {{ background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); }}
.wrap {{ max-width: 1040px; margin: 0 auto; padding-inline: 20px; padding-block: 40px 72px; }}
.eyebrow {{ font: 500 12px var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--gold); margin: 0; }}
h1 {{ font: 600 clamp(32px, 5vw, 50px)/1.05 var(--display); margin: 8px 0 12px; text-wrap: balance; }}
.lede {{ max-width: 66ch; color: var(--muted); margin: 0 0 20px; }}
.facts {{ display: flex; flex-wrap: wrap; gap: 8px 24px; font: 13px var(--mono); margin: 0 0 32px; padding: 0; list-style: none; font-variant-numeric: tabular-nums; }}
.facts b {{ color: var(--muted); font-weight: 400; }}
.brief {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 24px; margin-bottom: 40px; }}
.brief h2 {{ font: 600 24px var(--display); margin: 0 0 12px; }}
.plan {{ list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }}
.plan li {{ display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: start; }}
.plan b {{ font-weight: 600; }}
.plan p {{ margin: 2px 0 0; color: var(--muted); font-size: 14px; }}
.slot {{ font: 500 12px var(--mono); color: var(--gold); letter-spacing: .06em; padding-top: 3px; font-variant-numeric: tabular-nums; }}
.rules {{ margin: 0; padding-left: 18px; display: grid; gap: 8px; font-size: 14px; }}
.rules li::marker {{ color: var(--gold); }}
.note {{ font-size: 14px; color: var(--muted); border-left: 2px solid var(--sea); padding-left: 12px; margin: 16px 0 0; }}
nav {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; position: sticky; top: env(safe-area-inset-top, 0px); background: var(--bg); padding-block: 10px; z-index: 2; }}
nav a {{ font: 13px var(--mono); color: var(--ink); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; }}
nav a:hover, nav a:focus-visible {{ border-color: var(--gold); color: var(--gold); outline: none; }}
.fam {{ margin-bottom: 40px; scroll-margin-top: 64px; }}
.fam-h {{ display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; border-bottom: 1px solid var(--line); padding-bottom: 8px; margin-bottom: 12px; }}
.fam-h h2 {{ font: 600 28px var(--display); margin: 0; }}
.fam-h p {{ margin: 0; color: var(--muted); font: 13px var(--mono); }}
.item {{ background: var(--surface); border: 1px solid var(--line); border-radius: 6px; margin-bottom: 10px; scroll-margin-top: 64px; }}
.item summary {{ display: flex; align-items: center; gap: 14px; padding: 10px 14px; cursor: pointer; list-style: none; }}
.item summary::-webkit-details-marker {{ display: none; }}
.item summary:focus-visible {{ outline: 2px solid var(--gold); outline-offset: -2px; }}
.thumb {{ flex: none; padding: 4px; border-radius: 6px; background: var(--c); }}
.item img {{ width: 72px; height: 72px; object-fit: cover; border-radius: 3px; display: block; }}
.pal {{ display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-top: 1px solid var(--line); }}
.chip {{ width: 44px; height: 44px; border-radius: 4px; background: var(--c); flex: none; border: 1px solid var(--line); }}
.pal-t {{ display: grid; gap: 2px; min-width: 0; font-size: 13px; }}
.pal-t b {{ font-weight: 600; font-size: 14px; text-transform: capitalize; }}
.hex {{ font: 12px var(--mono); color: var(--muted); text-transform: uppercase; margin-left: 6px; }}
.why {{ color: var(--muted); }}
.sum-t {{ display: grid; gap: 1px; min-width: 0; flex: 1; }}
.code {{ font: 500 12px var(--mono); color: var(--gold); letter-spacing: .08em; }}
.name {{ font: 600 21px/1.15 var(--display); }}
.spec {{ font: 12px var(--mono); color: var(--muted); overflow-wrap: anywhere; }}
.chev {{ width: 10px; height: 10px; border-right: 1.5px solid var(--muted); border-bottom: 1.5px solid var(--muted); transform: rotate(45deg); flex: none; margin-right: 4px; transition: transform .2s; }}
.item[open] .chev {{ transform: rotate(225deg); }}
.shots {{ list-style: none; margin: 0; padding: 4px 14px 14px; display: grid; gap: 14px; border-top: 1px solid var(--line); }}
.shot {{ display: grid; gap: 6px; min-width: 0; padding-top: 10px; }}
.shot-h {{ display: flex; align-items: center; gap: 10px; }}
h4 {{ margin: 0; font: 600 14px var(--body); flex: 1; min-width: 0; }}
pre {{ margin: 0; white-space: pre-wrap; word-break: break-word; font: 12px/1.6 var(--mono); background: var(--bg); border-radius: 4px; padding: 10px 12px; max-height: 180px; overflow: auto; }}
.copy {{ font: 500 12px var(--body); color: var(--ink); background: transparent; border: 1px solid var(--ink); border-radius: 4px; padding: 4px 12px; cursor: pointer; flex: none; }}
.copy:hover {{ background: var(--ink); color: var(--surface); }}
.copy:focus-visible {{ outline: 2px solid var(--gold); outline-offset: 2px; }}
.copy.done {{ border-color: var(--gold); color: var(--gold); background: transparent; }}
@media (prefers-reduced-motion: reduce) {{ .chev {{ transition: none; }} }}
</style>
<div class="wrap">
  <p class="eyebrow">by Artifact Studio Jewelry · SS27 Anklets</p>
  <h1>Sales image prompts</h1>
  <p class="lede">Ten prompts for each of the 40 anklets, in Etsy photo order, built from your two moodboards: single-colour studio, legs and feet posed like sculpture, and product frames as paper sculpture in tints and shades of one colour. Every anklet has its own colour world and all ten of its images stay inside it. Use the approved linen hero as the only reference image for all ten.</p>
  <ul class="facts">
    <li><b>Model</b> nano_banana_2</li><li><b>Resolution</b> 2k</li><li><b>Aspect</b> 1:1</li><li><b>Count</b> 1 per prompt</li>
    <li><b>Anklets</b> {len(items)}</li><li><b>Prompts</b> {sum(len(v["shots"]) for v in shots.values())}</li><li><b>Estimate</b> about 800 credits</li>
  </ul>
  <div class="brief">
    <section><h2>The ten frames</h2><ol class="plan">{slot_rows}</ol></section>
    <section><h2>How each colour was chosen</h2>
      <ol class="rules">
        <li>Gold is richest on deep jewel tones (burgundy, emerald, navy, plum, charcoal) and on warm mid-tones (apricot, blush, caramel). White, cream and yellow grounds dull it, so none are used.</li>
        <li>Enamel charms get the complementary or split-complementary colour of their main enamel: blue on apricot or coral, orange on periwinkle or aqua, green on blush, pink on mint or sage.</li>
        <li>A same-hue ground is used only with a clear value gap of 20 to 30 per cent, as in the pink moodboard set (A10).</li>
        <li>The seven solid gold charms get the deepest grounds for maximum contrast.</li>
        <li>One accent ties the frame to the charm: mules and nail polish echo an enamel colour, or stay nude when the enamel has to stand alone.</li>
        <li>All footwear is an open-back mule with no ankle strap, so nothing covers the anklet.</li>
      </ol>
    </section>
    <section><h2>Check before you keep a frame</h2>
      <ol class="rules">
        <li>The charm matches its hero: same outline, same enamel colours, gold rims, nothing added.</li>
        <li>Exactly one anklet, on the left ankle only. Reject a second chain, toe rings or a charm on the other foot.</li>
        <li>Five toes on each foot, a believable ankle bone.</li>
        <li>The charm stays small: 6 to 10 mm, never bigger than the ankle bone.</li>
        <li>No text, numbers or logos anywhere, including the gift box.</li>
        <li>The backdrop matches the swatch in every frame. A frame that drifts warmer or cooler breaks the set; regenerate it.</li>
        <li>Lay the ten side by side before uploading: if two frames share the same framing, regenerate one.</li>
      </ol>
      <p class="note">If the linen of the reference hero leaks into a frame (01, 06, 07, 09), crop the reference to the charm and a few links of chain and generate again. The new 01 replaces the linen hero as the thumbnail.</p>
    </section>
  </div>
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
const first = document.querySelector("details.item"); if (first && !location.hash) first.open = true;
if (location.hash) {{ const d = document.getElementById(location.hash.slice(1)); if (d && d.tagName === "DETAILS") d.open = true; }}
</script>
'''
for bad in ("—", "–", "â"):
    assert bad not in page, bad
out.write_text(page)
print(out, len(page), "bytes", len(items), "anklets")
