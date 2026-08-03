#!/usr/bin/env python3
"""EON Two-Tone Diamond-Cut (profil 06) katalog ureticisi — 10K / 14K / 18K.

FIYAT VE ISCILIK: hammered listing'iyle AYNI KADEME (kullanici direktifi).
Hammered listing "10K Solid Gold Hammered Wedding Band, Milgrain Comfort Fit"
motorun MILGRAIN profilinde durur; v4 ASM sayfasi bu kalemi acikca
"Iscilik Milgrain USD = 40 — Hammered/milgrain istisnasi" diye tanimlar.
TTG de elmas kesim + iki-tonlu birlestirme tasidigi icin ayni kademededir:

    * iscilik  = $40/adet  (standart $30 DEGIL)  -> products.listing_cost_cents
    * fiyat    = v4 grid MILGRAIN profili, ETSY LISTE kolonu
    * gorunen  = liste x 0.75 (kalici %25 indirim; ayri mekanizma)

Fiyat panelde HESAPLANMAZ (0119 `externalPricing`) — motor disaridadir. Bu
uretici motoru yeniden uretmez, motorun kendi formulunu birebir cozer
(scripts/eon_pricing_engine.py, 858 hucre / 5148 kontrol sifir sapma) ve
yalnizca grid'de olmayan YARIM BEDENLERI ayni formulle doldurur.

Kullanim:
    python3 scripts/gen_catalog_ttg.py                 # her uc ayar ozeti
    python3 scripts/gen_catalog_ttg.py --karat 18K     # tek ayar

Varyant ekseni EV STANDARDI ve uc ayarda da AYNI: 11 genislik (2-12mm) x
25 beden (US 4-16 tam+yarim) = 275 (docs/eon/katalog-v3.md).
"""

import argparse
import sys

sys.path.insert(0, "scripts")
from eon_pricing_engine import PROFILE_MILGRAIN, PricingEngine  # noqa: E402

QUANTITY_PER_VARIANT = 20

# US 4-16, tam + yarim = 25 beden (ev standardi)
SIZES = [4 + 0.5 * i for i in range(25)]

# Ev standardi genislik ekseni — 39 canli listing ile birebir.
WIDTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

ENGINE = PricingEngine()

# TTG hammered/milgrain kademesinde -> iscilik $40.
TTG_PROFILE = PROFILE_MILGRAIN
LABOR_CENTS = int(ENGINE.labor[TTG_PROFILE] * 100)

KARAT_SPECS: dict[str, dict] = {
    "10K": {"family": "TTG-R-1006", "migration": "0123"},
    "14K": {"family": "TTG-R-1406", "migration": "0125"},
    "18K": {"family": "TTG-R-1806", "migration": "0124"},
}

METAL_PROPERTY = "Two Tone Yellow and White Gold"


def size_token(size: float) -> str:
    """Tam beden tam sayi, yarim beden ondalik (0101 SKU semasi)."""
    return str(int(size)) if size == int(size) else str(size)


def build(karat: str = "10K") -> list[dict]:
    spec = KARAT_SPECS[karat]
    grams = ENGINE.grams_with_halves(karat, TTG_PROFILE)
    assert sorted(grams) == WIDTHS, f"{karat}: grid genislik ekseni {sorted(grams)}"

    rows = []
    for width in WIDTHS:
        by_size = grams[width]
        assert sorted(by_size) == SIZES, (
            f"{karat} {width}mm: {len(by_size)} beden / {len(SIZES)} beklenen"
        )
        for size in SIZES:
            g = by_size[size]
            p = ENGINE.price(karat, width, g, TTG_PROFILE)
            rows.append({
                "sku": f"{spec['family']}-{width}MM-{size_token(size)}",
                "width": width,
                "size": size_token(size),
                "size_us": size,
                "grams": g,
                "price_cents": p["list_cents"],       # Etsy'ye girilen
                "sale_cents": p["sale_cents"],        # gorunen (%25 indirimli)
                "landed_cents": p["landed_cents"],    # motor maliyeti
                "floor_cents": p["floor_cents"],
                "offsite_floor_cents": p["offsite_floor_cents"],
                "on_grid": size == int(size),         # tam beden grid'de var
            })
    return rows


