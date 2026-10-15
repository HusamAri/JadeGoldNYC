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
| N01 Drop Necklace | **BLOCKED** | Looped centre bar, star where the loop closes, drop to a second star and a polished teardrop, cable chain and spring ring — all per spec. But **both stars carry a set diamond**, and this listing is priced and described with **zero stones**. |
| R01 Band Ring | **pass apart from the star** | Waved slim band, star at the crest with a diamond, pavé row down one shank, stacks flush. Clean. |
| R02 Knot Ring | **pass, exact** | Two slim bands in an open over-under reef knot, see-through, both pavé along their length, joining into one shank. No star, correct. Visible stone count ~70–80 against the model's 78 — an independent check on the cost estimate. |
| R03 Signet Ring | **pass apart from the star** | Bold sculptural face that curves and folds out of a narrowing shank, one set star, solid and polished. Reads as the "poured form" the copy promises. |

## Blocker 1 — star point count (N01, R01, R03)

Every rendered star is a **six or eight point north star**. The listing text says "four point
star" — it is in N01's *title* ("Four Point Star"), in three descriptions, and in the catalog copy.

This is open decision 4 from the design direction, never answered: the lookbook draws **four**
points, reference image 5 shows **five**. The renders came back with neither.

The prompt's own guard is why this slipped: it asserted `every star is four-pointed, never
five-pointed` and the generator asserted the ban string was present. The ban only excluded
**five**, so six and eight sailed through. An assertion that names one wrong answer does not
pin the right one.

## Blocker 2 — the necklace's stones are not in its price

N01 is costed with `stones: 0` and its description promises no stones, but the image sets a
diamond in each of the two stars. Price input and product spec must be reconciled in the same
turn before any push (second-brain, EON 1.5 mm case).

If the stones stay, at the shop's 2 x maker cost:

| per set stone | maker cost | list (14K, 18 in) |
|---|---|---|
| current, 0 stones | $577.35 | $1,160 |
| $5 | $587.35 | $1,180 |
| $15 | $607.35 | $1,220 |
| $25 | $627.35 | $1,260 |

Small in absolute terms — but it is a claim on a live listing, not a rounding question.

## Not blocking

E01's halo-vs-knot drift. Either reword "knot" to "halo" or reshoot that frame; it misstates
nothing a buyer would be harmed by, and the silhouette is right.

## What unblocks the push

One answer: **four point (as the lookbook) or the eight point north star the renders produced?**

- Four point → reshoot the three heroes with the point count pinned positively, not by banning
  one wrong value.
- Eight point → the text follows the image (titles, descriptions, tags) in the same turn, as the
  moth and twig sets did, and N01 gets its two stones priced in.

Either way the variant seals must come back identical afterwards: only the gallery and, for N01,
the price may move.
