#!/usr/bin/env python3
"""EON Two-Tone Diamond-Cut (profil 06) katalog ureticisi — 10K / 14K / 18K.

Saf uretici: yalniz gram tablosunu ve ev formulunu okur, varyant satirlarini
uretir. Ic assert'lerle varyant sayisi / SKU tekilligi / monotonluk / fiyat
yuvarlamasi dogrulanir (bkz. second-brain "geri-donusu zor katalog transform'u").

Kullanim:
    python3 scripts/gen_catalog_ttg.py                 # her uc ayar ozeti
    python3 scripts/gen_catalog_ttg.py --karat 18K     # tek ayar

Varyant ekseni UC AYARDA DA AYNI (kullanici direktifi): 5 genislik (6-10mm)
x 25 beden (US 4-16 tam+yarim) = 125. Degisen tek sey gram tablosu (ayar
yogunlugu) ve hedef $/g.

Gram tablolari 0101_eon_catalog_v3.sql'den BIREBIR alinmistir (1.5mm kalinlik,
US 4-16 tam+yarim). Iki-tonlu basamakli profil ayni genislik/kalinlikta dome
ile kutlece karsilastirilabilir: kenar basamaklari biraz metal alir, duz
merkez biraz ekler. Bu varsayim migration yorumlarinda da yazilidir.
"""

import argparse
import math

SHIPPING_ALLOWANCE_CENTS = 1000  # ucretsiz kargo payi fiyata gomulur
ROUND_TO_CENTS = 500  # $5 yukari yuvarla
QUANTITY_PER_VARIANT = 20

# US 4-16, tam + yarim = 25 beden (ev standardi)
SIZES = [4 + 0.5 * i for i in range(25)]

# Desen (elmas kesim kafes + cift altin ray) dar bantta okunmaz; 2026 pazar
# taramasi en cok satan erkek bandini 6-8mm gosteriyor -> 6-10mm.
WIDTHS = [6, 7, 8, 9, 10]

