"""EON lab-grown, ilk listing: Double Shared Prong band fiyat modeli (2026-11-04).

Run: python3 -I docs/eon/lab-grown/price_model.py

Girdi: üreticinin el yazısı notu (Model 1: 2,40 mm round, US7 toplam 0,8 ct, 13 taş, 14K $550,
taş takma $4) + canlı spot. Perakende formülü lib/pricing-engine/eon-cost.ts 457-472'nin birebir
kopyasıdır (engine = round(landed × çarpan); liste = ceil(engine / vitrin, 5); en kötü Offsite'ta
model-net kâr ≥ $50 olana dek +5). JS Math.round = floor(x + 0,5); Python round() banker's olduğu
için kullanılmaz.
"""
import math

SPOT = 4065.80            # gold-api.com, 2026-11-04 18:31 UTC (canlı); pricing_config 4399.90 (Ağustos, bayat)
TROY = 31.1035
PURITY = {"10K": 0.417, "14K": 0.585, "18K": 0.75}
DENS = {"10K": 0.892, "14K": 1.0, "18K": 1.137}      # alaşım yoğunluğu, 14K'ya oran (docs/artifact-studio/maker_cost.py)
PACK, SHIP, FIX = 8, 22, 0.45
MULT_NARROW = 1.55        # 2-7 mm dar bant; 2,75 mm bu band
MIN_PROFIT = 50
MAKER_14K_ALL_IN = 550    # üretici, US7, 13 taş dahil (bağımsız model okudu: ~$529)
STONES, SETTING_EACH = 13, 4

js_round = lambda x: math.floor(x + 0.5)
melt = lambda k: SPOT / TROY * PURITY[k]


def retail(landed, mult, sale):
    engine = js_round(landed * mult)
    lst = math.ceil((engine / sale - 1e-12) / 5) * 5
    prof = lambda L: 0.905 * (L * sale) - min(0.15 * L * sale, 100) - FIX - landed
    while prof(lst) < MIN_PROFIT:
        lst += 5
    return engine, lst, js_round(lst * sale), js_round(prof(lst))


floor_std = lambda landed: js_round((landed + FIX) / 0.895)
floor_offsite = lambda landed: js_round((landed + FIX) / 0.745)


def geom_g(w, thick, us, karat, fill=0.90, stone_void=0.88):
    """Bant gramı: iç çap 11,63 + 0,8128×US; orta çevre × kesit × doluluk; taş yuvaları %12 metal alır."""
    d = 11.63 + 0.8128 * us
    return w * thick * fill * math.pi * (d + thick) * stone_void / 1000 * 13.0 * DENS[karat]


if __name__ == "__main__":
    print(f"spot {SPOT}: melt 14K ${melt('14K'):.2f}/g  18K ${melt('18K'):.2f}/g")
    g7 = geom_g(2.75, 2.5, 7, "14K")
    indep = g7 * melt("14K") + 60 + 80 + STONES * SETTING_EACH
    print(f"US7 gram ~{g7:.2f} g -> altın ${g7*melt('14K'):.0f} + işçilik ~60 + taş 0,78 ct ~80 + takma {STONES*SETTING_EACH} = ${indep:.0f}  (üretici ${MAKER_14K_ALL_IN})")

    readings = {
        "A: $550 her şey dahil": MAKER_14K_ALL_IN,
        "B: $550 + takma 13x4": MAKER_14K_ALL_IN + STONES * SETTING_EACH,
        "C: $550 + takma + taş ~80": MAKER_14K_ALL_IN + STONES * SETTING_EACH + 80,
    }
    for sale, label in [(0.75, "vitrin %25"), (0.65, "vitrin %35 (12 Ekim'den beri ölçülen)"), (1.0, "indirim dışı")]:
        print(f"\n-- {label} --")
        for name, maker in readings.items():
            landed = maker + PACK + SHIP
            eng, lst, s, p = retail(landed, MULT_NARROW, sale)
            print(f"  {name:28s} landed {landed:4d}  liste {lst:5d}  alıcı {s:4d}  kâr(en kötü Offsite) {p:4d}  taban std {floor_std(landed)} / offsite {floor_offsite(landed)}")

    print("\n-- beden duyarlılığı, okuma A, alıcı $900, taş sayısı sabit 13 --")
    for us in [4, 7, 10, 13]:
        gold = geom_g(2.75, 2.5, us, "14K") * melt("14K")
        landed = MAKER_14K_ALL_IN + (gold - g7 * melt("14K")) + PACK + SHIP
        prof = 0.905 * 900 - 100 - FIX - landed
        print(f"  US{us:2d}: altın farkı {gold - g7*melt('14K'):+5.0f}  landed {landed:4.0f}  kâr@900 en kötü Offsite {prof:4.0f}")

    g18 = geom_g(2.75, 2.5, 7, "18K")
    landed18 = MAKER_14K_ALL_IN + (g18 * melt("18K") - g7 * melt("14K")) + PACK + SHIP
    eng, lst, s, p = retail(landed18, MULT_NARROW, 0.75)
    print(f"\n18K türetilmiş (yalnız altın payı ölçeklenir, taş/işçilik sabit): landed {landed18:.0f} -> liste {lst} alıcı {s} (üretici teklifi yok, TÜRETİLMİŞ)")
