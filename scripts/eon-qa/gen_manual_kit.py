# -*- coding: utf-8 -*-
"""EON manuel Etsy kiti — eon16_approved.json'dan kopyala-yapıştır HTML'i üretir.
Kullanıcı terminal/SQL koşamıyor; bu dosya TEK BAŞINA manuel listing açmaya yeter:
alan alan kopya butonu (başlık/etiket/malzeme/açıklama/kişiselleştirme) + genişlik×band
fiyat tablosu + varyasyon kurulum talimatı + listing-başı kontrol listesi."""
import json, re, html

READY = {"01","02","03","04","05","06","13","14","15"}
HOLD = {"07","08","09","10","11","12"}
BANDS = ["US 4-6.5", "US 7-9.5", "US 10-11.5", "US 12-13"]
BAND_SIZES = ["4, 4.5, 5, 5.5, 6, 6.5", "7, 7.5, 8, 8.5, 9, 9.5",
              "10, 10.5, 11, 11.5", "12, 12.5, 13"]
PERSONALIZATION = ("Free hidden engraving inside the band. Type your text here - "
    "a date, initials, coordinates, or a few words (up to 30 characters). "
    "Script lettering is the default; add a note if you prefer block letters. "
    "Leave blank and the band ships clean.")

# repo'da onaylı içerik docs/eon/ altında yaşar; scratchpad koşumu eski adı kullanır.
import os
_SRC = next(p for p in ("../../docs/eon/eon16-approved-content.json",
                        "eon16_approved.json") if os.path.exists(p))
Ls = json.load(open(_SRC))
def clean_desc(d):  # push script stripInternalTrailer paritesi
    return re.sub(r"\n*---\n\[EON [\s\S]*\]$", "", d).rstrip()

def esc(s): return html.escape(s, quote=True)

def field(label, value, multiline=False, note=""):
    v = esc(value)
    box = (f'<textarea readonly rows="{min(14, max(3, value.count(chr(10))+2))}">{v}</textarea>'
           if multiline else f'<input readonly value="{v}">')
    n = f'<span class="note">{esc(note)}</span>' if note else ""
    return (f'<div class="field"><div class="fh"><label>{esc(label)}</label>{n}'
            f'<button class="copy" type="button">Kopyala</button></div>{box}</div>')

cards = []
order = sorted(Ls, key=lambda L: (L["key"] not in READY, L["key"] in HOLD, L["key"]))
for L in order:
    no = L["key"]
    st = ("READY","st-ok") if no in READY else (("HOLD","st-hold") if no in HOLD else ("FAIL","st-fail"))
    tags = ", ".join(L["tags"])
    mats = f"Gold, {L['karat'].lower()} gold, Solid gold"
    pm = L["price_matrix"]; widths = sorted(pm, key=int)
    rows = "".join(
        f"<tr><td>{w}mm</td>" + "".join(f"<td>${p:,}</td>" for p in pm[w]) + "</tr>"
        for w in widths)
    sizes_rows = "".join(f"<tr><td>{BANDS[i]}</td><td>{BAND_SIZES[i]}</td></tr>" for i in range(4))
    warn = ""
    if no in HOLD:
        warn = '<p class="warn">HOLD — gram teyidi bekliyor; bu listingi ŞİMDİLİK AÇMA.</p>'
    elif no == "16":
        warn = '<p class="warn">FAIL — yayın kapısından geçmedi; bu listingi AÇMA.</p>'
    elif no in {"13","14","15"}:
        warn = ('<p class="warn">Taslak açabilirsin; PUBLISH etmeden önce Milgrain gram '
                'teyidi şart (baz $315→$345 çıkabilir).</p>')
    cards.append(f"""
<details class="card" {"open" if no in READY else ""}>
<summary><span class="no">EON {no}</span> <span class="fam">{esc(L['family'])} · {esc(L['color'])}</span>
<span class="st {st[1]}">{st[0]}</span><span class="price">baz ${L['anchor_usd']:,}</span></summary>
{warn}
{field("Başlık (Title)", L["title"], note=f"{len(L['title'])} karakter")}
{field("Etiketler (Tags — 13 adet, virgülle)", tags, note="Etsy tag kutusuna virgüllü yapıştır")}
{field("Malzemeler (Materials)", mats)}
{field("Açıklama (Description — iç not TEMİZLENMİŞ)", clean_desc(L["description"]), multiline=True)}
{field("Kişiselleştirme talimatı (Personalization instructions)", PERSONALIZATION, multiline=True,
       note="Personalization: ON · 30 karakter · isteğe bağlı")}
<div class="grid2">
<div><h4>Fiyat matrisi — Width × Ring Size bandı (USD)</h4>
<table><tr><th>Genişlik</th>{"".join(f"<th>{b}</th>" for b in BANDS)}</tr>{rows}</table>
<p class="note">Band içindeki HER beden aynı fiyat. Etsy'de "Prices vary for each
Width + Ring Size" işaretle; her bedene bandının fiyatını gir.</p></div>
<div><h4>Band → bedenler</h4><table><tr><th>Band</th><th>US bedenler</th></tr>{sizes_rows}</table>
<p class="note">{esc(L['setup_en'][:220])}…</p></div>
</div>
<ul class="check">
<li>Fotoğraflar: hero (kapak {no}.jpg) + partner havuzundan 9+ foto/video + size chart + width guide (foto 2-3)</li>
<li>Attribute'lar: Occasion=Wedding · Metal={esc(L['color'].lower())} gold · Karat={esc(L['karat'])} · uygun Style</li>
<li>Kargo: ücretsiz ABD takipli, 5-7 iş günü işleme (kargo fiyata gömülü — ücretsiz ŞART)</li>
<li>Renewal: publish'te otomatik yenilemeyi AÇIK bırak · Bölüm: {"Milgrain Bands" if L["style"]=="Milgrain" else "Dome Bands"}</li>
</ul>
</details>""")