# 0101 gram tablolari — yalniz bu ailenin tasidigi genislikler.
GRAMS_BY_KARAT: dict[str, dict[int, list[float]]] = {
    "10K": {
        6: [4.11, 4.205, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2,
            5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.195, 6.29, 6.39,
            6.49],
        7: [4.79, 4.905, 5.02, 5.135, 5.25, 5.37, 5.49, 5.605, 5.72, 5.835,
            5.95, 6.065, 6.18, 6.3, 6.42, 6.535, 6.65, 6.765, 6.88, 6.995,
            7.11, 7.225, 7.34, 7.46, 7.58],
        8: [5.47, 5.605, 5.74, 5.87, 6.0, 6.135, 6.27, 6.405, 6.54, 6.67, 6.8,
            6.935, 7.07, 7.2, 7.33, 7.465, 7.6, 7.73, 7.86, 7.995, 8.13, 8.26,
            8.39, 8.525, 8.66],
        9: [6.16, 6.31, 6.46, 6.61, 6.76, 6.905, 7.05, 7.2, 7.35, 7.5, 7.65,
            7.8, 7.95, 8.1, 8.25, 8.4, 8.55, 8.7, 8.85, 8.995, 9.14, 9.29,
            9.44, 9.59, 9.74],
        10: [6.84, 7.005, 7.17, 7.34, 7.51, 7.675, 7.84, 8.005, 8.17, 8.335,
             8.5, 8.665, 8.83, 8.995, 9.16, 9.33, 9.5, 9.665, 9.83, 9.995,
             10.16, 10.325, 10.49, 10.655, 10.82],
    },
    "14K": {
        6: [4.67, 4.78, 4.89, 5.005, 5.12, 5.23, 5.34, 5.455, 5.57, 5.685,
            5.8, 5.91, 6.02, 6.135, 6.25, 6.36, 6.47, 6.585, 6.7, 6.815,
            6.93, 7.04, 7.15, 7.265, 7.38],
        7: [5.44, 5.575, 5.71, 5.84, 5.97, 6.1, 6.23, 6.365, 6.5, 6.63, 6.76,
            6.895, 7.03, 7.16, 7.29, 7.42, 7.55, 7.685, 7.82, 7.95, 8.08,
            8.215, 8.35, 8.48, 8.61],
        8: [6.22, 6.37, 6.52, 6.67, 6.82, 6.975, 7.13, 7.28, 7.43, 7.58, 7.73,
            7.88, 8.03, 8.18, 8.33, 8.48, 8.63, 8.78, 8.93, 9.085, 9.24, 9.39,
            9.54, 9.69, 9.84],
        9: [7.0, 7.17, 7.34, 7.51, 7.68, 7.85, 8.02, 8.19, 8.36, 8.525, 8.69,
            8.86, 9.03, 9.2, 9.37, 9.54, 9.71, 9.88, 10.05, 10.22, 10.39,
            10.56, 10.73, 10.9, 11.07],
        10: [7.78, 7.965, 8.15, 8.34, 8.53, 8.72, 8.91, 9.095, 9.28, 9.47,
             9.66, 9.85, 10.04, 10.225, 10.41, 10.6, 10.79, 10.98, 11.17,
             11.36, 11.55, 11.735, 11.92, 12.11, 12.3],
    },
    "18K": {
        6: [5.4, 5.515, 5.63, 5.745, 5.86, 5.97, 6.08, 6.195, 6.31, 6.42,
            6.53, 6.645, 6.76, 6.87, 6.98, 7.095, 7.21, 7.325, 7.44, 7.505,
            7.57, 7.75, 7.93, 8.045, 8.16],
        7: [5.88, 6.01, 6.14, 6.275, 6.41, 6.545, 6.68, 6.815, 6.95, 7.08,
            7.21, 7.345, 7.48, 7.615, 7.75, 7.885, 8.02, 8.15, 8.28, 8.34,
            8.4, 8.52, 8.64, 8.88, 9.12],
        8: [6.48, 6.625, 6.77, 6.92, 7.07, 7.215, 7.36, 7.51, 7.66, 7.8, 7.94,
            8.09, 8.24, 8.385, 8.53, 8.68, 8.83, 8.975, 9.12, 9.24, 9.36,
            9.48, 9.6, 9.78, 9.96],
        9: [7.98, 8.17, 8.36, 8.555, 8.75, 8.945, 9.14, 9.33, 9.52, 9.715,
            9.91, 10.105, 10.3, 10.495, 10.69, 10.88, 11.07, 11.265, 11.46,
            11.655, 11.85, 12.04, 12.23, 12.425, 12.62],
        10: [8.86, 9.075, 9.29, 9.505, 9.72, 9.935, 10.15, 10.365, 10.58,
             10.795, 11.01, 11.225, 11.44, 11.51, 11.58, 11.94, 12.3, 12.515,
             12.73, 12.945, 13.16, 13.375, 13.59, 13.805, 14.02],
    },
}

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
    assert sorted(grams_table) == WIDTHS, f"{karat}: genislik ekseni sapmis"

    rows = []
    for width in WIDTHS:
        grams_by_size = grams_table[width]
        assert len(grams_by_size) == len(SIZES), (
            f"{karat} {width}mm: {len(grams_by_size)} gram / {len(SIZES)} beden"
        )
        # Gram tablosu bedene gore monoton artmali (interpolasyon saglamasi).
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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--karat", choices=sorted(KARAT_SPECS), help="tek ayar")
    args = ap.parse_args()

    karats = [args.karat] if args.karat else ["10K", "14K", "18K"]
    for k in karats:
        summarise(k)
    print(f"\nVaryant ekseni uc ayarda da AYNI: "
          f"{WIDTHS[0]}-{WIDTHS[-1]}mm x US {size_token(SIZES[0])}-"
          f"{size_token(SIZES[-1])} tam+yarim = {len(WIDTHS)*len(SIZES)}")
    print("Dogrulama: OK (sayim, SKU tekilligi, monotonluk, yuvarlama)")


if __name__ == "__main__":
    main()
