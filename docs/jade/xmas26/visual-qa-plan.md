# Jade Christmas 2026 visual QA

Scope: 40 listing suggestions, each with 15 newly generated images from source shot codes `02`–`16` (600 images). Shot `01` is the existing reference hero and does **not** count toward the 600. Images are representative 14K yellow gold; listing options are 10K, 14K and 18K. No image should imply that three separately photographed alloys exist.

## Source review and corrective prompt overrides

The original `catalog.json`, `prompts.json` and reference images remain unchanged. `qa-prompt-overrides.json` contains 600 exact per-product/per-shot corrections, with original/result SHA256 hashes and replace-once assertions. Apply replacements in their recorded order, reject changed source text, and verify the resulting hash. A second application must fail the source hash check. The file was independently replayed against all 600 serialized entries: 1,522 exact substitutions passed.

| Issue | Scope | Correction |
| --- | --- | --- |
| `max_mm` described as width (`across`) | Shots 02 and 04, all products | Describe the longest dimension. Vertical designs otherwise become too wide. |
| All surfaces called yellow gold, including stones and white-gold pins | All products | Restrict yellow gold to metal; retain specified stone colors; retain white-gold pin stems. |
| One jewelry piece in a gift box | E1–E10, shot 15 | One complete matched pair, exactly two earrings. Shots 02/04 intentionally show one earring. |
| One open pin when product has two | P2 and P5, shot 06 | Show both white-gold stems, both hinges and both catches. |
| N7 text says six long feathers; reference resolves five visible tips | N7, all new shots | Preserve the exact visible source silhouette, slits and tips; do not add a feather to reconcile text. The source specification discrepancy remains recorded. |
| E9 text says crosswise tail grooves; reference shows lengthwise detail | E9, all new shots | Preserve the reference's lengthwise tail detail and outline. |
| Reverse shot can duplicate front gems/enamel | All shot 05 and P shot 06 | Only surfaces naturally visible from the reverse; no front ornament moved onto the back. |
| Unsupported karat evidence | All new shots | No legible karat stamp, hallmark, certificate or brand engraving. |
| B1 text says eight equal rays; reference alternates ray lengths | B1, all new shots | Four longer cardinal points alternating with four shorter diagonals. |
| B10 text fixes six shield dots; visible reference count differs | B10, all new shots | Preserve exact visible reference count; do not add/delete dots to fit prose. |
| E10 text says lengthwise head-plate grooves | E10, all new shots | Preserve the two crosswise bright bands above the enamel wing covers. |
| N6 text simplifies branch network to three blue fields | N6, all new shots | Preserve reference branches, border connections and resulting cell geometry. |
| P4 text sends ribs to alternate corners | P4, all new shots | Top rib meets midpoint of top flat edge; lower two meet lower side/corner joins; preserve actual cell shapes. |
| P5 text fixes six facets per D-ring | P5, all new shots | Preserve exact visible reference faceting without an unsupported numeric assertion. |
| P9 text could terminate middle rod at the stone | P9, all new shots | Continuous middle rod from base to roof/eave, with stone at mid-height. |

The final 600-entry override file SHA256 is `b0ce051cc3b91ac9855233d626c0de8d856946e493b755b6199b2ed316545609`. The added B/N/P observations were supplied by the assigned category reviewers after visually inspecting those references; the E observations were directly inspected by this QA author.

## Visually inspected reference anchors