page = f"""<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EON 16 — Etsy Manuel Listing Kiti (2026-07-16)</title>
<style>
:root {{ color-scheme: light dark; --ok:#1a7f4b; --hold:#9a6b00; --fail:#b3261e;
  --bd: color-mix(in srgb, currentColor 18%, transparent); }}
body {{ font: 15px/1.55 system-ui, sans-serif; max-width: 980px; margin: 24px auto; padding: 0 16px; }}
h1 {{ font-size: 1.35rem; }} h4 {{ margin: 0 0 6px; font-size: .85rem; }}
.lead, .note {{ opacity:.75; font-size:.82rem; }}
.card {{ border: 1px solid var(--bd); border-radius: 14px; padding: 0 16px; margin: 14px 0; }}
.card[open] {{ padding-bottom: 14px; }}
summary {{ cursor: pointer; padding: 12px 0; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }}
.no {{ font-weight: 700; }} .fam {{ opacity: .8; }} .price {{ margin-left: auto; font-weight: 600; }}
.st {{ font-size: .72rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; color: #fff; }}
.st-ok {{ background: var(--ok); }} .st-hold {{ background: var(--hold); }} .st-fail {{ background: var(--fail); }}
.field {{ margin: 10px 0; }}
.fh {{ display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px; }}
.fh label {{ font-weight: 600; font-size: .82rem; }}
.fh .note {{ margin-left: auto; }}
input, textarea {{ width: 100%; box-sizing: border-box; font: 13px/1.5 ui-monospace, monospace;
  padding: 8px 10px; border: 1px solid var(--bd); border-radius: 8px; background: transparent; color: inherit; resize: vertical; }}
button.copy {{ font: 600 12px system-ui; padding: 3px 12px; border-radius: 99px; cursor: pointer;
  border: 1px solid var(--bd); background: transparent; color: inherit; }}
button.copy.done {{ background: var(--ok); color: #fff; border-color: var(--ok); }}
table {{ border-collapse: collapse; width: 100%; font-size: .82rem; }}
th, td {{ border: 1px solid var(--bd); padding: 4px 8px; text-align: right; }}
th:first-child, td:first-child {{ text-align: left; }}
.grid2 {{ display: grid; gap: 14px; grid-template-columns: 1fr; margin: 10px 0; }}
@media (min-width: 760px) {{ .grid2 {{ grid-template-columns: 3fr 2fr; }} }}
.check {{ font-size: .82rem; margin: 8px 0 0; padding-left: 18px; }} .check li {{ margin: 3px 0; }}
.warn {{ color: var(--fail); font-weight: 600; font-size: .85rem; }}
.box {{ border: 1px solid var(--bd); border-radius: 14px; padding: 12px 16px; font-size: .85rem; }}
</style></head><body>
<h1>EON 16 — Etsy Manuel Listing Kiti <span class="lead">(2026-07-16 · onaylı içerik)</span></h1>
<div class="box">
<p><b>Nasıl kullanılır:</b> Etsy'de <b>Shop Manager → Listings → Add a listing</b> de;
aşağıdaki karttan alan alan <b>Kopyala</b>'ya bas, Etsy'deki karşılığına yapıştır.
Önce <b>Save as draft</b> — taslakları topluca kontrol etmeden hiçbirini publish etme.</p>
<p><b>Sıra (dalga planı):</b> Gün 0: EON 01-02-03 → +3-4 gün: 04-05-06 → +7-8 gün: 13-14-15.
Publish sonrası ilk 48 saat başlık/etikete DOKUNMA. Açılış indirimi: yalnız 04-06 + 13-15'e
Etsy <b>Sale</b> aracıyla %10-15 (baz fiyatı değiştirme). 07-12 ve 16'yı hiç açma (HOLD/FAIL).</p>
<p><b>Sabitler (her listingde aynı):</b> Who made = <b>I did</b> · What is it = Finished product ·
When = Made to order · Renewal = Automatic · Quantity = her varyasyon için 1-2 ·
Personalization = ON (talimat metni kartta) · Ücretsiz ABD kargo, 5-7 iş günü işleme.</p>
<p><b>Publish'i bağlayan 3 teyit:</b> ① Milgrain (13-15) gram teyidi partnerden ②
"Stamped 14k/10k inside" yazdık — atölyeden damga teyidi ③ Beyaz altın (02/05/14)
rodyumlu mu doğal mı — cevaba göre 1 cümle eklenecek.</p>
</div>
{''.join(cards)}
<script>
document.querySelectorAll('button.copy').forEach(function (b) {{
  b.addEventListener('click', function () {{
    var box = b.closest('.field').querySelector('input,textarea');
    navigator.clipboard.writeText(box.value).then(function () {{
      b.textContent = 'Kopyalandı ✓'; b.classList.add('done');
      setTimeout(function () {{ b.textContent = 'Kopyala'; b.classList.remove('done'); }}, 1600);
    }});
  }});
}});
</script></body></html>"""
open("eon-etsy-manuel-kit.html", "w").write(page)
print("kit hazır:", len(order), "listing;", sum(1 for L in order if L['key'] in READY), "READY")
