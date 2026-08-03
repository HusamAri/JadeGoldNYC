#!/usr/bin/env python3
"""EON Two-Tone Diamond-Cut (profil 06) katalog ureticisi — 10K / 14K / 18K.

Saf uretici: gram tablosunu 0101_eon_catalog_v3.sql'den PARSE eder (elle
transkripsiyon YOK — 39 canli listing'le birebir ayni kaynak), ev formuluyle
fiyatlar, varyant satirlarini uretir. Ic assert'lerle sayim / SKU tekilligi /
monotonluk / yuvarlama dogrulanir.

Kullanim:
    python3 scripts/gen_catalog_ttg.py                 # her uc ayar ozeti
    python3 scripts/gen_catalog_ttg.py --karat 18K     # tek ayar

Varyant ekseni EV STANDARDI ve uc ayarda da AYNI (kullanici direktifi):
11 genislik (2-12mm) x 25 beden (US 4-16 tam+yarim) = 275 — bkz.
docs/eon/katalog-v3.md ve docs/eon/eon-v3-catalog.json (39 listing x 275).

Gram yalnizca (karat, genislik, beden)'e baglidir — aile/profil bagimsizdir
(0101 `_v3g` tablosu da (karat,width) ile anahtarlanir). Iki-tonlu basamakli
profil ayni genislik/kalinlikta dome ile kutlece karsilastirilabilir: kenar
basamaklari biraz metal alir, duz merkez biraz ekler.
"""

import argparse
import ast
import math
import pathlib
import re

SHIPPING_ALLOWANCE_CENTS = 1000  # ucretsiz kargo payi fiyata gomulur
ROUND_TO_CENTS = 500  # $5 yukari yuvarla
QUANTITY_PER_VARIANT = 20

# US 4-16, tam + yarim = 25 beden (ev standardi)
SIZES = [4 + 0.5 * i for i in range(25)]

# Ev standardi genislik ekseni — 39 canli listing ile birebir.
WIDTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

CATALOG_V3_SQL = (
    pathlib.Path(__file__).resolve().parent.parent
    / "supabase" / "migrations" / "0101_eon_catalog_v3.sql"
)

# `('10K',2,'{1.37,1.4,...}'::numeric[]),`
_GRAM_ROW = re.compile(
    r"\('(?P<karat>\d+K)',(?P<width>\d+),'\{(?P<grams>[0-9.,]+)\}'::numeric\[\]\)"
)


def load_gram_tables() -> dict[str, dict[int, list[float]]]:
    """0101'in `_v3g` staging tablosunu okur — tek kaynak, elle kopyalama yok."""
    sql = CATALOG_V3_SQL.read_text(encoding="utf-8")
    tables: dict[str, dict[int, list[float]]] = {}
    for m in _GRAM_ROW.finditer(sql):
        grams = [float(x) for x in m.group("grams").split(",")]
        tables.setdefault(m.group("karat"), {})[int(m.group("width"))] = grams
    assert tables, f"{CATALOG_V3_SQL.name}: gram tablosu bulunamadi"
    for karat, by_width in tables.items():
        assert sorted(by_width) == WIDTHS, (
            f"{karat}: 0101 genislik ekseni {sorted(by_width)} != {WIDTHS}"
        )
    return tables


GRAMS_BY_KARAT = load_gram_tables()

# Aile kodu + hedef $/g (cent). ppg 0101 ile AYNI — elmas kesim ekstra
# iscilik tasir; premium istenirse yalniz bu tablo degisir.
KARAT_SPECS: dict[str, dict] = {
    "10K": {"family": "TTG-R-1006", "ppg_cents": 10730, "migration": "0110"},
    "14K": {"family": "TTG-R-1406", "ppg_cents": 15820, "migration": "0112"},
    "18K": {"family": "TTG-R-1806", "ppg_cents": 19320, "migration": "0111"},
}

METAL_PROPERTY = "Two Tone Yellow and White Gold"


def size_token(size: float) -> str:
    """Tam beden tam sayi, yarim beden ondalik (0101 SKU semasi)."""
    return str(int(size)) if size == int(size) else str(size)


def price_cents(grams: float, ppg_cents: int) -> int:
    """Ev formulu: ceil(gram * ppg / 500) * 500 + 1000."""
    raw = grams * ppg_cents
    return int(math.ceil(raw / ROUND_TO_CENTS) * ROUND_TO_CENTS) + SHIPPING_ALLOWANCE_CENTS