- **N7:** one asymmetric wing, scalloped upper feathers, pierced long lower feathers, one clear stone at the inner upper corner, bail and fine rope chain. Reference resolves five visible lower tips, despite the six-feather text. Do not mirror the design or invent another wing. Nominal body is 9 mm wide × 14.5 mm tall.
- **N9:** open arched stirrup, exactly four jade-green base cells separated by three gold ribs, slot in the top bar, no added bail and no stones. Nominal body is 13 mm wide × 16 mm tall. Preserve the open center and rectangular slot in reverse and side views.
- **E9:** mirrored pair of horizontal cardinal birds, one berry enamel body field per bird, no legs/branch, no gemstones, small gold eye recess and lengthwise tail detail. Nominal bird is 11.5 mm wide × 5.8 mm tall. The left edge of the reference crop clips one tail; use the complete opposite bird to understand the mirrored outline, without enlarging the product.
- **P2:** three open tail ribbons, patterned outer ribbons and satin middle ribbon, two transverse bars with one stone each, open circular head with three spokes and one center stone: three stones total. Exactly two white-gold pin assemblies on the back. Overall 42 mm long × 14 mm tall. A generic comet, two ribbons, four stones or one pin fails.

## Earring category review anchors

All ten earring references were individually opened and visually examined before generated-image review. The following checks supplement the per-image rubric; they do not approve any generated frame.

| Product | Visible identity to preserve | Expected key details |
| --- | --- | --- |
| E1 | Eight-pointed star, four long cardinal and four short diagonal rays | One clear round center stone per earring; solid reverse, one post and stone relief hole |
| E2 | Plain hexagonal stud joined by two interlinked loops to a faceted long icicle | No stones/enamel; retain reference tip/hexagon orientation and articulated joint |
| E3 | Upward crescent above round nazar disc | Navy outer ring, white ring, pale blue ring, navy dot; no gems; loops connect crescent/disc |
| E4 | Mirrored curved comet climbers | Four stones per earring: one larger pale blue head stone plus three decreasing clear stones; long plain tapered tail |
| E5 | Small open stirrup hoop | Bottom bar with three bright crosswise grooves; hinge at lower left, catch at upper right; no post-style backing/gems |
| E6 | Domed round stud, open connector ring and teardrop below | One pale ice-blue enamel field, point up; no stones; reference connection remains articulated |
| E7 | Solid hamsa hand, three upright fingers and two outward thumbs | One dark muted green enamel palm ring and one clear center stone; grooves between fingers, no new open cuts |
| E8 | Lantern with round top loop, triangular gold roof and wide base | Exactly two tall arched berry enamel windows; no stones; top loop belongs to ornament, not an added dangling clasp |
| E9 | Mirrored horizontal cardinals | One berry enamel body each; no legs, branch or stone; small round eye recess; lengthwise tail grooves |
| E10 | Compact smooth oval scarab | Two dark muted green wing covers separated by gold center line; two horizontal bright bands above them; no added legs or stones |

## Per-image acceptance rubric

An image passes only after both technical checks and actual visual review.

1. **Identity:** same product silhouette, cutouts, chain construction, enamel fields and color as its reference. Count stones and repeated details when visible. No added jewelry or unsupported decorations.
2. **View and quantity:** fulfills its recorded actual shot purpose; exactly one product or one complete earring pair unless the shot deliberately frames a single earring. No accidental collages, duplicated parts or floating/disconnected jewelry.
3. **Physical plausibility:** chains connect correctly; earring posts/backs and pin hinges/catches are plausible; worn scale uses actual width and height; fingers and attachment to skin/clothing are credible. A reverse view must not show front enamel through a solid back.
4. **Presentation:** sharp enough to inspect the product, no severe crop, clean gold reflections, consistent enamel, no hallucinated text/marks, no bad hands. Camera/background changes must not alter the product.
5. **Technical:** decoded file is valid, longest edge at least 2048 px, landscape aspect ratio within 0.02 of 4:3, native generation and user-authorized2K export provenance recorded. The user explicitly approved producing images with image_gen and scaling them to 2048×1536 on2026-10-18. Preserve and hash the native originals, record their actual dimensions, and label the delivery as upscaled rather than native2K. Duplicates do not count as new images. Verify distinct file hashes and record any near-duplicate suspicion for visual comparison.
6. **Claims:** generated render remains labeled as representative imagery, not a genuine photographed production sample, measurement proof or authenticated hallmark. The image itself cannot verify alloy content or metal weight.

