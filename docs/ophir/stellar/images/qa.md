# Stellar heroes: QA against the spec (2026-10-15)

Owner asked for the Etsy draft push. The five heroes were downloaded and **looked at** — the
first time in this workstream that was possible; the earlier container blocked the CDN, so the
previous turns could only report job ids. Two contradictions between image and listing text came
out of that look, and **the push was stopped** rather than writing wrong claims onto live drafts.

Job ids and params: `jobs.json`. All five are 2048x2048.

## Per frame

| id | verdict | notes |
|----|---------|-------|
| E01 Curve Earrings | **pass, one cosmetic drift** | Pair, long tapered gold curve to a fine point, slimmer pavé curve crossing it, post and butterfly back, no stones on the thick curve — all per spec. The crossing reads as a round pavé **halo** rather than a knot/bow. Cosmetic; the listing says "knot". |
| N01 Drop Necklace | **reshoot** | Looped centre bar, star where the loop closes, drop to a second star and a polished teardrop, cable chain and spring ring — all per spec. Wrong on two counts: the stars are **north stars**, and **both carry a set diamond** on a piece that is designed, described and priced with zero stones. |
| R01 Band Ring | **reshoot (star only)** | Waved slim band, star at the crest with a diamond, pavé row down one shank, stacks flush. Clean apart from the star shape. |
| R02 Knot Ring | **pass, exact** | Two slim bands in an open over-under reef knot, see-through, both pavé along their length, joining into one shank. No star, correct. Visible stone count ~70–80 against the model's 78 — an independent check on the cost estimate. |
| R03 Signet Ring | **reshoot (star only)** | Bold sculptural face that curves and folds out of a narrowing shank, one set star, solid and polished. Reads as the "poured form" the copy promises. Clean apart from the star shape. |

## Neither defect was an open decision. Both were defects in our own prompt.

The first read of this filed two "blockers" and put a question to the owner: four point or the
eight point north star the renders produced, and should N01's stones be priced in. **Both were
wrong questions.** Reading the generated prompt text — not the generator — settled them:

**Star shape is settled.** The owner approved these 50 prompts on 2026-10-15 and every one of them
says four point. The renders disobeyed an approved spec; they are not a third option to choose
between. Two causes, both ours:

- the clause ended `a four-point star with long slender points, **the classic sparkle shape**` —
  which hands the model its own many-rayed default right after the count;
- the guard read `every star is four-pointed, **never five-pointed**`, and the generator asserted
  that ban string was present. It excluded only the one wrong value we happened to think of, so
  six and eight sailed through. **Naming one wrong answer never pins the right one.**

**N01's stones are a render defect, not a pricing gap.** The prompt told the model both things at
once: the shape clause ends `no pendant, no other charms, no stones`, and the shared style block
said `every stone is a white diamond`. All ten N01 frames carried the contradiction; the model
believed the second. The design has no stones (`stonesRef: 0`, no Stones line in the description,
no diamond in the copy), so the price is right and the image is wrong. **No repricing. The earlier
$1,180 / $1,220 / $1,260 table in this file was answering a question that does not exist.**

This is the third time in this repo that a shared block was untrue of a frame it landed on (moth's
`same metal` on the three-metal frame; twig's `exact copy of the reference` on a hero with no
reference). The shared stone sentence is now derived per product in `metal(p)`.

## Fixes landed in the generator (no catalog, price, title or seal change)

- `STAR_GEO` carries the count as **geometry** instead of jargon: four slender points on a cross,
  one up, one down, one left, one right, nothing in the gaps. The wrong **class** is named once,
  in the shared rule — not one wrong number.
- `metal(p)` derives the stone sentence from the product, so a no-stone piece is told, positively,
  that every star and surface is solid plain gold with no empty setting.
- `STAR_GEO` is a plain noun phrase by assertion (no semicolon, no finite verb): the first draft of
  this fix put the ban inside it and stranded the host sentence's verb
  (`...at its centre **is set**`) in three prompts. Caught by reading the output, not the asserts.
- Guards now pin the right answer and the shared block: `STAR_RULE` present in all 50, the ban
  present exactly once, `classic sparkle shape` and the `four-pointed` jargon spelling absent, the
  star clause present in exactly the products that have a star, and the stone sentence true of the
  product it lands on.

Measured over all 50 after the fix: 5/5 product groups clean, and N01 frames carrying both stone
claims went from **10/10 to 0/10**.

## What is left before the push

1. **Three reshoots** — N01, R01, R03 heroes. `nano_banana_2`, 2k, 1:1, **count 1 each**, params and
   sequencing in `jobs.json`. The prompt text changed, so this sits behind the CLAUDE.md gate: the
   prompt is shown and approved before any credit is spent.

   **R01 goes first, alone, as the star canary.** One generation proves the four point geometry reads
   correctly; only then do N01 and R03 run, with a tight crop of R01's approved star attached as the
   shape reference. This follows the lesson the parallel Tideline set paid for on the same day: a frame
   that misses twice is fixed by the set's already-correct sibling, not by a third round of harder
   wording — and none of our five frames has a correct star yet, so the canary is what creates that
   sibling. It also caps the exposure at one generation instead of three if the geometry still misses.

   That lesson's other half does **not** transfer: its rule that each metal colour needs its own scene
   palette is for a separate listing per colour. Stellar carries Metal Color as a variation axis inside
   one listing per product, with a single three-metal frame (06), so the palettes stay shared.
2. **Frames 02–10** for all five products (45 generations), each from a tight crop of its approved
   hero. Not started; held until the heroes pass, so a prompt defect cannot be paid for 45 times.
3. **Gallery attach**, then `ops/drafts-push`. The route refuses a listing with zero uploaded
   images on its own (`uploadCount === 0 -> not-ready`) — a guard this repo added deliberately
   after photo-less drafts, and not one to work around.

E01's halo-vs-knot drift is not blocking: either reword "knot" to "halo" or reshoot that frame; the
silhouette is right and it misstates nothing a buyer would be harmed by.

Variant seals must come back identical after all of this. Only the gallery moves.
