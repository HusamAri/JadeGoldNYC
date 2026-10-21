# State notes

(Claude Code appends a 5-line note after each batch: Done / Decisions / Open / Next action / Context)

## Batch 1, 2026-10-21 (10 listings, top SALAD by 3-month visits)
- Done: 4554025310, 4544213291, 4548151075, 4539517211, 4539727911, 4539506699, 4550516268, 4569902788, 4550506421, 4560186803. Title + 13 tags written via ops/seo-apply; 10/10 applied, same-call read-back clean, independent re-read with a fresh token 10/10 `already`, 10 `etsy.seo_push` audit rows, panel mirror 10/10.
- Decisions: owner approved all 10, including 4548151075 whose new title reads "Diamond Cut ... Faceted Satin" and drops "Basketweave" (flagged before the write).
- Open: the generator files basketweave under the diamond-cut group; give it its own style before the remaining checkered listings go. Attributes and video stay manual (RUNBOOK section 4).
- Next action: dry run of matrix rows 11-20, show the plan, write on owner's go.
- Context: no section moves in this batch; none of the 10 had been edited after 2026-10-21.

## Batch 2, 2026-10-21 (matrix rows 11-20)
- Done: 4556695533, 4539776904, 4565325477, 4556696295, 4560185581, 4556695311, 4588431383, 4583553978, 4542484518, 4560210242. 10/10 applied, same-call read-back clean, fresh-token re-read 10/10 `already`, panel mirror 10/10; 4565325477 moved Beveled Wedding Bands -> Textured Gold Bands (panel section 59712574). Matrix audit rows now 20.
- Decisions: owner approved all 10, knowing the new titles drop design words (Rope Edge, Star Cut, Beveled, Satin Center) without adding a wrong one.
- Open: basketweave still filed under diamond cut; Rope Edge / Star Cut could get their own title words before the remaining listings of those families.
- Next action: dry run of rows 21-30 on the owner's go.
- Context: no listing in rows 1-20 had been edited after 2026-10-21.

## Batches 3-19, 2026-10-21 (matrix rows 21-185)
- Done: all remaining 165 listings, 10 per call, each call followed by a fresh-token re-read; 165/165 applied and `already` on re-read, 0 `live-changed`, 0 errors. Totals for the matrix: 185 `etsy.seo_push` audit rows on 185 products, 0 failed read-backs, 59 section moves (= the 59 `section_fix` rows).
- Decisions: owner waived per-batch approval ("araştırmada onayladım, yaptıkça gönder").
- Open: attributes and video are manual, listed in `reports/manual-checklist.md`; basketweave/rope edge/star cut words were not restored.
- Next action: re-pull Shop Manager > Stats at +30 and +60 days (RUNBOOK section 5); baseline Etsy Search 215 visits, target 450.
- Context: undo record per listing is the audit row's `diff.before` (title, tags, shop_section_id).
