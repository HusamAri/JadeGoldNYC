"""Jade Gold NYC, Christmas 2026: the copy pass for necklaces (N) and brooches (P), written by hand.

Run: python3 -I docs/jade/xmas26/manual_copy.py  -> work/copy_KOLYE.json, work/copy_BROS.json
The agent copy pass wrote bracelets and earrings; for these two categories it stopped at the weekly
usage limit, so the same fields are written here from the same sources: the workshop spec and the
independent verifier's corrected camera text (work/reality_<CAT>.json). Grams are the verifier's
recomputed gold grams, adjusted only where a required change moves metal (noted per piece).
The verifier's remaining geometry changes are carried as open questions, not silently assumed done.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
WORK = HERE / "work"

CARE = ("CARE\nWipe with a soft dry cloth, or wash in warm water with a drop of mild soap and a soft brush. "
        "Take it off for swimming and cleaning. No bleach or chlorine.")
CARE_ENAMEL = ("CARE\nWipe with a soft dry cloth, or wash in warm water with a drop of mild soap. Glass enamel is "
               "hard and does not fade, but it can chip if struck against stone or metal. Keep it away from "
               "ultrasonic cleaners. No bleach or chlorine.")
GIFT = "GIFTING\nArrives in a gift box, ready to give."
END = "Made to order. The processing time is shown at checkout."
COLD = ("ENAMEL\nThe colour is hand-applied cold enamel (coloured epoxy resin), not kiln-fired glass. It is set "
        "into cells cast into the gold, level with the surface. Resin can scratch with wear: avoid ultrasonic "
        "and steam cleaning, solvents and perfume on the coloured areas.")


def necklace_fit(chain):
    return (f"LENGTH AND FIT\n{chain}, 16 in with a 2 in extender, so it sits from 16 to 18 in. The chain is "
            "part of the design and its weight is counted in the gold weight above.")


def brooch_fit(pins):
    return (f"HOW IT FASTENS\n{pins} of hardened 14k white gold with a rotating safety catch, the standard "
            "fine-jewellery fastening for a brooch worn every day.")


def made(enamel, stones, extra=""):
    s = "HOW IT IS MADE\nMade to order. Cast in 14k gold in one piece"
    if enamel:
        s += (", in a zinc-free gold alloy chosen for enamel. The enamel cells are cast into the gold, filled "
              "by hand and kiln-fired. Nothing is soldered after the first firing; any fitting added later is "
              "laser welded away from the enamel")
    s += "."
    if stones:
        s += " The stones are set last, cold, after all firing and polishing."
    return s + (" " + extra if extra else "")


def desc(p, lead, piece, fit, enamel_txt="", stone_txt="", made_extra=""):
    parts = [lead, "THE PIECE\n" + piece,
             f"GOLD WEIGHT\n{p['gold_grams']:.2f} g of 14k gold, counting the {p['_counted']}. On the scale "
             f"the finished piece weighs {p['total_grams']:.2f} g in total with "
             + ("the enamel and stones." if p['enamel'] and p['stones'] else
                "the enamel." if p['enamel'] else "the stones." if p['stones'] else "everything on it.")]
    if p["enamel"]:
        parts.append("ENAMEL\n" + enamel_txt)
    if p["stones"]:
        parts.append("STONES\n" + stone_txt)
    parts += [fit, made(p["enamel"], p["stones"], made_extra), CARE_ENAMEL if p["enamel"] else CARE, GIFT, END]
    return "\n\n".join(parts)


def load(cat):
    d = json.load(open(WORK / f"reality_{cat}.json"))
    real = {p["slot"]: p for p in d["reality"]["products"]}
    ver = {v["slot"]: v for v in d["verify"]["per_product"]}
    return real, ver


def workshop(r):
    return {k: r[k] for k in ("dimensions", "construction", "bench_sequence", "bom", "failure_modes",
                              "tolerance_checks")}


def total(gold, r, enamel_scale=1.0):
    return round(gold + r["enamel_grams"] * enamel_scale + r["stone_ct"] * 0.2, 2)


# ------------------------------------------------------------------ necklaces
NR, NV = load("KOLYE")
CABLE = "A 1.0 mm 14k cable chain"
N = []


def neck(pid, **k):
    r, v = NR[pid], NV[pid]
    p = {"id": pid, "category": "necklace", "wearer": "women", "karat": "14K", "hollow": False,
         "_counted": "chain, clasp and extender", "enamel": False, "enamel_phrase": "", "enamel_colours_tr": "",
         "stones": 0, "stone_phrase": "", "stones_tr": "", "cold_enamel_paragraph": "",
         "workshop": workshop(r), "motif": r["motif"],
         "verifier_fixes_applied": [], "verifier_fixes_rejected": [],
         "open_questions": list(r.get("open_questions", [])) +
         [f"Doğrulayıcı düzeltmesi (CAD'de uygulanacak): {c}" for c in v["required_changes"]]}
    p.update(k)
    p["total_grams"] = total(p["gold_grams"], r)
    if p["enamel"]:
        p["cold_enamel_paragraph"] = COLD
    N.append(p)
    return p


p = neck("N1", name="Guiding Star Openwork Pendant", gold_grams=4.07,
         camera=NV["N1"]["camera_description_corrected"].replace("Eight-point star", "Eight-pointed star"),
         macro="The open centre disc with its 2.0 mm round hole, the eight short spokes and the bright diamond-cut facets on the rail.",
         back="The flat open back of the star rail, the spokes and the round bail at the top ray.",
         side="A flat openwork star 0.9 mm thick with the centre disc at 1.1 mm.",
         max_mm=23, bench_props="a steel burnisher and a fine half-round file",
         noun="pendant necklace", alt_base="14K gold eight-pointed openwork star pendant on a fine cable chain",
         alt_macro="the open centre disc and diamond-cut rail of the star", alt_back="the open back and the bail",
         title="14K Gold Star Pendant Necklace, Openwork Eight Point Guiding Star, Christmas Gift",
         tags=["14k gold necklace", "star necklace", "guiding star", "north star pendant", "openwork pendant",
               "eight point star", "celestial jewelry", "star of bethlehem", "christmas gift", "gift for her",
               "cable chain necklace", "solid gold pendant", "diamond cut gold"],
         materials=["14k yellow gold", "14k gold cable chain", "14k gold lobster clasp"],
         season_proof="Yıldız yıl boyu satan bir form; 'Bethlehem' yalnız etikette, başlık Ocak'ta değişmez.")
p["description"] = desc(p,
    "An eight-pointed star drawn in gold: an open rail, eight short spokes and a small round window at the "
    "centre, with the lower ray drawn longer. A quiet Christmas gift that keeps being worn long after.",
    "The star is 18 mm wide and 23 mm tall. Seven rays reach 9 mm from the centre and the lower ray 14 mm. "
    "The 1.0 mm rail is diamond-cut on its face; the centre disc is 4.5 mm across with a 2.0 mm hole. "
    "The ray tips are rounded. The bail is cast with the star.",
    necklace_fit(CABLE))

p = neck("N2", name="Comet Pendant", gold_grams=4.10, stones=4,
         camera=("Comet pendant in 14K yellow gold, about 31 mm long. A 6.0 mm domed round head holds one flush-set "
                 "2.0 mm lab grown white sapphire at its centre. Two curved tail rails sweep away from the head, a "
                 "26 mm main rail and a shorter 18 mm second rail, joined by three short cross bars; the main rail "
                 "narrows from 1.6 mm to 1.0 mm and both rails end in rounded tips. Three more flush-set lab grown "
                 "white sapphires run along the main rail, one 1.8 mm and two 1.5 mm, each on a small round pad. "
                 "Polished head, diamond-cut rails. Bail behind the upper edge of the head. 1.5 mm 14K figaro "
                 "chain, 16 inch plus 2 inch extender."),
         stone_phrase=("four round lab-grown white sapphires, all flush-set: one 2.0 mm in the comet head and one "
                       "1.8 mm and two 1.5 mm on small pads along the main tail rail"),
         stones_tr="1 x 2,0 + 1 x 1,8 + 2 x 1,5 mm lab beyaz safir",
         macro="The domed comet head with its flush-set 2.0 mm lab-grown white sapphire and the start of the two diamond-cut tail rails.",
         back="The flat back of the head and the two tail rails, with small round holes under the four stones and the bail behind the head.",
         side="A domed head 1.8 mm high at the centre and flat tail rails 1.0 mm thick.",
         max_mm=31, bench_props="a steel burnisher, a fine half-round file and a pair of brass tweezers",
         noun="pendant necklace", alt_base="14K gold comet pendant with four flush-set lab grown white sapphires",
         alt_macro="the domed comet head and its flush-set lab-grown sapphire", alt_back="the flat back and the bail",
         title="14K Gold Comet Pendant Necklace, Four Lab Grown Sapphires, Shooting Star Gift",
         tags=["14k gold necklace", "comet necklace", "shooting star", "lab grown sapphire", "celestial jewelry",
               "star pendant", "figaro chain", "wish necklace", "christmas gift", "gift for her",
               "solid gold pendant", "astronomy gift", "new year gift"],
         materials=["14k yellow gold", "lab grown white sapphire", "14k gold figaro chain", "14k gold lobster clasp"],
         season_proof="Kuyruklu yıldız astronomidir; Ocak-Şubat 'dilek' anlatısıyla aynı başlıkla satar.")
p["description"] = desc(p,
    "A comet in gold: a domed head with a lab-grown white sapphire and two tail rails that sweep away from it, "
    "three more sapphires running down the main rail. A shooting-star wish for Christmas and every day after.",
    "About 31 mm long. The domed head is 6.0 mm across; the main tail rail is 26 mm long and narrows from "
    "1.6 mm to 1.0 mm, the second rail is 18 mm, joined by three short cross bars. Rail faces are "
    "diamond-cut, the head is polished, every tip is rounded. Because the head is the heaviest part, the "
    "pendant hangs with the tail turned about 20 degrees off vertical.",
    necklace_fit("A 1.5 mm 14k figaro chain"),
    stone_txt=("Four round lab-grown white sapphires, all flush set: one 2.0 mm in the head, one 1.8 mm and two "
               "1.5 mm along the main rail, 0.09 ct in total. Each sits level with the gold over a small hole "
               "that lets light and cleaning water through. Lab-grown sapphire has the hardness of mined "
               "sapphire (Mohs 9)."))

p = neck("N3", name="Crescent Evil Eye Pendant", gold_grams=4.01, enamel=True, stones=2,
         camera=NV["N3"]["camera_description_corrected"].replace(
             "one 1.5 mm lab grown blue sapphire", "one 1.5 mm pale ice-blue lab grown sapphire"),
         enamel_phrase=("opaque enamel in three concentric fields of the disc, from the outside inward: a navy-blue "
                        "ring, a white ring and a navy-blue centre"),
         enamel_colours_tr="lacivert + beyaz (nazar)",
         stone_phrase="two 1.5 mm round pale ice-blue lab-grown sapphires, one flush-set in the round pad at each crescent tip",
         stones_tr="2 x 1,5 mm açık buz mavisi lab safir",
         macro="The evil eye disc with its navy-blue and white enamel rings and the gold crescent wrapped around its lower half.",
         back="The flat solid back of the disc and crescent, with small round holes under the two tip stones and the bail behind the disc.",
         side="A flat disc 1.35 mm thick joined to a crescent 1.0 mm thick.",
         max_mm=15.3, bench_props="a small porcelain dish of navy-blue enamel powder, a fine sable brush and a pair of brass tweezers",
         noun="pendant necklace", alt_base="14K gold crescent moon pendant with a navy and white evil eye enamel disc",
         alt_macro="the navy and white enamel evil eye inside the gold crescent", alt_back="the solid back and the bail",
         title="14K Gold Crescent Moon Necklace, Evil Eye Enamel, Lab Grown Blue Sapphire, Protection Gift",
         tags=["14k gold necklace", "crescent moon", "evil eye necklace", "nazar pendant", "enamel necklace",
               "vitreous enamel", "lab grown sapphire", "protection amulet", "moon necklace", "christmas gift",
               "gift for her", "talisman jewelry", "solid gold pendant"],
         materials=["14k yellow gold", "vitreous enamel", "lab grown blue sapphire", "14k gold cable chain",
                    "14k gold lobster clasp"],
         season_proof="Nazar ve hilal yıl boyu satan tılsım; Noel metni çıkınca aynı başlıkla devam eder.")
p["description"] = desc(p,
    "An evil eye in navy and white glass enamel, held by a gold crescent that wraps its lower half, with a pale "
    "blue lab-grown sapphire at each tip. A protection gift for Christmas that is worn all year.",
    "15.3 mm across the crescent tips and 11.6 mm tall. The eye disc is 9.2 mm across, the crescent is "
    "polished gold and joined to the disc along its inner edge. The bail is hidden behind the disc.",
    necklace_fit(CABLE),
    enamel_txt=("Kiln-fired vitreous enamel (glass), opaque, in navy blue and white: three fields divided by "
                "0.7 mm gold rings, level with the gold."),
    stone_txt=("Two 1.5 mm round lab-grown sapphires in a pale ice blue, one in a round pad at each crescent tip, "
               "flush set after the last firing."))

p = neck("N4", name="Hamsa Openwork Pendant", gold_grams=3.98, stones=3,
         camera=NV["N4"]["camera_description_corrected"].replace(
             "one 1.5 mm lab grown blue sapphire", "one 1.5 mm pale ice-blue lab grown sapphire"),
         stone_phrase=("three round 1.5 mm lab-grown sapphires: one pale ice-blue sapphire as the pupil of the eye and "
                       "one white sapphire flush-set in each thumb tip"),
         stones_tr="1 x 1,5 mm buz mavisi + 2 x 1,5 mm beyaz lab safir",
         macro="The almond eye opening with its thin gold bar and the pale ice-blue lab-grown sapphire pupil, framed by the diamond-cut rail.",
         back="The flat back of the open hand frame and palm plate, with small round holes under the stones and the bail behind the middle finger.",
         side="A flat open frame 0.9 mm thick with the palm plate at 1.0 mm.",
         max_mm=18, bench_props="a steel burnisher, a fine half-round file and a pair of brass tweezers",
         noun="pendant necklace", alt_base="14K gold openwork hamsa hand pendant with a lab grown sapphire eye",
         alt_macro="the almond eye and the lab-grown sapphire pupil", alt_back="the open frame back and the bail",
         title="14K Gold Hamsa Hand Necklace, Openwork Pendant, Lab Grown Sapphire Eye, Protection Gift",
         tags=["14k gold necklace", "hamsa necklace", "hamsa hand", "openwork pendant", "lab grown sapphire",
               "protection amulet", "talisman jewelry", "hand of fatima", "christmas gift", "gift for her",
               "cable chain necklace", "solid gold pendant", "good luck gift"],
         materials=["14k yellow gold", "lab grown white sapphire", "lab grown blue sapphire", "14k gold cable chain",
                    "14k gold lobster clasp"],
         season_proof="Hamsa kendi başına yıl boyu satan kategori; 27 Aralık'ta metin değişmez.")
p["description"] = desc(p,
    "A hamsa drawn as an open gold frame, with an almond eye across the palm and a pale blue lab-grown sapphire "
    "as its pupil. A protection gift for Christmas and every day after.",
    "14 mm wide and 18 mm tall. A 1.0 mm rail outlines three fingers and two outward-curving thumbs; the palm "
    "is a solid oval plate with an 8.0 by 4.4 mm eye opening crossed by a thin gold bar. The rail is "
    "diamond-cut, the palm polished. The bail sits behind the middle finger.",
    necklace_fit(CABLE),
    stone_txt=("Three 1.5 mm round lab-grown sapphires, flush set: a pale ice-blue sapphire as the pupil and a "
               "white sapphire in each thumb tip, 0.04 ct in total. Mohs 9."))

p = neck("N5", name="Icicle Pendant", gold_grams=4.15, stones=1, hollow=True,
         camera=NV["N5"]["camera_description_corrected"].replace(
             "One 1.5 mm lab grown blue sapphire", "One 1.5 mm pale ice-blue lab grown sapphire"),
         stone_phrase="one 1.5 mm round pale ice-blue lab-grown sapphire flush-set in a small raised pad just below the collar",
         stones_tr="1 x 1,5 mm açık buz mavisi lab safir",
         macro="The faceted top collar, the flush-set pale ice-blue lab-grown sapphire below it and the polished ribs running down the icicle.",
         back="The back of the icicle with its two small round drain holes in the upper third and the bail behind the collar.",
         side="A round tapered icicle 4.6 mm wide at the collar narrowing to a rounded 0.8 mm tip, 23 mm long.",
         max_mm=23, bench_props="a steel burnisher, a fine half-round file and a pair of brass tweezers",
         noun="pendant necklace", alt_base="14K gold icicle pendant with a pale blue lab grown sapphire",
         alt_macro="the faceted collar and the pale blue lab-grown sapphire", alt_back="the drain holes and the bail",
         title="14K Gold Icicle Pendant Necklace, Lab Grown Blue Sapphire, Winter Jewelry Gift for Her",
         tags=["14k gold necklace", "icicle necklace", "icicle pendant", "winter jewelry", "lab grown sapphire",
               "blue sapphire", "ice jewelry", "drop pendant", "christmas gift", "gift for her",
               "cable chain necklace", "minimalist pendant", "new year gift"],
         materials=["14k yellow gold", "lab grown blue sapphire", "14k gold cable chain", "14k gold lobster clasp"],
         season_proof="Buz sarkıtı kış sembolü; Ocak-Şubat'ta da satar, Noel'e kilitli değil.")
p["description"] = desc(p,
    "An icicle in 14k gold, ribbed and tapering to a rounded tip, with a pale blue lab-grown sapphire under its "
    "faceted collar. A winter piece for Christmas that keeps going through January and beyond.",
    "23 mm long, 4.6 mm across the faceted collar, narrowing to a rounded 0.8 mm tip. Four uneven ribs run "
    "down the upper half. The upper body is hollow-formed to keep the weight wearable, with two small drain "
    "holes on the back; the lower part is solid. The bail sits behind the collar.",
    necklace_fit(CABLE),
    stone_txt="One 1.5 mm round lab-grown sapphire in a pale ice blue, flush set in a small raised pad. Mohs 9.")

p = neck("N6", name="Window Frost Enamel Bar", gold_grams=4.00, enamel=True,
         camera=NV["N6"]["camera_description_corrected"],
         enamel_phrase="opaque ice-blue enamel filling the three fields of the bar between the gold frost lines",
         enamel_colours_tr="buz mavisi",
         macro="The bar face with its opaque ice-blue enamel fields and the fine gold frost lines branching from the small round node.",
         back="The flat solid polished back of the bar and the bail at the top.",
         side="A flat bar 1.4 mm thick with rounded corners.",
         max_mm=17, bench_props="a small porcelain dish of ice-blue enamel powder and a fine sable brush",
         noun="pendant necklace", alt_base="14K gold vertical bar pendant with ice blue enamel and gold frost lines",
         alt_macro="the ice blue enamel and the gold frost lines", alt_back="the solid back and the bail",
         title="14K Gold Ice Blue Enamel Bar Necklace, Frost Crystal Pendant, Winter Gift for Her",
         tags=["14k gold necklace", "enamel necklace", "bar necklace", "ice blue enamel", "vitreous enamel",
               "frost necklace", "winter jewelry", "ice crystal", "christmas gift", "gift for her",
               "cable chain necklace", "solid gold pendant", "modern pendant"],
         materials=["14k yellow gold", "vitreous enamel", "14k gold cable chain", "14k gold lobster clasp"],
         season_proof="Yazın soyut buz mavisi mineli bar kolye olarak okunur; Noel işareti yok.")
p["description"] = desc(p,
    "A slim gold bar filled with ice-blue glass enamel and crossed by fine gold lines that branch the way frost "
    "grows on a window. A winter gift for Christmas with nothing seasonal to put away in January.",
    "6.5 by 17 mm with rounded corners, 1.4 mm thick. Three gold lines run out from a small round node to the "
    "frame, with short side lines branching at 60 degrees, so the blue is split into three fields. A 0.7 mm "
    "gold border frames the bar. The bail sits at the top back.",
    necklace_fit(CABLE),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque ice blue, level with the gold lines.")

p = neck("N7", name="Angel Wing Pendant", gold_grams=4.14, stones=1,
         camera=NV["N7"]["camera_description_corrected"],
         stone_phrase="one 1.5 mm round lab-grown white sapphire flush-set at the inner upper corner of the wing",
         stones_tr="1 x 1,5 mm lab beyaz safir",
         macro="The upper band of rounded feathers with its scalloped edge and the flush-set lab-grown white sapphire at the inner corner.",
         back="The flat solid back of the wing, the slits between the long feathers and the bail at the top centre.",
         side="A flat wing 0.9 mm thick.",
         max_mm=14.5, bench_props="a steel burnisher, a fine half-round file and a pair of brass tweezers",
         noun="pendant necklace", alt_base="14K gold angel wing pendant with a lab grown white sapphire",
         alt_macro="the feather band and the lab-grown sapphire", alt_back="the flat back and the bail",
         title="14K Gold Angel Wing Necklace, Lab Grown Sapphire, Guardian Angel Pendant, Memorial Gift",
         tags=["14k gold necklace", "angel wing", "guardian angel", "wing necklace", "memorial necklace",
               "lab grown sapphire", "remembrance gift", "sympathy gift", "christmas gift", "gift for her",
               "rope chain necklace", "solid gold pendant", "angel jewelry"],
         materials=["14k yellow gold", "lab grown white sapphire", "14k gold rope chain", "14k gold lobster clasp"],
         season_proof="Melek kanadı yıl boyu anma ve koruyucu melek takısı; Aralık'ta Noel meleği okuması ekler.")
p["description"] = desc(p,
    "A single angel wing in 14k gold, a row of rounded feathers above five long ones, with one lab-grown "
    "sapphire at the shoulder. A guardian-angel gift for Christmas, and a remembrance piece for any day.",
    "9 mm wide and 14.5 mm tall, 0.9 mm thick. Five long feathers are separated by narrow pierced slits and "
    "meet along a closed lower edge, so nothing catches. Feather faces are diamond-cut. The bail sits at the "
    "top centre of the wing.",
    necklace_fit("A 1.0 mm 14k diamond-cut rope chain"),
    stone_txt="One 1.5 mm round lab-grown white sapphire, flush set at the inner upper corner. Mohs 9.")

p = neck("N8", name="Snaffle Bit Necklace", gold_grams=3.70, stones=2,
         camera=NV["N8"]["camera_description_corrected"],
         stone_phrase="two 1.5 mm round lab-grown white sapphires, one flush-set on the front face of each ring near the top",
         stones_tr="2 x 1,5 mm lab beyaz safir",
         macro="One gold ring of the snaffle bit with its flush-set lab-grown white sapphire and the interlocking eyes of the jointed mouthpiece.",
         back="The plain round backs of the two rings and the jointed mouthpiece, with a small hole behind each stone.",
         side="Round rings of 1.3 mm wire and a short jointed mouthpiece of 1.1 mm eyes.",
         max_mm=33, bench_props="a steel burnisher, a fine half-round file and a pair of brass tweezers",
         noun="necklace", alt_base="14K gold snaffle bit necklace with two lab grown white sapphires",
         alt_macro="a ring of the snaffle bit and its lab-grown sapphire", alt_back="the plain backs of the rings",
         title="14K Gold Snaffle Bit Necklace, Lab Grown Sapphires, Equestrian Jewelry, Horse Lover Gift",
         tags=["14k gold necklace", "snaffle bit", "equestrian jewelry", "horse lover gift", "lab grown sapphire",
               "riding jewelry", "equestrian gift", "derby jewelry", "christmas gift", "gift for her",
               "cable chain necklace", "solid gold necklace", "link necklace"],
         materials=["14k yellow gold", "lab grown white sapphire", "14k gold cable chain", "14k gold lobster clasp"],
         season_proof="Atlı donanım kalıcı lüks kategorisi; ilkbahar derbi sezonunda ikinci tepe.")
p["description"] = desc(p,
    "A snaffle bit in 14k gold: two round rings joined by a jointed mouthpiece, worn across the front of the "
    "chain, with a lab-grown sapphire on each ring. An equestrian gift for Christmas and the riding season.",
    "About 33 mm wide. Two 9.0 mm rings in 1.3 mm round wire are joined by a short jointed mouthpiece whose "
    "inner eyes interlock at the centre. The chain runs through both rings, so there is no bail.",
    necklace_fit(CABLE),
    stone_txt="Two 1.5 mm round lab-grown white sapphires, one flush set on the front of each ring. Mohs 9.")

p = neck("N9", name="Stirrup Slider Pendant", gold_grams=3.89, enamel=True,
         camera=NV["N9"]["camera_description_corrected"],
         enamel_phrase="opaque deep jade-green enamel filling five small cells in a row along the base bar",
         enamel_colours_tr="derin yeşil (jade)",
         macro="The base bar with its row of five opaque deep jade-green enamel cells between fine gold ribs.",
         back="The flat solid back of the stirrup and the slot in the top bar that the chain runs through.",
         side="A flat stirrup rail 1.2 mm thick with the base bar at 1.5 mm.",
         max_mm=16, bench_props="a small porcelain dish of deep green enamel powder and a fine sable brush",
         noun="pendant necklace", alt_base="14K gold stirrup slider pendant with jade green enamel",
         alt_macro="the row of jade green enamel cells on the base bar", alt_back="the solid back and chain slot",
         title="14K Gold Stirrup Necklace, Jade Green Enamel Slider Pendant, Equestrian Gift for Her",
         tags=["14k gold necklace", "stirrup necklace", "equestrian jewelry", "enamel necklace", "green enamel",
               "vitreous enamel", "horse lover gift", "slider pendant", "riding jewelry", "christmas gift",
               "gift for her", "solid gold pendant", "derby jewelry"],
         materials=["14k yellow gold", "vitreous enamel", "14k gold cable chain", "14k gold lobster clasp"],
         season_proof="Kalıcı atlı kategori; derin yeşil yarış rengi olarak okunur, Noel envanteri değil.")
p["description"] = desc(p,
    "A riding stirrup in 14k gold with a row of jade-green glass enamel along its tread. It slides on the chain "
    "with no bail. An equestrian gift for Christmas that belongs to every season.",
    "13 mm wide and 16 mm tall. A 1.6 mm rail forms the arched stirrup over a flat 12 mm base bar; five small "
    "enamel cells sit in a row on the bar, divided by fine gold ribs. A slot in the top bar takes the chain.",
    necklace_fit("A 1.2 mm 14k cable chain"),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque deep jade green, set just below the gold edges.")

p = neck("N10", name="Cardinal Pendant", gold_grams=3.82, enamel=True,
         camera=(NV["N10"]["camera_description_corrected"]
                 .replace("The face, beak and outline are polished gold with no black mask, and the eye",
                          "The face, beak and outline are polished gold, and the eye")
                 .replace(" No branch or perch.", "")),
         enamel_phrase="opaque deep berry enamel filling three fields on the breast, wing and tail",
         enamel_colours_tr="derin böğürtlen",
         macro="The cardinal's breast and wing in opaque deep berry enamel, the fine gold lines between the fields and the gold crest.",
         back="The flat solid back of the bird, the round eye hole and the bail hidden behind the back.",
         side="A flat bird 1.35 mm thick.",
         max_mm=15, bench_props="a small porcelain dish of deep berry enamel powder and a fine sable brush",
         noun="pendant necklace", alt_base="14K gold cardinal bird pendant with deep berry enamel",
         alt_macro="the deep berry enamel breast and wing of the cardinal", alt_back="the solid back and eye hole",
         title="14K Gold Cardinal Necklace, Berry Enamel Bird Pendant, Memorial Keepsake, Sympathy Gift",
         tags=["14k gold necklace", "cardinal necklace", "cardinal jewelry", "memorial necklace", "enamel necklace",
               "berry enamel", "vitreous enamel", "bird necklace", "sympathy gift", "christmas gift",
               "gift for her", "remembrance gift", "solid gold pendant"],
         materials=["14k yellow gold", "vitreous enamel", "14k gold cable chain", "14k gold lobster clasp"],
         season_proof="Kardinal Noel'de tepe yapar ama asıl hacim yıl boyu anma takısı.")
p["description"] = desc(p,
    "A cardinal in profile, its breast, wing and tail in deep berry glass enamel and its crest and face in "
    "polished gold. A keepsake many people give when they remember someone at Christmas.",
    "11 mm wide and 15 mm tall, 1.35 mm thick. The enamel is a dark blackberry red, divided into three fields "
    "by fine gold lines that mark the wing and tail. The eye is a small round opening through the gold. The "
    "bail is hidden behind the back.",
    necklace_fit(CABLE),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque deep berry, cadmium-free, level with the gold.")

# ------------------------------------------------------------------ brooches
PR, PV = load("BROS")
P = []


def pin(pid, **k):
    r, v = PR[pid], PV[pid]
    p = {"id": pid, "category": "brooch", "karat": "14K", "hollow": False,
         "_counted": "14k white gold pin stem and the safety catch", "enamel": False, "enamel_phrase": "",
         "enamel_colours_tr": "", "stones": 0, "stone_phrase": "", "stones_tr": "", "cold_enamel_paragraph": "",
         "workshop": workshop(r), "motif": r["motif"],
         "verifier_fixes_applied": [], "verifier_fixes_rejected": [],
         "open_questions": list(r.get("open_questions", [])) +
         [f"Doğrulayıcı düzeltmesi (CAD'de uygulanacak): {c}" for c in v["required_changes"]]}
    scale = k.pop("_enamel_scale", 1.0)
    p.update(k)
    p["total_grams"] = total(p["gold_grams"], r, scale)
    if p["enamel"]:
        p["cold_enamel_paragraph"] = COLD
    P.append(p)
    return p


ONE = "One pin stem"
TWO = "Two pin stems"

p = pin("P1", name="North Star Lapel Pin", wearer="men", gold_grams=3.33,
        camera=PV["P1"]["camera_description_corrected"].replace("an eight-point star", "an eight-pointed star"),
        macro="The centre disc with its honed matte finish and small polished dome, and the bright V groove running down each ray.",
        back="The flat back of the star with the 14K white gold pin stem, the hinge and the rotating safety catch.",
        side="A flat star 1.3 mm thick with the centre dome rising slightly above it.",
        max_mm=30, bench_props="a steel burnisher and a fine half-round file",
        noun="lapel pin", alt_base="14K gold eight-pointed star lapel pin for men",
        alt_macro="the matte centre disc and the bright grooves on the rays", alt_back="the pin stem and safety catch",
        title="14K Gold Star Lapel Pin for Men, Eight Point North Star, Groomsman Gift",
        tags=["14k gold lapel pin", "mens lapel pin", "star lapel pin", "north star pin", "gold brooch for men",
              "suit pin", "groomsman gift", "celestial jewelry", "christmas gift", "gift for him",
              "solid gold pin", "wedding lapel pin", "mens jewelry"],
        materials=["14k yellow gold", "14k white gold pin stem", "14k gold safety catch"],
        season_proof="Sekiz ışınlı yıldız yıl boyu satan bir form; başlık Ocak'ta değişmez.")
p["description"] = desc(p,
    "An eight-pointed star for the lapel, four long rays and four short ones, each with a bright cut groove and "
    "a matte centre. A Christmas gift for him, and the pin he wears to every wedding after.",
    "26 mm wide and 30 mm tall; the lower ray is drawn longest. Each ray is 1.3 mm thick with a flat top and "
    "one bright V groove that fades before the rounded tip. The 8 mm centre disc is honed matte with a small "
    "polished dome.",
    brooch_fit(ONE))

p = pin("P2", name="Comet Brooch", wearer="women", gold_grams=3.92, stones=3,
        camera=PV["P2"]["camera_description_corrected"],
        stone_phrase=("three 1.8 mm round lab-grown white sapphires: one in the central collet of the head ring and "
                      "one flush-set in the raised square pad on each of the two cross-bars"),
        stones_tr="3 x 1,8 mm lab beyaz safir",
        macro="The open head ring with its three spokes and the central collet holding a lab-grown white sapphire, and the start of the three tail ribbons.",
        back="The back of the comet with two 14K white gold pin stems, their hinges and rotating safety catches.",
        side="Flat tail ribbons 0.9 to 1.1 mm thick and a head ring 1.8 mm thick.",
        max_mm=42, bench_props="a steel burnisher, a fine half-round file and a pair of brass tweezers",
        noun="brooch", alt_base="14K gold comet brooch with three lab grown white sapphires",
        alt_macro="the comet head ring and its lab-grown sapphire", alt_back="the two pin stems and safety catches",
        title="14K Gold Comet Brooch, Three Lab Grown Sapphires, Shooting Star Pin, Celestial Gift",
        tags=["14k gold brooch", "comet brooch", "shooting star pin", "lab grown sapphire", "celestial jewelry",
              "star brooch", "gold pin", "coat brooch", "christmas gift", "gift for her", "solid gold brooch",
              "statement brooch", "astronomy gift"],
        materials=["14k yellow gold", "lab grown white sapphire", "14k white gold pin stem", "14k gold safety catch"],
        season_proof="Kuyruklu yıldız yıl boyu 'celestial' talebinde yaşar; başlıkta Noel yok.")
p["description"] = desc(p,
    "A comet lying across the coat: an open gold ring for a head and three tapered gold ribbons trailing "
    "behind, with lab-grown white sapphires at the head and on the cross-bars. A celestial Christmas gift.",
    "42 mm long and 14 mm tall. The 11 mm head ring holds a central collet on three short spokes; the three "
    "tail ribbons are 31, 25 and 19 mm long with rounded tips, bridged by two small cross-bars. Ribbon tops "
    "are diamond-cut, the sides honed matte.",
    brooch_fit(TWO),
    stone_txt=("Three 1.8 mm round lab-grown white sapphires: one in the head collet and one flush set on each "
               "cross-bar pad, 0.07 ct in total. Mohs 9."))

p = pin("P3", name="Icicle Bar Brooch", wearer="women", gold_grams=3.71, enamel=True, stones=3,
        camera=PV["P3"]["camera_description_corrected"],
        enamel_phrase="opaque ice-blue enamel filling four rectangular fields on the face of the bar",
        enamel_colours_tr="buz mavisi",
        stone_phrase="three 1.5 mm round lab-grown white sapphires, flush-set between the four enamel fields of the bar",
        stones_tr="3 x 1,5 mm lab beyaz safir",
        macro="The bar face with its four opaque ice-blue enamel fields and the flush-set lab-grown white sapphires between them.",
        back="The back of the bar and icicles with the 14K white gold pin stem behind the icicle roots and the rotating safety catch.",
        side="A flat bar 1.5 mm thick with icicles 1.0 to 1.1 mm thick.",
        max_mm=28, bench_props="a small porcelain dish of ice-blue enamel powder, a fine sable brush and a pair of brass tweezers",
        noun="brooch", alt_base="14K gold icicle bar brooch with ice blue enamel and lab grown sapphires",
        alt_macro="the ice blue enamel bar and its lab-grown sapphires", alt_back="the pin stem and safety catch",
        title="14K Gold Icicle Brooch, Ice Blue Enamel Bar Pin, Lab Grown Sapphires, Winter Gift",
        tags=["14k gold brooch", "icicle brooch", "enamel brooch", "ice blue enamel", "vitreous enamel",
              "winter jewelry", "bar brooch", "lab grown sapphire", "christmas gift", "gift for her",
              "coat brooch", "solid gold brooch", "ice jewelry"],
        materials=["14k yellow gold", "vitreous enamel", "lab grown white sapphire", "14k white gold pin stem",
                   "14k gold safety catch"],
        season_proof="Buz sarkıtı kış sembolü; Ocak-Şubat 'winter icicle brooch' olarak satar.")
p["description"] = desc(p,
    "A gold bar with four fields of ice-blue glass enamel and three lab-grown sapphires, and three icicles "
    "hanging below it. A winter brooch for Christmas that stays on the coat until spring.",
    "28 mm wide and 26 mm tall. The bar is 3.9 mm tall; the icicles hang 22, 17 and 15 mm, each with a narrow "
    "open slit in its upper half and a rounded tip. Icicle faces are diamond-cut.",
    brooch_fit(ONE),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque ice blue, level with polished gold borders.",
    stone_txt="Three 1.5 mm round lab-grown white sapphires, flush set between the enamel fields. Mohs 9.")

p = pin("P4", name="Ice Crystal Lapel Pin", wearer="men", gold_grams=3.70, enamel=True, stones=1,
        _enamel_scale=1.25,
        camera=("Men's lapel pin in 14K yellow gold: a flat hexagon 18 mm across the corners and 15.6 mm across the "
                "flats, with a flat side at the top and rounded corners. Three straight 0.8 mm gold ribs run from a "
                "3.4 mm centre disc to three alternate corners and divide the face into three diamond-shaped fields "
                "of opaque ice-blue enamel, level with the gold. A 1.0 mm polished gold rim frames the hexagon. The "
                "centre disc holds one 1.5 mm pale ice-blue lab grown sapphire, flush-set. Back: 14K white gold pin "
                "stem with a rotating safety catch."),
        enamel_phrase="opaque ice-blue enamel filling the three diamond-shaped fields of the hexagon",
        enamel_colours_tr="buz mavisi",
        stone_phrase="one 1.5 mm round pale ice-blue lab-grown sapphire flush-set in the centre disc",
        stones_tr="1 x 1,5 mm açık buz mavisi lab safir",
        macro="The centre disc with its flush-set pale ice-blue lab-grown sapphire where the three gold ribs meet, and the ice-blue enamel fields.",
        back="The flat back of the hexagon with the 14K white gold pin stem, the hinge and the rotating safety catch.",
        side="A flat hexagon plate 1.45 mm thick.",
        max_mm=18, bench_props="a small porcelain dish of ice-blue enamel powder, a fine sable brush and a pair of brass tweezers",
        noun="lapel pin", alt_base="14K gold hexagon ice crystal lapel pin with ice blue enamel",
        alt_macro="the centre sapphire where the three gold ribs meet", alt_back="the pin stem and safety catch",
        title="14K Gold Ice Crystal Lapel Pin for Men, Blue Enamel, Lab Grown Sapphire",
        tags=["14k gold lapel pin", "mens lapel pin", "ice crystal pin", "hexagon lapel pin", "enamel lapel pin",
              "ice blue enamel", "vitreous enamel", "lab grown sapphire", "gold brooch for men", "suit pin",
              "christmas gift", "gift for him", "winter jewelry"],
        materials=["14k yellow gold", "vitreous enamel", "lab grown blue sapphire", "14k white gold pin stem",
                   "14k gold safety catch"],
        season_proof="Altıgen buz kristali kış demektir, Noel demez; Ocak-Mart talebinde yaşar.")
p["description"] = desc(p,
    "A gold hexagon split by three ribs into three fields of ice-blue glass enamel, with a pale blue lab-grown "
    "sapphire where the ribs meet. An ice crystal for the lapel, and a Christmas gift for him.",
    "18 mm across the corners and 15.6 mm across the flats, 1.45 mm thick, with a 1.0 mm polished gold rim and "
    "rounded corners.",
    brooch_fit(ONE),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque ice blue, level with the gold ribs.",
    stone_txt="One 1.5 mm round lab-grown sapphire in a pale ice blue, flush set in the centre disc. Mohs 9.")
p["verifier_fixes_applied"] = ["Kar tanesi okumasını kırmak için 6 kaburga yerine 3 kaburga (Y): 3 eşkenar dörtgen hücre; altın ~-0.14 g, mine payı arttı."]

p = pin("P5", name="Snaffle Bit Lapel Pin", wearer="men", gold_grams=4.10,
        camera=(PV["P5"]["camera_description_corrected"]
                .replace("Back: 14K white gold pin stem with a rotating safety catch.",
                         "Back: two 14K white gold pin stems hidden behind the bar, each with a rotating safety catch.")),
        macro="One D-shaped ring with its bright diamond-cut facets and the round collar where it meets the honed bar.",
        back="The back of the snaffle bit with two 14K white gold pin stems behind the bar, their hinges and rotating safety catches.",
        side="Flat D-shaped rings 1.4 mm thick and a bar 1.6 mm thick.",
        max_mm=30, bench_props="a steel burnisher and a fine half-round file",
        noun="lapel pin", alt_base="14K gold snaffle bit lapel pin for men with open D rings",
        alt_macro="a faceted D ring and its collar", alt_back="the two pin stems behind the bar",
        title="14K Gold Snaffle Bit Lapel Pin for Men, Openwork Equestrian Pin, Horse Lover Gift",
        tags=["14k gold lapel pin", "mens lapel pin", "snaffle bit pin", "equestrian pin", "horse lover gift",
              "gold brooch for men", "suit pin", "riding jewelry", "derby jewelry", "christmas gift", "gift for him",
              "solid gold pin", "equestrian gift"],
        materials=["14k yellow gold", "14k white gold pin stem", "14k gold safety catch"],
        season_proof="Atlı donanımın Noel'le bağı yok; derbi sezonunda ikinci tepe.")
p["description"] = desc(p,
    "A snaffle bit for the lapel: two open D-shaped rings with bright cut facets, joined by a honed gold bar. "
    "An equestrian Christmas gift for him that goes from the stable to the wedding.",
    "30 mm wide and 13 mm tall. Each D ring is 13 mm tall with its straight side to the centre and six "
    "diamond-cut facets around its curve. The 3.0 mm bar has an open slot along its middle and a round collar "
    "at each end.",
    brooch_fit(TWO),
    made_extra="Two pins keep a 30 mm piece level on the lapel.")
p["verifier_fixes_applied"] = ["İğne hattı barın arkasına alındı (önden görünmez) ve L10 gereği ikinci iğne eklendi: altın 3.63 -> ~4.10 g."]

p = pin("P6", name="Stirrup Brooch", wearer="women", gold_grams=3.74, enamel=True, stones=1,
        camera=PV["P6"]["camera_description_corrected"],
        enamel_phrase="opaque deep jade-green enamel filling the single channel along the tread",
        enamel_colours_tr="derin yeşil (jade)",
        stone_phrase="one 2.0 mm round lab-grown white sapphire flush-set in the small raised block below the strap loop",
        stones_tr="1 x 2,0 mm lab beyaz safir",
        macro="The tread with its channel of opaque deep jade-green enamel, and the polished arch rising from it.",
        back="The back of the stirrup with the 14K white gold pin stem across the arch, the hinge and the rotating safety catch.",
        side="A flat arch 1.4 mm thick and a tread 1.5 mm thick.",
        max_mm=26, bench_props="a small porcelain dish of deep green enamel powder, a fine sable brush and a pair of brass tweezers",
        noun="brooch", alt_base="14K gold stirrup brooch with a jade green enamel tread and lab grown sapphire",
        alt_macro="the jade green enamel tread", alt_back="the pin stem and safety catch",
        title="14K Gold Stirrup Brooch, Jade Green Enamel, Lab Grown Sapphire, Equestrian Gift for Her",
        tags=["14k gold brooch", "stirrup brooch", "equestrian jewelry", "enamel brooch", "green enamel",
              "vitreous enamel", "lab grown sapphire", "horse lover gift", "riding jewelry", "christmas gift",
              "gift for her", "coat brooch", "solid gold brooch"],
        materials=["14k yellow gold", "vitreous enamel", "lab grown white sapphire", "14k white gold pin stem",
                   "14k gold safety catch"],
        season_proof="Üzengi Noel'e bağlı değil; binicilik talebi yıl boyu, ilkbahar yarış sezonu.")
p["description"] = desc(p,
    "A riding stirrup in 14k gold, its tread lined with jade-green glass enamel and a lab-grown sapphire set "
    "below the strap loop. An equestrian Christmas gift that is worn all year.",
    "26 mm tall and 22 mm wide. A polished 2.0 mm arch rises from an 18 by 4.4 mm tread to a small round "
    "strap loop; the enamel runs in one 14 mm channel along the tread.",
    brooch_fit(ONE),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque deep jade green, level with the gold.",
    stone_txt="One 2.0 mm round lab-grown white sapphire, flush set in a raised block on the arch. Mohs 9.")
p["verifier_fixes_applied"] = ["Basamak 20.5-21 mm'ye genişletilerek kol-basamak birleşimi tam kesit yapıldı: altın ~+0.17 g (3.57 -> 3.74). Taş beyaz lab safir."]

p = pin("P7", name="Evil Eye Sunburst Brooch", wearer="women", gold_grams=3.63, enamel=True, stones=4,
        camera=PV["P7"]["camera_description_corrected"],
        enamel_phrase=("opaque enamel in three concentric fields of the eye disc, from the outside inward: an ice-blue "
                       "ring, a white ring and a navy-blue centre"),
        enamel_colours_tr="buz mavisi + beyaz + lacivert (nazar)",
        stone_phrase="four 1.5 mm round lab-grown white sapphires, one flush-set at the base of each of the four diagonal rays",
        stones_tr="4 x 1,5 mm lab beyaz safir",
        macro="The eye disc with its ice-blue, white and navy-blue enamel rings and the lab-grown white sapphires at the bases of the diagonal rays.",
        back="The flat back of the disc and rays with the 14K white gold pin stem, the hinge and the rotating safety catch.",
        side="A flat disc 1.4 mm thick with rays 1.2 mm thick.",
        max_mm=23, bench_props="a small porcelain dish of ice-blue enamel powder, a fine sable brush and a pair of brass tweezers",
        noun="brooch", alt_base="14K gold evil eye sunburst brooch with nazar enamel and lab grown sapphires",
        alt_macro="the enamel evil eye and the sapphires at the ray bases", alt_back="the pin stem and safety catch",
        title="14K Gold Evil Eye Brooch, Nazar Enamel Sunburst Pin, Lab Grown Sapphires, Protection Gift",
        tags=["14k gold brooch", "evil eye brooch", "nazar brooch", "enamel brooch", "vitreous enamel",
              "sunburst brooch", "lab grown sapphire", "protection amulet", "talisman jewelry", "christmas gift",
              "gift for her", "coat brooch", "solid gold brooch"],
        materials=["14k yellow gold", "vitreous enamel", "lab grown white sapphire", "14k white gold pin stem",
                   "14k gold safety catch"],
        season_proof="Nazar yıl boyu tılsım; Aralık'taki yıldız okuması Ocak'ta da geçerli.")
p["description"] = desc(p,
    "An evil eye in ice-blue, white and navy glass enamel at the centre of eight gold rays, with a lab-grown "
    "sapphire at the base of each diagonal ray. A protection gift for Christmas and every day after.",
    "23 mm across. The eye disc is 12 mm across; the eight rays are 5.5 mm long with rounded tips and bright "
    "diamond-cut faces.",
    brooch_fit(ONE),
    enamel_txt=("Kiln-fired vitreous enamel (glass), opaque, in three rings divided by 0.7 mm gold walls: ice "
                "blue outside, then white, then a navy-blue centre."),
    stone_txt="Four 1.5 mm round lab-grown white sapphires, flush set at the ray bases. Mohs 9.")

p = pin("P8", name="Robin Lapel Pin", wearer="men", gold_grams=3.53, enamel=True, stones=1,
        camera=PV["P8"]["camera_description_corrected"],
        enamel_phrase="opaque deep berry enamel filling the single oval cell on the robin's breast",
        enamel_colours_tr="derin böğürtlen",
        stone_phrase="one 1.5 mm round lab-grown white sapphire flush-set as the robin's eye",
        stones_tr="1 x 1,5 mm lab beyaz safir",
        macro="The robin's head with its flush-set lab-grown white sapphire eye and the deep berry enamel breast below it.",
        back="The flat back of the robin and perch with the 14K white gold pin stem, the hinge and the rotating safety catch.",
        side="A flat bird 1.4 mm thick standing on a 1.4 mm perch bar.",
        max_mm=24, bench_props="a small porcelain dish of deep berry enamel powder, a fine sable brush and a pair of brass tweezers",
        noun="lapel pin", alt_base="14K gold robin lapel pin with a deep berry enamel breast",
        alt_macro="the robin's sapphire eye and berry enamel breast", alt_back="the pin stem and safety catch",
        title="14K Gold Robin Lapel Pin for Men, Berry Enamel, Lab Grown Sapphire Eye",
        tags=["14k gold lapel pin", "mens lapel pin", "robin pin", "bird lapel pin", "enamel lapel pin",
              "berry enamel", "vitreous enamel", "lab grown sapphire", "gold brooch for men", "suit pin",
              "christmas gift", "gift for him", "winter bird"],
        materials=["14k yellow gold", "vitreous enamel", "lab grown white sapphire", "14k white gold pin stem",
                   "14k gold safety catch"],
        season_proof="Kızılgerdan kış kuşu; Ocak-Mart 'winter bird' talebinde yaşar.")
p["description"] = desc(p,
    "A robin on a perch, its breast in deep berry glass enamel and its eye a lab-grown white sapphire. A winter "
    "bird for the lapel, and a Christmas gift for him.",
    "24 mm long and 18 mm tall. The robin faces left on a 16 mm perch bar; four matte feather ridges cross its "
    "back and the 10 mm tail points down and back with two open slits. Beak, feet and perch are polished.",
    brooch_fit(ONE),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque deep berry, cadmium-free, level with the gold.",
    stone_txt="One 1.5 mm round lab-grown white sapphire, flush set as the eye. Mohs 9.")

p = pin("P9", name="Lantern Brooch", wearer="women", gold_grams=3.36, enamel=True, stones=1,
        camera=PV["P9"]["camera_description_corrected"],
        enamel_phrase="opaque ice-blue enamel filling the single triangular field of the roof",
        enamel_colours_tr="buz mavisi",
        stone_phrase="one 1.8 mm round lab-grown white sapphire in a round tube collet on the gold rod at the centre of the window",
        stones_tr="1 x 1,8 mm lab beyaz safir",
        macro="The open window of the lantern with the gold rod and the lab-grown white sapphire in its tube collet, under the ice-blue enamel roof.",
        back="The back of the lantern with the 14K white gold pin stem behind the roof, the hinge and the rotating safety catch.",
        side="Flat posts and rails 1.4 mm thick and a roof 1.45 mm thick.",
        max_mm=25.6, bench_props="a small porcelain dish of ice-blue enamel powder, a fine sable brush and a pair of brass tweezers",
        noun="brooch", alt_base="14K gold lantern brooch with an ice blue enamel roof and lab grown sapphire flame",
        alt_macro="the sapphire flame inside the open lantern window", alt_back="the pin stem and safety catch",
        title="14K Gold Lantern Brooch, Ice Blue Enamel Roof, Lab Grown Sapphire Flame, Winter Gift",
        tags=["14k gold brooch", "lantern brooch", "enamel brooch", "ice blue enamel", "vitreous enamel",
              "lab grown sapphire", "winter jewelry", "candle brooch", "christmas gift", "gift for her",
              "coat brooch", "solid gold brooch", "cozy gift"],
        materials=["14k yellow gold", "vitreous enamel", "lab grown white sapphire", "14k white gold pin stem",
                   "14k gold safety catch"],
        season_proof="Fener kış akşamlarının nesnesi, Noel'e kilitli değil; Ocak-Şubat'ta satar.")
p["description"] = desc(p,
    "A small lantern in 14k gold: an ice-blue glass enamel roof, an open window, and a lab-grown white sapphire "
    "standing in for the flame. A winter-evening brooch for Christmas and the months after.",
    "25.6 mm tall and 15 mm wide. A round hanging ring sits on the triangular roof; two 1.4 mm posts frame an "
    "open window 11.2 by 12 mm, with a 1.0 mm gold rod rising to the stone at its centre.",
    brooch_fit(ONE),
    enamel_txt="Kiln-fired vitreous enamel (glass), opaque ice blue, level with the gold roof edges.",
    stone_txt="One 1.8 mm round lab-grown white sapphire in a round tube collet, open at the back. Mohs 9.")

p = pin("P10", name="Scarab Lapel Pin", wearer="men", gold_grams=3.91, enamel=True,
        camera=PV["P10"]["camera_description_corrected"],
        enamel_phrase=("opaque enamel in three fields: deep jade-green on the front shield and ice-blue on each of the "
                       "two wing cases"),
        enamel_colours_tr="derin yeşil + buz mavisi",
        macro="The scarab's ice-blue enamel wing cases either side of the polished gold ridge, and the deep jade-green enamel front shield.",
        back="The flat back of the scarab with the 14K white gold pin stem, the hinge and the rotating safety catch.",
        side="A flat beetle 1.4 mm thick with legs 1.0 mm thick.",
        max_mm=22, bench_props="a small porcelain dish of deep green enamel powder and a fine sable brush",
        noun="lapel pin", alt_base="14K gold scarab lapel pin with green and ice blue enamel",
        alt_macro="the enamel wing cases and front shield", alt_back="the pin stem and safety catch",
        title="14K Gold Scarab Lapel Pin for Men, Green Blue Enamel Beetle, Good Luck Gift",
        tags=["14k gold lapel pin", "mens lapel pin", "scarab pin", "beetle lapel pin", "enamel lapel pin",
              "vitreous enamel", "scarab amulet", "good luck gift", "gold brooch for men", "suit pin",
              "christmas gift", "gift for him", "talisman jewelry"],
        materials=["14k yellow gold", "vitreous enamel", "14k white gold pin stem", "14k gold safety catch"],
        season_proof="Skarabe yıl boyu koruma tılsımı; Noel'e bağlı değil, başlık değişmez.")
p["description"] = desc(p,
    "A scarab for the lapel: a deep jade-green glass enamel shield, ice-blue enamel wing cases and six gold "
    "legs. The beetle of renewal and good luck, as a Christmas gift for him.",
    "22 mm long and 21 mm wide including the legs. A polished 1.0 mm gold ridge runs between the wing cases; "
    "the six 1.0 mm legs angle outward with rounded ends.",
    brooch_fit(ONE),
    enamel_txt=("Kiln-fired vitreous enamel (glass), opaque: deep jade green on the front shield, ice blue on the "
                "wing cases, level with the gold."))
p["verifier_fixes_applied"] = ["Bacaklar 7.0 -> 6.5 mm kısaltıldı (gram payı): altın ~-0.05 g (3.96 -> 3.91)."]

for p in N + P:
    p.pop("_counted", None)
json.dump({"category": "KOLYE", "copy": {"category": "KOLYE", "products": N}, "read": None},
          open(WORK / "copy_KOLYE.json", "w"), ensure_ascii=False, indent=1)
json.dump({"category": "BROS", "copy": {"category": "BROS", "products": P}, "read": None},
          open(WORK / "copy_BROS.json", "w"), ensure_ascii=False, indent=1)
print(f"necklaces {len(N)}, brooches {len(P)}")
