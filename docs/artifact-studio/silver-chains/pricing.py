"""Cost-plus prices for S01..S06 (sterling silver chains). Run: python3 pricing.py > prices.csv

Owner 2026-11-12: "5 usd is each gram's cost in silvers. Assume ads cost and Etsy fees and set highly
competitive prices" (first sale, low profit). The market fit of 2026-10-27 (buyer 50 + 6 USD/g, cost guessed
at 4 USD/g) is superseded; see PLAN.md "Repriced on cost".

  list = ceil_dollar((COST_G x grams + FIXED + 0.45) / ((1 - ETSY_FEE) x (1 - DEEPEST_SALE)))

  - COST_G 5.00 USD per gram (owner). Sterling melt today is 1.49 USD/g (spot 50.09 USD/ozt, gold-api.com
    2026-11-12), so the supplier price is 3.4 x melt.
  - FIXED 8.50 = shipping label 5.80 (measured: this shop's label 5.70, median of EON and Jade labels 5.80,
    etsy_ledger_entries) + 2.70 box, pouch and card (assumption). Shipping is free to the buyer.
  - ETSY_FEE 9.5% (6.5 transaction + 3 payment) + 0.45 per order (0.25 payment + 0.20 listing renewal).
  - DEEPEST_SALE 25%: the list price breaks even at the deepest planned sale (Cyber Specials, 23 Nov to 1 Dec).
    At the shop's current 15% sale the same list leaves 1 - 0.75/0.85 = 10.65% of the buyer price for Etsy Ads
    and profit. Offers do not stack on Etsy; a sale or coupon deeper than 25% on these listings sells below cost.
  - Offsite Ads is NOT in the floor (15% of the order, capped at 100 USD). The shop's only order so far
    (2026-10-18) was charged it, so it is on; the worst case is reported per row (net_offsite_15).
Grams = catalog 18 in weight x length / 18 (exact). Bracelet grams are scaled from the 18 in weight, not weighed.
"""
import math
from decimal import Decimal, ROUND_HALF_UP

COST_G = Decimal("5.00")          # owner 2026-11-12
FIXED = Decimal("8.50")           # label 5.80 (measured) + packaging 2.70 (assumption)
ETSY_FEE = Decimal("0.095")
ETSY_FIXED = Decimal("0.45")
DEEPEST_SALE = Decimal("0.25")    # Cyber Specials; the floor
SALE_NOW = Decimal("0.15")        # shop sale live on 2026-11-12, ends 23 Nov
PREV_SALE = Decimal("0.75")       # 0173: list = ceil9((50 + 6 g) / 0.75)
OWNER_CUT = Decimal("0.65")       # owner's own 35% cut on Etsy between 8 and 11 Nov (live list = 0173 list x 0.65)
CHAINS = {  # width mm -> 18" grams (supplier catalog)
    "franco": {"2.2": "12.9", "3.0": "21.7", "3.4": "28.3", "4.1": "41.1", "4.8": "56.0", "5.2": "65.3"},
    "cuban":  {"3.3": "7.6", "4.8": "14.8", "6.5": "25.1", "7.6": "32.6", "8.5": "41.6", "10.2": "52.8"},
    "figaro": {"3.4": "7.1", "4.6": "12.5", "6.6": "23.5", "7.2": "30.7", "8.3": "35.1", "10.3": "55.3"},
}
LENGTHS = {"necklace": [18, 20, 22, 24, 26], "bracelet": [7, 8, 9]}
IDS = {("franco", "necklace"): "S01", ("franco", "bracelet"): "S02", ("cuban", "necklace"): "S03",
       ("cuban", "bracelet"): "S04", ("figaro", "necklace"): "S05", ("figaro", "bracelet"): "S06"}
DENOM = (1 - ETSY_FEE) * (1 - DEEPEST_SALE)   # 0.67875


def grams(g18, length):
    return Decimal(g18) * length / 18


def list_usd(g):
    """Whole dollars, rounded up; same as the Postgres expression ceil((5.00 * g + 8.95) / 0.67875)."""
    return int(math.ceil((COST_G * g + FIXED + ETSY_FIXED) / DENOM))


def prev_list_usd(g):
    """0173 list price: ceil9((50 + 6 g) / 0.75)."""
    return int(math.ceil(((50 + 6 * g) / PREV_SALE + 1) / 10) * 10 - 1)


def net(buyer, g, offsite=False):
    fee = buyer * ETSY_FEE + ETSY_FIXED + (min(buyer * Decimal("0.15"), Decimal(100)) if offsite else 0)
    return buyer - fee - COST_G * g - FIXED


def rows():
    for (chain, piece), lid in IDS.items():
        for w, g18 in CHAINS[chain].items():
            for L in LENGTHS[piece]:
                g = grams(g18, L)
                lst = list_usd(g)
                b15 = (lst * (1 - SALE_NOW)).quantize(Decimal("0.01"), ROUND_HALF_UP)
                b25 = (lst * (1 - DEEPEST_SALE)).quantize(Decimal("0.01"), ROUND_HALF_UP)
                prev = prev_list_usd(g)
                live = (prev * OWNER_CUT * (1 - SALE_NOW)).quantize(Decimal("0.01"), ROUND_HALF_UP)
                yield dict(lid=lid, chain=chain, piece=piece, w=w, L=L, g=g, lst=lst, b15=b15, b25=b25,
                           n15=net(b15, g), n25=net(b25, g), noff=net(b15, g, offsite=True), prev=prev, live=live)


def main():
    print("listing,chain,piece,width_mm,length_in,grams_est,list_usd,buyer_15_usd,buyer_25_usd,net_15_usd,"
          "net_25_usd,net_offsite_15_usd,usd_per_g_15,prev_list_usd,live_buyer_before_usd,change_pct")
    for r in rows():
        assert r["n25"] >= 0, (r["lid"], r["w"], r["L"], r["n25"])          # never below cost at the deepest sale
        assert r["n15"] / r["b15"] >= Decimal("0.10"), (r["lid"], r["w"], r["L"])   # ads + profit cushion today
        g1 = r["g"].quantize(Decimal("0.1"), ROUND_HALF_UP)                 # exact half-up, same as Postgres round()
        chg = (r["b15"] / r["live"] - 1) * 100
        print(f"{r['lid']},{r['chain']},{r['piece']},{float(r['w']):g},{r['L']},{g1},{r['lst']},{r['b15']},{r['b25']},"
              f"{r['n15']:.2f},{r['n25']:.2f},{r['noff']:.2f},{r['b15'] / r['g']:.2f},{r['prev']},{r['live']},{chg:+.0f}")


if __name__ == "__main__":
    main()
