# The Stellar Line (Ophir Gold USA): design direction

Owner brief: 5 reference images in chat, 2026-10-13, confirm with Hüsam.
Shop: Ophir Gold USA / `ophirgoldusa` (org `b7658ac4-7fb4-4fcb-836f-401efc3d9e5b`).
Scope decision (owner, 2026-10-13): the **five products named on the lookbook sheet**, 10 images each,
one Etsy listing per product.

## The five products

The lookbook sheet ("OPHIR GOLD · THE STELLAR LINE · A modern take on a timeless light.") is the design
of record. The other four reference images are mood and silhouette references, not the spec.

| # | Product | Silhouette | Stones |
|---|---------|-----------|--------|
| 1 | Stellar Curve Earrings | long tapered gold curve, a slimmer pavé curve crossing it, a small pavé knot at the crossing | pavé |
| 2 | Stellar Drop Necklace | a gold curve that loops at the collarbone, a four-point star on the line, a lariat drop ending in a star and a teardrop | star accent |
| 3 | Stellar Band Ring | slim waved band, a four-point star at the top, a pavé line along one side of the shank | star + pavé |
| 4 | Stellar Knot Ring | two bands crossing in an open knot, both pavé set | pavé |
| 5 | Stellar Signet Ring | wide sculptural signet, a bold four-point star on the face | one accent stone |

## Open decisions (blocking the catalog, not the prompts)

| # | Decision | State |
|---|----------|-------|
| 1 | **Reference files** | The five images arrived as chat attachments, which this container never writes to disk. Prompts are written; frame 01 of each product still needs the owner's render as a *tight crop* before it is generated (second-brain 2026-10-13: describe nothing that a crop can carry). Drop them in Drive `oo9 \| Ophir Gold USA`. |
| 2 | **Stone cost** | The maker table (`docs/ophir/uretici-gram-fiyat-tablosu.xlsx`) quotes gold per gram, enamel, chain and assembly — **no diamond line**. Every piece here is pavé or star set. Needs a maker quote per carat/setting; until then any price is an UNCALIBRATED_ASSUMPTION. |
| 3 | **Variation axes** | Proposed: Karat 10K/14K/18K × Metal Color Yellow/White/Rose, plus US Size 4–12 on the three rings. Etsy allows 3 axes and that uses all 3. Earrings and necklace have a free third axis (chain length on the necklace). |
| 4 | **Star point count** | The lookbook draws **four-point** stars; reference image 5 shows **five-point** stars. Prompts follow the lookbook. Confirm. |
| 5 | **Gram per piece** | `scripts/ophir/gram_model.py` covers rings only (US size → circumference). Earrings and the necklace need a parts count from the maker, as the twig station did. |

## Pricing basis

Same maker, same model as the Artifact Studio catalogs: `docs/artifact-studio/maker_cost.py`
(14K = 100 USD/g with labour; gold scales with spot × purity, labour per gram is karat independent;
grams scale with alloy density 10K ×0.892, 18K ×1.137). Price = 2 × maker cost, rounded up to the next $10.
Stones are **not** in that model yet — see decision 2.

## Images

10 prompts per product, 50 in all: `prompts.py` → `image-prompts.md`. Frame 01 is the hero and is generated
from the owner's reference crop; frames 02–10 take only a tight crop of the approved 01, never its background
or framing. nano_banana_2, 2k, 1:1, count 1 each.

Ground: one warm travertine world for the line, a distinct tone per listing so the five thumbnails stay
apart in Etsy search. Canon 50 mm, f/2.8, ISO 400, 35 mm grain — the house camera.