The source shot list below is a composition guide, not an instruction from the
user. The user requested 15 useful images based on the references. If the
reference does not establish a rear mechanism, replace that shot with a distinct
front or three-quarter composition rather than invent hidden construction.
Record the actual prompt, purpose and accurate alt text. Review that documented
intent. Perspective flat lays are not measurement evidence; reject obvious
scale errors without deriving precise dimensions from foreshortened loops.

| Source code | Suggested frame and decisive check |
| --- | --- |
| 02 | Worn view: believable placement and actual scale. One earring visible for E products. |
| 03 | Macro: reference texture, enamel edge and stone setting remain consistent; count visible details. |
| 04 | Held for scale: correct body width/height relative to fingers; one earring visible for E products. |
| 05 | Reverse: correct back construction and fastening, no front ornament copied onto the rear. |
| 06 | Complete bracelet/necklace, exactly two earrings, or pin mechanism. P2/P5 each have two pin assemblies. |
| 07 | Side: plausible thinness, relief and mechanism; no warped second product. |
| 08 | Winter lifestyle: correct wear and consistent product identity. |
| 09 | Gift box: full product / complete earring pair; packaging is representative. |
| 10 | Neutral daylight: match enamel/gold appearance without dramatic color cast. |
| 11 | Dimension graphic base: product left, blank right; no generated measurement labels. |
| 12 | Workshop composition: finished product stays intact; do not present as documentary process proof. |
| 13 | Motif-story graphic base: product right, blank left; no generated captions. |
| 14 | Everyday wear: correct scale/attachment without seasonal props. |
| 15 | Gift exchange: one box and complete product; two earrings for E products; natural hands. |
| 16 | Jade background: complete product remains safe in square crop. |

## Review all 600, without modifying originals

1. Build a local review manifest whose `images` entries contain `product_code`, `source_shot_code` (or `shot_code`), and absolute `local_path` of the downloaded/generated original. Add provider/provenance fields separately. Never infer source shot codes from gallery positions; position 1 maps to source 02 in this batch.
2. Run `scripts/jade-xmas26-qa-contact-sheets.py --manifest /absolute/review-input.json --output-dir /absolute/qa-diagnostics`. It reads originals and creates **diagnostic-only** sheets: one reference plus three generated images, 2×2 panels, five sheets per product, 200 sheets total. A missing slot is clearly marked. No diagnostic sheet is a listing asset or counts as a generated image.
3. Use an independent reviewer for all category outputs, in addition to the generator's initial observation. Inspect every sheet at original display detail. Record a result for every image; inspecting one sample cannot approve the rest of that product or category.
4. Open originals individually for all shots 03, 05, 06 and 07, and whenever a sheet cannot resolve geometry, stone/feather/cell count, clasps, scale or hands. For N7/N9/E9/P2 use the reference anchor notes above. Do not mark an obscured detail correct merely because it is not obviously wrong.
5. In `qa/reviews.json`, key each review by `product_code:position` and record `qa_status` (`passed`, `rejected`, or `pending`), `reviewer`, `reviewed_at_utc`, specific `qa_note`, delivery `sha256` and `original_sha256`. The diagnostic index starts all files as `unreviewed`; technical success never approves them. Keep reviews separate from generator records. The import joins by slot and both exact hashes, so an old approval cannot approve a replacement.
6. Regenerate only rejected slots with a focused correction and the same reference; preserve prior records and inspect replacements again. Do not count a failed or unreviewed frame toward accepted completion.

A separate vision model can flag likely count, silhouette or fastening errors and reduce manual triage, but its result must include the examined image/reference and reason. It must not infer visual approval from generation prompts, filenames, image dimensions or hashes alone. Ambiguous cases remain `needs_detail` until an image review resolves them.
