"""Jade Gold NYC, Christmas 2026: the maker's book as one PDF (Turkish).

Run: python3 -I docs/jade/xmas26/maker_book.py
     -> build/ (resized images, gitignored), maker-book.html (gitignored),
        Jade-Noel-2026-Uretici-Kitabi.pdf (committed)

Every piece page is read from catalog.json, the same file the listings, prices and prompts come
from; the technical foundation comes from work/evidence_summary.json; the render notes from
images/heroes/status.json. Nothing about a piece is typed here a second time, so the book cannot
drift from the catalog. Retail prices are deliberately NOT in this document: the maker is being
asked to quote. Where a render and the text differ, the text governs and the page says so.

The PDF is printed with the bundled Chromium (no Playwright needed): set CHROME to override the
binary. Page numbers come from @page margin boxes, which Chromium 131+ supports.
"""
import datetime
import html
import json
import os
import pathlib
import subprocess

from PIL import Image

HERE = pathlib.Path(__file__).parent
CAT = json.load(open(HERE / "catalog.json"))["products"]
EV = json.load(open(HERE / "work" / "evidence_summary.json"))
STATUS = json.load(open(HERE / "images" / "heroes" / "status.json"))
BUILD = HERE / "build"
BUILD.mkdir(exist_ok=True)
TODAY = datetime.date.today().isoformat()
PDF = HERE / "Jade-Noel-2026-Uretici-Kitabi.pdf"
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")

E = html.escape
CAT_TR = {"bracelet": "Bileklik", "necklace": "Kolye", "earrings": "Küpe", "brooch": "Broş"}

# what the maker must know where a render does not match the written piece (status.json names the
# fault for the owner; this is the same fault in the maker's terms)
RENDER_NOTE = {}  # 2026-10-18: the owner kept every render; where one differed, the text was aligned to it
assert set(RENDER_NOTE) == {k for k, v in STATUS.items() if v["status"] != "ok"}, "status.json ile not listesi uyuşmuyor"

# the line rules the tolerance tables refer to (L1-L10); L11/L12 are design-line rules, not the maker's
LINE_RULES = [
    ("L1 Ayar", "Tüm parçalar 14K sarı altın. Mineli parçalar cinkosuz, mine uyumlu 14K sarı alaşımdan "
                "(Otto Frei 846-180 tabanlı, yazılı Zn=0 sertifikası) vakumla dökülür; minesiz parçalar standart 14K sarı."),
    ("L2 Mine", "Hücreler dökümde çıkar (oyma yok): derinlik 0.5–0.6 mm, taban ≥0.8 mm, hücre duvarı ≥0.70 mm. "
                "Opak ağırlıklı, kurşunsuz mine; pişirim ≤790 °C, en fazla 4 pişirim; mine altın yüzeyle aynı kotta (level)."),
    ("L3 Bağlantı", "İlk pişirimden sonra hamlaç lehimi yok. Bulgular (kilit, civi, mafsal, C-halka) pişirim bittikten "
                    "sonra lazerle, çıplak pede, mine kenarından ≥1.5 mm uzakta kaynaklanır."),
    ("L4 Taş", "1.3–2.0 mm yuvarlak brilyant lab-grown (beyaz safir ya da buz mavisi safir), flush/gypsy mıhlama. "
               "Ev sahibi kalınlığı: 1.5 mm taş → 1.5 mm, 1.8 → 1.7, 2.0 → 1.8. Yanal duvar ≥0.35 mm (<1.8 mm taş), "
               "≥0.45 mm (1.8–2.5 mm). Taşın altında delik. Taşlar son pişirimden SONRA soğuk mıhlanır."),
    ("L5 Döküm", "Yapısal kesit ≥0.8 mm, dekoratif ≥0.6 mm, mafsal/taşıyıcı kesit ≥1.0 mm, açıklık ≥0.5 mm. "
                 "CAD'de +0.2 mm bitirme payı (elmas tıraşlı yüzlerde +0.1 mm)."),
    ("L6 Hollow", "İçi boş gövde yalnız kolyede/broşta ve asla mineyle birlikte değil. Bu kitapta tek hollow parça N5 "
                  "(tahliye delikli, duvar 0.80 mm)."),
    ("L7 Gram", "Altın gram bandı (zincir ve bulgular dahil): bileklik 3.2–3.9 g, kolye 2.8–4.2 g, küpe çifti "
                "1.40–1.75 g, broş 3.0–4.2 g. Sayfalardaki gramlar geometrik hesaptır; sizin tartımınız bizimkinin yerine geçer."),
    ("L8 Boy", "Bileklik 16.5 cm + 2.0 cm uzatma (halkalar 17.5 / 18.5 cm; gram 18.5 cm'de). Kolye 14K solid zincir, "
               "tipi ve genişliği her sayfada yazılı, 16 inç + 2 inç uzatma. Boy varyantı yok."),
    ("L9 Küpe", "Stud ≤12 mm, sarkıt ≤30 mm. Civi Stuller 1800 tipi 14K 0.76 × 11.1 mm, pişirim sonrası lazerle; "
                "14K friction arkalık (0.25 g/adet varsayıldı, numune tartılacak)."),
    ("L10 Broş", "≤30 mm parçada tek iğne, >30 mm parçada çift iğne; mafsal üstte; döner emniyet kilidi. "
                 "İğne 14K beyaz (nikelli) altın, sertleştirilmiş; bulgular grama dahil."),
]

