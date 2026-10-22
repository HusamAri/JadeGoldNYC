#!/usr/bin/env python3
"""Kısa başlık geçişi (2026-10-22): EON 185 + by Artifact Studio 210.

Kaynak: docs/<marka>/seo/2026-10-22-title-pass/titles*.tsv (elle yazıldı, playbook 03).
Çıktı: aynı klasörde apply-matrix.json (ops/seo-apply `?pass=titles-2026-10-22` okur).
  current_title/current_tags = 2026-10-21 matrisinin new_* hâli (canlı; panel aynası
  395/395 eşit doğrulandı), new_tags = current_tags (tag'e dokunulmaz), section_fix = null.

Kapı (biri düşerse çıktı YAZILMAZ):
  - <15 kelime, <=140 kr, kelime tekrarı yok, marka içinde tekil başlık
  - "Gold" geçiyorsa ayar var (FTC 16 CFR 23.4); başlıktaki ayar kümesi = panelin
    sattığı ayar kümesi (panel-karats.json; panelde ayar yoksa orijinal başlığın ayarı)
  - alıcı/hediye/indirim/öznel/sağlık sözcüğü yok; EON'da "diamond" yalnız "Diamond Cut"
  - EON: başlıktaki mm aralığı panelin genişlik min-max'ı ile aynı
Kullanım: python3 scripts/seo/title_pass_2026_10_22.py [--check]  (--check: yazmadan sına)
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EON_DIR = ROOT / "docs/eon/seo/2026-10-22-title-pass"
BAS_DIR = ROOT / "docs/artifact-studio/seo/2026-10-22-title-pass"
EON_PREV = ROOT / "docs/eon/seo/2026-10-21-etsy-keyword/data/optimization-matrix.json"
BAS_PREV = ROOT / "docs/artifact-studio/seo/2026-10-21-etsy-keyword/data/apply-matrix.json"
EON_WIDTHS = ROOT / "docs/eon/seo/2026-10-21-etsy-keyword/data/panel-variants.json"

BANNED = re.compile(
    r"\b(free|gifts?|him|her|his|hers|men|mens|men's|women|womens|unisex|perfect|beautiful|"
    r"stunning|sale|discount|hypoallergenic|anxiety|best|cheap|luxury)\b", re.I)
KARAT = re.compile(r"\b(10|14|18)K\b")
KARAT_CI = re.compile(r"\b(10|14|18)k\b", re.I)
STOP = {"and", "with", "or", "in", "of", "a", "to"}


def words(t):
    return t.replace(",", " ").split()


def karats(t, ci=False):
    return sorted(set((KARAT_CI if ci else KARAT).findall(t)))


def check(brand, rows, panel_k, widths=None):
    errs, seen = [], {}
    for r in rows:
        t, i = r["new_title"], r["id"]
        w = words(t)
        if len(w) >= 15: errs.append(f"{i} {len(w)} kelime")
        if len(t) > 140: errs.append(f"{i} {len(t)} kr")
        low = [x.lower() for x in w if x.lower() not in STOP]
        dup = {x for x in low if low.count(x) > 1}
        if dup: errs.append(f"{i} tekrar {sorted(dup)}")
        if BANNED.search(t): errs.append(f"{i} yasak sözcük: {BANNED.search(t).group(0)}")
        if brand == "eon" and re.search(r"diamond(?! cut)", t, re.I): errs.append(f"{i} diamond")
        g, k = re.search(r"\bgold\b", t, re.I), KARAT.search(t)
        if g and (not k or k.start() > g.start()): errs.append(f"{i} Gold'dan önce ayar yok")
        want = panel_k.get(i) or karats(r["orig_title"], ci=True)
        if karats(t) != sorted(want): errs.append(f"{i} ayar {karats(t)} != panel {sorted(want)}")
        if t in seen: errs.append(f"{i} başlık {seen[t]} ile aynı")
        seen[t] = i
        if widths is not None:
            ws = widths.get(i, {}).get("widths_mm") or []
            m = re.search(r"\b(\d+(?:\.\d)?)(?:-(\d+(?:\.\d)?))?mm\b", t)
            if m and ws:
                lo, hi = float(m.group(1)), float(m.group(2) or m.group(1))
                if (lo, hi) != (min(ws), max(ws)): errs.append(f"{i} mm {lo}-{hi} != panel {min(ws)}-{max(ws)}")
    return errs


def build(prev_rows, titles):
    out = []
    for p in prev_rows:
        out.append({
            "id": p["id"],
            "orig_title": p["current_title"],
            "current_title": p["new_title"],
            "current_tags": p["new_tags"],
            "new_title": titles[p["id"]],
            "new_tags": p["new_tags"],
            "section_fix": None,
        })
    return out


def main():
    pk = json.loads((ROOT / "docs/eon/seo/2026-10-22-title-pass/panel-karats.json").read_text())
    eon_prev = json.loads(EON_PREV.read_text())
    bas_prev = json.loads(BAS_PREV.read_text())

    eon_t = dict(l.rstrip("\n").split("\t") for l in (EON_DIR / "titles.tsv").open())
    by_suffix = {p["id"][-6:]: p["id"] for p in bas_prev}
    assert len(by_suffix) == len(bas_prev), "Artifact id son-6 hanesi tekil değil"
    bas_t = {by_suffix[s]: t for s, t in (l.rstrip("\n").split("\t") for l in (BAS_DIR / "titles.suffix.tsv").open())}
    assert set(eon_t) == {p["id"] for p in eon_prev}, "EON id kümesi uyuşmuyor"
    assert set(bas_t) == {p["id"] for p in bas_prev}, "Artifact id kümesi uyuşmuyor"

    eon_rows, bas_rows = build(eon_prev, eon_t), build(bas_prev, bas_t)
    widths = json.loads(EON_WIDTHS.read_text())["listings"]
    errs = check("eon", eon_rows, pk["EON"], widths) + check("bas", bas_rows, pk["by Artifact Studio Jewelry"])
    for name, rows in (("EON", eon_rows), ("Artifact", bas_rows)):
        n = [len(words(r["new_title"])) for r in rows]
        o = [len(words(r["current_title"])) for r in rows]
        print(f"{name}: {len(rows)} satır, kelime medyan {sorted(o)[len(o)//2]} -> {sorted(n)[len(n)//2]}, max {max(n)}")
    if errs:
        print(f"{len(errs)} HATA:\n" + "\n".join(errs))
        sys.exit(1)
    print("kapı temiz")
    if "--check" in sys.argv:
        return
    for d, rows in ((EON_DIR, eon_rows), (BAS_DIR, bas_rows)):
        clean = [{k: v for k, v in r.items() if k != "orig_title"} for r in rows]
        (d / "apply-matrix.json").write_text(json.dumps(clean, ensure_ascii=False, indent=1) + "\n")
    print("apply-matrix.json yazıldı (2 dosya)")


if __name__ == "__main__":
    main()
