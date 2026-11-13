"""EON lab-grown fiyat modeli: 01 Double Shared Prong (2026-11-04), 02 Vertical Baguette (2026-11-07),
03 Flush Round (2026-11-08), 04 Hammered Star (2026-11-10), 05 Half Eternity Pavé (2026-11-11),
06 Princess Channel (2026-11-13).

Run: python3 -I docs/eon/lab-grown/price_model.py        (01 DSP, çıktısı 2026-11-04 ile birebir)
     python3 -I docs/eon/lab-grown/price_model.py vb     (02 Vertical Baguette)
     python3 -I docs/eon/lab-grown/price_model.py fr     (03 Flush Round)
     python3 -I docs/eon/lab-grown/price_model.py hs     (04 Hammered Star)
     python3 -I docs/eon/lab-grown/price_model.py hep    (05 Half Eternity Pavé)
     python3 -I docs/eon/lab-grown/price_model.py pc     (06 Princess Channel)

Girdi: üreticinin el yazısı notu (Model 1: 2,40 mm round, US7 toplam 0,8 ct, 13 taş, 14K $550,
taş takma $4) + canlı spot. Perakende formülü lib/pricing-engine/eon-cost.ts 457-472'nin birebir
kopyasıdır (engine = round(landed × çarpan); liste = ceil(engine / vitrin, 5); en kötü Offsite'ta
model-net kâr ≥ $50 olana dek +5). JS Math.round = floor(x + 0,5); Python round() banker's olduğu
için kullanılmaz.
"""
import math
import sys

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


def dsp():
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


# ---- 02 Vertical Baguette (2026-11-07) -------------------------------------------------------
# Üretici notu Model 2 (birebir): "6 mm için Baguette. Minimum 2.20 mm thickness. Minimum 6 mm.
# 0.35 ct 6×2 taş ölçüsü. 8½ size 11,5 gram. taş fiyat 280$ 1 ct. 1150$. taş takma 10$"
# + WhatsApp 2026-11-07: "abi bizim ki 6mm" / "liste de 2 numara da hesabi yaziyor".
SPOT_VB = 4072.10          # gold-api.com 2026-11-07 09:34 UTC
VB_G85 = 11.5              # üreticinin kendi gramı: 6 × 2,20 mm, US 8½
VB_USD_G = 100.0           # üreticinin 14K liste fiyatı, işçilik dahil (maker_cost.py konvansiyonu)
VB_STONE_CT, VB_STONE_USD_CT, VB_SETTING = 0.35, 280.0, 10
VB_SIZES = [4, 5, 6, 7, 8, 8.5, 9, 10, 11, 12, 13, 14, 15, 16]


def vb_g(us):
    """Üreticinin bant listesinin beden eğrisi (maker_cost.list_g14), US 8½'te 11,5 g'a sabitlenmiş."""
    shape = lambda s: 0.836 + 0.0515 * s
    return VB_G85 * shape(us) / shape(8.5)


def vb_cost(us, reading):
    g = vb_g(us)
    if reading == "B":     # konvansiyon: gram × $100 (altın + işçilik), taş ve takma üstüne
        return g * VB_USD_G + VB_STONE_CT * VB_STONE_USD_CT + VB_SETTING
    return 1150 + (g - VB_G85) * VB_USD_G   # A: $1.150 her şey dahil, bedenle yalnız gram oynar


