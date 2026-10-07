"""catalog.json + shots.json -> sales-prompts.html, the approval page for the For Him sales frames 02-10.

Run after shots.py: python3 docs/artifact-studio/him26/shots_html.py
"""
import html, json, pathlib

HERE = pathlib.Path(__file__).parent
items = json.load(open(HERE / "catalog.json"))["items"]
shots = json.load(open(HERE / "shots.json"))
cards = []
for i in items:
    s = shots[i["id"]]; pal = s["palette"]
    lis = "".join(f'<li><div class="h"><b>{r["slot"]}</b> {html.escape(r["title"])}</div><pre>{html.escape(r["prompt"])}</pre></li>'
                  for r in s["shots"])
    cards.append(f'''<details id="{i["id"]}"><summary><span class="chip" style="background:{pal["hex"]}"></span>
<span class="code">{i["id"]}</span> {html.escape(i["name"])} <span class="meta">{html.escape(pal["backdrop"])} · {html.escape(pal["skin"])} skin</span></summary>
<p class="why">{html.escape(pal["why"])} Frame 01 is the approved stone hero; reference = public/artifact/him26/ref/{i["id"]}.jpg</p><ol>{lis}</ol></details>''')
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>For Him Sales Frames</title><style>
:root{{--bg:#f4f2ee;--fg:#1d1c1a;--muted:#6b675f;--card:#fff;--line:#e2ddd4}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#151413;--fg:#ece8e1;--muted:#a39d92;--card:#1f1e1c;--line:#34312d}}}}
:root[data-theme="dark"]{{--bg:#151413;--fg:#ece8e1;--muted:#a39d92;--card:#1f1e1c;--line:#34312d}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
main{{max-width:1000px;margin:0 auto;padding:32px 16px 64px}} h1{{margin:0 0 6px;font-size:26px}} .lede{{color:var(--muted);margin:0 0 24px}}
details{{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:8px 0;padding:10px 14px}}
summary{{cursor:pointer;display:flex;gap:10px;align-items:center;flex-wrap:wrap}} .chip{{width:18px;height:18px;border-radius:5px;border:1px solid var(--line)}}
.code{{font:600 12px ui-monospace,monospace}} .meta,.why{{color:var(--muted);font-size:13px}}
ol{{list-style:none;padding:0;margin:8px 0 0}} li{{border-top:1px solid var(--line);padding:8px 0}}
pre{{white-space:pre-wrap;margin:4px 0 0;font:12px/1.45 ui-monospace,monospace}}
</style></head><body><main><h1>For Him: 270 sales frames</h1>
<p class="lede">9 frames per listing (02-10): 4 worn, macro, still life, gift box, three gold colours, editorial. nano_banana_2 2k,
one image each (about 540 credits plus re-shoots). Earrings are worn as ONE earring; still lifes show the pair.</p>
{"".join(cards)}</main></body></html>'''
(HERE / "sales-prompts.html").write_text(page)
print(len(page))
