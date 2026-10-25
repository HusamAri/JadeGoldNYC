# STATE

## 2026-10-21 (Cowork kickoff, no live edits made)
Done: extracted 210 listings + 16 drafts, 30d/90d stats, 12 search terms, 20 Alura seeds (4,153 keywords), 4 eRank batches; built master, keyword bank, matrix (210 rows, 0 violations, 0 shared tag sets); wrote CLAUDE.md and the bilingual report.
Decisions: primary keyword per collection (evil eye first, motif first for anklets and Christmas, Mens first for men's pieces, Solid Gold product first for women); title, tags and section only through apply_matrix.py; attributes and video stay manual.
Open: Etsy API key and OAuth token not yet set; owner approval of batch 1 (plan --batch 20) pending; Marmalead skipped.
Next action: python3 scripts/apply_matrix.py plan --batch 20, get approval, apply --batch 20 --yes, verify, status.
Context: baseline 518 visits / 12 Etsy Search visits / 1 order; targets in CLAUDE.md.

## 2026-10-21 / 22 (Claude Code, all 210 applied through the panel)
Done: matrix checked against panel data (2 men's signets 4590704340, 4590691861 had "Engravable" with no personalization; fixed in generate_matrix.py, regeneration changed only those 2 rows); ops/seo-apply opened to this org (data/apply-matrix.json via scripts/to_apply_json.py, "No Section" source handled); dry run 210/210 writable, 0 owner edits; 21 batches of 10 applied, 210/210 read back in the same call; independent re-read with fresh tokens 210/210 "already"; audit_log 210 etsy.seo_push rows, 210 products; panel mirror seal md5(id|title|tags, ordered by id) = f3c38724ff5441cae034bc7b5a73c5f9 = matrix seal; 25 section moves done; unused tokens burned.
Decisions: applied through app/api/ops/seo-apply instead of scripts/apply_matrix.py (Etsy tokens are bound to the panel app); 10 per call, not 20; diamond tags kept on 4581312197 (25 natural diamonds per panel); the 19 panel/matrix title mismatches were a stale panel mirror, live Etsy matched the matrix.
Open: owner manual tasks in reports/manual-checklist.md (attributes on 36 + 52 listings, category of 4585880226, 110 videos, description openings, Etsy Ads budget shift); 16 drafts not in the matrix.
Next action: 21 Nov 2026 read Stats > Last 30 days, drop the three files into data/, run build_master.py and compare with data/baseline-2026-10-21/ (target Etsy Search >= 80 visits).
Context: re-running is safe; ops/seo-apply returns "already" for every applied row and skips any listing whose live title or tags no longer match.

## 2026-10-25 (Claude Code, Etsy Ads narrowed; owner set it in Shop Manager)
Done: ads concentrated on 5 listings, everything else switched off, daily budget unchanged. Picked from listing-stats-30d by orders, then favorites, then views: 4590704706 (4mm hammered band, the only sale), 4582909101 (reeded cuff), 4590688355 (slim open cuff men), 4579034421 (evil eye bracelet), 4590700626 (3mm curb chain).
Decisions: no tag changes before 21 Nov (the 10-25 search-click report mostly predates this pass; docs/artifact-studio/seo/tag_audit_2026_10_25.py is on hold). Ads API does not exist in Etsy Open API v3, so ad changes stay manual.
Open: 8 Nov ad review: switch off any of the 5 with 40+ ad clicks and 0 favorites; keep the rest. Baseline before: 114 ad visits, 0 orders (30d to 21 Oct). Note for 21 Nov: ad concentration started 25 Oct, so Etsy Search change after that date is not tags alone.
Next action: 8 Nov, Shop Manager > Marketing > Etsy Ads > per-listing clicks for the 5 IDs.