def vb():
    m14 = SPOT_VB / TROY * PURITY["14K"]
    lg = 6 * (0.836 + 0.0515 * 8.5) * 2.2 / 1.5
    print(f"spot {SPOT_VB}: melt 14K ${m14:.2f}/g; üretici $100/g içinde işçilik ~${VB_USD_G - m14:.2f}/g")
    print(f"üretici listesi formülü 6 mm × 2,2 mm US 8½: {lg:.2f} g (üretici 11,5 g, {11.5 / lg - 1:+.1%});"
          f" 11,5 × $100 = ${VB_G85 * VB_USD_G:.0f} (notta $1.150)")
    print(f"taş {VB_STONE_CT} ct × ${VB_STONE_USD_CT:.0f}/ct = ${VB_STONE_CT * VB_STONE_USD_CT:.0f}; takma ${VB_SETTING}")
    print("\n-- US 8½, iki okuma --")
    lists = {}
    for r, name in [("B", "B: gram×$100 + taş + takma (konvansiyon)"), ("A", "A: $1.150 her şey dahil")]:
        landed = vb_cost(8.5, r) + PACK + SHIP
        for sale, lbl in [(0.75, "%25"), (0.65, "%35"), (1.0, "indirimsiz")]:
            eng, lst, s, p = retail(landed, MULT_NARROW, sale)
            if sale == 0.75:
                lists[r] = lst
            print(f"  {name:42s} landed {landed:6.0f}  {lbl:10s} engine {eng}  liste {lst}  alıcı {s}  kâr(en kötü Offsite) {p}")
    print("\n-- tek fiyat (US 8½ motoru), bedene göre kâr, en kötü Offsite --")
    for r in ("B", "A"):
        lst = lists[r]
        for sale in (0.75, 0.65):
            row = []
            for us in VB_SIZES:
                landed = vb_cost(us, r) + PACK + SHIP
                buyer = lst * sale
                row.append(f"US{us:g} {0.905 * buyer - min(0.15 * buyer, 100) - FIX - landed:+.0f}")
            print(f"  {r} liste {lst} @ {1 - sale:.0%}: " + "  ".join(row))
    print("\n-- beden başına motor (B, %25): liste --")
    print("  " + "  ".join(f"US{us:g} {retail(vb_cost(us, 'B') + PACK + SHIP, MULT_NARROW, 0.75)[1]}" for us in VB_SIZES))
    print("  gram: " + "  ".join(f"US{us:g} {vb_g(us):.2f}" for us in VB_SIZES))

    print("\n-- 01 DSP (canlı, alıcı $900 @ %25) kapsam duyarlılığı: Model 2'nin gram×$100 aritmetiği DSP'ye uygulanırsa --")
    for name, maker in [("A $550 her şey dahil", 550), ("B + takma 13×$4", 602),
                        ("C + taş 0,78 ct × ~$100/ct", 680), ("C' + taş 0,78 ct × $280/ct (Model 2 oranı)", 820)]:
        landed = maker + PACK + SHIP
        p_off = 0.905 * 900 - min(0.15 * 900, 100) - FIX - landed
        p_std = 0.905 * 900 - FIX - landed
        print(f"  {name:44s} landed {landed}  kâr std {p_std:+.0f}  en kötü Offsite {p_off:+.0f}")


# ---- 03 Flush Round (2026-11-08) -------------------------------------------------------------
# Sahibin referansı etsy.com/listing/4512052520 (AarsanJewels, Hindistan, moissanite; okuma 2026-11-08,
# Google çeviri vekili; Etsy konteynere 403): 6,00 × 1,50 mm, fırçalanmış yüz, iki cilalı faset kenar, tek
# cilalı kanal (merkez dışı), 0,10 (±0,05) ct round brilliant flush (gypsy). Fotoğraflarda taş (kenarlığıyla)
# bant genişliğinin ~1/3'ü, yani ~2,0 mm (≈0,03 ct): ilan edilen 0,10 ct (3 mm) 1,5 mm duvara flush oturmaz
# (derinlik ~1,8 mm). Üretici teklifi YOK: maliyet üreticinin bant listesinden (maker_cost.list_g14, tam
# dikdörtgen kesit) + taş + takma. Faset + kanal ~%5 metal alır (US 8½'te ~$38); o pay ince işçilik
# (kanal, faset cilası) için tampon olarak maliyette bırakıldı.
SPOT_FR = 4072.10          # gold-api.com 2026-11-08 20:10 UTC (hafta sonu; 11-07 ile aynı)
FR_W, FR_T = 6.0, 1.5
FR_STONE_MM, FR_STONE_CT = 2.0, 0.03
FR_STONE_USD = 20          # bilinen tek lab oranı $280/ct (Model 2) → 0,03 ct $8,40; tek taş için $20 (kalibre değil)
FR_SETTING = 10            # Model 2'nin flush takma ücreti, taş başı
FR_SIZES = [4, 5, 6, 7, 8, 8.5, 9, 10, 11, 12, 13, 14, 15, 16]
FR_LISTS = [1600, 1705, 1780, 1800]


