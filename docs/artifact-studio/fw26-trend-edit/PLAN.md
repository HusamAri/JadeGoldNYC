# FW26 Trend Edit: plan

Source: `BRIEF.md` section 6. Status of each listing lives in `state.json`.

Run everything from this folder: `python3 build_listings.py L0x` writes the JSON and MD
(prices recomputed with the section 4 model and asserted against the brief's ladder),
`python3 validate_listings.py` checks every file.

## Task 0: project and folder
- [x] Project located: the JadeGoldNYC repo already holds every Artifact Studio capsule under `docs/artifact-studio/`; this capsule lives at `docs/artifact-studio/fw26-trend-edit/` instead of `<project>/listings/fw26-trend-edit/`, to keep the repo convention.
- [x] Subfolders `listings/`, `exports/`, `production/`, `photography/`.
- [x] `BRIEF.md` saved verbatim (byte-identical to the uploaded file), `PLAN.md`, `state.json`.

## Task 1: validator
- [x] `validate_listings.py` written byte-identical to the brief's block.
- [x] Run with no files: no output, exit 0.

## Task 2: one listing at a time
- [x] L01 Seal Pin: validated (first cycle), approved 2026-10-17. Category corrected to the live taxonomy.
- [x] L02 Ishtar Rosette: validated (first cycle), approved 2026-10-17. 36 variants with a full chain price grid.
- [x] L03 Fibula: validated (first cycle), approved 2026-10-17. Category Shawl Pins 6066.
- [x] L04 Ur Band: validated (first cycle), approved 2026-10-17 with US 4 to 10. Bands 1232 verified live.
- [x] L05 Nar (Pomegranate): validated (first cycle), approved 2026-10-17. 27 variants.
- [x] L06 Wedge: validated (first cycle), approved 2026-10-17. 36 variants.
- [x] L07 Thaw Hoops: validated (first cycle), approved 2026-10-17 ("yes to all"). Metal Color as body/tip pairs, two values as the brief.
- [x] L08 Split Infinity: validated (first cycle), approved 2026-10-17. Set of 2 and set of 3 priced as the brief.
- [x] L09 Paw Seal: validated (first cycle), approved 2026-10-17. 36 variants.
- [x] L10 Twin Eye: validated (first cycle), approved 2026-10-17. 27 variants.

Margin check (maker_cost.py at the sale price after 12% fees): every option positive, lowest 30% (L05 18K) before garnet cost.

Checks to run before each listing, from the live taxonomy read on 2026-10-17:
- Brooches are `Accessories > Pins & Clips > Brooches` (1201), not under Jewelry (L02, L03).
- Shawl Pins exist as their own node, `Accessories > Pins & Clips > Shawl Pins` (6066): candidate for L03 Fibula.
- Repo rule (CLAUDE.md, 2026-09-26): by Artifact Studio grids are Karat x Metal Color x size, full grid, rings US 3 to 16 full and half. L04 (yellow only, US 4 to 10, Palette axis), L06 and L09 (yellow only) and L07 (Body Color yellow or rose) depart from it; confirm with Husam at that listing.

## Task 3: exports and briefs (after all ten are approved or blocked)
- [x] `exports/fw26-listings.xlsx` (Overview, L01 to L10, Tags, Pricing) and `exports/fw26-listings.csv`, from `make_exports.py`. Numbers: open the xlsx on the Mac and Save As .numbers.
- [x] `production/manufacturing-brief-efe.md` (weights table, tools, five alloy and timing questions, ten notes)
- [x] `photography/photo-plan.md` (spec, 100 stills and 10 videos in four setups, checklist)

## Task 4: Etsy drafts (gated, drafts only)
- [ ] Add a listing protocol that resolves to Jewelry > Rings > Bands (1232) for L04 before the push.
- [ ] Mode: `api` through the panel's `ops/drafts-push` route (one-time tokens, dry run, canary, independent read-back), the route used for every earlier Artifact Studio capsule. Needs the listings in the panel first (migration), so this comes after approval.
- [ ] `BUILD-REPORT.md`

## Task 5: capture (gated)
- [ ] Vault note, Apple Reminders: Mac-only, offered at the end.
