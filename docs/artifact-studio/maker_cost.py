"""by Artifact Studio Jewelry maker cost model (owner decision 2026-10-07: price = 2 x maker cost).

Source of truth for what the maker charges, shared by the Christmas 2026 and For Him 2026 catalogs.

Maker terms (WhatsApp, 2026-10-07, Christmas pieces):
  - Gold is priced from the maker's band list: 14K = 100.00 USD per gram, labor included
    (docs/ophir/uretici-gram-fiyat-tablosu.xlsx; 150/150 cells = grams x 100).
  - Motif rings: "price it as a 3 mm band from the list" (poinsettia, bell, snowflake rings).
  - Full enamel band (candy cane ring): 4 mm band + 100 USD enamel.
  - Pendant: grams + 50 USD enamel (candy cane pendant = 1 g).
  - Station bracelet: 3 g + 50 enamel + 100 chain + 50 assembly (poinsettia bracelet).
  - 25 USD model fee once per design on the first piece: a one-off, NOT in the unit price.
Chain for a pendant was not quoted; this maker quotes chain for the MIDDLE length of the range
(second-brain 2026-09-15) and quoted 130 USD for an 18 inch chain before (I13), so 130 at 18 in.

10K / 18K: the maker table is 14K only. Gold part follows spot x purity, the labor part per gram is
fixed and karat independent (additive model, verified against the maker's own 18K table at 1.400,
docs/ophir/README.md). Grams scale with alloy density (10K x 0.892, 18K x 1.137).
"""
import math

SPOT_USD_OZT = 4178.20                 # same basis as both catalogs (gold-api.com 2026-09-30)
PURE_G = SPOT_USD_OZT / 31.1034768
PURITY = {"10K": 0.417, "14K": 0.585, "18K": 0.750}
DENSITY = {"10K": 0.892, "14K": 1.0, "18K": 1.137}
MAKER_14K_USD_G = 100.00
LABOR_USD_G = MAKER_14K_USD_G - PURE_G * PURITY["14K"]     # 21.42 at this spot
MARKUP = 2.0
MODEL_FEE_USD = 25                     # once per design; reported, not priced in

ENAMEL_RING_BAND = 100                 # full enamel band (candy cane ring)
ENAMEL_PIECE = 50                      # pendant, bracelet stations
CHAIN_NECKLACE_18IN = 130              # quoted chain price at the middle length
CHAIN_BRACELET_7IN = 100               # quoted with the poinsettia bracelet
ASSEMBLY = 50                          # quoted with the poinsettia bracelet


def list_g14(width_mm, us_size, thick_mm=1.5):
    """14K grams of a flat band from the maker's list (fit R2 0.99996, max cell error 0.95%)."""
    return width_mm * (0.836 + 0.0515 * us_size) * thick_mm / 1.5


def gold_cost(g14, karat):
    """Maker cost of g14 grams (14K equivalent) made in karat: grams x density x (gold + labor)."""
    return g14 * DENSITY[karat] * (PURE_G * PURITY[karat] + LABOR_USD_G)


def karat_ratio(karat):
    """Cost of the same piece in karat relative to 14K (chains are gold too)."""
    return gold_cost(1, karat) / gold_cost(1, "14K")


def price_cents(cost_usd):
    return int(math.ceil(MARKUP * cost_usd / 10) * 10 * 100)


assert abs(gold_cost(1, "14K") - 100.0) < 1e-9
assert abs(karat_ratio("18K") - 1.40) < 0.03, karat_ratio("18K")   # maker's own 18K table: 1.400
assert abs(list_g14(3, 7) - 3.57) / 3.57 < 0.01 and abs(list_g14(4, 10) - 5.40) / 5.40 < 0.01