def fr_g(us):
    """Üreticinin 14K bant listesi: genişlik × (0,836 + 0,0515 × US) × kalınlık / 1,5."""
    return FR_W * (0.836 + 0.0515 * us) * FR_T / 1.5


def fr_cost(us):
    return fr_g(us) * VB_USD_G + FR_STONE_USD + FR_SETTING


def fr_profit(buyer, us):
    return 0.905 * buyer - min(0.15 * buyer, 100) - FIX - (fr_cost(us) + PACK + SHIP)


def fr():
    m14 = SPOT_FR / TROY * PURITY["14K"]
    g85 = fr_g(8.5)
    print(f"spot {SPOT_FR}: melt 14K ${m14:.2f}/g; üretici $100/g içinde işçilik ~${VB_USD_G - m14:.2f}/g")
    print(f"gram (liste, tam kesit) US 8½ {g85:.2f} g; faset 2 × 0,6 mm + kanal 0,3 × 0,3 mm ≈ %5 → ~{g85 * 0.95:.2f} g")
    print(f"taş {FR_STONE_MM} mm ≈ {FR_STONE_CT} ct: $280/ct ile ${FR_STONE_CT * 280:.2f}, ${FR_STONE_USD} yazıldı; takma ${FR_SETTING}")
    landed = fr_cost(8.5) + PACK + SHIP
    print(f"\n-- US 8½: maliyet ${fr_cost(8.5):.2f}  landed ${landed:.2f} --")
    for sale, lbl in [(0.75, "%25"), (0.65, "%35"), (1.0, "indirimsiz")]:
        eng, lst, s, p = retail(landed, MULT_NARROW, sale)
        print(f"  {lbl:10s} engine {eng}  liste {lst}  alıcı {s}  kâr(en kötü Offsite) {p}")
    worst = fr_cost(FR_SIZES[-1]) + PACK + SHIP
    need = (MIN_PROFIT + 100 + FIX + worst) / 0.905          # alıcı ≥ 1000 → Offsite tavanı $100
    floor_list = math.ceil((need / 0.75 - 1e-12) / 5) * 5
    print(f"  tek fiyatta US {FR_SIZES[-1]:g} de ≥ ${MIN_PROFIT} kalsın (%25): liste ≥ {floor_list} (alıcı {floor_list * 0.75:.2f})")
    print("\n-- tek fiyat, bedene göre kâr (en kötü Offsite) --")
    for lst in FR_LISTS:
        for sale in (0.75, 0.65):
            buyer = lst * sale
            row = "  ".join(f"US{us:g} {fr_profit(buyer, us):+.0f}" for us in FR_SIZES)
            print(f"  liste {lst} @ {1 - sale:.0%} (alıcı {buyer:.2f}): {row}")
    print("\n-- beden başına motor (%25): liste --")
    print("  " + "  ".join(f"US{us:g} {retail(fr_cost(us) + PACK + SHIP, MULT_NARROW, 0.75)[1]}" for us in FR_SIZES))
    print("  gram: " + "  ".join(f"US{us:g} {fr_g(us):.2f}" for us in FR_SIZES))


