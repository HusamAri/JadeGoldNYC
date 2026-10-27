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

Fix in `prompts.py`: necklace hero sized as a 50 cm chain spread across the frame, bracelet hero and flat lay one unclasped open arc (2026-10-27: "coiled" in the scene line gave two rings),
worn necklace clasp hidden at the back, macro = one straight section with no clasp or second strand.

## 2026-10-27, S01 to S04 picks (owner: "ilk 4 modeli higgsfielddan al")
Saved to `public/artifact/silver/Sxx/0N.jpg` (2048 px, JPG under 950 KB, re-encoded so no generator metadata);
job ids in `picks.json`.
- S01: hero b5bb99a5 (v2, neck length reads), worn a92926fc (clasp hidden), macro 91494756, clasp 8b33e7f3, flat lay 1ecbb85b.
- S02: hero e9244376 (open arc), worn 17d1b457, macro 42a77d5e, clasp 9d7307a8, flat lay 60d06ec7.
- S03: worn cbd64695, macro 322e7d84, clasp 9c238ed2, flat lay 372149d3. **Hero REDO:** b4426990 reads as a
  bracelet-size loop and the tag plate is drawn oversized.
- S04: hero 627178de, worn e2e4b313, macro 5e6afeca, clasp 179cc08b, flat lay daa130db (fa54f965 skipped: letters on the carabiner).
- S03 hero redo: 46f89368 kept (one open S-curve, clasp one end, jump ring the other); 502087a3 skipped
  (plate and lobster on the same end, chain crosses itself). S01 to S04 now 20/20.

## 2026-10-27, S05/S06 Figaro picks (links counted on 700 px crops: three short, one long)
- S05: hero 7fa035ea, worn b2d35c18, macro 88f38d11 (fb35c504 runs two short), clasp 9421eec9,
  flat lay 953bacfe (044ae87c shows a detached second piece; 12218ef4 reads bracelet-length).
- S06: hero d4dc6348, worn 0f150355, macro 998b01b4, clasp d9a42c53, flat lay 79282375.
All six listings: 30/30 frames in `public/artifact/silver/`. Each listing still needs one real unedited photo (Etsy, 2026-10-22).
