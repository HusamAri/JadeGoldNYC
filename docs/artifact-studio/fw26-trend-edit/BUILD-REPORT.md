# FW26 Trend Edit: build report (2026-10-18)

Ten byArtifactStudio listings built from `BRIEF.md`, each approved by the owner, staged in the panel and
opened on Etsy as **drafts** (nothing published, no existing listing touched).

| Listing | Etsy draft | Category id | Variants | Images | Personalization |
|---|---|---|---|---|---|
| L01 Seal Pin | 4597942764 | 11316 Hat Pins & Stick Pins | 9 | 5 | yes |
| L02 Ishtar Rosette | 4597921253 | 1201 Brooches | 36 | 5 | no |
| L03 Fibula | 4597921327 | 6066 Shawl Pins | 9 | 5 | no |
| L04 Ur Band | 4597921387 | 1232 Rings > Bands | 78 | 5 | no |
| L05 Nar | 4597921435 | 1229 Pendant Necklaces | 27 | 5 | no |
| L06 Wedge | 4597921475 | 1229 Pendant Necklaces | 36 | 5 | yes |
| L07 Thaw Hoops | 4597921031 | 1212 Hoop Earrings | 6 | 5 | no |
| L08 Split Infinity | 4597943140 | 1229 Pendant Necklaces | 18 | 5 | yes |
| L09 Paw Seal | 4597921557 | 1229 Pendant Necklaces | 36 | 5 | yes (required) |
| L10 Twin Eye | 4597943232 | 1196 Chain bracelet | 27 | 5 | yes |

## Chain of evidence
- Panel (migration 0171 via `parts/`): 10 products, 282 variants, 50 images; set seal
  `fc12f228e903216ae566cbfcc204c0e2`, every per-listing variant, description and tag seal exact; audit_log 10 / 282 / 50.
- Etsy: dry run 10/10 ready; L07 canary created and independently verified (all 11 checks); remaining 9 created in
  one call, 0 warnings; independent read-back 10/10 on variants, SKUs, prices, images, category, personalization.
  L01 first reported a title mismatch: Etsy returns titles HTML-encoded (`Men&#39;s`); the verifier now decodes
  (`app/api/ops/drafts-push`), the stored title was correct.

## Images
50 design visualizations (Higgsfield nano_banana_2, 2k, count 1), ledger `images/jobs.json`, prompts
`images/heroes.py` + `images/gallery.py`, contact sheet `images/contact-sheet.jpg`. The brief allowed real photos only;
the owner chose these as listing images on 2026-10-18 and every description discloses them. 7 gallery frames were
reshot after QA (invented end-cap pattern, stone-textured enamel, hidden cells, wrong TI sign, two-piece seam).

## Open
- **Prices are estimates** (brief section 4 formula, geometry grams). Efe's cast weights override them.
- **Photograph the cast samples** per `photography/photo-plan.md` and replace the visualizations.
- **Price-sync risk:** panel price = Etsy list price for these rows. Older Bauble-style rows store list / 1.265;
  never run `ops/price-sync` across both groups with one assumption.
- Etsy sections (Brooches & Pins, For Him) and shipping profile are set in the Etsy editor before publishing.