# ---- 04 Hammered Star (2026-11-10) -----------------------------------------------------------
# Sahibin referansı etsy.com/listing/4581494716 (BRIARLORE, San Marino CA, 925 gümüş + moissanite, $175,81;
# okuma 2026-11-10, Google çeviri vekili): "Band Width About 5 mm", iki round brilliant "starburst" (yıldız)
# yuvalı taş "About 2.3 mm each", "0.08 ctw DEW", her yüz dövme dokulu. Fotoğraflarda (ref01 önden, ref05
# parmakta) taş bant genişliğinin 0,27-0,33'ü, yani ~1,4-1,6 mm; yıldızın uçtan uca açıklığı 3,5-4,1 mm
# (genişliğin ~%75'i). 2,3 mm (derinlik ~1,4 mm) 1,5 mm duvara güvenle oturmaz; 1,5 mm (derinlik ~0,9 mm)
# oturur. Tasarım: 5 × 1,5 mm (EON tek renk bant kalınlığı), DÖRT 1,5 mm taş, bant çevresinde eşit aralıklı
# (çeyrek tur, 90°): sahip 2026-11-10, hero v1'den sonra "taşlar 4 adet eşit aralıkta konumlanmış olmalı".
# Referansın önden fotoğrafı (ref01, ±~40°) bununla tutarlı: önden bakınca dört yıldızın ikisi görünür.
# Üretici teklifi YOK: maliyet üreticinin bant listesi (tam kesit; dövme izleri ~%5 metal alır, US 8½'te
# ~$32, tampon olarak bırakıldı) + taş + yıldız takma (flush ücreti + ışın oyması) + dövme işçiliği.
SPOT_HS = 4023.50          # gold-api.com 2026-11-10 17:19 UTC
HS_W, HS_T = 5.0, 1.5
HS_STONES, HS_STONE_MM, HS_STONE_CT_EACH = 4, 1.5, 0.013   # 2026-11-10 sahip: 2 → 4, eşit aralıklı
HS_STONE_USD_EACH = 10     # $280/ct × 0,013 ct = $3,64; taş başı $10 yazıldı (kalibre değil)
HS_SETTING_EACH = 10       # Model 2'nin flush takma ücreti, taş başı
HS_ENGRAVE_EACH = 10       # yıldızın 8 ışını, taş başı (kalibre değil)
HS_TEXTURE = 30            # dövme doku işçiliği, halka başı (kalibre değil)
HS_SIZES = [4, 5, 6, 7, 8, 8.5, 9, 10, 11, 12, 13, 14, 15, 16]
HS_LISTS = [1700, 1800, 1900, 2100]
HS_EON_PLAIN_HAMMERED_5MM_US85 = 2005   # EON 4565377715 GLD-R-1013-14-05-085 liste (5,43 g), 2026-11-10 panel


def hs_g(us):
    """Üreticinin 14K bant listesi: genişlik × (0,836 + 0,0515 × US) × kalınlık / 1,5."""
    return HS_W * (0.836 + 0.0515 * us) * HS_T / 1.5


def hs_extras():
    return HS_STONES * (HS_STONE_USD_EACH + HS_SETTING_EACH + HS_ENGRAVE_EACH) + HS_TEXTURE


def hs_cost(us):
    return hs_g(us) * VB_USD_G + hs_extras()


def hs_profit(buyer, us):
    return 0.905 * buyer - min(0.15 * buyer, 100) - FIX - (hs_cost(us) + PACK + SHIP)


