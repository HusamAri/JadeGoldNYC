#!/usr/bin/env python3
"""EON tag geçişi (2026-11-02): alyanslarda ölü "occasion" slotları alıcı ifadesine çevrilir.

Neden: 2026-10-21 üreteci her alyansa iki occasion tag'i yazdı ("anniversary gift him",
"promise ring for him"; 151 + 147 slot). EON'un kendi 30 günlük arama terimleri (188 terim,
215 ziyaret, 2026-10-21) bu ikisiyle 0 kez eşleşiyor; Jade Gold NYC'nin 12 aylık verisinde
hediye/occasion tag'leri 0 arama ziyareti aldı (Gift for Him 13/13 ölü). Alıcı ayar + renk +
model + ürün yazıyor ("mens white gold wedding band", "10k gold wedding band").

Kaynak ("önce" hâli): docs/eon/seo/2026-11-02-tag-pass/panel-before.json (panel aynası,
2026-11-02 22:05 UTC senkronu). Çıktı: aynı klasörde apply-matrix.json
(ops/seo-apply `?org=EON&pass=tags-2026-11-02` okur) + report.md.

Kural: YALNIZ ölü slot değişir; başlık ve diğer 11 tag birebir kalır. Yeni tag merdiveni,
listing'e göre ilk N uygun (N = ölü slot sayısı, kelime kümesi zaten varsa atlanır):
  gold wedding band (EON 30g 73 ziyaret, eRank 1.890/ay)
  renk + ürün: white gold band (31) / rose gold band (5, eRank 485) — yalnız o renkte
  ayar + ürün: 10k / 14k / 18k wedding band (17 / 13 / 2) — yalnız satılan ayar, 10k önce
  mens wedding ring (eRank 1.673), solid gold ring (1.713), mens gold ring (822)
Kapsam dışı (report.md'de sayılır): Noel/stacking/fidget/sizer (farklı alıcı; "christmas
gift" orada alıcının kendi ifadesi), 2026-10-22 yazımından sonra elle düzenlenmiş listing'ler
(sahibin tezgâhı; canlıda `live-changed` da atlar), ölü slotu olmayanlar.

Kapı (biri düşerse çıktı YAZILMAZ): 13 tag, ≤20 kr, [a-z0-9' ], tekrar yok, kelime-kümesi
tekrarı yok (ring/rings, band/bands aynı sayılır), korunan tag'ler birebir, başlık birebir,
eklenen tag'de hediye/occasion/his sözcüğü yok, renk tag'i yalnız başlıkta o renk varsa,
ayar tag'i yalnız listing o ayarı satıyorsa (panel-karats.json; yoksa başlığın ayarı).
Kullanım: python3 scripts/seo/tag_pass_2026_11_02.py [--check]
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "docs/eon/seo/2026-11-02-tag-pass"
BEFORE = DIR / "panel-before.json"
PREV22 = ROOT / "docs/eon/seo/2026-10-22-title-pass/apply-matrix.json"
KARATS = ROOT / "docs/eon/seo/2026-10-22-title-pass/panel-karats.json"
TERMS = ROOT / "docs/eon/seo/2026-10-21-etsy-keyword/data/etsy-search-terms-30d.tsv"
ERANK = ROOT / "docs/eon/seo/2026-10-21-etsy-keyword/data/erank-keywords.tsv"

DEAD = {"anniversary gift him", "promise ring for him", "his and hers band", "gift for her gold"}
DEAD_WORDS = re.compile(
    r"\b(gift|gifts|present|anniversary|birthday|valentine|christmas|holiday|him|her|hers|his|"
    r"unisex|promise|couples|groom|bride|minimalist|dainty|everyday|luxury|elegant|classic|modern|"
    r"simple|timeless|boho|trendy|chic|statement|delicate|unique|handmade|artisan|real|genuine|"
    r"authentic)\b")
NOT_BAND = re.compile(
    r"stacking|christmas|fidget|sizer|signet|calendar|\bstar\b|pinecone|holly|snowflake|poinsettia|"
    r"wreath|mistletoe|chapel|comet|bethlehem|garland|knit|ribbon|\bbow\b|\bleaf\b|ornament|advent|"
    r"origami|spinner|anxiety", re.I)
KARAT_ORDER = ["10", "14", "18"]  # EON arama terimlerinde 10k > 14k > 18k
TAG_RE = re.compile(r"^[a-z0-9' ]+$")


def wset(tag):
    """Kelime kümesi; çoğul kopyası aynı sayılır (rings = ring, bands = band, mens = men)."""
    return frozenset(w[:-1] if len(w) > 3 and w.endswith("s") else w for w in tag.lower().split())


def color_of(title):
    t = title.lower()
    if "white gold" in t:
        return "white"
    if "rose gold" in t:
        return "rose"
    if re.search(r"two.?tone", t):
        return "two tone"
    if "yellow gold" in t:
        return "yellow"
    return "gold"


def karats_of(lid, title, pk):
    ks = pk.get(lid)
    if ks:
        return [k for k in KARAT_ORDER if k in ks]
    found = set(re.findall(r"\b(10|14|18)k\b", title, re.I))
    return [k for k in KARAT_ORDER if k in found]


def ladder(color, karats):
    spec = []
    if color == "white":
        spec += ["white gold band", "white gold ring"]
    elif color == "rose":
        spec += ["rose gold band", "rose gold ring"]
    spec += [f"{k}k wedding band" for k in karats]
    return ["gold wedding band"] + spec + ["mens wedding ring", "solid gold ring", "mens gold ring"]


def build():
    before = json.load(open(BEFORE))["listings"]
    t22 = {r["id"]: r for r in json.load(open(PREV22))}
    pk = json.load(open(KARATS))["EON"]
    rows, skipped = [], []
    for L in before:
        lid, title, tags = L["id"], L["title"], L["tags"]
        dead = [t for t in tags if t.lower() in DEAD]
        if not tags:
            skipped.append((lid, "0 tag (sahibe: tag + varyant yok)", title))
            continue
        # Alyans: başlığı "Wedding Band" diyen her listing (Leaf / Star Cut alyansları dahil);
        # demeyenlerde Noel/stacking/fidget/sizer kalıbı varsa farklı alıcı, kapsam dışı.
        if not re.search(r"wedding band", title, re.I) and NOT_BAND.search(title):
            skipped.append((lid, "alyans değil, farklı alıcı", title))
            continue
        if not dead:
            skipped.append((lid, "ölü slot yok", title))
            continue
        if lid in t22 and title != t22[lid]["new_title"]:
            skipped.append((lid, "2026-10-22 sonrası elle düzenlenmiş", title))
            continue
        if lid not in t22:
            skipped.append((lid, "2026-10-22 matrisinde yok", title))
            continue
        color, ks = color_of(title), karats_of(lid, title, pk)
        have = {wset(t) for t in tags if t.lower() not in DEAD}
        picks = []
        for c in ladder(color, ks):
            if len(picks) == len(dead):
                break
            if wset(c) in have:
                continue
            have.add(wset(c))
            picks.append(c)
        if len(picks) != len(dead):
            raise SystemExit(f"{lid}: {len(dead)} ölü slot, {len(picks)} aday")
        it = iter(picks)
        new_tags = [next(it) if t.lower() in DEAD else t for t in tags]
        rows.append({
            "id": lid,
            "current_title": title,
            "current_tags": tags,
            "new_title": title,
            "new_tags": new_tags,
            "section_fix": None,
            "replaced": dead,
            "added": picks,
            "color": color,
            "karats": ks,
        })
    return rows, skipped


def check(rows, skipped):
    errs = []
    before = {L["id"]: L for L in json.load(open(BEFORE))["listings"]}
    pk = json.load(open(KARATS))["EON"]
    skipped_ids = {s[0] for s in skipped}
    for r in rows:
        i, t, n = r["id"], r["new_title"], r["new_tags"]
        if i in skipped_ids:
            errs.append(f"{i} hem satır hem atlanan")
        if t != r["current_title"] or t != before[i]["title"]:
            errs.append(f"{i} başlık değişmiş")
        if r["current_tags"] != before[i]["tags"]:
            errs.append(f"{i} önce hâli panelden farklı")
        if len(n) != 13:
            errs.append(f"{i} {len(n)} tag")
        if len(set(n)) != len(n):
            errs.append(f"{i} tekrar eden tag")
        if len({wset(x) for x in n}) != len(n):
            errs.append(f"{i} kelime kümesi tekrarı")
        for x in n:
            if len(x) > 20 or not TAG_RE.match(x):
                errs.append(f"{i} tag biçimi: {x}")
        kept_new = [x for x in n if x not in r["added"]]
        kept_old = [x for x in r["current_tags"] if x.lower() not in DEAD]
        if kept_new != kept_old:
            errs.append(f"{i} korunan tag'ler değişmiş")
        if any(x.lower() not in DEAD for x in r["replaced"]):
            errs.append(f"{i} ölü olmayan tag değiştirilmiş")
        color, ks = color_of(t), karats_of(i, t, pk)
        for a in r["added"]:
            if DEAD_WORDS.search(a):
                errs.append(f"{i} eklenen tag'de ölü sözcük: {a}")
            if ("white" in a and color != "white") or ("rose" in a and color != "rose"):
                errs.append(f"{i} renk tag'i başlıkla uyumsuz: {a} ({color})")
            m = re.match(r"(10|14|18)k", a)
            if m and m.group(1) not in ks:
                errs.append(f"{i} satılmayan ayar: {a} (panel {ks})")
            if a.lower() in DEAD:
                errs.append(f"{i} ölü tag eklenmiş: {a}")
        for x in n:
            if x.lower() in DEAD:
                errs.append(f"{i} ölü tag kaldı: {x}")
    return errs


def evidence(rows):
    """Seçilen ve kaldırılan tag'lerin EON 30 gün (strict: tag'in her kelimesi terimde) ve eRank sayısı."""
    terms = []
    for line in open(TERMS):
        if line.startswith("search_term"):
            continue
        t, v = line.rstrip("\n").split("\t")
        terms.append(({w.strip("\"',.-()&").replace("men's", "mens") for w in re.split(r"[\s,]+", t.lower())}, int(v)))
    erank = {}
    for line in open(ERANK):
        if line.startswith("keyword"):
            continue
        f = line.rstrip("\n").split("\t")
        erank[f[0]] = f[1]

    def strict(tag):
        ws = set(tag.lower().split())
        return sum(v for tws, v in terms if ws <= tws)

    used = Counter(a for r in rows for a in r["added"])
    removed = Counter(x for r in rows for x in r["replaced"])
    out = ["| Tag | Slot | EON 30 gün strict eşleşme (ziyaret) | eRank Etsy avg searches |", "|---|---|---|---|"]
    for tag, n in removed.most_common():
        out.append(f"| ~~{tag}~~ | {n} | {strict(tag)} | {erank.get(tag, '-')} |")
    for tag, n in used.most_common():
        out.append(f"| {tag} | {n} | {strict(tag)} | {erank.get(tag, '-')} |")
    return "\n".join(out)


def main():
    rows, skipped = build()
    errs = check(rows, skipped)
    if errs:
        print("\n".join(errs))
        raise SystemExit(f"{len(errs)} kapı hatası, çıktı yazılmadı")
    prof = Counter((r["color"], "/".join(r["karats"])) for r in rows)
    slots = sum(len(r["replaced"]) for r in rows)
    rep = [
        "# EON tag geçişi 2026-11-02 — rapor (üreteç çıktısı)",
        "",
        f"- Satır: {len(rows)} alyans listing, {slots} slot değişir; başlık ve diğer {13 * len(rows) - slots} tag aynen.",
        f"- Atlanan: {len(skipped)} listing (aşağıda sebebiyle).",
        "",
        "## Kanıt (kaldırılan ~~üstü çizili~~, eklenen düz)",
        "",
        evidence(rows),
        "",
        "## Listing profili (renk, satılan ayar) → satır sayısı",
        "",
        *[f"- {c} {k or '(ayar yok)'}: {n}" for (c, k), n in sorted(prof.items(), key=lambda kv: -kv[1])],
        "",
        "## Atlanan listing'ler",
        "",
        *[f"- {i} — {why}: {t}" for i, why, t in skipped],
        "",
    ]
    if "--check" in sys.argv:
        print("\n".join(rep[:4]))
        print("kapı temiz, --check: yazılmadı")
        return
    (DIR / "apply-matrix.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n")
    (DIR / "report.md").write_text("\n".join(rep))
    print("\n".join(rep[:4]))
    print(f"apply-matrix.json ({len(rows)} satır) ve report.md yazıldı")


if __name__ == "__main__":
    main()
