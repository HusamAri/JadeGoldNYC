#!/usr/bin/env python3
"""EON Two-Tone Diamond-Cut (profil 06) katalog ureticisi — TTG-R-1006 (10K).

Saf uretici: yalniz gram tablosunu ve ev formulunu okur, SQL uretir. Ic
assert'lerle varyant sayisi / SKU tekilligi / fiyat sinirlarini dogrular
(bkz. second-brain "geri-donusu zor katalog transform'u" dersi).

Kullanim:
    python3 scripts/gen_catalog_ttg.py           # ozet + dogrulama
    python3 scripts/gen_catalog_ttg.py --sql     # varyant INSERT govdesi

Gram tablosu 0101_eon_catalog_v3.sql'in 10K satirlarindan BIREBIR alinmistir
(1.5mm kalinlik, US 4-16 tam+yarim). Iki-tonlu basamakli profil ayni
genislik/kalinlikta kutlece dome ile karsilastirilabilir: kenar basamaklari
biraz metal alir, duz merkez biraz ekler. Bu varsayim migration'da da yazilidir.
"""

import argparse
import math

FAMILY = "TTG-R-1006"
KARAT = "10K"
METAL = "Two Tone Yellow and White Gold"
PPG_CENTS = 10730  # ev standardi 10K hedef $/g (0101 ile ayni)
SHIPPING_ALLOWANCE_CENTS = 1000  # ucretsiz kargo payi fiyata gomulur
ROUND_TO_CENTS = 500  # $5 yukari yuvarla

# US 4-16, tam + yarim = 25 beden (ev standardi)
SIZES = [4 + 0.5 * i for i in range(25)]

# 0101 10K gram tablosu — yalniz bu ailenin tasidigi genislikler.
# Desen (elmas kesim kafes + cift altin ray) dar bantta okunmaz; arastirma
# en cok satan erkek bandinin 6-8mm oldugunu gosteriyor -> 6-10mm.
GRAMS = {
    6: [4.11, 4.205, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2, 5.3,
        5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.195, 6.29, 6.39, 6.49],
    7: [4.79, 4.905, 5.02, 5.135, 5.25, 5.37, 5.49, 5.605, 5.72, 5.835, 5.95,
        6.065, 6.18, 6.3, 6.42, 6.535, 6.65, 6.765, 6.88, 6.995, 7.11, 7.225,
        7.34, 7.46, 7.58],
    8: [5.47, 5.605, 5.74, 5.87, 6.0, 6.135, 6.27, 6.405, 6.54, 6.67, 6.8,
        6.935, 7.07, 7.2, 7.33, 7.465, 7.6, 7.73, 7.86, 7.995, 8.13, 8.26,
        8.39, 8.525, 8.66],
    9: [6.16, 6.31, 6.46, 6.61, 6.76, 6.905, 7.05, 7.2, 7.35, 7.5, 7.65, 7.8,
        7.95, 8.1, 8.25, 8.4, 8.55, 8.7, 8.85, 8.995, 9.14, 9.29, 9.44, 9.59,
        9.74],
    10: [6.84, 7.005, 7.17, 7.34, 7.51, 7.675, 7.84, 8.005, 8.17, 8.335, 8.5,
         8.665, 8.83, 8.995, 9.16, 9.33, 9.5, 9.665, 9.83, 9.995, 10.16,
         10.325, 10.49, 10.655, 10.82],
}

QUANTITY_PER_VARIANT = 20


def size_token(size: float) -> str:
    """Tam beden tam sayi, yarim beden ondalik (0101 SKU semasi)."""
    return str(int(size)) if size == int(size) else str(size)


def price_cents(grams: float) -> int:
    """Ev formulu: ceil(gram * ppg / 500) * 500 + 1000."""
    raw = grams * PPG_CENTS
    return int(math.ceil(raw / ROUND_TO_CENTS) * ROUND_TO_CENTS) + SHIPPING_ALLOWANCE_CENTS


def build() -> list[dict]:
    rows = []
    for width, grams_by_size in sorted(GRAMS.items()):
        assert len(grams_by_size) == len(SIZES), (
            f"{width}mm: {len(grams_by_size)} gram / {len(SIZES)} beden — tablo eksik"
        )
        # Gram tablosu bedene gore monoton artmali (interpolasyon saglamasi).
        assert all(a <= b for a, b in zip(grams_by_size, grams_by_size[1:])), (
            f"{width}mm gram tablosu monoton degil"
        )
        for size, grams in zip(SIZES, grams_by_size):
            rows.append({
                "sku": f"{FAMILY}-{width}MM-{size_token(size)}",
                "width": width,
                "size": size_token(size),
                "grams": grams,
                "price_cents": price_cents(grams),
            })
    return rows


def verify(rows: list[dict]) -> None:
    expected = len(GRAMS) * len(SIZES)
    assert len(rows) == expected, f"{len(rows)} varyant, beklenen {expected}"
    skus = [r["sku"] for r in rows]
    assert len(set(skus)) == len(skus), "SKU tekilligi bozuk"
    # Genislik arttikca ayni bedende fiyat artmali (gram-fiyat monotonlugu).
    for size in (size_token(s) for s in SIZES):
        by_width = [r for r in rows if r["size"] == size]
        by_width.sort(key=lambda r: r["width"])
        prices = [r["price_cents"] for r in by_width]
        assert all(a <= b for a, b in zip(prices, prices[1:])), (
            f"beden {size}: genislikle fiyat artmiyor"
        )
    # Her fiyat $5'in kati + $10 kargo payi tasimali.
    for r in rows:
        assert (r["price_cents"] - SHIPPING_ALLOWANCE_CENTS) % ROUND_TO_CENTS == 0, (
            f"{r['sku']} fiyati $5 katina yuvarlanmamis"
        )
        # Ham metal tabani (melt) ustunde mi? 10K icin ~%37 saf altin.
        assert r["price_cents"] > r["grams"] * PPG_CENTS * 0.5, (
            f"{r['sku']} sacma dusuk fiyat"
        )


def sql(rows: list[dict]) -> str:
    values = ",\n".join(
        "  ($tt${sku}$tt$, {width}, $tt${size}$tt$, {grams}, {price})".format(
            sku=r["sku"], width=r["width"], size=r["size"],
            grams=r["grams"], price=r["price_cents"],
        )
        for r in rows
    )
    return values


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sql", action="store_true", help="varyant VALUES govdesini bas")
    args = ap.parse_args()

    rows = build()
    verify(rows)

    if args.sql:
        print(sql(rows))
        return

    prices = [r["price_cents"] for r in rows]
    grams = [r["grams"] for r in rows]
    print(f"Aile      : {FAMILY} ({KARAT}, {METAL})")
    print(f"Varyant   : {len(rows)} = {len(GRAMS)} genislik x {len(SIZES)} beden")
    print(f"Genislik  : {sorted(GRAMS)} mm")
    print(f"Beden     : US {size_token(SIZES[0])}-{size_token(SIZES[-1])} tam+yarim")
    print(f"Gram      : {min(grams)} - {max(grams)} g")
    print(f"Fiyat     : ${min(prices)/100:.2f} - ${max(prices)/100:.2f}")
    print(f"Capa fiyat: ${min(prices)/100:.2f} (products.price_cents)")
    print(f"Adet      : {QUANTITY_PER_VARIANT}/varyant = {len(rows)*QUANTITY_PER_VARIANT} toplam")
    print("Dogrulama : OK (sayim, SKU tekilligi, monotonluk, yuvarlama)")


if __name__ == "__main__":
    main()