def hs():
    m14 = SPOT_HS / TROY * PURITY["14K"]
    g85 = hs_g(8.5)
    print(f"spot {SPOT_HS}: melt 14K ${m14:.2f}/g; üretici $100/g içinde işçilik ~${VB_USD_G - m14:.2f}/g")
    print(f"gram (liste, tam kesit) US 8½ {g85:.2f} g; dövme izleri ~%5 → ~{g85 * 0.95:.2f} g (fark ~${g85 * 0.05 * VB_USD_G:.0f} tampon)")
    print(f"taş {HS_STONES} × {HS_STONE_MM} mm ≈ {HS_STONES * HS_STONE_CT_EACH:.3f} ct: $280/ct ile ${HS_STONES * HS_STONE_CT_EACH * 280:.2f},"
          f" ${HS_STONES * HS_STONE_USD_EACH} yazıldı; yıldız takma {HS_STONES} × (${HS_SETTING_EACH} + ışın ${HS_ENGRAVE_EACH});"
          f" dövme ${HS_TEXTURE}; ekler toplamı ${hs_extras()}")
    landed = hs_cost(8.5) + PACK + SHIP
    print(f"\n-- US 8½: maliyet ${hs_cost(8.5):.2f}  landed ${landed:.2f} --")
    for sale, lbl in [(0.75, "%25"), (0.65, "%35"), (1.0, "indirimsiz")]:
        eng, lst, s, p = retail(landed, MULT_NARROW, sale)
        print(f"  {lbl:10s} engine {eng}  liste {lst}  alıcı {s}  kâr(en kötü Offsite) {p}")
    worst = hs_cost(HS_SIZES[-1]) + PACK + SHIP
    need = (MIN_PROFIT + 100 + FIX + worst) / 0.905          # alıcı ≥ 1000 → Offsite tavanı $100
    floor_list = math.ceil((need / 0.75 - 1e-12) / 5) * 5
    print(f"  tek fiyatta US {HS_SIZES[-1]:g} de ≥ ${MIN_PROFIT} kalsın (%25): liste ≥ {floor_list} (alıcı {floor_list * 0.75:.2f})")
    print(f"  EON düz dövme 14K 5 mm US 8½ (4565377715): liste {HS_EON_PLAIN_HAMMERED_5MM_US85} → %25 ile alıcı {HS_EON_PLAIN_HAMMERED_5MM_US85 * 0.75:.2f}")
    print("\n-- tek fiyat, bedene göre kâr (en kötü Offsite) --")
    for lst in HS_LISTS:
        for sale in (0.75, 0.65):
            buyer = lst * sale
            row = "  ".join(f"US{us:g} {hs_profit(buyer, us):+.0f}" for us in HS_SIZES)
            print(f"  liste {lst} @ {1 - sale:.0%} (alıcı {buyer:.2f}): {row}")
    print("\n-- beden başına motor (%25): liste --")
    print("  " + "  ".join(f"US{us:g} {retail(hs_cost(us) + PACK + SHIP, MULT_NARROW, 0.75)[1]}" for us in HS_SIZES))
    print("  gram: " + "  ".join(f"US{us:g} {hs_g(us):.2f}" for us in HS_SIZES))


