"""Jade Gold NYC, Christmas 2026: the owner's image book (one static HTML page).

Run: python3 -I docs/jade/xmas26/page.py  -> image-book.html (+ web/ copies of the heroes)
Reads catalog.json, prompts.json and images/heroes/status.json. Everything on the page is
generated from those three files; nothing is typed here by hand except the interface words.
"""
import html
import json
import pathlib

HERE = pathlib.Path(__file__).parent
CAT = json.load(open(HERE / "catalog.json"))
PROMPTS = json.load(open(HERE / "prompts.json"))
STATUS = json.load(open(HERE / "images" / "heroes" / "status.json"))
JOBS = json.load(open(HERE / "images" / "jobs.json"))

CAT_TR = {"bracelet": "Bileklik", "necklace": "Kolye", "earrings": "Küpe", "brooch": "Broş"}
e = html.escape


def money(c):
    return f"${c / 100:,.2f}".replace(".00", "")


def copy_block(text, label, cls="mono"):
    return (f'<div class="copy"><pre class="{cls}">{e(text)}</pre>'
            f'<button type="button" class="cp" aria-label="{e(label)} kopyala">Kopyala</button></div>')


def hero_figure(p):
    st = STATUS[p["id"]]
    if st["status"] == "ok":
        img = (f'<img src="web/{p["id"]}.jpg" alt="{e(PROMPTS[p["id"]][0]["alt"])}" loading="lazy" '
               f'width="1600" height="1200">')
        badge = '<span class="pill ok">Hero hazır</span>'
    else:
        img = (f'<div class="noimg"><span>Hero üretilmedi</span><small>{e(st["reason"])}</small></div>')
        badge = '<span class="pill flag">Kendin üret</span>'
    note = f'<figcaption>{badge}<span class="fn">{e(st.get("note", ""))}</span></figcaption>'
    return f'<figure class="hero">{img}{note}</figure>'


def chips(p):
    out = [f'<span class="chip">{e(p["karat"])} sarı altın</span>',
           f'<span class="chip num">{p["gold_grams"]:.2f} g altın</span>']
    if p["enamel"]:
        out.append(f'<span class="chip">Mine: {e(p["enamel_colours_tr"])}</span>')
    if p["stones"]:
        out.append(f'<span class="chip">{e(p["stones_tr"])}</span>')
    if not p["enamel"] and not p["stones"]:
        out.append('<span class="chip">Yalın altın</span>')
    return "".join(out)


def workshop(p):
    w = p["workshop"]
    steps = "".join(f"<li>{e(s)}</li>" for s in w["bench_sequence"])
    bom = "".join(f"<li>{e(s)}</li>" for s in w["bom"])
    fm = "".join(f"<tr><td>{e(f['mode'])}</td><td>{e(f['prevention'])}</td></tr>" for f in w["failure_modes"])
    tc = "".join(f"<tr><td>{e(t['rule'])}</td><td class=\"num\">{e(t['value'])}</td>"
                 f"<td>{'✓' if t['pass'] else '✗'}</td></tr>" for t in w["tolerance_checks"])
    return (f'<details class="sub"><summary>Atölye kartı</summary>'
            f'<p class="lede">{e(w["dimensions"])}</p><p>{e(w["construction"])}</p>'
            f'<h4>Tezgâh sırası</h4><ol class="steps">{steps}</ol>'
            f'<h4>Malzeme listesi</h4><ul>{bom}</ul>'
            f'<h4>Arıza modları</h4><div class="tw"><table><thead><tr><th>Arıza</th><th>Tasarım nasıl önlüyor</th></tr></thead>'
            f'<tbody>{fm}</tbody></table></div>'
            f'<h4>Tolerans</h4><div class="tw"><table><thead><tr><th>Kural</th><th>Değer</th><th></th></tr></thead>'
            f'<tbody>{tc}</tbody></table></div></details>')