def build(karat: str = "10K") -> list[dict]:
    spec = KARAT_SPECS[karat]
    grams_table = GRAMS_BY_KARAT[karat]

    rows = []
    for width in WIDTHS:
        grams_by_size = grams_table[width]
        assert len(grams_by_size) == len(SIZES), (
            f"{karat} {width}mm: {len(grams_by_size)} gram / {len(SIZES)} beden"
        )
        assert all(a <= b for a, b in zip(grams_by_size, grams_by_size[1:])), (
            f"{karat} {width}mm gram tablosu monoton degil"
        )
        for size, grams in zip(SIZES, grams_by_size):
            rows.append({
                "sku": f"{spec['family']}-{width}MM-{size_token(size)}",
                "width": width,
                "size": size_token(size),
                "grams": grams,
                "price_cents": price_cents(grams, spec["ppg_cents"]),
            })
    return rows


def verify(rows: list[dict], karat: str = "10K") -> None:
    expected = len(WIDTHS) * len(SIZES)
    assert len(rows) == expected, f"{karat}: {len(rows)} varyant, beklenen {expected}"
    skus = [r["sku"] for r in rows]
    assert len(set(skus)) == len(skus), f"{karat}: SKU tekilligi bozuk"
    # Genislik arttikca ayni bedende fiyat artmali.
    for size in (size_token(s) for s in SIZES):
        by_width = sorted((r for r in rows if r["size"] == size),
                          key=lambda r: r["width"])
        prices = [r["price_cents"] for r in by_width]
        assert all(a <= b for a, b in zip(prices, prices[1:])), (
            f"{karat} beden {size}: genislikle fiyat artmiyor"
        )
    for r in rows:
        assert (r["price_cents"] - SHIPPING_ALLOWANCE_CENTS) % ROUND_TO_CENTS == 0, (
            f"{r['sku']} fiyati $5 katina yuvarlanmamis"
        )
        assert r["price_cents"] > r["grams"] * KARAT_SPECS[karat]["ppg_cents"] * 0.5, (
            f"{r['sku']} sacma dusuk fiyat"
        )


def cross_check_house(karat: str) -> str:
    """Gramlari 39 canli listing'in kanonik JSON'uyla karsilastirir."""
    path = CATALOG_V3_SQL.parent.parent.parent / "docs" / "eon" / "eon-v3-catalog.json"
    if not path.exists():
        return "atlandi (eon-v3-catalog.json yok)"
    import json
    house = json.loads(path.read_text(encoding="utf-8"))["listings"]
    ref = next((l for l in house if l["karat"] == karat), None)
    if ref is None:
        return f"atlandi ({karat} referansi yok)"
    ref_g = {
        (int(v["properties"]["Width"].replace("mm", "")),
         v["properties"]["Ring Size"]): v["weight_grams"]
        for v in ref["variants"]
    }
    mine = {(r["width"], r["size"]): r["grams"] for r in build(karat)}
    assert set(ref_g) == set(mine), f"{karat}: eksen ev listing'iyle uyusmuyor"
    bad = [k for k in mine if abs(mine[k] - ref_g[k]) > 1e-9]
    assert not bad, f"{karat}: {len(bad)} gram ev tablosundan sapiyor (ilk: {bad[:3]})"
    return f"{len(mine)}/{len(ref_g)} gram ev listing'i ({ref['family']}) ile BIREBIR"


def summarise(karat: str) -> None:
    spec = KARAT_SPECS[karat]
    rows = build(karat)
    verify(rows, karat)
    prices = [r["price_cents"] for r in rows]
    grams = [r["grams"] for r in rows]
    print(f"[{karat}] {spec['family']}  (migration {spec['migration']})")
    print(f"   varyant : {len(rows)} = {len(WIDTHS)} genislik x {len(SIZES)} beden")
    print(f"   gram    : {min(grams)} - {max(grams)} g   (hedef {spec['ppg_cents']} c/g)")
    print(f"   fiyat   : ${min(prices)/100:.2f} - ${max(prices)/100:.2f}"
          f"   capa ${min(prices)/100:.2f}")
    print(f"   ev capr.: {cross_check_house(karat)}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--karat", choices=sorted(KARAT_SPECS), help="tek ayar")
    args = ap.parse_args()

    karats = [args.karat] if args.karat else ["10K", "14K", "18K"]
    for k in karats:
        summarise(k)
    print(f"\nEv standardi eksen (uc ayarda da AYNI): "
          f"{WIDTHS[0]}-{WIDTHS[-1]}mm ({len(WIDTHS)} deger) x US "
          f"{size_token(SIZES[0])}-{size_token(SIZES[-1])} tam+yarim "
          f"({len(SIZES)}) = {len(WIDTHS)*len(SIZES)}")
    print("Dogrulama: OK (sayim, SKU tekilligi, monotonluk, yuvarlama, ev caprazi)")


if __name__ == "__main__":
    main()