# ---- 05 Half Eternity Pavé, stone of your choice (2026-11-11) -----------------------------------
# Sahibin referansı etsy.com/listing/685259244 (NyFineJewelry / Nobel Yates, 5,0 yıldız 320 yorum; okuma 2026-11-11,
# Google çeviri vekili): "Natural Diamond or Moissanite Wedding Band: 18K Gold Half Eternity Ring", "Shank: 1.35 mm
# width, 1.35 mm thickness", "Approx. 1.49 g", round taşlar "Approx. 0.184ctw"; Gemstone varyasyonu Natural Diamond /
# Lab Grown Diamond / Moissanite, metal 10K/14K/18K × 3 renk + platin. 14K alıcı fiyatı (vitrin %25 sonrası):
# moissanite $336,75, lab +$36,75 → ~$373,50, doğal +$137 → ~$473,75. Fotoğraflarda (03 sarı, 09 beyaz önden) taş
# bant genişliğine eşit, ~1,3 mm; ön yarıda ~21 taş (US 6 civarı) → 21 × 0,009 = 0,19 ct, ilanla tutarlı.
# Sahip 2026-11-11: "new model all stone choices as specialization option" + listing'in taş tablosu (20 taş).
# Kişiselleştirme fiyatı DEĞİŞTİREMEZ (Etsy add_on_price yalnız isteğe bağlı text_input'ta), bu yüzden tek fiyat
# tablodaki EN PAHALI taşı da karşılamalı.
# Tasarım: 14K, 1,5 × 1,5 mm bant (EON standart kalınlığı; referans 1,35), üst yarıda tek sıra ~1,3 mm round taş,
# paylaşımlı mikro tırnak (shared prong micro pavé). Taş sayısı bedenle ölçeklenir: yarım çevre / 1,45 mm adım
# (taş 1,3 + tırnak 0,15) → US 4 19, US 8½ 23, US 16 30 (kötümser; üreticiye sorulur, sabit sayı da olabilir).
# Üretici teklifi YOK: gram × $100 (altın + işçilik) + taş başı takma $4 (DSP notu) + taş.
SPOT_HEP = 4003.70         # gold-api.com 2026-11-11 17:23 UTC
HEP_W, HEP_T = 1.5, 1.5
HEP_STONE_MM, HEP_STONE_CT = 1.3, 0.009   # standart round tablosu: 1,3 mm ≈ 0,009 ct
HEP_PITCH = 1.45           # taş 1,3 mm + paylaşımlı tırnak ~0,15 mm
HEP_SETTING_EACH = 4       # üreticinin DSP notu "taş takma $4" (2,4 mm taş için; mikro pavé için kalibre değil)
HEP_STONE_USD = {          # taş başı, 1,3 mm, kalibre değil (üreticinin bilinen tek lab oranı $280/ct)
    "lab_diamond": 0.009 * 280,       # varsayılan taş ve fotoğraflardaki taş
    "cap": 5.00,                      # en pahalı seçim: doğal salt & pepper (~$500/ct → $4,50), tanzanit ~$4
    "cheap": 0.50,                    # akik, gül kuvars, oniks
}
HEP_SIZES = [4, 5, 6, 7, 8, 8.5, 9, 10, 11, 12, 13, 14, 15, 16]
HEP_LISTS = [925, 1000, 1050, 1150]
HEP_REF_14K_BUYER = {"Moissanite": 336.75, "Lab Grown Diamond": 373.50, "Natural Diamond": 473.75}


def hep_g(us):
    """Üreticinin 14K bant listesi: genişlik × (0,836 + 0,0515 × US) × kalınlık / 1,5 (tam kesit; taş yuvaları
    metal alır, tırnaklar ekler: tampon olarak tam kesit tutulur)."""
    return HEP_W * (0.836 + 0.0515 * us) * HEP_T / 1.5


def hep_stones(us):
    """Üst yarıdaki taş sayısı: dış çevrenin yarısı / adım (iç çap 11,63 + 0,8128 × US)."""
    d = 11.63 + 0.8128 * us
    return js_round(math.pi * (d + 2 * HEP_T) / 2 / HEP_PITCH)


def hep_cost(us, tier="lab_diamond"):
    return hep_g(us) * VB_USD_G + hep_stones(us) * (HEP_STONE_USD[tier] + HEP_SETTING_EACH)


def hep_profit(buyer, us, tier):
    return 0.905 * buyer - min(0.15 * buyer, 100) - FIX - (hep_cost(us, tier) + PACK + SHIP)


def hep_floor(us, tier, sale=0.75):
    """En kötü Offsite'ta kâr ≥ MIN_PROFIT olan en düşük liste (5'in katı)."""
    lst = 5
    while hep_profit(lst * sale, us, tier) < MIN_PROFIT:
        lst += 5
    return lst


