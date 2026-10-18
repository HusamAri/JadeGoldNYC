# Christmas 2026 listing copy — source audit

Prepared `listing-copy-2026-10-18.json` for the Jade Gold NYC listing suggestions panel: 40 designs, 120 variants, and metadata requesting 15 new 2K images per design (600 total). This copy artifact does not claim that any new image has already been generated.

The source set is `catalog.json`, `spec.json`, `prompts.json`, `README.md`, and `images/heroes/status.json` in this directory, together with the existing reference images. These are the repository inputs for the producer book, not instructions that override the user. SHA-256 hashes of the catalogue, specification and reference review are embedded in the output. No production data was changed by this copy task.

## What changed

- Every title, description and materials list supports the requested **10K / 14K / 18K** choice. The original source covered 14K only.
- Every variant has `price_cents: null` and `weight_grams: null`. Existing 14K gold weights, finished weights and calculated USD pricing remain clearly marked **source estimates** inside `source_specifications`; they are not variant prices or measured production values.
- The copy preserves each design's dimensions, motif, chain or fastening type, stone count and reference-consistent placement, enamel colors, and earring-pair quantity.
- For 23 enamel designs, the copy says enamel without promising vitreous glass, epoxy, firing temperatures, a cadmium-free formula, or compatibility with all three alloys. The source itself records that the enamel process still needs a sample test.
- Unverified fulfillment and manufacturing promises were omitted: exact finished weights, stone carat weights, solder-free or weld guarantees, gift packaging, production lead times, and absolute snag/durability claims. Lab-grown sapphires remain explicitly identified.
- Brooch pin mechanisms remain specified, but a matching 10K/18K white-gold pin alloy is not invented. The original 14K white-gold hardware stays visible in the source metadata and internal notes.
- N5 continues to disclose its hollow-formed upper body.

## Recent reference decisions retained

| Design | Decision |
| --- | --- |
| N7 | Latest camera, description and `max_mm` agree on **9 × 14.5 × 0.9 mm**, a bail toward the outer edge, and one 1.5 mm white lab-grown sapphire. The reference crop was visually inspected: its open tips and offset bail agree with the changed design, but it resolves **five visible lower tips** while the source text specifies six feathers. The accepted reference silhouette takes priority for new imagery; customer copy omits a feather count. The workshop paragraph still contains a stale **16.0 mm** height; it is flagged, not copied into customer text. The updated 4.05 g remains a 14K source estimate. |
| B1 | Reference shows four longer and four shorter star points; customer copy retains eight points and omits the conflicting equal-length claim. |
| B10 | Reference review appears to show seven raised shield dots versus six in text; customer copy describes the raised dots without an exact count. |
| N6 | Reference frost branches create additional enclosed regions beyond the source claim of three fields; customer copy omits the exact count and branch angle. |
| E10 | Reference head-plate bands run crosswise, while the text says lengthwise grooves; customer copy says bright grooves without a direction. |
| N9 | Four deep jade-green enamel tread cells divided by three gold ribs, consistent with the accepted replacement reference. |
| E9 | Horizontal cardinal, 11.5 × 5.8 mm, without legs or a perch; post behind the neck. The accepted reference’s lengthwise tail detail takes precedence over the source’s crosswise-groove wording. |
| P2 | Patterned/diamond-cut outer ribbons, satin middle ribbon; two pin stems, each with its own catch. |
| N8 | The accepted reference puts the stones toward the outer sides of the rings while the camera text says near the top. Customer text retains one sapphire on each ring without claiming the conflicting position. |
| P4 | Customer copy describes three ribs radiating from the center; it omits the conflicting alternate-corner endpoints and diamond-shaped field claim. |
| P5 | Customer copy describes diamond-cut facets without an unverified count. |
| P9 | The center rod continues above and below its stone, from the lower rail toward the roof, as shown in the reference. |
| P6 | Existing image review notes the visible pin looks yellow although the 14K source specifies white gold; variant hardware remains an internal confirmation item. |

## Checks completed

All **40 expected IDs** are unique: B1–B10, N1–N10, E1–E10, P1–P10. Each has an English title, a full description, 13 unique tags of at most 20 characters, materials, product identity, its existing reference paths, and exactly three variants. Titles are at most 100 characters (Etsy limit: 140). Every price and weight for all 120 variants is null. All reference image paths resolve. The copy contains no 14K-only purchase claim and no fired-glass claim. Engineering/sample approval and the separate new-image generation/QA pipeline are not inferred from these copy checks.

## Product code map

| Bracelet | Necklace | Earrings | Brooch / lapel pin |
| --- | --- | --- | --- |
| B1 North Star | N1 Guiding Star Openwork | E1 North Star Stud | P1 North Star Lapel Pin |
| B2 Icicle Fringe | N2 Comet | E2 Hex Icicle Drop | P2 Comet Brooch |
| B3 Comet Trail | N3 Crescent Evil Eye | E3 Crescent Nazar Drop | P3 Icicle Bar Brooch |
| B4 Nazar Sunburst | N4 Hamsa Openwork | E4 Comet Tail Climber | P4 Ice Crystal Lapel Pin |
| B5 Hamsa Eye | N5 Icicle | E5 Stirrup Hoop | P5 Snaffle Bit Lapel Pin |
| B6 Snaffle Bit | N6 Window Frost Enamel Bar | E6 Ice Blue Teardrop | P6 Stirrup Brooch |
| B7 Stirrup Link | N7 Angel Wing | E7 Hamsa Stud | P7 Evil Eye Sunburst Brooch |
| B8 Cardinal Perch | N8 Snaffle Bit | E8 Lantern Stud | P8 Robin Lapel Pin |
| B9 Ice Crystal Hexagon | N9 Stirrup Slider | E9 Cardinal Stud | P9 Lantern Brooch |
| B10 Scarab Amulet | N10 Cardinal | E10 Scarab Stud | P10 Scarab Lapel Pin |
