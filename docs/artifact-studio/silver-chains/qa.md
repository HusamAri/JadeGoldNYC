# Image QA (contact sheet, own eye)

## 2026-10-27, S01 + first S02 frames (Higgsfield history, owner-generated)
| Frame | Pick | Verdict |
|---|---|---|
| S01-01 hero (e7285942) | - | REDO: necklace reads as a bracelet-size loop; also 5:4, set is 1:1 |
| S01-02 worn | 045ea3f7 | ok; both takes show the clasp at the front (prompt now hides it at the back) |
| S01-03 macro | 3440d12f | ok (172d1dc9 shows clasp + 925 plate, overlaps 04) |
| S01-04 clasp | c2a879c2 | ok, 925 plate legible |
| S01-05 flat lay | 51305d24 | ok, neck length reads |
| S02-01 hero | a042ebcf | ok (1:1); 753f5175 is 4:3, skip |
| S02-02 worn | 17d1b457 | ok |
| S02-03 macro | - | REDO: ae36b937 shows two plates (two bracelets), 670a1d4f coils three times (reads as a long chain) |

Fix in `prompts.py`: necklace hero sized as a 50 cm chain spread across the frame, bracelet hero one open wrist-size loop,
worn necklace clasp hidden at the back, macro = one straight section with no clasp or second strand.