def hep():
    m14 = SPOT_HEP / TROY * PURITY["14K"]
    print(f"spot {SPOT_HEP}: melt 14K ${m14:.2f}/g; üretici $100/g içinde işçilik ~${VB_USD_G - m14:.2f}/g")
    print("beden  gram  taş  ct    lab-pırlanta maliyeti  en pahalı taşla")
    for us in HEP_SIZES:
        n = hep_stones(us)
        print(f"  US{us:<4g} {hep_g(us):.2f}  {n:3d}  {n * HEP_STONE_CT:.3f}  ${hep_cost(us):7.2f}             ${hep_cost(us, 'cap'):7.2f}")
    landed = hep_cost(8.5) + PACK + SHIP
    print(f"\n-- US 8½, lab-grown pırlanta: maliyet ${hep_cost(8.5):.2f}  landed ${landed:.2f} --")
    for sale, lbl in [(0.75, "%25"), (0.65, "%35"), (1.0, "indirimsiz")]:
        eng, lst, s, p = retail(landed, MULT_NARROW, sale)
        print(f"  {lbl:10s} engine {eng}  liste {lst}  alıcı {s}  kâr(en kötü Offsite) {p}")
    for tier in ("lab_diamond", "cap"):
        f = hep_floor(HEP_SIZES[-1], tier)
        print(f"  tek fiyatta US {HEP_SIZES[-1]:g} {tier} ≥ ${MIN_PROFIT} (%25): liste ≥ {f} (alıcı {f * 0.75:.2f})")
    print("  referans 14K alıcı (vitrin %25 sonrası): " + ", ".join(f"{k} ${v}" for k, v in HEP_REF_14K_BUYER.items()))
    print("\n-- tek fiyat, bedene ve taşa göre kâr (en kötü Offsite) --")
    for lst in HEP_LISTS:
        for sale in (0.75, 0.65):
            buyer = lst * sale
            for tier in ("lab_diamond", "cap"):
                row = "  ".join(f"US{us:g} {hep_profit(buyer, us, tier):+.0f}" for us in (4, 8.5, 13, 14, 15, 16))
                print(f"  liste {lst} @ {1 - sale:.0%} (alıcı {buyer:.2f}) {tier:11s}: {row}")
    print("\n-- beden başına motor (%25, lab-grown pırlanta): liste --")
    print("  " + "  ".join(f"US{us:g} {retail(hep_cost(us) + PACK + SHIP, MULT_NARROW, 0.75)[1]}" for us in HEP_SIZES))


# ---- 06 Princess Channel, nine stones (2026-11-13) ---------------------------------------------
# Sahibin referansı 25karats.com WB9262 "Classic 9 Stone Princes Cut Diamond Anniversary Band (1/2 ct.t.w.)"
# (okuma 2026-11-13: site Cloudflare 403, Google çeviri vekili 429, r.jina.ai okuyucu vekili 200): 14K, 9 princess
# 0,05 ct / 2×2 mm (toplam 0,45 ct), doğal GH/VS, kanal yuva, comfort fit, "Approximately 2.9 grams", $1.669.
# Fotoğraflarda (beyaz önden, sıranın ortası kameraya dik) taş 69 px = 2 mm; iki ray ~0,35-0,6 mm → bant ~3,0 mm.
# 2 mm princess'in derinliği ~1,4 mm (~%70): kanal en az ~1,7-1,8 mm et ister; 2,9 g ancak ~3,0 × 1,6 mm konfor
# kesimli bir bantla tutar. Tasarım: 3,0 × 1,8 mm (taş altında ~0,4 mm taban), sıra yalnız ön üstte (9 × 2 mm =
# 18 mm), iki ucu düz duvar, bedenle sabit 9 taş. Üretici teklifi YOK: gram × $100 (tam kesit; kanal ~0,7 g metal
# alır, tampon olarak maliyette bırakıldı) + taş + taş başı kanal takma.
SPOT_PC = 3887.87          # gold-api.com 2026-11-13 16:44 UTC
PC_W, PC_T = 3.0, 1.8
PC_STONES, PC_STONE_MM, PC_STONE_CT_EACH = 9, 2.0, 0.05
PC_STONE_USD_EACH = 0.05 * 280   # bilinen tek lab oranı $280/ct (Model 2) → $14 (kalibre değil)
PC_SETTING_EACH = 10       # Model 2'nin kanal (baget) takma ücreti; DSP'nin $4'ü tırnak içindi (kalibre değil)
PC_CHANNEL_G = 9 * 2.0 * 2.0 * 1.4 * 13.5 / 1000   # kanal boşluğu 18 × 2 × 1,4 mm, 14K 13,5 g/cm³ → ~0,68 g
PC_SIZES = [4, 5, 6, 7, 8, 8.5, 9, 10, 11, 12, 13, 14, 15, 16]
PC_LISTS = [1450, 1500, 1550, 1600]
PC_REF_NATURAL_14K = 1669  # 25karats WB9262 14K beyaz, doğal GH/VS, indirimsiz, 2026-11-13