def verify(rows: list[dict], karat: str = "10K") -> None:
    expected = len(WIDTHS) * len(SIZES)
    assert len(rows) == expected, f"{karat}: {len(rows)} varyant, beklenen {expected}"
    skus = [r["sku"] for r in rows]
    assert len(set(skus)) == len(skus), f"{karat}: SKU tekilligi bozuk"

    for size in SIZES:
        by_width = sorted((r for r in rows if r["size_us"] == size),
                          key=lambda r: r["width"])
        prices = [r["price_cents"] for r in by_width]
        assert all(a <= b for a, b in zip(prices, prices[1:])), (
            f"{karat} beden {size}: genislikle fiyat artmiyor"
        )
    for width in WIDTHS:
        by_size = sorted((r for r in rows if r["width"] == width),
                         key=lambda r: r["size_us"])
        grams = [r["grams"] for r in by_size]
        assert all(a <= b for a, b in zip(grams, grams[1:])), (
            f"{karat} {width}mm: bedenle gram artmiyor"
        )

    for r in rows:
        # ETSY LISTE daima $5'in kati (CEILING(motor*4/15)*5).
        assert r["price_cents"] % 500 == 0, f"{r['sku']} liste $5 katina yuvarlanmamis"
        # Motorun KONTROL kolonu: gorunen sale zeminin altina dusmemeli.
        assert r["sale_cents"] >= r["floor_cents"], (
            f"{r['sku']} ZEMIN IHLALI: sale {r['sale_cents']} < floor {r['floor_cents']}"
        )
        # Gorunen fiyat maliyeti karsilamali.
        assert r["sale_cents"] > r["landed_cents"], (
            f"{r['sku']} gorunen fiyat landed'in altinda"
        )


def cross_check_grid(karat: str) -> str:
    """Tam bedenlerde uretici fiyati = grid'in ETSY LISTE kolonu."""
    grid = ENGINE.grid_grams(karat, TTG_PROFILE)
    bad = []
    n = 0
    for r in build(karat):
        if not r["on_grid"]:
            continue
        cell = ENGINE._grid[(karat, TTG_PROFILE, r["width"], r["size_us"])]
        n += 1
        if r["price_cents"] != int(cell["ETSY LISTE USD"]) * 100:
            bad.append((r["sku"], r["price_cents"], cell["ETSY LISTE USD"]))
        if abs(r["grams"] - cell["Gram 1.5mm"]) > 1e-9:
            bad.append((r["sku"], "gram", r["grams"], cell["Gram 1.5mm"]))
    assert not bad, f"{karat}: grid sapmasi {bad[:3]}"
    assert n == len(grid) * 13, f"{karat}: {n} tam-beden hucresi"
    return f"{n}/{n} tam beden v4 MILGRAIN grid'iyle BIREBIR"


def summarise(karat: str) -> None:
    spec = KARAT_SPECS[karat]
    rows = build(karat)
    verify(rows, karat)
    prices = [r["price_cents"] for r in rows]
    sales = [r["sale_cents"] for r in rows]
    grams = [r["grams"] for r in rows]
    halves = sum(1 for r in rows if not r["on_grid"])
    print(f"[{karat}] {spec['family']}  (migration {spec['migration']})")
    print(f"   varyant : {len(rows)} = {len(WIDTHS)} genislik x {len(SIZES)} beden"
          f"  ({len(rows)-halves} grid + {halves} yarim beden)")
    print(f"   gram    : {min(grams)} - {max(grams)} g")
    print(f"   ETSY LISTE : ${min(prices)/100:,.2f} - ${max(prices)/100:,.2f}"
          f"   capa ${min(prices)/100:,.2f}")
    print(f"   gorunen    : ${min(sales)/100:,.2f} - ${max(sales)/100:,.2f}  (liste x 0.75)")
    print(f"   grid caprazi: {cross_check_grid(karat)}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--karat", choices=sorted(KARAT_SPECS), help="tek ayar")
    args = ap.parse_args()

    print(f"Fiyat kademesi: {TTG_PROFILE.upper()} (hammered ile ayni) — "
          f"iscilik ${LABOR_CENTS/100:.0f}/adet\n")
    for k in ([args.karat] if args.karat else ["10K", "14K", "18K"]):
        summarise(k)
    print(f"\nEksen: {WIDTHS[0]}-{WIDTHS[-1]}mm ({len(WIDTHS)}) x US "
          f"{size_token(SIZES[0])}-{size_token(SIZES[-1])} tam+yarim "
          f"({len(SIZES)}) = {len(WIDTHS)*len(SIZES)}")
    print("Dogrulama: OK (sayim, SKU, monotonluk, $5, zemin, grid caprazi)")


if __name__ == "__main__":
    main()
