"""Market-based prices for S01..S06 (sterling silver chains). Run: python3 pricing.py > prices.csv

Target = what the buyer pays after the shop's permanent 30% sale, set from a market fit (2026-10-27):
  buyer price ~= 50 + 6.0 USD per gram (solid 925 Italian chains, Etsy/DTC mid-market; see PLAN.md "Market").
List price = target / 0.70, rounded up to end in 9 (whole dollars).
Floor check (no supplier quote yet): pessimistic cost 4.00 USD/g + 12 USD packaging/shipping + 0.45,
fees 9.5% + worst Offsite 15% (capped 100) at the SALE price; every row must stay positive.
"""
import math

SALE = 0.70
CHAINS = {  # width mm -> 18" grams (supplier catalog)
    "franco": {2.2: 12.9, 3.0: 21.7, 3.4: 28.3, 4.1: 41.1, 4.8: 56.0, 5.2: 65.3},
    "cuban":  {3.3: 7.6, 4.8: 14.8, 6.5: 25.1, 7.6: 32.6, 8.5: 41.6, 10.2: 52.8},
    "figaro": {3.4: 7.1, 4.6: 12.5, 6.6: 23.5, 7.2: 30.7, 8.3: 35.1, 10.3: 55.3},
}
LENGTHS = {"necklace": [18, 20, 22, 24, 26], "bracelet": [7, 8, 9]}
IDS = {("franco", "necklace"): "S01", ("franco", "bracelet"): "S02", ("cuban", "necklace"): "S03",
       ("cuban", "bracelet"): "S04", ("figaro", "necklace"): "S05", ("figaro", "bracelet"): "S06"}


def ceil9(x):
    return int(math.ceil((x + 1) / 10.0) * 10 - 1)


def main():
    print("listing,chain,piece,width_mm,length_in,grams_est,list_usd,sale_usd,net_worst_usd")
    for (chain, piece), lid in IDS.items():
        for w, g18 in CHAINS[chain].items():
            for L in LENGTHS[piece]:
                g = g18 * L / 18
                lst = ceil9((50 + 6.0 * g) / SALE)
                sale = round(lst * SALE, 2)
                net = sale * (1 - 0.095) - 0.45 - min(0.15 * sale, 100) - (4.0 * g + 12)
                assert net > 0, (lid, w, L, net)
                print(f"{lid},{chain},{piece},{w},{L},{g:.1f},{lst},{sale:.2f},{net:.0f}")


if __name__ == "__main__":
    main()