def pc_g(us):
    """Üreticinin 14K bant listesi: genişlik × (0,836 + 0,0515 × US) × kalınlık / 1,5 (tam kesit)."""
    return PC_W * (0.836 + 0.0515 * us) * PC_T / 1.5


def pc_cost(us):
    return pc_g(us) * VB_USD_G + PC_STONES * (PC_STONE_USD_EACH + PC_SETTING_EACH)


def pc_profit(buyer, us):
    return 0.905 * buyer - min(0.15 * buyer, 100) - FIX - (pc_cost(us) + PACK + SHIP)


def pc_floor(us, sale=0.75):
    """En kötü Offsite'ta kâr ≥ MIN_PROFIT olan en düşük liste (5'in katı)."""
    lst = 5
    while pc_profit(lst * sale, us) < MIN_PROFIT:
        lst += 5
    return lst


def pc():
    m14 = SPOT_PC / TROY * PURITY["14K"]
    print(f"spot {SPOT_PC}: melt 14K ${m14:.2f}/g; üretici $100/g içinde işçilik ~${VB_USD_G - m14:.2f}/g")
    print(f"taş {PC_STONES} × {PC_STONE_MM} mm princess = {PC_STONES * PC_STONE_CT_EACH:.2f} ct: ${PC_STONES * PC_STONE_USD_EACH:.0f};"
          f" kanal takma {PC_STONES} × ${PC_SETTING_EACH}; kanal boşluğu ~{PC_CHANNEL_G:.2f} g (tampon)")
    print("beden  gram(tam)  gram(kanalsız)  maliyet")
    for us in PC_SIZES:
        print(f"  US{us:<4g} {pc_g(us):.2f}      {pc_g(us) - PC_CHANNEL_G:.2f}           ${pc_cost(us):.2f}")
    landed = pc_cost(8.5) + PACK + SHIP
    print(f"\n-- US 8½: maliyet ${pc_cost(8.5):.2f}  landed ${landed:.2f} --")
    for sale, lbl in [(0.75, "%25"), (0.65, "%35"), (1.0, "indirimsiz")]:
        eng, lst, s, p = retail(landed, MULT_NARROW, sale)
        print(f"  {lbl:10s} engine {eng}  liste {lst}  alıcı {s}  kâr(en kötü Offsite) {p}")
    for sale in (0.75, 0.65):
        f = pc_floor(PC_SIZES[-1], sale)
        print(f"  tek fiyatta US {PC_SIZES[-1]:g} ≥ ${MIN_PROFIT} (%{(1 - sale) * 100:.0f}): liste ≥ {f} (alıcı {f * sale:.2f})")
    print(f"  referans (doğal GH/VS, 14K, indirimsiz): ${PC_REF_NATURAL_14K}")
    print("\n-- tek fiyat, bedene göre kâr (en kötü Offsite) --")
    for lst in PC_LISTS:
        for sale in (0.75, 0.65):
            buyer = lst * sale
            row = "  ".join(f"US{us:g} {pc_profit(buyer, us):+.0f}" for us in (4, 7, 8.5, 12, 14, 16))
            print(f"  liste {lst} @ {1 - sale:.0%} (alıcı {buyer:.2f}): {row}")
    print("\n-- beden başına motor (%25): liste --")
    print("  " + "  ".join(f"US{us:g} {retail(pc_cost(us) + PACK + SHIP, MULT_NARROW, 0.75)[1]}" for us in PC_SIZES))


if __name__ == "__main__":
    {"vb": vb, "fr": fr, "hs": hs, "hep": hep, "pc": pc}.get(sys.argv[1] if len(sys.argv) > 1 else "", dsp)()
