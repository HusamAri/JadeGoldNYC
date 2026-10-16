# Ophir Gold USA — Christmas 2026 ring line (20 listings)

Owner 2026-10-16: "research for trends and create 20 christmas ring design, prepare them as
listing with 12 images". Two constraints settled the shape before any design work:

- **Shop: Ophir Gold USA** (owner's answer). Pricing therefore runs on the same maker terms as
  the Stellar line: `docs/artifact-studio/maker_cost.py`, price = `ceil(2 x maker cost / 10) x 10`.
- **6 images per ring, not 12** (owner's answer). 20 x 12 = 240 generations = 480 credits against
  a 241 credit balance. 20 x 6 = 120 generations = 240 credits, which fits. The six frames are the
  ones that carry a listing; the other six are the ones that repeat it.

## What the research actually supports

Searched 2026-10-16. **No public Etsy sales ranking exists**, so none of this is measured demand —
it is what retailers and trend desks are promoting, plus what Etsy's own category pages surface.
Treated as directional and labelled as such, per the repo's rule about not announcing an
external-system claim you cannot prove.

| signal | strength | how it shows up in this line |
|---|---|---|
| **Chunky gold, yellow gold returning** | strong, repeated across sources | the dome and signet groups are deliberately bold rather than dainty |
| **Dome / sculptural rings** | strong | R07–R09 are a dome family |
| **Signet rings** | strong, called a "comeback" | R04–R06, including a pinky signet |
| **Stacking** | strong, named a leading trend | R10–R12 are thin bands built to sit together and with plain bands |
| **Bows / ribbon motifs** | medium, one 2026 roundup; moved from "coquette" into ordinary retail | R01–R03 |
| **Deep red / green / gold stones** (garnet, emerald, citrine) | medium, seasonal colour story | R13–R16 bezel and two-stone designs |
| **Toi et Moi, bezel settings, pinky rings** | medium | R15 toi et moi, R13/R14 bezel, R06 pinky |
| **Personalised / birthstone** | strong signal, **deliberately NOT used** | engraving and personalisation are on this catalogue's banned list, and the Etsy personalisation endpoint is a separate contract; adding it would widen the line past what was asked |

**The one risk the research is unanimous about:** rings are the hardest jewellery gift because of
sizing. Two responses, both built in: every listing carries **US 4–12 in half sizes** (17 steps),
and the stacking group is the part of the line that survives a wrong guess, because a stacking band
reads as correct on more fingers than a statement ring does.

## The 20 designs, and why none of them collide

by Artifact Studio already runs a Christmas line (`docs/artifact-studio/xmas26`, migrations
0160–0164) whose **ten rings are Holly Berry, Candy Cane Stripe, Gingerbread Man, Bauble,
Snowflake, Christmas Tree, Mistletoe Bypass, Bell, Poinsettia and Stocking.** Those are the obvious
motifs and they are spoken for, so this line takes none of them. It also takes **no star**, because
the Ophir Stellar line already sells a four-point star band and a star signet, and a Christmas star
ring would compete with Ophir's own shelf.

| id | name | group | motif, in one line |
|----|------|-------|--------------------|
| R01 | Ribbon Bow Ring | bow | a flat ribbon tied in a bow across the top of the finger |
| R02 | Velvet Knot Ring | bow | a soft wide knot, the ribbon doubled and pulled through |
| R03 | Ribbon Wave Ring | bow | a flat band folded into one standing wave, like ribbon caught mid-curl |
| R04 | Fir Crest Signet Ring | signet | an oval signet with a single fir sprig carved into the face |
| R05 | Nordic Knot Signet Ring | signet | a squared signet with an interlaced Scandinavian knot |
| R06 | Snowdrift Pinky Signet | signet | a small pinky signet whose face is a drifted, wind-shaped curve |
| R07 | Frost Dome Ring | dome | a high dome worked all over with a fine frosted texture |
| R08 | Snow Globe Dome Ring | dome | a tall smooth polished dome, nothing on it at all |
| R09 | Pinecone Dome Ring | dome | a dome built from overlapping pinecone scales |
| R10 | Winterberry Stack Ring | stack | a thin band carrying a short run of round berry beads |
| R11 | Fairy Light Stack Ring | stack | a thin band with small bezel-set stones spaced like string lights |
| R12 | Garland Twist Ring | stack | two fine wires twisted together the whole way round |
| R13 | Cranberry Bezel Ring | stone | one deep red round stone, rub-over bezel, plain band |
| R14 | Evergreen Bezel Ring | stone | one deep green round stone, rub-over bezel, plain band |
| R15 | Toi et Moi Winter Ring | stone | red and green stones side by side on a bypass shank |
| R16 | Winter Rose Ring | stone | a single sculpted rose head with a stone at its centre |
| R17 | Icicle Point Ring | winter | tapering icicle points rising from the top of the band, in the plane of the ring |
| R18 | Fir Sprig Ring | winter | a fir sprig laid along the band, needles raised |
| R19 | Reindeer Antler Ring | winter | two antler forks meeting in a bypass |
| R20 | Wreath Ring | winter | a full circle of overlapping gold leaves |

Nearest neighbours to the Artifact Studio set, declared rather than hidden: **R18 Fir Sprig** sits
near their Christmas Tree, and **R16 Winter Rose** near their Poinsettia. Both are different
objects (a sprig along a band; a rose head) and they are in a different shop, but if the owner
wants more distance those are the two to swap.

## Structure

Three axes, full grid, exactly as the Ophir Stellar line: `Karat` (10K/14K/18K) x `Metal Color`
(Yellow/White/Rose Gold) x `Ring Size` (US 4–12, half steps) = **153 variants per listing**, 3,060
across the line. 153 is well under Etsy's 400 ceiling for three axes.

## Pricing basis, and what is estimated

Same engine and the same honesty as Stellar: 2 x maker cost, 14K at 100 USD/g with labour,
10K/18K by purity and density. **The maker has not quoted any of these twenty designs.** Every
estimated input is named in `catalog.json` under `pricingBasis.estimated` and repeated as a panel
blocker, so a real quote replaces one number rather than requiring a rebuild:

- stone cost per bezel or accent stone (the maker's band list carries no stone line at all);
- grams from geometry with a safety factor, because the maker counted 3 g where geometry said
  0.8 g on the Christmas bracelet (second-brain 2026-10-07) — geometric estimates run light, and
  erring heavy protects the margin while erring light sells at a loss;
- the dome and signet groups use the owner's averaging rule ((top + shank) / 2), not a measured
  section.

## The six frames

Dropped from twelve by the credit arithmetic above, keeping the ones that do a distinct job:

1. **hero** — the thumbnail; the ring upright on stone, the motif facing camera
2. **worn** — on the hand, which is what answers "will this look like anything on me"
3. **macro** — the motif close enough to read the making
4. **scale** — held between finger and thumb, so the size claim is visible rather than asserted
5. **three metal** — yellow, white and rose together, because Metal Color is a variation axis
6. **gift** — the seasonal frame, the ring staged for Christmas

Cut, and why: flat-lay duplicates hero, profile duplicates macro, inner-surface and hallmark
frames carry no claim this line makes, and the remaining stacking shots only apply to three of
the twenty.
