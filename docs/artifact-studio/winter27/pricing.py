"""Winter 26/27 set: five maker-cost estimates and prices (owner rule: price = 2 x maker cost).

Run: python3 docs/artifact-studio/winter27/pricing.py
All grams are 14K geometry estimates (UNCALIBRATED_ASSUMPTION until the maker quotes); density
13.5 g/cm3 from the maker's own band table (second-brain 2026-09-16). Enamel, chain and assembly
follow maker_cost.py (Christmas 2026 quote).
"""
import math, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parents[1]))
import maker_cost as mk

D = 0.0135  # g per mm3, 14K

def band_g(width, thick, length):          # flat strip
    return width * thick * length * D

def sphere_g(d):
    return (math.pi / 6) * d ** 3 * D

PIECES = {
  # 1 Thaw Cuff: open cuff, 4 mm wide, 1.3 mm average (molten surface varies 1.0-1.6), developed
  #   length by size: 6.5 in = 148 mm, 7 in = 158, 7.5 in = 168 (minus 25 mm gap).
  "W01 Thaw Cuff":       {"g14": {L: band_g(4, 1.3, mm) for L, mm in [("6.5", 123), ("7", 133), ("7.5", 143)]},
                          "extra": 0, "note": "two-tone: white gold tip is cast separately and soldered, +assembly"},
  # 2 Pinecone Signet: oval table 13 x 11 x 2.0 mm + 3 mm shank (list) at 1.8 mm; signet rule = top + shank.
  "W02 Pinecone Signet": {"g14": {str(s): (math.pi / 4 * 13 * 11 * 2.0 * D) + mk.list_g14(3, s, 1.8) * 0.75
                                   for s in [3, 7, 10, 16]},
                          "extra": mk.ENAMEL_PIECE, "note": "oxblood enamel in the scale recesses"},
  # 3 Juniper Drop Earrings: per earring 3 spheres 4.5 mm + hook 0.30 g; pair.
  "W03 Juniper Drops":   {"g14": {"pair": 2 * (3 * sphere_g(4.5) + 0.30)},
                          "extra": mk.ENAMEL_PIECE, "note": "one dusty blue enamel berry per earring"},
  # 4 Ember Lariat: molten teardrop 12 x 8 x 4 mm (ellipsoid ~ 0.52 fill) + slide ring 0.25 g;
  #   chain 18 in quote + 4 in drop at the same rate; enamel ember eye.
  "W04 Ember Lariat":    {"g14": {"drop": 0.52 * 12 * 8 * 4 * D + 0.25},
                          "extra": mk.ENAMEL_PIECE + mk.CHAIN_NECKLACE_18IN * 22 / 18 + mk.ASSEMBLY,
                          "note": "chain 18 in quote scaled to 22 in developed length (Y + drop)"},
  # 5 Pine Needle Brooch: two bundles of 5 needles 45 mm x 1.2 mm wire + hub + pin 0.5 g.
  "W05 Pine Needle Brooch": {"g14": {"one": 10 * (math.pi / 4 * 1.2 ** 2 * 45 * D) + 0.35 + 0.5},
                          "extra": mk.ASSEMBLY, "note": "pin stem and catch in the same gold"},
}

if __name__ == "__main__":
    for name, p in PIECES.items():
        print(f"\n{name}  ({p['note']})")
        for key, g in p["g14"].items():
            row = []
            for k in ["10K", "14K", "18K"]:
                cost = mk.gold_cost(g, k) + p["extra"] + (mk.ASSEMBLY if name.startswith("W01") else 0)
                row.append(f"{k} ${mk.price_cents(cost)/100:,.0f}")
            print(f"  {key:>5}: {g:5.2f} g14  ->  " + "  ".join(row))