PALETTE = [  # colour, swatch (approximate), definition
    ("Buz mavisi (ice-blue)", "#C9D4DC", "yumuşak, soluk pudra mavisi, gri kast; opak"),
    ("Derin yeşim yeşili (jade-green)", "#4E5E55", "koyu, boğuk gri-yeşil; şişe yeşiline yakın; opak"),
    ("Derin böğürtlen (berry)", "#6A2140", "koyu şarap kırmızısı / ahududu-mor; parlak kırmızı DEĞİL; opak"),
    ("Lacivert (navy)", "#1F2B4B", "derin koyu mavi; nazar motiflerinde dış halka ve göz bebeği; opak"),
    ("Beyaz", "#F1EFE8", "opak beyaz; nazar motiflerinde ara halka"),
]


def img(src, dst, width, quality=82):
    """Baseline JPEG at a fixed width, so the PDF embeds a small file (Chromium re-encodes progressive)."""
    if dst.exists():
        return
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.resize((width, round(h * width / w)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=quality, optimize=True, progressive=False, subsampling=0)


def li(items, numbered=False):
    """Some bench sequences carry their own "1. " prefixes; an <ol> would print them twice. The prefix is
    dropped only when it equals the item's own position, so "2. sarj" (second charge) stays."""
    out = []
    for i, x in enumerate(items):
        if numbered and x.startswith(f"{i + 1}. "):
            x = x[len(f"{i + 1}. "):]
        out.append(f"<li>{E(x)}</li>")
    return "".join(out)


def spec_rows(p):
    rows = [("Kategori", CAT_TR[p["category"]] + (" · erkek yaka iğnesi" if p.get("wearer") == "men" else "")),
            ("Ayar", "14K sarı altın" + (" · mineli: cinkosuz mine uyumlu alaşım (L1)" if p["enamel"] else " · standart 14K sarı")),
            ("Boyutlar", p["workshop"]["dimensions"]),
            ("En büyük ölçü", f"{p['max_mm']} mm"),
            ("Altın", f"{p['gold_grams']:.2f} g hedef (geometrik hesap, tartım değil)"
                      + (f" · terazide toplam {p['total_grams']:.2f} g (mine/taş dahil)" if p["total_grams"] != p["gold_grams"] else "")),
            ("Mine", p["enamel_colours_tr"] if p["enamel"] else "Yok"),
            ("Taş", p["stones_tr"] if p["stones"] else "Yok"),
            ("Malzeme (listing)", ", ".join(p["materials"]))]
    if p.get("hollow"):
        rows.append(("Hollow", "Evet: üst gövde içi boş, tahliye delikli (L6)"))
    return "".join(f"<tr><th>{E(k)}</th><td>{E(v)}</td></tr>" for k, v in rows)


def piece(p):
    pid = p["id"]
    hero_src, crop_src = HERE / "web" / f"{pid}.jpg", HERE / "images" / "heroes" / "crops" / f"{pid}.jpg"
    assert hero_src.exists() and crop_src.exists(), pid
    img(hero_src, BUILD / f"{pid}-hero.jpg", 1200)
    img(crop_src, BUILD / f"{pid}-crop.jpg", 800)
    w = p["workshop"]
    note = RENDER_NOTE.get(pid)
    note_html = f'<p class="flag"><b>Görsel notu.</b> {E(note)} <b>Metin esastır.</b></p>' if note else ""
    fm = "".join(f"<tr><td>{E(f['mode'])}</td><td>{E(f['prevention'])}</td></tr>" for f in w["failure_modes"])
    tc = "".join(f"<tr><td>{E(t['rule'])}</td><td>{E(t['value'])}</td><td class=ok>{'✓' if t['pass'] else '✗'}</td></tr>"
                 for t in w["tolerance_checks"])
    return f"""
<section class="piece" id="{pid}">
  <header><span class="code">{pid}</span><h2>{E(p['name'])}</h2>
    <span class="group">{E(CAT_TR[p['category']])}{' · erkek' if p.get('wearer') == 'men' else ''}</span></header>
  <div class="cols">
    <figure>
      <img class="hero" src="build/{pid}-hero.jpg" alt="">
      <img class="crop" src="build/{pid}-crop.jpg" alt="">
      <figcaption>Tasarım görseli (14K sarı); numune fotoğrafı değildir. Görsel ile metin çelişirse metin esastır.</figcaption>
      {note_html}
    </figure>
    <div class="text">
      <h3>Özet</h3>
      <table class="spec">{spec_rows(p)}</table>
      <h3>İnşa</h3>
      <p>{E(w['construction'])}</p>
      <h3>Şekil tanımı (render metni, EN)</h3>
      <p class="en">{E(p['camera'])}</p>
      <p class="en"><b>Arka:</b> {E(p['back'])} <b>Yan:</b> {E(p['side'])}</p>
    </div>
  </div>
  <div class="wide">
    <h3>Tezgâh sırası</h3><ol class="steps">{li(w['bench_sequence'], numbered=True)}</ol>
    <h3>Malzeme listesi ve gram kurulumu</h3><ul class="bom">{li(w['bom'])}</ul>
    <h3>Arıza modları ve önlemi</h3>
    <table class="grid"><thead><tr><th>Arıza</th><th>Tasarım nasıl önlüyor</th></tr></thead><tbody>{fm}</tbody></table>
    <h3>Tolerans kontrolleri</h3>
    <table class="grid tc"><thead><tr><th>Kural</th><th>Bu parçada</th><th></th></tr></thead><tbody>{tc}</tbody></table>
    <div class="keep"><h3>Bu parça için sorularımız</h3><ul class="ask">{li(p['open_questions'])}</ul></div>
  </div>
</section>"""


def index_rows():
    out = []
    for p in CAT:
        st = STATUS[p["id"]]["status"]
        out.append(f"<tr><td class=code>{p['id']}</td><td>{E(p['name'])}</td><td>{E(CAT_TR[p['category']])}"
                   f"{' · erkek' if p.get('wearer') == 'men' else ''}</td><td class=num>{p['max_mm']}</td>"
                   f"<td class=num>{p['gold_grams']:.2f}</td><td>{E(p['enamel_colours_tr']) if p['enamel'] else '–'}</td>"
                   f"<td>{E(p['stones_tr']) if p['stones'] else '–'}</td><td>{'✓' if st == 'ok' else 'nota bak'}</td></tr>")
    return "".join(out)


def tech():
    v, lw, fs, cm, bf, ep = (EV["vitreous_14k"], EV["laser_weld"], EV["flush_seat_rule"], EV["casting_minimums"],
                             EV["brooch_findings"], EV["earring_posts"])
    para = lambda t: f"<p>{E(t)}</p>"
    return f"""
<section class="tech">
  <h2>Teknik temel</h2>
  <p class="lede">Aşağıdaki notlar tasarımların dayandığı kanıtlardır (kaynaklar metinde). "Kaynaksız tahmin" denen her
  değer sizin ölçümünüzle değişir; lütfen düzeltin.</p>
  <h3>Alaşım ve ayar politikası</h3>{para(EV['karat_policy'])}
  <h3>14K üzerinde fırınlı (vitreous) mine</h3>
  <p><b>Karar:</b> {E(v['verdict'])} · <b>pişirim:</b> {E(v['firing_temp_c'])} · <b>en fazla pişirim:</b> {v['max_firing_cycles']}</p>
  {para(EV['enamel_maturation_note'])}
  <p><b>Fırınlı mine mümkün değilse:</b> parça soğuk mineye (epoksi reçine) düşer ve listing'de açıkça öyle beyan edilir;
  18K'ye geçilmez. Teklifinizde iki seçeneği ayrı fiyatlayın.</p>
  <h3>Bulgu bağlantısı: lazer kaynak</h3>{para(lw['verdict'])}
  <p><b>Mine kenarına asgari uzaklık:</b> {lw['min_distance_from_enamel_mm']} mm.</p>
  <h3>Flush (gypsy) taş yuvası</h3>
  <p><b>Ev sahibi kalınlığı:</b> 1.5 mm taş → {fs['min_host_thickness_mm_1_5']} mm · 1.8 mm → {fs['min_host_thickness_mm_1_8']} mm ·
  2.0 mm → {fs['min_host_thickness_mm_2_0']} mm (toplam taş derinliği çapın %{fs['total_depth_pct_of_diameter']}'ü + kulet payı).</p>
  <p><b>Alt delik:</b> {E(fs['through_hole'])}</p>
  <p><b>Yanal duvar:</b> {E(fs['lateral_wall'])}</p>
  <h3>Döküm minimumları</h3>
  <p><b>Dekoratif</b> ≥{cm['decorative_min_mm']} mm · <b>yapısal</b> ≥{cm['structural_min_mm']} mm · <b>açıklık</b> ≥{cm['opening_min_mm']} mm.</p>
  {para(cm['notes'])}
  <h3>Broş bulguları</h3>
  <p><b>İğne:</b> {E(bf['pin_stem'])}</p>
  <p><b>Mafsal ve kilit:</b> {E(bf['joint_and_catch'])}</p>
  <p><b>Mineli parçada bağlama:</b> {E(bf['attachment_on_enamel_piece'])}</p>
  <p><b>Bulgu kütlesi:</b> {E(bf['findings_mass_g'])}</p>
  <h3>Küpe civileri</h3>
  <p><b>Civi:</b> {E(ep['post_spec'])}</p>
  <p><b>Pişirim sonrası sertlik:</b> {E(ep['temper_after_firing'])}</p>
  <p><b>Mineli parçada bağlama:</b> {E(ep['attachment_on_enamel_piece'])}</p>
  <p><b>Donanım kütlesi:</b> {E(ep['hardware_mass_g'])}</p>
</section>"""


rules = "".join(f"<tr><th>{E(k)}</th><td>{E(v)}</td></tr>" for k, v in LINE_RULES)
palette = "".join(f'<tr><td><span class="sw" style="background:{hx}"></span></td><th>{E(n)}</th><td>{E(d)}</td></tr>'
                  for n, hx, d in PALETTE)
n_enamel, n_stone = sum(p["enamel"] for p in CAT), sum(1 for p in CAT if p["stones"])
flagged = ", ".join(sorted(RENDER_NOTE, key=lambda x: (x[0], int(x[1:]))))
flag_line = (f"{len(RENDER_NOTE)} görsel ({flagged}) kendi sayfasında işaretli bir notla metinden ayrılıyor."
             if RENDER_NOTE else
             "Bütün görseller metinle uyumludur; dört parçada (E9, N7, N9, P2) sahip görseli seçti ve metin görsele eşitlendi.")

doc = f"""<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>Jade Gold NYC · Noel 2026 · Üretici Kitabı</title>
<style>
@page {{ size: A4; margin: 14mm 14mm 18mm 14mm;
  @bottom-left {{ content: "Jade Gold NYC · Noel 2026 · Üretici kitabı · {TODAY}"; font: 7.5pt Inter, sans-serif; color: #8a8378; }}
  @bottom-right {{ content: counter(page) " / " counter(pages); font: 7.5pt Inter, sans-serif; color: #8a8378; }} }}
html {{ font-family: Inter, "DejaVu Sans", sans-serif; color: #1c1a17; font-size: 9.5pt; line-height: 1.42; }}
body {{ margin: 0; }}
h1, h2 {{ font-family: Caladea, "DejaVu Serif", serif; font-weight: 400; margin: 0; }}
h1 {{ font-size: 28pt; line-height: 1.1; }}
h2 {{ font-size: 20pt; line-height: 1.15; }}
h3 {{ font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #8a6d3b; margin: 11pt 0 3pt; font-weight: 600; break-after: avoid; }}
p {{ margin: 0 0 5pt; }}
ol, ul {{ margin: 0; padding-left: 14pt; }}
li {{ margin-bottom: 2pt; break-inside: avoid; }}
.cover {{ break-after: page; display: flex; flex-direction: column; min-height: 250mm; }}
.kicker {{ font-size: 8.5pt; letter-spacing: .18em; text-transform: uppercase; color: #8a6d3b; margin-bottom: 16pt; }}
.meta {{ margin-top: 14pt; color: #5c574f; }}
.ask {{ margin-top: 22pt; border-top: 1px solid #d9d2c5; padding-top: 12pt; }}
.cover ol li {{ margin-bottom: 4pt; }}
.front {{ break-after: page; }}
table {{ border-collapse: collapse; width: 100%; }}
.index td, .index th {{ padding: 3pt 5pt; border-bottom: 1px solid #e6e0d4; text-align: left; vertical-align: top; font-size: 8.5pt; }}
.index th {{ font-size: 7.5pt; letter-spacing: .1em; text-transform: uppercase; color: #8a6d3b; }}
td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
.code {{ font-family: "DejaVu Sans Mono", monospace; font-size: 9pt; color: #8a6d3b; letter-spacing: .06em; }}
table.rules th {{ text-align: left; width: 22mm; padding: 4pt 6pt 4pt 0; vertical-align: top; color: #5c574f; font-weight: 600; }}
table.rules td {{ padding: 4pt 0; border-bottom: 1px solid #efe9de; vertical-align: top; }}
.sw {{ display: inline-block; width: 14mm; height: 8mm; border: 1px solid #c9c2b4; }}
table.palette th {{ text-align: left; padding: 3pt 6pt; vertical-align: middle; }}
table.palette td {{ padding: 3pt 6pt 3pt 0; vertical-align: middle; border-bottom: 1px solid #efe9de; }}
.tech p {{ text-align: justify; hyphens: auto; }}
section.piece {{ break-before: page; }}
section.piece header {{ display: flex; align-items: baseline; gap: 10pt; border-bottom: 1px solid #d9d2c5; padding-bottom: 6pt; margin-bottom: 10pt; }}
section.piece header .group {{ margin-left: auto; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #5c574f; }}
.cols {{ display: grid; grid-template-columns: 74mm 1fr; gap: 8mm; align-items: start; }}
figure {{ margin: 0; }}
figure img.hero {{ width: 74mm; height: 55.5mm; display: block; object-fit: cover; }}
figure img.crop {{ width: 74mm; height: 74mm; display: block; object-fit: cover; margin-top: 3mm; }}
figcaption {{ font-size: 7.5pt; color: #5c574f; margin-top: 3pt; }}
.flag {{ background: #fbf3e4; border-left: 3px solid #c9a24d; padding: 5pt 7pt; font-size: 8.5pt; margin-top: 6pt; }}
table.spec th {{ text-align: left; font-weight: 600; width: 22mm; padding: 2.5pt 5pt 2.5pt 0; vertical-align: top; font-size: 8.5pt; color: #5c574f; }}
table.spec td {{ padding: 2.5pt 0; border-bottom: 1px solid #efe9de; font-size: 8.5pt; vertical-align: top; }}
.en {{ color: #3a3631; font-size: 8.5pt; }}
.wide {{ margin-top: 6pt; }}
.steps li, .bom li, .ask li {{ font-size: 8.5pt; }}
table.grid th, table.grid td {{ text-align: left; vertical-align: top; padding: 2.5pt 5pt 2.5pt 0; border-bottom: 1px solid #efe9de; font-size: 8pt; }}
table.grid th {{ font-size: 7.5pt; letter-spacing: .1em; text-transform: uppercase; color: #8a6d3b; }}
table.grid tr {{ break-inside: avoid; }}
table.tc td.ok {{ width: 5mm; text-align: center; color: #3f6b4f; }}
.lede {{ font-size: 10.5pt; }}
.keep {{ break-inside: avoid; }}
</style></head><body>
<section class="cover">
  <div class="kicker">Jade Gold NYC · Noel 2026</div>
  <h1>Kırk parça:<br>tasarım kitabı ve fiyat teklifi talebi</h1>
  <p class="meta">Hazırlanma {TODAY} · 10 bileklik · 10 kolye · 10 küpe · 10 broş · tümü 14K sarı altın ·
  {n_enamel} parçada fırınlı mine · {n_stone} parçada lab-grown taş</p>
  <div class="ask">
    <h3>Sizden istediklerimiz, parça başına</h3>
    <ol>
      <li>Parçanın yazıldığı ölçülerde dolu (solid) dökülüp bitirilebileceğinin onayı. Değiştireceğiniz ölçü varsa hangisi ve neden.</li>
      <li>Bitmiş 14K ağırlık. Bizim gramlarımız geometrik hesaptır ve bir payla yanlıştır; sizinki bizimkinin yerine geçer.</li>
      <li>14K sarı bitmiş parça fiyatı (altın + işçilik). Mineli parçalarda mine işi, taşlı parçalarda mıhlama ve taş ayrı kalem; taşı siz mi temin edersiniz, biz mi.</li>
      <li>Mineli parçalar için: cinkosuz mine uyumlu 14K alaşım dökebiliyor musunuz, fırınlı (vitreous) mine yapabiliyor musunuz? Yapamıyorsanız soğuk mine (epoksi) seçeneğini ayrı fiyatlayın.</li>
      <li>Bulgu numunelerinin tartımı: kilit, atlama halkası, uzatma zinciri, küpe civisi ve arkalığı, broş iğnesi/mafsalı/kilidi. Gram hedeflerimiz bu tahminlere dayanıyor.</li>
      <li>İlk numune ve 10'luk parti için süre.</li>
    </ol>
    <h3>Nasıl okunur</h3>
    <p>Her parça iki sayfadır: tasarım görseli ve yakın kırpımı, özet tablo, inşa, tezgâh sırası, malzeme listesi ve gram kurulumu, arıza modları,
    tolerans kontrolleri ve o parça için sorularımız. Görseller tasarım görselleştirmesidir, numune fotoğrafı değil; <b>görsel ile metin
    çelişirse metin esastır.</b> {flag_line}</p>
    <p>Perakende fiyat bu kitapta bilerek yok; teklif sizden bekleniyor. Tüm parçalar 14K sarı altındır; beyaz altın yalnız broş iğnesinde geçer.
    Gravür ve kişiselleştirme yoktur.</p>
  </div>
</section>
<section class="front">
  <h2>Hat kuralları</h2>
  <p class="lede">Tolerans tablolarındaki L1–L10 kodları bu kurallardır.</p>
  <table class="rules">{rules}</table>
  <h3 style="margin-top:16pt">Mine paleti</h3>
  <p>Renkler yaklaşık gösterilmiştir; renk, pişirim öncesi kuponla onaylanır. Mine kodunu (Thompson / Soyer vb.) siz seçersiniz; şart: kurşunsuz, opak, ≤790 °C'de olgunlaşan.</p>
  <table class="palette">{palette}</table>
</section>
{tech()}
<section class="front" style="break-before: page">
  <h2>Dizin</h2>
  <div class="index"><table><thead><tr><th>Kod</th><th>Parça</th><th>Kategori</th><th>En büyük mm</th><th>Altın g</th><th>Mine</th><th>Taş</th><th>Görsel</th></tr></thead>
  <tbody>{index_rows()}</tbody></table></div>
  <p style="margin-top:8pt;font-size:8.5pt;color:#5c574f">Gramlar geometrik hesaptır (zincir ve bulgular dahil); sizin tartımınızla karşılaştırılmak için buradalar.</p>
</section>
{''.join(piece(p) for p in CAT)}
</body></html>"""

(HERE / "maker-book.html").write_text(doc, encoding="utf-8")
print(f"maker-book.html: {len(CAT)} pieces, {len(RENDER_NOTE)} render notes, {len(doc) / 1024:.0f} KB")

cmd = [CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--run-all-compositor-stages-before-draw",
       "--virtual-time-budget=60000", "--no-pdf-header-footer", f"--print-to-pdf={PDF}",
       f"file://{HERE / 'maker-book.html'}"]
subprocess.run(cmd, check=True, capture_output=True)
info = subprocess.run(["pdfinfo", str(PDF)], check=True, capture_output=True, text=True).stdout
pages = int(next(l for l in info.splitlines() if l.startswith("Pages:")).split()[1])
print(f"{PDF.name}: {pages} pages, {PDF.stat().st_size / 1e6:.1f} MB")
