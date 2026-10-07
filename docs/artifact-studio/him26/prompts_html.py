"""catalog.json -> image-prompts.html, the approval page for the 30 For Him reference heroes.

Run after catalog.py: python3 docs/artifact-studio/him26/prompts_html.py [<out.html>]
"""
import html, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
items = json.load(open(HERE / "catalog.json"))["items"]
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE / "image-prompts.html")
KIND = [("ring", "Rings"), ("bracelet", "Bracelets"), ("earring", "Earrings")]

sections = []
for cat, label in KIND:
    cards = []
    for i in (x for x in items if x["productType"] == cat):
        price = i["refPriceCents"] // 100
        cards.append(f'''<article class="card" id="{i["id"]}">
  <header><span class="code">{i["id"]}</span><h3>{html.escape(i["name"])}</h3>
  <span class="meta">{html.escape(i["dims"])} · 14K {html.escape(i["refSize"])} ${price:,}</span></header>
  <pre id="p-{i["id"]}">{html.escape(i["imagePrompt"])}</pre>
  <button type="button" class="copy" data-target="p-{i["id"]}">Copy prompt</button>
</article>''')
    sections.append(f'<section><h2>{label}</h2><div class="grid">{"".join(cards)}</div></section>')

page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>For Him Hero Prompts</title>
<style>
:root{{--bg:#f4f2ee;--fg:#1d1c1a;--muted:#6b675f;--card:#fff;--line:#e2ddd4;--accent:#8a6a2f}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#151413;--fg:#ece8e1;--muted:#a39d92;--card:#1f1e1c;--line:#34312d;--accent:#d2ad62}}}}
:root[data-theme="dark"]{{--bg:#151413;--fg:#ece8e1;--muted:#a39d92;--card:#1f1e1c;--line:#34312d;--accent:#d2ad62}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
main{{max-width:1180px;margin:0 auto;padding:32px 16px 64px}}
h1{{font-size:28px;margin:0 0 6px}} .lede{{color:var(--muted);margin:0 0 28px;max-width:70ch}}
h2{{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:36px 0 12px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px}}
.card header{{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:baseline}}
.code{{font:600 12px ui-monospace,monospace;color:var(--accent)}} h3{{margin:0;font-size:16px}}
.meta{{grid-column:1/-1;color:var(--muted);font-size:13px}}
pre{{white-space:pre-wrap;margin:0;font:12.5px/1.5 ui-monospace,monospace;background:var(--bg);border-radius:8px;padding:10px;max-height:220px;overflow:auto}}
.copy{{align-self:flex-start;border:1px solid var(--line);background:none;color:var(--fg);border-radius:8px;padding:6px 12px;cursor:pointer}}
</style></head><body><main>
<h1>For Him: 30 reference heroes</h1>
<p class="lede">One studio hero per listing, solid 14K yellow gold on matte warm grey stone, nano_banana_2 at 2k, one image each
(60 credits). Earrings are shown as a pair; every listing also sells a single. The 9 sales frames per listing come after these are approved.</p>
{"".join(sections)}
</main><script>
document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",()=>{{
 navigator.clipboard.writeText(document.getElementById(b.dataset.target).textContent).then(()=>{{b.textContent="Copied";setTimeout(()=>b.textContent="Copy prompt",1200)}})}}));
</script></body></html>'''
out.write_text(page)
print(out, len(page))