def listing(p):
    tags = ", ".join(p["tags"])
    return (f'<details class="sub"><summary>Etsy metni</summary>'
            f'<h4>Başlık <small class="num">{len(p["title"])}/140</small></h4>{copy_block(p["title"], "Başlık", "txt")}'
            f'<h4>Etiketler (13)</h4>{copy_block(tags, "Etiketler", "txt")}'
            f'<h4>Malzemeler</h4>{copy_block(", ".join(p["materials"]), "Malzemeler", "txt")}'
            f'<h4>Açıklama</h4>{copy_block(p["description"], "Açıklama", "txt long")}</details>')


def frames(p):
    rows = []
    for it in PROMPTS[p["id"]]:
        ref = ('<span class="pill ref">Referans: hero kırpımı</span>' if it["reference"]
               else '<span class="pill">Referanssız</span>')
        rows.append(
            f'<li class="frame"><div class="fh"><b class="num">{it["code"]}</b>'
            f'<span class="purpose">{e(it["purpose"])}</span>{ref}</div>'
            f'{copy_block(it["prompt"], "Prompt " + it["code"])}'
            f'<p class="alt"><span>Alt metin</span> {e(it["alt"])}</p></li>')
    return (f'<details class="sub" open><summary>Görsel promptları <span class="num">(16)</span></summary>'
            f'<ol class="frames">{"".join(rows)}</ol></details>')


def product(p):
    pr = p["price"]
    return (f'<section class="product" id="{p["id"]}" data-cat="{p["category"]}" '
            f'data-flag="{"1" if STATUS[p["id"]]["status"] != "ok" else "0"}" '
            f'data-q="{e((p["id"] + " " + p["name"] + " " + p["title"]).lower())}">'
            f'<div class="pgrid">{hero_figure(p)}<div class="meta">'
            f'<p class="eyebrow"><span class="num">{p["id"]}</span> · {CAT_TR[p["category"]]}'
            f'{" · erkek yaka iğnesi" if p.get("wearer") == "men" else ""}</p>'
            f'<h3>{e(p["name"])}</h3><p class="etitle">{e(p["title"])}</p>'
            f'<dl class="price"><div><dt>Liste</dt><dd class="num">{money(pr["list_cents"])}</dd></div>'
            f'<div><dt>%25 indirimle ödenen</dt><dd class="num">{money(pr["paid_cents"])}</dd></div>'
            f'<div><dt>Marj</dt><dd class="num">%{pr["margin"] * 100:.1f}</dd></div></dl>'
            f'<div class="chips">{chips(p)}</div><p class="why">{e(p["season_proof"])}</p></div></div>'
            f'{listing(p)}{workshop(p)}{frames(p)}</section>')


prods = CAT["products"]
n_ok = sum(1 for p in prods if STATUS[p["id"]]["status"] == "ok")
n_flag = len(prods) - n_ok
frame_rows = "".join(f'<tr><td class="num">{it["code"]}</td><td>{e(it["purpose"])}</td></tr>'
                     for it in PROMPTS[prods[0]["id"]])
params = JOBS["params"]

page = f"""<title>Jade Noel 2026 Görsel Kitabı</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Jost:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap">
<style>
/* Layout: a ledger of 40 pieces. Each piece is one row: hero on the left, the numbers that sell it on the
   right, then three drawers (listing copy, workshop card, 16 prompts). Brand colours from the guidelines. */
:root {{
  --bg: #F2EFE6; --surface: #FBFAF6; --ink: #131313; --muted: #6E6A61; --stone: #A39F94;
  --gold: #8C6A27; --gold-soft: #B89347; --jade: #3F4A44; --line: rgba(19,19,19,.12);
  --flag: #9A3B2E; --ok: #3F6B4F; --code-bg: #EEEAE0;
  --f-display: "Bodoni Moda", "Didot", "Bodoni 72", Georgia, serif;
  --f-body: "Jost", "Futura", "Avenir Next", "Helvetica Neue", Arial, sans-serif;
  --f-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #151816; --surface: #1C201D; --ink: #ECE8DD; --muted: #A7A296; --stone: #8F8B81;
  --gold: #D2AE68; --gold-soft: #B89347; --jade: #9FB5A7; --line: rgba(236,232,221,.14);
  --flag: #E59A88; --ok: #93C2A2; --code-bg: #232825; color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  --bg: #151816; --surface: #1C201D; --ink: #ECE8DD; --muted: #A7A296; --stone: #8F8B81;
  --gold: #D2AE68; --gold-soft: #B89347; --jade: #9FB5A7; --line: rgba(236,232,221,.14);
  --flag: #E59A88; --ok: #93C2A2; --code-bg: #232825; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--ink); font: 400 16px/1.6 var(--f-body); }}
body::before {{ content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }}
.wrap {{ max-width: 1180px; margin: 0 auto; padding-block: 40px 96px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
.num {{ font-variant-numeric: tabular-nums; }}
header.top {{ display: grid; gap: 14px; padding-bottom: 28px; border-bottom: 1px solid var(--line); }}
.kicker {{ font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--gold); margin: 0; }}
h1 {{ font: 400 clamp(34px, 5vw, 56px)/1.05 var(--f-display); margin: 0; text-wrap: balance; }}
.intro {{ max-width: 68ch; color: var(--muted); margin: 0; }}
.stats {{ display: flex; flex-wrap: wrap; gap: 28px; margin: 6px 0 0; }}
.stats div {{ display: grid; }}
.stats dt {{ font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }}
.stats dd {{ margin: 0; font: 400 28px/1.2 var(--f-display); }}
.howto {{ display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; padding-block: 28px; border-bottom: 1px solid var(--line); }}
.howto h2 {{ font: 400 22px/1.2 var(--f-display); margin: 0 0 10px; }}
.howto ol, .howto ul {{ margin: 0; padding-left: 20px; display: grid; gap: 6px; }}
.howto code {{ font-family: var(--f-mono); font-size: 13px; background: var(--code-bg); padding: 1px 5px; border-radius: 3px; }}
.tw {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 7px 10px 7px 0; border-bottom: 1px solid var(--line); }}
th {{ font-weight: 500; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }}
.bar {{ position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); display: flex; flex-wrap: wrap;
  gap: 8px 10px; align-items: center; padding-block: 14px; border-bottom: 1px solid var(--line); }}
.bar button, .cp {{ font: 500 13px/1 var(--f-body); letter-spacing: .04em; color: var(--ink); background: transparent;
  border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px; cursor: pointer; }}
.bar button[aria-pressed="true"] {{ background: var(--jade); border-color: var(--jade); color: var(--bg); }}
.bar input {{ font: 400 14px var(--f-body); color: var(--ink); background: var(--surface); border: 1px solid var(--line);
  border-radius: 999px; padding: 8px 14px; min-width: 0; flex: 1 1 180px; }}
button:focus-visible, input:focus-visible, summary:focus-visible {{ outline: 2px solid var(--gold-soft); outline-offset: 2px; }}
.product {{ padding-block: 44px; border-bottom: 1px solid var(--line); display: grid; gap: 18px; }}
.pgrid {{ display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 32px; align-items: start; }}
.hero {{ margin: 0; display: grid; gap: 8px; }}
.hero img {{ width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; display: block; max-width: 100%; background: var(--code-bg); }}
.noimg {{ aspect-ratio: 4 / 3; max-width: 100%; display: grid; place-content: center; text-align: center; gap: 6px; padding: 24px;
  border: 1px dashed var(--flag); color: var(--flag); background: var(--surface); }}
.noimg span {{ font: 400 24px var(--f-display); }}
figcaption {{ display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 13px; color: var(--muted); }}
.pill {{ font-size: 11px; letter-spacing: .12em; text-transform: uppercase; border: 1px solid var(--line); border-radius: 999px; padding: 3px 9px; white-space: nowrap; }}
.pill.ok {{ color: var(--ok); border-color: var(--ok); }}
.pill.flag {{ color: var(--flag); border-color: var(--flag); }}
.pill.ref {{ color: var(--jade); border-color: var(--jade); }}
.meta {{ display: grid; gap: 12px; min-width: 0; }}
.eyebrow {{ margin: 0; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--gold); }}
.meta h3 {{ font: 400 30px/1.15 var(--f-display); margin: 0; text-wrap: balance; }}
.etitle {{ margin: 0; color: var(--muted); font-size: 15px; }}
.price {{ display: flex; flex-wrap: wrap; gap: 22px; margin: 4px 0; }}
.price div {{ display: grid; }}
.price dt {{ font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }}
.price dd {{ margin: 0; font: 400 24px/1.2 var(--f-display); }}
.chips {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.chip {{ font-size: 13px; padding: 4px 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 4px; }}
.why {{ margin: 0; font-size: 14px; color: var(--muted); max-width: 60ch; }}
details.sub {{ border-top: 1px solid var(--line); }}
details.sub > summary {{ cursor: pointer; list-style: none; padding-block: 12px; font-weight: 500; letter-spacing: .04em; }}
details.sub > summary::before {{ content: "+"; display: inline-block; width: 1.2em; color: var(--gold); }}
details.sub[open] > summary::before {{ content: "−"; }}
details.sub h4 {{ font: 500 12px/1.4 var(--f-body); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin: 18px 0 6px; }}
details.sub p, details.sub ul, details.sub ol {{ max-width: 76ch; }}
.lede {{ font-weight: 500; }}
.steps {{ display: grid; gap: 4px; }}
.copy {{ position: relative; display: grid; }}
.copy pre {{ margin: 0; white-space: pre-wrap; word-break: break-word; background: var(--code-bg); border-radius: 4px;
  padding: 14px 92px 14px 14px; font-size: 13px; line-height: 1.55; max-height: 22em; overflow: auto; }}
.copy pre.mono {{ font-family: var(--f-mono); }}
.copy pre.txt {{ font-family: var(--f-body); font-size: 14px; }}
.copy pre.long {{ max-height: 30em; }}
.cp {{ position: absolute; top: 8px; right: 8px; background: var(--surface); padding: 6px 10px; font-size: 12px; }}
.cp.done {{ color: var(--ok); border-color: var(--ok); }}
.frames {{ list-style: none; margin: 0; padding: 0; display: grid; gap: 22px; }}
.fh {{ display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: baseline; margin-bottom: 8px; }}
.fh b {{ font: 400 22px var(--f-display); color: var(--gold); }}
.purpose {{ flex: 1 1 260px; min-width: 0; }}
.alt {{ margin: 6px 0 0; font-size: 13px; color: var(--muted); }}
.alt span {{ font-size: 11px; letter-spacing: .12em; text-transform: uppercase; margin-right: 6px; }}
.empty {{ padding-block: 40px; color: var(--muted); }}
@media (max-width: 820px) {{ .pgrid, .howto {{ grid-template-columns: minmax(0, 1fr); }} }}
@media (prefers-reduced-motion: reduce) {{ * {{ scroll-behavior: auto !important; transition: none !important; }} }}
</style>
<div class="wrap">
<header class="top">
  <p class="kicker">Jade Gold NYC · Noel 2026</p>
  <h1>Kırk parça, her biri on altı kare</h1>
  <p class="intro">10 bileklik, 10 kolye, 10 küpe ve 10 broş: hepsi 14K sarı altın. Her parça atölye kapısından geçti: tezgâh sırası, malzeme listesi, arıza modları ve toleranslar aşağıda. Hero görseller üretildi; geri kalan 15 karenin promptları, her birinin Etsy'deki işiyle birlikte burada.</p>
  <dl class="stats">
    <div><dt>Parça</dt><dd class="num">{len(prods)}</dd></div>
    <div><dt>Hero hazır</dt><dd class="num">{n_ok}</dd></div>
    <div><dt>Senin üreteceğin hero</dt><dd class="num">{n_flag}</dd></div>
    <div><dt>Prompt</dt><dd class="num">{sum(len(v) for v in PROMPTS.values())}</dd></div>
  </dl>
</header>
<section class="howto">
  <div>
    <h2>Nasıl üretilir</h2>
    <ol>
      <li>Higgsfield'da model <code>{e(params["model"])}</code>, oran <code>{e(params["aspect_ratio"])}</code>, çözünürlük <code>{e(params["resolution"])}</code> (açıkça seç; varsayılan 1k), düşünme <code>{e(params["thinking_level"])}</code>, adet 1.</li>
      <li>01 hero referanssız üretilir. 02–16 için o ürünün hero kırpımını (<code>images/heroes/crops/&lt;ID&gt;.jpg</code>) tek referans olarak ekle.</li>
      <li>Promptu olduğu gibi yapıştır. Kare promptla çelişiyorsa cümleyi sertleştirme, aynı promptla bir kez daha dene; ikinci kez de tutmazsa pozu değiştir.</li>
      <li>09 numaralı karede kutu sade fildişi karton olarak tarif edildi. Kendi kutun farklıysa kutunun fotoğrafını ikinci referans olarak ekle.</li>
      <li>11 ve 13 numaralı karelerde boş bırakılan alana mm ölçüsünü ya da motifin hikâyesini sonradan yaz.</li>
    </ol>
  </div>
  <div>
    <h2>On altı karenin işi</h2>
    <div class="tw"><table><thead><tr><th>Kare</th><th>Etsy'deki işi</th></tr></thead><tbody>{frame_rows}</tbody></table></div>
  </div>
</section>
<nav class="bar" aria-label="Süzgeç">
  <button type="button" data-f="all" aria-pressed="true">Tümü</button>
  <button type="button" data-f="bracelet" aria-pressed="false">Bileklik</button>
  <button type="button" data-f="necklace" aria-pressed="false">Kolye</button>
  <button type="button" data-f="earrings" aria-pressed="false">Küpe</button>
  <button type="button" data-f="brooch" aria-pressed="false">Broş</button>
  <button type="button" data-f="flag" aria-pressed="false">Kendin üret ({n_flag})</button>
  <input id="q" type="search" placeholder="Ara: kod, ad, başlık" aria-label="Ara">
</nav>
<main>
{"".join(product(p) for p in prods)}
<p class="empty" id="empty" hidden>Bu süzgeçte parça yok.</p>
</main>
</div>
<script>
(function () {{
  var bar = document.querySelector('.bar'), q = document.getElementById('q');
  var items = Array.prototype.slice.call(document.querySelectorAll('.product'));
  var mode = 'all';
  function apply() {{
    var s = (q.value || '').trim().toLowerCase(), shown = 0;
    items.forEach(function (el) {{
      var ok = (mode === 'all' || (mode === 'flag' ? el.dataset.flag === '1' : el.dataset.cat === mode)) &&
               (!s || el.dataset.q.indexOf(s) !== -1);
      el.hidden = !ok; if (ok) shown++;
    }});
    document.getElementById('empty').hidden = shown !== 0;
  }}
  bar.addEventListener('click', function (ev) {{
    var b = ev.target.closest('button[data-f]'); if (!b) return;
    mode = b.dataset.f;
    bar.querySelectorAll('button[data-f]').forEach(function (x) {{ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }});
    apply();
  }});
  q.addEventListener('input', apply);
  document.addEventListener('click', function (ev) {{
    var b = ev.target.closest('.cp'); if (!b) return;
    var pre = b.parentNode.querySelector('pre');
    function done() {{ b.textContent = 'Kopyalandı'; b.classList.add('done');
      setTimeout(function () {{ b.textContent = 'Kopyala'; b.classList.remove('done'); }}, 1600); }}
    function fallback() {{ var r = document.createRange(); r.selectNodeContents(pre);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent = 'Seçildi, Ctrl+C'; }}
    try {{ navigator.clipboard.writeText(pre.textContent).then(done, fallback); }} catch (err) {{ fallback(); }}
  }});
}})();
</script>
"""
(HERE / "image-book.html").write_text(page)
print(f"image-book.html: {len(page) / 1024:.0f} KB, {n_ok} heroes, {n_flag} flagged")
